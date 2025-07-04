document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. SELEZIONE DEGLI ELEMENTI DOM
    // =================================================================
    const btnListini = document.getElementById('btn-listini');
    const submenuListini = document.getElementById('submenu-listini');
    const btnConfiguratori = document.getElementById('btn-configuratori');
    const submenuConfiguratori = document.getElementById('submenu-configuratori');
    const mainNav = document.getElementById('mainNav');
    const addCategoryTriggerBtn = document.getElementById('add-category-trigger');
    const addCategoryPanel = document.getElementById('add-category-panel');
    const addCategoryCloseBtn = document.getElementById('add-category-close');
    const categoryNameInput = document.getElementById('category-name');
    const categoryPathInput = document.getElementById('category-path');
    const categoryIconInput = document.getElementById('category-icon');
    const addCategorySubmitBtn = document.getElementById('add-category-submit');
    const addCategoryFeedback = document.getElementById('add-category-feedback');
    const adminOverlay = document.getElementById('admin-overlay');
    const appContent = document.getElementById('app-content');

    // Elementi per la nuova funzionalità di ricerca
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    
    // =================================================================
    // 2. VARIABILI DI STATO E CONFIGURAZIONE
    // =================================================================
    const db = firebase.firestore();
    let allSearchableData = []; // Array che conterrà tutti i dati per la ricerca
    let isDataFetched = false;   // Flag per evitare di ricaricare i dati più volte
    const currentlyOpenSubmenu = { btn: null, menu: null };

    // =================================================================
    // 3. LOGICA DI BUSINESS (FUNZIONI)
    // =================================================================

    // --- Funzioni per la gestione dei Sottomenu ---
    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;
        const isCurrentlyVisible = submenu.classList.contains('visible');

        // Chiudi qualsiasi altro sottomenu aperto
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) {
                currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
                currentlyOpenSubmenu.btn.classList.remove('active');
            }
        }

        // Apri/Chiudi il sottomenu corrente
        if (!isCurrentlyVisible) {
            submenu.classList.add('visible');
            button.setAttribute('aria-expanded', 'true');
            button.classList.add('active');
            currentlyOpenSubmenu.btn = button;
            currentlyOpenSubmenu.menu = submenu;
        } else {
            submenu.classList.remove('visible');
            button.setAttribute('aria-expanded', 'false');
            button.classList.remove('active');
            if (currentlyOpenSubmenu.menu === submenu) {
                currentlyOpenSubmenu.btn = null;
                currentlyOpenSubmenu.menu = null;
            }
        }
    };

    // --- Funzioni per il pannello "Aggiungi Categoria" ---
    const showAddCategoryPanel = () => {
        if (!addCategoryPanel || !adminOverlay || !categoryNameInput) return;
        addCategoryPanel.classList.remove('hidden');
        adminOverlay.classList.remove('hidden');
        categoryNameInput.value = ''; 
        categoryPathInput.value = ''; 
        categoryIconInput.value = '';
        if(addCategoryFeedback) addCategoryFeedback.classList.add('hidden');
        categoryNameInput.focus();
    };

    const hideAddCategoryPanel = () => {
         if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.add('hidden');
        adminOverlay.classList.add('hidden');
    };

    const handleAddCategorySubmit = () => {
        if (!categoryNameInput || !categoryPathInput || !categoryIconInput || !mainNav || !addCategoryFeedback) return;
        
        const name = categoryNameInput.value.trim();
        const path = categoryPathInput.value.trim();
        const iconClassRaw = categoryIconInput.value.trim() || 'folder'; 
        
        if (!name || !path) {
            addCategoryFeedback.textContent = 'Nome categoria e percorso sono obbligatori!';
            addCategoryFeedback.className = 'feedback-message error'; 
            addCategoryFeedback.classList.remove('hidden');
            return;
        }
        
        const newLink = document.createElement('a'); 
        newLink.href = path; 
        newLink.className = 'nav-button';
        
        const newIcon = document.createElement('i');
        newIcon.className = `fas fa-${iconClassRaw}`;

        const linkText = document.createTextNode(` ${name}`); 
        newLink.appendChild(newIcon);
        newLink.appendChild(linkText);
        
        mainNav.appendChild(newLink);
        
        categoryNameInput.value = ''; categoryPathInput.value = ''; categoryIconInput.value = '';
        addCategoryFeedback.textContent = `Categoria "${name}" aggiunta!`;
        addCategoryFeedback.className = 'feedback-message success';
        addCategoryFeedback.classList.remove('hidden');
        
        setTimeout(() => {
            addCategoryFeedback.classList.add('hidden');
        }, 3000);
        categoryNameInput.focus();
    };


    // --- Funzioni per la Ricerca Globale ---

    /**
     * Carica i dati da tutte le collezioni ricercabili in Firestore.
     * Questa funzione viene chiamata una sola volta dopo il login.
     */
    async function fetchAllSearchableData() {
        if (isDataFetched) return; // Non ricaricare se i dati sono già presenti

        console.log("Inizio caricamento dati per la ricerca...");
        if (searchInput) {
            searchInput.disabled = true;
            searchInput.placeholder = 'Caricamento dati in corso...';
        }
        
        // ===========================================================================
        // !!! IMPORTANTE: PERSONALIZZA QUESTA SEZIONE CON LE TUE COLLEZIONI !!!
        // ===========================================================================
        const collectionsToFetch = [
            { name: 'listino-clima', category: 'Clima', fields: { code: 'Codice', name: 'Descrizione' }, link: 'LISTINI/CLIMA/monosplit/index.html' },
            { name: 'listino-caldaie', category: 'Caldaie', fields: { code: 'Codice', name: 'Modello' }, link: 'LISTINI/CALDAIE/index.html' },
            { name: 'listino-scaldabagni', category: 'Scaldabagni', fields: { code: 'CODICE', name: 'DESCRIZIONE' }, link: 'LISTINI/SCALDABAGNI/index.html' },
            { name: 'listino-sanitari', category: 'Sanitari', fields: { code: 'Codice', name: 'Descrizione' }, link: 'LISTINI/SANITARI/index.html' },
            
            // Esempio per aggiungere una nuova collezione:
            // { name: 'nome-collezione-in-firestore', category: 'Nome da Mostrare', fields: { code: 'nome_campo_codice', name: 'nome_campo_descrizione' }, link: 'percorso/alla/pagina.html' },
        ];

        const promises = collectionsToFetch.map(async (col) => {
            try {
                const snapshot = await db.collection(col.name).get();
                return snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Normalizza i dati in un formato comune
                    return {
                        code: data[col.fields.code] || '',
                        name: data[col.fields.name] || '',
                        category: col.category,
                        link: col.link
                    };
                });
            } catch (error) {
                console.error(`Errore nel caricare la collezione ${col.name}:`, error);
                return []; // Ritorna un array vuoto in caso di errore per non bloccare tutto
            }
        });

        const results = await Promise.all(promises);
        allSearchableData = results.flat(); // Unisce tutti gli array di risultati in un unico grande array
        isDataFetched = true;
        
        console.log(`Caricamento completato. ${allSearchableData.length} articoli indicizzati.`);
        if(searchInput) {
            searchInput.disabled = false;
            searchInput.placeholder = 'Cerca per codice o descrizione articolo...';
        }
    }

    /**
     * Filtra i dati in memoria e chiama la funzione per visualizzarli.
     */
    function handleSearch() {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();

        if (query.length < 2) { // Non cercare se la query è troppo corta
            displayResults([]);
            return;
        }

        const filteredResults = allSearchableData.filter(item => 
            (item.name && item.name.toLowerCase().includes(query)) || 
            (item.code && item.code.toLowerCase().includes(query))
        );

        displayResults(filteredResults);
    }

    /**
     * Mostra i risultati filtrati nel contenitore HTML.
     * @param {Array} results - L'array di oggetti risultato da mostrare.
     */
    function displayResults(results) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = ''; // Pulisce i risultati precedenti

        if (results.length === 0) {
            searchResultsContainer.style.display = 'none';
            return;
        }

        searchResultsContainer.style.display = 'block';

        results.slice(0, 20).forEach(item => { // Mostra un massimo di 20 risultati
            const resultItem = document.createElement('a');
            resultItem.href = item.link; 
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <span class="item-category">${item.category}</span>
                <span class="item-code">${item.code}</span>
                ${item.name}
            `;
            searchResultsContainer.appendChild(resultItem);
        });
    }


    // =================================================================
    // 4. EVENT LISTENERS E INTEGRAZIONE
    // =================================================================

    // --- Listeners per i sottomenu ---
    if (btnListini) btnListini.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnListini, submenuListini); });
    if (btnConfiguratori) btnConfiguratori.addEventListener('click', (e) => { e.stopPropagation(); toggleSubmenu(btnConfiguratori, submenuConfiguratori); });

    // --- Listeners per il pannello "Aggiungi Categoria" ---
    if (addCategoryTriggerBtn) addCategoryTriggerBtn.addEventListener('click', showAddCategoryPanel);
    if (addCategorySubmitBtn) addCategorySubmitBtn.addEventListener('click', handleAddCategorySubmit);
    if (addCategoryCloseBtn) addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    if (adminOverlay) adminOverlay.addEventListener('click', hideAddCategoryPanel);

    // --- Listeners per la Ricerca ---
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // --- Listener Globale per chiudere popup/menu ---
    document.addEventListener('click', (event) => {
        // Chiudi sottomenu se si clicca fuori
        if (currentlyOpenSubmenu.menu && !currentlyOpenSubmenu.menu.contains(event.target) && !currentlyOpenSubmenu.btn.contains(event.target)) {
            toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu);
        }
        // Chiudi risultati ricerca se si clicca fuori
        if (searchResultsContainer && !searchResultsContainer.contains(event.target) && event.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });

    // --- Observer per attivare la ricerca dopo il login ---
    // Questo observer "ascolta" quando l'area principale dell'app (#app-content) diventa visibile.
    // È il modo più pulito per avviare il caricamento dei dati senza dover modificare auth.js.
    if (appContent) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Se la classe 'hidden' viene rimossa -> l'utente ha fatto il login
                    if (!appContent.classList.contains('hidden')) {
                        fetchAllSearchableData();
                    } else {
                        // Se la classe 'hidden' viene aggiunta -> l'utente ha fatto logout
                        allSearchableData = [];
                        isDataFetched = false;
                        if(searchResultsContainer) searchResultsContainer.style.display = 'none';
                        if(searchInput) searchInput.value = '';
                    }
                }
            }
        });

        // Avvia l'osservazione delle modifiche agli attributi di #app-content
        observer.observe(appContent, { attributes: true });
    }

}); // Fine DOMContentLoaded
