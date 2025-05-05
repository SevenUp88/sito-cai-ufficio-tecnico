// Wrap everything in an IIFE
(function () {
    'use strict';

    // --- Configuration & Global State ---
    // const INITIAL_INVENTORY = []; // Non più necessario
    // Chiavi LocalStorage non più usate per dati principali
    // const ACTIVE_RENTALS_LS_KEY = "activeRentals";
    // const COMPLETED_RENTALS_LS_KEY = "completedRentals";
    const RENTAL_COUNTER_LS_KEY = "rentalCounter"; // Mantenuto per ora per semplicità
    const WAREHOUSES = ["VILLALTA", "SAVIGNANO", "VILLAMARINA"];
    const OPERATORS = ["DANIELE", "GIOVANNI", "LEANDRO", "LEONE", "LUCA", "MASSIMO", "MATTIA", "RAFFAELE", "SERGIO", "SEVERINO", "THOMAS"];
    const LOGO_URL = "https://i.postimg.cc/1XQtFBSX/logo-cai-removebg-preview.png";
    const MIN_DAYS_FOR_ATTENTION = 5;
    let ongoingRentalInfo = null;

    // --- Utility Functions ---
    const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const escapeHtml = (unsafe) => { if (typeof unsafe !== 'string') unsafe = String(unsafe); return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#039;"); };
    const formatPrice = (value) => { const number = parseFloat(value); return isNaN(number) ? 'N/D' : number.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { const parts = dateString.split('-'); if (parts.length !== 3) return dateString; const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); if (isNaN(date.getTime())) return 'Data non valida'; return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date); } catch (e) { console.error("Errore formattazione data:", dateString, e); return 'Errore data'; } };
    const getDaysDifference = (startDate, endDate) => { if (!startDate || !endDate) return 1; try { const start = new Date(startDate + 'T00:00:00Z'); const end = new Date(endDate + 'T00:00:00Z'); if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1; const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()); if (endUTC < startUTC) return 1; const diffTime = endUTC - startUTC; return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; } catch (e) { console.error("Error calculating date difference:", startDate, endDate, e); return 1; } };
    const getDaysElapsed = (startDateString) => { if (!startDateString) return 0; try { const startDate = new Date(startDateString + 'T00:00:00Z'); if (isNaN(startDate.getTime())) return 0; const today = new Date(); const todayUTCStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()); const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()); const diffTime = todayUTCStart - startUTC; return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))); } catch (e) { console.error("Error calculating days elapsed:", startDateString, e); return 0; } };
    const showError = (message) => alert(`[ERRORE] ${message}`);

    // --- LocalStorage Functions (SOLO per contatore noleggio) ---
    const getDataLS = (key, defaultValue = 0) => { try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : defaultValue; } catch (error) { console.error(`Error reading ${key} from localStorage:`, error); return defaultValue; } };
    const saveDataLS = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (error) { console.error(`Error saving ${key} to localStorage:`, error); } };

    // --- Rental Numbering ---
    const getNextRentalNumber = () => { let currentCounter = getDataLS(RENTAL_COUNTER_LS_KEY, 0); if (typeof currentCounter !== 'number' || isNaN(currentCounter)) { console.warn("Rental counter invalid, resetting."); currentCounter = 0; } const nextNumber = currentCounter + 1; saveDataLS(RENTAL_COUNTER_LS_KEY, nextNumber); return nextNumber; };


    // --- Funzioni definite nello scope globale dell'IIFE ---

    const openModal = (modalId) => { const modalElement = document.getElementById(modalId); if (modalElement) modalElement.style.display = 'block'; };
    const closeModal = (modalElement) => { if (modalElement) modalElement.style.display = 'none'; if (modalElement && modalElement.id === 'rental-modal') { resetOngoingRentalState(); } };
    const resetOngoingRentalState = () => { ongoingRentalInfo = null; const numberInput = document.getElementById('rental-number-ongoing'); const opSelect = document.getElementById('rental-operator'); const whSelect = document.getElementById('rental-warehouse'); const clientInput = document.getElementById('rental-client-name'); const dateInput = document.getElementById('rental-start-date'); const title = document.getElementById('rental-modal-title'); if (numberInput) numberInput.value = ''; if (opSelect) opSelect.disabled = false; if (whSelect) whSelect.disabled = false; if (clientInput) clientInput.disabled = false; if (dateInput) dateInput.disabled = false; if (title) title.textContent = "Nuovo Noleggio"; };

    // Legge da Firestore
    const updateBillingStats = async () => { const totalCompletedStat = document.getElementById('total-completed'); const totalClientsStat = document.getElementById('total-clients'); try { if (!window.db) { if (totalCompletedStat) totalCompletedStat.textContent = 'N/D'; if (totalClientsStat) totalClientsStat.textContent = 'N/D'; return; } const snapshot = await db.collection("completedRentals").get(); const completedRentals = []; snapshot.forEach(doc => completedRentals.push(doc.data())); const clients = [...new Set(completedRentals.map(rental => rental.client))]; if (totalCompletedStat) totalCompletedStat.textContent = completedRentals.length; if (totalClientsStat) totalClientsStat.textContent = clients.length; } catch (err) { console.error("Error updating billing stats from Firestore:", err); if (totalCompletedStat) totalCompletedStat.textContent = 'ERR'; if (totalClientsStat) totalClientsStat.textContent = 'ERR'; } };
    const updateInventoryStats = (inventory = []) => { const totalItemsStat = document.getElementById('total-items'); const availableItemsStat = document.getElementById('available-items'); try { if (totalItemsStat) totalItemsStat.textContent = inventory.reduce((sum, item) => sum + (item.totalQuantity || 0) , 0); if (availableItemsStat) availableItemsStat.textContent = inventory.reduce((sum, item) => sum + (item.availableQuantity || 0), 0); } catch (err) { console.error("Error updating inventory stats:", err); } };
    const updateRentalStats = (activeRentals = []) => { const totalRentalsStat = document.getElementById('total-rentals'); const itemsRentedStat = document.getElementById('items-rented'); try { if (totalRentalsStat) totalRentalsStat.textContent = activeRentals.length; if (itemsRentedStat) itemsRentedStat.textContent = activeRentals.reduce((sum, rental) => sum + (rental.quantity || 0), 0); } catch (err) { console.error("Error updating rental stats:", err); } };

    const applyInventoryFilters = (inventory) => { const inventorySearchInput = document.getElementById('inventory-search'); const filterBrandSelect = document.getElementById('filter-brand'); const filterStatusSelect = document.getElementById('filter-status'); const searchTerm = inventorySearchInput ? inventorySearchInput.value.toLowerCase() : ''; const brandFilter = filterBrandSelect ? filterBrandSelect.value : ''; const statusFilter = filterStatusSelect ? filterStatusSelect.value : ''; return inventory.filter(item => { const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm); const matchesBrand = !brandFilter || item.brand === brandFilter; const isAvailable = item.availableQuantity > 0; const matchesStatus = !statusFilter || (statusFilter === 'available' && isAvailable) || (statusFilter === 'rented' && !isAvailable); return matchesSearch && matchesBrand && matchesStatus; }); };
    const renderInventoryTable = (inventory) => { const inventoryTableBody = document.getElementById('inventory-table')?.querySelector('tbody'); if (!inventoryTableBody) return; inventoryTableBody.innerHTML = ''; const filteredInventory = applyInventoryFilters(inventory); if (filteredInventory.length === 0) { inventoryTableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="font-style:italic;">Nessun articolo trovato.</td></tr>'; return; } const fragment = document.createDocumentFragment(); filteredInventory.forEach(item => { const tr = document.createElement('tr'); tr.dataset.itemId = item.id; const status = item.availableQuantity > 0 ? '<span class="badge badge-success">Disponibile</span>' : '<span class="badge badge-danger">Esaurito</span>'; tr.innerHTML = `<td><i class="fas fa-tag"></i> ${escapeHtml(item.brand)}</td><td>${escapeHtml(item.name)}</td><td class="text-center">${item.totalQuantity}</td><td class="text-center">${item.availableQuantity}</td><td class="text-right">${formatPrice(item.dailyRate)}</td><td>${status}</td><td class="actions"><button class="btn btn-sm btn-warning btn-edit-item" data-id="${item.id}"><i class="fas fa-edit"></i> Modifica</button> <button class="btn btn-sm btn-danger btn-delete-item" data-id="${item.id}"><i class="fas fa-trash"></i> Elimina</button></td>`; fragment.appendChild(tr); }); inventoryTableBody.appendChild(fragment); };
    const populateItemDropdown = async (selectedBrand, itemSelectElement, availableInfoElement = null, quantityInputElement = null, currentItemId = null, currentItemQuantity = 0) => { if (!itemSelectElement) return; itemSelectElement.innerHTML = ''; itemSelectElement.disabled = true; if(availableInfoElement) availableInfoElement.style.display = 'none'; if(quantityInputElement) { quantityInputElement.value = 1; quantityInputElement.max = null; } if (!selectedBrand) { itemSelectElement.innerHTML = '<option value="">-- Seleziona Marca Prima --</option>'; return; } if (!window.db) { showError("Errore: Database non disponibile."); itemSelectElement.innerHTML = `<option value="" disabled>Errore Database</option>`; return; } try { const snapshot = await db.collection("inventory").where("brand", "==", selectedBrand).get(); const inventoryItems = []; snapshot.forEach(doc => inventoryItems.push({ firestoreDocId: doc.id, ...doc.data() })); const itemsOfBrand = inventoryItems.filter(item => (item.availableQuantity > 0 || item.firestoreDocId === currentItemId)); if (itemsOfBrand.length === 0) { itemSelectElement.innerHTML = `<option value="" disabled>Nessun articolo ${currentItemId ? '' : 'disponibile '}per ${escapeHtml(selectedBrand)}</option>`; return; } itemSelectElement.innerHTML = '<option value="">-- Seleziona Articolo --</option>'; itemsOfBrand.forEach(item => { const option = document.createElement('option'); option.value = item.firestoreDocId; let maxForThisItem = item.availableQuantity + (item.firestoreDocId === currentItemId ? currentItemQuantity : 0); option.dataset.max = maxForThisItem; option.textContent = `${escapeHtml(item.name)} (${item.availableQuantity} disp.)`; itemSelectElement.appendChild(option); }); if (currentItemId && itemsOfBrand.some(item => item.firestoreDocId === currentItemId)) { itemSelectElement.value = currentItemId; } itemSelectElement.disabled = false; if(itemSelectElement.value) { itemSelectElement.dispatchEvent(new Event('change')); } else if (quantityInputElement) { if(availableInfoElement) availableInfoElement.style.display = 'none'; quantityInputElement.max = null; } } catch (error) { console.error("Error getting items by brand from Firestore: ", error); showError("Errore nel caricare gli articoli per la marca selezionata."); itemSelectElement.innerHTML = `<option value="" disabled>Errore caricamento articoli</option>`; } };
    const updateBrandFilters = (inventory, brandSelectElement, itemSelectElement = null, availableInfoElement = null, quantityInputElement = null, currentItemId = null, currentItemQuantity = 0) => { const brands = [...new Set(inventory.map(item => item.brand))].sort(); if (brandSelectElement) { const currentValue = brandSelectElement.value; brandSelectElement.innerHTML = '<option value="">Tutte le marche</option>'; brands.forEach(brand => { const option = document.createElement('option'); option.value = brand; option.textContent = escapeHtml(brand); brandSelectElement.appendChild(option); }); if (currentValue && brands.includes(currentValue)) { brandSelectElement.value = currentValue; } else { if (itemSelectElement) { populateItemDropdown(null, itemSelectElement, availableInfoElement, quantityInputElement, currentItemId, currentItemQuantity); } } } if (itemSelectElement) { populateItemDropdown(brandSelectElement ? brandSelectElement.value : null, itemSelectElement, availableInfoElement, quantityInputElement, currentItemId, currentItemQuantity); } };
    const loadInventoryData = async () => { console.log("Loading inventory from Firestore..."); const filterBrandSelect = document.getElementById('filter-brand'); let currentInventory = []; try { if (!window.db) throw new Error("Firestore database (db) non inizializzato."); const inventoryCollection = db.collection("inventory"); const snapshot = await inventoryCollection.get(); snapshot.forEach(doc => currentInventory.push({ id: doc.id, ...doc.data() })); console.log(`Loaded ${currentInventory.length} items from Firestore.`); } catch (error) { console.error("Error loading inventory from Firestore:", error); showError("Errore nel caricamento dell'inventario dal database."); currentInventory = []; } finally { renderInventoryTable(currentInventory); if(filterBrandSelect) { updateBrandFilters(currentInventory, filterBrandSelect); } updateInventoryStats(currentInventory); } };
    const renderActiveRentalsTable = (rentals) => { const activeRentalsTableBody = document.getElementById('active-rentals-table')?.querySelector('tbody'); if (!activeRentalsTableBody) return; activeRentalsTableBody.innerHTML = ''; /* No sort needed, query does it */ if (rentals.length === 0) { activeRentalsTableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="font-style:italic;">Nessun noleggio attivo.</td></tr>'; return; } const fragment = document.createDocumentFragment(); rentals.forEach(rental => { const tr = document.createElement('tr'); tr.dataset.rentalId = rental.id; /* Usa ID documento Firestore */ tr.innerHTML = `<td>${escapeHtml(rental.rentalNumber || 'N/A')}</td><td>${escapeHtml(rental.itemName)} (${rental.quantity})</td><td>${escapeHtml(rental.client)}</td><td>${escapeHtml(rental.warehouse || 'N/D')}</td><td>${formatDate(rental.startDate)}</td><td><span class="badge badge-warning">Attivo</span></td><td class="actions"><button class="btn btn-sm btn-success btn-complete-rental" data-id="${rental.id}" title="Completa Noleggio"><i class="fas fa-check"></i></button> <button class="btn btn-sm btn-warning btn-edit-rental" data-id="${rental.id}" title="Modifica Noleggio"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-primary btn-reprint-rental" data-id="${rental.id}" title="Ristampa Ricevuta"><i class="fas fa-print"></i></button> <button class="btn btn-sm btn-danger btn-delete-rental" data-id="${rental.id}" title="Annulla Riga Noleggio"><i class="fas fa-times"></i></button></td>`; fragment.appendChild(tr); }); activeRentalsTableBody.appendChild(fragment); };
    const renderOldestRentals = (activeRentals = []) => { const oldestRentalsList = document.getElementById('oldest-rentals-list'); if (!oldestRentalsList) return; const rentalsNeedingAttention = activeRentals.filter(rental => getDaysElapsed(rental.startDate) >= MIN_DAYS_FOR_ATTENTION); const oldestPerRentalNumber = rentalsNeedingAttention.reduce((acc, rental) => { const key = rental.rentalNumber; if (!acc[key] || new Date(rental.startDate) < new Date(acc[key].startDate)) { acc[key] = rental; } return acc; }, {}); const uniqueOldestRentals = Object.values(oldestPerRentalNumber).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); const oldestToDisplay = uniqueOldestRentals; if (oldestToDisplay.length === 0) { oldestRentalsList.innerHTML = `<li>Nessun noleggio attivo da ${MIN_DAYS_FOR_ATTENTION} o più giorni.</li>`; return; } const fragment = document.createDocumentFragment(); oldestToDisplay.forEach(rental => { const li = document.createElement('li'); const daysElapsed = getDaysElapsed(rental.startDate); const daysElapsedText = ` - <span>${daysElapsed} gg fa</span>`; const itemsForThisRental = activeRentals.filter(r => r.rentalNumber === rental.rentalNumber); const itemsSummary = itemsForThisRental.map(r => `${r.itemName} (Q:${r.quantity})`).join(', '); li.innerHTML = `<span class="rental-details"><i class="fas fa-user" title="Noleggio #${rental.rentalNumber}, Mag: ${escapeHtml(rental.warehouse || 'N/D')}, Op: ${escapeHtml(rental.operator || 'N/D')}, Articoli: ${escapeHtml(itemsSummary)}"></i> ${escapeHtml(rental.client)} - Noleggio #${rental.rentalNumber}</span><span class="rental-date">${formatDate(rental.startDate)}${daysElapsedText}</span>`; fragment.appendChild(li); }); oldestRentalsList.innerHTML = ''; oldestRentalsList.appendChild(fragment); };
    // *** loadRentalData LEGGE da Firestore ***
    const loadRentalData = async () => {
        console.log("Loading active rentals from Firestore...");
        const activeRentalsTableBody = document.getElementById('active-rentals-table')?.querySelector('tbody');
        let activeRentals = [];
        try {
            if (!window.db) throw new Error("Firestore database (db) non inizializzato.");
            const rentalsCollection = db.collection("activeRentals");
            const snapshot = await rentalsCollection.orderBy("startDate", "desc").get();
            snapshot.forEach(doc => { activeRentals.push({ id: doc.id, ...doc.data() }); }); // Salva ID documento Firestore
            console.log(`Loaded ${activeRentals.length} active rentals from Firestore.`);
        } catch (error) {
            console.error("Error loading active rentals from Firestore:", error);
            showError("Errore nel caricamento dei noleggi attivi dal database.");
            if (activeRentalsTableBody) activeRentalsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Errore caricamento noleggi.</td></tr>';
        } finally {
             renderActiveRentalsTable(activeRentals);
             renderOldestRentals(activeRentals);
             updateRentalStats(activeRentals);
             await updateBillingStats(); // Chiama la versione async
        }
    };
    const populateOperatorDropdown = (selectElement) => { if (!selectElement) return; const currentValue = selectElement.value; selectElement.innerHTML = '<option value="">-- Seleziona Operatore --</option>'; const sortedOperators = [...OPERATORS].sort((a, b) => a.localeCompare(b)); sortedOperators.forEach(opName => { const option = document.createElement('option'); option.value = opName; option.textContent = opName; selectElement.appendChild(option); }); if (currentValue && sortedOperators.includes(currentValue)) { selectElement.value = currentValue; } };
    const populateRentalBrandDropdown = async () => { const rentalBrandSelect = document.getElementById('rental-brand-selection'); const rentalItemSelect = document.getElementById('rental-item-selection'); const quantityAvailableInfo = document.getElementById('quantity-available-info'); const rentalQuantityInput = document.getElementById('rental-quantity'); try { if (!window.db) throw new Error("DB non pronto."); const snapshot = await db.collection("inventory").get(); const inventory = []; snapshot.forEach(doc => inventory.push({ id: doc.id, ...doc.data() })); updateBrandFilters(inventory, rentalBrandSelect, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput); } catch (err) { console.error("Errore lettura inventario per popolare marche:", err); showError("Errore caricamento marche."); if(rentalBrandSelect) rentalBrandSelect.innerHTML = '<option value="">Errore</option>'; if(rentalItemSelect) { rentalItemSelect.innerHTML = '<option value="">-- Errore --</option>'; rentalItemSelect.disabled = true; } } };
    const printSingleRentalReceipt = (rentalDataArray) => { if (!Array.isArray(rentalDataArray) || rentalDataArray.length === 0) { showError("Errore: Dati ricevuta non validi."); return; } const commonData = rentalDataArray[0]; let itemsHtml = ''; rentalDataArray.forEach(item => { itemsHtml += `<div class="receipt-item"><strong>Descrizione:</strong> <span>${escapeHtml(item.itemName)}</span></div><div class="receipt-item"><strong>Quantità:</strong> <span>${escapeHtml(item.quantity)}</span></div>${item.notes ? `<div class="receipt-item"><strong>Note Articolo:</strong> <span>${escapeHtml(item.notes)}</span></div>` : ''}<div style="border-bottom: 1px dotted #eee; margin: 5px 0;"></div>`; }); itemsHtml = itemsHtml.substring(0, itemsHtml.lastIndexOf('<div style="border-bottom')); let receiptHtml = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Ricevuta Noleggio #${commonData.rentalNumber}</title><style>body{font-family:Arial,sans-serif;font-size:11pt;margin:15mm;} .receipt-header{display:flex;align-items:center;gap:20px;margin-bottom:25px;border-bottom:2px solid #000;padding-bottom:15px;} .receipt-header img{max-height:85px;width:auto;flex-shrink:0;} .receipt-header h1{margin:0;font-size:18pt;text-align:left;flex-grow:1;} .receipt-section{margin-bottom:20px; padding-bottom: 15px; border-bottom: 1px dashed #ccc;} .receipt-section:last-of-type { border-bottom: none; } .receipt-section h2 {font-size: 14pt; margin-bottom: 10px; color: #333; } .receipt-item{display: flex; justify-content: space-between; margin-bottom: 8px; line-height:1.5;} .receipt-item strong{font-weight: bold; min-width: 150px; padding-right: 10px;} .receipt-item span{text-align: left; flex-grow: 1;} .receipt-signature { margin-top: 50px; padding-top: 15px; border-top: 1px solid #ccc; } .receipt-signature p { margin-bottom: 40px; } .signature-line { border-bottom: 1px solid #000; width: 70%; margin: 0 auto; } .signature-label { text-align: center; font-size: 9pt; color: #555; margin-top: 5px; } .footer { margin-top: 40px; font-size: 9pt; color: #555; text-align: center; border-top: 1px solid #ccc; padding-top: 15px; } @page{size:A4;margin:15mm;} @media print{body{margin:15mm;font-size:11pt}}</style></head><body><div class="receipt-header"><img src="${LOGO_URL}" alt="Logo CAI Idraulica"><h1>Documento di Noleggio</h1></div><div class="receipt-section"><h2>Dettagli Noleggio</h2><div class="receipt-item"><strong>Numero Noleggio:</strong> <span>${escapeHtml(commonData.rentalNumber || 'N/A')}</span></div><div class="receipt-item"><strong>Data Noleggio:</strong> <span>${formatDate(commonData.startDate)}</span></div><div class="receipt-item"><strong>Magazzino:</strong> <span>${escapeHtml(commonData.warehouse || 'N/D')}</span></div><div class="receipt-item"><strong>Operatore:</strong> <span>${escapeHtml(commonData.operator || 'N/D')}</span></div></div><div class="receipt-section"><h2>Cliente</h2> <div class="receipt-item"><strong>Nominativo:</strong> <span>${escapeHtml(commonData.client)}</span></div></div> <div class="receipt-section"><h2>Articoli Noleggiati</h2> ${itemsHtml} </div> <div class="receipt-signature"><p>Firma per presa visione e accettazione:</p><div class="signature-line"></div><div class="signature-label">(Firma del Cliente)</div></div><div class="footer">Grazie per aver scelto il C.A.I. Consorzio Artigiani Idraulici! <br>Documento generato il: ${new Date().toLocaleString('it-IT')}</div> <script>window.onload=function(){ try { window.print(); window.close(); } catch(e) { console.error('Print failed:', e); } };<\/script></body></html>`; const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(receiptHtml); printWindow.document.close(); } else { showError("Impossibile aprire finestra stampa ricevuta."); } };
    const setDefaultPrintDate = () => { const printMonthSelect = document.getElementById('print-month'); const printYearInput = document.getElementById('print-year'); try { const today = new Date(); const currentMonth = today.getMonth() + 1; const currentYear = today.getFullYear(); if (printMonthSelect) printMonthSelect.value = currentMonth; if (printYearInput) printYearInput.value = currentYear; } catch (err) { console.error("Error setting default print date:", err); } };
    const prepareModalForAdditionalItem = (rentalInfo) => { const rentalNumberOngoingInput = document.getElementById('rental-number-ongoing'); const rentalOperatorSelect = document.getElementById('rental-operator'); const rentalWarehouseSelect = document.getElementById('rental-warehouse'); const rentalClientNameInput = document.getElementById('rental-client-name'); const rentalStartDateInput = document.getElementById('rental-start-date'); const rentalBrandSelect = document.getElementById('rental-brand-selection'); const rentalItemSelect = document.getElementById('rental-item-selection'); const quantityAvailableInfo = document.getElementById('quantity-available-info'); const rentalQuantityInput = document.getElementById('rental-quantity'); const rentalNotesTextarea = document.getElementById('rental-notes'); const rentalModalTitle = document.getElementById('rental-modal-title'); if (!rentalInfo) return; if(rentalNumberOngoingInput) rentalNumberOngoingInput.value = rentalInfo.rentalNumber; if (rentalOperatorSelect) { rentalOperatorSelect.value = rentalInfo.operator; rentalOperatorSelect.disabled = true; } if (rentalWarehouseSelect) { rentalWarehouseSelect.value = rentalInfo.warehouse; rentalWarehouseSelect.disabled = true; } if (rentalClientNameInput) { rentalClientNameInput.value = rentalInfo.client; rentalClientNameInput.disabled = true; } if (rentalStartDateInput) { rentalStartDateInput.value = rentalInfo.startDate; rentalStartDateInput.disabled = true; } if (rentalBrandSelect) rentalBrandSelect.value = ""; populateItemDropdown(null, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput); if (rentalQuantityInput) rentalQuantityInput.value = 1; if (quantityAvailableInfo) quantityAvailableInfo.style.display = 'none'; if (rentalNotesTextarea) rentalNotesTextarea.value = ""; if (rentalModalTitle) rentalModalTitle.textContent = `Aggiungi Articolo a Noleggio #${rentalInfo.rentalNumber}`; openModal('rental-modal'); rentalBrandSelect?.focus(); };

    // --- Main Application Initialization ---
    const initializeApp = async () => {
        console.log("Initializing application...");

        // --- DOM Element References ---
        const inventoryTableBody = document.getElementById('inventory-table')?.querySelector('tbody');
        const activeRentalsTableBody = document.getElementById('active-rentals-table')?.querySelector('tbody');
        const inventorySearchInput = document.getElementById('inventory-search');
        const filterBrandSelect = document.getElementById('filter-brand');
        const filterStatusSelect = document.getElementById('filter-status');
        const newItemBtn = document.getElementById('new-item-btn');
        const newItemModal = document.getElementById('new-item-modal');
        const newItemForm = document.getElementById('new-item-form');
        const editItemModal = document.getElementById('edit-item-modal');
        const editItemForm = document.getElementById('edit-item-form');
        const newRentalBtn = document.getElementById('new-rental-btn');
        const rentalModal = document.getElementById('rental-modal');
        const rentalForm = document.getElementById('new-rental-form');
        const rentalBrandSelect = document.getElementById('rental-brand-selection');
        const rentalItemSelect = document.getElementById('rental-item-selection');
        const rentalQuantityInput = document.getElementById('rental-quantity');
        const quantityAvailableInfo = document.getElementById('quantity-available-info');
        const rentalWarehouseSelect = document.getElementById('rental-warehouse');
        const rentalClientNameInput = document.getElementById('rental-client-name');
        const rentalOperatorSelect = document.getElementById('rental-operator');
        const rentalStartDateInput = document.getElementById('rental-start-date');
        const rentalNotesTextarea = document.getElementById('rental-notes');
        const editRentalModal = document.getElementById('edit-rental-modal');
        const editRentalForm = document.getElementById('edit-rental-form');
        const editRentalIdInput = document.getElementById('edit-rental-id');
        const editRentalOriginalItemIdInput = document.getElementById('edit-rental-original-item-id');
        const editRentalOriginalQuantityInput = document.getElementById('edit-rental-original-quantity');
        const editRentalNumberDisplay = document.getElementById('edit-rental-number-display');
        const editRentalWarehouseDisplay = document.getElementById('edit-rental-warehouse-display');
        const editRentalStartDateDisplay = document.getElementById('edit-rental-startdate-display');
        const editRentalClientNameInput = document.getElementById('edit-rental-client-name');
        const editRentalOperatorSelect = document.getElementById('edit-rental-operator');
        const editRentalBrandSelection = document.getElementById('edit-rental-brand-selection');
        const editRentalItemSelection = document.getElementById('edit-rental-item-selection');
        const editRentalQuantityInput = document.getElementById('edit-rental-quantity');
        const editQuantityAvailableInfo = document.getElementById('edit-quantity-available-info');
        const editRentalNotesTextarea = document.getElementById('edit-rental-notes');
        const allModals = document.querySelectorAll('.modal');
        const exportInventoryBtn = document.getElementById('export-inventory-btn');
        const resetInventoryBtn = document.getElementById('reset-inventory');
        const excelUploadInput = document.getElementById('excel-upload');
        const printRentalsBtn = document.getElementById('print-rentals-btn');
        const printMonthSelect = document.getElementById('print-month');
        const printYearInput = document.getElementById('print-year');
        const resetCompletedBtn = document.getElementById('reset-completed-btn');

        // --- Event Handlers & Actions Setup ---
        try {
            // Modal Close Handlers
            allModals.forEach(modal => { const closeBtn = modal.querySelector('.close-btn'); if(closeBtn) { closeBtn.addEventListener('click', () => closeModal(modal)); } });
            window.addEventListener('click', (event) => { allModals.forEach(modal => { if (event.target == modal) closeModal(modal); }); });

            // --- Inventory Actions ---
            if (excelUploadInput) { excelUploadInput.addEventListener('change', async function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async function(event) { try { const data = new Uint8Array(event.target.result); const workbook = XLSX.read(data, { type: 'array' }); const firstSheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[firstSheetName]; const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); if (jsonData.length < 2) throw new Error("File Excel vuoto o solo intestazione."); const header = jsonData[0].map(h => String(h).trim().toLowerCase()); const brandIndex = header.indexOf('marca'); const nameIndex = header.indexOf('articolo'); const quantityIndex = header.indexOf("quantita'"); const priceIndex = header.indexOf('costo'); const warehouseIndex = header.indexOf('magazzino'); if ([brandIndex, nameIndex, quantityIndex, priceIndex, warehouseIndex].some(index => index === -1)) { throw new Error("Intestazioni mancanti/errate: servono 'marca', 'articolo', 'quantita'', 'costo', 'magazzino'."); } const WAREHOUSES_UPPER = WAREHOUSES.map(w => w.toUpperCase()); const newInventory = jsonData.slice(1).map((row, rowIndex) => { const brand = row[brandIndex] ? String(row[brandIndex]).trim() : null; const name = row[nameIndex] ? String(row[nameIndex]).trim() : null; const totalQuantity = row[quantityIndex] !== undefined && row[quantityIndex] !== null ? parseInt(row[quantityIndex]) : null; const dailyRate = row[priceIndex] !== undefined && row[priceIndex] !== null ? parseFloat(String(row[priceIndex]).replace(',', '.')) : null; const warehouseRaw = row[warehouseIndex] ? String(row[warehouseIndex]).trim() : null; const warehouse = warehouseRaw ? warehouseRaw.toUpperCase() : null; if (!brand || !name || totalQuantity === null || isNaN(totalQuantity) || totalQuantity < 0 || dailyRate === null || isNaN(dailyRate) || dailyRate < 0 || !warehouse) { console.warn(`Riga ${rowIndex + 2}: Dati mancanti/invalidi. Ignorato.`); return null; } if (!WAREHOUSES_UPPER.includes(warehouse)) { console.warn(`Riga ${rowIndex + 2}: Magazzino '${warehouseRaw}' non valido. Ignorato.`); return null; } return { brand: brand, name: name, totalQuantity: totalQuantity, availableQuantity: totalQuantity, dailyRate: dailyRate }; }).filter(item => item !== null); if (newInventory.length === 0) { throw new Error("Nessun articolo valido trovato nel file Excel."); } if (confirm(`Importare ${newInventory.length} articoli? L'inventario corrente verrà SOSTITUITO.`)) { if (!window.db) throw new Error("Firestore non inizializzato."); const batch = db.batch(); const currentInvSnapshot = await db.collection("inventory").get(); currentInvSnapshot.docs.forEach(doc => batch.delete(doc.ref)); newInventory.forEach(item => { const docRef = db.collection("inventory").doc(); batch.set(docRef, item); }); await batch.commit(); loadInventoryData(); alert("Inventario importato con successo."); } } catch (err) { console.error("Error processing Excel file:", err); showError(`Errore importazione Excel: ${err.message}`); } finally { if (excelUploadInput) excelUploadInput.value = ''; } }; reader.onerror = function(event) { console.error("File read error:", event.target.error.code); showError("Impossibile leggere il file."); if (excelUploadInput) excelUploadInput.value = ''; }; reader.readAsArrayBuffer(file); }); }
            if (exportInventoryBtn) { exportInventoryBtn.addEventListener('click', async function() { try { if (!window.db) throw new Error("Firestore non inizializzato."); const snapshot = await db.collection("inventory").get(); const inventory = []; snapshot.forEach(doc => inventory.push({ id: doc.id, ...doc.data() })); if (inventory.length === 0) { showError("Inventario vuoto."); return; } const dataToExport = [ ["marca", "articolo", "quantita'", "costo", "Disponibili"] ]; inventory.forEach(item => { dataToExport.push([ item.brand, item.name, item.totalQuantity, item.dailyRate, item.availableQuantity ]); }); const worksheet = XLSX.utils.aoa_to_sheet(dataToExport); worksheet['!cols'] = [ { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]; const priceColRange = XLSX.utils.decode_range(worksheet['!ref']); for (let R = priceColRange.s.r + 1; R <= priceColRange.e.r; ++R) { const cellRef = XLSX.utils.encode_cell({ c: 3, r: R }); if(!worksheet[cellRef]) continue; worksheet[cellRef].t = 'n'; worksheet[cellRef].z = '#,##0.00 €'; } const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario"); const today = new Date().toISOString().slice(0, 10); XLSX.writeFile(workbook, `Inventario_CAI_${today}.xlsx`); } catch (err) { console.error("Error exporting inventory:", err); showError("Errore esportazione inventario."); } }); }
            if (resetInventoryBtn) { resetInventoryBtn.addEventListener('click', async function() { const activeRentals = getActiveRentalsLS(); if(activeRentals.length > 0) { showError("Impossibile resettare: ci sono noleggi attivi (ancora in localStorage)."); return; } if (confirm("CANCELLARE tutto l'inventario dal database? Azione irreversibile.")) { try { if (!window.db) throw new Error("Firestore non inizializzato."); const snapshot = await db.collection("inventory").get(); const batch = db.batch(); snapshot.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); saveDataLS(RENTAL_COUNTER_LS_KEY, 0); loadInventoryData(); loadRentalData(); alert("Inventario resettato dal database."); } catch (err) { console.error("Error resetting inventory in Firestore:", err); showError("Errore durante il reset dell'inventario nel database."); } } }); }
            [inventorySearchInput, filterBrandSelect, filterStatusSelect].forEach(el => { if (el) { el.addEventListener('input', () => loadInventoryData()); } });
            if (newItemBtn) { newItemBtn.addEventListener('click', () => { if (newItemForm) newItemForm.reset(); openModal('new-item-modal'); document.getElementById('new-item-brand')?.focus(); }); }
            if (newItemForm) { newItemForm.addEventListener('submit', async (e) => { e.preventDefault(); try { const brand = document.getElementById('new-item-brand')?.value.trim(); const name = document.getElementById('new-item-name')?.value.trim(); const quantityInput = document.getElementById('new-item-quantity'); const rateInput = document.getElementById('new-item-daily-rate'); const quantity = quantityInput ? parseInt(quantityInput.value) : null; const dailyRate = rateInput ? parseFloat(rateInput.value) : null; if (!brand || !name || quantity === null || isNaN(quantity) || quantity < 0 || dailyRate === null || isNaN(dailyRate) || dailyRate < 0) { showError('Compila correttamente tutti i campi.'); return; } const newItemData = { brand: brand, name: name, totalQuantity: quantity, availableQuantity: quantity, dailyRate: dailyRate }; if (!window.db) throw new Error("Firestore non inizializzato."); await db.collection("inventory").add(newItemData); console.log("New item added to Firestore"); loadInventoryData(); closeModal(newItemModal); newItemForm.reset(); } catch (err) { console.error("Error adding new item to Firestore:", err); showError("Errore durante l'aggiunta del nuovo articolo al database."); } }); }
            if (inventoryTableBody) { inventoryTableBody.addEventListener('click', async (e) => { if (e.target.closest('.btn-edit-item')) { const button = e.target.closest('.btn-edit-item'); const itemId = button.dataset.id; if (!window.db) { showError("Firestore non inizializzato."); return; } try { const docRef = db.collection("inventory").doc(itemId); const docSnap = await docRef.get(); if (docSnap.exists) { const itemToEdit = { id: docSnap.id, ...docSnap.data() }; if (editItemModal && editItemForm) { document.getElementById('edit-item-id').value = itemToEdit.id; document.getElementById('edit-item-brand').value = itemToEdit.brand; document.getElementById('edit-item-name').value = itemToEdit.name; document.getElementById('edit-item-total-quantity').value = itemToEdit.totalQuantity; document.getElementById('edit-item-available-quantity').value = itemToEdit.availableQuantity; document.getElementById('edit-item-daily-rate').value = itemToEdit.dailyRate; openModal('edit-item-modal'); } else { showError("Errore apertura modal modifica."); } } else { showError("Articolo non trovato nel database."); loadInventoryData(); } } catch (err) { console.error("Error fetching item for edit:", err); showError("Errore nel recupero dati articolo per modifica."); } } else if (e.target.closest('.btn-delete-item')) { const button = e.target.closest('.btn-delete-item'); const itemId = button.dataset.id; if (!window.db) { showError("Firestore non inizializzato."); return; } try { const itemRef = db.collection("inventory").doc(itemId); const docSnap = await itemRef.get(); if (!docSnap.exists) { showError("Articolo già eliminato."); loadInventoryData(); return; } const itemToDeleteData = docSnap.data(); const activeRentals = getActiveRentalsLS(); const isRented = activeRentals.some(rental => rental.itemId === itemId); if (isRented) { showError(`Impossibile eliminare "${itemToDeleteData.brand} ${itemToDeleteData.name}": articolo noleggiato.`); return; } if (confirm(`Eliminare "${itemToDeleteData.brand} ${itemToDeleteData.name}"?`)) { await itemRef.delete(); console.log("Item deleted from Firestore:", itemId); loadInventoryData(); } } catch (err) { console.error("Error deleting item:", err); showError("Errore eliminazione articolo."); } } }); }
            if (editItemForm) { editItemForm.addEventListener('submit', async (e) => { e.preventDefault(); try { const id = document.getElementById('edit-item-id')?.value; const brand = document.getElementById('edit-item-brand')?.value.trim(); const name = document.getElementById('edit-item-name')?.value.trim(); const totalQuantityInput = document.getElementById('edit-item-total-quantity'); const availableQuantityInput = document.getElementById('edit-item-available-quantity'); const dailyRateInput = document.getElementById('edit-item-daily-rate'); const totalQuantity = totalQuantityInput ? parseInt(totalQuantityInput.value) : null; const availableQuantity = availableQuantityInput ? parseInt(availableQuantityInput.value) : null; const dailyRate = dailyRateInput ? parseFloat(dailyRateInput.value) : null; if (!id || !brand || !name || totalQuantity === null || isNaN(totalQuantity) || totalQuantity < 0 || availableQuantity === null || isNaN(availableQuantity) || availableQuantity < 0 || dailyRate === null || isNaN(dailyRate) || dailyRate < 0) { showError('Compila correttamente tutti i campi.'); return; } if (availableQuantity > totalQuantity) { showError('Disponibile non può superare Totale.'); return; } if (!window.db) throw new Error("Firestore non inizializzato."); const itemRef = db.collection("inventory").doc(id); const docSnap = await itemRef.get(); if (!docSnap.exists) { showError("Errore: Articolo originale non trovato nel DB."); return; } const originalItemData = docSnap.data(); const rentedQuantity = (originalItemData.totalQuantity || 0) - (originalItemData.availableQuantity || 0); if (totalQuantity < rentedQuantity) { showError(`Nuova Q.tà Totale (${totalQuantity}) < Q.tà Noleggiata (${rentedQuantity}). Non consentito.`); return; } if (availableQuantity < totalQuantity - rentedQuantity) { showError(`Nuova Q.tà Disponibile (${availableQuantity}) < ${totalQuantity - rentedQuantity} (Totale - Noleggiati). Non consentito.`); return; } const updatedItemData = { brand: brand, name: name, totalQuantity: totalQuantity, availableQuantity: availableQuantity, dailyRate: dailyRate }; await itemRef.update(updatedItemData); console.log("Item updated in Firestore:", id); loadInventoryData(); closeModal(editItemModal); } catch (err) { console.error("Error saving item edits:", err); showError("Errore salvataggio modifiche articolo."); } }); }

            // --- Rental Actions ---
            if (newRentalBtn) { newRentalBtn.addEventListener('click', () => { resetOngoingRentalState(); if (rentalForm) rentalForm.reset(); populateOperatorDropdown(rentalOperatorSelect); populateRentalBrandDropdown(); if (rentalWarehouseSelect) rentalWarehouseSelect.value = ''; const today = new Date().toISOString().split('T')[0]; if (rentalStartDateInput) rentalStartDateInput.value = today; openModal('rental-modal'); rentalOperatorSelect?.focus(); }); }
            if (rentalBrandSelect) { rentalBrandSelect.addEventListener('change', (e) => { populateItemDropdown(e.target.value, rentalItemSelect, quantityAvailableInfo, rentalQuantityInput); }); }
            if (rentalItemSelect) { rentalItemSelect.addEventListener('change', (e) => { const infoElement = quantityAvailableInfo; const selectedOption = e.target.options[e.target.selectedIndex]; const maxQuantity = selectedOption?.dataset.max ? parseInt(selectedOption.dataset.max) : 0; if (rentalQuantityInput) { rentalQuantityInput.max = maxQuantity > 0 ? maxQuantity : null; rentalQuantityInput.value = 1; if (maxQuantity > 0 && infoElement) { infoElement.textContent = `Disponibili: ${maxQuantity}`; infoElement.style.display = 'block'; } else if (infoElement) { infoElement.style.display = 'none'; } } }); }
            if (rentalQuantityInput) { rentalQuantityInput.addEventListener('input', (e) => { const max = parseInt(e.target.max); const currentVal = parseInt(e.target.value); if (!isNaN(max) && !isNaN(currentVal) && currentVal > max) { e.target.value = max; showError(`Quantità massima disponibile: ${max}`); } if (!isNaN(currentVal) && currentVal < 1) { e.target.value = 1; } }); }
            // *** CORRETTO: Submit Nuovo Noleggio ora scrive su Firestore activeRentals ***
            if (rentalForm) { rentalForm.addEventListener('submit', (e) => {
                 e.preventDefault(); try { const operator = rentalOperatorSelect.value; const warehouse = rentalWarehouseSelect.value; const clientName = rentalClientNameInput.value.trim().toUpperCase(); const startDate = rentalStartDateInput.value; const brand = rentalBrandSelect.value; const itemId = rentalItemSelect.value; const quantity = rentalQuantityInput ? parseInt(rentalQuantityInput.value) : 0; const notes = rentalNotesTextarea.value.trim().toUpperCase(); if (!operator || !warehouse || !clientName || !startDate || !brand || !itemId || isNaN(quantity) || quantity < 1) { showError('Completa tutti i campi richiesti.'); return; } if (!window.db) throw new Error("Firestore non inizializzato.");
                 console.log("1. Attempting to rent Item ID:", itemId);
                 db.collection("inventory").doc(itemId).get().then(async docSnap => {
                     console.log("2. Firestore get() completed. Document exists:", docSnap.exists);
                     if (!docSnap.exists) { console.error("   -> Error: Document ID not found in Firestore:", itemId); showError('Articolo selezionato non trovato nel database.'); return; }
                     const selectedItem = { id: docSnap.id, ...docSnap.data() }; console.log("3. Item data retrieved:", selectedItem);
                     if (selectedItem.availableQuantity < quantity) { showError(`Solo ${selectedItem.availableQuantity} di "${selectedItem.name}" disp.`); return; }
                     let currentRentalNumber; let isNewRental = true; if (ongoingRentalInfo && ongoingRentalInfo.rentalNumber) { currentRentalNumber = ongoingRentalInfo.rentalNumber; isNewRental = false; } else { currentRentalNumber = getNextRentalNumber(); ongoingRentalInfo = { rentalNumber: currentRentalNumber, operator: operator, client: clientName, warehouse: warehouse, startDate: startDate }; } console.log("4. Rental Number:", currentRentalNumber, "Is New:", isNewRental);
                     const rentalData = { rentalNumber: currentRentalNumber, itemId: selectedItem.id, /* Usa ID Firestore */ itemName: `${selectedItem.brand} ${selectedItem.name}`, client: clientName, quantity: quantity, startDate: startDate, operator: operator, notes: notes, status: "active", dailyRate: selectedItem.dailyRate, warehouse: warehouse };
                     const itemRef = db.collection("inventory").doc(selectedItem.id);
                     const rentalCollectionRef = db.collection("activeRentals"); // Riferimento alla collezione
                     try {
                         console.log("5. Starting Firestore transaction...");
                         await db.runTransaction(async (transaction) => { console.log("   -> Inside transaction"); const itemDoc = await transaction.get(itemRef); if (!itemDoc.exists) { throw "Articolo non trovato durante la transazione."; } console.log("   -> Item refetched in transaction"); const currentAvail = itemDoc.data().availableQuantity; if (currentAvail < quantity) { throw `Disponibilità cambiata per ${itemDoc.data().name}. Disp: ${currentAvail}`; } console.log("   -> Updating inventory in transaction..."); transaction.update(itemRef, { availableQuantity: currentAvail - quantity }); console.log("   -> Setting new rental in transaction..."); transaction.set(rentalCollectionRef.doc(), rentalData); /* SCRIVE SU FIRESTORE */ console.log("   -> transaction.set called for activeRentals"); });
                         console.log("6. Transaction successful.");
                         // Non serve più salvare su LS
                         // saveActiveRentalsLS([...getActiveRentalsLS(), rental]);
                         await loadInventoryData();
                         await loadRentalData(); // Ora carica da Firestore
                         ongoingRentalInfo = { rentalNumber: currentRentalNumber, operator: operator, client: clientName, warehouse: warehouse, startDate: startDate };
                         console.log("7. Fetching rentals for receipt (from Firestore)..."); // Modificato Log
                         const rentalsSnapshot = await db.collection("activeRentals").where("rentalNumber", "==", currentRentalNumber).get();
                         const currentRentalItems = []; rentalsSnapshot.forEach(doc => currentRentalItems.push({id: doc.id, ...doc.data()}));
                         console.log("   -> Found items for receipt:", currentRentalItems.length);
                         printSingleRentalReceipt(currentRentalItems);
                         if (confirm(`Noleggio #${currentRentalNumber} per ${clientName}\nArticolo "${rentalData.itemName}" aggiunto.\n\nVuoi aggiungere un altro articolo allo stesso noleggio?`)) { prepareModalForAdditionalItem(ongoingRentalInfo); } else { resetOngoingRentalState(); closeModal(rentalModal); }
                     } catch (err) { console.error("Transaction/Operation failed: ", err); showError("Errore DB durante creazione noleggio: " + err); resetOngoingRentalState(); }
                 }).catch(err => { console.error("Error getting item details (initial get):", err); showError("Errore recupero dettagli articolo."); resetOngoingRentalState(); });
                 } catch (err) { console.error("Error in rentalForm submit setup:", err); showError("Errore imprevisto nel form."); resetOngoingRentalState(); }
            }); } // Fine IF rentalForm
            // *** MODIFICATO: Listener tabella noleggi attivi usa Firestore ***
            if (activeRentalsTableBody) { activeRentalsTableBody.addEventListener('click', async (e) => {
                 if (!window.db) { showError("Firestore non inizializzato."); return; } // Controllo DB all'inizio

                 // --- Complete Rental ---
                 if (e.target.closest('.btn-complete-rental')) {
                     const button = e.target.closest('.btn-complete-rental');
                     const rentalDocId = button.dataset.id; // ID del documento Firestore
                     const activeRentalRef = db.collection("activeRentals").doc(rentalDocId);
                     try {
                         const rentalDoc = await activeRentalRef.get();
                         if (!rentalDoc.exists) { showError("Noleggio non trovato nel database."); loadRentalData(); return; }
                         const rentalToComplete = { id: rentalDoc.id, ...rentalDoc.data() }; // Usa ID Firestore come ID temporaneo
                         const today = new Date().toISOString().split('T')[0];
                         const endDate = prompt(`Data fine noleggio per #${rentalToComplete.rentalNumber} (${rentalToComplete.itemName}) (AAAA-MM-GG):`, today);
                         if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
                             const startDateObj = new Date(rentalToComplete.startDate + 'T00:00:00Z');
                             const endDateObj = new Date(endDate + 'T00:00:00Z');
                             if (endDateObj < startDateObj) { showError("Data fine non può precedere data inizio."); return; }
                             const completedRentalData = { ...rentalToComplete, endDate: endDate, status: "completed" };
                             delete completedRentalData.id; // Rimuovi ID temporaneo prima di salvare
                             const itemRef = db.collection("inventory").doc(rentalToComplete.itemId); // Usa itemId letto
                             const batch = db.batch();
                             batch.set(db.collection("completedRentals").doc(), completedRentalData);
                             batch.delete(activeRentalRef);
                             batch.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(rentalToComplete.quantity) });
                             await batch.commit();
                             console.log("Rental moved to completed and inventory updated.");
                             loadInventoryData();
                             loadRentalData();
                         } else if (endDate !== null) { showError("Formato data non valido (AAAA-MM-GG)."); }
                     } catch (err) { console.error("Error completing rental:", err); showError("Errore durante il completamento del noleggio."); }
                 } // Fine Complete Rental

                 // --- Edit Rental (Popolamento Modal) ---
                 else if (e.target.closest('.btn-edit-rental')) {
                     const button = e.target.closest('.btn-edit-rental');
                     const rentalDocId = button.dataset.id; // Firestore document ID
                     try {
                         const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                         const rentalDoc = await rentalRef.get();
                         if (!rentalDoc.exists) { showError("Noleggio non trovato per modifica."); loadRentalData(); return; }
                         const rentalToEdit = { id: rentalDoc.id, ...rentalDoc.data() };
                         if (editRentalModal && editRentalForm) {
                             // Popola campi modal modifica leggendo da rentalToEdit
                             editRentalIdInput.value = rentalToEdit.id;
                             editRentalOriginalItemIdInput.value = rentalToEdit.itemId;
                             editRentalOriginalQuantityInput.value = rentalToEdit.quantity;
                             editRentalNumberDisplay.value = rentalToEdit.rentalNumber || 'N/A';
                             editRentalWarehouseDisplay.value = rentalToEdit.warehouse || 'N/D';
                             editRentalStartDateDisplay.value = formatDate(rentalToEdit.startDate);
                             editRentalClientNameInput.value = rentalToEdit.client;
                             populateOperatorDropdown(editRentalOperatorSelect);
                             editRentalOperatorSelect.value = rentalToEdit.operator || "";
                             editRentalNotesTextarea.value = rentalToEdit.notes || "";
                             // Popola marche/articoli leggendo inventario da DB
                             const inventorySnapshot = await db.collection("inventory").get();
                             const inventoryForEdit = []; inventorySnapshot.forEach(doc => inventoryForEdit.push({id: doc.id, ...doc.data()}));
                             const originalItemDetails = inventoryForEdit.find(i => i.id === rentalToEdit.itemId);
                             updateBrandFilters(inventoryForEdit, editRentalBrandSelection, editRentalItemSelection, editQuantityAvailableInfo, editRentalQuantityInput, rentalToEdit.itemId, rentalToEdit.quantity);
                             if (originalItemDetails) { editRentalBrandSelection.value = originalItemDetails.brand; }
                             editRentalQuantityInput.value = rentalToEdit.quantity;
                             if (editRentalItemSelection.value) { editRentalItemSelection.dispatchEvent(new Event('change')); }
                             openModal('edit-rental-modal');
                         } else { showError("Errore apertura modulo modifica."); }
                     } catch (err) { console.error("Error preparing rental edit:", err); showError("Errore nel caricamento dati per modifica noleggio."); }
                 } // Fine Edit Rental (Popolamento)

                 // --- Reprint Rental ---
                 else if (e.target.closest('.btn-reprint-rental')) {
                     const button = e.target.closest('.btn-reprint-rental');
                     const rentalDocId = button.dataset.id; // Firestore document ID
                     try {
                         const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                         const rentalDoc = await rentalRef.get();
                         if (!rentalDoc.exists) { showError("Noleggio non trovato per ristampa."); loadRentalData(); return; }
                         const rentalToPrint = { id: rentalDoc.id, ...rentalDoc.data() };
                         // Trova tutti gli item con lo stesso numero di noleggio
                         const rentalsSnapshot = await db.collection("activeRentals").where("rentalNumber", "==", rentalToPrint.rentalNumber).get();
                         const allItemsForRental = []; rentalsSnapshot.forEach(doc => allItemsForRental.push({id: doc.id, ...doc.data()}));
                         if(allItemsForRental.length > 0) { printSingleRentalReceipt(allItemsForRental); }
                         else { showError("Nessun articolo trovato per questo numero di noleggio."); }
                     } catch (err) { console.error("Error fetching rentals for reprint:", err); showError("Errore nel recupero dei dati per la ristampa."); }
                 } // Fine Reprint Rental

                 // --- Delete Rental Row ---
                 else if (e.target.closest('.btn-delete-rental')) {
                     const button = e.target.closest('.btn-delete-rental');
                     const rentalDocId = button.dataset.id; // Firestore document ID
                     const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                     try {
                         const rentalDoc = await rentalRef.get();
                         if (!rentalDoc.exists) { showError("Riga noleggio già eliminata."); loadRentalData(); return; }
                         const rentalToDelete = { id: rentalDoc.id, ...rentalDoc.data() };
                         if (confirm(`Annullare riga?\nArticolo: ${rentalToDelete.itemName} (Q: ${rentalToDelete.quantity})\nNoleggio #: ${rentalToDelete.rentalNumber}\n\nL'articolo tornerà disponibile.`)) {
                             const itemRef = db.collection("inventory").doc(rentalToDelete.itemId);
                             const batch = db.batch();
                             batch.update(itemRef, { availableQuantity: firebase.firestore.FieldValue.increment(rentalToDelete.quantity) });
                             batch.delete(rentalRef); // Elimina da activeRentals
                             await batch.commit();
                             console.log("Rental row deleted and inventory updated.");
                             loadInventoryData();
                             loadRentalData(); // Ricarica da Firestore
                         }
                     } catch (err) { console.error("Error deleting rental row:", err); showError("Errore durante l'annullamento della riga di noleggio."); }
                 } // Fine Delete Rental Row
            }); } // Fine IF activeRentalsTableBody

            // --- Edit Rental Modal Interactions ---
            if (editRentalBrandSelection) { editRentalBrandSelection.addEventListener('change', (e) => { const originalItemId = editRentalOriginalItemIdInput.value; const originalQuantity = parseInt(editRentalOriginalQuantityInput.value) || 0; populateItemDropdown(e.target.value, editRentalItemSelection, editQuantityAvailableInfo, editRentalQuantityInput, originalItemId, originalQuantity); }); }
            if (editRentalItemSelection) { editRentalItemSelection.addEventListener('change', (e) => { const selectedOption = e.target.options[e.target.selectedIndex]; const maxQuantity = selectedOption?.dataset.max ? parseInt(selectedOption.dataset.max) : 0; if (editRentalQuantityInput) { editRentalQuantityInput.max = maxQuantity > 0 ? maxQuantity : null; if (editQuantityAvailableInfo) { editQuantityAvailableInfo.textContent = `Disponibili (incl. originale se stesso articolo): ${maxQuantity}`; editQuantityAvailableInfo.style.display = 'block'; } } else if (editQuantityAvailableInfo) { editQuantityAvailableInfo.style.display = 'none'; } }); }
            if (editRentalQuantityInput) { editRentalQuantityInput.addEventListener('input', (e) => { const max = parseInt(e.target.max); const currentVal = parseInt(e.target.value); if (!isNaN(max) && !isNaN(currentVal) && currentVal > max) { e.target.value = max; showError(`Quantità massima disponibile (incl. originale se stesso articolo): ${max}`); } if (!isNaN(currentVal) && currentVal < 1) { e.target.value = 1; } }); }

            // *** MODIFICATO: Submit Modifica Noleggio ora usa Firestore ***
            if(editRentalForm) { editRentalForm.addEventListener('submit', async (e) => {
                 e.preventDefault(); try {
                     const rentalDocId = editRentalIdInput.value; // ID documento Firestore
                     const originalItemId = editRentalOriginalItemIdInput.value;
                     const originalQuantity = parseInt(editRentalOriginalQuantityInput.value) || 0;
                     const newClientName = editRentalClientNameInput.value.trim().toUpperCase();
                     const newOperator = editRentalOperatorSelect.value;
                     const newItemId = editRentalItemSelection.value; // ID Firestore nuovo articolo
                     const newQuantity = editRentalQuantityInput ? parseInt(editRentalQuantityInput.value) : 0;
                     const newNotes = editRentalNotesTextarea.value.trim().toUpperCase();

                     if (!rentalDocId || !newClientName || !newOperator || !newItemId || isNaN(newQuantity) || newQuantity < 1) { showError("Cliente, Operatore, Articolo e Quantità obbligatori."); return; }
                     if (!window.db) throw new Error("Firestore non inizializzato.");

                     const rentalRef = db.collection("activeRentals").doc(rentalDocId);
                     const newItemRef = db.collection("inventory").doc(newItemId);
                     const originalItemRef = db.collection("inventory").doc(originalItemId);

                     await db.runTransaction(async (transaction) => {
                         const rentalDoc = await transaction.get(rentalRef);
                         if (!rentalDoc.exists) throw "Noleggio originale non trovato.";
                         const originalRentalData = rentalDoc.data();

                         const newItemDoc = await transaction.get(newItemRef);
                         if (!newItemDoc.exists) throw "Nuovo articolo non trovato.";
                         const newItemData = newItemDoc.data();

                         let originalItemCurrentStock = 0;
                         if (originalItemId === newItemId) { originalItemCurrentStock = newItemData.availableQuantity; }
                         else { const originalItemDoc = await transaction.get(originalItemRef); if (!originalItemDoc.exists) throw "Articolo inventario originale non trovato."; originalItemCurrentStock = originalItemDoc.data().availableQuantity; }

                         const maxAllowed = newItemData.availableQuantity + (originalItemId === newItemId ? originalQuantity : 0);
                         if (newQuantity > maxAllowed) { throw `Quantità non disponibile per "${newItemData.name}". Max: ${maxAllowed}. Richiesti: ${newQuantity}.`; }

                         // Aggiorna inventario nella transazione
                         if (originalItemId !== newItemId) { transaction.update(originalItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(originalQuantity) }); }
                         transaction.update(newItemRef, { availableQuantity: firebase.firestore.FieldValue.increment(originalItemId === newItemId ? originalQuantity - newQuantity : -newQuantity ) });

                         // Aggiorna riga noleggio attiva
                         transaction.update(rentalRef, { itemId: newItemId, itemName: `${newItemData.brand} ${newItemData.name}`, quantity: newQuantity, dailyRate: newItemData.dailyRate, client: newClientName, operator: newOperator, notes: newNotes });

                         // Aggiornamento client/operator su altre righe omesso per semplicità
                     });

                     console.log("Rental updated and inventory adjusted in Firestore.");
                     loadInventoryData();
                     loadRentalData(); // Ricarica da Firestore
                     closeModal(editRentalModal);
                     alert("Modifiche noleggio salvate.");

                 } catch(err) { console.error("Error saving rental edits:", err); showError("Errore salvataggio modifiche noleggio: " + err); }
            }); } // Fine IF editRentalForm

            // --- Print/History Actions ---
            if (printRentalsBtn) { printRentalsBtn.addEventListener('click', async function() { // Aggiunto async
                 try { const selectedMonth = printMonthSelect ? parseInt(printMonthSelect.value) : 0; const selectedYear = printYearInput ? parseInt(printYearInput.value) : 0; if (isNaN(selectedYear) || selectedYear < 1900 || selectedYear > 2100) { showError("Anno non valido."); printYearInput?.focus(); return; } if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) { showError("Mese non valido."); printMonthSelect?.focus(); return; } if (!window.db) throw new Error("Firestore non inizializzato."); const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1)); const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0)); const startDateString = startDate.toISOString().split('T')[0]; const endDateString = endDate.toISOString().split('T')[0]; const snapshot = await db.collection("completedRentals").where("endDate", ">=", startDateString).where("endDate", "<=", endDateString).orderBy("endDate").orderBy("rentalNumber").get(); const filteredRentals = []; snapshot.forEach(doc => filteredRentals.push({id: doc.id, ...doc.data()})); if (filteredRentals.length === 0) { showError(`Nessun noleggio completato per ${printMonthSelect?.options[printMonthSelect.selectedIndex]?.text || 'mese'} ${selectedYear}.`); return; } const clientRentals = filteredRentals.reduce((acc, rental) => { const clientKey = rental.client || "Cliente Sconosciuto"; if (!acc[clientKey]) acc[clientKey] = []; rental.dailyRate = rental.dailyRate ?? 0; rental.warehouse = rental.warehouse || 'N/D'; rental.operator = rental.operator || 'N/D'; acc[clientKey].push(rental); return acc; }, {}); const sortedClients = Object.keys(clientRentals).sort((a, b) => a.localeCompare(b)); const monthName = printMonthSelect?.options[printMonthSelect.selectedIndex]?.text || `Mese ${selectedMonth}`; let printHtml = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Stampa Noleggi - ${monthName} ${selectedYear}</title><style>body{font-family:Arial,sans-serif;font-size:9pt;margin:15mm} .print-page-header{display:flex;align-items:center;gap:15px;margin-bottom:15px;border-bottom:2px solid #000;padding-bottom:10px;} .print-page-header img{max-height:60px;width:auto;flex-shrink:0;} .print-page-header h1{margin:0;font-size:14pt;text-align:left;flex-grow:1;} h2{font-size:12pt;margin-top:15px;margin-bottom:8px;border-bottom:1px solid #000;padding-bottom:4px;page-break-before:avoid;page-break-after:avoid;} table{width:100%;border-collapse:collapse;margin-top:5px;margin-bottom:12px;font-size:8pt;page-break-inside:auto;} th,td{border:1px solid #ccc;padding:3px 5px;text-align:left;vertical-align:top;word-wrap:break-word;} th{background-color:#eee;font-weight:bold;white-space:nowrap;} .text-right{text-align:right} .text-center{text-align:center} .total-row td{font-weight:bold;border-top:1px solid #000;background-color:#f8f8f8;} .print-info{text-align:center;font-size:8pt;color:#666;margin-bottom:15px} tr{page-break-inside:avoid;page-break-after:auto;} thead{display:table-header-group;} @page{size:A4;margin:15mm;} @media print{body{margin:15mm;font-size:9pt} h2{page-break-before:auto;} button{display:none;}}</style></head><body><div class="print-page-header"><img src="${LOGO_URL}" alt="Logo CAI Idraulica"><h1>Riepilogo Noleggi Completati - ${monthName} ${selectedYear}</h1></div><div class="print-info">Generato il: ${new Date().toLocaleString('it-IT')}</div>`; sortedClients.forEach(client => { printHtml += `<h2>Cliente: ${escapeHtml(client)}</h2><table><thead><tr><th># Noleggio</th><th>Articolo Noleggiato</th><th>Mag. Orig.</th><th>Operatore</th> <th class="text-center">Q.tà</th><th class="text-right">Prezzo Giorn.</th><th>Data Inizio</th><th>Data Fine</th><th class="text-center">Giorni Tot.</th><th class="text-right">Costo Tot.</th><th>Note</th></tr></thead><tbody>`; let clientTotal = 0; const rentalsForClient = clientRentals[client]; rentalsForClient.forEach(rental => { const days = getDaysDifference(rental.startDate, rental.endDate); const totalCost = (rental.dailyRate || 0) * rental.quantity * days; clientTotal += totalCost; printHtml += `<tr><td>${escapeHtml(rental.rentalNumber || 'N/A')}</td><td>${escapeHtml(rental.itemName)}</td><td>${escapeHtml(rental.warehouse)}</td><td>${escapeHtml(rental.operator)}</td> <td class="text-center">${rental.quantity}</td><td class="text-right">${formatPrice(rental.dailyRate)}</td><td>${formatDate(rental.startDate)}</td><td>${formatDate(rental.endDate)}</td><td class="text-center">${days}</td><td class="text-right">${formatPrice(totalCost)}</td><td>${escapeHtml(rental.notes || '')}</td></tr>`; }); printHtml += `<tr class="total-row"><td colspan="9" class="text-right">Totale Cliente (${escapeHtml(client)}):</td><td class="text-right">${formatPrice(clientTotal)}</td><td></td></tr></tbody></table>`; }); printHtml += `<script>window.onload=function(){ try { window.print(); window.close(); } catch(e) { console.error('Print failed:', e); } };<\/script></body></html>`; const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(printHtml); printWindow.document.close(); } else { showError("Impossibile aprire finestra stampa."); } } catch (err) { console.error("Error printing history:", err); showError("Errore preparazione stampa storico."); } }); }
            if (resetCompletedBtn) { resetCompletedBtn.addEventListener('click', async function() { if (confirm("Eliminare TUTTO lo storico noleggi completati dal database? Azione irreversibile.")) { try { if (!window.db) throw new Error("Firestore non inizializzato."); const snapshot = await db.collection("completedRentals").get(); if (snapshot.empty) { alert("Lo storico è già vuoto."); return; } const batch = db.batch(); snapshot.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); updateBillingStats(); alert("Storico resettato dal database."); } catch(err) { console.error("Error resetting completed rentals:", err); showError("Errore durante il reset dello storico."); } } }); }

        } catch (err) {
            console.error("Error setting up initial event listeners:", err);
            showError("Errore critico inizializzazione eventi: " + err.message + (err.stack ? "\n" + err.stack : ""));
        }


        // --- Initial Load ---
        try {
            populateOperatorDropdown(rentalOperatorSelect);
            populateOperatorDropdown(editRentalOperatorSelect);
            await loadInventoryData(); // Attendi caricamento inventario
            await loadRentalData(); // Attendi caricamento noleggi attivi (ora da Firestore)
            setDefaultPrintDate();
            console.log("Application initialized successfully.");
        } catch (err) {
             console.error("Error during application initialization:", err);
             showError("Errore critico avvio applicazione: " + err.message);
        }

    }; // End of initializeApp


    // Run Initialization when DOM is ready
    document.addEventListener("DOMContentLoaded", initializeApp);

})(); // End IIFE