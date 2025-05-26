// --- START OF FILE script.js (MODIFIED PER NOMI CAMPI FIRESTORE) ---

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Listini Caldaie)");

    // Firebase Configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
      authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
      projectId: "consorzio-artigiani-idraulici",
      storageBucket: "consorzio-artigiani-idraulici.appspot.com",
      messagingSenderId: "136848104008",
      appId: "1:136848104008:web:2724f60607dbe91d09d67d",
      measurementId: "G-NNPV2607G7"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- Constants for Caldaie Page ---
    const imageBaseUrl = 'img/'; 
    const brandLogoBaseUrl = 'img/logos/'; 
    const placeholderImage = imageBaseUrl + 'placeholder.png'; // ASSICURATI CHE QUESTO FILE ESISTA!

    // --- DOM Element References for Caldaie Page ---
    const boilerListContainer = document.getElementById('boiler-list-container');
    const brandFilterButtonsContainer = document.getElementById('brand-filter-buttons');
    const economicoFilterBtn = document.getElementById('economico-filter-btn');
    const searchInput = document.getElementById('search-input');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results-message');
    const dataUpdateDateEl = document.getElementById('data-update-date');
    const currentYearEl = document.getElementById('current-year');

    const boilerDetailsPopupOverlay = document.getElementById('boiler-details-popup-overlay');
    const boilerDetailsPopupContentArea = document.getElementById('popup-boiler-content-area');
    const closeBoilerDetailsPopupBtn = document.getElementById('close-boiler-details-popup');
    const popupBoilerTitle = document.getElementById('popup-boiler-title');

    let adminTriggerBtn = null; 

    // --- App State for Caldaie Page ---
    let allBoilers = [];
    let currentFilters = {
        brand: "", // Qui useremo il valore del campo 'brand' di Firestore
        economico: false,
        searchTerm: ""
    };
    let metadataListener = null;
    window.currentUserRole = null; 
    let authInitialized = false; 

    // Mappa dei campi Firestore ai label di visualizzazione e chiavi usate internamente se diverse
    // Le CHIAVI di questo oggetto DEVONO CORRISPONDERE ai nomi dei campi in Firestore
    const ALL_BOILER_FIELDS_MAP = {
        brand: "Marca",
        model: "Modello",
        productCode: "Codice Articolo",
        type: "Tipologia", // Era 'categoria'
        powerKw: "Potenza (kW)", // Era 'potenzaKw'
        dimensions: "Dimensioni (AxLxP)", // Era 'dimensioni'
        weightKg: "Peso (kg)", // Era 'peso'
        // listPrice: "Prezzo di Listino", // DA AGGIUNGERE SE ESISTE IN FIRESTORE con nome 'listPrice'
        price: "Prezzo Scontato", // Era 'prezzoScontato', ora usa 'price' da Firestore
        // disponibilitaTestuale: "Disponibilità", // Campo per testo libero, se esistesse in Firestore
        nearingEndOfStock: "Articolo in Esaurimento", // Era 'articoloInEsaurimento'
        builtIn: "Incasso", // Era 'incasso'
        withStorage: "Con Accumulo", // Era 'conAccumulo'
        outdoorInstallation: "Da Esterno", // Era 'daEsterno'
        withBase: "Con Basamento", // Era 'conBasamento'
        splitterIncluded: "Sdoppiatore Incluso", // Era 'sdoppiatoreIncluso'
        sanitaryPower: "Potenza Sanitario (kW)", // Era 'potenzaSanitarioKw'
        heatingPower: "Potenza Riscaldamento (kW)", // Era 'potenzaRiscaldamentoKw'
        eer: "EER",
        cop: "COP",
        datasheetUrl: "Scheda Tecnica", // Era 'schedaTecnicaUrl'
        // manualeUrl: "Manuale Utente/Installazione", // DA AGGIUNGERE SE ESISTE IN FIRESTORE
        // note: "Note", // DA AGGIUNGERE SE ESISTE IN FIRESTORE
        // wifi: "WiFi Presente" // DA AGGIUNGERE SE ESISTE IN FIRESTORE con nome 'wifi'
        // Campi usati internamente ma non mostrati direttamente nel loop del popup:
        imageName: "_ImmagineNomeFile", // Per l'immagine del prodotto (uso interno)
        // logoMarcaFile: "_LogoMarcaFile" // Non più necessario se costruito da 'brand'
    };

    // --- Utility Functions ---
    function escapeHtml(unsafeString) {
        if (typeof unsafeString !== 'string') {
            unsafeString = String(unsafeString || '');
        }
        return unsafeString
            .replace(/&/g, "&") 
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "'")
            .replace(/'/g, "'");
    }

    function formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) return null;
        return price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    }

    // --- Data Fetching & Processing for Caldaie ---
    async function fetchBoilersFromFirestore() {
        console.log("Fetching 'prodottiCaldaie' from Firestore..."); 
        if(loadingIndicator) loadingIndicator.style.display = 'block';
        if(noResultsMessage) noResultsMessage.style.display = 'none';
        if(boilerListContainer) boilerListContainer.innerHTML = '';
        try {
            // Rimuoviamo temporaneamente orderBy per vedere se i dati arrivano
            // const snapshot = await db.collection('prodottiCaldaie').orderBy('brand').orderBy('model').get();
            const snapshot = await db.collection('prodottiCaldaie').get(); // SENZA ORDER BY PER TEST
            
            console.log(`Firestore snapshot size: ${snapshot.size}`);
            if (snapshot.empty) {
                console.log("Snapshot is empty.");
            }

            const boilers = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log(`Boiler ID: ${doc.id}, Data:`, JSON.parse(JSON.stringify(data)));
                return {
                    id: doc.id,
                    ...data
                    // Aggiungiamo qui il logoMarcaFile costruito dinamicamente
                    // logoMarcaFile: data.brand ? data.brand.toLowerCase().replace(/\s+/g, '') + '.png' : ''
                };
            });
            console.log(`Fetched ${boilers.length} boilers after mapping.`);
            return boilers;
        } catch (error) {
            console.error("Error fetching boilers:", error);
            if(noResultsMessage) {
                if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('insufficient permissions'))) {
                    noResultsMessage.textContent = 'Accesso ai listini non autorizzato. Effettua il login.';
                } else if (error.message && error.message.toLowerCase().includes('missing an index')) {
                    noResultsMessage.textContent = 'Configurazione database in corso (manca indice). Riprova tra poco o contatta supporto. Dettagli in console.';
                    console.error("INDICE MANCANTE IN FIRESTORE. Vai al link nell'errore qui sopra per crearlo.");
                }
                 else {
                    noResultsMessage.textContent = 'Errore nel caricamento dei listini. Riprova più tardi.';
                }
                noResultsMessage.style.display = 'block';
            }
            return [];
        } finally {
            if(loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    // --- Filter UI and Logic for Caldaie ---
    function populateFilterButtons(boilers) {
        const brands = new Set();
        boilers.forEach(boiler => { if (boiler.brand) brands.add(boiler.brand); }); // Usa boiler.brand

        if (!brandFilterButtonsContainer) {
            console.error("Element #brand-filter-buttons not found!");
            return;
        }
        brandFilterButtonsContainer.innerHTML = ''; 
        
        const allBrandsBtn = document.createElement('button');
        allBrandsBtn.classList.add('filter-btn');
        allBrandsBtn.textContent = 'Tutte le Marche';
        allBrandsBtn.dataset.filterGroup = 'brand';
        allBrandsBtn.dataset.filterValue = '';
        if (currentFilters.brand === "") allBrandsBtn.classList.add('active');
        allBrandsBtn.addEventListener('click', handleFilterButtonClick);
        brandFilterButtonsContainer.appendChild(allBrandsBtn);

        Array.from(brands).sort().forEach(brandName => { // brandName è il valore di boiler.brand
            const btn = document.createElement('button');
            btn.classList.add('filter-btn');
            btn.textContent = brandName;
            btn.dataset.filterGroup = 'brand';
            btn.dataset.filterValue = brandName;
            if (currentFilters.brand === brandName) btn.classList.add('active');
            btn.addEventListener('click', handleFilterButtonClick);
            brandFilterButtonsContainer.appendChild(btn);
        });
    }

    function handleFilterButtonClick(event) {
        const clickedButton = event.target;
        const group = clickedButton.dataset.filterGroup; // Sarà 'brand'
        const value = clickedButton.dataset.filterValue; // Sarà il nome della marca (es. "BAXI")

        if (group === 'brand') {
            currentFilters.brand = value; // currentFilters.brand ora contiene il nome della marca
            if(brandFilterButtonsContainer) {
                brandFilterButtonsContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            }
            clickedButton.classList.add('active');
        }
        applyFiltersAndSearch();
    }

    if (economicoFilterBtn) {
        economicoFilterBtn.addEventListener('click', () => {
            currentFilters.economico = !currentFilters.economico;
            economicoFilterBtn.classList.toggle('active', currentFilters.economico);
            applyFiltersAndSearch();
        });
    }

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.searchTerm = e.target.value.toLowerCase().trim();
            clearTimeout(searchInput.searchTimeout);
            searchInput.searchTimeout = setTimeout(() => {
                applyFiltersAndSearch();
            }, 300);
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            currentFilters.brand = "";
            currentFilters.economico = false;
            currentFilters.searchTerm = "";

            if (searchInput) searchInput.value = "";
            if (brandFilterButtonsContainer) {
                brandFilterButtonsContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.filterValue === "") btn.classList.add('active');
                });
            }
            if (economicoFilterBtn) economicoFilterBtn.classList.remove('active');
            applyFiltersAndSearch();
        });
    }
    
    function updateResetButtonVisibility() {
        if (!resetFiltersBtn) return;
        if (currentFilters.brand || currentFilters.economico || currentFilters.searchTerm) {
            resetFiltersBtn.style.display = 'inline-block';
        } else {
            resetFiltersBtn.style.display = 'none';
        }
    }

    function applyFiltersAndSearch() {
        let filteredBoilers = [...allBoilers];

        if (currentFilters.brand) {
            filteredBoilers = filteredBoilers.filter(b => b.brand === currentFilters.brand); // Usa b.brand
        }
        if (currentFilters.economico) {
            filteredBoilers = filteredBoilers.filter(b => {
                const priceToCompare = typeof b.price === 'number' ? b.price : Infinity; // Usa b.price
                // Considera anche b.listPrice se lo aggiungi e vuoi basare "economico" su quello
                return priceToCompare < 1000;
            });
        }
        if (currentFilters.searchTerm) {
            const term = currentFilters.searchTerm;
            filteredBoilers = filteredBoilers.filter(b =>
                (b.model || '').toLowerCase().includes(term) ||       // Usa b.model
                (b.productCode || '').toLowerCase().includes(term) || // Usa b.productCode
                (b.description || '').toLowerCase().includes(term)  // 'description' non era nel tuo esempio dati
            );
        }
        displayBoilers(filteredBoilers);
        updateResetButtonVisibility();
    }

    // --- Boiler Card Creation and Display ---
    function createBoilerCard(boiler) {
        const card = document.createElement('div');
        card.classList.add('boiler-card');
        card.dataset.boilerId = boiler.id; // ID del documento Firestore
        card.addEventListener('click', () => showBoilerDetailsPopup(boiler));

        const productImgName = boiler.imageName || 'placeholder.png'; // Usa boiler.imageName
        const productImgUrl = imageBaseUrl + productImgName;
        
        // Costruisci il nome del file logo dalla marca
        const brandNameForLogo = boiler.brand ? boiler.brand.toLowerCase().replace(/\s+/g, '') : '';
        const brandLogoImgName = brandNameForLogo ? `${brandNameForLogo}.png` : ''; // Es. 'baxi.png'
        const brandLogoUrl = brandLogoImgName ? brandLogoBaseUrl + brandLogoImgName : '';

        const displayPriceVal = boiler.price; // Usa boiler.price (presumendo sia il prezzo scontato)
        const listPriceVal = boiler.listPrice; // USA boiler.listPrice SE LO AGGIUNGI A FIRESTORE
        const isEconomico = typeof displayPriceVal === 'number' && displayPriceVal < 1000;

        let priceHTML = '';
        const formattedDisplayPrice = formatPrice(displayPriceVal);
        if (formattedDisplayPrice) {
            priceHTML += `<span class="price-discounted${isEconomico ? ' economico-price' : ''}">${formattedDisplayPrice}</span>`;
            // Modifica questa logica se aggiungi 'listPrice'
            if (listPriceVal && typeof listPriceVal === 'number' && listPriceVal > displayPriceVal) {
                priceHTML = `<span class="price-list">${formatPrice(listPriceVal)}</span> ` + priceHTML;
            }
        } else {
            priceHTML = `<span class="price-discounted no-discount">Prezzo su richiesta</span>`;
        }

        let disponibilityText = "SCONOSCIUTO";
        let disponibilityClass = "unknown";
        // Usa boiler.nearingEndOfStock
        if (boiler.hasOwnProperty('nearingEndOfStock')) { 
            if (boiler.nearingEndOfStock === true) {
                disponibilityText = "In Esaurimento";
                disponibilityClass = "in-esaurimento";
            } else if (boiler.nearingEndOfStock === false) {
                // Se hai un campo testuale per disponibilità (es. boiler.availabilityText), usalo qui
                disponibilityText = "Disponibile"; 
                disponibilityClass = "available";
            }
        } // else if (boiler.availabilityText) { ... logica per testo disponibilità ... }
        
        let manualeLinkHTML = '';
        // if (boiler.manualeUrl && typeof boiler.manualeUrl === 'string' && boiler.manualeUrl.trim() !== '') {
        //     manualeLinkHTML = `<p class="product-manual"><a href="${escapeHtml(boiler.manualeUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-book-open"></i> Manuale</a></p>`;
        // } 
        // ATTUALMENTE 'manualeUrl' non è in ALL_BOILER_FIELDS_MAP con il nome corretto da Firestore. Aggiungilo se esiste.

        card.innerHTML = `
            <div class="card-top-right-elements">
                ${isEconomico ? '<span class="economico-badge">ECONOMICO</span>' : ''}
                ${boiler.wifi === true ? '<span class="wifi-icon-display"><i class="fas fa-wifi" title="WiFi Presente"></i></span>' : ''} {/* Usa boiler.wifi se lo aggiungi */}
            </div>
            <div class="boiler-card-header">
                ${brandLogoUrl ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(boiler.brand || '')} Logo" class="boiler-logo" onerror="this.style.display='none'; this.parentElement.querySelector('.boiler-logo-placeholder')?.style.display='block';">
                                  <div class="boiler-logo-placeholder" style="display:none; width:100px; height:35px; text-align:center; line-height:35px; font-size:0.8em; color: #ccc;">Logo mancante</div>`
                               : `<div class="boiler-logo-placeholder" style="width:100px; height:35px; text-align:center; line-height:35px; font-size:0.8em; color: #ccc;">(No Logo)</div>`}
                <div class="boiler-title-brand">
                    <h3 class="model">${escapeHtml(boiler.model || 'Modello non Specificato')}</h3> {/* Usa boiler.model */}
                    <span class="brand-text">${escapeHtml(boiler.brand || 'Marca non Specificata')}</span> {/* Usa boiler.brand */}
                </div>
            </div>
            <div class="image-container">
                <img src="${escapeHtml(productImgUrl)}" alt="Immagine ${escapeHtml(boiler.model || 'Caldaia')}"
                     onerror="this.onerror=null; this.src='${escapeHtml(placeholderImage)}'; this.alt='Immagine prodotto non disponibile';">
            </div>
            <div class="boiler-info">
                ${boiler.powerKw ? `<p><strong>Potenza:</strong> ${escapeHtml(String(boiler.powerKw))} kW</p>` : ''} {/* Usa boiler.powerKw */}
                ${boiler.productCode ? `<p><strong>Codice:</strong> ${escapeHtml(boiler.productCode)}</p>` : ''} {/* Usa boiler.productCode */}
                ${boiler.type ? `<p><strong>Tipologia:</strong> ${escapeHtml(boiler.type)}</p>` : ''} {/* Usa boiler.type */}
                <p class="availability ${disponibilityClass}"><strong>Disponibilità:</strong> ${escapeHtml(disponibilityText)}</p>
                ${boiler.datasheetUrl ? `<p class="product-datasheet"><a href="${escapeHtml(boiler.datasheetUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>` : ''} {/* Usa boiler.datasheetUrl */}
                ${manualeLinkHTML}
            </div>
            <div class="boiler-card-footer">
                <div class="price-section">
                    ${priceHTML}
                </div>
            </div>
        `;
        return card;
    }

    function displayBoilers(boilersToDisplay) {
        // ... (come prima, ma ora dovrebbe funzionare se i dati sono popolati)
        if (!boilerListContainer) return;
        boilerListContainer.innerHTML = '';

        if (boilersToDisplay.length === 0) {
            if (noResultsMessage) {
                if (auth.currentUser && (currentFilters.brand || currentFilters.economico || currentFilters.searchTerm)) {
                    noResultsMessage.textContent = 'Nessun prodotto trovato con i filtri selezionati.';
                } else if (auth.currentUser) {
                    noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento o dati non conformi.';
                }
                // Non sovrascrivere il messaggio di "autenticati" se l'utente non è loggato
                if (auth.currentUser || (!auth.currentUser && noResultsMessage.textContent !== 'Devi essere autenticato per visualizzare i listini.')) {
                    noResultsMessage.style.display = 'block';
                }
            }
            return;
        }
        
        if (noResultsMessage) noResultsMessage.style.display = 'none';

        boilersToDisplay.forEach(boiler => {
            boilerListContainer.appendChild(createBoilerCard(boiler));
        });
    }

    // --- Popup Logic for Caldaie ---
    function showBoilerDetailsPopup(boiler) {
        if (!boilerDetailsPopupOverlay || !boilerDetailsPopupContentArea || !popupBoilerTitle) return;
        popupBoilerTitle.textContent = escapeHtml(boiler.model || "Dettagli Caldaia"); // Usa boiler.model
        boilerDetailsPopupContentArea.innerHTML = '';

        for (const fieldKeyInFirestore in ALL_BOILER_FIELDS_MAP) { // fieldKeyInFirestore è es. 'brand', 'model'
            if (ALL_BOILER_FIELDS_MAP.hasOwnProperty(fieldKeyInFirestore) && !fieldKeyInFirestore.startsWith('_')) { // Ignora chiavi interne
                const displayLabel = ALL_BOILER_FIELDS_MAP[fieldKeyInFirestore];
                let value = boiler[fieldKeyInFirestore]; // Accedi al valore usando la chiave di Firestore
                let displayValueHtml; 

                if (value === undefined || value === null || (typeof value === 'string' && value.trim() === "")) {
                    // Mostra SCONOSCIUTO solo per campi specifici se vuoti, altrimenti salta
                    if (['price', 'listPrice', 'nearingEndOfStock'].includes(fieldKeyInFirestore)) {
                         displayValueHtml = '<span class="unknown-value">SCONOSCIUTO</span>';
                    } else {
                        continue; 
                    }
                } else if (typeof value === 'boolean') {
                    displayValueHtml = value ? 'Sì' : 'No';
                } else if (fieldKeyInFirestore === 'datasheetUrl' /* || fieldKeyInFirestore === 'manualeUrl' */) { 
                    displayValueHtml = `<a href="${escapeHtml(String(value))}" target="_blank" rel="noopener noreferrer">${escapeHtml(String(value))}</a>`;
                } else if (fieldKeyInFirestore === 'price' || fieldKeyInFirestore === 'listPrice') { // Usa 'price' e 'listPrice' (se aggiunto)
                    const formatted = formatPrice(value);
                    displayValueHtml = formatted ? escapeHtml(formatted) : '<span class="unknown-value">SCONOSCIUTO</span>';
                } else {
                    displayValueHtml = escapeHtml(String(value));
                }
                boilerDetailsPopupContentArea.innerHTML += `<p><strong>${escapeHtml(displayLabel)}:</strong> <span class="popup-value">${displayValueHtml}</span></p>`;
            }
        }
        boilerDetailsPopupOverlay.classList.add('visible');
    }

    // ... (closeBoilerDetailsPopupBtn e overlay event listener come prima) ...
    if (closeBoilerDetailsPopupBtn) { /* ... */ }
    if (boilerDetailsPopupOverlay) { /* ... */ }


    // --- Admin Authentication and UI Visibility ---
    // ... (toggleAdminCaldaieSectionVisibility come prima) ...
    function toggleAdminCaldaieSectionVisibility() { /* ... */ }
    // ... (setupAuthUI_Caldaie come prima, usa adminTriggerBtn globale) ...
    function setupAuthUI_Caldaie() { /* ... */ }


    // --- Funzione per caricare e visualizzare i dati principali ---
    // ... (loadAndDisplayPrimaryData come prima) ...
    async function loadAndDisplayPrimaryData() { /* ... */ }

    // --- Page Initialization ---
    // ... (initializeCaldaiePage come prima, inclusa la callback onAuthStateChanged) ...
    async function initializeCaldaiePage() { /* ... */ }


    // ==========================================================================================================
    // COPIA E INCOLLA LE FUNZIONI MANCANTI (toggleAdminCaldaieSectionVisibility, setupAuthUI_Caldaie, 
    // loadAndDisplayPrimaryData, initializeCaldaiePage) DALLA RISPOSTA PRECEDENTE, 
    // poiché sono lunghe e non sono cambiate in questa iterazione se non per i commenti.
    // MI SONO CONCENTRATO SUI CAMBIAMENTI RELATIVI AI NOMI DEI CAMPI.
    // ==========================================================================================================
    // Per completezza, ecco le funzioni che non ho ripetuto per brevità ma che devi assicurarti ci siano:

    function toggleAdminCaldaieSectionVisibility() {
        const adminSectionCaldaie = document.getElementById('admin-section-caldaie');
        if (adminSectionCaldaie) {
            adminSectionCaldaie.style.display = window.currentUserRole === 'admin' ? 'block' : 'none';
        }
    }

    function setupAuthUI_Caldaie() {
        const loginModal = document.getElementById('login-modal-caldaie');
        const loginForm = document.getElementById('login-form-caldaie');
        const logoutButton = document.getElementById('logout-button-caldaie');
        
        adminTriggerBtn = document.getElementById('admin-trigger'); 

        const loginEmailInput = document.getElementById('login-email-caldaie');
        const loginPasswordInput = document.getElementById('login-password-caldaie');
        const loginErrorEl = document.getElementById('login-error-caldaie');
        const closeModalBtn = loginModal ? loginModal.querySelector('.close-btn-caldaie') : null;
        const loginModalTitle = document.getElementById('login-modal-title-caldaie');

        if (adminTriggerBtn && loginModal) { 
            adminTriggerBtn.addEventListener('click', () => {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    if (logoutButton) logoutButton.style.display = 'block';
                    if (loginForm) loginForm.style.display = 'none';
                    if (loginErrorEl) loginErrorEl.style.display = 'none';
                    if (loginModalTitle) loginModalTitle.textContent = `Loggato: ${currentUser.email}`;
                } else {
                    if (logoutButton) logoutButton.style.display = 'none';
                    if (loginForm) loginForm.style.display = 'block';
                    if (loginModalTitle) loginModalTitle.textContent = 'Accesso Amministratore';
                    if (loginEmailInput) loginEmailInput.value = ''; 
                    if (loginPasswordInput) loginPasswordInput.value = '';
                    if (loginErrorEl) loginErrorEl.style.display = 'none';
                }
                loginModal.style.display = 'flex'; 
                loginModal.classList.add('visible');
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (loginModal) {
                    loginModal.style.display = 'none';
                    loginModal.classList.remove('visible');
                }
            });
        }
        if (loginModal && loginModal.classList.contains('modal')) { 
            loginModal.addEventListener('click', (event) => {
                if (event.target === loginModal) {
                    loginModal.style.display = 'none';
                    loginModal.classList.remove('visible');
                }
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (event) => {
                event.preventDefault();
                if(!loginEmailInput || !loginPasswordInput) return;
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                if (!email || !password) {
                    if (loginErrorEl) { loginErrorEl.textContent = 'Email e Password obbligatori.'; loginErrorEl.style.display = 'block'; }
                    return;
                }
                if (loginErrorEl) loginErrorEl.style.display = 'none'; 

                auth.signInWithEmailAndPassword(email, password)
                    .then(userCredential => {
                        if (loginModal) {
                            loginModal.style.display = 'none';
                            loginModal.classList.remove('visible');
                        }
                        if (loginPasswordInput) loginPasswordInput.value = '';
                    })
                    .catch(error => {
                        console.error("Login error:", error);
                        if (loginErrorEl) {
                            let message = "Errore di accesso. Riprova.";
                            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                                message = 'Email o Password non validi.';
                            } else if (error.code === 'auth/invalid-email') {
                                message = 'Formato Email non valido.';
                            }
                            loginErrorEl.textContent = message;
                            loginErrorEl.style.display = 'block';
                        }
                    });
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                auth.signOut().then(() => {
                    if (loginModal) {
                        loginModal.style.display = 'none';
                        loginModal.classList.remove('visible');
                    }
                });
            });
        }
    }

    async function loadAndDisplayPrimaryData() {
        if (!authInitialized) {
            console.log("Auth non ancora inizializzato, in attesa...");
            return; 
        }

        if (!auth.currentUser) {
            console.log("Nessun utente loggato. Non si effettua il fetch dei listini protetti.");
            if(boilerListContainer) boilerListContainer.innerHTML = ''; 
            if(noResultsMessage) {
                noResultsMessage.textContent = 'Devi essere autenticato per visualizzare i listini.';
                noResultsMessage.style.display = 'block';
            }
            if(loadingIndicator) loadingIndicator.style.display = 'none';
            
            if (brandFilterButtonsContainer) brandFilterButtonsContainer.innerHTML = '<p style="color: var(--secondary-color); font-size: 0.9em; text-align: center; width:100%;">Autenticati per visualizzare e filtrare i prodotti.</p>';
            if (economicoFilterBtn) economicoFilterBtn.style.display = 'none';
            if (searchInput) { searchInput.value = ''; searchInput.disabled = true; }
            if (resetFiltersBtn) resetFiltersBtn.style.display = 'none';
            allBoilers = []; 
            return;
        }

        if (economicoFilterBtn) economicoFilterBtn.style.display = 'inline-block';
        if (searchInput) searchInput.disabled = false;

        console.log("Utente autenticato, procedo con il fetch dei listini caldaie.");
        allBoilers = await fetchBoilersFromFirestore(); 

        if (allBoilers.length > 0) {
            if(noResultsMessage) noResultsMessage.style.display = 'none'; 
            populateFilterButtons(allBoilers);
            displayBoilers(allBoilers); 
        } else {
             // Questo blocco viene raggiunto se fetchBoilersFromFirestore ritorna un array vuoto
            // (ad es. se lo snapshot è vuoto o se c'è un errore gestito che ritorna [])
            // E l'utente è loggato.
            if (boilerListContainer && !boilerListContainer.hasChildNodes() && noResultsMessage) {
                 if (!noResultsMessage.textContent.includes('Accesso ai listini non autorizzato') && 
                     !noResultsMessage.textContent.includes('Configurazione database in corso')) {
                    noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento o dati non trovati.';
                 }
                 // noResultsMessage.style.display = 'block'; // Già gestito da fetchBoilersFromFirestore in caso di errore
            }
            if (brandFilterButtonsContainer) brandFilterButtonsContainer.innerHTML = ''; // Pulisci i filtri se non ci sono dati
        }
        updateResetButtonVisibility(); // Chiama sempre per gestire il bottone reset
    }

    async function initializeCaldaiePage() {
        if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

        if (metadataListener) metadataListener(); 
        metadataListener = db.collection('metadata').doc('listiniInfo')
            .onSnapshot(doc => {
                if (dataUpdateDateEl) {
                    if (doc.exists && doc.data()?.caldaieLastUpdate) { 
                        const ts = doc.data().caldaieLastUpdate;
                        if (ts && typeof ts.toDate === 'function') { 
                             dataUpdateDateEl.textContent = ts.toDate().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                        } else if (ts && ts.seconds) { 
                             dataUpdateDateEl.textContent = new Date(ts.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                        } else { dataUpdateDateEl.textContent = "Non disponibile"; }
                    } else { dataUpdateDateEl.textContent = "Non specificato"; }
                }
            }, error => {
                console.error("Error fetching metadata for update date:", error);
                if (dataUpdateDateEl) dataUpdateDateEl.textContent = "Errore caricamento data";
            });
        
        setupAuthUI_Caldaie(); 

        auth.onAuthStateChanged(async user => { 
            authInitialized = true; 

            if (user) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    window.currentUserRole = userDoc.exists && userDoc.data().role ? userDoc.data().role : 'user';
                    console.log("User Authenticated. Role:", window.currentUserRole);
                    
                    if (adminTriggerBtn) { 
                        adminTriggerBtn.title = (window.currentUserRole === 'admin' ? `Pannello Admin (${user.email.split('@')[0]})` : `Profilo Utente (${user.email.split('@')[0]})`);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    window.currentUserRole = 'user'; 
                    if (adminTriggerBtn) {
                        adminTriggerBtn.title = "Accesso Admin"; 
                    }
                }
            } else {
                console.log("User logged out or not authenticated.");
                window.currentUserRole = null;
                if (adminTriggerBtn) {
                    adminTriggerBtn.title = "Accesso Admin";
                }
            }
            
            await loadAndDisplayPrimaryData(); 
            toggleAdminCaldaieSectionVisibility(); 
        });
    }
    // FINE DELLE FUNZIONI RIPORTATE PER COMPLETEZZA

    initializeCaldaiePage();
});

// --- END OF FILE script.js (MODIFIED PER NOMI CAMPI FIRESTORE) ---
