/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * VERSIONE FINALE: Gestisce la ricerca e la visualizzazione per Clima, Caldaie e Scaldabagni.
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
    const btnFgas = document.getElementById('btn-fgas');
    const submenuFgas = document.getElementById('submenu-fgas');

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
    
    // Elementi Overlay Attacchi
    const attachmentsOverlay = document.getElementById('attachments-overlay');
    const attachmentsImage = document.getElementById('attachments-image');
    const closeAttachmentsBtn = document.getElementById('close-attachments-btn');

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
     */
    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;
        const isVisible = submenu.classList.toggle('visible');
        button.setAttribute('aria-expanded', isVisible);
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) {
                currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
            }
        }
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
        const iconClass = categoryIconInput.value.trim() || 'fas fa-folder';
        if (!name || !path) return;
        const link = document.createElement('a');
        link.href = path;
        link.className = 'nav-button';
        const icon = document.createElement('i');
        icon.className = iconClass;
        link.append(icon, ` ${name}`);
        mainNav.appendChild(link);
    };

    /** Formatta un numero come valuta in Euro. */
    const formatPrice = (price) => {
        const numericPrice = Number(price);
        if (!isNaN(numericPrice) && String(price).trim() !== '') {
            return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice);
        }
        return 'N/D';
    };
    
    /** Crea una riga HTML per l'elenco puntato dei dettagli tecnici. */
    const createDetailRowHTML = (label, value, unit = '') => {
        if (value == null || String(value).trim() === '') return '';
        let displayValue = !isNaN(parseFloat(value)) && isFinite(value) 
            ? String(value).replace('.', ',') 
            : value;
        return `<li><strong>${label}:</strong><span>${displayValue}${unit}</span></li>`;
    };
    
    /** Corregge i percorsi delle immagini per funzionare dalla root. */
    const getCorrectedPath = (path, category, isLogo = false) => {
        const placeholder = 'LISTINI/CLIMA/images/placeholder.png';
        if (!path || !category) return placeholder;
        const imageFolder = (category === 'clima') ? 'images' : 'img';
        let basePath = `LISTINI/${category.toUpperCase()}/${imageFolder}/`;
        if (isLogo) {
            basePath += 'logos/';
        }
        if (path.startsWith('../')) path = path.substring(path.lastIndexOf('../') + 3);
        path = path.replace(/^(images|img)\//, '');
        return `${basePath}${path}`;
    };

    /** Chiude la modale dei dettagli prodotto. */
    const closeModal = () => {
        document.body.classList.remove('modal-open');
        if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible');
    };
    
    /**
     * Popola e mostra il modale con i dettagli del prodotto selezionato.
     */
    const populateAndShowModal = (product) => {
        if (!product || !detailsModalOverlay) return;

        const modalBrandLogo = document.getElementById('modal-brand-logo');
        const modalProductBrand = document.getElementById('modal-product-brand');
        const modalProductModel = document.getElementById('modal-product-model');
        const modalProductCode = document.getElementById('modal-product-code');
        const modalTypeBadge = document.getElementById('modal-product-type-badge');
        const modalWifiIcon = document.getElementById('modal-wifi-icon');
        const modalImageUi = document.getElementById('modal-image-ui');
        const modalImageUe = document.getElementById('modal-image-ue');
        const modalEnergyBadges = document.querySelector('.modal-energy-badges-container');
        const modalProductPrice = document.getElementById('modal-product-price');
        const modalDatasheetLink = document.getElementById('modal-datasheet-link');
        const modalTechDetails = document.getElementById('modal-tech-details');

        const { marca, brand, modello, model, potenza, powerKw, potenza_kw, wifi, derived_type } = product;
        const brandName = marca || brand || 'N/D';
        const modelName = modello || model || product.nome || 'N/D';
        const safeBrandName = brandName.toLowerCase().replace(/\s+/g, '');
        const powerText = potenza_kw || powerKw || (typeof potenza === 'number' ? `${potenza.toFixed(1).replace('.',',')} kW` : (String(potenza) || '').split('-')[0].trim());
        const codeText = product[product.config.code_field] || 'N/D';
        
        let logoCategory = 'clima';
        if (derived_type === 'Caldaia') logoCategory = 'caldaie';
        if (derived_type === 'Scaldabagno') logoCategory = 'scaldabagni';
        modalBrandLogo.src = getCorrectedPath(`${safeBrandName}.png`, logoCategory, true);
        
        modalProductBrand.textContent = brandName;
        modalProductModel.textContent = modelName;
        modalProductCode.innerHTML = `CODICE PRODOTTO: <strong>${codeText}</strong>`;
        modalTypeBadge.innerHTML = `Sistema<br>${derived_type} - ${powerText} kW`;
        modalWifiIcon.style.display = wifi === true ? 'block' : 'none';

        let techDetailsHTML = '';
        modalImageUi.style.display = 'none';
        modalImageUe.style.display = 'none';
        if (modalEnergyBadges) modalEnergyBadges.style.display = 'none';

        const setImage = (el, path) => { el.src = path; el.style.display = 'block'; el.onerror = () => { el.src = 'LISTINI/CLIMA/images/placeholder.png'; }; };

        if (derived_type === 'Monosplit' || derived_type === 'U. Interna' || derived_type === 'U. Esterna') {
            if(modalEnergyBadges) modalEnergyBadges.style.display = 'flex';
            const uiImagePath = product.image_url ? getCorrectedPath(product.image_url, 'clima') : `LISTINI/CLIMA/images/${(modelName).toLowerCase().replace(/\s+/g, '')}.png`;
            const ueImagePath = `LISTINI/CLIMA/images/est_${safeBrandName}.png`;
            if (derived_type === 'Monosplit') { setImage(modalImageUi, uiImagePath); setImage(modalImageUe, ueImagePath); }
            else if (derived_type === 'U. Esterna') { setImage(modalImageUe, ueImagePath); }
            else if (derived_type === 'U. Interna') { setImage(modalImageUi, uiImagePath); }
            techDetailsHTML = `
                <h3>Specifiche Tecniche</h3>
                <ul>${createDetailRowHTML('Articolo Fornitore', product.articolo_fornitore)}${createDetailRowHTML('Dimensioni UI (AxLxP)', product.dimensioni_ui, ' mm')}${createDetailRowHTML('Peso UI', product.peso_ui, ' kg')}${createDetailRowHTML('Dimensioni UE (AxLxP)', product.dimensioni_ue, ' mm')}${createDetailRowHTML('Peso UE', product.peso_ue, ' kg')}</ul>
                <h3>Dettagli Energetici</h3>
                <ul>${createDetailRowHTML('Gas Refrigerante', product.gas)}${createDetailRowHTML('Contenuto Gas', product.quantita_gas, ' kg')}${createDetailRowHTML('EER', product.eer)}${createDetailRowHTML('COP', product.cop)}</ul>
                <h3>Attacchi Tubazioni</h3>
                <ul>${createDetailRowHTML('Liquido', product.tubazione_liquido, ' "')}${createDetailRowHTML('Gas', product.tubazione_gas, ' "')}</ul>
            `;
        } else if (derived_type === 'Caldaia') {
            setImage(modalImageUi, getCorrectedPath(product.nome_immagine, 'caldaie'));
            const attachmentsImagePath = getCorrectedPath(product.attacchi_immagine_url, 'caldaie');
            techDetailsHTML = `
                <h3>Specifiche Tecniche</h3>
                <ul>
                    ${createDetailRowHTML('Tipologia', product.tipologia)}
                    ${createDetailRowHTML('Potenza Nominale', product.potenza_kw, ' kW')}
                    ${createDetailRowHTML('Dimensioni (AxLxP)', product.dimensioni, ' mm')}
                    ${createDetailRowHTML('Peso', product.peso, ' kg')}
                    ${createDetailRowHTML('Incasso', product.incasso ? 'Sì' : 'No')}
                </ul>
                <button class="attachments-button" data-image-src="${attachmentsImagePath}">
                    <i class="fas fa-project-diagram"></i> Mostra Attacchi
                </button>
            `;
        } else if (derived_type === 'Scaldabagno') {
            setImage(modalImageUi, getCorrectedPath(product.image_url, 'scaldabagni'));
            techDetailsHTML = `
                <h3>Specifiche Tecniche</h3>
                <ul>
                    ${createDetailRowHTML('Tecnologia', product.tecnologia)}
                    ${createDetailRowHTML('Configurazione', product.configurazione)}
                    ${createDetailRowHTML('Capacità', product.litri, ' litri')}
                    ${createDetailRowHTML('Installazione', product.installazione)}
                    ${createDetailRowHTML('Orientamento', product.orientamento)}
                    ${createDetailRowHTML('Dimensioni', product.dimensioni)}
                </ul>`;
        }
        
        modalProductPrice.textContent = formatPrice(product[product.config.price_field]);
        const datasheetUrl = product.scheda_tecnica_url || product.datasheetUrl;
        const hasValidUrl = !!(datasheetUrl && String(datasheetUrl).trim());
        modalDatasheetLink.classList.toggle('hidden', !hasValidUrl);
        if (hasValidUrl) modalDatasheetLink.href = datasheetUrl.trim();

        let finalHTML = techDetailsHTML.replace(/<ul[^>]*>\s*<\/ul>/g, '');
        finalHTML = finalHTML.replace(/<h3[^>]*>\s*(?=<h3|$)/g, '');
        modalTechDetails.innerHTML = finalHTML;
        
        document.body.classList.add('modal-open');
        detailsModalOverlay.classList.add('visible');
    };
    
    /** Carica tutti i dati ricercabili da Firebase. */
    const fetchAllSearchableData = async () => {
        if (isDataFetched) return;
        searchInput.disabled = true;
        searchInput.placeholder = 'Caricamento dati...';
        const collectionConfigs = [
            { name: 'prodottiClimaMonosplit', config: { code_field: 'codice_prodotto', price_field: 'prezzo' } },
            { name: 'outdoorUnits', config: { code_field: 'codice_prodotto', price_field: 'prezzo' } },
            { name: 'indoorUnits', config: { code_field: 'codice_prodotto', price_field: 'prezzo_ui' } },
            { name: 'prodottiCaldaie', config: { code_field: 'codice_prodotto', price_field: 'prezzo', type: 'Caldaia' } },
            { name: 'prodottiScaldabagno', config: { code_field: 'codice_prodotto', price_field: 'prezzo', type: 'Scaldabagno' } }
        ];
        const promises = collectionConfigs.map(async (collectionConfig) => {
            try {
                const snapshot = await db.collection(collectionConfig.name).get();
                return snapshot.docs.map(doc => {
                    const data = doc.data();
                    let productType = collectionConfig.config.type || 'Prodotto';
                    if (!collectionConfig.config.type) {
                        const hasUI = data.dimensioni_ui || data.dimensioni_peso_ui;
                        const hasUE = data.dimensioni_ue;
                        if (hasUI && hasUE) productType = 'Monosplit';
                        else if (hasUE) productType = 'U. Esterna';
                        else if (hasUI) productType = 'U. Interna';
                    }
                    return { ...data, id: doc.id, derived_type: productType, config: collectionConfig.config };
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
            const config = item.config;
            const productCode = item[config.code_field];
            const brand = item.marca || item.brand;
            const model = item.modello || item.model || item.nome;
            if (isNumericQuery) {
                if (!productCode) return false;
                return String(productCode).includes(query);
            }
            return (
                model?.toLowerCase().includes(lowerCaseQuery) ||
                brand?.toLowerCase().includes(lowerCaseQuery)
            );
        });
        currentlyDisplayedResults = results;
        displayResults(results);
    };

    /**
     * Mostra i risultati della ricerca nel contenitore.
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
            const brand = item.marca || item.brand;
            const model = item.modello || item.model || item.nome;
            const description = [brand, model].filter(Boolean).join(' ');
            const price = formatPrice(item[item.config.price_field]);
            const codeInfo = `Codice: ${item[item.config.code_field] || 'N/D'}`;
            resultElement.innerHTML = `
                <div class="result-info">
                    <div class="result-header">
                        <span class="result-name">${description || 'Prodotto'}</span>
                        <span class="result-type">${item.derived_type}</span>
                    </div>
                    <p class="result-supplier-item">${codeInfo}</p>
                </div>
                <div class="result-price">${price}</div>
            `;
            searchResultsContainer.appendChild(resultElement);
        });
    };
    
    // 4. EVENT LISTENERS
    // ====================
    if (btnListini) {
        btnListini.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnListini, submenuListini); });
    }
    if (btnConfiguratori) {
        btnConfiguratori.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnConfiguratori, submenuConfiguratori); });
    }
    if (btnFgas) {
        btnFgas.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnFgas, submenuFgas); });
    }
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
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

    const closeModalAndClearSearch = () => { closeModal(); };
    const hideAttachments = () => {
        if (attachmentsOverlay) attachmentsOverlay.classList.remove('visible');
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalAndClearSearch);
    if (detailsModalOverlay) {
        detailsModalOverlay.addEventListener('click', (e) => {
            const attachmentsButton = e.target.closest('.attachments-button');
            if (attachmentsButton) {
                const imgSrc = attachmentsButton.dataset.imageSrc;
                if (imgSrc && attachmentsOverlay && attachmentsImage) {
                    attachmentsImage.src = imgSrc;
                    attachmentsOverlay.classList.add('visible');
                }
                return;
            }
            if (e.target === detailsModalOverlay) {
                closeModalAndClearSearch();
            }
        });
    }
    if (closeAttachmentsBtn) closeAttachmentsBtn.addEventListener('click', hideAttachments);
    if (attachmentsOverlay) {
        attachmentsOverlay.addEventListener('click', (e) => {
            if (e.target === attachmentsOverlay) {
                hideAttachments();
            }
        });
    }
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (attachmentsOverlay?.classList.contains('visible')) {
                hideAttachments();
            } else if (detailsModalOverlay?.classList.contains('visible')) {
                closeModalAndClearSearch();
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        if (currentlyOpenSubmenu.menu && !currentlyOpenSubmenu.menu.contains(e.target) && !currentlyOpenSubmenu.btn.contains(e.target)) {
            toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu);
        }
        if (searchResultsContainer && !searchResultsContainer.contains(e.target) && e.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
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
