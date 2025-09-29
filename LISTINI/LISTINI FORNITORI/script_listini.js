document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi DOM
    const searchInput = document.getElementById('listini-search-input');
    const resultsContainer = document.getElementById('listini-results-container-sidebar'); 
    const listiniLoader = document.getElementById('listini-loader'); 
    
    // Riferimenti DOM per il visualizzatore PDF integrato
    const rightContentArea = document.getElementById('right-content-area');
    const pdfViewerSection = document.getElementById('pdf-viewer-section');
    const pdfIframeContainer = document.getElementById('pdf-iframe-container');
    const backToListiniBtn = document.getElementById('back-to-listini-btn');
    const pdfViewerTitle = document.getElementById('pdf-viewer-title');
    const welcomeMessageRight = document.getElementById('welcome-message-right');
    const screenshotPdfBtn = document.getElementById('screenshot-pdf-btn'); // Nuovo pulsante screenshot

    let allListini = [];
    let currentOpenPdfId = null;

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
            
            displayListini(allListini);
        } catch (error) {
            console.error("Errore nel caricare i listini da Firestore:", error);
            resultsContainer.innerHTML = '<p class="no-results">Errore nel caricamento dei listini. Verifica la tua connessione.</p>';
        } finally {
            if (listiniLoader) {
                listiniLoader.classList.remove('visible');
            }
        }
    }

    // Funzione per visualizzare i listini nel container della sidebar
    function displayListini(listiniToDisplay) {
        resultsContainer.innerHTML = '';

        if (listiniToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Nessun listino trovato. Prova con una ricerca diversa.</p>';
            return;
        }

        listiniToDisplay.forEach(listino => {
            const listinoCard = document.createElement('div');
            listinoCard.classList.add('listino-card');
            listinoCard.dataset.listinoId = listino.id;
            
            const pdfUrlForViewer = `/pdfjs/web/viewer.html?file=/${encodeURIComponent(listino.percorsoFile)}`;

            listinoCard.innerHTML = `
                <div class="listino-thumbnail">
                    ${listino.thumbnailUrl ? `<img src="${listino.thumbnailUrl}" alt="${listino.nome} anteprima">` : '<i class="fas fa-file-pdf"></i>'}
                </div>
                <div class="listino-info">
                    <h2>${listino.nome}</h2>
                    <p>Anno: ${listino.anno || 'N/D'}</p>
                </div>
            `;
            resultsContainer.appendChild(listinoCard);

            listinoCard.addEventListener('click', () => {
                const pdfTitle = `${listino.nome} ${listino.anno || ''}`;
                openPdfInViewer(pdfUrlForViewer, pdfTitle, listino.id);
            });
        });
    }

    // Funzione per aprire il PDF nel visualizzatore integrato
    function openPdfInViewer(pdfUrl, title, listinoId) {
        welcomeMessageRight.classList.add('hidden');
        document.querySelectorAll('.listino-card').forEach(card => card.classList.remove('active'));
        const selectedPdfCard = document.querySelector(`[data-listino-id="${listinoId}"]`);
        if (selectedPdfCard) {
            selectedPdfCard.classList.add('active');
        }

        pdfViewerSection.classList.add('visible');    
        pdfViewerTitle.textContent = title;             
        pdfIframeContainer.innerHTML = `<iframe id="pdf-viewer-iframe" src="${pdfUrl}" title="${title}"></iframe>`; // Aggiunto ID all'iframe
        
        rightContentArea.classList.add('pdf-open');
        currentOpenPdfId = listinoId; 
    }

    // Funzione per tornare all'elenco dei listini / chiudere il PDF
    function closePdfViewer() {
        pdfViewerSection.classList.remove('visible');    
        welcomeMessageRight.classList.remove('hidden');
        pdfIframeContainer.innerHTML = ''; 
        pdfViewerTitle.textContent = ''; 
        rightContentArea.classList.remove('pdf-open');
        document.querySelectorAll('.listino-card').forEach(card => card.classList.remove('active'));
        currentOpenPdfId = null;
    }

    // Listener per il pulsante "Chiudi PDF"
    backToListiniBtn.addEventListener('click', closePdfViewer);

    // *** NUOVA FUNZIONALITÀ: Screenshot del PDF ***
    screenshotPdfBtn.addEventListener('click', async () => {
        const pdfIframe = document.getElementById('pdf-viewer-iframe');
        if (!pdfIframe || !pdfIframe.contentDocument || !html2canvas) {
            alert('Impossibile catturare lo screenshot. Assicurati che un PDF sia aperto e le librerie siano caricate.');
            console.error('Screenshot: Impossibile trovare iframe PDF o libreria html2canvas.');
            return;
        }

        // html2canvas funziona meglio con contenuti direttamente nel DOM.
        // Catturare il contenuto di un iframe è complesso per via delle restrizioni di sicurezza (CORS)
        // se il contenuto dell'iframe proviene da un dominio diverso (anche se è lo stesso sito).
        // Se PDF.js carica il PDF sullo stesso dominio, potremmo provare a catturare il 'viewer.html' stesso.
        // Per uno screenshot dell'area *visibile* dell'iframe, possiamo catturare l'iframe o il suo contenitore.
        
        // Tentiamo di catturare il contenitore dell'iframe.
        // Questo non catturerà il contenuto interno del PDF renderizzato, ma l'area dell'iframe stesso.
        // Per catturare il contenuto del PDF, servono regole CORS specifiche sul server PDF
        // o un'implementazione più complessa (es. renderizzare il PDF su Canvas direttamente nella pagina principale).
        alert("La funzione screenshot al momento cattura solo l'area dell'iframe. Per catturare il contenuto del PDF stesso sono richieste configurazioni avanzate (CORS).");
        
        try {
            const canvas = await html2canvas(pdfIframeContainer, {
                useCORS: true, // Tenta di usare CORS, ma spesso non basta per iframe cross-origin/same-origin con restrizioni
                allowTaint: true,
                ignoreElements: (element) => {
                    // Ignora elementi che potrebbero causare problemi o non essere necessari
                    return element.id === 'back-to-listini-btn' || element.id === 'screenshot-pdf-btn';
                }
            });

            // Crea un link per scaricare l'immagine
            const link = document.createElement('a');
            link.download = `${pdfViewerTitle.textContent.replace(/\s/g, '_')}_screenshot.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert('Screenshot catturato e scaricato!');

        } catch (error) {
            console.error('Errore durante la cattura dello screenshot:', error);
            alert('Errore durante la cattura dello screenshot. Potrebbe esserci una restrizione di sicurezza (CORS).');
        }
    });

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
