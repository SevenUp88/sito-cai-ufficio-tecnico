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
    const calcScontoInputs = Array.from({length: 4}, (_, i) => document.getElementById(`calc-sconto${i + 1}`));
    const singlePercentageInput = document.getElementById('single-percentage-input');
    const calculateDiscountButton = document.getElementById('calculate-discount-button');
    const calculatePercentageButton = document.getElementById('calculate-percentage-button');
    const resetCalculatorButton = document.getElementById('reset-calculator-button');
    const cascadeResultPrice = document.getElementById('cascade-result-price');
    const cascadeResultPercentage = document.getElementById('cascade-result-percentage');
    const singlePercResultValue = document.getElementById('single-perc-result-value');

    function initializePage(user) { if (user) loadAndDisplayData(); }
    
    // (tutta la logica per tabella e filtri come nel file completo precedente...)
    function loadAndDisplayData() { /*...*/ }
    function populateFilters(data) { /*...*/ }
    function applyFilters() { /*...*/ }
    function renderTable(data) { /*...*/ }
    
    function showToast(message) { /*...*/ }

    function applyCascadingDiscounts(base, discounts) {
        return discounts.reduce((price, discount) => price * (1 - discount / 100), base);
    }
    
    // LISTENER CALCOLATORE CORRETTI
    if(calculateDiscountButton) calculateDiscountButton.addEventListener('click', () => {
        const base = parseFloat(mainValueInput.value);
        if (isNaN(base)) { showToast("Inserire un importo valido"); return; }
        const discounts = calcScontoInputs.map(input => parseFloat(input.value)).filter(val => !isNaN(val));
        const finalPrice = applyCascadingDiscounts(base, discounts);
        const totalDiscount = (base > 0 && discounts.length > 0) ? 100 - (finalPrice / base * 100) : 0;
        if(cascadeResultPrice) cascadeResultPrice.textContent = finalPrice.toLocaleString('it-IT',{style:'currency', currency:'EUR'});
        if(cascadeResultPercentage) cascadeResultPercentage.textContent = `Sconto: ${totalDiscount.toFixed(2).replace('.',',')} %`;
    });

    if(calculatePercentageButton) calculatePercentageButton.addEventListener('click', () => {
        const base = parseFloat(mainValueInput.value);
        const perc = parseFloat(singlePercentageInput.value);
        if (isNaN(base) || isNaN(perc)) { showToast("Inserire valori validi"); return; }
        const result = base * perc / 100;
        if(singlePercResultValue) singlePercResultValue.textContent = result.toLocaleString('it-IT',{style:'currency', currency:'EUR'});
    });
    
    if(resetCalculatorButton) resetCalculatorButton.addEventListener('click', () => {
        mainValueInput.value = '';
        singlePercentageInput.value = '';
        calcScontoInputs.forEach(input => input.value = '');
        if(cascadeResultPrice) cascadeResultPrice.textContent = "0,00 €";
        if(cascadeResultPercentage) cascadeResultPercentage.textContent = "Sconto: 0,00 %";
        if(singlePercResultValue) singlePercResultValue.textContent = "0,00 €";
    });
    
    // (listener filtri e avvio come nel file completo precedente...)
    auth.onAuthStateChanged(initializePage);
});
