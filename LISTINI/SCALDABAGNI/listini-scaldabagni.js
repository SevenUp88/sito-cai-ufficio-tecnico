// --- File: listini-scaldabagni.js (con Filtri Corretti e Funzionanti) ---
document.addEventListener('DOMContentLoaded', () => {
    
    let allProducts = [];
    let currentBrand = ""; // Stato per il filtro attivo
    const IMAGE_BASE_URL = "img/";

    // Seleziona elementi DOM
    const appLoader = document.getElementById('app-loader');
    const container = document.getElementById('products-card-container');
    const noDataMsg = document.getElementById('no-data-message');
    const brandFilterButtons = document.getElementById('brand-filter-buttons');
    
    function initializePage(user) {
        if (!user) return; // auth.js gestisce il redirect
        loadAndDisplayData();
    }

    async function loadAndDisplayData() {
        if (appLoader) appLoader.style.display = 'block';
        try {
            const snapshot = await db.collection("prodottiScaldabagno").orderBy("marca").get();
            allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            populateFilterButtons(allProducts);
            applyFilters();
        } catch (error) { console.error("Errore:", error); } 
        finally { if (appLoader) appLoader.style.display = 'none'; }
    }
    
    function populateFilterButtons(products) {
       const brands = [...new Set(products.map(p => p.marca).filter(Boolean))].sort();
       if (!brandFilterButtons) return;
       brandFilterButtons.innerHTML = ''; // Pulisce
       
       // Bottone "Tutte le Marche"
       const allBtn = document.createElement('button');
       allBtn.className = 'filter-btn active';
       allBtn.textContent = 'Tutte le Marche';
       allBtn.addEventListener('click', () => {
           currentBrand = "";
           document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
           allBtn.classList.add('active');
           applyFilters();
       });
       brandFilterButtons.appendChild(allBtn);

       // Bottoni per ogni marca
       brands.forEach(brand => {
           const btn = document.createElement('button');
           btn.className = 'filter-btn';
           btn.textContent = brand;
           btn.addEventListener('click', () => {
               currentBrand = brand;
               document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
               btn.classList.add('active');
               applyFilters();
           });
           brandFilterButtons.appendChild(btn);
       });
    }
    
    function applyFilters() {
       let filtered = currentBrand ? allProducts.filter(p => p.marca === currentBrand) : [...allProducts];
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
            
            card.innerHTML = `
                 <div class="product-card-header">
                     ${logoUrl ? `<img src="${logoUrl}" class="product-logo" alt="${p.marca}" onerror="this.style.display='none'">` : ''}
                     <div class="product-title-brand">
                         <h3>${p.modello || ''}</h3>
                     </div>
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
                    ${p.scheda_tecnica_url ? `<a href="${p.scheda_tecnica_url}" target="_blank" class="datasheet-link">Scheda</a>` : ''}
                 </div>
            `;
            container.appendChild(card);
        });
    }

    auth.onAuthStateChanged(initializePage);
});
