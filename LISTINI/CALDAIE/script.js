document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio listini-caldaie.js");

    // Firebase Configuration (same as your configurator)
    const firebaseConfig = {
        apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
        authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
        projectId: "consorzio-artigiani-idraulici",
        storageBucket: "consorzio-artigiani-idraulici.appspot.com", // Ensure this matches if you used appspot.com or firebasestorage.app
        messagingSenderId: "136848104008",
        appId: "1:136848104008:web:2724f60607dbe91d09d67d",
        measurementId: "G-NNPV2607G7"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth(); // For admin functionality

    const imageBaseUrl = 'https://raw.githubusercontent.com/SevenUp88/sito-cai-ufficio-tecnico/main/LISTINI/CALDAIE/img/';
    const placeholderImage = imageBaseUrl + 'placeholder.png'; // Make sure placeholder.png exists in your img folder

    // DOM Elements
    const boilerListContainer = document.getElementById('boiler-list-container');
    const brandFilter = document.getElementById('brand-filter');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results-message');
    const dataUpdateDateEl = document.getElementById('data-update-date');
    const currentYearEl = document.getElementById('current-year');

    // Admin section elements (optional, for later)
    const adminSectionCaldaie = document.getElementById('admin-section-caldaie');
    // const addBoilerBtn = document.getElementById('add-boiler-btn');
    // const adminBoilersListDiv = document.getElementById('admin-boilers-list');

    let allBoilers = [];
    let metadataListener = null; // For listening to metadata updates

    // --- Utility Functions ---
    function escapeHtml(unsafeString) {
        if (typeof unsafeString !== 'string') {
            unsafeString = String(unsafeString || ''); // Ensure it's a string, default to empty
        }
        return unsafeString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) return null; // Return null if not a valid number
        return price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    }
    
    function getAvailabilityClass(availabilityText) {
        if (!availabilityText) return 'unknown';
        const lowerText = String(availabilityText).toLowerCase();
        if (lowerText.includes('disponibile') || lowerText.includes('pronta consegna')) return 'available';
        if (lowerText.includes('ordinazione') || lowerText.includes('arrivo')) return 'on-order';
        if (lowerText.includes('esaurito') || lowerText.includes('non disponibile')) return 'not-available';
        return 'unknown'; // Default for other texts
    }


    // --- Data Fetching & Processing ---
    async function fetchBoilersFromFirestore() {
        console.log("Fetching 'caldaie' from Firestore...");
        try {
            const snapshot = await db.collection('caldaie').get();
            const boilers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`Fetched ${boilers.length} boilers.`);
            return boilers;
        } catch (error) {
            console.error("Error fetching boilers:", error);
            loadingIndicator.innerHTML = '<p style="color: red;">Errore nel caricamento dei listini.</p>';
            return [];
        }
    }

    function populateFiltersUI(boilers) {
        const brands = new Set();
        const categories = new Set();

        boilers.forEach(boiler => {
            if (boiler.marca) brands.add(boiler.marca);
            if (boiler.categoria) categories.add(boiler.categoria);
        });

        // Clear existing options except the default
        brandFilter.innerHTML = '<option value="">Tutte le Marche</option>';
        categoryFilter.innerHTML = '<option value="">Tutte le Categorie</option>';

        // Populate brands sorted alphabetically
        Array.from(brands).sort().forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });

        // Populate categories sorted alphabetically
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    function createBoilerCard(boiler) {
        const card = document.createElement('div');
        card.classList.add('boiler-card');
        card.dataset.boilerId = boiler.id;

        const imageName = boiler.immagineNomeFile || 'placeholder.png';
        const imageUrl = imageBaseUrl + imageName;

        const formattedListPrice = formatPrice(boiler.prezzoListino);
        const formattedDiscountedPrice = formatPrice(boiler.prezzoScontato);

        let priceHTML = '';
        if (formattedDiscountedPrice) {
            priceHTML = `
                ${formattedListPrice ? `<p class="price-list">${formattedListPrice}</p>` : ''}
                <p class="price-discounted">${formattedDiscountedPrice}</p>
            `;
        } else if (formattedListPrice) {
            priceHTML = `<p class="price-discounted no-discount">${formattedListPrice}</p>`;
        } else {
            priceHTML = `<p class="price-discounted no-discount">Prezzo su richiesta</p>`;
        }
        
        const availabilityText = boiler.disponibilita || 'Non specificata';
        const availabilityClass = getAvailabilityClass(availabilityText);

        card.innerHTML = `
            <div class="image-container">
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(boiler.modello || 'Caldaia')}" 
                     onerror="this.onerror=null; this.src='${escapeHtml(placeholderImage)}'; this.alt='Immagine non disponibile';">
            </div>
            <div class="boiler-info">
                ${boiler.marca || boiler.categoria ? `
                    <p class="brand-category">
                        ${boiler.marca ? `<strong>${escapeHtml(boiler.marca.toUpperCase())}</strong>` : ''}
                        ${boiler.marca && boiler.categoria ? ' / ' : ''}
                        ${boiler.categoria ? escapeHtml(boiler.categoria) : ''}
                    </p>` : ''
                }
                <h3 class="model">${escapeHtml(boiler.modello || 'Modello non specificato')}</h3>
                ${boiler.descrizione ? `<p class="description">${escapeHtml(boiler.descrizione)}</p>` : ''}
                ${boiler.potenzaKw ? `<p><strong>Potenza:</strong> ${escapeHtml(String(boiler.potenzaKw))} kW</p>` : ''}
                ${boiler.codiceArticolo ? `<p><strong>Codice:</strong> ${escapeHtml(boiler.codiceArticolo)}</p>` : ''}
            </div>
            <div class="bottom-details">
                <div class="price-section">
                    ${priceHTML}
                </div>
                ${boiler.note ? `<p class="notes">${escapeHtml(boiler.note)}</p>` : ''}
                <p class="availability ${availabilityClass}">
                    <strong>Disponibilità:</strong> ${escapeHtml(availabilityText)}
                </p>
            </div>
        `;
        return card;
    }

    function displayBoilers(boilersToDisplay) {
        boilerListContainer.innerHTML = '';
        noResultsMessage.style.display = 'none';

        if (boilersToDisplay.length === 0) {
            noResultsMessage.textContent = 'Nessun prodotto trovato con i filtri selezionati.';
            noResultsMessage.style.display = 'block';
            return;
        }

        boilersToDisplay.forEach(boiler => {
            boilerListContainer.appendChild(createBoilerCard(boiler));
        });
    }

    function applyFiltersAndSearch() {
        const selectedBrand = brandFilter.value;
        const selectedCategory = categoryFilter.value;
        const searchTerm = searchInput.value.toLowerCase().trim();

        const filteredBoilers = allBoilers.filter(boiler => {
            const brandMatch = !selectedBrand || (boiler.marca === selectedBrand);
            const categoryMatch = !selectedCategory || (boiler.categoria === selectedCategory);
            
            const model = (boiler.modello || '').toLowerCase();
            const code = (boiler.codiceArticolo || '').toLowerCase();
            const description = (boiler.descrizione || '').toLowerCase();

            const searchMatch = !searchTerm || 
                                model.includes(searchTerm) || 
                                code.includes(searchTerm) ||
                                description.includes(searchTerm);

            return brandMatch && categoryMatch && searchMatch;
        });
        displayBoilers(filteredBoilers);
    }

    // --- Initialization and Event Listeners ---
    async function initializePage() {
        if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        boilerListContainer.innerHTML = '';
        noResultsMessage.style.display = 'none';

        allBoilers = await fetchBoilersFromFirestore();
        if (allBoilers.length > 0) {
            populateFiltersUI(allBoilers);
            displayBoilers(allBoilers); // Display all initially
        } else {
            noResultsMessage.textContent = 'Nessun listino caldaie disponibile al momento.';
            noResultsMessage.style.display = 'block';
        }

        // Listen for metadata updates for "last data update"
        if (metadataListener) metadataListener(); // Unsubscribe previous listener
        metadataListener = db.collection('metadata').doc('listiniInfo') // Or a relevant document
            .onSnapshot(doc => {
                if (doc.exists && doc.data()?.caldaieLastUpdate) {
                    const ts = doc.data().caldaieLastUpdate;
                    if (ts.seconds) { // Check if it's a Firestore Timestamp
                         dataUpdateDateEl.textContent = new Date(ts.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                    } else {
                         dataUpdateDateEl.textContent = "N/D"; // Or handle if it's a different date format
                    }
                } else {
                    dataUpdateDateEl.textContent = new Date().toLocaleDateString('it-IT'); // Fallback
                }
            }, error => {
                console.error("Error fetching metadata for update date:", error);
                dataUpdateDateEl.textContent = new Date().toLocaleDateString('it-IT'); // Fallback
            });

        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

    // Event Listeners for filters
    brandFilter.addEventListener('change', applyFiltersAndSearch);
    categoryFilter.addEventListener('change', applyFiltersAndSearch);
    searchInput.addEventListener('input', applyFiltersAndSearch);
    resetFiltersBtn.addEventListener('click', () => {
        brandFilter.value = '';
        categoryFilter.value = '';
        searchInput.value = '';
        applyFiltersAndSearch();
    });


    // --- Admin Auth & UI Logic (Simplified from your configurator script) ---
    const loginModal = document.getElementById('login-modal-caldaie');
    const loginForm = document.getElementById('login-form-caldaie');
    const logoutButton = document.getElementById('logout-button-caldaie');
    const adminTriggerBtn = document.getElementById('admin-trigger'); // Shared trigger
    const loginEmailInput = document.getElementById('login-email-caldaie');
    const loginPasswordInput = document.getElementById('login-password-caldaie');
    const loginErrorEl = document.getElementById('login-error-caldaie');
    const closeModalBtn = loginModal ? loginModal.querySelector('.close-btn-caldaie') : null;
    const loginModalTitle = document.getElementById('login-modal-title-caldaie');
    window.currentBoilerAdminRole = null;


    function toggleAdminCaldaieVisibility() {
        if (adminSectionCaldaie) {
            adminSectionCaldaie.style.display = window.currentBoilerAdminRole === 'admin' ? 'block' : 'none';
            if (window.currentBoilerAdminRole === 'admin') {
                // loadAndDisplayAdminBoilers(); // TODO: Implement this if needed
            }
        }
    }

    if (adminTriggerBtn) {
        adminTriggerBtn.addEventListener('click', () => {
            if (!loginModal) { console.error("Login modal for caldaie not found"); return; }
            const currentUser = auth.currentUser;
            if (currentUser) {
                if (logoutButton) logoutButton.style.display = 'block';
                if (loginForm) loginForm.style.display = 'none';
                if (loginErrorEl) loginErrorEl.style.display = 'none';
                if (loginModalTitle) loginModalTitle.textContent = `Loggato: ${currentUser.email}`;
            } else {
                if (logoutButton) logoutButton.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (loginModalTitle) loginModalTitle.textContent = 'Accesso Amministratore Caldaie';
            }
            loginModal.style.display = 'block';
        });
    }
    if (closeModalBtn) { closeModalBtn.addEventListener('click', () => { if (loginModal) loginModal.style.display = 'none'; }); }
    if (loginModal) { loginModal.addEventListener('click', (event) => { if (event.target === loginModal) loginModal.style.display = 'none'; }); }

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;
            if (!email || !password) {
                if (loginErrorEl) { loginErrorEl.textContent = 'Email e Password obbligatori.'; loginErrorEl.style.display = 'block'; }
                return;
            }
            if (loginErrorEl) loginErrorEl.style.display = 'none';
            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    if (loginModal) loginModal.style.display = 'none';
                    if (loginPasswordInput) loginPasswordInput.value = ''; // Clear password field
                })
                .catch(error => {
                    if (loginErrorEl) { loginErrorEl.textContent = `Errore: ${error.message}`; loginErrorEl.style.display = 'block'; }
                });
        });
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                if (loginModal) loginModal.style.display = 'none';
            });
        });
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                window.currentBoilerAdminRole = doc.exists && doc.data().role ? doc.data().role : 'user';
                // Potentially update adminTriggerBtn title or an auth status element here too
                console.log("User role for caldaie:", window.currentBoilerAdminRole);
                toggleAdminCaldaieVisibility();
            }).catch(() => {
                window.currentBoilerAdminRole = 'user'; // Default to 'user' on error
                toggleAdminCaldaieVisibility();
            });
        } else {
            window.currentBoilerAdminRole = null;
            toggleAdminCaldaieVisibility();
        }
    });

    // Call initialization
    initializePage();

}); // End of DOMContentLoaded
