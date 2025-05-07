document.addEventListener('DOMContentLoaded', async () => {
    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = {
        brands: [
            { id: "haier", name: "Haier" },
            { id: "mitsubishi", name: "Mitsubishi Electric" },
            // Aggiungere altre marche qui se presenti nei CSV e si desidera supportarle staticamente
            // Altrimenti, le marche potrebbero anche essere derivate dinamicamente dai CSV.
        ],
        uiSeriesImageMapping: { // Chiave: seriesId_ui normalizzato (es. revive_ui) -> nome file immagine senza estensione
            "revive_ui": "revive", "pearl_ui": "pearl", "flexis_ui": "flexis", "hr_ui": "hr",
            "ay_e_kirigamine_ui": "ay_kirigamine", // Normalizzato da "AY e KIRIGAMINE"
        },
        configTypes: {
            "dual": { name: "Dual Split (2 UI)", numUnits: 2 }, "trial": { name: "Trial Split (3 UI)", numUnits: 3 },
            "quadri": { name: "Quadri Split (Poker)", numUnits: 4 }, "penta": { name: "Penta Split (5 UI)", numUnits: 5 },
            "esa": { name: "Esa Split (6 UI)", numUnits: 6 }
        },
        outdoorUnits: [], indoorUnits: []
    };

    let currentStep = 1; // Flusso logico: 1:Marca, 2:Config, 3:UE, 4:UI, 5:Riepilogo
    let highestStepCompleted = 0;
    const selections = { brand: null, configType: null, outdoorUnit: null, indoorUnits: [] };

    // Riferimenti DOM (devono corrispondere agli ID nel tuo HTML)
    const brandSelectionDiv = document.getElementById('brand-selection');       // Per step-1.html
    const configTypeSelectionDiv = document.getElementById('config-type-selection'); // Per step-3.html (logico 2)
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection'); // Per step-4.html (logico 3)
    const indoorUnitsSelectionArea = document.getElementById('indoor-units-selection-area'); // Per step-5.html (logico 4)
    const summaryDiv = document.getElementById('config-summary');               // Per step-6.html (logico 5)
    const finalizeBtn = document.getElementById('finalize-btn'); // Nello step HTML delle UI
    const steps = document.querySelectorAll('.config-step'); // Tutti i div .config-step
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255,255,255,0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 1.2em; color: var(--primary-color); z-index: 2000; text-align: center; padding: 20px; box-sizing: border-box;`;
    loadingOverlay.textContent = 'Caricamento dati climatizzatori...';

    async function fetchCSVData(url) {
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Errore HTTP ${response.status} su ${url}`);
            return parseCSV(await response.text());
        } catch (error) {
            console.error("Errore fetchCSVData:", error);
            loadingOverlay.innerHTML += `<br><span style="color:red; font-size:0.8em;">Errore caricando ${url}.</span>`;
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
                    if (inQuotes && i + 1 < line.length && line[i+1] === '"') { // Gestisci "" -> "
                        currentVal += '"'; i++; continue;
                    }
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentVal.trim()); currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim());

            const entry = {};
            headers.forEach((header, i) => {
                let value = values[i] !== undefined && values[i] !== '' ? values[i] : "Dati mancanti";
                
                // Colonne che sicuramente sono o dovrebbero essere numeriche
                const numericHeaders = ['prezzo', 'prezzo_ui', 'unità_collegabili',
                                      'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui',
                                      'min_connessioni_ue', 'potenza_kw_ue_num', 'potenza_kw_ui_num']; // Aggiunto per valori puramente numerici di kW

                if (numericHeaders.includes(header)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); // Rimuovi . come separatore migliaia
                    numStr = numStr.replace(',', '.'); // Sostituisci , con . per decimale
                    const num = parseFloat(numStr);
                    entry[header] = isNaN(num) ? (value === "Dati mancanti" ? value : 0) : num;
                } else {
                    entry[header] = value;
                }
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
            // Header normalizzato: 'unità_collegabili'
            const connections = parseInt(ue_csv.unità_collegabili) || 0; // Già parsato come numero se la colonna era numerica
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : (connections === 2 ? 2 : 2)) : 1;

            return {
                id: ue_csv.codice_prod || `ue_csv_${Math.random().toString(36).substr(2, 9)}`,
                brandId: brandId,
                modelCode: ue_csv.codice_prod || "Dati mancanti",
                name: ue_csv.nome_modello_ue && ue_csv.nome_modello_ue !== "Dati mancanti" ? `${String(ue_csv.marca).toUpperCase()} ${ue_csv.nome_modello_ue}` : `UE (${brandId} - Cod: ${ue_csv.codice_prod || 'N/D'})`,
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
            const uiModelNameNormalized = String(ui_csv.modello).toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''); // da colonna 'modello'
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

    const STEP_ID_MAPPING = { 1: "step-1", 2: "step-3", 3: "step-4", 4: "step-5", 5: "step-6" };
    const TOTAL_LOGICAL_STEPS = 5;

    function updateStepIndicator() {
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];
        stepIndicatorItems.forEach((item) => {
            // Usa il data-step ATTUALE dell'HTML per trovare l'indice del nome corretto, poi aggiorna il nome.
            // Questo se l'HTML è stato modificato per avere solo 5 step-items con data-step da 1 a 5
            const displayStepNum = parseInt(item.dataset.step); 
            const nameEl = item.querySelector('.step-name');
            if(nameEl && displayStepNum >= 1 && displayStepNum <= TOTAL_LOGICAL_STEPS) {
                nameEl.textContent = stepNamesNewFlow[displayStepNum-1];
            }

            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot');
            dot.classList.remove('active', 'completed');
            
            if (displayStepNum < currentStep) { item.classList.add('completed'); dot.classList.add('completed'); }
            else if (displayStepNum === currentStep) { item.classList.add('active'); dot.classList.add('active'); }
            if (displayStepNum > highestStepCompleted + 1 && displayStepNum !== currentStep && displayStepNum !== 1) item.classList.add('disabled');
        });
        document.querySelectorAll('.step-indicator .step-line').forEach((line, index) => { // Suppone 4 linee per 5 step
            line.classList.remove('active');
            // La linea [i] è attiva se lo step indicator [i] (0-indexed) è completed
            if (stepIndicatorItems[index]?.classList.contains('completed') || currentStep > index + 1) {
                 line.classList.add('active');
            }
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE (quella con gestione logo/testo e senza img UI per serie) ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE (gestisce prezzi non numerici) ... */ }
    
    function populateBrands(){ /* ... IDENTICO ALL'ULTIMA VERSIONE (usa APP_DATA.brands e showStep(2)) ... */ }
    function populateConfigTypes(restoring = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE (usa APP_DATA.configTypes, APP_DATA.outdoorUnits e showStep(3)) ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE (usa APP_DATA.outdoorUnits, APP_DATA.indoorUnits e showStep(4) o 5) ... */ }
    function populateIndoorUnitSelectors(restoring = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE (usa APP_DATA.indoorUnits) ... */ }
    function checkAllIndoorUnitsSelected() { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    function generateSummary() { /* ... IDENTICO ALL'ULTIMA VERSIONE (usa APP_DATA) ... */ }
    
    stepIndicatorItems.forEach(item => { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... IDENTICO ALL'ULTIMA VERSIONE (USA STEP_ID_MAPPING e logicalStep) ... */ });
    document.getElementById('reset-config-btn').addEventListener('click', () => { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ });
    document.getElementById('print-summary-btn').addEventListener('click', () => window.print() );
    document.getElementById('print-list').addEventListener('click', () => { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ });

    async function initializeApp() {
        document.body.appendChild(loadingOverlay);
        loadingOverlay.style.display = 'flex';
        const [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([
            fetchCSVData(CSV_URLS.outdoorUnits), fetchCSVData(CSV_URLS.indoorUnits)
        ]);
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        
        // Se il tuo HTML index.html ha ancora lo step 2 (modello/serie), nascondilo.
        const oldModelSerieStepHtmlContainer = document.getElementById('step-2');
        if (oldModelSerieStepHtmlContainer) oldModelSerieStepHtmlContainer.style.display = 'none';
        
        // ASSICURATI che il tuo HTML .step-indicator ora abbia 5 .step-item e 4 .step-line
        // e che i .step-item abbiano data-step="1" fino a "5".
        // Il codice in updateStepIndicator() aggiornerà i loro nomi testuali.

        populateBrands();
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca")) {
             loadingOverlay.innerHTML += `<br><span style="color:red; font-size:0.8em;">Nessuna marca con unità disponibili. Controllare i CSV.</span>`;
             return; 
        } else loadingOverlay.style.display = 'none';
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
        showStep(1); 
        updateStepIndicator(); 
    }
    initializeApp();
});