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
            activeRentalsTableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="font-style:italic;">Nessun noleggio attivo.</td></tr>';
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
            tr.innerHTML = `<td>${escapeHtml(rental.rentalNumber || 'N/A')}</td><td>${escapeHtml(rental.itemName)} (${rental.quantity})</td><td>${escapeHtml(rental.client)}</td><td>${escapeHtml(rental.warehouse || 'N/D')}</td><td>${formatDate(rental.startDate)}</td><td><span class="badge badge-warning">Attivo</span></td>${actionsHtml}`;
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

    // --- References to DOM Elements ---
    const getElement = (id) => document.getElementById(id);
    const querySel = (selector) => document.querySelector(selector);

    const inventoryTableBody = querySel('#inventory-table tbody');
    const activeRentalsTableBody = querySel('#active-rentals-table tbody');
    const inventorySearchInput = getElement('inventory-search');
    const filterBrandSelect = getElement('filter-brand');
    const filterStatusSelect = getElement('filter-status');
    
    // New Item Modal
    const newItemBtn = getElement('new-item-btn');
    const newItemModal = getElement('new-item-modal');
    const newItemForm = getElement('new-item-form');
    
    // Edit Item Modal
    const editItemModal = getElement('edit-item-modal');
    const editItemForm = getElement('edit-item-form');

    // New/Add Rental Modal
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

    // Edit Rental Modal
    const editRentalModal = getElement('edit-rental-modal');
    const editRentalForm = getElement('edit-rental-form');
    const editRentalBrandSelection = getElement('edit-rental-brand-selection');
    const editRentalItemSelection = getElement('edit-rental-item-selection');
    const editRentalQuantityInput = getElement('edit-rental-quantity');
    const editQuantityAvailableInfo = getElement('edit-quantity-available-info');
    
    // Other Buttons & Inputs
    const allModals = document.querySelectorAll('.modal');
    const exportInventoryBtn = getElement('export-inventory-btn');
    const resetInventoryBtn = getElement('reset-inventory');
    const excelUploadInput = getElement('excel-upload');
    const printRentalsBtn = getElement('print-rentals-btn');
    const printMonthSelect = getElement('print-month');
    const printYearInput = getElement('print-year');
    const resetCompletedBtn = getElement('reset-completed-btn');

    // --- General Listeners ---
    allModals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modal));
        } else {
            console.warn(`Close button not found for modal: #${modal.id}`);
        }
    });
    window.addEventListener('click', (event) => {
        allModals.forEach(modal => {
            if (event.target == modal) closeModal(modal);
        });
    });

    // --- Inventory Actions ---

    if (inventorySearchInput) inventorySearchInput.addEventListener('input', () => loadInventoryData());
    if (filterBrandSelect) filterBrandSelect.addEventListener('change', () => loadInventoryData());
    if (filterStatusSelect) filterStatusSelect.addEventListener('change', () => loadInventoryData());

    // Listener for "Nuovo Articolo" BUTTON
    if (newItemBtn) {
        newItemBtn.addEventListener('click', () => {
            console.log("New item button clicked.");
            if (newItemForm) newItemForm.reset();
            openModal('new-item-modal');
            getElement('new-item-brand')?.focus();
        });
    }

    // Listener for "Nuovo Articolo" FORM SUBMIT
    if (newItemForm) {
        newItemForm.addEventListener('submit', async (e) => {
            console.log("New item form submitted.");
            e.preventDefault();
            try {
                const brand = getElement('new-item-brand')?.value.trim();
                const name = getElement('new-item-name')?.value.trim();
                const quantity = parseInt(getElement('new-item-quantity')?.value);
                const dailyRate = parseFloat(getElement('new-item-daily-rate')?.value);

                if (!brand || !name || isNaN(quantity) || quantity < 0 || isNaN(dailyRate) || dailyRate < 0) {
                    showError('Compila correttamente tutti i campi.');
                    return;
                }

                const newItemData = {
                    brand, name, totalQuantity: quantity, availableQuantity: quantity,
                    dailyRate, marcaLower: brand.toLowerCase(), nomeLower: name.toLowerCase()
                };

                if (!db) throw new Error("Firestore non inizializzato.");

                const docRef = await db.collection("inventory").add(newItemData);
                console.log("New item added to Firestore with ID:", docRef.id);

                const sheetData = { id: docRef.id, brand, name, totalQuantity: quantity, dailyRate };
                fetch('/.netlify/functions/addNewItemToSheet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sheetData)
                })
                .then(response => !response.ok ? response.json().then(err => Promise.reject(err)) : response.json())
                .then(result => console.log("Netlify Function success:", result.message))
                .catch(error => {
                    console.error("Errore chiamata Netlify Function:", error);
                    alert(`ATTENZIONE: Articolo creato ma non sincronizzato su Google Fogli. Errore: ${error.message || 'Sconosciuto'}`);
                });

                loadInventoryData();
                closeModal(newItemModal);
                newItemForm.reset();
            } catch (err) {
                console.error("Error adding new item to Firestore:", err);
                showError("Errore durante l'aggiunta del nuovo articolo.");
            }
        });
    }

    // Listener for INVENTORY TABLE clicks (Edit and Delete)
    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('click', async (e) => { // <-- ASYNC è qui, corretto
            const editButton = e.target.closest('.btn-edit-item');
            const deleteButton = e.target.closest('.btn-delete-item');

            if (editButton) {
                const itemId = editButton.dataset.id;
                console.log(`Edit item button clicked for: ${itemId}`);
                try {
                    if (!db) return showError("Firestore non inizializzato.");
                    const docRef = db.collection("inventory").doc(itemId);
                    const docSnap = await docRef.get();
                    if (docSnap.exists) {
                        const itemToEdit = { id: docSnap.id, ...docSnap.data() };
                        if (editItemModal && editItemForm) {
                            getElement('edit-item-id').value = itemToEdit.id;
                            getElement('edit-item-brand').value = itemToEdit.brand;
                            // ... (resto del codice per popolare il form di modifica)
                            openModal('edit-item-modal');
                        } else { showError("Errore apertura modal modifica."); }
                    } else { showError("Articolo non trovato."); loadInventoryData(); }
                } catch (err) { console.error("Error fetching item for edit:", err); showError("Errore recupero dati articolo."); }
            } 
            else if (deleteButton) {
                const itemId = deleteButton.dataset.id;
                console.log(`Attempting delete for item: ${itemId}`);
                if (!isAdmin()) return showError("Azione non consentita.");
                try {
                    if (!db) return showError("Firestore non inizializzato.");
                    const itemRef = db.collection("inventory").doc(itemId);
                    const docSnap = await itemRef.get();
                    if (!docSnap.exists) return showError("Articolo già eliminato.");
                    
                    // ... (codice per controllare se l'item è noleggiato)

                    if (confirm(`Eliminare l'articolo "${docSnap.data().name}"?`)) {
                        await itemRef.delete();
                        console.log("Item deleted from Firestore:", itemId);
                        
                        // Chiama la funzione Netlify per cancellare dal foglio
                        fetch('/.netlify/functions/deleteItemFromSheet', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idToDelete: itemId })
                        })
                        .then(response => response.json())
                        .then(result => console.log("Funzione cancellazione foglio:", result.message))
                        .catch(err => alert("ATTENZIONE: Articolo cancellato dall'app ma non da Google Fogli."));
                        
                        loadInventoryData();
                    }
                } catch (err) { console.error("Error deleting item:", err); showError("Errore eliminazione articolo."); }
            }
        });
    }
    
    // Listener for EDIT ITEM FORM SUBMIT
    if (editItemForm) {
        // ... (il tuo codice per il submit del form di modifica va qui)
    }

    // --- Rental Actions ---
    // ... (tutto il resto del codice per i noleggi rimane qui)

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
