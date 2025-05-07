document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js");

    const CSV_URLS = { /* ... come prima ... */ };
    const APP_DATA = { /* ... come prima ... */ };
    let currentLogicalStep = 1; /* ... come prima ... */
    let highestLogicalStepCompleted = 0; /* ... come prima ... */
    const selections = { /* ... come prima ... */ };
    const brandSelectionDiv = document.getElementById('brand-selection'); /* ... ecc. come prima ... */
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
    loadingOverlay.textContent = 'Caricamento dati... (Script.js)';

    const LOGICAL_TO_HTML_STEP_MAP = { /* ... come prima ... */ };
    const HTML_TO_LOGICAL_STEP_MAP = { /* ... come prima ... */ };
    const TOTAL_LOGICAL_STEPS = 5; /* ... come prima ... */

    async function fetchCSVData(url) {
        console.log(`DEBUG: Chiamata a fetchCSVData per ${url}`);
        // ... (resto della funzione come prima, con i suoi console.log interni)
        const typeForLog = url.includes(CSV_URLS.outdoorUnits) ? 'UE' : (url.includes(CSV_URLS.indoorUnits) ? 'UI' : 'Sconosciuto');
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status} for ${url}`);
            const text = await response.text();
            console.log(`DEBUG: Testo CSV ricevuto per ${typeForLog}. Lunghezza: ${text.length}`);
            return parseCSV(text, typeForLog);
        } catch (error) {
            console.error("DEBUG: Errore in fetchCSVData per " + url + ":", error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore fetch (JS): ${url}.</span>`;
            return [];
        }
    }

    function parseCSV(text, typeForLog = '') {
        console.log(`DEBUG: Chiamata a parseCSV per ${typeForLog}`);
        // ... (resto della funzione come prima, con i suoi console.log interni)
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) { console.warn(`DEBUG: parseCSV ${typeForLog}: No data.`); return []; }
        const rawHeaders = lines[0].split(',');
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        console.log(`DEBUG: parseCSV ${typeForLog} - Headers:`, headers);
        // ... (resto come prima) ...
        const data = lines.slice(1).map((line, lineIndex) => {
            const values = []; let currentVal = ''; let inQuotes = false;
            for (let i = 0; i < line.length; i++) { /* ... splitting logic ... */ }
            values.push(currentVal); // Aggiungi l'ultimo valore
            while (values.length < headers.length) values.push('');
            if (values.length > headers.length) values.length = headers.length;

            const entry = {};
            headers.forEach((header, i) => { /* ... assegnazione entry ... */ });
            if (lineIndex < 1) console.log(`DEBUG: parseCSV ${typeForLog} - Prima entry parsata:`, JSON.parse(JSON.stringify(entry)));
            return entry;
        });
        console.log(`DEBUG: parseCSV ${typeForLog} - Entrate totali: ${data.length}`);
        return data;
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        console.log("DEBUG: Chiamata a processLoadedData. UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        // ... (corpo della funzione processLoadedData come l'ultima volta, assicurati che i console.log finali per APP_DATA ci siano ancora)
        console.log("DEBUG: processLoadedData - Fine. outdoorUnits in APP_DATA:", APP_DATA.outdoorUnits.length, "indoorUnits:", APP_DATA.indoorUnits.length);
    }

    function updateStepIndicator() { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    function showStep(logicalStepNumber, fromDirectNavigation = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE ... */ }
    
    function populateBrands(){
        console.log("DEBUG: Chiamata a populateBrands");
        if (!brandSelectionDiv) { console.error("DEBUG: Errore critico - brandSelectionDiv non trovato!"); return; }
        brandSelectionDiv.innerHTML = ''; // Pulisci prima
        
        console.log("DEBUG: populateBrands - APP_DATA.brands (statici):", JSON.parse(JSON.stringify(APP_DATA.brands)));
        if (!APP_DATA.outdoorUnits) { console.error("DEBUG: APP_DATA.outdoorUnits non è definito prima di filtrare in populateBrands!"); return;}
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId))];
        console.log("DEBUG: populateBrands - brandId unici in APP_DATA.outdoorUnits (da CSV):", uniqueBrandIdsFromUEs);

        const brandsToShow = APP_DATA.brands.filter(b_static => 
            APP_DATA.outdoorUnits.some(ue_csv => ue_csv.brandId === b_static.id)
        );
        console.log("DEBUG: populateBrands - brandsToShow (dopo filtro):", JSON.parse(JSON.stringify(brandsToShow)));

        if (brandsToShow.length === 0) {
            let msg = '<p>Nessuna marca con unità esterne disponibili è stata trovata. ';
            if (APP_DATA.outdoorUnits.length > 0 && uniqueBrandIdsFromUEs.length > 0) {
                msg += `Sono state caricate unità esterne per le seguenti marche (dal CSV): ${uniqueBrandIdsFromUEs.join(', ')}. `
                msg += `Assicurarsi che gli 'id' in APP_DATA.brands (nel file JS) corrispondano a questi (case insensitive). </p>`;
            } else if (APP_DATA.outdoorUnits.length === 0) {
                msg += `Nessuna unità esterna è stata caricata correttamente dai CSV. Controllare la console per errori nel caricamento o parsing dei CSV.</p>`;
            } else {
                 msg += `Controllare i dati.</p>`;
            }
            brandSelectionDiv.innerHTML = msg;
            console.log("DEBUG: populateBrands - Nessuna marca da mostrare.");
            return;
        }

        brandsToShow.forEach(brand => { /* ... corpo del forEach come prima ... */ });
        console.log("DEBUG: populateBrands - Marche popolate nell'HTML.");
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) { /* ... come prima ... */ }
        else if (selections.brand) { selections.brand = null; }
    }

    function populateConfigTypes(restoring = false) { /* ... identico, con eventuali console.log interni se servono ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... identico, con eventuali console.log interni ... */ }
    // ... (altre funzioni di populate, check, generate come l'ultima volta)

    async function initializeApp() {
        console.log("DEBUG: Chiamata a initializeApp");
        document.body.appendChild(loadingOverlay); // Mostra overlay subito
        const [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([
            fetchCSVData(CSV_URLS.outdoorUnits), fetchCSVData(CSV_URLS.indoorUnits)
        ]);
        
        console.log("DEBUG: initializeApp - Dati CSV grezzi caricati. UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        if (loadedOutdoorUnits.length > 0) console.log("DEBUG: Esempio primo UE GREZZO:", JSON.parse(JSON.stringify(loadedOutdoorUnits[0])));

        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits); // Popola APP_DATA
        console.log("DEBUG: initializeApp - Dati processati. APP_DATA.outdoorUnits:", APP_DATA.outdoorUnits.length);

        const oldModelSerieStepHtmlContainer = document.getElementById('step-2');
        if (oldModelSerieStepHtmlContainer) oldModelSerieStepHtmlContainer.style.display = 'none';
        
        console.log("DEBUG: initializeApp - Chiamata a updateStepIndicator");
        updateStepIndicator(); 
        
        console.log("DEBUG: initializeApp - Chiamata a populateBrands");
        populateBrands();
        
        // Controlla se populateBrands ha effettivamente aggiunto qualcosa o solo il messaggio di errore
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca")) {
             console.log("DEBUG: initializeApp - populateBrands non ha mostrato marche, l'overlay resta.");
             loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Problema nel visualizzare le marche. Vedi console per dettagli da populateBrands.</span>`;
             // Non nascondere overlay per vedere il messaggio, a meno che i log precedenti non diano già la causa
             if(APP_DATA.outdoorUnits.length > 0 && APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id)).length === 0 ){
                // UE caricate, ma nessun brand statico matcha -> l'overlay può essere nascosto, l'errore è nei dati/config
                loadingOverlay.style.display = 'none';
             }

        } else if (brandSelectionDiv.children.length > 0) { // Se ci sono elementi figli (le card delle marche)
            console.log("DEBUG: initializeApp - populateBrands ha aggiunto contenuto, nascondo overlay.");
            loadingOverlay.style.display = 'none';
        } else {
            console.log("DEBUG: initializeApp - populateBrands non ha aggiunto contenuto e non ha messo messaggio errore? Strano.");
            loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Stato inatteso dopo populateBrands.</span>`;
        }
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        
        console.log("DEBUG: initializeApp - Chiamata a showStep(1)");
        showStep(1); 
    }

    console.log("DEBUG: Prima di chiamare initializeApp");
    initializeApp();
    console.log("DEBUG: Dopo aver chiamato initializeApp");
});