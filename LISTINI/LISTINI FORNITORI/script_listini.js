document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi DOM
    const searchInput = document.getElementById('listini-search-input');
    const resultsContainer = document.getElementById('listini-results-container');
    const listiniLoader = document.getElementById('listini-loader');
    
    let allListini = []; // Array per conservare tutti i listini caricati da Firebase

    // Funzione per caricare i listini da Firestore
    async function loadListini() {
        if (!window.db) {
            console.error("Firestore non è inizializzato. Assicurati che firebase-config.js sia caricato correttamente.");
            // Mostra un messaggio di errore o gestisci diversamente
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
            
            // Compone il percorso completo per il PDF
            // Assicurati che `listino.percorsoFile` sia relativo alla radice del sito
            // es: 'LISTINI/LISTINI FORNITORI/2025_General Aspirazione.pdf'
            const pdfPath = `/pdfjs/web/viewer.html?file=/${encodeURIComponent(listino.percorsoFile)}`;

            listinoCard.innerHTML = `
                <div class="listino-thumbnail">
                    <!-- Placeholder per l'immagine. Se avrai un thumbnailUrl in Firestore, lo useremo qui. -->
                    ${listino.thumbnailUrl ? `<img src="${listino.thumbnailUrl}" alt="${listino.nome} anteprima">` : '<i class="fas fa-file-pdf"></i>'}
                </div>
                <h2>${listino.nome}</h2>
                <p>Anno: ${listino.anno || 'N/D'}</p>
                <a href="${pdfPath}" target="_blank" rel="noopener noreferrer" class="open-pdf-btn">
                    <i class="fas fa-file-pdf"></i> Apri Listino
                </a>
            `;

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
    // Se questa pagina richiede l'autenticazione, il tuo script auth.js dovrebbe gestirlo.
    // Assicurati che il loader iniziale del tuo auth.js sia gestito correttamente
    // e non entri in conflitto con il loader di questa pagina.
    // Per ora, il loader di questa pagina parte visibile e viene nascosto da loadListini().
});
