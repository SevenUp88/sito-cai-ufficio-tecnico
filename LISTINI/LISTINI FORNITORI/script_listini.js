document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi DOM
    const searchInput = document.getElementById('listini-search-input');
    const resultsContainer = document.getElementById('listini-results-container');
    const listiniLoader = document.getElementById('listini-loader');
    
    // Nuovi riferimenti DOM per il visualizzatore PDF integrato
    const searchAndResultsSection = document.getElementById('search-and-results-section');
    const pdfViewerSection = document.getElementById('pdf-viewer-section');
    const pdfIframeContainer = document.getElementById('pdf-iframe-container');
    const backToListiniBtn = document.getElementById('back-to-listini-btn');
    const pdfViewerTitle = document.getElementById('pdf-viewer-title');
    
    let allListini = []; // Array per conservare tutti i listini caricati da Firebase

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

    // Funzione per visualizzare i listini nel container
    function displayListini(listiniToDisplay) {
        resultsContainer.innerHTML = ''; // Pulisce i risultati precedenti

        if (listiniToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Nessun listino trovato. Prova con una ricerca diversa.</p>';
            return;
        }

        listiniToDisplay.forEach(listino => {
            const listinoCard = document.createElement('div');
            listinoCard.classList.add('listino-card');
            
            // Il pdfPath è l'URL completo che PDF.js userà
            const pdfUrlForViewer = `/pdfjs/web/viewer.html?file=/${encodeURIComponent(listino.percorsoFile)}`;

            listinoCard.innerHTML = `
                <div class="listino-thumbnail">
                    <!-- Placeholder per l'immagine. Se avrai un thumbnailUrl in Firestore, lo useremo qui. -->
                    ${listino.thumbnailUrl ? `<img src="${listino.thumbnailUrl}" alt="${listino.nome} anteprima">` : '<i class="fas fa-file-pdf"></i>'}
                </div>
                <h2>${listino.nome}</h2>
                <p>Anno: ${listino.anno || 'N/D'}</p>
                <button class="open-pdf-btn" data-pdf-url="${pdfUrlForViewer}" data-pdf-title="${listino.nome} ${listino.anno || ''}">
                    <i class="fas fa-file-pdf"></i> Apri Listino
                </button>
            `;
            resultsContainer.appendChild(listinoCard);
        });

        // Aggiungi listener ai nuovi pulsanti dopo che sono stati aggiunti al DOM
        document.querySelectorAll('.open-pdf-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const pdfUrl = event.currentTarget.dataset.pdfUrl;
                const pdfTitle = event.currentTarget.dataset.pdfTitle;
                openPdfInViewer(pdfUrl, pdfTitle);
            });
        });
    }

    // Funzione per aprire il PDF nel visualizzatore integrato
    function openPdfInViewer(pdfUrl, title) {
        searchAndResultsSection.classList.add('hidden'); // Nasconde la sezione di ricerca
        pdfViewerSection.classList.remove('hidden');    // Mostra la sezione del visualizzatore PDF
        pdfViewerTitle.textContent = title;             // Imposta il titolo dinamico
        pdfIframeContainer.innerHTML = `<iframe src="${pdfUrl}" title="${title}"></iframe>`; // Inietta l'iframe
    }

    // Funzione per tornare all'elenco dei listini
    function closePdfViewer() {
        pdfViewerSection.classList.add('hidden');    // Nasconde la sezione del visualizzatore PDF
        searchAndResultsSection.classList.remove('hidden'); // Mostra la sezione di ricerca
        pdfIframeContainer.innerHTML = ''; // Pulisce l'iframe per liberare memoria
        pdfViewerTitle.textContent = ''; // Resetta il titolo
    }

    // Listener per il pulsante "Torna ai Listini"
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

    // Eventuali logiche aggiuntive per la user-dashboard e logout
    // Se la dashboard utente o il logout sono gestiti altrove (es. auth.js)
    // assicurati che non ci siano conflitti. Potrebbe essere necessario inizializzare
    // la dashboard qui se auth.js non lo fa per questa specifica pagina.
    // Esempio minimale per la user dashboard (potrebbe essere più complesso in auth.js)
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
                    // Potresti voler reindirizzare l'utente alla home o alla pagina di login
                    window.location.href = '../../index.html'; 
                });
            }
        });
    }
});
