/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * VERSIONE FINALE ASSOLUTA - Con ricerca per codice ESATTA e strumenti di debug.
 * Gestisce: Sottomenu, Pannello Admin, Ricerca Globale, Modal Dettagli.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. SELEZIONE DEGLI ELEMENTI DOM
    const btnListini = document.getElementById('btn-listini'),
        submenuListini = document.getElementById('submenu-listini'),
        btnConfiguratori = document.getElementById('btn-configuratori'),
        submenuConfiguratori = document.getElementById('submenu-configuratori'),
        mainNav = document.getElementById('mainNav'),
        appContent = document.getElementById('app-content'),
        addCategoryTriggerBtn = document.getElementById('add-category-trigger'),
        addCategoryPanel = document.getElementById('add-category-panel'),
        addCategoryCloseBtn = document.getElementById('add-category-close'),
        categoryNameInput = document.getElementById('category-name'),
        categoryPathInput = document.getElementById('category-path'),
        categoryIconInput = document.getElementById('category-icon'),
        addCategorySubmitBtn = document.getElementById('add-category-submit'),
        addCategoryFeedback = document.getElementById('add-category-feedback'),
        adminOverlay = document.getElementById('admin-overlay'),
        searchInput = document.getElementById('search-input'),
        searchResultsContainer = document.getElementById('search-results'),
        detailsModalOverlay = document.getElementById('product-details-modal-overlay'),
        modalProductLogo = document.getElementById('modal-product-logo'),
        modalProductBrand = document.getElementById('modal-product-brand'),
        modalProductModel = document.getElementById('modal-product-model'),
        modalProductImage = document.getElementById('modal-product-image'),
        modalMainDetailsList = document.getElementById('modal-main-details-list'),
        modalExtraDetailsList = document.getElementById('modal-extra-details-list'),
        modalProductPrice = document.getElementById('modal-product-price'),
        closeModalBtn = document.getElementById('close-modal-btn'),
        modalDatasheetLink = document.getElementById('modal-datasheet-link');

    // 2. VARIABILI DI STATO E CONFIGURAZIONE
    const db = firebase.firestore();
    let allSearchableData = [];
    let isDataFetched = false;
    const currentlyOpenSubmenu = { btn: null, menu: null };

    // 3. FUNZIONI
    const toggleSubmenu = (button, submenu) => { if (!button || !submenu) return; const isVisible = submenu.classList.toggle('visible'); button.setAttribute('aria-expanded', isVisible); };
    const showAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.remove('hidden'); if(adminOverlay) adminOverlay.classList.remove('hidden'); };
    const hideAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.add('hidden'); if(adminOverlay) adminOverlay.classList.add('hidden'); };
    const handleAddCategorySubmit = () => { /* ... logica inviata ... */ };
    const formatPrice = (price) => !isNaN(Number(price)) && price !== '' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(price)) : 'N/D';
    const createDetailRowHTML = (label, value, unit = '') => value != null ? `<li><strong>${label}:</strong><span>${String(value).replace('.', ',')}${unit}</span></li>` : '';
    const getCorrectedPath = (path) => path && path.startsWith('../') ? `LISTINI/CLIMA/${path.substring(3)}` : path || 'LISTINI/CLIMA/images/placeholder.png';
    const closeModal = () => { document.body.classList.remove('modal-open'); if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible'); };
    
    const populateAndShowModal = (product) => {
        if (!product) return;
        const config = product.config;
        modalProductBrand.textContent = product.marca || 'N/D';
        modalProductModel.textContent = product.modello || 'N/D';
        modalProductImage.src = getCorrectedPath(product.image_url);
        
        const productCodeToShow = product[config.code_field] || product.id;
        
        modalMainDetailsList.innerHTML = [ createDetailRowHTML('Potenza', product.potenza), createDetailRowHTML('Classe Raffr.', product.classe_energetica_raffrescamento), createDetailRowHTML('Classe Risc.', product.classe_energetica_riscaldamento), createDetailRowHTML('Codice Prodotto', productCodeToShow)].join('');
        modalExtraDetailsList.innerHTML = [createDetailRowHTML('Dimensioni UI', product.dimensioni_ui || product.dimensioni_peso_ui), createDetailRowHTML('Dimensioni UE', product.dimensioni_ue), createDetailRowHTML('Gas Refrigerante', product.gas), createDetailRowHTML('Prezzo Kit', formatPrice(product.prezzo_kit))].join('');
        
        modalProductPrice.textContent = formatPrice(product[config.price_field]); 
        modalDatasheetLink.classList.toggle('hidden', !product.scheda_tecnica_url);
        if (product.scheda_tecnica_url) modalDatasheetLink.href = product.scheda_tecnica_url;

        document.body.classList.add('modal-open');
        detailsModalOverlay.classList.add('visible');
    };
    
    const fetchAllSearchableData = async () => {
        if (isDataFetched) return;
        searchInput.disabled = true; searchInput.placeholder = 'Caricamento dati...';
        const collectionsToFetch = [
            { name: 'prodottiClimaMonosplit', category: 'Monosplit', config: { code_field: 'codice_prodotto', price_field: 'prezzo' }},
            { name: 'outdoorUnits', category: 'U. Esterna Multi', config: { code_field: 'codice_prodotto', price_field: 'prezzo' }},
            { name: 'indoorUnits', category: 'U. Interna Multi', config: { code_field: 'codice_prodotto', price_field: 'prezzo_ui' }}
        ];
        const promises = collectionsToFetch.map(async (col) => {
            try {
                const snapshot = await db.collection(col.name).get();
                return snapshot.docs.map(doc => ({...doc.data(), id: doc.id, category: col.category, config: col.config, _collection: col.name }));
            } catch (error) { console.error(`Errore caricamento ${col.name}:`, error); return []; }
        });
        allSearchableData = (await Promise.all(promises)).flat();
        isDataFetched = true;
        searchInput.disabled = false; searchInput.placeholder = 'Cerca per codice o descrizione articolo...';
    };

    // LOGICA DI RICERCA FINALE - SUPER RIGOROSA
    const handleSearch = () => {
        if (!searchInput) return;
        const query = searchInput.value.trim(); // NON mettiamo toLowerCase() qui
        if (query.length < 3) { displayResults([]); return; }
        
        const isNumericQuery = /^\d+$/.test(query);

        const filteredResults = allSearchableData.filter(item => {
            if (isNumericQuery) {
                const codeField = item.config.code_field;
                const codeValue = item[codeField];
                if (codeValue == null) return false;
                
                const codeValueStr = String(codeValue);
                
                // Corrispondenza ESATTA
                if (/^\d+$/.test(codeValueStr)) {
                    return codeValueStr === query;
                }
                const codesInString = codeValueStr.match(/\d+/g) || [];
                return codesInString.some(code => code === query);
            }
            
            // Ricerca testuale non numerica (deve essere case-insensitive)
            const queryLower = query.toLowerCase();
            const modelMatch = item.modello?.toLowerCase().includes(queryLower);
            const brandMatch = item.marca?.toLowerCase().includes(queryLower);
            return modelMatch || brandMatch;
        });
        
        // --- STRUMENTO DI DEBUG ---
        console.clear(); // Pulisce la console per una lettura chiara
        console.log(`Risultati trovati per "${query}": ${filteredResults.length}`);
        console.table(filteredResults.map(p => ({
            ID_Documento: p.id,
            Collezione: p._collection,
            Marca: p.marca,
            Modello: p.modello,
            Codice: p[p.config.code_field],
            Prezzo: formatPrice(p[p.config.price_field])
        })));
        // --- FINE DEBUG ---

        displayResults(filteredResults);
    };
    
    const displayResults = (results) => {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) { searchResultsContainer.style.display = 'none'; return; }
        searchResultsContainer.style.display = 'block';
        results.slice(0, 20).forEach(item => {
            const resultItem = document.createElement('a');
            resultItem.href = "javascript:void(0);";
            resultItem.className = 'result-item';
            resultItem.dataset.productId = item.id;
            
            const mainName = [item.marca, item.modello, item.potenza].filter(Boolean).join(' ');
            const price = formatPrice(item[item.config.price_field]);
            const detailName = item.articolo_fornitore || `Codice: ${item[item.config.code_field]}` || `ID: ${item.id}`;

            resultItem.innerHTML = `
                <div style="display: flex; flex-direction: column; width: 100%; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-weight: 500;">${mainName || 'Prodotto non specificato'}</span>
                        <span class="item-category">${item.category}</span>
                    </div>
                    <div style="font-size: 0.85em; opacity: 0.8; display: flex; justify-content: space-between; align-items: center;">
                        <span style="max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${detailName}</span>
                        <span style="font-weight: bold; color: #0056a8; font-size: 1.1em;">${price}</span>
                    </div>
                </div>`;
            searchResultsContainer.appendChild(resultItem);
        });
    };

    // 4. EVENT LISTENERS
    if (btnListini) btnListini.addEventListener('click', (e) => e.stopPropagation() || toggleSubmenu(btnListini, submenuListini));
    if (btnConfiguratori) btnConfiguratori.addEventListener('click', (e) => e.stopPropagation() || toggleSubmenu(btnConfiguratori, submenuConfiguratori));
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') { event.preventDefault(); handleSearch(); }
        });
    }
    if (searchResultsContainer) {
        searchResultsContainer.addEventListener('click', (event) => {
            const resultItem = event.target.closest('.result-item');
            if (!resultItem) return;
            event.preventDefault();
            const product = allSearchableData.find(p => p.id === resultItem.dataset.productId);
            if (product) {
                populateAndShowModal(product);
                searchResultsContainer.style.display = 'none';
            }
        });
    }
    document.addEventListener('click', (event) => {
        if (currentlyOpenSubmenu.menu && !currentlyOpenSubmenu.menu.contains(event.target) && !currentlyOpenSubmenu.btn.contains(event.target)) { toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu); }
        if (searchResultsContainer && !searchResultsContainer.contains(event.target) && event.target !== searchInput) { searchResultsContainer.style.display = 'none'; }
    });
    const closeModalAndRefreshSearch = () => { closeModal(); setTimeout(handleSearch, 50); };
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalAndRefreshSearch);
    if (detailsModalOverlay) detailsModalOverlay.addEventListener('click', (event) => { if (event.target === detailsModalOverlay) closeModalAndRefreshSearch(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && detailsModalOverlay?.classList.contains('visible')) { event.preventDefault(); closeModalAndRefreshSearch(); }});

    if (appContent) {
        new MutationObserver((mutations) => {
            for (const m of mutations) { if (m.attributeName === 'class') { if (!appContent.classList.contains('hidden')) fetchAllSearchableData(); else { allSearchableData = []; isDataFetched = false; }} }
        }).observe(appContent, { attributes: true });
    }
});
