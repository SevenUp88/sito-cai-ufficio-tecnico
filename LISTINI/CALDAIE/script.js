// --- SCRIPT COMPLETO E DEFINITIVO PER LA PAGINA CALDAIE ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Contenuto Caricato - Inizio script.js");

    // --- 1. CONFIGURAZIONE E INIZIALIZZAZIONE ---
    const firebaseConfig = {
      apiKey: "AIzaSyC6tvhoIlvIyh8L_jwSVWs_TkXNLKrt540",
      authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
      projectId: "consorzio-artigiani-idraulici",
      storageBucket: "consorzio-artigiani-idraulici.appspot.com",
      messagingSenderId: "136848104008",
      appId: "1:136848104008:web:2724f60607dbe91d09d67d",
      measurementId: "G-NNPV2607G7"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- 2. RIFERIMENTI AGLI ELEMENTI DEL DOM ---
    const boilerListContainer = document.getElementById('boiler-list-container');
    const brandFilterButtonsContainer = document.getElementById('brand-filter-buttons');
    const economicoFilterBtn = document.getElementById('economico-filter-btn');
    const searchInput = document.getElementById('search-input');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results-message');
    const dataUpdateDateEl = document.getElementById('data-update-date');
    const currentYearEl = document.getElementById('current-year');
    const headerUserInfo = document.querySelector('.header-user-info');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const boilerDetailsPopupOverlay = document.getElementById('boiler-details-popup-overlay');
    const boilerDetailsPopupContentArea = document.getElementById('popup-boiler-content-area');
    const closeBoilerDetailsPopupBtn = document.getElementById('close-boiler-details-popup');
    const popupBoilerTitle = document.getElementById('popup-boiler-title');

    // --- 3. STATO E COSTANTI DELL'APPLICAZIONE ---
    let allBoilers = [];
    let currentFilters = { brand: "", economico: false, searchTerm: "" };
    let metadataListener = null;
    const imageBaseUrl = '../../images/prodotti/caldaie/'; // Path corretto
    const brandLogoBaseUrl = '../../images/logos/'; // Path corretto
    const placeholderImage = imageBaseUrl + 'placeholder.png';
    const ALL_BOILER_FIELDS_MAP = {
        brand: "Marca", model: "Modello", productCode: "Codice Articolo",
        type: "Tipologia", powerKw: "Potenza (kW)",
        dimensions: "Dimensioni AxLxP (mm)", 
        weightKg: "Peso (kg)", price: "Prezzo", 
        listPrice: "Prezzo di Listino", 
        nearingEndOfStock: "Articolo in Esaurimento", builtIn: "Incasso",
        litri_accumulo: "Capacità Accumulo", 
        outdoorInstallation: "Da Esterno", withBase: "Con Basamento",
        splitterIncluded: "Sdoppiatore Incluso", sanitaryPower: "Potenza Sanitario (kW)",
        heatingPower: "Potenza Riscaldamento (kW)",
        datasheetUrl: "Scheda Tecnica",
        manualeUrl: "Manuale", 
        wifi: "WiFi Presente",
        novita: "Novità Prodotto"
    };

    // --- 4. TUTTE LE FUNZIONI DELLA PAGINA ---

    function escapeHtml(unsafeString) {
        if (typeof unsafeString !== 'string') unsafeString = String(unsafeString || '');
        return unsafeString.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "'").replace(/'/g, "'");
    }

    function formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) return null;
        return price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    }

    async function fetchBoilersFromFirestore() {
        console.log("Fetching 'prodottiCaldaie' from Firestore...");
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        if (boilerListContainer) boilerListContainer.innerHTML = '';
        try {
            const snapshot = await db.collection('prodottiCaldaie').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => { const data = doc.data(); return { id: doc.id, brand: data.marca, model: data.modello, imageName: data.nome_immagine, productCode: data.codice_prodotto, price: data.prezzo, nearingEndOfStock: data.articolo_in_esaurimento, novita: data.novita, powerKw: data.potenza_kw, type: data.tipologia, builtIn: data.incasso, con_accumulo: data.con_accumulo, litri_accumulo: data.litri_accumulo, outdoorInstallation: data.da_esterno, withBase: data.con_basamento, splitterIncluded: data.sdoppiatore_incluso, dimensions: data.dimensioni, weightKg: data.peso, datasheetUrl: data.scheda_tecnica_url, manualeUrl: data.manuale_url, wifi: data.wifi, sanitaryPower: data.potenza_sanitario, heatingPower: data.potenza_riscaldamento, classe_efficienza: data.classe_efficienza, listPrice: data.prezzo_listino || null }; });
        } catch (error) {
            console.error("Error fetching boilers:", error);
            if (noResultsMessage) {
                if (error.code === 'permission-denied') { noResultsMessage.textContent = 'Accesso ai listini non autorizzato. Contatta l\'amministratore.'; } 
                else { noResultsMessage.textContent = 'Errore nel caricamento dei listini. Riprova più tardi.'; }
                noResultsMessage.style.display = 'block';
            }
            return [];
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    function populateFilterButtons(boilers) {
        const brands = new Set();
        boilers.forEach(boiler => { if (boiler.brand) brands.add(boiler.brand); });
        if (!brandFilterButtonsContainer) return;
        brandFilterButtonsContainer.innerHTML = ''; 
        const allBrandsBtn = document.createElement('button');
        allBrandsBtn.className = 'filter-btn active';
        allBrandsBtn.textContent = 'Tutte le Marche';
        allBrandsBtn.dataset.filterValue = '';
        allBrandsBtn.addEventListener('click', () => handleFilterButtonClick(allBrandsBtn));
        brandFilterButtonsContainer.appendChild(allBrandsBtn);
        Array.from(brands).sort().forEach(brandName => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = brandName;
            btn.dataset.filterValue = brandName;
            btn.addEventListener('click', () => handleFilterButtonClick(btn));
            brandFilterButtonsContainer.appendChild(btn);
        });
    }

    function handleFilterButtonClick(clickedButton) {
        currentFilters.brand = clickedButton.dataset.filterValue;
        if (brandFilterButtonsContainer) {
            brandFilterButtonsContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        }
        clickedButton.classList.add('active');
        applyFiltersAndSearch();
    }
    
    function updateResetButtonVisibility() {
        if (!resetFiltersBtn) return;
        resetFiltersBtn.style.display = (currentFilters.brand || currentFilters.economico || currentFilters.searchTerm) ? 'inline-block' : 'none';
    }

    function applyFiltersAndSearch() {
        let filteredBoilers = allBoilers.filter(boiler => {
            const brandMatch = !currentFilters.brand || boiler.brand === currentFilters.brand;
            const economicoMatch = !currentFilters.economico || (boiler.price && boiler.price < 1000);
            const searchMatch = !currentFilters.searchTerm ||
                (boiler.model || '').toLowerCase().includes(currentFilters.searchTerm) ||
                (boiler.productCode || '').toLowerCase().includes(currentFilters.searchTerm);
            return brandMatch && economicoMatch && searchMatch;
        });
        displayBoilers(filteredBoilers);
        updateResetButtonVisibility();
    }
    
    function createBoilerCard(boiler) {
        const card = document.createElement('div');
        card.classList.add('boiler-card');
        card.dataset.boilerId = boiler.id;

        if (boiler.brand) {
            card.classList.add(`brand-${boiler.brand.toLowerCase().replace(/\s+/g, '-')}`);
        }
        card.addEventListener('click', () => showBoilerDetailsPopup(boiler));

        const productImgUrl = imageBaseUrl + (boiler.imageName || 'placeholder.png');
        const brandLogoUrl = boiler.brand ? `${brandLogoBaseUrl}${boiler.brand.toLowerCase().replace(/\s+/g, '_')}.png` : '';

        let priceHTML = formatPrice(boiler.price) ? `<span class="price-discounted">${formatPrice(boiler.price)}</span>` : `<span class="price-discounted no-discount">Prezzo su richiesta</span>`;
        if (boiler.listPrice && boiler.listPrice > boiler.price) {
            priceHTML = `<span class="price-list">${formatPrice(boiler.listPrice)}</span> ` + priceHTML;
        }

        const disponibilityText = boiler.nearingEndOfStock ? "In Esaurimento" : "Disponibile";
        const disponibilityClass = boiler.nearingEndOfStock ? "in-esaurimento" : "available";
        const novitaBadgeHtml = boiler.novita ? '<span class="status-text status-novita-caldaie" title="Nuovo articolo!"><i class="fas fa-star"></i> Novità</span>' : '';
        let storageInfoHtmlBadge = '';
        if (boiler.con_accumulo && boiler.litri_accumulo > 0) {
            storageInfoHtmlBadge = `<span class="storage-badge" title="Accumulo: ${boiler.litri_accumulo}L"><i class="fas fa-box-archive"></i> ${boiler.litri_accumulo}L</span>`;
        }

        const datasheetLink = boiler.datasheetUrl ? `<a href="${escapeHtml(boiler.datasheetUrl)}" target="_blank" rel="noopener noreferrer" class="product-link"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a>` : '';
        const manualeLink = boiler.manualeUrl ? `<a href="${escapeHtml(boiler.manualeUrl)}" target="_blank" rel="noopener noreferrer" class="product-link"><i class="fas fa-book-open"></i> Manuale</a>` : '';

        card.innerHTML = `
            <div class="card-top-right-elements">${storageInfoHtmlBadge}</div>
            <div class="boiler-card-header">
                ${brandLogoUrl ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(boiler.brand)}" class="boiler-logo" onerror="this.style.display='none';">` : ''}
                <div class="boiler-title-brand">
                    <h3 class="model">${escapeHtml(boiler.model || 'N/D')} ${novitaBadgeHtml}</h3>
                    <span class="brand-text">${escapeHtml(boiler.brand || 'N/D')}</span>
                </div>
            </div>
            <div class="boiler-card-body-flex">
                <div class="boiler-card-info-column">
                    <div class="boiler-info">
                        ${boiler.powerKw ? `<p><strong>Potenza:</strong> ${escapeHtml(String(boiler.powerKw))} kW</p>` : ''}
                        ${boiler.dimensions ? `<p><strong>Dimensioni:</strong> ${escapeHtml(boiler.dimensions)}</p>` : ''} 
                        ${boiler.productCode ? `<p><strong>Codice:</strong> ${escapeHtml(boiler.productCode)}</p>` : ''}
                        <p class="availability ${disponibilityClass}"><strong>Disponibilità:</strong> ${disponibilityText}</p>
                        <div class="product-documents-links">${datasheetLink} ${manualeLink}</div>
                    </div>
                </div>
                <div class="boiler-card-image-column">
                    <img src="${escapeHtml(productImgUrl)}" alt="Immagine ${escapeHtml(boiler.model)}" onerror="this.onerror=null; this.src='${escapeHtml(placeholderImage)}';">
                </div>
            </div>
            <div class="boiler-card-footer"><div class="price-section">${priceHTML}</div></div>`;
        return card;
    }

    function displayBoilers(boilersToDisplay) {
        if (!boilerListContainer) return;
        boilerListContainer.innerHTML = '';
        if (boilersToDisplay.length === 0) {
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Nessun prodotto trovato con i filtri selezionati.';
                noResultsMessage.style.display = 'block';
            }
            return;
        }
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        boilersToDisplay.forEach(boiler => boilerListContainer.appendChild(createBoilerCard(boiler)));
    }

    function showBoilerDetailsPopup(boiler) {
        if (!boilerDetailsPopupOverlay || !boilerDetailsPopupContentArea || !popupBoilerTitle) return;
        popupBoilerTitle.textContent = escapeHtml(boiler.model || "Dettagli Caldaia");
        boilerDetailsPopupContentArea.innerHTML = '';
        
        for (const fieldKey of Object.keys(ALL_BOILER_FIELDS_MAP)) {
            if (Object.prototype.hasOwnProperty.call(boiler, fieldKey)) {
                let value = boiler[fieldKey];
                const displayLabel = ALL_BOILER_FIELDS_MAP[fieldKey];
                
                if (value === null || value === undefined || value === '') continue;

                let displayValueHtml = '';
                if (typeof value === 'boolean') {
                    displayValueHtml = value ? 'Sì' : 'No';
                } else if (fieldKey === 'price' || fieldKey === 'listPrice') {
                    displayValueHtml = formatPrice(value);
                } else if (fieldKey === 'datasheetUrl' || fieldKey === 'manualeUrl') {
                    displayValueHtml = `<a href="${escapeHtml(String(value))}" target="_blank" rel="noopener noreferrer">${escapeHtml(String(value))}</a>`;
                } else {
                    displayValueHtml = escapeHtml(String(value));
                }
                
                if (displayValueHtml) {
                    boilerDetailsPopupContentArea.innerHTML += `<p><strong>${escapeHtml(displayLabel)}:</strong> <span class="popup-value">${displayValueHtml}</span></p>`;
                }
            }
        }
        boilerDetailsPopupOverlay.style.display = 'flex';
    }

    // --- 5. PUNTO DI INGRESSO E GESTIONE DELLO STATO DI AUTENTICAZIONE ---

    if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

    // Imposta tutti i listener degli elementi statici
    if (economicoFilterBtn) economicoFilterBtn.addEventListener('click', () => { currentFilters.economico = !currentFilters.economico; economicoFilterBtn.classList.toggle('active', currentFilters.economico); applyFiltersAndSearch(); });
    if (searchInput) searchInput.addEventListener('input', (e) => { currentFilters.searchTerm = e.target.value.toLowerCase().trim(); clearTimeout(searchInput.searchTimeout); searchInput.searchTimeout = setTimeout(applyFiltersAndSearch, 300); });
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => { currentFilters = { brand: "", economico: false, searchTerm: "" }; if (searchInput) searchInput.value = ""; populateFilterButtons(allBoilers); applyFiltersAndSearch(); });
    if (logoutButton) logoutButton.addEventListener('click', () => auth.signOut());
    if (closeBoilerDetailsPopupBtn) closeBoilerDetailsPopupBtn.addEventListener('click', () => { if (boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.style.display = 'none'; });
    if (boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.addEventListener('click', (e) => { if (e.target === boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.style.display = 'none'; });

    // Listener principale che avvia la logica della pagina
    auth.onAuthStateChanged(user => {
        if (user) {
            // --- L'UTENTE È AUTENTICATO ---
            console.log("Stato Auth: Utente Autenticato ->", user.email);

            // Aggiorna l'interfaccia per lo stato "loggato"
            if (headerUserInfo) headerUserInfo.style.display = 'block';
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            if (logoutButton) logoutButton.style.display = 'inline-flex';
            if (searchInput) searchInput.disabled = false;
            if (economicoFilterBtn) economicoFilterBtn.style.display = 'inline-block';
            
            // Avvia listener per data ultimo aggiornamento
            if (metadataListener) metadataListener(); // Disattiva il precedente
            metadataListener = db.collection('metadata').doc('listiniInfo').onSnapshot(doc => {
                if (dataUpdateDateEl) {
                    const ts = doc.exists ? doc.data()?.caldaieLastUpdate : null;
                    const date = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null);
                    dataUpdateDateEl.textContent = date ? date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : "Caricamento...";
                }
            });

            // Carica i dati dei listini
            (async () => {
                allBoilers = await fetchBoilersFromFirestore();
                if (allBoilers.length > 0) {
                    populateFilterButtons(allBoilers);
                    applyFiltersAndSearch();
                } else if (auth.currentUser) { // Controlla di nuovo per evitare race condition
                    if(noResultsMessage && noResultsMessage.style.display !== 'block'){
                         noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.';
                         noResultsMessage.style.display = 'block';
                    }
                }
            })();

        } else {
            // --- L'UTENTE NON È AUTENTICATO ---
            console.log("Stato Auth: Utente NON Autenticato.");

            // Resetta e blocca l'interfaccia utente
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (headerUserInfo) headerUserInfo.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
            if (dataUpdateDateEl) dataUpdateDateEl.textContent = "Accesso richiesto";
            if (brandFilterButtonsContainer) brandFilterButtonsContainer.innerHTML = '';
            if (boilerListContainer) boilerListContainer.innerHTML = '';
            if (searchInput) { searchInput.value = ''; searchInput.disabled = true; }
            if (economicoFilterBtn) economicoFilterBtn.style.display = 'none';
            if (resetFiltersBtn) resetFiltersBtn.style.display = 'none';
            
            // Mostra il messaggio di accesso negato
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Accesso ai listini riservato. Per favore, contatta l\'amministratore per le credenziali.';
                noResultsMessage.style.display = 'block';
            }
        }
    });
});
