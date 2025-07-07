/*
 * Script per la Home Page dell'applicazione CAI Ufficio Tecnico
 * VERSIONE FINALE E STABILE - Con formattazione decimale a due cifre fisse.
 * Gestisce: Sottomenu, Pannello Admin, Ricerca Globale, Modal Dettagli.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. SELEZIONE DEGLI ELEMENTI DOM
    const btnListini = document.getElementById('btn-listini'),
        submenuListini = document.getElementById('submenu-listini'),
        btnConfiguratori = document.getElementById('btn-configuratori'),
        submenuConfiguratori = document.getElementById('submenu-configuratori'),
        mainNav = document.getElementById('mainNav'),
        appContent = document.getElementById('app-content'),
        addCategoryTriggerBtn = document.getElementById('add-category-trigger'),
        addCategoryPanel = document.getElementById('add-category-panel'),
        addCategoryCloseBtn = document.getElementById('add-category-close'),
        categoryNameInput = document.getElementById('category-name'),
        categoryPathInput = document.getElementById('category-path'),
        categoryIconInput = document.getElementById('category-icon'),
        addCategorySubmitBtn = document.getElementById('add-category-submit'),
        addCategoryFeedback = document.getElementById('add-category-feedback'),
        adminOverlay = document.getElementById('admin-overlay'),
        searchInput = document.getElementById('search-input'),
        searchResultsContainer = document.getElementById('search-results'),
        detailsModalOverlay = document.getElementById('product-details-modal-overlay'),
        modalProductLogo = document.getElementById('modal-product-logo'),
        modalProductBrand = document.getElementById('modal-product-brand'),
        modalProductModel = document.getElementById('modal-product-model'),
        modalProductImage = document.getElementById('modal-product-image'),
        modalProductPrice = document.getElementById('modal-product-price'),
        closeModalBtn = document.getElementById('close-modal-btn'),
        modalDatasheetLink = document.getElementById('modal-datasheet-link'),
        modalMainDetailsTitle = document.querySelector('.modal-details-container h3:nth-of-type(1)'),
        modalExtraDetailsTitle = document.querySelector('.modal-details-container h3:nth-of-type(2)');

    // 2. VARIABILI DI STATO E CONFIGURAZIONE
    const db = firebase.firestore();
    let allSearchableData = [];
    let isDataFetched = false;
    let currentlyDisplayedResults = [];
    const currentlyOpenSubmenu = { btn: null, menu: null };

    // 3. FUNZIONI
    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;
        const isCurrentlyVisible = submenu.classList.contains('visible');
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
        }
        button.setAttribute('aria-expanded', String(!isCurrentlyVisible));
        submenu.classList.toggle('visible', !isCurrentlyVisible);
        currentlyOpenSubmenu.btn = isCurrentlyVisible ? button : null;
        currentlyOpenSubmenu.menu = isCurrentlyVisible ? submenu : null;
    };
    const showAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.remove('hidden'); if (adminOverlay) adminOverlay.classList.remove('hidden'); };
    const hideAddCategoryPanel = () => { if (addCategoryPanel) addCategoryPanel.classList.add('hidden'); if (adminOverlay) adminOverlay.classList.add('hidden'); };
    const handleAddCategorySubmit = () => {
        if (!categoryNameInput || !categoryPathInput || !categoryIconInput || !mainNav) return;
        const name = categoryNameInput.value.trim(), path = categoryPathInput.value.trim(), icon = categoryIconInput.value.trim() || 'fas fa-folder';
        if (!name || !path) return;
        const link = document.createElement('a'); link.href = path; link.className = 'nav-button';
        const i = document.createElement('i'); i.className = icon;
        link.append(i, ` ${name}`);
        mainNav.appendChild(link);
    };
    const formatPrice = (price) => !isNaN(Number(price)) && String(price).trim() !== '' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(price)) : 'N/D';
    
    // ======== FUNZIONE createDetailRowHTML CON FORMATAZIONE DECIMALI ========
    const createDetailRowHTML = (label, value, unit = '') => {
        if (value == null || String(value).trim() === '') return '';
        
        let displayValue;
        // Controlla se il valore può essere convertito in un numero
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
            // Se è un numero, formattalo a 2 decimali e usa la virgola
            displayValue = Number(value).toFixed(2).replace('.', ',');
        } else {
            // Altrimenti, usa il valore come stringa (per i codici, ecc.)
            displayValue = value;
        }
        
        return `<li><strong>${label}:</strong><span>${displayValue}${unit}</span></li>`;
    };

    const getCorrectedPath = (path) => path && path.startsWith('../') ? `LISTINI/CLIMA/${path.substring(3)}` : (path || 'LISTINI/CLIMA/images/placeholder.png');
    const closeModal = () => { document.body.classList.remove('modal-open'); if (detailsModalOverlay) detailsModalOverlay.classList.remove('visible'); };
    const populateAndShowModal = (product) => {
        if (!product || !detailsModalOverlay) return;
        const config = product.config;
        const modalPower = document.getElementById('modal-product-power'), modalEnergyInfo = document.querySelector('.modal-energy-info'), modalEnergyCooling = document.getElementById('modal-energy-cooling'), modalEnergyHeating = document.getElementById('modal-energy-heating'), modalCode = document.getElementById('modal-product-code'), modalTechDetails = document.getElementById('modal-tech-details');
        
        let imageUrl = product.image_url;
        if (!imageUrl && product.modello) { const p = allSearchableData.find(i => i.modello === product.modello && i.image_url); if (p) imageUrl = p.image_url; }

        modalProductBrand.textContent = product.marca || 'N/D';
        modalProductModel.textContent = product.modello || 'N/D';
        modalProductImage.src = getCorrectedPath(imageUrl);
        modalProductImage.onerror = () => { modalProductImage.src = 'LISTINI/CLIMA/images/placeholder.png'; };

        if (modalPower) modalPower.innerHTML = `<strong>Potenza:</strong><br>${product.potenza || ''}`;
        if (modalEnergyCooling && modalEnergyHeating) {
            const cooling = product.classe_energetica_raffrescamento, heating = product.classe_energetica_riscaldamento;
            if(cooling || heating) { modalEnergyInfo.style.display = 'flex'; modalEnergyCooling.textContent = cooling || '-'; modalEnergyHeating.textContent = heating || '-'; } 
            else { modalEnergyInfo.style.display = 'none'; }
        }
        if (modalCode) modalCode.innerHTML = `<strong>Codice Prodotto:</strong><br>${product[config.code_field] || ''}`;
        modalProductPrice.textContent = formatPrice(product[config.price_field]);
        modalDatasheetLink.classList.toggle('hidden', !product.scheda_tecnica_url);
        if (product.scheda_tecnica_url) modalDatasheetLink.href = product.scheda_tecnica_url;

        const techDetailsHTML = `<h3>Specifiche Tecniche</h3><ul>${[createDetailRowHTML('Articolo Fornitore', product.articolo_fornitore), createDetailRowHTML('Dimensioni UI (AxLxP)', product.dimensioni_ui || product.dimensioni_peso_ui, ' mm'), createDetailRowHTML('Dimensioni UE (AxLxP)', product.dimensioni_ue, ' mm'), createDetailRowHTML('Peso UI', product.peso_ui, ' kg'), createDetailRowHTML('Peso UE', product.peso_ue, ' kg')].join('')}</ul>
                               <h3>Dettagli Energetici</h3><ul>${[createDetailRowHTML('Gas Refrigerante', product.gas), createDetailRowHTML('Contenuto Gas', product.quantita_gas, ' kg'), createDetailRowHTML('EER', product.eer), createDetailRowHTML('COP', product.cop)].join('')}</ul>`;
        if (modalTechDetails) modalTechDetails.innerHTML = techDetailsHTML;
        
        document.body.classList.add('modal-open'); detailsModalOverlay.classList.add('visible');
    };

    const fetchAllSearchableData = async () => { if (isDataFetched) return; searchInput.disabled = true; searchInput.placeholder = 'Caricamento...'; const c = [{n:'prodottiClimaMonosplit',c:'Monosplit',cf:{cf:'codice_prodotto',pf:'prezzo'}},{n:'outdoorUnits',c:'U. Esterna',cf:{cf:'codice_prodotto',pf:'prezzo'}},{n:'indoorUnits',c:'U. Interna',cf:{cf:'codice_prodotto',pf:'prezzo_ui'}}]; const p = c.map(async (i)=>{try{const s=await db.collection(i.n).get();return s.docs.map(d=>({...d.data(),id:d.id,category:i.c,config:i.cf}))}catch(e){return[]}}); allSearchableData=(await Promise.all(p)).flat(); isDataFetched = true; searchInput.disabled = false; searchInput.placeholder = 'Cerca...'; };
    const handleSearch = () => { if (!searchInput) return; const q = searchInput.value.trim(); if (q.length < 3) { displayResults([]); return; } const n=/^\d+$/.test(q); const r = allSearchableData.filter(i=>{if(n){const v=i[i.config.code_field];if(!v)return false;if(/^\d+$/.test(String(v)))return String(v)===q;return(String(v).match(/\d+/g)||[]).some(c=>c===q)}const l=q.toLowerCase();return i.modello?.toLowerCase().includes(l)||i.marca?.toLowerCase().includes(l)}); currentlyDisplayedResults = r; displayResults(r); };
    const displayResults = (r) => { if (!searchResultsContainer) return; searchResultsContainer.innerHTML = ''; if (r.length === 0) { searchResultsContainer.style.display = 'none'; return; } searchResultsContainer.style.display = 'block'; r.slice(0, 20).forEach((i, x) => { const a = document.createElement('a'); a.href="#"; a.className='result-item'; a.dataset.resultIndex=x; const m=[i.marca, i.modello, i.potenza].filter(Boolean).join(' '); const p=formatPrice(i[i.config.price_field]); const d=i.articolo_fornitore || `Codice: ${i[i.config.code_field] || 'N/D'}`; a.innerHTML=`<div style="display:flex;flex-direction:column;width:100%;gap:4px"><div style="display:flex;justify-content:space-between;align-items:flex-start"><span style="font-weight:500">${m||'Prodotto'}</span><span class="item-category">${i.category}</span></div><div style="font-size:0.85em;opacity:0.8;display:flex;justify-content:space-between;align-items:center"><span style="max-width:70%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d}</span><span style="font-weight:bold;color:#0056a8;font-size:1.1em">${p}</span></div></div>`; searchResultsContainer.appendChild(a); }); };
    
    // 4. EVENT LISTENERS
    if(btnListini)btnListini.addEventListener('click',e=>e.stopPropagation()||toggleSubmenu(btnListini,submenuListini));if(btnConfiguratori)btnConfiguratori.addEventListener('click',e=>e.stopPropagation()||toggleSubmenu(btnConfiguratori,submenuConfiguratori));if(addCategoryTriggerBtn)addCategoryTriggerBtn.addEventListener('click',showAddCategoryPanel);if(addCategorySubmitBtn)addCategorySubmitBtn.addEventListener('click',handleAddCategorySubmit);if(addCategoryCloseBtn)addCategoryCloseBtn.addEventListener('click',hideAddCategoryPanel);if(adminOverlay)adminOverlay.addEventListener('click',hideAddCategoryPanel);if(searchInput){searchInput.addEventListener('input',handleSearch);searchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handleSearch();}});}
    if(searchResultsContainer)searchResultsContainer.addEventListener('click',e=>{const i=e.target.closest('.result-item');if(!i)return;e.preventDefault();const p=currentlyDisplayedResults[parseInt(i.dataset.resultIndex,10)];if(p){populateAndShowModal(p);searchResultsContainer.style.display='none';}});
    document.addEventListener('click',e=>{if(currentlyOpenSubmenu.menu&&!currentlyOpenSubmenu.menu.contains(e.target)&&!currentlyOpenSubmenu.btn.contains(e.target)){toggleSubmenu(currentlyOpenSubmenu.btn,currentlyOpenSubmenu.menu)}if(searchResultsContainer&&!searchResultsContainer.contains(e.target)&&e.target!==searchInput){searchResultsContainer.style.display='none'}});
    const c=()=>{closeModal();handleSearch()};if(closeModalBtn)closeModalBtn.addEventListener('click',c);if(detailsModalOverlay)detailsModalOverlay.addEventListener('click',e=>{if(e.target===detailsModalOverlay)c()});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&detailsModalOverlay?.classList.contains('visible')){e.preventDefault();c()}});
    
    // FLUSSO PRINCIPALE
    if(appContent)new MutationObserver(m=>{m.forEach(i=>{if(i.attributeName==='class'){if(!appContent.classList.contains('hidden'))fetchAllSearchableData();else{allSearchableData=[];isDataFetched=false}}})}).observe(appContent,{attributes:true});
});
