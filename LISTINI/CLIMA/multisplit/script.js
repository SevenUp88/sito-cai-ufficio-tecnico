document.addEventListener('DOMContentLoaded', async () => {
    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = {
        brands: [
            { id: "haier", name: "Haier", logo: "img/logos/haier.png" },
            { id: "mitsubishi", name: "Mitsubishi Electric", logo: "img/logos/mitsubishi.png" },
        ],
        uiSeriesImageMapping: { 
            "revive_ui": "revive", "pearl_ui": "pearl", "flexis_ui": "flexis", "hr_ui": "hr",
            "ay_e_kirigamine_ui": "ay_kirigamine",
        },
        configTypes: {
            "dual": { name: "Dual Split (2 UI)", numUnits: 2 }, "trial": { name: "Trial Split (3 UI)", numUnits: 3 },
            "quadri": { name: "Quadri Split (Poker)", numUnits: 4 }, "penta": { name: "Penta Split (5 UI)", numUnits: 5 },
            "esa": { name: "Esa Split (6 UI)", numUnits: 6 }
        },
        outdoorUnits: [], indoorUnits: []
    };

    let currentLogicalStep = 1;
    let highestLogicalStepCompleted = 0;
    const selections = { brand: null, configType: null, outdoorUnit: null, indoorUnits: [] };

    const brandSelectionDiv = document.getElementById('brand-selection');
    const configTypeSelectionDiv = document.getElementById('config-type-selection');
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection');
    const indoorUnitsSelectionArea = document.getElementById('indoor-units-selection-area');
    const summaryDiv = document.getElementById('config-summary');
    const finalizeBtn = document.getElementById('finalize-btn');
    const stepsHtmlContainers = document.querySelectorAll('.config-step');
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item'); // Definito globalmente
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.textContent = 'Caricamento dati...';

    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-4", 4: "step-5", 5: "step-6" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-4": 3, "step-5": 4, "step-6": 5 };
    const TOTAL_LOGICAL_STEPS = 5;

    async function fetchCSVData(url) {
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status} for ${url}`);
            return parseCSV(await response.text());
        } catch (error) {
            console.error("Error fetchCSVData:", error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore durante il caricamento di: ${url}. Dettagli in console.</span>`;
            return [];
        }
    }

    function parseCSV(text) {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        return lines.slice(1).map(line => {
            const values = []; let currentVal = ''; let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && i + 1 < line.length && line[i+1] === '"') { currentVal += '"'; i++; continue; }
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) { values.push(currentVal.trim()); currentVal = ''; }
                else { currentVal += char; }
            }
            values.push(currentVal.trim());
            const entry = {};
            headers.forEach((header, i) => {
                let value = values[i] !== undefined && values[i] !== '' ? values[i] : "Dati mancanti";
                if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
                const numericHeaders = [
                    'prezzo', 'prezzo_ui', 'unità_collegabili',
                    'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui',
                    'min_connessioni_ue'
                ];
                if (numericHeaders.includes(header)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); numStr = numStr.replace(',', '.');
                    const num = parseFloat(numStr);
                    entry[header] = (value === "Dati mancanti" && isNaN(num)) ? "Dati mancanti" : (isNaN(num) ? 0 : num);
                } else { entry[header] = value; }
            });
            return entry;
        });
    }
    
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
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : (connections === 2 ? 2:2)) : 1;
            return {
                id: ue_csv.codice_prod || `ue_csv_${Math.random().toString(36).substr(2, 9)}`,
                brandId: brandId, modelCode: ue_csv.codice_prod || "Dati mancanti",
                name: ue_csv.nome_modello_ue && ue_csv.nome_modello_ue !== "Dati mancanti" ? `${String(ue_csv.marca).toUpperCase()} ${ue_csv.nome_modello_ue}` : `UE (${brandId} - ${ue_csv.codice_prod || 'N/D'})`,
                connections: connections,
                minConnections: parseInt(ue_csv.min_connessioni_ue) || minConnectionsFallback,
                capacityCoolingBTU: parseInt(ue_csv.potenza_btu_freddo_ue) || 0,
                capacityHeatingBTU: parseInt(ue_csv.potenza_btu_caldo_ue) || 0,
                price: ue_csv.prezzo || 0,
                image: ue_csv.percorso_immagine_ue && ue_csv.percorso_immagine_ue !== "Dati mancanti" ? ue_csv.percorso_immagine_ue : 'img/ue_placeholder.png',
                dimensions: ue_csv.dimensioni_peso_ue || "Dati mancanti",
                compatibleIndoorSeriesIds: compatibleIds
            };
        });
        APP_DATA.indoorUnits = loadedIndoorUnits.map(ui_csv => {
            const brandId = String(ui_csv.marca).toLowerCase();
            const uiModelNameNormalized = String(ui_csv.modello).toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
            const seriesIdUI = `${uiModelNameNormalized}_ui`;
            let btu = 0; let kw_ui = "N/D";
            if (ui_csv.potenza && ui_csv.potenza !== "Dati mancanti") {
                const btuMatch = String(ui_csv.potenza).match(/(\d{1,3}(?:\.?\d{3})*)\s*BTU/i);
                if (btuMatch) btu = parseInt(String(btuMatch[1]).replace(/\./g,''));
                const kwMatch = String(ui_csv.potenza).match(/([\d,]+)\s*kW/i);
                if(kwMatch) kw_ui = kwMatch[1];
            }
            let imageName = APP_DATA.uiSeriesImageMapping[seriesIdUI] || uiModelNameNormalized;
            return {
                id: ui_csv.codice_prod_ui || `ui_csv_${Math.random().toString(36).substr(2, 9)}`,
                brandId: brandId, seriesId: seriesIdUI, modelCode: ui_csv.codice_prod_ui || "Dati mancanti",
                name: `${String(ui_csv.marca).toUpperCase()} ${ui_csv.modello} ${kw_ui} (${btu} BTU)`,
                type: String(ui_csv.tipo_unità) === "Interna" ? "Parete" : ui_csv.tipo_unità,
                capacityBTU: btu, price: ui_csv.prezzo_ui || 0,
                image: ui_csv.percorso_immagine_ui && ui_csv.percorso_immagine_ui !== "Dati mancanti" ? ui_csv.percorso_immagine_ui : `img/${imageName}.png`,
                dimensions: ui_csv.dimensioni_peso_ui || "Dati mancanti",
                wifi: ui_csv.wifi === "si"
            };
        });
        console.log("Dati processati UE:", APP_DATA.outdoorUnits);
        console.log("Dati processati UI:", APP_DATA.indoorUnits);
    }

    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];

        stepIndicatorItems.forEach((item, htmlIndex) => { // htmlIndex è 0-5 se l'HTML ha 6 items
            let itemLogicalStep = parseInt(item.dataset.step); // Leggi il data-step corrente dell'item HTML

            // Se l'HTML ha ancora 6 items, dobbiamo mappare gli items HTML agli step logici (1-5)
            // e nascondere il secondo item HTML (ex "Serie")
            if (stepIndicatorItems.length === 6) {
                if (htmlIndex === 1) { // Secondo item HTML (originale data-step="2", l'ex "Serie")
                    item.style.display = 'none';
                    if (stepLinesHTML[0]) stepLinesHTML[0].style.display = 'none'; // Nascondi linea prima di "Serie"
                    return; // Salta questo item nascosto
                }
                // Scala i data-step degli item HTML successivi a quello nascosto
                if (htmlIndex > 1) { // Per gli items HTML da 3 a 6
                    itemLogicalStep = htmlIndex; // Il terzo item HTML (index 2) è lo step logico 2, ecc.
                } else { // Primo item HTML (index 0)
                    itemLogicalStep = htmlIndex + 1; // È lo step logico 1
                }
                 item.dataset.step = itemLogicalStep; // Sovrascrivi il data-step HTML con quello logico
            }
            // Se l'HTML è già stato aggiornato a 5 items, item.dataset.step dovrebbe essere già 1-5.
            
            if (itemLogicalStep > TOTAL_LOGICAL_STEPS) {
                item.style.display = 'none'; // Nascondi eventuali items extra
                if (stepLinesHTML[htmlIndex -1] && htmlIndex > 0) stepLinesHTML[htmlIndex-1].style.display = 'none';
                return;
            }

            const nameEl = item.querySelector('.step-name');
            if (nameEl && stepNamesNewFlow[itemLogicalStep - 1]) {
                nameEl.textContent = stepNamesNewFlow[itemLogicalStep - 1];
            }
            
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot');
            dot.classList.remove('active', 'completed');
            
            if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot.classList.add('completed'); }
            else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot.classList.add('active'); }
            if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) {
                item.classList.add('disabled');
            }
        });

        stepLinesHTML.forEach((line, htmlLineIndex) => {
            line.classList.remove('active'); // Resetta
            if (stepIndicatorItems.length === 6 && htmlLineIndex === 0) { // Linea prima di "Serie" nascosta
                line.style.display = 'none'; return;
            }
            // Determina l'item visibile *prima* di questa linea
            let prevVisibleItem;
            if (stepIndicatorItems.length === 6) { // Se l'HTML ha 6 items (e 5 linee)
                // linea htmlLineIndex = 0 (nascosta)
                // linea htmlLineIndex = 1 connette item HTML 0 (Marca) a item HTML 2 (Config)
                // linea htmlLineIndex = 2 connette item HTML 2 (Config) a item HTML 3 (UE)
                // etc.
                if (htmlLineIndex === 1) prevVisibleItem = stepIndicatorItems[0]; // Marca
                else if (htmlLineIndex > 1) prevVisibleItem = stepIndicatorItems[htmlLineIndex]; // L'item HTML precedente alla linea HTML
            } else { // HTML ha 5 items (e 4 linee)
                prevVisibleItem = stepIndicatorItems[htmlLineIndex];
            }

            if (prevVisibleItem && prevVisibleItem.style.display !== 'none' && prevVisibleItem.classList.contains('completed')) {
                line.classList.add('active');
            } else if (prevVisibleItem && prevVisibleItem.style.display !== 'none') {
                let prevItemLogicalStep = parseInt(prevVisibleItem.dataset.step); // Usa il data-step logico
                if (currentLogicalStep > prevItemLogicalStep) {
                    line.classList.add('active');
                }
            }
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) {
            console.warn("ShowStep: Richiesto step logico non valido:", logicalStepNumber); return;
        }
        const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
        if (!htmlContainerId) { console.error("ID HTML non trovato per step logico:", logicalStepNumber); return; }

        if (!fromDirectNavigation) {
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        } else {
            if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1 && currentLogicalStep < logicalStepNumber) {
                if (logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted < (TOTAL_LOGICAL_STEPS - 1) ) return;
                else if (logicalStepNumber !== TOTAL_LOGICAL_STEPS) return;
            }
        }
        stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) { targetStepEl.classList.add('active-step'); }
        else { console.error(`Contenitore HTML '${htmlContainerId}' non trovato.`); }
        
        currentLogicalStep = logicalStepNumber;
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted && logicalStepNumber < TOTAL_LOGICAL_STEPS) {
             clearFutureSelections(logicalStepNumber -1, true);
        }
        updateStepIndicator();
        window.scrollTo(0, 0);
    }

    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) {
        if (preserveCurrentLevelSelections) {
            if (stepJustCompletedLogical < 1) selections.configType = null;
            if (stepJustCompletedLogical < 2) selections.outdoorUnit = null;
            if (stepJustCompletedLogical < 3) selections.indoorUnits = [];
        } else {
            if (stepJustCompletedLogical < 0) selections.brand = null;
            if (stepJustCompletedLogical < 1) selections.configType = null;
            if (stepJustCompletedLogical < 2) selections.outdoorUnit = null;
            if (stepJustCompletedLogical < 3) selections.indoorUnits = [];
        }
        if (selections.brand) populateConfigTypes(preserveCurrentLevelSelections && stepJustCompletedLogical === 0);
        else {
            brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            configTypeSelectionDiv.innerHTML = '<p>Scegli Marca.</p>';
            outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>';
        }
        if (selections.configType && selections.brand) populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedLogical === 1);
        else if(selections.brand) {
            configTypeSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Config.</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>';
        }
        if (selections.outdoorUnit && selections.configType && selections.brand) populateIndoorUnitSelectors(preserveCurrentLevelSelections && stepJustCompletedLogical === 2);
        else if (selections.configType) {
            outdoorUnitSelectionDiv.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
            indoorUnitsSelectionArea.innerHTML = '<p>Scegli Unità Esterna.</p>';
        }
        if (stepJustCompletedLogical < TOTAL_LOGICAL_STEPS - 1) summaryDiv.innerHTML = '';
        if (!preserveCurrentLevelSelections) highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        checkAllIndoorUnitsSelected();
    }
    
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);

    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... Stessa logica dell'ultima versione completa (logo/testo per brand e solo testo per config) ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... Stessa logica dell'ultima versione completa (mostra info UE e gestisce prezzo) ... */ }
    
    function populateBrands(){ /* ... Stessa logica dell'ultima versione completa (usa APP_DATA.brands e outdoorUnits per filtrare, chiama showStep(2)) ... */ }
    function populateConfigTypes(restoring = false) { /* ... Stessa logica dell'ultima versione completa (usa APP_DATA, filtra per UE disponibili per brand e config, chiama showStep(3)) ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... Stessa logica dell'ultima versione completa (usa APP_DATA, chiama showStep(4) per UI o showStep(5) per Riepilogo) ... */ }
    function populateIndoorUnitSelectors(restoring = false) { /* ... Stessa logica dell'ultima versione completa (usa APP_DATA.indoorUnits) ... */ }
    function checkAllIndoorUnitsSelected() { /* ... Stessa logica dell'ultima versione completa (abilita finalizeBtn, aggiorna highestLogicalStepCompleted e updateStepIndicator) ... */ }
    function generateSummary() { /* ... Stessa logica dell'ultima versione completa (usa APP_DATA, usa APP_DATA.uiSeriesImageMapping) ... */ }
    
    stepIndicatorItems.forEach(item => { /* ... Stessa logica dell'ultima versione completa (listener per click sugli indicatori) ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... Stessa logica dell'ultima versione completa ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... Stessa logica dell'ultima versione completa (usa HTML_TO_LOGICAL_STEP_MAP) ... */ });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { /* ... Stessa logica dell'ultima versione completa ... */ });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { /* ... Stessa logica dell'ultima versione completa ... */ });

    async function initializeApp() {
        document.body.appendChild(loadingOverlay);
        const [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([
            fetchCSVData(CSV_URLS.outdoorUnits), fetchCSVData(CSV_URLS.indoorUnits)
        ]);
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        const oldModelSerieStepHtmlContainer = document.getElementById('step-2');
        if (oldModelSerieStepHtmlContainer) oldModelSerieStepHtmlContainer.style.display = 'none';
        
        updateStepIndicator(); // Chiamata per settare nomi/visibilità indicatori basata su HTML esistente
        
        populateBrands();
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca")) {
             loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Nessuna marca con unità disponibili.</span>`;
             // Non nascondere overlay se c'è un errore critico
             return; 
        } else {
            loadingOverlay.style.display = 'none';
        }
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1); 
        // updateStepIndicator() viene già chiamato da showStep, quindi una volta qui è sufficiente se showStep lo fa.
    }

    initializeApp();
});