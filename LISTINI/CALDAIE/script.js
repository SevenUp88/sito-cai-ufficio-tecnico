// --- START OF FILE script.js (COMPLETO E GARANTITO SENZA OMISSIONI) ---

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Listini Caldaie)");

    // Firebase Configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC6tvhoIlvIyh8L_jwSVWs_TkXNLKrt540",
      authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
      projectId: "consorzio-artigiani-idraulici",
      storageBucket: "consorzio-artigiani-idraulici.appspot.com",
      messagingSenderId: "136848104008",
      appId: "1:136848104008:web:2724f60607dbe91d09d67d",
      measurementId: "G-NNPV2607G7"
    };

    if (!firebase.apps.length) { // Evita reinizializzazione
        firebase.initializeApp(firebaseConfig);
    }
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
    
    // Header elements
    const headerUserInfo = document.querySelector('.header-user-info');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');

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
    let authInitialized = false; 

    const ALL_BOILER_FIELDS_MAP = { // NOMI CAMPI DA FIRESTORE -> LABEL
        brand: "Marca", model: "Modello", productCode: "Codice Articolo",
        type: "Tipologia", powerKw: "Potenza (kW)",
        dimensions: "Dimensioni AxLxP (mm)", 
        weightKg: "Peso (kg)", price: "Prezzo", 
        listPrice: "Prezzo di Listino", 
        nearingEndOfStock: "Articolo in Esaurimento", builtIn: "Incasso",
        litri_accumulo: "Capacità Accumulo", 
        outdoorInstallation: "Da Esterno", withBase: "Con Basamento",
        splitterIncluded: "Sdoppiatore Incluso", sanitaryPower: "Potenza Sanitario (kW)",
        heatingPower: "Potenza Riscaldamento (kW)", eer: "EER", cop: "COP",
        datasheetUrl: "Scheda Tecnica",
        manualeUrl: "Manuale", 
        wifi: "WiFi Presente",
        novita: "Novità Prodotto"
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
            const snapshot = await db.collection('prodottiCaldaie').get();
            console.log(`Firestore snapshot size: ${snapshot.size}`);
            
            if (snapshot.empty) {
                console.log("Snapshot prodottiCaldaie is empty.");
                return [];
            }

            const boilers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    brand: data.marca,
                    model: data.modello,
                    imageName: data.nome_immagine,
                    productCode: data.codice_prodotto,
                    price: data.prezzo,
                    nearingEndOfStock: data.articolo_in_esaurimento,
                    novita: data.novita,
                    powerKw: data.potenza_kw,
                    type: data.tipologia,
                    builtIn: data.incasso,
                    con_accumulo: data.con_accumulo,
                    litri_accumulo: data.litri_accumulo,
                    outdoorInstallation: data.da_esterno,
                    withBase: data.con_basamento,
                    splitterIncluded: data.sdoppiatore_incluso,
                    dimensions: data.dimensioni,
                    weightKg: data.peso,
                    datasheetUrl: data.scheda_tecnica_url,
                    manualeUrl: data.manuale_url,
                    wifi: data.wifi,
                    sanitaryPower: data.potenza_sanitario,
                    heatingPower: data.potenza_riscaldamento,
                    classe_efficienza: data.classe_efficienza,
                    listPrice: data.prezzo_listino || null
                };
            });

            console.log(`Fetched ${boilers.length} boilers after mapping.`);
            if (boilers.length > 0) {
                console.log("Esempio del primo prodotto mappato:", boilers[0]);
            }
            
            return boilers;
            
        } catch (error) {
            console.error("Error fetching boilers:", error);
            if(noResultsMessage) {
                if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('insufficient permissions'))) {
                    noResultsMessage.textContent = 'Accesso ai listini non autorizzato. Per favore, contatta l\'amministratore.';
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
        boilers.forEach(boiler => { if (boiler.brand) brands.add(boiler.brand); });

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
        allBrandsBtn.addEventListener('click', () => handleFilterButtonClick(allBrandsBtn));
        brandFilterButtonsContainer.appendChild(allBrandsBtn);

        Array.from(brands).sort().forEach(brandName => {
            const btn = document.createElement('button');
            btn.classList.add('filter-btn');
            btn.textContent = brandName;
            btn.dataset.filterGroup = 'brand';
            btn.dataset.filterValue = brandName;
            if (currentFilters.brand === brandName) btn.classList.add('active');
            btn.addEventListener('click', () => handleFilterButtonClick(btn));
            brandFilterButtonsContainer.appendChild(btn);
        });
    }

    function handleFilterButtonClick(clickedButton) {
        const group = 'brand';
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
            filteredBoilers = filteredBoilers.filter(b => b.brand === currentFilters.brand);
        }
        if (currentFilters.economico) {
            filteredBoilers = filteredBoilers.filter(b => {
                const priceToCompare = typeof b.price === 'number' ? b.price : Infinity;
                return priceToCompare < 1000; 
            });
        }
        if (currentFilters.searchTerm) {
            const term = currentFilters.searchTerm;
            filteredBoilers = filteredBoilers.filter(b =>
                (b.model || '').toLowerCase().includes(term) ||
                (b.productCode || '').toLowerCase().includes(term) ||
                (b.description || '').toLowerCase().includes(term)
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

        if (boiler.brand) {
            const brandClass = `brand-${boiler.brand.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}`;
            card.classList.add(brandClass);
        }

        card.addEventListener('click', () => showBoilerDetailsPopup(boiler));

        const productImgName = boiler.imageName || 'placeholder.png';
        const productImgUrl = imageBaseUrl + productImgName;

        const brandNameForLogo = boiler.brand ? boiler.brand.toLowerCase().replace(/\s+/g, '_') : '';
        const brandLogoImgName = brandNameForLogo ? `${brandNameForLogo}.png` : '';
        const brandLogoUrl = brandLogoImgName ? brandLogoBaseUrl + brandLogoImgName : '';

        const displayPriceVal = boiler.price;
        const listPriceVal = boiler.listPrice;
        const isEconomico = typeof displayPriceVal === 'number' && displayPriceVal < 1000;

        let priceHTML = '';
        const formattedDisplayPrice = formatPrice(displayPriceVal);
        if (formattedDisplayPrice) {
            priceHTML += `<span class="price-discounted">${formattedDisplayPrice}</span>`;
            if (listPriceVal && typeof listPriceVal === 'number' && listPriceVal > displayPriceVal) {
                priceHTML = `<span class="price-list">${formatPrice(listPriceVal)}</span> ` + priceHTML;
            }
        } else {
            priceHTML = `<span class="price-discounted no-discount">Prezzo su richiesta</span>`;
        }

        let disponibilityText = "Disponibile";
        let disponibilityClass = "available";
        if (boiler.nearingEndOfStock === true) {
            disponibilityText = "In Esaurimento";
            disponibilityClass = "in-esaurimento";
        }
        
        let novitaBadgeHtml = "";
        if (boiler.novita === true) {
            novitaBadgeHtml = '<span class="status-text status-novita-caldaie" title="Nuovo articolo!"><i class="fas fa-star"></i> Novità</span>';
        }
            
        let storageInfoHtmlBadge = '';
        let accumuloDetailHtmlInfo = '';
        const haAccumuloBooleano = boiler.con_accumulo; 
        const capacitaLitriNumero = boiler.litri_accumulo; 
        if (haAccumuloBooleano === true) {
            let badgeText = ''; 
            let detailText = 'Sì';
            let titleText = 'Accumulo Presente';
            if (typeof capacitaLitriNumero === 'number' && capacitaLitriNumero > 0) {
                badgeText = `${capacitaLitriNumero}L`;
                detailText = `${capacitaLitriNumero} Litri`;
                titleText = `Accumulo: ${capacitaLitriNumero}L`;
            }
            if (badgeText) { 
                storageInfoHtmlBadge = `<span class="storage-badge" title="${titleText}">
                                        <i class="fas fa-box-archive"></i> ${badgeText}
                                   </span>`;
            }
            accumuloDetailHtmlInfo = `<p class="accumulo-info"><strong>Accumulo:</strong> ${detailText} ${!badgeText ? '<i class="fas fa-box-archive storage-icon-inline"></i>' : ''}</p>`;
        }
        
        let documentsLinksHTML = '';
        const datasheetLink = boiler.datasheetUrl 
            ? `<a href="${escapeHtml(boiler.datasheetUrl)}" target="_blank" rel="noopener noreferrer" class="product-link product-datasheet-link"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a>` 
            : '';
        const manualeLink = boiler.manualeUrl 
            ? `<a href="${escapeHtml(boiler.manualeUrl)}" target="_blank" rel="noopener noreferrer" class="product-link product-manual-link"><i class="fas fa-book-open"></i> Manuale</a>`
            : '';
        if (datasheetLink || manualeLink) {
            documentsLinksHTML = `
                <div class="product-documents-links">
                    ${datasheetLink}
                    ${manualeLink}
                </div>`;
        }

        let dimensionsHTML = '';
        if (boiler.dimensions) {
            dimensionsHTML = `<p><strong>Dimensioni (AxLxP):</strong> ${escapeHtml(boiler.dimensions)} mm</p>`;
        }

        card.innerHTML = `
            <div class="card-top-right-elements">
                ${storageInfoHtmlBadge}
                ${isEconomico ? '<span class="economico-badge">ECONOMICO</span>' : ''}
                ${boiler.wifi === true ? '<span class="wifi-icon-display"><i class="fas fa-wifi" title="WiFi Presente"></i></span>' : ''}
            </div>
            <div class="boiler-card-header">
                ${brandLogoUrl ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(boiler.brand || '')} Logo" class="boiler-logo" onerror="this.style.display='none';">` : ''}
                <div class="boiler-title-brand">
                    <h3 class="model">
                        ${escapeHtml(boiler.model || 'Modello non Specificato')}
                        ${novitaBadgeHtml} 
                    </h3>
                    <span class="brand-text">${escapeHtml(boiler.brand || 'Marca non Specificata')}</span>
                </div>
            </div>
            <div class="boiler-card-body-flex">
                <div class="boiler-card-info-column">
                    <div class="boiler-info">
                        ${boiler.powerKw ? `<p><strong>Potenza:</strong> ${escapeHtml(String(boiler.powerKw))} kW</p>` : ''}
                        ${dimensionsHTML} 
                        ${boiler.productCode ? `<p><strong>Codice:</strong> ${escapeHtml(boiler.productCode)}</p>` : ''}
                        ${boiler.type ? `<p><strong>Tipologia:</strong> ${escapeHtml(boiler.type)}</p>` : ''}
                        <p class="availability ${disponibilityClass}"><strong>Disponibilità:</strong> ${escapeHtml(disponibilityText)}</p>
                        ${accumuloDetailHtmlInfo}
                        ${documentsLinksHTML} 
                    </div>
                </div>
                <div class="boiler-card-image-column">
                    <div class="image-container">
                        <img src="${escapeHtml(productImgUrl)}" alt="Immagine ${escapeHtml(boiler.model || 'Caldaia')}"
                             onerror="this.onerror=null; this.src='${escapeHtml(placeholderImage)}'; this.alt='Immagine prodotto non disponibile';">
                    </div>
                </div>
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
                noResultsMessage.textContent = auth.currentUser ? 'Nessun prodotto trovato con i filtri selezionati.' : 'Nessun listino disponibile al momento.';
                noResultsMessage.style.display = 'block';
            }
            return;
        }
        
        if (noResultsMessage) noResultsMessage.style.display = 'none';

        boilersToDisplay.forEach(boiler => {
            boilerListContainer.appendChild(createBoilerCard(boiler));
        });
    }

    function showBoilerDetailsPopup(boiler) {
        if (!boilerDetailsPopupOverlay || !boilerDetailsPopupContentArea || !popupBoilerTitle) return;
        popupBoilerTitle.textContent = escapeHtml(boiler.model || "Dettagli Caldaia");
        boilerDetailsPopupContentArea.innerHTML = '';
    
        for (const fieldKey of Object.keys(ALL_BOILER_FIELDS_MAP)) {
            const displayLabel = ALL_BOILER_FIELDS_MAP[fieldKey];
            let value = boiler[fieldKey];
            let displayValueHtml = '';
    
            if (fieldKey === 'litri_accumulo') {
                if (boiler.con_accumulo !== true) continue;
                value = (typeof value === 'number' && value > 0) ? `${value} Litri` : "Sì (capacità non specificata)";
            }

            const isValueMissing = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
            
            if (isValueMissing) {
                if (value === false) { // Gestisce booleani che sono false
                    displayValueHtml = 'No';
                } else {
                    continue; // Salta altri campi mancanti
                }
            } else if (typeof value === 'boolean') {
                displayValueHtml = value ? 'Sì' : 'No';
            } else if (['datasheetUrl', 'manualeUrl'].includes(fieldKey)) {
                displayValueHtml = `<a href="${escapeHtml(String(value))}" target="_blank" rel="noopener noreferrer">${escapeHtml(String(value))}</a>`;
            } else if (['price', 'listPrice'].includes(fieldKey)) {
                displayValueHtml = formatPrice(value) || '<span class="unknown-value">N/D</span>';
            } else {
                displayValueHtml = escapeHtml(String(value));
            }
            
            boilerDetailsPopupContentArea.innerHTML += `<p><strong>${escapeHtml(displayLabel)}:</strong> <span class="popup-value">${displayValueHtml}</span></p>`;
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

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut();
        });
    }

    async function loadAndDisplayPrimaryData() {
        if (!authInitialized) {
            console.log("Auth non ancora inizializzato, in attesa...");
            return; 
        }

        if (!auth.currentUser) {
            console.log("Nessun utente loggato. Accesso ai listini negato.");
            if(boilerListContainer) boilerListContainer.innerHTML = ''; 
            if(noResultsMessage) {
                noResultsMessage.textContent = 'Accesso ai listini riservato. Per favore, contatta l\'amministratore per le credenziali.';
                noResultsMessage.style.display = 'block';
            }
            if(loadingIndicator) loadingIndicator.style.display = 'none';
            
            if (brandFilterButtonsContainer) brandFilterButtonsContainer.innerHTML = `<p style="color: var(--secondary-color); font-size: 0.9em; text-align: center; width:100%;">Area riservata. Accesso richiesto.</p>`;
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
            applyFiltersAndSearch(); 
        } else if(auth.currentUser){
            if (noResultsMessage) {
                 noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.';
                 noResultsMessage.style.display = 'block';
            }
            if (brandFilterButtonsContainer) brandFilterButtonsContainer.innerHTML = '';
        }
        updateResetButtonVisibility();
    }

    async function initializeCaldaiePage() {
        if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();
        if (metadataListener) metadataListener(); 
        if(dataUpdateDateEl) dataUpdateDateEl.textContent = "Caricamento...";
            
        auth.onAuthStateChanged(async user => { 
            authInitialized = true; 

            if (user) {
                console.log("Utente Autenticato:", user.email);
                if(headerUserInfo) headerUserInfo.style.display = 'block';
                if(userEmailDisplay) userEmailDisplay.textContent = user.email;
                if(logoutButton) logoutButton.style.display = 'inline-flex';
                
                metadataListener = db.collection('metadata').doc('listiniInfo')
                    .onSnapshot(doc => {
                        if (dataUpdateDateEl) {
                            if (doc.exists && doc.data()?.caldaieLastUpdate) { 
                                const ts = doc.data().caldaieLastUpdate;
                                const date = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null);
                                dataUpdateDateEl.textContent = date ? date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : "Non disponibile";
                            } else { dataUpdateDateEl.textContent = "Non specificato"; }
                        }
                    }, error => {
                        console.error("Error fetching metadata for update date:", error);
                        if (dataUpdateDateEl) dataUpdateDateEl.textContent = "Errore caricamento data";
                    });
            } else {
                console.log("Utente non autenticato.");
                if(headerUserInfo) headerUserInfo.style.display = 'none';
                if(userEmailDisplay) userEmailDisplay.textContent = '';
                if(logoutButton) logoutButton.style.display = 'none';
                if (dataUpdateDateEl) dataUpdateDateEl.textContent = "Accesso richiesto";
            }
            
            await loadAndDisplayPrimaryData(); 
        });
    }

    initializeCaldaiePage();
    
}); // QUESTA PARENTESI CHIUDE L'EVENTO document.addEventListener
