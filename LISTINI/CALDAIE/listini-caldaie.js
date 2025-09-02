// --- File: listini-caldaie.js (con card aggiornate - VERSIONE 100% COMPLETA) ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Contenuto Caricato - Inizio listini-caldaie.js");
    
    // --- Inizializzazione Firebase e riferimenti DOM ---
    const db = firebase.firestore();
    const auth = firebase.auth();
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

    // --- Stato e costanti ---
    let allBoilers = [];
    let currentFilters = { brand: "", economico: false, searchTerm: "" };
    let metadataListener = null;
    const imageBaseUrl = 'img/';
    const brandLogoBaseUrl = 'img/logos/';
    const placeholderImage = '../../placeholder.png';
    const ALL_BOILER_FIELDS_MAP = {
        brand: "Marca", model: "Modello", productCode: "Codice Articolo",
        type: "Tipologia", powerKw: "Potenza (kW)", dimensions: "Dimensioni AxLxP (mm)", 
        weightKg: "Peso (kg)", price: "Prezzo", listPrice: "Prezzo di Listino", 
        nearingEndOfStock: "Articolo in Esaurimento", builtIn: "Incasso", 
        litri_accumulo: "Capacità Accumulo", outdoorInstallation: "Da Esterno", 
        withBase: "Con Basamento", splitterIncluded: "Sdoppiatore Incluso", 
        sanitaryPower: "Potenza Sanitario (kW)", heatingPower: "Potenza Riscaldamento (kW)",
        datasheetUrl: "Scheda Tecnica", manualeUrl: "Manuale", 
        wifi: "WiFi Presente", novita: "Novità Prodotto"
    };

    // --- Funzioni Utility ---
    function escapeHtml(unsafeString) {
        if (typeof unsafeString !== 'string') unsafeString = String(unsafeString || '');
        return unsafeString.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "'").replace(/'/g, "'");
    }

    function formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) return "Prezzo su richiesta";
        return price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    }

    async function fetchBoilersFromFirestore() {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        if (boilerListContainer) boilerListContainer.innerHTML = '';
        try {
            const snapshot = await db.collection('prodottiCaldaie').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => { const data = doc.data(); return { id: doc.id, brand: data.marca, model: data.modello, imageName: data.nome_immagine, productCode: data.codice_prodotto, price: data.prezzo, nearingEndOfStock: data.articolo_in_esaurimento, novita: data.novita, powerKw: data.potenza_kw, type: data.tipologia, builtIn: data.incasso, con_accumulo: data.con_accumulo, litri_accumulo: data.litri_accumulo, outdoorInstallation: data.da_esterno, withBase: data.con_basamento, splitterIncluded: data.sdoppiatore_incluso, dimensions: data.dimensioni, weightKg: data.peso, datasheetUrl: data.scheda_tecnica_url, manualeUrl: data.manuale_url, wifi: data.wifi, sanitaryPower: data.potenza_sanitario, heatingPower: data.potenza_riscaldamento, classe_efficienza: data.classe_efficienza, listPrice: data.prezzo_listino || null }; });
        } catch (error) {
            console.error("Errore nel caricare i listini caldaie:", error);
            if (noResultsMessage) { noResultsMessage.textContent = 'Errore nel caricamento dei dati.'; noResultsMessage.style.display = 'block'; }
            return [];
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }
    
    // --- FUNZIONE createBoilerCard (MODIFICATA COME RICHIESTO) ---
    function createBoilerCard(boiler) {
        const card = document.createElement('div');
        card.className = 'boiler-card';
        card.addEventListener('click', () => showBoilerDetailsPopup(boiler));

        const novitaSticker = boiler.novita ? '<span class="card-sticker novita">NOVITÀ</span>' : '';
        const accumuloSticker = (boiler.con_accumulo && boiler.litri_accumulo) ? `<span class="card-sticker accumulo">${boiler.litri_accumulo} L</span>` : '';
        const esaurimentoText = boiler.nearingEndOfStock ? '<p class="availability in-esaurimento"><i class="fas fa-exclamation-triangle"></i> In esaurimento</p>' : '';
        const datasheetBtn = boiler.datasheetUrl ? `<a href="${escapeHtml(boiler.datasheetUrl)}" target="_blank" rel="noopener noreferrer" class="card-link-button scheda-tecnica" onclick="event.stopPropagation()"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a>` : '';
        const manualeBtn = boiler.manualeUrl ? `<a href="${escapeHtml(boiler.manualeUrl)}" target="_blank" rel="noopener noreferrer" class="card-link-button manuale" onclick="event.stopPropagation()"><i class="fas fa-book"></i> Manuale</a>` : '';
        const linksContainer = (datasheetBtn || manualeBtn) ? `<div class="card-links-container">${datasheetBtn}${manualeBtn}</div>` : '';
        
        const productImgUrl = imageBaseUrl + (boiler.imageName || 'placeholder.png');
        const brandLogoUrl = boiler.brand ? `${brandLogoBaseUrl}${boiler.brand.toLowerCase().replace(/\s+/g, '_')}.png` : '';
        const priceHTML = formatPrice(boiler.price);

        card.innerHTML = `
            <div class="card-stickers-container">
                ${accumuloSticker}
                ${novitaSticker}
            </div>
            <div class="boiler-card-header">
                 ${brandLogoUrl ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(boiler.brand)}" class="boiler-logo" onerror="this.style.display='none';">` : ''}
                <h3>${escapeHtml(boiler.model || 'N/D')}</h3>
            </div>
            <div class="boiler-card-body-flex">
                 <div class="boiler-card-info-column">
                    <p><strong>Codice:</strong> ${escapeHtml(boiler.productCode || 'N/D')}</p>
                    ${boiler.dimensions ? `<p><strong>Dimensioni:</strong> ${escapeHtml(boiler.dimensions)}</p>` : ''}
                    ${esaurimentoText}
                 </div>
                 <div class="boiler-card-image-column">
                    <img src="${escapeHtml(productImgUrl)}" alt="${escapeHtml(boiler.model)}" onerror="this.onerror=null; this.src='${escapeHtml(placeholderImage)}';">
                 </div>
            </div>
            <div class="boiler-card-footer">
                <span class="price">${priceHTML}</span>
                ${linksContainer}
            </div>
        `;
        return card;
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
            if (noResultsMessage) { noResultsMessage.textContent = 'Nessun prodotto trovato con i filtri selezionati.'; noResultsMessage.style.display = 'block'; }
            return;
        }
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        boilersToDisplay.forEach(boiler => boilerListContainer.appendChild(createBoilerCard(boiler)));
    }
    
    function showBoilerDetailsPopup(boiler) {
        if (!boilerDetailsPopupOverlay) return;
        if (popupBoilerTitle) popupBoilerTitle.textContent = escapeHtml(boiler.model || "Dettagli");
        if (boilerDetailsPopupContentArea) {
            boilerDetailsPopupContentArea.innerHTML = '';
            for (const fieldKey in ALL_BOILER_FIELDS_MAP) {
                let value = boiler[fieldKey];
                if (value !== undefined && value !== null && value !== '') { boilerDetailsPopupContentArea.innerHTML += `<p><strong>${ALL_BOILER_FIELDS_MAP[fieldKey]}:</strong> ${escapeHtml(value)}</p>`; }
            }
        }
        boilerDetailsPopupOverlay.style.display = 'flex';
    }

    function initializePage(user) {
        if (user) {
            console.log(`Pagina Caldaie: Utente ${user.email} riconosciuto. Inizializzazione...`);
            if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();
            if (searchInput) searchInput.disabled = false;
            if (economicoFilterBtn) economicoFilterBtn.style.display = 'inline-block';
            if (metadataListener) metadataListener();
            metadataListener = db.collection('metadata').doc('listiniInfo').onSnapshot(doc => {
                if (dataUpdateDateEl) {
                    const ts = doc.exists ? doc.data()?.caldaieLastUpdate : null;
                    const date = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null);
                    dataUpdateDateEl.textContent = date ? date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : "--";
                }
            });
            (async () => {
                allBoilers = await fetchBoilersFromFirestore();
                if (allBoilers.length > 0) {
                    populateFilterButtons(allBoilers);
                    applyFiltersAndSearch();
                } else if (auth.currentUser) {
                     if (noResultsMessage) { noResultsMessage.textContent = 'Nessun listino caldaie disponibile.'; noResultsMessage.style.display = 'block'; }
                }
            })();
        } else {
            console.log("Pagina Caldaie: Nessun utente.");
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Accesso non autorizzato. Verrai reindirizzato.';
                noResultsMessage.style.display = 'block';
                setTimeout(() => { if (!auth.currentUser) { window.location.href = '../../index.html'; } }, 2000);
            }
        }
    }
    
    if (economicoFilterBtn) economicoFilterBtn.addEventListener('click', () => { currentFilters.economico = !currentFilters.economico; economicoFilterBtn.classList.toggle('active', currentFilters.economico); applyFiltersAndSearch(); });
    if (searchInput) searchInput.addEventListener('input', (e) => { currentFilters.searchTerm = e.target.value.toLowerCase().trim(); clearTimeout(searchInput.searchTimeout); searchInput.searchTimeout = setTimeout(applyFiltersAndSearch, 300); });
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => { currentFilters = { brand: "", economico: false, searchTerm: "" }; if (searchInput) searchInput.value = ""; populateFilterButtons(allBoilers); applyFiltersAndSearch(); });
    if (closeBoilerDetailsPopupBtn) closeBoilerDetailsPopupBtn.addEventListener('click', () => { if (boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.style.display = 'none'; });
    if (boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.addEventListener('click', (e) => { if (e.target === boilerDetailsPopupOverlay) boilerDetailsPopupOverlay.style.display = 'none'; });
    
    auth.onAuthStateChanged(initializePage);
});
