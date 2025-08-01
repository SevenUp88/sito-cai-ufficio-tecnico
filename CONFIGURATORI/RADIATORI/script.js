// Sostituisci completamente il tuo script.js con questo.

document.addEventListener('DOMContentLoaded', () => {

    // Attendiamo un brevissimo istante per dare a auth.js il tempo di inizializzare
    setTimeout(() => {
        // Verifichiamo che Firebase sia stato inizializzato
        if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
            console.error("Firebase Auth non è pronto. Lo script dei radiatori non può continuare.");
            alert("Errore di inizializzazione. Ricarica la pagina.");
            return;
        }

        // Se siamo qui, Firebase è pronto
        const db = firebase.firestore();

        // --- Selezione Elementi DOM ---
        const addLocalBtn = document.getElementById('add-local-btn');
        if (!addLocalBtn) {
            console.error("Elemento 'add-local-btn' non trovato. Impossibile continuare.");
            return;
        }
        
        const addedLocalsContainer = document.getElementById('added-locals-container');
        const localTypeSelect = document.getElementById('local-type-select');
        const customLocalNameInput = document.getElementById('custom-local-name');
        const localSqmInput = document.getElementById('local-sqm-input');
        const localHeightInput = document.getElementById('local-height-input');
        
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
        let radiatorData = {};

        const heatLossCoefficients = {
            RESIDENZIALE_MODERNO: 30,
            RESIDENZIALE_TRADIZIONALE: 40,
            COMMERCIALE: 50,
            VECCHIO_EDIFICIO: 60,
            ALTA_EFFICIENZA: 25,
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
                div.innerHTML = `<span>${local.name}</span> <div class="local-details"><span class="local-sqm">MQ: ${local.sqm}</span><button class="remove-local-btn" data-id="${local.id}" title="Rimuovi">×</button></div>`;
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
            radiatorData['IRSAP'] = {
                'TESI 2': { columns: 2, power: 50.5, price: 15.50, height: 565 },
                'TESI 3': { columns: 3, power: 75.2, price: 18.70, height: 565 },
                'TESI 4': { columns: 4, power: 95.8, price: 22.30, height: 565 },
                'TESI 5': { columns: 5, power: 115.1, price: 26.80, height: 565 },
                'TESI 6': { columns: 6, power: 135.0, price: 31.50, height: 565 }
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
            const brand = radiatorBrandSelect.value;
            const modelKey = radiatorModelSelect.value;
            if (brand && modelKey && radiatorData[brand][modelKey]) {
                const modelData = radiatorData[brand][modelKey];
                const numColonne = modelData.columns || modelKey.replace(/[^0-9]/g, ''); 
                radiatorConfigInput.value = `${numColonne} Colonne`;
                radiatorPowerInput.value = modelData.power;
            } else {
                radiatorConfigInput.value = 'Seleziona modello';
                radiatorPowerInput.value = 'Seleziona modello';
            }
        });

        calculateBtn.addEventListener('click', () => {
            clearError();
            if (addedLocals.length === 0 || !radiatorModelSelect.value) {
                showError("Aggiungi almeno un locale e seleziona un modello di radiatore.");
                return;
            }
            
            const baseCoeff = heatLossCoefficients[habitationTypeSelect.value] || 40;
            const isolationMod = isolationModifiers[isolationSelect.value] || 1.15;
            const coefficient = baseCoeff * isolationMod;
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
        
        loadRadiatorData();
        
    }, 100); // 100ms di ritardo per sicurezza
});
