// --- File: listini-scaldabagni.js (con Loghi, Percorsi Corretti) ---
document.addEventListener('DOMContentLoaded', () => {
    
    let allProducts = [];
    let currentFilters = { marca: "", tecnologia: "", litri: "", configurazione: "", installazione: "" };
    // --- PERCORSI IMMAGINI FINALI E CORRETTI ---
    const IMAGE_BASE_URL = "img/";
    const LOGO_BASE_URL = "img/"; // I loghi sono nella cartella img locale
    const PLACEHOLDER_IMAGE = "../../placeholder.png";

    const appLoader = document.getElementById('app-loader');
    const container = document.getElementById('products-card-container');
    const noDataMsg = document.getElementById('no-data-message');
    const filtersToWatch = {
        'brand-filter': 'marca', 'tecnologia-filter': 'tecnologia',
        'litri-filter': 'litri', 'configurazione-filter': 'configurazione',
        'installazione-filter': 'installazione'
    };

    function initializePage(user) { if (user) loadAndDisplayData(); }

    async function loadAndDisplayData() {
        if (appLoader) appLoader.style.display = 'block';
        try {
            const snapshot = await db.collection("prodottiScaldabagno").orderBy("marca").get();
            allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            populateFilters(allProducts);
            applyFilters();
        } catch (error) { console.error("Errore nel caricamento dati:", error); } 
        finally { if (appLoader) appLoader.style.display = 'none'; }
    }
    
    function populateFilters(products) {
       for (const id in filtersToWatch) {
            const key = filtersToWatch[id];
            const select = document.getElementById(id);
            if(select) {
                const options = [...new Set(products.map(p => p[key]).filter(Boolean))].sort((a,b) => key === 'litri' ? a - b : String(a).localeCompare(String(b)));
                select.innerHTML = '<option value="">Tutte</option>';
                options.forEach(val => select.add(new Option(val, val)));
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
        if(noDataMsg) noDataMsg.style.display = products.length === 0 ? 'block' : 'none';
        
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            const price = p.prezzo ? `${parseFloat(p.prezzo).toFixed(2).replace('.', ',')} €` : 'N/D';
            const imageUrl = p.nome_immagine ? IMAGE_BASE_URL + p.nome_immagine : PLACEHOLDER_IMAGE;
            // Correzione nome file logo
            const logoUrl = p.marca ? `${LOGO_BASE_URL}${p.marca.toLowerCase().replace(/\s+/g, '')}.png` : '';
            const datasheetBtn = p.scheda_tecnica_url ? `<a href="${p.scheda_tecnica_url}" target="_blank" class="card-link-button scheda-tecnica" onclick="event.stopPropagation()"><i class="fas fa-file-pdf"></i> Scheda</a>` : '<div></div>';
            
            card.innerHTML = `
                 <div class="product-card-header">
                     ${logoUrl ? `<img src="${logoUrl}" class="product-logo" alt="${p.marca}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">` : ''}
                     <div class="product-title-brand">
                        <!-- Il testo del brand viene mostrato solo se l'immagine del logo non si carica -->
                        <span class="product-card-brand" style="display:none;">${p.marca || ''}</span>
                        <h3 class="product-card-model">${p.modello || ''}</h3>
                     </div>
                 </div>
                 <div class="product-card-body-flex">
                    <div class="product-card-info-column">
                       <p><strong>Codice:</strong> ${p.codice_prodotto || 'N/A'}</p>
                       <p><strong>Litri:</strong> ${p.litri || 'N/A'}</p>
                       <p><strong>Tecnologia:</strong> ${p.tecnologia || 'N/A'}</p>
                    </div>
                    <div class="product-card-image-container">
                        ${imageUrl ? `<img src="${imageUrl}" class="product-card-image" alt="${p.modello}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';">` : ''}
                    </div>
                 </div>
                 <div class="product-card-footer">
                    <p class="product-card-price">${price}</p>
                    ${datasheetBtn}
                 </div>`;
            container.appendChild(card);
        });
    }
    
    for(const id in filtersToWatch){
        const el = document.getElementById(id);
        if(el){
            el.addEventListener('change', () => {
                const key = filtersToWatch[id];
                currentFilters[key] = el.value;
                applyFilters();
            });
        }
    }

    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
       for(const id in filtersToWatch){
           const el = document.getElementById(id);
           if (el) el.value = '';
        }
       currentFilters = { marca: "", tecnologia: "", litri: "", configurazione: "", installazione: "" };
       applyFilters();
    });

    auth.onAuthStateChanged(initializePage);
});
```Sostituisci questo file. Una volta ricaricata la pagina, i loghi verranno caricati dalla cartella corretta e il testo della marca sparirà come previsto.
