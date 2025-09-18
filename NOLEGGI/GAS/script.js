document.addEventListener('DOMContentLoaded', () => {
    console.log("gas.js: DOMContentLoaded fired."); // Questo dovrebbe apparire SEMPRE

    // Assicurati che Firebase sia inizializzato globalmente (da firebase-config.js)
    if (typeof firebase === 'undefined' || !window.db || !window.auth) {
        console.error("Firebase non caricato o non inizializzato correttamente. Assicurati che firebase-config.js sia incluso prima.");
        // Reindirizza o mostra un messaggio di errore se Firebase non è disponibile.
        return;
    }
    console.log("gas.js: Firebase is initialized and accessible.");

    const db = window.db; // Firestore instance
    const auth = window.auth; // Auth instance

    // Elementi DOM
    const initialLoader = document.getElementById('initial-loader');
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const gasTableBody = document.getElementById('gas-table-body');
    const gasSearchInput = document.getElementById('gas-search-input');
    const addGasButton = document.getElementById('add-gas-button');
    console.log("gas.js: addGasButton element:", addGasButton); // Vedrai "null" se l'ID non è trovato
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

    // --- Controllo Autenticazione (simile a auth.js) ---
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
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            const depth = pathSegments.length > 2 ? pathSegments.length - 2 : 0;
            const rootPath = '../'.repeat(depth) || './';
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
        console.log("gas.js: Added 'visible' class to modal overlay. Modal should be visible."); // Questo log è ora al posto giusto
    };

    const closeGasModal = () => {
        gasModalOverlay.classList.remove('visible');
        console.log("gas.js: Removed 'visible' class from modal overlay. Modal should be hidden.");
        gasForm.reset();
        hideFeedback();
        gasMatricolaInput.disabled = false;
    };

    // --- EVENT LISTENERS (correttamente separati e posizionati) ---

    // Listener per il pulsante "Aggiungi Bombola"
    if (addGasButton) {
        console.log("gas.js: Attaching click listener to addGasButton.");
        addGasButton.addEventListener('click', () => {
            console.log("gas.js: 'Aggiungi Bombola' button clicked!"); // Questo apparirà al click
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

    // --- Operazioni CRUD (tramite Google Apps Script Web App) ---
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwgHIqzTr9oDZz1mTq9lnB2dSFFkipH60eh6-T31vIY1iZ4NQecRXwdT2EZ377pfXpU/exec'; // Verifica che sia l'URL CORRETTO della tua Web App

    const sendDataToGoogleSheet = async (action, data) => {
        if (WEB_APP_URL === 'YOUR_WEB_APP_URL_HERE' || !WEB_APP_URL.startsWith('https://script.google.com/macros/s/')) { // Migliore controllo
            console.error("ERRORE: WEB_APP_URL non configurato o non valido.");
            showFeedback("Errore di configurazione: URL della Web App non impostato o non valido.", "error");
            return { status: 'error', message: "WEB_APP_URL non configurato." };
        }
        try {
            console.log(`gas.js: Sending ${action} request to Google Sheet for sheet 'gas' with data:`, data);
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    sheetName: 'gas',
                    ...data
                }),
            });
            console.log(`gas.js: Action '${action}' sent. Assuming success (due to no-cors).`);
            return { status: 'success' };
        } catch (error) {
            console.error(`gas.js: Errore di rete nell'invio dati per ${action}:`, error);
            return { status: 'error', message: `Errore di rete: ${error.message}` };
        }
    };

    // --- Gestione Invio Form ---
    if (gasForm) {
        gasForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideFeedback();
            console.log("gas.js: Gas form submitted.");

            const cylinderData = {
                tipologia_gas: gasTipologiaGasInput.value.trim(),
                matricola: gasMatricolaInput.value.trim(),
                litri: parseInt(gasLitriInput.value, 10),
                quantita: parseInt(gasQuantitaInput.value, 10),
                data_ricezione: gasDataRicezioneInput.value,
                noleggiato_a: gasNoleggiatoAInput.value.trim(),
                data_apertura_noleggio: gasDataAperturaNoleggioInput.value,
                data_chiusura_noleggio: gasDataChiusuraNoleggioInput.value,
            };

            if (!cylinderData.tipologia_gas || !cylinderData.matricola || isNaN(cylinderData.litri) || cylinderData.litri < 1 || !cylinderData.noleggiato_a || isNaN(cylinderData.quantita) || cylinderData.quantita < 1) {
                showFeedback('Per favore compila tutti i campi obbligatori con valori validi (Litri e Quantità devono essere numeri positivi).', 'error');
                console.warn("gas.js: Form validation failed.");
                return;
            }

            let result;
            if (isEditMode) {
                const originalMatricola = gasMatricolaOriginalInput.value;
                console.log(`gas.js: Updating cylinder with original matricola: ${originalMatricola}`);
                result = await sendDataToGoogleSheet('update', { ...cylinderData, matricola: originalMatricola });
            } else {
                const isDuplicate = allGasCylinders.some(c => c.matricola === cylinderData.matricola);
                if (isDuplicate) {
                    showFeedback('Esiste già una bombola con questa matricola. Usa una matricola unica.', 'error');
                    console.warn("gas.js: Duplicate matricola detected on add.");
                    return;
                }
                console.log("gas.js: Adding new cylinder.");
                result = await sendDataToGoogleSheet('add', cylinderData);
            }

            if (result.status === 'success') {
                showFeedback('Operazione completata con successo! Aggiorno i dati...', 'success');
                setTimeout(() => {
                    closeGasModal();
                    fetchAndDisplayGasCylinders();
                }, 1500);
            } else {
                showFeedback(`Errore: ${result.message}`, 'error');
            }
        });
    }

    // --- Carica e Mostra Bombole Gas ---
    const fetchAndDisplayGasCylinders = async () => {
        console.log("gas.js: Fetching and displaying gas cylinders from Firestore.");
        try {
            const snapshot = await db.collection('gasCylinders').get();
            allGasCylinders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderGasTable(allGasCylinders);
            console.log(`gas.js: Found ${allGasCylinders.length} gas cylinders.`);
        } catch (error) {
            console.error("gas.js: Errore nel caricamento delle bombole gas da Firestore:", error);
            gasTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Errore nel caricamento delle bombole gas. ${error.message}</td></tr>`;
            if (noGasMessage) noGasMessage.style.display = 'block';
        }
    };

    const renderGasTable = (cylindersToDisplay) => {
        gasTableBody.innerHTML = '';
        if (cylindersToDisplay.length === 0) {
            if (noGasMessage) noGasMessage.style.display = 'block';
            console.log("gas.js: No gas cylinders to display. Showing 'no message'.");
            return;
        }
        if (noGasMessage) noGasMessage.style.display = 'none';

        cylindersToDisplay.forEach(cylinder => {
            const row = gasTableBody.insertRow();
            row.dataset.matricola = cylinder.matricola;
            row.innerHTML = `
                <td>${cylinder.tipologia_gas || 'N/D'}</td>
                <td>${cylinder.matricola || 'N/D'}</td>
                <td>${cylinder.litri || 'N/D'}</td>
                <td>${cylinder.quantita || 'N/D'}</td>
                <td>${cylinder.data_ricezione || 'N/D'}</td>
                <td>${cylinder.noleggiato_a || 'N/D'}</td>
                <td>${cylinder.data_apertura_noleggio || 'N/D'}</td>
                <td>${cylinder.data_chiusura_noleggio || 'N/D'}</td>
                <td class="actions-cell">
                    <button class="action-btn edit" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
        console.log(`gas.js: Rendered ${cylindersToDisplay.length} rows.`);
    };

    // --- Funzionalità di Ricerca ---
    if (gasSearchInput) {
        gasSearchInput.addEventListener('input', () => {
            console.log("gas.js: Search input changed.");
            const query = gasSearchInput.value.toLowerCase().trim();
            const filteredCylinders = allGasCylinders.filter(cylinder =>
                cylinder.tipologia_gas?.toLowerCase().includes(query) ||
                cylinder.matricola?.toLowerCase().includes(query) ||
                String(cylinder.litri)?.includes(query) ||
                cylinder.noleggiato_a?.toLowerCase().includes(query) ||
                String(cylinder.quantita)?.includes(query) ||
                cylinder.data_ricezione?.includes(query) ||
                cylinder.data_apertura_noleggio?.includes(query) ||
                cylinder.data_chiusura_noleggio?.includes(query)
            );
            renderGasTable(filteredCylinders);
        });
    }

    // --- Azioni di Modifica/Eliminazione ---
    if (gasTableBody) {
        gasTableBody.addEventListener('click', async (e) => {
            const row = e.target.closest('tr');
            if (!row) return;

            const matricola = row.dataset.matricola;
            const cylinder = allGasCylinders.find(c => c.matricola === matricola);

            if (!cylinder) {
                console.error("gas.js: Cilindro non trovato per matricola:", matricola);
                return;
            }
            console.log(`gas.js: Action detected for matricola: ${matricola}`);

            if (e.target.closest('.edit')) {
                console.log("gas.js: Edit button clicked.");
                openGasModal(cylinder);
            } else if (e.target.closest('.delete')) {
                console.log("gas.js: Delete button clicked.");
                if (confirm(`Sei sicuro di voler eliminare la bombola matricola ${cylinder.matricola} (${cylinder.tipologia_gas})?`)) {
                    const result = await sendDataToGoogleSheet('delete', { matricola: cylinder.matricola });
                    if (result.status === 'success') {
                        alert('Richiesta di eliminazione inviata. Aggiorno i dati...');
                        setTimeout(() => fetchAndDisplayGasCylinders(), 1500);
                    } else {
                        alert(`Errore durante l'eliminazione: ${result.message}`);
                    }
                }
            }
        });
    }
});
