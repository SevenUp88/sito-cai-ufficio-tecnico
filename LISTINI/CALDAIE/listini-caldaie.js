// --- File: listini-caldaie.js ---
// Questo script contiene SOLO la logica per la pagina dei listini caldaie.
// Si affida ai file globali 'firebase-config.js' e 'auth.js' per l'inizializzazione
// di Firebase e per la gestione dell'autenticazione.

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Contenuto Caricato - Inizio listini-caldaie.js");

    // NOTA: Le variabili 'firebase', 'auth', e 'db' sono già state create 
    // e rese disponibili a livello globale (window) da 'firebase-config.js'.
    
    // --- Riferimenti agli Elementi del DOM ---
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

    // --- Stato dell'applicazione ---
    let allBoilers = [];
    let currentFilters = { brand: "", economico: false, searchTerm: "" };
    let metadataListener = null;
    const imageBaseUrl = 'img/';
const brandLogoBaseUrl = 'img/logos/';
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

    // --- Funzioni della Pagina ---

    function escapeHtml(unsafeString) {
        if (typeof unsafeString !== 'string') unsafeString = String(unsafeString || '');
        return unsafeString.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "'").replace(/'/g, "'");
    }

    function formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) return null;
        return price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    }

    async function fetchBoilersFromFirestore() {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        try {
            const snapshot = await db.collection('prodottiCaldaie').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, brand: data.marca, model: data.modello, imageName: data.nome_immagine, 
                    productCode: data.codice_prodotto, price: data.prezzo, 
                    nearingEndOfStock: data.articolo_in_esaurimento, novita: data.novita, 
                    powerKw: data.potenza_kw, type: data.tipologia, builtIn: data.incasso, 
                    con_accumulo: data.con_accumulo, litri_accumulo: data.litri_accumulo, 
                    outdoorInstallation: data.da_esterno, withBase: data.con_basamento, 
                    splitterIncluded: data.sdoppiatore_incluso, dimensions: data.dimensioni, 
                    weightKg: data.peso, datasheetUrl: data.scheda_tecnica_url, 
                    manualeUrl: data.manuale_url, wifi: data.wifi, 
                    sanitaryPower: data.potenza_sanitario, heatingPower: data.potenza_riscaldamento, 
                    classe_efficienza: data.classe_efficienza, listPrice: data.prezzo_listino || null 
                };
            });
        } catch (error) {
            console.error("Errore nel caricare i listini caldaie:", error);
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Errore nel caricamento dei dati. Riprova più tardi.';
                noResultsMessage.style.display = 'block';
            }
            return [];
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }
    
    function populateFilterButtons(boilers) {
        const brands = new Set(boilers.map(b => b.brand).filter(Boolean));
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

    function updateResetButtonVisibility() {
        if (!resetFiltersBtn) return;
        resetFiltersBtn.style.display = (currentFilters.brand || currentFilters.economico || currentFilters.searchTerm) ? 'inline-block' : 'none';
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
    
    function createBoilerCard(boiler) {
        const card = document.createElement('div');
        card.className = 'boiler-card';
        card.addEventListener('click', () => showBoilerDetailsPopup(boiler));
        const productImgUrl = imageBaseUrl + (boiler.imageName || 'placeholder.png');
        let priceHTML = formatPrice(boiler.price) || "Prezzo su richiesta";
        card.innerHTML = `
            <div class="boiler-card-header">
                <h3>${escapeHtml(boiler.model || 'N/D')}</h3>
            </div>
            <div class="boiler-card-body-flex">
                 <div class="boiler-card-info-column">
                    <p><strong>Marca:</strong> ${escapeHtml(boiler.brand || 'N/D')}</p>
                    <p><strong>Codice:</strong> ${escapeHtml(boiler.productCode || 'N/D')}</p>
                 </div>
                 <div class="boiler-card-image-column">
                    <img src="${escapeHtml(productImgUrl)}" alt="${escapeHtml(boiler.model)}" onerror="this.onerror=null; this.src='${escapeHtml(placeholderImage)}';">
                 </div>
            </div>
            <div class="boiler-card-footer">
                <span class="price">${priceHTML}</span>
            </div>
        `;
        return card;
    }

    function showBoilerDetailsPopup(boiler) {
        if (!boilerDetailsPopupOverlay) return;
        if (popupBoilerTitle) popupBoilerTitle.textContent = escapeHtml(boiler.model || "Dettagli");
        if (boilerDetailsPopupContentArea) {
            boilerDetailsPopupContentArea.innerHTML = '';
            for (const fieldKey in ALL_BOILER_FIELDS_MAP) {
                let value = boiler[fieldKey];
                if (value !== undefined && value !== null && value !== '') {
                    boilerDetailsPopupContentArea.innerHTML += `<p><strong>${ALL_BOILER_FIELDS_MAP[fieldKey]}:</strong> ${escapeHtml(value)}</p>`;
                }
            }
        }
        boilerDetailsPopupOverlay.style.display = 'flex';
    }

    // --- Punto di ingresso e Gestione Logica ---
    
    function initializePage(user) {
        if (user) {
            // L'utente è loggato e riconosciuto
            console.log(`Pagina Caldaie: Utente ${user.email} riconosciuto. Inizializzazione...`);
            if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

            // Attiva UI
            if (searchInput) searchInput.disabled = false;
            if (economicoFilterBtn) economicoFilterBtn.style.display = 'inline-block';
            
            // Listener per data aggiornamento
            if (metadataListener) metadataListener(); // Disattiva il precedente se esiste
            metadataListener = db.collection('metadata').doc('listiniInfo').onSnapshot(doc => {
                if (dataUpdateDateEl) {
                    const ts = doc.exists ? doc.data()?.caldaieLastUpdate : null;
                    const date = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null);
                    dataUpdateDateEl.textContent = date ? date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : "--";
                }
            });

            // Carica i dati
            (async () => {
                allBoilers = await fetchBoilersFromFirestore();
                if (allBoilers.length > 0) {
                    populateFilterButtons(allBoilers);
                    applyFiltersAndSearch();
                } else if (auth.currentUser) {
                     if (noResultsMessage) {
                        noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.';
                        noResultsMessage.style.display = 'block';
                    }
                }
            })();

        } else {
            // L'utente non è loggato, auth.js dovrebbe aver già reindirizzato.
            // Questa è una sicurezza aggiuntiva.
            console.log("Pagina Caldaie: Nessun utente. L'accesso dovrebbe essere bloccato da auth.js.");
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Accesso non autorizzato. Verrai reindirizzato alla pagina di login.';
                noResultsMessage.style.display = 'block';
                // Aggiungiamo un reindirizzamento forzato dopo un breve ritardo
                setTimeout(() => {
                    if (!auth.currentUser) {
                         window.location.href = '../../index.html';
                    }
                }, 2000);
            }
        }
    }
    
    // --- Avvio dello script ---
    
    // Registra i listener degli elementi UI statici
    if (economicoFilterBtn) economicoFilterBtn.addEventListener('click', () => { currentFilters.economico = !currentFilters.economico; economicoFilterBtn.classList.toggle('active', currentFilters.economico); applyFiltersAndSearch(); });
    if(searchInput) searchInput.addEventListener('input', (e) => { currentFilters.searchTerm = e.target.value.toLowerCase().trim(); clearTimeout(searchInput.searchTimeout); searchInput.searchTimeout = setTimeout(applyFiltersAndSearch, 300); });
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => { currentFilters = { brand: "", economico: false, searchTerm: "" }; if (searchInput) searchInput.value = ""; populateFilterButtons(allBoilers); applyFiltersAndSearch(); });
    if (closeBoilerDetailsPopupBtn) closeBoilerDetailsPopupBtn.addEventListener('click', () => { if (boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.style.display = 'none'; });
    if (boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.addEventListener('click', (e) => { if (e.target === boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.style.display = 'none'; });
    
    // Lo script 'auth.js' gestisce il logout, quindi qui non è necessario
    
    // Ascoltiamo lo stato di autenticazione come unico punto di avvio
    auth.onAuthStateChanged(initializePage);

});
