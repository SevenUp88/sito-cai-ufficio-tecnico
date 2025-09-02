// --- File: SCONTISTICHE/scontistiche.js (con Logica Calcolatore) ---
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

    // Riferimenti elementi del CALCOLATORE
    const mainValueInput = document.getElementById('main-value-input');
    const calcScontoInputs = Array.from({length: 4}, (_, i) => document.getElementById(`calc-sconto${i + 1}`));
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
        if (tableBody) tableBody.innerHTML = '';
        if (noDataMsg) noDataMsg.style.display = 'none';

        try {
            const snapshot = await db.collection("scontisticheProdotti").orderBy("categoria").orderBy("marca").get();
            allDiscounts = snapshot.docs.map(doc => doc.data());
            populateFilters(allDiscounts);
            applyFilters();
        } catch (error) { console.error("Errore scontistiche:", error); } 
        finally { if (loader) loader.style.display = 'none'; }
    }

    function populateFilters(data) {
        const categories = [...new Set(data.map(item => item.categoria).filter(Boolean))].sort();
        const brands = [...new Set(data.map(item => item.marca).filter(Boolean))].sort();
        if(categoryFilter) { categoryFilter.innerHTML = '<option value="">Tutte</option>'; categories.forEach(cat => categoryFilter.add(new Option(cat, cat))); }
        if(brandFilter) { brandFilter.innerHTML = '<option value="">Tutte</option>'; brands.forEach(brand => brandFilter.add(new Option(brand, brand))); }
    }

    function applyFilters() {
        let filteredData = allDiscounts.filter(item => {
            return (!currentFilters.categoria || item.categoria === currentFilters.categoria) &&
                   (!currentFilters.marca || item.marca === currentFilters.marca);
        });
        renderTable(filteredData);
    }

    function formatCell(value) { return (value === null || value === undefined) ? '<span class="not-available">N/A</span>' : String(value); }

    function renderTable(data) { /* ... (Logica di render tabella, vedi risposte precedenti) ... */ }
    
    function showToast(message) { if(toastElement) { toastElement.textContent = message; toastElement.classList.add("show"); setTimeout(() => toastElement.classList.remove("show"), 3000); } }

    function applyCascadingDiscounts(basePrice, discounts) {
        return discounts.reduce((price, discount) => price * (1 - discount / 100), basePrice);
    }

    // LISTENER CALCOLATORE
    if (calculateDiscountButton) {
        calculateDiscountButton.addEventListener('click', () => {
            const base = parseFloat(mainValueInput.value);
            if (isNaN(base)) { showToast("Inserire un importo valido"); return; }
            const discounts = calcScontoInputs.map(input => parseFloat(input.value)).filter(val => !isNaN(val) && val > 0);
            if (discounts.length === 0) {
                if (cascadeResultPrice) cascadeResultPrice.textContent = base.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
                if (cascadeResultPercentage) cascadeResultPercentage.textContent = "Sconto: 0,00 %";
                return;
            }
            const finalPrice = applyCascadingDiscounts(base, discounts);
            const totalDiscount = 100 - (finalPrice / base * 100);
            if (cascadeResultPrice) cascadeResultPrice.textContent = finalPrice.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
            if (cascadeResultPercentage) cascadeResultPercentage.textContent = `Sconto: ${totalDiscount.toFixed(2).replace('.', ',')} %`;
        });
    }

    if(calculatePercentageButton){
        calculatePercentageButton.addEventListener('click', () => {
            const base = parseFloat(mainValueInput.value);
            const percentage = parseFloat(singlePercentageInput.value);
            if (isNaN(base) || isNaN(percentage)) { showToast("Inserire importo e percentuale validi"); return; }
            const result = (base * percentage) / 100;
            if (singlePercResultValue) singlePercResultValue.textContent = result.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
        });
    }

    if(resetCalculatorButton){
        resetCalculatorButton.addEventListener('click', () => {
            mainValueInput.value = '';
            singlePercentageInput.value = '';
            calcScontoInputs.forEach(input => input.value = '');
            if(cascadeResultPrice) cascadeResultPrice.textContent = "0,00 €";
            if(cascadeResultPercentage) cascadeResultPercentage.textContent = "Sconto: 0,00 %";
            if(singlePercResultValue) singlePercResultValue.textContent = "0,00 €";
            showToast("Calcolatore resettato");
        });
    }

    if(categoryFilter) categoryFilter.addEventListener('change', (e) => { currentFilters.categoria = e.target.value; applyFilters(); });
    if(brandFilter) brandFilter.addEventListener('change', (e) => { currentFilters.marca = e.target.value; applyFilters(); });
    if(resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => { if(categoryFilter) categoryFilter.value = ''; if(brandFilter) brandFilter.value = ''; currentFilters = { categoria: "", marca: "" }; applyFilters(); });

    auth.onAuthStateChanged(initializePage);
});
