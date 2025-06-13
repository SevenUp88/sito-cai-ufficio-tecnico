// Wrap everything in an IIFE
(function () {
    'use strict';

    // --- Configuration & Global State ---
    const RENTAL_COUNTER_LS_KEY = "rentalCounter";
    const WAREHOUSES = ["VILLALTA", "SAVIGNANO", "VILLAMARINA"];
    const OPERATORS = ["DANIELE", "GIOVANNI", "LEANDRO", "LEONE", "LUCA", "MASSIMO", "MATTIA", "RAFFAELE", "SERGIO", "SEVERINO", "THOMAS"];
    const LOGO_URL = "https://i.postimg.cc/1XQtFBSX/logo-cai-removebg-preview.png";
    const MIN_DAYS_FOR_ATTENTION = 5;

    // --- Special Pricing Constants ---
    const SPECIAL_ITEM_IDS = ['TAnSRPuHwm64QoZCzBe0', 'bsQV3qBAgCBXvkGJHHPK']; // Example IDs
    const SPECIAL_ITEM_SAME_DAY_PRICE = 15.00;
    const SPECIAL_ITEM_EXTRA_DAY_PRICE = 25.00;
    // --- End Special Pricing Constants ---

    let ongoingRentalInfo = null;
    window.appInitialized = false;
    // window.currentUserRole is set by the onAuthStateChanged listener in code.html

    // --- Firebase References (expected to be initialized in code.html) ---
    const db = window.db;
    const auth = window.auth;

    // --- Utility Functions ---
    const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const escapeHtml = (unsafe) => { if (typeof unsafe !== 'string') unsafe = String(unsafe); return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/'/g, "'"); };
    const formatPrice = (value) => { const number = parseFloat(value); return isNaN(number) ? 'N/D' : number.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { const parts = dateString.split('-'); if (parts.length !== 3) return dateString; const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); if (isNaN(date.getTime())) return 'Data non valida'; return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date); } catch (e) { console.error("Errore formattazione data:", dateString, e); return 'Errore data'; } };
    const getDaysDifference = (startDate, endDate) => { if (!startDate || !endDate) return 1; try { const start = new Date(startDate + 'T00:00:00Z'); const end = new Date(endDate + 'T00:00:00Z'); if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1; const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()); if (endUTC < startUTC) return 1; const diffTime = endUTC - startUTC; return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; } catch (e) { console.error("Error calculating date difference:", startDate, endDate, e); return 1; } };
    const getDaysElapsed = (startDateString) => { if (!startDateString) return 0; try { const startDate = new Date(startDateString + 'T00:00:00Z'); if (isNaN(startDate.getTime())) return 0; const today = new Date(); const todayUTCStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()); const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()); const diffTime = todayUTCStart - startUTC; return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))); } catch (e) { console.error("Error calculating days elapsed:", startDateString, e); return 0; } };
    const showError = (message) => { console.error("SHOW_ERROR (Noleggi):", message); alert(`[ERRORE - NOLEGGI] ${message}`); };
    // Login-specific error utilities (showLoginError, clearLoginError) have been removed

    // --- Role Check Helper ---
    const isAdmin = () => window.currentUserRole === 'admin';

    // --- LocalStorage Functions ---
    const getDataLS = (key, defaultValue = 0) => { try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : defaultValue; } catch (error) { console.error(`Error reading ${key} from localStorage:`, error); return defaultValue; } };
    const saveDataLS = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (error) { console.error(`Error saving ${key} to localStorage:`, error); } };

    // --- Rental Numbering ---
    const getNextRentalNumber = () => { let currentCounter = getDataLS(RENTAL_COUNTER_LS_KEY, 0); if (typeof currentCounter !== 'number' || isNaN(currentCounter)) { console.warn("Rental counter invalid, resetting."); currentCounter = 0; } const nextNumber = currentCounter + 1; saveDataLS(RENTAL_COUNTER_LS_KEY, nextNumber); return nextNumber; };

    // --- Modal Functions ---
    const openModal = (modalId) => { console.log("Attempting to open modal:", modalId); const modalElement = document.getElementById(modalId); if (modalElement) { modalElement.style.display = 'block'; } else { console.error(`Modal with ID ${modalId} not found!`); }};
    const closeModal = (modalElement) => {
        if (!modalElement) return;
        modalElement.style.display = 'none';
        if (modalElement.id === 'rental-modal') {
            resetOngoingRentalState();
        }
        // Removed conditional block for 'login-modal'
    };
    const resetOngoingRentalState = () => {
        ongoingRentalInfo = null;
        const getElement = (id) => document.getElementById(id);
        const numberInput = getElement('rental-number-ongoing');
        const opSelect = getElement('rental-operator');
        const whSelect = getElement('rental-warehouse');
        const clientInput = getElement('rental-client-name');
        const dateInput = getElement('rental-start-date');
        const collectedByInput = getElement('rental-collected-by');
        const title = getElement('rental-modal-title');
        const brandSelect = getElement('rental-brand-selection');
        const itemSelect = getElement('rental-item-selection');
        const notesText = getElement('rental-notes');
        const quantityInput = getElement('rental-quantity');
        const availableInfo = getElement('quantity-available-info');

        if (numberInput) numberInput.value = '';
        if (opSelect) { opSelect.value = ''; opSelect.disabled = false; }
        if (whSelect) { whSelect.value = ''; whSelect.disabled = false; }
        if (clientInput) { clientInput.value = ''; clientInput.disabled = false; }
                if (collectedByInput) { collectedByInput.value = ''; collectedByInput.disabled = false; }
        if (dateInput) { dateInput.value = new Date().toISOString().split('T')[0]; dateInput.disabled = false; }
        if (title) title.textContent = "Nuovo Noleggio";
        if (brandSelect) brandSelect.value = '';
        if (itemSelect) { itemSelect.innerHTML = '<option value="">-- Seleziona Marca Prima --</option>'; itemSelect.disabled = true;}
        if (notesText) notesText.value = '';
        if (quantityInput) quantityInput.value = 1;
        if (availableInfo) availableInfo.style.display = 'none';
    };

    // --- Data Loading & Rendering Functions ---
    const updateBillingStats = async () => {
        const totalCompletedStat = document.getElementById('total-completed');
        const totalClientsStat = document.getElementById('total-clients');
        if (!db) { console.warn("DB not ready for updateBillingStats"); if (totalCompletedStat) totalCompletedStat.textContent = 'N/D'; if (totalClientsStat) totalClientsStat.textContent = 'N/D'; return; }
        try {
            const snapshot = await db.collection("completedRentals").get();
            const completedRentals = []; snapshot.forEach(doc => completedRentals.push(doc.data()));
            const clients = [...new Set(completedRentals.map(rental => rental.client))];
            if (totalCompletedStat) totalCompletedStat.textContent = completedRentals.length;
            if (totalClientsStat) totalClientsStat.textContent = clients.length;
        } catch (err) {
            console.error("Error updating billing stats from Firestore:", err);
            if (!err.message?.includes('permission denied') && !err.message?.includes('Missing or insufficient permissions')) {
                showError("Errore aggiornamento statistiche fatturazione: " + err.message);
            } else {
                console.warn("Permission error suppressed for billing stats update.");
            }
            if (totalCompletedStat) totalCompletedStat.textContent = 'ERR';
            if (totalClientsStat) totalClientsStat.textContent = 'ERR';
        }
    };
    const updateInventoryStats = (inventory = []) => { const totalItemsStat = document.getElementById('total-items'); const availableItemsStat = document.getElementById('available-items'); try { if (totalItemsStat) totalItemsStat.textContent = inventory.reduce((sum, item) => sum + (item.totalQuantity || 0), 0); if (availableItemsStat) availableItemsStat.textContent = inventory.reduce((sum, item) => sum + (item.availableQuantity || 0), 0); } catch (err) { console.error("Error updating inventory stats:", err); } };
    const updateRentalStats = (activeRentals = []) => { const totalRentalsStat = document.getElementById('total-rentals'); const itemsRentedStat = document.getElementById('items-rented'); try { if (totalRentalsStat) totalRentalsStat.textContent = activeRentals.length; if (itemsRentedStat) itemsRentedStat.textContent = activeRentals.reduce((sum, rental) => sum + (rental.quantity || 0), 0); } catch (err) { console.error("Error updating rental stats:", err); } };
    const applyInventoryFilters = (inventory) => { const inventorySearchInput = document.getElementById('inventory-search'); const filterBrandSelect = document.getElementById('filter-brand'); const filterStatusSelect = document.getElementById('filter-status'); const searchTerm = inventorySearchInput ? inventorySearchInput.value.toLowerCase() : ''; const brandFilter = filterBrandSelect ? filterBrandSelect.value : ''; const statusFilter = filterStatusSelect ? filterStatusSelect.value : ''; return inventory.filter(item => { const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm); const matchesBrand = !brandFilter || item.brand === brandFilter; const isAvailable = item.availableQuantity > 0; const matchesStatus = !statusFilter || (statusFilter === 'available' && isAvailable) || (statusFilter === 'rented' && !isAvailable); return matchesSearch && matchesBrand && matchesStatus; }); };

    const renderInventoryTable = (inventory) => {
        const inventoryTableBody = document.getElementById('inventory-table')?.querySelector('tbody');
        if (!inventoryTableBody) { console.error("Inventory table body not found"); return; }
        inventoryTableBody.innerHTML = '';
        const filteredInventory = applyInventoryFilters(inventory);
        const isAdminUser = isAdmin();

        if (filteredInventory.length === 0) {
            inventoryTableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="font-style:italic;">Nessun articolo trovato.</td></tr>`;
            return;
        }
        const fragment = document.createDocumentFragment();
        filteredInventory.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.itemId = item.id;
            const status = item.availableQuantity > 0 ? '<span class="badge badge-success">Disponibile</span>' : '<span class="badge badge-danger">Esaurito</span>';
            let actionsHtml = `<td class="actions">`;
            // "Modifica Articolo" disponibile per tutti gli utenti loggati
            actionsHtml += `<button class="btn btn-sm btn-warning btn-edit-item" data-id="${item.id}"><i class="fas fa-edit"></i> Modifica</button> `;
            if (isAdminUser) {
                actionsHtml += `<button class="btn btn-sm btn-danger btn-delete-item" data-id="${item.id}"><i class="fas fa-trash"></i> Elimina</button>`;
            }
            actionsHtml += `</td>`;
            tr.innerHTML = `<td><i class="fas fa-tag"></i> ${escapeHtml(item.brand)}</td><td>${escapeHtml(item.name)}</td><td class="text-center">${item.totalQuantity}</td><td class="text-center">${item.availableQuantity}</td><td class="text-right">${formatPrice(item.dailyRate)}</td><td>${status}</td>${actionsHtml}`;
            fragment.appendChild(tr);
        });
        inventoryTableBody.appendChild(fragment);
    };

    const renderActiveRentalsTable = (rentals) => {
        const activeRentalsTableBody = document.getElementById('active-rentals-table')?.querySelector('tbody');
        if (!activeRentalsTableBody) { console.error("Active rentals table body not found"); return; }
        activeRentalsTableBody.innerHTML = '';
        const isAdminUser = isAdmin();

        if (rentals.length === 0) {
            activeRentalsTableBody.innerHTML = '<tr><td colspan="8" class="text-center" style="font-style:italic;">Nessun noleggio attivo.</td></tr>';
            return;
        }
        const fragment = document.createDocumentFragment();
        rentals.forEach(rental => {
            const tr = document.createElement('tr');
            tr.dataset.rentalId = rental.id;
            let actionsHtml = '<td class="actions">';
            actionsHtml += `<button class="btn btn-sm btn-success btn-complete-rental" data-id="${rental.id}" title="Completa Noleggio"><i class="fas fa-check"></i></button> `;
            actionsHtml += `<button class="btn btn-sm btn-warning btn-edit-rental" data-id="${rental.id}" title="Modifica Noleggio"><i class="fas fa-edit"></i></button> `;
            actionsHtml += `<button class="btn btn-sm btn-primary btn-reprint-rental" data-id="${rental.id}" title="Ristampa Ricevuta"><i class="fas fa-print"></i></button> `;
            if (isAdminUser) {
                actionsHtml += `<button class="btn btn-sm btn-danger btn-delete-rental" data-id="${rental.id}" title="Annulla Riga Noleggio"><i class="fas fa-times"></i></button>`;
            }
            actionsHtml += '</td>';
                        tr.innerHTML = `<td>${escapeHtml(rental.rentalNumber || 'N/A')}</td><td>${escapeHtml(rental.itemName)} (${rental.quantity})</td><td>${escapeHtml(rental.client)}</td><td>${escapeHtml(rental.warehouse || 'N/D')}</td><td>${formatDate(rental.startDate)}</td><td>${escapeHtml(rental.notes || '')}</td><td><span class="badge badge-warning">Attivo</span></td>${actionsHtml}`;
            fragment.appendChild(tr);
        });
        activeRentalsTableBody.appendChild(fragment);
    };

    const populateItemDropdown = async (selectedBrand, itemSelectElement, availableInfoElement = null, quantityInputElement = null, currentItemId = null, currentItemQuantity = 0) => {
        if (!itemSelectElement) return; itemSelectElement.innerHTML = ''; itemSelectElement.disabled = true; if (availableInfoElement) availableInfoElement.style.display = 'none'; if (quantityInputElement) { quantityInputElement.value = 1; quantityInputElement.max = null; } if (!selectedBrand) { itemSelectElement.innerHTML = '<option value="">-- Seleziona Marca Prima --</option>'; return; } if (!db) { showError("Errore: Database non disponibile."); itemSelectElement.innerHTML = `<option value="" disabled>Errore Database</option>`; return; }
        try {
            const snapshot = await db.collection("inventory").where("brand", "==", selectedBrand).get();
            const inventoryItems = []; snapshot.forEach(doc => inventoryItems.push({ firestoreDocId: doc.id, ...doc.data() }));
            const itemsOfBrand = inventoryItems.filter(item => (item.availableQuantity > 0 || item.firestoreDocId === currentItemId));
            if (itemsOfBrand.length === 0) { itemSelectElement.innerHTML = `<option value="" disabled>Nessun articolo ${currentItemId ? '' : 'disponibile '}per ${escapeHtml(selectedBrand)}</option>`; return; }
            itemSelectElement.innerHTML = '<option value="">-- Seleziona Articolo --</option>';
            itemsOfBrand.forEach(item => {
                const option = document.createElement('option'); option.value = item.firestoreDocId; let maxForThisItem = item.availableQuantity + (item.firestoreDocId === currentItemId ? currentItemQuantity : 0); option.dataset.max = maxForThisItem; option.textContent = `${escapeHtml(item.name)} (${item.availableQuantity} disp.)`; itemSelectElement.appendChild(option);
            });
            if (currentItemId && itemsOfBrand.some(item => item.firestoreDocId === currentItemId)) { itemSelectElement.value = currentItemId; }
            itemSelectElement.disabled = false;
            if (itemSelectElement.value) { itemSelectElement.dispatchEvent(new Event('change')); }
            else if (quantityInputElement) { if (availableInfoElement) availableInfoElement.style.display = 'none'; quantityInputElement.max = null; }
        } catch (error) { console.error("Error getting items by brand from Firestore: ", error); showError("Errore nel caricare gli articoli per la marca selezionata."); itemSelectElement.innerHTML = `<option value="" disabled>Errore caricamento articoli</option>`; }
    };
    const updateBrandFilters = (inventory, brandSelectElement, itemSelectElement = null, availableInfoElement = null, quantityInputElement = null, currentItemId = null, currentItemQuantity = 0) => {
        const brands = [...new Set(inventory.map(item => item.brand))].sort();
        if (brandSelectElement) {
            const currentValue = brandSelectElement.value;
            brandSelectElement.innerHTML = '<option value="">Tutte le marche</option>';
            brands.forEach(brand => { const option = document.createElement('option'); option.value = brand; option.textContent = escapeHtml(brand); brandSelectElement.appendChild(option); });
            if (currentValue && brands.includes(currentValue)) { brandSelectElement.value = currentValue; }
            else { if (itemSelectElement) { populateItemDropdown(null, itemSelectElement, availableInfoElement, quantityInputElement, currentItemId, currentItemQuantity); } }
        }
        if (itemSelectElement) { populateItemDropdown(brandSelectElement ? brandSelectElement.value : null, itemSelectElement, availableInfoElement, quantityInputElement, currentItemId, currentItemQuantity); }
    };
    const loadInventoryData = async () => {
        console.log("Attempting to load inventory data...");
        const filterBrandSelect = document.getElementById('filter-brand');
        let currentInventory = [];
        if (!db) { console.warn("DB not ready for loadInventoryData"); return; }
        try {
            const inventoryCollection = db.collection("inventory");
            const snapshot = await inventoryCollection.get();
            snapshot.forEach(doc => currentInventory.push({ id: doc.id, ...doc.data() }));
            console.log(`Loaded ${currentInventory.length} items from Firestore.`);
        } catch (error) {
            console.error("Error loading inventory from Firestore:", error);
             if (!error.message?.includes('permission denied') && !error.message?.includes('Missing or insufficient permissions')) {
                 showError("Errore nel caricamento dell'inventario dal database.");
             } else {
                console.warn("Permission error suppressed for inventory load.");
             }
            currentInventory = [];
        } finally {
            renderInventoryTable(currentInventory);
            if(filterBrandSelect) { updateBrandFilters(currentInventory, filterBrandSelect); }
            updateInventoryStats(currentInventory);
        }
     };
    const renderOldestRentals = (activeRentals = []) => {
        const oldestRentalsList = document.getElementById('oldest-rentals-list');
        if (!oldestRentalsList) return;
        const rentalsNeedingAttention = activeRentals.filter(rental => getDaysElapsed(rental.startDate) >= MIN_DAYS_FOR_ATTENTION);
        const oldestPerRentalNumber = rentalsNeedingAttention.reduce((acc, rental) => { const key = rental.rentalNumber; if (!acc[key] || new Date(rental.startDate) < new Date(acc[key].startDate)) { acc[key] = rental; } return acc; }, {});
        const uniqueOldestRentals = Object.values(oldestPerRentalNumber).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        if (uniqueOldestRentals.length === 0) { oldestRentalsList.innerHTML = `<li>Nessun noleggio attivo da ${MIN_DAYS_FOR_ATTENTION} o più giorni.</li>`; return; }
        const fragment = document.createDocumentFragment();
        uniqueOldestRentals.forEach(rental => {
            const li = document.createElement('li');
            const daysElapsed = getDaysElapsed(rental.startDate);
            const daysElapsedText = ` - <span>${daysElapsed} gg fa</span>`;
            const itemsForThisRental = activeRentals.filter(r => r.rentalNumber === rental.rentalNumber);
            const itemsSummary = itemsForThisRental.map(r => `${r.itemName} (Q:${r.quantity})`).join(', ');
            li.innerHTML = `<span class="rental-details"><i class="fas fa-user" title="Noleggio #${rental.rentalNumber}, Mag: ${escapeHtml(rental.warehouse || 'N/D')}, Op: ${escapeHtml(rental.operator || 'N/D')}, Articoli: ${escapeHtml(itemsSummary)}"></i> ${escapeHtml(rental.client)} - Noleggio #${rental.rentalNumber}</span><span class="rental-date">${formatDate(rental.startDate)}${daysElapsedText}</span>`;
            fragment.appendChild(li);
        });
        oldestRentalsList.innerHTML = '';
        oldestRentalsList.appendChild(fragment);
    };
    const loadRentalData = async () => {
        console.log("Attempting to load rental data...");
        const activeRentalsTableBody = document.getElementById('active-rentals-table')?.querySelector('tbody');
        let activeRentals = [];
        await updateBillingStats(); // This now also suppresses permission errors
        await updateRentalStats([]); // Reset stats before loading

        if (!db) { console.warn("DB not ready for loadRentalData"); return; }
        try {
            const rentalsCollection = db.collection("activeRentals");
            const snapshot = await rentalsCollection.orderBy("startDate", "desc").get();
            snapshot.forEach(doc => { activeRentals.push({ id: doc.id, ...doc.data() }); });
            console.log(`Loaded ${activeRentals.length} active rentals from Firestore.`);
        } catch (error) {
            console.error("Error loading active rentals from Firestore:", error);
            if (!error.message?.includes('permission denied') && !error.message?.includes('Missing or insufficient permissions')) {
                 showError("Errore nel caricamento dei noleggi attivi dal database.");
            } else {
                 console.warn("Permission error suppressed for active rentals load.");
            }
            if (activeRentalsTableBody) activeRentalsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Errore caricamento noleggi.</td></tr>';
            activeRentals = []; // Ensure it's an empty array on error
        } finally {
             renderActiveRentalsTable(activeRentals);
             renderOldestRentals(activeRentals);
             updateRentalStats(activeRentals);
        }
    };
    const populateOperatorDropdown = (selectElement) => { if (!selectElement) return; const currentValue = selectElement.value; selectElement.innerHTML = '<option value="">-- Seleziona Operatore --</option>'; const sortedOperators = [...OPERATORS].sort((a, b) => a.localeCompare(b)); sortedOperators.forEach(opName => { const option = document.createElement('option'); option.value = opName; option.textContent = opName; selectElement.appendChild(option); }); if (currentValue && sortedOperators.includes(currentValue)) { selectElement.value = currentValue; } };
    const populateRentalBrandDropdown = async () => { const rentalBrandSelect = document.getElementById('rental-brand-selection'); const rentalItemSelect = document.getElementById('rental-item-selection'); const quantityAvailableInfo = document.getElementById('quantity-available-info'); const rentalQuantityInput = document.getElementById('rental-quantity'); if (!db) { console.warn("DB not ready for populateRentalBrandDropdown"); return; } try { const snapshot = await db.collection("inventory").get(); const inventory = []; snapshot.forEach(doc => inventory.push({ id: doc.id, ...doc.data() })); updateBrandFilters(inventory, rentalBrandSelect, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput); } catch (err) { console.error("Errore lettura inventario per popolare marche:", err); showError("Errore caricamento marche."); if (rentalBrandSelect) rentalBrandSelect.innerHTML = '<option value="">Errore</option>'; if (rentalItemSelect) { rentalItemSelect.innerHTML = '<option value="">-- Errore --</option>'; rentalItemSelect.disabled = true; } } };
    const printSingleRentalReceipt = (rentalDataArray) => {
        if (!Array.isArray(rentalDataArray) || rentalDataArray.length === 0) { showError("Errore: Dati ricevuta non validi."); return; }
        const commonData = rentalDataArray[0]; let itemsHtml = '';
        rentalDataArray.forEach(item => { itemsHtml += `<div class="receipt-item"><strong>Descrizione:</strong> <span>${escapeHtml(item.itemName)}</span></div><div class="receipt-item"><strong>Quantità:</strong> <span>${escapeHtml(item.quantity)}</span></div>${item.notes ? `<div class="receipt-item"><strong>Note Articolo:</strong> <span>${escapeHtml(item.notes)}</span></div>` : ''}<div style="border-bottom: 1px dotted #eee; margin: 5px 0;"></div>`; });
        itemsHtml = itemsHtml.substring(0, itemsHtml.lastIndexOf('<div style="border-bottom'));
        let receiptHtml = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Ricevuta Noleggio #${commonData.rentalNumber}</title><style>body{font-family:Arial,sans-serif;font-size:11pt;margin:15mm;} .receipt-header{display:flex;align-items:center;gap:20px;margin-bottom:25px;border-bottom:2px solid #000;padding-bottom:15px;} .receipt-header img{max-height:85px;width:auto;flex-shrink:0;} .receipt-header h1{margin:0;font-size:18pt;text-align:left;flex-grow:1;} .receipt-section{margin-bottom:20px; padding-bottom: 15px; border-bottom: 1px dashed #ccc;} .receipt-section:last-of-type { border-bottom: none; } .receipt-section h2 {font-size: 14pt; margin-bottom: 10px; color: #333; } .receipt-item{display: flex; justify-content: space-between; margin-bottom: 8px; line-height:1.5;} .receipt-item strong{font-weight: bold; min-width: 150px; padding-right: 10px;} .receipt-item span{text-align: left; flex-grow: 1;} .receipt-signature { margin-top: 50px; padding-top: 15px; border-top: 1px solid #ccc; } .receipt-signature p { margin-bottom: 40px; } .signature-line { border-bottom: 1px solid #000; width: 70%; margin: 0 auto; } .signature-label { text-align: center; font-size: 9pt; color: #555; margin-top: 5px; } .footer { margin-top: 40px; font-size: 9pt; color: #555; text-align: center; border-top: 1px solid #ccc; padding-top: 15px; } @page{size:A4;margin:15mm;} @media print{body{margin:15mm;font-size:11pt}}</style></head><body><div class="receipt-header"><img src="${LOGO_URL}" alt="Logo CAI Idraulica"><h1>Documento di Noleggio</h1></div><div class="receipt-section"><h2>Dettagli Noleggio</h2><div class="receipt-item"><strong>Numero Noleggio:</strong> <span>${escapeHtml(commonData.rentalNumber || 'N/A')}</span></div><div class="receipt-item"><strong>Data Noleggio:</strong> <span>${formatDate(commonData.startDate)}</span></div><div class="receipt-item"><strong>Magazzino:</strong> <span>${escapeHtml(commonData.warehouse || 'N/D')}</span></div><div class="receipt-item"><strong>Operatore:</strong> <span>${escapeHtml(commonData.operator || 'N/D')}</span></div></div><div class="receipt-section"><h2>Cliente</h2> <div class="receipt-item"><strong>Nominativo:</strong> <span>${escapeHtml(commonData.client)}</span></div></div> <div class="receipt-section"><h2>Articoli Noleggiati</h2> ${itemsHtml} </div> <div class="receipt-signature"><p>Firma per presa visione e accettazione:</p><div class="signature-line"></div><div class="signature-label">(Firma del Cliente)</div></div><div class="footer">Grazie per aver scelto il C.A.I. Consorzio Artigiani Idraulici! <br>Documento generato il: ${new Date().toLocaleString('it-IT')}</div> <script>window.onload=function(){ try { window.print(); window.close(); } catch(e) { console.error('Print failed:', e); } };<\/script></body></html>`;
        const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(receiptHtml); printWindow.document.close(); } else { showError("Impossibile aprire finestra stampa ricevuta."); }
    };
    const setDefaultPrintDate = () => { const printMonthSelect = document.getElementById('print-month'); const printYearInput = document.getElementById('print-year'); try { const today = new Date(); const currentMonth = today.getMonth() + 1; const currentYear = today.getFullYear(); if (printMonthSelect) printMonthSelect.value = currentMonth; if (printYearInput) printYearInput.value = currentYear; } catch (err) { console.error("Error setting default print date:", err); } };
    const prepareModalForAdditionalItem = (rentalInfo) => {
        const getElement = (id) => document.getElementById(id);
        const rentalNumberOngoingInput = getElement('rental-number-ongoing'); const rentalOperatorSelect = getElement('rental-operator'); const rentalWarehouseSelect = getElement('rental-warehouse'); const rentalClientNameInput = getElement('rental-client-name'); const rentalStartDateInput = getElement('rental-start-date'); const rentalBrandSelect = getElement('rental-brand-selection'); const rentalItemSelect = getElement('rental-item-selection'); const quantityAvailableInfo = getElement('quantity-available-info'); const rentalQuantityInput = getElement('rental-quantity'); const rentalNotesTextarea = getElement('rental-notes'); const rentalModalTitle = getElement('rental-modal-title');
        if (!rentalInfo) return; if (rentalNumberOngoingInput) rentalNumberOngoingInput.value = rentalInfo.rentalNumber; if (rentalOperatorSelect) { rentalOperatorSelect.value = rentalInfo.operator; rentalOperatorSelect.disabled = true; } if (rentalWarehouseSelect) { rentalWarehouseSelect.value = rentalInfo.warehouse; rentalWarehouseSelect.disabled = true; } if (rentalClientNameInput) { rentalClientNameInput.value = rentalInfo.client; rentalClientNameInput.disabled = true; } if (rentalStartDateInput) { rentalStartDateInput.value = rentalInfo.startDate; rentalStartDateInput.disabled = true; } if (rentalBrandSelect) rentalBrandSelect.value = ""; populateItemDropdown(null, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput); if (rentalQuantityInput) rentalQuantityInput.value = 1; if (quantityAvailableInfo) quantityAvailableInfo.style.display = 'none'; if (rentalNotesTextarea) rentalNotesTextarea.value = ""; if (rentalModalTitle) rentalModalTitle.textContent = `Aggiungi Articolo a Noleggio #${rentalInfo.rentalNumber}`; openModal('rental-modal'); rentalBrandSelect?.focus();
    };


    // --- Main Application Initialization (Accepts userRole from onAuthStateChanged) ---
    const initializeApp = async (userRole) => {
        if (window.appInitialized) { console.log("initializeApp: Already initialized."); return; }
        console.log(`Noleggi App: Initializing application UI and loading data for role: ${userRole}`);
        window.appInitialized = true; // Set flag when initialization starts

        // --- DOM Element References ---
        const getElement = (id) => document.getElementById(id);
        const querySel = (selector) => document.querySelector(selector);
        const newItemBtn = getElement('new-item-btn');
        const exportInventoryBtn = getElement('export-inventory-btn');
        const resetInventoryBtn = getElement('reset-inventory');
        const excelUploadLabel = querySel('label[for="excel-upload"]');
        const resetCompletedBtn = getElement('reset-completed-btn');
        // const inventoryActionsHeader = querySel('#inventory-table th:last-child'); // Already visible by default
        // const rentalActionsHeader = querySel('#active-rentals-table th:last-child'); // Already visible by default
        const rentalOperatorSelect = getElement('rental-operator');
        const editRentalOperatorSelect = getElement('edit-rental-operator');

        // --- Apply Role-Based UI Visibility ---
        console.log("Noleggi App: Applying role-based UI visibility based on currentUserRole:", window.currentUserRole);
        const isAdminUser = isAdmin(); // Uses window.currentUserRole which should be set

        // Display buttons that create new entries or export data for all authenticated users
        if (newItemBtn) newItemBtn.style.display = 'inline-block';
        if (exportInventoryBtn) exportInventoryBtn.style.display = 'inline-block';

        // Admin-only destructive or bulk-import actions
        if (resetInventoryBtn) resetInventoryBtn.style.display = isAdminUser ? 'inline-block' : 'none';
        if (excelUploadLabel) excelUploadLabel.style.display = isAdminUser ? 'inline-block' : 'none';
        if (resetCompletedBtn) resetCompletedBtn.style.display = isAdminUser ? 'inline-block' : 'none';

        // Actions columns headers are always visible, individual buttons inside are controlled by render functions
        // if (inventoryActionsHeader) inventoryActionsHeader.style.display = 'table-cell';
        // if (rentalActionsHeader) rentalActionsHeader.style.display = 'table-cell';


        // --- Initial Load ---
        console.log("Noleggi App: Performing initial data load...");
        try {
            if(rentalOperatorSelect) populateOperatorDropdown(rentalOperatorSelect);
            if(editRentalOperatorSelect) populateOperatorDropdown(editRentalOperatorSelect);
            await loadInventoryData(); // These functions now suppress permission errors for general users
            await loadRentalData();
            setDefaultPrintDate();
            console.log("Noleggi App: Application initialized successfully.");
        } catch (err) {
            console.error("Noleggi App: Error during initial data load:", err);
            // Avoid showing permission errors here as access control is handled by onAuthStateChanged
            if (!err.message?.includes('permission')) {
                 showError("Errore critico durante il caricamento dati: " + err.message);
            }
        }
    }; // End of initializeApp


    // --- Setup Event Listeners ONCE on DOM Ready ---
    const setupEventListeners = () => {
        console.log("Noleggi App: Attaching event listeners ONCE...");

        const getElement = (id) => document.getElementById(id);
        const querySel = (selector) => document.querySelector(selector);
        const inventoryTableBody = querySel('#inventory-table tbody');
        const activeRentalsTableBody = querySel('#active-rentals-table tbody');
        const inventorySearchInput = getElement('inventory-search');
        const filterBrandSelect = getElement('filter-brand');
        const filterStatusSelect = getElement('filter-status');
        const newItemBtn = getElement('new-item-btn');
        const newItemModal = getElement('new-item-modal');
        const newItemForm = getElement('new-item-form');
        const editItemModal = getElement('edit-item-modal');
        const editItemForm = getElement('edit-item-form');
        const newRentalBtn = getElement('new-rental-btn');
        const rentalModal = getElement('rental-modal');
        const rentalForm = getElement('new-rental-form');
        const rentalBrandSelect = getElement('rental-brand-selection');
        const rentalItemSelect = getElement('rental-item-selection');
        const rentalQuantityInput = getElement('rental-quantity');
        const quantityAvailableInfo = getElement('quantity-available-info');
        const rentalOperatorSelect = getElement('rental-operator');
        const rentalStartDateInput = getElement('rental-start-date');
        const rentalWarehouseSelect = getElement('rental-warehouse');
        const rentalClientNameInput = getElement('rental-client-name');
        const rentalNotesTextarea = getElement('rental-notes');
        const editRentalModal = getElement('edit-rental-modal');
        const editRentalForm = getElement('edit-rental-form');
        // const editRentalOperatorSelect = getElement('edit-rental-operator'); // Already referenced in initializeApp
        const editRentalBrandSelection = getElement('edit-rental-brand-selection');
        const editRentalItemSelection = getElement('edit-rental-item-selection');
        const editRentalQuantityInput = getElement('edit-rental-quantity');
        const editQuantityAvailableInfo = getElement('edit-quantity-available-info');
        const allModals = document.querySelectorAll('.modal'); // Select all modals, no exclusion needed
        const exportInventoryBtn = getElement('export-inventory-btn');
        const resetInventoryBtn = getElement('reset-inventory');
        const excelUploadInput = getElement('excel-upload');
        const printRentalsBtn = getElement('print-rentals-btn');
        const printMonthSelect = getElement('print-month');
        const printYearInput = getElement('print-year');
        const resetCompletedBtn = getElement('reset-completed-btn');

        // General Modal Closers
        allModals.forEach(modal => { const closeBtn = modal.querySelector('.close-btn'); if (closeBtn) { closeBtn.addEventListener('click', () => closeModal(modal)); } else { console.warn(`Close button not found for modal: #${modal.id}`); }});
        window.addEventListener('click', (event) => { allModals.forEach(modal => { if (event.target == modal) closeModal(modal); }); });

        // --- Inventory Actions ---
        if (excelUploadInput) {
             excelUploadInput.addEventListener('change', async function (e) {
                 console.log("Excel upload changed.");
                 if (!isAdmin()) { showError("Azione non consentita. Privilegi di amministratore richiesti."); excelUploadInput.value = ''; return; }
                 const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
                 reader.onload = async function(event) {
                     try {
                        const data = new Uint8Array(event.target.result); const workbook = XLSX.read(data, { type: 'array' }); const firstSheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[firstSheetName]; const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); if (jsonData.length < 2) throw new Error("File Excel vuoto o solo intestazione."); const header = jsonData[0].map(h => String(h).trim().toLowerCase()); const brandIndex = header.indexOf('marca'); const nameIndex = header.indexOf('articolo'); const quantityIndex = header.indexOf("quantita'"); const priceIndex = header.indexOf('costo'); if ([brandIndex, nameIndex, quantityIndex, priceIndex].some(index => index === -1)) { throw new Error("Intestazioni mancanti/errate: servono 'marca', 'articolo', 'quantita'', 'costo'."); } const newInventory = jsonData.slice(1).map((row, rowIndex) => { const brand = row[brandIndex] ? String(row[brandIndex]).trim() : null; const name = row[nameIndex] ? String(row[nameIndex]).trim() : null; const totalQuantity = row[quantityIndex] !== undefined && row[quantityIndex] !== null ? parseInt(row[quantityIndex]) : null; const dailyRate = row[priceIndex] !== undefined && row[priceIndex] !== null ? parseFloat(String(row[priceIndex]).replace(',', '.')) : null; if (!brand || !name || totalQuantity === null || isNaN(totalQuantity) || totalQuantity < 0 || dailyRate === null || isNaN(dailyRate) || dailyRate < 0) { console.warn(`Riga ${rowIndex + 2}: Dati mancanti/invalidi. Ignorato.`); return null; } return { brand: brand, name: name, totalQuantity: totalQuantity, availableQuantity: totalQuantity, dailyRate: dailyRate }; }).filter(item => item !== null); if (newInventory.length === 0) { throw new Error("Nessun articolo valido trovato nel file Excel."); } if (confirm(`Importare ${newInventory.length} articoli? L'inventario corrente verrà SOSTITUITO.`)) { if (!db) throw new Error("Firestore non inizializzato."); const batch = db.batch(); const currentInvSnapshot = await db.collection("inventory").get(); currentInvSnapshot.docs.forEach(doc => batch.delete(doc.ref)); newInventory.forEach(item => { const docRef = db.collection("inventory").doc(); batch.set(docRef, item); }); await batch.commit(); loadInventoryData(); alert("Inventario importato con successo."); }
                     } catch (err) { console.error("Error processing Excel file:", err); showError(`Errore importazione Excel: ${err.message}`); }
                     finally { if (excelUploadInput) excelUploadInput.value = ''; }
                 };
                 reader.onerror = function(event) { console.error("File read error:", event.target.error.code); showError("Impossibile leggere il file."); if (excelUploadInput) excelUploadInput.value = ''; };
                 reader.readAsArrayBuffer(file);
            });
        }
        if (exportInventoryBtn) { // Available to all authenticated users
            exportInventoryBtn.addEventListener('click', async function () {
                console.log("Export inventory clicked.");
                try {
                    if (!db) throw new Error("Firestore non inizializzato."); const snapshot = await db.collection("inventory").get(); const inventory = []; snapshot.forEach(doc => inventory.push({ id: doc.id, ...doc.data() })); if (inventory.length === 0) { showError("Inventario vuoto."); return; } const dataToExport = [ ["marca", "articolo", "quantita'", "costo", "Disponibili"] ]; inventory.forEach(item => { dataToExport.push([ item.brand, item.name, item.totalQuantity, item.dailyRate, item.availableQuantity ]); }); const worksheet = XLSX.utils.aoa_to_sheet(dataToExport); worksheet['!cols'] = [ { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]; const priceColRange = XLSX.utils.decode_range(worksheet['!ref']); for (let R = priceColRange.s.r + 1; R <= priceColRange.e.r; ++R) { const cellRef = XLSX.utils.encode_cell({ c: 3, r: R }); if(!worksheet[cellRef]) continue; worksheet[cellRef].t = 'n'; worksheet[cellRef].z = '#,##0.00 €'; } const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario"); const today = new Date().toISOString().slice(0, 10); XLSX.writeFile(workbook, `Inventario_CAI_${today}.xlsx`);
                } catch (err) { console.error("Error exporting inventory:", err); showError("Errore esportazione inventario."); }
            });
        }
        if (resetInventoryBtn) {
            resetInventoryBtn.addEventListener('click', async function () {
                console.log("Reset inventory clicked.");
                if (!isAdmin()) { showError("Azione non consentita. Privilegi di amministratore richiesti."); return; }
                try {
                    let activeRentalsCount = 0; try { if (!db) throw new Error("Firestore non inizializzato."); const activeSnapshot = await db.collection("activeRentals").limit(1).get(); activeRentalsCount = activeSnapshot.size; } catch(err) { console.error("Error checking active rentals before reset:", err); showError("Errore controllo noleggi attivi prima del reset."); return; } if (activeRentalsCount > 0) { showError("Impossibile resettare: ci sono noleggi attivi nel database."); return; } if (confirm("CANCELLARE tutto l'inventario dal database? Azione irreversibile.")) { try { if (!db) throw new Error("Firestore non inizializzato."); const snapshot = await db.collection("inventory").get(); const batch = db.batch(); snapshot.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); saveDataLS(RENTAL_COUNTER_LS_KEY, 0); loadInventoryData(); loadRentalData(); alert("Inventario resettato dal database."); } catch (err) { console.error("Error resetting inventory in Firestore:", err); showError("Errore durante il reset dell'inventario nel database."); } }
                } catch (err) { console.error("Reset inventory check error:", err); }
             });
        }
        if(inventorySearchInput) inventorySearchInput.addEventListener('input', () => { loadInventoryData(); });
        if(filterBrandSelect) filterBrandSelect.addEventListener('input', () => { loadInventoryData(); });
        if(filterStatusSelect) filterStatusSelect.addEventListener('input', () => { loadInventoryData(); });

        if (newItemBtn) { // Available to all authenticated users
            newItemBtn.addEventListener('click', () => {
                console.log("New item button clicked.");
                if (newItemForm) newItemForm.reset(); openModal('new-item-modal'); getElement('new-item-brand')?.focus();
            });
        }
        if (newItemForm) {
            newItemForm.addEventListener('submit', async (e) => {
                console.log("New item form submitted.");
                e.preventDefault();
                try {
                    const brand = getElement('new-item-brand')?.value.trim(); const name = getElement('new-item-name')?.value.trim(); const quantityInput = getElement('new-item-quantity'); const rateInput = getElement('new-item-daily-rate'); const quantity = quantityInput ? parseInt(quantityInput.value) : null; const dailyRate = rateInput ? parseFloat(rateInput.value) : null; if (!brand || !name || quantity === null || isNaN(quantity) || quantity < 0 || dailyRate === null || isNaN(dailyRate) || dailyRate < 0) { showError('Compila correttamente tutti i campi.'); return; } const newItemData = { brand: brand, name: name, totalQuantity: quantity, availableQuantity: quantity, dailyRate: dailyRate }; if (!db) throw new Error("Firestore non inizializzato."); await db.collection("inventory").add(newItemData); console.log("New item added to Firestore"); loadInventoryData(); closeModal(newItemModal); newItemForm.reset();
                } catch (err) { console.error("Error adding new item to Firestore:", err); showError("Errore durante l'aggiunta del nuovo articolo al database."); }
            });
        }
        if (inventoryTableBody) {
            inventoryTableBody.addEventListener('click', async (e) => {
                const editButton = e.target.closest('.btn-edit-item');
                const deleteButton = e.target.closest('.btn-delete-item');

                if (editButton) { // Available to all authenticated users
                    const itemId = editButton.dataset.id;
                    console.log(`Edit item button clicked for: ${itemId}`);
                    try {
                        if (!db) { showError("Firestore non inizializzato."); return; }
                        const docRef = db.collection("inventory").doc(itemId); const docSnap = await docRef.get();
                        if (docSnap.exists) {
                            const itemToEdit = { id: docSnap.id, ...docSnap.data() };
                            if (editItemModal && editItemForm) { getElement('edit-item-id').value = itemToEdit.id; getElement('edit-item-brand').value = itemToEdit.brand; getElement('edit-item-name').value = itemToEdit.name; getElement('edit-item-total-quantity').value = itemToEdit.totalQuantity; getElement('edit-item-available-quantity').value = itemToEdit.availableQuantity; getElement('edit-item-daily-rate').value = itemToEdit.dailyRate; openModal('edit-item-modal'); }
                            else { showError("Errore apertura modal modifica."); }
                        } else { showError("Articolo non trovato."); loadInventoryData(); }
                    } catch (err) { console.error("Error fetching item for edit:", err); showError("Errore recupero dati articolo."); }
                } else if (deleteButton) {
                    console.log("Delete item button clicked.");
                    if (!isAdmin()) { showError("Azione non consentita. Privilegi di amministratore richiesti."); return; }
                    const itemId = deleteButton.dataset.id;
                    console.log(`Attempting delete for item: ${itemId}`);
                    try {
                         if (!db) throw new Error("Firestore non inizializzato.");
                         const itemRef = db.collection("inventory").doc(itemId); const docSnap = await itemRef.get(); if (!docSnap.exists) { showError("Articolo già eliminato."); loadInventoryData(); return; } const itemToDeleteData = docSnap.data(); let isRented = false; try { const activeRentalSnap = await db.collection("activeRentals").where("itemId", "==", itemId).limit(1).get(); isRented = !activeRentalSnap.empty; } catch(rentCheckErr) { console.error("Error checking if item is rented:", rentCheckErr); showError("Errore verifica se articolo è noleggiato. Riprova."); return; } if (isRented) { showError(`Impossibile eliminare "${itemToDeleteData.brand} ${itemToDeleteData.name}": articolo attualmente noleggiato.`); return; } if (confirm(`Eliminare "${itemToDeleteData.brand} ${itemToDeleteData.name}"?`)) { await itemRef.delete(); console.log("Item deleted from Firestore:", itemId); loadInventoryData(); }
                    } catch (err) { console.error("Error deleting item:", err); showError("Errore eliminazione articolo."); }
                }
            });
        }
        if (editItemForm) { // Form for editing item (available to all authenticated)
            editItemForm.addEventListener('submit', async (e) => {
                console.log("Edit item form submitted.");
                e.preventDefault();
                try {
                    const id = getElement('edit-item-id')?.value; const brand = getElement('edit-item-brand')?.value.trim(); const name = getElement('edit-item-name')?.value.trim(); const totalQuantityInput = getElement('edit-item-total-quantity'); const availableQuantityInput = getElement('edit-item-available-quantity'); const dailyRateInput = getElement('edit-item-daily-rate'); const totalQuantity = totalQuantityInput ? parseInt(totalQuantityInput.value) : null; const availableQuantity = availableQuantityInput ? parseInt(availableQuantityInput.value) : null; const dailyRate = dailyRateInput ? parseFloat(dailyRateInput.value) : null; if (!id || !brand || !name || totalQuantity === null || isNaN(totalQuantity) || totalQuantity < 0 || availableQuantity === null || isNaN(availableQuantity) || availableQuantity < 0 || dailyRate === null || isNaN(dailyRate) || dailyRate < 0) { showError('Compila correttamente tutti i campi.'); return; } if (availableQuantity > totalQuantity) { showError('Disponibile non può superare Totale.'); return; } if (!db) throw new Error("Firestore non inizializzato."); const itemRef = db.collection("inventory").doc(id); const docSnap = await itemRef.get(); if (!docSnap.exists) { showError("Errore: Articolo originale non trovato nel DB."); return; } const originalItemData = docSnap.data(); const rentedQuantity = (originalItemData.totalQuantity || 0) - (originalItemData.availableQuantity || 0); if (totalQuantity < rentedQuantity) { showError(`Nuova Q.tà Totale (${totalQuantity}) < Q.tà Noleggiata (${rentedQuantity}). Non consentito.`); return; } const minAvailable = totalQuantity - rentedQuantity; if (availableQuantity < minAvailable) { showError(`Nuova Q.tà Disponibile (${availableQuantity}) deve essere almeno ${minAvailable} (Totale - Noleggiati). Non consentito.`); return; } const updatedItemData = { brand: brand, name: name, totalQuantity: totalQuantity, availableQuantity: availableQuantity, dailyRate: dailyRate }; await itemRef.update(updatedItemData); console.log("Item updated in Firestore:", id); loadInventoryData(); closeModal(editItemModal);
                } catch (err) { console.error("Error saving item edits:", err); showError("Errore salvataggio modifiche articolo."); }
            });
        }

        // --- Rental Actions (available to all authenticated users) ---
        if (newRentalBtn) {
            newRentalBtn.addEventListener('click', () => {
                console.log("New rental button clicked.");
                resetOngoingRentalState();
                if (rentalForm) rentalForm.reset();
                if(rentalOperatorSelect) populateOperatorDropdown(rentalOperatorSelect);
                populateRentalBrandDropdown();
                if(rentalWarehouseSelect) rentalWarehouseSelect.value = '';
                const today = new Date().toISOString().split('T')[0];
                if(rentalStartDateInput) rentalStartDateInput.value = today;
                openModal('rental-modal');
                rentalOperatorSelect?.focus();
            });
        }
        if (rentalBrandSelect) { rentalBrandSelect.addEventListener('change', (e) => { populateItemDropdown(e.target.value, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput); }); }
        if (rentalItemSelect) { rentalItemSelect.addEventListener('change', (e) => { const infoElement = quantityAvailableInfo; const selectedOption = e.target.options[e.target.selectedIndex]; const maxQuantity = selectedOption?.dataset.max ? parseInt(selectedOption.dataset.max) : 0; if (rentalQuantityInput) { rentalQuantityInput.max = maxQuantity > 0 ? maxQuantity : null; rentalQuantityInput.value = 1; if (maxQuantity > 0 && infoElement) { infoElement.textContent = `Disponibili: ${maxQuantity}`; infoElement.style.display = 'block'; } else if (infoElement) { infoElement.style.display = 'none'; } } }); }
        if (rentalQuantityInput) { rentalQuantityInput.addEventListener('input', (e) => { const max = parseInt(e.target.max); const currentVal = parseInt(e.target.value); if (!isNaN(max) && !isNaN(currentVal) && currentVal > max) { e.target.value = max; showError(`Quantità massima disponibile: ${max}`); } if (!isNaN(currentVal) && currentVal < 1) { e.target.value = 1; } }); }
        if (rentalForm) {
            rentalForm.addEventListener('submit', (e) => {
                console.log("New rental form submitted.");
                e.preventDefault();
                                try {
                    const operator = rentalOperatorSelect.value;
                    const warehouse = rentalWarehouseSelect.value;
                    const clientName = rentalClientNameInput.value.trim().toUpperCase();
                    const collectedBy = document.getElementById('rental-collected-by').value.trim().toUpperCase(); // <<<--- NEW
                    const startDate = rentalStartDateInput.value;
                    const brand = rentalBrandSelect.value;
                    const itemId = rentalItemSelect.value;
                    const quantity = rentalQuantityInput ? parseInt(rentalQuantityInput.value) : 0;
                    const notes = rentalNotesTextarea.value.trim().toUpperCase();

                    if (!operator || !warehouse || !clientName || !startDate || !brand || !itemId || isNaN(quantity) || quantity < 1) {
                        showError('Completa tutti i campi richiesti.');
                        return;
                    }

                    if (!db) throw new Error("Firestore non inizializzato.");

                    console.log("1. Attempting to rent Item ID:", itemId);
                    db.collection("inventory").doc(itemId).get().then(async docSnap => {
                        console.log("2. Firestore get() completed. Document exists:", docSnap.exists);
                        if (!docSnap.exists) {
                            console.error("   -> Error: Document ID not found in Firestore:", itemId);
                            showError('Articolo selezionato non trovato nel database.');
                            return;
                        }
                        const selectedItem = { id: docSnap.id, ...docSnap.data() };
                        console.log("3. Item data retrieved:", selectedItem);
                        if (selectedItem.availableQuantity < quantity) {
                            showError(`Solo ${selectedItem.availableQuantity} di "${selectedItem.name}" disp.`);
                            return;
                        }

                        let currentRentalNumber;
                        let isNewRental = true;
                        if (ongoingRentalInfo && ongoingRentalInfo.rentalNumber) {
                            currentRentalNumber = ongoingRentalInfo.rentalNumber;
                            isNewRental = false;
                        } else {
                            currentRentalNumber = getNextRentalNumber();
                            ongoingRentalInfo = { rentalNumber: currentRentalNumber, operator: operator, client: clientName, warehouse: warehouse, startDate: startDate, collectedBy: collectedBy }; // <<<--- MODIFIED
                        }

                        console.log("4. Rental Number:", currentRentalNumber, "Is New:", isNewRental);
                        const rentalData = {
                            rentalNumber: currentRentalNumber,
                            itemId: selectedItem.id,
                            itemName: `${selectedItem.brand} ${selectedItem.name}`,
                            client: clientName,
                            collectedBy: collectedBy, // <<<--- NEW
                            quantity: quantity,
                            startDate: startDate,
                            operator: operator,
                            notes: notes,
                            status: "active",
                            dailyRate: selectedItem.dailyRate,
                            warehouse: warehouse
                        };

                        const itemRef = db.collection("inventory").doc(selectedItem.id);
                        const rentalCollectionRef = db.collection("activeRentals");

                        try {
                            console.log("5. Starting Firestore transaction...");
                            await db.runTransaction(async (transaction) => {
                                console.log("   -> Inside transaction");
                                const itemDoc = await transaction.get(itemRef);
                                if (!itemDoc.exists) { throw "Articolo non trovato durante la transazione."; }
                                console.log("   -> Item refetched in transaction");
                                const currentAvail = itemDoc.data().availableQuantity;
                                if (currentAvail < quantity) { throw `Disponibilità cambiata per ${itemDoc.data().name}. Disp: ${currentAvail}`; }
                                console.log("   -> Updating inventory in transaction...");
                                if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                                    transaction.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(-quantity) });
                                } else {
                                    throw "Errore tecnico: Firebase FieldValue non disponibile.";
                                }
                                console.log("   -> Setting new rental in transaction...");
                                transaction.set(rentalCollectionRef.doc(), rentalData);
                                console.log("   -> transaction.set called for activeRentals");
                            });
                            console.log("6. Transaction successful.");

                            await loadInventoryData();
                            await loadRentalData();
                            
                            ongoingRentalInfo = { rentalNumber: currentRentalNumber, operator: operator, client: clientName, warehouse: warehouse, startDate: startDate, collectedBy: collectedBy }; // <<<--- MODIFIED

                            console.log("7. Fetching rentals for receipt (from Firestore)...");
                            const rentalsSnapshot = await db.collection("activeRentals").where("rentalNumber", "==", currentRentalNumber).get();
                            const currentRentalItems = [];
                            rentalsSnapshot.forEach(doc => currentRentalItems.push({ id: doc.id, ...doc.data() }));
                            console.log("   -> Found items for receipt:", currentRentalItems.length);
                            printSingleRentalReceipt(currentRentalItems);

                            if (confirm(`Noleggio #${currentRentalNumber} per ${clientName}\nArticolo "${rentalData.itemName}" aggiunto.\n\nVuoi aggiungere un altro articolo allo stesso noleggio?`)) {
                                prepareModalForAdditionalItem(ongoingRentalInfo);
                            } else {
                                resetOngoingRentalState();
                                closeModal(rentalModal);
                            }

                        } catch (err) {
                            console.error("Transaction/Operation failed: ", err);
                            showError("Errore DB durante creazione noleggio: " + (err.message || err));
                            resetOngoingRentalState();
                        }
                    }).catch(err => {
                        console.error("Error getting item details (initial get):", err);
                        showError("Errore recupero dettagli articolo.");
                        resetOngoingRentalState();
                    });
                } catch (err) {
                    console.error("Error in rentalForm submit setup:", err);
                    showError("Errore imprevisto nel form.");
                    resetOngoingRentalState();
                }
            });
        }

        if (activeRentalsTableBody) {
            activeRentalsTableBody.addEventListener('click', async (e) => {
                console.log("Click detected on active rentals table body.");
                if (!db) { showError("Firestore non inizializzato."); return; }
                const target = e.target.closest('button'); if (!target) { return; }
                const rentalDocId = target.dataset.id;
                if (!rentalDocId) { console.warn("Button clicked but no data-id found:", target); return; }
                console.log(`Rental table button clicked: ${target.className.match(/btn-[\w-]+/)?.[0]}, ID: ${rentalDocId}`);

                // Complete Rental (ALL authenticated users)
                if (target.classList.contains('btn-complete-rental')) {
                     console.log(`Attempting complete for rental: ${rentalDocId}`);
                     try {
                        const activeRentalRef = db.collection("activeRentals").doc(rentalDocId); const rentalDoc = await activeRentalRef.get(); if (!rentalDoc.exists) { showError("Noleggio non trovato."); loadRentalData(); return; } const rentalToComplete = { id: rentalDoc.id, ...rentalDoc.data() }; const today = new Date().toISOString().split('T')[0]; const endDate = prompt(`Data fine noleggio per #${rentalToComplete.rentalNumber} (${rentalToComplete.itemName}) (AAAA-MM-GG):`, today); if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) { const startDateObj = new Date(rentalToComplete.startDate + 'T00:00:00Z'); const endDateObj = new Date(endDate + 'T00:00:00Z'); if (endDateObj < startDateObj) { showError("Data fine non può precedere data inizio."); return; } const completedRentalData = { ...rentalToComplete, endDate: endDate, status: "completed" }; delete completedRentalData.id; const itemRef = db.collection("inventory").doc(rentalToComplete.itemId); const batch = db.batch(); batch.set(db.collection("completedRentals").doc(), completedRentalData); batch.delete(activeRentalRef); if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) { batch.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(rentalToComplete.quantity) }); } else { throw "Errore tecnico: FieldValue non disponibile."; } await batch.commit(); console.log("Rental moved to completed."); loadInventoryData(); loadRentalData(); } else if (endDate !== null) { showError("Formato data non valido (AAAA-MM-GG)."); }
                     } catch (err) { console.error("Error completing rental:", err); showError("Errore completamento noleggio: " + err.message); }
                }
                // Edit Rental (ALL authenticated users)
                else if (target.classList.contains('btn-edit-rental')) {
                     console.log(`Edit rental button clicked for: ${rentalDocId}`);
                     try {
                         const rentalRef = db.collection("activeRentals").doc(rentalDocId); const rentalDoc = await rentalRef.get(); if (!rentalDoc.exists) { showError("Noleggio non trovato."); loadRentalData(); return; } const rentalToEdit = { id: rentalDoc.id, ...rentalDoc.data() }; if (editRentalModal && editRentalForm) { getElement('edit-rental-id').value = rentalToEdit.id; getElement('edit-rental-original-item-id').value = rentalToEdit.itemId; getElement('edit-rental-original-quantity').value = rentalToEdit.quantity; getElement('edit-rental-number-display').value = rentalToEdit.rentalNumber || 'N/A'; getElement('edit-rental-warehouse-display').value = rentalToEdit.warehouse || 'N/D'; getElement('edit-rental-startdate-display').value = formatDate(rentalToEdit.startDate); getElement('edit-rental-client-name').value = rentalToEdit.client; populateOperatorDropdown(getElement('edit-rental-operator')); getElement('edit-rental-operator').value = rentalToEdit.operator || ""; getElement('edit-rental-notes').value = rentalToEdit.notes || ""; const inventorySnapshot = await db.collection("inventory").get(); const inventoryForEdit = []; inventorySnapshot.forEach(doc => inventoryForEdit.push({id: doc.id, ...doc.data()})); const originalItemDetails = inventoryForEdit.find(i => i.id === rentalToEdit.itemId); updateBrandFilters(inventoryForEdit, getElement('edit-rental-brand-selection'), getElement('edit-rental-item-selection'), getElement('edit-quantity-available-info'), getElement('edit-rental-quantity'), rentalToEdit.itemId, rentalToEdit.quantity); if (originalItemDetails) { getElement('edit-rental-brand-selection').value = originalItemDetails.brand; await populateItemDropdown(originalItemDetails.brand, getElement('edit-rental-item-selection'), getElement('edit-quantity-available-info'), getElement('edit-rental-quantity'), rentalToEdit.itemId, rentalToEdit.quantity); getElement('edit-rental-item-selection').value = rentalToEdit.itemId; } getElement('edit-rental-quantity').value = rentalToEdit.quantity; setTimeout(() => { const editItemSel = getElement('edit-rental-item-selection'); if (editItemSel && editItemSel.value) { if (Array.from(editItemSel.options).some(opt => opt.value === rentalToEdit.itemId)) { editItemSel.value = rentalToEdit.itemId; } editItemSel.dispatchEvent(new Event('change')); } }, 100); openModal('edit-rental-modal'); } else { showError("Errore apertura modulo modifica."); }
                     } catch (err) { console.error("Error preparing rental edit:", err); showError("Errore caricamento dati per modifica noleggio: " + err.message); }
                }
                // Reprint Rental (ALL authenticated users)
                else if (target.classList.contains('btn-reprint-rental')) {
                     console.log(`Reprint rental button clicked for: ${rentalDocId}`);
                     try {
                         const rentalRef = db.collection("activeRentals").doc(rentalDocId); const rentalDoc = await rentalRef.get(); if (!rentalDoc.exists) { showError("Noleggio non trovato."); loadRentalData(); return; } const rentalToPrint = { id: rentalDoc.id, ...rentalDoc.data() }; const rentalsSnapshot = await db.collection("activeRentals").where("rentalNumber", "==", rentalToPrint.rentalNumber).get(); const allItemsForRental = []; rentalsSnapshot.forEach(doc => allItemsForRental.push({id: doc.id, ...doc.data()})); if(allItemsForRental.length > 0) { printSingleRentalReceipt(allItemsForRental); } else { showError("Nessun articolo trovato per questo numero di noleggio."); }
                     } catch (err) { console.error("Error fetching rentals for reprint:", err); showError("Errore recupero dati per ristampa: " + err.message); }
                }
                // Delete Rental Row (Admin Only)
                else if (target.classList.contains('btn-delete-rental')) {
                     if (!isAdmin()) { showError("Azione non consentita. Privilegi di amministratore richiesti."); return; }
                     console.log(`Attempting delete for rental: ${rentalDocId}`);
                     const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                     try {
                        const rentalDoc = await rentalRef.get(); if (!rentalDoc.exists) { showError("Riga noleggio già eliminata."); loadRentalData(); return; } const rentalToDelete = { id: rentalDoc.id, ...rentalDoc.data() }; if (confirm(`Annullare riga?\nArticolo: ${rentalToDelete.itemName} (Q: ${rentalToDelete.quantity})\nNoleggio #: ${rentalToDelete.rentalNumber}\n\nL'articolo tornerà disponibile.`)) { const itemRef = db.collection("inventory").doc(rentalToDelete.itemId); const batch = db.batch(); if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) { batch.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(rentalToDelete.quantity) }); } else { throw "Errore tecnico: FieldValue non disponibile."; } batch.delete(rentalRef); await batch.commit(); console.log("Rental row deleted."); loadInventoryData(); loadRentalData(); }
                     } catch (err) { console.error("Error deleting rental row:", err); showError("Errore annullamento riga noleggio: " + err.message); }
                }
            });
        }

        // Edit Rental Modal Interactions
        if (editRentalBrandSelection) { editRentalBrandSelection.addEventListener('change', (e) => { const id = getElement('edit-rental-original-item-id').value; const qty = parseInt(getElement('edit-rental-original-quantity').value)||0; populateItemDropdown(e.target.value, getElement('edit-rental-item-selection'), getElement('edit-quantity-available-info'), getElement('edit-rental-quantity'), id, qty); }); }
        if (editRentalItemSelection) { editRentalItemSelection.addEventListener('change', (e) => { const selectedOption = e.target.options[e.target.selectedIndex]; const maxQuantity = selectedOption?.dataset.max ? parseInt(selectedOption.dataset.max) : 0; const qtyInput = getElement('edit-rental-quantity'); const infoEl = getElement('edit-quantity-available-info'); if (qtyInput) { qtyInput.max = maxQuantity > 0 ? maxQuantity : null; qtyInput.value = 1; /* Reset to 1 when item changes */ if (infoEl) { infoEl.textContent = `Disponibili (incl. originale se stesso articolo): ${maxQuantity}`; infoEl.style.display = 'block'; } } else if (infoEl) { infoEl.style.display = 'none'; } }); }
        if (editRentalQuantityInput) { editRentalQuantityInput.addEventListener('input', (e) => { const max = parseInt(e.target.max); const currentVal = parseInt(e.target.value); if (!isNaN(max) && !isNaN(currentVal) && currentVal > max) { e.target.value = max; showError(`Quantità massima disponibile (incl. originale se stesso articolo): ${max}`); } if (!isNaN(currentVal) && currentVal < 1) { e.target.value = 1; } }); }
        if (editRentalForm) { // Form for editing rental line (available to all authenticated)
            editRentalForm.addEventListener('submit', async (e) => {
                console.log("Edit rental form submitted.");
                e.preventDefault();
                try {
                    const rentalDocId = getElement('edit-rental-id').value; const originalItemId = getElement('edit-rental-original-item-id').value; const originalQuantity = parseInt(getElement('edit-rental-original-quantity').value) || 0; const newClientName = getElement('edit-rental-client-name').value.trim().toUpperCase(); const newOperator = getElement('edit-rental-operator').value; const newItemId = getElement('edit-rental-item-selection').value; const newQuantity = getElement('edit-rental-quantity') ? parseInt(getElement('edit-rental-quantity').value) : 0; const newNotes = getElement('edit-rental-notes').value.trim().toUpperCase(); if (!rentalDocId || !newClientName || !newOperator || !newItemId || isNaN(newQuantity) || newQuantity < 1) { showError("Cliente, Operatore, Articolo e Quantità obbligatori."); return; } if (!db) throw new Error("Firestore non inizializzato."); const rentalRef = db.collection("activeRentals").doc(rentalDocId); const newItemRef = db.collection("inventory").doc(newItemId); const originalItemRef = db.collection("inventory").doc(originalItemId); await db.runTransaction(async (transaction) => { const rentalDoc = await transaction.get(rentalRef); if (!rentalDoc.exists) throw "Noleggio originale non trovato."; const originalRentalData = rentalDoc.data(); const newItemDoc = await transaction.get(newItemRef); if (!newItemDoc.exists) throw "Nuovo articolo non trovato."; const newItemData = newItemDoc.data(); let originalItemCurrentStock = 0; let originalItemDoc; if (originalItemId === newItemId) { originalItemDoc = newItemDoc; originalItemCurrentStock = newItemData.availableQuantity; } else { originalItemDoc = await transaction.get(originalItemRef); if (!originalItemDoc.exists) throw "Articolo inventario originale non trovato."; originalItemCurrentStock = originalItemDoc.data().availableQuantity; } const maxAllowed = newItemData.availableQuantity + (originalItemId === newItemId ? originalQuantity : 0); if (newQuantity > maxAllowed) { throw `Quantità non disponibile per "${newItemData.name}". Max: ${maxAllowed}. Richiesti: ${newQuantity}.`; } if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.firestore.FieldValue) { throw "Errore tecnico: Firebase FieldValue non disponibile." } if (originalItemId !== newItemId) { transaction.update(originalItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(originalQuantity) }); transaction.update(newItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(-newQuantity) }); } else { transaction.update(newItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(originalQuantity - newQuantity) }); } transaction.update(rentalRef, { itemId: newItemId, itemName: `${newItemData.brand} ${newItemData.name}`, quantity: newQuantity, dailyRate: newItemData.dailyRate, client: newClientName, operator: newOperator, notes: newNotes }); }); console.log("Rental updated."); loadInventoryData(); loadRentalData(); closeModal(editRentalModal); alert("Modifiche noleggio salvate.");
                } catch(err) { console.error("Error saving rental edits:", err); showError("Errore salvataggio modifiche noleggio: " + err); }
            });
        }

        // --- Print/History Actions ---
        if (printRentalsBtn) { // Available to all authenticated users
            printRentalsBtn.addEventListener('click', async function () {
                console.log("Print history clicked.");
                try {
                    const selectedMonth = printMonthSelect ? parseInt(printMonthSelect.value) : 0;
                    const selectedYear = printYearInput ? parseInt(printYearInput.value) : 0;
                    if (isNaN(selectedYear) || selectedYear < 1900 || selectedYear > 2100) { showError("Anno non valido."); printYearInput?.focus(); return; }
                    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) { showError("Mese non valido."); printMonthSelect?.focus(); return; }
                    if (!db) throw new Error("Firestore non inizializzato.");
                    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
                    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 1));
                    const startDateString = startDate.toISOString().split('T')[0];
                    const endDateString = endDate.toISOString().split('T')[0];
                    const snapshot = await db.collection("completedRentals").where("endDate", ">=", startDateString).where("endDate", "<", endDateString).orderBy("endDate").orderBy("rentalNumber").get();
                    const filteredRentals = []; snapshot.forEach(doc => filteredRentals.push({ id: doc.id, ...doc.data() }));
                    if (filteredRentals.length === 0) { showError(`Nessun noleggio completato per ${printMonthSelect?.options[printMonthSelect.selectedIndex]?.text || 'mese'} ${selectedYear}.`); return; }
                    const clientRentals = filteredRentals.reduce((acc, rental) => { const clientKey = rental.client || "Cliente Sconosciuto"; if (!acc[clientKey]) acc[clientKey] = []; rental.dailyRate = rental.dailyRate ?? 0; rental.quantity = rental.quantity ?? 1; rental.warehouse = rental.warehouse || 'N/D'; rental.operator = rental.operator || 'N/D'; rental.itemId = rental.itemId || null; acc[clientKey].push(rental); return acc; }, {});
                    const sortedClients = Object.keys(clientRentals).sort((a, b) => a.localeCompare(b));
                    const monthName = printMonthSelect?.options[printMonthSelect.selectedIndex]?.text || `Mese ${selectedMonth}`;
                    let printHtml = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Stampa Noleggi - ${monthName} ${selectedYear}</title><style>body { font-family: Arial, sans-serif; font-size: 9pt; margin: 15mm; } .print-page-header { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; } .print-page-header img { max-height: 50px; width: auto; flex-shrink: 0; } .print-page-header h1 { margin: 0; font-size: 14pt; text-align: left; flex-grow: 1; } h2 { font-size: 12pt; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; page-break-before: avoid; page-break-after: avoid; } table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 15px; font-size: 8pt; page-break-inside: auto; border: 1px solid #ccc; } th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; vertical-align: top; word-wrap: break-word; } th { background-color: #e9e9e9; font-weight: bold; white-space: nowrap; } tbody tr:nth-child(odd) { background-color: #f9f9f9; } tbody tr:hover { background-color: #f1f1f1; } .text-right { text-align: right; } .text-center { text-align: center; } .total-row td { font-weight: bold; border-top: 2px solid #aaa; background-color: #f0f0f0; } .print-info { text-align: center; font-size: 8pt; color: #666; margin-bottom: 15px; } tr { page-break-inside: avoid; page-break-after: auto; } thead { display: table-header-group; } @page { size: A4; margin: 15mm; } @media print { body { margin: 10mm; font-size: 9pt; } h2 { page-break-before: auto; } button { display: none; } }</style></head><body><div class="print-page-header"><img src="${LOGO_URL}" alt="Logo CAI Idraulica"><h1>Riepilogo Noleggi Completati - ${monthName} ${selectedYear}</h1></div><div class="print-info">Generato il: ${new Date().toLocaleString('it-IT')}</div>`;
                    sortedClients.forEach(client => { printHtml += `<h2>Cliente: ${escapeHtml(client)}</h2><table><colgroup><col style="width: 7%;"><col style="width: 24%;"><col style="width: 9%;"><col style="width: 9%;"><col style="width: 5%; text-align: center;"><col style="width: 9%; text-align: right;"><col style="width: 9%;"><col style="width: 9%;"><col style="width: 6%; text-align: center;"><col style="width: 9%; text-align: right;"><col style="width: auto;"></colgroup><thead><tr><th># Nol.</th><th>Articolo Noleggiato</th><th>Mag. Orig.</th><th>Operatore</th><th class="text-center">Q.tà</th><th class="text-right">€/Giorn.</th><th>Inizio</th><th>Fine</th><th class="text-center">GG Tot.</th><th class="text-right">€ Tot.</th><th>Note</th></tr></thead><tbody>`; let clientTotal = 0; const rentalsForClient = clientRentals[client];
                        rentalsForClient.forEach(rental => {
                            const days = getDaysDifference(rental.startDate, rental.endDate);
                            const isSpecialItem = SPECIAL_ITEM_IDS.includes(rental.itemId);
                            let totalCost = 0;
                            if (isSpecialItem) {
                                if (days === 1) { totalCost = SPECIAL_ITEM_SAME_DAY_PRICE; }
                                else if (days > 1) { totalCost = SPECIAL_ITEM_SAME_DAY_PRICE + (SPECIAL_ITEM_EXTRA_DAY_PRICE * (days - 1)); }
                            } else {
                                totalCost = (rental.dailyRate || 0) * (rental.quantity || 1) * days;
                                // CORREZIONE PREZZO GIORNO SINGOLO: Precedentemente, se days === 1, totalCost diventava 0.
                                // Se il costo del noleggio di un solo giorno per item non speciali è uguale al dailyRate, allora questa è la correzione.
                                // Se è 0, si può ripristinare il blocco if (days ===1 ) { totalCost = 0; }
                            }
                            clientTotal += totalCost;
                            printHtml += `<tr><td>${escapeHtml(rental.rentalNumber || 'N/A')}</td><td>${escapeHtml(rental.itemName)}</td><td>${escapeHtml(rental.warehouse)}</td><td>${escapeHtml(rental.operator)}</td><td class="text-center">${rental.quantity}</td><td class="text-right">${isSpecialItem ? 'Spec.' : formatPrice(rental.dailyRate)}</td><td>${formatDate(rental.startDate)}</td><td>${formatDate(rental.endDate)}</td><td class="text-center">${days}</td><td class="text-right">${formatPrice(totalCost)}</td><td>${escapeHtml(rental.notes || '')}</td></tr>`; });
                         printHtml += `<tr class="total-row"><td colspan="9" class="text-right">Totale Cliente (${escapeHtml(client)}):</td><td class="text-right">${formatPrice(clientTotal)}</td><td></td></tr></tbody></table>`; });
                    printHtml += `<script>window.onload=function(){ try { window.print(); } catch(e) { console.error('Print failed:', e); } };<\/script></body></html>`;
                    const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(printHtml); printWindow.document.close(); } else { showError("Impossibile aprire finestra stampa."); }
                } catch (err) { console.error("Error printing history:", err); showError("Errore preparazione stampa storico."); }
            });
        }
        if (resetCompletedBtn) {
            resetCompletedBtn.addEventListener('click', async function () {
                console.log("Reset history clicked.");
                if (!isAdmin()) { showError("Azione non consentita. Privilegi di amministratore richiesti."); return; }
                try {
                    if (confirm("Eliminare TUTTO lo storico noleggi completati dal database? Azione irreversibile.")) { try { if (!db) throw new Error("Firestore non inizializzato."); const snapshot = await db.collection("completedRentals").get(); if (snapshot.empty) { alert("Lo storico è già vuoto."); return; } const batch = db.batch(); snapshot.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); updateBillingStats(); alert("Storico resettato dal database."); } catch(err) { console.error("Error resetting completed rentals:", err); showError("Errore durante il reset dello storico."); } }
                } catch (err) { console.error("Reset history error:", err); }
             });
        }
        console.log("Noleggi App: Event listeners attached successfully.");

    }; // End of setupEventListeners


    // --- Authentication UI Setup (REMOVED) ---
    // const setupAuthUI = () => { ... }; // This entire function is removed.

    // Attach General Event Listeners when DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        // setupAuthUI(); // Call to setupAuthUI is removed
        setupEventListeners(); // Attach the main app listeners once
    });

    // Make initializeApp globally accessible for the onAuthStateChanged listener in code.html
    window.initializeApp = initializeApp;
    // Expose data loading functions if needed by other parts or for debugging
    window.loadInventoryData = loadInventoryData;
    window.loadRentalData = loadRentalData;

})(); // End IIFE
