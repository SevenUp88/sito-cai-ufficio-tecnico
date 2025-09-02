// --- File: listini-scaldabagni.js ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Le variabili `auth` e `db` sono globali, fornite da firebase-config.js e auth.js
    
    let allProducts = [];
    const IMAGE_BASE_URL = "img/";

    // Seleziona elementi DOM
    const appLoader = document.getElementById('app-loader');
    const container = document.getElementById('products-card-container');
    const noDataMsg = document.getElementById('no-data-message');
    const brandFilter = document.getElementById('brand-filter');
    // ... e altri filtri se necessario ...
    
    // Inizializza la pagina quando l'utente viene riconosciuto
    function initializePage(user) {
        if (!user) {
            // auth.js gestirà il redirect, questo è un fallback.
            console.log("Accesso negato, redirect in corso...");
            return;
        }
        
        console.log(`Utente ${user.email} riconosciuto. Caricamento dati scaldabagni...`);
        loadAndDisplayData();
    }

    async function loadAndDisplayData() {
        if (appLoader) appLoader.style.display = 'block';
        
        try {
            const snapshot = await db.collection("prodottiScaldabagno").orderBy("marca").get();
            allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            populateFilters(allProducts);
            applyFilters();

        } catch (error) {
            console.error("Errore caricamento dati:", error);
            if (noDataMsg) noDataMsg.textContent = "Errore nel caricamento dei dati.";
            if (noDataMsg) noDataMsg.style.display = 'block';
        } finally {
            if (appLoader) appLoader.style.display = 'none';
        }
    }
    
    function populateFilters(products) {
       const brands = [...new Set(products.map(p => p.marca).filter(Boolean))].sort();
       if (brandFilter) {
          brandFilter.innerHTML = '<option value="">Tutte</option>';
          brands.forEach(brand => brandFilter.add(new Option(brand, brand)));
       }
       // Popola altri filtri qui...
    }
    
    function applyFilters() {
       let filtered = [...allProducts];
       const brandValue = brandFilter.value;
       
       if (brandValue) {
          filtered = filtered.filter(p => p.marca === brandValue);
       }
       // Applica altri filtri qui...
       
       renderCards(filtered);
    }
    
    function renderCards(products) {
        if (!container) return;
        container.innerHTML = '';
        
        if (products.length === 0) {
            if (noDataMsg) noDataMsg.style.display = 'block';
            return;
        }
        if (noDataMsg) noDataMsg.style.display = 'none';
        
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Logica per creare la card HTML
            const price = p.prezzo ? `${parseFloat(p.prezzo).toFixed(2)} €` : 'N/D';
            const imageUrl = p.nome_immagine ? IMAGE_BASE_URL + p.nome_immagine : '';
            
            card.innerHTML = `
                 <div class="product-card-body">
                    <div class="product-card-details">
                       <h3 class="product-card-brand">${p.marca || ''}</h3>
                       <p class="product-card-model">${p.modello || ''}</p>
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
    
    // Aggiungi event listener ai filtri
    if (brandFilter) brandFilter.addEventListener('change', applyFilters);
    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
       if (brandFilter) brandFilter.value = '';
       // ... resetta altri filtri
       applyFilters();
    });

    // Avvia tutto solo quando l'autenticazione è confermata
    auth.onAuthStateChanged(initializePage);

});