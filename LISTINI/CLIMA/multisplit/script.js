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
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.textContent = 'Caricamento dati...';

    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-4", 4: "step-5", 5: "step-6" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-4": 3, "step-5": 4, "step-6": 5 };
    const TOTAL_LOGICAL_STEPS = 5;

    async function fetchCSVData(url) { /* ... identico ... */ }
    function parseCSV(text) { /* ... identico, con la correzione di prima ... */ }
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) { /* ... identico ... */ }
    function updateStepIndicator() { /* ... identico ... */ }
    function showStep(logicalStepNumber, fromDirectNavigation = false) { /* ... identico ... */ }
    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) { /* ... identico ... */ }
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ... identico ... */ }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ... identico ... */ }
    
    function populateBrands(){
        brandSelectionDiv.innerHTML = '';
        
        // DIAGNOSTICA AGGIUNTA QUI:
        console.log("populateBrands - APP_DATA.brands (statici):", JSON.parse(JSON.stringify(APP_DATA.brands)));
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId))];
        console.log("populateBrands - brandId unici trovati in APP_DATA.outdoorUnits (da CSV):", uniqueBrandIdsFromUEs);

        const brandsToShow = APP_DATA.brands.filter(b_static => 
            APP_DATA.outdoorUnits.some(ue_csv => ue_csv.brandId === b_static.id)
        );
        
        // DIAGNOSTICA AGGIUNTA QUI:
        console.log("populateBrands - brandsToShow (dopo il filtro):", JSON.parse(JSON.stringify(brandsToShow)));

        if (brandsToShow.length === 0) {
            brandSelectionDiv.innerHTML = '<p>Nessuna marca con unità esterne disponibili è stata trovata nei dati caricati. Controllare i CSV e la corrispondenza delle marche.</p>';
            // Potresti voler mostrare anche uniqueBrandIdsFromUEs qui se non vuoto, per aiutare il debug.
            if (uniqueBrandIdsFromUEs.length > 0) {
                brandSelectionDiv.innerHTML += `<p>Marche trovate nel CSV UE: ${uniqueBrandIdsFromUEs.join(', ')}. Assicurarsi che gli ID in APP_DATA.brands corrispondano.</p>`;
            }
            return;
        }

        brandsToShow.forEach(brand => { 
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand);
                selections.brand = selectedBrand;
                if (brandHasChanged) { clearFutureSelections(0, false); highestLogicalStepCompleted = 0; }
                populateConfigTypes(!brandHasChanged && !!selections.configType);
                showStep(2);
            }, selections.brand && selections.brand.id === brand.id));
        });

        // Ripristina la selezione se presente e ancora valida
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) {
            populateConfigTypes(true); // Se la marca era già selezionata e valida, ripopola le config
        } else if (selections.brand) { // La marca selezionata non è più tra quelle da mostrare
            selections.brand = null; // Deselezionala
        }
    }

    function populateConfigTypes(restoring = false) { /* ... identico ... */ }
    function populateOutdoorUnits(restoring = false) { /* ... identico ... */ }
    function populateIndoorUnitSelectors(restoring = false) { /* ... identico ... */ }
    function checkAllIndoorUnitsSelected() { /* ... identico ... */ }
    function generateSummary() { /* ... identico ... */ }
    
    stepIndicatorItems.forEach(item => { /* ... identico ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... identico ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... identico ... */ });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { /* ... identico ... */ });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { /* ... identico ... */ });

    async function initializeApp() { /* ... identico ... */ }
    initializeApp();
});