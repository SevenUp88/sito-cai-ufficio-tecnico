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
    let itemsToCompare = []; // Array di ID prodotto
    const MAX_COMPARE_ITEMS = 3;
    // +++ FINE STATO PER IL CONFRONTO +++

    document.body.classList.add('operator-mode');

    // Selezione elementi DOM principali
    const monosplitGrid = document.getElementById('monosplit-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    // ... (altri selettori esistenti)

    // +++ SELETTORI DOM PER IL CONFRONTO +++
    const comparePopupOverlayEl = document.getElementById('compare-popup-overlay');
    const comparePopupContentEl = document.getElementById('compare-popup-content');
    const closeComparePopupBtnEl = document.getElementById('close-compare-popup-btn');
    const clearCompareSelectionBtnEl = document.getElementById('clear-compare-selection-btn');
    const compareBarEl = document.getElementById('compare-bar');
    const compareBarCountEl = document.getElementById('compare-bar-count');
    const compareBarShowBtnEl = document.getElementById('compare-bar-show-btn');
    // +++ FINE SELETTORI DOM PER IL CONFRONTO +++


    // ... (tutte le tue funzioni esistenti: handleFatalError, formatPrice, economicModels) ...

    // --- CREAZIONE CARD (MODIFICATA) ---
    function createProductCard(product) {
        if (!product || typeof product !== 'object') return '<div class="product-card error-card">Errore dati prodotto.</div>';
        try {
            // ... (tutto il codice per recuperare i dati del prodotto: imageUrl, brand, model, ecc.)
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

            // +++ AGGIUNTA PULSANTE CONFRONTA +++
            const isSelectedForCompare = itemsToCompare.includes(String(product.id));
            const compareBtnClass = isSelectedForCompare ? 'btn-compare selected' : 'btn-compare';
            const compareBtnText = isSelectedForCompare ? 'Rimuovi da Confronto' : 'Confronta';
            const compareBtnHTML = `<button class="${compareBtnClass}" data-product-id="${product.id}" title="${compareBtnText}">${compareBtnText}</button>`;
            // +++ FINE AGGIUNTA PULSANTE CONFRONTA +++

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
                               ${compareBtnHTML} {/* Pulsante Confronta aggiunto qui */}
                           </div> 
                       </div> 
                   </div>
               </div>`;
        } catch (error) { console.error(`Error creating card ID ${product?.id}`, error); return `<div class="product-card error-card">Err card ID ${product?.id}.</div>`; }
    }
    // --- FINE CREAZIONE CARD ---

    // --- FILTRAGGIO, ORDINAMENTO E VISUALIZZAZIONE (MODIFICATA) ---
    function displayProducts(productsToDisplay) {
        // ... (codice esistente per popolare monosplitGrid.innerHTML)
        // Mostra solo in monosplitGrid
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

        // +++ AGGIUNGI LISTENER AI PULSANTI CONFRONTA DOPO AVER CREATO LE CARD +++
        addCompareButtonListenersToCards();
        updateCompareBar(); // Aggiorna la barra di confronto
        // +++ FINE AGGIUNTA LISTENER +++
    }
    // --- FINE FILTRAGGIO E VISUALIZZAZIONE ---


    // +++ FUNZIONI PER LA LOGICA DI CONFRONTO +++
    function toggleCompareItem(productIdStr) {
        const productId = String(productIdStr); // Assicura sia stringa per coerenza
        const index = itemsToCompare.indexOf(productId);

        if (index > -1) { // Se già presente, rimuovi
            itemsToCompare.splice(index, 1);
        } else { // Altrimenti, aggiungi se c'è spazio
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
                button.textContent = 'Rimuovi da Confronto';
                button.title = 'Rimuovi da Confronto';
            } else {
                button.classList.remove('selected');
                button.textContent = 'Confronta';
                button.title = 'Confronta';
            }
        });
    }

    function addCompareButtonListenersToCards() {
        const compareCardBtns = document.querySelectorAll('.product-card .btn-compare');
        compareCardBtns.forEach(btn => {
            btn.removeEventListener('click', handleCompareCardBtnClick); // Rimuovi vecchi listener
            btn.addEventListener('click', handleCompareCardBtnClick);
        });
    }

    function handleCompareCardBtnClick(event) {
        const productId = event.target.dataset.productId;
        toggleCompareItem(productId);
    }

    function updateCompareBar() {
        if (!compareBarEl || !compareBarCountEl || !compareBarShowBtnEl) return;
        compareBarCountEl.textContent = itemsToCompare.length;
        compareBarShowBtnEl.disabled = itemsToCompare.length === 0;
        if (itemsToCompare.length > 0) {
            compareBarEl.classList.add('visible');
        } else {
            compareBarEl.classList.remove('visible');
        }
    }

    function openComparePopup() {
        if (!comparePopupOverlayEl || !comparePopupContentEl || itemsToCompare.length === 0) return;

        comparePopupContentEl.innerHTML = ''; // Pulisci
        itemsToCompare.forEach(productId => {
            const product = products.find(p => String(p.id) === productId);
            if (product) {
                const cardHTML = createProductCard(product); // Ricrea la card
                // Per evitare problemi con ID duplicati se cloni, è meglio inserire l'HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHTML;
                comparePopupContentEl.appendChild(tempDiv.firstChild);
            }
        });
        comparePopupOverlayEl.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Impedisce scroll della pagina sotto
    }

    function closeComparePopup() {
        if (!comparePopupOverlayEl) return;
        comparePopupOverlayEl.classList.remove('visible');
        document.body.style.overflow = ''; // Ripristina scroll
    }

    function clearCompareSelection() {
        itemsToCompare = [];
        updateCompareButtonsState();
        updateCompareBar();
        // Se il popup è aperto, potresti volerlo chiudere o svuotare il contenuto
        if (comparePopupOverlayEl.classList.contains('visible')) {
            comparePopupContentEl.innerHTML = '<p style="text-align:center; color: var(--secondary-color);">Seleziona articoli da confrontare.</p>';
        }
    }
    // +++ FINE FUNZIONI PER CONFRONTO +++


    // --- EVENT LISTENERS (MODIFICATI/AGGIUNTI) ---
    // ... (tutti i tuoi listener esistenti per filtri, tabs, admin, ecc.)
    // Filtri (MODIFICATO)
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
                    filterButtons.forEach(btn => {
                        if (btn.dataset.brand) {
                            btn.classList.remove('active');
                        }
                    });
                    clickedButton.classList.add('active');
                    if (brandToFilter.toLowerCase() === 'all') {
                        currentBrandFilter = 'all';
                    } else {
                        currentBrandFilter = brandToFilter.toUpperCase();
                    }
                }
                applyFiltersAndSort();
            });
        });
    } else {
        console.warn("Filter buttons not found.");
    }


    // +++ EVENT LISTENER PER IL CONFRONTO +++
    if (compareBarShowBtnEl) {
        compareBarShowBtnEl.addEventListener('click', openComparePopup);
    }
    if (closeComparePopupBtnEl) {
        closeComparePopupBtnEl.addEventListener('click', closeComparePopup);
    }
    if (comparePopupOverlayEl) { // Chiudi cliccando sull'overlay
        comparePopupOverlayEl.addEventListener('click', (event) => {
            if (event.target === comparePopupOverlayEl) {
                closeComparePopup();
            }
        });
    }
    if (clearCompareSelectionBtnEl) {
        clearCompareSelectionBtnEl.addEventListener('click', clearCompareSelection);
    }
    // +++ FINE EVENT LISTENER PER IL CONFRONTO +++


    // --- INIZIALIZZAZIONE APP ---
    function initializeApp() {
        // ... (codice di inizializzazione esistente)
        if (products && products.length > 0) {
            currentBrandFilter = 'all';
            showOnlyEconomic = false;
            document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
            document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
            applyFiltersAndSort(); // Questo chiamerà displayProducts che aggiungerà i listener ai bottoni confronta
        } else {
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto disponibile.</p>';
            if (monosplitSection) monosplitSection.style.display = 'block';
        }
        updateCompareBar(); // Stato iniziale della barra di confronto
    }
    initializeApp();
    // --- FINE INIZIALIZZAZIONE ---

}); // Fine DOMContentLoaded
