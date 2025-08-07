// Sostituisci il contenuto del tuo file script.js con questo.

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined' || !window.db) {
        console.error("Firebase non trovato o non inizializzato correttamente.");
        // Potresti aggiungere una gestione dell'errore qui per avvisare l'utente
        return;
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- Selezione Elementi DOM ---
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

    // --- Stato e Dati ---
    let addedLocals = [];
    let radiatorData = {}; // Struttura dati: { MARCA: { MODELLO: { ...dati... } } }

    // Coefficienti di calcolo (esempi, da affinare)
    const heatLossCoefficients = {
        RESIDENZIALE_MODERNO: 30, RESIDENZIALE_TRADIZIONALE: 40,
        COMMERCIALE: 50, VECCHIO_EDIFICIO: 60, ALTA_EFFICIENZA: 25
    };
    const isolationModifiers = { BUONO: 1.0, MEDIO: 1.15, BASSO: 1.3 };

    // --- FUNZIONI E LISTENER ---
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
                        <button class="remove-local-btn" data-id="${local.id}" title="Rimuovi">×</button>
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
        localHeightInput.value = '2.70'; 
        customLocalNameInput.classList.add('hidden');
    }

    // --- FUNZIONE PER CARICARE DATI RADIATORI DA FIRESTORE ---
    async function loadRadiatorData() {
        const brand = radiatorBrandSelect.value; // Assumiamo che la marca sia fissa per ora (IRSAP)
        if (!brand) return;

        try {
            const radiatorsCollection = db.collection('radiatori_tesi'); // Nome della tua collezione Firestore
            const snapshot = await radiatorsCollection.get();

            radiatorData[brand] = {}; // Inizializza la marca se non esiste

            snapshot.forEach(doc => {
                const data = doc.data();
                // Assicurati che i campi nel tuo Firestore corrispondano a questi nomi
                // Es: data.modello, data.columns, data.power, data.price
                if (data.modello && data.columns && data.power && data.price) {
                    radiatorData[brand][data.modello] = {
                        columns: data.columns,
                        power: data.power,
                        price: data.price,
                        // Aggiungi altri campi se li hai (es. height, config_description)
                        config: `${data.columns} Colonne`, // Esempio di come potresti popolare la configurazione
                        height: data.height || 565 // Default height if missing
                    };
                } else {
                    console.warn(`Dati incompleti per il radiatore ${doc.id} nella collezione 'radiatori_tesi'. Campi mancanti?`);
                }
            });

            populateRadiatorModels(brand);
            console.log("Dati radiatori caricati e popolati.");

        } catch (error) {
            console.error("Errore nel caricamento dei dati dei radiatori da Firestore:", error);
            showError("Impossibile caricare i dati dei radiatori. Controlla la console.");
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
            radiatorConfigInput.value = modelData.config || '';
            radiatorPowerInput.value = modelData.power;
        } else {
            radiatorConfigInput.value = 'Seleziona modello';
            radiatorPowerInput.value = 'Seleziona modello';
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
        const radiatorInfo = radiatorData[radiatorBrandSelect.value]?.[modelSelected];

        if (!radiatorInfo) {
            showError("Dati del radiatore non trovati per il modello selezionato.");
            return;
        }

        let totalSqm = 0, totalVolume = 0, totalDemand = 0, totalPrice = 0;

        resultsTbody.innerHTML = '';
        addedLocals.forEach(local => {
            const volume = local.sqm * local.height;
            const demand = volume * coefficient;
            const neededElements = Math.ceil(demand / radiatorInfo.power);
            const installedPower = neededElements * radiatorInfo.power;
            
            totalSqm += local.sqm; 
            totalVolume += volume; 
            totalDemand += demand; 
            totalPrice += neededElements * radiatorInfo.price;

            resultsTbody.innerHTML += `<tr>
                <td>${local.name}</td>
                <td>${local.sqm}</td>
                <td>${demand.toFixed(0)} W</td>
                <td>${modelSelected}</td>
                <td>${neededElements}</td>
                <td>${installedPower.toFixed(0)} W</td>
            </tr>`;
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
    renderAddedLocals(); // Mostra "Nessun locale aggiunto." se la lista è vuota all'inizio
});
