/* File: script.js (per Listino Climatizzatori - Firebase Auth & Firestore Data v2) */

(function() { // Inizio IIFE

    // --- CONFIGURAZIONE FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", // Maschera se condividi pubblicamente
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
            throw new Error("SDK Firebase (v8) non trovato.");
        }
    } catch (error) {
        console.error("ERRORE FATALE inizializzazione Firebase:", error);
        const statusMsg = document.getElementById('app-status-message');
        if (statusMsg) statusMsg.innerHTML = '<p style="color:red;font-weight:bold;">Errore Firebase. Impossibile caricare.</p>';
        else document.body.innerHTML = '<p style="color:red;font-weight:bold;text-align:center;padding:20px;">Errore Firebase.</p>';
        return; // Esce dall'IIFE
    }

    // --- STATO GLOBALE SCRIPT ---
    let currentUser = null;
    let currentUserRole = null;
    let firebaseAuthInitialized = false;
    let allProductsFromFirestore = []; // Per i prodotti da Firestore
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;

    // --- RIFERIMENTI DOM (Popolati in DOMContentLoaded) ---
    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, filterButtons,
        sectionTabs, monosplitSection, exitAdminButton, printButton, tooltipElement, appStatusMessageElement;

    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { /* ... come prima ... */ }
    function formatPrice(price) { /* ... come prima ... */ }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];

    // --- FUNZIONI CORE ---
    function createProductCard(product) { /* ... come prima, SENZA bottoni di modifica ... */
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
            let economicBadgeHTML = ''; if (economicModels.includes(model.toUpperCase())) economicBadgeHTML = `<span class="economic-badge" title="Linea economica">Economico</span>`;
            let wifiIconHTML = ''; const wifiString = String(wifi).toLowerCase().trim(); if (wifiString === 'sì' || wifiString === 'si' || wifiString === 'true') wifiIconHTML = `<i class="fas fa-wifi wifi-icon" title="Wi-Fi"></i>`;
            let datasheetLink = ''; if (datasheetUrl && String(datasheetUrl).trim() !== '') datasheetLink = `<p class="product-datasheet"><a href="${datasheetUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a></p>`;
            let productCodeHTML = ''; if (productCode && productCode !== 'N/D') { let c = ''; const hcp = typeof product.prezzo_ui === 'number' && typeof product.prezzo_ue === 'number'; if (typeof productCode === 'string' && productCode.includes('UI:') && productCode.includes('UE:')) { const uim = productCode.match(/UI:\s*([^/]+)/); const uem = productCode.match(/UE:\s*([^/]+)/); const uic = uim?uim[1].trim():'N/D'; const uec = uem?uem[1].trim():'N/D'; c = `UI: ${uic}`; if(hcp) c+=` <span>(${formatPrice(product.prezzo_ui)})</span>`; c += `<br>UE: ${uec}`; if(hcp) c+=` <span>(${formatPrice(product.prezzo_ue)})</span>`;} else {c=productCode;} productCodeHTML = `<p class="product-info-text product-codes"><strong>Articoli:</strong><br><span class="code-value">${c}</span></p>`;}
            let dimensionsHTML = ''; if(uiDimensions !== "N/D") dimensionsHTML += `<span>UI: ${uiDimensions}</span>`; if(!isMonobloc && ueDimensions !== "N/D"){if(dimensionsHTML!=='')dimensionsHTML+=''; dimensionsHTML+=`<span>UE: ${ueDimensions}</span>`;} if(dimensionsHTML!==''){dimensionsHTML=`<p class="product-info-text product-dimensions"><strong>Dimensioni AxLxP (mm):</strong> ${dimensionsHTML}</p>`;}
            // Non ci sono bottoni di modifica ora
            const actionButtonsContainerContent = ''; // Lascia vuoto o aggiungi "Confronta" se necessario

            return `<div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}"><div class="card-top-right-elements">${economicBadgeHTML}${wifiIconHTML}</div><div class="product-header"><img src="${logoPath}" alt="Logo ${brand}" class="product-logo" onerror="this.onerror=null; this.src='${placeholderLogoPath}';"><div class="product-title-brand"><span class="product-brand-text">${brand}</span><h3 class="product-model">${model}</h3></div></div><img src="${imageUrl}" alt="${model}" class="product-image" onerror="this.onerror=null; this.src='../images/placeholder.png';"><div class="product-info"><div class="product-details"><p class="product-info-text"><strong>Potenza:</strong> <span class="product-power">${power}</span></p><p class="energy-class product-info-text"><strong>Classe En.:</strong> <span class="cooling product-energy-cooling">${energyCooling}</span>/<span class="heating product-energy-heating">${energyHeating}</span></p>${productCodeHTML}${dimensionsHTML}${datasheetLink}</div><div class="product-footer"><div class="product-price-value">${formatPrice(product.prezzo)}</div><div class="action-buttons-container">${actionButtonsContainerContent}</div></div></div></div>`;
        } catch (e) { console.error(`Err card ID ${product?.id}`, e); return `<div class="product-card error-card">Err card ${product?.id}</div>`;}
    }

    async function loadProductsFromFirestore() {
        if (!db) {
            console.error("Firestore (db) non inizializzato.");
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Servizio database non disp.</p>';
            return [];
        }
        const collectionName = "prodottiClimaMonosplit"; // Conforme alle regole Firestore
        const ref = db.collection(collectionName);
        let loaded = [];
        if (monosplitGrid) monosplitGrid.innerHTML = '<div class="loading-placeholder">Caricamento prodotti...</div>';
        try {
            const snapshot = await ref.get();
            if (snapshot.empty) {
                if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto nel database.</p>';
                return [];
            }
            snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() }));
            console.log(`Caricati ${loaded.length} prodotti da '${collectionName}'.`);
            return loaded;
        } catch (error) {
            console.error(`Errore caricamento da '${collectionName}':`, error);
            if (monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore caricamento prodotti.</p>';
            return [];
        }
    }

    function updateAvailableBrandFilters(sourceProducts) {
        if (!Array.isArray(sourceProducts)) {
             filterButtons.forEach(b => { if(b.dataset.brand && b.dataset.brand !=='all') b.style.display='none';}); return;
        }
        const brands = [...new Set(sourceProducts.map(p => p.marca ? p.marca.toUpperCase() : null).filter(Boolean))].sort();
        console.log("Marche per filtri:", brands);
        filterButtons.forEach(b => {
            const btnBrand = b.dataset.brand;
            if (btnBrand && btnBrand !== 'all') {
                b.style.display = brands.includes(btnBrand.toUpperCase()) ? '' : 'none';
            }
        });
    }

    function applyFiltersAndSort() {
        let source = allProductsFromFirestore; // USA I DATI DA FIRESTORE
        if (!Array.isArray(source)) {
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results error-message">Errore dati filtri.</p>';
            currentFilteredProducts = []; displayProducts([]); return;
        }
        let filtered = [];
        try {
            filtered = source.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');
            if (currentBrandFilter !== 'all') filtered = filtered.filter(p => p?.marca?.toUpperCase() === currentBrandFilter);
            if (showOnlyEconomic) filtered = filtered.filter(p => p?.modello && economicModels.includes(p.modello.toUpperCase()));
            filtered.sort((a,b) => (a?.prezzo ?? Infinity) - (b?.prezzo ?? Infinity));
        } catch (e) { console.error("Err filtri:", e); filtered = []; if(mainPageContainer) mainPageContainer.innerHTML = '<p class="no-results error-message">Errore filtri.</p>'; }
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
        if (!monosplitGrid) return;
        if (!Array.isArray(productsToDisplay)) { monosplitGrid.innerHTML = '<p class="no-results error-message">Errore.</p>'; return; }
        let html = '';
        if (productsToDisplay.length > 0) {
            productsToDisplay.forEach(p => html += createProductCard(p));
        } else {
            html = '<p class="no-results">Nessun prodotto trovato con i filtri selezionati.</p>';
        }
        monosplitGrid.innerHTML = html;
        if (monosplitSection) monosplitSection.style.display = 'block';
        // Non c'è più addEditListeners
        if (typeof addTooltipListeners === 'function' && tooltipElement) addTooltipListeners();
    }

    // --- FUNZIONI UI e AUTH ---
    function showLoginScreen() { /* ...come prima... */ }
    function hideLoginScreenAndShowApp() { /* ...come prima... */ }
    async function initializeAppForUser(user) { /* ...come prima, recupera ruolo da db.collection('users').doc(user.uid) ... */
        currentUser = user;
        console.log("Autenticato:", user.email, "Recupero ruolo...");
        if (db && user) {
            const userDocRef = db.collection('users').doc(user.uid);
            try {
                const doc = await userDocRef.get();
                currentUserRole = doc.exists ? (doc.data().role || 'user') : 'user';
                console.log("Ruolo:", currentUserRole);
            } catch (e) { console.error("Err ruolo:", e); currentUserRole = 'user';}
        } else { currentUserRole = user ? 'user' : null; console.warn("DB o user non disp per ruolo."); }
        document.body.classList.toggle('admin-mode', currentUserRole === 'admin');
        document.body.classList.toggle('operator-mode', currentUserRole !== 'admin');
        hideLoginScreenAndShowApp();
        await initializeAppMainLogic(); // Await qui se initializeAppMainLogic è async
    }
    function performLogoutCleanup() { /* ...come prima... */ }
    async function initializeAppMainLogic() { // Resa async
        console.log("Init UI principale (dati da Firestore)...");
        if(appStatusMessageElement) appStatusMessageElement.style.display = 'none';
        allProductsFromFirestore = await loadProductsFromFirestore();
        if (!Array.isArray(allProductsFromFirestore) || allProductsFromFirestore.length === 0) {
             if(monosplitGrid && !monosplitGrid.querySelector('.error-message')) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto.</p>';
        }
        currentBrandFilter = 'all'; showOnlyEconomic = false;
        document.querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'));
        document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
        updateAvailableBrandFilters(allProductsFromFirestore);
        filterButtons.forEach(btn=>btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
        const ecBtn = document.querySelector('.filter-btn[data-filter-type="economic"]'); if(ecBtn) ecBtn.classList.remove('active');
        applyFiltersAndSort();
    }
    function mapFirebaseAuthError(errorCode) { /* ...come prima... */ }

    // --- DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', () => {
        mainPageContainer=document.querySelector('.container'); headerElement=document.querySelector('.app-header'); loginPanel=document.getElementById('password-panel'); closeLoginPanelBtn=document.getElementById('close-panel-btn'); loginEmailInput=document.getElementById('login-email-input-clima'); loginPasswordInput=document.getElementById('admin-password'); submitLoginBtn=document.getElementById('submit-password-btn'); loginErrorMsg=document.getElementById('password-error'); monosplitGrid=document.getElementById('monosplit-grid'); filterButtons=document.querySelectorAll('.filters .filter-btn'); sectionTabs=document.querySelectorAll('.section-tabs .tab-btn'); monosplitSection=document.getElementById('monosplit-section'); exitAdminButton=document.getElementById('exit-admin-button'); printButton=document.getElementById('print-button'); tooltipElement=document.getElementById('dimension-tooltip'); appStatusMessageElement=document.getElementById('app-status-message');
        if (!loginPanel || !loginEmailInput || !loginPasswordInput || !submitLoginBtn || !loginErrorMsg) { console.error("Err DOM login."); if (appStatusMessageElement) {appStatusMessageElement.textContent="Err interfaccia login."; appStatusMessageElement.style.display='block';} if(mainPageContainer)mainPageContainer.classList.add('content-hidden'); if(headerElement)headerElement.classList.add('content-hidden'); return;}
        if (loginPanel) { const pTitle=loginPanel.querySelector('h3'); if(pTitle)pTitle.textContent='Accesso Area Riservata'; const pDesc=loginPanel.querySelector('p:not(.error-message)'); if(pDesc)pDesc.textContent='Credenziali per continuare.'; if(submitLoginBtn)submitLoginBtn.textContent="Accedi"; }
        if (auth) {
            auth.onAuthStateChanged(user => { firebaseAuthInitialized = true; if (user) initializeAppForUser(user); else performLogoutCleanup(); });
            submitLoginBtn.addEventListener('click', () => { const e=loginEmailInput.value.trim(),p=loginPasswordInput.value; loginErrorMsg.textContent=''; if(!e||!p){loginErrorMsg.textContent='Email/Password obbligatori.';return;} auth.signInWithEmailAndPassword(e,p).catch(err=>{loginErrorMsg.textContent=mapFirebaseAuthError(err.code);loginPasswordInput.classList.add('input-error');loginEmailInput.classList.add('input-error');});});
            loginEmailInput.addEventListener('keypress', (e)=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}}); loginPasswordInput.addEventListener('keypress', (e)=>{if(e.key==='Enter'){e.preventDefault();submitLoginBtn.click();}});
            if(exitAdminButton) exitAdminButton.addEventListener('click', () => auth.signOut().catch(e=>console.error('Logout err:',e)));
            if(closeLoginPanelBtn) closeLoginPanelBtn.addEventListener('click', () => {if(loginPanel)loginPanel.classList.remove('visible');});
        } else { console.error("FATAL: Auth non definito."); if(appStatusMessageElement){appStatusMessageElement.textContent="No Auth."; appStatusMessageElement.style.display='block';} if(mainPageContainer)mainPageContainer.classList.add('content-hidden'); if(headerElement)headerElement.classList.add('content-hidden'); }
        setTimeout(() => { if (!firebaseAuthInitialized && auth) { if(!auth.currentUser) performLogoutCleanup(); else initializeAppForUser(auth.currentUser); } else if(!firebaseAuthInitialized && !auth){ if(appStatusMessageElement&&(!currentUser))appStatusMessageElement.textContent="Auth timeout.";}}, 3000);
        if(filterButtons.length>0) filterButtons.forEach(b => b.addEventListener('click', e => { if(!currentUser)return; const cb=e.currentTarget,ft=cb.dataset.filterType,bf=cb.dataset.brand; if(ft==='economic'){showOnlyEconomic=!showOnlyEconomic;cb.classList.toggle('active',showOnlyEconomic);}else if(bf){filterButtons.forEach(btn=>{if(btn.dataset.brand)btn.classList.remove('active');});cb.classList.add('active');currentBrandFilter=bf.toLowerCase()==='all'?'all':bf.toUpperCase();} applyFiltersAndSort();}));
        if(sectionTabs.length>0) sectionTabs.forEach(t => t.addEventListener('click', e => { if(!currentUser)return; const ts=t.dataset.section; e.preventDefault(); if(ts==='multisplit')window.location.href='../multisplit/index.html'; else if(ts==='monosplit'){sectionTabs.forEach(tb=>tb.classList.remove('active'));t.classList.add('active');}}));
        if(printButton) printButton.addEventListener('click', () => { if(!currentUser){alert("Login per stampare.");return;} window.print(); });
    }); // Fine DOMContentLoaded

})(); // Fine IIFE
