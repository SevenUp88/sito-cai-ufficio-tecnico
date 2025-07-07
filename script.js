/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * Versione Finale con gestione MODAL e percorsi immagine corretti.
 * Gestisce: Sottomenu, Pannello Admin, Ricerca Globale, Modal Dettagli.
 */

document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. SELEZIONE DEGLI ELEMENTI DOM
    // =================================================================
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

    // =================================================================
    // 2. VARIABILI DI STATO E CONFIGURAZIONE
    // =================================================================
    const db = firebase.firestore();
    let allSearchableData = [];
    let isDataFetched = false;
    const currentlyOpenSubmenu = { btn: null, menu: null };

    // =================================================================
    // 3. FUNZIONI
    // =================================================================

    // --- Funzioni per la gestione dei Sottomenu e Pannello Admin ---
    const toggleSubmenu = (button, submenu) => { /* ... codice completo ... */ };
    const showAddCategoryPanel = () => { /* ... codice completo ... */ };
    const hideAddCategoryPanel = () => { /* ... codice completo ... */ };
    const handleAddCategorySubmit = () => { /* ... codice completo ... */ };
    
    // Riscrivo qui le funzioni nascoste per completezza
    toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;
        const isCurrentlyVisible = submenu.classList.contains('visible');
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) {
                currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
                currentlyOpenSubmenu.btn.classList.remove('active');
            }
        }
        if (!isCurrentlyVisible) {
            submenu.classList.add('visible');
            button.setAttribute('aria-expanded', 'true');
            button.classList.add('active');
            currentlyOpenSubmenu.btn = button;
            currentlyOpenSubmenu.menu = submenu;
        } else {
            submenu.classList.remove('visible');
            button.setAttribute('aria-expanded', 'false');
            button.classList.remove('active');
            if (currentlyOpenSubmenu.menu === submenu) {
                currentlyOpenSubmenu.btn = null;
                currentlyOpenSubmenu.menu = null;
            }
        }
    };
    showAddCategoryPanel = () => {
        if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.remove('hidden');
        adminOverlay.classList.remove('hidden');
        if(categoryNameInput) categoryNameInput.value = ''; 
        if(categoryPathInput) categoryPathInput.value = ''; 
        if(categoryIconInput) categoryIconInput.value = '';
        if(addCategoryFeedback) addCategoryFeedback.classList.add('hidden');
        if(categoryNameInput) categoryNameInput.focus();
    };
    hideAddCategoryPanel = () => {
         if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.add('hidden');
        adminOverlay.classList.add('hidden');
    };
    handleAddCategorySubmit = () => {
        if (!categoryNameInput || !categoryPathInput || !categoryIconInput || !mainNav || !addCategoryFeedback) return;
        const name = categoryNameInput.value.trim();
        const path = categoryPathInput.value.trim();
        const iconClassRaw = categoryIconInput.value.trim() || 'fas fa-folder';
        if (!name || !path) {
            addCategoryFeedback.textContent = 'Nome categoria e percorso sono obbligatori!';
            addCategoryFeedback.className = 'feedback-message error'; 
            addCategoryFeedback.classList.remove('hidden');
            return;
        }
        const newLink = document.createElement('a'); newLink.href = path; newLink.className = 'nav-button';
        const newIcon = document.createElement('i'); newIcon.className = iconClassRaw;
        const linkText = document.createTextNode(` ${name}`); newLink.appendChild(newIcon); newLink.appendChild(linkText);
        mainNav.appendChild(newLink);
        categoryNameInput.value = ''; categoryPathInput.value = ''; categoryIconInput.value = '';
        addCategoryFeedback.textContent = `Categoria "${name}" aggiunta!`; addCategoryFeedback.className = 'feedback-message success';
        addCategoryFeedback.classList.remove('hidden');
        setTimeout(() => addCategoryFeedback.classList.add('hidden'), 3000);
        categoryNameInput.focus();
    };


    // --- Funzioni per il Modal dei Dettagli Prodotto ---
    const formatPrice = (price) => {
        if (price === null || price === undefined || price === '') return 'N/D';
        const numberPrice = Number(price);
        return !isNaN(numberPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numberPrice) : 'N/D';
    };

    const createDetailRowHTML = (label, value, unit = '') => {
        if (value === null || value === undefined || String(value).trim() === '') return '';
        return `<li><strong>${label}:</strong><span>${String(value).replace(/\./g, ',')}${unit}</span></li>`;
    };

    const populateAndShowModal = (product) => {
        if (!product || !detailsModalOverlay) return;
        
        // CORREZIONE DEI PERCORSI IMMAGINE
        const getCorrectedPath = (path, folder) => {
            const defaultPath = `LISTINI/CLIMA/images/${folder}/placeholder.png`;
            if (!path) return defaultPath;
            if (path.startsWith('http')) return path; // Se è un URL completo
            if (path.startsWith('../')) {
                // Trasforma ../images/file.png in LISTINI/CLIMA/images/file.png
                return `LISTINI/CLIMA/${path.substring(3)}`;
            }
            return path; // Altrimenti, suppone che il percorso sia già corretto
        };

        const safeBrandName = product.marca ? product.marca.toLowerCase().replace(/\s+/g, '') : 'placeholder';
        modalProductLogo.src = `LISTINI/CLIMA/images/logos/${safeBrandName}.png`;
        modalProductLogo.onerror = () => { modalProductLogo.src = 'LISTINI/CLIMA/images/logos/placeholder_logo.png'; };
        
        modalProductBrand.textContent = product.marca || 'N/D';
        modalProductModel.textContent = product.modello || 'N/D';
        
        modalProductImage.src = getCorrectedPath(product.image_url, 'products');
        modalProductImage.onerror = () => { modalProductImage.src = 'LISTINI/CLIMA/images/placeholder.png'; };
        
        modalMainDetailsList.innerHTML = [
            createDetailRowHTML('Potenza', product.potenza),
            createDetailRowHTML('Classe Raffr.', product.classe_energetica_raffrescamento),
            createDetailRowHTML('Classe Risc.', product.classe_energetica_riscaldamento),
            createDetailRowHTML('Codice Prodotto', product.codice_prodotto || product.id)
        ].join('');

        modalExtraDetailsList.innerHTML = [
            createDetailRowHTML('Dimensioni UI (AxLxP)', product.dimensioni_ui, ' mm'),
            createDetailRowHTML('Dimensioni UE (AxLxP)', product.dimensioni_ue, ' mm'),
            createDetailRowHTML('Gas Refrigerante', product.gas),
            createDetailRowHTML('Prezzo Kit', formatPrice(product.prezzo_kit))
        ].join('');

        modalProductPrice.textContent = formatPrice(product.prezzo);

        if (product.scheda_tecnica_url) {
            modalDatasheetLink.href = product.scheda_tecnica_url;
            modalDatasheetLink.classList.remove('hidden');
        } else {
            modalDatasheetLink.classList.add('hidden');
        }

        document.body.classList.add('modal-open');
        detailsModalOverlay.classList.add('visible');
    };

    const closeModal = () => {
        document.body.classList.remove('modal-open');
        if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible');
    };


    // --- Funzioni per la Ricerca Globale ---
    const fetchAllSearchableData = async () => {
        if (isDataFetched) return;
        searchInput.disabled = true;
        searchInput.placeholder = 'Caricamento dati...';
        
        // PERSONALIZZA QUI LE COLLEZIONI DA CERCARE
        const collectionsToFetch = [
            { name: 'prodottiClimaMonosplit', category: 'Monosplit' },
            { name: 'outdoorUnits', category: 'U. Esterna Multi' },
            { name: 'indoorUnits', category: 'U. Interna Multi' },
            // Esempio per CALDAIE (da decommentare e adattare):
            // { name: 'prodottiCaldaie', category: 'Caldaie' }, 
        ];

        const promises = collectionsToFetch.map(async (col) => {
            try {
                const snapshot = await db.collection(col.name).get();
                return snapshot.docs.map(doc => ({
                    ...doc.data(), id: doc.id, category: col.category
                }));
            } catch (error) {
                console.error(`Errore nel caricamento della collezione ${col.name}:`, error);
                return [];
            }
        });

        allSearchableData = (await Promise.all(promises)).flat();
        isDataFetched = true;
        console.log(`Caricamento completato. ${allSearchableData.length} articoli indicizzati.`);
        searchInput.disabled = false;
        searchInput.placeholder = 'Cerca per codice o descrizione articolo...';
    };

    const handleSearch = () => {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();
        if (query.length < 2) { displayResults([]); return; }
        
        const filteredResults = allSearchableData.filter(item => {
            const codeMatch = item.codice_prodotto?.toLowerCase().includes(query);
            const modelMatch = item.modello?.toLowerCase().includes(query);
            const brandMatch = item.marca?.toLowerCase().includes(query);
            const idMatch = item.id?.toLowerCase().includes(query);
            return codeMatch || modelMatch || brandMatch || idMatch;
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
            const name = [item.marca, item.modello, item.potenza].filter(Boolean).join(' ');
            resultItem.innerHTML = `
                <span class="item-category">${item.category}</span>
                <span class="item-code">${item.codice_prodotto || item.id}</span>
                ${name || 'Dettagli non disponibili'}
            `;
            searchResultsContainer.appendChild(resultItem);
        });
    };

    // =================================================================
    // 4. EVENT LISTENERS E FLUSSO PRINCIPALE
    // =================================================================

    // Sottomenu, Pannello Admin, Ricerca
    if (btnListini) btnListini.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnListini, submenuListini); });
    if (btnConfiguratori) btnConfiguratori.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnConfiguratori, submenuConfiguratori); });
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // Click su un risultato di ricerca per aprire il MODAL
    if (searchResultsContainer) {
        searchResultsContainer.addEventListener('click', (event) => {
            const resultItem = event.target.closest('.result-item');
            if (!resultItem) return;
            event.preventDefault();
            const product = allSearchableData.find(p => p.id === resultItem.dataset.productId);
            if (product) {
                populateAndShowModal(product);
                searchResultsContainer.style.display = 'none';
                searchInput.value = '';
                searchInput.blur();
            } else {
                console.error("Prodotto non trovato con ID:", resultItem.dataset.productId);
            }
        });
    }
    
    // Chiusura di Popup e Menu
    document.addEventListener('click', (event) => {
        if (currentlyOpenSubmenu.menu && !currentlyOpenSubmenu.menu.contains(event.target) && !currentlyOpenSubmenu.btn.contains(event.target)) {
            toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu);
        }
        if (searchResultsContainer && !searchResultsContainer.contains(event.target) && event.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });
    
    // Chiusura del MODAL
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (detailsModalOverlay) detailsModalOverlay.addEventListener('click', (event) => { if (event.target === detailsModalOverlay) closeModal(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && detailsModalOverlay?.classList.contains('visible')) closeModal(); });

    // Observer per avviare il caricamento dati dopo il login
    if (appContent) {
        new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!appContent.classList.contains('hidden')) fetchAllSearchableData();
                    else {
                        allSearchableData = [];
                        isDataFetched = false;
                        if(searchResultsContainer) searchResultsContainer.innerHTML = '';
                        if(searchInput) searchInput.value = '';
                    }
                }
            }
        }).observe(appContent, { attributes: true });
    }
});
