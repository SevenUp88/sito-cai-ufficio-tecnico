/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * VERSIONE FINALE: Gestisce la ricerca e la visualizzazione per Clima, Caldaie e Scaldabagni
 * con effetto HOVER per gli attacchi caldaia.
 */
document.addEventListener('DOMContentLoaded', () => {

    // 1. SELEZIONE DEGLI ELEMENTI DOM
    // ===================================
    const mainNav = document.getElementById('mainNav');
    const appContent = document.getElementById('app-content');
    const db = firebase.firestore();

    const btnListini = document.getElementById('btn-listini');
    const submenuListini = document.getElementById('submenu-listini');
    const btnConfiguratori = document.getElementById('btn-configuratori');
    const submenuConfiguratori = document.getElementById('submenu-configuratori');
    const btnFgas = document.getElementById('btn-fgas');
    const submenuFgas = document.getElementById('submenu-fgas');

    const addCategoryTriggerBtn = document.getElementById('add-category-trigger');
    const addCategoryPanel = document.getElementById('add-category-panel');
    const addCategoryCloseBtn = document.getElementById('add-category-close');
    const categoryNameInput = document.getElementById('category-name');
    const categoryPathInput = document.getElementById('category-path');
    const categoryIconInput = document.getElementById('category-icon');
    const addCategorySubmitBtn = document.getElementById('add-category-submit');

    const adminOverlay = document.getElementById('admin-overlay');
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const detailsModalOverlay = document.getElementById('product-details-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // 2. VARIABILI DI STATO
    // =======================
    let allSearchableData = [];
    let currentlyDisplayedResults = [];
    let isDataFetched = false;
    const currentlyOpenSubmenu = { btn: null, menu: null };

    // 3. FUNZIONI
    // =============

    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;
        const isVisible = submenu.classList.toggle('visible');
        button.setAttribute('aria-expanded', isVisible);
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
        }
        currentlyOpenSubmenu.btn = isVisible ? button : null;
        currentlyOpenSubmenu.menu = isVisible ? submenu : null;
    };

    const showAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.remove('hidden'); if (adminOverlay) adminOverlay.classList.remove('hidden'); };
    const hideAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.add('hidden'); if (adminOverlay) adminOverlay.classList.add('hidden'); };
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

    const formatPrice = (price) => {
        const numericPrice = Number(price);
        return !isNaN(numericPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice) : 'N/D';
    };
    
    const createDetailRowHTML = (label, value, unit = '') => {
        if (value == null || String(value).trim() === '') return '';
        let displayValue = !isNaN(parseFloat(value)) && isFinite(value) ? String(value).replace('.', ',') : value;
        return `<li><strong>${label}:</strong><span>${displayValue}${unit}</span></li>`;
    };
    
    const getCorrectedPath = (path, category, isLogo = false) => {
        const placeholder = 'LISTINI/CLIMA/images/placeholder.png';
        if (!path || !category) return placeholder;
        const imageFolder = (category === 'clima') ? 'images' : 'img';
        let basePath = `LISTINI/${category.toUpperCase()}/${imageFolder}/`;
        if (isLogo) basePath += 'logos/';
        if (path.startsWith('../')) path = path.substring(path.lastIndexOf('../') + 3);
        path = path.replace(/^(images|img)\//, '');
        return `${basePath}${path}`;
    };

    const closeModal = () => {
        document.body.classList.remove('modal-open');
        if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible');
    };
    
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
        const modalImageAttachments = document.getElementById('modal-image-attachments');
        const modalEnergyBadges = document.querySelector('.modal-energy-badges-container');
        const modalEnergyCooling = document.getElementById('modal-energy-cooling');
        const modalEnergyHeating = document.getElementById('modal-energy-heating');
        const modalProductPrice = document.getElementById('modal-product-price');
        const modalDatasheetLink = document.getElementById('modal-datasheet-link');
        const modalTechDetails = document.getElementById('modal-tech-details');

        modalImageUi.src = ''; modalImageUe.src = '';
        if (modalImageAttachments) modalImageAttachments.src = '';
        modalImageUi.style.display = 'none'; modalImageUe.style.display = 'none';
        if (modalEnergyBadges) modalEnergyBadges.style.display = 'none';
        if(modalEnergyCooling) modalEnergyCooling.classList.remove('visible');
        if(modalEnergyHeating) modalEnergyHeating.classList.remove('visible');
        
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
        modalTypeBadge.innerHTML = `${derived_type}<br>${powerText}`;
        modalWifiIcon.style.display = wifi === true ? 'block' : 'none';

        let techDetailsHTML = '';
        const setImage = (el, path) => { el.src = path; el.style.display = 'block'; el.onerror = () => { el.src = 'LISTINI/CLIMA/images/placeholder.png'; }; };

        if (derived_type === 'Monosplit' || derived_type === 'U. Interna' || derived_type === 'U. Esterna') {
            if(modalEnergyBadges) modalEnergyBadges.style.display = 'block';
            const uiImagePath = product.image_url ? getCorrectedPath(product.image_url, 'clima') : `LISTINI/CLIMA/images/${(modelName).toLowerCase().replace(/\s+/g, '')}.png`;
            const ueImagePath = `LISTINI/CLIMA/images/est_${safeBrandName}.png`;
            if (derived_type === 'Monosplit') { setImage(modalImageUi, uiImagePath); setImage(modalImageUe, ueImagePath); }
            else if (derived_type === 'U. Esterna') { setImage(modalImageUe, ueImagePath); }
            else if (derived_type === 'U. Interna') { setImage(modalImageUi, uiImagePath); }
            techDetailsHTML = `<h3>Specifiche Tecniche</h3><ul>${createDetailRowHTML('Articolo Fornitore', product.articolo_fornitore)}${createDetailRowHTML('Dimensioni UI (AxLxP)', product.dimensioni_ui, ' mm')}${createDetailRowHTML('Peso UI', product.peso_ui, ' kg')}${createDetailRowHTML('Dimensioni UE (AxLxP)', product.dimensioni_ue, ' mm')}${createDetailRowHTML('Peso UE', product.peso_ue, ' kg')}</ul><h3>Dettagli Energetici</h3><ul>${createDetailRowHTML('Gas Refrigerante', product.gas)}${createDetailRowHTML('Contenuto Gas', product.quantita_gas, ' kg')}${createDetailRowHTML('EER', product.eer)}${createDetailRowHTML('COP', product.cop)}</ul><h3>Attacchi Tubazioni</h3><ul>${createDetailRowHTML('Liquido', product.tubazione_liquido, ' "')}${createDetailRowHTML('Gas', product.tubazione_gas, ' "')}</ul>`;
        } else if (derived_type === 'Caldaia') {
            setImage(modalImageUi, getCorrectedPath(product.nome_immagine, 'caldaie'));
            const attachmentsImagePath = getCorrectedPath(product.attacchi_immagine_url, 'caldaie');
            if (modalImageAttachments && attachmentsImagePath) {
                modalImageAttachments.src = attachmentsImagePath;
            }
            techDetailsHTML = `<h3>Specifiche Tecniche</h3><ul>${createDetailRowHTML('Tipologia', product.tipologia)}${createDetailRowHTML('Potenza Nominale', product.potenza_kw, ' kW')}${createDetailRowHTML('Dimensioni (AxLxP)', product.dimensioni, ' mm')}${createDetailRowHTML('Peso', product.peso, ' kg')}${createDetailRowHTML('Incasso', product.incasso ? 'Sì' : 'No')}</ul>`;
        } else if (derived_type === 'Scaldabagno') {
            setImage(modalImageUi, getCorrectedPath(product.image_url, 'scaldabagni'));
            techDetailsHTML = `<h3>Specifiche Tecniche</h3><ul>${createDetailRowHTML('Tecnologia', product.tecnologia)}${createDetailRowHTML('Configurazione', product.configurazione)}${createDetailRowHTML('Capacità', product.litri, ' litri')}${createDetailRowHTML('Installazione', product.installazione)}${createDetailRowHTML('Orientamento', product.orientamento)}${createDetailRowHTML('Dimensioni', product.dimensioni)}</ul>`;
        }
        
        const coolingClass = product.classe_energetica_raffrescamento;
        const heatingClass = product.classe_energetica_riscaldamento;
        modalEnergyCooling.classList.toggle('visible', !!coolingClass);
        modalEnergyHeating.classList.toggle('visible', !!heatingClass);
        if (coolingClass) modalEnergyCooling.textContent = coolingClass;
        if (heatingClass) modalEnergyHeating.textContent = heatingClass;
        
        modalProductPrice.textContent = formatPrice(product[product.config.price_field]);
        const datasheetUrl = product.scheda_tecnica_url || product.datasheetUrl;
        const hasValidUrl = !!(datasheetUrl && String(datasheetUrl).trim());
        modalDatasheetLink.classList.toggle('visible', hasValidUrl);
        if (hasValidUrl) modalDatasheetLink.href = datasheetUrl.trim();
        modalTechDetails.innerHTML = techDetailsHTML.replace(/<ul[^>]*>\s*<\/ul>/g, '');
        
        document.body.classList.add('modal-open');
        detailsModalOverlay.classList.add('visible');
    };
    
    const fetchAllSearchableData = async () => { /* ... Il tuo codice esistente ... */ };
    const handleSearch = () => { /* ... Il tuo codice esistente ... */ };
    const displayResults = (results) => { /* ... Il tuo codice esistente ... */ };
    
    // 4. EVENT LISTENERS
    // ====================
    if (btnListini) { btnListini.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnListini, submenuListini); }); }
    if (btnConfiguratori) { btnConfiguratori.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnConfiguratori, submenuConfiguratori); }); }
    if (btnFgas) { btnFgas.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnFgas, submenuFgas); }); }
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);
    if (searchInput) { searchInput.addEventListener('input', handleSearch); searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }); }

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
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalAndClearSearch);
    if (detailsModalOverlay) {
        detailsModalOverlay.addEventListener('click', (e) => {
            if (e.target === detailsModalOverlay) closeModalAndClearSearch();
        });
    }
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailsModalOverlay?.classList.contains('visible')) {
            closeModalAndClearSearch();
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
                    if (!isHidden && !isDataFetched) fetchAllSearchableData();
                    else if (isHidden) { allSearchableData = []; isDataFetched = false; }
                }
            });
        });
        observer.observe(appContent, { attributes: true });
    }
});
