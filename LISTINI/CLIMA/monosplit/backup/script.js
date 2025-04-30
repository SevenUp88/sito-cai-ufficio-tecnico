/* File: script.js */
document.addEventListener('DOMContentLoaded', () => {
    // --- GESTIONE MODALITÀ ---
    let isAdmin = false;
    const ADMIN_PASSWORD = "123stella";
    let currentFilteredProducts = [];
    // --- STATO FILTRI E SEZIONI ---
    let currentBrandFilter = 'all'; // Standard: lowercase 'all'
    let showOnlyEconomic = false;
    let activeSection = 'monosplit'; // Sezione attiva ('monosplit' o 'multisplit')
    // --- FINE STATO ---

    document.body.classList.add('operator-mode');

    // Selezione elementi DOM principali
    const monosplitGrid = document.getElementById('monosplit-grid');
    const multisplitGrid = document.getElementById('multisplit-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sectionTabs = document.querySelectorAll('.tab-btn');
    const monosplitSection = document.getElementById('monosplit-section');
    const multisplitSection = document.getElementById('multisplit-section');
    const sections = { monosplit: monosplitSection, multisplit: multisplitSection };

    // Selettori Header
    const adminTrigger = document.getElementById('admin-trigger');
    const exitAdminButton = document.getElementById('exit-admin-button');
    const printButton = document.getElementById('print-button');

    // Elementi Pannello Password
    const passwordPanel = document.getElementById('password-panel');
    const closePanelButton = document.getElementById('close-panel-btn');
    const passwordInput = document.getElementById('admin-password');
    const submitPasswordButton = document.getElementById('submit-password-btn');
    const passwordError = document.getElementById('password-error');

    // Elementi Tooltip
    const tooltipElement = document.getElementById('dimension-tooltip');
    const tooltipUiDimElement = document.getElementById('tooltip-ui-dimensions');
    const tooltipUeDimElement = document.getElementById('tooltip-ue-dimensions');

    // --- VERIFICHE INIZIALI ---
    if (typeof products === 'undefined' || !Array.isArray(products)) {
        console.error("CRITICAL ERROR: 'products' array not found or invalid.");
        handleFatalError("Errore critico: impossibile caricare i dati dei prodotti.");
        return;
    }
    if (!tooltipElement || !tooltipUiDimElement || !tooltipUeDimElement) {
        console.warn("Tooltip elements missing. Tooltip functionality disabled.");
        window.addTooltipListeners = () => {}; // Definisce come funzione vuota
    }
    if (!monosplitGrid || !multisplitGrid || !monosplitSection || !multisplitSection) {
        console.error("CRITICAL ERROR: Grid or section elements missing.");
        handleFatalError("Errore critico: elementi della pagina mancanti.");
        return;
    }
    // --- FINE VERIFICHE ---

    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">${message}</div>`; }
    function formatPrice(price) { if (price === null || price === undefined || price === '') { return 'N/D'; } let numericPrice = NaN; if (typeof price === 'number') { numericPrice = price; } else if (typeof price === 'string') { try { const cleanedPrice = price.replace(/[^0-9,.-]/g, ''); const normalizedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.'); numericPrice = parseFloat(normalizedPrice); } catch (e) { /* Ignora */ } } if (!isNaN(numericPrice)) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice); } else { return 'N/D'; } }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];
    // --- FINE FUNZIONI UTILITY ---

    // --- CREAZIONE CARD ---
    function createProductCard(product) {
        if (!product || typeof product !== 'object') return '<div class="product-card error-card">Errore dati prodotto.</div>';
        try {
            const imageUrl = product.image_url || '../images/placeholder.png';
            const brand = product.marca || 'N/D';
            const model = product.modello || 'N/D';
            const power = product.potenza || 'N/D';
            const energyCooling = product.classe_energetica_raffrescamento || 'N/D';
            const energyHeating = product.classe_energetica_riscaldamento || 'N/D';
            const wifi = product.wifi;
            const datasheetUrl = product.scheda_tecnica_url;
            const productCode = product.codice_prodotto || 'N/D';
            // Recupera dimensioni (servono anche per tooltip e stampa)
            const uiDimensions = product.dimensioni_ui || "N/D";
            const ueDimensions = product.dimensioni_ue || "N/D";
            const isMonobloc = brand.toUpperCase() === 'INNOVA';

            const modelDataAttribute = (model || 'nd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const safeBrandName = brand.toLowerCase().replace(/\s+/g, '');
            const logoPath = `../images/logos/${safeBrandName}.png`;
            const placeholderLogoPath = '../images/logos/placeholder_logo.png';
            let economicBadgeHTML = '';
            const isEconomic = economicModels.includes(model.toUpperCase());
            if (isEconomic) economicBadgeHTML = `<span class="economic-badge" title="Prodotto linea economica">Economico</span>`;
            let wifiIconHTML = '';
            const wifiString = String(wifi).toLowerCase().trim();
            if (wifiString === 'sì' || wifiString === 'si') wifiIconHTML = `<i class="fas fa-wifi wifi-icon" title="Wi-Fi Integrato"></i>`;
            let datasheetLink = '';
            if (datasheetUrl && String(datasheetUrl).trim() !== '') datasheetLink = `<p class="product-datasheet"><a href="${datasheetUrl}" target="_blank" rel="noopener noreferrer" title="Apri scheda tecnica PDF per ${model}"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;
            let productCodeHTML = '';
            if (productCode && productCode !== 'N/D') {
                let codeContent = '';
                const hasComponentPrices = typeof product.prezzo_ui === 'number' && typeof product.prezzo_ue === 'number';
                if (typeof productCode === 'string' && productCode.includes('UI:') && productCode.includes('UE:')) {
                    const uiMatch = productCode.match(/UI:\s*([^/]+)/); const ueMatch = productCode.match(/UE:\s*([^/]+)/);
                    const uiCode = uiMatch ? uiMatch[1].trim() : 'N/D'; const ueCode = ueMatch ? ueMatch[1].trim() : 'N/D';
                    codeContent = `UI: ${uiCode}`; if (hasComponentPrices) codeContent += `&nbsp;<span>(${formatPrice(product.prezzo_ui)})</span>`;
                    codeContent += `<br>UE: ${ueCode}`; if (hasComponentPrices) codeContent += `&nbsp;<span>(${formatPrice(product.prezzo_ue)})</span>`;
                } else { codeContent = productCode; }
                productCodeHTML = `<p class="product-info-text product-codes"><strong>Articoli:</strong><br><span class="code-value">${codeContent}</span></p>`;
            }
             // Dimensioni per la stampa (nascoste di default da CSS)
             let dimensionsHTML = '';
             if (uiDimensions !== "N/D") { dimensionsHTML += `<span>UI: ${uiDimensions}</span>`; }
             if (!isMonobloc && ueDimensions !== "N/D") { if (dimensionsHTML !== '') dimensionsHTML += ''; dimensionsHTML += `<span>UE: ${ueDimensions}</span>`; }
             if (dimensionsHTML !== '') { dimensionsHTML = `<p class="product-info-text product-dimensions"><strong>Dimensioni AxLxP (mm):</strong> ${dimensionsHTML}</p>`; }

            let actionButtonsHTML = '';
            if (isAdmin) actionButtonsHTML = `<button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button><button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button><button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;

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
                           ${dimensionsHTML} <!-- Paragrafo Dimensioni per stampa -->
                           ${datasheetLink}
                       </div>
                       <div class="product-footer">
                           <div class="product-price-value">${formatPrice(product.prezzo)}</div>
                           <div class="action-buttons-container">${actionButtonsHTML}</div>
                       </div>
                   </div>
               </div>`;
        } catch (error) {
            console.error(`Error creating card for product ID: ${product?.id}`, error);
            return `<div class="product-card error-card">Errore creazione card ID ${product?.id}.</div>`;
        }
    }
    // --- FINE CREAZIONE CARD ---

    // --- FILTRAGGIO, ORDINAMENTO E VISUALIZZAZIONE ---
    function applyFiltersAndSort() {
        if (!Array.isArray(products)) { console.error("Cannot filter, 'products' is not valid."); currentFilteredProducts = []; displayProducts(currentFilteredProducts); return; }
        let filtered = [];
        try {
            filtered = [...products];
            if (currentBrandFilter !== 'all') { filtered = filtered.filter(p => p && p.marca && p.marca.toUpperCase() === currentBrandFilter); }
            if (showOnlyEconomic) { filtered = filtered.filter(p => p && p.modello && economicModels.includes(p.modello.toUpperCase())); }
            if (!Array.isArray(filtered)) { throw new Error("Filtering resulted in invalid data type."); }
            filtered.sort((a, b) => { const priceA = (a && typeof a.prezzo === 'number' && !isNaN(a.prezzo)) ? a.prezzo : Infinity; const priceB = (b && typeof b.prezzo === 'number' && !isNaN(b.prezzo)) ? b.prezzo : Infinity; return priceA - priceB; });
        } catch (error) { console.error("Error during filtering/sorting:", error); filtered = []; handleFatalError("Errore applicazione filtri."); }
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
        if (!monosplitGrid || !multisplitGrid) { console.error("CRITICAL ERROR: Grid elements not found."); return; }
        if (!Array.isArray(productsToDisplay)) { console.error("ERROR: productsToDisplay is not valid array!", productsToDisplay); if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore dati.</p>'; if(multisplitGrid) multisplitGrid.innerHTML = ''; showActiveSection(); return; }
        let monosplitHTML = ''; let multisplitHTML = '';
        let monosplitCount = 0; let multisplitCount = 0;
        try {
            productsToDisplay.forEach((product, index) => {
                if (!product || typeof product.id === 'undefined') { console.warn(`Skipping invalid product at index ${index}`); return; }
                const cardHTML = createProductCard(product);
                if (product.tipo && product.tipo.toLowerCase() === 'multisplit') { multisplitHTML += cardHTML; multisplitCount++; }
                else { monosplitHTML += cardHTML; monosplitCount++; }
            });
        } catch (loopError) { console.error("Error during product display loop:", loopError); if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore durante la visualizzazione.</p>'; if(multisplitGrid) multisplitGrid.innerHTML = ''; showActiveSection(0, 0); return; }
        const noMonoMsg = '<p class="no-results">Nessun prodotto Monosplit trovato.</p>';
        const noMultiMsg = '<p class="no-results">Nessun prodotto Multisplit trovato.</p>';
        try {
            monosplitGrid.innerHTML = monosplitCount > 0 ? monosplitHTML : noMonoMsg;
            multisplitGrid.innerHTML = multisplitCount > 0 ? multisplitHTML : noMultiMsg;
        } catch (domError) { console.error("Error setting innerHTML for grids:", domError); monosplitGrid.textContent = 'Errore aggiornamento visualizzazione.'; multisplitGrid.textContent = ''; }
        showActiveSection(monosplitCount, multisplitCount);
        if (isAdmin) addEditListeners();
        if (typeof addTooltipListeners === 'function') { addTooltipListeners(); }
    }

    function showActiveSection(monoCount = -1, multiCount = -1) {
        if (monoCount === -1) monoCount = monosplitGrid?.querySelectorAll('.product-card:not(.error-card)').length ?? 0;
        if (multiCount === -1) multiCount = multisplitGrid?.querySelectorAll('.product-card:not(.error-card)').length ?? 0;
        Object.entries(sections).forEach(([key, sectionElement]) => {
            if (sectionElement) {
                if (key === activeSection) { sectionElement.classList.add('active-section'); sectionElement.style.display = 'block'; }
                else { sectionElement.classList.remove('active-section'); sectionElement.style.display = 'none'; }
            }
        });
    }
    // --- FINE FILTRAGGIO E VISUALIZZAZIONE ---

    // --- GESTIONE ADMIN ---
    function enterAdminMode() { /* ... */ }
    function exitAdminMode() { /* ... */ }
    let originalProductData = {};
    function toggleEditMode(productId, isEditing) { /* ... */ }
    function handleEditClick(event) { /* ... */ }
    function handleCancelClick(event) { /* ... */ }
    function handleSaveClick(event) { /* ... */ }
    function addEditListeners() { /* ... */ }
    // --- FINE GESTIONE ADMIN ---

    // --- GESTIONE TOOLTIP (CON LABEL AxLxP) ---
    function positionTooltip(event) { if (!tooltipElement) return; const tooltipWidth = tooltipElement.offsetWidth; const tooltipHeight = tooltipElement.offsetHeight; const viewportW = window.innerWidth; const viewportH = window.innerHeight; const scrollX = window.scrollX; const scrollY = window.scrollY; const cursorX = event.pageX; const cursorY = event.pageY; let newX = cursorX + 15; let newY = cursorY + 15; if (newX + tooltipWidth > viewportW + scrollX) newX = cursorX - tooltipWidth - 15; if (newY + tooltipHeight > viewportH + scrollY) newY = cursorY - tooltipHeight - 15; if (newX < scrollX) newX = scrollX; if (newY < scrollY) newY = scrollY; tooltipElement.style.left = `${newX}px`; tooltipElement.style.top = `${newY}px`; }
    if (typeof window.addTooltipListeners === 'undefined') { window.addTooltipListeners = () => {}; }
    window.addTooltipListeners = function() { if (!tooltipElement || !tooltipUiDimElement || !tooltipUeDimElement) return; const currentProductCards = document.querySelectorAll('#monosplit-grid .product-card:not(.error-card), #multisplit-grid .product-card:not(.error-card)'); currentProductCards.forEach(card => { card.removeEventListener('mouseenter', handleTooltipMouseEnter); card.removeEventListener('mouseleave', handleTooltipMouseLeave); card.removeEventListener('mousemove', positionTooltip); card.addEventListener('mouseenter', handleTooltipMouseEnter); card.addEventListener('mouseleave', handleTooltipMouseLeave); card.addEventListener('mousemove', positionTooltip); }); }

    function handleTooltipMouseEnter(event) { // Versione con Etichetta
        const card = event.currentTarget;
        const productId = card.dataset.productId;
        const product = products.find(p => p.id == productId);
        if (!product || !tooltipElement || !tooltipUiDimElement || !tooltipUeDimElement) return;
        let uiDimensions = product.dimensioni_ui || "N/D";
        let ueDimensions = product.dimensioni_ue || "N/D";
        const isMonobloc = product.marca.toUpperCase() === 'INNOVA';

        tooltipUiDimElement.innerHTML = `UI (AxLxP): ${uiDimensions}`; // Etichetta aggiunta

        if (isMonobloc) {
            tooltipUeDimElement.style.display = 'none';
            tooltipUeDimElement.innerHTML = '';
            tooltipElement.classList.add('no-blueprint');
        } else {
            tooltipUeDimElement.innerHTML = `UE (AxLxP): ${ueDimensions}`; // Etichetta aggiunta
            tooltipUeDimElement.style.display = 'block';
            tooltipElement.classList.remove('no-blueprint');
        }
        positionTooltip(event);
        tooltipElement.style.display = 'block';
    }
    function handleTooltipMouseLeave() { if (tooltipElement) { tooltipElement.style.display = 'none'; tooltipElement.classList.remove('no-blueprint'); if(tooltipUeDimElement) tooltipUeDimElement.style.display = 'block'; } }
    // --- FINE GESTIONE TOOLTIP ---


    // --- EVENT LISTENERS ---
    // (Codice invariato per gestione filtri, tabs, admin, stampa)
    if (filterButtons.length > 0) { filterButtons.forEach(button => { button.addEventListener('click', (event) => { if (!Array.isArray(products)) return; const filterType = button.dataset.filterType; const brandValue = button.dataset.brand; const isEconomicFilter = button.matches('[data-filter-type="economic"]'); filterButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); if (isEconomicFilter) { showOnlyEconomic = true; currentBrandFilter = 'all'; document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active'); button.classList.add('active'); } else { const targetBrand = brandValue ? brandValue.toUpperCase() : 'all'; showOnlyEconomic = false; currentBrandFilter = targetBrand === 'ALL' ? 'all' : targetBrand; document.querySelector('.filter-btn[data-filter-type="economic"]')?.classList.remove('active'); button.classList.add('active'); } applyFiltersAndSort(); }); }); } else { console.warn("Filter buttons not found."); }
    if (sectionTabs.length > 0) { sectionTabs.forEach(tab => { tab.addEventListener('click', () => { const targetSection = tab.dataset.section; if (targetSection && targetSection !== activeSection) { activeSection = targetSection; sectionTabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); showActiveSection(); } }); }); } else { console.warn("Section tab buttons not found."); }
    if (adminTrigger && passwordPanel && closePanelButton && passwordInput && submitPasswordButton && passwordError) { adminTrigger.addEventListener('click', () => { passwordPanel.classList.add('visible'); passwordInput.focus(); }); closePanelButton.addEventListener('click', () => { passwordPanel.classList.remove('visible'); passwordError.textContent = ''; passwordInput.classList.remove('input-error'); passwordInput.value = ''; }); const handlePasswordSubmit = () => { if (passwordInput.value === ADMIN_PASSWORD) { passwordPanel.classList.remove('visible'); passwordInput.value = ''; passwordError.textContent = ''; passwordInput.classList.remove('input-error'); enterAdminMode(); } else { passwordError.textContent = 'Password errata.'; passwordInput.classList.add('input-error'); passwordInput.value = ''; passwordInput.focus(); } }; submitPasswordButton.addEventListener('click', handlePasswordSubmit); passwordInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') handlePasswordSubmit(); else { passwordError.textContent = ''; passwordInput.classList.remove('input-error'); } }); } else { console.warn("Password panel elements missing."); if (adminTrigger) adminTrigger.style.display = 'none'; }
    if (exitAdminButton) { exitAdminButton.addEventListener('click', exitAdminMode); } else { console.warn("Exit admin button not found."); }
    if (printButton) { printButton.addEventListener('click', () => { window.print(); }); } else { console.warn("Print button not found."); }
    // --- FINE EVENT LISTENERS ---

    // --- INIZIALIZZAZIONE APP ---
    function initializeApp() { if (products && products.length > 0) { activeSection = 'monosplit'; currentBrandFilter = 'all'; showOnlyEconomic = false; document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active'); document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active'); applyFiltersAndSort(); } else { if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto disponibile.</p>'; if(multisplitGrid) multisplitGrid.innerHTML = '<p class="no-results">Nessun prodotto disponibile.</p>'; showActiveSection(0, 0); } }
    initializeApp();
    // --- FINE INIZIALIZZAZIONE ---

}); // Fine DOMContentLoaded