document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTg9-d742f7l8_ubFCJGqkBAWUxg0fBZf3cLT5pAl7O91Be2_e8C2qKGIhmhuGGBqQaxYxJMJiM4m_r/pub?gid=0&single=true&output=csv';
    const imageBaseUrl = 'https://raw.githubusercontent.com/SevenUp88/sito-cai-ufficio-tecnico/main/LISTINI/CALDAIE/img/';

    const boilerListContainer = document.getElementById('boiler-list-container');
    const brandFilter = document.getElementById('brand-filter');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results-message');
    const dataUpdateDateEl = document.getElementById('data-update-date');

    let allBoilers = [];

    async function fetchData() {
        try {
            loadingIndicator.style.display = 'block';
            boilerListContainer.innerHTML = ''; // Clear previous results
            noResultsMessage.style.display = 'none';

            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvData = await response.text();
            allBoilers = parseCSV(csvData);
            
            if (allBoilers.length > 0) {
                populateFilters(allBoilers);
                displayBoilers(allBoilers);
                // Set update date (assuming first row, first cell after headers has a date or use today)
                const today = new Date();
                dataUpdateDateEl.textContent = today.toLocaleDateString('it-IT');
            } else {
                noResultsMessage.textContent = 'Nessun dato disponibile dal listino.';
                noResultsMessage.style.display = 'block';
            }

        } catch (error) {
            console.error('Error fetching or parsing data:', error);
            boilerListContainer.innerHTML = '<p style="color: red; text-align: center;">Errore nel caricamento dei dati. Riprova più tardi.</p>';
            noResultsMessage.style.display = 'none';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            // A more robust CSV parser would handle commas within quoted fields
            // For this simple case, we assume fields don't contain unquoted commas
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index] ? values[index].trim() : '';
                });
                data.push(entry);
            } else {
                console.warn(`Skipping malformed CSV line ${i+1}: ${lines[i]}`);
            }
        }
        return data;
    }

    function populateFilters(boilers) {
        const brands = new Set();
        const categories = new Set();

        boilers.forEach(boiler => {
            if (boiler['MARCHIO']) brands.add(boiler['MARCHIO']);
            if (boiler['CATEGORIA']) categories.add(boiler['CATEGORIA']);
        });

        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    function formatPrice(priceString) {
        const price = parseFloat(priceString);
        if (isNaN(price)) return 'N/D';
        return price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    }
    
    function getAvailabilityClass(availabilityText) {
        if (!availabilityText) return '';
        const lowerAvailability = availabilityText.toLowerCase();
        if (lowerAvailability.includes('disponibile')) return 'available';
        if (lowerAvailability.includes('ordinazione') || lowerAvailability.includes('arrivo')) return 'on-order';
        if (lowerAvailability.includes('esaurito') || lowerAvailability.includes('non disponibile')) return 'not-available';
        return '';
    }


    function displayBoilers(boilersToDisplay) {
        boilerListContainer.innerHTML = '';
        noResultsMessage.style.display = 'none';

        if (boilersToDisplay.length === 0) {
            noResultsMessage.style.display = 'block';
            noResultsMessage.textContent = 'Nessun prodotto trovato con i filtri selezionati.';
            return;
        }

        boilersToDisplay.forEach(boiler => {
            const card = document.createElement('div');
            card.classList.add('boiler-card');

            const imageName = boiler['IMMAGINE (nome file)'] || 'placeholder.png'; // Fallback image
            const imageUrl = imageBaseUrl + imageName;
            
            const listPrice = boiler['PREZZO DI LISTINO (€)'];
            const discountedPrice = boiler['PREZZO SCONTATO (€)'];
            
            let priceHTML = '';
            if (discountedPrice && parseFloat(discountedPrice) > 0) {
                priceHTML = `
                    <p class="price-list">${listPrice ? formatPrice(listPrice) : ''}</p>
                    <p class="price-discounted">${formatPrice(discountedPrice)}</p>
                `;
            } else if (listPrice && parseFloat(listPrice) > 0) {
                 priceHTML = `<p class="price-discounted no-discount">${formatPrice(listPrice)}</p>`;
            } else {
                priceHTML = `<p class="price-discounted no-discount">Prezzo su richiesta</p>`;
            }


            card.innerHTML = `
                <div class="image-container">
                    <img src="${imageUrl}" alt="${boiler['MODELLO'] || 'Caldaia'}" onerror="this.onerror=null;this.src='${imageBaseUrl}placeholder.png';this.alt='Immagine non disponibile';">
                </div>
                <div class="boiler-info">
                    ${boiler['MARCHIO'] ? `<p class="brand">${boiler['MARCHIO']}</p>` : ''}
                    <h3 class="model">${boiler['MODELLO'] || 'N/D'}</h3>
                    ${boiler['DESCRIZIONE'] ? `<p class="description">${boiler['DESCRIZIONE']}</p>` : ''}
                    ${boiler['POTENZA (kW)'] ? `<p><strong>Potenza:</strong> ${boiler['POTENZA (kW)']} kW</p>` : ''}
                    ${boiler['CODICE ARTICOLO'] ? `<p><strong>Codice:</strong> ${boiler['CODICE ARTICOLO']}</p>` : ''}
                </div>
                <div class="bottom-info">
                    <div class="price-section">
                        ${priceHTML}
                    </div>
                    ${boiler['NOTE'] ? `<p class="notes">${boiler['NOTE']}</p>` : ''}
                    ${boiler['DISPONIBILITA\''] ? `<p class="availability ${getAvailabilityClass(boiler['DISPONIBILITA\''])}"><strong>Disponibilità:</strong> ${boiler['DISPONIBILITA\'']}</p>` : ''}
                </div>
            `;
            boilerListContainer.appendChild(card);
        });
    }

    function applyFilters() {
        const selectedBrand = brandFilter.value;
        const selectedCategory = categoryFilter.value;
        const searchTerm = searchInput.value.toLowerCase();

        const filteredBoilers = allBoilers.filter(boiler => {
            const brandMatch = !selectedBrand || (boiler['MARCHIO'] === selectedBrand);
            const categoryMatch = !selectedCategory || (boiler['CATEGORIA'] === selectedCategory);
            
            const model = (boiler['MODELLO'] || '').toLowerCase();
            const code = (boiler['CODICE ARTICOLO'] || '').toLowerCase();
            const description = (boiler['DESCRIZIONE'] || '').toLowerCase();

            const searchMatch = !searchTerm || 
                                model.includes(searchTerm) || 
                                code.includes(searchTerm) ||
                                description.includes(searchTerm);

            return brandMatch && categoryMatch && searchMatch;
        });

        displayBoilers(filteredBoilers);
    }

    brandFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
    resetFiltersBtn.addEventListener('click', () => {
        brandFilter.value = '';
        categoryFilter.value = '';
        searchInput.value = '';
        applyFilters();
    });

    // Initial data load
    fetchData();

    // --- Password Panel Logic (copied from typical main.js) ---
    // This assumes you have a main.js or similar for shared functionality.
    // If not, and this is only for this page, it can stay here.
    // For a real app, this would likely be in a global main.js.
    const adminTrigger = document.getElementById('admin-trigger');
    const passwordPanel = document.getElementById('password-panel');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const submitPasswordBtn = document.getElementById('submit-password-btn');
    const adminPasswordInput = document.getElementById('admin-password');
    const passwordErrorMessage = document.getElementById('password-error-message');
    const ADMIN_PASSWORD_KEY = 'cai_admin_auth'; // Key for localStorage
    const ACTUAL_ADMIN_PASSWORD = "YOUR_ADMIN_PASSWORD"; // CHANGE THIS!

    if (adminTrigger && passwordPanel) {
        adminTrigger.addEventListener('click', () => {
            passwordPanel.classList.toggle('visible');
            if (passwordPanel.classList.contains('visible')) {
                adminPasswordInput.focus();
            }
        });
    }

    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            passwordPanel.classList.remove('visible');
            passwordErrorMessage.textContent = '';
            adminPasswordInput.classList.remove('input-error');
        });
    }

    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', () => {
            const enteredPassword = adminPasswordInput.value;
            if (enteredPassword === ACTUAL_ADMIN_PASSWORD) {
                localStorage.setItem(ADMIN_PASSWORD_KEY, 'true');
                passwordPanel.classList.remove('visible');
                passwordErrorMessage.textContent = '';
                adminPasswordInput.value = '';
                adminPasswordInput.classList.remove('input-error');
                alert('Accesso Admin abilitato! Le funzionalità admin sono ora disponibili (se implementate).');
                // Here you might enable admin-specific UI elements or behaviors on the page
                // For example, redirect to an admin page or unlock certain features
                // window.location.href = 'admin-dashboard.html'; // Example
            } else {
                passwordErrorMessage.textContent = 'Password errata.';
                adminPasswordInput.classList.add('input-error');
                localStorage.removeItem(ADMIN_PASSWORD_KEY);
            }
        });
    }
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); 
                submitPasswordBtn.click(); 
            }
        });
    }
    // Check if admin is already authenticated (e.g., for showing admin-only content)
    // function isAdminAuthenticated() {
    //     return localStorage.getItem(ADMIN_PASSWORD_KEY) === 'true';
    // }
    // if (isAdminAuthenticated()) {
    //     console.log("Admin is authenticated.");
    //     // You could show/hide elements based on this
    // }

});