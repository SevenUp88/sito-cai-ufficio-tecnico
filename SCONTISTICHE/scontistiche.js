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
    const calculateDiscountsBtn = document.getElementById('calculate-discounts-button');
    const resetCalculatorButton = document.getElementById('reset-calculator-button');
    const cascadeResultPrice = document.getElementById('cascade-result-price');
    const cascadeResultPercentage = document.getElementById('cascade-result-percentage');
    const singlePercResultValue = document.getElementById('single-perc-result-value'); // Riferimento recuperato
    
    function initializePage(user) { if (user) loadAndDisplayData(); }

    async function loadAndDisplayData() {
        if (loader) loader.style.display = 'block';
        if (noDataMsg) noDataMsg.style.display = 'none';
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
        renderTable(filtered);
    }
    
    function formatCell(value, isPercent = false) {
        if (value === null || value === undefined || String(value).trim() === '') return '<span class="not-available">N/A</span>';
        if (isPercent && typeof value === 'number') return `${String(value).replace('.', ',')}%`;
        return String(value);
    }
    
    function renderTable(data) {
        if (!tableBody || !noDataMsg) return;
        tableBody.innerHTML = '';
        noDataMsg.style.display = data.length === 0 ? 'block' : 'none';
        data.forEach(item => {
            const row = tableBody.insertRow();
            row.innerHTML = `<td>${formatCell(item.categoria)}</td><td>${formatCell(item.marca)}</td><td>${formatCell(item.sconto_in_acquisto)}</td><td>${formatCell(item.trasporto, true)}</td><td>${formatCell(item.sconto_in_vendita)}</td><td>${formatCell(item.agenzia)}</td><td>${formatCell(item.assistenza_cesena)}</td>`;
        });
    }

    function applyCascadingDiscounts(base, discounts) { return discounts.reduce((p, d) => p * (1 - d / 100), base); }

    if(calculateDiscountsBtn) calculateDiscountsBtn.addEventListener('click', () => {
        const base = parseFloat(mainValueInput.value);
        if (isNaN(base)) { alert("Inserire un importo valido"); return; }
        const discounts = calcScontoInputs.map(input => parseFloat(input.value)).filter(val => !isNaN(val));
        const finalPrice = applyCascadingDiscounts(base, discounts);
        const totalDiscount = (base > 0 && discounts.length > 0) ? 100 - (finalPrice / base * 100) : 0;
        if(cascadeResultPrice) cascadeResultPrice.textContent = finalPrice.toLocaleString('it-IT',{style:'currency', currency:'EUR'});
        if(cascadeResultPercentage) cascadeResultPercentage.textContent = `Sconto: ${totalDiscount.toFixed(2).replace('.',',')} %`;
    });
    
    if(resetCalculatorButton) resetCalculatorButton.addEventListener('click', () => {
        mainValueInput.value = '';
        calcScontoInputs.forEach(input => input.value = '');
        if(cascadeResultPrice) cascadeResultPrice.textContent = "0,00 €";
        if(cascadeResultPercentage) cascadeResultPercentage.textContent = "Sconto: 0,00 %";
        if(singlePercResultValue) singlePercResultValue.textContent = "0,00 €"; // Assumendo esista ancora
    });
    
    if(categoryFilter) categoryFilter.addEventListener('change', (e) => { currentFilters.categoria = e.target.value; applyFilters(); });
    if(brandFilter) brandFilter.addEventListener('change', (e) => { currentFilters.marca = e.target.value; applyFilters(); });
    if(resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => { if(categoryFilter) categoryFilter.value = ''; if(brandFilter) brandFilter.value = ''; currentFilters = { categoria: "", marca: "" }; applyFilters(); });

    auth.onAuthStateChanged(initializePage);
});
