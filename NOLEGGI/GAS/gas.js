document.addEventListener('DOMContentLoaded', () => {
    console.log("gas.js: DOMContentLoaded fired.");

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
    const printTableButton = document.getElementById('print-table-button');
    console.log("gas.js: addGasButton element:", addGasButton);
    const noGasMessage = document.getElementById('no-gas-message');
    const headerLogo = document.querySelector('.app-header .logo');

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

    if (headerLogo) {
        headerLogo.addEventListener('click', () => {
            window.location.href = '../../index.html';
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

    // NUOVO: Funzione per formattare la data per la visualizzazione nella tabella
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/D';
        // Prova a creare un oggetto Date. Se fallisce, usiamo la stringa originale
        let dateObj;
        try {
            dateObj = new Date(dateString);
            // Se la stringa è già nel formato 'GG/MM/AA' o 'AAAA-MM-GG', non formattiamo ulteriormente
            // Questo evita la conversione di "11/09/25" in "11/09/2025" o simili, mantenedo il tuo formato Excel.
            if (dateString.match(/^\d{2}\/\d{2}\/\d{2}$/) || dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateString;
            }
            // Se è un oggetto Date valido e non era già in un formato desiderato, lo formattiamo.
            if (!isNaN(dateObj.getTime())) {
                const day = dateObj.getDate().toString().padStart(2, '0');
                const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Mesi sono 0-based
                const year = dateObj.getFullYear().toString().substring(2); // Prende le ultime due cifre
                return `${day}/${month}/${year}`;
            }
        } catch (e) {
            console.warn("gas.js: Error parsing date for display, using original string:", dateString, e);
        }
        return dateString; // Se non riusciamo a formattare, restituisci la stringa originale
    };

    // La funzione formatDate originale per gli input type="date" (YYYY-MM-DD)
    const formatDateForInput = (dateString) => { // RINOMINATA per chiarezza
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
            console.warn("gas.js: Could not parse date string for input:", dateString, e);
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
            gasDataRicezioneInput.value = formatDateForInput(cylinderData.data_ricezione); // Usa formatDateForInput
            gasNoleggiatoAInput.value = cylinderData.noleggiato_a || '';
            gasDataAperturaNoleggioInput.value = formatDateForInput(cylinderData.data_apertura_noleggio); // Usa formatDateForInput
            gasDataChiusuraNoleggioInput.value = formatDateForInput(cylinderData.data_chiusura_noleggio); // Usa formatDateForInput
        } else {
            gasModalTitle.textContent = 'Aggiungi Nuova Bombola Gas';
            gasMatricolaInput.disabled = false;
            gasMatricolaOriginalInput.value = '';
            // Auto-popola la data di ricezione con la data odierna
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            gasDataRicezioneInput.value = `${year}-${month}-${day}`; // Formato YYYY-MM-DD per input type="date"
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

    if (addGasButton) {
        console.log("gas.js: Attaching click listener to addGasButton.");
        addGasButton.addEventListener('click', () => {
            console.log("gas.js: 'Aggiungi Bombola' button clicked!");
            openGasModal();
        });
    }

    if (printTableButton) {
        console.log("gas.js: Attaching click listener to printTableButton.");
        printTableButton.addEventListener('click', () => {
            console.log("gas.js: 'Stampa Tabella' button clicked!");
            printGasTable();
        });
    }

    if (closeGasModalBtn) {
        console.log("gas.js: Attaching click listener to closeGasModalBtn.");
        closeGasModalBtn.addEventListener('click', closeGasModal);
    }
    if (cancelGasModalBtn) {
        console.log("gas.js: Attaching click listener to cancelGasModalBtn.");
        cancelGasModalBtn.addEventListener('click', closeGasModal);
    }

    if (gasModalOverlay) {
        console.log("gas.js: Attaching click listener to gasModalOverlay.");
        gasModalOverlay.addEventListener('click', (e) => {
            if (e.target === gasModalOverlay) closeGasModal();
        });
    }

    // --- Funzione per la stampa della tabella ---
    const printGasTable = () => {
        const table = document.getElementById('gas-data-table');
        if (!table) {
            console.error("gas.js: Table to print not found!");
            alert("Errore: la tabella da stampare non è stata trovata.");
            return;
        }

        const originalDisplay = table.style.display;
        table.style.display = 'table'; // Assicurati che sia visibile per la stampa

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Stampa Bombole Gas</title>');
        printWindow.document.write('<link rel="stylesheet" href="../../style.css" type="text/css" />');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
            h2 { color: #0056a8; text-align: center; margin-bottom: 20px; }
            .gas-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .gas-table th, .gas-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .gas-table th { background-color: #f2f2f2; }
            .gas-table .actions-cell { display: none; } /* Nasconde la colonna azioni in stampa */
            @media print {
                body { margin: 0; padding: 0; }
                .gas-table th, .gas-table td { border-color: #000; } /* Bordo più scuro per la stampa */
            }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>Gestione Bombole Gas a Noleggio</h2>');
        printWindow.document.write(table.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();

        table.style.display = originalDisplay;
    };

    // --- Operazioni CRUD (tramite Google Apps Script Web App) ---
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwgHIqzTr9oDZz1mTq9lnB2dSFFkipH60eh6-T31vIY1iZ4NQecRXwdT2EZ377pfXpU/exec'; 

    const sendDataToGoogleSheet = async (action, data) => {
        if (!WEB_APP_URL.startsWith('https://script.google.com/macros/s/')) {
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
                    // Qui inviamo la data nel formato YYYY-MM-DD per il foglio
                    tipologia_gas: data.tipologia_gas,
                    matricola: data.matricola,
                    litri: data.litri,
                    data_ricezione: data.data_ricezione, // Il frontend invia YYYY-MM-DD
                    noleggiato_a: data.noleggiato_a,
                    data_apertura_noleggio: data.data_apertura_noleggio,
                    data_chiusura_noleggio: data.data_chiusura_noleggio,
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
                tipologia_gas: gasTipologiaGasInput.value.trim() || '',
                matricola: gasMatricolaInput.value.trim(),
                litri: parseInt(gasLitriInput.value, 10),
                data_ricezione: gasDataRicezioneInput.value || '',
                noleggiato_a: gasNoleggiatoAInput.value.trim() || '',
                data_apertura_noleggio: gasDataAperturaNoleggioInput.value || '',
                data_chiusura_noleggio: gasDataChiusuraNoleggioInput.value || '',
            };

            if (!cylinderData.matricola) {
                showFeedback('La Matricola è un campo obbligatorio.', 'error');
                console.warn("gas.js: Validation failed: Matricola is required.");
                return;
            }
            if (gasLitriInput.value.trim() === '' || isNaN(cylinderData.litri) || cylinderData.litri < 0) {
                 cylinderData.litri = 0;
                 gasLitriInput.value = 0;
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
            const snapshot = await db.collection('gasCylinders').get({ source: 'server' }); 
            allGasCylinders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderGasTable(allGasCylinders);
            console.log(`gas.js: Found ${allGasCylinders.length} gas cylinders.`);
        } catch (error) {
            console.error("gas.js: Errore nel caricamento delle bombole gas da Firestore:", error);
            gasTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Errore nel caricamento delle bombole gas. ${error.message}</td></tr>`;
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
                <td>${cylinder.litri !== undefined && cylinder.litri !== null ? cylinder.litri : 'N/D'}</td>
                <td>${formatDateForDisplay(cylinder.data_ricezione)}</td> <!-- MODIFICATO: Usa la nuova funzione di formattazione -->
                <td>${cylinder.noleggiato_a || 'N/D'}</td>
                <td>${formatDateForDisplay(cylinder.data_apertura_noleggio)}</td> <!-- MODIFICATO: Usa la nuova funzione di formattazione -->
                <td>${formatDateForDisplay(cylinder.data_chiusura_noleggio)}</td> <!-- MODIFICATO: Usa la nuova funzione di formattazione -->
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
                // MODIFICATO: La ricerca per data dovrebbe funzionare sul formato visualizzato
                formatDateForDisplay(cylinder.data_ricezione).toLowerCase().includes(query) ||
                formatDateForDisplay(cylinder.data_apertura_noleggio).toLowerCase().includes(query) ||
                formatDateForDisplay(cylinder.data_chiusura_noleggio).toLowerCase().includes(query)
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
