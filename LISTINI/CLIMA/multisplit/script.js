document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione Correzione Header unit_collegabili)");

    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = { /* ... come prima ... */ };
    // ... (altre variabili globali come prima)
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
    const loadingOverlay = document.createElement('div'); /* ... come prima ... */
    const LOGICAL_TO_HTML_STEP_MAP = { /* ... come prima ... */ };
    const HTML_TO_LOGICAL_STEP_MAP = { /* ... come prima ... */ };
    const TOTAL_LOGICAL_STEPS = 5; /* ... come prima ... */


    async function fetchCSVData(url) { /* ... IDENTICO ALLA VERSIONE PRECEDENTE CHE TI HA DATO QUESTI LOG ... */ }

    function parseCSV(text, typeForLog = '') {
        console.log(`DEBUG: Parsing CSV text for ${typeForLog}...`);
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) { console.warn(`DEBUG: parseCSV ${typeForLog}: No data.`); return []; }
        
        const rawHeaders = lines[0].split(',');
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        
        console.log(`DEBUG: parseCSV ${typeForLog} - HEADERS NORMALIZZATI (count: ${headers.length}):`, JSON.stringify(headers)); 
        
        const unitaCollegabiliNormalizedHeader = 'unit_collegabili'; // <-- NOME HEADER CORRETTO DAL TUO LOG!

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
            if (values.length > headers.length) values.length = headers.length;

            const entry = {};
            headers.forEach((headerKey, i) => { 
                let value = values[i] ? values[i].trim() : '';
                if (value === '') value = "Dati mancanti";
                if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
                
                const generalNumericHeaders = [ // Lista per il parsing generico, ESCLUDENDO il nostro caso speciale
                    'prezzo', 'prezzo_ui', 
                    'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui',
                    'min_connessioni_ue'
                ];
                
                // Logga specificamente per il nostro header di interesse
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
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); 
                    numStr = numStr.replace(',', '.');          
                    const num = parseFloat(numStr);
                    entry[headerKey] = (value === "Dati mancanti" && isNaN(num)) ? "Dati mancanti" : (isNaN(num) ? 0 : num);
                } else {
                    entry[headerKey] = value;
                }
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
            if (ue_csv.compatibleindoorseriesids && ue_csv.compatibleindoorseriesids !== "Dati mancanti") { // Usa l'header normalizzato
                compatibleIds = ue_csv.compatibleindoorseriesids.split(';')
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            }
            
            // Usa l'header normalizzato corretto: 'unit_collegabili'
            const connections = parseInt(ue_csv.unit_collegabili, 10) || 0; // <<<<<< CORREZIONE QUI

            if (index < 5) {
                console.log(`DEBUG: processLoadedData (UE ${index + 1}) - Valore da ue_csv.unit_collegabili: "${ue_csv.unit_collegabili}", connections PARSATO: ${connections}`);
            }
            
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : 2) : 1;

            return {
                id: ue_csv.codice_prod || `ue_csv_${Math.random().toString(36).substr(2, 9)}`, // Usa 'codice_prodotto' se quello è l'header per le UE
                brandId: brandId, modelCode: ue_csv.codice_prod || "Dati mancanti",
                name: ue_csv.nome_modello_ue && ue_csv.nome_modello_ue !== "Dati mancanti" ? `${String(ue_csv.marca).toUpperCase()} ${ue_csv.nome_modello_ue}` : `UE (${brandId} - ${ue_csv.codice_prod || 'N/D'})`,
                connections: connections, // Questo dovrebbe ora avere il valore corretto
                minConnections: parseInt(ue_csv.min_connessioni_ue) || minConnectionsFallback,
                capacityCoolingBTU: parseInt(ue_csv.potenza_btu_freddo_ue) || 0,
                capacityHeatingBTU: parseInt(ue_csv.potenza_btu_caldo_ue) || 0,
                price: ue_csv.prezzo || 0,
                image: ue_csv.percorso_immagine_ue && ue_csv.percorso_immagine_ue !== "Dati mancanti" ? ue_csv.percorso_immagine_ue : 'img/ue_placeholder.png',
                dimensions: ue_csv.dimensioni_peso_ue || "Dati mancanti", // Assicurati che 'dimensioni_ue' sia l'header corretto
                compatibleIndoorSeriesIds: compatibleIds
            };
        });

        APP_DATA.indoorUnits = loadedIndoorUnits.map(ui_csv => { /* ... IDENTICO ALLA VERSIONE PRECEDENTE CHE TI HA DATO QUESTI LOG ... */ });
        console.log("DEBUG: processLoadedData - Fine. outdoorUnits:", APP_DATA.outdoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.outdoorUnits.slice(0,1))) : "Nessuna UE");
        console.log("DEBUG: processLoadedData - Fine. indoorUnits:", APP_DATA.indoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.indoorUnits.slice(0,1))) : "Nessuna UI");
    }

    // --- TUTTE LE ALTRE FUNZIONI (updateStepIndicator, showStep, populateBrands, ecc. DEVONO ESSERE QUELLE DELL'ULTIMA VERSIONE COMPLETA CHE HAI TESTATO) ---
    // NON LE RICOMPIO QUI PER BREVITÀ, MA ASSICURATI CHE SIANO QUELLE GIUSTE NEL TUO FILE.

    async function initializeApp() { /* ... IDENTICO ALL'ULTIMA VERSIONE CHE TI HA DATO QUESTI LOG ... */ }
    
    console.log("DEBUG: Prima di chiamare initializeApp");
    initializeApp();
    console.log("DEBUG: Dopo aver chiamato initializeApp (fine DOMContentLoaded)");
});