document.addEventListener('DOMContentLoaded', () => {
    // Verifica che Firebase sia caricato. Questo è un controllo di sicurezza.
    if (typeof firebase === 'undefined') {
        console.error("Firebase non caricato in gas-script.js. Assicurati che firebase-app.js sia incluso prima.");
        // Potresti voler reindirizzare o mostrare un messaggio di errore all'utente
        return;
    }

    // Accedi alle istanze di Firestore e Auth rese globali da firebase-config.js
    // Assicurati che firebase-config.js sia caricato prima di questo script.
    const db = firebase.firestore();
    const auth = firebase.auth(); // Potrebbe servire per controlli futuri, anche se non usato direttamente qui

    // --- CONFIGURAZIONE ESSENZIALE ---
    // Questo è l'URL del NUOVO DEPLOY che hai creato. Lascialo così com'è.
    const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyyBeWhl1rH4flw59NVvNyIFYoVE0cDFlqRfcd0SVWKKAAh4mo0nfJ-O009FpIfUljT/exec'; 
    
    const FIRESTORE_COLLECTION_NAME = 'gasCylinders'; // Nome della collezione Firestore per le bombole gas
    const GOOGLE_SHEET_NAME = 'gas'; // Nome del foglio Google Sheets che lo script Apps Script deve manipolare

    // --- ELEMENTI DOM ---
    const gasTableBody = document.getElementById('gas-table-body');
    const addGasButton = document.getElementById('add-gas-button');
    const gasModalOverlay = document.getElementById('gas-modal-overlay');
    const closeGasModalBtn = document.getElementById('close-gas-modal-btn');
    const cancelGasModalBtn = document.getElementById('cancel-gas-modal-btn');
    const gasModalTitle = document.getElementById('gas-modal-title');
    const gasForm = document.getElementById('gas-form');
    const gasIdField = document.getElementById('gas-id-field'); // Campo nascosto per la matricola originale in caso di modifica
    const matricolaInput = document.getElementById('matricola');
    const tipologiaGasInput = document.getElementById('tipologia_gas');
    const litriInput = document.getElementById('litri');
    const dataRicezioneInput = document.getElementById('data_ricezione');
    const noleggiatoAInput = document.getElementById('noleggiato_a');
    const dataAperturaNoleggioInput = document.getElementById('data_apertura_noleggio');
    const dataChiusuraNoleggioInput = document.getElementById('data_chiusura_noleggio');
    const gasFeedbackMessage = document.getElementById('gas-feedback-message');

    let allGasCylinders = []; // Array per tenere traccia dei dati delle bombole localmente

    // --- FUNZIONI UTILITY ---

    /**
     * Mostra un messaggio di feedback all'utente.
     * @param {string} message Il testo del messaggio.
     * @param {'success'|'error'} type Il tipo di messaggio (per lo styling).
     */
    const showFeedback = (message, type) => {
        gasFeedbackMessage.textContent = message;
        gasFeedbackMessage.className = `feedback-message ${type}`; // Applica la classe per lo stile
        gasFeedbackMessage.classList.remove('hidden');
        setTimeout(() => {
            gasFeedbackMessage.classList.add('hidden'); // Nasconde il messaggio dopo 5 secondi
        }, 5000);
    };

    /**
     * Formatta una stringa data (es. da Firestore) nel formato YYYY-MM-DD per un input HTML type="date".
     * @param {string|Date} dateValue La data da formattare.
     * @returns {string} La data formattata o una stringa vuota se non valida.
     */
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        let date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            date = new Date(dateValue);
        }
        if (isNaN(date.getTime())) return ''; // Data non valida
        return date.toISOString().split('T')[0]; // Estrae solo la parte YYYY-MM-DD
    };

    /**
     * Formatta una stringa data (es. da Firestore) nel formato DD/MM/YY per la visualizzazione nella tabella.
     * @param {string|Date} dateValue La data da formattare.
     * @returns {string} La data formattata o una stringa vuota se non valida.
     */
    const formatDateForDisplay = (dateValue) => {
        if (!dateValue) return '';
        let date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            date = new Date(dateValue);
        }
        if (isNaN(date.getTime())) return ''; // Data non valida
        // Usa toLocaleDateString per un formato localizzato, con anno a 2 cifre
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }); 
    };

    // --- FUNZIONI MODAL ---

    /**
     * Apre il modale per aggiungere o modificare una bombola gas.
     * @param {object|null} cylinderData I dati della bombola da modificare, o null per una nuova bombola.
     */
    const openGasModal = (cylinderData = null) => {
        gasForm.reset(); // Pulisce tutti i campi del form
        gasFeedbackMessage.classList.add('hidden'); // Nasconde eventuali messaggi di feedback precedenti
        gasIdField.value = ''; // Pulisce il campo ID nascosto

        if (cylinderData) {
            // Modalità modifica
            gasModalTitle.textContent = 'Modifica Bombola Gas';
            gasIdField.value = cylinderData.matricola; // Memorizza la matricola originale per l'aggiornamento
            matricolaInput.value = cylinderData.matricola || '';
            matricolaInput.disabled = true; // La matricola non è modificabile in fase di edit
            tipologiaGasInput.value = cylinderData.tipologia_gas || '';
            litriInput.value = cylinderData.litri || 0;
            dataRicezioneInput.value = formatDateForInput(cylinderData.data_ricezione);
            noleggiatoAInput.value = cylinderData.noleggiato_a || '';
            dataAperturaNoleggioInput.value = formatDateForInput(cylinderData.data_apertura_noleggio);
            dataChiusuraNoleggioInput.value = formatDateForInput(cylinderData.data_chiusura_noleggio);
        } else {
            // Modalità aggiunta
            gasModalTitle.textContent = 'Aggiungi Nuova Bombola Gas';
            matricolaInput.disabled = false; // La matricola è modificabile in fase di aggiunta
        }
        gasModalOverlay.classList.add('visible'); // Rende visibile l'overlay del modale
    };

    /**
     * Chiude il modale delle bombole gas.
     */
    const closeGasModal = () => {
        gasModalOverlay.classList.remove('visible'); // Nasconde l'overlay del modale
        gasForm.reset(); // Pulisce il form
        matricolaInput.disabled = false; // Resetta lo stato di disabilitazione della matricola
    };

    // --- INTERAZIONE CON GOOGLE APPS SCRIPT (doPost) ---

    /**
     * Invia una richiesta al Google Apps Script per eseguire un'azione sul foglio Google.
     * @param {'add'|'update'|'delete'} action L'azione da eseguire.
     * @param {object} data I dati da inviare per l'azione.
     * @returns {Promise<boolean>} True se l'operazione ha avuto successo, false altrimenti.
     */
    const sendRequestToAppsScript = (action, data) => {
    // Invia i dati usando la modalità "no-cors", che non attende una risposta.
    // Questo aggira completamente i problemi di CORS.
    fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // <-- La soluzione usata nella pagina Preventivi
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: action,
            sheetName: GOOGLE_SHEET_NAME,
            ...data
        }),
    }).catch(error => {
        // Logga solo errori di rete gravi, ma non blocca l'UI.
        console.error(`Errore di rete nell'inviare l'azione '${action}':`, error);
        // Possiamo mostrare un errore generico se vogliamo
        // showFeedback("Errore di rete. Controlla la connessione.", "error");
    });

    // Mostra un feedback immediato all'utente.
    showFeedback(`Richiesta "${action}" inviata. L'aggiornamento sarà visibile a breve.`, 'success');
    
    // Ritorna subito 'true' per far procedere l'interfaccia utente (es. chiudere il modale).
    return true; 
};

    // --- GESTIONE DATI FIRESTORE E TABELLA ---

    /**
     * Recupera tutte le bombole gas da Firestore e aggiorna la tabella.
     */
    const fetchGasCylinders = async () => {
        try {
            // Recupera i documenti dalla collezione Firestore, ordinandoli per matricola
            const snapshot = await db.collection(FIRESTORE_COLLECTION_NAME).orderBy('matricola').get();
            allGasCylinders = snapshot.docs.map(doc => doc.data()); // Mappa i documenti in oggetti JavaScript
            renderGasTable(allGasCylinders); // Aggiorna la tabella HTML
        } catch (error) {
            console.error("Errore nel recupero delle bombole gas da Firestore:", error);
            showFeedback("Errore nel caricamento delle bombole gas. Riprova più tardi.", "error");
        }
    };

    /**
     * Popola la tabella HTML con i dati delle bombole gas.
     * @param {Array<object>} cylinders L'array di oggetti bombola gas.
     */
    const renderGasTable = (cylinders) => {
        gasTableBody.innerHTML = ''; // Pulisce il contenuto attuale della tabella

        if (cylinders.length === 0) {
            // Se non ci sono bombole, mostra un messaggio nella tabella
            const row = gasTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 8; // Deve coprire tutte le colonne
            cell.textContent = 'Nessuna bombola gas trovata. Aggiungine una!';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            return;
        }

        cylinders.forEach(cylinder => {
            const row = gasTableBody.insertRow();
            row.dataset.matricola = cylinder.matricola; // Aggiunge un attributo data per riferimento rapido

            // Inserisce i dati nelle celle
            row.insertCell().textContent = cylinder.matricola || 'N/D';
            row.insertCell().textContent = cylinder.tipologia_gas || 'N/D';
            row.insertCell().textContent = cylinder.litri !== undefined ? cylinder.litri : 'N/D';
            row.insertCell().textContent = formatDateForDisplay(cylinder.data_ricezione);
            row.insertCell().textContent = cylinder.noleggiato_a || '';
            row.insertCell().textContent = formatDateForDisplay(cylinder.data_apertura_noleggio);
            row.insertCell().textContent = formatDateForDisplay(cylinder.data_chiusura_noleggio);

            // Crea la cella per le azioni (modifica, elimina)
            const actionsCell = row.insertCell();
            actionsCell.className = 'actions-cell';
            
            // Pulsante Modifica
            const editButton = document.createElement('button');
            editButton.className = 'action-btn edit';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.title = 'Modifica Bombola';
            editButton.addEventListener('click', () => openGasModal(cylinder)); // Passa i dati della bombola al modale
            actionsCell.appendChild(editButton);

            // Pulsante Elimina
            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn delete';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.title = 'Elimina Bombola';
            deleteButton.addEventListener('click', () => { // Rimuoviamo 'async'
    if (confirm(`...`)) {
        const success = sendRequestToAppsScript('delete', { matricola: cylinder.matricola });
        if (success) {
            // --- MODIFICA CHIAVE ANCHE QUI ---
            // Rimuovi l'elemento dalla lista locale e ridisegna
            allGasCylinders = allGasCylinders.filter(c => c.matricola !== cylinder.matricola);
            renderGasTable(allGasCylinders);
        }
    }
});
    // --- EVENT LISTENERS ---

    // Apre il modale per aggiungere una nuova bombola
    addGasButton.addEventListener('click', () => openGasModal());

    // Chiude il modale tramite il pulsante 'X'
    closeGasModalBtn.addEventListener('click', closeGasModal);

    // Chiude il modale tramite il pulsante 'Annulla'
    cancelGasModalBtn.addEventListener('click', closeGasModal);

    // Gestisce l'invio del form (aggiunta o modifica)
    gasForm.addEventListener('submit', (e) => { // Rimuoviamo 'async'
    e.preventDefault();

    const isEditing = !!gasIdField.value;
    const currentMatricola = matricolaInput.value.trim();

    if (!isEditing) {
        if (allGasCylinders.find(c => c.matricola === currentMatricola)) {
            showFeedback('Errore: Esiste già una bombola con questa matricola.', 'error');
            return;
        }
    }

    const gasData = {
        matricola: currentMatricola,
        tipologia_gas: tipologiaGasInput.value.trim(),
        litri: parseInt(litriInput.value, 10),
        data_ricezione: dataRicezioneInput.value ? new Date(dataRicezioneInput.value).toISOString() : '',
        noleggiato_a: noleggiatoAInput.value.trim(),
        data_apertura_noleggio: dataAperturaNoleggioInput.value ? new Date(dataAperturaNoleggioInput.value).toISOString() : '',
        data_chiusura_noleggio: dataChiusuraNoleggioInput.value ? new Date(dataChiusuraNoleggioInput.value).toISOString() : '',
    };
    
    let success = false;
    if (isEditing) {
        success = sendRequestToAppsScript('update', { ...gasData, matricola: gasIdField.value });
    } else {
        success = sendRequestToAppsScript('add', gasData);
    }

    if (success) {
        // --- INIZIO MODIFICA CHIAVE ---
        // NON ricarichiamo da Firestore. Aggiorniamo la lista locale e ridisegniamo la tabella.
        if (isEditing) {
            // Trova l'indice della bombola modificata e aggiornala
            const index = allGasCylinders.findIndex(c => c.matricola === gasIdField.value);
            if (index !== -1) {
                allGasCylinders[index] = { ...allGasCylinders[index], ...gasData };
            }
        } else {
            // Aggiungi la nuova bombola in cima alla lista
            allGasCylinders.unshift(gasData); 
        }
        
        // Ordina di nuovo la lista per matricola per coerenza
        allGasCylinders.sort((a, b) => a.matricola.localeCompare(b.matricola));

        renderGasTable(allGasCylinders); // Ridisegna la tabella con i dati aggiornati "finti"
        closeGasModal();
        // --- FINE MODIFICA CHIAVE ---
    }
});

    // --- INIZIALIZZAZIONE ---
    // L'auth.js gestisce la visibilità di app-content e il loader iniziale.
    // Quando app-content diventa visibile (cioè, l'utente è loggato), carichiamo i dati.
    const appContent = document.getElementById('app-content');
    if (appContent) {
        // Crea un MutationObserver per rilevare quando la classe 'hidden' viene rimossa da app-content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {
                    const isHidden = appContent.classList.contains('hidden');
                    if (!isHidden) {
                        // app-content è ora visibile, quindi l'utente è loggato. Carica i dati.
                        fetchGasCylinders();
                    }
                }
            });
        });
        // Inizia a osservare le modifiche all'attributo 'class' di app-content
        observer.observe(appContent, { attributes: true });
    } else {
        // Fallback per ambienti di test o se l'elemento app-content non è presente per qualche motivo
        console.warn("Elemento #app-content non trovato. Caricamento dati bombole gas immediato.");
        fetchGasCylinders();
    }
});
