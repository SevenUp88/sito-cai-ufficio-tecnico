// --- START OF FILE script.js (COMPLETO E CORRETTO) ---

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
    const placeholderImage = imageBaseUrl + 'placeholder.png';

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

    // === MODIFICA CHIAVE: Sposta la dichiarazione di adminTriggerBtn qui ===
    let adminTriggerBtn = null; 
    // ======================================================================

    // --- App State for Caldaie Page ---
    let allBoilers = [];
    let currentFilters = {
        brand: "",
        economico: false,
        searchTerm: ""
    };
    let metadataListener = null;
    window.currentUserRole = null; 
    let authInitialized = false; 

    const ALL_BOILER_FIELDS_MAP = {
        marca: "Marca",
        modello: "Modello",
        codiceArticolo: "Codice Articolo",
        categoria: "Tipologia",
        potenzaKw: "Potenza (kW)",
        dimensioni: "Dimensioni (AxLxP)",
        peso: "Peso",
        prezzoListino: "Prezzo di Listino",
        prezzoScontato: "Prezzo Scontato",
        disponibilita: "Disponibilità", 
        incasso: "Incasso",
        conAccumulo: "Con Accumulo",
        daEsterno: "Da Esterno",
        conBasamento: "Con Basamento",
        sdoppiatoreIncluso: "Sdoppiatore Incluso",
        potenzaSanitarioKw: "Potenza Sanitario (kW)",
        potenzaRiscaldamentoKw: "Potenza Riscaldamento (kW)",
        eer: "EER",
        cop: "COP",
        schedaTecnicaUrl: "Scheda Tecnica",
        manualeUrl: "Manuale Utente/Installazione",
        note: "Note",
        wifi: "WiFi Presente"
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
            const snapshot = await db.collection('prodottiCaldaie') 
                                     .orderBy('marca')
                                     .orderBy('modello')
                                     .get();
            const boilers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`Fetched ${boilers.length} boilers.`);
            return boilers;
        } catch (error) {
            console.error("Error fetching boilers:", error);
            if(noResultsMessage) {
                if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('insufficient permissions'))) {
                    noResultsMessage.textContent = 'Accesso ai listini non autorizzato. Effettua il login.';
                } else {
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
        boilers.forEach(boiler => { if (boiler.marca) brands.add(boiler.marca); });

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

        Array.from(brands).sort().forEach(brand => {
            const btn = document.createElement('button');
            btn.classList.add('filter-btn');
            btn.textContent = brand;
            btn.dataset.filterGroup = 'brand';
            btn.dataset.filterValue = brand;
            if (currentFilters.brand === brand) btn.classList.add('active');
            btn.addEventListener('click', handleFilterButtonClick);
            brandFilterButtonsContainer.appendChild(btn);
        });
    }

    function handleFilterButtonClick(event) {
        const clickedButton = event.target;
        const group = clickedButton.dataset.filterGroup;
        const value = clickedButton.dataset.filterValue;

        if (group === 'brand') {
            currentFilters.brand = value;
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
            filteredBoilers = filteredBoilers.filter(b => b.marca === currentFilters.brand);
        }
        if (currentFilters.economico) {
            filteredBoilers = filteredBoilers.filter(b => {
                const price = typeof b.prezzoScontato === 'number' ? b.prezzoScontato : (typeof b.prezzoListino === 'number' ? b.prezzoListino : Infinity);
                return price < 1000;
            });
        }
        if (currentFilters.searchTerm) {
            const term = currentFilters.searchTerm;
            filteredBoilers = filteredBoilers.filter(b =>
                (b.modello || '').toLowerCase().includes(term) ||
                (b.codiceArticolo || '').toLowerCase().includes(term) ||
                (b.descrizione || '').toLowerCase().includes(term) 
            );
        }
        displayBoilers(filteredBoilers);
        updateResetButtonVisibility();
    }

    // --- Boiler Card Creation and Display ---
    function createBoilerCard(boiler) {
        const card = document.createElement('div');
        card.classList.add('boiler-card');
        card.dataset.boilerId = boiler.id;
        card.addEventListener('click', () => showBoilerDetailsPopup(boiler));

        const productImgName = boiler.immagineNomeFile || 'placeholder.png';
        const productImgUrl = imageBaseUrl + productImgName;
        
        const brandLogoImgName = boiler.logoMarcaFile || '';
        const brandLogoUrl = brandLogoImgName ? brandLogoBaseUrl + brandLogoImgName : '';

        const displayPriceVal = typeof boiler.prezzoScontato === 'number' ? boiler.prezzoScontato : boiler.prezzoListino;
        const listPriceVal = boiler.prezzoListino;
        const isEconomico = typeof displayPriceVal === 'number' && displayPriceVal < 1000;

        let priceHTML = '';
        const formattedDisplayPrice = formatPrice(displayPriceVal);
        if (formattedDisplayPrice) {
            priceHTML += `<span class="price-discounted${isEconomico ? ' economico-price' : ''}">${formattedDisplayPrice}</span>`;
            if (listPriceVal && typeof listPriceVal === 'number' && listPriceVal > displayPriceVal && typeof boiler.prezzoScontato === 'number') {
                priceHTML = `<span class="price-list">${formatPrice(listPriceVal)}</span> ` + priceHTML;
            }
        } else {
            priceHTML = `<span class="price-discounted no-discount">Prezzo su richiesta</span>`;
        }

        let disponibilityText = "SCONOSCIUTO";
        let disponibilityClass = "unknown";
        if (boiler.hasOwnProperty('articoloInEsaurimento')) { 
            if (boiler.articoloInEsaurimento === true) {
                disponibilityText = "In Esaurimento";
                disponibilityClass = "in-esaurimento";
            } else if (boiler.articoloInEsaurimento === false) {
                disponibilityText = boiler.disponibilita || "Disponibile"; 
                disponibilityClass = "available";
            }
        } else if (boiler.disponibilita) { 
            disponibilityText = boiler.disponibilita;
            const lowerDisp = disponibilityText.toLowerCase();
            if (lowerDisp.includes("esaurimento")) disponibilityClass = "in-esaurimento";
            else if (lowerDisp.includes("disponibile")) disponibilityClass = "available";
            else if (lowerDisp.includes("ordinazione") || lowerDisp.includes("arrivo")) disponibilityClass = "on-order";
        }
        
        let manualeLinkHTML = '';
        if (boiler.manualeUrl && typeof boiler.manualeUrl === 'string' && boiler.manualeUrl.trim() !== '') {
            manualeLinkHTML = `<p class="product-manual"><a href="${escapeHtml(boiler.manualeUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-book-open"></i> Manuale</a></p>`;
        }

        card.innerHTML = `
            <div class="card-top-right-elements">
                ${isEconomico ? '<span class="economico-badge">ECONOMICO</span>' : ''}
                ${boiler.wifi === true ? '<span class="wifi-icon-display"><i class="fas fa-wifi" title="WiFi Presente"></i></span>' : ''}
            </div>
            <div class="boiler-card-header">
                ${brandLogoUrl ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(boiler.marca || '')} Logo" class="boiler-logo" onerror="this.style.display='none'; this.parentElement.querySelector('.boiler-logo-placeholder')?.style.display='block';">
                                  <div class="boiler-logo-placeholder" style="display:none; width:100px; height:35px; text-align:center; line-height:35px; font-size:0.8em; color: #ccc;">Logo mancante</div>`
                               : `<div class="boiler-logo-placeholder" style="width:100px; height:35px; text-align:center; line-height:35px; font-size:0.8em; color: #ccc;">(No Logo)</div>`}
                <div class="boiler-title-brand">
                    <h3 class="model">${escapeHtml(boiler.modello || 'Modello non Specificato')}</h3>
                    <span class="brand-text">${escapeHtml(boiler.marca || 'Marca non Specificata')}</span>
                </div>
            </div>
            <div class="image-container">
                <img src="${escapeHtml(productImgUrl)}" alt="Immagine ${escapeHtml(boiler.modello || 'Caldaia')}"
                     onerror="this.onerror=null; this.src='${escapeHtml(placeholderImage)}'; this.alt='Immagine prodotto non disponibile';">
            </div>
            <div class="boiler-info">
                ${boiler.potenzaKw ? `<p><strong>Potenza:</strong> ${escapeHtml(String(boiler.potenzaKw))} kW</p>` : ''}
                ${boiler.codiceArticolo ? `<p><strong>Codice:</strong> ${escapeHtml(boiler.codiceArticolo)}</p>` : ''}
                ${boiler.categoria ? `<p><strong>Tipologia:</strong> ${escapeHtml(boiler.categoria)}</p>` : ''}
                <p class="availability ${disponibilityClass}"><strong>Disponibilità:</strong> ${escapeHtml(disponibilityText)}</p>
                ${boiler.schedaTecnicaUrl ? `<p class="product-datasheet"><a href="${escapeHtml(boiler.schedaTecnicaUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>` : ''}
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
        if (!boilerListContainer) return;
        boilerListContainer.innerHTML = '';

        if (boilersToDisplay.length === 0) {
            if (noResultsMessage) {
                if (auth.currentUser && (currentFilters.brand || currentFilters.economico || currentFilters.searchTerm)) {
                    noResultsMessage.textContent = 'Nessun prodotto trovato con i filtri selezionati.';
                } else if (auth.currentUser) {
                    noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.';
                } else {
                    // Il messaggio per utenti non loggati è gestito da loadAndDisplayPrimaryData
                    // noResultsMessage.textContent = 'Devi essere autenticato per visualizzare i listini.'; 
                }
                noResultsMessage.style.display = 'block';
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
        popupBoilerTitle.textContent = escapeHtml(boiler.modello || "Dettagli Caldaia");
        boilerDetailsPopupContentArea.innerHTML = '';

        for (const fieldKey in ALL_BOILER_FIELDS_MAP) {
            if (ALL_BOILER_FIELDS_MAP.hasOwnProperty(fieldKey)) {
                const displayLabel = ALL_BOILER_FIELDS_MAP[fieldKey];
                let value = boiler[fieldKey];
                let displayValueHtml; 

                if (value === undefined || value === null || (typeof value === 'string' && value.trim() === "")) {
                    if (['prezzoListino', 'prezzoScontato', 'disponibilita'].includes(fieldKey)) {
                         displayValueHtml = '<span class="unknown-value">SCONOSCIUTO</span>';
                    } else {
                        continue; 
                    }
                } else if (typeof value === 'boolean') {
                    displayValueHtml = value ? 'Sì' : 'No';
                } else if (fieldKey === 'schedaTecnicaUrl' || fieldKey === 'manualeUrl') { 
                    displayValueHtml = `<a href="${escapeHtml(String(value))}" target="_blank" rel="noopener noreferrer">${escapeHtml(String(value))}</a>`;
                } else if (fieldKey === 'prezzoListino' || fieldKey === 'prezzoScontato') {
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
    if (closeBoilerDetailsPopupBtn) {
        closeBoilerDetailsPopupBtn.addEventListener('click', () => {
            if (boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.classList.remove('visible');
        });
    }
    if (boilerDetailsPopupOverlay) {
        boilerDetailsPopupOverlay.addEventListener('click', (event) => {
            if (event.target === boilerDetailsPopupOverlay) {
                boilerDetailsPopupOverlay.classList.remove('visible');
            }
        });
    }

    // --- Admin Authentication and UI Visibility ---
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
        
        // === MODIFICA CHIAVE: Assegna adminTriggerBtn qui, non dichiararlo con const ===
        adminTriggerBtn = document.getElementById('admin-trigger'); 
        // ===============================================================================

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

    // --- Funzione per caricare e visualizzare i dati principali ---
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
            if (boilerListContainer && !boilerListContainer.hasChildNodes() && noResultsMessage && (!noResultsMessage.textContent || noResultsMessage.style.display !== 'block') ) {
                noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.';
                noResultsMessage.style.display = 'block';
            }
            if (brandFilterButtonsContainer) brandFilterButtonsContainer.innerHTML = '';
        }
        updateResetButtonVisibility();
    }

    // --- Page Initialization ---
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
                    
                    // === MODIFICA CHIAVE: Ora adminTriggerBtn è accessibile qui ===
                    if (adminTriggerBtn) { 
                        adminTriggerBtn.title = (window.currentUserRole === 'admin' ? `Pannello Admin (${user.email.split('@')[0]})` : `Profilo Utente (${user.email.split('@')[0]})`);
                    }
                    // ============================================================
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    window.currentUserRole = 'user'; // Default to user on error
                    // === MODIFICA CHIAVE: Anche qui ===
                    if (adminTriggerBtn) {
                        adminTriggerBtn.title = "Accesso Admin"; 
                    }
                    // =================================
                }
            } else {
                console.log("User logged out or not authenticated.");
                window.currentUserRole = null;
                // === MODIFICA CHIAVE: Anche qui ===
                if (adminTriggerBtn) {
                    adminTriggerBtn.title = "Accesso Admin";
                }
                // =================================
            }
            
            await loadAndDisplayPrimaryData(); 
            toggleAdminCaldaieSectionVisibility(); 
        });
    }

    initializeCaldaiePage();
});

// --- END OF FILE script.js (COMPLETO E CORRETTO) ---
