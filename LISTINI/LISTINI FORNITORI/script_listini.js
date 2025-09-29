document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi DOM
    const searchInput = document.getElementById('listini-search-input');
    // Il contenitore dei risultati ora è nella sidebar
    const resultsContainer = document.getElementById('listini-results-container-sidebar'); 
    const listiniLoader = document.getElementById('listini-loader'); // Loader della sidebar
    
    // Riferimenti DOM per il visualizzatore PDF integrato
    const rightContentArea = document.getElementById('right-content-area'); // La colonna destra completa
    const pdfViewerSection = document.getElementById('pdf-viewer-section');
    const pdfIframeContainer = document.getElementById('pdf-iframe-container');
    const backToListiniBtn = document.getElementById('back-to-listini-btn');
    const pdfViewerTitle = document.getElementById('pdf-viewer-title');
    const welcomeMessageRight = document.getElementById('welcome-message-right'); // Messaggio di benvenuto a destra

    let allListini = []; // Array per conservare tutti i listini caricati da Firebase
    let currentOpenPdfId = null; // Per tenere traccia del PDF attualmente aperto

    // Funzione per caricare i listini da Firestore
    async function loadListini() {
        if (!window.db) {
            console.error("Firestore non è inizializzato. Assicurati che firebase-config.js sia caricato correttamente.");
            if (listiniLoader) {
                listiniLoader.classList.remove('visible');
                resultsContainer.innerHTML = '<p class="no-results">Errore: impossibile caricare i listini. Riprova più tardi.</p>';
            }
            return;
        }

        try {
            const listiniCollection = await window.db.collection('listiniFornitori').get();
            allListini = listiniCollection.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            displayListini(allListini); // Visualizza tutti i listini all'inizio
        } catch (error) {
            console.error("Errore nel caricare i listini da Firestore:", error);
            resultsContainer.innerHTML = '<p class="no-results">Errore nel caricamento dei listini. Verifica la tua connessione.</p>';
        } finally {
            if (listiniLoader) {
                listiniLoader.classList.remove('visible'); // Nasconde il loader una volta terminato
            }
        }
    }

    // Funzione per visualizzare i listini nel container della sidebar
    function displayListini(listiniToDisplay) {
        resultsContainer.innerHTML = ''; // Pulisce i risultati precedenti

        if (listiniToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Nessun listino trovato. Prova con una ricerca diversa.</p>';
            return;
        }

        listiniToDisplay.forEach(listino => {
            const listinoCard = document.createElement('div');
            listinoCard.classList.add('listino-card');
            listinoCard.dataset.listinoId = listino.id; // Per identificare la card attiva
            
            // Il pdfPath è l'URL completo che PDF.js userà
            const pdfUrlForViewer = `/pdfjs/web/viewer.html?file=/${encodeURIComponent(listino.percorsoFile)}`;

            listinoCard.innerHTML = `
                <div class="listino-thumbnail">
                    ${listino.thumbnailUrl ? `<img src="${listino.thumbnailUrl}" alt="${listino.nome} anteprima">` : '<i class="fas fa-file-pdf"></i>'}
                </div>
                <div class="listino-info">
                    <h2>${listino.nome}</h2>
                    <p>Anno: ${listino.anno || 'N/D'}</p>
                </div>
                <!-- Il pulsante non è più qui, l'intera card è cliccabile -->
            `;
            resultsContainer.appendChild(listinoCard);

            // Rendi l'intera card cliccabile per aprire il PDF
            listinoCard.addEventListener('click', () => {
                const pdfTitle = `${listino.nome} ${listino.anno || ''}`;
                openPdfInViewer(pdfUrlForViewer, pdfTitle, listino.id);
            });
        });
    }

    // Funzione per aprire il PDF nel visualizzatore integrato
    function openPdfInViewer(pdfUrl, title, listinoId) {
        // Nasconde il messaggio di benvenuto
        welcomeMessageRight.classList.add('hidden');
        // Rimuovi la classe active da tutte le card
        document.querySelectorAll('.listino-card').forEach(card => card.classList.remove('active'));
        // Aggiungi la classe active alla card attualmente selezionata
        const selectedPdfCard = document.querySelector(`[data-listino-id="${listinoId}"]`);
        if (selectedPdfCard) {
            selectedPdfCard.classList.add('active');
        }

        // Mostra la sezione del visualizzatore PDF
        pdfViewerSection.classList.add('visible');    
        pdfViewerTitle.textContent = title;             
        pdfIframeContainer.innerHTML = `<iframe src="${pdfUrl}" title="${title}"></iframe>`;
        
        rightContentArea.classList.add('pdf-open'); // Aggiunge una classe al main
        currentOpenPdfId = listinoId; // Salva l'ID del PDF aperto
    }

    // Funzione per tornare all'elenco dei listini / chiudere il PDF
    function closePdfViewer() {
        pdfViewerSection.classList.remove('visible');    
        welcomeMessageRight.classList.remove('hidden'); // Mostra di nuovo il messaggio di benvenuto
        pdfIframeContainer.innerHTML = ''; 
        pdfViewerTitle.textContent = ''; 
        rightContentArea.classList.remove('pdf-open'); // Rimuove la classe dal main
        document.querySelectorAll('.listino-card').forEach(card => card.classList.remove('active')); // Rimuovi active
        currentOpenPdfId = null; // Resetta l'ID del PDF aperto
    }

    // Listener per il pulsante "Chiudi PDF"
    backToListiniBtn.addEventListener('click', closePdfViewer);

    // Funzione di ricerca/filtraggio
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredListini = allListini.filter(listino => 
            listino.nome.toLowerCase().includes(searchTerm) ||
            (listino.anno && listino.anno.toString().includes(searchTerm))
        );
        displayListini(filteredListini);
    });

    // Avvia il caricamento dei listini quando la pagina è pronta
    loadListini();

    // Gestione dell'autenticazione per questa pagina (se necessario)
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            const userDashboard = document.getElementById('user-dashboard');
            const userEmailDisplay = document.getElementById('user-email-display');
            const logoutButton = document.getElementById('logout-button');
            if (user) {
                userDashboard.classList.remove('hidden');
                userEmailDisplay.textContent = user.email;
            } else {
                userDashboard.classList.add('hidden');
            }
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    window.auth.signOut();
                    window.location.href = '../../index.html'; 
                });
            }
        });
    }
});
