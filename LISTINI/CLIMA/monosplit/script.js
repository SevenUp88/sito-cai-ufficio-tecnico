/* File: script.js (Listino Climatizzatori - Auth & Firestore Data - FINALE) */

(function() { // Inizio IIFE
    console.log("SCRIPT: IIFE Iniziata.");

    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
        authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
        projectId: "consorzio-artigiani-idraulici",
        storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
        messagingSenderId: "136848104008",
        appId: "1:136848104008:web:2724f60607dbe91d09d67d",
        measurementId: "G-NNPV2607G7"
    };

    let app;
    let auth;
    let db;

    try {
        console.log("SCRIPT: Tentativo init Firebase...");
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore(); // Assicurati sia inizializzato
            console.log("SCRIPT: Firebase App, Auth, Firestore inizializzati (SDK v8).");
            if (typeof firebase.analytics === 'function') firebase.analytics();
        } else { throw new Error("SDK Firebase (v8) non trovato."); }
    } catch (error) {
        console.error("SCRIPT: ERRORE FATALE init Firebase:", error);
        // ... (gestione errore fatale UI come prima) ...
        return;
    }

    let currentUser = null;
    let currentUserRole = null;
    let firebaseAuthInitialized = false;
    let allProductsFromFirestore = []; // <<<< QUI ANDRANNO I PRODOTTI DA FIRESTORE
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;

    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, filterButtons,
        sectionTabs, monosplitSection, exitAdminButton, printButton, tooltipElement, appStatusMessageElement;

    // --- FUNZIONI UTILITY, CARD, ETC. (ASSUMI SIANO LE TUE IMPLEMENTAZIONI COMPLETE QUI) ---
    function formatPrice(price) { /* ... tua implementazione ... */ return String(price || 'N/D'); }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];
    function createProductCard(product) { /* ... tua implementazione (SENZA bottoni edit)... */ 
        if (!product) return '';
        return `<div class="product-card" data-brand="${product.marca?.toUpperCase()}"><h4>${product.marca} - ${product.modello}</h4><p>${formatPrice(product.prezzo)}</p></div>`; // Esempio MOLTO basilare
    }
    // Incolla qui la TUA funzione createProductCard completa che avevi in script (12).js (ma senza i bottoni edit/save/cancel)

    async function loadProductsFromFirestore() {
        if (!db) {
            console.error("LPPFS: Firestore (db) non inizializzato.");
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore DB.</p>';
            return [];
        }
        const collectionName = "prodottiClimaMonosplit";
        const productsRef = db.collection(collectionName);
        let loaded = [];
        console.log("LPPFS: Inizio caricamento da:", collectionName);
        if (monosplitGrid) monosplitGrid.innerHTML = '<div class="loading-placeholder">Caricamento prodotti...</div>';
        try {
            const snapshot = await productsRef.get();
            console.log("LPPFS: Snapshot ricevuto. Empty:", snapshot.empty);
            if (snapshot.empty) {
                if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto monosplit trovato.</p>';
                return [];
            }
            snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() }));
            console.log(`LPPFS: Caricati ${loaded.length} prodotti.`);
            return loaded;
        } catch (error) {
            console.error("LPPFS: Errore caricamento:", error);
            if (monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore caricamento dati.</p>';
            return [];
        } finally { console.log("LPPFS: Fine."); }
    }

    function updateAvailableBrandFilters(sourceProducts) {
        if (!filterButtons || filterButtons.length === 0) { console.warn("UPDATE_FILTERS: Bottoni filtro non pronti."); return; }
        if (!Array.isArray(sourceProducts)) { filterButtons.forEach(b=>{if(b.dataset.brand && b.dataset.brand!=='all')b.style.display='none';}); return; }
        const brands = [...new Set(sourceProducts.map(p => p.marca ? p.marca.toUpperCase() : null).filter(Boolean))].sort();
        console.log("UPDATE_FILTERS: Marche disponibili:", brands);
        filterButtons.forEach(b => {
            const btnBrand = b.dataset.brand;
            if (btnBrand && btnBrand !== 'all') b.style.display = brands.includes(btnBrand.toUpperCase()) ? '' : 'none';
        });
    }

    function applyFiltersAndSort() {
        console.log("APPLY_FILTERS: Uso 'allProductsFromFirestore'. Filtro marca:", currentBrandFilter, "Economici:", showOnlyEconomic);
        let source = allProductsFromFirestore; // <<<< MODIFICA CHIAVE: USA SEMPRE I DATI DA FIRESTORE
        if (!Array.isArray(source)) { if(monosplitGrid)monosplitGrid.innerHTML='<p>Err dati.</p>'; currentFilteredProducts=[];displayProducts([]);return;}
        let filtered = [];
        try {
            filtered = source.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');
            if (currentBrandFilter !== 'all') filtered = filtered.filter(p => p?.marca?.toUpperCase() === currentBrandFilter);
            if (showOnlyEconomic) filtered = filtered.filter(p => p?.modello && economicModels.includes(p.modello.toUpperCase()));
            filtered.sort((a,b) => (a?.prezzo ?? Infinity) - (b?.prezzo ?? Infinity));
        } catch (e) { console.error("Err filtri:", e); filtered=[]; if(mainPageContainer)mainPageContainer.innerHTML='<p>Errore filtri.</p>';}
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
        console.log("DISPLAY_PRODUCTS: Visualizzo", productsToDisplay?.length, "prodotti.");
        // ... (Il resto della tua funzione displayProducts che chiama createProductCard)
        // Assicurati che monosplitGrid sia definito (lo è da DOMContentLoaded)
        if (!monosplitGrid) return; 
        let html = '';
        if (productsToDisplay && productsToDisplay.length > 0) {
            productsToDisplay.forEach(p => html += createProductCard(p));
        } else {
            html = '<p class="no-results">Nessun prodotto da visualizzare con i filtri correnti.</p>';
        }
        monosplitGrid.innerHTML = html;
        if (monosplitSection) monosplitSection.style.display = 'block';
        // Rimosso addEditListeners
        // if (typeof addTooltipListeners === 'function' && tooltipElement) addTooltipListeners(); // Mantieni se i tooltip sono usati
    }
    
    // --- FUNZIONI UI e AUTH ---
    function showLoginScreen() { /* ...tua implementazione che mostra loginPanel e nasconde il resto... */ console.log("UI_STATE: Mostro Login Screen."); if(appStatusMessageElement) appStatusMessageElement.style.display = 'none'; /* Altri elementi UI */ }
    function hideLoginScreenAndShowApp() { /* ...tua implementazione che nasconde loginPanel e mostra app... */ console.log("UI_STATE: Nascondo Login, Mostro App."); if(appStatusMessageElement) appStatusMessageElement.style.display = 'none'; /* Altri elementi UI */ }
    
    async function initializeAppForUser(user) { // `async` per await del ruolo
        console.log("AUTH_FLOW: initializeAppForUser per", user.email);
        currentUser = user;
        if (db && user) {
            const userDocRef = db.collection('users').doc(user.uid);
            try {
                console.log("AUTH_FLOW: Tento recupero ruolo da Firestore per UID:", user.uid);
                const doc = await userDocRef.get();
                currentUserRole = doc.exists ? (doc.data().role || 'user') : 'user';
                console.log("AUTH_FLOW: Ruolo utente:", currentUserRole);
            } catch (e) { currentUserRole = 'user'; console.error("AUTH_FLOW: Errore recupero ruolo:", e); }
        } else { currentUserRole = user ? 'user' : null; console.warn("AUTH_FLOW: DB o user non disp per ruolo."); }
        
        document.body.classList.toggle('admin-mode',currentUserRole === 'admin');
        document.body.classList.toggle('operator-mode',currentUserRole !== 'admin' || !currentUserRole);
        console.log("AUTH_FLOW: Classi body. Admin:", document.body.classList.contains('admin-mode'));
        
        hideLoginScreenAndShowApp();
        console.log("AUTH_FLOW: Chiamo initializeAppMainLogic...");
        await initializeAppMainLogic(); // Attendere che i prodotti siano caricati
        console.log("AUTH_FLOW: initializeAppMainLogic completata.");
    }

    function performLogoutCleanup() { /* ...tua implementazione per pulire UI e variabili dopo logout... */ console.log("AUTH_FLOW: performLogoutCleanup"); showLoginScreen(); }
    
    async function initializeAppMainLogic() { // `async` per await del caricamento prodotti
        console.log("APP_LOGIC: Inizio initializeAppMainLogic (caricamento da Firestore).");
        if(appStatusMessageElement) appStatusMessageElement.style.display = 'none'; // Nascondi "Inizializzazione..."

        allProductsFromFirestore = await loadProductsFromFirestore(); // <<<< CARICA DA FIRESTORE

        console.log("APP_LOGIC: Prodotti da Firestore caricati:", allProductsFromFirestore?.length);

        if (!Array.isArray(allProductsFromFirestore) || allProductsFromFirestore.length === 0) {
            console.warn("APP_LOGIC: Nessun prodotto da Firestore o errore caricamento.");
            // Il messaggio di errore/vuoto è già gestito da loadProductsFromFirestore in monosplitGrid
        }
        
        currentBrandFilter = 'all'; showOnlyEconomic = false;
        document.querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'));
        document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
        
        updateAvailableBrandFilters(allProductsFromFirestore); // <<<< USA DATI DA FIRESTORE
        
        filterButtons.forEach(btn=>btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
        const economicBtn = document.querySelector('.filter-btn[data-filter-type="economic"]');
        if(economicBtn) economicBtn.classList.remove('active');
        
        applyFiltersAndSort(); // Ora userà allProductsFromFirestore
        console.log("APP_LOGIC: Fine initializeAppMainLogic.");
    }
    
    function mapFirebaseAuthError(errorCode) { /* ...tua implementazione... */ return `Errore Auth: ${errorCode}`; }

    // --- DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM_LOADED: Eseguito.");
        // Seleziona tutti gli elementi DOM qui
        mainPageContainer=document.querySelector('.container'); headerElement=document.querySelector('.app-header'); loginPanel=document.getElementById('password-panel'); closeLoginPanelBtn=document.getElementById('close-panel-btn'); loginEmailInput=document.getElementById('login-email-input-clima'); loginPasswordInput=document.getElementById('admin-password'); submitLoginBtn=document.getElementById('submit-password-btn'); loginErrorMsg=document.getElementById('password-error'); monosplitGrid=document.getElementById('monosplit-grid'); filterButtons=document.querySelectorAll('.filters .filter-btn'); sectionTabs=document.querySelectorAll('.section-tabs .tab-btn'); monosplitSection=document.getElementById('monosplit-section'); exitAdminButton=document.getElementById('exit-admin-button'); printButton=document.getElementById('print-button'); tooltipElement=document.getElementById('dimension-tooltip'); appStatusMessageElement=document.getElementById('app-status-message');
        console.log("DOM_LOADED: Elementi selezionati. loginEmailInput:", !!loginEmailInput);

        if (appStatusMessageElement) appStatusMessageElement.textContent = "Inizializzazione (DOM OK)...";
        
        if (!loginPanel || !loginEmailInput || !loginPasswordInput || !submitLoginBtn || !loginErrorMsg) {
            console.error("DOM_LOADED: Errore critico elementi login mancanti.");
            if(appStatusMessageElement) appStatusMessageElement.innerHTML='<p style="color:red;">Err interfaccia login.</p>';
            return; 
        }
        if (loginPanel) { /* Modifica testi pannello login ... */ }
        console.log("DOM_LOADED: Pannello login OK.");

        if (auth) {
            console.log("DOM_LOADED: 'auth' definito. Aggancio onAuthStateChanged.");
            auth.onAuthStateChanged(user => {
                console.log("AUTH_CALLBACK: onAuthStateChanged. User:", user ? user.email : "Nessuno.");
                firebaseAuthInitialized = true; 
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Verifica autenticazione...";
                if (user) initializeAppForUser(user); else performLogoutCleanup();
            });
            submitLoginBtn.addEventListener('click',()=>{ /* ... logica login con auth.signInWithEmailAndPassword ... */});
            loginEmailInput.addEventListener('keypress', e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            loginPasswordInput.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            if(exitAdminButton) exitAdminButton.addEventListener('click', ()=>auth.signOut().catch(e=>console.error('Logout err:',e)));
            // ... altri listener ...
            console.log("DOM_LOADED: Listeners Auth agganciati.");
        } else {
            console.error("DOM_LOADED: FATAL - 'auth' NON definito!");
            if(appStatusMessageElement) appStatusMessageElement.innerHTML='<p style="color:red;">Servizio Auth NON DISP.</p>';
        }

        setTimeout(() => {
            console.log("TIMEOUT: Eseguito. firebaseAuthInitialized:", firebaseAuthInitialized, "auth.currentUser:", auth?.currentUser?.email);
            if (!firebaseAuthInitialized && auth) {
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Timeout autenticazione, verifica...";
                if(!auth.currentUser) performLogoutCleanup(); else initializeAppForUser(auth.currentUser);
            } else if (!firebaseAuthInitialized && !auth) { /* ... */ }
            // ...
        }, 3500);
        console.log("DOM_LOADED: Timeout fallback impostato.");
        
        // Aggancia altri listeners UI (filtri, tabs, print)
        if(filterButtons.length>0) filterButtons.forEach(b => b.addEventListener('click', e => { if(!currentUser)return; /* ...logica filtro... */ applyFiltersAndSort();}));
        if(sectionTabs.length>0) sectionTabs.forEach(t => t.addEventListener('click', e => { if(!currentUser)return; /* ...logica tab... */}));
        if(printButton)printButton.addEventListener('click',()=>{if(!currentUser){alert("Login per stampare.");return;}window.print();});
        console.log("DOM_LOADED: Listeners UI agganciati.");
    });
    console.log("SCRIPT: Fine definizione DOMContentLoaded.");

})(); // Fine IIFE
console.log("SCRIPT: IIFE ESEGUITA.");
