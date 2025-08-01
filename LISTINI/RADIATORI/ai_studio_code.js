document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase non trovato. Lo script della pagina radiatori non può partire.");
        return;
    }
    const db = firebase.firestore(); // Supponendo che db sia disponibile globalmente dopo auth.js

    // --- Selezione Elementi DOM ---
    const localTypeSelect = document.getElementById('local-type-select');
    const customLocalNameInput = document.getElementById('custom-local-name');
    const localSqmInput = document.getElementById('local-sqm-input');
    const localHeightInput = document.getElementById('local-height-input');
    const addLocalBtn = document.getElementById('add-local-btn');

    const habitationTypeSelect = document.getElementById('habitation-type');
    const isolationSelect = document.getElementById('habitation-isolation');
    const designTempInput = document.getElementById('design-temperature-input');
    const outsideTempInput = document.getElementById('outside-design-temp-input');

    const radiatorBrandSelect = document.getElementById('radiator-brand');
    const radiatorModelSelect = document.getElementById('radiator-model');
    const radiatorConfigInput = document.getElementById('radiator-element-config');
    const radiatorPowerInput = document.getElementById('radiator-element-power-base');

    const calculateBtn = document.getElementById('calculate-radiator-system');
    const resultsContainer = document.getElementById('calculation-results');
    const resultsTbody = document.getElementById('results-tbody');
    const totalSqmSpan = document.getElementById('total-habitation-sqm');
    const totalVolumeSpan = document.getElementById('total-habitation-volume');
    const totalDemandSpan = document.getElementById('total-habitation-demand');
    const totalPriceSpan = document.getElementById('estimated-total-price');
    const errorDiv = document.getElementById('calculation-error');

    // --- Stato e Dati ---
    let addedLocals = [];
    let radiatorData = {}; // Dove caricheremo i dati dei radiatori

    // Coefficienti di calcolo (usiamo valori medi, da affinare con dati reali)
    const heatLossCoefficients = {
        RESIDENZIALE_MODERNO: 30, RESIDENZIALE_TRADIZIONALE: 40,
        COMMERCIALE: 50, VECCHIO_EDIFICIO: 60, ALTA_EFFICIENZA: 25
    };
    const isolationModifiers = { BUONO: 1.0, MEDIO: 1.15, BASSO: 1.3 };

    // --- FUNZIONI ---
    localTypeSelect.addEventListener('change', () => {
        customLocalNameInput.classList.toggle('hidden', localTypeSelect.value !== 'ALTRO');
    });

    addLocalBtn.addEventListener('click', () => {
        const type = localTypeSelect.value;
        let name = type === 'ALTRO' ? customLocalNameInput.value.trim().toUpperCase() : type;
        const sqm = parseFloat(localSqmInput.value);
        const height = parseFloat(localHeightInput.value);
        
        if (!name || isNaN(sqm) || sqm <= 0 || isNaN(height) || height <= 0) {
            alert('Per favore, compila tipo/nome locale, metri quadri e altezza.');
            return;
        }
        addedLocals.push({ id: Date.now(), name, sqm, height });
        renderAddedLocals();
        resetAddLocalForm();
    });
    
    addedLocalsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-local-btn');
        if (btn) {
            const idToRemove = parseInt(btn.dataset.id, 10);
            addedLocals = addedLocals.filter(local => local.id !== idToRemove);
            renderAddedLocals();
        }
    });

    function renderAddedLocals() {
        addedLocalsContainer.innerHTML = '';
        if (addedLocals.length === 0) {
            addedLocalsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-style: italic;">Nessun locale aggiunto.</p>';
        } else {
            addedLocals.forEach(local => {
                const div = document.createElement('div');
                div.className = 'local-item';
                div.innerHTML = `
                    <span>${local.name}</span> 
                    <div class="local-details">
                        <span class="local-sqm">MQ: ${local.sqm}</span>
                        <button class="remove-local-btn" data-id="${local.id}" title="Rimuovi">&times;</button>
                    </div>
                `;
                addedLocalsContainer.appendChild(div);
            });
        }
    }
    
    function resetAddLocalForm() {
        localTypeSelect.value = '';
        customLocalNameInput.value = '';
        localSqmInput.value = '';
        localHeightInput.value = '2.70'; // Reset altezza al default
        customLocalNameInput.classList.add('hidden');
    }

    async function loadRadiatorData() {
        try {
            // DATI STATICI DI ESEMPIO PER IRSAP TESI
            // Sostituisci con la tua chiamata a Firestore per caricare i dati reali dei radiatori
            radiatorData['IRSAP'] = {
                'TESI 2': { columns: 2, power: 50.5, price: 15.50, height: 565 },
                'TESI 3': { columns: 3, power: 75.2, price: 18.70, height: 565 },
                'TESI 4': { columns: 4, power: 95.8, price: 22.30, height: 565 },
                'TESI 5': { columns: 5, power: 115.1, price: 26.80, height: 565 },
                'TESI 6': { columns: 6, power: 135.0, price: 31.50, height: 565 },
                'TESI 7': { columns: 7, power: 155.0, price: 35.20, height: 565 },
                'TESI 8': { columns: 8, power: 175.0, price: 39.00, height: 565 }
            };
            populateRadiatorModels('IRSAP');
        } catch(error) {
            console.error("Errore caricamento dati radiatori:", error);
            showError("Impossibile caricare i dati dei radiatori.");
        }
    }

    function populateRadiatorModels(brand) {
        radiatorModelSelect.innerHTML = '<option value="">Seleziona modello...</option>';
        if (radiatorData[brand]) {
            Object.keys(radiatorData[brand]).forEach(model => {
                radiatorModelSelect.innerHTML += `<option value="${model}">${model}</option>`;
            });
        }
    }

    radiatorModelSelect.addEventListener('change', () => {
        const brand = radiatorBrandSelect.value;
        const modelKey = radiatorModelSelect.value;
        const modelData = radiatorData[brand]?.[modelKey];
        
        if (modelData) {
            const numColonne = modelData.columns; // Prendi le colonne dal dato
            radiatorConfigInput.value = `${numColonne} Colonne`;
            radiatorPowerInput.value = modelData.power;
        } else {
            radiatorConfigInput.value = '';
            radiatorPowerInput.value = '';
        }
    });

    calculateBtn.addEventListener('click', () => {
        clearError();
        if (addedLocals.length === 0) {
            showError("Aggiungi almeno un locale.");
            return;
        }
        const modelSelected = radiatorModelSelect.value;
        if (!modelSelected) {
            showError("Seleziona un modello di radiatore.");
            return;
        }

        const habitationType = habitationTypeSelect.value;
        const isolationLevel = isolationSelect.value;
        const targetTemp = parseFloat(designTempInput.value);
        const outsideTemp = parseFloat(outsideTempInput.value);
        
        const baseCoeff = heatLossCoefficients[habitationType] || 40;
        const isolationMod = isolationModifiers[isolationLevel] || 1.15;
        const coefficient = baseCoeff * isolationMod;
        const radiatorInfo = radiatorData[radiatorBrandSelect.value][modelSelected];

        let totalSqm = 0, totalVolume = 0, totalDemand = 0, totalPrice = 0;

        resultsTbody.innerHTML = '';
        addedLocals.forEach(local => {
            const volume = local.sqm * local.height;
            const demand = volume * coefficient;
            const neededElements = Math.ceil(demand / radiatorInfo.power);
            const installedPower = neededElements * radiatorInfo.power;
            
            totalSqm += local.sqm; totalVolume += volume; totalDemand += demand; totalPrice += neededElements * radiatorInfo.price;
            resultsTbody.innerHTML += `<tr><td>${local.name}</td><td>${local.sqm}</td><td>${demand.toFixed(0)}</td><td>${modelSelected}</td><td>${neededElements}</td><td>${installedPower.toFixed(0)}</td></tr>`;
        });

        totalSqmSpan.textContent = `${totalSqm.toFixed(1)} mq`;
        totalVolumeSpan.textContent = `${totalVolume.toFixed(1)} m³`;
        totalDemandSpan.textContent = `${totalDemand.toFixed(0)} W`;
        totalPriceSpan.textContent = `€ ${totalPrice.toFixed(2)}`;
        resultsContainer.classList.remove('hidden');
    });

    function showError(message) { errorDiv.textContent = message; errorDiv.classList.remove('hidden'); }
    function clearError() { errorDiv.textContent = ''; errorDiv.classList.add('hidden'); }
    
    // Inizializzazione pagina
    loadRadiatorData();
    renderAddedLocals(); // Assicura che venga mostrato il messaggio "Nessun locale aggiunto." all'inizio
});