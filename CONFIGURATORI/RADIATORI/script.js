// Aggiungiamo un listener per essere sicuri che la logica parta solo DOPO che auth.js ha finito
document.addEventListener('authReady', () => {

    const db = firebase.firestore();

    // --- Elementi DOM ---
    const addedLocalsContainer = document.getElementById('added-locals-container');
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

    // --- Stato dell'applicazione ---
    let addedLocals = [];
    let radiatorData = {};

    // --- Coefficienti di calcolo ---
    const heatLossCoefficients = {
        RESIDENZIALE_MODERNO: { BUONO: 30, MEDIO: 35, BASSO: 40 },
        RESIDENZIALE_TRADIZIONALE: { BUONO: 35, MEDIO: 40, BASSO: 50 },
        COMMERCIALE: { BUONO: 40, MEDIO: 50, BASSO: 60 },
        VECCHIO_EDIFICIO: { BUONO: 50, MEDIO: 60, BASSO: 75 },
        ALTA_EFFICIENZA: { BUONO: 20, MEDIO: 25, BASSO: 30 }
    };

    // --- EVENT LISTENERS E LOGICA ---

    localTypeSelect.addEventListener('change', () => {
        customLocalNameInput.classList.toggle('hidden', localTypeSelect.value !== 'ALTRO');
    });

    addLocalBtn.addEventListener('click', () => {
        const type = localTypeSelect.value;
        let name = type === 'ALTRO' ? customLocalNameInput.value.trim().toUpperCase() : type;
        const sqm = parseFloat(localSqmInput.value);
        const height = parseFloat(localHeightInput.value);
        
        if (!name || isNaN(sqm) || sqm <= 0) {
            alert('Per favore, compila tipo/nome e metri quadri.');
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
        addedLocals.forEach(local => {
            const div = document.createElement('div');
            div.className = 'local-item';
            div.innerHTML = `<h4>${local.name}</h4> <div class="local-details"><span class="local-sqm">MQ: ${local.sqm}</span><button class="remove-local-btn" data-id="${local.id}">×</button></div>`;
            addedLocalsContainer.appendChild(div);
        });
    }

    function resetAddLocalForm() {
        localTypeSelect.value = '';
        customLocalNameInput.value = '';
        localSqmInput.value = '';
        customLocalNameInput.classList.add('hidden');
    }

    async function loadRadiatorData() {
        // DATI STATICI DI ESEMPIO, DA SOSTITUIRE CON CHIAMATA A FIRESTORE
        radiatorData['IRSAP'] = {
            'TESI 2': { config: '2 Colonne', power: 50.5, price: 15.50 },
            'TESI 3': { config: '3 Colonne', power: 75.2, price: 18.70 },
            'TESI 4': { config: '4 Colonne', power: 95.8, price: 22.30 },
        };
        populateRadiatorModels('IRSAP');
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
        const data = radiatorData[radiatorBrandSelect.value]?.[radiatorModelSelect.value];
        radiatorConfigInput.value = data ? data.config : '';
        radiatorPowerInput.value = data ? data.power : '';
    });

    calculateBtn.addEventListener('click', () => {
        clearError();
        if (addedLocals.length === 0 || !radiatorModelSelect.value) {
            showError("Aggiungi almeno un locale e seleziona un modello di radiatore.");
            return;
        }
        
        const coefficient = heatLossCoefficients[habitationTypeSelect.value]?.[isolationSelect.value] || 40;
        const radiatorInfo = radiatorData[radiatorBrandSelect.value][radiatorModelSelect.value];
        let totalSqm = 0, totalVolume = 0, totalDemand = 0, totalPrice = 0;

        resultsTbody.innerHTML = '';
        addedLocals.forEach(local => {
            const volume = local.sqm * local.height;
            const demand = volume * coefficient;
            const neededElements = Math.ceil(demand / radiatorInfo.power);
            const installedPower = neededElements * radiatorInfo.power;
            
            totalSqm += local.sqm; totalVolume += volume; totalDemand += demand; totalPrice += neededElements * radiatorInfo.price;

            resultsTbody.innerHTML += `<tr><td>${local.name}</td><td>${local.sqm}</td><td>${demand.toFixed(0)}</td><td>${radiatorModelSelect.value}</td><td>${neededElements}</td><td>${installedPower.toFixed(0)}</td></tr>`;
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
});

// Aggiungi questo al tuo script auth.js nella ROOT
// if (user) { 
//   ... 
//   document.dispatchEvent(new Event('authReady')); 
// }
