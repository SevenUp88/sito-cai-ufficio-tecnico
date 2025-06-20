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
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
    });
    window.addEventListener('click', (event) => {
        allModals.forEach(modal => { if (event.target == modal) closeModal(modal); });
    });

    // --- Inventory Management Actions ---
    if (inventorySearchInput) inventorySearchInput.addEventListener('input', () => loadInventoryData());
    if (filterBrandSelect) filterBrandSelect.addEventListener('change', () => loadInventoryData());
    if (filterStatusSelect) filterStatusSelect.addEventListener('change', () => loadInventoryData());

    if (excelUploadInput) {
        excelUploadInput.addEventListener('change', async function (e) {
            if (!isAdmin()) { showError("Azione non consentita."); return; }
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
                    if (requiredHeaders.some(h => header.indexOf(h) === -1)) throw new Error(`Intestazioni mancanti. Servono: ${requiredHeaders.join(', ')}`);
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
                        newInventory.forEach(item => { batch.set(db.collection("inventory").doc(), item); });
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

    if (exportInventoryBtn) {
        exportInventoryBtn.addEventListener('click', async function () {
            try {
                const snapshot = await db.collection("inventory").get();
                const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (inventory.length === 0) return showError("Inventario vuoto.");
                const dataToExport = [["marca", "articolo", "quantita_totale", "disponibili", "costo_giornaliero"]];
                inventory.forEach(item => dataToExport.push([item.brand, item.name, item.totalQuantity, item.availableQuantity, item.dailyRate]));
                const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
                worksheet['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
                const priceColRange = XLSX.utils.decode_range(worksheet['!ref']);
                for (let R = 1; R <= priceColRange.e.r; ++R) {
                    const cellRef = XLSX.utils.encode_cell({ c: 4, r: R });
                    if (worksheet[cellRef]) {
                        worksheet[cellRef].t = 'n';
                        worksheet[cellRef].z = '#,##0.00 €';
                    }
                }
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
                XLSX.writeFile(workbook, `Inventario_CAI_${new Date().toISOString().slice(0, 10)}.xlsx`);
            } catch (err) { console.error("Error exporting inventory:", err); showError("Errore esportazione inventario."); }
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
                    ongoingRentalInfo = { ...ongoingRentalInfo, ...formData };
                } else {
                    currentRentalNumber = getNextRentalNumber();
                    ongoingRentalInfo = { rentalNumber: currentRentalNumber, ...formData };
                }
                
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
}; // End of setupEventListeners

// --- Authentication and Global Setup ---
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
});

window.initializeApp = initializeApp;
window.loadInventoryData = loadInventoryData;
window.loadRentalData = loadRentalData;

})(); // End IIFE
