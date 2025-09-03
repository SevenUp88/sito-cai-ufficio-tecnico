document.addEventListener('DOMContentLoaded', () => {
    let allDiscounts = [];
    let currentFilters = { categoria: "", marca: "" };

    const tableBody = document.getElementById('discounts-table-body');
    const categoryFilter = document.getElementById('category-filter');
    const brandFilter = document.getElementById('brand-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const loader = document.getElementById('app-loader');
    const noDataMsg = document.getElementById('no-data-message');
    const toastElement = document.getElementById('toast-notification');

    const mainValueInput = document.getElementById('main-value-input');
    const calcScontoInputs = Array.from({length: 5}, (_, i) => document.getElementById(`calc-sconto${i + 1}`));
    const singlePercentageInput = document.getElementById('single-percentage-input');
    const calculateDiscountButton = document.getElementById('calculate-discount-button');
    const calculatePercentageButton = document.getElementById('calculate-percentage-button');
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
             // Formatta valori come "50 ; 5" in "50% + 5%"
            if (displayValue.includes(';')) {
                return displayValue.split(';').map(s => s.trim() + '%').join(' + ');
            }
            return `${displayValue.replace('.', ',')}%`;
        }
        return displayValue;
    }
    
    function formatAssistenza(item) {
        const centri = [item.assistenza_cesena, item.assistenza_savignano, item.assistenza_rimini].filter(Boolean);
        if (centri.length === 0) return '<span class="not-available">N/A</span>';
        
        const zone = ['Cesena', 'Savignano', 'Rimini'];
        return centri.map((centro, index) => `<strong>${zone[index]}:</strong> ${centro}`).join('<br>');
    }

    function renderTable(data) {
        if (!tableBody || !noDataMsg) return;
        tableBody.innerHTML = '';
        noDataMsg.style.display = data.length === 0 ? 'block' : 'none';

        data.forEach(item => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${formatValue(item.categoria)}</td>
                <td>${formatValue(item.marca)}</td>
                <td>${formatValue(item.sconto_in_acquisto, true)}</td>
                <td>${formatValue(item.trasporto, true)}</td>
                <td>${formatValue(item.sconto_in_vendita, true)}</td>
                <td>${formatValue(item.agenzia)}</td>
                <td>${formatAssistenza(item)}</td>`;
        });
    }

    function applyCascadingDiscounts(base, discounts) { return discounts.reduce((p, d) => p * (1 - d / 100), base); }

    // TUTTI I LISTENER, inclusi quelli per i singoli pulsanti del calcolatore
    if(calculateDiscountButton) calculateDiscountButton.addEventListener('click', () => { /* ... logica calcolo ... */ });
    if(calculatePercentageButton) calculatePercentageButton.addEventListener('click', () => { /* ... logica calcolo ... */ });
    if(resetCalculatorButton) resetCalculatorButton.addEventListener('click', () => { /* ... logica reset ... */ });
    
    if(categoryFilter) categoryFilter.addEventListener('change', (e) => { currentFilters.categoria = e.target.value; applyFilters(); });
    if(brandFilter) brandFilter.addEventListener('change', (e) => { currentFilters.marca = e.target.value; applyFilters(); });
    if(resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => { if(categoryFilter) categoryFilter.value = ''; if(brandFilter) brandFilter.value = ''; currentFilters = { categoria: "", marca: "" }; applyFilters(); });

    auth.onAuthStateChanged(initializePage);
});
