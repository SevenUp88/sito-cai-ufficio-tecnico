/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * VERSIONE FINALE ROBUSTA - Configurazione specifica per collezione.
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
    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;
        const isCurrentlyVisible = submenu.classList.contains('visible');
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
        }
        button.setAttribute('aria-expanded', String(!isCurrentlyVisible));
        submenu.classList.toggle('visible', !isCurrentlyVisible);
        currentlyOpenSubmenu.btn = !isCurrentlyVisible ? button : null;
        currentlyOpenSubmenu.menu = !isCurrentlyVisible ? submenu : null;
    };
    const showAddCategoryPanel = () => {
        if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.remove('hidden');
        adminOverlay.classList.remove('hidden');
    };
    const hideAddCategoryPanel = () => {
        if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.add('hidden');
        adminOverlay.classList.add('hidden');
    };
    const handleAddCategorySubmit = () => {
        if (!categoryNameInput || !categoryPathInput || !iconClassRaw) return;
        const name = categoryNameInput.value.trim();
        const path = categoryPathInput.value.trim();
        const iconClassRaw = categoryIconInput.value.trim() || 'fas fa-folder';
        if (!name || !path) { return; }
        const newLink = document.createElement('a'); newLink.href = path; newLink.className = 'nav-button';
        const newIcon = document.createElement('i'); newIcon.className = iconClassRaw;
        const linkText = document.createTextNode(` ${name}`); newLink.appendChild(newIcon); newLink.appendChild(linkText);
        mainNav.appendChild(newLink);
    };
    const formatPrice = (price) => {
        if (price === null || price === undefined || price === '') return 'N/D';
        const numberPrice = Number(price);
        return !isNaN(numberPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numberPrice) : 'N/D';
    };
    const createDetailRowHTML = (label, value, unit = '') => {
        if (value === null || value === undefined || String(value).trim() === '') return '';
        const displayValue = typeof value === 'number' ? String(value).replace('.', ',') : value;
        return `<li><strong>${label}:</strong><span>${displayValue}${unit}</span></li>`;
    };
    const getCorrectedPath = (path) => {
        if (!path) return 'LISTINI/CLIMA/images/placeholder.png';
        if (path.startsWith('http')) return path; 
        if (path.startsWith('../')) return `LISTINI/CLIMA/${path.substring(3)}`;
        return path;
    };
    const populateAndShowModal = (product) => {
        if (!product || !detailsModalOverlay) return;
        const config = product.config;
        const safeBrandName = product.marca ? product.marca.toLowerCase().replace(/\s+/g, '') : 'placeholder';
        modalProductLogo.src = `LISTINI/CLIMA/images/logos/${safeBrandName}.png`;
        modalProductLogo.onerror = () => { modalProductLogo.src = 'LISTINI/CLIMA/images/logos/placeholder_logo.png'; };
        modalProductBrand.textContent = product.marca || 'N/D';
        modalProductModel.textContent = product.modello || 'N/D';
        modalProductImage.src = getCorrectedPath(product.image_url);
        modalProductImage.onerror = () => { modalProductImage.src = 'LISTINI/CLIMA/images/placeholder.png'; };
        
        const productCodeToShow = product[config.code_field] || product.id;
        
        modalMainDetailsList.innerHTML = [
            createDetailRowHTML('Potenza', product.potenza),
            createDetailRowHTML('Classe Raffr.', product.classe_energetica_raffrescamento),
            createDetailRowHTML('Classe Risc.', product.classe_energetica_riscaldamento),
            createDetailRowHTML('Codice Prodotto', productCodeToShow)
        ].join('');
        modalExtraDetailsList.innerHTML = [
            createDetailRowHTML('Dimensioni UI', product.dimensioni_ui || product.dimensioni_peso_ui),
            createDetailRowHTML('Dimensioni UE', product.dimensioni_ue),
            createDetailRowHTML('Gas Refrigerante', product.gas),
            createDetailRowHTML('Prezzo Kit', formatPrice(product.prezzo_kit))
        ].join('');
        
        modalProductPrice.textContent = formatPrice(product[config.price_field]); 
        modalDatasheetLink.classList.toggle('hidden', !product.scheda_tecnica_url);
        if(product.scheda_tecnica_url) modalDatasheetLink.href = product.scheda_tecnica_url;

        document.body.classList.add('modal-open');
        detailsModalOverlay.classList.add('visible');
    };
    const closeModal = () => {
        document.body.classList.remove('modal-open');
        if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible');
    };
    const fetchAllSearchableData = async () => {
        if (isDataFetched) return;
        searchInput.disabled = true;
        searchInput.placeholder = 'Caricamento dati...';
        const collectionsToFetch = [
            { 
                name: 'prodottiClimaMonosplit', 
                category: 'Monosplit',
                config: { code_field: 'codice_prodotto', price_field: 'prezzo' }
            },
            { 
                name: 'outdoorUnits', 
                category: 'U. Esterna Multi',
                config: { code_field: 'codice_prodotto', price_field: 'prezzo' }
            },
            { 
                name: 'indoorUnits', 
                category: 'U. Interna Multi',
                config: { code_field: 'codice_prodotto', price_field: 'prezzo_ui' }
            },
        ];
        const promises = collectionsToFetch.map(async (col) => {
            try {
                const snapshot = await db.collection(col.name).get();
                return snapshot.docs.map(doc => ({...doc.data(), id: doc.id, category: col.category, config: col.config }));
            } catch (error) { console.error(`Errore caricamento ${col.name}:`, error); return []; }
        });
        allSearchableData = (await Promise.all(promises)).flat();
        isDataFetched = true;
        searchInput.disabled = false;
        searchInput.placeholder = 'Cerca per codice o descrizione articolo...';
    };
    const handleSearch = () => {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();
        if (query.length < 2) { displayResults([]); return; }
        const isNumericQuery = /^\d{3,}$/.test(query);

        const filteredResults = allSearchableData.filter(item => {
            if (isNumericQuery) {
                const codeField = item.config.code_field;
                if (item[codeField]) {
                    const codesInString = String(item[codeField]).match(/\d+/g) || [];
                    return codesInString.some(code => code.includes(query));
                }
                return false;
            }
            const modelMatch = item.modello?.toLowerCase().includes(query);
            const brandMatch = item.marca?.toLowerCase().includes(query);
            return modelMatch || brandMatch;
        });
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
            const config = item.config;
            const mainName = [item.marca, item.modello, item.potenza].filter(Boolean).join(' ');
            const codeToShow = item[config.code_field] || 'N/D';
            const price = formatPrice(item[config.price_field]);
            
            resultItem.innerHTML = `
                <div style="display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-weight: 500;">${mainName || 'Prodotto non specificato'}</span>
                        <span class="item-category">${item.category}</span>
                    </div>
                    <div style="font-size: 0.85em; opacity: 0.8; margin-top: 3px; display: flex; justify-content: space-between;">
                        <span>Codice: ${codeToShow}</span>
                        <span style="font-weight: bold; color: #0056a8;">${price}</span>
                    </div>
                </div>
            `;
            searchResultsContainer.appendChild(resultItem);
        });
    };

    // 4. EVENT LISTENERS E FLUSSO PRINCIPALE
    if (btnListini) btnListini.addEventListener('click', (e) => e.stopPropagation() || toggleSubmenu(btnListini, submenuListini));
    if (btnConfiguratori) btnConfiguratori.addEventListener('click', (e) => e.stopPropagation() || toggleSubmenu(btnConfiguratori, submenuConfiguratori));
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (searchResultsContainer) {
        searchResultsContainer.addEventListener('click', (event) => {
            const resultItem = event.target.closest('.result-item');
            if (!resultItem) return;
            event.preventDefault();
            const product = allSearchableData.find(p => p.id === resultItem.dataset.productId);
            if (product) {
                populateAndShowModal(product);
                searchResultsContainer.style.display = 'none';
                searchInput.blur();
            }
        });
    }
    document.addEventListener('click', (event) => {
        if (currentlyOpenSubmenu.menu && !currentlyOpenSubmenu.menu.contains(event.target) && !currentlyOpenSubmenu.btn.contains(event.target)) {
            toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu);
        }
        if (searchResultsContainer && !searchResultsContainer.contains(event.target) && event.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (detailsModalOverlay) detailsModalOverlay.addEventListener('click', (event) => { if (event.target === detailsModalOverlay) closeModal(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && detailsModalOverlay?.classList.contains('visible')) closeModal(); });

    if (appContent) {
        new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!appContent.classList.contains('hidden')) { fetchAllSearchableData(); } 
                    else { allSearchableData = []; isDataFetched = false; if(searchResultsContainer) searchResultsContainer.innerHTML = ''; if(searchInput) searchInput.value = ''; }
                }
            }
        }).observe(appContent, { attributes: true });
    }
});
