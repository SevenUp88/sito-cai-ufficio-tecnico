/* File: script.js */
document.addEventListener('DOMContentLoaded', () => {
    // --- STATI ---
    let isAdmin = false;
    const ADMIN_PASSWORD = "123stella"; // Cambia questa password!
    let currentFilteredProducts = []; // Array dei prodotti attualmente filtrati e visibili
    let products = []; // Array globale con tutti i prodotti, caricato da products-data.js

    // Stati per filtri normali
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;

    // Stati per la modalità confronto
    let isCompareModeActive = false;
    let productsSelectedForCompare = []; // Array di ID prodotto (max 2)
    const MAX_COMPARE_SELECT = 2;

    // --- SELETTORI DOM ---
    const monosplitGrid = document.getElementById('monosplit-grid');
    const filterButtons = document.querySelectorAll('.filter-btn'); // Tutti i bottoni filtro
    const sectionTabs = document.querySelectorAll('.tab-btn');
    const monosplitSection = document.getElementById('monosplit-section');

    const adminTrigger = document.getElementById('admin-trigger');
    const exitAdminButton = document.getElementById('exit-admin-button');
    const printButton = document.getElementById('print-button');

    const passwordPanel = document.getElementById('password-panel');
    const closePanelButton = document.getElementById('close-panel-btn');
    const passwordInput = document.getElementById('admin-password');
    const submitPasswordButton = document.getElementById('submit-password-btn');
    const passwordError = document.getElementById('password-error');

    const tooltipElement = document.getElementById('dimension-tooltip');
    const tooltipUiDimElement = document.getElementById('tooltip-ui-dimensions');
    const tooltipUeDimElement = document.getElementById('tooltip-ue-dimensions');

    // Selettori per la nuova modalità confronto
    const toggleCompareModeBtn = document.getElementById('toggle-compare-mode-btn');
    const compareSelectionInfoEl = document.getElementById('compare-selection-info');
    const compareSelectedCountEl = document.getElementById('compare-selected-count');
    const confirmComparisonBtnEl = document.getElementById('confirm-comparison-btn');
    const cancelCompareModeBtnEl = document.getElementById('cancel-compare-mode-btn');
    const comparePopupOverlayEl = document.getElementById('compare-popup-overlay');
    const comparePopupContentEl = document.getElementById('compare-popup-content');
    const closeComparePopupBtnEl = document.getElementById('close-compare-popup-btn');


    // --- VERIFICHE INIZIALI ---
    // La variabile 'products' dovrebbe essere definita da un file products-data.js incluso prima di questo script
    if (typeof window.products === 'undefined' || !Array.isArray(window.products)) {
        console.error("CRITICAL ERROR: 'products' array not found or invalid. Make sure products-data.js is loaded and defines 'window.products'.");
        handleFatalError("Errore critico: impossibile caricare i dati dei prodotti.");
        return;
    }
    products = window.products; // Assegna i prodotti globali alla variabile locale per questo script

    if (!tooltipElement || !tooltipUiDimElement || !tooltipUeDimElement) {
        console.warn("Tooltip elements missing. Tooltip functionality disabled.");
        window.addTooltipListeners = () => {}; // Definisci placeholder se mancano gli elementi
    }
    if (!monosplitGrid || !monosplitSection) {
        console.error("CRITICAL ERROR: Monosplit grid or section elements missing.");
        handleFatalError("Errore critico: elementi della pagina mancanti.");
        return;
    }
    if (!toggleCompareModeBtn || !compareSelectionInfoEl || !compareSelectedCountEl || !confirmComparisonBtnEl || !cancelCompareModeBtnEl || !comparePopupOverlayEl || !comparePopupContentEl || !closeComparePopupBtnEl) {
        console.warn("Comparison UI elements missing. Compare functionality might be affected.");
    }


    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">${message}</div>`; }
    function formatPrice(price) { if (price === null || price === undefined || price === '') { return 'N/D'; } let numericPrice = NaN; if (typeof price === 'number') { numericPrice = price; } else if (typeof price === 'string') { try { const cleanedPrice = price.replace(/[^0-9,.-]/g, ''); const normalizedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.'); numericPrice = parseFloat(normalizedPrice); } catch (e) { /* Ignora */ } } if (!isNaN(numericPrice)) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice); } else { return 'N/D'; } }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART']; // Assicurati che i nomi corrispondano a product.modello


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
            const isMonobloc = brand.toUpperCase() === 'INNOVA'; // Esempio, da adattare
            const modelDataAttribute = (model || 'nd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const safeBrandName = brand.toLowerCase().replace(/\s+/g, '');
            const logoPath = `../images/logos/${safeBrandName}.png`;
            const placeholderLogoPath = '../images/logos/placeholder_logo.png';

            let economicBadgeHTML = '';
            const isEconomic = economicModels.includes(String(model).toUpperCase());
            if (isEconomic) economicBadgeHTML = `<span class="economic-badge" title="Prodotto linea economica">Economico</span>`;

            let wifiIconHTML = '';
            const wifiString = String(wifi).toLowerCase().trim();
            if (wifiString === 'sì' || wifiString === 'si' || wifiString === 'true') wifiIconHTML = `<i class="fas fa-wifi wifi-icon" title="Wi-Fi Integrato"></i>`;

            let datasheetLink = '';
            if (datasheetUrl && String(datasheetUrl).trim() !== '') datasheetLink = `<p class="product-datasheet"><a href="${datasheetUrl}" target="_blank" rel="noopener noreferrer" title="Apri scheda tecnica PDF per ${model}"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;

            let productCodeHTML = '';
            if (productCode && productCode !== 'N/D') {
                let codeContent = productCode; // Default
                if (typeof productCode === 'object' && productCode.UI && productCode.UE) { // Se codice_prodotto è un oggetto {UI: "cod1", UE: "cod2"}
                     codeContent = `UI: ${productCode.UI}<br>UE: ${productCode.UE}`;
                } else if (typeof productCode === 'string' && productCode.includes('UI:') && productCode.includes('UE:')) {
                    // Lascia la logica esistente per stringhe UI:/UE:
                }
                productCodeHTML = `<p class="product-info-text product-codes"><strong>Articoli:</strong><br><span class="code-value">${codeContent}</span></p>`;
            }

            let dimensionsHTML = '';
            if (uiDimensions !== "N/D" || ueDimensions !== "N/D") {
                 dimensionsHTML = `<p class="product-info-text product-dimensions" data-ui-dim="${uiDimensions}" data-ue-dim="${ueDimensions}" data-is-monobloc="${isMonobloc}"><strong>Dimensioni AxLxP (mm):</strong> `;
                 if (uiDimensions !== "N/D") dimensionsHTML += `<span>UI: ${uiDimensions}</span>`;
                 if (!isMonobloc && ueDimensions !== "N/D") {
                     if (uiDimensions !== "N/D") dimensionsHTML += ` / `; // Separatore solo se UI c'è
                     dimensionsHTML += `<span>UE: ${ueDimensions}</span>`;
                 }
                 dimensionsHTML += `</p>`;
            }


            let adminButtonsHTML = '';
            if (isAdmin) {
                 adminButtonsHTML = `<button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button><button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button><button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;
            }

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
                               ${adminButtonsHTML}
                           </div>
                       </div>
                   </div>
               </div>`;
        } catch (error) { console.error(`Error creating card ID ${product?.id}:`, error); return `<div class="product-card error-card">Errore nella creazione della card per ID ${product?.id}.</div>`; }
    }


    // --- GESTIONE ADMIN ---
    let originalProductData = {};
    function toggleEditMode(productId, isEditing) { /* COMPLETA QUESTA FUNZIONE CON LA TUA LOGICA */ console.log("Toggle edit mode per", productId, "a", isEditing); }
    function handleEditClick(event) { if (isAdmin) { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, true); } }
    function handleCancelClick(event) { if (isAdmin) { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, false); } }
    function handleSaveClick(event) { /* COMPLETA QUESTA FUNZIONE CON LA TUA LOGICA */ if(isAdmin){ console.log("Salva modifiche per", event.currentTarget.dataset.id); applyFiltersAndSort();} }
    function addEditListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => button.addEventListener('click', handleEditClick));
        document.querySelectorAll('.save-btn').forEach(button => button.addEventListener('click', handleSaveClick));
        document.querySelectorAll('.cancel-btn').forEach(button => button.addEventListener('click', handleCancelClick));
    }


    // --- GESTIONE TOOLTIP ---
    function positionTooltip(event) { /* COMPLETA QUESTA FUNZIONE */ }
    function handleTooltipMouseEnter(event) {
        /* COMPLETA QUESTA FUNZIONE */
        const el = event.currentTarget;
        const uiDim = el.dataset.uiDim || "N/D";
        const ueDim = el.dataset.ueDim || "N/D";
        const isMonobloc = el.dataset.isMonobloc === "true";

        if (tooltipElement && tooltipUiDimElement && tooltipUeDimElement) {
            tooltipUiDimElement.textContent = `UI: ${uiDim}`;
            tooltipUeDimElement.textContent = `UE: ${ueDim}`;
            tooltipUeDimElement.style.display = isMonobloc || ueDim === "N/D" ? 'none' : 'block';
            // Aggiusta la logica per 'no-blueprint' se serve
            tooltipElement.classList.remove('no-blueprint'); // Esempio
            tooltipElement.style.display = 'block';
            positionTooltip(event);
        }
    }
    function handleTooltipMouseLeave() { if(tooltipElement) tooltipElement.style.display = 'none'; }
    window.addTooltipListeners = function() { // Assicurati che questa venga definita globalmente o passata correttamente
        document.querySelectorAll('.product-dimensions').forEach(el => {
            el.removeEventListener('mouseenter', handleTooltipMouseEnter);
            el.removeEventListener('mouseleave', handleTooltipMouseLeave);
            el.removeEventListener('mousemove', positionTooltip); // Se il tooltip segue il mouse
            el.addEventListener('mouseenter', handleTooltipMouseEnter);
            el.addEventListener('mouseleave', handleTooltipMouseLeave);
            // el.addEventListener('mousemove', positionTooltip); // Se serve
        });
    };


    // --- NUOVE FUNZIONI PER MODALITÀ CONFRONTO ---
    function enterCompareMode() {
        isCompareModeActive = true;
        document.body.classList.add('compare-mode-active');
        if(toggleCompareModeBtn) {
            toggleCompareModeBtn.classList.add('active');
            toggleCompareModeBtn.textContent = 'Seleziona Articoli';
        }
        if(compareSelectionInfoEl) compareSelectionInfoEl.style.display = 'block';
        updateCompareSelectionUI();
        filterButtons.forEach(btn => { if (btn !== toggleCompareModeBtn) btn.disabled = true; });
    }

    function exitCompareMode() {
        isCompareModeActive = false;
        productsSelectedForCompare = [];
        document.body.classList.remove('compare-mode-active');
         if(toggleCompareModeBtn) {
            toggleCompareModeBtn.classList.remove('active');
            toggleCompareModeBtn.textContent = 'Avvia Confronto';
        }
        if(compareSelectionInfoEl) compareSelectionInfoEl.style.display = 'none';
        document.querySelectorAll('.product-card.selected-for-compare').forEach(card => card.classList.remove('selected-for-compare'));
        document.querySelectorAll('.product-card.max-selected').forEach(card => card.classList.remove('max-selected'));
        filterButtons.forEach(btn => { if (btn !== toggleCompareModeBtn) btn.disabled = false; });
        if(confirmComparisonBtnEl) confirmComparisonBtnEl.disabled = true;
    }

    function handleProductCardClickForCompare(event) {
        if (!isCompareModeActive) return;
        const card = event.currentTarget;
        const productId = card.dataset.productId;
        if (!productId) return;

        const index = productsSelectedForCompare.indexOf(productId);
        if (index > -1) {
            productsSelectedForCompare.splice(index, 1);
            card.classList.remove('selected-for-compare');
        } else {
            if (productsSelectedForCompare.length < MAX_COMPARE_SELECT) {
                productsSelectedForCompare.push(productId);
                card.classList.add('selected-for-compare');
            }
        }
        updateCompareSelectionUI();
    }

    function updateCompareSelectionUI() {
        if(compareSelectedCountEl) compareSelectedCountEl.textContent = productsSelectedForCompare.length;
        if(confirmComparisonBtnEl) confirmComparisonBtnEl.disabled = productsSelectedForCompare.length !== MAX_COMPARE_SELECT;

        const allCards = monosplitGrid.querySelectorAll('.product-card');
        if (productsSelectedForCompare.length >= MAX_COMPARE_SELECT) {
            allCards.forEach(card => {
                if (!productsSelectedForCompare.includes(card.dataset.productId)) {
                    card.classList.add('max-selected');
                } else {
                    card.classList.remove('max-selected');
                }
            });
        } else {
            allCards.forEach(card => card.classList.remove('max-selected'));
        }
    }

    function addCompareClickListenersToGridCards() {
        const cards = monosplitGrid.querySelectorAll('.product-card');
        cards.forEach(card => {
            card.removeEventListener('click', handleProductCardClickForCompare); // Previene doppi listener
            card.addEventListener('click', handleProductCardClickForCompare);
        });
    }

    function showComparisonPopup() {
        if (productsSelectedForCompare.length !== MAX_COMPARE_SELECT || !comparePopupOverlayEl || !comparePopupContentEl) return;

        comparePopupContentEl.innerHTML = '';
        productsSelectedForCompare.forEach(productId => {
            const productData = products.find(p => String(p.id) === productId);
            if (productData) {
                const cardHTML = createProductCard(productData); // Riutilizza la funzione per la struttura
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHTML;
                comparePopupContentEl.appendChild(tempDiv.firstChild);
            }
        });
        comparePopupOverlayEl.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Blocca lo scroll della pagina
        // Non usciamo più automaticamente dalla compare mode qui, l'utente la chiude dal popup
    }

    function closeComparisonPopup() {
        if (!comparePopupOverlayEl) return;
        comparePopupOverlayEl.classList.remove('visible');
        document.body.style.overflow = ''; // Ripristina lo scroll
        // Chiamare exitCompareMode qui se si vuole resettare la selezione all'uscita dal popup
        exitCompareMode();
    }


    // --- FILTRAGGIO, ORDINAMENTO E VISUALIZZAZIONE ---
    function displayProducts(productsToDisplay) {
        if (!monosplitGrid) { console.error("Monosplit grid not found."); return; }
        if (!Array.isArray(productsToDisplay)) { console.error("productsToDisplay is not an array.", productsToDisplay); monosplitGrid.innerHTML = '<p class="no-results error-message">Errore dati da visualizzare.</p>'; return; }

        let monosplitHTML = '';
        let monosplitCount = 0;
        productsToDisplay.forEach((product) => {
            if (!product || typeof product.id === 'undefined' || (product.tipo && String(product.tipo).toLowerCase() !== 'monosplit')) return;
            const cardHTML = createProductCard(product);
            monosplitHTML += cardHTML;
            monosplitCount++;
        });

        monosplitGrid.innerHTML = monosplitCount > 0 ? monosplitHTML : '<p class="no-results">Nessun prodotto Monosplit trovato per i filtri selezionati.</p>';
        if (monosplitSection) monosplitSection.style.display = 'block';

        if (isAdmin) addEditListeners();
        if (typeof window.addTooltipListeners === 'function') window.addTooltipListeners(); // Assicurati che sia globale o definita
        addCompareClickListenersToGridCards(); // Aggiungi listener per la selezione confronto

        // Aggiorna lo stato delle card se la modalità confronto è attiva
        if (isCompareModeActive) {
            updateCompareSelectionUI(); // Questo applicherà .max-selected se necessario
            document.querySelectorAll('.product-grid .product-card').forEach(card => {
                if (productsSelectedForCompare.includes(card.dataset.productId)) {
                    card.classList.add('selected-for-compare');
                }
            });
        }
    }

    function applyFiltersAndSort() {
        if (!Array.isArray(products)) { console.error("Original products array is invalid."); displayProducts([]); return; }
        let filtered = [...products]; // Clona l'array originale dei prodotti
        filtered = filtered.filter(p => !p.tipo || String(p.tipo).toLowerCase() === 'monosplit');
        if (currentBrandFilter !== 'all') { filtered = filtered.filter(p => p && p.marca && String(p.marca).toUpperCase() === currentBrandFilter); }
        if (showOnlyEconomic) { filtered = filtered.filter(p => p && p.modello && economicModels.includes(String(p.modello).toUpperCase())); }
        filtered.sort((a, b) => (a.prezzo || Infinity) - (b.prezzo || Infinity)); // Ordina per prezzo
        currentFilteredProducts = filtered; // Aggiorna l'array dei prodotti filtrati
        displayProducts(currentFilteredProducts);
    }

    // --- GESTIONE ADMIN (Modalità) ---
    function enterAdminMode() { isAdmin = true; document.body.classList.add('admin-mode'); document.body.classList.remove('operator-mode'); if (adminTrigger) adminTrigger.style.display = 'none'; if (exitAdminButton) exitAdminButton.style.display = 'inline-flex'; applyFiltersAndSort(); }
    function exitAdminMode() { isAdmin = false; document.body.classList.remove('admin-mode'); document.body.classList.add('operator-mode'); if (adminTrigger) adminTrigger.style.display = 'inline-flex'; if (exitAdminButton) exitAdminButton.style.display = 'none'; applyFiltersAndSort(); }


    // --- EVENT LISTENERS ---
    // Filtri normali
    filterButtons.forEach(button => {
        if (button.id === 'toggle-compare-mode-btn') return; // Salta il bottone di confronto
        button.addEventListener('click', (event) => {
            if (isCompareModeActive) return; // Ignora i filtri se la modalità confronto è attiva
            const clickedButton = event.currentTarget;
            const filterType = clickedButton.dataset.filterType;
            const brandToFilter = clickedButton.dataset.brand;
            if (filterType === 'economic') {
                showOnlyEconomic = !showOnlyEconomic;
                clickedButton.classList.toggle('active', showOnlyEconomic);
            } else if (brandToFilter) {
                filterButtons.forEach(btn => { if (btn.dataset.brand && btn.id !== 'toggle-compare-mode-btn') btn.classList.remove('active'); });
                clickedButton.classList.add('active');
                currentBrandFilter = brandToFilter.toLowerCase() === 'all' ? 'all' : brandToFilter.toUpperCase();
            }
            applyFiltersAndSort();
        });
    });

    // Tabs Sezioni
    if (sectionTabs.length > 0) {
        sectionTabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                const targetSection = tab.dataset.section;
                event.preventDefault();
                if (targetSection === 'multisplit') { window.location.href = '../multisplit/index.html'; }
                else if (targetSection === 'monosplit') { sectionTabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); }
            });
        });
    }

    // Pannello Password Admin
    if (adminTrigger && passwordPanel && closePanelButton && passwordInput && submitPasswordButton && passwordError) {
        adminTrigger.addEventListener('click', () => passwordPanel.classList.add('visible'));
        closePanelButton.addEventListener('click', () => { passwordPanel.classList.remove('visible'); passwordInput.value = ''; passwordError.textContent = ''; passwordInput.classList.remove('input-error');});
        submitPasswordButton.addEventListener('click', () => {
            if (passwordInput.value === ADMIN_PASSWORD) { enterAdminMode(); passwordPanel.classList.remove('visible'); passwordInput.value = ''; passwordError.textContent = ''; passwordInput.classList.remove('input-error'); }
            else { passwordError.textContent = 'Password errata.'; passwordInput.classList.add('input-error'); passwordInput.focus(); }
        });
        passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitPasswordButton.click(); });
    }
    if (exitAdminButton) { exitAdminButton.addEventListener('click', exitAdminMode); }
    if (printButton) { printButton.addEventListener('click', () => window.print()); }

    // Listeners per la modalità confronto
    if (toggleCompareModeBtn) { toggleCompareModeBtn.addEventListener('click', () => { if (isCompareModeActive) { exitCompareMode(); } else { enterCompareMode(); } });}
    if (cancelCompareModeBtnEl) { cancelCompareModeBtnEl.addEventListener('click', exitCompareMode); }
    if (confirmComparisonBtnEl) { confirmComparisonBtnEl.addEventListener('click', showComparisonPopup); }
    if (closeComparePopupBtnEl) { closeComparePopupBtnEl.addEventListener('click', closeComparisonPopup); }
    if (comparePopupOverlayEl) { comparePopupOverlayEl.addEventListener('click', (event) => { if (event.target === comparePopupOverlayEl) { closeComparisonPopup(); } });}


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
        // Non chiamare updateCompareSelectionUI qui perché la modalità confronto è inizialmente disattiva
    }

    initializeApp();

}); // Fine DOMContentLoaded
