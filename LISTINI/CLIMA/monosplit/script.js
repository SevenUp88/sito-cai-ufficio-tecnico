/* File: script.js (per Listino Climatizzatori, con Firebase Auth e IIFE) */

(function() { // Inizio IIFE (Immediately Invoked Function Expression)

    // --- CONFIGURAZIONE FIREBASE ---
    // !!! INSERISCI QUI LA TUA CONFIGURAZIONE FIREBASE !!!
    const firebaseConfig = {
        apiKey: "TUO_API_KEY",
        authDomain: "TUO_AUTH_DOMAIN",
        projectId: "TUO_PROJECT_ID",
        storageBucket: "TUO_STORAGE_BUCKET",
        messagingSenderId: "TUO_MESSAGING_SENDER_ID",
        appId: "TUO_APP_ID"
    };

    let app;
    let auth;
    // let db; // Descommenta se usi Firestore client-side per caricare i prodotti

    try {
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            // db = firebase.firestore();
            console.log("Firebase inizializzato con successo (SDK v8).");
        } else {
            throw new Error("SDK Firebase (v8 globale) non trovato. Assicurati che sia incluso correttamente nell'HTML.");
        }
    } catch (error) {
        console.error("Errore FATALE durante l'inizializzazione di Firebase:", error);
        // Tenta di mostrare un messaggio all'utente se il DOM è già parzialmente caricato
        const statusMessageOnInitError = document.getElementById('app-status-message');
        if (statusMessageOnInitError) {
            statusMessageOnInitError.innerHTML = '<p style="color:red; font-weight:bold;">Errore critico: servizi Firebase non disponibili. Impossibile caricare.</p>';
        } else { // Fallback se neanche app-status-message è pronto
            document.addEventListener('DOMContentLoaded', () => { // Aspetta che il DOM sia pronto per scrivere nel body
                 document.body.innerHTML = '<p style="color:red; text-align:center; padding:20px; font-weight:bold;">Errore critico nell\'inizializzazione. Impossibile caricare l\'applicazione.</p>';
            });
        }
        return; // Esce dall'IIFE, bloccando l'esecuzione del resto dello script
    }

    // Se arrivi qui, 'app' e 'auth' dovrebbero essere inizializzati.

    // --- STATO GLOBALE DELLO SCRIPT (all'interno dell'IIFE) ---
    let currentUser = null;
    let currentUserRole = null; // 'admin', 'operator', o null
    let firebaseAuthInitialized = false; // Traccia se onAuthStateChanged è stato eseguito almeno una volta

    let currentFilteredProducts = []; // Array dei prodotti attualmente filtrati
    let currentBrandFilter = 'all';   // Filtro marca corrente
    let showOnlyEconomic = false;     // Flag per filtro prodotti economici

    // --- RIFERIMENTI ELEMENTI DOM (Selezionati una volta che il DOM è pronto) ---
    // Questi verranno popolati in DOMContentLoaded
    let mainPageContainer, headerElement, loginPanel, closeLoginPanelBtn, loginEmailInput,
        loginPasswordInput, submitLoginBtn, loginErrorMsg, monosplitGrid, filterButtons,
        sectionTabs, monosplitSection, exitAdminButton, printButton, tooltipElement, appStatusMessageElement;


    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) {
        // Sovrascrive il contenuto per mostrare solo l'errore fatale
        if(mainPageContainer) mainPageContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">${message}</div>`;
        if(headerElement) headerElement.style.display = 'none';
        if(loginPanel) loginPanel.classList.remove('visible'); // Nasconde pannello login
        if(appStatusMessageElement) appStatusMessageElement.innerHTML = `<p style="color:red;">${message}</p>`;
        console.error("ERRORE FATALE:", message);
    }

    function formatPrice(price) {
        if (price === null || price === undefined || price === '') return 'N/D';
        let numericPrice = NaN;
        if (typeof price === 'number') {
            numericPrice = price;
        } else if (typeof price === 'string') {
            try {
                const cleanedPrice = price.replace(/[^0-9,.-]/g, '');
                const normalizedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.'); // Per formati come 1.234,56
                numericPrice = parseFloat(normalizedPrice);
            } catch (e) { /* Ignora, numericPrice resterà NaN */ }
        }
        if (!isNaN(numericPrice)) {
            return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice);
        }
        return 'N/D';
    }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART']; // Case sensitive

    // --- CREAZIONE CARD PRODOTTO ---
    function createProductCard(product) {
        // ... (La tua funzione createProductCard come l'avevi prima, assicurandoti che
        //      `actionButtonsHTML` usi `currentUser` e `currentUserRole` per decidere
        //      quali bottoni mostrare. Il riferimento a 'products' (globale o da parametro) deve essere chiaro.)
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
            if (economicModels.includes(model.toUpperCase())) economicBadgeHTML = `<span class="economic-badge" title="Prodotto linea economica">Economico</span>`;
            
            let wifiIconHTML = '';
            const wifiString = String(wifi).toLowerCase().trim();
            if (wifiString === 'sì' || wifiString === 'si' || wifiString === 'true') wifiIconHTML = `<i class="fas fa-wifi wifi-icon" title="Wi-Fi Integrato"></i>`;
            
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
            if (currentUser && currentUserRole === 'admin') {
                actionButtonsHTML = `
                    <button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button>
                    <button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button>
                    <button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;
            }
            // actionButtonsHTML += `<button class="btn-compare" data-product-id="${product.id}" title="Aggiungi al confronto"><i class="fas fa-exchange-alt"></i></button>`;

            return `
               <div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}">
                   <div class="card-top-right-elements">${economicBadgeHTML}${wifiIconHTML}</div>
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
                           <p class="product-info-text"><strong>Potenza:</strong> <span class="product-power">${power}</span></p>
                           <p class="energy-class product-info-text"><strong>Classe En.:</strong> <span class="cooling product-energy-cooling" title="Raffrescamento">${energyCooling}</span> / <span class="heating product-energy-heating" title="Riscaldamento">${energyHeating}</span></p>
                           ${productCodeHTML}
                           ${dimensionsHTML}
                           ${datasheetLink}
                       </div>
                       <div class="product-footer">
                           <div class="product-price-value">${formatPrice(product.prezzo)}</div>
                           <div class="action-buttons-container">${actionButtonsHTML}</div>
                       </div>
                   </div>
               </div>`;
        } catch (error) { console.error(`Error creating card ID ${product?.id}`, error); return `<div class="product-card error-card">Errore creazione card ID ${product?.id}.</div>`; }
    }

    // --- LOGICA FILTRI E VISUALIZZAZIONE ---
    function applyFiltersAndSort() {
        // ... (Tua funzione applyFiltersAndSort, assicurati che `products` sia disponibile)
        //      Questa funzione ora userà la variabile globale `products` (che viene da data.js)
        //      Se i dati venissero da Firestore, questa funzione sarebbe chiamata dopo il fetch.
        let sourceProducts = (typeof products !== 'undefined' && Array.isArray(products)) ? [...products] : [];
        if(sourceProducts.length === 0 && currentUser) { // Se utente loggato ma products è vuoto
            console.warn("Nessun prodotto locale trovato in 'products' (data.js). La visualizzazione potrebbe essere vuota o dipendere da un caricamento dati Firestore non implementato qui.");
        }


        let filtered = [];
        try {
            filtered = sourceProducts.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');
            if (currentBrandFilter !== 'all') { filtered = filtered.filter(p => p && p.marca && p.marca.toUpperCase() === currentBrandFilter); }
            if (showOnlyEconomic) { filtered = filtered.filter(p => p && p.modello && economicModels.includes(p.modello.toUpperCase())); }
            filtered.sort((a, b) => { const priceA = (a && typeof a.prezzo === 'number' && !isNaN(a.prezzo)) ? a.prezzo : Infinity; const priceB = (b && typeof b.prezzo === 'number' && !isNaN(b.prezzo)) ? b.prezzo : Infinity; return priceA - priceB; });
        } catch (error) { console.error("Error filtering/sorting:", error); filtered = []; if(mainPageContainer) mainPageContainer.innerHTML = '<p class="no-results error-message">Errore applicazione filtri.</p>'; }
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
        // ... (Tua funzione displayProducts, che chiama createProductCard e addEditListeners)
         if (!monosplitGrid) { console.error("CRITICAL ERROR: Monosplit grid not found for display."); return; }
        if (!Array.isArray(productsToDisplay)) { console.error("ERROR: productsToDisplay invalid for display!", productsToDisplay); monosplitGrid.innerHTML = '<p class="no-results error-message">Errore dati prodotti.</p>'; return; }

        let monosplitHTML = '';
        let monosplitCount = 0;
        try {
            productsToDisplay.forEach((product) => {
                if (!product || typeof product.id === 'undefined' || (product.tipo && product.tipo.toLowerCase() !== 'monosplit')) return;
                const cardHTML = createProductCard(product);
                monosplitHTML += cardHTML;
                monosplitCount++;
            });
        } catch (loopError) { console.error("Error during product display loop:", loopError); monosplitGrid.innerHTML = '<p class="no-results error-message">Errore visualizzazione prodotti.</p>'; return; }

        const noMonoMsg = '<p class="no-results">Nessun prodotto Monosplit trovato con i filtri selezionati.</p>';
        monosplitGrid.innerHTML = monosplitCount > 0 ? monosplitHTML : noMonoMsg;

        if (monosplitSection) monosplitSection.style.display = 'block';

        if (currentUser && currentUserRole === 'admin') {
            addEditListeners(); // Chiama se l'utente è admin
        }
        if (typeof addTooltipListeners === 'function' && tooltipElement) { addTooltipListeners(); }
    }

    // --- LOGICA DI EDIT (invariata nel suo funzionamento base, ma il salvataggio andrebbe su Firestore) ---
    let originalProductData = {}; // Per ripristino su cancel
    function toggleEditMode(productId, isEditing) { /* ... implementazione ... */ }
    function handleEditClick(event) { if (currentUser && currentUserRole === 'admin') { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, true); } }
    function handleCancelClick(event) { if (currentUser && currentUserRole === 'admin') { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, false); } }
    function handleSaveClick(event) {
        // ... (tua logica di handleSaveClick, idealmente dovrebbe salvare su Firestore)
        // PER ORA, aggiorna solo `products` e chiama `applyFiltersAndSort`
        if (currentUser && currentUserRole === 'admin') {
            // ... implementa il salvataggio (per ora, simula salvataggio locale come prima)
            const productId = event.currentTarget.dataset.id;
             const productIndex = products.findIndex(p => String(p.id) === String(productId));
            if (productIndex > -1) {
                // Simula l'aggiornamento prendendo i valori dagli input (che dovresti creare in toggleEditMode)
                // products[productIndex].prezzo = nuovoPrezzo;
                // products[productIndex].modello = nuovoModello;
            }
            applyFiltersAndSort();
            // showToast("Modifiche salvate (in memoria).", "success");
        }
    }
    function addEditListeners() { /* ... implementazione ... */ }

    // --- FUNZIONI PER LA GESTIONE DELLO STATO UI E AUTENTICAZIONE ---
    function showLoginScreen() {
        if (mainPageContainer) mainPageContainer.classList.add('content-hidden');
        if (headerElement) headerElement.classList.add('content-hidden');
        if (loginPanel) loginPanel.classList.add('visible');
        if (exitAdminButton) exitAdminButton.style.display = 'none';
        if (appStatusMessageElement) appStatusMessageElement.textContent = "Accesso richiesto.";
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
        // Esempio DEMO: consideriamo tutti gli utenti loggati come 'admin' ai fini della UI.
        // In produzione, recupera il ruolo da Firestore:
        // try {
        //     const userDoc = await db.collection('users').doc(user.uid).get();
        //     if (userDoc.exists && userDoc.data().role === 'admin') {
        //         currentUserRole = 'admin';
        //     } else { currentUserRole = 'operator'; /* o null */ }
        // } catch (e) { console.error("Errore recupero ruolo:", e); currentUserRole = null; }
        
        currentUserRole = 'admin'; // FOR DEMO ONLY
        
        document.body.classList.toggle('admin-mode', currentUserRole === 'admin');
        document.body.classList.toggle('operator-mode', currentUserRole !== 'admin');

        hideLoginScreenAndShowApp();
        initializeAppMainLogic();
    }

    function performLogoutCleanup() {
        currentUser = null;
        currentUserRole = null;
        currentFilteredProducts = [];
        if (monosplitGrid) monosplitGrid.innerHTML = '';
        
        document.body.classList.remove('admin-mode');
        document.body.classList.add('operator-mode');
        showLoginScreen();
    }

    function initializeAppMainLogic() {
        console.log("Inizializzazione logica principale dell'app...");
        if (typeof products === 'undefined' || !Array.isArray(products) || products.length === 0) {
            console.warn("'products' (da data.js) non caricato o vuoto.");
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun dato prodotto da visualizzare.</p>';
        }
        
        // Impostazioni filtri e tab di default
        currentBrandFilter = 'all';
        showOnlyEconomic = false;
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
        const economicBtn = document.querySelector('.filter-btn[data-filter-type="economic"]');
        if (economicBtn) economicBtn.classList.remove('active');

        applyFiltersAndSort(); // Carica e visualizza prodotti
    }
    
    function mapFirebaseAuthError(errorCode) { /* ... (Tua funzione mapFirebaseAuthError) ... */
        switch (errorCode) {
            case "auth/invalid-email": case "auth/invalid-credential": return "Formato email non valido o credenziali errate.";
            case "auth/user-disabled": return "Account utente disabilitato.";
            case "auth/user-not-found": return "Nessun utente trovato con questa email.";
            case "auth/wrong-password": return "Password errata.";
            case "auth/too-many-requests": return "Accesso bloccato. Riprova più tardi.";
            default: return "Errore di autenticazione: " + errorCode;
        }
    }


    // --- CODICE DA ESEGUIRE QUANDO IL DOM È PRONTO ---
    document.addEventListener('DOMContentLoaded', () => {
        // Popola i riferimenti DOM globali (all'interno dell'IIFE)
        mainPageContainer = document.querySelector('.container');
        headerElement = document.querySelector('.app-header');
        loginPanel = document.getElementById('password-panel');
        closeLoginPanelBtn = document.getElementById('close-panel-btn');
        // L'input email viene creato e aggiunto sopra, qui potresti ricreare il riferimento
        loginEmailInput = document.getElementById('login-email-input-clima'); 
        loginPasswordInput = document.getElementById('admin-password');
        submitLoginBtn = document.getElementById('submit-password-btn');
        loginErrorMsg = document.getElementById('password-error');
        monosplitGrid = document.getElementById('monosplit-grid');
        filterButtons = document.querySelectorAll('.filter-btn');
        sectionTabs = document.querySelectorAll('.tab-btn');
        monosplitSection = document.getElementById('monosplit-section');
        exitAdminButton = document.getElementById('exit-admin-button');
        printButton = document.getElementById('print-button');
        tooltipElement = document.getElementById('dimension-tooltip');
        appStatusMessageElement = document.getElementById('app-status-message');

        // Verifica elementi essenziali per il login panel
        if (!loginPanel || !loginEmailInput || !loginPasswordInput || !submitLoginBtn || !loginErrorMsg) {
            console.error("Elementi DOM per il pannello di login mancanti. Funzionalità di login compromessa.");
            if (appStatusMessageElement) appStatusMessageElement.textContent = "Errore interfaccia di login.";
            return; // Non continuare se il login non può funzionare
        }


        // Aggancia listener `onAuthStateChanged` (assicurati che `auth` sia definito)
        if (auth) {
            auth.onAuthStateChanged(user => {
                firebaseAuthInitialized = true;
                if (user) {
                    initializeAppForUser(user);
                } else {
                    performLogoutCleanup();
                }
            });

            // Event Listener per il submit del Login
            submitLoginBtn.addEventListener('click', () => {
                const email = loginEmailInput.value.trim();
                const password = loginPasswordInput.value;
                loginErrorMsg.textContent = '';

                if (!email || !password) {
                    loginErrorMsg.textContent = 'Email e password sono obbligatori.';
                    return;
                }
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        // onAuthStateChanged gestirà il resto.
                    })
                    .catch((error) => {
                        loginErrorMsg.textContent = mapFirebaseAuthError(error.code);
                        loginPasswordInput.classList.add('input-error');
                        loginEmailInput.classList.add('input-error');
                    });
            });
            loginEmailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitLoginBtn.click(); }});
            loginPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitLoginBtn.click(); }});


            // Event Listener per il Logout (pulsante #exit-admin-button)
            if (exitAdminButton) {
                exitAdminButton.addEventListener('click', () => {
                    auth.signOut().then(() => {
                        // onAuthStateChanged gestirà il cleanup.
                    }).catch((error) => {
                        console.error('Errore durante il logout Firebase:', error);
                    });
                });
            }

             // Event Listener per chiudere il pannello (se presente e voluto)
            if(closeLoginPanelBtn){
                closeLoginPanelBtn.addEventListener('click', () => {
                    if(loginPanel) loginPanel.classList.remove('visible');
                    // Nota: se l'utente non è loggato, onAuthStateChanged (o il timeout) lo riaprirà.
                });
            }

        } else {
            // Questo caso è già gestito dal try-catch dell'inizializzazione di Firebase.
            // Se 'auth' non è definito qui, significa che l'init è fallito e lo script dovrebbe essersi fermato.
            console.error("FATAL: Oggetto Firebase Auth non definito in DOMContentLoaded.");
            if (appStatusMessageElement) appStatusMessageElement.textContent = "Impossibile avviare autenticazione.";
        }


        // Timeout di fallback (già discusso, qui per completezza)
        setTimeout(() => {
            if (!firebaseAuthInitialized && auth) {
                if (!auth.currentUser) {
                    performLogoutCleanup();
                } else {
                    initializeAppForUser(auth.currentUser);
                }
            } else if (!firebaseAuthInitialized && !auth) { // Se init Firebase è fallito
                if(appStatusMessageElement && (!currentUser)) appStatusMessageElement.textContent = "Servizio di autenticazione non attivo.";
            }
        }, 2500); // 2.5 secondi di attesa


        // Listener per filtri, tabs, ecc. (possono essere inizializzati qui, ma la loro efficacia
        // sul contenuto dipenderà dallo stato di login e dal caricamento dati)
        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    if(!currentUser) return; // Non fare nulla se non loggato
                    const clickedButton = event.currentTarget;
                    const filterType = clickedButton.dataset.filterType;
                    const brandToFilter = clickedButton.dataset.brand;

                    if (filterType === 'economic') {
                        showOnlyEconomic = !showOnlyEconomic;
                        clickedButton.classList.toggle('active', showOnlyEconomic);
                    } else if (brandToFilter) {
                        filterButtons.forEach(btn => { if (btn.dataset.brand) btn.classList.remove('active'); });
                        clickedButton.classList.add('active');
                        currentBrandFilter = brandToFilter.toLowerCase() === 'all' ? 'all' : brandToFilter.toUpperCase();
                    }
                    applyFiltersAndSort();
                });
            });
        }

        if (sectionTabs.length > 0) {
            sectionTabs.forEach(tab => {
                tab.addEventListener('click', (event) => {
                    if(!currentUser) return;
                    const targetSectionId = tab.dataset.section;
                    event.preventDefault();
                    if (targetSectionId === 'multisplit') {
                        window.location.href = '../multisplit/index.html';
                    } else if (targetSectionId === 'monosplit') {
                        sectionTabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                    }
                });
            });
        }

        if (printButton) {
            printButton.addEventListener('click', () => {
                if (!currentUser) {
                    alert("Devi effettuare il login per utilizzare la funzione di stampa.");
                    return;
                }
                window.print();
            });
        }

    }); // Fine DOMContentLoaded

})(); // Fine e chiamata dell'IIFE
