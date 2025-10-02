// gas-script.js - VERSIONE CON NUMERO PROGRESSIVO E STAMPA

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase non caricato in gas-script.js.");
        return;
    }

    const db = firebase.firestore();
    
    // URL funzionante dalla pagina Preventivi
    const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyyBeWhl1rH4flw59NVvNyIFYoVE0cDFlqRfcd0SVWKKAAh4mo0nfJ-O009FpIfUljT/exec'; 
    
    const FIRESTORE_COLLECTION_NAME = 'gasCylinders';
    const GOOGLE_SHEET_NAME = 'gas';

    // --- ELEMENTI DOM ---
    const gasTableBody = document.getElementById('gas-table-body');
    const addGasButton = document.getElementById('add-gas-button');
    const printTableBtn = document.getElementById('print-table-btn');
    const gasModalOverlay = document.getElementById('gas-modal-overlay');
    const closeGasModalBtn = document.getElementById('close-gas-modal-btn');
    const cancelGasModalBtn = document.getElementById('cancel-gas-modal-btn');
    const gasModalTitle = document.getElementById('gas-modal-title');
    const gasForm = document.getElementById('gas-form');
    const gasIdField = document.getElementById('gas-id-field');
    const matricolaInput = document.getElementById('matricola');
    const tipologiaGasInput = document.getElementById('tipologia_gas');
    const litriInput = document.getElementById('litri');
    const dataRicezioneInput = document.getElementById('data_ricezione');
    const noleggiatoAInput = document.getElementById('noleggiato_a');
    const dataAperturaNoleggioInput = document.getElementById('data_apertura_noleggio');
    const dataChiusuraNoleggioInput = document.getElementById('data_chiusura_noleggio');
    const gasFeedbackMessage = document.getElementById('gas-feedback-message');

    let allGasCylinders = [];

    // --- FUNZIONI UTILITY ---
    const showFeedback = (message, type) => {
        gasFeedbackMessage.textContent = message;
        gasFeedbackMessage.className = `feedback-message ${type}`;
        gasFeedbackMessage.classList.remove('hidden');
        setTimeout(() => gasFeedbackMessage.classList.add('hidden'), 5000);
    };

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const formatDateForDisplay = (dateValue) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }); 
    };

    // --- FUNZIONI MODAL ---
    const openGasModal = (cylinderData = null) => {
        gasForm.reset();
        gasFeedbackMessage.classList.add('hidden');
        gasIdField.value = '';

        if (cylinderData) {
            gasModalTitle.textContent = 'Modifica Bombola Gas';
            gasIdField.value = cylinderData.matricola;
            matricolaInput.value = cylinderData.matricola || '';
            matricolaInput.disabled = true;
            tipologiaGasInput.value = cylinderData.tipologia_gas || '';
            litriInput.value = cylinderData.litri || 0;
            dataRicezioneInput.value = formatDateForInput(cylinderData.data_ricezione);
            noleggiatoAInput.value = cylinderData.noleggiato_a || '';
            dataAperturaNoleggioInput.value = formatDateForInput(cylinderData.data_apertura_noleggio);
            dataChiusuraNoleggioInput.value = formatDateForInput(cylinderData.data_chiusura_noleggio);
        } else {
            gasModalTitle.textContent = 'Aggiungi Nuova Bombola Gas';
            matricolaInput.disabled = false;
        }
        gasModalOverlay.classList.add('visible');
    };

    const closeGasModal = () => {
        gasModalOverlay.classList.remove('visible');
    };

    // --- INTERAZIONE CON GOOGLE APPS SCRIPT (con approccio 'no-cors') ---
    const sendRequestToAppsScript = (action, data) => {
        fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, sheetName: GOOGLE_SHEET_NAME, ...data }),
        }).catch(console.error);
        
        showFeedback(`Richiesta "${action}" inviata.`, 'success');
        return true; 
    };

    // --- GESTIONE DATI E TABELLA ---
    const fetchGasCylinders = async () => {
        try {
            const snapshot = await db.collection(FIRESTORE_COLLECTION_NAME).orderBy('matricola').get();
            allGasCylinders = snapshot.docs.map(doc => doc.data());
            renderGasTable(allGasCylinders);
        } catch (error) {
            console.error("Errore nel recupero delle bombole gas:", error);
            gasTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:red;">Errore nel caricamento dei dati.</td></tr>';
        }
    };

    const renderGasTable = (cylinders) => {
        gasTableBody.innerHTML = '';

        if (cylinders.length === 0) {
            const row = gasTableBody.insertRow();
            row.insertCell().colSpan = 9; // Aggiornato a 9
            row.cells[0].textContent = 'Nessuna bombola gas trovata. Aggiungine una!';
            row.cells[0].style.textAlign = 'center';
            return;
        }

        cylinders.forEach((cylinder, index) => {
            const row = gasTableBody.insertRow();
            row.dataset.matricola = cylinder.matricola;

            row.insertCell().textContent = index + 1; // Numero progressivo
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
            editButton.title = 'Modifica Bombola';
            editButton.addEventListener('click', () => openGasModal(cylinder));
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn delete';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.title = 'Elimina Bombola';
            deleteButton.addEventListener('click', () => {
                if (confirm(`Sei sicuro di voler eliminare la bombola con matricola ${cylinder.matricola}?`)) {
                    if (sendRequestToAppsScript('delete', { matricola: cylinder.matricola })) {
                        allGasCylinders = allGasCylinders.filter(c => c.matricola !== cylinder.matricola);
                        renderGasTable(allGasCylinders);
                    }
                }
            });
            actionsCell.appendChild(deleteButton);
        });
    };
    
    // --- FUNZIONE DI STAMPA ---
    const handlePrint = () => {
        window.print(); // Apre la finestra di dialogo di stampa del browser
    };

    // --- EVENT LISTENERS ---
    addGasButton.addEventListener('click', () => openGasModal());
    printTableBtn.addEventListener('click', handlePrint);
    closeGasModalBtn.addEventListener('click', closeGasModal);
    cancelGasModalBtn.addEventListener('click', closeGasModal);

    gasForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const isEditing = !!gasIdField.value;
        const currentMatricola = matricolaInput.value.trim();

        if (!isEditing && allGasCylinders.find(c => c.matricola === currentMatricola)) {
            showFeedback('Errore: Esiste già una bombola con questa matricola.', 'error');
            return;
        }

        const gasData = {
            matricola: currentMatricola,
            tipologia_gas: document.getElementById('tipologia_gas').value.trim(),
            litri: parseInt(document.getElementById('litri').value, 10),
            data_ricezione: document.getElementById('data_ricezione').value ? new Date(document.getElementById('data_ricezione').value).toISOString() : '',
            noleggiato_a: document.getElementById('noleggiato_a').value.trim(),
            data_apertura_noleggio: document.getElementById('data_apertura_noleggio').value ? new Date(document.getElementById('data_apertura_noleggio').value).toISOString() : '',
            data_chiusura_noleggio: document.getElementById('data_chiusura_noleggio').value ? new Date(document.getElementById('data_chiusura_noleggio').value).toISOString() : '',
        };

        const success = isEditing 
            ? sendRequestToAppsScript('update', { ...gasData, matricola: gasIdField.value })
            : sendRequestToAppsScript('add', gasData);

        if (success) {
            if (isEditing) {
                const index = allGasCylinders.findIndex(c => c.matricola === gasIdField.value);
                if (index !== -1) allGasCylinders[index] = { ...allGasCylinders[index], ...gasData, matricola: currentMatricola };
            } else {
                allGasCylinders.push(gasData);
            }
            
            allGasCylinders.sort((a, b) => (a.matricola || '').localeCompare(b.matricola || ''));
            renderGasTable(allGasCylinders);
            closeGasModal();
        }
    });

    // --- INIZIALIZZAZIONE ---
    const appContent = document.getElementById('app-content');
    if (appContent) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' && !appContent.classList.contains('hidden')) {
                    fetchGasCylinders();
                }
            });
        });
        observer.observe(appContent, { attributes: true });
    } else {
        console.warn("Elemento #app-content non trovato. Caricamento dati immediato.");
        fetchGasCylinders();
    }
});
