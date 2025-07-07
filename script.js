/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * VERSIONE FINALE CON MODAL ADATTIVO - Nessuna omissione.
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
        modalDatasheetLink = document.getElementById('modal-datasheet-link'),
        // Selezioniamo anche i titoli delle sezioni per nasconderli se vuoti
        modalMainDetailsTitle = document.querySelector('.modal-details-container h3:nth-of-type(1)'),
        modalExtraDetailsTitle = document.querySelector('.modal-details-container h3:nth-of-type(2)');

    // 2. VARIABILI DI STATO E CONFIGURAZIONE
    const db = firebase.firestore();
    let allSearchableData = [];
    let isDataFetched = false;
    let currentlyDisplayedResults = [];
    const currentlyOpenSubmenu = { btn: null, menu: null };

    // 3. FUNZIONI
    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return; const isVisible = submenu.classList.toggle('visible'); button.setAttribute('aria-expanded', isVisible);
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) { currentlyOpenSubmenu.menu.classList.remove('visible'); if (currentlyOpenSubmenu.btn) currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false'); }
        currentlyOpenSubmenu.btn = isVisible ? button : null; currentlyOpenSubmenu.menu = isVisible ? submenu : null;
    };
    const showAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.remove('hidden'); if (adminOverlay) adminOverlay.classList.remove('hidden'); };
    const hideAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.add('hidden'); if (adminOverlay) adminOverlay.classList.add('hidden'); };
    const handleAddCategorySubmit = () => {
        if (!categoryNameInput || !categoryPathInput || !categoryIconInput || !mainNav) return; const name = categoryNameInput.value.trim(), path = categoryPathInput.value.trim(), icon = categoryIconInput.value.trim() || 'fas fa-folder'; if (!name || !path) return;
        const link = document.createElement('a'); link.href = path; link.className = 'nav-button'; const i = document.createElement('i'); i.className = icon; link.append(i, ` ${name}`); mainNav.appendChild(link);
    };
    const formatPrice = (price) => !isNaN(Number(price)) && String(price).trim() !== '' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(price)) : 'N/D';
    const createDetailRowHTML = (label, value, unit = '') => value != null && String(value).trim() !== '' ? `<li><strong>${label}:</strong><span>${String(value).replace(/\./g, ',')}${unit}</span></li>` : '';
    const getCorrectedPath = (path) => path && path.startsWith('../') ? `LISTINI/CLIMA/${path.substring(3)}` : (path || 'LISTINI/CLIMA/images/placeholder.png');
    const closeModal = () => { document.body.classList.remove('modal-open'); if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible'); };
    
    const populateAndShowModal = (product) => {
        if (!product || !detailsModalOverlay) return;
        const config = product.config;
        const safeBrandName = product.marca ? product.marca.toLowerCase().replace(/\s+/g, '') : 'placeholder';
        modalProductLogo.src = `LISTINI/CLIMA/images/logos/${safeBrandName}.png`;
        modalProductLogo.onerror = () => { modalProductLogo.src = 'LISTINI/CLIMA/images/logos/placeholder_logo.png'; };
        modalProductBrand.textContent = product.marca || 'N/D';
        modalProductModel.textContent = product.modello || 'N/D';
        modalProductImage.src = getCorrectedPath(product.image_url);

        const mainDetailsHTML = [
            createDetailRowHTML('Potenza', product.potenza),
            createDetailRowHTML('Classe Raffr.', product.classe_energetica_raffrescamento),
            createDetailRowHTML('Classe Risc.', product.classe_energetica_riscaldamento),
            createDetailRowHTML('Codice Prodotto', product[config.code_field] || product.id)
        ].join('');
        modalMainDetailsList.innerHTML = mainDetailsHTML;

        const extraDetailsHTML = [
            createDetailRowHTML(product.dimensioni_ue ? 'Dimensioni UI' : 'Dimensioni', product.dimensioni_ui || product.dimensioni_peso_ui, ' mm'),
            createDetailRowHTML('Dimensioni UE', product.dimensioni_ue, ' mm'),
            createDetailRowHTML('Gas Refrigerante', product.gas),
            createDetailRowHTML('Prezzo Kit', formatPrice(product.prezzo_kit))
        ].join('');
        modalExtraDetailsList.innerHTML = extraDetailsHTML;
        
        if (modalMainDetailsTitle) modalMainDetailsTitle.style.display = mainDetailsHTML.trim() ? 'block' : 'none';
        if (modalExtraDetailsTitle) modalExtraDetailsTitle.style.display = extraDetailsHTML.trim() ? 'block' : 'none';
        
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
            { name: 'prodottiClimaMonosplit', category: 'Monosplit', config: { code_field: 'codice_prodotto', price_field: 'prezzo' } },
            { name: 'outdoorUnits', category: 'U. Esterna Multi', config: { code_field: 'codice_prodotto', price_field: 'prezzo' } },
            { name: 'indoorUnits', category: 'U. Interna Multi', config: { code_field: 'codice_prodotto', price_field: 'prezzo_ui' } }
        ];
        const promises = collectionsToFetch.map(async (col) => {
            try { const snapshot = await db.collection(col.name).get(); return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, category: col.category, config: col.config, _collection: col.name })); } catch (error) { return []; }
        });
        allSearchableData = (await Promise.all(promises)).flat();
        isDataFetched = true;
        searchInput.disabled = false; searchInput.placeholder = 'Cerca per codice o descrizione articolo...';
    };

    const handleSearch = () => {
        if (!searchInput) return;
        const query = searchInput.value.trim();
        if (query.length < 3) { displayResults([]); return; }
        const isNumericQuery = /^\d+$/.test(query);

        const results = allSearchableData.filter(item => {
            if (isNumericQuery) {
                const codeFieldValue = item[item.config.code_field];
                if (!codeFieldValue) return false;
                if (/^\d+$/.test(String(codeFieldValue))) return String(codeFieldValue) === query;
                return (String(codeFieldValue).match(/\d+/g) || []).some(code => code === query);
            }
            const queryLower = query.toLowerCase();
            return item.modello?.toLowerCase().includes(queryLower) || item.marca?.toLowerCase().includes(queryLower);
        });
        currentlyDisplayedResults = results;
        displayResults(currentlyDisplayedResults);
    };
    
    const displayResults = (results) => {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) { searchResultsContainer.style.display = 'none'; return; }
        searchResultsContainer.style.display = 'block';

        results.slice(0, 20).forEach((item, index) => {
            const resultItem = document.createElement('a');
            resultItem.href = "javascript:void(0);";
            resultItem.className = 'result-item';
            resultItem.dataset.resultIndex = index;
            const mainName = [item.marca, item.modello, item.potenza].filter(Boolean).join(' ');
            const price = formatPrice(item[item.config.price_field]);
            const detailName = item.articolo_fornitore || `Codice: ${item[item.config.code_field] || 'N/D'}`;
            resultItem.innerHTML = `<div style="display: flex; flex-direction: column; width: 100%; gap: 4px;"> <div style="display: flex; justify-content: space-between; align-items: flex-start;"> <span style="font-weight: 500;">${mainName || 'Prodotto non specificato'}</span> <span class="item-category">${item.category}</span> </div><div style="font-size: 0.85em; opacity: 0.8; display: flex; justify-content: space-between; align-items: center;"> <span style="max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${detailName}</span> <span style="font-weight: bold; color: #0056a8; font-size: 1.1em;">${price}</span></div></div>`;
            searchResultsContainer.appendChild(resultItem);
        });
    };

    // 4. EVENT LISTENERS
    if (btnListini) btnListini.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnListini, submenuListini); });
    if (btnConfiguratori) btnConfiguratori.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnConfiguratori, submenuConfiguratori); });
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); handleSearch(); } });
    }
    if (searchResultsContainer) {
        searchResultsContainer.addEventListener('click', (event) => {
            const resultItem = event.target.closest('.result-item');
            if (!resultItem) return;
            event.preventDefault();
            const resultIndex = parseInt(resultItem.dataset.resultIndex, 10);
            const product = currentlyDisplayedResults[resultIndex];
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
    const closeModalAndRefreshSearch = () => { closeModal(); handleSearch(); };
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalAndRefreshSearch);
    if (detailsModalOverlay) detailsModalOverlay.addEventListener('click', (event) => { if (event.target === detailsModalOverlay) closeModalAndRefreshSearch(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && detailsModalOverlay?.classList.contains('visible')) { event.preventDefault(); closeModalAndRefreshSearch(); } });
    
    // FLUSSO PRINCIPALE
    if (appContent) {
        new MutationObserver((mutations) => { mutations.forEach(m => { if (m.attributeName === 'class') { if (!appContent.classList.contains('hidden')) { fetchAllSearchableData(); } else { allSearchableData = []; isDataFetched = false; } } });
        }).observe(appContent, { attributes: true });
    }
});
