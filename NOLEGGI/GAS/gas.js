document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase non caricato in gas-script.js.");
        return;
    }

    const db = firebase.firestore();

    // --- CONFIGURAZIONE ---
    // DEVI DEPLOYARE IL TUO SCRIPT GOOGLE APPS COME WEB APP E INSERIRE L'URL QUI.
    // Istruzioni:
    // 1. Apri il tuo script Google Apps (Google Sheet Synchro to Firestore.txt).
    // 2. Clicca su "Deploy" -> "New deployment".
    // 3. Seleziona "Web app" come tipo.
    // 4. "Execute as": "Me" (il tuo account Google).
    // 5. "Who has access": "Anyone".
    // 6. Clicca "Deploy" e copia l'URL della Web app generato.
    const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'; 
    const FIRESTORE_COLLECTION_NAME = 'gasCylinders'; // Nome della collezione Firestore per le bombole gas
    const GOOGLE_SHEET_NAME = 'gas'; // Nome del foglio Google Sheets

    // --- ELEMENTI DOM ---
    const gasTableBody = document.getElementById('gas-table-body');
    const addGasButton = document.getElementById('add-gas-button');
    const gasModalOverlay = document.getElementById('gas-modal-overlay');
    const closeGasModalBtn = document.getElementById('close-gas-modal-btn');
    const cancelGasModalBtn = document.getElementById('cancel-gas-modal-btn');
    const gasModalTitle = document.getElementById('gas-modal-title');
    const gasForm = document.getElementById('gas-form');
    const gasIdField = document.getElementById('gas-id-field'); // Hidden field per la matricola in caso di modifica
    const matricolaInput = document.getElementById('matricola');
    const tipologiaGasInput = document.getElementById('tipologia_gas');
    const litriInput = document.getElementById('litri');
    const dataRicezioneInput = document.getElementById('data_ricezione');
    const noleggiatoAInput = document.getElementById('noleggiato_a');
    const dataAperturaNoleggioInput = document.getElementById('data_apertura_noleggio');
    const dataChiusuraNoleggioInput = document.getElementById('data_chiusura_noleggio');
    const gasFeedbackMessage = document.getElementById('gas-feedback-message');

    let allGasCylinders = []; // Array per tenere traccia dei dati localmente

    // --- FUNZIONI UTILITY ---
    const showFeedback = (message, type) => {
        gasFeedbackMessage.textContent = message;
        gasFeedbackMessage.className = `feedback-message ${type}`;
        gasFeedbackMessage.classList.remove('hidden');
        setTimeout(() => {
            gasFeedbackMessage.classList.add('hidden');
        }, 5000);
    };

    // Formatta una data stringa (es. da Firestore) nel formato YYYY-MM-DD per input type="date"
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Data non valida
        return date.toISOString().split('T')[0]; 
    };

    // Formatta una data stringa (es. da Firestore) nel formato DD/MM/YY per la visualizzazione
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Data non valida
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }); 
    };

    // --- FUNZIONI MODAL ---
    const openGasModal = (cylinderData = null) => {
        gasForm.reset();
        gasFeedbackMessage.classList.add('hidden');
        gasIdField.value = ''; // Pulisce il campo ID nascosto

        if (cylinderData) {
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
            gasModalTitle.textContent = 'Aggiungi Nuova Bombola Gas';
            matricolaInput.disabled = false; // La matricola è modificabile in fase di aggiunta
        }
        gasModalOverlay.classList.add('visible');
    };

    const closeGasModal = () => {
        gasModalOverlay.classList.remove('visible');
        gasForm.reset();
        matricolaInput.disabled = false; // Resetta lo stato di disabilitazione della matricola
    };

    // --- INTERAZIONE CON GOOGLE APPS SCRIPT (doPost) ---
    const sendRequestToAppsScript = async (action, data) => {
        if (GOOGLE_APPS_SCRIPT_WEB_APP_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
            showFeedback('ERRORE: URL dello script Google Apps non configurato!', 'error');
            console.error('URL dello script Google Apps non configurato!');
            return false;
        }

        try {
            const response = await fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    sheetName: GOOGLE_SHEET_NAME,
                    ...data
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                showFeedback(`Operazione "${action}" completata con successo!`, 'success');
                return true;
            } else {
                showFeedback(`Errore durante l'operazione "${action}": ${result.message}`, 'error');
                console.error(`Errore Apps Script (${action}):`, result.message);
                return false;
            }
        } catch (error) {
            showFeedback(`Errore di rete o server durante l'operazione "${action}".`, 'error');
            console.error(`Errore fetch Apps Script (${action}):`, error);
            return false;
        }
    };

    // --- GESTIONE DATI FIRESTORE E TABELLA ---
    const fetchGasCylinders = async () => {
        try {
            // Ordina per matricola per una visualizzazione consistente
            const snapshot = await db.collection(FIRESTORE_COLLECTION_NAME).orderBy('matricola').get();
            allGasCylinders = snapshot.docs.map(doc => doc.data());
            renderGasTable(allGasCylinders);
        } catch (error) {
            console.error("Errore nel recupero delle bombole gas da Firestore:", error);
            showFeedback("Errore nel caricamento delle bombole gas.", "error");
        }
    };

    const renderGasTable = (cylinders) => {
        gasTableBody.innerHTML = ''; // Pulisce la tabella esistente

        if (cylinders.length === 0) {
            const row = gasTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 8; // Numero di colonne nella tabella
            cell.textContent = 'Nessuna bombola gas trovata.';
            cell.style.textAlign = 'center';
            return;
        }

        cylinders.forEach(cylinder => {
            const row = gasTableBody.insertRow();
            row.dataset.matricola = cylinder.matricola; // Per riferimento rapido

            row.insertCell().textContent = cylinder.matricola || 'N/D';
            row.insertCell().textContent = cylinder.tipologia_gas || 'N/D';
            row.insertCell().textContent = cylinder.litri !== undefined ? cylinder.litri : 'N/D';
            row.insertCell().textContent = formatDateForDisplay(cylinder.data_ricezione);
            row.insertCell().textContent = cylinder.noleggiato_a || '';
            row.insertCell().textContent = formatDateForDisplay(cylinder.data_apertura_noleggio);
            row.insertCell().textContent = formatDateForDisplay(cylinder.data_chiusura_noleggio);

            const actionsCell = row.insertCell();
            actionsCell.className = 'actions-cell';
            
            const editButton = document.createElement('button');
            editButton.className = 'action-btn edit';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.title = 'Modifica';
            editButton.addEventListener('click', () => openGasModal(cylinder));
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn delete';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.title = 'Elimina';
            deleteButton.addEventListener('click', async () => {
                if (confirm(`Sei sicuro di voler eliminare la bombola con matricola ${cylinder.matricola}?`)) {
                    const success = await sendRequestToAppsScript('delete', { matricola: cylinder.matricola });
                    if (success) {
                        fetchGasCylinders(); // Ricarica i dati dopo l'eliminazione
                    }
                }
            });
            actionsCell.appendChild(deleteButton);
        });
    };

    // --- EVENT LISTENERS ---
    addGasButton.addEventListener('click', () => openGasModal());
    closeGasModalBtn.addEventListener('click', closeGasModal);
    cancelGasModalBtn.addEventListener('click', closeGasModal);

    gasForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isEditing = !!gasIdField.value; // Se gasIdField ha un valore, siamo in modalità modifica
        const currentMatricola = matricolaInput.value.trim();

        // Validazione per matricola duplicata solo in fase di aggiunta
        if (!isEditing) {
            const existingCylinder = allGasCylinders.find(c => c.matricola === currentMatricola);
            if (existingCylinder) {
                showFeedback('Errore: Esiste già una bombola con questa matricola.', 'error');
                return;
            }
        }

        const gasData = {
            matricola: currentMatricola,
            tipologia_gas: tipologiaGasInput.value.trim(),
            litri: parseInt(litriInput.value, 10),
            // Invia le date come stringhe ISO, il Google Apps Script le formatterà
            data_ricezione: dataRicezioneInput.value ? new Date(dataRicezioneInput.value).toISOString() : '',
            noleggiato_a: noleggiatoAInput.value.trim(),
            data_apertura_noleggio: dataAperturaNoleggioInput.value ? new Date(dataAperturaNoleggioInput.value).toISOString() : '',
            data_chiusura_noleggio: dataChiusuraNoleggioInput.value ? new Date(dataChiusuraNoleggioInput.value).toISOString() : '',
        };

        // Rimuovi campi vuoti o nulli per non scriverli in Firestore se non necessari
        Object.keys(gasData).forEach(key => {
            if (gasData[key] === '' || gasData[key] === null || (typeof gasData[key] === 'number' && isNaN(gasData[key]))) {
                delete gasData[key];
            }
        });

        let success;
        if (isEditing) {
            // Per l'aggiornamento, assicurati che la matricola originale sia inclusa per trovare la riga nel foglio
            success = await sendRequestToAppsScript('update', { ...gasData, matricola: gasIdField.value });
        } else {
            success = await sendRequestToAppsScript('add', gasData);
        }

        if (success) {
            closeGasModal();
            fetchGasCylinders(); // Ricarica i dati dopo l'operazione
        }
    });

    // --- INIZIALIZZAZIONE ---
    // L'auth.js gestisce la visibilità di app-content e il loader iniziale.
    // Quando app-content diventa visibile, carichiamo i dati.
    const appContent = document.getElementById('app-content');
    if (appContent) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {
                    const isHidden = appContent.classList.contains('hidden');
                    if (!isHidden) {
                        fetchGasCylinders();
                    }
                }
            });
        });
        observer.observe(appContent, { attributes: true });
    } else {
        // Fallback se app-content non è presente (es. per test diretti)
        fetchGasCylinders();
    }
});
