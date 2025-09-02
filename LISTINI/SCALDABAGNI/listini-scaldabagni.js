document.addEventListener('DOMContentLoaded', () => {
    let allProducts = [];
    let currentFilters = { marca: "", tecnologia: "", litri: "", configurazione: "", installazione: "" };
    const IMAGE_BASE_URL = "img/";

    // Seleziona elementi DOM
    const appLoader = document.getElementById('app-loader');
    const container = document.getElementById('products-card-container');
    const noDataMsg = document.getElementById('no-data-message');
    const filtersToWatch = ['brand-filter', 'tecnologia-filter', 'litri-filter', 'configurazione-filter', 'installazione-filter'];

    function initializePage(user) { if (user) loadAndDisplayData(); }

    async function loadAndDisplayData() {
        if (appLoader) appLoader.style.display = 'block';
        try {
            const snapshot = await db.collection("prodottiScaldabagno").orderBy("marca").get();
            allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            populateFilters(allProducts);
            applyFilters();
        } catch (error) { console.error("Errore:", error); } 
        finally { if (appLoader) appLoader.style.display = 'none'; }
    }
    
    function populateFilters(products) {
        const createOptions = (key) => [...new Set(products.map(p => p[key]).filter(Boolean))].sort((a,b) => key === 'litri' ? a - b : String(a).localeCompare(String(b)));
        const filtersSetup = {
            'brand-filter': createOptions('marca'), 'tecnologia-filter': createOptions('tecnologia'),
            'litri-filter': createOptions('litri'), 'configurazione-filter': createOptions('configurazione'),
            'installazione-filter': createOptions('installazione')
        };
        for(const id in filtersSetup) {
            const select = document.getElementById(id);
            if(select) {
                select.innerHTML = '<option value="">Tutte</option>';
                filtersSetup[id].forEach(val => select.add(new Option(val, val)));
            }
        }
    }
    
    function applyFilters() {
       let filtered = allProducts.filter(p => {
           return (!currentFilters.marca || p.marca === currentFilters.marca) &&
                  (!currentFilters.tecnologia || p.tecnologia === currentFilters.tecnologia) &&
                  (!currentFilters.litri || String(p.litri) === currentFilters.litri) &&
                  (!currentFilters.configurazione || p.configurazione === currentFilters.configurazione) &&
                  (!currentFilters.installazione || p.installazione === currentFilters.installazione);
       });
       renderCards(filtered);
    }
    
    function renderCards(products) {
        if (!container) return;
        container.innerHTML = '';
        (noDataMsg) && (noDataMsg.style.display = products.length === 0 ? 'block' : 'none');
        
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const price = p.prezzo ? `${parseFloat(p.prezzo).toFixed(2)} €` : 'N/D';
            const imageUrl = p.nome_immagine ? IMAGE_BASE_URL + p.nome_immagine : '';
            const logoUrl = p.marca ? `../../images/logos/${p.marca.toLowerCase().replace(/\s+/g, '_')}.png` : '';
            const datasheetBtn = p.scheda_tecnica_url ? `<a href="${p.scheda_tecnica_url}" target="_blank" class="card-link-button scheda-tecnica" onclick="event.stopPropagation()"><i class="fas fa-file-pdf"></i> Scheda Tecnica</a>` : '<div></div>';
            
            card.innerHTML = `
                 <div class="product-card-header">
                     ${logoUrl ? `<img src="${logoUrl}" class="product-logo" alt="${p.marca}" onerror="this.style.display='none'">` : ''}
                     <div class="product-title-brand"><h3>${p.modello || ''}</h3></div>
                 </div>
                 <div class="product-card-body-flex">
                    <div class="product-card-info-column">
                       <p><strong>Codice:</strong> ${p.codice_prodotto || 'N/A'}</p>
                       <p><strong>Litri:</strong> ${p.litri || 'N/A'}</p>
                       <p><strong>Tecnologia:</strong> ${p.tecnologia || 'N/A'}</p>
                    </div>
                    <div class="product-card-image-container">
                        ${imageUrl ? `<img src="${imageUrl}" class="product-card-image" alt="${p.modello}">` : ''}
                    </div>
                 </div>
                 <div class="product-card-footer">
                    <p class="product-card-price">${price}</p>
                    ${datasheetBtn}
                 </div>`;
            container.appendChild(card);
        });
    }
    
    // Aggiungi event listener ai filtri
    filtersToWatch.forEach(id => {
        const filterEl = document.getElementById(id);
        if (filterEl) {
            filterEl.addEventListener('change', () => {
                currentFilters[id.split('-')[0]] = filterEl.value;
                applyFilters();
            });
        }
    });

    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
       filtersToWatch.forEach(id => { 
           const el = document.getElementById(id); 
           if (el) el.value = '';
        });
       currentFilters = { marca: "", tecnologia: "", litri: "", configurazione: "", installazione: "" };
       applyFilters();
    });

    auth.onAuthStateChanged(initializePage);
});
```Sostituisci questi tre file e la pagina degli scaldabagni sarà finalmente perfetta, funzionale e coerente con il resto del sito.
