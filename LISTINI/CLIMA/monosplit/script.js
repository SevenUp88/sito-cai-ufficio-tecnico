// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
  authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
  projectId: "consorzio-artigiani-idraulici",
  storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
  messagingSenderId: "136848104008",
  appId: "1:136848104008:web:2724f60607dbe91d09d67d",
  measurementId: "G-NNPV2607G7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
/* File: script.js (per Listino Climatizzatori, con Firebase Auth) */
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAZIONE FIREBASE ---
    // !!! INSERISCI QUI LA TUA CONFIGURAZIONE FIREBASE !!!
    const firebaseConfig = {
        apiKey: "TUO_API_KEY",
        authDomain: "TUO_AUTH_DOMAIN",
        projectId: "TUO_PROJECT_ID",
        storageBucket: "TUO_STORAGE_BUCKET",
        messagingSenderId: "TUO_MESSAGING_SENDER_ID",
        appId: "TUO_APP_ID"
        // measurementId: "G-TUO_MEASUREMENT_ID" // Se usi Analytics
    };

    let app;
    let auth;
    // let db; // Descommenta se usi Firestore client-side per caricare i prodotti

    try {
        if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            // db = firebase.firestore(); // Descommenta se necessario
            console.log("Firebase inizializzato con successo (SDK v8).");
        } else {
            throw new Error("SDK Firebase (v8 globale) non trovato. Assicurati che sia incluso nell'HTML.");
        }
    } catch (error) {
        console.error("Errore durante l'inizializzazione di Firebase:", error);
        handleFatalError("Errore critico: impossibile inizializzare i servizi. Verifica la console.");
        // Se Firebase non si inizializza, blocca l'esecuzione o mostra un messaggio chiaro.
        // In questo caso, la logica di auth non partirà.
        // showLoginPanelWithMessage("Servizio di autenticazione non disponibile."); // Funzione da creare se necessario
        return; // Interrompe l'esecuzione del resto dello script se Firebase non si inizializza
    }
    // --- FINE CONFIGURAZIONE FIREBASE ---


    // --- STATO UTENTE E RUOLO ---
    let currentUser = null;
    let currentUserRole = null; // 'admin', 'operator', o null
    let firebaseAuthInitialized = false;

    // --- VARIABILI PER LA LOGICA ESISTENTE ---
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;
    // const activeSection = 'monosplit'; // Non più usata per switchare, solo monosplit in questa pagina

    // --- SELETTORI DOM ---
    const mainPageContainer = document.querySelector('.container');
    const headerElement = document.querySelector('.app-header');

    const loginPanel = document.getElementById('password-panel'); // Riutilizziamo l'ID per CSS
    const closeLoginPanelBtn = document.getElementById('close-panel-btn');
    const loginPasswordInput = document.getElementById('admin-password');
    const submitLoginBtn = document.getElementById('submit-password-btn');
    const loginErrorMsg = document.getElementById('password-error');
    let loginEmailInput; // Verrà creato e inserito

    // Modifica il pannello di login per includere l'email
    if (loginPanel && loginPasswordInput && loginErrorMsg && submitLoginBtn && closeLoginPanelBtn) {
        loginPanel.querySelector('h3').textContent = 'Accesso Area Riservata';
        const panelDescription = loginPanel.querySelector('p:not(.error-message)');
        if(panelDescription) panelDescription.textContent = 'Inserisci email e password per accedere.';
        
        const emailFormGroup = document.createElement('div');
        emailFormGroup.className = 'form-group';
        const emailLabel = document.createElement('label');
        emailLabel.htmlFor = 'login-email-input-clima'; // ID unico per pagina
        emailLabel.textContent = 'Email:';
        
        loginEmailInput = document.createElement('input');
        loginEmailInput.type = 'email';
        loginEmailInput.id = 'login-email-input-clima';
        loginEmailInput.name = 'login-email-input-clima';
        loginEmailInput.required = true;
        loginEmailInput.style.width = '100%'; // Stile inline di base
        loginEmailInput.style.padding = '10px';
        loginEmailInput.style.border = '1px solid #ccc';
        loginEmailInput.style.borderRadius = '4px';


        emailFormGroup.appendChild(emailLabel);
        emailFormGroup.appendChild(loginEmailInput);
        
        const passwordFormGroup = loginPasswordInput.closest('.form-group');
        if (passwordFormGroup) {
            passwordFormGroup.insertAdjacentElement('beforebegin', emailFormGroup);
        } else { // Fallback se la struttura del DOM fosse diversa
            loginPanel.insertBefore(emailFormGroup, loginPasswordInput.parentElement || loginPasswordInput);
        }
        submitLoginBtn.textContent = "Accedi";
    } else {
        console.error("Elementi del pannello di login mancanti. Il login non funzionerà correttamente.");
    }


    const monosplitGrid = document.getElementById('monosplit-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sectionTabs = document.querySelectorAll('.tab-btn'); // Usati per navigare, non per mostrare/nascondere sezioni qui
    const monosplitSection = document.getElementById('monosplit-section');
    // const sections = { monosplit: monosplitSection }; // Non più necessario se c'è solo monosplit

    const adminTrigger = document.getElementById('admin-trigger'); // Sarà nascosto se login forzato
    const exitAdminButton = document.getElementById('exit-admin-button'); // Diventa Logout
    const printButton = document.getElementById('print-button');

    const tooltipElement = document.getElementById('dimension-tooltip');
    // ... altri elementi tooltip se presenti ...

    // --- VERIFICHE INIZIALI PER ELEMENTI DELLA PAGINA (esclusa la logica Auth ancora) ---
    if (typeof products === 'undefined' || !Array.isArray(products)) { console.warn("Avviso: 'products' (da data.js) non definito o invalido. L'app potrebbe fare affidamento su dati da Firestore dopo il login."); /* Non è più fatale se i dati vengono da Firestore */ }
    if (!monosplitGrid || !monosplitSection) { console.error("CRITICAL ERROR: Monosplit grid or section elements missing."); handleFatalError("Errore critico: elementi della pagina mancanti."); return; }
    // --- FINE VERIFICHE ---


    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { if(mainPageContainer) mainPageContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">${message}</div>`; if(headerElement) headerElement.style.display = 'none';}
    function formatPrice(price) {  if (price === null || price === undefined || price === '') { return 'N/D'; } let numericPrice = NaN; if (typeof price === 'number') { numericPrice = price; } else if (typeof price === 'string') { try { const cleanedPrice = price.replace(/[^0-9,.-]/g, ''); const normalizedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.'); numericPrice = parseFloat(normalizedPrice); } catch (e) { /* Ignora */ } } if (!isNaN(numericPrice)) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice); } else { return 'N/D'; }  }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];

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
            if (!isMonobloc && ueDimensions !== "N/D") { if (dimensionsHTML !== '') dimensionsHTML += ''; dimensionsHTML += `<span>UE: ${ueDimensions}</span>`; } // Già presente, nessun /
            if (dimensionsHTML !== '') { dimensionsHTML = `<p class="product-info-text product-dimensions"><strong>Dimensioni AxLxP (mm):</strong> ${dimensionsHTML}</p>`; }

            let actionButtonsHTML = '';
            // Mostra bottoni di modifica solo se l'utente è loggato E ha il ruolo 'admin'
            if (currentUser && currentUserRole === 'admin') {
                actionButtonsHTML = `
                    <button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button>
                    <button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button>
                    <button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;
            }
             // Potresti voler aggiungere il bottone Confronta per tutti gli utenti loggati, o per tutti
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

    function applyFiltersAndSort() {
        let sourceProducts = [];
        // QUI: Decidi se `products` viene da `data.js` o se lo carichi da Firestore dopo il login.
        // Se da Firestore, `currentFilteredProducts` dovrebbe essere popolato da lì.
        // Per ora, si basa sulla variabile globale `products` da `data.js`.
        if (typeof products !== 'undefined' && Array.isArray(products)) {
            sourceProducts = [...products];
        } else {
             console.warn("Variabile 'products' (da data.js) non trovata o vuota. I filtri opereranno su un array vuoto.");
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

        if (monosplitSection) monosplitSection.style.display = 'block'; // Assicurati che la sezione sia visibile

        if (currentUser && currentUserRole === 'admin') { // Aggiungi listeners solo se admin
            addEditListeners();
        }
        if (typeof addTooltipListeners === 'function' && tooltipElement) { addTooltipListeners(); }
    }


    let originalProductData = {}; // Mantenuto per la funzionalità di edit in-place
    // Funzioni toggleEditMode, handleEditClick, handleCancelClick, handleSaveClick, addEditListeners:
    // La loro logica interna per manipolare il DOM e `originalProductData` può rimanere
    // simile, ma `handleSaveClick` DEVE essere modificata per salvare su Firestore
    // invece che solo sull'array locale `products`. La visibilità dei bottoni
    // è già gestita da `createProductCard`.
    
    function toggleEditMode(productId, isEditing) { /* ... (implementazione esistente, assicurarsi che funzioni con il DOM delle card) ... */
        const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!card) return;
        // ... (logica per mostrare/nascondere input e bottoni save/cancel) ...
    }
    function handleEditClick(event) { if (currentUser && currentUserRole === 'admin') { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, true); } }
    function handleCancelClick(event) { if (currentUser && currentUserRole === 'admin') { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, false); /* Ripristina originalProductData se necessario */ } }
    
    function handleSaveClick(event) {
        if (currentUser && currentUserRole === 'admin') {
            const productId = event.currentTarget.dataset.id;
            const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            if (!card) return;

            const newPriceInput = card.querySelector('.edit-price-input');
            const newModelInput = card.querySelector('.edit-model-input');
            
            const updates = {};
            let needsRemoteUpdate = false;

            if (newPriceInput && newPriceInput.value !== (originalProductData[productId]?.prezzo || '')) {
                const parsedPrice = parseFloat(String(newPriceInput.value).replace(',', '.'));
                if (!isNaN(parsedPrice)) {
                    updates.prezzo = parsedPrice;
                    needsRemoteUpdate = true;
                } else {
                    alert("Formato prezzo non valido."); return;
                }
            }
            if (newModelInput && newModelInput.value !== (originalProductData[productId]?.modello || '')) {
                updates.modello = newModelInput.value;
                needsRemoteUpdate = true;
            }

            if (needsRemoteUpdate) {
                console.log(`Tentativo di salvare ID ${productId} con aggiornamenti:`, updates);
                // --- INTEGRAZIONE FIRESTORE PER SALVATAGGIO ---
                // Esempio (richiede `db` inizializzato e che la collezione esista):
                /*
                if (db && productId) {
                    showToast("Salvataggio modifiche...", "info", 2000);
                    db.collection("prodottiClimaMonosplit").doc(String(productId)) // Assicurati che l'ID sia una stringa
                        .update(updates)
                        .then(() => {
                            console.log("Prodotto aggiornato su Firestore con successo!");
                            showToast("Modifiche salvate su server!", "success");
                            // Aggiorna l'array locale 'products' e riesegui i filtri
                            const productIndex = products.findIndex(p => String(p.id) === String(productId));
                            if (productIndex > -1) {
                                if (updates.prezzo !== undefined) products[productIndex].prezzo = updates.prezzo;
                                if (updates.modello !== undefined) products[productIndex].modello = updates.modello;
                            }
                            applyFiltersAndSort(); // Ridisegna con i dati aggiornati
                        })
                        .catch((error) => {
                            console.error("Errore aggiornamento prodotto su Firestore: ", error);
                            showToast("Errore salvataggio su server.", "error");
                            // Opzionalmente ripristina i valori originali nella UI
                            toggleEditMode(productId, false); // Annulla l'editing nella UI
                        });
                } else {
                    console.warn("Firestore (db) non inizializzato o productId mancante. Salvataggio solo locale.");
                     // Fallback a salvataggio locale se Firestore non è disponibile
                    const productIndex = products.findIndex(p => String(p.id) === String(productId));
                    if (productIndex > -1) {
                        if (updates.prezzo !== undefined) products[productIndex].prezzo = updates.prezzo;
                        if (updates.modello !== undefined) products[productIndex].modello = updates.modello;
                         applyFiltersAndSort();
                         showToast("Modifiche salvate localmente (server non disp.).", "warning");
                    }
                }
                */
                // PER QUESTA DEMO SENZA SCRITTURA SU FIRESTORE CLIENT-SIDE:
                const productIndex = products.findIndex(p => String(p.id) === String(productId));
                if (productIndex > -1) {
                    if (updates.prezzo !== undefined) products[productIndex].prezzo = updates.prezzo;
                    if (updates.modello !== undefined) products[productIndex].modello = updates.modello;
                     applyFiltersAndSort();
                     showToast("Modifiche salvate (in memoria).", "success");
                }

            }
            toggleEditMode(productId, false);
        }
    }
    function addEditListeners() { /* ... (Logica di querySelectorAll e addEventListener per .edit-btn, .save-btn, .cancel-btn rimane) ... */
         document.querySelectorAll('.product-card .edit-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
         document.querySelectorAll('.product-card .save-btn').forEach(btn => btn.addEventListener('click', handleSaveClick));
         document.querySelectorAll('.product-card .cancel-btn').forEach(btn => btn.addEventListener('click', handleCancelClick));
    }

    // --- GESTIONE TOOLTIP (Presumibilmente invariato) ---
    // function positionTooltip(event) { ... } etc.
    // Se `addTooltipListeners` e le altre funzioni tooltip sono globali o definite prima, OK.

    // --- LOGICA DI AUTENTICAZIONE FIREBASE ---
    function showLoginScreen() {
        if(mainPageContainer) mainPageContainer.style.display = 'none';
        if(headerElement) headerElement.style.display = 'none';
        if(loginPanel) loginPanel.classList.add('visible');
        if(adminTrigger) adminTrigger.style.display = 'none'; // Nascondi admin trigger (era per la password locale)
        if(exitAdminButton) exitAdminButton.style.display = 'none'; // Nascondi bottone logout
    }

    function hideLoginScreenAndShowApp() {
        if(loginPanel) loginPanel.classList.remove('visible');
        if(mainPageContainer) mainPageContainer.style.display = 'block';
        if(headerElement) headerElement.style.display = 'flex';
        if(exitAdminButton) exitAdminButton.style.display = currentUser ? 'inline-flex' : 'none';
    }

    async function initializeAppForUser(user) { // Async per fetch del ruolo
        currentUser = user;
        
        // RECUPERO RUOLO UTENTE DA FIRESTORE (esempio SDK v8, se 'db' è inizializzato)
        // Assumiamo che 'db' sia firebase.firestore()
        /*
        if (db && user) {
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().role === 'admin') {
                    currentUserRole = 'admin';
                    document.body.classList.add('admin-mode');
                    document.body.classList.remove('operator-mode');
                } else {
                    currentUserRole = 'operator'; // O un altro ruolo, o null
                    document.body.classList.add('operator-mode');
                    document.body.classList.remove('admin-mode');
                     // Potresti voler impedire l'accesso se non è admin, o mostrare UI limitata
                     // handleFatalError("Accesso non autorizzato a questa sezione.");
                     // auth.signOut(); // Disconnetti l'utente se non ha i permessi
                     // return; 
                }
            } catch (error) {
                console.error("Errore nel recuperare il ruolo utente:", error);
                currentUserRole = null; // Fallback
                // Decidi come gestire: permettere accesso limitato o disconnettere?
                // Per ora, si procede con accesso limitato se il ruolo non è admin.
                document.body.classList.add('operator-mode');
                document.body.classList.remove('admin-mode');
            }
        } else if(user) { // Se db non è disponibile ma l'utente è loggato
            console.warn("Firestore (db) non disponibile, ruolo utente non verificato. Accesso limitato.");
            currentUserRole = 'operator'; // default a operatore
            document.body.classList.add('operator-mode');
            document.body.classList.remove('admin-mode');
        }
        */
        
        // DEMO SIMPLIFICATA: Se loggato, consideralo admin ai fini dell'UI dei bottoni
        // In un sistema reale, il blocco `if (db && user)` sopra è cruciale.
        if (user) {
            currentUserRole = 'admin'; // Forza admin per la demo se utente è loggato
            document.body.classList.remove('operator-mode');
            document.body.classList.add('admin-mode');
        }

        hideLoginScreenAndShowApp();
        // Solo ora inizializza la logica principale dell'app (filtri, visualizzazione prodotti)
        // Assicurati che 'products' da data.js sia caricato o che carichi da Firestore.
        initializeAppMainLogic();
    }

    function performLogoutCleanup() {
        currentUser = null;
        currentUserRole = null;
        currentFilteredProducts = []; // Pulisci i dati visualizzati
        if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Effettua il login per visualizzare i listini.</p>'; // Messaggio nel grid
        // Nascondi eventuali elementi specifici per admin/utente loggato
        document.body.classList.remove('admin-mode');
        document.body.classList.add('operator-mode'); // Torna a stato base
        showLoginScreen();
    }

    if (auth) { // Controlla che auth sia stato inizializzato
        auth.onAuthStateChanged(user => {
            firebaseAuthInitialized = true;
            if (user) {
                initializeAppForUser(user);
            } else {
                performLogoutCleanup();
            }
        });

        if (submitLoginBtn && loginEmailInput && loginPasswordInput && loginErrorMsg) {
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
                        // Successo: onAuthStateChanged gestirà il resto.
                        console.log("Firebase Auth: Login effettuato", userCredential.user.email);
                    })
                    .catch((error) => {
                        console.error("Firebase Auth: Errore Login:", error);
                        loginErrorMsg.textContent = mapFirebaseAuthError(error.code);
                        if(loginPasswordInput) loginPasswordInput.classList.add('input-error');
                         if(loginEmailInput) loginEmailInput.classList.add('input-error');
                    });
            });
            // Aggiungi listener per Enter key
             if(loginEmailInput) loginEmailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') {e.preventDefault(); submitLoginBtn.click();} });
             if(loginPasswordInput) loginPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') {e.preventDefault(); submitLoginBtn.click();} });
        }

        if (exitAdminButton) { // Questo è il pulsante di Logout ora
            exitAdminButton.addEventListener('click', () => {
                auth.signOut().then(() => {
                    console.log('Firebase Auth: Logout effettuato.');
                    // onAuthStateChanged gestirà il cleanup e la visualizzazione del login.
                }).catch((error) => {
                    console.error('Firebase Auth: Errore durante il logout:', error);
                });
            });
        }
         if (closeLoginPanelBtn && loginPanel) { // Chiudere il pannello di login
            closeLoginPanelBtn.addEventListener('click', () => {
                // Se si chiude il pannello e l'utente non è loggato,
                // onAuthStateChanged (o il timeout di fallback) dovrebbe riaprirlo.
                // Non c'è un'azione specifica da fare qui, a meno che non si voglia impedire la chiusura.
                console.log("Pannello di login chiuso dall'utente.");
            });
        }
    } else {
        console.error("FATAL: Istanza Firebase Auth non disponibile. Il sistema di login è bloccato.");
        handleFatalError("Servizio di autenticazione non disponibile. Impossibile caricare la pagina.");
    }

    // Timeout di fallback nel caso onAuthStateChanged non scatti per qualche motivo anomalo all'inizio
    // o Firebase non si sia inizializzato rapidamente
    setTimeout(() => {
        if (!firebaseAuthInitialized && auth) { // auth esiste ma onAuthStateChanged non è partito
            console.warn("Timeout: onAuthStateChanged non ha risposto. Verifico utente corrente...");
            if (!auth.currentUser) {
                console.log("Nessun utente corrente dopo timeout, forzo visualizzazione login.");
                performLogoutCleanup(); // Mostra il pannello di login
            } else {
                 console.log("Utente corrente trovato dopo timeout, procedo con l'app.");
                 initializeAppForUser(auth.currentUser); // Tenta di inizializzare
            }
        } else if (!auth) { // Se auth è ancora undefined, l'init di Firebase è fallito.
             // L'errore dovrebbe essere già stato gestito nel blocco try/catch dell'inizializzazione.
             // handleFatalError è già stato chiamato.
        }
    }, 2000); // Aumentato leggermente il timeout


    function mapFirebaseAuthError(errorCode) { /* ... (Funzione esistente per mappare errori) ... */
        switch (errorCode) {
            case "auth/invalid-email": case "auth/invalid-credential": return "Formato email non valido o credenziali errate."; // auth/invalid-credential per v9+ email/pass errati
            case "auth/user-disabled": return "Account utente disabilitato.";
            case "auth/user-not-found": return "Nessun utente trovato con questa email."; // Meno comune con v9+ per email/pass
            case "auth/wrong-password": return "Password errata."; // Meno comune con v9+ per email/pass
            case "auth/too-many-requests": return "Accesso bloccato temporaneamente. Riprova più tardi.";
            default: return "Errore di autenticazione: " + errorCode;
        }
    }
    // --- FINE LOGICA AUTENTICAZIONE ---


    // --- EVENT LISTENERS PER FILTRI E TABS (Esistenti) ---
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                // ... (logica esistente per i filtri, adattata leggermente per chiarezza)
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
                const targetSectionId = tab.dataset.section;
                event.preventDefault();
                if (targetSectionId === 'multisplit') {
                    // Assumiamo che la pagina multisplit abbia un URL specifico.
                    // Se è parte della stessa pagina e controllata da JS, la logica sarebbe diversa.
                    window.location.href = '../multisplit/index.html'; // O il percorso corretto
                } else if (targetSectionId === 'monosplit') {
                    // In questa pagina, monosplit è sempre attiva, quindi aggiorniamo solo il tab.
                    sectionTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    // Non c'è bisogno di mostrare/nascondere sezioni qui se c'è solo monosplit.
                }
            });
        });
    }

    if (printButton) { printButton.addEventListener('click', () => { if(currentUser) window.print(); else alert("Devi effettuare il login per stampare."); }); }
    // --- FINE EVENT LISTENERS ---


    // --- INIZIALIZZAZIONE LOGICA PRINCIPALE APP (dopo autenticazione) ---
    function initializeAppMainLogic() {
        console.log("Inizializzazione logica principale dell'app...");
        // Assicurati che 'products' da data.js sia disponibile.
        // Se carichi da Firestore, questo avverrebbe qui o prima.
        if (typeof products === 'undefined' || !Array.isArray(products) || products.length === 0) {
            console.warn("'products' da data.js non caricato. I dati verranno visualizzati vuoti.");
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Caricamento dati prodotti non riuscito o nessun prodotto disponibile.</p>';
            // Non fermare l'app, ma segnala il problema.
        }

        currentBrandFilter = 'all';
        showOnlyEconomic = false;

        // Attiva tab e filtro di default (solo se esistono nel DOM)
        document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
        filterButtons.forEach(btn => btn.classList.remove('active')); // Pulisci tutti i filtri marca
        document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
        const economicBtn = document.querySelector('.filter-btn[data-filter-type="economic"]');
        if (economicBtn) economicBtn.classList.remove('active');


        applyFiltersAndSort(); // Mostra i prodotti iniziali

        // Gestione visibilità pulsante Admin Trigger (non più rilevante se login forzato)
        // if (adminTrigger) adminTrigger.style.display = currentUser ? 'none' : 'inline-flex';
    }
    // L'inizializzazione effettiva avviene tramite `onAuthStateChanged`.
    // Se nessun utente è loggato, verrà mostrato il pannello di login.

}); // Fine DOMContentLoaded
