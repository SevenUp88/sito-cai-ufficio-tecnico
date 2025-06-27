/* File: script.js (Listino Climatizzatori - Auth, Firestore, e MODAL DETTAGLI - VERSIONE CORRETTA E FUNZIONANTE) */

(function() { // Inizio IIFE
    console.log("SCRIPT: IIFE Iniziata.");

    // --- CONFIGURAZIONE FIREBASE ---
    // !!! ASSICURATI CHE QUESTA SIA LA CHIAVE CORRETTA DEL TUO PROGETTO !!!
    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", 
        authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
        projectId: "consorzio-artigiani-idraulici",
        storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
        messagingSenderId: "136848104008",
        appId: "1:136848104008:web:2724f60607dbe91d09d67d",
        measurementId: "G-NNPV2607G7"
    };
    let app, auth, db;
    try {
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            console.log("SCRIPT: Firebase App, Auth e Firestore inizializzati (SDK v8).");
        } else {
            throw new Error("SDK Firebase (v8) non trovato o non caricato correttamente.");
        }
    } catch (error) {
        console.error("SCRIPT: ERRORE FATALE init Firebase:", error);
        document.addEventListener('DOMContentLoaded', () => { document.body.innerHTML = '<p style="color:red;font-weight:bold;text-align:center;padding:20px;">Errore critico inizializzazione.</p>'; });
        return;
    }

    // --- STATO GLOBALE SCRIPT ---
    let currentUser = null;
    let currentUserRole = null;
    let firebaseAuthInitialized = false;
    let allProductsFromFirestore = [];
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];

    // --- RIFERIMENTI DOM ---
    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, filterButtons,
        sectionTabs, monosplitSection, exitAdminButton, printButton, appStatusMessageElement,
        // NUOVI RIFERIMENTI PER IL MODAL
        detailsModalOverlay, modalProductLogo, modalProductBrand, modalProductModel,
        modalProductImage, modalMainDetailsList, modalExtraDetailsList,
        modalProductPrice, closeModalBtn, modalDatasheetLink;

    // --- FUNZIONI UTILITY E MODAL ---
    function formatPrice(price) {
        if (price === null || price === undefined || price === '') return 'N/D';
        let numPrice = NaN;
        if (typeof price === 'number') numPrice = price;
        else if (typeof price === 'string') {
            try { numPrice = parseFloat(price.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')); } catch (e) {}
        }
        return !isNaN(numPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numPrice) : 'N/D';
    }

    // Funzione per gestire il modal (VERSIONE CON CONTROLLI DI SICUREZZA)
    function populateAndShowModal(product) {
        console.log("Dentro populateAndShowModal, cerco di popolare per:", product.modello);
    
        const requiredElements = { detailsModalOverlay, modalProductLogo, modalProductBrand, modalProductModel, modalProductImage, modalMainDetailsList, modalExtraDetailsList, modalProductPrice, modalDatasheetLink };
        for (const key in requiredElements) {
            if (!requiredElements[key]) {
                console.error(`ERRORE FATALE: L'elemento del modal '${key}' non è stato trovato nel DOM. Controlla l'ID nel file HTML.`);
                alert(`Errore: Manca un pezzo del modal (${key}). Controlla la console.`);
                return;
            }
        }
    
        if (!product) {
            console.error("populateAndShowModal è stata chiamata senza un prodotto valido.");
            return;
        }
    
        const safeBrandName = product.marca ? product.marca.toLowerCase().replace(/\s+/g, '') : '';
        modalProductLogo.src = `../images/logos/${safeBrandName}.png`;
        modalProductLogo.alt = `Logo ${product.marca || 'N/D'}`;
        modalProductLogo.onerror = () => { modalProductLogo.src = '..images/logos/placeholder_logo.png'; };
        
        modalProductBrand.textContent = product.marca || 'N/D';
        modalProductModel.textContent = product.modello || 'N/D';
        
        modalProductImage.src = product.image_url || '..images/placeholder.png';
        modalProductImage.onerror = () => { modalProductImage.src = '..images/placeholder.png'; };
        modalProductImage.alt = `Immagine ${product.modello || 'N/D'}`;
        
        const createDetailRowHTML=(label,value,unit='') => {
            if (value===null||value===undefined||String(value).trim()==='') return '';
            const displayValue = (typeof value==='number'?String(value).replace('.',','):value);
            return `<li><strong>${label}:</strong><span>${displayValue}${unit}</span></li>`;
        };
    
        let mainDetailsHTML = '';
        mainDetailsHTML += createDetailRowHTML('Potenza', product.potenza);
        mainDetailsHTML += createDetailRowHTML('Classe Raffr.', product.classe_energetica_raffrescamento);
        mainDetailsHTML += createDetailRowHTML('Classe Risc.', product.classe_energetica_riscaldamento);
        mainDetailsHTML += createDetailRowHTML('Dimensioni UI (AxLxP)', product.dimensioni_ui, ' mm');
        mainDetailsHTML += createDetailRowHTML('Dimensioni UE (AxLxP)', product.dimensioni_ue, ' mm');
        mainDetailsHTML += createDetailRowHTML('Codice Prodotto', product.codice_prodotto);
        modalMainDetailsList.innerHTML = mainDetailsHTML;
    
        let extraDetailsHTML = '';
        extraDetailsHTML += createDetailRowHTML('EER (Raffr.)', product.eer);
        extraDetailsHTML += createDetailRowHTML('COP (Risc.)', product.cop);
        extraDetailsHTML += createDetailRowHTML('Gas Refrigerante', product.gas);
        extraDetailsHTML += createDetailRowHTML('Quantità Gas', product.quantita_gas, ' g');
        extraDetailsHTML += createDetailRowHTML('Peso UI', product.peso_ui, ' kg');
        extraDetailsHTML += createDetailRowHTML('Peso UE', product.peso_ue, ' kg');
        extraDetailsHTML += createDetailRowHTML('Prezzo Kit', formatPrice(product.prezzo_kit));
        extraDetailsHTML += createDetailRowHTML('Prezzo solo UI', formatPrice(product.prezzo_ui));
        extraDetailsHTML += createDetailRowHTML('Prezzo solo UE', formatPrice(product.prezzo_ue));
        modalExtraDetailsList.innerHTML = extraDetailsHTML;
    
        modalProductPrice.textContent = formatPrice(product.prezzo);
        
        if (modalDatasheetLink) {
            if (product.scheda_tecnica_url && product.scheda_tecnica_url.trim() !== '') {
                modalDatasheetLink.href = product.scheda_tecnica_url;
                modalDatasheetLink.classList.remove('hidden');
            } else {
                modalDatasheetLink.href = '#';
                modalDatasheetLink.classList.add('hidden');
            }
        }
        
        document.body.classList.add('modal-open');
        detailsModalOverlay.classList.add('visible');
        console.log("Modal popolato e reso visibile.");
    }
    
    function closeModal() {
        if (!detailsModalOverlay) return;
        document.body.classList.remove('modal-open');
        detailsModalOverlay.classList.remove('visible');
    }

    function mapFirebaseAuthError(errCode){ 
        console.log("AUTH_ERR: map per", errCode); 
        switch(errCode){
            case"auth/invalid-email":case"auth/invalid-credential":return"Email o password errati.";
            case"auth/user-disabled":return"Account disabilitato.";
            case"auth/user-not-found":return"Utente non registrato.";
            case"auth/wrong-password":return"Password errata.";
            case"auth/too-many-requests":return"Troppi tentativi. Riprova più tardi.";
            default:return"Errore autenticazione: "+errCode;
        }
    }

    // --- FUNZIONI CORE ---
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
            
            const modelDataAttribute = (model || 'nd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const safeBrandName = brand.toLowerCase().replace(/\s+/g, '');
            const logoPath = `../images/logos/${safeBrandName}.png`;
            const placeholderLogoPath = '..images/logos/placeholder_logo.png';
            
            let economicBadgeHTML_footer = economicModels.includes(model.toUpperCase()) ? `<span class="economic-badge economic-badge-footer" title="Prodotto linea economica">Economico</span>` : '';
            const wifiString = String(wifi).toLowerCase().trim();
            let wifiIconHTML = (wifiString === 'sì' || wifiString === 'si' || wifiString === 'true') ? `<i class="fas fa-wifi wifi-icon" title="Wi-Fi Integrato"></i>` : '';
            let datasheetLink = ''; 
            if (datasheetUrl && String(datasheetUrl).trim() !== '') {
                datasheetLink = `<p class="product-datasheet"><a href="${datasheetUrl}" target="_blank" rel="noopener noreferrer" title="Apri scheda tecnica PDF per ${model}"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;
            }
            const dimensionsHTML = `<p class="product-info-text product-dimensions"><strong>Dimensioni AxLxP (mm):</strong><span class="dimensions-values-wrapper"><span class="dimension-item">UI: ${uiDimensions}</span><span class="dimension-item">UE: ${ueDimensions}</span></span></p>`;
            const energyClassHTML = `<p class="energy-class product-info-text"><strong>Classe En.:</strong><span class="cooling product-energy-cooling">${energyCooling}</span> <span class="heating product-energy-heating">${energyHeating}</span></p>`;

            const actionButtonsContainerContent = `<button class="toggle-details-btn">Dettagli</button>`;
            
            return `<div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}">
                        <div class="card-top-right-elements">${wifiIconHTML}</div>
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
                                <p class="product-info-text"><strong>Potenza:</strong><span class="product-power">${power}</span></p>
                                ${energyClassHTML}
                                <p class="product-info-text"><strong>Codice:</strong> <span class="code-value">${productCode}</span></p>
                                ${dimensionsHTML}
                                ${datasheetLink}
                            </div>
                            <div class="product-footer"> 
                                <div class="product-price-value">${formatPrice(product.prezzo)}</div>
                                ${economicBadgeHTML_footer}
                                <div class="action-buttons-container">${actionButtonsContainerContent}</div>
                            </div>
                        </div>
                    </div>`;
        } catch(e) { console.error(`Errore creazione card ID ${product?.id}`, e); return `<div class="product-card error-card">Errore creazione card ${product?.id}</div>`; }
    }

    async function loadProductsFromFirestore() {
        if (!db) { console.error("LPPFS: Firestore (db) non inizializzato."); if (monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">DB non disp.</p>'; return []; }
        const collectionName = "prodottiClimaMonosplit";
        console.log("LPPFS: Inizio caricamento da:", collectionName);
        if (monosplitGrid) monosplitGrid.innerHTML = '<div class="loading-placeholder">Caricamento prodotti da Firestore...</div>';
        try {
            const snapshot = await db.collection(collectionName).get();
            if (snapshot.empty) { if (monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto in DB.</p>'; return []; }
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`LPPFS: Caricati ${loaded.length} prodotti.`);
            return loaded;
        } catch (error) {
            console.error("LPPFS: Errore caricamento da Firestore:", error);
            if (monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore caric. dati.</p>';
            return [];
        }
    }
    
    function updateAvailableBrandFilters(sourceProducts) {
        if (!filterButtons || filterButtons.length === 0) { console.warn("UPDATE_FILTERS: Bottoni non trovati."); return; }
        if (!Array.isArray(sourceProducts)) { filterButtons.forEach(b=>{if(b.dataset.brand&&b.dataset.brand!=='all')b.style.display='none';}); console.warn("UPDATE_FILTERS: sourceProducts non è array."); return; }
        const brands = [...new Set(sourceProducts.map(p => p.marca ? p.marca.toUpperCase() : null).filter(Boolean))].sort();
        console.log("UPDATE_FILTERS: Marche da mostrare:", brands);
        filterButtons.forEach(b => {
            const btnBrand = b.dataset.brand;
            if (btnBrand && btnBrand !== 'all') b.style.display = brands.includes(btnBrand.toUpperCase()) ? '' : 'none';
        });
    }

    function applyFiltersAndSort() {
        let source = allProductsFromFirestore;
        if (!Array.isArray(source)) { if(monosplitGrid)monosplitGrid.innerHTML='<p class="no-results error-message">Dati non validi.</p>'; currentFilteredProducts=[];displayProducts([]);return;}
        let filtered = source.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');
        if (currentBrandFilter !== 'all') filtered = filtered.filter(p => p?.marca?.toUpperCase() === currentBrandFilter);
        if (showOnlyEconomic) filtered = filtered.filter(p => p?.modello && economicModels.includes(p.modello.toUpperCase()));
        filtered.sort((a,b) => (a?.prezzo ?? Infinity) - (b?.prezzo ?? Infinity));
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
        console.log("DISPLAY_PRODUCTS: Visualizzo", productsToDisplay?.length, "prodotti.");
        if (!monosplitGrid) { return; }
        if (!Array.isArray(productsToDisplay)) { monosplitGrid.innerHTML='<p>Errore.</p>'; return; }
        let html = '';
        if (productsToDisplay.length > 0) productsToDisplay.forEach(p => html += createProductCard(p));
        else html = '<p class="no-results">Nessun prodotto con i filtri attuali.</p>';
        monosplitGrid.innerHTML = html;
        if (monosplitSection) monosplitSection.style.display = 'block';
    }
    
    // Flusso di autenticazione e UI state
    function showLoginScreen() {
        console.log("UI_STATE: showLoginScreen");
        if (appStatusMessageElement) {appStatusMessageElement.textContent = "Accesso richiesto."; appStatusMessageElement.style.display = 'block';}
        if (mainPageContainer) mainPageContainer.classList.add('content-hidden');
        if (headerElement) headerElement.classList.add('content-hidden');
        if (loginPanel) loginPanel.classList.add('visible');
        if (exitAdminButton) exitAdminButton.style.display = 'none';
    }
    function hideLoginScreenAndShowApp() {
        console.log("UI_STATE: hideLoginScreenAndShowApp");
        if (loginPanel) loginPanel.classList.remove('visible');
        if (mainPageContainer) mainPageContainer.classList.remove('content-hidden');
        if (headerElement) headerElement.classList.remove('content-hidden');
        if (exitAdminButton) exitAdminButton.style.display = currentUser ? 'inline-flex' : 'none';
        if (appStatusMessageElement) appStatusMessageElement.style.display = 'none';
    }
    async function initializeAppForUser(user) {
        console.log("AUTH_FLOW: initializeAppForUser per", user.email);
        currentUser = user;
        if (db && user) {
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                currentUserRole = doc.exists ? (doc.data().role || 'user') : 'user';
                console.log("AUTH_FLOW: Ruolo:", currentUserRole);
            } catch (e) { currentUserRole = 'user'; console.error("AUTH_FLOW: Err ruolo Firestore:", e); }
        } else { currentUserRole = user ? 'user' : null; }
        document.body.classList.toggle('admin-mode', currentUserRole === 'admin');
        document.body.classList.toggle('operator-mode', currentUserRole !== 'admin');
        hideLoginScreenAndShowApp();
        await initializeAppMainLogic();
    }
    function performLogoutCleanup() {
        console.log("AUTH_FLOW: performLogoutCleanup");
        currentUser=null;currentUserRole=null;allProductsFromFirestore=[];currentFilteredProducts=[];
        if(monosplitGrid)monosplitGrid.innerHTML='';
        document.body.classList.remove('admin-mode');document.body.classList.add('operator-mode');
        showLoginScreen();
    }
    async function initializeAppMainLogic() {
        console.log("APP_LOGIC: Inizio caricamento dati.");
        allProductsFromFirestore = await loadProductsFromFirestore();
        if (Array.isArray(allProductsFromFirestore) && allProductsFromFirestore.length > 0) {
            updateAvailableBrandFilters(allProductsFromFirestore);
            applyFiltersAndSort();
        }
    }

    // --- DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM_LOADED: Eseguito.");
        mainPageContainer=document.querySelector('.container');
        headerElement=document.querySelector('.app-header');
        loginPanel=document.getElementById('password-panel');
        closeLoginPanelBtn=document.getElementById('close-panel-btn');
        loginEmailInput=document.getElementById('login-email-input-clima');
        loginPasswordInput=document.getElementById('admin-password');
        submitLoginBtn=document.getElementById('submit-password-btn');
        loginErrorMsg=document.getElementById('password-error');
        monosplitGrid=document.getElementById('monosplit-grid');
        filterButtons=document.querySelectorAll('.filters .filter-btn');
        sectionTabs=document.querySelectorAll('.section-tabs .tab-btn');
        monosplitSection=document.getElementById('monosplit-section');
        exitAdminButton=document.getElementById('exit-admin-button');
        printButton=document.getElementById('print-button');
        appStatusMessageElement=document.getElementById('app-status-message');
        
        // DOM REFERENCES PER IL MODAL
        detailsModalOverlay = document.getElementById('product-details-modal-overlay');
        modalProductLogo = document.getElementById('modal-product-logo');
        modalProductBrand = document.getElementById('modal-product-brand');
        modalProductModel = document.getElementById('modal-product-model');
        modalProductImage = document.getElementById('modal-product-image');
        modalMainDetailsList = document.getElementById('modal-main-details-list');
        modalExtraDetailsList = document.getElementById('modal-extra-details-list');
        modalProductPrice = document.getElementById('modal-product-price');
        closeModalBtn = document.getElementById('close-modal-btn');
        modalDatasheetLink = document.getElementById('modal-datasheet-link');

        console.log("DOM_LOADED: Elementi selezionati.");

        if (auth) {
            auth.onAuthStateChanged(user => {
                firebaseAuthInitialized = true; 
                console.log("AUTH_CALLBACK: onAuthStateChanged. User:", user ? user.email : "Nessuno.");
                if(user) initializeAppForUser(user); else performLogoutCleanup();
            });

            submitLoginBtn.addEventListener('click', () => {
                const e=loginEmailInput.value.trim(), p=loginPasswordInput.value;
                if(!e||!p) { loginErrorMsg.textContent='Email e Password sono obbligatori.'; return; }
                loginErrorMsg.textContent = '';
                auth.signInWithEmailAndPassword(e, p).catch(err => {
                    loginErrorMsg.textContent = mapFirebaseAuthError(err.code);
                });
            });
            loginEmailInput.addEventListener('input', () => { loginErrorMsg.textContent=''; });
            loginPasswordInput.addEventListener('input', () => { loginErrorMsg.textContent=''; });
            
            if(exitAdminButton) exitAdminButton.addEventListener('click', () => auth.signOut());
        }

        setTimeout(() => {
            if (!firebaseAuthInitialized && auth && !auth.currentUser) {
                performLogoutCleanup();
            }
        }, 3500); 

        // Listeners UI
        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    if (!currentUser) return;

                    const clickedButton = event.currentTarget;
                    const filterType = clickedButton.dataset.filterType;
                    const brandFilter = clickedButton.dataset.brand;

                    if (filterType === 'brand') {
                        filterButtons.forEach(btn => {
                            if (btn.dataset.filterType === 'brand') btn.classList.remove('active');
                        });
                        clickedButton.classList.add('active');
                        currentBrandFilter = brandFilter.toLowerCase() === 'all' ? 'all' : brandFilter.toUpperCase();
                    }
                    if (filterType === 'economic') {
                        showOnlyEconomic = !showOnlyEconomic;
                        clickedButton.classList.toggle('active', showOnlyEconomic);
                    }
                    applyFiltersAndSort();
                });
            });
        }

        if(sectionTabs.length > 0) sectionTabs.forEach(t => t.addEventListener('click', e => {
            if(t.dataset.section === 'multisplit') window.location.href = '../multisplit/index.html';
        }));

        if(printButton)printButton.addEventListener('click',()=>{
            if(!currentUser){alert("Devi effettuare il login per stampare il listino.");return;}
            window.print();
        });

        // --- NUOVI LISTENER PER IL MODAL ---
        if (monosplitGrid) {
            monosplitGrid.addEventListener('click', (event) => {
                const toggleBtn = event.target.closest('.toggle-details-btn');
                if (!toggleBtn) return;
                
                event.preventDefault();
                const card = toggleBtn.closest('.product-card');
                if (!card) return;
                
                const productId = card.dataset.productId;
                if (!productId) return;
                
                const product = allProductsFromFirestore.find(p => p.id === productId);
                if (product) {
                    populateAndShowModal(product);
                } else {
                    console.error('Prodotto non trovato con ID:', productId);
                }
            });
        }
        
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        
        if (detailsModalOverlay) detailsModalOverlay.addEventListener('click', (event) => {
            if (event.target === detailsModalOverlay) closeModal();
        });
        
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && detailsModalOverlay && detailsModalOverlay.classList.contains('visible')) {
                closeModal();
            }
        });
        
        console.log("DOM_LOADED: Listeners UI agganciati.");
    }); // Fine DOMContentLoaded

})(); // Fine IIFE
console.log("SCRIPT: IIFE ESEGUITA.");
