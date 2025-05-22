// --- CONFIGURAZIONE FIREBASE (DA AGGIUNGERE ALL'INIZIO) ---
    // Assicurati che Firebase SDK sia incluso nell'HTML prima di questo script
    // e che firebaseConfig sia definita.
    /* Esempio:
    const firebaseConfig = {
        apiKey: "TUO_API_KEY",
        // ...altre chiavi config
    };
    firebase.initializeApp(firebaseConfig); // Per SDK v8
    const auth = firebase.auth();           // Per SDK v8
    // const db = firebase.firestore();      // Per SDK v8, se usi Firestore client-side

    // Per SDK v9+:
    // import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
    // import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
    // const app = initializeApp(firebaseConfig);
    // const auth = getAuth(app);
    // const db = getFirestore(app); // Se necessario
    */

    // --- RIFERIMENTO: Per semplicità, userò la sintassi SDK v8 (globale firebase.) ---
    // Se usi v9+, adatta le chiamate (es. onAuthStateChanged(auth, user => {...}) )

    // --- STATO UTENTE E RUOLO ---
    let currentUser = null;
    let currentUserRole = null; // Potresti voler caricare questo dopo il login
    let firebaseAuthInitialized = false;


    // --- VARIABILI ESISTENTI (da adattare/rimuovere se la modalità admin dipende da Firebase) ---
    // let isAdmin = false; // Questa sarà determinata dal ruolo utente Firebase
    // const ADMIN_PASSWORD = "123stella"; // Non più necessaria per l'accesso alla pagina
    let currentFilteredProducts = [];
    let currentBrandFilter = 'all';
    let showOnlyEconomic = false;
    const activeSection = 'monosplit';

    // --- SELETTORI DOM ESISTENTI (alcuni per il login panel andranno aggiornati) ---
    const mainPageContainer = document.querySelector('.container'); // Il container principale dei contenuti
    const headerElement = document.querySelector('.app-header');

    // Pannello di Login (rinominato e adattato da #password-panel)
    const loginPanel = document.getElementById('password-panel'); // Manteniamo ID esistente per CSS
    const closeLoginPanelBtn = document.getElementById('close-panel-btn');
    const loginEmailInput = document.createElement('input'); // Aggiungeremo un input email
    const loginPasswordInput = document.getElementById('admin-password'); // Riutilizziamo per password
    const submitLoginBtn = document.getElementById('submit-password-btn'); // Riutilizziamo per submit
    const loginErrorMsg = document.getElementById('password-error'); // Riutilizziamo per messaggi errore

    // Modifica il pannello per includere l'email
    if (loginPanel && loginPasswordInput && loginErrorMsg) {
        loginPanel.querySelector('h3').textContent = 'Accesso Area Riservata';
        loginPanel.querySelector('p:not(.error-message)').textContent = 'Inserisci email e password per accedere.';
        
        const emailFormGroup = document.createElement('div');
        emailFormGroup.className = 'form-group';
        const emailLabel = document.createElement('label');
        emailLabel.htmlFor = 'login-email-input';
        emailLabel.textContent = 'Email:';
        loginEmailInput.type = 'email';
        loginEmailInput.id = 'login-email-input';
        loginEmailInput.name = 'login-email-input';
        loginEmailInput.required = true;
        emailFormGroup.appendChild(emailLabel);
        emailFormGroup.appendChild(loginEmailInput);
        loginPasswordInput.closest('.form-group').insertAdjacentElement('beforebegin', emailFormGroup);
        loginPasswordInput.placeholder="Password"; // Rimuovi placeholder esistente se c'è

        submitLoginBtn.textContent = "Accedi"; // Testo del pulsante
    }


    const monosplitGrid = document.getElementById('monosplit-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sectionTabs = document.querySelectorAll('.tab-btn');
    const monosplitSection = document.getElementById('monosplit-section');
    const sections = { monosplit: monosplitSection };

    const adminTrigger = document.getElementById('admin-trigger'); // Questo bottone potrebbe ora aprire il login panel se l'utente non è loggato
    const exitAdminButton = document.getElementById('exit-admin-button'); // Questo diventerà il pulsante di Logout
    const printButton = document.getElementById('print-button');

    const tooltipElement = document.getElementById('dimension-tooltip');
    const tooltipUiDimElement = document.getElementById('tooltip-ui-dimensions');
    const tooltipUeDimElement = document.getElementById('tooltip-ue-dimensions');


    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { /* ...invariata... */ }
    function formatPrice(price) { /* ...invariata... */ }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];

    // --- CREAZIONE CARD (Funzione esistente, andrà adattata la parte `actionButtonsHTML`) ---
    function createProductCard(product) {
        if (!product || typeof product !== 'object') return '<div class="product-card error-card">Errore dati prodotto.</div>';
        try {
            // ... (tutta la logica esistente per definire imageUrl, brand, model, etc. RESTA INVARIATA) ...
            const imageUrl = product.image_url || '../images/placeholder.png';
            const brand = product.marca || 'N/D';
            const model = product.modello || 'N/D';
            // ... (altre variabili come prima) ...
            const isMonobloc = brand.toUpperCase() === 'INNOVA';
            const modelDataAttribute = (model || 'nd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

            let actionButtonsHTML = '';
            // La visibilità dei bottoni edit/save/cancel ora dipende da currentUserRole
            if (currentUser && currentUserRole === 'admin') {
                actionButtonsHTML = `
                    <button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button>
                    <button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button>
                    <button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;
            }
            // Aggiungi qui altri bottoni se necessario (es. confronta)
            // actionButtonsHTML += `<button class="btn-compare" data-product-id="${product.id}" title="Aggiungi al confronto"><i class="fas fa-exchange-alt"></i></button>`;

            // Il resto del template della card RESTA INVARIATO fino a:
            return `
               <div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}">
                   {/* ... Contenuto esistente della card ... */}
                   <div class="product-footer">
                       <div class="product-price-value">${formatPrice(product.prezzo)}</div>
                       <div class="action-buttons-container">${actionButtonsHTML}</div>
                   </div>
               </div>`;
        } catch (error) { console.error(`Error creating card ID ${product?.id}`, error); return `<div class="product-card error-card">Err card ID ${product?.id}.</div>`; }
    }
    // --- FINE CREAZIONE CARD ---

    // --- FILTRAGGIO E VISUALIZZAZIONE (Logica interna dovrebbe restare, ma displayProducts chiama addEditListeners) ---
    function applyFiltersAndSort() { /* ...logica invariata... */ }
    function displayProducts(productsToDisplay) {
        /* ...logica interna invariata... */
        // La chiamata a addEditListeners ora dipende dal ruolo
        if (currentUser && currentUserRole === 'admin') {
            addEditListeners();
        }
        if (typeof addTooltipListeners === 'function') addTooltipListeners();
    }
    // --- FINE FILTRAGGIO E VISUALIZZAZIONE ---

    // --- GESTIONE "ADMIN MODE" LOCALE (DA RIMUOVERE O ADATTARE DRASTICAMENTE) ---
    // Queste funzioni verranno sostituite dalla logica di login/logout Firebase
    // function enterAdminMode() { /* Rimuovi o adatta se admin mode è diversa dal semplice login */ }
    // function exitAdminMode() { /* Questa logica sarà gestita da Firebase signOut */ }
    let originalProductData = {}; // Mantenuta per la funzionalità di edit in-place
    function toggleEditMode(productId, isEditing) { /* ...logica invariata (presumendo che controlli `currentUserRole === 'admin'`)... */ }
    function handleEditClick(event) { if (currentUser && currentUserRole === 'admin') { /* ... */ } }
    function handleCancelClick(event) { if (currentUser && currentUserRole === 'admin') { /* ... */ } }
    function handleSaveClick(event) { /* Questa funzione dovrà scrivere su Firestore se implementato */
        if (currentUser && currentUserRole === 'admin') {
            const productId = event.currentTarget.dataset.id;
            const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            if (!card) return;
            const newPrice = card.querySelector('.edit-price-input')?.value;
            const newModel = card.querySelector('.edit-model-input')?.value;

            console.log(`Salvataggio per ID ${productId}: Prezzo: ${newPrice}, Modello: ${newModel}`);
            // QUI, invece di aggiornare solo `products`, dovresti chiamare una funzione
            // per aggiornare i dati in Firestore. Esempio: updateProductInFirestore(productId, {prezzo: parseFloat(newPrice), modello: newModel});
            // E poi ricaricare i dati da Firestore o aggiornare l'array locale 'products'
            // Per ora, manteniamo l'aggiornamento locale e un refresh.
            const productIndex = products.findIndex(p => String(p.id) === String(productId));
            if (productIndex > -1) {
                if (newPrice !== undefined) products[productIndex].prezzo = parseFloat(String(newPrice).replace(',', '.'));
                if (newModel !== undefined) products[productIndex].modello = newModel;
            }
            toggleEditMode(productId, false); // Torna alla modalità visualizzazione
            applyFiltersAndSort(); // Ridisegna
            showToast("Modifiche salvate localmente.", "success"); // Toast per feedback
        }
    }
    function addEditListeners() { /* ... (La logica per aggiungere listener ai bottoni .edit-btn etc. rimane, ma i bottoni sono visibili solo per admin) ... */ }
    // --- FINE GESTIONE "ADMIN MODE" LOCALE ---

    // --- GESTIONE TOOLTIP (Invariata) ---
    /* ... codice tooltip invariato ... */

    // --- LOGICA DI AUTENTICAZIONE FIREBASE ---
    function showLogin() {
        if(mainPageContainer) mainPageContainer.style.display = 'none';
        if(headerElement) headerElement.style.display = 'none'; // Nascondi anche l'header principale
        if(loginPanel) loginPanel.classList.add('visible'); // Usa la classe 'visible' dal tuo CSS per mostrarlo
        if (exitAdminButton) exitAdminButton.style.display = 'none';
        if (adminTrigger) adminTrigger.style.display = 'none'; // Nascondi trigger se il login è attivo
    }

    function hideLoginAndShowApp() {
        if(loginPanel) loginPanel.classList.remove('visible');
        if(mainPageContainer) mainPageContainer.style.display = 'block'; // O come era prima
        if(headerElement) headerElement.style.display = 'flex';
        if (exitAdminButton) exitAdminButton.style.display = currentUser ? 'inline-flex' : 'none';
        // adminTrigger non serve più se l'accesso è controllato da Firebase
    }

    function initializeAppWithUser(user) {
        currentUser = user;
        // Qui dovresti recuperare il ruolo dell'utente da Firestore (dalla collezione /users/{userId})
        // Per ora, assumiamo che se l'utente è loggato, è admin per questa demo.
        // In un'app reale:
        // const userDocRef = firebase.firestore().collection('users').doc(user.uid);
        // userDocRef.get().then(doc => {
        //    if (doc.exists && doc.data().role === 'admin') {
        //        currentUserRole = 'admin';
        //    } else {
        //        currentUserRole = 'operator'; // o null se non ha un ruolo definito
        //    }
        //    document.body.classList.toggle('admin-mode', currentUserRole === 'admin');
        //    document.body.classList.toggle('operator-mode', currentUserRole !== 'admin');
        //    initializeAppLogic(); // Inizializza filtri, prodotti ecc.
        // }).catch(error => {
        //    console.error("Errore nel recuperare il ruolo utente:", error);
        //    currentUserRole = null; // Fallback
        //    initializeAppLogic();
        // });
        
        // DEMO: Se loggato, consideralo admin per ora
        currentUserRole = 'admin'; 
        document.body.classList.remove('operator-mode');
        document.body.classList.add('admin-mode'); // Abilita sempre admin mode se loggato (per DEMO)

        hideLoginAndShowApp();
        initializeAppLogic(); // Funzione che carica i dati e imposta i filtri
    }

    function handleLogout() {
        currentUser = null;
        currentUserRole = null;
        document.body.classList.remove('admin-mode');
        document.body.classList.add('operator-mode');
        showLogin();
        if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Effettua il login per visualizzare i prodotti.</p>';
    }

    // Listener di Firebase Auth (deve essere dopo l'inizializzazione di Firebase)
    // Assicurati che `auth` sia definito globalmente o passato qui.
    if (typeof firebase !== 'undefined' && firebase.auth) { // Verifica che Firebase sia caricato
        const auth = firebase.auth();
        auth.onAuthStateChanged(user => {
            firebaseAuthInitialized = true;
            if (user) {
                initializeAppWithUser(user);
            } else {
                handleLogout();
            }
        });

        // Event Listener per il submit del Login
        if (submitLoginBtn && loginEmailInput && loginPasswordInput) {
            submitLoginBtn.addEventListener('click', () => {
                const email = loginEmailInput.value.trim();
                const password = loginPasswordInput.value;
                if(loginErrorMsg) loginErrorMsg.textContent = '';

                if (!email || !password) {
                    if(loginErrorMsg) loginErrorMsg.textContent = 'Email e password sono obbligatori.';
                    return;
                }
                signInWithEmailAndPassword(auth, email, password) // SDK v9: signInWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        // onAuthStateChanged gestirà il resto
                        console.log("Login via Firebase Auth OK:", userCredential.user.email);
                    })
                    .catch((error) => {
                        console.error("Errore Firebase Login:", error);
                        if(loginErrorMsg) loginErrorMsg.textContent = mapFirebaseAuthError(error.code); // Funzione da creare/adattare
                        if(loginPasswordInput) loginPasswordInput.classList.add('input-error');
                    });
            });
            if(loginPasswordInput) loginPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitLoginBtn.click(); });
            if(loginEmailInput) loginEmailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitLoginBtn.click(); });

        }

        // Event Listener per il Logout (pulsante exitAdminButton)
        if (exitAdminButton) {
            exitAdminButton.addEventListener('click', () => {
                signOut(auth).then(() => { // SDK v9: signOut(auth)
                    console.log('Logout Firebase effettuato');
                    // onAuthStateChanged gestirà il resto
                }).catch((error) => {
                    console.error('Errore durante il logout Firebase:', error);
                });
            });
        }
    } else {
        console.error("Firebase Auth non inizializzato! Il login non funzionerà.");
        // Fallback o messaggio all'utente
        showLogin(); // Mostra comunque il pannello, ma il login non andrà a buon fine
        if(loginErrorMsg) loginErrorMsg.textContent = "Errore: servizio di autenticazione non disponibile.";
    }
    
    // Funzione per mappare errori Firebase Auth (simile a quella per Matrice Sconti)
    function mapFirebaseAuthError(errorCode) {
        switch (errorCode) {
            case "auth/invalid-email": return "Formato email non valido.";
            case "auth/user-disabled": return "Account utente disabilitato.";
            case "auth/user-not-found": return "Nessun utente trovato con questa email.";
            case "auth/wrong-password": return "Password errata.";
            case "auth/too-many-requests": return "Accesso bloccato temporaneamente a causa di troppi tentativi. Riprova più tardi.";
            default: return "Credenziali non valide o errore di autenticazione.";
        }
    }
    // --- FINE LOGICA AUTENTICAZIONE FIREBASE ---


    // --- EVENT LISTENERS ESISTENTI (Filtri, Tabs, Stampa) ---
    if (filterButtons.length > 0) { /* ... logica invariata ... */ }
    if (sectionTabs.length > 0) { /* ... logica invariata ... */ }
    if (printButton) { printButton.addEventListener('click', () => { window.print(); }); }

    // Non serve più il trigger del pannello password se il login è forzato
    // if (adminTrigger && loginPanel) {
    //     adminTrigger.addEventListener('click', () => loginPanel.classList.add('visible'));
    // }
    if (closeLoginPanelBtn && loginPanel) { // Listener per chiudere il pannello login
        closeLoginPanelBtn.addEventListener('click', () => {
             // In un sistema reale, chiudere il pannello senza loggarsi non dovrebbe dare accesso
             // Ma per ora, se hai un bottone chiudi, potrebbe semplicemente nasconderlo.
             // loginPanel.classList.remove('visible');
             // Se vuoi che rimanga forzato, non fare nulla o reindirizza.
             // Se l'utente chiude e non è loggato, onAuthStateChanged lo mostrerà di nuovo.
        });
    }

    // --- INIZIALIZZAZIONE APP (ORA CHIAMATA DOPO LOGIN) ---
    function initializeAppLogic() { // Rinominata da initializeApp
        // Verifica che 'products' (da data.js) sia definito
        if (typeof products === 'undefined' || !Array.isArray(products) || products.length === 0) {
            console.warn("'products' (da data.js) non è definito o è vuoto. Visualizzazione prodotti basata su di esso fallirà.");
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto disponibile o errore caricamento dati iniziali.</p>';
            // Anche se i dati vengono da Firestore, questa variabile 'products' locale potrebbe essere un fallback o per test
            // return; // Esci se i dati base mancano
        }

        currentBrandFilter = 'all';
        showOnlyEconomic = false;
        document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
        // Resetta e attiva il filtro "Tutte le Marche"
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');

        applyFiltersAndSort();
        
        // Mostra pulsante di logout se utente è loggato (già gestito in hideLoginAndShowApp)
        if (exitAdminButton && currentUser) {
            exitAdminButton.style.display = 'inline-flex';
        }
         if (adminTrigger && !currentUser) { // Mostra admin trigger solo se non loggato (improbabile arrivarci qui)
            adminTrigger.style.display = 'inline-flex';
        } else if (adminTrigger) {
             adminTrigger.style.display = 'none';
        }


    }
    // L'inizializzazione principale dell'app (initializeAppLogic) ora viene chiamata
    // da onAuthStateChanged dopo che lo stato dell'utente è determinato.
    // Se Firebase non è inizializzato, onAuthStateChanged non partirà, quindi prevedi un fallback.
    // Aggiungiamo un timeout per dare tempo a Firebase di inizializzarsi se `onAuthStateChanged` non scatta subito.
    setTimeout(() => {
        if (!firebaseAuthInitialized && typeof firebase !== 'undefined' && firebase.auth) {
             // Se dopo un breve ritardo onAuthStateChanged non è ancora scattato,
             // potrebbe esserci un problema con l'init di Firebase o l'utente è effettivamente non loggato.
             // In tal caso, mostriamo il login panel.
             const authCheck = firebase.auth();
             if (!authCheck.currentUser) {
                 console.log("Nessun utente corrente dopo timeout, mostro login.");
                 handleLogout(); // Forzerà la visualizzazione del pannello di login
             }
        } else if (!firebaseAuthInitialized) {
            // Firebase non sembra caricato affatto.
             console.error("Firebase Auth SDK non disponibile. Mostro pannello login di fallback.");
             handleLogout(); // o una schermata di errore più specifica
        }
    }, 1500); // 1.5 secondi di attesa

}); // Fine DOMContentLoaded
Use code with caution.
JavaScript
Spiegazione delle modifiche chiave in script (5).js:
Inizializzazione Firebase (Commentata): Devi aggiungere il tuo firebaseConfig e inizializzare Firebase (firebase.initializeApp) e Auth (firebase.auth()).
Stato Utente: currentUser e currentUserRole per tenere traccia dell'utente loggato e del suo ruolo.
Modifica Pannello Login: Il #password-panel esistente è stato modificato al volo per aggiungere un campo email e aggiornare i testi.
onAuthStateChanged: È il cuore della gestione della sessione.
Se user esiste, chiama initializeAppWithUser (che a sua volta chiama initializeAppLogic per caricare i dati e visualizzare i prodotti).
Se user è null, chiama handleLogout che mostra il pannello di login e pulisce la UI.
Login Handler (submitLoginBtn): Usa signInWithEmailAndPassword per tentare il login con Firebase.
Logout Handler (exitAdminButton): Usa signOut per disconnettere l'utente.
Logica Admin Locale Rimossa/Adattata:
La visibilità dei bottoni di modifica (actionButtonsHTML in createProductCard) ora dipende da currentUserRole === 'admin'.
Le funzioni enterAdminMode ed exitAdminMode originali non sono più necessarie per l'accesso base; handleLogout e initializeAppWithUser gestiscono lo stato della UI.
Il #admin-trigger originale non dovrebbe più essere necessario per attivare la "modalità admin"; il login Firebase lo fa. Potrebbe essere usato per richiamare il pannello di login se l'utente chiude il modale per errore.
Recupero Ruolo (Commentato): Ho incluso un commento su come potresti recuperare il ruolo utente da Firestore (/users/{uid}). Per questa demo, ho semplificato assumendo che chiunque si logghi sia "admin" ai fini della visualizzazione dei bottoni di modifica. Per un'app reale, devi implementare correttamente il recupero del ruolo.
Timeout per Inizializzazione Auth: Aggiunto un piccolo timeout per mostrare il login panel se onAuthStateChanged non scatta subito (potrebbe succedere se Firebase non si inizializza o non c'è utente).
Sostituzione isAdmin: La variabile globale isAdmin non viene più usata per determinare la modalità. Ora si basa su currentUser e currentUserRole. Devi cercare tutti gli usi di if (isAdmin) e sostituirli con if (currentUser && currentUserRole === 'admin').
Prima di testare:
Aggiungi il tuo firebaseConfig all'inizio di script (5).js.
Assicurati che l'SDK Firebase sia correttamente incluso nel tuo index (8).html (specialmente firebase-app.js e firebase-auth.js).
Verifica gli ID degli elementi DOM che vengono manipolati per il pannello di login, assicurandoti che corrispondano a quelli nel tuo HTML.
Crea utenti di test nella console Firebase Authentication (Email/Password).
(Opzionale, ma raccomandato per un sistema reale) Implementa il recupero del ruolo utente da Firestore per distinguere veramente gli admin dagli utenti normali.
Questo dovrebbe darti un solido sistema di login basato su Firebase per la tua pagina Listino Climatizzatori!

    document.body.classList.add('operator-mode');

    // Selezione elementi DOM principali
    const monosplitGrid = document.getElementById('monosplit-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sectionTabs = document.querySelectorAll('.tab-btn');
    const monosplitSection = document.getElementById('monosplit-section');
    const sections = { monosplit: monosplitSection }; // Manteniamo solo monosplit

    // Selettori Header
    const adminTrigger = document.getElementById('admin-trigger');
    const exitAdminButton = document.getElementById('exit-admin-button');
    const printButton = document.getElementById('print-button');

    // Elementi Tooltip
    const tooltipElement = document.getElementById('dimension-tooltip');
    const tooltipUiDimElement = document.getElementById('tooltip-ui-dimensions');
    const tooltipUeDimElement = document.getElementById('tooltip-ue-dimensions');

    // --- VERIFICHE INIZIALI ---
    if (typeof products === 'undefined' || !Array.isArray(products)) { console.error("CRITICAL ERROR: 'products' array not found or invalid."); handleFatalError("Errore critico: impossibile caricare i dati dei prodotti."); return; }
    if (!tooltipElement || !tooltipUiDimElement || !tooltipUeDimElement) { console.warn("Tooltip elements missing. Tooltip functionality disabled."); window.addTooltipListeners = () => {}; }
    if (!monosplitGrid || !monosplitSection) { console.error("CRITICAL ERROR: Monosplit grid or section elements missing."); handleFatalError("Errore critico: elementi della pagina mancanti."); return; }
    // --- FINE VERIFICHE ---

    // --- FUNZIONI UTILITY ---
    function handleFatalError(message) { document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red; font-size: 1.2em;">${message}</div>`; }
    function formatPrice(price) { if (price === null || price === undefined || price === '') { return 'N/D'; } let numericPrice = NaN; if (typeof price === 'number') { numericPrice = price; } else if (typeof price === 'string') { try { const cleanedPrice = price.replace(/[^0-9,.-]/g, ''); const normalizedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.'); numericPrice = parseFloat(normalizedPrice); } catch (e) { /* Ignora */ } } if (!isNaN(numericPrice)) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice); } else { return 'N/D'; } }
    const economicModels = ['THOR', 'SEIYA CLASSIC', 'HR', 'SENSIRA', 'REVIVE', 'LIBERO SMART'];
    // --- FINE FUNZIONI UTILITY ---

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
            if (isAdmin) actionButtonsHTML = `<button class="edit-btn" data-id="${product.id}" title="Modifica dati prodotto"><i class="fas fa-pencil-alt"></i></button><button class="save-btn" data-id="${product.id}" style="display: none;" title="Salva modifiche"><i class="fas fa-save"></i></button><button class="cancel-btn" data-id="${product.id}" style="display: none;" title="Annulla modifiche"><i class="fas fa-times"></i></button>`;
            return `
               <div class="product-card" data-product-id="${product.id}" data-brand="${brand.toUpperCase()}" data-model="${modelDataAttribute}">
                   <div class="card-top-right-elements">${economicBadgeHTML}${wifiIconHTML}</div>
                   <div class="product-header"> <img src="${logoPath}" alt="Logo ${brand}" class="product-logo" onerror="this.onerror=null; this.src='${placeholderLogoPath}';"> <div class="product-title-brand"> <span class="product-brand-text">${brand}</span> <h3 class="product-model">${model}</h3> </div> </div>
                   <img src="${imageUrl}" alt="Immagine ${model}" class="product-image" onerror="this.onerror=null; this.src='../images/placeholder.png';">
                   <div class="product-info"> <div class="product-details"> <p class="product-info-text"><strong>Potenza:</strong> <span class="product-power">${power}</span></p> <p class="energy-class product-info-text"><strong>Classe En.:</strong> <span class="cooling product-energy-cooling" title="Raffrescamento">${energyCooling}</span> / <span class="heating product-energy-heating" title="Riscaldamento">${energyHeating}</span></p> ${productCodeHTML} ${dimensionsHTML} ${datasheetLink} </div> <div class="product-footer"> <div class="product-price-value">${formatPrice(product.prezzo)}</div> <div class="action-buttons-container">${actionButtonsHTML}</div> </div> </div>
               </div>`;
        } catch (error) { console.error(`Error creating card ID ${product?.id}`, error); return `<div class="product-card error-card">Err card ID ${product?.id}.</div>`; }
    }
    // --- FINE CREAZIONE CARD ---

    // --- FILTRAGGIO, ORDINAMENTO E VISUALIZZAZIONE (Solo Monosplit) ---
    function applyFiltersAndSort() {
        if (!Array.isArray(products)) { console.error("Cannot filter, 'products' invalid."); currentFilteredProducts = []; displayProducts(currentFilteredProducts); return; }
        let filtered = [];
        try {
            filtered = [...products];
            // Filtra SOLO per tipo MONOSPLIT (o default se tipo manca)
            filtered = filtered.filter(p => !p.tipo || p.tipo.toLowerCase() === 'monosplit');

            if (currentBrandFilter !== 'all') { filtered = filtered.filter(p => p && p.marca && p.marca.toUpperCase() === currentBrandFilter); }
            if (showOnlyEconomic) { filtered = filtered.filter(p => p && p.modello && economicModels.includes(p.modello.toUpperCase())); }
            if (!Array.isArray(filtered)) { throw new Error("Filtering resulted in invalid data type."); }
            filtered.sort((a, b) => { const priceA = (a && typeof a.prezzo === 'number' && !isNaN(a.prezzo)) ? a.prezzo : Infinity; const priceB = (b && typeof b.prezzo === 'number' && !isNaN(b.prezzo)) ? b.prezzo : Infinity; return priceA - priceB; });
        } catch (error) { console.error("Error filtering/sorting:", error); filtered = []; handleFatalError("Errore applicazione filtri."); }
        currentFilteredProducts = filtered;
        displayProducts(currentFilteredProducts);
    }

    function displayProducts(productsToDisplay) {
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
    }
    // --- FINE FILTRAGGIO E VISUALIZZAZIONE ---

    // --- GESTIONE ADMIN ---
    function enterAdminMode() { isAdmin = true; document.body.classList.remove('operator-mode'); document.body.classList.add('admin-mode'); if (adminTrigger) adminTrigger.style.display = 'none'; if (exitAdminButton) exitAdminButton.style.display = 'inline-flex'; applyFiltersAndSort(); }
    function exitAdminMode() { isAdmin = false; document.body.classList.remove('admin-mode'); document.body.classList.add('operator-mode'); if (adminTrigger) adminTrigger.style.display = 'inline-flex'; if (exitAdminButton) exitAdminButton.style.display = 'none'; document.querySelectorAll('.edit-price-input, .edit-model-input').forEach(input => { const card = input.closest('.product-card'); if (card) { const productId = card.dataset.productId; toggleEditMode(productId, false); } }); applyFiltersAndSort(); }
    let originalProductData = {};
    function toggleEditMode(productId, isEditing) { /* ... (Codice toggleEditMode invariato - presumo sia corretto) ... */ }
    function handleEditClick(event) { if (isAdmin) { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, true); } }
    function handleCancelClick(event) { if (isAdmin) { const productId = event.currentTarget.dataset.id; toggleEditMode(productId, false); } }
    function handleSaveClick(event) { if (isAdmin) { /* ... (Codice save invariato - presumo sia corretto) ... */ applyFiltersAndSort(); } }
    function addEditListeners() { /* ... (Codice addEditListeners invariato - presumo sia corretto) ... */ }
    // --- FINE GESTIONE ADMIN ---

    // --- GESTIONE TOOLTIP ---
    function positionTooltip(event) { /* ... (Codice positionTooltip invariato - presumo sia corretto) ... */ }
    if (typeof window.addTooltipListeners === 'undefined') { window.addTooltipListeners = () => {}; }
    window.addTooltipListeners = function() { /* ... (Codice addTooltipListeners invariato - presumo sia corretto) ... */ }
    function handleTooltipMouseEnter(event) { /* ... (Codice handleTooltipMouseEnter invariato - presumo sia corretto) ... */ }
    function handleTooltipMouseLeave() { /* ... (Codice handleTooltipMouseLeave invariato - presumo sia corretto) ... */ }
    // --- FINE GESTIONE TOOLTIP ---


    // --- EVENT LISTENERS ---
    // Filtri (MODIFICATO)
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const clickedButton = event.currentTarget;
                const filterType = clickedButton.dataset.filterType; // Es. 'economic'
                const brandToFilter = clickedButton.dataset.brand;   // Es. 'DAIKIN', 'SAMSUNG', 'all'

                // console.log('Clicked filter button:', { filterType, brandToFilter, buttonElement: clickedButton }); // Per debug

                if (filterType === 'economic') {
                    // Gestione del bottone "Economico"
                    showOnlyEconomic = !showOnlyEconomic; // Toggle dello stato
                    clickedButton.classList.toggle('active', showOnlyEconomic); // Aggiorna classe CSS
                    // console.log('showOnlyEconomic Toggled:', showOnlyEconomic); // Per debug
                } else if (brandToFilter) {
                    // Gestione dei bottoni filtro per marca
                    // (include "TUTTI MARCHI" che ha data-brand="all")

                    // 1. Rimuovi 'active' da tutti i bottoni di marca
                    filterButtons.forEach(btn => {
                        if (btn.dataset.brand) { // Solo quelli con data-brand
                            btn.classList.remove('active');
                        }
                    });

                    // 2. Aggiungi 'active' al bottone marca cliccato
                    clickedButton.classList.add('active');

                    // 3. Aggiorna currentBrandFilter.
                    if (brandToFilter.toLowerCase() === 'all') {
                        currentBrandFilter = 'all';
                    } else {
                        currentBrandFilter = brandToFilter.toUpperCase();
                    }
                    // console.log('currentBrandFilter set to:', currentBrandFilter); // Per debug
                }
                // Applica i filtri e ridisegna i prodotti
                applyFiltersAndSort();
            });
        });
    } else {
        console.warn("Filter buttons not found.");
    }

    // Tabs Sezioni (MODIFICATO)
    if (sectionTabs.length > 0) {
        sectionTabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                const targetSection = tab.dataset.section;
                event.preventDefault();
                if (targetSection === 'multisplit') {
                    window.location.href = '../multisplit/index.html';
                } else if (targetSection === 'monosplit') {
                    sectionTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                }
            });
        });
    } else { console.warn("Section tab buttons not found."); }

    // Pannello Password (logica invariata - presumo sia corretta)
    if (adminTrigger && passwordPanel && closePanelButton && passwordInput && submitPasswordButton && passwordError) {
        adminTrigger.addEventListener('click', () => passwordPanel.classList.add('visible'));
        closePanelButton.addEventListener('click', () => {
            passwordPanel.classList.remove('visible');
            passwordInput.value = '';
            passwordError.textContent = '';
            passwordInput.classList.remove('input-error');
        });
        submitPasswordButton.addEventListener('click', () => {
            if (passwordInput.value === ADMIN_PASSWORD) {
                enterAdminMode();
                passwordPanel.classList.remove('visible');
                passwordInput.value = '';
                passwordError.textContent = '';
                passwordInput.classList.remove('input-error');
            } else {
                passwordError.textContent = 'Password errata.';
                passwordInput.classList.add('input-error');
                passwordInput.focus();
            }
        });
        passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitPasswordButton.click(); });
    } else { console.warn("Password panel elements missing or incomplete."); }

    // Bottone Uscita Admin (logica invariata)
    if (exitAdminButton) { exitAdminButton.addEventListener('click', exitAdminMode); } else { console.warn("Exit admin button not found."); }
    // Bottone Stampa (logica invariata)
    if (printButton) { printButton.addEventListener('click', () => { window.print(); }); } else { console.warn("Print button not found."); }
    // --- FINE EVENT LISTENERS ---


    // --- INIZIALIZZAZIONE APP ---
    function initializeApp() {
        if (products && products.length > 0) {
            currentBrandFilter = 'all';
            showOnlyEconomic = false;
            document.querySelector('.tab-btn[data-section="monosplit"]')?.classList.add('active');
            document.querySelector('.filter-btn[data-brand="all"]')?.classList.add('active');
            applyFiltersAndSort();
        } else {
            if(monosplitGrid) monosplitGrid.innerHTML = '<p class="no-results">Nessun prodotto disponibile.</p>';
            if (monosplitSection) monosplitSection.style.display = 'block';
        }
    }
    initializeApp();
    // --- FINE INIZIALIZZAZIONE ---

}); // Fine DOMContentLoaded
