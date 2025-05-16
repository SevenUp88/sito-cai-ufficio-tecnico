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
    const imageBaseUrl = 'img/'; // Relative to LISTINI/CALDAIE/ for product images
    const brandLogoBaseUrl = 'img/logos/'; // Relative for brand logos
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

    // --- App State for Caldaie Page ---
    let allBoilers = [];
    let currentFilters = {
        brand: "",
        economico: false,
        searchTerm: ""
    };
    let metadataListener = null;
    window.currentUserRole = null; // Global for user role (similar to configurator)

    // Define all possible fields and their display labels for the popup
    // CRITICAL: Ensure these Firestore fieldKeys match your 'caldaie' collection
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
        // articoloInEsaurimento: "Articolo in Esaurimento", // Raw field
        disponibilita: "Disponibilità", // Derived or direct field
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
        note: "Note",
        wifi: "WiFi Presente"
        // Add other fields from your Firestore 'caldaie' collection
    };


    // --- Utility Functions (can be shared if you have a main.js) ---
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
        console.log("Fetching 'caldaie' from Firestore...");
        loadingIndicator.style.display = 'block';
        noResultsMessage.style.display = 'none';
        boilerListContainer.innerHTML = '';
        try {
            const snapshot = await db.collection('caldaie').orderBy('marca').orderBy('modello').get();
            const boilers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`Fetched ${boilers.length} boilers.`);
            return boilers;
        } catch (error) {
            console.error("Error fetching boilers:", error);
            noResultsMessage.textContent = 'Errore nel caricamento dei listini. Riprova più tardi.';
            noResultsMessage.style.display = 'block';
            return [];
        } finally {
            loadingIndicator.style.display = 'none';
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
            brandFilterButtonsContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
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

    searchInput.addEventListener('input', (e) => {
        currentFilters.searchTerm = e.target.value.toLowerCase().trim();
        // Debounce search to avoid too many re-renders
        clearTimeout(searchInput.searchTimeout);
        searchInput.searchTimeout = setTimeout(() => {
            applyFiltersAndSearch();
        }, 300);
    });

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            currentFilters.brand = "";
            currentFilters.economico = false;
            currentFilters.searchTerm = "";

            searchInput.value = "";
            if (brandFilterButtonsContainer) {
                brandFilterButtonsContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.filterValue === "") btn.classList.add('active');
                });
            }
            if (economicoFilterBtn) economicoFilterBtn.classList.remove('active');
            resetFiltersBtn.style.display = 'none';
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
            filteredBoilers = filteredBoilers.filter(b => (b.prezzoScontato || b.prezzoListino || Infinity) < 1000);
        }
        if (currentFilters.searchTerm) {
            const term = currentFilters.searchTerm;
            filteredBoilers = filteredBoilers.filter(b =>
                (b.modello || '').toLowerCase().includes(term) ||
                (b.codiceArticolo || '').toLowerCase().includes(term) ||
                (b.descrizione || '').toLowerCase().includes(term) // Assuming 'descrizione' field exists
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

        const displayPriceVal = boiler.prezzoScontato || boiler.prezzoListino;
        const listPriceVal = boiler.prezzoListino;
        const isEconomico = typeof displayPriceVal === 'number' && displayPriceVal < 1000;

        let priceHTML = '';
        const formattedDisplayPrice = formatPrice(displayPriceVal);
        if (formattedDisplayPrice) {
            priceHTML += `<span class="price-discounted${isEconomico ? ' economico-price' : ''}">${formattedDisplayPrice}</span>`;
            if (listPriceVal && typeof listPriceVal === 'number' && listPriceVal > displayPriceVal && boiler.prezzoScontato) {
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

        card.innerHTML = `
            <div class="card-top-right-elements">
                ${isEconomico ? '<span class="economico-badge">ECONOMICO</span>' : ''}
                ${boiler.wifi === true ? '<span class="wifi-icon-display"><i class="fas fa-wifi"></i></span>' : ''}
            </div>
            <div class="boiler-card-header">
                ${brandLogoUrl ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(boiler.marca || '')} Logo" class="boiler-logo" onerror="this.style.display='none'; this.parentElement.querySelector('.boiler-logo-placeholder')?.style.display='block';">
                                  <div class="boiler-logo-placeholder" style="display:none; width:100px; height:35px; text-align:center; line-height:35px; font-size:0.8em; color: #ccc;">Logo mancante</div>`
                               : `<div class="boiler-logo-placeholder" style="width:100px; height:35px;"></div>`}
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
                ${boiler.dimensioni ? `<p><strong>Dimensioni:</strong> ${escapeHtml(boiler.dimensioni)}</p>` : ''}
                <p class="availability ${disponibilityClass}"><strong>Disponibilità:</strong> ${escapeHtml(disponibilityText)}</p>
                ${boiler.schedaTecnicaUrl ? `<p class="product-datasheet"><a href="${escapeHtml(boiler.schedaTecnicaUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>` : ''}
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
        boilerListContainer.innerHTML = '';
        if (boilersToDisplay.length === 0 && (currentFilters.brand || currentFilters.economico || currentFilters.searchTerm)) {
            noResultsMessage.textContent = 'Nessun prodotto trovato con i filtri selezionati.';
            noResultsMessage.style.display = 'block';
            return;
        } else if (boilersToDisplay.length === 0) {
             noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.'; // Initial load empty
             noResultsMessage.style.display = 'block';
             return;
        }
        noResultsMessage.style.display = 'none';
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
                let displayValueHtml; // Store as HTML string

                if (value === undefined || value === null || (typeof value === 'string' && value.trim() === "")) {
                    displayValueHtml = '<span class="unknown-value">SCONOSCIUTO</span>';
                } else if (typeof value === 'boolean') {
                    displayValueHtml = value ? 'Sì' : 'No';
                } else if (fieldKey === 'schedaTecnicaUrl') {
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
            boilerDetailsPopupOverlay.classList.remove('visible');
        });
    }
    if (boilerDetailsPopupOverlay) {
        boilerDetailsPopupOverlay.addEventListener('click', (event) => {
            if (event.target === boilerDetailsPopupOverlay) {
                boilerDetailsPopupOverlay.classList.remove('visible');
            }
        });
    }


    // --- Admin Authentication and UI Visibility (Adapted from configurator/script.js) ---
    function toggleAdminCaldaieSectionVisibility() {
        const adminSectionCaldaie = document.getElementById('admin-section-caldaie');
        if (adminSectionCaldaie) {
            adminSectionCaldaie.style.display = window.currentUserRole === 'admin' ? 'block' : 'none';
            if (window.currentUserRole === 'admin') {
                // loadAndDisplayAdminBoilers(); // Placeholder for admin list of boilers
            }
        }
    }

    function setupAuthUI_Caldaie() {
        const loginModal = document.getElementById('login-modal-caldaie');
        const loginForm = document.getElementById('login-form-caldaie');
        const logoutButton = document.getElementById('logout-button-caldaie');
        const adminTriggerBtn = document.getElementById('admin-trigger'); // Shared admin trigger
        // const authStatusEl = document.getElementById('auth-status-caldaie'); // If you add one
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
                }
                loginModal.style.display = 'flex'; // Using flex from popup style
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
        // Close modal on overlay click (if modal is .popup-overlay structure)
        if (loginModal && loginModal.classList.contains('modal')) { // Check if it's the specific modal
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
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                if (!email || !password) {
                    if (loginErrorEl) { loginErrorEl.textContent = 'Email e Password obbligatori.'; loginErrorEl.style.display = 'block'; }
                    return;
                }
                if (loginErrorEl) loginErrorEl.style.display = 'none'; // Clear previous error

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
                    // window.currentUserRole is updated by onAuthStateChanged
                });
            });
        }

        auth.onAuthStateChanged(user => {
            if (user) {
                db.collection('users').doc(user.uid).get().then(doc => {
                    window.currentUserRole = doc.exists && doc.data().role ? doc.data().role : 'user';
                    console.log("User Authenticated. Role:", window.currentUserRole);
                    // Update UI based on role, e.g., adminTriggerBtn text/icon
                    if (adminTriggerBtn) adminTriggerBtn.title = (window.currentUserRole === 'admin' ? `Pannello Admin (${user.email.split('@')[0]})` : `Profilo Utente (${user.email.split('@')[0]})`);
                    toggleAdminCaldaieSectionVisibility();
                }).catch((error) => {
                    console.error("Error fetching user role:", error);
                    window.currentUserRole = 'user'; // Default to user on error
                    if (adminTriggerBtn) adminTriggerBtn.title = "Accesso Admin";
                    toggleAdminCaldaieSectionVisibility();
                });
            } else {
                console.log("User logged out or not authenticated.");
                window.currentUserRole = null;
                if (adminTriggerBtn) adminTriggerBtn.title = "Accesso Admin";
                toggleAdminCaldaieSectionVisibility();
            }
        });
    }

    // --- Page Initialization ---
    async function initializeCaldaiePage() {
        if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

        // Fetch data first
        allBoilers = await fetchBoilersFromFirestore();

        // Then populate UI elements that depend on this data
        if (allBoilers.length > 0) {
            populateFilterButtons(allBoilers);
            displayBoilers(allBoilers); // Display all initially
        } else {
            // fetchBoilersFromFirestore handles initial empty message if needed
            // but displayBoilers also has a check if allBoilers is truly empty from the start
             if (!boilerListContainer.hasChildNodes()) { // If container is empty after fetch
                noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.';
                noResultsMessage.style.display = 'block';
            }
        }
        updateResetButtonVisibility();

        // Set up listener for metadata (last update date)
        if (metadataListener) metadataListener(); // Detach previous, if any
        metadataListener = db.collection('metadata').doc('listiniInfo')
            .onSnapshot(doc => {
                if (dataUpdateDateEl) {
                    if (doc.exists && doc.data()?.caldaieLastUpdate) {
                        const ts = doc.data().caldaieLastUpdate;
                        if (ts && typeof ts.toDate === 'function') { // Check if it's a Firestore Timestamp
                             dataUpdateDateEl.textContent = ts.toDate().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                        } else if (ts && ts.seconds) { // Fallback for older timestamp format
                             dataUpdateDateEl.textContent = new Date(ts.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                        } else { dataUpdateDateEl.textContent = "Non disponibile"; }
                    } else { dataUpdateDateEl.textContent = "Non specificato"; }
                }
            }, error => {
                console.error("Error fetching metadata for update date:", error);
                if (dataUpdateDateEl) dataUpdateDateEl.textContent = new Date().toLocaleDateString('it-IT');
            });
        
        setupAuthUI_Caldaie(); // Initialize Auth UI components and listeners
        toggleAdminCaldaieSectionVisibility(); // Initial check for admin section visibility
    }

    initializeCaldaiePage();
});
