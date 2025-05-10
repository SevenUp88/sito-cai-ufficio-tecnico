/* File: script.js */
document.addEventListener('DOMContentLoaded', () => {
    // --- GESTIONE MODALITÀ ---
    let isAdmin = false;
    const ADMIN_PASSWORD = "123stella";
    let currentFilteredProducts = [];
    // --- STATO FILTRI E SEZIONI ---
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;
    const activeSection = 'monosplit';
    // +++ STATO PER IL CONFRONTO +++
    let itemsToCompare = [];
    const MAX_COMPARE_ITEMS = 3;

    document.body.classList.add('operator-mode');

    // Selezione elementi DOM principali
    const monosplitGrid = document.getElementById('monosplit-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sectionTabs = document.querySelectorAll('.tab-btn');
    const monosplitSection = document.getElementById('monosplit-section');
    const sections = { monosplit: monosplitSection };

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

    // +++ SELETTORI DOM PER IL CONFRONTO +++
    const comparePopupOverlayEl = document.getElementById('compare-popup-overlay');
    const comparePopupContentEl = document.getElementById('compare-popup-content');
    const closeComparePopupBtnEl = document.getElementById('close-compare-popup-btn');
    const clearCompareSelectionBtnEl = document.getElementById('clear-compare-selection-btn');
    const compareBarEl = document.getElementById('compare-bar');
    const compareBarCountEl = document.getElementById('compare-bar-count');
    const compareBarShowBtnEl = document.getElementById('compare-bar-show-btn');

    // --- VERIFICHE INIZIALI ---
    if (typeof products === 'undefined' || !Array.isArray(products)) { console.error("CRITICAL ERROR: 'products' array not found or invalid."); handleFatalError("Errore critico: impossibile caricare i dati dei prodotti."); return; }
    if (!tooltipElement || !tooltipUiDimElement || !tooltipUeDimElement) { console.warn("Tooltip elements missing. Tooltip functionality disabled."); window.addTooltipListeners = () => {}; }
    if (!monosplitGrid || !monosplitSection) { console.error("CRITICAL ERROR: Monosplit grid or section elements missing."); handleFatalError("Errore critico: elementi della pagina mancanti."); return; }

    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">${message}</div>`; }
    function formatPrice(price) { if (price === null || price === undefined || price === '') { return 'N/D'; } let numericPrice = NaN; if (typeof price === 'number') { numericPrice = price; } else if (typeof price === 'string') { try { const cleanedPrice = price.replace(/[^0-9,.-]/g, ''); const normalizedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.'); numericPrice = parseFloat(normalizedPrice); } catch (e) { /* Ignora */ } } if (!isNaN(numericPrice)) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice); } else { return 'N/D'; } }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];


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
                    codeContent = `UI: ${uiCode}`; if (hasComponentPrices) codeContent += ` <span>(${formatPrice(product.prezzo_ui)})</span>`;
                    codeContent += `<br>UE: ${ueCode}`; if (hasComponentPrices) codeContent += ` <span>(${formatPrice(product.prezzo_ue)})</span>`;
                } else { codeContent = productCode; }
                productCodeHTML = `<p class="product-info-text product-codes"><strong>Articoli:</strong><br><span class="code-value">${codeContent}</span></p>`;
            }
             let dimensionsHTML = '';
             if (uiDimensions !== "N/D") { dimensionsHTML += `<span>UI: ${uiDimensions}</span>`; }
             if (!isMonobloc && ueDimensions !== "N/D") { if (dimensionsHTML !== '') dimensionsHTML += ''; dimensionsHTML += `<span>UE: ${ueDimensions}</span>`; }
             if (dimensionsHTML !== '') { dimensionsHTML = `<p class="product-info-text product-dimensions"><strong>Dimensioni AxLxP (mm):</strong> ${dimensionsHTML}</p>`; }

            let actionButtonsHTML = '';
            if (isAdmin) {
                 actionButtonsHTML = `<button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button><button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button><button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;
            }

            const isSelectedForCompare = itemsToCompare.includes(String(product.id));
            const compareBtnClass = isSelectedForCompare ? 'btn-compare selected' : 'btn-compare';
            const compareBtnText = isSelectedForCompare ? 'Rimuovi da Confronto' : 'Confronta';
            const compareBtnHTML = `<button class="${compareBtnClass}" data-product-id="${product.id}" title="${compareBtnText}">${compareBtnText}</button>`;

            return `
               <div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}">
                   <div class="card-top-right-elements">${economicBadgeHTML}${wifiIconHTML}</div>
                   <div class="product-header"> <img src="${logoPath}" alt="Logo ${brand}" class="product-logo" onerror="this.onerror=null; this.src='${placeholderLogoPath}';"> <div class="product-title-brand"> <span class="product-brand-text">${brand}</span> <h3 class="product-model">${model}</h3> </div> </div>
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
                           <div class="action-buttons-container">
                               ${actionButtonsHTML}
                               ${compareBtnHTML}
                           </div>
                       </div>
                   </div>
               </div>`;
        } catch (error) { console.error(`Error creating card ID ${product?.id}`, error); return `<div class="product-card error-card">Err card ID ${product?.id}.</div>`; }
    }

    // --- GESTIONE ADMIN (Funzioni di supporto definite prima di essere usate) ---
    let originalProductData = {};
    function toggleEditMode(productId, isEditing) { /* ... (Il tuo codice per toggleEditMode) ... */ }
    function handleEditClick(event) { if (isAdmin) { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, true); } }
    function handleCancelClick(event) { if (isAdmin) { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, false); } }
    function handleSaveClick(event) {
        if (isAdmin) {
            const productId = event.currentTarget.dataset.id;
            const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            if (!card) return;

            const priceInput = card.querySelector('.edit-price-input');
            const modelInput = card.querySelector('.edit-model-input');
            const productToUpdate = products.find(p => String(p.id) === String(productId));

            if (productToUpdate) {
                if (priceInput) {
                    const newPrice = parseFloat(priceInput.value.replace(/[^0-9,.-]/g, '').replace(',', '.'));
                    if (!isNaN(newPrice)) {
                        productToUpdate.prezzo = newPrice;
                    }
                }
                if (modelInput) {
                    productToUpdate.modello = modelInput.value.trim();
                }
            }
            toggleEditMode(productId, false); // Torna a modalità visualizzazione
            applyFiltersAndSort(); // Ri-applica filtri e ri-disegna per riflettere le modifiche
        }
    }
    function addEditListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => button.addEventListener('click', handleEditClick));
        document.querySelectorAll('.save-btn').forEach(button => button.addEventListener('click', handleSaveClick));
        document.querySelectorAll('.cancel-btn').forEach(button => button.addEventListener('click', handleCancelClick));
    }

    // --- GESTIONE TOOLTIP (Funzioni di supporto definite prima) ---
    function positionTooltip(event) { /* ... (Il tuo codice per positionTooltip) ... */ }
    function handleTooltipMouseEnter(event) { /* ... (Il tuo codice per handleTooltipMouseEnter) ... */ }
    function handleTooltipMouseLeave() { /* ... (Il tuo codice per handleTooltipMouseLeave) ... */ }
    if (typeof window.addTooltipListeners === 'undefined') {
        window.addTooltipListeners = function() {
            const dimensionElements = document.querySelectorAll('.product-dimensions');
            dimensionElements.forEach(el => {
                el.removeEventListener('mouseenter', handleTooltipMouseEnter);
                el.removeEventListener('mouseleave', handleTooltipMouseLeave);
                el.removeEventListener('mousemove', positionTooltip);
                el.addEventListener('mouseenter', handleTooltipMouseEnter);
                el.addEventListener('mouseleave', handleTooltipMouseLeave);
                el.addEventListener('mousemove', positionTooltip);
            });
        };
    }


    // +++ FUNZIONI PER LA LOGICA DI CONFRONTO (Definite prima di essere usate) +++
    function toggleCompareItem(productIdStr) {
        const productId = String(productIdStr);
        const index = itemsToCompare.indexOf(productId);
        if (index > -1) {
            itemsToCompare.splice(index, 1);
        } else {
            if (itemsToCompare.length < MAX_COMPARE_ITEMS) {
                itemsToCompare.push(productId);
            } else {
                alert(`Puoi confrontare al massimo ${MAX_COMPARE_ITEMS} articoli.`);
            }
        }
        updateCompareButtonsState();
        updateCompareBar();
    }
    function updateCompareButtonsState() {
        document.querySelectorAll('.btn-compare').forEach(button => {
            const productId = String(button.dataset.productId);
            if (itemsToCompare.includes(productId)) {
                button.classList.add('selected');
                button.textContent = 'Rimuovi'; // Testo più corto
                button.title = 'Rimuovi da Confronto';
            } else {
                button.classList.remove('selected');
                button.textContent = 'Confronta';
                button.title = 'Aggiungi al Confronto';
            }
        });
    }
    function handleCompareCardBtnClick(event) {
        const productId = event.target.dataset.productId;
        toggleCompareItem(productId);
    }
    function addCompareButtonListenersToCards() {
        const compareCardBtns = document.querySelectorAll('.product-card .btn-compare');
        compareCardBtns.forEach(btn => {
            btn.removeEventListener('click', handleCompareCardBtnClick);
            btn.addEventListener('click', handleCompareCardBtnClick);
        });
    }
    function updateCompareBar() {
        if (!compareBarEl || !compareBarCountEl || !compareBarShowBtnEl) return;
        compareBarCountEl.textContent = itemsToCompare.length;
        compareBarShowBtnEl.disabled = itemsToCompare.length === 0;
        if (itemsToCompare.length > 0) {
            compareBarEl.classList.add('visible');
        } else {
            compareBarEl.classList.remove('visible');
            if (comparePopupOverlayEl.classList.contains('visible')) { // Chiudi popup se vuoto
                closeComparePopup();
            }
        }
    }
    function openComparePopup() {
        if (!comparePopupOverlayEl || !comparePopupContentEl || itemsToCompare.length === 0) return;
        comparePopupContentEl.innerHTML = '';
        itemsToCompare.forEach(productId => {
            const product = products.find(p => String(p.id) === productId);
            if (product) {
                const cardHTML = createProductCard(product);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHTML;
                comparePopupContentEl.appendChild(tempDiv.firstChild);
            }
        });
        comparePopupOverlayEl.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
    function closeComparePopup() {
        if (!comparePopupOverlayEl) return;
        comparePopupOverlayEl.classList.remove('visible');
        document.body.style.overflow = '';
    }
    function clearCompareSelection() {
        itemsToCompare = [];
        updateCompareButtonsState();
        updateCompareBar(); // Questo chiuderà anche il popup se diventa vuoto
        if (comparePopupOverlayEl.classList.contains('visible')) {
             comparePopupContentEl.innerHTML = '<p style="text-align:center; color: var(--secondary-color);">Seleziona articoli da confrontare.</p>';
        }
    }

    // --- FILTRAGGIO, ORDINAMENTO E VISUALIZZAZIONE (Funzioni principali definite prima) ---
    function displayProducts(productsToDisplay) {
        if (!monosplitGrid) { console.error("CRITICAL ERROR: Monosplit grid not found."); return; }
        if (!Array.isArray(productsToDisplay)) { console.error("ERROR: productsToDisplay invalid!", productsToDisplay); monosplitGrid.innerHTML = '<p class="no-results error-message">Errore dati.</p>'; return; }

        let monosplitHTML = '';
        let monosplitCount = 0;
        try {
            productsToDisplay.forEach((product) => {
                if (!product || typeof product.id === 'undefined' || (product.tipo && product.tipo.toLowerCase() !== 'monosplit')) return;
                const cardHTML = createProductCard(product);
                monosplitHTML += cardHTML;
                monosplitCount++;
            });
        } catch (loopError) { console.error("Error during product display loop:", loopError); monosplitGrid.innerHTML = '<p class="no-results error-message">Errore visualizzazione.</p>'; return; }

        const noMonoMsg = '<p class="no-results">Nessun prodotto Monosplit trovato.</p>';
        try {
            monosplitGrid.innerHTML = monosplitCount > 0 ? monosplitHTML : noMonoMsg;
        } catch (domError) { console.error("Error setting innerHTML for monosplitGrid:", domError); monosplitGrid.textContent = 'Errore aggiornamento visualizzazione.'; }

        if (monosplitSection) monosplitSection.style.display = 'block';

        if (isAdmin) addEditListeners();
        if (typeof addTooltipListeners === 'function') addTooltipListeners();
        addCompareButtonListenersToCards();
        updateCompareBar();
    }

    function applyFiltersAndSort() {
        if (!Array.isArray(products)) { console.error("Cannot filter, 'products' invalid."); currentFilteredProducts = []; displayProducts(currentFilteredProducts); return; }
        let filtered = [];
        try {
            filtered = [...products];
            filtered = filtered.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');
            if (currentBrandFilter !== 'all') { filtered = filtered.filter(p => p && p.marca && p.marca.toUpperCase() === currentBrandFilter); }
            if (showOnlyEconomic) { filtered = filtered.filter(p => p && p.modello && economicModels.includes(p.modello.toUpperCase())); }
            if (!Array.isArray(filtered)) { throw new Error("Filtering resulted in invalid data type."); }
            filtered.sort((a, b) => { const priceA = (a && typeof a.prezzo === 'number' && !isNaN(a.prezzo)) ? a.prezzo : Infinity; const priceB = (b && typeof b.prezzo === 'number' && !isNaN(b.prezzo)) ? b.prezzo : Infinity; return priceA - priceB; });
        } catch (error) { console.error("Error filtering/sorting:", error); filtered = []; handleFatalError("Errore applicazione filtri."); }
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    // --- GESTIONE ADMIN (Funzioni principali definite qui) ---
    function enterAdminMode() {
        isAdmin = true;
        document.body.classList.remove('operator-mode');
        document.body.classList.add('admin-mode');
        if (adminTrigger) adminTrigger.style.display = 'none';
        if (exitAdminButton) exitAdminButton.style.display = 'inline-flex';
        applyFiltersAndSort(); // Ricarica le card per mostrare i bottoni edit
    }
    function exitAdminMode() {
        isAdmin = false;
        document.body.classList.remove('admin-mode');
        document.body.classList.add('operator-mode');
        if (adminTrigger) adminTrigger.style.display = 'inline-flex';
        if (exitAdminButton) exitAdminButton.style.display = 'none';
        // Assicurati che tutte le card siano in modalità non-edit
        document.querySelectorAll('.product-card').forEach(cardEl => {
            const productId = cardEl.dataset.productId;
            if (cardEl.classList.contains('editing')) { // Se hai una classe per la modalità edit
                toggleEditMode(productId, false);
            }
        });
        applyFiltersAndSort(); // Ricarica le card per nascondere i bottoni edit
    }

    // --- EVENT LISTENERS ---
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const clickedButton = event.currentTarget;
                const filterType = clickedButton.dataset.filterType;
                const brandToFilter = clickedButton.dataset.brand;
                if (filterType === 'economic') {
                    showOnlyEconomic = !showOnlyEconomic;
                    clickedButton.classList.toggle('active', showOnlyEconomic);
                } else if (brandToFilter) {
                    filterButtons.forEach(btn => { if (btn.dataset.brand) { btn.classList.remove('active'); } });
                    clickedButton.classList.add('active');
                    currentBrandFilter = brandToFilter.toLowerCase() === 'all' ? 'all' : brandToFilter.toUpperCase();
                }
                applyFiltersAndSort();
            });
        });
    } else { console.warn("Filter buttons not found."); }

    if (sectionTabs.length > 0) {
        sectionTabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                const targetSection = tab.dataset.section;
                event.preventDefault();
                if (targetSection === 'multisplit') {
                    window.location.href = '../multisplit/index.html';
                } else if (targetSection === 'monosplit') {
                    sectionTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                }
            });
        });
    } else { console.warn("Section tab buttons not found."); }

    if (adminTrigger && passwordPanel && closePanelButton && passwordInput && submitPasswordButton && passwordError) {
        adminTrigger.addEventListener('click', () => passwordPanel.classList.add('visible'));
        closePanelButton.addEventListener('click', () => {
            passwordPanel.classList.remove('visible');
            passwordInput.value = ''; passwordError.textContent = ''; passwordInput.classList.remove('input-error');
        });
        submitPasswordButton.addEventListener('click', () => {
            if (passwordInput.value === ADMIN_PASSWORD) {
                enterAdminMode();
                passwordPanel.classList.remove('visible');
                passwordInput.value = ''; passwordError.textContent = ''; passwordInput.classList.remove('input-error');
            } else {
                passwordError.textContent = 'Password errata.'; passwordInput.classList.add('input-error'); passwordInput.focus();
            }
        });
        passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitPasswordButton.click(); });
    } else { console.warn("Password panel elements missing or incomplete."); }

    if (exitAdminButton) { exitAdminButton.addEventListener('click', exitAdminMode); } else { console.warn("Exit admin button not found."); }
    if (printButton) { printButton.addEventListener('click', () => { window.print(); }); } else { console.warn("Print button not found."); }

    if (compareBarShowBtnEl) { compareBarShowBtnEl.addEventListener('click', openComparePopup); }
    if (closeComparePopupBtnEl) { closeComparePopupBtnEl.addEventListener('click', closeComparePopup); }
    if (comparePopupOverlayEl) { comparePopupOverlayEl.addEventListener('click', (event) => { if (event.target === comparePopupOverlayEl) { closeComparePopup(); } }); }
    if (clearCompareSelectionBtnEl) { clearCompareSelectionBtnEl.addEventListener('click', clearCompareSelection); }


    // --- INIZIALIZZAZIONE APP ---
    function initializeApp() {
        if (products && products.length > 0) {
            currentBrandFilter = 'all';
            showOnlyEconomic = false;
            document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
            document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
            applyFiltersAndSort();
        } else {
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto disponibile.</p>';
            if (monosplitSection) monosplitSection.style.display = 'block';
        }
        updateCompareBar();
    }

    initializeApp();
    // --- FINE INIZIALIZZAZIONE ---

}); // Fine DOMContentLoaded
