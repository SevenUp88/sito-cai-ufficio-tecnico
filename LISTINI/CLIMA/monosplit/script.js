/* File: script.js (Listino Climatizzatori - Auth & Firestore Data - MODIFICATO) */

(function() { // Inizio IIFE
    console.log("SCRIPT: IIFE Iniziata.");

    // --- CONFIGURAZIONE FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", // MASCHERA SE CONDIVIDI PUBBLICAMENTE
        authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
        projectId: "consorzio-artigiani-idraulici",
        storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
        messagingSenderId: "136848104008",
        appId: "1:136848104008:web:2724f60607dbe91d09d67d",
        measurementId: "G-NNPV2607G7"
    };
    console.log("SCRIPT: firebaseConfig definita.");

    let app;
    let auth;
    let db; // Istanza Firestore

    try {
        console.log("SCRIPT: Tentativo init Firebase...");
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore(); 
            console.log("SCRIPT: Firebase App, Auth e Firestore inizializzati (SDK v8).");
            if (typeof firebase.analytics === 'function') firebase.analytics();
        } else { 
            console.error("SCRIPT: Oggetto 'firebase' o 'firebase.initializeApp' NON TROVATI.");
            throw new Error("SDK Firebase (v8) non trovato o non caricato correttamente."); 
        }
    } catch (error) {
        console.error("SCRIPT: ERRORE FATALE init Firebase:", error);
        const statusMsgInitErr = document.getElementById('app-status-message');
        if (statusMsgInitErr) statusMsgInitErr.innerHTML = '<p style="color:red;font-weight:bold;">Errore critico inizializzazione. Controlla console.</p>';
        else { document.addEventListener('DOMContentLoaded', () => { document.body.innerHTML = '<p style="color:red;font-weight:bold;text-align:center;padding:20px;">Errore critico.</p>'; });}
        return; // Esce dall'IIFE
    }
    console.log("SCRIPT: Inizializzazione Firebase OK. 'auth' e 'db' dovrebbero essere definiti.");


    // --- STATO GLOBALE SCRIPT ---
    let currentUser = null;
    let currentUserRole = null;
    let firebaseAuthInitialized = false;
    let allProductsFromFirestore = []; 
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;

    // --- RIFERIMENTI DOM ---
    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, filterButtons,
        sectionTabs, monosplitSection, exitAdminButton, printButton, tooltipElement, appStatusMessageElement;

    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) {
        console.error("FATAL_ERROR_FUNCTION_CALLED:", message);
        if(appStatusMessageElement) { appStatusMessageElement.innerHTML = `<p style="color:red;">${message}</p>`; appStatusMessageElement.style.display = 'block'; }
        if(mainPageContainer) mainPageContainer.classList.add('content-hidden');
        if(headerElement) headerElement.classList.add('content-hidden');
        if(loginPanel) loginPanel.classList.remove('visible');
    }

    function formatPrice(price) {
        if (price === null || price === undefined || price === '') return 'N/D';
        let numPrice = NaN;
        if (typeof price === 'number') numPrice = price;
        else if (typeof price === 'string') {
            try { numPrice = parseFloat(price.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')); } catch (e) {}
        }
        return !isNaN(numPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numPrice) : 'N/D';
    }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];

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
            const productCode = product.codice_prodotto || 'N/D'; // Usato sotto
            const uiDimensions = product.dimensioni_ui || "N/D";
            const ueDimensions = product.dimensioni_ue || "N/D";
            const isMonobloc = brand.toUpperCase() === 'INNOVA';
            const modelDataAttribute = (model || 'nd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const safeBrandName = brand.toLowerCase().replace(/\s+/g, '');
            const logoPath = `../images/logos/${safeBrandName}.png`;
            const placeholderLogoPath = '../images/logos/placeholder_logo.png';

            // 1. BADGE ECONOMICO (da inserire nel footer)
            let economicBadgeHTML_footer = ''; 
            if (economicModels.includes(model.toUpperCase())) {
                economicBadgeHTML_footer = `<span class="economic-badge economic-badge-footer" title="Prodotto linea economica">Economico</span>`;
            }

            // 2. ICONA WIFI (rimane nel top-right, se il badge economico è stato rimosso da lì)
            let wifiIconHTML = ''; 
            const wifiString = String(wifi).toLowerCase().trim(); 
            if (wifiString === 'sì' || wifiString === 'si' || wifiString === 'true') {
                wifiIconHTML = `<i class="fas fa-wifi wifi-icon" title="Wi-Fi Integrato"></i>`;
            }
            // Se `economicBadgeHTML` era nel top-right e lo rimuovi da qui, non serve più la sua variabile qui.
            // `cardTopRightElementsHTML` ora conterrà solo wifi (o sarà vuoto).
            const cardTopRightElementsHTML = `${wifiIconHTML}`; 


            let datasheetLink = ''; 
            if (datasheetUrl && String(datasheetUrl).trim() !== '') {
                datasheetLink = `<p class="product-datasheet"><a href="${datasheetUrl}" target="_blank" rel="noopener noreferrer" title="Apri scheda tecnica PDF per ${model}"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;
            }
            
            // 3. GESTIONE CODICI ARTICOLO (ripristinata la rimozione del <br> dopo <strong> se necessario)
            let productCodeHTML = ''; 
            if (productCode && productCode !== 'N/D') { 
                let codeContent = ''; 
                const hasComponentPrices = typeof product.prezzo_ui === 'number' && typeof product.prezzo_ue === 'number'; 
                if (typeof productCode === 'string' && productCode.includes('UI:') && productCode.includes('UE:')) { 
                    const uiMatch = productCode.match(/UI:\s*([^/]+)/); 
                    const ueMatch = productCode.match(/UE:\s*([^/]+)/); 
                    const uiCode = uiMatch ? uiMatch[1].trim() : 'N/D'; 
                    const ueCode = ueMatch ? ueMatch[1].trim() : 'N/D'; 
                    codeContent = `UI: ${uiCode}`; 
                    if (hasComponentPrices) codeContent += ` <span>(${formatPrice(product.prezzo_ui)})</span>`; // nbsp per spazio non collassabile
                    codeContent += `<br>UE: ${ueCode}`; 
                    if (hasComponentPrices) codeContent += ` <span>(${formatPrice(product.prezzo_ue)})</span>`; 
                } else { 
                    codeContent = productCode; 
                } 
                // Se volevi "Articoli:" sulla sua riga e il codice sotto, CSS lo gestirà con "display: block" su strong
                // Se il <br> era nel codice originale `script (6).js` *dopo* Articoli:, lo si rimuove
                productCodeHTML = `<p class="product-info-text product-codes"><strong>Articoli:</strong><span class="code-value">${codeContent}</span></p>`;
            }
            
            // 4. GESTIONE DIMENSIONI (con etichette e ordine corretto)
            let dimensionsDetailsStrings = [];
            // Ordine come da tua immagine: Esterna prima, poi Interna
            if (!isMonobloc && ueDimensions !== "N/D") {
                dimensionsDetailsStrings.push(`<span class="dimension-item">Unità esterna: ${ueDimensions}</span>`);
            }
            if (uiDimensions !== "N/D") {
                dimensionsDetailsStrings.push(`<span class="dimension-item">Unità interna: ${uiDimensions}</span>`);
            }

            let dimensionsHTML = '';
            if (dimensionsDetailsStrings.length > 0) {
                const joinedDetails = dimensionsDetailsStrings.join(''); // Ogni .dimension-item andrà a capo via CSS
                dimensionsHTML = `<p class="product-info-text product-dimensions">
                                    <strong>Dimensioni AxLxP (mm):</strong>
                                    <span class="dimensions-values-wrapper">${joinedDetails}</span>
                                  </p>`;
            }

            // 5. CLASSE ENERGETICA (slash rimosso, spazio inserito)
            // Rispetto a `script (6).js` originale, qui non c'è più lo '/' tra i due span.
            const energyClassHTML = `<p class="energy-class product-info-text"><strong>Classe En.:</strong><span class="cooling product-energy-cooling" title="Raffrescamento">${energyCooling}</span> <span class="heating product-energy-heating" title="Riscaldamento">${energyHeating}</span></p>`;
            
            const actionButtonsContainerContent = ''; // Nessun bottone di modifica nella vista normale
            
            return `<div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}">
                        <div class="card-top-right-elements">${cardTopRightElementsHTML}</div>
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
                                ${productCodeHTML} 
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
        } catch(e){console.error(`Err card ID ${product?.id}`,e);return `<div class="product-card error-card">Errore creazione card ${product?.id}</div>`;}
    }

    async function loadProductsFromFirestore() {
        if (!db) { console.error("LPPFS: Firestore (db) non inizializzato."); if(monosplitGrid) monosplitGrid.innerHTML='<p class="no-results error-message">DB non disp.</p>'; return []; }
        const collectionName = "prodottiClimaMonosplit";
        const productsRef = db.collection(collectionName);
        let loaded = [];
        console.log("LPPFS: Inizio caricamento da:", collectionName);
        if (monosplitGrid) monosplitGrid.innerHTML = '<div class="loading-placeholder">Caricamento prodotti da Firestore...</div>';
        try {
            const snapshot = await productsRef.get();
            console.log("LPPFS: Snapshot Firestore. Vuoto:", snapshot.empty);
            if (snapshot.empty) { if(monosplitGrid) monosplitGrid.innerHTML='<p class="no-results">Nessun prodotto in DB.</p>'; return []; }
            snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() }));
            console.log(`LPPFS: Caricati ${loaded.length} prodotti.`);
            return loaded;
        } catch (error) { console.error("LPPFS: Errore caricamento da Firestore:", error); if(monosplitGrid) monosplitGrid.innerHTML='<p class="no-results error-message">Errore caric. dati.</p>'; return [];}
        finally { console.log("LPPFS: Fine tentativo caricamento."); }
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
        console.log("APPLY_FILTERS: Inizio. Prodotti sorgente:", source?.length, "Filtro Marca:", currentBrandFilter, "Economici:", showOnlyEconomic);
        if (!Array.isArray(source)) { if(monosplitGrid)monosplitGrid.innerHTML='<p class="no-results error-message">Dati non validi per filtro.</p>'; currentFilteredProducts=[];displayProducts([]);return;}
        let filtered = [];
        try {
            filtered = source.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');
            if (currentBrandFilter !== 'all') filtered = filtered.filter(p => p?.marca?.toUpperCase() === currentBrandFilter);
            if (showOnlyEconomic) filtered = filtered.filter(p => p?.modello && economicModels.includes(p.modello.toUpperCase()));
            filtered.sort((a,b) => (a?.prezzo ?? Infinity) - (b?.prezzo ?? Infinity));
        } catch (e) { console.error("APPLY_FILTERS: Errore:", e); filtered=[]; if(mainPageContainer)mainPageContainer.innerHTML='<p class="no-results error-message">Errore filtro.</p>';}
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
        console.log("DISPLAY_PRODUCTS: Visualizzo", productsToDisplay?.length, "prodotti.");
        if (!monosplitGrid) { console.error("DISPLAY_PRODUCTS: Grid non trovato."); return; }
        if (!Array.isArray(productsToDisplay)) { monosplitGrid.innerHTML='<p>Errore visualizzazione.</p>'; return; }
        let html = '';
        if (productsToDisplay.length > 0) productsToDisplay.forEach(p => html += createProductCard(p));
        else html = '<p class="no-results">Nessun prodotto con i filtri attuali.</p>';
        monosplitGrid.innerHTML = html;
        if (monosplitSection) monosplitSection.style.display = 'block';
        // Non c'è addTooltipListeners se l'hai rimosso
    }
    
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
            const userDocRef = db.collection('users').doc(user.uid);
            try {
                console.log("AUTH_FLOW: Tento recupero ruolo Firestore:", user.uid);
                const doc = await userDocRef.get();
                currentUserRole = doc.exists ? (doc.data().role || 'user') : 'user';
                console.log("AUTH_FLOW: Ruolo:", currentUserRole);
            } catch (e) { currentUserRole = 'user'; console.error("AUTH_FLOW: Err ruolo Firestore:", e); }
        } else { currentUserRole = user ? 'user' : null; console.warn("AUTH_FLOW: DB o user non disp per ruolo."); }
        document.body.classList.toggle('admin-mode',currentUserRole==='admin'); document.body.classList.toggle('operator-mode',currentUserRole!=='admin'||!currentUserRole);
        console.log("AUTH_FLOW: Classi body. Admin:", document.body.classList.contains('admin-mode'));
        hideLoginScreenAndShowApp();
        console.log("AUTH_FLOW: Chiamo initializeAppMainLogic...");
        await initializeAppMainLogic();
        console.log("AUTH_FLOW: initializeAppMainLogic completata.");
    }
    function performLogoutCleanup() {
        console.log("AUTH_FLOW: performLogoutCleanup");
        currentUser=null;currentUserRole=null;allProductsFromFirestore=[];currentFilteredProducts=[];
        if(monosplitGrid)monosplitGrid.innerHTML='';
        document.body.classList.remove('admin-mode');document.body.classList.add('operator-mode');
        showLoginScreen();
    }
    async function initializeAppMainLogic() {
        console.log("APP_LOGIC: Inizio (dati da Firestore).");
        if(appStatusMessageElement) appStatusMessageElement.style.display = 'none';
        allProductsFromFirestore = await loadProductsFromFirestore();
        console.log("APP_LOGIC: Prodotti da Firestore:", allProductsFromFirestore?.length);
        if (!Array.isArray(allProductsFromFirestore) || allProductsFromFirestore.length === 0) {
             if(monosplitGrid && !monosplitGrid.querySelector('.error-message') && !monosplitGrid.querySelector('.no-results')) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto nel DB.</p>';
        }
        currentBrandFilter='all'; showOnlyEconomic=false;
        document.querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'));
        document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
        updateAvailableBrandFilters(allProductsFromFirestore);
        
        // Resetta i bottoni filtro marca
        filterButtons.forEach(btn=>{ if(btn.dataset.brand) btn.classList.remove('active'); });
        document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
        
        // Resetta il bottone filtro economici
        const ecBtn=document.querySelector('.filter-btn[data-filter-type="economic"]');if(ecBtn)ecBtn.classList.remove('active');
        
        applyFiltersAndSort();
        console.log("APP_LOGIC: Fine.");
    }
    function mapFirebaseAuthError(errCode){ 
        console.log("AUTH_ERR: map per", errCode); 
        switch(errCode){
            case"auth/invalid-email":case"auth/invalid-credential":return"Email o password errati.";
            case"auth/user-disabled":return"Account disabilitato.";
            case"auth/user-not-found":return"Utente non registrato.";
            case"auth/wrong-password":return"Password errata.";
            case"auth/too-many-requests":return"Troppi tentativi. Riprova più tardi."; // Modificato per più chiarezza
            default:return"Errore autenticazione: "+errCode;
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
        tooltipElement=document.getElementById('dimension-tooltip'); 
        appStatusMessageElement=document.getElementById('app-status-message');
        
        console.log("DOM_LOADED: Elementi selezionati. loginEmailInput:",!!loginEmailInput);

        if(appStatusMessageElement) appStatusMessageElement.textContent = "Inizializzazione (DOM OK)...";
        else { console.warn("DOM_LOADED: #app-status-message non trovato!");}

        if (!loginPanel || !loginEmailInput || !loginPasswordInput || !submitLoginBtn || !loginErrorMsg) {
            console.error("DOM_LOADED: Errore elementi login mancanti.");
            if(appStatusMessageElement){appStatusMessageElement.innerHTML='<p style="color:red;">Err interfaccia login.</p>';appStatusMessageElement.style.display='block';}
            if(mainPageContainer)mainPageContainer.classList.add('content-hidden');if(headerElement)headerElement.classList.add('content-hidden');
            return; 
        }
        if(loginPanel){
            const pT=loginPanel.querySelector('h3');if(pT)pT.textContent='Accesso Area Riservata';
            const pD=loginPanel.querySelector('p:not(.error-message)');if(pD)pD.textContent='Credenziali per continuare.';
            if(submitLoginBtn)submitLoginBtn.textContent="Accedi";
        }
        console.log("DOM_LOADED: Pannello login OK.");

        if (auth) {
            console.log("DOM_LOADED: 'auth' definito. Aggancio onAuthStateChanged.");
            auth.onAuthStateChanged(user => {
                console.log("AUTH_CALLBACK: onAuthStateChanged. User:", user?user.email:"Nessuno.");
                firebaseAuthInitialized = true; 
                if(appStatusMessageElement)appStatusMessageElement.textContent = "Verifica autenticazione...";
                if(user)initializeAppForUser(user);else performLogoutCleanup();
            });

            submitLoginBtn.addEventListener('click',()=>{
                console.log("LOGIN_BTN: Click.");
                const e=loginEmailInput.value.trim(),p=loginPasswordInput.value;
                loginErrorMsg.textContent=''; // Pulisci subito
                loginEmailInput.classList.remove('input-error'); 
                loginPasswordInput.classList.remove('input-error');

                if(!e||!p){loginErrorMsg.textContent='Email e Password sono obbligatori.';return;}
                console.log("LOGIN_ATTEMPT:", e);
                auth.signInWithEmailAndPassword(e,p).catch(err=>{
                    console.error("LOGIN_ERR:",err);
                    loginErrorMsg.textContent=mapFirebaseAuthError(err.code);
                    if(loginPasswordInput)loginPasswordInput.classList.add('input-error');
                    if(loginEmailInput)loginEmailInput.classList.add('input-error');
                });
            });
            // Pulisci errore on input
            loginEmailInput.addEventListener('input', () => { loginEmailInput.classList.remove('input-error'); loginErrorMsg.textContent=''; });
            loginPasswordInput.addEventListener('input', () => { loginPasswordInput.classList.remove('input-error'); loginErrorMsg.textContent=''; });

            loginEmailInput.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            loginPasswordInput.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            
            if(exitAdminButton)exitAdminButton.addEventListener('click',()=>{
                console.log("LOGOUT_BTN: Click.");auth.signOut().catch(e=>console.error('Logout err:',e));
            });
            
            if(closeLoginPanelBtn)closeLoginPanelBtn.addEventListener('click',()=>{
                if(loginPanel)loginPanel.classList.remove('visible');console.log("LOGIN_PANEL_CLOSED.");
            });
            console.log("DOM_LOADED: Listeners Auth OK.");
        } else {
            console.error("DOM_LOADED: FATAL - 'auth' NON definito!");
            if(appStatusMessageElement)appStatusMessageElement.innerHTML='<p style="color:red;">Servizio Auth non disp.</p>';
        }

        setTimeout(() => {
            console.log("TIMEOUT: Eseguito. firebaseAuthInitialized:", firebaseAuthInitialized, "auth.currentUser:", auth?.currentUser?.email);
            if (!firebaseAuthInitialized && auth) {
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Timeout autenticazione, verifico manualmente...";
                if(!auth.currentUser) {
                    console.log("TIMEOUT: Nessun utente, chiamo logout cleanup.");performLogoutCleanup();
                } else {
                    console.log("TIMEOUT: Utente trovato, chiamo init app.");initializeAppForUser(auth.currentUser);
                }
            } else if (!firebaseAuthInitialized && !auth) { 
                if(appStatusMessageElement)appStatusMessageElement.innerHTML="<p style='color:red;'>Timeout: Servizio autenticazione non inizializzato.</p>"; 
            }
            else if (firebaseAuthInitialized) { 
                console.log("TIMEOUT: Autenticazione già inizializzata. Nessuna azione."); 
            }
        }, 3500); 
        console.log("DOM_LOADED: Timeout fallback impostato.");
        
        if(filterButtons.length>0)filterButtons.forEach(b=>b.addEventListener('click',e=>{
            if(!currentUser)return;
            const cb=e.currentTarget,ft=cb.dataset.filterType,bf=cb.dataset.brand;
            console.log("FILTER_CLICK:",{type:ft,brand:bf});
            if(ft==='economic'){
                showOnlyEconomic=!showOnlyEconomic;
                cb.classList.toggle('active',showOnlyEconomic);
            }else if(bf){
                filterButtons.forEach(btn=>{if(btn.dataset.brand)btn.classList.remove('active');});
                cb.classList.add('active');
                currentBrandFilter=bf.toLowerCase()==='all'?'all':bf.toUpperCase();
            } 
            applyFiltersAndSort();
        }));
        
        // CODICE PROBLEMATICO - Verifichiamo questo listener
        if(sectionTabs.length>0) {
            sectionTabs.forEach(t => {
                t.addEventListener('click', e => {
                    if(!currentUser) return;
                    const ts = t.dataset.section;
                    console.log("TAB_CLICK:", ts);
                    e.preventDefault();
                    if(ts === 'multisplit') {
                        window.location.href='../multisplit/index.html';
                    } else if(ts === 'monosplit') {
                        sectionTabs.forEach(tb => tb.classList.remove('active'));
                        t.classList.add('active');
                        // Queste righe sono state oggetto di debug precedente, assicurati che il DOM sia corretto
                        // La logica di mostrare/nascondere sezioni qui non era nel tuo originale script (6).js,
                        // quindi l'ho rimossa per mantenere il più possibile il tuo originale.
                        // Se queste sezioni sono sempre sulla stessa pagina e devono essere mostrate/nascoste,
                        // aggiungi le righe di style.display qui.
                        // document.getElementById('monosplit-section')?.style.display = 'block';
                        // document.getElementById('multisplit-section')?.style.display = 'none'; 
                        // applyFiltersAndSort(); // Potrebbe essere necessario se il cambio tab ricarica dati
                    }
                    // NESSUN CODICE DOPO l'ultimo else if (ts === 'monosplit') {} qui dentro
                }); // Chiusura addEventListener
            }); // Chiusura sectionTabs.forEach
        } // Chiusura if (sectionTabs.length > 0)


        if(printButton)printButton.addEventListener('click',()=>{
            if(!currentUser){alert("Devi effettuare il login per stampare il listino.");return;}
            window.print();
        });
        console.log("DOM_LOADED: Listeners UI agganciati.");
    });
    console.log("SCRIPT: Fine definizione DOMContentLoaded.");

})(); // Fine IIFE
console.log("SCRIPT: IIFE ESEGUITA.");
