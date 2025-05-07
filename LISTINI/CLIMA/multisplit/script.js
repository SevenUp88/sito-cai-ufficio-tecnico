document.addEventListener('DOMContentLoaded', async () => {
    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = {
        brands: [ // Corrispondono a 'marca' CSV (case insensitive)
            { id: "haier", name: "Haier", logo: "img/logos/haier.png" },
            { id: "mitsubishi", name: "Mitsubishi Electric", logo: "img/logos/mitsubishi.png" },
        ],
        configTypes: {
            "dual": { name: "Dual Split (2 UI)", numUnits: 2 }, "trial": { name: "Trial Split (3 UI)", numUnits: 3 },
            "quadri": { name: "Quadri Split (Poker)", numUnits: 4 }, "penta": { name: "Penta Split (5 UI)", numUnits: 5 },
            "esa": { name: "Esa Split (6 UI)", numUnits: 6 }
        },
        outdoorUnits: [], indoorUnits: [] // Da CSV
    };

    let currentLogicalStep = 1; // 1:Marca, 2:Config, 3:UE
    let highestLogicalStepCompleted = 0;
    const selections = { brand: null, configType: null, outdoorUnit: null, indoorUnits: [] };

    const brandSelectionDiv = document.getElementById('brand-selection');
    const configTypeSelectionDiv = document.getElementById('config-type-selection');
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.textContent = 'Caricamento dati...';

    // Mappatura: Step Logico -> ID Contenitore HTML
    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-4" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-4": 3 }; // Inverso per prev-btn

    async function fetchCSVData(url) { /* ... identica a prima ... */ }
    function parseCSV(text) { /* ... identica a prima ... */ }

    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        APP_DATA.outdoorUnits = loadedOutdoorUnits.map(ue_csv => {
            const brandId = String(ue_csv.marca).toLowerCase();
            let compatibleIds = [];
            if (ue_csv.unità_collega_compatibili && ue_csv.unità_collega_compatibili !== "Dati mancanti") {
                compatibleIds = ue_csv.unità_collega_compatibili.split(';')
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            }
            const connections = parseInt(ue_csv.unità_collegabili) || 0;
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : 2) : 1;

            return {
                id: ue_csv.codice_prod || `ue_csv_${Math.random().toString(36).substr(2, 9)}`,
                brandId: brandId, modelCode: ue_csv.codice_prod || "Dati mancanti",
                name: ue_csv.nome_modello_ue && ue_csv.nome_modello_ue !== "Dati mancanti" ? `${String(ue_csv.marca).toUpperCase()} ${ue_csv.nome_modello_ue}` : `UE (${brandId})`,
                connections: connections,
                minConnections: parseInt(ue_csv.min_connessioni_ue) || minConnectionsFallback,
                // Aggiungere altre proprietà necessarie dalle tue colonne CSV
                price: ue_csv.prezzo || 0,
                image: 'img/ue_placeholder.png', // Non hai ancora immagine UE nel CSV
                compatibleIndoorSeriesIds: compatibleIds
            };
        });
        // Per ora non processiamo loadedIndoorUnits perché ci fermiamo alla selezione UE
        console.log("Dati processati UE:", APP_DATA.outdoorUnits);
    }

    function updateStepIndicator() {
        const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
        const stepLines = document.querySelectorAll('.step-indicator .step-line');
        const stepNames = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"]; // Nomi per i 5 step logici

        stepIndicatorItems.forEach((item, index) => {
            const displayStepNum = index + 1; // Numero display 1-based
            item.dataset.step = displayStepNum; // Assicura che il data-step sia sequenziale
            const nameEl = item.querySelector('.step-name');
            if(nameEl) nameEl.textContent = stepNames[displayStepNum-1] || `Step ${displayStepNum}`;
            
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot');
            dot.classList.remove('active', 'completed');

            if (displayStepNum < currentLogicalStep) { item.classList.add('completed'); dot.classList.add('completed'); }
            else if (displayStepNum === currentLogicalStep) { item.classList.add('active'); dot.classList.add('active'); }
            if (displayStepNum > highestLogicalStepCompleted + 1 && displayStepNum !== currentLogicalStep && displayStepNum !== 1) {
                 item.classList.add('disabled');
            }
        });
        stepLines.forEach((line, index) => {
            line.classList.remove('active');
            if (stepIndicatorItems[index]?.classList.contains('completed') || currentLogicalStep > index + 1) {
                 line.classList.add('active');
            }
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > 3) { // Max 3 per ora
             console.warn("Tentativo di mostrare step logico non valido:", logicalStepNumber); return;
        }
        const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
        if (!htmlContainerId) { console.error("ID HTML non trovato per step logico:", logicalStepNumber); return; }

        if (!fromDirectNavigation) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        // ... (logica navigazione diretta come prima, ma con limite a 3 step)

        document.querySelectorAll('.config-step').forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) targetStepEl.classList.add('active-step');
        
        currentLogicalStep = logicalStepNumber;
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted && logicalStepNumber < 3) {
             clearFutureSelections(logicalStepNumber -1, true);
        }
        updateStepIndicator();
        window.scrollTo(0, 0);
    }

    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) {
        // stepJustCompletedLogical: 0=marca, 1=config
        if (preserveCurrentLevelSelections) {
            if (stepJustCompletedLogical < 1) selections.configType = null; // Se torno a Marca, azzero Config e UE
            if (stepJustCompletedLogical < 2) selections.outdoorUnit = null; // Se torno a Config, azzero UE
        } else { /* ... reset completo come prima, adattato agli step... */ }

        if (selections.brand) populateConfigTypes(preserveCurrentLevelSelections && stepJustCompletedLogical === 0);
        else { configTypeSelectionDiv.innerHTML = '<p>Scegli Marca.</p>'; outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; }
        if (selections.configType && selections.brand) populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedLogical === 1);
        else if(selections.brand) outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Config.</p>';
        
        if (!preserveCurrentLevelSelections) highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        updateStepIndicator();
    }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    // const ueChanged... non ancora usato per navigazione automatica

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected');
        itemDiv.dataset[type + 'Id'] = item.id;
        let logoSrc = '';
        if (type === 'brand' && item.logo) logoSrc = item.logo;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;

        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc; logoImg.alt = `${item.name} Logo`;
            logoImg.classList.add('brand-logo'); // Classe per lo styling specifico del logo marca
            logoImg.onload = () => { nameSpan.style.display = 'none'; };
            logoImg.onerror = () => { logoImg.style.display = 'none'; nameSpan.style.display = 'block';};
            itemDiv.appendChild(logoImg);
        }
        itemDiv.appendChild(nameSpan);
        if (type === 'brand') nameSpan.style.display = logoSrc ? 'none' : 'block';
        else nameSpan.style.display = 'block'; // Per Config, il testo è sempre visibile

        itemDiv.addEventListener('click', () => {
            itemDiv.parentElement.querySelectorAll('.selection-item').forEach(el => el.classList.remove('selected'));
            itemDiv.classList.add('selected');
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep);
            clickHandler(item);
        });
        return itemDiv;
    }

    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... identica a prima, assicurati che mostri `unit.name` ... */ }

    function populateBrands(){
        brandSelectionDiv.innerHTML = '';
        const brandsToShow = APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id));
        if (brandsToShow.length === 0) {
            brandSelectionDiv.innerHTML = '<p>Nessuna marca con unità esterne disponibili.</p>'; return;
        }
        brandsToShow.forEach(brand => { 
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand);
                selections.brand = selectedBrand;
                if (brandHasChanged) { clearFutureSelections(0, false); highestLogicalStepCompleted = 0; }
                populateConfigTypes(!brandHasChanged && !!selections.configType);
                showStep(2); // Avanti a Step 2 Logico: Configurazione
            }, selections.brand && selections.brand.id === brand.id));
        });
        if(selections.brand) populateConfigTypes(true);
    }

    function populateConfigTypes(restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>...</p>'; return; }

        const validConfigs = Object.entries(APP_DATA.configTypes).map(([id, data]) => ({ id, ...data }))
            .filter(config => APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= config.numUnits && ue.minConnections <= config.numUnits));
        if(validConfigs.length === 0) {
            configTypeSelectionDiv.innerHTML = `<p>Nessuna configurazione disponibile per ${selections.brand.name}.</p>`;
            if (restoring) selections.configType = null; return;
        }
        validConfigs.forEach(item => {
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig);
                selections.configType = selectedConfig;
                if (configHasChanged) { clearFutureSelections(1, false); highestLogicalStepCompleted = 1; }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                if (APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= selectedConfig.numUnits && ue.minConnections <= selectedConfig.numUnits)) {
                    showStep(3); // Avanti a Step 3 Logico: UE
                }
            }, selections.configType && selections.configType.id === item.id));
        });
        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) {
            populateOutdoorUnits(true);
        } else if (restoring && selections.configType) selections.configType = null;
    }
    
    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType) { outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; return; }
        const numRequiredConnections = selections.configType.numUnits;
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue =>
            ue.brandId === selections.brand.id &&
            ue.connections >= numRequiredConnections && ue.minConnections <= numRequiredConnections
        );
        if (compatibleUEs.length === 0) {
            outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} per ${selections.configType.name}.</p>`;
            if(restoring) selections.outdoorUnit = null; return;
        }
        compatibleUEs.forEach(ue => {
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                selections.outdoorUnit = selectedUE;
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); // Step 3 (UE) completato
                console.log("Unità Esterna selezionata:", selectedUE);
                alert("Selezione Unità Esterna completata. Prossimi step: UI e Riepilogo.");
                // Per ora non andiamo avanti automaticamente
                // showStep(4); // Andrebbe a UI
                updateStepIndicator(); // Solo aggiorna stato
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });
        // ... (logica di restore se serve) ...
    }

    // Event Listeners per Navigazione (parziale, solo per prev button fino a step UE)
    document.querySelectorAll('.prev-btn').forEach(button => {
        const currentStepHtmlContainer = button.closest('.config-step');
        if (!currentStepHtmlContainer) return;
        const currentStepHtmlId = currentStepHtmlContainer.id;
        let prevLogicalStep = HTML_TO_LOGICAL_STEP_MAP[currentStepHtmlId] - 1;
        
        if(prevLogicalStep && prevLogicalStep >= 1) {
            button.addEventListener('click', () => { showStep(prevLogicalStep, true); });
        } else {
            button.style.display = 'none'; // Nascondi prev se non c'è un prev logico
        }
    });
    // Aggiungere listener per step-indicator-items se si vuole navigazione diretta da lì

    document.getElementById('reset-config-btn')?.addEventListener('click', () => {
        // ... logica di reset completa, poi showStep(1) ...
    });


    async function initializeApp() {
        document.body.appendChild(loadingOverlay);
        const [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([
            fetchCSVData(CSV_URLS.outdoorUnits), fetchCSVData(CSV_URLS.indoorUnits)
        ]);
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        
        // Nascondi lo step HTML #step-2 (Modello/Serie) se esiste e non lo usi più
        document.getElementById('step-2')?.remove(); // Rimuovilo per sicurezza se non serve
        // Potresti dover aggiornare gli ID degli step HTML per coerenza (step-1, step-2(ex3), step-3(ex4), ecc.)
        // o gestire il mapping come fatto in LOGICAL_TO_HTML_STEP_MAP.

        // Modifica gli indicatori di step visivi se il tuo HTML ne ha ancora 6.
        // Se il tuo HTML .step-indicator è già aggiornato a 5 items, non serve.
        const stepItemsHTML = document.querySelectorAll('.step-indicator .step-item');
        if(stepItemsHTML.length > 3) { // Esempio, se ce ne sono più di quelli che servono per i primi 3 step
             for(let i = 3; i<stepItemsHTML.length; i++) stepItemsHTML[i].style.display = 'none';
             document.querySelectorAll('.step-indicator .step-line')[2]?.style.display = 'none'; // Nascondi linea dopo 3° step visibile
        }

        populateBrands();
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca")) {
             loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Nessuna marca con unità disponibili.</span>`;
             return; 
        } else loadingOverlay.style.display = 'none';
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1); 
    }
    initializeApp();
});