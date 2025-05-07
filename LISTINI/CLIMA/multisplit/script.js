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
        configTypes: { /* ... come prima ... */ },
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
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.textContent = 'Caricamento dati...';

    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-4", 4: "step-5", 5: "step-6" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-4": 3, "step-5": 4, "step-6": 5 };
    const TOTAL_LOGICAL_STEPS = 5;

    async function fetchCSVData(url) {
        console.log(`Fetching CSV data from: ${url}`);
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`); // Cache busting
            if (!response.ok) {
                console.error(`HTTP error ${response.status} for ${url}`);
                throw new Error(`HTTP error ${response.status} for ${url}`);
            }
            const text = await response.text();
            console.log(`Successfully fetched CSV text for ${url.includes('outdoorUnits') ? 'Outdoor Units' : 'Indoor Units'}. Length: ${text.length}`);
            return parseCSV(text, url.includes('outdoorUnits') ? 'UE' : 'UI'); // Pass type for logging
        } catch (error) {
            console.error("Error in fetchCSVData for " + url + ":", error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore fetch: ${url}. Controlla console.</span>`;
            return [];
        }
    }

    function parseCSV(text, typeForLog = '') {
        console.log(`Parsing CSV text for ${typeForLog}...`);
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            console.warn(`parseCSV for ${typeForLog}: No data lines found (or only header). Lines: ${lines.length}`);
            return [];
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        console.log(`parseCSV for ${typeForLog} - Detected Headers:`, headers);
        
        const data = lines.slice(1).map((line, lineIndex) => {
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

            if (headers.length !== values.length && lineIndex < 2) { // Log solo per le prime righe se c'è discrepanza
                console.warn(`parseCSV for ${typeForLog} - Line ${lineIndex + 2}: Header/value count mismatch. Headers: ${headers.length}, Values: ${values.length}. Line: "${line}"`);
            }

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
            if (lineIndex < 2) console.log(`parseCSV for ${typeForLog} - Parsed entry ${lineIndex + 1}:`, JSON.parse(JSON.stringify(entry))); // Log first 2 entries
            return entry;
        });
        console.log(`parseCSV for ${typeForLog} - Total entries parsed: ${data.length}`);
        return data;
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        console.log("processLoadedData - Start. UE loaded:", loadedOutdoorUnits.length, "UI loaded:", loadedIndoorUnits.length);
        // ... (resto di processLoadedData come prima, assicurati che i console.log finali ci siano ancora)
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
        console.log("Dati processati finali UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.outdoorUnits.slice(0,2))) : "Nessuna UE"); // Log solo i primi 2 per brevità
        console.log("Dati processati finali UI:", APP_DATA.indoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.indoorUnits.slice(0,2))) : "Nessuna UI");
    }

    function updateStepIndicator() { /* ... Identica all'ultima versione (quella che gestisce l'HTML a 6 indicatori nascondendo il secondo)... */ }
    function showStep(logicalStepNumber, fromDirectNavigation = false) { /* ... Identica all'ultima versione ... */ }
    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) { /* ... Identica all'ultima versione ... */ }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... Identica all'ultima versione ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... Identica all'ultima versione ... */ }
    function populateBrands(){ /* ... Identica all'ultima versione (CON I CONSOLE.LOG DIAGNOSTICI DENTRO) ... */ }
    function populateConfigTypes(restoring = false) { /* ... Identica all'ultima versione ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... Identica all'ultima versione ... */ }
    function populateIndoorUnitSelectors(restoring = false) { /* ... Identica all'ultima versione ... */ }
    function checkAllIndoorUnitsSelected() { /* ... Identica all'ultima versione ... */ }
    function generateSummary() { /* ... Identica all'ultima versione ... */ }
    stepIndicatorItems.forEach(item => { /* ... Identica all'ultima versione ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... Identica all'ultima versione ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... Identica all'ultima versione ... */ });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { /* ... Identica all'ultima versione ... */ });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { /* ... Identica all'ultima versione ... */ });

    async function initializeApp() {
        document.body.appendChild(loadingOverlay);
        const [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([
            fetchCSVData(CSV_URLS.outdoorUnits), fetchCSVData(CSV_URLS.indoorUnits)
        ]);
        // Punto cruciale: loggare i dati *prima* e *dopo* il processamento
        console.log("initializeApp - Dati grezzi caricati UE:", loadedOutdoorUnits.length);
        console.log("initializeApp - Dati grezzi caricati UI:", loadedIndoorUnits.length);
        if (loadedOutdoorUnits.length > 0) console.log("initializeApp - Esempio primo UE grezzo:", JSON.parse(JSON.stringify(loadedOutdoorUnits[0])));
        if (loadedIndoorUnits.length > 0) console.log("initializeApp - Esempio primo UI grezzo:", JSON.parse(JSON.stringify(loadedIndoorUnits[0])));

        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits); // Ora i dati sono in APP_DATA
        
        const oldModelSerieStepHtmlContainer = document.getElementById('step-2');
        if (oldModelSerieStepHtmlContainer) oldModelSerieStepHtmlContainer.style.display = 'none';
        updateStepIndicator();
        
        populateBrands(); // Questa funzione ora contiene la diagnostica
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca")) {
             loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Nessuna marca con unità disponibili trovata.</span>`;
             // Non nascondere overlay per permettere di vedere il messaggio
             return; 
        } else {
            loadingOverlay.style.display = 'none';
        }
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1);
    }
    initializeApp();
});