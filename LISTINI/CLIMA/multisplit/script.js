```javascript
/* File: script.js */
document.addEventListener('DOMContentLoaded', () => {
    // --- GESTIONE MODALITÀ ---
    let isAdmin = false;
    const ADMIN_PASSWORD = "123stella"; // Password for Monosplit admin mode
    let currentFilteredProducts = []; // For Monosplit filtering

    // --- STATO FILTRI E SEZIONI ---
    let currentBrandFilter = 'all'; // Monosplit filter state
    let showOnlyEconomic = false;  // Monosplit filter state
    let activeSection = 'multisplit'; // Default active section ('monosplit' or 'multisplit')

    // --- STATO CONFIGURATORE MULTISPLIT ---
    let multiState = {
        selectedBrand: null,
        selectedSplitType: null, // Number (2, 3, 4, 5, 6)
        selectedOutdoorUnit: null, // Object UE from multiProducts
        selectedIndoorUnits: [], // Array of objects UI from multiProducts (or null if not selected)
        compatibleOutdoorUnits: [],
        compatibleIndoorUnits: [],
        referenceCode: null,
    };
    // --- FINE STATO ---

    // Determine initial mode (start in operator mode)
    document.body.classList.add('operator-mode');

    // --- SELEZIONE ELEMENTI DOM ---
    // Grids & Sections
    const monosplitGrid = document.getElementById('monosplit-grid');
    const monosplitSection = document.getElementById('monosplit-section');
    const multisplitSection = document.getElementById('multisplit-section');
    const sections = { monosplit: monosplitSection, multisplit: multisplitSection };

    // Header Controls
    const adminTrigger = document.getElementById('admin-trigger');
    const exitAdminButton = document.getElementById('exit-admin-button');
    const printButton = document.getElementById('print-button'); // General print button

    // Admin Panel (for Monosplit)
    const passwordPanel = document.getElementById('password-panel');
    const closePanelButton = document.getElementById('close-panel-btn');
    const passwordInput = document.getElementById('admin-password');
    const submitPasswordButton = document.getElementById('submit-password-btn');
    const passwordError = document.getElementById('password-error');

    // Monosplit Filters & Section Tabs
    const monosplitFiltersContainer = document.getElementById('monosplit-filters');
    const filterButtons = monosplitFiltersContainer ? monosplitFiltersContainer.querySelectorAll('.filter-btn') : [];
    const sectionTabs = document.querySelectorAll('.tab-btn');

    // Monosplit Tooltip
    const tooltipElement = document.getElementById('dimension-tooltip');
    const tooltipUiDimElement = document.getElementById('tooltip-ui-dimensions');
    const tooltipUeDimElement = document.getElementById('tooltip-ue-dimensions');

    // Multisplit Configurator Elements
    const multiConfigurator = document.getElementById('multi-configurator');
    const brandSelectionContainer = document.getElementById('brand-selection');
    const splitTypeSelectionContainer = document.getElementById('split-type-selection');
    const outdoorUnitSelect = document.getElementById('outdoor-unit-select');
    const indoorUnitsSelectionContainer = document.getElementById('indoor-units-selection');
    const summaryPanel = document.getElementById('summary-panel');
    const summaryContent = document.getElementById('summary-content');
    const summaryPlaceholder = summaryPanel ? summaryPanel.querySelector('.summary-placeholder') : null;
    const summaryBrandDiv = document.getElementById('summary-brand');
    const summaryBrandLogo = document.getElementById('summary-brand-logo');
    const summaryBrandName = document.getElementById('summary-brand-name');
    const summaryOutdoorDiv = document.getElementById('summary-outdoor');
    const summaryOutdoorDetails = document.getElementById('summary-outdoor-details');
    const summaryOutdoorPrice = document.getElementById('summary-outdoor-price');
    const summaryIndoorListDiv = document.getElementById('summary-indoor-list');
    const summaryIndoorItemsUl = document.getElementById('summary-indoor-items');
    const summaryTotalDiv = document.getElementById('summary-total');
    const summaryTotalPriceSpan = document.getElementById('summary-total-price');
    const summaryRefDiv = document.getElementById('summary-ref');
    const summaryReferenceCodeSpan = document.getElementById('summary-reference-code');
    const resetConfigBtn = document.getElementById('reset-config-btn');
    const printConfigBtn = document.getElementById('print-config-btn');
    const printConfigArea = document.getElementById('print-config-area');

    // Configurator Steps
    const steps = {
        brand: document.getElementById('step-1-brand'),
        splitType: document.getElementById('step-2-split-type'),
        outdoor: document.getElementById('step-3-outdoor-unit'),
        indoor: document.getElementById('step-4-indoor-units'),
        actions: document.getElementById('step-5-actions'),
    };
    // --- FINE SELEZIONE DOM ---

    // --- VERIFICHE INIZIALI ---
    let dataOk = true;
    if (typeof products === 'undefined' || !Array.isArray(products)) {
        console.error("CRITICAL ERROR: Monosplit 'products' array not found or invalid.");
        if(monosplitGrid) monosplitGrid.innerHTML = `<p class="error-message">Errore caricamento dati Monosplit.</p>`;
        dataOk = false;
    }
    if (typeof multiProducts === 'undefined' || !Array.isArray(multiProducts)) {
        console.error("CRITICAL ERROR: Multisplit 'multiProducts' array not found or invalid.");
        if(brandSelectionContainer) brandSelectionContainer.innerHTML = `<p class="error-message">Errore caricamento dati Multisplit.</p>`;
        dataOk = false;
    }
    // Check essential elements
    if (!monosplitGrid || !monosplitSection || !multisplitSection) {
         console.error("CRITICAL ERROR: Section elements missing."); dataOk = false;
    }
    if (!multiConfigurator || !brandSelectionContainer || !splitTypeSelectionContainer || !outdoorUnitSelect || !indoorUnitsSelectionContainer || !summaryPanel || !resetConfigBtn || !printConfigBtn || !printConfigArea) {
         console.error("CRITICAL ERROR: Multisplit configurator elements missing."); dataOk = false;
    }
    if (!tooltipElement || !tooltipUiDimElement || !tooltipUeDimElement) {
        console.warn("Monosplit Tooltip elements missing. Tooltip functionality disabled.");
        // Define dummy function to prevent errors later if called
        window.addTooltipListeners = () => {};
    }
     if (!dataOk) {
         handleFatalError("Errore critico: impossibile caricare i dati o elementi della pagina mancanti. Controlla la console per i dettagli.");
         return; // Stop execution if critical elements/data are missing
     }
    // --- FINE VERIFICHE ---

    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">${message}</div>`; }

    function formatPrice(price) {
        if (price === null || price === undefined || price === '') { return 'N/D'; }
        let numericPrice = NaN;
        if (typeof price === 'number') { numericPrice = price; }
        else if (typeof price === 'string') {
            try {
                const cleanedPrice = price.replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
                numericPrice = parseFloat(cleanedPrice);
            } catch (e) { /* Ignora */ }
        }
        if (!isNaN(numericPrice)) {
            return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice);
        } else { return 'N/D'; }
    }

    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART']; // Per Monosplit

    function getLogoPath(brand) {
        if (!brand) return '../images/logos/placeholder_logo.png';
        const safeBrandName = brand.toLowerCase().replace(/\s+/g, '');
        // Path relativo alla posizione di index.html in multisplit/
        return `../images/logos/${safeBrandName}.png`;
    }

    function generateReferenceCode() {
        const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
        const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `CAI-${timestamp}-${randomPart}`;
    }

    // Function to parse BTU from power string (e.g., "2,5kW - 9000BTU")
    function parseBtu(powerString) {
        if (typeof powerString !== 'string') return null;
        const match = powerString.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)\s*BTU/i);
        if (match && match[1]) {
            const btuValue = parseInt(match[1].replace(/[.,]/g, ''), 10);
            return isNaN(btuValue) ? null : btuValue;
        }
        return null;
    }
    // --- FINE FUNZIONI UTILITY ---


    // --- CREAZIONE CARD MONOSPLIT ---
    function createProductCard(product) {
        if (!product || typeof product !== 'object') return '<div class="product-card error-card">Errore dati prodotto.</div>';
        try {
            const imageUrl = product.image_url || '../images/placeholder.png'; // Default placeholder
            const brand = product.marca || 'N/D';
            const model = product.modello || 'N/D';
            const power = product.potenza || 'N/D';
            const energyCooling = product.classe_energetica_raffrescamento || 'N/D';
            const energyHeating = product.classe_energetica_riscaldamento || 'N/D';
            const wifi = product.wifi;
            const datasheetUrl = product.scheda_tecnica_url;
            const productCode = product.codice_prodotto || 'N/D';
            const uiDimensions = product.dimensioni_ui || "N/D";
            const ueDimensions = product.dimensioni_ue || "N/D";
            const isMonobloc = brand.toUpperCase() === 'INNOVA'; // Innova treated specially

            const modelDataAttribute = (model || 'nd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const logoPath = getLogoPath(brand);
            const placeholderLogoPath = '../images/logos/placeholder_logo.png';

            // Economic Badge
            let economicBadgeHTML = '';
            const isEconomic = economicModels.includes(model.toUpperCase());
            if (isEconomic) economicBadgeHTML = `<span class="economic-badge" title="Prodotto linea economica">Economico</span>`;

            // WiFi Icon
            let wifiIconHTML = '';
            const wifiString = String(wifi).toLowerCase().trim();
            if (wifiString === 'sì' || wifiString === 'si') wifiIconHTML = `<i class="fas fa-wifi wifi-icon" title="Wi-Fi Integrato"></i>`;

            // Datasheet Link
            let datasheetLink = '';
            if (datasheetUrl && String(datasheetUrl).trim() !== '') {
                datasheetLink = `<p class="product-datasheet"><a href="${datasheetUrl}" target="_blank" rel="noopener noreferrer" title="Apri scheda tecnica PDF per ${model}"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;
            }

            // Product Codes (UI/UE)
            let productCodeHTML = '';
             if (productCode && productCode !== 'N/D') {
                 let codeContent = '';
                 const hasComponentPrices = typeof product.prezzo_ui === 'number' && typeof product.prezzo_ue === 'number'; // Check if sub-prices exist
                 // Check if code string contains UI/UE structure
                 if (typeof productCode === 'string' && productCode.includes('UI:') && productCode.includes('UE:')) {
                     const uiMatch = productCode.match(/UI:\s*([^/]+)/);
                     const ueMatch = productCode.match(/UE:\s*([^/]+)/);
                     const uiCode = uiMatch ? uiMatch[1].trim() : 'N/D';
                     const ueCode = ueMatch ? ueMatch[1].trim() : 'N/D';

                     codeContent = `UI: ${uiCode}`;
                     if (hasComponentPrices) codeContent += `&nbsp;<span>(${formatPrice(product.prezzo_ui)})</span>`; // Add UI price if available
                     codeContent += `<br>UE: ${ueCode}`;
                     if (hasComponentPrices) codeContent += `&nbsp;<span>(${formatPrice(product.prezzo_ue)})</span>`; // Add UE price if available
                 } else {
                     // If not UI/UE structure, display the code as is
                     codeContent = productCode;
                 }
                 productCodeHTML = `<p class="product-info-text product-codes"><strong>Articoli:</strong><br><span class="code-value">${codeContent}</span></p>`;
             }


             // Dimensions (for print, hidden by default via CSS)
             let dimensionsHTML = '';
             if (uiDimensions !== "N/D") { dimensionsHTML += `<span>UI: ${uiDimensions}</span>`; }
             if (!isMonobloc && ueDimensions !== "N/D") { if (dimensionsHTML !== '') dimensionsHTML += ''; dimensionsHTML += `<span>UE: ${ueDimensions}</span>`; }
             if (dimensionsHTML !== '') { dimensionsHTML = `<p class="product-info-text product-dimensions"><strong>Dimensioni AxLxP (mm):</strong> ${dimensionsHTML}</p>`; }

            // Action Buttons (Admin Mode Only)
            let actionButtonsHTML = '';
            if (isAdmin) {
                actionButtonsHTML = `
                    <button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button>
                    <button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button>
                    <button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;
            }

            return `
               <div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}">
                   <div class="card-top-right-elements">${economicBadgeHTML}${wifiIconHTML}</div>
                   <div class="product-header">
                       <img src="${logoPath}" alt="Logo ${brand}" class="product-logo" onerror="this.onerror=null; this.src='${placeholderLogoPath}';">
                       <div class="product-title-brand">
                           <span class="product-brand-text">${brand}</span>
                           <h3 class="product-model">${model}</h3>
                       </div>
                   </div>
                   <img src="${imageUrl}" alt="Immagine ${model}" class="product-image" onerror="this.onerror=null; this.src='../images/placeholder.png';">
                   <div class="product-info">
                       <div class="product-details">
                           <p class="product-info-text"><strong>Potenza:</strong> <span class="product-power">${power}</span></p>
                           <p class="energy-class product-info-text"><strong>Classe En.:</strong> <span class="cooling product-energy-cooling" title="Raffrescamento">${energyCooling}</span> / <span class="heating product-energy-heating" title="Riscaldamento">${energyHeating}</span></p>
                           ${productCodeHTML}
                           ${dimensionsHTML}
                           ${datasheetLink}
                       </div>
                       <div class="product-footer">
                           <div class="product-price-value">${formatPrice(product.prezzo)}</div>
                           <div class="action-buttons-container">${actionButtonsHTML}</div>
                       </div>
                   </div>
               </div>`;
        } catch (error) {
            console.error(`Error creating monosplit card for product ID: ${product?.id}`, error);
            return `<div class="product-card error-card">Errore creazione card ID ${product?.id}.</div>`;
        }
    }
    // --- FINE CREAZIONE CARD MONOSPLIT ---


    // --- FILTRAGGIO E VISUALIZZAZIONE (MONOSPLIT) ---
    function applyFiltersAndSort() {
        if (!Array.isArray(products)) {
             console.error("Cannot filter monosplit, 'products' is not valid.");
             currentFilteredProducts = [];
             displayMonosplitProducts(currentFilteredProducts); // Pass empty array to display function
             return;
        }

        let filtered = [];
        try {
            // Filter only products of type 'Monosplit' or where type is undefined/null
            filtered = products.filter(p => p && (!p.tipo || p.tipo.toLowerCase() === 'monosplit'));

            // Apply brand filter
            if (currentBrandFilter !== 'all') {
                filtered = filtered.filter(p => p.marca && p.marca.toUpperCase() === currentBrandFilter);
            }

            // Apply economic filter
            if (showOnlyEconomic) {
                filtered = filtered.filter(p => p.modello && economicModels.includes(p.modello.toUpperCase()));
            }

            if (!Array.isArray(filtered)) {
                throw new Error("Filtering resulted in invalid data type.");
            }

            // Sort by price (ascending)
            filtered.sort((a, b) => {
                 const priceA = (a && typeof a.prezzo === 'number' && !isNaN(a.prezzo)) ? a.prezzo : Infinity;
                 const priceB = (b && typeof b.prezzo === 'number' && !isNaN(b.prezzo)) ? b.prezzo : Infinity;
                 return priceA - priceB;
             });

        } catch (error) {
            console.error("Error during monosplit filtering/sorting:", error);
            filtered = []; // Reset to empty on error
            if(monosplitGrid) monosplitGrid.innerHTML = `<p class="error-message">Errore applicazione filtri Monosplit.</p>`;
        }

        currentFilteredProducts = filtered; // Store the filtered result
        displayMonosplitProducts(currentFilteredProducts); // Display the filtered products
    }

    function displayMonosplitProducts(productsToDisplay) {
        if (!monosplitGrid) { console.error("CRITICAL ERROR: Monosplit grid element not found."); return; }
        if (!Array.isArray(productsToDisplay)) {
             console.error("ERROR: productsToDisplay for monosplit is not valid array!", productsToDisplay);
             monosplitGrid.innerHTML = '<p class="no-results error-message">Errore dati Monosplit.</p>';
             return;
         }

        let monosplitHTML = '';
        let monosplitCount = 0;
        try {
            productsToDisplay.forEach((product, index) => {
                if (!product || typeof product.id === 'undefined') {
                    console.warn(`Skipping invalid monosplit product at index ${index}`);
                    return;
                }
                const cardHTML = createProductCard(product); // Use the card creation function
                monosplitHTML += cardHTML;
                monosplitCount++;
            });
        } catch (loopError) {
            console.error("Error during monosplit product display loop:", loopError);
            monosplitGrid.innerHTML = '<p class="no-results error-message">Errore durante la visualizzazione Monosplit.</p>';
            return;
        }

        const noMonoMsg = '<p class="no-results">Nessun prodotto Monosplit trovato con i filtri selezionati.</p>';
        try {
            monosplitGrid.innerHTML = monosplitCount > 0 ? monosplitHTML : noMonoMsg;
        } catch (domError) {
            console.error("Error setting innerHTML for monosplit grid:", domError);
            monosplitGrid.textContent = 'Errore aggiornamento visualizzazione Monosplit.';
        }

        // Add listeners after rendering cards
        if (isAdmin) { addEditListeners(); } // Admin listeners
        if (typeof addTooltipListeners === 'function') { addTooltipListeners(); } // Tooltip listeners
    }
    // --- FINE FILTRAGGIO E VISUALIZZAZIONE (MONOSPLIT) ---


    // --- Gestione Visibilità Sezioni ---
    function updateSectionVisibility() {
        console.log(`Updating section visibility. Active: ${activeSection}`);
        Object.entries(sections).forEach(([key, sectionElement]) => {
            if (sectionElement) {
                if (key === activeSection) {
                    sectionElement.classList.add('active-section');
                    sectionElement.style.display = 'block';
                    // If activating multisplit, ensure it's initialized
                    if (key === 'multisplit') {
                         // Check if it needs initializing (e.g., first load or after reset)
                         if (!brandSelectionContainer || !brandSelectionContainer.hasChildNodes() || brandSelectionContainer.querySelector('.loading-placeholder')) {
                            initializeMultisplitConfigurator();
                         }
                    }
                } else {
                    sectionElement.classList.remove('active-section');
                    sectionElement.style.display = 'none';
                }
            } else {
                console.warn(`Section element for key '${key}' not found.`);
            }
        });
        // Show/hide Monosplit filters based on the active section
        if (monosplitFiltersContainer) {
            monosplitFiltersContainer.style.display = (activeSection === 'monosplit') ? 'flex' : 'none';
        }
    }
    // --- FINE GESTIONE VISIBILITÀ ---


    // --- GESTIONE ADMIN (MONOSPLIT) ---
    function enterAdminMode() {
        if(isAdmin) return; // Already admin
        isAdmin = true