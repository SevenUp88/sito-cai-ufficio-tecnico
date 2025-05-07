document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione Finalissima Debug)");

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
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.textContent = 'Caricamento dati...';

    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-4", 4: "step-5", 5: "step-6" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-4": 3, "step-5": 4, "step-6": 5 };
    const TOTAL_LOGICAL_STEPS = 5;

    async function fetchCSVData(url) {
        if (!url || typeof url !== 'string') {
            console.error("DEBUG CRITICO: fetchCSVData chiamata con URL non valido o undefined:", url);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore interno: URL CSV non valido.</span>`;
            return [];
        }
        console.log(`DEBUG: Chiamata a fetchCSVData per ${url}`);
        const typeForLog = url.includes(CSV_URLS.outdoorUnits) ? 'UE' : (url.includes(CSV_URLS.indoorUnits) ? 'UI' : 'Sconosciuto');
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) {
                console.error(`HTTP error ${response.status} for ${url} (${typeForLog})`);
                throw new Error(`HTTP error ${response.status} for ${url}`);
            }
            const text = await response.text();
            console.log(`DEBUG: Testo CSV ricevuto per ${typeForLog}. Lunghezza: ${text.length}`);
            return parseCSV(text, typeForLog);
        } catch (error) {
            console.error(`DEBUG: Errore in fetchCSVData per ${typeForLog} (${url}):`, error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore fetch: ${typeForLog}.</span>`;
            return [];
        }
    }

    function parseCSV(text, typeForLog = '') {
        console.log(`DEBUG: Parsing CSV text for ${typeForLog}...`);
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) { console.warn(`DEBUG: parseCSV ${typeForLog}: No data.`); return []; }
        const rawHeaders = lines[0].split(',');
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        console.log(`DEBUG: parseCSV ${typeForLog} - HEADERS NORMALIZZATI (count: ${headers.length}):`, JSON.stringify(headers));
        const unitaCollegabiliNormalizedHeader = 'unit_collegabili';
        if (typeForLog === 'UE') {
             const unitaCollegabiliHeaderIndex = headers.indexOf(unitaCollegabiliNormalizedHeader);
             console.log(`DEBUG: parseCSV UE - Indice rilevato per '${unitaCollegabiliNormalizedHeader}': ${unitaCollegabiliHeaderIndex}`);
        }
        if(headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
            console.error(`DEBUG: parseCSV ${typeForLog}: Nessun header valido!`); return [];
        }
        const data = lines.slice(1).map((line, lineIndex) => {
            const values = []; let currentVal = ''; let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && i + 1 < line.length && line[i+1] === '"') { currentVal += '"'; i++; continue; }
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) { values.push(currentVal); currentVal = ''; }
                else { currentVal += char; }
            }
            values.push(currentVal);
            while (values.length < headers.length) values.push('');
            if (values.length > headers.length) { values.length = headers.length; }
            const entry = {};
            headers.forEach((headerKey, i) => {
                let value = values[i] ? values[i].trim() : '';
                if (value === '') value = "Dati mancanti";
                if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
                const generalNumericHeaders = ['prezzo', 'prezzo_ui', 'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui', 'min_connessioni_ue'];
                if (typeForLog === 'UE' && headerKey === unitaCollegabiliNormalizedHeader && lineIndex < 5) {
                    console.log(`DEBUG: parseCSV UE (Riga ${lineIndex + 2}, Colonna '${headerKey}') - Valore GREZZO: "${value}"`);
                }
                if (headerKey === unitaCollegabiliNormalizedHeader) {
                    const parsedInt = parseInt(value, 10);
                    entry[headerKey] = isNaN(parsedInt) ? (value === "Dati mancanti" ? "Dati mancanti" : 0) : parsedInt;
                    if (typeForLog === 'UE' && lineIndex < 5) {
                         console.log(`DEBUG: parseCSV UE (Riga ${lineIndex + 2}, Colonna '${headerKey}') - Valore PARSATO: ${entry[headerKey]}`);
                    }
                } else if (generalNumericHeaders.includes(headerKey)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); numStr = numStr.replace(',', '.');
                    const num = parseFloat(numStr);
                    entry[headerKey] = (value === "Dati mancanti" && isNaN(num)) ? "Dati mancanti" : (isNaN(num) ? 0 : num);
                } else { entry[headerKey] = value; }
            });
            if (lineIndex < 1 && typeForLog) console.log(`DEBUG: parseCSV ${typeForLog} - Prima entry completa:`, JSON.parse(JSON.stringify(entry)));
            return entry;
        });
        console.log(`DEBUG: parseCSV ${typeForLog} - Totale entries: ${data.length}`);
        return data;
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        console.log("DEBUG: Chiamata a processLoadedData. UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        APP_DATA.outdoorUnits = loadedOutdoorUnits.map((ue_csv, index) => {
            const brandId = String(ue_csv.marca).toLowerCase();
            let compatibleIds = [];
            // USA L'HEADER NORMALIZZATO PER LE COMPATIBILITÀ, ASSUMENDO SIA 'compatibleindoorseriesids'
            const compatibleSeriesHeader = ue_csv.compatibleindoorseriesids; // Da CSV headers ["id","marca",..."compatibleindoorseriesids",...]
            if (compatibleSeriesHeader && compatibleSeriesHeader !== "Dati mancanti") {
                compatibleIds = compatibleSeriesHeader.split(';')
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            }
            // USA L'HEADER NORMALIZZATO CORRETTO: 'unit_collegabili'
            const connections = parseInt(ue_csv.unit_collegabili, 10) || 0; 
            if (index < 5 && typeForLog === 'UE') { // typeForLog non definito qui, lo rimuovo o passo. Lo rimuovo.
                console.log(`DEBUG: processLoadedData (UE ${index + 1}) - Valore da CSV ue_csv.unit_collegabili: "${ue_csv.unit_collegabili}", connections PARSATO in process: ${connections}`);
            }
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
                dimensions: ue_csv.dimensioni_ue || "Dati mancanti", // Header da CSV: "dimensioni_ue" o "dimensioni_peso_ue"? Uso dimensioni_ue come da log headers.
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
                id: ui_csv.codice_prod_ui || `ui_csv_${Math.random().toString(36).substr(2, 9)}`, // Assumendo codice_prodotto per UI se esiste
                brandId: brandId, seriesId: seriesIdUI, modelCode: ui_csv.codice_prod_ui || "Dati mancanti",
                name: `${String(ui_csv.marca).toUpperCase()} ${ui_csv.modello} ${kw_ui} (${btu} BTU)`,
                type: String(ui_csv.tipo_unit) === "Interna" ? "Parete" : ui_csv.tipo_unit, // Da CSV 'tipo_unit'
                capacityBTU: btu, price: ui_csv.prezzo_ui || 0,
                image: ui_csv.percorso_immagine_ui && ui_csv.percorso_immagine_ui !== "Dati mancanti" ? ui_csv.percorso_immagine_ui : `img/${imageName}.png`,
                dimensions: ui_csv.dimensioni_ui || "Dati mancanti", // Da CSV 'dimensioni_ui'
                wifi: ui_csv.wifi === "si"
            };
        });
        console.log("DEBUG: processLoadedData - Fine. outdoorUnits (primo):", APP_DATA.outdoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.outdoorUnits[0])) : "Nessuna UE");
        console.log("DEBUG: processLoadedData - Fine. indoorUnits (primo):", APP_DATA.indoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.indoorUnits[0])) : "Nessuna UI");
    }

    function updateStepIndicator() { /* ... COPIA DALL'ULTIMA VERSIONE CHE TI HA DATO I LOG CORRETTI FINO ALLA FINE DI populateBrands ... */ }
    function showStep(logicalStepNumber, fromDirectNavigation = false) { /* ... COPIA DALL'ULTIMA VERSIONE ... */ }
    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) { /* ... COPIA DALLA VERSIONE ... */ }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... COPIA DALLA VERSIONE ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... COPIA DALLA VERSIONE ... */ }
    function populateBrands(){ /* ... COPIA DALLA VERSIONE (CON I LOG DIAGNOSTICI) ... */ }
    function populateConfigTypes(restoring = false) { /* ... COPIA DALLA VERSIONE (CON I LOG DIAGNOSTICI CHE MOSTRAVANO UE conn:0) ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... COPIA DALLA VERSIONE ... */ }
    function populateIndoorUnitSelectors(restoring = false) { /* ... COPIA DALLA VERSIONE ... */ }
    function checkAllIndoorUnitsSelected() { /* ... COPIA DALLA VERSIONE ... */ }
    function generateSummary() { /* ... COPIA DALLA VERSIONE ... */ }
    stepIndicatorItems.forEach(item => { /* ... COPIA DALLA VERSIONE ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... COPIA DALLA VERSIONE ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... COPIA DALLA VERSIONE ... */ });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { /* ... COPIA DALLA VERSIONE ... */ });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { /* ... COPIA DALLA VERSIONE ... */ });

    async function initializeApp() {
        console.log("DEBUG: Chiamata a initializeApp");
        document.body.appendChild(loadingOverlay);
        loadingOverlay.style.display = 'flex'; 
        console.log("DEBUG: initializeApp - Verifying CSV_URLS.outdoorUnits:", CSV_URLS.outdoorUnits);
        console.log("DEBUG: initializeApp - Verifying CSV_URLS.indoorUnits:", CSV_URLS.indoorUnits);
        if (!CSV_URLS.outdoorUnits || !CSV_URLS.indoorUnits) { console.error("URL CSV mancanti!"); return; }
        let loadedOutdoorUnits, loadedIndoorUnits;
        try {
            console.log("DEBUG: initializeApp - Prima di Promise.all");
            const promiseOutdoor = fetchCSVData(CSV_URLS.outdoorUnits);
            const promiseIndoor = fetchCSVData(CSV_URLS.indoorUnits);
            promiseOutdoor.then(data => console.log("DEBUG: Promise Outdoor risolta:", data ? data.length + " items" : "dati undefined o null")); // Aggiunto fallback
            promiseIndoor.then(data => console.log("DEBUG: Promise Indoor risolta:", data ? data.length + " items" : "dati undefined o null")); // Aggiunto fallback
            [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([promiseOutdoor, promiseIndoor]);
            console.log("DEBUG: initializeApp - Dopo Promise.all");
        } catch (error) {
            console.error("DEBUG: ERRORE in Promise.all initializeApp:", error);
            loadedOutdoorUnits = []; loadedIndoorUnits = [];
        }
        if (typeof loadedOutdoorUnits === 'undefined') { console.error("DEBUG: loadedOutdoorUnits è UNDEFINED!"); loadedOutdoorUnits = []; }
        if (typeof loadedIndoorUnits === 'undefined') { console.error("DEBUG: loadedIndoorUnits è UNDEFINED!"); loadedIndoorUnits = []; }
        console.log("DEBUG: initializeApp - Dati (post-check). UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        if (loadedOutdoorUnits.length > 0) console.log("DEBUG: Primo UE GREZZO (prima di process):", JSON.parse(JSON.stringify(loadedOutdoorUnits[0])));
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        const oldModelSerieStepHtmlContainer = document.getElementById('step-2');
        if (oldModelSerieStepHtmlContainer) oldModelSerieStepHtmlContainer.style.display = 'none';
        updateStepIndicator(); 
        populateBrands();
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p')) ){
             loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Problema visualizzazione marche.</span>`;
             if(APP_DATA.outdoorUnits.length > 0 && APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id)).length === 0 ){
                loadingOverlay.style.display = 'none'; 
             }
        } else if (brandSelectionDiv.children.length > 0) {
            loadingOverlay.style.display = 'none';
        } else {
             loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Stato inatteso dopo populateBrands.</span>`;
        }
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1);
    }

    console.log("DEBUG: Prima di chiamare initializeApp");
    initializeApp();
    console.log("DEBUG: Dopo aver chiamato initializeApp (fine DOMContentLoaded)");
});