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
    const SPECIAL_ITEM_IDS = ['TAnSRPuHwm64QoZCzBe0', 'bsQV3qBAgCBXvkGJHHPK', '53']; // Example IDs
    const SPECIAL_ITEM_SAME_DAY_PRICE = 15.00;
    const SPECIAL_ITEM_EXTRA_DAY_PRICE = 25.00;

    let ongoingRentalInfo = null;
    window.appInitialized = false;
    // window.currentUserRole is set by the onAuthStateChanged listener in code.html

    // --- Firebase References (expected to be initialized in code.html) ---
    const db = window.db;
    const auth = window.auth;

    // --- Utility Functions ---
    const escapeHtml = (unsafe) => { if (typeof unsafe !== 'string') unsafe = String(unsafe); return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/'/g, "'"); };
    const formatPrice = (value) => { const number = parseFloat(value); return isNaN(number) ? 'N/D' : number.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { const parts = dateString.split('-'); if (parts.length !== 3) return dateString; const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); if (isNaN(date.getTime())) return 'Data non valida'; return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date); } catch (e) { console.error("Errore formattazione data:", dateString, e); return 'Errore data'; } };
    const getDaysDifference = (startDate, endDate) => { if (!startDate || !endDate) return 1; try { const start = new Date(startDate + 'T00:00:00Z'); const end = new Date(endDate + 'T00:00:00Z'); if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1; const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()); if (endUTC < startUTC) return 1; const diffTime = endUTC - startUTC; return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; } catch (e) { console.error("Error calculating date difference:", startDate, endDate, e); return 1; } };
    const getDaysElapsed = (startDateString) => { if (!startDateString) return 0; try { const startDate = new Date(startDateString + 'T00:00:00Z'); if (isNaN(startDate.getTime())) return 0; const today = new Date(); const todayUTCStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()); const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()); const diffTime = todayUTCStart - startUTC; return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))); } catch (e) { console.error("Error calculating days elapsed:", startDateString, e); return 0; } };
    const showError = (message) => { console.error("SHOW_ERROR (Noleggi):", message); alert(`[ERRORE - NOLEGGI] ${message}`); };

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
            if (!err.message?.includes('permission')) { showError("Errore aggiornamento statistiche fatturazione: " + err.message); }
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
        if (!itemSelectElement) return;
        itemSelectElement.innerHTML = '';
        itemSelectElement.disabled = true;
        if (availableInfoElement) availableInfoElement.style.display = 'none';
        if (quantityInputElement) { quantityInputElement.value = 1; quantityInputElement.max = null; }
        if (!selectedBrand) { itemSelectElement.innerHTML = '<option value="">-- Seleziona Marca Prima --</option>'; return; }
        if (!db) { showError("Errore: Database non disponibile."); itemSelectElement.innerHTML = `<option value="" disabled>Errore Database</option>`; return; }
        try {
            const snapshot = await db.collection("inventory").where("brand", "==", selectedBrand).get();
            const inventoryItems = []; snapshot.forEach(doc => inventoryItems.push({ firestoreDocId: doc.id, ...doc.data() }));
            const itemsOfBrand = inventoryItems.filter(item => (item.availableQuantity > 0 || item.firestoreDocId === currentItemId));
            if (itemsOfBrand.length === 0) { itemSelectElement.innerHTML = `<option value="" disabled>Nessun articolo ${currentItemId ? '' : 'disponibile '}per ${escapeHtml(selectedBrand)}</option>`; return; }
            itemSelectElement.innerHTML = '<option value="">-- Seleziona Articolo --</option>';
            itemsOfBrand.forEach(item => {
                const option = document.createElement('option');
                option.value = item.firestoreDocId;
                let maxForThisItem = item.availableQuantity + (item.firestoreDocId === currentItemId ? currentItemQuantity : 0);
                option.dataset.max = maxForThisItem;
                option.textContent = `${escapeHtml(item.name)} (${item.availableQuantity} disp.)`;
                itemSelectElement.appendChild(option);
            });
            if (currentItemId && itemsOfBrand.some(item => item.firestoreDocId === currentItemId)) {
                itemSelectElement.value = currentItemId;
            }
            itemSelectElement.disabled = false;
            if (itemSelectElement.value) {
                itemSelectElement.dispatchEvent(new Event('change'));
            } else if (quantityInputElement) {
                if (availableInfoElement) availableInfoElement.style.display = 'none';
                quantityInputElement.max = null;
            }
        } catch (error) {
            console.error("Error getting items by brand from Firestore: ", error);
            showError("Errore nel caricare gli articoli per la marca selezionata.");
            itemSelectElement.innerHTML = `<option value="" disabled>Errore caricamento articoli</option>`;
        }
    };
    const updateBrandFilters = (inventory, brandSelectElement, itemSelectElement = null, availableInfoElement = null, quantityInputElement = null, currentItemId = null, currentItemQuantity = 0) => {
        const brands = [...new Set(inventory.map(item => item.brand))].sort();
        if (brandSelectElement) {
            const currentValue = brandSelectElement.value;
            brandSelectElement.innerHTML = '<option value="">Tutte le marche</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = escapeHtml(brand);
                brandSelectElement.appendChild(option);
            });
            if (currentValue && brands.includes(currentValue)) {
                brandSelectElement.value = currentValue;
            } else {
                if (itemSelectElement) { populateItemDropdown(null, itemSelectElement, availableInfoElement, quantityInputElement, currentItemId, currentItemQuantity); }
            }
        }
        if (itemSelectElement) {
            populateItemDropdown(brandSelectElement ? brandSelectElement.value : null, itemSelectElement, availableInfoElement, quantityInputElement, currentItemId, currentItemQuantity);
        }
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
            if (!error.message?.includes('permission')) {
                 showError("Errore nel caricamento dell'inventario dal database.");
            }
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
        if (uniqueOldestRentals.length === 0) {
            oldestRentalsList.innerHTML = `<li>Nessun noleggio attivo da ${MIN_DAYS_FOR_ATTENTION} o più giorni.</li>`;
            return;
        }
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
        let activeRentals = [];
        await updateBillingStats();
        await updateRentalStats([]);
        if (!db) { console.warn("DB not ready for loadRentalData"); return; }
        try {
            const rentalsCollection = db.collection("activeRentals");
            const snapshot = await rentalsCollection.orderBy("startDate", "desc").get();
            snapshot.forEach(doc => { activeRentals.push({ id: doc.id, ...doc.data() }); });
            console.log(`Loaded ${activeRentals.length} active rentals from Firestore.`);
        } catch (error) {
            console.error("Error loading active rentals from Firestore:", error);
            if (!error.message?.includes('permission')) {
                 showError("Errore nel caricamento dei noleggi attivi dal database.");
            }
        } finally {
             renderActiveRentalsTable(activeRentals);
             renderOldestRentals(activeRentals);
             updateRentalStats(activeRentals);
        }
    };
    const populateOperatorDropdown = (selectElement) => { if (!selectElement) return; const currentValue = selectElement.value; selectElement.innerHTML = '<option value="">-- Seleziona Operatore --</option>'; const sortedOperators = [...OPERATORS].sort((a, b) => a.localeCompare(b)); sortedOperators.forEach(opName => { const option = document.createElement('option'); option.value = opName; option.textContent = opName; selectElement.appendChild(option); }); if (currentValue && sortedOperators.includes(currentValue)) { selectElement.value = currentValue; } };
    const populateRentalBrandDropdown = async () => {
        const rentalBrandSelect = document.getElementById('rental-brand-selection');
        const rentalItemSelect = document.getElementById('rental-item-selection');
        const quantityAvailableInfo = document.getElementById('quantity-available-info');
        const rentalQuantityInput = document.getElementById('rental-quantity');
        if (!db) { console.warn("DB not ready for populateRentalBrandDropdown"); return; }
        try {
            const snapshot = await db.collection("inventory").get();
            const inventory = [];
            snapshot.forEach(doc => inventory.push({ id: doc.id, ...doc.data() }));
            updateBrandFilters(inventory, rentalBrandSelect, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput);
        } catch (err) {
            console.error("Errore lettura inventario per popolare marche:", err);
            showError("Errore caricamento marche.");
            if (rentalBrandSelect) rentalBrandSelect.innerHTML = '<option value="">Errore</option>';
            if (rentalItemSelect) { rentalItemSelect.innerHTML = '<option value="">-- Errore --</option>'; rentalItemSelect.disabled = true; }
        }
    };
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
        window.appInitialized = true;
        
        const getElement = (id) => document.getElementById(id);
        const querySel = (selector) => document.querySelector(selector);
        const newItemBtn = getElement('new-item-btn');
        const exportInventoryBtn = getElement('export-inventory-btn');
        const resetInventoryBtn = getElement('reset-inventory');
        const excelUploadLabel = querySel('label[for="excel-upload"]');
        const resetCompletedBtn = getElement('reset-completed-btn');
        const rentalOperatorSelect = getElement('rental-operator');
        const editRentalOperatorSelect = getElement('edit-rental-operator');

        console.log("Noleggi App: Applying role-based UI visibility based on currentUserRole:", window.currentUserRole);
        const isAdminUser = isAdmin();

        if (newItemBtn) newItemBtn.style.display = 'inline-block';
        if (exportInventoryBtn) exportInventoryBtn.style.display = 'inline-block';
        if (resetInventoryBtn) resetInventoryBtn.style.display = isAdminUser ? 'inline-block' : 'none';
        if (excelUploadLabel) excelUploadLabel.style.display = isAdminUser ? 'inline-block' : 'none';
        if (resetCompletedBtn) resetCompletedBtn.style.display = isAdminUser ? 'inline-block' : 'none';
        
        console.log("Noleggi App: Performing initial data load...");
        try {
            if(rentalOperatorSelect) populateOperatorDropdown(rentalOperatorSelect);
            if(editRentalOperatorSelect) populateOperatorDropdown(editRentalOperatorSelect);
            await loadInventoryData();
            await loadRentalData();
            setDefaultPrintDate();
            console.log("Noleggi App: Application initialized successfully.");
        } catch (err) {
            console.error("Noleggi App: Error during initial data load:", err);
            if (!err.message?.includes('permission')) {
                 showError("Errore critico durante il caricamento dati: " + err.message);
            }
        }
    };

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
    const editRentalBrandSelection = getElement('edit-rental-brand-selection');
    const editRentalItemSelection = getElement('edit-rental-item-selection');
    const editRentalQuantityInput = getElement('edit-rental-quantity');
    const editQuantityAvailableInfo = getElement('edit-quantity-available-info');
    const allModals = document.querySelectorAll('.modal');
    const exportInventoryBtn = getElement('export-inventory-btn'); // Il bottone è già selezionato
    const resetInventoryBtn = getElement('reset-inventory');
    const excelUploadInput = getElement('excel-upload');
    const printRentalsBtn = getElement('print-rentals-btn');
    const printMonthSelect = getElement('print-month');
    const printYearInput = getElement('print-year');
    const resetCompletedBtn = getElement('reset-completed-btn');

    // --- Modal Listeners ---
    allModals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
    });
    window.addEventListener('click', (event) => {
        allModals.forEach(modal => { if (event.target == modal) closeModal(modal); });
    });

    // --- Inventory Filters ---
    if (inventorySearchInput) inventorySearchInput.addEventListener('input', () => loadInventoryData());
    if (filterBrandSelect) filterBrandSelect.addEventListener('change', () => loadInventoryData());
    if (filterStatusSelect) filterStatusSelect.addEventListener('change', () => loadInventoryData());

    // --- INIZIO CODICE AGGIUNTO PER ESPORTAZIONE INVENTARIO ---
    if (exportInventoryBtn) {
        exportInventoryBtn.addEventListener('click', async () => {
            console.log("Export inventory clicked.");
            try {
                // 1. Recupera tutti i dati dell'inventario da Firestore
                const snapshot = await db.collection("inventory").orderBy("brand").orderBy("name").get();
                if (snapshot.empty) {
                    alert("L'inventario è vuoto. Nessun dato da esportare.");
                    return;
                }
                
                // 2. Prepara i dati per il file Excel, mappando le chiavi con nomi più leggibili
                const inventoryData = snapshot.docs.map(doc => {
                    const item = doc.data();
                    return {
                        "Marca": item.brand,
                        "Articolo": item.name,
                        "Quantità Totale": item.totalQuantity,
                        "Quantità Disponibile": item.availableQuantity,
                        "Costo Giornaliero (€)": item.dailyRate
                    };
                });

                // 3. Usa la libreria XLSX per creare il file
                const worksheet = XLSX.utils.json_to_sheet(inventoryData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

                // 4. Avvia il download del file
                XLSX.writeFile(workbook, "Inventario_Noleggi_CAI.xlsx");

            } catch (err) {
                console.error("Error exporting inventory:", err);
                showError("Errore durante l'esportazione dell'inventario: " + err.message);
            }
        });
    }
    // --- FINE CODICE AGGIUNTO ---

    // --- Excel Upload ---
    if (excelUploadInput) {
        excelUploadInput.addEventListener('change', async function (e) {
            if (!isAdmin()) { showError("Azione non consentita."); excelUploadInput.value = ''; return; }
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = async function(event) {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (jsonData.length < 2) throw new Error("File Excel vuoto.");
                    const header = jsonData[0].map(h => String(h).trim().toLowerCase());
                    const requiredHeaders = ['marca', 'articolo', "quantita'", 'costo'];
                    if (requiredHeaders.some(h => header.indexOf(h) === -1)) {
                        throw new Error(`Intestazioni mancanti. Servono: ${requiredHeaders.join(', ')}`);
                    }
                    const newInventory = jsonData.slice(1).map(row => {
                        const item = {};
                        const keyMap = { 'marca': 'brand', 'articolo': 'name', "quantita'": 'totalQuantity', 'costo': 'dailyRate' };
                        header.forEach((h, index) => { if (keyMap[h]) item[keyMap[h]] = row[index]; });
                        item.totalQuantity = parseInt(item.totalQuantity, 10);
                        item.dailyRate = parseFloat(String(item.dailyRate).replace(',', '.'));
                        item.availableQuantity = item.totalQuantity;
                        return item;
                    }).filter(item => item.brand && item.name && !isNaN(item.totalQuantity) && !isNaN(item.dailyRate));
                    
                    if (newInventory.length === 0) throw new Error("Nessun articolo valido trovato nel file.");
                    
                    if (confirm(`Importare ${newInventory.length} articoli? L'inventario corrente verrà SOSTITUITO.`)) {
                        const batch = db.batch();
                        const currentInvSnapshot = await db.collection("inventory").get();
                        currentInvSnapshot.docs.forEach(doc => batch.delete(doc.ref));
                        newInventory.forEach(item => {
                            const docRef = db.collection("inventory").doc();
                            batch.set(docRef, item);
                        });
                        await batch.commit();
                        loadInventoryData();
                        alert("Inventario importato con successo.");
                    }
                } catch (err) { showError(`Errore importazione Excel: ${err.message}`); }
                finally { if (excelUploadInput) excelUploadInput.value = ''; }
            };
            reader.readAsArrayBuffer(file);
        });
    }
    
if (newItemBtn) {
        newItemBtn.addEventListener('click', () => {
            if (newItemForm) newItemForm.reset();
            openModal('new-item-modal');
            getElement('new-item-brand')?.focus();
        });
    }

    if (newItemForm) {
        newItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const brand = getElement('new-item-brand')?.value.trim();
                const name = getElement('new-item-name')?.value.trim();
                const quantity = parseInt(getElement('new-item-quantity')?.value);
                const dailyRate = parseFloat(getElement('new-item-daily-rate')?.value);
                if (!brand || !name || isNaN(quantity) || quantity < 0 || isNaN(dailyRate) || dailyRate < 0) {
                    return showError('Compila correttamente tutti i campi.');
                }
                const newItemData = {
                    brand, name, totalQuantity: quantity, availableQuantity: quantity,
                    dailyRate, marcaLower: brand.toLowerCase(), nomeLower: name.toLowerCase()
                };
                const docRef = await db.collection("inventory").add(newItemData);
                const sheetData = { id: docRef.id, brand, name, totalQuantity: quantity, dailyRate };
                fetch('/.netlify/functions/addNewItemToSheet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sheetData)
                })
                .then(response => !response.ok ? response.json().then(err => Promise.reject(err)) : response.json())
                .then(result => console.log("Netlify success:", result.message))
                .catch(error => alert(`ATTENZIONE: Articolo non sincronizzato su Google Fogli. Errore: ${error.message || 'Sconosciuto'}`));
                
                loadInventoryData();
                closeModal(newItemModal);
                newItemForm.reset();
            } catch (err) { showError("Errore durante l'aggiunta del nuovo articolo."); }
        });
    }

    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('click', async (e) => {
            const editButton = e.target.closest('.btn-edit-item');
            const deleteButton = e.target.closest('.btn-delete-item');

            if (editButton) {
                const itemId = editButton.dataset.id;
                try {
                    const docRef = db.collection("inventory").doc(itemId);
                    const docSnap = await docRef.get();
                    if (docSnap.exists) {
                        const itemToEdit = { id: docSnap.id, ...docSnap.data() };
                        getElement('edit-item-id').value = itemToEdit.id;
                        getElement('edit-item-brand').value = itemToEdit.brand;
                        getElement('edit-item-name').value = itemToEdit.name;
                        getElement('edit-item-total-quantity').value = itemToEdit.totalQuantity;
                        getElement('edit-item-available-quantity').value = itemToEdit.availableQuantity;
                        getElement('edit-item-daily-rate').value = itemToEdit.dailyRate;
                        openModal('edit-item-modal');
                    } else { showError("Articolo non trovato."); }
                } catch (err) { showError("Errore recupero dati articolo."); }
            } 
            else if (deleteButton) {
                const itemId = deleteButton.dataset.id;
                if (!isAdmin()) return showError("Azione non consentita.");
                try {
                    const itemRef = db.collection("inventory").doc(itemId);
                    const docSnap = await itemRef.get();
                    if (!docSnap.exists) return showError("Articolo già eliminato.");
                    const activeRentalSnap = await db.collection("activeRentals").where("itemId", "==", itemId).limit(1).get();
                    if (!activeRentalSnap.empty) return showError(`Impossibile eliminare: articolo attualmente noleggiato.`);

                    if (confirm(`Eliminare "${docSnap.data().name}"?`)) {
                        await itemRef.delete();
                        fetch('/.netlify/functions/deleteItemFromSheet', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idToDelete: itemId })
                        })
                        .then(res => res.json()).then(console.log).catch(console.error);
                        loadInventoryData();
                    }
                } catch (err) { showError("Errore eliminazione articolo."); }
            }
        });
    }
    
    if (editItemForm) {
        editItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const id = getElement('edit-item-id').value;
                const brand = getElement('edit-item-brand').value.trim();
                const name = getElement('edit-item-name').value.trim();
                const totalQuantity = parseInt(getElement('edit-item-total-quantity').value);
                const availableQuantity = parseInt(getElement('edit-item-available-quantity').value);
                const dailyRate = parseFloat(getElement('edit-item-daily-rate').value);
                if (!id || !brand || !name || isNaN(totalQuantity) || isNaN(availableQuantity) || isNaN(dailyRate)) {
                    return showError('Compila correttamente tutti i campi.');
                }
                if (availableQuantity > totalQuantity) return showError('Disponibile non può superare Totale.');
                
                const itemRef = db.collection("inventory").doc(id);
                const docSnap = await itemRef.get();
                if (!docSnap.exists) return showError("Errore: Articolo originale non trovato.");
                const rentedQuantity = (docSnap.data().totalQuantity || 0) - (docSnap.data().availableQuantity || 0);
                if (totalQuantity < rentedQuantity) {
                    return showError(`Nuova Q.tà Totale (${totalQuantity}) < Q.tà Noleggiata (${rentedQuantity}).`);
                }
                if (availableQuantity < (totalQuantity - rentedQuantity)) {
                    return showError(`Nuova Q.tà Disponibile (${availableQuantity}) deve essere almeno ${totalQuantity - rentedQuantity}.`);
                }
                await itemRef.update({ brand, name, totalQuantity, availableQuantity, dailyRate });
                loadInventoryData();
                closeModal(editItemModal);
            } catch (err) { showError("Errore salvataggio modifiche articolo."); }
        });
    }

    // --- Rental Actions ---
    if (newRentalBtn) {
        newRentalBtn.addEventListener('click', () => {
            resetOngoingRentalState();
            populateOperatorDropdown(rentalOperatorSelect);
            populateRentalBrandDropdown();
            openModal('rental-modal');
        });
    }

    if (rentalBrandSelect) {
        rentalBrandSelect.addEventListener('change', (e) => {
            populateItemDropdown(e.target.value, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput);
        });
    }

    if (rentalItemSelect) {
        rentalItemSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const maxQuantity = selectedOption?.dataset.max ? parseInt(selectedOption.dataset.max) : 0;
            if (rentalQuantityInput) {
                rentalQuantityInput.max = maxQuantity > 0 ? maxQuantity : null;
                rentalQuantityInput.value = 1;
                if (maxQuantity > 0 && quantityAvailableInfo) {
                    quantityAvailableInfo.textContent = `Disponibili: ${maxQuantity}`;
                    quantityAvailableInfo.style.display = 'block';
                } else if (quantityAvailableInfo) {
                    quantityAvailableInfo.style.display = 'none';
                }
            }
        });
    }

    if (rentalQuantityInput) {
        rentalQuantityInput.addEventListener('input', (e) => {
            const max = parseInt(e.target.max);
            if (!isNaN(max) && parseInt(e.target.value) > max) e.target.value = max;
            if (parseInt(e.target.value) < 1) e.target.value = 1;
        });
    }

    if (rentalForm) {
        rentalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = {
                    operator: rentalOperatorSelect.value,
                    warehouse: rentalWarehouseSelect.value,
                    client: rentalClientNameInput.value.trim().toUpperCase(),
                    startDate: rentalStartDateInput.value,
                    itemId: rentalItemSelect.value,
                    quantity: parseInt(rentalQuantityInput.value) || 0,
                    notes: rentalNotesTextarea.value.trim().toUpperCase()
                };
                if (!formData.operator || !formData.warehouse || !formData.client || !formData.startDate || !formData.itemId || formData.quantity < 1) {
                    return showError('Completa tutti i campi richiesti.');
                }
                const itemDocSnap = await db.collection("inventory").doc(formData.itemId).get();
                if (!itemDocSnap.exists) return showError('Articolo non trovato.');
                const selectedItem = { id: itemDocSnap.id, ...itemDocSnap.data() };
                if (selectedItem.availableQuantity < formData.quantity) return showError(`Solo ${selectedItem.availableQuantity} di "${selectedItem.name}" disp.`);
                
                let currentRentalNumber;
                if (ongoingRentalInfo?.rentalNumber) {
                    currentRentalNumber = ongoingRentalInfo.rentalNumber;
                } else {
                    currentRentalNumber = getNextRentalNumber();
                }
                ongoingRentalInfo = { rentalNumber: currentRentalNumber, ...formData };
                
                const rentalData = {
                    ...ongoingRentalInfo,
                    itemName: `${selectedItem.brand} ${selectedItem.name}`,
                    status: "active",
                    dailyRate: selectedItem.dailyRate
                };
                
                const itemRef = db.collection("inventory").doc(selectedItem.id);
                await db.runTransaction(async (transaction) => {
                    const itemDoc = await transaction.get(itemRef);
                    if (!itemDoc.exists) throw "Articolo non più esistente.";
                    if (itemDoc.data().availableQuantity < formData.quantity) throw "Disponibilità cambiata.";
                    transaction.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(-formData.quantity) });
                    transaction.set(db.collection("activeRentals").doc(), rentalData);
                });
                
                await loadInventoryData();
                await loadRentalData();
                
                const rentalsSnapshot = await db.collection("activeRentals").where("rentalNumber", "==", currentRentalNumber).get();
                const currentRentalItems = rentalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                printSingleRentalReceipt(currentRentalItems);

                if (confirm(`Noleggio #${currentRentalNumber} aggiunto.\nVuoi aggiungere un altro articolo allo stesso noleggio?`)) {
                    prepareModalForAdditionalItem(ongoingRentalInfo);
                } else {
                    resetOngoingRentalState();
                    closeModal(rentalModal);
                }
            } catch (err) { showError("Errore creazione noleggio: " + err.message); resetOngoingRentalState(); }
        });
    }

    if (activeRentalsTableBody) {
        activeRentalsTableBody.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const rentalDocId = target.dataset.id;
            if (!rentalDocId) return;
            
            if (target.classList.contains('btn-complete-rental')) {
                try {
                    const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                    const rentalDoc = await rentalRef.get();
                    if (!rentalDoc.exists) return showError("Noleggio non trovato.");
                    const rentalToComplete = { id: rentalDoc.id, ...rentalDoc.data() };
                    const today = new Date().toISOString().split('T')[0];
                    const endDate = prompt(`Data fine noleggio per #${rentalToComplete.rentalNumber} (${rentalToComplete.itemName}) (AAAA-MM-GG):`, today);
                    if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
                        if (new Date(endDate) < new Date(rentalToComplete.startDate)) return showError("Data fine non può precedere data inizio.");
                        const completedData = { ...rentalToComplete, endDate, status: "completed" };
                        delete completedData.id;
                        const itemRef = db.collection("inventory").doc(rentalToComplete.itemId);
                        const batch = db.batch();
                        batch.set(db.collection("completedRentals").doc(), completedData);
                        batch.delete(rentalRef);
                        batch.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(rentalToComplete.quantity) });
                        await batch.commit();
                        loadInventoryData();
                        loadRentalData();
                    } else if (endDate) { showError("Formato data non valido."); }
                } catch (err) { showError("Errore completamento noleggio: " + err.message); }
            } else if (target.classList.contains('btn-edit-rental')) {
                try {
                    const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                    const rentalDoc = await rentalRef.get();
                    if (!rentalDoc.exists) { showError("Noleggio non trovato."); loadRentalData(); return; }
                    const rentalToEdit = { id: rentalDoc.id, ...rentalDoc.data() };
                    if (editRentalModal && editRentalForm) {
                        getElement('edit-rental-id').value = rentalToEdit.id;
                        getElement('edit-rental-original-item-id').value = rentalToEdit.itemId;
                        getElement('edit-rental-original-quantity').value = rentalToEdit.quantity;
                        getElement('edit-rental-number-display').value = rentalToEdit.rentalNumber || 'N/A';
                        getElement('edit-rental-warehouse-display').value = rentalToEdit.warehouse || 'N/D';
                        getElement('edit-rental-startdate-display').value = formatDate(rentalToEdit.startDate);
                        getElement('edit-rental-client-name').value = rentalToEdit.client;
                        populateOperatorDropdown(getElement('edit-rental-operator'));
                        getElement('edit-rental-operator').value = rentalToEdit.operator || "";
                        getElement('edit-rental-notes').value = rentalToEdit.notes || "";
                        const inventorySnapshot = await db.collection("inventory").get();
                        const inventoryForEdit = inventorySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                        const originalItemDetails = inventoryForEdit.find(i => i.id === rentalToEdit.itemId);
                        updateBrandFilters(inventoryForEdit, getElement('edit-rental-brand-selection'), getElement('edit-rental-item-selection'), getElement('edit-quantity-available-info'), getElement('edit-rental-quantity'), rentalToEdit.itemId, rentalToEdit.quantity);
                        if (originalItemDetails) {
                            getElement('edit-rental-brand-selection').value = originalItemDetails.brand;
                            await populateItemDropdown(originalItemDetails.brand, getElement('edit-rental-item-selection'), getElement('edit-quantity-available-info'), getElement('edit-rental-quantity'), rentalToEdit.itemId, rentalToEdit.quantity);
                            getElement('edit-rental-item-selection').value = rentalToEdit.itemId;
                        }
                        getElement('edit-rental-quantity').value = rentalToEdit.quantity;
                        setTimeout(() => {
                            const editItemSel = getElement('edit-rental-item-selection');
                            if (editItemSel?.value) {
                                if (Array.from(editItemSel.options).some(opt => opt.value === rentalToEdit.itemId)) {
                                    editItemSel.value = rentalToEdit.itemId;
                                }
                                editItemSel.dispatchEvent(new Event('change'));
                            }
                        }, 100);
                        openModal('edit-rental-modal');
                    } else { showError("Errore apertura modulo modifica."); }
                } catch (err) { console.error("Error preparing rental edit:", err); showError("Errore caricamento dati per modifica noleggio: " + err.message); }
            } else if (target.classList.contains('btn-reprint-rental')) {
                try {
                    const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                    const rentalDoc = await rentalRef.get();
                    if (!rentalDoc.exists) { showError("Noleggio non trovato."); loadRentalData(); return; }
                    const rentalToPrint = rentalDoc.data();
                    const rentalsSnapshot = await db.collection("activeRentals").where("rentalNumber", "==", rentalToPrint.rentalNumber).get();
                    const allItemsForRental = rentalsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                    if(allItemsForRental.length > 0) { printSingleRentalReceipt(allItemsForRental); } else { showError("Nessun articolo trovato per questo numero di noleggio."); }
                } catch (err) { console.error("Error fetching rentals for reprint:", err); showError("Errore recupero dati per ristampa: " + err.message); }
            } else if (target.classList.contains('btn-delete-rental')) {
                if (!isAdmin()) { showError("Azione non consentita. Privilegi di amministratore richiesti."); return; }
                try {
                    const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                    const rentalDoc = await rentalRef.get();
                    if (!rentalDoc.exists) { showError("Riga noleggio già eliminata."); loadRentalData(); return; }
                    const rentalToDelete = { id: rentalDoc.id, ...rentalDoc.data() };
                    if (confirm(`Annullare riga?\nArticolo: ${rentalToDelete.itemName} (Q: ${rentalToDelete.quantity})\nNoleggio #: ${rentalToDelete.rentalNumber}\n\nL'articolo tornerà disponibile.`)) {
                        const itemRef = db.collection("inventory").doc(rentalToDelete.itemId);
                        const batch = db.batch();
                        batch.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(rentalToDelete.quantity) });
                        batch.delete(rentalRef);
                        await batch.commit();
                        loadInventoryData();
                        loadRentalData();
                    }
                 } catch (err) { console.error("Error deleting rental row:", err); showError("Errore annullamento riga noleggio: " + err.message); }
            }
        });
    }

    if (editRentalForm) {
        editRentalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const rentalDocId = getElement('edit-rental-id').value;
                const originalItemId = getElement('edit-rental-original-item-id').value;
                const originalQuantity = parseInt(getElement('edit-rental-original-quantity').value) || 0;
                const newClientName = getElement('edit-rental-client-name').value.trim().toUpperCase();
                const newOperator = getElement('edit-rental-operator').value;
                const newItemId = getElement('edit-rental-item-selection').value;
                const newQuantity = parseInt(getElement('edit-rental-quantity').value) || 0;
                const newNotes = getElement('edit-rental-notes').value.trim().toUpperCase();
                if (!rentalDocId || !newClientName || !newOperator || !newItemId || isNaN(newQuantity) || newQuantity < 1) {
                    return showError("Cliente, Operatore, Articolo e Quantità obbligatori.");
                }
                const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                const newItemRef = db.collection("inventory").doc(newItemId);
                const originalItemRef = db.collection("inventory").doc(originalItemId);
                await db.runTransaction(async (transaction) => {
                    const newItemDoc = await transaction.get(newItemRef);
                    if (!newItemDoc.exists) throw "Nuovo articolo non trovato.";
                    const newItemData = newItemDoc.data();
                    let maxAllowed;
                    if (originalItemId === newItemId) {
                        maxAllowed = newItemData.availableQuantity + originalQuantity;
                    } else {
                        const originalItemDoc = await transaction.get(originalItemRef);
                        if (!originalItemDoc.exists) throw "Articolo inventario originale non trovato.";
                        maxAllowed = newItemData.availableQuantity;
                    }
                    if (newQuantity > maxAllowed) throw `Quantità non disponibile per "${newItemData.name}". Max: ${maxAllowed}.`;
                    
                    if (originalItemId !== newItemId) {
                        transaction.update(originalItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(originalQuantity) });
                        transaction.update(newItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(-newQuantity) });
                    } else {
                        transaction.update(newItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(originalQuantity - newQuantity) });
                    }
                    transaction.update(rentalRef, {
                        itemId: newItemId, itemName: `${newItemData.brand} ${newItemData.name}`,
                        quantity: newQuantity, dailyRate: newItemData.dailyRate, client: newClientName,
                        operator: newOperator, notes: newNotes
                    });
                });
                loadInventoryData();
                loadRentalData();
                closeModal(editRentalModal);
                alert("Modifiche noleggio salvate.");
            } catch(err) { console.error("Error saving rental edits:", err); showError("Errore salvataggio modifiche noleggio: " + err.message); }
        });
    }

    // --- Admin & History Actions ---

    // GESTIONE RESET INVENTARIO
    if (resetInventoryBtn) {
        resetInventoryBtn.addEventListener('click', async () => {
            if (!isAdmin()) return showError("Azione non consentita.");
            try {
                const activeRentalsSnap = await db.collection("activeRentals").limit(1).get();
                if (!activeRentalsSnap.empty) return showError("Impossibile resettare: ci sono noleggi attivi.");
                if (confirm("CANCELLARE tutto l'inventario? Azione irreversibile.")) {
                    const snapshot = await db.collection("inventory").get();
                    const batch = db.batch();
                    snapshot.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    saveDataLS(RENTAL_COUNTER_LS_KEY, 0);
                    loadInventoryData();
                    alert("Inventario resettato.");
                }
            } catch (err) { showError("Errore durante il reset dell'inventario: " + err.message); }
        });
    }
    
    // GESTIONE STAMPA STORICO (CON NUOVA LOGICA PREZZI)
    if (printRentalsBtn) {
        printRentalsBtn.addEventListener('click', async function () {
            // ... (il tuo codice per la stampa è corretto e rimane qui)
            console.log("Print history clicked with correct special item pricing.");
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
                
                let grandStandardTotal = 0;
                let grandChargeableTotal = 0;
                
                const LOGO_STAMPA_URL = "https://i.postimg.cc/Z5b3Yvr0/LOGO-CAI.png";
                let printHtml = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Stampa Noleggi - ${monthName} ${selectedYear}</title><style>
                    body { font-family: Arial, sans-serif; font-size: 9pt; margin: 15mm; } 
                    .print-page-header { display: flex; gap: 20px; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; } 
                    .print-page-header img { max-height: 50px; width: auto; flex-shrink: 0; } 
                    .print-page-header h1 { flex-grow: 1; display: flex; align-items: center; margin: 0; font-size: 16pt; text-align: left; } 
                    h2 { font-size: 12pt; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; page-break-before: avoid; page-break-after: avoid; } 
                    table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 15px; font-size: 8pt; page-break-inside: auto; border: 1px solid #ccc; } 
                    th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; vertical-align: top; word-wrap: break-word; } 
                    th { background-color: #e9e9e9; font-weight: bold; white-space: nowrap; } 
                    tbody tr:nth-child(odd) { background-color: #f9f9f9; } 
                    tbody tr:hover { background-color: #f1f1f1; } 
                    .text-right { text-align: right; } 
                    .text-center { text-align: center; } 
                    .total-row td { font-weight: bold; border-top: 2px solid #aaa; background-color: #f0f0f0; } 
                    .grand-total-table { width: 50%; margin-top: 30px; border: 2px solid #333; } 
                    .grand-total-table td { font-size: 1.1em; } 
                    .print-info { text-align: center; font-size: 8pt; color: #666; margin-bottom: 15px; } 
                    tr { page-break-inside: avoid; page-break-after: auto; } 
                    thead { display: table-header-group; } 
                    @page { size: A4; margin: 15mm; } 
                    @media print { body { margin: 10mm; font-size: 9pt; } h2 { page-break-before: auto; } button { display: none; } }
                </style></head><body><div class="print-page-header"><img src="${LOGO_STAMPA_URL}" alt="Logo CAI Idraulica"><h1>Riepilogo Noleggi Completati - ${monthName} ${selectedYear}</h1></div><div class="print-info">Generato il: ${new Date().toLocaleString('it-IT')}</div>`;
                
                sortedClients.forEach(client => {
                    printHtml += `<h2>Cliente: ${escapeHtml(client)}</h2><table>
                    <colgroup>
                        <col style="width: 6%;"><col style="width: 25%;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 5%; text-align: center;"><col style="width: 8%; text-align: right;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 6%; text-align: center;"><col style="width: 8%; text-align: right;"><col style="width: 8%; text-align: right;"><col style="width: auto;">
                    </colgroup>
                    <thead>
                        <tr><th># Nol.</th><th>Articolo Noleggiato</th><th>Mag. Orig.</th><th>Operatore</th><th class="text-center">Q.tà</th><th class="text-right">€/Giorn.</th><th>Inizio</th><th>Fine</th><th class="text-center">GG Tot.</th><th class="text-right">€ Tot. Standard</th><th class="text-right">€ Tot. Imponibile</th><th>Note</th></tr>
                    </thead>
                    <tbody>`;
                    
                    let clientStandardTotal = 0;
                    let clientChargeableTotal = 0;

                    const rentalsForClient = clientRentals[client];
                    rentalsForClient.forEach(rental => {
                        const days = getDaysDifference(rental.startDate, rental.endDate);
                        const isSpecialItem = SPECIAL_ITEM_IDS.includes(rental.itemId);
                        
                        let standardCost = 0;
                        let chargeableCost = 0;

                        // --- LOGICA DI CALCOLO CORRETTA ---
                        if (isSpecialItem) {
                            if (days === 1) {
                                standardCost = 15.00;
                            } else if (days > 1) {
                                standardCost = 15.00 + (25.00 * (days - 1));
                            }
                            chargeableCost = standardCost;

                        } else {
                            standardCost = (rental.dailyRate || 0) * (rental.quantity || 1) * days;
                            const chargeableDays = Math.max(0, days - 1);
                            chargeableCost = (rental.dailyRate || 0) * (rental.quantity || 1) * chargeableDays;
                        }
                        
                        clientStandardTotal += standardCost;
                        clientChargeableTotal += chargeableCost;
                        
                        printHtml += `<tr>
                            <td>${escapeHtml(rental.rentalNumber || 'N/A')}</td>
                            <td>${escapeHtml(rental.itemName)}</td>
                            <td>${escapeHtml(rental.warehouse)}</td>
                            <td>${escapeHtml(rental.operator)}</td>
                            <td class="text-center">${rental.quantity}</td>
                            <td class="text-right">${isSpecialItem ? 'Spec.' : formatPrice(rental.dailyRate)}</td>
                            <td>${formatDate(rental.startDate)}</td>
                            <td>${formatDate(rental.endDate)}</td>
                            <td class="text-center">${days}</td>
                            <td class="text-right">${formatPrice(standardCost)}</td>
                            <td class="text-right">${formatPrice(chargeableCost)}</td>
                            <td>${escapeHtml(rental.notes || '')}</td>
                        </tr>`;
                    });

                    printHtml += `<tr class="total-row">
                        <td colspan="9" class="text-right">Totale Cliente (${escapeHtml(client)}):</td>
                        <td class="text-right">${formatPrice(clientStandardTotal)}</td>
                        <td class="text-right">${formatPrice(clientChargeableTotal)}</td>
                        <td></td>
                    </tr></tbody></table>`;

                    grandStandardTotal += clientStandardTotal;
                    grandChargeableTotal += clientChargeableTotal;
                });

                printHtml += `<h2 style="margin-top: 30px; border-top: 2px solid black; padding-top: 15px;">Riepilogo Generale Mese</h2>
                              <table class="grand-total-table">
                                <tbody>
                                    <tr class="total-row">
                                        <td>IMPORTO TOTALE STANDARD</td>
                                        <td class="text-right">${formatPrice(grandStandardTotal)}</td>
                                    </tr>
                                    <tr class="total-row">
                                        <td>IMPORTO TOTALE IMPONIBILE</td>
                                        <td class="text-right">${formatPrice(grandChargeableTotal)}</td>
                                    </tr>
                                </tbody>
                              </table>`;
                
                printHtml += `<script>window.onload=function(){ try { window.print(); } catch(e) { console.error('Print failed:', e); } };<\/script></body></html>`;
                
                const printWindow = window.open('', '_blank'); 
                if (printWindow) { 
                    printWindow.document.open(); 
                    printWindow.document.write(printHtml); 
                    printWindow.document.close(); 
                } else { 
                    showError("Impossibile aprire finestra stampa."); 
                }
            } catch (err) { 
                console.error("Error printing history:", err); 
                showError("Errore preparazione stampa storico."); 
            }
        });
    }
    
    // GESTIONE CANCELLAZIONE SINGOLO NOLEGGIO DALLO STORICO
    const manageHistoryBtn = getElement('manage-history-btn');
    const manageHistoryModal = getElement('manage-history-modal');
    const historySearchBtn = getElement('history-search-btn');
    const historySearchInput = getElement('history-search-input');
    const historyResultsContainer = getElement('history-results-container');

    if (manageHistoryBtn) {
        manageHistoryBtn.addEventListener('click', () => {
            if (!isAdmin()) {
                return showError("Azione riservata agli amministratori.");
            }
            if (manageHistoryModal) {
                 historyResultsContainer.innerHTML = '<p class="info-text">Nessun risultato. Effettua una ricerca.</p>';
                 historySearchInput.value = '';
                 openModal('manage-history-modal');
            }
        });
    }
    
    if (historySearchBtn) {
        const searchHistory = async () => {
            const searchTerm = historySearchInput.value.trim();
            if (!searchTerm) {
                historyResultsContainer.innerHTML = '<p class="info-text">Inserisci un termine di ricerca.</p>';
                return;
            }
    
            historyResultsContainer.innerHTML = '<p class="info-text"><i class="fas fa-spinner fa-spin"></i> Ricerca in corso...</p>';
            
            try {
                let rentals = [];
                const searchAsNumber = parseInt(searchTerm);
                if (!isNaN(searchAsNumber)) {
                    const snapshot = await db.collection("completedRentals").where("rentalNumber", "==", searchAsNumber).get();
                    snapshot.forEach(doc => rentals.push({ id: doc.id, ...doc.data() }));
                }
    
                const clientSnapshot = await db.collection("completedRentals").where("client", "==", searchTerm.toUpperCase()).get();
                clientSnapshot.forEach(doc => {
                    if (!rentals.some(r => r.id === doc.id)) {
                        rentals.push({ id: doc.id, ...doc.data() });
                    }
                });
    
                if (rentals.length === 0) {
                    historyResultsContainer.innerHTML = '<p class="info-text">Nessun noleggio trovato per questo termine.</p>';
                    return;
                }
    
                let resultsHtml = '<ul>';
                rentals.forEach(rental => {
                    resultsHtml += `<li>
                        <div>
                            <strong>#${rental.rentalNumber}</strong> - ${escapeHtml(rental.client)}<br>
                            <small>${escapeHtml(rental.itemName)} - Chiuso il: ${formatDate(rental.endDate)}</small>
                        </div>
                        <button class="btn btn-sm btn-danger btn-delete-completed" data-id="${rental.id}" title="Elimina Definitivamente">
                            <i class="fas fa-trash"></i>
                        </button>
                    </li>`;
                });
                resultsHtml += '</ul>';
                historyResultsContainer.innerHTML = resultsHtml;
    
            } catch (err) {
                console.error("Errore ricerca storico:", err);
                showError("Errore durante la ricerca nello storico.");
                historyResultsContainer.innerHTML = '<p style="color:red;">Errore durante la ricerca.</p>';
            }
        };
        
        historySearchBtn.addEventListener('click', searchHistory);
        historySearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchHistory();
            }
        });
    }
    
    if (historyResultsContainer) {
        historyResultsContainer.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.btn-delete-completed');
            if (deleteButton) {
                if (!isAdmin()) return showError("Azione riservata agli amministratori.");
    
                const docId = deleteButton.dataset.id;
                if (confirm("Sei sicuro di voler eliminare DEFINITIVAMENTE questa riga di noleggio dallo storico? L'azione è irreversibile.")) {
                    try {
                        await db.collection("completedRentals").doc(docId).delete();
                        deleteButton.closest('li').remove();
                        alert("Riga noleggio eliminata dallo storico.");
                        updateBillingStats();
                    } catch (err) {
                        console.error("Errore eliminazione da storico:", err);
                        showError("Errore durante l'eliminazione del noleggio.");
                    }
                }
            }
        });
    }

    // GESTIONE AZZERAMENTO STORICO COMPLETO
    if (resetCompletedBtn) {
        resetCompletedBtn.addEventListener('click', async () => {
            if (!isAdmin()) return showError("Azione non consentita.");
            if (confirm("Eliminare TUTTO lo storico noleggi? Azione irreversibile.")) {
                try {
                    const snapshot = await db.collection("completedRentals").get();
                    if (snapshot.empty) return alert("Lo storico è già vuoto.");
                    const batch = db.batch();
                    snapshot.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    updateBillingStats();
                    alert("Storico resettato.");
                } catch(err) { showError("Errore durante il reset dello storico."); }
            }
        });
    }
    
    console.log("Noleggi App: Event listeners attached successfully.");
};

    // --- Authentication and Global Setup ---
    document.addEventListener("DOMContentLoaded", () => {
        setupEventListeners();
    });

    window.initializeApp = initializeApp;
    window.loadInventoryData = loadInventoryData;
    window.loadRentalData = loadRentalData;

})(); // End IIFE
