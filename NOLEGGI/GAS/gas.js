document.addEventListener('DOMContentLoaded', () => {
    console.log("gas.js: DOMContentLoaded fired.");

    // Assicurati che Firebase sia inizializzato globalmente (da firebase-config.js)
    if (typeof firebase === 'undefined' || !window.db || !window.auth) {
        console.error("Firebase non caricato o non inizializzato correttamente. Assicurati che firebase-config.js sia incluso prima.");
        return;
    }
    console.log("gas.js: Firebase is initialized and accessible.");

    const db = window.db;
    const auth = window.auth;

    // Elementi DOM
    const initialLoader = document.getElementById('initial-loader');
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const gasTableBody = document.getElementById('gas-table-body');
    const gasSearchInput = document.getElementById('gas-search-input');
    const addGasButton = document.getElementById('add-gas-button');
    console.log("gas.js: addGasButton element:", addGasButton);
    const noGasMessage = document.getElementById('no-gas-message');

    // Elementi del Modal Bombole Gas
    const gasModalOverlay = document.getElementById('gas-modal-overlay');
    const closeGasModalBtn = document.getElementById('close-gas-modal-btn');
    const cancelGasModalBtn = document.getElementById('cancel-gas-modal-btn');
    const gasForm = document.getElementById('gas-form');
    const gasModalTitle = document.getElementById('gas-modal-title');
    const gasFormFeedback = document.getElementById('gas-form-feedback');

    const gasTipologiaGasInput = document.getElementById('gas-tipologia-gas');
    const gasMatricolaInput = document.getElementById('gas-matricola');
    const gasMatricolaOriginalInput = document.getElementById('gas-form-matricola-original');
    const gasLitriInput = document.getElementById('gas-litri');
    const gasQuantitaInput = document.getElementById('gas-quantita');
    const gasDataRicezioneInput = document.getElementById('gas-data-ricezione');
    const gasNoleggiatoAInput = document.getElementById('gas-noleggiato-a');
    const gasDataAperturaNoleggioInput = document.getElementById('gas-data-apertura-noleggio');
    const gasDataChiusuraNoleggioInput = document.getElementById('gas-data-chiusura-noleggio');

    let allGasCylinders = [];
    let isEditMode = false;

    // --- Controllo Autenticazione ---
    auth.onAuthStateChanged(user => {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.style.visibility = 'visible';

        if (user) {
            console.log("gas.js: Utente autenticato:", user.email);
            if (userDashboard) {
                userDashboard.classList.remove('hidden');
                userEmailDisplay.textContent = user.email;
            }
            fetchAndDisplayGasCylinders();
        } else {
            console.log("gas.js: Utente non loggato, reindirizzo alla home.");
            // Risale due livelli per tornare alla root (da NOLEGGI/GAS/index.html a index.html)
            const rootPath = '../../'; 
            window.location.href = `${rootPath}index.html`;
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log("gas.js: Logout button clicked.");
            auth.signOut();
        });
    }

    // --- Funzioni di Utilità ---
    const showFeedback = (message, type) => {
        gasFormFeedback.textContent = message;
        gasFormFeedback.className = `feedback-message ${type}`;
        gasFormFeedback.classList.remove('hidden');
    };

    const hideFeedback = () => {
        gasFormFeedback.classList.add('hidden');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.warn("gas.js: Could not parse date string:", dateString, e);
            return dateString;
        }
    };

    // --- Logica Modal ---
    const openGasModal = (cylinderData = null) => {
        console.log("gas.js: openGasModal called with data:", cylinderData);
        gasForm.reset();
        hideFeedback();
        isEditMode = !!cylinderData;

        if (isEditMode) {
            gasModalTitle.textContent = 'Modifica Bombola Gas';
            gasTipologiaGasInput.value = cylinderData.tipologia_gas || '';
            gasMatricolaInput.value = cylinderData.matricola || '';
            gasMatricolaOriginalInput.value = cylinderData.matricola || '';
            gasMatricolaInput.disabled = true;
            gasLitriInput.value = cylinderData.litri || '';
            gasQuantitaInput.value = cylinderData.quantita || '';
            gasDataRicezioneInput.value = formatDate(cylinderData.data_ricezione);
            gasNoleggiatoAInput.value = cylinderData.noleggiato_a || '';
            gasDataAperturaNoleggioInput.value = formatDate(cylinderData.data_apertura_noleggio);
            gasDataChiusuraNoleggioInput.value = formatDate(cylinderData.data_chiusura_noleggio);
        } else {
            gasModalTitle.textContent = 'Aggiungi Nuova Bombola Gas';
            gasMatricolaInput.disabled = false;
            gasMatricolaOriginalInput.value = '';
        }
        gasModalOverlay.classList.add('visible');
        console.log("gas.js: Added 'visible' class to modal overlay. Modal should be visible.");
    };

    const closeGasModal = () => {
        gasModalOverlay.classList.remove('visible');
        console.log("gas.js: Removed 'visible' class from modal overlay. Modal should be hidden.");
        gasForm.reset();
        hideFeedback();
        gasMatricolaInput.disabled = false;
    };

    // --- EVENT LISTENERS ---

    // Listener per il pulsante "Aggiungi Bombola"
    if (addGasButton) {
        console.log("gas.js: Attaching click listener to addGasButton.");
        addGasButton.addEventListener('click', () => {
            console.log("gas.js: 'Aggiungi Bombola' button clicked!");
            openGasModal();
        });
    }

    // Listener per i pulsanti di chiusura/annullamento del modal
    if (closeGasModalBtn) {
        console.log("gas.js: Attaching click listener to closeGasModalBtn.");
        closeGasModalBtn.addEventListener('click', closeGasModal);
    }
    if (cancelGasModalBtn) {
        console.log("gas.js: Attaching click listener to cancelGasModalBtn.");
        cancelGasModalBtn.addEventListener('click', closeGasModal);
    }

    // Listener per chiudere il modal cliccando sull'overlay
    if (gasModalOverlay) {
        console.log("gas.js: Attaching click listener to gasModalOverlay.");
        gasModalOverlay.addEventListener('click', (e) => {
            if (e.target === gasModalOverlay) closeGasModal();
        });
    }
