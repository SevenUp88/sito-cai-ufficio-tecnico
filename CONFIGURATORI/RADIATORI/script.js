document.addEventListener('DOMContentLoaded', () => {
    // Verifica che l'utente sia autenticato prima di procedere
    // La logica in auth.js dovrebbe gestire il redirect se non lo è.
    if (typeof firebase === 'undefined') {
        console.error("Firebase non è stato caricato. Assicurati che gli script siano nel posto giusto.");
        return;
    }

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
    let radiatorData = {}; // Conterrà i dati dei radiatori caricati da Firestore

    // --- Coefficienti di calcolo (esempi, da affinare) ---
    const heatLossCoefficients = {
        RESIDENZIALE_MODERNO: { BUONO: 30, MEDIO: 35, BASSO: 40 },
        RESIDENZIALE_TRADIZIONALE: { BUONO: 35, MEDIO: 40, BASSO: 50 },
        COMMERCIALE: { BUONO: 40, MEDIO: 50, BASSO: 60 },
        VECCHIO_EDIFICIO: { BUONO: 50, MEDIO: 60, BASSO: 75 },
        ALTA_EFFICIENZA: { BUONO: 20, MEDIO: 25, BASSO: 30 }
    };

    // --- FUNZIONI ---

    // Mostra/nasconde il campo per il nome personalizzato
    localTypeSelect.addEventListener('change', () => {
        customLocalNameInput.classList.toggle('hidden', localTypeSelect.value !== 'ALTRO');
    });

    // Aggiunge un locale alla lista
    addLocalBtn.addEventListener('click', () => {
        const type = localTypeSelect.value;
        const sqm = parseFloat(localSqmInput.value);
        const height = parseFloat(localHeightInput.value);
        let name = type === 'ALTRO' ? customLocalNameInput.value.trim().toUpperCase() : type;

        if ((type === '' && name === '') || isNaN(sqm) || sqm <= 0) {
            alert('Per favore, compila tipo/nome e metri quadri.');
            return;
        }

        const newLocal = { id: Date.now(), name, sqm, height };
        addedLocals.push(newLocal);
        renderAddedLocals();
        resetAddLocalForm();
    });

    // Renderizza la lista dei locali aggiunti
    function renderAddedLocals() {
        addedLocalsContainer.innerHTML = '';
        addedLocals.forEach(local => {
            const localDiv = document.createElement('div');
            localDiv.className = 'local-item';
            localDiv.innerHTML = `
                <h4>${local.name}</h4>
                <div class="local-details">
                    <span class="local-sqm">MQ: ${local.sqm}</span>
                    <button class="remove-local-btn" data-id="${local.id}"><i class="fas fa-times"></i></button>
                </div>
            `;
            addedLocalsContainer.appendChild(localDiv);
        });
    }
    
    // Rimuove un locale dalla lista
    addedLocalsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-local-btn')) {
            const btn = e.target.closest('.remove-local-btn');
            const idToRemove = parseInt(btn.dataset.id, 10);
            addedLocals = addedLocals.filter(local => local.id !== idToRemove);
            renderAddedLocals();
        }
    });

    // Resetta il form di aggiunta locale
    function resetAddLocalForm() {
        localTypeSelect.value = '';
        customLocalNameInput.value = '';
        localSqmInput.value = '';
        customLocalNameInput.classList.add('hidden');
    }

    // Carica i dati dei radiatori (es. da Firestore)
    async function loadRadiatorData() {
        try {
            // Esempio con dati statici. Sostituisci con la tua chiamata a Firestore.
            // await db.collection('radiatoriIrsap').get()...
            radiatorData['IRSAP'] = {
                'TESI 2': { config: '2 Colonne', power: 50.5, price: 15.50 },
                'TESI 3': { config: '3 Colonne', power: 75.2, price: 18.70 },
                'TESI 4': { config: '4 Colonne', power: 95.8, price: 22.30 },
            };
            populateRadiatorModels('IRSAP');
        } catch (err) {
            console.error("Errore caricamento dati radiatori:", err);
            showError("Impossibile caricare i dati dei radiatori.");
        }
    }

    // Popola i modelli di radiatore in base alla marca
    function populateRadiatorModels(brand) {
        radiatorModelSelect.innerHTML = '<option value="">Seleziona modello...</option>';
        if (radiatorData[brand]) {
            Object.keys(radiatorData[brand]).forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                radiatorModelSelect.appendChild(option);
            });
        }
    }

    // Aggiorna i campi quando un modello viene selezionato
    radiatorModelSelect.addEventListener('change', () => {
        const brand = radiatorBrandSelect.value;
        const model = radiatorModelSelect.value;
        if (brand && model && radiatorData[brand][model]) {
            const data = radiatorData[brand][model];
            radiatorConfigInput.value = data.config;
            radiatorPowerInput.value = data.power;
        } else {
            radiatorConfigInput.value = '';
            radiatorPowerInput.value = '';
        }
    });

    // Funzione principale di calcolo
    calculateBtn.addEventListener('click', () => {
        clearError();
        if (addedLocals.length === 0) {
            showError("Aggiungi almeno un locale per procedere.");
            return;
        }
        const selectedModel = radiatorModelSelect.value;
        if (!selectedModel) {
            showError("Seleziona un modello di radiatore.");
            return;
        }

        const habitationType = habitationTypeSelect.value;
        const isolationLevel = isolationSelect.value;
        const targetTemp = parseFloat(designTempInput.value);
        const outsideTemp = parseFloat(outsideTempInput.value);
        
        const coefficient = heatLossCoefficients[habitationType]?.[isolationLevel] || 40; // Fallback a 40 W/m³
        const deltaT = targetTemp - outsideTemp;
        
        const radiatorInfo = radiatorData[radiatorBrandSelect.value][selectedModel];

        let totalSqm = 0;
        let totalVolume = 0;
        let totalDemand = 0;
        let totalPrice = 0;

        resultsTbody.innerHTML = '';

        addedLocals.forEach(local => {
            const volume = local.sqm * local.height;
            // Calcolo del fabbisogno in Watt: Volume * Coeff * DeltaT / 1000 (se coeff è in W/m³K) - semplificato
            const demand = volume * coefficient;

            const neededElements = Math.ceil(demand / radiatorInfo.power);
            const installedPower = neededElements * radiatorInfo.power;
            const roomPrice = neededElements * radiatorInfo.price;

            totalSqm += local.sqm;
            totalVolume += volume;
            totalDemand += demand;
            totalPrice += roomPrice;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${local.name}</td>
                <td>${local.sqm.toFixed(2)}</td>
                <td>${demand.toFixed(0)}</td>
                <td>${selectedModel} - ${radiatorInfo.config}</td>
                <td>${neededElements}</td>
                <td>${installedPower.toFixed(0)}</td>
            `;
            resultsTbody.appendChild(row);
        });

        // Mostra i risultati
        totalSqmSpan.textContent = `${totalSqm.toFixed(2)} mq`;
        totalVolumeSpan.textContent = `${totalVolume.toFixed(2)} m³`;
        totalDemandSpan.textContent = `${totalDemand.toFixed(0)} W`;
        totalPriceSpan.textContent = `€ ${totalPrice.toFixed(2)}`;
        resultsContainer.classList.remove('hidden');
    });

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    function clearError() {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
    }

    // --- Inizializzazione pagina ---
    loadRadiatorData();
});
