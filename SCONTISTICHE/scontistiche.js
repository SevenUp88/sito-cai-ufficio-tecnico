document.addEventListener('DOMContentLoaded', () => {
    let allDiscounts = [];
    let currentFilters = { categoria: "", marca: "" };

    const tableBody = document.getElementById('discounts-table-body');
    const categoryFilter = document.getElementById('category-filter');
    const brandFilter = document.getElementById('brand-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const loader = document.getElementById('app-loader');
    const noDataMsg = document.getElementById('no-data-message');

    // Riferimenti Calcolatore
    const cascadePriceInput = document.getElementById('cascade-price-input');
    const singlePriceInput = document.getElementById('single-price-input');
    const calcScontoInputs = Array.from({length: 6}, (_, i) => document.getElementById(`calc-sconto${i + 1}`));
    const singlePercentageInput = document.getElementById('single-percentage-input');
    const calculateAllButton = document.getElementById('calculate-all-button');
    const resetCalculatorButton = document.getElementById('reset-calculator-button');
    const cascadeResultPrice = document.getElementById('cascade-result-price');
    const cascadeResultPercentage = document.getElementById('cascade-result-percentage');
    const singlePercResultValue = document.getElementById('single-perc-result-value');
    
    function initializePage(user) { if (user) loadAndDisplayData(); }
    
    async function loadAndDisplayData() {
        if (loader) loader.style.display = 'block';
        try {
            const snapshot = await db.collection("scontisticheProdotti").get();
            allDiscounts = snapshot.docs.map(doc => doc.data());
            populateFilters(allDiscounts);
            applyFilters();
        } catch (error) { console.error("Errore:", error); } 
        finally { if (loader) loader.style.display = 'none'; }
    }

    function populateFilters(data) {
        const categories = [...new Set(data.map(i => i.categoria).filter(Boolean))].sort();
        const brands = [...new Set(data.map(i => i.marca).filter(Boolean))].sort();
        if(categoryFilter) { categoryFilter.innerHTML = '<option value="">Tutte</option>'; categories.forEach(c => categoryFilter.add(new Option(c, c))); }
        if(brandFilter) { brandFilter.innerHTML = '<option value="">Tutte</option>'; brands.forEach(b => brandFilter.add(new Option(b, b))); }
    }
    
    function applyFilters() {
        let filtered = allDiscounts.filter(i => (!currentFilters.categoria || i.categoria === currentFilters.categoria) && (!currentFilters.marca || i.marca === currentFilters.marca));
        renderTable(filtered.sort((a,b) => String(a.categoria).localeCompare(String(b.categoria))));
    }
    
    function formatValue(value, isPercent = false) {
        if (value === null || value === undefined || String(value).trim() === '') return '<span class="not-available">N/A</span>';
        let displayValue = String(value);
        if (isPercent) {
            if (displayValue.includes(';')) { return displayValue.split(';').map(s => s.trim() + '%').join(' + '); }
            return `${displayValue.replace('.', ',')}%`;
        }
        return displayValue;
    }
    
    function formatAssistenza(item) {
        const centri = [item.assistenza_cesena, item.assistenza_savignano, item.assistenza_rimini];
        const zone = ['Cesena', 'Savignano', 'Rimini'];
        const results = centri.map((centro, i) => centro ? `<strong>${zone[i]}:</strong> ${centro}` : '').filter(Boolean);
        return results.length > 0 ? results.join('<br>') : '<span class="not-available">N/A</span>';
    }

    function renderTable(data) {
        if (!tableBody || !noDataMsg) return;
        tableBody.innerHTML = '';
        noDataMsg.style.display = data.length === 0 ? 'block' : 'none';
        data.forEach(item => {
            const row = tableBody.insertRow();
            row.innerHTML = `<td>${formatValue(item.categoria)}</td><td>${formatValue(item.marca)}</td><td>${formatValue(item.sconto_in_acquisto, true)}</td><td>${formatValue(item.trasporto, true)}</td><td>${formatValue(item.sconto_in_vendita, true)}</td><td>${formatValue(item.agenzia)}</td><td>${formatAssistenza(item)}</td>`;
        });
    }

    function applyCascadingDiscounts(base, discounts) { return discounts.reduce((p, d) => p * (1 - d / 100), base); }

    if (calculateAllButton) calculateAllButton.addEventListener('click', () => {
        // Cascata
        const baseCascade = parseFloat(cascadePriceInput.value);
        if (!isNaN(baseCascade)) {
            const discounts = calcScontoInputs.map(input => parseFloat(input.value)).filter(val => !isNaN(val) && val > 0);
            const finalPrice = applyCascadingDiscounts(baseCascade, discounts);
            const totalDiscount = (discounts.length > 0) ? 100 - (finalPrice / baseCascade * 100) : 0;
            if(cascadeResultPrice) cascadeResultPrice.textContent = finalPrice.toLocaleString('it-IT',{style:'currency', currency:'EUR'});
            if(cascadeResultPercentage) cascadeResultPercentage.textContent = `Sconto: ${totalDiscount.toFixed(2).replace('.',',')} %`;
        }
        // Singolo
        const baseSingle = parseFloat(singlePriceInput.value);
        const perc = parseFloat(singlePercentageInput.value);
        if (!isNaN(baseSingle) && !isNaN(perc)) {
            const result = baseSingle * perc / 100;
            if(singlePercResultValue) singlePercResultValue.textContent = result.toLocaleString('it-IT',{style:'currency', currency:'EUR'});
        }
        // Calcolo Margine (Listino / Sconto in acquisto / Sconto in vendita)
const listPrice = parseFloat(document.getElementById('margin-list-price-input').value);
const buyDiscount = parseFloat(document.getElementById('margin-buy-discount-input').value);
const sellDiscount = parseFloat(document.getElementById('margin-sell-discount-input').value);

if (!isNaN(listPrice) && !isNaN(buyDiscount) && !isNaN(sellDiscount)) {
    const cost = listPrice * (1 - buyDiscount / 100);
    const sellPrice = listPrice * (1 - sellDiscount / 100);
    const marginEuro = sellPrice - cost;
    const marginPerc = (marginEuro / sellPrice) * 100;

    document.getElementById('margin-result-euro').textContent =
        marginEuro.toLocaleString('it-IT', {style:'currency', currency:'EUR'});
    document.getElementById('margin-result-percent').textContent =
        `${marginPerc.toFixed(2).replace('.', ',')} %`;
}

    });

    if (resetCalculatorButton) resetCalculatorButton.addEventListener('click', () => {
        cascadePriceInput.value = ''; singlePriceInput.value = ''; singlePercentageInput.value = '';
        calcScontoInputs.forEach(input => input.value = '');
        document.getElementById('margin-list-price-input').value = '';
document.getElementById('margin-buy-discount-input').value = '';
document.getElementById('margin-sell-discount-input').value = '';
document.getElementById('margin-result-euro').textContent = '0,00 €';
document.getElementById('margin-result-percent').textContent = '0 %';

        if(cascadeResultPrice) cascadeResultPrice.textContent = "0,00 €";
        if(cascadeResultPercentage) cascadeResultPercentage.textContent = "Sconto: 0,00 %";
        if(singlePercResultValue) singlePercResultValue.textContent = "0,00 €";
    });
    
    if(categoryFilter) categoryFilter.addEventListener('change', (e) => { currentFilters.categoria = e.target.value; applyFilters(); });
    if(brandFilter) brandFilter.addEventListener('change', (e) => { currentFilters.marca = e.target.value; applyFilters(); });
    if(resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => { if(categoryFilter) categoryFilter.value = ''; if(brandFilter) brandFilter.value = ''; currentFilters = { categoria: "", marca: "" }; applyFilters(); });

    auth.onAuthStateChanged(initializePage);
});
