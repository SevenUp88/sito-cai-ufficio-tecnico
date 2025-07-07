/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * Gestisce:
 * - Logica dei sottomenu a comparsa
 * - Pannello amministrativo "Aggiungi Categoria"
 * - Ricerca globale dei prodotti da tutte le collezioni
 * - Apertura del modal con i dettagli del prodotto selezionato dalla ricerca
 */

document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. SELEZIONE DEGLI ELEMENTI DOM
    // =================================================================
    
    // Elementi UI generali
    const btnListini = document.getElementById('btn-listini');
    const submenuListini = document.getElementById('submenu-listini');
    const btnConfiguratori = document.getElementById('btn-configuratori');
    const submenuConfiguratori = document.getElementById('submenu-configuratori');
    const mainNav = document.getElementById('mainNav');
    const appContent = document.getElementById('app-content');
    
    // Elementi per Pannello Admin "Aggiungi Categoria"
    const addCategoryTriggerBtn = document.getElementById('add-category-trigger');
    const addCategoryPanel = document.getElementById('add-category-panel');
    const addCategoryCloseBtn = document.getElementById('add-category-close');
    const categoryNameInput = document.getElementById('category-name');
    const categoryPathInput = document.getElementById('category-path');
    const categoryIconInput = document.getElementById('category-icon');
    const addCategorySubmitBtn = document.getElementById('add-category-submit');
    const addCategoryFeedback = document.getElementById('add-category-feedback');
    const adminOverlay = document.getElementById('admin-overlay');

    // Elementi per Ricerca e Risultati
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    
    // Elementi per il Modal dei Dettagli Prodotto
    const detailsModalOverlay = document.getElementById('product-details-modal-overlay');
    const modalProductLogo = document.getElementById('modal-product-logo');
    const modalProductBrand = document.getElementById('modal-product-brand');
    const modalProductModel = document.getElementById('modal-product-model');
    const modalProductImage = document.getElementById('modal-product-image');
    const modalMainDetailsList = document.getElementById('modal-main-details-list');
    const modalExtraDetailsList = document.getElementById('modal-extra-details-list');
    const modalProductPrice = document.getElementById('modal-product-price');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalDatasheetLink = document.getElementById('modal-datasheet-link');

    
    // =================================================================
    // 2. VARIABILI DI STATO E CONFIGURAZIONE
    // =================================================================
    
    const db = firebase.firestore();
    let allSearchableData = []; // Array che conterrà tutti i dati dei prodotti per la ricerca
    let isDataFetched = false;   // Flag per evitare di ricaricare i dati più volte
    const currentlyOpenSubmenu = { btn: null, menu: null };


    // =================================================================
    // 3. LOGICA DI BUSINESS (FUNZIONI)
    // =================================================================

    // --- Funzioni per la gestione dei Sottomenu ---
    const toggleSubmenu = (button, submenu) => {
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

    // --- Funzioni per il pannello "Aggiungi Categoria" ---
    const showAddCategoryPanel = () => {
        if (!addCategoryPanel || !adminOverlay || !categoryNameInput) return;
        addCategoryPanel.classList.remove('hidden');
        adminOverlay.classList.remove('hidden');
        categoryNameInput.value = ''; 
        categoryPathInput.value = ''; 
        categoryIconInput.value = '';
        if(addCategoryFeedback) addCategoryFeedback.classList.add('hidden');
        categoryNameInput.focus();
    };

    const hideAddCategoryPanel = () => {
         if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.add('hidden');
        adminOverlay.classList.add('hidden');
    };

    const handleAddCategorySubmit = () => {
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
        
        const newLink = document.createElement('a'); 
        newLink.href = path; 
        newLink.className = 'nav-button';
        
        const newIcon = document.createElement('i');
        newIcon.className = iconClassRaw;

        const linkText = document.createTextNode(` ${name}`); 
        newLink.appendChild(newIcon);
        newLink.appendChild(linkText);
        
        mainNav.appendChild(newLink);
        
        categoryNameInput.value = ''; categoryPathInput.value = ''; categoryIconInput.value = '';
        addCategoryFeedback.textContent = `Categoria "${name}" aggiunta!`;
        addCategoryFeedback.className = 'feedback-message success';
        addCategoryFeedback.classList.remove('hidden');
        
        setTimeout(() => addCategoryFeedback.classList.add('hidden'), 3000);
        categoryNameInput.focus();
    };


    // --- Funzioni per il Modal dei Dettagli Prodotto ---
    const formatPrice = (price) => {
        if (price === null || price === undefined || price === '') return 'N/D';
        const numberPrice = Number(price);
        if (isNaN(numberPrice)) return 'N/D';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numberPrice);
    };

    const createDetailRowHTML = (label, value, unit = '') => {
        if (value === null || value === undefined || String(value).trim() === '') return '';
        return `<li><strong>${label}:</strong><span>${value}${unit}</span></li>`;
    };

    const populateAndShowModal = (product) => {
        if (!product || !detailsModalOverlay) return;

        const safeBrandName = product.marca ? product.marca.toLowerCase().replace(/\s+/g, '') : 'placeholder';
        const basePath = 'LISTINI/CLIMA/images/'; 

        modalProductLogo.src = `${basePath}logos/${safeBrandName}.png`;
        modalProductLogo.onerror = () => { modalProductLogo.src = `${basePath}logos/placeholder_logo.png`; };
        modalProductLogo.alt = `Logo ${product.marca || 'N/D'}`;

        modalProductBrand.textContent = product.marca || 'N/D';
        modalProductModel.textContent = product.modello || 'N/D';

        modalProductImage.src = product.image_url || `${basePath}placeholder.png`;
        modalProductImage.onerror = () => { modalProductImage.src = `${basePath}placeholder.png`; };
        modalProductImage.alt = `Immagine ${product.modello || 'N/D'}`;

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
        
        const collectionsToFetch = [
            { name: 'prodottiClimaMonosplit', category: 'Monosplit' },
            { name: 'outdoorUnits', category: 'U. Esterna Multi' },
            { name: 'indoorUnits', category: 'U. Interna Multi' },
            // Aggiungi qui altre collezioni se vuoi renderle ricercabili, es:
            // { name: 'listino-caldaie', category: 'Caldaie' },
            // { name: 'listino-sanitari', category: 'Sanitari' }
        ];

        const promises = collectionsToFetch.map(async (col) => {
            try {
                const snapshot = await db.collection(col.name).get();
                return snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    category: col.category
                }));
            } catch (error) {
                console.error(`Errore nel caricamento della collezione ${col.name}:`, error);
                return [];
            }
        });

        const results = await Promise.all(promises);
        allSearchableData = results.flat();
        isDataFetched = true;
        console.log(`Caricamento completato. ${allSearchableData.length} articoli totali indicizzati.`);
        searchInput.disabled = false;
        searchInput.placeholder = 'Cerca per codice o descrizione articolo...';
    };

    const handleSearch = () => {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();
        if (query.length < 2) {
            displayResults([]);
            return;
        }
        
        const filteredResults = allSearchableData.filter(item => {
            const codeMatch = item.codice_prodotto ? item.codice_prodotto.toLowerCase().includes(query) : false;
            const modelMatch = item.modello ? item.modello.toLowerCase().includes(query) : false;
            const brandMatch = item.marca ? item.marca.toLowerCase().includes(query) : false;
            const idMatch = item.id ? item.id.toLowerCase().includes(query) : false;
            return codeMatch || modelMatch || brandMatch || idMatch;
        });

        displayResults(filteredResults);
    };
    
    const displayResults = (results) => {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.style.display = 'none';
            return;
        }
        
        searchResultsContainer.style.display = 'block';

        results.slice(0, 20).forEach(item => {
            const resultItem = document.createElement('a');
            resultItem.href = "javascript:void(0);";
            resultItem.className = 'result-item';
            resultItem.setAttribute('data-product-id', item.id);
            
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
    // 4. EVENT LISTENERS E INTEGRAZIONE
    // =================================================================

    // --- Listeners per i sottomenu ---
    if (btnListini) btnListini.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnListini, submenuListini); });
    if (btnConfiguratori) btnConfiguratori.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnConfiguratori, submenuConfiguratori); });

    // --- Listeners per il pannello "Aggiungi Categoria" ---
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);

    // --- Listener per la barra di ricerca ---
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // --- Listener per aprire il MODAL al click su un risultato della ricerca ---
    if (searchResultsContainer) {
        searchResultsContainer.addEventListener('click', (event) => {
            const resultItem = event.target.closest('.result-item');
            if (!resultItem) return;

            event.preventDefault();
            const productId = resultItem.getAttribute('data-product-id');
            const product = allSearchableData.find(p => p.id === productId);

            if (product) {
                populateAndShowModal(product);
                searchResultsContainer.style.display = 'none';
                searchInput.value = '';
                searchInput.blur();
            } else {
                console.error("Prodotto non trovato con ID:", productId);
                alert("Si è verificato un errore, il prodotto non è stato trovato.");
            }
        });
    }
    
    // --- Listener Globale per chiudere popup e menu ---
    document.addEventListener('click', (event) => {
        // Chiudi sottomenu
        if (currentlyOpenSubmenu.menu && !currentlyOpenSubmenu.menu.contains(event.target) && !currentlyOpenSubmenu.btn.contains(event.target)) {
            toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu);
        }
        // Chiudi risultati ricerca
        if (searchResultsContainer && !searchResultsContainer.contains(event.target) && event.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });
    
    // --- Listeners per la chiusura del MODAL ---
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (detailsModalOverlay) {
        detailsModalOverlay.addEventListener('click', (event) => {
            if (event.target === detailsModalOverlay) closeModal();
        });
    }
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && detailsModalOverlay && detailsModalOverlay.classList.contains('visible')) {
            closeModal();
        }
    });

    // --- Observer per avviare il tutto dopo il login ---
    if (appContent) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!appContent.classList.contains('hidden')) {
                        fetchAllSearchableData();
                    } else {
                        allSearchableData = [];
                        isDataFetched = false;
                        if(searchResultsContainer) searchResultsContainer.style.display = 'none';
                        if(searchInput) searchInput.value = '';
                    }
                }
            }
        });
        observer.observe(appContent, { attributes: true });
    }
});
