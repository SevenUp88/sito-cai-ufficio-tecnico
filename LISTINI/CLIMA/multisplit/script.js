document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione con Diagnostica populateBrands)");

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
        // ... (versione corretta come l'ultima)
    }

    function parseCSV(text, typeForLog = '') {
        // ... (versione corretta come l'ultima, con parsing robusto)
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        // ... (versione corretta come l'ultima)
    }

    function updateStepIndicator() { /* ... IDENTICO ALL'ULTIMA VERSIONE COMPLETA DATA PRIMA DELL'ERRORE DI SINTASSI ... */ }
    function showStep(logicalStepNumber, fromDirectNavigation = false) { /* ... IDENTICO ... */ }
    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) { /* ... IDENTICO ... */ }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... IDENTICO ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... IDENTICO ... */ }
    
    function populateBrands(){ // QUESTA È LA VERSIONE CON PIÙ DIAGNOSTICA
        brandSelectionDiv.innerHTML = '';
        
        console.log("DEBUG: populateBrands - Inizio. APP_DATA.brands (statici):", JSON.parse(JSON.stringify(APP_DATA.brands)));
        if (!APP_DATA.outdoorUnits || APP_DATA.outdoorUnits.length === 0) {
            console.warn("DEBUG: populateBrands - APP_DATA.outdoorUnits è vuoto o non definito. Impossibile popolare le marche.");
            brandSelectionDiv.innerHTML = '<p>Dati delle unità esterne non disponibili. Controllare il caricamento CSV.</p>';
            return;
        }
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId))];
        console.log("DEBUG: populateBrands - brandId UNICI in APP_DATA.outdoorUnits (da CSV):", uniqueBrandIdsFromUEs);

        const brandsToShow = APP_DATA.brands.filter(b_static => {
            const match = APP_DATA.outdoorUnits.some(ue_csv => {
                // Per un debug ancora più fine del matching:
                if (ue_csv.brandId === b_static.id) {
                    // console.log(`DEBUG Match: statico '${b_static.id}' === CSV '${ue_csv.brandId}' (per UE: ${ue_csv.name || ue_csv.id})`);
                    return true;
                }
                return false;
            });
            if (!match && uniqueBrandIdsFromUEs.includes(b_static.id)) {
                console.warn(`DEBUG: populateBrands - Brand statico '${b_static.id}' ESISTE tra gli ID unici del CSV, ma il matching diretto FALLISCE. Controlla trim/spazi/caratteri invisibili. Confronta ue_csv.brandId ('${uniqueBrandIdsFromUEs.find(id => id === b_static.id)}') con b_static.id ('${b_static.id}')`);
            } else if(match) {
                 console.log(`DEBUG: populateBrands - Brand statico '${b_static.id}' TROVATO e matchato in outdoorUnits.`);
            } else if (!uniqueBrandIdsFromUEs.includes(b_static.id)) {
                 console.log(`DEBUG: populateBrands - Brand statico '${b_static.id}' NON presente tra gli ID unici del CSV ('${uniqueBrandIdsFromUEs.join(', ')}').`);
            }
            return match;
        });
        
        console.log("DEBUG: populateBrands - brandsToShow (dopo filtro):", JSON.parse(JSON.stringify(brandsToShow)));

        if (brandsToShow.length === 0) {
            let msg = '<p>Nessuna marca con unità esterne disponibili trovata dopo il caricamento e filtro. ';
            if (APP_DATA.outdoorUnits.length > 0 && uniqueBrandIdsFromUEs.length > 0) {
                msg += `Sono state caricate unità esterne per le seguenti marche (dal CSV): ${uniqueBrandIdsFromUEs.join(', ')}. `
                msg += `Assicurarsi che gli 'id' definiti in APP_DATA.brands (nel file JS) corrispondano ESATTAMENTE a questi (dopo la normalizzazione a minuscolo). </p>`;
            } else if (APP_DATA.outdoorUnits.length === 0) {
                msg += `Nessuna unità esterna è stata caricata correttamente dai CSV. Controllare la console per errori precedenti nel caricamento o parsing dei CSV.</p>`;
            } else {
                 msg += `Controllare i dati e la corrispondenza degli ID marca.</p>`;
            }
            brandSelectionDiv.innerHTML = msg;
            console.log("DEBUG: populateBrands - Nessuna marca da mostrare. Messaggio impostato.");
            return;
        }

        brandsToShow.forEach(brand => { 
            console.log("DEBUG: populateBrands - Creazione card per marca:", brand.id);
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand);
                selections.brand = selectedBrand;
                if (brandHasChanged) { clearFutureSelections(0, false); highestLogicalStepCompleted = 0; }
                populateConfigTypes(!brandHasChanged && !!selections.configType);
                showStep(2);
            }, selections.brand && selections.brand.id === brand.id));
        });
        console.log("DEBUG: populateBrands - Fine. Marche popolate nell'HTML (o messaggio di errore).");
        
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) {
            populateConfigTypes(true); 
        } else if (selections.brand) { 
            selections.brand = null; 
        }
    }

    function populateConfigTypes(restoring = false) { /* ... IDENTICO ALL'ULTIMA VERSIONE COMPLETA (quella prima di questo debug specifico su populateBrands) ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... IDENTICO ... */ }
    function populateIndoorUnitSelectors(restoring = false) { /* ... IDENTICO ... */ }
    function checkAllIndoorUnitsSelected() { /* ... IDENTICO ... */ }
    function generateSummary() { /* ... IDENTICO ... */ }
    stepIndicatorItems.forEach(item => { /* ... IDENTICO ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... IDENTICO ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... IDENTICO ... */ });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { /* ... IDENTICO ... */ });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { /* ... IDENTICO ... */ });
    async function initializeApp() { /* ... IDENTICO (con i suoi console.log) ... */ }
    
    // INCOLLA QUI SOTTO TUTTE LE FUNZIONI DAL FILE "script.js (UNICO BLOCCO - COMPLETO E CORRETTO)"
    // CHE HAI TESTATO E TI HA DATO L'ERRORE DI "stepItemsHTML is not defined", ESCLUDENDO però la populateBrands
    // che è già definita qui sopra con la nuova diagnostica.
    //
    // Esempio di quali funzioni incollare:
    // fetchCSVData (come era)
    // parseCSV (come era)
    // processLoadedData (come era)
    // updateStepIndicator (come era)
    // showStep (come era)
    // clearFutureSelections (come era)
    // brandChanged, configChanged, ueChanged (come erano)
    // createSelectionItem (come era)
    // createUnitSelectionCard (come era)
    // populateConfigTypes (come era)
    // populateOutdoorUnits (come era)
    // populateIndoorUnitSelectors (come era)
    // checkAllIndoorUnitsSelected (come era)
    // generateSummary (come era)
    // i listener per stepIndicatorItems, finalizeBtn, prev-btn, reset, print (come erano)
    // initializeApp (come era)

    initializeApp(); // Questa chiamata deve rimanere qui alla fine
    console.log("DEBUG: Script.js caricato ed eseguito fino alla fine di DOMContentLoaded.");
});