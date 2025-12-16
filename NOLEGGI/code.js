// Wrap everything in an IIFE
(function () {
    'use strict';

    // --- Configuration & Global State ---
    const RENTAL_COUNTER_LS_KEY = "rentalCounter";
    const WAREHOUSES = ["VILLALTA", "SAVIGNANO", "VILLAMARINA"];
    const OPERATORS = [ "GIOVANNI", "LEANDRO", "LUCA", "MASSIMO", "MATTIA", "RAFFAELE", "SEVERINO", "THOMAS"];
    const LOGO_URL = "https://i.postimg.cc/1XQtFBSX/logo-cai-removebg-preview.png";
    const MIN_DAYS_FOR_ATTENTION = 5;

    const SPECIAL_ITEM_IDS = ['TAnSRPuHwm64QoZCzBe0', 'bsQV3qBAgCBXvkGJHHPK', '53']; 
    const SPECIAL_ITEM_SAME_DAY_PRICE = 15.00;
    const SPECIAL_ITEM_EXTRA_DAY_PRICE = 25.00;

    let ongoingRentalInfo = null;
    window.appInitialized = false;

    // --- Utility Functions ---
    const escapeHtml = (unsafe) => { if (typeof unsafe !== 'string') unsafe = String(unsafe); return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/'/g, "'"); };
    const formatPrice = (value) => { const number = parseFloat(value); return isNaN(number) ? 'N/D' : number.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { const parts = dateString.split('-'); if (parts.length !== 3) return dateString; const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); if (isNaN(date.getTime())) return 'Data non valida'; return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date); } catch (e) { console.error("Errore formattazione data:", dateString, e); return 'Errore data'; } };
    const getDaysDifference = (startDate, endDate) => { if (!startDate || !endDate) return 1; try { const start = new Date(startDate + 'T00:00:00Z'); const end = new Date(endDate + 'T00:00:00Z'); if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1; const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()); if (endUTC < startUTC) return 1; const diffTime = endUTC - startUTC; return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; } catch (e) { console.error("Error diff:", startDate, endDate, e); return 1; } };
    const getDaysElapsed = (startDateString) => { if (!startDateString) return 0; try { const startDate = new Date(startDateString + 'T00:00:00Z'); if (isNaN(startDate.getTime())) return 0; const today = new Date(); const todayUTCStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()); const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()); const diffTime = todayUTCStart - startUTC; return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))); } catch (e) { console.error("Error elapsed:", startDateString, e); return 0; } };
    const showError = (message) => { console.error("SHOW_ERROR:", message); alert(`[ERRORE] ${message}`); };

    const isAdmin = () => window.currentUserRole === 'admin';

    // --- LocalStorage ---
    const getDataLS = (key, defaultValue = 0) => { try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : defaultValue; } catch (error) { return defaultValue; } };
    const saveDataLS = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (error) { console.error("Error saving LS:", error); } };
    const getNextRentalNumber = () => { let currentCounter = getDataLS(RENTAL_COUNTER_LS_KEY, 0); if (isNaN(currentCounter)) currentCounter = 0; const nextNumber = currentCounter + 1; saveDataLS(RENTAL_COUNTER_LS_KEY, nextNumber); return nextNumber; };

    // --- Modal ---
    const openModal = (modalId) => { const el = document.getElementById(modalId); if (el) el.style.display = 'block'; };
    const closeModal = (modalElement) => {
        if (!modalElement) return;
        modalElement.style.display = 'none';
        if (modalElement.id === 'rental-modal') resetOngoingRentalState();
    };
    const resetOngoingRentalState = () => {
        ongoingRentalInfo = null;
        const getEl = (id) => document.getElementById(id);
        if (getEl('rental-number-ongoing')) getEl('rental-number-ongoing').value = '';
        if (getEl('rental-operator')) { getEl('rental-operator').value = ''; getEl('rental-operator').disabled = false; }
        if (getEl('rental-warehouse')) { getEl('rental-warehouse').value = ''; getEl('rental-warehouse').disabled = false; }
        if (getEl('rental-client-name')) { getEl('rental-client-name').value = ''; getEl('rental-client-name').disabled = false; }
        if (getEl('rental-start-date')) { getEl('rental-start-date').value = new Date().toISOString().split('T')[0]; getEl('rental-start-date').disabled = false; }
        if (getEl('rental-modal-title')) getEl('rental-modal-title').textContent = "Nuovo Noleggio";
        if (getEl('rental-brand-selection')) getEl('rental-brand-selection').value = '';
        if (getEl('rental-item-selection')) { getEl('rental-item-selection').innerHTML = '<option value="">-- Seleziona Marca --</option>'; getEl('rental-item-selection').disabled = true;}
        if (getEl('rental-notes')) getEl('rental-notes').value = '';
        if (getEl('rental-quantity')) getEl('rental-quantity').value = 1;
        if (getEl('quantity-available-info')) getEl('quantity-available-info').style.display = 'none';
    };

    // --- Data Logic (Uses window.db explicitly) ---
    const updateBillingStats = async () => {
        const statsC = document.getElementById('total-completed');
        const statsCl = document.getElementById('total-clients');
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection("completedRentals").get();
            const completedRentals = []; snapshot.forEach(doc => completedRentals.push(doc.data()));
            const clients = [...new Set(completedRentals.map(r => r.client))];
            if (statsC) statsC.textContent = completedRentals.length;
            if (statsCl) statsCl.textContent = clients.length;
        } catch (err) { console.error("Error stats:", err); }
    };

    const updateInventoryStats = (inventory = []) => { 
        const tot = document.getElementById('total-items'); 
        const avail = document.getElementById('available-items'); 
        if (tot) tot.textContent = inventory.reduce((s, i) => s + (i.totalQuantity || 0), 0); 
        if (avail) avail.textContent = inventory.reduce((s, i) => s + (i.availableQuantity || 0), 0); 
    };
    
    const updateRentalStats = (activeRentals = []) => { 
        const totR = document.getElementById('total-rentals'); 
        const itemsR = document.getElementById('items-rented'); 
        if (totR) totR.textContent = activeRentals.length; 
        if (itemsR) itemsR.textContent = activeRentals.reduce((s, r) => s + (r.quantity || 0), 0); 
    };

    const renderInventoryTable = (inventory) => {
        const tbody = document.querySelector('#inventory-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        // Filters
        const search = document.getElementById('inventory-search')?.value.toLowerCase() || '';
        const fBrand = document.getElementById('filter-brand')?.value || '';
        const fStatus = document.getElementById('filter-status')?.value || '';
        
        const filtered = inventory.filter(i => {
            const matchS = !search || i.name.toLowerCase().includes(search) || i.brand.toLowerCase().includes(search);
            const matchB = !fBrand || i.brand === fBrand;
            const isAvail = i.availableQuantity > 0;
            const matchSt = !fStatus || (fStatus==='available' && isAvail) || (fStatus==='rented' && !isAvail);
            return matchS && matchB && matchSt;
        });

        if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nessun articolo.</td></tr>`; return; }
        
        filtered.forEach(item => {
            const tr = document.createElement('tr');
            const statusBadge = item.availableQuantity > 0 ? '<span class="badge badge-success">Disponibile</span>' : '<span class="badge badge-danger">Esaurito</span>';
            const btns = `<button class="btn btn-sm btn-warning btn-edit-item" data-id="${item.id}"><i class="fas fa-edit"></i></button> ` + 
                         (isAdmin() ? `<button class="btn btn-sm btn-danger btn-delete-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>` : '');
            
            tr.innerHTML = `<td><b>${escapeHtml(item.brand)}</b></td><td>${escapeHtml(item.name)}</td><td class="text-center">${item.totalQuantity}</td><td class="text-center">${item.availableQuantity}</td><td class="text-right">${formatPrice(item.dailyRate)}</td><td>${statusBadge}</td><td class="actions">${btns}</td>`;
            tbody.appendChild(tr);
        });
    };

    const renderActiveRentalsTable = (rentals) => {
        const tbody = document.querySelector('#active-rentals-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!rentals.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nessun noleggio attivo.</td></tr>'; return; }
        
        rentals.forEach(r => {
            const tr = document.createElement('tr');
            const btns = `<button class="btn btn-sm btn-success btn-complete-rental" data-id="${r.id}"><i class="fas fa-check"></i></button> ` +
                         `<button class="btn btn-sm btn-warning btn-edit-rental" data-id="${r.id}"><i class="fas fa-edit"></i></button> ` +
                         `<button class="btn btn-sm btn-primary btn-reprint-rental" data-id="${r.id}"><i class="fas fa-print"></i></button> ` +
                         (isAdmin() ? `<button class="btn btn-sm btn-danger btn-delete-rental" data-id="${r.id}"><i class="fas fa-times"></i></button>` : '');
            
            tr.innerHTML = `<td>${escapeHtml(r.rentalNumber)}</td><td>${escapeHtml(r.itemName)} (${r.quantity})</td><td>${escapeHtml(r.client)}</td><td>${escapeHtml(r.warehouse)}</td><td>${formatDate(r.startDate)}</td><td><span class="badge badge-warning">Attivo</span></td><td class="actions">${btns}</td>`;
            tbody.appendChild(tr);
        });
    };

    const populateItemDropdown = async (brand, select, infoEl, qtyInput, currId, currQty = 0) => {
        if (!select) return;
        select.innerHTML = ''; select.disabled = true;
        if (infoEl) infoEl.style.display = 'none';
        if (qtyInput) { qtyInput.value = 1; qtyInput.max = null; }
        if (!brand) { select.innerHTML = '<option value="">-- Seleziona Marca Prima --</option>'; return; }
        
        try {
            const [invSnap, rentSnap] = await Promise.all([
                window.db.collection("inventory").where("marca", "==", brand).get(),
                window.db.collection("activeRentals").get()
            ]);
            
            const rentedMap = {};
            rentSnap.forEach(d => { const r=d.data(); rentedMap[r.itemId] = (rentedMap[r.itemId]||0) + r.quantity; });
            
            const items = [];
            invSnap.forEach(d => {
                const data=d.data();
                items.push({ id: d.id, name: data.nome, avail: (data.quantita_totale||0) - (rentedMap[d.id]||0) });
            });
            
            const validItems = items.filter(i => i.avail > 0 || i.id === currId);
            if (!validItems.length) { select.innerHTML = '<option disabled>Nessun articolo disponibile</option>'; return; }
            
            select.innerHTML = '<option value="">-- Seleziona Articolo --</option>';
            validItems.forEach(i => {
                const opt = document.createElement('option');
                opt.value = i.id;
                const max = i.avail + (i.id === currId ? currQty : 0);
                opt.dataset.max = max;
                opt.textContent = `${i.name} (${max} disp.)`;
                select.appendChild(opt);
            });
            
            if (currId) select.value = currId;
            select.disabled = false;
            if (select.value) select.dispatchEvent(new Event('change'));
            
        } catch (e) { console.error(e); showError("Errore caricamento articoli."); }
    };

    const updateBrandFilters = (inventory, brandSel, itemSel, infoEl, qtyInput, currId, currQty) => {
        if (!brandSel) return;
        const brands = [...new Set(inventory.map(i => i.brand))].sort();
        const curr = brandSel.value;
        brandSel.innerHTML = brandSel.id === 'filter-brand' ? '<option value="">Tutte le marche</option>' : '<option value="">-- Seleziona Marca --</option>';
        brands.forEach(b => brandSel.add(new Option(b, b)));
        if (curr && brands.includes(curr)) brandSel.value = curr;
        
        if (itemSel && brandSel.value) populateItemDropdown(brandSel.value, itemSel, infoEl, qtyInput, currId, currQty);
        else if (itemSel) { itemSel.innerHTML='<option value="">-- Seleziona Marca Prima --</option>'; itemSel.disabled=true; }
    };

    // --- Core Loaders ---
    const loadInventoryData = async () => {
        if (!window.db) return;
        try {
            const [invSnap, rentSnap] = await Promise.all([ window.db.collection("inventory").get(), window.db.collection("activeRentals").get() ]);
            const rentedMap = {};
            rentSnap.forEach(d => { const r=d.data(); rentedMap[r.itemId] = (rentedMap[r.itemId]||0) + r.quantity; });
            
            const list = [];
            invSnap.forEach(d => {
                const data=d.data();
                list.push({ id: d.id, brand: data.marca, name: data.nome, totalQuantity: data.quantita_totale, dailyRate: data.costo_giornaliero, availableQuantity: (data.quantita_totale||0) - (rentedMap[d.id]||0) });
            });
            
            renderInventoryTable(list);
            updateBrandFilters(list, document.getElementById('filter-brand'));
            updateInventoryStats(list);
        } catch (e) { console.error(e); showError("Errore caricamento inventario."); }
    };

    const loadRentalData = async () => {
        if (!window.db) return;
        try {
            const snap = await window.db.collection("activeRentals").orderBy("startDate", "desc").get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            renderActiveRentalsTable(list);
            updateRentalStats(list);
            // Render Oldest
            const oldList = document.getElementById('oldest-rentals-list');
            if (oldList) {
                const needingAtt = list.filter(r => getDaysElapsed(r.startDate) >= MIN_DAYS_FOR_ATTENTION);
                if (!needingAtt.length) oldList.innerHTML = '<li>Nessun noleggio da verificare.</li>';
                else {
                    oldList.innerHTML = needingAtt.map(r => `<li><span><b>#${r.rentalNumber}</b> ${escapeHtml(r.client)} (${r.itemName})</span><span style="color:#d32f2f;">${getDaysElapsed(r.startDate)} gg</span></li>`).join('');
                }
            }
            updateBillingStats();
        } catch (e) { console.error(e); showError("Errore caricamento noleggi."); }
    };

    // --- Init ---
    const initializeApp = async (role) => {
        if (window.appInitialized) return;
        window.appInitialized = true;
        
        // UI Role Logic
        const isAdminUser = role === 'admin';
        ['reset-inventory', 'reset-completed-btn'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display = isAdminUser ? 'inline-block' : 'none'; });
        const labelExcel = document.querySelector('label[for="excel-upload"]');
        if(labelExcel) labelExcel.style.display = isAdminUser ? 'inline-block' : 'none';

        // Load
        const ops = document.querySelectorAll('#rental-operator, #edit-rental-operator');
        ops.forEach(s => { s.innerHTML='<option value="">-- Seleziona --</option>'; OPERATORS.sort().forEach(o=>s.add(new Option(o,o))); });
        
        await loadInventoryData();
        await loadRentalData();
    };

    // --- Listeners ---
    const setupEventListeners = () => {
        const getEl = (id) => document.getElementById(id);
        
        // Modals Close
        document.querySelectorAll('.modal .close-btn').forEach(b => b.addEventListener('click', e => closeModal(e.target.closest('.modal'))));
        
        // New Item
        getEl('new-item-btn')?.addEventListener('click', () => { getEl('new-item-form').reset(); openModal('new-item-modal'); });
        getEl('new-item-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            try {
                await window.db.collection("inventory").add({
                    marca: getEl('new-item-brand').value.trim(),
                    nome: getEl('new-item-name').value.trim(),
                    quantita_totale: parseInt(getEl('new-item-quantity').value),
                    costo_giornaliero: parseFloat(getEl('new-item-daily-rate').value)
                });
                closeModal(getEl('new-item-modal')); loadInventoryData();
            } catch(err) { showError("Errore creazione articolo."); }
        });
 // Logica Accordion Inventario Completo
    const invHeader = document.getElementById('inventory-header');
    const invBody = document.getElementById('inventory-body');
    const invArrow = document.getElementById('inventory-arrow');

    if (invHeader && invBody && invArrow) {
        invHeader.addEventListener('click', (e) => {
            // Evita che il click sui bottoni "Nuovo" o "Export" attivi la tendina
            if (e.target.closest('button')) return;

            // Toggle visibilità
            if (invBody.classList.contains('hidden')) {
                invBody.classList.remove('hidden'); // Mostra
                invArrow.classList.remove('fa-chevron-right');
                invArrow.classList.add('fa-chevron-down');
            } else {
                invBody.classList.add('hidden'); // Nascondi
                invArrow.classList.remove('fa-chevron-down');
                invArrow.classList.add('fa-chevron-right');
            }
        });
    }
        // New Rental
        getEl('new-rental-btn')?.addEventListener('click', async () => {
            resetOngoingRentalState();
            
            // Populate Brand Select for Rental
            const brandSel = getEl('rental-brand-selection');
            if(brandSel && window.db) {
                const snap = await window.db.collection("inventory").get();
                const inv = []; snap.forEach(d => inv.push({brand: d.data().marca}));
                updateBrandFilters(inv, brandSel, getEl('rental-item-selection'), getEl('quantity-available-info'), getEl('rental-quantity'));
            }
            openModal('rental-modal');
        });

        // Rental Logic (Brands/Items)
        ['rental', 'edit-rental'].forEach(prefix => {
            const brandSel = getEl(`${prefix}-brand-selection`);
            const itemSel = getEl(`${prefix}-item-selection`);
            const qtyIn = getEl(`${prefix}-quantity`);
            const info = getEl(`${prefix === 'rental' ? '' : 'edit-'}quantity-available-info`);
            
            brandSel?.addEventListener('change', e => populateItemDropdown(e.target.value, itemSel, info, qtyIn));
            itemSel?.addEventListener('change', e => {
                const opt = e.target.selectedOptions[0];
                if(opt && qtyIn) {
                    const max = parseInt(opt.dataset.max||0);
                    qtyIn.max = max > 0 ? max : null;
                    if(max>0 && info) { info.textContent=`Disp: ${max}`; info.style.display='block'; }
                }
            });
        });

        // Rental Submit
        getEl('new-rental-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            try {
                const itemID = getEl('rental-item-selection').value;
                const qty = parseInt(getEl('rental-quantity').value);
                const itemSnap = await window.db.collection("inventory").doc(itemID).get();
                
                const data = {
                    rentalNumber: ongoingRentalInfo?.rentalNumber || getNextRentalNumber(),
                    operator: getEl('rental-operator').value,
                    warehouse: getEl('rental-warehouse').value,
                    client: getEl('rental-client-name').value.toUpperCase(),
                    startDate: getEl('rental-start-date').value,
                    itemId: itemID,
                    itemName: `${itemSnap.data().marca} ${itemSnap.data().nome}`,
                    quantity: qty,
                    notes: getEl('rental-notes').value.toUpperCase(),
                    dailyRate: itemSnap.data().costo_giornaliero,
                    status: 'active'
                };
                
                await window.db.collection("activeRentals").add(data);
                closeModal(getEl('rental-modal'));
                loadInventoryData(); loadRentalData();
            } catch(err) { showError("Errore salvataggio noleggio."); }
        });

        // Table Actions (Complete, Edit, Delete)
        document.querySelector('#active-rentals-table tbody')?.addEventListener('click', async e => {
            const btn = e.target.closest('button');
            if(!btn) return;
            const id = btn.dataset.id;
            
            if(btn.classList.contains('btn-complete-rental')) {
                const doc = await window.db.collection("activeRentals").doc(id).get();
                const data = doc.data();
                const end = prompt("Data fine (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                if(end) {
                    const batch = window.db.batch();
                    batch.set(window.db.collection("completedRentals").doc(), { ...data, endDate: end, status: 'completed' });
                    batch.delete(window.db.collection("activeRentals").doc(id));
                    await batch.commit();
                    loadRentalData(); loadInventoryData();
                }
            } else if(btn.classList.contains('btn-delete-rental')) {
                if(isAdmin() && confirm("Eliminare riga?")) {
                    await window.db.collection("activeRentals").doc(id).delete();
                    loadRentalData(); loadInventoryData();
                }
            }
        });
        
        // Filters Change
        getEl('filter-brand')?.addEventListener('change', loadInventoryData);
        getEl('filter-status')?.addEventListener('change', loadInventoryData);
        getEl('inventory-search')?.addEventListener('input', loadInventoryData);
    };

    // --- Boot ---
    document.addEventListener("DOMContentLoaded", setupEventListeners);
    
    // Exports
    window.initializeApp = initializeApp;
    window.loadInventoryData = loadInventoryData;
    window.loadRentalData = loadRentalData;

})();
