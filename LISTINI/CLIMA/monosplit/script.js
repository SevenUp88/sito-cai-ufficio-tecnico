/* File: script.js (per Listino Climatizzatori - Firebase Auth & DATI DA FIRESTORE) */

(function() { // Inizio IIFE

    // --- CONFIGURAZIONE FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", // Considera variabili d'ambiente per chiavi sensibili
        authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
        projectId: "consorzio-artigiani-idraulici",
        storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
        messagingSenderId: "136848104008",
        appId: "1:136848104008:web:2724f60607dbe91d09d67d",
        measurementId: "G-NNPV2607G7"
    };

    let app;
    let auth;
    let db; // Istanza Firestore

    try {
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore(); // Inizializza Firestore
            console.log("Firebase App, Auth e Firestore inizializzati (SDK v8).");
            if (typeof firebase.analytics === 'function') firebase.analytics();
        } else {
            throw new Error("SDK Firebase (v8) non trovato. Controlla inclusione HTML.");
        }
    } catch (error) {
        console.error("ERRORE FATALE inizializzazione Firebase:", error);
        const statusMsg = document.getElementById('app-status-message');
        if (statusMsg) statusMsg.innerHTML = '<p style="color:red;font-weight:bold;">Errore Firebase. Impossibile caricare.</p>';
        else { document.addEventListener('DOMContentLoaded', () => { document.body.innerHTML = '<p style="color:red;font-weight:bold;text-align:center;padding:20px;">Errore Firebase.</p>'; });}
        return; 
    }

    // --- STATO GLOBALE SCRIPT ---
    let currentUser = null;
    let currentUserRole = null;
    let firebaseAuthInitialized = false;
    
    let allProductsFromFirestore = []; // <<< Array per i prodotti da Firestore
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;

    // --- RIFERIMENTI DOM ---
    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, filterButtons,
        sectionTabs, monosplitSection, exitAdminButton, printButton, tooltipElement, appStatusMessageElement;

    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) {
        if(appStatusMessageElement) { appStatusMessageElement.innerHTML = `<p style="color:red;">${message}</p>`; appStatusMessageElement.style.display = 'block'; }
        if(mainPageContainer) mainPageContainer.classList.add('content-hidden');
        if(headerElement) headerElement.classList.add('content-hidden');
        if(loginPanel) loginPanel.classList.remove('visible');
        console.error("ERRORE FATALE:", message);
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
        if (!product || typeof product !== 'object') return '<div class="product-card error-card">Errore dati.</div>';
        try {
            const img = product.image_url || '../images/placeholder.png'; const brand = product.marca || 'N/D'; const model = product.modello || 'N/D';
            const pwr = product.potenza || 'N/D'; const cool = product.classe_energetica_raffrescamento || 'N/D'; const heat = product.classe_energetica_riscaldamento || 'N/D';
            const wifi = product.wifi; const dsUrl = product.scheda_tecnica_url; const pCode = product.codice_prodotto || 'N/D';
            const uiDim = product.dimensioni_ui || "N/D"; const ueDim = product.dimensioni_ue || "N/D";
            const isMono = brand.toUpperCase() === 'INNOVA'; const mdlAttr = (model||'nd').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
            const sBrand = brand.toLowerCase().replace(/\s+/g,''); const logoP = `../images/logos/${sBrand}.png`; const phLogoP = '../images/logos/placeholder_logo.png';
            let econHTML=''; if(economicModels.includes(model.toUpperCase())) econHTML=`<span class="economic-badge" title="Economico">Economico</span>`;
            let wifiHTML=''; const ws=String(wifi).toLowerCase().trim(); if(ws==='sì'||ws==='si'||ws==='true')wifiHTML=`<i class="fas fa-wifi wifi-icon" title="Wi-Fi"></i>`;
            let dsLink=''; if(dsUrl&&String(dsUrl).trim()!=='')dsLink=`<p class="product-datasheet"><a href="${dsUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;
            let pcHTML=''; if(pCode&&pCode!=='N/D'){let c=''; const hcp=typeof product.prezzo_ui==='number'&&typeof product.prezzo_ue==='number'; if(typeof pCode==='string'&&pCode.includes('UI:')&&pCode.includes('UE:')){const uim=pCode.match(/UI:\s*([^/]+)/);const uem=pCode.match(/UE:\s*([^/]+)/);const uic=uim?uim[1].trim():'N/D';const uec=uem?uem[1].trim():'N/D';c=`UI: ${uic}`;if(hcp)c+=` <span>(${formatPrice(product.prezzo_ui)})</span>`;c+=`<br>UE: ${uec}`;if(hcp)c+=` <span>(${formatPrice(product.prezzo_ue)})</span>`;}else{c=pCode;}pcHTML=`<p class="product-info-text product-codes"><strong>Articoli:</strong><br><span class="code-value">${c}</span></p>`;}
            let dimHTML='';if(uiDim!=="N/D")dimHTML+=`<span>UI: ${uiDim}</span>`;if(!isMono&&ueDim!=="N/D"){if(dimHTML!=='')dimHTML+='';dimHTML+=`<span>UE: ${ueDim}</span>`;}if(dimHTML!==''){dimHTML=`<p class="product-info-text product-dimensions"><strong>Dimensioni AxLxP (mm):</strong> ${dimHTML}</p>`;}
            // Nessun bottone di modifica, actionButtonsContainer sarà vuoto o con altri bottoni (es. Confronta)
            const actionsContainer = ''; 
            return `<div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${mdlAttr}"><div class="card-top-right-elements">${econHTML}${wifiHTML}</div><div class="product-header"><img src="${logoP}" alt="${brand}" class="product-logo" onerror="this.onerror=null;this.src='${phLogoP}';"><div class="product-title-brand"><span class="product-brand-text">${brand}</span><h3 class="product-model">${model}</h3></div></div><img src="${img}" alt="${model}" class="product-image" onerror="this.onerror=null;this.src='../images/placeholder.png';"><div class="product-info"><div class="product-details"><p class="product-info-text"><strong>Potenza:</strong><span class="product-power">${pwr}</span></p><p class="energy-class product-info-text"><strong>Classe En.:</strong><span class="cooling product-energy-cooling">${cool}</span>/<span class="heating product-energy-heating">${heat}</span></p>${pcHTML}${dimHTML}${dsLink}</div><div class="product-footer"><div class="product-price-value">${formatPrice(product.prezzo)}</div><div class="action-buttons-container">${actionsContainer}</div></div></div></div>`;
        } catch(e){console.error(`Err card ID ${product?.id}`,e);return `<div class="product-card error-card">Err card ${product?.id}</div>`;}
    }

    async function loadProductsFromFirestore() {
        if (!db) {
            console.error("Firestore (db) non inizializzato. Impossibile caricare i prodotti.");
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore: Servizio database non disponibile.</p>';
            return [];
        }
        const productsCollectionName = "prodottiClimaMonosplit";
        const productsRef = db.collection(productsCollectionName);
        let loadedData = [];
        if(monosplitGrid) monosplitGrid.innerHTML = '<div class="loading-placeholder">Caricamento prodotti dal database...</div>';
        try {
            console.log("Caricamento prodotti da Firestore:", productsRef.path);
            const snapshot = await productsRef.get();
            if (snapshot.empty) {
                console.log("Nessun prodotto trovato in:", productsRef.path);
                if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto monosplit nel database.</p>';
                return [];
            }
            snapshot.forEach(doc => loadedData.push({ id: doc.id, ...doc.data() }));
            console.log(`Caricati ${loadedData.length} prodotti da Firestore.`);
            return loadedData;
        } catch (error) {
            console.error("Errore caricamento prodotti da Firestore:", error);
            if (monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore nel caricamento dei prodotti.</p>';
            return [];
        }
    }

    function updateAvailableBrandFilters(source) {
        if (!filterButtons || filterButtons.length === 0) { console.warn("Bottoni filtro non trovati per aggiornamento."); return;}
        if (!Array.isArray(source)) { filterButtons.forEach(b=>{if(b.dataset.brand && b.dataset.brand!=='all') b.style.display='none';}); return; }
        const brands = [...new Set(source.map(p => p.marca ? p.marca.toUpperCase() : null).filter(Boolean))].sort();
        console.log("Marche disponibili per filtri:", brands);
        filterButtons.forEach(b => {
            const btnBrand = b.dataset.brand;
            if (btnBrand && btnBrand !== 'all') b.style.display = brands.includes(btnBrand.toUpperCase()) ? '' : 'none';
        });
    }

    function applyFiltersAndSort() {
        let source = allProductsFromFirestore; // USA i prodotti da Firestore
        if (!Array.isArray(source)) { if(monosplitGrid)monosplitGrid.innerHTML='<p class="no-results error-message">Errore dati.</p>'; currentFilteredProducts=[];displayProducts([]);return;}
        let filtered = [];
        try {
            filtered = source.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');
            if (currentBrandFilter !== 'all') filtered = filtered.filter(p => p?.marca?.toUpperCase() === currentBrandFilter);
            if (showOnlyEconomic) filtered = filtered.filter(p => p?.modello && economicModels.includes(p.modello.toUpperCase()));
            filtered.sort((a,b) => (a?.prezzo ?? Infinity) - (b?.prezzo ?? Infinity));
        } catch (e) { console.error("Errore filtri:", e); filtered=[]; if(mainPageContainer)mainPageContainer.innerHTML='<p class="no-results error-message">Errore filtri.</p>';}
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
        if (!monosplitGrid) { console.error("Grid non trovato."); return; }
        if (!Array.isArray(productsToDisplay)) { monosplitGrid.innerHTML = '<p>Errore dati visualizzazione.</p>'; return; }
        let html = '';
        if (productsToDisplay.length > 0) productsToDisplay.forEach(p => html += createProductCard(p));
        else html = '<p class="no-results">Nessun prodotto trovato con i filtri selezionati.</p>';
        monosplitGrid.innerHTML = html;
        if (monosplitSection) monosplitSection.style.display = 'block';
        // Nessuna chiamata a addEditListeners perché l'editing è rimosso
        // if (typeof addTooltipListeners === 'function' && tooltipElement) addTooltipListeners(); // Mantieni se usi tooltip
    }
    
    // --- LOGICA DI EDIT RIMOSSA ---
    // let originalProductData = {};
    // function toggleEditMode...
    // function handleEditClick...
    // function handleCancelClick...
    // function handleSaveClick...
    // function addEditListeners...


    // --- FUNZIONI UI e AUTH ---
    function showLoginScreen() {
        if (appStatusMessageElement) {appStatusMessageElement.textContent = "Accesso richiesto."; appStatusMessageElement.style.display = 'block';}
        if (mainPageContainer) mainPageContainer.classList.add('content-hidden');
        if (headerElement) headerElement.classList.add('content-hidden');
        if (loginPanel) loginPanel.classList.add('visible');
        if (exitAdminButton) exitAdminButton.style.display = 'none';
    }
    function hideLoginScreenAndShowApp() {
        if (loginPanel) loginPanel.classList.remove('visible');
        if (mainPageContainer) mainPageContainer.classList.remove('content-hidden');
        if (headerElement) headerElement.classList.remove('content-hidden');
        if (exitAdminButton) exitAdminButton.style.display = currentUser ? 'inline-flex' : 'none';
        if (appStatusMessageElement) appStatusMessageElement.style.display = 'none';
    }
    async function initializeAppForUser(user) {
        currentUser = user;
        console.log("Autenticato:", user.email, "Recupero ruolo da Firestore...");
        if (db && user) {
            const userDocRef = db.collection('users').doc(user.uid);
            try {
                const doc = await userDocRef.get();
                currentUserRole = doc.exists ? (doc.data().role || 'user') : 'user';
                console.log("Ruolo utente:", currentUserRole);
            } catch (e) { console.error("Errore recupero ruolo Firestore:", e); currentUserRole = 'user';}
        } else { currentUserRole = user ? 'user' : null; console.warn("DB o user non disp per ruolo."); }
        document.body.classList.toggle('admin-mode', currentUserRole === 'admin');
        document.body.classList.toggle('operator-mode', currentUserRole !== 'admin' || !currentUserRole);
        hideLoginScreenAndShowApp();
        await initializeAppMainLogic(); // Aspetta che i prodotti siano caricati e la UI principale sia pronta
    }
    function performLogoutCleanup() {
        currentUser = null; currentUserRole = null; allProductsFromFirestore = []; currentFilteredProducts = [];
        if (monosplitGrid) monosplitGrid.innerHTML = '';
        document.body.classList.remove('admin-mode'); document.body.classList.add('operator-mode');
        showLoginScreen();
    }
    async function initializeAppMainLogic() {
        console.log("Init UI principale: caricamento prodotti...");
        if(appStatusMessageElement) appStatusMessageElement.style.display = 'none'; // Già fatto da hideLoginScreenAndShowApp
        
        allProductsFromFirestore = await loadProductsFromFirestore(); // Carica dati

        if (!Array.isArray(allProductsFromFirestore) || allProductsFromFirestore.length === 0) {
             if(monosplitGrid && !monosplitGrid.querySelector('.error-message')) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto nel database.</p>';
        }
        currentBrandFilter = 'all'; showOnlyEconomic = false;
        document.querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'));
        document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
        
        updateAvailableBrandFilters(allProductsFromFirestore); // Aggiorna filtri MARCA
        
        filterButtons.forEach(btn=>btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
        const economicBtn = document.querySelector('.filter-btn[data-filter-type="economic"]');
        if(economicBtn) economicBtn.classList.remove('active');
        
        applyFiltersAndSort(); // Filtra e visualizza
    }
    function mapFirebaseAuthError(errorCode) {
        switch(errorCode){case"auth/invalid-email":case"auth/invalid-credential":return"Email o password errati.";case"auth/user-disabled":return"Account disabilitato.";case"auth/user-not-found":return"Utente non registrato.";case"auth/wrong-password":return"Password errata.";case"auth/too-many-requests":return"Troppi tentativi. Riprova.";default:return"Errore autenticazione: "+errorCode;}
    }

    // --- DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', () => {
        mainPageContainer=document.querySelector('.container'); headerElement=document.querySelector('.app-header'); loginPanel=document.getElementById('password-panel'); closeLoginPanelBtn=document.getElementById('close-panel-btn'); loginEmailInput=document.getElementById('login-email-input-clima'); loginPasswordInput=document.getElementById('admin-password'); submitLoginBtn=document.getElementById('submit-password-btn'); loginErrorMsg=document.getElementById('password-error'); monosplitGrid=document.getElementById('monosplit-grid'); filterButtons=document.querySelectorAll('.filters .filter-btn'); sectionTabs=document.querySelectorAll('.section-tabs .tab-btn'); monosplitSection=document.getElementById('monosplit-section'); exitAdminButton=document.getElementById('exit-admin-button'); printButton=document.getElementById('print-button'); tooltipElement=document.getElementById('dimension-tooltip'); appStatusMessageElement=document.getElementById('app-status-message');
        
        if(!appStatusMessageElement && mainPageContainer) { // Crea appStatusMessage se non esiste, per sicurezza
            appStatusMessageElement = document.createElement('div');
            appStatusMessageElement.id = 'app-status-message';
            appStatusMessageElement.style.textAlign = 'center';
            appStatusMessageElement.style.padding = '20px';
            appStatusMessageElement.style.fontSize = '1.1em';
            document.body.insertBefore(appStatusMessageElement, mainPageContainer);
        }
        if (appStatusMessageElement) appStatusMessageElement.textContent = "Inizializzazione applicazione...";


        if (!loginPanel || !loginEmailInput || !loginPasswordInput || !submitLoginBtn || !loginErrorMsg) {
            console.error("Err DOM login."); if(appStatusMessageElement){appStatusMessageElement.innerHTML='<p style="color:red;">Errore interfaccia login.</p>';} if(mainPageContainer)mainPageContainer.classList.add('content-hidden'); if(headerElement)headerElement.classList.add('content-hidden'); return;
        }
        if (loginPanel) { const pT=loginPanel.querySelector('h3'); if(pT)pT.textContent='Accesso Area Riservata'; const pD=loginPanel.querySelector('p:not(.error-message)'); if(pD)pD.textContent='Credenziali per continuare.'; if(submitLoginBtn)submitLoginBtn.textContent="Accedi";}

        if (auth) {
            auth.onAuthStateChanged(user => {
                console.log("onAuthStateChanged -> Utente:", user ? user.email : "Nessuno");
                firebaseAuthInitialized = true;
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Verifica stato autenticazione...";
                if (user) initializeAppForUser(user); else performLogoutCleanup();
            });
            submitLoginBtn.addEventListener('click',()=>{const e=loginEmailInput.value.trim(),p=loginPasswordInput.value;loginErrorMsg.textContent='';if(!e||!p){loginErrorMsg.textContent='Email/Pass obbligatori.';return;}auth.signInWithEmailAndPassword(e,p).catch(err=>{loginErrorMsg.textContent=mapFirebaseAuthError(err.code);if(loginPasswordInput)loginPasswordInput.classList.add('input-error');if(loginEmailInput)loginEmailInput.classList.add('input-error');});});
            loginEmailInput.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            loginPasswordInput.addEventListener('keypress',e=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            if(exitAdminButton)exitAdminButton.addEventListener('click',()=>auth.signOut().catch(e=>console.error('Logout err:',e)));
            if(closeLoginPanelBtn)closeLoginPanelBtn.addEventListener('click',()=>{if(loginPanel)loginPanel.classList.remove('visible');});
        } else {
            console.error("FATAL: Auth non def in DOMContentLoaded.");
            if(appStatusMessageElement){appStatusMessageElement.innerHTML='<p style="color:red;">No Auth Service.</p>';}
            if(mainPageContainer)mainPageContainer.classList.add('content-hidden'); if(headerElement)headerElement.classList.add('content-hidden');
        }

        setTimeout(() => {
            if (!firebaseAuthInitialized && auth) { // auth è definito ma onAuthStateChanged non ha (ancora) risposto
                console.warn("Timeout: onAuthStateChanged non scattato. Stato attuale:", auth.currentUser?.email || "Nessun utente.");
                if(appStatusMessageElement) appStatusMessageElement.textContent = "Timeout verifica autenticazione...";
                if (!auth.currentUser) performLogoutCleanup(); else initializeAppForUser(auth.currentUser);
            } else if (!firebaseAuthInitialized && !auth) {
                if(appStatusMessageElement) appStatusMessageElement.innerHTML = "<p style='color:red;'>Timeout: Servizio autenticazione non inizializzato.</p>";
            } else if (firebaseAuthInitialized) {
                 console.log("Timeout fallback: firebaseAuthInitialized è true. Nessuna azione necessaria dal timeout.");
            }
        }, 3500);

        if(filterButtons.length>0)filterButtons.forEach(b=>b.addEventListener('click',e=>{if(!currentUser)return;const cb=e.currentTarget,ft=cb.dataset.filterType,bf=cb.dataset.brand;if(ft==='economic'){showOnlyEconomic=!showOnlyEconomic;cb.classList.toggle('active',showOnlyEconomic);}else if(bf){filterButtons.forEach(btn=>{if(btn.dataset.brand)btn.classList.remove('active');});cb.classList.add('active');currentBrandFilter=bf.toLowerCase()==='all'?'all':bf.toUpperCase();} applyFiltersAndSort();}));
        if(sectionTabs.length>0)sectionTabs.forEach(t=>t.addEventListener('click',e=>{if(!currentUser)return;const ts=t.dataset.section;e.preventDefault();if(ts==='multisplit')window.location.href='../multisplit/index.html';else if(ts==='monosplit'){sectionTabs.forEach(tb=>tb.classList.remove('active'));t.classList.add('active');}}));
        if(printButton)printButton.addEventListener('click',()=>{if(!currentUser){alert("Login per stampare.");return;}window.print();});
    });

})(); // Fine IIFE
