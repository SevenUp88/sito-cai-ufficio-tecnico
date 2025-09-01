document.addEventListener('DOMContentLoaded', () => {

    // --- DATABASE PRODOTTI ---
    const radiatorCatalog = {
        "IRSAP": {
            "TESI 2": [
                { id: 5, altezza: 565, watt: 40.9, prezzo: 15.9 }, { id: 18, altezza: 1000, watt: 69.2, prezzo: 22.1 },
                { id: 19, altezza: 1200, watt: 82.5, prezzo: 26.1 }, { id: 20, altezza: 1500, watt: 103.0, prezzo: 34.8 },
                { id: 22, altezza: 1800, watt: 124.3, prezzo: 40.4 }, { id: 24, altezza: 2000, watt: 139.0, prezzo: 43.2 },
                { id: 26, altezza: 2200, watt: 154.2, prezzo: 52.6 }, { id: 27, altezza: 2500, watt: 177.8, prezzo: 58.6 }
            ],
            "TESI 3": [
                { id: 32, altezza: 565, watt: 57.4, prezzo: 17.0 }, { id: 45, altezza: 1000, watt: 96.8, prezzo: 26.7 },
                { id: 46, altezza: 1200, watt: 114.8, prezzo: 32.9 }, { id: 47, altezza: 1500, watt: 141.7, prezzo: 44.2 },
                { id: 49, altezza: 1800, watt: 168.9, prezzo: 52.6 }, { id: 51, altezza: 2000, watt: 187.2, prezzo: 58.5 },
                { id: 53, altezza: 2200, watt: 205.7, prezzo: 68.7 }, { id: 54, altezza: 2500, watt: 233.7, prezzo: 74.9 }
            ],
            "TESI 4": [
                { id: 59, altezza: 565, watt: 74.8, prezzo: 19.6 }, { id: 72, altezza: 1000, watt: 125.9, prezzo: 31.9 },
                { id: 73, altezza: 1200, watt: 148.8, prezzo: 40.3 }, { id: 74, altezza: 1500, watt: 182.6, prezzo: 54.4 },
                { id: 76, altezza: 1800, watt: 216.0, prezzo: 65.3 }, { id: 78, altezza: 2000, watt: 238.1, prezzo: 71.6 },
                { id: 80, altezza: 2200, watt: 260.0, prezzo: 83.7 }, { id: 81, altezza: 2500, watt: 292.8, prezzo: 91.0 }
            ],
            "TESI 5": [
                { id: 86, altezza: 565, watt: 90.8, prezzo: 31.0 }, { id: 95, altezza: 1000, watt: 152.4, prezzo: 42.9 },
                { id: 96, altezza: 1200, watt: 180.0, prezzo: 51.5 }, { id: 97, altezza: 1500, watt: 220.9, prezzo: 69.2 },
                { id: 98, altezza: 1800, watt: 261.3, prezzo: 83.4 }, { id: 99, altezza: 2000, watt: 288.0, prezzo: 92.4 },
                { id: 100, altezza: 2200, watt: 317.7, prezzo: 102.8 }, { id: 101, altezza: 2500, watt: 354.5, prezzo: 112.5 }
            ],
            "TESI 6": [
                { id: 106, altezza: 565, watt: 106.9, prezzo: 36.3 }, { id: 115, altezza: 1000, watt: 178.9, prezzo: 53.2 },
                { id: 116, altezza: 1200, watt: 211.2, prezzo: 64.9 }, { id: 117, altezza: 1500, watt: 259.1, prezzo: 84.9 },
                { id: 118, altezza: 1800, watt: 306.5, prezzo: 101.9 }, { id: 119, altezza: 2000, watt: 337.9, prezzo: 113.0 },
                { id: 120, altezza: 2200, watt: 369.3, prezzo: 122.9 }, { id: 121, altezza: 2500, watt: 416.2, prezzo: 137.0 }
            ]
        }
    };

    let addedLocals = [];

    const heatLossCoefficients = {
        RESIDENZIALE_MODERNO: 30, RESIDENZIALE_TRADIZIONALE: 40,
        VECCHIO_EDIFICIO: 55, ALTA_EFFICIENZA: 25,
    };
    const SCONTO_VENDITA = -0.40;

    const localTypeSelect = document.getElementById('local-type-select');
    const customNameContainer = document.getElementById('custom-local-name-container');
    const customNameInput = document.getElementById('custom-local-name-input');
    const localSqmInput = document.getElementById('local-sqm-input');
    const localHeightInput = document.getElementById('local-height-input');
    const addLocalBtn = document.getElementById('add-local-btn');
    const addedLocalsList = document.getElementById('added-locals-list');
    const brandSelect = document.getElementById('radiator-brand');
    const modelSelect = document.getElementById('radiator-model');
    const heightSelect = document.getElementById('radiator-height');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsContainer = document.getElementById('results-container');
    const errorDiv = document.getElementById('error-message');

    function populateModels() {
        const models = Object.keys(radiatorCatalog.IRSAP);
        modelSelect.innerHTML = '<option value="">Seleziona...</option>';
        heightSelect.innerHTML = '<option value="">...</option>';
        heightSelect.disabled = true;
        models.forEach(model => modelSelect.innerHTML += `<option value="${model}">${model}</option>`);
        modelSelect.disabled = false;
    }

    function populateHeights() {
        const model = modelSelect.value;
        const heights = radiatorCatalog.IRSAP[model] || [];
        heightSelect.innerHTML = '<option value="">Seleziona...</option>';
        if (heights.length > 0) {
            heights.forEach(v => heightSelect.innerHTML += `<option value="${v.id}">${v.altezza} mm</option>`);
            heightSelect.disabled = false;
        } else {
            heightSelect.disabled = true;
        }
    }

    function renderAddedLocals() {
        addedLocalsList.innerHTML = '';
        if (addedLocals.length === 0) {
            addedLocalsList.innerHTML = '<p class="empty-list-msg">Nessuna stanza ancora aggiunta.</p>';
            return;
        }
        addedLocals.forEach(local => {
            const div = document.createElement('div');
            div.className = 'local-item';
            div.innerHTML = `
                <div class="local-item-info">
                    <strong>${local.name} (${local.sqm} mq)</strong>
                    <span class="radiator-details">${local.radiatorInfo}</span>
                </div>
                <button class="remove-local-btn" data-id="${local.id}" title="Rimuovi">×</button>
            `;
            addedLocalsList.appendChild(div);
        });
    }

    function resetAddForm() {
        localTypeSelect.value = '';
        customNameInput.value = '';
        customNameContainer.classList.add('hidden');
        localSqmInput.value = '';
        modelSelect.value = '';
        heightSelect.innerHTML = '<option value="">...</option>';
        heightSelect.disabled = true;
    }
    
    function handleAddLocal() {
        const type = localTypeSelect.value;
        let name = type;
        if (type === 'ALTRO') {
            name = customNameInput.value.trim();
        }

        const sqm = parseFloat(localSqmInput.value);
        const roomHeight = parseFloat(localHeightInput.value);
        const radiatorId = parseInt(heightSelect.value, 10);
        const model = modelSelect.value;

        if (!name || !sqm || !roomHeight) { return alert('Compila tutti i dati della stanza.'); }
        if (!radiatorId) { return alert('Seleziona un modello e un\'altezza per il radiatore.'); }

        const radiator = radiatorCatalog.IRSAP[model].find(r => r.id === radiatorId);
        
        addedLocals.push({
            id: Date.now(), name, sqm, roomHeight, radiatorId, model,
            radiatorInfo: `Radiatore: IRSAP ${model} (H: ${radiator.altezza}mm)`
        });
        
        renderAddedLocals();
        resetAddForm();
    }

    function handleCalculate() {
        resultsContainer.classList.add('hidden');
        errorDiv.classList.add('hidden');

        if (addedLocals.length === 0) {
            errorDiv.textContent = "Aggiungi almeno una stanza prima di calcolare il preventivo.";
            errorDiv.classList.remove('hidden');
            resultsContainer.classList.remove('hidden');
            return;
        }

        const habitationType = document.getElementById('habitation-type').value;
        const coefficient = heatLossCoefficients[habitationType];
        
        let totalDemand = 0;
        let totalPrice = 0;
        const resultsTbody = document.getElementById('results-tbody');
        resultsTbody.innerHTML = '';

        addedLocals.forEach(local => {
            const radiator = radiatorCatalog.IRSAP[local.model].find(r => r.id === local.radiatorId);
            const volume = local.sqm * local.roomHeight;
            const demand = volume * coefficient;
            const neededElements = Math.ceil(demand / radiator.watt);
            const roomPrice = neededElements * radiator.prezzo * (1 + SCONTO_VENDITA);

            totalDemand += demand;
            totalPrice += roomPrice;

            resultsTbody.innerHTML += `
                <tr>
                    <td>${local.name}</td>
                    <td>${local.radiatorInfo.replace('Radiatore: ', '')}</td>
                    <td>${demand.toFixed(0)} W</td>
                    <td>${neededElements}</td>
                    <td>€ ${roomPrice.toFixed(2)}</td>
                </tr>
            `;
        });

        document.getElementById('total-demand').textContent = `${totalDemand.toFixed(0)} W`;
        document.getElementById('total-price').textContent = `€ ${totalPrice.toFixed(2)}`;
        resultsContainer.classList.remove('hidden');
    }

    localTypeSelect.addEventListener('change', () => {
        if (localTypeSelect.value === 'ALTRO') {
            customNameContainer.classList.remove('hidden');
            customNameInput.focus();
        } else {
            customNameContainer.classList.add('hidden');
        }
    });

    modelSelect.addEventListener('change', populateHeights);
    addLocalBtn.addEventListener('click', handleAddLocal);
    calculateBtn.addEventListener('click', handleCalculate);
    
    addedLocalsList.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-local-btn');
        if (btn) {
            const idToRemove = parseInt(btn.dataset.id, 10);
            addedLocals = addedLocals.filter(local => local.id !== idToRemove);
            renderAddedLocals();
        }
    });

    populateModels();
    renderAddedLocals();
});
