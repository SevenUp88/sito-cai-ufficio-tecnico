// File: script.js (Listino Climatizzatori - Auth & Firestore Data - MODIFICATO)

(function() { // Inizio IIFE
    console.log("SCRIPT CLIMA: IIFE Iniziata.");

    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", 
        authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
        projectId: "consorzio-artigiani-idraulici",
        storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app", // CORRETTO da .appspot.com
        messagingSenderId: "136848104008",
        appId: "1:136848104008:web:2724f60607dbe91d09d67d",
        measurementId: "G-NNPV2607G7"
    };

    let app;
    let auth;
    let db; 

    try {
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
             if (!firebase.apps.length) {
                app = firebase.initializeApp(firebaseConfig);
             } else {
                app = firebase.app(); 
             }
            auth = firebase.auth();
            db = firebase.firestore(); 
            console.log("SCRIPT CLIMA: Firebase App, Auth e Firestore inizializzati.");
        } else { 
            console.error("SCRIPT CLIMA: Firebase SDK (v8) non trovato.");
            throw new Error("SDK Firebase (v8) non trovato."); 
        }
    } catch (error) {
        console.error("SCRIPT CLIMA: ERRORE FATALE init Firebase:", error);
        const statusMsgInitErr = document.getElementById('app-status-message');
        if (statusMsgInitErr) statusMsgInitErr.innerHTML = '<p style="color:red;font-weight:bold;">Errore critico inizializzazione.</p>';
        else { document.addEventListener('DOMContentLoaded', () => { document.body.innerHTML = '<p style="color:red;font-weight:bold;text-align:center;padding:20px;">Errore critico.</p>'; });}
        return; 
    }

    let currentUser = null;
    let currentUserRole = null;
    let firebaseAuthInitialized = false;
    let allProductsFromFirestore = []; 
    let currentFilteredProducts = [];
    let currentBrandFilter = 'ALL'; 
    let currentModelFilter = 'ALL'; // Per la serie/modello specifico, 'ALL' di default
    let showOnlyEconomic = false;
    const PRODUCTS_COLLECTION_NAME = "prodottiClimaMonosplit";

    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, 
        brandFilterButtonsGroup, // Contenitore dei bottoni MARCA
        modelSpecificFiltersContainer, modelFilterButtonsGroup, modelFilterLabel,
        sectionTabs, monosplitSection, multisplitSection,
        exitAdminButton, printButton, appStatusMessageElement,
        dataUpdateDateElementClima, currentYearElementClima,
        economicoFilterClimaBtn; // Riferimento al bottone economici

    function escapeHtml(unsafeString) {
        if (typeof unsafeString !== 'string') unsafeString = String(unsafeString || '');
        return unsafeString.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """).replace(/'/g, "'");
    }
    function formatPrice(price) {
        if (price === null || price === undefined || price === '') return 'N/D';
        let numPrice = parseFloat(String(price).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.'));
        return !isNaN(numPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numPrice) : 'N/D';
    }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];

    function createProductCard(product) {
        if (!product || typeof product !== 'object') return '<div class="product-card error-card">Errore dati prodotto.</div>';
        try {
            const placeholderProductImage = '../images/placeholder.png'; 
            const placeholderBrandLogo = '../images/logos/placeholder_logo.png'; 

            const imageUrl = product.image_url || placeholderProductImage;
            const brand = product.marca || 'N/D'; // Es: "HAIER" (è già UPPERCASE da Firestore)
            const displayNameOnCard = product.displayName || product.modello || 'N/D'; // Usa displayName, fallback su modello (serie)
            const serieName = product.modello || 'N/D'; // Questo è la SERIE (es: "REVIVE", "HR")
            
            const power = product.potenza || 'N/D';
            const energyCooling = product.classe_energetica_raffrescamento || 'N/D';
            const energyHeating = product.classe_energetica_riscaldamento || 'N/D';
            const wifi = product.wifi; // Booleano da Firestore
            const datasheetUrl = product.scheda_tecnica_url;
            const productCode = product.codice_prodotto || 'N/D';
            const uiDimensions = product.dimensioni_ui || "N/D";
            const ueDimensions = product.dimensioni_ue || "N/D";
            const isMonobloc = brand.toUpperCase() === 'INNOVA';
            const modelDataAttribute = (displayNameOnCard).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            
            const safeBrandName = brand.toLowerCase().replace(/\s+/g, '_');
            const logoPath = `../images/logos/${safeBrandName}.png`;

            let economicBadgeHTML_footer = ''; 
            // Filtro economico potrebbe basarsi su `serieName` o `displayNameOnCard`
            if (economicModels.some(em => displayNameOnCard.toUpperCase().includes(em))) { 
                economicBadgeHTML_footer = `<span class="economic-badge economic-badge-footer" title="Prodotto linea economica">Economico</span>`;
            }

            let wifiIconHTML = ''; 
            if (wifi === true) {
                wifiIconHTML = `<i class="fas fa-wifi wifi-icon" title="Wi-Fi Integrato"></i>`;
            }
            const cardTopRightElementsHTML = `${wifiIconHTML}`; 

            let novitaBadgeHtml = "";
            if (product.novita === true) { // product.novita è booleano da Firestore
                novitaBadgeHtml = '<span class="status-text status-novita-clima" title="Nuovo articolo!"><i class="fas fa-star"></i> Novità</span>';
            }

            let datasheetLink = ''; 
            if (datasheetUrl && String(datasheetUrl).trim() !== '' && String(datasheetUrl).trim() !== '-') {
                datasheetLink = `<p class="product-datasheet"><a href="${escapeHtml(datasheetUrl)}" target="_blank" rel="noopener noreferrer" title="Apri scheda tecnica PDF per ${escapeHtml(displayNameOnCard)}"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;
            }
            
            let productCodeHTML = ''; 
            if (productCode && productCode !== 'N/D' && productCode.trim() !== '-' && productCode.trim() !== '') { 
                let codeContent = ''; 
                const hasComponentPrices = typeof product.prezzo_ui === 'number' && typeof product.prezzo_ue === 'number'; 
                if (typeof productCode === 'string' && productCode.includes('UI:') && productCode.includes('UE:')) { 
                    const uiMatch = productCode.match(/UI:\s*([^/]+)/); 
                    const ueMatch = productCode.match(/UE:\s*([^/]+)/); 
                    const uiCode = uiMatch ? uiMatch[1].trim() : 'N/D'; 
                    const ueCode = ueMatch ? ueMatch[1].trim() : 'N/D'; 
                    codeContent = `UI: ${escapeHtml(uiCode)}`; 
                    if (hasComponentPrices && product.prezzo_ui > 0) codeContent += ` <span>(${formatPrice(product.prezzo_ui)})</span>`; 
                    codeContent += `<br>UE: ${escapeHtml(ueCode)}`; 
                    if (hasComponentPrices && product.prezzo_ue > 0) codeContent += ` <span>(${formatPrice(product.prezzo_ue)})</span>`; 
                } else { 
                    codeContent = escapeHtml(productCode); 
                } 
                productCodeHTML = `<p class="product-info-text product-codes"><strong>Articoli:</strong><span class="code-value">${codeContent}</span></p>`;
            }
            
            let dimensionsDetailsStrings = [];
            if (!isMonobloc && ueDimensions !== "N/D" && String(ueDimensions).trim() !== '' && String(ueDimensions).trim() !== '-') {
                dimensionsDetailsStrings.push(`<span class="dimension-item">Unità esterna: ${escapeHtml(ueDimensions)}</span>`);
            }
            if (uiDimensions !== "N/D" && String(uiDimensions).trim() !== '' && String(uiDimensions).trim() !== '-') {
                dimensionsDetailsStrings.push(`<span class="dimension-item">Unità interna: ${escapeHtml(uiDimensions)}</span>`);
            }
            let dimensionsHTML = '';
            if (dimensionsDetailsStrings.length > 0) {
                const joinedDetails = dimensionsDetailsStrings.join('');
                dimensionsHTML = `<p class="product-info-text product-dimensions">
                                    <strong>Dimensioni AxLxP (mm):</strong>
                                    <span class="dimensions-values-wrapper">${joinedDetails}</span>
                                  </p>`;
            }

            const energyClassHTML = `<p class="energy-class product-info-text"><strong>Classe En.:</strong><span class="cooling product-energy-cooling" title="Raffrescamento">${escapeHtml(energyCooling)}</span> <span class="heating product-energy-heating" title="Riscaldamento">${escapeHtml(energyHeating)}</span></p>`;
            
            return `<div class="product-card" data-product-id="${escapeHtml(product.id)}" data-brand="${escapeHtml(brand)}" data-model="${escapeHtml(modelDataAttribute)}">
                        <div class="card-top-right-elements">${cardTopRightElementsHTML}</div>
                        <div class="product-header">
                            <img src="${escapeHtml(logoPath)}" alt="Logo ${escapeHtml(brand)}" class="product-logo" onerror="this.onerror=null; this.src='${escapeHtml(placeholderBrandLogo)}';">
                            <div class="product-title-brand">
                                <span class="product-brand-text">${escapeHtml(brand)}</span>
                                <h3 class="product-model"> 
                                    ${escapeHtml(displayNameOnCard)}
                                    ${novitaBadgeHtml} 
                                </h3>
                            </div>
                        </div>
                        <img src="${escapeHtml(imageUrl)}" alt="Immagine ${escapeHtml(displayNameOnCard)}" class="product-image" onerror="this.onerror=null; this.src='${escapeHtml(placeholderProductImage)}';">
                        <div class="product-info">
                            <div class="product-details">
                                <p class="product-info-text"><strong>Potenza:</strong><span class="product-power">${escapeHtml(power)}</span></p>
                                ${energyClassHTML} 
                                ${productCodeHTML} 
                                ${dimensionsHTML} 
                                ${datasheetLink}
                            </div>
                            <div class="product-footer"> 
                                <div class="product-price-value">${formatPrice(product.prezzo)}</div>
                                ${economicBadgeHTML_footer} 
                                <div class="action-buttons-container"></div>
                            </div>
                        </div>
                    </div>`;
        } catch(e){console.error(`Err card ID ${product?.id || 'unknown'}`,e);return `<div class="product-card error-card">Errore creazione card</div>`;}
    }

    async function loadProductsFromFirestore() {
        // ... (come prima)
        if (!db) { console.error("loadProducts: Firestore (db) non inizializzato."); return []; }
        console.log(`loadProducts: Inizio caricamento da: ${PRODUCTS_COLLECTION_NAME}`);
        const loadingElement = document.getElementById('monosplit-loading') || monosplitGrid;
        if (loadingElement) loadingElement.innerHTML = '<div class="loading-placeholder">Caricamento prodotti...</div>';
        try {
            const snapshot = await db.collection(PRODUCTS_COLLECTION_NAME).get();
            if (snapshot.empty) { 
                console.log("loadProducts: Nessun prodotto trovato in Firestore.");
                if(loadingElement) loadingElement.innerHTML='<p class="no-results">Nessun prodotto disponibile.</p>'; 
                return []; 
            }
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`loadProducts: Caricati ${loaded.length} prodotti.`);
            return loaded;
        } catch (error) { 
            console.error("loadProducts: Errore caricamento da Firestore:", error); 
            if(loadingElement) loadingElement.innerHTML='<p class="no-results error-message">Errore durante il caricamento dei dati.</p>'; 
            return [];
        }
    }

    function updateAvailableBrandFilters(sourceProducts) {
        if (!brandFilterButtonsGroup) { console.warn("UPDATE_FILTERS: brandFilterButtonsGroup non trovato."); return; }
        if (!Array.isArray(sourceProducts)) { 
            Array.from(brandFilterButtonsGroup.children).forEach(b => { if(b.dataset.brand && b.dataset.brand.toUpperCase() !== 'ALL') b.style.display='none';});
            console.warn("UPDATE_FILTERS: sourceProducts non è array."); 
            return; 
        }
        const brands = [...new Set(sourceProducts.map(p => p.marca ? String(p.marca).toUpperCase() : null).filter(Boolean))].sort();
        
        Array.from(brandFilterButtonsGroup.children).forEach(child => {
            if (child.dataset.brand && child.dataset.brand.toUpperCase() !== 'ALL') {
                brandFilterButtonsGroup.removeChild(child);
            }
        });

        brands.forEach(brandName => { // brandName è già UPPERCASE
            const btn = document.createElement('button');
            btn.classList.add('filter-btn');
            btn.dataset.filterType = 'brand';
            btn.dataset.brand = brandName; 
            btn.textContent = brandName.charAt(0) + brandName.slice(1).toLowerCase();
            btn.addEventListener('click', handleFilterButtonClick);
            brandFilterButtonsGroup.appendChild(btn);
        });
        
        Array.from(brandFilterButtonsGroup.children).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.brand === currentBrandFilter);
        });
    }
    
    function populateModelSpecificFilters(selectedBrand, sourceProducts) { // selectedBrand è UPPERCASE
        if (!modelFilterButtonsGroup || !modelSpecificFiltersContainer || !modelFilterLabel) {
            console.warn("Elementi DOM per filtri modello specifici non trovati.");
            if(modelSpecificFiltersContainer) modelSpecificFiltersContainer.style.display = 'none';
            return;
        }
        modelFilterButtonsGroup.innerHTML = '';

        if (!selectedBrand || selectedBrand === 'ALL') {
            modelSpecificFiltersContainer.style.display = 'none';
            currentModelFilter = 'ALL';
            return;
        }
        
        // Usiamo product.modello (che in Firestore ora contiene la SERIE in UPPERCASE)
        const modelsForBrand = [...new Set(
            sourceProducts
                .filter(p => p.marca && p.marca.toUpperCase() === selectedBrand && p.modello) 
                .map(p => String(p.modello).toUpperCase()) // p.modello è la SERIE
        )].sort();

        if (modelsForBrand.length > 0) {
            modelFilterLabel.textContent = `Filtra Serie per ${selectedBrand.charAt(0) + selectedBrand.slice(1).toLowerCase()}:`;

            const allSeriesBtn = document.createElement('button');
            allSeriesBtn.classList.add('filter-btn');
            allSeriesBtn.textContent = `Tutte le Serie`;
            allSeriesBtn.dataset.filterType = 'model';
            allSeriesBtn.dataset.model = 'ALL'; // 'ALL' per i modelli
            allSeriesBtn.classList.toggle('active', currentModelFilter === 'ALL');
            allSeriesBtn.addEventListener('click', handleModelFilterClick);
            modelFilterButtonsGroup.appendChild(allSeriesBtn);

            modelsForBrand.forEach(modelName => { // modelName è la SERIE in UPPERCASE
                const btn = document.createElement('button');
                btn.classList.add('filter-btn');
                btn.textContent = modelName.charAt(0) + modelName.slice(1).toLowerCase(); // Capitalize
                btn.dataset.filterType = 'model';
                btn.dataset.model = modelName; 
                btn.classList.toggle('active', currentModelFilter === modelName);
                btn.addEventListener('click', handleModelFilterClick);
                modelFilterButtonsGroup.appendChild(btn);
            });
            modelSpecificFiltersContainer.style.display = 'flex';
        } else {
            modelSpecificFiltersContainer.style.display = 'none';
            currentModelFilter = 'ALL';
        }
    }

    function handleModelFilterClick(event) {
        if (!currentUser) return;
        const clickedButton = event.currentTarget;
        currentModelFilter = clickedButton.dataset.model.toUpperCase(); // È già uppercase ma per sicurezza

        Array.from(modelFilterButtonsGroup.children).forEach(btn => btn.classList.remove('active'));
        clickedButton.classList.add('active');
        applyFiltersAndSort();
    }

    function handleFilterButtonClick(event) {
        if (!currentUser) return;
        const clickedButton = event.currentTarget;
        const filterType = clickedButton.dataset.filterType;
        
        if (filterType === 'brand') {
            const newBrandFilter = clickedButton.dataset.brand.toUpperCase();
            if (newBrandFilter !== currentBrandFilter) { // Solo se la marca cambia effettivamente
                currentBrandFilter = newBrandFilter;
                currentModelFilter = 'ALL'; // Resetta filtro modello
                populateModelSpecificFilters(currentBrandFilter === 'ALL' ? null : currentBrandFilter, allProductsFromFirestore);
            }
            Array.from(brandFilterButtonsGroup.children).forEach(btn => btn.classList.remove('active'));
            clickedButton.classList.add('active');
        } else if (filterType === 'economic') {
            showOnlyEconomic = !showOnlyEconomic;
            clickedButton.classList.toggle('active', showOnlyEconomic);
        }
        applyFiltersAndSort();
    }
    
    // Assumendo che updateResetButtonVisibility non sia ancora definito/usato in questo script
    // function updateResetButtonVisibility() { /* ... */ }


    function applyFiltersAndSort() {
        let source = allProductsFromFirestore;
        if (!Array.isArray(source)) { currentFilteredProducts=[]; displayProducts([]); return; }

        let filtered = source.filter(p => !p.tipo || String(p.tipo).toLowerCase() === 'monosplit');
        
        if (currentBrandFilter !== 'ALL') {
            filtered = filtered.filter(p => p?.marca?.toUpperCase() === currentBrandFilter);
        }
        
        if (currentModelFilter !== 'ALL') {
            // p.modello da Firestore è la SERIE in UPPERCASE, currentModelFilter è la serie selezionata in UPPERCASE
            filtered = filtered.filter(p => p?.modello === currentModelFilter); 
        }

        if (showOnlyEconomic) {
            // Il filtro economico potrebbe basarsi su p.modello (serie) o p.displayName
            filtered = filtered.filter(p => p?.modello && economicModels.includes(p.modello.toUpperCase()));
        }
        
        filtered.sort((a,b) => (a?.prezzo ?? Infinity) - (b?.prezzo ?? Infinity));
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
        // updateResetButtonVisibility(); 
    }

    function displayProducts(productsToDisplay) {
        if (!monosplitGrid) { return; }
        let html = '';
        if (Array.isArray(productsToDisplay) && productsToDisplay.length > 0) {
            productsToDisplay.forEach(p => html += createProductCard(p));
        } else {
            html = '<p class="no-results">Nessun prodotto trovato con i filtri selezionati.</p>';
        }
        monosplitGrid.innerHTML = html;
        // La gestione display delle sezioni avviene nei tab click
    }
    
    async function initializeAppMainLogic() {
        if (appStatusMessageElement) appStatusMessageElement.style.display = 'none';
        allProductsFromFirestore = await loadProductsFromFirestore();
        
        currentBrandFilter = 'ALL';
        showOnlyEconomic = false;
        currentModelFilter = 'ALL';

        updateAvailableBrandFilters(allProductsFromFirestore);
        populateModelSpecificFilters(null, allProductsFromFirestore); 

        const allBrandsBtn = brandFilterButtonsGroup ? brandFilterButtonsGroup.querySelector('.filter-btn[data-brand="ALL"]') : null;
        if (allBrandsBtn) allBrandsBtn.classList.add('active');
        
        if(economicoFilterClimaBtn) economicoFilterClimaBtn.classList.remove('active');
        
        applyFiltersAndSort(); 
    }

    function showLoginScreen() {
        if (appStatusMessageElement) { appStatusMessageElement.textContent = "Accesso richiesto."; appStatusMessageElement.style.display = 'block';}
        if (mainPageContainer) mainPageContainer.classList.add('content-hidden');
        if (headerElement) headerElement.classList.add('content-hidden');
        if (loginPanel) loginPanel.classList.add('visible');
        if (exitAdminButton) exitAdminButton.style.display = 'none';
    }
    function hideLoginScreenAndShowApp() {
        if (loginPanel) loginPanel.classList.remove('visible');
        if (mainPageContainer) mainPageContainer.classList.remove('content-hidden');
        if (headerElement) headerElement.classList.remove('content-hidden');
        if (exitAdminButton && currentUser) exitAdminButton.style.display = 'inline-flex'; 
        if (appStatusMessageElement) appStatusMessageElement.style.display = 'none';
    }
    
    async function initializeAppForUser(user) {
        currentUser = user;
        if (db && user) {
            const userDocRef = db.collection('users').doc(user.uid);
            try {
                const doc = await userDocRef.get();
                currentUserRole = doc.exists ? (doc.data().role || 'user') : 'user';
            } catch (e) { currentUserRole = 'user'; console.error("Errore recupero ruolo:", e); }
        } else { currentUserRole = user ? 'user' : null; }
        
        document.body.classList.toggle('admin-mode',currentUserRole==='admin');
        document.body.classList.toggle('operator-mode', currentUserRole!=='admin' || !currentUserRole);
        
        hideLoginScreenAndShowApp();
        await initializeAppMainLogic();
    }
    
    function performLogoutCleanup() {
        currentUser=null;currentUserRole=null;allProductsFromFirestore=[];currentFilteredProducts=[];
        if(monosplitGrid) monosplitGrid.innerHTML='';
        document.body.classList.remove('admin-mode');document.body.classList.add('operator-mode');
        if(modelSpecificFiltersContainer) modelSpecificFiltersContainer.style.display = 'none';
        if(modelFilterButtonsGroup) modelFilterButtonsGroup.innerHTML = ''; 
        if (brandFilterButtonsGroup) { // Resetta anche i bottoni marca
            Array.from(brandFilterButtonsGroup.children).forEach(btn => btn.classList.remove('active'));
            const allBrandsBtn = brandFilterButtonsGroup.querySelector('.filter-btn[data-brand="ALL"]');
            if (allBrandsBtn) allBrandsBtn.classList.add('active');
        }
        if(economicoFilterClimaBtn) economicoFilterClimaBtn.classList.remove('active');
        showLoginScreen();
    }

    function mapFirebaseAuthError(errCode){ 
        switch(errCode){
            case"auth/invalid-email":case"auth/invalid-credential":return"Email o password errati.";
            case"auth/user-disabled":return"Account disabilitato.";
            case"auth/user-not-found":return"Utente non registrato.";
            case"auth/wrong-password":return"Password errata.";
            case"auth/too-many-requests":return"Troppi tentativi. Riprova più tardi.";
            default:return"Errore autenticazione. Codice: "+errCode;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM_LOADED (Clima): Inizio aggancio elementi.");
        
        mainPageContainer = document.querySelector('.container'); 
        headerElement = document.querySelector('.app-header'); 
        loginPanel = document.getElementById('password-panel'); 
        closeLoginPanelBtn = document.getElementById('close-panel-btn'); 
        loginEmailInput = document.getElementById('login-email-input-clima'); 
        loginPasswordInput = document.getElementById('admin-password'); 
        submitLoginBtn = document.getElementById('submit-password-btn'); 
        loginErrorMsg = document.getElementById('password-error');     
        monosplitGrid = document.getElementById('monosplit-grid'); 
        brandFilterButtonsGroup = document.getElementById('brand-filter-buttons-clima'); // Usa l'ID specifico
        
        modelSpecificFiltersContainer = document.getElementById('model-specific-filters-container');
        modelFilterButtonsGroup = document.getElementById('model-filter-buttons');
        modelFilterLabel = document.getElementById('model-filter-label');

        sectionTabs = document.querySelectorAll('.section-tabs .tab-btn'); 
        monosplitSection = document.getElementById('monosplit-section'); 
        multisplitSection = document.getElementById('multisplit-section');
        exitAdminButton = document.getElementById('exit-admin-button'); 
        printButton = document.getElementById('print-button'); 
        appStatusMessageElement = document.getElementById('app-status-message');
        dataUpdateDateElementClima = document.getElementById('data-update-date-clima');
        currentYearElementClima = document.getElementById('current-year-clima');
        economicoFilterClimaBtn = document.getElementById('economico-filter-clima');


        if (currentYearElementClima) currentYearElementClima.textContent = new Date().getFullYear();
        
        if (db && dataUpdateDateElementClima) {
             db.collection('metadata').doc('listiniInfoClima') 
                .onSnapshot(doc => {
                    if (dataUpdateDateElementClima) {
                        if (doc.exists && doc.data()?.lastUpdate) { 
                            const ts = doc.data().lastUpdate;
                            dataUpdateDateElementClima.textContent = (ts && typeof ts.toDate === 'function') ? 
                                ts.toDate().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : "Non disp.";
                        } else { dataUpdateDateElementClima.textContent = "Non specificato"; }
                    }
                }, error => {
                    console.error("Errore fetch metadata clima:", error);
                    if (dataUpdateDateElementClima) dataUpdateDateElementClima.textContent = "Errore data";
                });
        }

        if (!loginPanel || !loginEmailInput || !loginPasswordInput || !submitLoginBtn || !loginErrorMsg) {
            console.error("DOM_LOADED: Elementi chiave del pannello login mancanti!");
            if(appStatusMessageElement) {appStatusMessageElement.innerHTML='<p style="color:red;">Errore interfaccia login.</p>'; appStatusMessageElement.style.display = 'block';}
            return; 
        }
        if(appStatusMessageElement) appStatusMessageElement.textContent = "Pronto per autenticazione...";

        if (auth) {
            auth.onAuthStateChanged(user => {
                firebaseAuthInitialized = true; 
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Verifica stato autenticazione...";
                if(user) initializeAppForUser(user); else performLogoutCleanup();
            });

            submitLoginBtn.addEventListener('click', () => {
                const e = loginEmailInput.value.trim(), p = loginPasswordInput.value;
                loginErrorMsg.textContent = '';
                loginEmailInput.classList.remove('input-error'); 
                loginPasswordInput.classList.remove('input-error');
                if(!e||!p){ loginErrorMsg.textContent = 'Email e Password obbligatori.'; return;}
                auth.signInWithEmailAndPassword(e, p).catch(err => {
                    loginErrorMsg.textContent = mapFirebaseAuthError(err.code);
                    loginPasswordInput.classList.add('input-error');
                    loginEmailInput.classList.add('input-error');
                });
            });
            const inputs = [loginEmailInput, loginPasswordInput];
            inputs.forEach(input => {
                if(input) {
                    input.addEventListener('input', () => { input.classList.remove('input-error'); loginErrorMsg.textContent=''; });
                    input.addEventListener('keypress', e => { if(e.key==='Enter'){ e.preventDefault(); submitLoginBtn.click(); }});
                }
            });
            
            if(exitAdminButton) exitAdminButton.addEventListener('click', () => auth.signOut().catch(e => console.error('Logout err:', e)));
            if(closeLoginPanelBtn) closeLoginPanelBtn.addEventListener('click', () => {if(loginPanel) loginPanel.classList.remove('visible');});
            
        } else { console.error("DOM_LOADED: FATAL - 'auth' NON definito!"); if(appStatusMessageElement)appStatusMessageElement.innerHTML='<p style="color:red;">Servizio Auth non disp.</p>';}

        setTimeout(() => {
            if (!firebaseAuthInitialized && auth) {
                if(appStatusMessageElement && (!auth.currentUser || appStatusMessageElement.textContent.includes("autenticazione"))) appStatusMessageElement.textContent = "Timeout autenticazione. Verifico...";
                if(!auth.currentUser) performLogoutCleanup(); else initializeAppForUser(auth.currentUser);
            }
        }, 3500);
        
        if (brandFilterButtonsGroup) {
            Array.from(brandFilterButtonsGroup.children).forEach(btn => {
                if (btn.matches('.filter-btn[data-filter-type="brand"]')) {
                     btn.addEventListener('click', handleFilterButtonClick);
                }
            });
        }
        if (economicoFilterClimaBtn) { // Era economicoFilterBtn
            economicoFilterClimaBtn.addEventListener('click', handleFilterButtonClick);
        }
        
        if(sectionTabs && sectionTabs.length>0) { // Aggiunto check per sectionTabs
            sectionTabs.forEach(t => {
                t.addEventListener('click', e => {
                    if(!currentUser) return;
                    const ts = t.dataset.section;
                    e.preventDefault();
                    sectionTabs.forEach(tb => tb.classList.remove('active'));
                    t.classList.add('active');

                    if(ts === 'multisplit') {
                        if(monosplitSection) monosplitSection.style.display = 'none';
                        if(modelSpecificFiltersContainer) modelSpecificFiltersContainer.style.display = 'none'; // Nascondi filtri serie
                        if(multisplitSection) multisplitSection.style.display = 'block';
                        if(document.getElementById('multisplit-grid')) document.getElementById('multisplit-grid').innerHTML = '<div class="loading-placeholder">Per il listino MULTISPLIT completo consulta il CATALOGO PDF. <br>Per un PREVENTIVO contattare Ufficio Tecnico.</div>';

                    } else if(ts === 'monosplit') {
                        if(monosplitSection) monosplitSection.style.display = 'block';
                        if(multisplitSection) multisplitSection.style.display = 'none';
                        // Se i filtri marca sono già stati impostati e la marca selezionata ha filtri serie, mostrali
                        if(currentBrandFilter && currentBrandFilter !== 'ALL' && modelFilterButtonsGroup && modelFilterButtonsGroup.children.length > 1) { // >1 per contare "Tutte le Serie"
                           if (modelSpecificFiltersContainer) modelSpecificFiltersContainer.style.display = 'flex';
                        } else {
                           if (modelSpecificFiltersContainer) modelSpecificFiltersContainer.style.display = 'none';
                        }
                        applyFiltersAndSort(); 
                    }
                });
            });
        }

        if(printButton)printButton.addEventListener('click',()=>{ if(!currentUser){alert("Devi effettuare il login per stampare.");return;} window.print();});
        
        console.log("DOM_LOADED (Clima): Fine aggancio elementi e listeners.");
    }); 

})(); 
// console.log("SCRIPT CLIMA: IIFE ESEGUITA.");
