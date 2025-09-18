document.addEventListener('DOMContentLoaded', () => {
    // Assicurati che Firebase sia inizializzato globalmente (da firebase-config.js)
    if (typeof firebase === 'undefined' || !window.db || !window.auth) {
        console.error("Firebase non caricato o non inizializzato correttamente. Assicurati che firebase-config.js sia incluso prima.");
        // Reindirizza o mostra un messaggio di errore se Firebase non è disponibile.
        return;
    }

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
    const gasMatricolaOriginalInput = document.getElementById('gas-form-matricola-original'); // Campo nascosto per la matricola originale in caso di modifica
    const gasLitriInput = document.getElementById('gas-litri');
    const gasQuantitaInput = document.getElementById('gas-quantita'); // MODIFICATO: per ordine
    const gasDataRicezioneInput = document.getElementById('gas-data-ricezione'); // MODIFICATO: per ordine
    const gasNoleggiatoAInput = document.getElementById('gas-noleggiato-a'); // MODIFICATO: per ordine
    const gasDataAperturaNoleggioInput = document.getElementById('gas-data-apertura-noleggio');
    const gasDataChiusuraNoleggioInput = document.getElementById('gas-data-chiusura-noleggio');

    let allGasCylinders = []; // Array per memorizzare tutte le bombole caricate
    let isEditMode = false;

    // --- Controllo Autenticazione (simile a auth.js) ---
    auth.onAuthStateChanged(user => {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.style.visibility = 'visible'; // Rendi visibile il body dopo il loader

        if (user) {
            console.log("Utente autenticato su pagina Gestione Gas:", user.email);
            if (userDashboard) {
                userDashboard.classList.remove('hidden');
                userEmailDisplay.textContent = user.email;
            }
            // Solo se autenticato, carica e mostra le bombole gas
            fetchAndDisplayGasCylinders();
        } else {
            console.log("Utente non loggato, reindirizzo alla home dalla pagina Gas...");
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            const depth = pathSegments.length > 2 ? pathSegments.length - 2 : 0; // Risali due livelli dalla cartella GAS
            const rootPath = '../'.repeat(depth) || './';
            window.location.href = `${rootPath}index.html`;
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
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
        // Assicurati che il formato sia YYYY-MM-DD per gli input type="date"
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) { // Check for invalid date
                return dateString; // Return original if invalid
            }
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.warn("Could not parse date string:", dateString, e);
            return dateString;
        }
    };


    // --- Logica Modal ---
    const openGasModal = (cylinderData = null) => {
        gasForm.reset();
        hideFeedback();
        isEditMode = !!cylinderData; // Se ci sono dati, siamo in modalità modifica

        if (isEditMode) {
            gasModalTitle.textContent = 'Modifica Bombola Gas';
            gasTipologiaGasInput.value = cylinderData.tipologia_gas || '';
            gasMatricolaInput.value = cylinderData.matricola || '';
            gasMatricolaOriginalInput.value = cylinderData.matricola || ''; // Salva la matricola originale
            gasMatricolaInput.disabled = true; // La matricola non è modificabile
            gasLitriInput.value = cylinderData.litri || '';
            gasQuantitaInput.value = cylinderData.quantita || ''; // MODIFICATO: per ordine
            gasDataRicezioneInput.value = formatDate(cylinderData.data_ricezione); // MODIFICATO: per ordine
            gasNoleggiatoAInput.value = cylinderData.noleggiato_a || ''; // MODIFICATO: per ordine
            gasDataAperturaNoleggioInput.value = formatDate(cylinderData.data_apertura_noleggio);
            gasDataChiusuraNoleggioInput.value = formatDate(cylinderData.data_chiusura_noleggio);
        } else {
            gasModalTitle.textContent = 'Aggiungi Nuova Bombola Gas';
            gasMatricolaInput.disabled = false; // Riabilita la matricola per l'inserimento
            gasMatricolaOriginalInput.value = '';
        }
        gasModalOverlay.classList.add('visible');
    };

    const closeGasModal = () => {
        gasModalOverlay.classList.remove('visible');
        gasForm.reset();
        hideFeedback();
        gasMatricolaInput.disabled = false; // Riabilita per la prossima aggiunta
    };

    // Event Listeners per il Modal
    if (addGasButton) addGasButton.addEventListener('click', () => openGasModal());
    if (closeGasModalBtn) closeGasModalBtn.addEventListener('click', closeGasModal);
    if (cancelGasModalBtn) cancelGasModalBtn.addEventListener('click', closeGasModal);
    if (gasModalOverlay) {
        gasModalOverlay.addEventListener('click', (e) => {
            if (e.target === gasModalOverlay) closeGasModal();
        });
    }

    // --- Operazioni CRUD (tramite Google Apps Script Web App) ---
    // !!! SOSTITUISCI QUESTO URL CON L'URL EFFETTIVO DELLA TUA WEB APP DEPLOYATA !!!
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwgHIqzTr9oDZz1mTq9lnB2dSFFkipH60eh6-T31vIY1iZ4NQecRXwdT2EZ377pfXpU/exec'; // Esempio: 'https://script.google.com/macros/s/AKfycbzzxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec'


    const sendDataToGoogleSheet = async (action, data) => {
        if (WEB_APP_URL === 'https://script.google.com/macros/s/AKfycbwgHIqzTr9oDZz1mTq9lnB2dSFFkipH60eh6-T31vIY1iZ4NQecRXwdT2EZ377pfXpU/exec') {
            console.error("ERRORE: WEB_APP_URL non configurato. Sostituisci il placeholder.");
            showFeedback("Errore di configurazione: WEB_APP_URL non impostato.", "error");
            return { status: 'error', message: "WEB_APP_URL non configurato." };
        }
        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                // 'no-cors' è usato per aggirare i problemi di CORS quando si chiama Apps Script
                // ma significa che non si può leggere la risposta dettagliata dal server.
                mode: 'no-cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    sheetName: 'gas', // MODIFICATO: Specifica il nome del foglio target "gas"
                    ...data
                }),
            });
            // Con 'no-cors', il risultato è sempre un Response con type 'opaque'.
            // Non possiamo ispezionare lo status HTTP o il body.
            // Assumiamo il successo e aggiorniamo i dati dopo un breve ritardo.
            console.log(`Azione '${action}' inviata a Google Sheet. Assumiamo il successo (a causa di no-cors).`);
            return { status: 'success' };
        } catch (error) {
            console.error(`Errore di rete nell'invio dati per ${action}:`, error);
            return { status: 'error', message: `Errore di rete: ${error.message}` };
        }
    };


    // --- Gestione Invio Form ---
    if (gasForm) {
        gasForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideFeedback();

            const cylinderData = {
                tipologia_gas: gasTipologiaGasInput.value.trim(),
                matricola: gasMatricolaInput.value.trim(),
                litri: parseInt(gasLitriInput.value, 10),
                quantita: parseInt(gasQuantitaInput.value, 10), // MODIFICATO: per ordine
                data_ricezione: gasDataRicezioneInput.value, // MODIFICATO: per ordine (Formato YYYY-MM-DD)
                noleggiato_a: gasNoleggiatoAInput.value.trim(), // MODIFICATO: per ordine
                data_apertura_noleggio: gasDataAperturaNoleggioInput.value,
                data_chiusura_noleggio: gasDataChiusuraNoleggioInput.value,
            };

            // Validazione minima
            if (!cylinderData.tipologia_gas || !cylinderData.matricola || isNaN(cylinderData.litri) || cylinderData.litri < 1 || !cylinderData.noleggiato_a || isNaN(cylinderData.quantita) || cylinderData.quantita < 1) {
                showFeedback('Per favore compila tutti i campi obbligatori con valori validi (Litri e Quantità devono essere numeri positivi).', 'error');
                return;
            }

            let result;
            if (isEditMode) {
                const originalMatricola = gasMatricolaOriginalInput.value;
                result = await sendDataToGoogleSheet('update', { ...cylinderData, matricola: originalMatricola }); // Passa la matricola originale per l'identificazione nel foglio
            } else {
                // Controllo duplicato solo in modalità aggiunta
                const isDuplicate = allGasCylinders.some(c => c.matricola === cylinderData.matricola);
                if (isDuplicate) {
                    showFeedback('Esiste già una bombola con questa matricola. Usa una matricola unica.', 'error');
                    return;
                }
                result = await sendDataToGoogleSheet('add', cylinderData);
            }

            if (result.status === 'success') {
                showFeedback('Operazione completata con successo! Aggiorno i dati...', 'success');
                setTimeout(() => {
                    closeGasModal();
                    fetchAndDisplayGasCylinders(); // Aggiorna i dati da Firestore
                }, 1500); // Ritardo per dare tempo ad Apps Script di sincronizzare con Firestore
            } else {
                showFeedback(`Errore: ${result.message}`, 'error');
            }
        });
    }

    // --- Carica e Mostra Bombole Gas ---
    const fetchAndDisplayGasCylinders = async () => {
        try {
            const snapshot = await db.collection('gasCylinders').get(); // La collezione Firestore rimane 'gasCylinders'
            allGasCylinders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Includi l'ID del documento
            renderGasTable(allGasCylinders);
        } catch (error) {
            console.error("Errore nel caricamento delle bombole gas da Firestore:", error);
            gasTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Errore nel caricamento delle bombole gas.</td></tr>`;
            if (noGasMessage) noGasMessage.style.display = 'block';
        }
    };

    const renderGasTable = (cylindersToDisplay) => {
        gasTableBody.innerHTML = '';
        if (cylindersToDisplay.length === 0) {
            if (noGasMessage) noGasMessage.style.display = 'block';
            return;
        }
        if (noGasMessage) noGasMessage.style.display = 'none';

        cylindersToDisplay.forEach(cylinder => {
            const row = gasTableBody.insertRow();
            row.dataset.matricola = cylinder.matricola; // Memorizza la matricola per un facile accesso
            row.innerHTML = `
                <td>${cylinder.tipologia_gas || 'N/D'}</td>
                <td>${cylinder.matricola || 'N/D'}</td>
                <td>${cylinder.litri || 'N/D'}</td>
                <td>${cylinder.quantita || 'N/D'}</td>             <!-- MODIFICATO: per ordine -->
                <td>${cylinder.data_ricezione || 'N/D'}</td>      <!-- MODIFICATO: per ordine -->
                <td>${cylinder.noleggiato_a || 'N/D'}</td>         <!-- MODIFICATO: per ordine -->
                <td>${cylinder.data_apertura_noleggio || 'N/D'}</td>
                <td>${cylinder.data_chiusura_noleggio || 'N/D'}</td>
                <td class="actions-cell">
                    <button class="action-btn edit" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    };

    // --- Funzionalità di Ricerca ---
    if (gasSearchInput) {
        gasSearchInput.addEventListener('input', () => {
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
                console.error("Cilindro non trovato per matricola:", matricola);
                return;
            }

            if (e.target.closest('.edit')) {
                openGasModal(cylinder);
            } else if (e.target.closest('.delete')) {
                if (confirm(`Sei sicuro di voler eliminare la bombola matricola ${cylinder.matricola} (${cylinder.tipologia_gas})?`)) {
                    const result = await sendDataToGoogleSheet('delete', { matricola: cylinder.matricola });
                    if (result.status === 'success') {
                        alert('Richiesta di eliminazione inviata. Aggiorno i dati...');
                        setTimeout(() => fetchAndDisplayGasCylinders(), 1500); // Aggiorna dopo un ritardo
                    } else {
                        alert(`Errore durante l'eliminazione: ${result.message}`);
                    }
                }
            }
        });
    }
});
```
