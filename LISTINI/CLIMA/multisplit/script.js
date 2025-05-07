document.addEventListener('DOMContentLoaded', async () => {
    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = { /* ... IDENTICO A PRIMA ... */ };
    let currentLogicalStep = 1; /* ... IDENTICO A PRIMA ... */
    let highestLogicalStepCompleted = 0; /* ... IDENTICO A PRIMA ... */
    const selections = { /* ... IDENTICO A PRIMA ... */ };
    const brandSelectionDiv = document.getElementById('brand-selection'); /* ... ECC. IDENTICO A PRIMA ... */
    const configTypeSelectionDiv = document.getElementById('config-type-selection');
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection');
    const indoorUnitsSelectionArea = document.getElementById('indoor-units-selection-area');
    const summaryDiv = document.getElementById('config-summary');
    const finalizeBtn = document.getElementById('finalize-btn');
    const stepsHtmlContainers = document.querySelectorAll('.config-step');
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div'); /* ... IDENTICO A PRIMA ... */
    const LOGICAL_TO_HTML_STEP_MAP = { /* ... IDENTICO A PRIMA ... */ };
    const HTML_TO_LOGICAL_STEP_MAP = { /* ... IDENTICO A PRIMA ... */ };
    const TOTAL_LOGICAL_STEPS = 5; /* ... IDENTICO A PRIMA ... */

    async function fetchCSVData(url) {
        console.log(`Fetching CSV data from: ${url}`);
        // Determina il tipo per il logging basato sull'URL
        const typeForLog = url.includes(CSV_URLS.outdoorUnits) ? 'UE' : (url.includes(CSV_URLS.indoorUnits) ? 'UI' : 'Sconosciuto');
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status} for ${url}`);
            const text = await response.text();
            console.log(`Successfully fetched CSV text for ${typeForLog}. Length: ${text.length}`); // CORRETTO typeForLog
            return parseCSV(text, typeForLog);
        } catch (error) {
            console.error(`Error in fetchCSVData for ${typeForLog} (${url}):`, error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore fetch: ${url}. Controlla console.</span>`;
            return [];
        }
    }

    function parseCSV(text, typeForLog = '') {
        console.log(`Parsing CSV text for ${typeForLog}...`);
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            console.warn(`parseCSV for ${typeForLog}: No data lines found. Lines: ${lines.length}`);
            return [];
        }

        // Estrai gli header, normalizzali
        const rawHeaders = lines[0].split(',');
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        console.log(`parseCSV for ${typeForLog} - Detected Headers (count: ${headers.length}):`, headers);
        if(headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
            console.error(`parseCSV for ${typeForLog}: Nessun header valido rilevato! Controlla il formato CSV.`);
            return [];
        }

        const data = lines.slice(1).map((line, lineIndex) => {
            // Parser CSV più robusto per gestire le virgole nelle stringhe quotate
            // e assicurare il numero corretto di valori per riga, anche se ci sono celle vuote alla fine.
            const values = [];
            let currentVal = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { // Gestisce "" (escaped quote)
                        currentVal += '"';
                        i++; // Salta la seconda virgoletta
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    values.push(currentVal); // Non fare .trim() qui, fallo dopo
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal); // Aggiungi l'ultimo valore

            // Assicura che 'values' abbia la stessa lunghezza di 'headers', aggiungendo stringhe vuote per le celle mancanti
            while (values.length < headers.length) {
                values.push('');
            }
            // Tronca 'values' se ha più elementi di 'headers' (meno probabile con CSV ben formattati)
            if (values.length > headers.length) {
                console.warn(`parseCSV for ${typeForLog} - Line ${lineIndex + 2}: Value count (${values.length}) > Header count (${headers.length}). Troncando. Linea: "${line}"`);
                values.length = headers.length;
            }


            const entry = {};
            headers.forEach((header, i) => {
                let value = values[i] ? values[i].trim() : ''; // Ora fai .trim() qui
                if (value === '') value = "Dati mancanti"; // Se la cella è vuota, la trattiamo come "Dati mancanti"

                // Rimuovi doppi apici esterni SOLO se presenti
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                // Le doppie virgolette interne sono già state gestite nel ciclo precedente con /""/g -> '"' (o meglio, il parser le lascia)
                
                const numericHeaders = [
                    'prezzo', 'prezzo_ui', 'unità_collegabili',
                    'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui',
                    'min_connessioni_ue'
                ];
                if (numericHeaders.includes(header)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); 
                    numStr = numStr.replace(',', '.');          
                    const num = parseFloat(numStr);
                    entry[header] = (value === "Dati mancanti" && isNaN(num)) ? "Dati mancanti" : (isNaN(num) ? 0 : num);
                } else {
                    entry[header] = value;
                }
            });
            if (lineIndex < 2) console.log(`parseCSV for ${typeForLog} - Parsed entry ${lineIndex + 1}:`, JSON.parse(JSON.stringify(entry)));
            return entry;
        });
        console.log(`parseCSV for ${typeForLog} - Total entries parsed: ${data.length}`);
        return data;
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) { /* ... IDENTICO A PRIMA ... */ }
    function updateStepIndicator() { /* ... IDENTICO A PRIMA ... */ }
    function showStep(logicalStepNumber, fromDirectNavigation = false) { /* ... IDENTICO A PRIMA ... */ }
    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) { /* ... IDENTICO A PRIMA ... */ }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... IDENTICO A PRIMA ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... IDENTICO A PRIMA ... */ }
    function populateBrands(){ /* ... IDENTICO A PRIMA (con diagnostica interna) ... */ }
    function populateConfigTypes(restoring = false) { /* ... IDENTICO A PRIMA ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... IDENTICO A PRIMA ... */ }
    function populateIndoorUnitSelectors(restoring = false) { /* ... IDENTICO A PRIMA ... */ }
    function checkAllIndoorUnitsSelected() { /* ... IDENTICO A PRIMA ... */ }
    function generateSummary() { /* ... IDENTICO A PRIMA ... */ }
    stepIndicatorItems.forEach(item => { /* ... IDENTICO A PRIMA ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... IDENTICO A PRIMA ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... IDENTICO A PRIMA ... */ });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { /* ... IDENTICO A PRIMA ... */ });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { /* ... IDENTICO A PRIMA ... */ });
    async function initializeApp() { /* ... IDENTICO A PRIMA (con log diagnostici interni) ... */ }
    initializeApp();
});