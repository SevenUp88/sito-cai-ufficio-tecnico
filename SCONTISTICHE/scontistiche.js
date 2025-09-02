// --- File: SCONTISTICHE/scontistiche.js ---

document.addEventListener('DOMContentLoaded', () => {
    let allDiscounts = [];
    let currentFilters = { categoria: "", marca: "" };

    const tableBody = document.getElementById('discounts-table-body');
    const categoryFilter = document.getElementById('category-filter');
    const brandFilter = document.getElementById('brand-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const loader = document.getElementById('app-loader');
    const noDataMsg = document.getElementById('no-data-message');

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
        } catch (error) {
            console.error("Errore nel caricamento scontistiche:", error);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="error-cell">Errore caricamento dati.</td></tr>`;
        } finally {
            if (loader) loader.style.display = 'none';
        }
    }

    function populateFilters(data) {
        const categories = [...new Set(data.map(item => item.categoria).filter(Boolean))].sort();
        const brands = [...new Set(data.map(item => item.marca).filter(Boolean))].sort();
        
        if(categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Tutte</option>';
            categories.forEach(cat => categoryFilter.add(new Option(cat, cat)));
        }
        if(brandFilter) {
            brandFilter.innerHTML = '<option value="">Tutte</option>';
            brands.forEach(brand => brandFilter.add(new Option(brand, brand)));
        }
    }

    function applyFilters() {
        let filteredData = allDiscounts.filter(item => {
            return (!currentFilters.categoria || item.categoria === currentFilters.categoria) &&
                   (!currentFilters.marca || item.marca === currentFilters.marca);
        });
        renderTable(filteredData);
    }

    function formatCell(value, isPercent = false) {
        if (value === null || value === undefined || String(value).trim() === '') return '<span class="not-available">N/A</span>';
        if (isPercent && typeof value === 'number') return `${String(value).replace('.', ',')}%`;
        return String(value); // Mostra "netti", "60;10", etc.
    }
    
    function formatAssistenza(item) {
        const centri = [item.assistenza_cesena, item.assistenza_savignano, item.assistenza_rimini].filter(Boolean);
        return centri.length > 0 ? centri.join('<br>') : '<span class="not-available">N/A</span>';
    }

    function renderTable(data) {
        if (!tableBody || !noDataMsg) return;
        tableBody.innerHTML = '';
        noDataMsg.style.display = data.length === 0 ? 'block' : 'none';

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="#" class="category-link">${formatCell(item.categoria)}</a></td>
                <td>${formatCell(item.marca)}</td>
                <td>${formatCell(item.sconto_in_acquisto)}</td>
                <td>${formatCell(item.trasporto, true)}</td>
                <td>${formatCell(item.sconto_in_vendita)}</td>
                <td>${formatCell(item.agenzia)}</td>
                <td>${formatAssistenza(item)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    if(categoryFilter) categoryFilter.addEventListener('change', (e) => { currentFilters.categoria = e.target.value; applyFilters(); });
    if(brandFilter) brandFilter.addEventListener('change', (e) => { currentFilters.marca = e.target.value; applyFilters(); });
    if(resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => {
        if(categoryFilter) categoryFilter.value = '';
        if(brandFilter) brandFilter.value = '';
        currentFilters = { categoria: "", marca: "" };
        applyFilters();
    });

    auth.onAuthStateChanged(initializePage);
});