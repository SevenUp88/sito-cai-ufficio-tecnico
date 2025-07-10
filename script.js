/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * VERSIONE MIGLIORATA: codice riformattato, più leggibile, robusto e manutenibile.
 * Correzione specifica per la visualizzazione di tutti i dati dalla modale.
 */
document.addEventListener('DOMContentLoaded', () => {

    // 1. SELEZIONE DEGLI ELEMENTI DOM
    // ===================================
    const mainNav = document.getElementById('mainNav');
    const appContent = document.getElementById('app-content');
    const db = firebase.firestore();

    // Elementi Navigazione e Sottomenu
    const btnListini = document.getElementById('btn-listini');
    const submenuListini = document.getElementById('submenu-listini');
    const btnConfiguratori = document.getElementById('btn-configuratori');
    const submenuConfiguratori = document.getElementById('submenu-configuratori');

    // Elementi Pannello Admin
    const addCategoryTriggerBtn = document.getElementById('add-category-trigger');
    const addCategoryPanel = document.getElementById('add-category-panel');
    const addCategoryCloseBtn = document.getElementById('add-category-close');
    const categoryNameInput = document.getElementById('category-name');
    const categoryPathInput = document.getElementById('category-path');
    const categoryIconInput = document.getElementById('category-icon');
    const addCategorySubmitBtn = document.getElementById('add-category-submit');
    const addCategoryFeedback = document.getElementById('add-category-feedback');
    const adminOverlay = document.getElementById('admin-overlay');

    // Elementi Ricerca
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');

    // Elementi Modale Dettagli Prodotto
    const detailsModalOverlay = document.getElementById('product-details-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalProductLogo = document.getElementById('modal-product-logo');
    const modalProductBrand = document.getElementById('modal-product-brand');
    const modalProductModel = document.getElementById('modal-product-model');
    const modalProductImage = document.getElementById('modal-product-image');
    const modalProductPrice = document.getElementById('modal-product-price');
    const modalDatasheetLink = document.getElementById('modal-datasheet-link');


    // 2. VARIABILI DI STATO
    // =======================
    let allSearchableData = [];
    let currentlyDisplayedResults = [];
    let isDataFetched = false;
    const currentlyOpenSubmenu = {
        btn: null,
        menu: null
    };


    // 3. FUNZIONI
    // =============

    /**
     * Gestisce l'apertura e la chiusura dei sottomenu.
     * @param {HTMLElement} button - Il pulsante che controlla il sottomenu.
     * @param {HTMLElement} submenu - Il sottomenu da mostrare/nascondere.
     */
    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;

        const isVisible = submenu.classList.toggle('visible');
        button.setAttribute('aria-expanded', isVisible);

        // Chiude un altro sottomenu se è aperto
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) {
                currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
            }
        }

        // Aggiorna lo stato del sottomenu correntemente aperto
        currentlyOpenSubmenu.btn = isVisible ? button : null;
        currentlyOpenSubmenu.menu = isVisible ? submenu : null;
    };

    /** Mostra il pannello admin per aggiungere una categoria. */
    const showAddCategoryPanel = () => {
        if (addCategoryPanel) addCategoryPanel.classList.remove('hidden');
        if (adminOverlay) adminOverlay.classList.remove('hidden');
    };

    /** Nasconde il pannello admin. */
    const hideAddCategoryPanel = () => {
        if (addCategoryPanel) addCategoryPanel.classList.add('hidden');
        if (adminOverlay) adminOverlay.classList.add('hidden');
    };

    /** Aggiunge una nuova categoria alla navigazione principale. */
    const handleAddCategorySubmit = () => {
        if (!categoryNameInput || !categoryPathInput || !categoryIconInput) return;
        const name = categoryNameInput.value.trim();
        const path = categoryPathInput.value.trim();
        const iconClass = categoryIconInput.value.trim() || 'fas fa-folder'; // Icona di default

        if (!name || !path) {
            // Qui si potrebbe aggiungere un feedback per l'utente
            return;
        }

        const link = document.createElement('a');
        link.href = path;
        link.className = 'nav-button';

        const icon = document.createElement('i');
        icon.className = iconClass;

        link.append(icon, ` ${name}`);
        mainNav.appendChild(link);
        // Aggiungere feedback di successo e pulire i campi
    };

    /**
     * Formatta un numero come valuta in Euro.
     * @param {string|number} price - Il prezzo da formattare.
     * @returns {string} Il prezzo formattato o 'N/D'.
     */
    const formatPrice = (price) => {
        const numericPrice = Number(price);
        if (!isNaN(numericPrice) && String(price).trim() !== '') {
            return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice);
        }
        return 'N/D';
    };
    
    /**
     * Crea una riga HTML per i dettagli tecnici, solo se il valore è valido.
     * @param {string} label - L'etichetta della specifica.
     * @param {string|number|null} value - Il valore della specifica.
     * @param {string} [unit=''] - L'unità di misura.
     * @returns {string} La stringa HTML della riga o una stringa vuota.
     */
    const createDetailRowHTML = (label, value, unit = '') => {
        if (value == null || String(value).trim() === '' || String(value) === 'Dati mancanti') {
            return '';
        }
        // Formatta i numeri con due decimali e virgola
        let displayValue = !isNaN(parseFloat(value)) && isFinite(value) 
            ? Number(value).toFixed(2).replace('.', ',') 
            : value;

        return `<li><strong>${label}:</strong><span>${displayValue}${unit}</span></li>`;
    };
    
    /**
     * Corregge i percorsi delle immagini per funzionare dalla root.
     * @param {string} path - Il percorso originale.
     * @returns {string} Il percorso corretto.
     */
    const getCorrectedPath = (path) => {
        if (path && path.startsWith('../')) {
            // Esempio: ../images/logos/brand.png -> LISTINI/CLIMA/images/logos/brand.png
            return `LISTINI/CLIMA/${path.substring(3)}`;
        }
        return path || 'LISTINI/CLIMA/images/placeholder.png';
    };

    /** Chiude la modale dei dettagli prodotto. */
    const closeModal = () => {
        document.body.classList.remove('modal-open');
        if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible');
    };
    
    /**
  * Popola e mostra la modale con i dettagli del prodotto selezionato.
     * @param {object} product - L'oggetto prodotto completo, inclusi i dati derivati.
     */
    const populateAndShowModal = (product) => {
        if (!product || !detailsModalOverlay) return;

        // --- 1. Seleziona tutti gli elementi del modale ---
        const modalBrandLogo = document.getElementById('modal-brand-logo');
        const modalProductBrand = document.getElementById('modal-product-brand');
        const modalProductModel = document.getElementById('modal-product-model');
        const modalProductCode = document.getElementById('modal-product-code');
        const modalTypeBadge = document.getElementById('modal-product-type-badge');
        const modalWifiIcon = document.getElementById('modal-wifi-icon');
        const modalImageUi = document.getElementById('modal-image-ui');
        const modalImageUe = document.getElementById('modal-image-ue');
        const modalEnergyCooling = document.getElementById('modal-energy-cooling');
        const modalEnergyHeating = document.getElementById('modal-energy-heating');
        const modalProductPrice = document.getElementById('modal-product-price');
        const modalDatasheetLink = document.getElementById('modal-datasheet-link');
        const modalTechDetails = document.getElementById('modal-tech-details');
        
        // --- 2. Prepara e "pulisce" i dati ---
        const { marca, modello, codice_prodotto, potenza, wifi, derived_type } = product;
        const brandName = marca || 'N/D';
        const modelName = modello || product.nome_modello_ue || product.nome_modello_ui || 'N/D';
        const safeBrandName = brandName.toLowerCase().replace(/\s+/g, '');
        // Correzione: gestisce sia stringhe "2,5kW - 9000BTU" che numeri
        const powerText = typeof potenza === 'number' ? `${potenza.toFixed(1).replace('.',',')} kW` : (String(potenza) || '').split('-')[0].trim();

        // --- 3. Popola l'Header ---
        modalBrandLogo.src = getCorrectedPath(`../images/logos/${safeBrandName}.png`);
        modalProductBrand.textContent = brandName;
        modalProductModel.textContent = modelName;
        modalProductCode.innerHTML = `CODICE PRODOTTO: <strong>${codice_prodotto || 'N/D'}</strong>`;
        modalTypeBadge.innerHTML = `Sistema<br>${derived_type} - ${powerText}`;
        modalWifiIcon.style.display = wifi === true ? 'block' : 'none';

        // --- 4. Popola la Colonna Sinistra (Immagini, Energia, Prezzo) ---
        
        // Reset iniziale
        modalImageUi.style.display = 'none';
        modalImageUe.style.display = 'none';
        modalImageUi.src = 'LISTINI/CLIMA/images/placeholder.png'; // Imposta un'immagine di fallback
        modalImageUe.src = 'LISTINI/CLIMA/images/placeholder.png';

        // Logica per le immagini
        const uiImageFromProduct = product.image_url;
        const ueImageFromProduct = product.image_url_ue; // Assumiamo che possa esistere un campo image_url_ue

        if (derived_type === 'Monosplit') {
            modalImageUi.src = getCorrectedPath(uiImageFromProduct) || getCorrectedPath(`../images/int_${safeBrandName}.jpg`);
            // CORREZIONE: Cerca l'immagine UE o costruiscila
            modalImageUe.src = getCorrectedPath(ueImageFromProduct) || getCorrectedPath(`../images/est_${safeBrandName}.jpg`);
            modalImageUi.style.display = 'block';
            modalImageUe.style.display = 'block';
        } else if (derived_type === 'U. Esterna') {
            modalImageUe.src = getCorrectedPath(uiImageFromProduct) || getCorrectedPath(`../images/est_${safeBrandName}.jpg`);
            modalImageUe.style.display = 'block';
        } else if (derived_type === 'U. Interna') {
            modalImageUi.src = getCorrectedPath(uiImageFromProduct) || getCorrectedPath(`../images/int_${safeBrandName}.jpg`);
            modalImageUi.style.display = 'block';
        }
        
        // Badge Energetici
        const coolingClass = product.classe_energetica_raffrescamento;
        const heatingClass = product.classe_energetica_riscaldamento;
        modalEnergyCooling.style.display = coolingClass ? 'inline-block' : 'none';
        modalEnergyHeating.style.display = heatingClass ? 'inline-block' : 'none';
        if (coolingClass) modalEnergyCooling.textContent = coolingClass;
        if (heatingClass) modalEnergyHeating.textContent = heatingClass;
        
        // --- CORREZIONE: Prezzo & Scheda Tecnica ---
        const priceField = product.config.price_field;
        modalProductPrice.textContent = formatPrice(product[priceField]);
        const datasheetUrl = product.scheda_tecnica_url;
        const hasValidUrl = datasheetUrl && typeof datasheetUrl === 'string' && datasheetUrl.trim() !== '' && datasheetUrl.trim() !== '#';
        modalDatasheetLink.classList.toggle('visible', hasValidUrl);
        if (hasValidUrl) modalDatasheetLink.href = datasheetUrl.trim();

        // --- 5. Popola la Colonna Destra (Dettagli Tecnici) ---
        const hasEnergyData = derived_type !== 'U. Interna';
        // CORREZIONE: Logica tubazioni più robusta
        const hasPipingData = product.tubazione_liquido || product.tubazione_gas;

        const techDetailsHTML = `
            <h3>Specifiche Tecniche</h3>
            <ul>
                ${createDetailRowHTML('Articolo Fornitore', product.articolo_fornitore)}
                ${createDetailRowHTML('Dimensioni UI (AxLxP)', product.dimensioni_ui || product.dimensioni_peso_ui, ' mm')}
                ${createDetailRowHTML('Peso UI', product.peso_ui, ' kg')}
                ${createDetailRowHTML('Dimensioni UE (AxLxP)', product.dimensioni_ue, ' mm')}
                ${createDetailRowHTML('Peso UE', product.peso_ue, ' kg')}
            </ul>
            ${hasEnergyData ? `
            <h3>Dettagli Energetici</h3>
            <ul>
                ${createDetailRowHTML('Gas Refrigerante', product.tipo_refrigerante || product.gas)}
                ${createDetailRowHTML('Contenuto Gas', product.quantita_refrigerante_kg || product.quantita_gas, ' kg')}
                ${createDetailRowHTML('EER', product.eer)}
                ${createDetailRowHTML('COP', aproduct.cop)}
            </ul>` : ''}
            ${hasPipingData ? `
            <h3>Attacchi Tubazioni</h3>
            <ul>
                ${createDetailRowHTML('Liquido', product.tubazione_liquido, ' "')}
                ${createDetailRowHTML('Gas', product.tubazione_gas, ' "')}
            </ul>` : ''}
        `;
        
        let finalHTML = techDetailsHTML.replace(/<ul[^>]*>\s*<\/ul>/g, '');
        finalHTML = finalHTML.replace(/<h3[^>]*>\s*(?=<h3|$)/g, '');
        modalTechDetails.innerHTML = finalHTML;
        
        // --- 6. Mostra il modale ---
        document.body.classList.add('modal-open');
        detailsModalOverlay.classList.add('visible');
    };
    
    /** Carica tutti i dati ricercabili da Firebase. */
    const fetchAllSearchableData = async () => {
        if (isDataFetched) return;

        searchInput.disabled = true;
        searchInput.placeholder = 'Caricamento dati...';

        const collectionConfigs = [
            // Il nome della collezione in Firestore deve essere 'prodottiClimaMonosplit'
            { name: 'prodottiClimaMonosplit', config: { code_field: 'codice_prodotto', price_field: 'prezzo' } },
            { name: 'outdoorUnits', config: { code_field: 'codice_prodotto', price_field: 'prezzo' } },
            { name: 'indoorUnits', config: { code_field: 'codice_prodotto', price_field: 'prezzo_ui' } }
        ];
        
        const promises = collectionConfigs.map(async (collectionConfig) => {
            try {
                const snapshot = await db.collection(collectionConfig.name).get();
                return snapshot.docs.map(doc => {
                    const data = doc.data();

                    // --- NUOVA LOGICA DI IDENTIFICAZIONE ---
                    const hasUI = data.dimensioni_ui || data.dimensioni_peso_ui;
                    const hasUE = data.dimensioni_ue;
                    let productType = 'Prodotto';
                    let imageUrl = data.image_url || '';
                    const brand = (data.marca || '').toLowerCase().replace(/\s+/g, '');

                    if (hasUI && hasUE) {
                        productType = 'Monosplit';
                        // Se non c'è un'immagine specifica, proviamo con quella dell'unità interna
                        if (!imageUrl && brand) imageUrl = `../images/int_${brand}.jpg`;
                    } else if (hasUE) {
                        productType = 'U. Esterna';
                        if (!imageUrl && brand) imageUrl = `../images/est_${brand}.jpg`;
                    } else if (hasUI) {
                        productType = 'U. Interna';
                        if (!imageUrl && brand) imageUrl = `../images/int_${brand}.jpg`;
                    }
                    // --- FINE NUOVA LOGICA ---

                    return {
                        ...data, // Manteniamo tutti i dati originali per il modale
                        id: doc.id,
                        // Dati aggiuntivi per la ricerca e la visualizzazione
                        derived_type: productType,
                        derived_image: getCorrectedPath(imageUrl),
                        config: collectionConfig.config // Manteniamo la config originale
                    };
                });
            } catch (error) {
                console.error(`Errore nel caricamento della collezione '${collectionConfig.name}':`, error);
                return []; 
            }
        });
        
        const results = await Promise.all(promises);
        allSearchableData = results.flat(); 
        
        isDataFetched = true;
        searchInput.disabled = false;
        searchInput.placeholder = 'Cerca per codice o descrizione articolo...';
        console.log(`Caricamento completato. ${allSearchableData.length} articoli indicizzati.`);
    };

    /**
     * Filtra i dati in base alla query di ricerca.
     */
    const handleSearch = () => {
        if (!searchInput) return;

        const query = searchInput.value.trim();
        if (query.length < 3) {
            displayResults([]);
            return;
        }

        const isNumericQuery = /^\d+$/.test(query);
        const lowerCaseQuery = query.toLowerCase();

        const results = allSearchableData.filter(item => {
            if (isNumericQuery) {
                const productCode = item[item.config.code_field];
                if (!productCode) return false;
                if (/^\d+$/.test(String(productCode))) {
                    return String(productCode) === query;
                }
                const numericParts = String(productCode).match(/\d+/g) || [];
                return numericParts.some(part => part === query);
            }

            return (
                item.modello?.toLowerCase().includes(lowerCaseQuery) ||
                item.marca?.toLowerCase().includes(lowerCaseQuery) ||
                item.nome_modello_ue?.toLowerCase().includes(lowerCaseQuery)
            );
        });

        currentlyDisplayedResults = results;
        displayResults(results);
    };

    /**
     * Mostra i risultati della ricerca nel contenitore.
     * @param {Array<object>} results - L'array dei risultati da mostrare.
     */
    const displayResults = (results) => {
        if (!searchResultsContainer) return;

        searchResultsContainer.innerHTML = '';
        if (results.length === 0 && searchInput.value.length > 2) {
            searchResultsContainer.style.display = 'block';
            searchResultsContainer.innerHTML = `<div class="result-item-empty">Nessun risultato trovato.</div>`;
            return;
        }

        if (results.length === 0) {
            searchResultsContainer.style.display = 'none';
            return;
        }

        searchResultsContainer.style.display = 'block';
        results.slice(0, 20).forEach((item, index) => { 
            const resultElement = document.createElement('a');
            resultElement.href = "#";
            resultElement.className = 'result-item';
            resultElement.dataset.resultIndex = index;

            // Dati per la visualizzazione
            const description = [item.marca, item.modello || item.nome_modello_ue, item.potenza].filter(Boolean).join(' ');
            const price = formatPrice(item[item.config.price_field]);
            const supplierInfo = item.articolo_fornitore || `Codice: ${item[item.config.code_field] || 'N/D'}`;
            const imageHTML = item.derived_image 
                ? `<img src="${item.derived_image}" alt="${description}" class="result-image" onerror="this.style.display='none'"/>`
                : '<div class="result-image-placeholder"></div>';

            resultElement.innerHTML = `
                ${imageHTML}
                <div class="result-info">
                    <div class="result-header">
                        <span class="result-name">${description || 'Prodotto'}</span>
                        <span class="result-type">${item.derived_type}</span>
                    </div>
                    <p class="result-supplier-item">${supplierInfo}</p>
                </div>
                <div class="result-price">${price}</div>
            `;
            searchResultsContainer.appendChild(resultElement);
        });
    };
    

    // 4. EVENT LISTENERS
    // ====================

    if (btnListini) {
        btnListini.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSubmenu(btnListini, submenuListini);
        });
    }

    if (btnConfiguratori) {
        btnConfiguratori.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSubmenu(btnConfiguratori, submenuConfiguratori);
        });
    }

    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    }

    if (searchResultsContainer) {
        searchResultsContainer.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.result-item');
            if (!resultItem) return;

            e.preventDefault();
            const resultIndex = parseInt(resultItem.dataset.resultIndex, 10);
            const product = currentlyDisplayedResults[resultIndex];

            if (product) {
                populateAndShowModal(product);
                searchResultsContainer.style.display = 'none'; 
                searchInput.value = '';
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (currentlyOpenSubmenu.menu && !currentlyOpenSubmenu.menu.contains(e.target) && !currentlyOpenSubmenu.btn.contains(e.target)) {
            toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu);
        }
        if (searchResultsContainer && !searchResultsContainer.contains(e.target) && e.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });

    const closeModalAndClearSearch = () => {
        closeModal();
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalAndClearSearch);
    if (detailsModalOverlay) {
        detailsModalOverlay.addEventListener('click', (e) => {
            if (e.target === detailsModalOverlay) {
                closeModalAndClearSearch();
            }
        });
    }
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailsModalOverlay?.classList.contains('visible')) {
            e.preventDefault();
            closeModalAndClearSearch();
        }
    });

    
    // 5. INIZIALIZZAZIONE
    // =====================
    if (appContent) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {
                    const isHidden = appContent.classList.contains('hidden');
                    if (!isHidden && !isDataFetched) {
                        fetchAllSearchableData();
                    } else if (isHidden) {
                        allSearchableData = [];
                        isDataFetched = false;
                    }
                }
            });
        });

        observer.observe(appContent, { attributes: true });
    }
});
