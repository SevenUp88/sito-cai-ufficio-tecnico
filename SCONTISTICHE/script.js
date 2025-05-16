document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Scontistiche Script");

    const firebaseConfig = { /* ... your config ... */ };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth(); // For admin functionality

    // DOM Elements for Scontistiche page (use IDs from SCONTISTICHE/index.html)
    const scontiListContainer = document.getElementById('sconti-list-container');
    const brandFilterButtonsScontistiche = document.getElementById('brand-filter-buttons-scontistiche');
    const searchInputScontistiche = document.getElementById('search-input-scontistiche');
    const resetFiltersBtnScontistiche = document.getElementById('reset-filters-btn-scontistiche');
    const loadingIndicatorScontistiche = document.getElementById('loading-indicator-scontistiche');
    const noResultsMessageScontistiche = document.getElementById('no-results-message-scontistiche');
    const currentYearElScontistiche = document.getElementById('current-year-scontistiche');
    const dataUpdateDateElScontistiche = document.getElementById('data-update-date-scontistiche');
    // Admin and Login Modal elements similar to caldaie
    window.currentUserRole = null; // Or specific for this page: window.scontisticheAdminRole


    let allDiscountItems = [];
    let currentScontiFilters = {
        brand: "",
        searchTerm: ""
    };

    // Base URL for product images IF your CSV/Firestore contains image filenames for discounted items
    const itemImageBaseUrl = 'img/prodotti/'; // Example: You'd need to create this folder structure
    const placeholderItemImage = itemImageBaseUrl + 'placeholder_item.png';
    const brandLogoBaseUrlScontistiche = '../LISTINI/CALDAIE/img/logos/'; // Assuming same brand logos

    function escapeHtml(unsafe) { /* ... same as caldaie ... */ return unsafe; } // Placeholder
    function formatPrice(price) { /* ... same as caldaie ... */ return price ? `${price.toFixed(2)} €` : null; } // Placeholder


    async function fetchScontiFromFirestore() {
        console.log("Fetching 'scontiProdotti' from Firestore...");
        loadingIndicatorScontistiche.style.display = 'block';
        noResultsMessageScontistiche.style.display = 'none';
        scontiListContainer.innerHTML = '';
        try {
            // Decide on ordering, e.g., by marca then by nomeArticolo
            const snapshot = await db.collection('scontiProdotti').orderBy('marca').orderBy('nomeArticolo').get();
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`Fetched ${items.length} discount items.`);
            return items;
        } catch (error) {
            console.error("Error fetching sconti:", error);
            if (error.message.includes("requires an index")) {
                noResultsMessageScontistiche.innerHTML = `Errore: Indice mancante in Firestore. Controlla la console per il link per crearlo: <br><small>${escapeHtml(error.message)}</small>`;
            } else {
                noResultsMessageScontistiche.textContent = 'Errore caricamento scontistiche.';
            }
            noResultsMessageScontistiche.style.display = 'block';
            return [];
        } finally {
            loadingIndicatorScontistiche.style.display = 'none';
        }
    }

    function populateScontiBrandFilterButtons(items) {
        const brands = new Set();
        items.forEach(item => { if (item.marca) brands.add(item.marca); });

        if (!brandFilterButtonsScontistiche) return;
        brandFilterButtonsScontistiche.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active'; // Active by default
        allBtn.textContent = 'Tutte le Marche';
        allBtn.dataset.filterValue = '';
        allBtn.addEventListener('click', () => handleScontiBrandFilterClick(''));
        brandFilterButtonsScontistiche.appendChild(allBtn);

        Array.from(brands).sort().forEach(brand => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = brand;
            btn.dataset.filterValue = brand;
            btn.addEventListener('click', () => handleScontiBrandFilterClick(brand));
            brandFilterButtonsScontistiche.appendChild(btn);
        });
    }

    function handleScontiBrandFilterClick(brandValue) {
        currentScontiFilters.brand = brandValue;
        brandFilterButtonsScontistiche.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filterValue === brandValue);
        });
        applyScontiFiltersAndSearch();
    }

    searchInputScontistiche.addEventListener('input', (e) => {
        currentScontiFilters.searchTerm = e.target.value.toLowerCase().trim();
        // Add debounce if needed
        applyScontiFiltersAndSearch();
    });
    
    if (resetFiltersBtnScontistiche) {
        resetFiltersBtnScontistiche.addEventListener('click', () => {
            currentScontiFilters.brand = "";
            currentScontiFilters.searchTerm = "";
            searchInputScontistiche.value = "";
            if (brandFilterButtonsScontistiche) {
                brandFilterButtonsScontistiche.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.filterValue === "");
                });
            }
            resetFiltersBtnScontistiche.style.display = 'none';
            applyScontiFiltersAndSearch();
        });
    }
    
    function updateScontiResetButtonVisibility() {
        if (!resetFiltersBtnScontistiche) return;
        if (currentScontiFilters.brand || currentScontiFilters.searchTerm) {
            resetFiltersBtnScontistiche.style.display = 'inline-block';
        } else {
            resetFiltersBtnScontistiche.style.display = 'none';
        }
    }


    function applyScontiFiltersAndSearch() {
        let filteredItems = [...allDiscountItems];
        if (currentScontiFilters.brand) {
            filteredItems = filteredItems.filter(item => item.marca === currentScontiFilters.brand);
        }
        if (currentScontiFilters.searchTerm) {
            const term = currentScontiFilters.searchTerm;
            filteredItems = filteredItems.filter(item =>
                (item.marca || '').toLowerCase().includes(term) ||
                (item.categoria || '').toLowerCase().includes(term) ||
                (item.nomeArticolo || '').toLowerCase().includes(term) ||
                (item.codiceArticolo || '').toLowerCase().includes(term)
            );
        }
        displayDiscountItems(filteredItems);
        updateScontiResetButtonVisibility();
    }

    function createDiscountItemCard(item) {
        const card = document.createElement('div');
        card.classList.add('sconto-card'); // Use .sconto-card class

        const brandLogoImgName = item.logoMarcaFile || `${item.marca ? item.marca.toLowerCase().replace(/\s+/g, '_') : 'default'}_logo.png`; // Guess logo name
        const brandLogoUrl = brandLogoImgName ? brandLogoBaseUrlScontistiche + brandLogoImgName : '';

        // Image for the discounted item itself
        const itemImageName = item.immagineFile || 'placeholder_item.png'; // Field for item's own image
        const itemImageUrl = itemImageBaseUrl + itemImageName;

        // Sconti Applicabili: split string by ';' and create list items
        let scontiListHTML = '';
        if (item.scontiApplicabili && typeof item.scontiApplicabili === 'string') {
            const scontiArray = item.scontiApplicabili.split(';').map(s => s.trim()).filter(s => s);
            if (scontiArray.length > 0) {
                scontiListHTML = '<ul class="sconti-applicati-list">';
                scontiArray.forEach(sconto => {
                    scontiListHTML += `<li>${escapeHtml(sconto)}</li>`;
                });
                scontiListHTML += '</ul>';
            }
        } else if (Array.isArray(item.scontiApplicabili) && item.scontiApplicabili.length > 0) { // If it's already an array
            scontiListHTML = '<ul class="sconti-applicati-list">';
            item.scontiApplicabili.forEach(sconto => {
                 scontiListHTML += `<li>${escapeHtml(String(sconto).trim())}</li>`;
            });
            scontiListHTML += '</ul>';
        }


        card.innerHTML = `
            <div class="sconto-card-header">
                ${brandLogoUrl ? `<img src="${escapeHtml(brandLogoUrl)}" alt="${escapeHtml(item.marca || '')} Logo" class="brand-logo-scontistiche" onerror="this.style.display='none';">` : ''}
                <div class="item-title-brand">
                    <h3 class="item-name">${escapeHtml(item.nomeArticolo || 'Articolo non specificato')}</h3>
                    ${item.marca ? `<span class="item-brand-text">${escapeHtml(item.marca)}</span>` : ''}
                </div>
            </div>

            ${item.immagineFile ? `
            <div class="item-image-container">
                <img src="${escapeHtml(itemImageUrl)}" alt="Immagine ${escapeHtml(item.nomeArticolo || 'Articolo')}"
                     onerror="this.onerror=null; this.src='${escapeHtml(placeholderItemImage)}'; this.alt='Immagine articolo non disponibile';">
            </div>` : ''}

            <div class="sconto-info">
                ${item.codiceArticolo ? `<p><strong>Codice:</strong> ${escapeHtml(item.codiceArticolo)}</p>` : ''}
                ${item.categoria ? `<p><strong>Categoria:</strong> ${escapeHtml(item.categoria)}</p>` : ''}

                <p>
                    <strong>Prezzo:</strong>
                    ${item.prezzoListino ? `<span class="prezzo-originale">${formatPrice(item.prezzoListino)}</span>` : ''}
                    ${item.prezzoNetto ? `<span class="prezzo-finale">${formatPrice(item.prezzoNetto)}</span>` : (item.prezzoListino ? '' : 'N/D')}
                </p>

                ${scontiListHTML ? `<p><strong>Sconti Applicati:</strong></p>${scontiListHTML}` : (item.scontiApplicabili ? `<p><strong>Sconto:</strong> ${escapeHtml(item.scontiApplicabili)}</p>`: '')}
                
                ${item.note ? `<p><strong>Note:</strong> ${escapeHtml(item.note)}</p>` : ''}
                ${(item.dataInizio || item.dataFine) ? `
                    <p class="validita-sconto">
                        Validità: 
                        ${item.dataInizio ? `dal ${escapeHtml(new Date(item.dataInizio.seconds * 1000).toLocaleDateString('it-IT'))}` : ''}
                        ${item.dataFine ? ` al ${escapeHtml(new Date(item.dataFine.seconds * 1000).toLocaleDateString('it-IT'))}` : ''}
                    </p>` : ''
                }
            </div>
        `;
        return card;
    }

    function displayDiscountItems(itemsToDisplay) {
        scontiListContainer.innerHTML = '';
         if (itemsToDisplay.length === 0 && (currentScontiFilters.brand || currentScontiFilters.searchTerm)) {
            noResultsMessageScontistiche.textContent = 'Nessun prodotto scontato trovato con i filtri selezionati.';
            noResultsMessageScontistiche.style.display = 'block';
            return;
        } else if (itemsToDisplay.length === 0) {
             noResultsMessageScontistiche.textContent = 'Nessuna scontistica disponibile al momento.';
             noResultsMessageScontistiche.style.display = 'block';
             return;
        }
        noResultsMessageScontistiche.style.display = 'none';
        itemsToDisplay.forEach(item => {
            scontiListContainer.appendChild(createDiscountItemCard(item));
        });
    }

    async function initializeScontistichePage() {
        if (currentYearElScontistiche) currentYearElScontistiche.textContent = new Date().getFullYear();
        
        allDiscountItems = await fetchScontiFromFirestore();
        if (allDiscountItems.length > 0) {
            populateScontiBrandFilterButtons(allDiscountItems);
            displayDiscountItems(allDiscountItems);
        }
        updateScontiResetButtonVisibility();

        // Metadata Listener for scontistiche
        // Adjust doc ID and field name if different for scontistiche
        if (metadataListener) metadataListener();
        metadataListener = db.collection('metadata').doc('listiniInfo') // Or a specific doc for sconti
            .onSnapshot(doc => {
                if (dataUpdateDateElScontistiche) {
                    // Use a field like 'scontisticheLastUpdate' or a general one
                    const updateTimestamp = doc.exists ? (doc.data()?.scontisticheLastUpdate || doc.data()?.lastDataUpdate) : null;
                    if (updateTimestamp && updateTimestamp.seconds) {
                        dataUpdateDateElScontistiche.textContent = new Date(updateTimestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                    } else { dataUpdateDateElScontistiche.textContent = "Non specificato"; }
                }
            }, error => {
                console.error("Error fetching sconti metadata:", error);
                if (dataUpdateDateElScontistiche) dataUpdateDateElScontistiche.textContent = new Date().toLocaleDateString('it-IT');
            });

        // Integrate setupAuthUI from your other script, adapting IDs for this page's modal
        // setupAuthUI_Scontistiche(); // You'll need to create/adapt this
        // toggleAdminScontisticheSectionVisibility();
    }

    initializeScontistichePage();

    // TODO: Adapt and include your setupAuthUI() function,
    //       renaming IDs like 'login-modal-caldaie' to 'login-modal-scontistiche', etc.
    //       and toggleAdminScontisticheSectionVisibility() to use 'admin-section-scontistiche'.
});
