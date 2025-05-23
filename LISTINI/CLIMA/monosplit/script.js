/* File: script.js (DEBUG ESTESO - Listino Climatizzatori - Firebase Auth & Firestore Data) */

(function() { // Inizio IIFE
    console.log("SCRIPT: IIFE Iniziata.");

    // --- CONFIGURAZIONE FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
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
    let db;
    console.log("SCRIPT: Variabili app, auth, db dichiarate.");

    try {
        console.log("SCRIPT: Inizio blocco try inizializzazione Firebase.");
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            console.log("SCRIPT: Oggetto 'firebase' e 'firebase.initializeApp' trovati.");
            app = firebase.initializeApp(firebaseConfig);
            console.log("SCRIPT: firebase.initializeApp chiamato. Risultato 'app':", app);
            auth = firebase.auth();
            console.log("SCRIPT: firebase.auth chiamato. Risultato 'auth':", auth);
            db = firebase.firestore();
            console.log("SCRIPT: firebase.firestore chiamato. Risultato 'db':", db);
            console.log("SCRIPT: Firebase App, Auth e Firestore inizializzati (SDK v8).");
            if (typeof firebase.analytics === 'function') {
                firebase.analytics();
                console.log("SCRIPT: Firebase Analytics inizializzato (SDK v8).");
            }
        } else {
            console.error("SCRIPT: Oggetto 'firebase' o 'firebase.initializeApp' NON TROVATI.");
            throw new Error("SDK Firebase (v8) non trovato o non caricato correttamente.");
        }
    } catch (error) {
        console.error("SCRIPT: ERRORE FATALE inizializzazione Firebase:", error);
        // Tentativo di aggiornare UI per l'errore
        try {
            const statusMsgInitErr = document.getElementById('app-status-message');
            if (statusMsgInitErr) {
                statusMsgInitErr.innerHTML = '<p style="color:red;font-weight:bold;">Errore critico inizializzazione. Controlla console.</p>';
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    const bodyStatusMsg = document.getElementById('app-status-message');
                    if(bodyStatusMsg) bodyStatusMsg.innerHTML = '<p style="color:red;font-weight:bold;">Errore critico inizializzazione. Controlla console.</p>';
                    else document.body.innerHTML = '<p style="color:red;font-weight:bold;text-align:center;padding:20px;">Errore critico inizializzazione.</p>';
                });
            }
        } catch (uiError) { console.error("SCRIPT: Errore ulteriore durante tentativo di mostrare errore di init Firebase:", uiError); }
        return; // Esce dall'IIFE
    }
    console.log("SCRIPT: Inizializzazione Firebase completata (o fallita ed uscita).");


    // --- STATO GLOBALE SCRIPT ---
    let currentUser = null;
    let currentUserRole = null;
    let firebaseAuthInitialized = false;
    let allProductsFromFirestore = [];
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;
    console.log("SCRIPT: Variabili di stato globale inizializzate.");

    // --- RIFERIMENTI DOM ---
    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, filterButtons,
        sectionTabs, monosplitSection, exitAdminButton, printButton, tooltipElement, appStatusMessageElement;
    console.log("SCRIPT: Variabili riferimenti DOM dichiarate (saranno popolate in DOMContentLoaded).");

    // --- FUNZIONI UTILITY, CREAZIONE CARD, FILTRI, STATO UI ---
    // (COPIA QUI LE TUE IMPLEMENTAZIONI COMPLETE E CORRETTE DELLE SEGUENTI FUNZIONI)
    function handleFatalError(message) { console.error("FATAL_ERROR_FUNCTION_CALLED:", message); /* ...tua implementazione... */ }
    function formatPrice(price) { /* ...tua implementazione... */ return String(price); }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];
    function createProductCard(product) { /* ...tua implementazione SENZA BOTTONI EDIT... */ return `<div>CARD PER ${product.marca} ${product.modello}</div>`; }
    async function loadProductsFromFirestore() { /* ...tua implementazione CON LOG AGGIUNTIVI come da risposta precedente... */ console.log("LOAD_PRODUCTS: Inizio."); const prodotti = []; try{ /* logica db.collection... */ } catch(e){console.error("LOAD_PRODUCTS_ERR:", e);} finally {console.log("LOAD_PRODUCTS: Fine.");} return prodotti; }
    function updateAvailableBrandFilters(source) { console.log("UPDATE_FILTERS: Chiamata con ", source?.length);/* ...tua implementazione... */ }
    function applyFiltersAndSort() { console.log("APPLY_FILTERS: Chiamata. Fonte:", allProductsFromFirestore?.length); /* ...tua implementazione usando allProductsFromFirestore... */ }
    function displayProducts(prodsToDisp) { console.log("DISPLAY_PRODUCTS: Chiamata con ", prodsToDisp?.length); if(monosplitGrid) monosplitGrid.innerHTML = prodsToDisp && prodsToDisp.length > 0 ? prodsToDisp.map(p => createProductCard(p)).join('') : "<p>Nessun prodotto da visualizzare.</p>"; /* ...tua implementazione... */ }
    function showLoginScreen() { console.log("UI_UPDATE: showLoginScreen"); /* ...tua implementazione... */ }
    function hideLoginScreenAndShowApp() { console.log("UI_UPDATE: hideLoginScreenAndShowApp"); /* ...tua implementazione... */ }
    async function initializeAppForUser(user) {
        console.log("AUTH_FLOW: initializeAppForUser per", user.email);
        currentUser = user;
        if (db && user) {
            const userDocRef = db.collection('users').doc(user.uid);
            try {
                console.log("AUTH_FLOW: Tento recupero ruolo da Firestore per UID:", user.uid);
                const doc = await userDocRef.get();
                if (doc.exists) {
                    currentUserRole = doc.data().role || 'user'; // Default a 'user' se role è undefined
                    console.log("AUTH_FLOW: Ruolo utente recuperato da Firestore:", currentUserRole);
                } else {
                    currentUserRole = 'user';
                    console.warn(`AUTH_FLOW: Doc utente non trovato per ${user.uid}, ruolo default 'user'.`);
                }
            } catch (e) { currentUserRole = 'user'; console.error("AUTH_FLOW: Errore recupero ruolo Firestore:", e); }
        } else { currentUserRole = user ? 'user' : null; console.warn("AUTH_FLOW: DB o user non disp per ruolo."); }
        document.body.classList.toggle('admin-mode',currentUserRole==='admin'); document.body.classList.toggle('operator-mode',currentUserRole!=='admin');
        console.log("AUTH_FLOW: Classi body aggiornate. admin-mode:", document.body.classList.contains('admin-mode'));
        hideLoginScreenAndShowApp();
        console.log("AUTH_FLOW: Chiamata a initializeAppMainLogic...");
        await initializeAppMainLogic();
        console.log("AUTH_FLOW: initializeAppMainLogic completata.");
    }
    function performLogoutCleanup() { console.log("AUTH_FLOW: performLogoutCleanup"); /* ...tua implementazione... */ showLoginScreen();}
    async function initializeAppMainLogic() {
        console.log("APP_LOGIC: Inizio initializeAppMainLogic.");
        if(appStatusMessageElement) appStatusMessageElement.style.display = 'none';
        console.log("APP_LOGIC: Chiamata a loadProductsFromFirestore...");
        allProductsFromFirestore = await loadProductsFromFirestore();
        console.log("APP_LOGIC: loadProductsFromFirestore ha restituito", allProductsFromFirestore?.length, "prodotti.");
        // ... (resto della tua initializeAppMainLogic, chiamando updateAvailableBrandFilters e applyFiltersAndSort) ...
        console.log("APP_LOGIC: Fine initializeAppMainLogic.");
    }
    function mapFirebaseAuthError(errCode) { console.log("AUTH_ERR_MAP: mapFirebaseAuthError per ", errCode); /* ...tua implementazione... */ return "Errore sconosciuto." }

    console.log("SCRIPT: Funzioni definite.");

    // --- DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM_CONTENT_LOADED: Evento scattato.");
        mainPageContainer=document.querySelector('.container'); headerElement=document.querySelector('.app-header'); loginPanel=document.getElementById('password-panel'); closeLoginPanelBtn=document.getElementById('close-panel-btn'); loginEmailInput=document.getElementById('login-email-input-clima'); loginPasswordInput=document.getElementById('admin-password'); submitLoginBtn=document.getElementById('submit-password-btn'); loginErrorMsg=document.getElementById('password-error'); monosplitGrid=document.getElementById('monosplit-grid'); filterButtons=document.querySelectorAll('.filters .filter-btn'); sectionTabs=document.querySelectorAll('.section-tabs .tab-btn'); monosplitSection=document.getElementById('monosplit-section'); exitAdminButton=document.getElementById('exit-admin-button'); printButton=document.getElementById('print-button'); tooltipElement=document.getElementById('dimension-tooltip'); appStatusMessageElement=document.getElementById('app-status-message');
        console.log("DOM_CONTENT_LOADED: Elementi DOM selezionati. loginEmailInput trovato:", !!loginEmailInput);

        if (appStatusMessageElement) appStatusMessageElement.textContent = "Inizializzazione applicazione (DOM Pronto)...";
        else { console.warn("DOM_CONTENT_LOADED: #app-status-message non trovato dopo che il DOM è caricato!");}

        if (!loginPanel || !loginEmailInput || !loginPasswordInput || !submitLoginBtn || !loginErrorMsg) {
            console.error("DOM_CONTENT_LOADED: Elementi critici del pannello di login MANCANTI.");
            if (appStatusMessageElement) {appStatusMessageElement.innerHTML='<p style="color:red;">Errore grave: Interfaccia login non completa.</p>'; appStatusMessageElement.style.display='block';}
            if(mainPageContainer)mainPageContainer.classList.add('content-hidden'); if(headerElement)headerElement.classList.add('content-hidden');
            return; 
        }
        console.log("DOM_CONTENT_LOADED: Elementi login panel verificati.");

        if (loginPanel) { const pT=loginPanel.querySelector('h3'); if(pT)pT.textContent='Accesso Area Riservata'; const pD=loginPanel.querySelector('p:not(.error-message)'); if(pD)pD.textContent='Credenziali per continuare.'; if(submitLoginBtn)submitLoginBtn.textContent="Accedi";}
        console.log("DOM_CONTENT_LOADED: Testi pannello login aggiornati.");

        if (auth) {
            console.log("DOM_CONTENT_LOADED: Oggetto 'auth' valido. Aggancio onAuthStateChanged...");
            auth.onAuthStateChanged(user => {
                console.log("AUTH_CALLBACK: onAuthStateChanged eseguita. Utente:", user ? user.email : "Nessun utente.");
                firebaseAuthInitialized = true; 
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Stato autenticazione cambiato. Processo...";
                if (user) initializeAppForUser(user); else performLogoutCleanup();
            });
            console.log("DOM_CONTENT_LOADED: Listener onAuthStateChanged agganciato.");

            submitLoginBtn.addEventListener('click',()=>{console.log("LOGIN_BTN_CLICK"); const e=loginEmailInput.value.trim(),p=loginPasswordInput.value;loginErrorMsg.textContent='';if(!e||!p){loginErrorMsg.textContent='Email/Pass obbligatori.';return;}console.log("LOGIN_ATTEMPT: Provo login per", e);auth.signInWithEmailAndPassword(e,p).catch(err=>{console.error("LOGIN_ERR:",err); loginErrorMsg.textContent=mapFirebaseAuthError(err.code);if(loginPasswordInput)loginPasswordInput.classList.add('input-error');if(loginEmailInput)loginEmailInput.classList.add('input-error');});});
            loginEmailInput.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            loginPasswordInput.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            if(exitAdminButton) exitAdminButton.addEventListener('click',()=> { console.log("LOGOUT_BTN_CLICK"); auth.signOut().catch(e=>console.error('Logout err:',e)); });
            if(closeLoginPanelBtn) closeLoginPanelBtn.addEventListener('click',()=>{if(loginPanel)loginPanel.classList.remove('visible'); console.log("LOGIN_PANEL_CLOSED_BY_BTN");});
            console.log("DOM_CONTENT_LOADED: Listeners per login/logout agganciati.");

        } else {
            console.error("DOM_CONTENT_LOADED: FATAL - Oggetto 'auth' NON definito in DOMContentLoaded.");
            if(appStatusMessageElement){appStatusMessageElement.innerHTML='<p style="color:red;">Servizio Auth non disponibile.</p>';}
        }

        setTimeout(() => {
            console.log("TIMEOUT_FALLBACK: Eseguito. firebaseAuthInitialized:", firebaseAuthInitialized, "auth.currentUser:", auth ? auth.currentUser : "N/A");
            if (!firebaseAuthInitialized && auth) { 
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Timeout autenticazione, verifico utente...";
                if(!auth.currentUser) { console.log("TIMEOUT_FALLBACK: Nessun utente, chiamo logout cleanup."); performLogoutCleanup(); }
                else { console.log("TIMEOUT_FALLBACK: Utente trovato, chiamo init app."); initializeAppForUser(auth.currentUser); }
            } else if (!firebaseAuthInitialized && !auth) {
                console.error("TIMEOUT_FALLBACK: Auth non inizializzato.");
                if(appStatusMessageElement) appStatusMessageElement.innerHTML = "<p style='color:red;'>Timeout: Servizio auth non inizializzato.</p>";
            } else if (firebaseAuthInitialized) {
                console.log("TIMEOUT_FALLBACK: Auth già inizializzato, nessuna azione.");
            }
        }, 3500);
        console.log("DOM_CONTENT_LOADED: Timeout fallback impostato.");

        // Listeners che dipendono da `currentUser` per funzionare, ma possono essere agganciati
        if(filterButtons.length>0) filterButtons.forEach(b=>b.addEventListener('click',e=>{console.log("FILTER_CLICK:", e.currentTarget.dataset); if(!currentUser){console.log("FILTER_CLICK_IGNORED: No user"); return;}const cb=e.currentTarget,ft=cb.dataset.filterType,bf=cb.dataset.brand;if(ft==='economic'){showOnlyEconomic=!showOnlyEconomic;cb.classList.toggle('active',showOnlyEconomic);}else if(bf){filterButtons.forEach(btn=>{if(btn.dataset.brand)btn.classList.remove('active');});cb.classList.add('active');currentBrandFilter=bf.toLowerCase()==='all'?'all':bf.toUpperCase();} applyFiltersAndSort();}));
        if(sectionTabs.length>0) sectionTabs.forEach(t=>t.addEventListener('click',e=>{console.log("TAB_CLICK:", e.currentTarget.dataset.section); if(!currentUser){console.log("TAB_CLICK_IGNORED: No user"); return;}const ts=t.dataset.section;e.preventDefault();if(ts==='multisplit')window.location.href='../multisplit/index.html';else if(ts==='monosplit'){sectionTabs.forEach(tb=>tb.classList.remove('active'));t.classList.add('active');}}));
        if(printButton)printButton.addEventListener('click',()=>{console.log("PRINT_BTN_CLICK"); if(!currentUser){alert("Login per stampare.");return;}window.print();});
        console.log("DOM_CONTENT_LOADED: Altri listeners UI agganciati.");

    }); // Fine DOMContentLoaded
    console.log("SCRIPT: Fine blocco DOMContentLoaded definito.");

})(); // Fine IIFE
console.log("SCRIPT: Esecuzione IIFE completata.");
