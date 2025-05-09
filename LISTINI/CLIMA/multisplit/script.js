// --- START OF SCRIPT.JS (FIREBASE - 6 STEP FLOW - REFINEMENTS V1) ---
// Flow: Marca -> Config -> Modello -> UE -> UI Taglie -> Riepilogo

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (6-Step Flow - Refinements V1)");

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyCWHMshTGoiZbRj_nK0uoZjHCv8fe2UnaU", 
        authDomain: "clima-multisplit.firebaseapp.com",   
        projectId: "clima-multisplit",                    
        storageBucket: "clima-multisplit.appspot.com", 
        messagingSenderId: "314966609042",            
        appId: "1:314966609042:web:694658c76e56579b12ea4b", 
        measurementId: "G-MWFX55K8CH"                     
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // --- App Data & State ---
    const APP_DATA = {
        brands: [], uiSeriesImageMapping: {}, configTypes: {}, 
        outdoorUnits: [], indoorUnits: [] 
    };
    let currentLogicalStep = 1;
    let highestLogicalStepCompleted = 0;
    const selections = { 
        brand: null, configType: null, indoorSeries: null, 
        outdoorUnit: null, indoorUnits: [] 
    };

    // --- DOM Element References ---
    const brandSelectionDiv = document.getElementById('brand-selection');        
    const configTypeSelectionDiv = document.getElementById('config-type-selection'); 
    const indoorSeriesSelectionDiv = document.getElementById('model-selection'); // Corresponds to HTML #step-2 for "Modello"
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection');
    const indoorUnitsSelectionArea = document.getElementById('indoor-units-selection-area');
    const summaryDiv = document.getElementById('config-summary');            
    const finalizeBtn = document.getElementById('finalize-btn');
    const stepsHtmlContainers = document.querySelectorAll('.config-step'); 
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.innerHTML = '<div class="loading-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px;"></div><p>Caricamento dati...</p><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

    // --- Step Mapping ---
    const TOTAL_LOGICAL_STEPS = 6;
    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-2", 4: "step-4", 5: "step-5", 6: "step-6" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-2": 3, "step-4": 4, "step-5": 5, "step-6": 6 };
    const LOGICAL_STEP_NAMES = [ "Marca", "Config.", "Modello", "Unità Est.", "Unità Int.", "Riepilogo" ]; // Updated "Modello"

    // --- Utility & Data Fetching / Processing ---
    async function fetchFirestoreCollection(collectionName) {
        // ... (no change)
        console.log(`DEBUG: Fetching Firestore collection: ${collectionName}`);
        try {
            const snapshot = await db.collection(collectionName).get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`DEBUG: Fetched ${data.length} items from ${collectionName}.`);
            return data;
        } catch (error) {
            console.error(`DEBUG: Error fetching collection ${collectionName}:`, error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore caricamento ${collectionName}. Controlla console.</span>`;
            return [];
        }
    }

    function parsePowerString(powerStr) {
        // ... (no change from previous full script version)
        let btu = 0; let kw = "N/A";
        if (typeof powerStr === 'string' && powerStr !== "Dati mancanti") {
            const btuMatch = powerStr.match(/([\d.,]+)\s*BTU/i);
            if (btuMatch && btuMatch[1]) btu = parseInt(btuMatch[1].replace(/[.,]/g, ''), 10) || 0;
            const kwMatch = powerStr.match(/([\d.,]+)\s*kW/i);
            if (kwMatch && kwMatch[1]) kw = kwMatch[1].replace(',', '.');
            else if (btu > 0 && kw === "N/A") kw = (btu / 3412.14).toFixed(1);
        } return { btu, kw };
    }

    function sanitizeForId(str) {
        // ... (no change from previous full script version)
         if (!str) return '';
         return String(str).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
    }

    function processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs) {
        // ... (Logic for brands, configTypes, uiSeriesImageMapping remains the same) ...
        console.log("DEBUG: Processing Firestore data. Brands:", brandsDocs.length, "Configs:", configTypesDocs.length, "Series Maps:", seriesMapDocs.length, "UE:", outdoorUnitsDocs.length, "UI:", indoorUnitsDocs.length);
        APP_DATA.brands = brandsDocs; 
        APP_DATA.configTypes = configTypesDocs.reduce((acc, ct) => { acc[ct.id] = { id: ct.id, name: ct.name, numUnits: ct.numUnits }; return acc; }, {});
        APP_DATA.uiSeriesImageMapping = seriesMapDocs.reduce((acc, mapping) => { if(mapping.seriesKey) acc[mapping.seriesKey] = mapping.imageName; return acc; }, {});
        
        // Outdoor Units
        APP_DATA.outdoorUnits = outdoorUnitsDocs.map((ue_doc, index) => {
            const brandId = String(ue_doc.marca || 'sconosciuta').toLowerCase(); 
            const connections = Number(ue_doc.unit_collegabili) || 0; // Max UIs
            const minConnections = Number(ue_doc.min_connessioni_ue) || (connections > 0 ? (connections < 2 ? 1 : 2) : 1); // Min UIs, with fallback
            const uePotenzaKw = Number(ue_doc.potenza) || 0; // From migration, 'potenza' for UE is kW

            const coolingBTU_UE = Math.round(uePotenzaKw * 3412.14); // 1 kW ≈ 3412.14 BTU
            const heatingBTU_UE = coolingBTU_UE; // Placeholder, often differs

            return {
                id: ue_doc.id || `ue_${index}`, brandId: brandId, 
                modelCode: ue_doc.codice_prodotto || "N/A", 
                name: ue_doc.nome_modello_ue && ue_doc.nome_modello_ue !== "Dati mancanti" ? `${String(ue_doc.marca || '').toUpperCase()} ${ue_doc.nome_modello_ue}` : `UE ${String(ue_doc.marca || '').toUpperCase()} (${ue_doc.codice_prodotto || 'ID: ' + ue_doc.id})`,
                kw: uePotenzaKw, // STORE KW for Outdoor Unit
                connections: connections, minConnections: minConnections, 
                capacityCoolingBTU: coolingBTU_UE, capacityHeatingBTU: heatingBTU_UE, 
                price: Number(ue_doc.prezzo) || 0, 
                dimensions: ue_doc.dimensioni_ue || "N/A", 
                weight: (ue_doc.peso_ue !== "Dati mancanti" && ue_doc.peso_ue !== undefined) ? ue_doc.peso_ue : "N/D", 
                energyClassCooling: ue_doc.classe_energetica_raffrescamento || "N/D", 
                energyClassHeating: ue_doc.classe_energetica_riscaldamento || "N/D", 
                compatibleIndoorSeriesIds: Array.isArray(ue_doc.compatibleIndoorSeriesIds) ? ue_doc.compatibleIndoorSeriesIds : [] 
            };
        });
        // Indoor Units (no change from previous complete script in this function's body)
        APP_DATA.indoorUnits = indoorUnitsDocs.map((ui_doc, index) => {
            const brandId = String(ui_doc.marca || 'sconosciuta').toLowerCase(); const seriesName = String(ui_doc.modello || `serie_${index}`).trim(); const seriesId = sanitizeForId(seriesName) + "_ui"; const { btu, kw } = parsePowerString(ui_doc.potenza); let imagePath = "";
            if (ui_doc.percorso_immagine_ui && ui_doc.percorso_immagine_ui !== "Dati mancanti") { imagePath = ui_doc.percorso_immagine_ui; } else { let imageNameMapped = APP_DATA.uiSeriesImageMapping[seriesId]; if (!imageNameMapped) { imageNameMapped = sanitizeForId(seriesName); } imagePath = `img/${imageNameMapped}.png`; }
            return { id: ui_doc.id || `ui_${index}`, brandId: brandId, seriesId: seriesId, seriesName: seriesName, modelCode: ui_doc.codice_prodotto || "N/A", name: `${String(ui_doc.marca || '').toUpperCase()} ${seriesName} ${kw}kW (${btu} BTU)`, type: String(ui_doc.tipo_unit || 'Parete').toLowerCase() === "interna" ? "Parete" : ui_doc.tipo_unit, capacityBTU: btu, kw: kw, price: Number(ui_doc.prezzo_ui) || 0, image: imagePath, dimensions: ui_doc.dimensioni_ui || "N/A", wifi: ui_doc.wifi === true };
        });
        console.log("DEBUG: Processing Firestore data finished.");
        console.log("DEBUG: First Processed UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.stringify(APP_DATA.outdoorUnits[0]) : "ND");
        console.log("DEBUG: First Processed UI:", APP_DATA.indoorUnits.length > 0 ? JSON.stringify(APP_DATA.indoorUnits[0]) : "ND");
    }
    
    // --- UI Element Creation Helper Functions ---
    
    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        // ... (No change needed for now for item 5 logic regarding "1 scelta" or series images)
        // ... (It will use the existing logic for displaying items in grids)
        const itemDiv = document.createElement('div'); itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected'); 
        itemDiv.dataset[type + 'Id'] = item.id; 
        
        let logoSrc = ''; 
        if (type === 'brand' && item.logo) {
            logoSrc = item.logo;
        } else if (type === 'series' && item.image) { // For Item 5: If we add an image to series object
            logoSrc = item.image; // Assume item = {name: "REVIVE", id: "revive_ui", image: "path/to/revive_series_image.png"}
            itemDiv.classList.add('series-selection-item'); // Add specific class for styling
        }

        const nameSpan = document.createElement('span'); nameSpan.textContent = item.name; 
        
        if (logoSrc) {
            const logoImg = document.createElement('img'); logoImg.src = logoSrc; logoImg.alt = `${item.name} Immagine`;
            if (type === 'brand') logoImg.classList.add('brand-logo');
            if (type === 'series') logoImg.classList.add('series-logo'); // Class for series image
            
            logoImg.onload = () => { if (type === 'brand') nameSpan.style.display = 'none'; }; // Hide text if brand logo loads
            logoImg.onerror = () => { console.warn(`DEBUG: Errore caricamento logo/immagine ${logoSrc}`); logoImg.style.display = 'none'; nameSpan.style.display = 'block'; };
            itemDiv.appendChild(logoImg);
            if (type === 'brand') nameSpan.style.display = 'none'; 
        } else {
             nameSpan.style.display = 'block'; 
        }
        itemDiv.appendChild(nameSpan);

        itemDiv.addEventListener('click', () => {
            const siblings = itemDiv.parentElement.querySelectorAll('.selection-item.selected');
            siblings.forEach(el => el.classList.remove('selected'));
            itemDiv.classList.add('selected');
            clickHandler(item); 
        }); 
        return itemDiv;
    }
    
   function createUnitSelectionCard(unit, clickHandler, isSelected = false) {
        const card = document.createElement('div'); 
        card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected'); 
        card.dataset.unitId = unit.id; 
        card.style.flexDirection = "column"; card.style.alignItems = 'flex-start'; 
        const infoDiv = document.createElement('div'); 
        infoDiv.classList.add('unit-info'); infoDiv.style.width = '100%';

        const nameH4 = document.createElement('h4'); 
        // Item 6: Outdoor Unit card title
        let unitTitle = "UNITA' ESTERNA";
        if (unit.kw && unit.kw !== "Dati mancanti" && unit.kw !== 0 && unit.kw !== "N/A") { // Check if kW is valid
            unitTitle += ` ${unit.kw}kW`;
        }
        nameH4.textContent = unitTitle; 
        infoDiv.appendChild(nameH4);
        
        // Add the original model name below the kW title for clarity
        const modelNameP = document.createElement('p');
        modelNameP.style.fontSize = '0.9em';
        modelNameP.style.color = 'var(--secondary-color)';
        modelNameP.textContent = `(${unit.name || "Dettagli modello non disponibili"})`; // Show full processed name here
        infoDiv.appendChild(modelNameP);

        const modelP = document.createElement('p'); 
        modelP.innerHTML = `Codice: <strong>${unit.modelCode || 'N/A'}</strong> | Max UI Collegabili: ${unit.connections === undefined || unit.connections === null ? '?' : unit.connections}`; 
        infoDiv.appendChild(modelP);

        const capacityP = document.createElement('p'); 
        capacityP.textContent = `Potenza (Freddo/Caldo BTU): ${unit.capacityCoolingBTU || '?'} / ${unit.capacityHeatingBTU || '?'}`; 
        infoDiv.appendChild(capacityP);
        // ... (rest of the card remains the same from previous full script version) ...
        const energyClassP = document.createElement('p'); 
        energyClassP.innerHTML = `Classe Energetica (F/C): <strong>${unit.energyClassCooling || '?'}</strong> / <strong>${unit.energyClassHeating || '?'}</strong>`; 
        infoDiv.appendChild(energyClassP);

        const dimensionsP = document.createElement('p');
        let dimText = unit.dimensions && unit.dimensions !== "N/A" ? `Dimensioni (LxAxP): ${unit.dimensions}` : "Dimensioni: N/A";
        if (unit.weight && unit.weight !== "N/D") { 
            dimText += ` | Peso: ${unit.weight} kg`; 
        } else if (unit.weight === "N/D") { dimText += ` | Peso: N/D`; }
        else { dimText += ` | Peso: ?`; }
        dimensionsP.textContent = dimText; 
        infoDiv.appendChild(dimensionsP);

        const priceP = document.createElement('p'); 
        priceP.classList.add('unit-price'); 
        priceP.textContent = `Prezzo: ${typeof unit.price === 'number' ? unit.price.toFixed(2) : (unit.price || 'N/D')} € (IVA escl.)`; 
        infoDiv.appendChild(priceP);
        
        card.appendChild(infoDiv);
        card.addEventListener('click', () => { card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected')); card.classList.add('selected'); clickHandler(unit); });
        return card;
    }

    // --- UI Population Functions (Step logic from previous complete script) ---
    
    // STEP 1: MARCA
    function populateBrands() { /* ... (Keep logic as in previous "COMPLETE WITH HELPERS" script) ... */ 
        brandSelectionDiv.innerHTML = ''; console.log("DEBUG: populateBrands called...");
        if (!APP_DATA.outdoorUnits || APP_DATA.outdoorUnits.length === 0) { brandSelectionDiv.innerHTML = '<p>Dati unità esterne non disponibili.</p>'; return; }
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId).filter(id => id && id !== 'sconosciuta'))]; 
        const brandsToShow = APP_DATA.brands.filter(b => uniqueBrandIdsFromUEs.includes(b.id));
        console.log(`DEBUG: Brands to show: ${brandsToShow.length}`);
        if (brandsToShow.length === 0) { brandSelectionDiv.innerHTML = '<p>Nessuna marca trovata con unità esterne associate.</p>'; return; }
        brandsToShow.forEach(brand => { brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => { const brandHasChanged = selections.brand?.id !== selectedBrand.id; selections.brand = selectedBrand; if (brandHasChanged) { clearFutureSelections(1, false); highestLogicalStepCompleted = 1; } populateConfigTypes(!brandHasChanged && !!selections.configType); showStep(2); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 1); updateStepIndicator(); }, selections.brand && selections.brand.id === brand.id)); });
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) { populateConfigTypes(true); } else if (selections.brand) { selections.brand = null; }
    }

    // STEP 2: CONFIG TYPE
    function populateConfigTypes(restoring = false) { /* ... (Keep logic) ... */ 
        configTypeSelectionDiv.innerHTML = ''; if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>Seleziona marca.</p>'; if(restoring) selections.configType = null; return; }
        console.log(`DEBUG: populateConfigTypes for Brand: ${selections.brand.id}`);
        const configTypeList = Object.values(APP_DATA.configTypes); const validConfigs = configTypeList.filter(ct => APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= ct.numUnits && ue.minConnections <= ct.numUnits)).sort((a, b) => a.numUnits - b.numUnits); 
        console.log(`DEBUG: Valid Configs found: ${validConfigs.length}`);
        if (validConfigs.length === 0) { configTypeSelectionDiv.innerHTML = `<p>Nessuna config. trovata per UE ${selections.brand.name}. Verifica i dati delle UE (unit_collegabili e min_connessioni_ue).</p>`; if (restoring) selections.configType = null; return; }
        validConfigs.forEach(item => { configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => { const configHasChanged = selections.configType?.id !== selectedConfig.id; selections.configType = selectedConfig; if (configHasChanged) { clearFutureSelections(2, false); highestLogicalStepCompleted = 2; } populateIndoorSeries(!configHasChanged && !!selections.indoorSeries); showStep(3); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 2); updateStepIndicator(); }, selections.configType && selections.configType.id === item.id)); });
        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) { populateIndoorSeries(true); } else if (restoring && selections.configType) { selections.configType = null; }
    }

    // STEP 3: INDOOR SERIES / MODELLO UI (New)
    function populateIndoorSeries(restoring = false) { /* ... (Keep logic, but check if item.image is passed to createSelectionItem if you implement model images here) ... */
        // If point 5 about showing ONLY 1 model choice becomes a hard requirement, this function's filtering needs review.
        // For now, it shows all compatible unique series.
        // For image with series selection (Point 5 extension):
        // When calling createSelectionItem: { name: series.name, id: series.id, image: firstUiOfThisSeries.image }
        // Need to find `firstUiOfThisSeries` inside the uniqueSeries.forEach loop.
        indoorSeriesSelectionDiv.innerHTML = ''; if (!selections.brand || !selections.configType) { indoorSeriesSelectionDiv.innerHTML = '<p>Seleziona Marca e Config.</p>'; if (restoring) selections.indoorSeries = null; return; }
        console.log(`DEBUG: populateIndoorSeries - Brand: ${selections.brand.id}, Config: ${selections.configType.id}`);
        const candidateUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections >= selections.configType.numUnits && ue.minConnections <= selections.configType.numUnits);
        if (candidateUEs.length === 0) { indoorSeriesSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} compatibile con config. ${selections.configType.name}.</p>`; if (restoring) selections.indoorSeries = null; return; }
        const compatibleSeriesIdsSet = new Set(); candidateUEs.forEach(ue => { if (Array.isArray(ue.compatibleIndoorSeriesIds)) ue.compatibleIndoorSeriesIds.forEach(id => compatibleSeriesIdsSet.add(id)); });
        console.log(`DEBUG: Compatible UI Series IDs from UEs:`, [...compatibleSeriesIdsSet]);
        const validIndoorUnitsForSeriesSelection = APP_DATA.indoorUnits.filter(ui => ui.brandId === selections.brand.id && compatibleSeriesIdsSet.has(ui.seriesId));
        const uniqueSeries = []; const seenSeriesNames = new Set(); 
        validIndoorUnitsForSeriesSelection.forEach(ui => { 
            if (!seenSeriesNames.has(ui.seriesName)) { 
                // For point 5 - show series image: find an image for this series
                let representativeImage = APP_DATA.uiSeriesImageMapping[ui.seriesId] ? `img/${APP_DATA.uiSeriesImageMapping[ui.seriesId]}.png` : (ui.image || null) ; // Prefer mapping, fallback to first UI's image
                
                uniqueSeries.push({ 
                    name: ui.seriesName, 
                    id: ui.seriesId,
                    image: representativeImage // Pass to createSelectionItem
                }); 
                seenSeriesNames.add(ui.seriesName); 
            } 
        });
        console.log(`DEBUG: Unique Series for Selection:`, uniqueSeries);
        if (uniqueSeries.length === 0) { indoorSeriesSelectionDiv.innerHTML = `<p>Nessuna Serie UI ${selections.brand.name} trovata compatibile con UE per config. ${selections.configType.name}.</p>`; if (restoring) selections.indoorSeries = null; return; }
        uniqueSeries.sort((a, b) => a.name.localeCompare(b.name));
        uniqueSeries.forEach(series => { indoorSeriesSelectionDiv.appendChild(createSelectionItem(series, 'series', (selectedSeries) => { const seriesHasChanged = selections.indoorSeries?.id !== selectedSeries.id; selections.indoorSeries = selectedSeries; if (seriesHasChanged) { clearFutureSelections(3, false); highestLogicalStepCompleted = 3; } populateOutdoorUnits(!seriesHasChanged && !!selections.outdoorUnit); showStep(4); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); updateStepIndicator(); }, selections.indoorSeries && selections.indoorSeries.id === series.id)); });
        if(restoring && selections.indoorSeries && uniqueSeries.some(s => s.id === selections.indoorSeries.id)) { populateOutdoorUnits(true); } else if (restoring && selections.indoorSeries) { selections.indoorSeries = null; }
    }


    // STEP 4: OUTDOOR UNIT (Check filter logic with `minConnections`)
    function populateOutdoorUnits(restoring = false) { 
        /* ... (Logic for filtering with ue.connections >= numRequired && ue.minConnections <= numRequired from previous version seems correct based on new info.) ... */
        // No change needed to filtering logic itself if data and processing is correct.
        // Just ensure the console.log and message for empty results are clear.
        outdoorUnitSelectionDiv.innerHTML = ''; if (!selections.brand || !selections.configType || !selections.indoorSeries) { outdoorUnitSelectionDiv.innerHTML = '<p>Seleziona Marca, Config., Modello.</p>'; if(restoring) selections.outdoorUnit = null; return; } // Changed Serie to Modello
        console.log(`DEBUG: populateOutdoorUnits - Brand: ${selections.brand.id}, Config: ${selections.configType.id}, Modello: ${selections.indoorSeries.id}`);
        const numRequired = selections.configType.numUnits; const requiredSeriesId = selections.indoorSeries.id;
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections >= numRequired && ue.minConnections <= numRequired && Array.isArray(ue.compatibleIndoorSeriesIds) && ue.compatibleIndoorSeriesIds.includes(requiredSeriesId));
        console.log(`DEBUG: Found ${compatibleUEs.length} compatible UEs for series ${requiredSeriesId}. (Req: ${numRequired}, Max: ${compatibleUEs[0]?.connections}, Min: ${compatibleUEs[0]?.minConnections})`);
        if (compatibleUEs.length === 0) { outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna Unità Esterna ${selections.brand.name} trovata per Config. ${selections.configType.name} che sia compatibile con il Modello UI "${selections.indoorSeries.name}". Ricontrolla `+"`unità_collegabili`"+`, `+"`min_connessioni_ue`"+` (deve includere ${numRequired}), e `+"`compatibleIndoorSeriesIds`"+` delle unità esterne.</p>`; if(restoring) selections.outdoorUnit = null; return; }
        compatibleUEs.forEach(ue => { outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => { const ueHasChanged = selections.outdoorUnit?.id !== selectedUE.id; selections.outdoorUnit = selectedUE; if (ueHasChanged) { clearFutureSelections(4, false); highestLogicalStepCompleted = 4; } populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0 && selections.indoorUnits.some(ui => ui !== null)); showStep(5); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); updateStepIndicator(); }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id)); });
        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) { populateIndoorUnitSelectors(true); } else if (restoring && selections.outdoorUnit) { selections.outdoorUnit = null; }
    }
    
    // STEP 5: INDOOR UNIT SIZES/VARIANTS
    function populateIndoorUnitSelectors(restoring = false) { /* ... (Item 6 bold text) ... */ 
        indoorUnitsSelectionArea.innerHTML = ''; if (!selections.outdoorUnit || !selections.configType || !selections.brand || !selections.indoorSeries) { indoorUnitsSelectionArea.innerHTML = `<p>Completa i passaggi precedenti.</p>`; checkAllIndoorUnitsSelected(); return; }
        console.log(`DEBUG: populateIndoorUnitSelectors - Modello Scelto: ${selections.indoorSeries.name} (${selections.indoorSeries.id})`);
        const availableIndoorUnitsForSeries = APP_DATA.indoorUnits.filter(ui => ui.brandId === selections.brand.id && ui.seriesId === selections.indoorSeries.id).sort((a,b) => a.capacityBTU - b.capacityBTU);
        if (availableIndoorUnitsForSeries.length === 0) { indoorUnitsSelectionArea.innerHTML = `<p>Nessuna variante/taglia trovata per il modello ${selections.indoorSeries.name}.</p>`; checkAllIndoorUnitsSelected(); return; }
        console.log(`DEBUG: Unità disponibili per modello ${selections.indoorSeries.name}: ${availableIndoorUnitsForSeries.length}`);
        let validRestore = restoring && selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui === null || (ui && ui.seriesId === selections.indoorSeries.id));
        if (!validRestore) { console.log("DEBUG: Resetting indoor units selection array."); selections.indoorUnits = new Array(selections.configType.numUnits).fill(null); }
        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div'); slotDiv.classList.add('indoor-unit-slot'); slotDiv.style.marginBottom = '20px'; slotDiv.style.paddingBottom = '15px'; slotDiv.style.borderBottom = '1px dashed #eee';
            const label = document.createElement('label'); label.htmlFor = `indoor-unit-select-${i}`; label.innerHTML = `Unità Interna ${i + 1} (<strong>Modello: ${selections.indoorSeries.name}</strong>):`; label.style.cssText = 'display: block; margin-bottom: 5px; font-weight: 500;'; slotDiv.appendChild(label); // Added bold
            const select = document.createElement('select'); select.id = `indoor-unit-select-${i}`; select.dataset.index = i; select.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 10px;';
            const placeholder = document.createElement('option'); placeholder.value = ""; placeholder.textContent = "-- Seleziona Taglia/Potenza --"; select.appendChild(placeholder);
            availableIndoorUnitsForSeries.forEach(uiVariant => { const option = document.createElement('option'); option.value = uiVariant.id; option.innerHTML = `${uiVariant.modelCode} - <strong>${uiVariant.kw}kW (${uiVariant.capacityBTU} BTU)</strong> - Prezzo: ${uiVariant.price.toFixed(2)}€`; if (validRestore && selections.indoorUnits[i] && selections.indoorUnits[i].id === uiVariant.id) { option.selected = true; } select.appendChild(option); }); // Made parts bold
            const detailsDiv = document.createElement('div'); detailsDiv.classList.add('unit-details'); detailsDiv.style.cssText = 'font-size: 0.9em; padding-left: 10px;';
            if (validRestore && selections.indoorUnits[i]) { const currentUI = selections.indoorUnits[i]; detailsDiv.innerHTML = `<p style="margin: 3px 0;">Codice Selezionato: <strong>${currentUI.modelCode}</strong></p><p style="margin: 3px 0;">Potenza: <strong>${currentUI.kw}kW (${currentUI.capacityBTU} BTU)</strong> - Prezzo: <strong>${currentUI.price.toFixed(2)}€</strong></p>${currentUI.image ? `<img src="${currentUI.image}" alt="${currentUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px; background: transparent;">` : ''}`; } // Bolding details
            select.addEventListener('change', (e) => { const selectedId = e.target.value; const unitIndex = parseInt(e.target.dataset.index); const selectedUIVariant = availableIndoorUnitsForSeries.find(u => u.id === selectedId); selections.indoorUnits[unitIndex] = selectedUIVariant || null; if (selectedUIVariant) { const currentUI = selectedUIVariant; detailsDiv.innerHTML = `<p style="margin: 3px 0;">Codice Selezionato: <strong>${currentUI.modelCode}</strong></p><p style="margin: 3px 0;">Potenza: <strong>${currentUI.kw}kW (${currentUI.capacityBTU} BTU)</strong> - Prezzo: <strong>${currentUI.price.toFixed(2)}€</strong></p>${currentUI.image ? `<img src="${currentUI.image}" alt="${currentUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px; background: transparent;">` : ''}`; } else { detailsDiv.innerHTML = ''; } checkAllIndoorUnitsSelected(); }); // Bolding details
            slotDiv.appendChild(select); slotDiv.appendChild(detailsDiv); indoorUnitsSelectionArea.appendChild(slotDiv);
        }
        checkAllIndoorUnitsSelected(); 
    }

    // STEP 6: SUMMARY
    function generateSummary() { /* ... (Item 6 bold text for UI) ... */
        console.log("DEBUG: generateSummary called. Selections:", JSON.parse(JSON.stringify(selections))); summaryDiv.innerHTML = ''; 
        if (!selections.brand || !selections.configType || !selections.indoorSeries || !selections.outdoorUnit ) { summaryDiv.innerHTML = "<p>Configurazione incompleta.</p>"; return; }
        if (selections.configType.numUnits > 0 && (selections.indoorUnits.length !== selections.configType.numUnits || selections.indoorUnits.some(ui => !ui))) { summaryDiv.innerHTML = "<p>Selezione UI incomplete.</p>"; return; }
        let totalNominalBTU_UI = 0; let totalPrice = selections.outdoorUnit.price || 0;
        const valOrNA = (val, suffix = '') => (val !== undefined && val !== null && val !== '' && val !== "Dati mancanti") ? `${val}${suffix}` : 'N/A'; const priceOrND = (price) => typeof price === 'number' ? price.toFixed(2) + " €" : 'N/D';
        const summaryHTML = ` <div class="summary-block"> <h3>Selezione Utente</h3> <p><strong>Marca:</strong> ${selections.brand.name}</p> <p><strong>Configurazione:</strong> ${selections.configType.name} (${selections.configType.numUnits} UI)</p> <p><strong>Modello UI:</strong> ${selections.indoorSeries.name}</p> </div> <div class="summary-block"> <h3>Unità Esterna</h3> <h4>UNITA' ESTERNA ${selections.outdoorUnit.kw && selections.outdoorUnit.kw !== "N/A" && selections.outdoorUnit.kw !== 0 ? selections.outdoorUnit.kw + 'kW' : ''}</h4> <p><em>(${selections.outdoorUnit.name})</em></p> <p><strong>Codice:</strong> ${valOrNA(selections.outdoorUnit.modelCode)}</p> <p><strong>Potenza (F/C BTU):</strong> ${valOrNA(selections.outdoorUnit.capacityCoolingBTU, ' BTU')} / ${valOrNA(selections.outdoorUnit.capacityHeatingBTU, ' BTU')}</p> <p><strong>Classe Energetica (F/C):</strong> ${valOrNA(selections.outdoorUnit.energyClassCooling)} / ${valOrNA(selections.outdoorUnit.energyClassHeating)}</p> <p><strong>Dimensioni:</strong> ${valOrNA(selections.outdoorUnit.dimensions)}</p> <p><strong>Peso:</strong> ${valOrNA(selections.outdoorUnit.weight, ' kg')}</p> <p class="price-highlight"><strong>Prezzo UE:</strong> ${priceOrND(selections.outdoorUnit.price)} (IVA Escl.)</p> </div> ${selections.configType.numUnits > 0 ? ` <div class="summary-block"> <h3>Unità Interne (Modello ${selections.indoorSeries.name})</h3> ${selections.indoorUnits.map((ui, index) => { if (!ui) return `<div class="summary-indoor-unit error">UI ${index + 1} non selezionata.</div>`; totalNominalBTU_UI += ui.capacityBTU || 0; totalPrice += ui.price || 0; return ` <div class="summary-indoor-unit" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;"> <h4>Unità ${index + 1}: <strong>${ui.seriesName}</strong></h4> ${ui.image ? `<img src="${ui.image}" alt="${ui.name}" class="summary-ui-img" style="float:right; margin-left:10px; object-fit:contain;">` : ''} <p><strong>Codice:</strong> ${valOrNA(ui.modelCode)}</p> <p><strong>Potenza: ${valOrNA(ui.kw, 'kW')} (${valOrNA(ui.capacityBTU, ' BTU')})</strong></p> <p><strong>Tipo:</strong> ${valOrNA(ui.type)}</p> <p><strong>Dimensioni:</strong> ${valOrNA(ui.dimensions)}</p> <p><strong>WiFi:</strong> ${ui.wifi ? 'Sì' : 'No'}</p> <p class="price-highlight"><strong>Prezzo UI:</strong> ${priceOrND(ui.price)} (IVA Escl.)</p> <div style="clear:both;"></div> </div> `; }).join('')} </div> ` : '<div class="summary-block"><p>Nessuna UI richiesta.</p></div>'} <div class="summary-total" style="margin-top:20px; padding-top:15px; border-top: 2px solid var(--primary-color);"> ${selections.configType.numUnits > 0 ? `<p><strong>Somma Potenza Nominale UI:</strong> ${totalNominalBTU_UI} BTU</p>` : ''} <p style="font-size: 1.2em; font-weight: bold;"><strong>Prezzo Totale Config.:</strong> <span class="total-price-value">${priceOrND(totalPrice)}</span> (IVA Escl.)</p> </div> `;
        summaryDiv.innerHTML = summaryHTML; document.getElementById('summary-main-title')?.classList.add('print-main-title'); console.log("DEBUG: Riepilogo generato. Prezzo Totale:", totalPrice);
    }
    
    // --- State Management & Navigation Logic (Keep as is from previous full script) ---
    // ... showStep, clearFutureSelections, checkAllIndoorUnitsSelected, updateStepIndicator, initializeNavigation ...

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) { console.warn("Invalid logical step:", logicalStepNumber); return; }
        const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
        if (!htmlContainerId) { console.error("No HTML ID for step:", logicalStepNumber); return; }
        if (!fromDirectNavigation) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1); } 
        else if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1) {
             const canJumpToSummary = logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted >= TOTAL_LOGICAL_STEPS - 1;
             if (!canJumpToSummary && logicalStepNumber !== TOTAL_LOGICAL_STEPS) { console.log(`Nav blocked: ${logicalStepNumber}, highest: ${highestLogicalStepCompleted}`); return; }
        }
        stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) { targetStepEl.classList.add('active-step'); } 
        else { console.error(`HTML container '${htmlContainerId}' not found.`); }
        currentLogicalStep = logicalStepNumber;
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted + 1) { clearFutureSelections(logicalStepNumber, true); } 
        updateStepIndicator(); window.scrollTo(0, 0);
    }

    function clearFutureSelections(targetLogicalStepToPreserve, preserveTargetLevelSelections = false) {
        console.log(`clearFutureSelections for step ${targetLogicalStepToPreserve}, preserve: ${preserveTargetLevelSelections}`);
        let actualTargetToPreserve = preserveTargetLevelSelections ? targetLogicalStepToPreserve : targetLogicalStepToPreserve - 1;

        if (actualTargetToPreserve < 5 && selections.indoorUnits.length > 0) { selections.indoorUnits = []; console.log("Cleared indoorUnits[]");}
        if (actualTargetToPreserve < 4 && selections.outdoorUnit) { selections.outdoorUnit = null; console.log("Cleared outdoorUnit");}
        if (actualTargetToPreserve < 3 && selections.indoorSeries) { selections.indoorSeries = null; console.log("Cleared indoorSeries");}
        if (actualTargetToPreserve < 2 && selections.configType) { selections.configType = null; console.log("Cleared configType");}
        if (actualTargetToPreserve < 1 && selections.brand) { selections.brand = null; console.log("Cleared brand");}
        
        // Always clear UI for steps beyond the preserve point
        if (actualTargetToPreserve < 5) indoorUnitsSelectionArea.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        if (actualTargetToPreserve < 4) outdoorUnitSelectionDiv.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        if (actualTargetToPreserve < 3) indoorSeriesSelectionDiv.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        if (actualTargetToPreserve < 2) configTypeSelectionDiv.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        if (actualTargetToPreserve < 1) brandSelectionDiv.innerHTML = '<p>Caricamento...</p>'; // Or appropriate message
        
        // Summary clear
        if (actualTargetToPreserve < TOTAL_LOGICAL_STEPS -1) { summaryDiv.innerHTML = ''; document.getElementById('summary-main-title')?.classList.remove('print-main-title'); }
        
        highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, actualTargetToPreserve);
        
        checkAllIndoorUnitsSelected(); 
        updateStepIndicator();
    }

    function checkAllIndoorUnitsSelected() { 
        let allSelected = true; 
        if (selections.configType && selections.configType.numUnits > 0) {
             allSelected = selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null && ui !== undefined);
        }
        if(finalizeBtn) { finalizeBtn.disabled = !allSelected; }
        if(allSelected) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); } 
        updateStepIndicator(); 
    }
    
    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        stepIndicatorItems.forEach((item, htmlIndex) => {
             const itemLogicalStep = htmlIndex + 1; 
             if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { item.style.display = 'none'; if (stepLinesHTML[htmlIndex-1]) stepLinesHTML[htmlIndex-1].style.display = 'none'; return; }
             item.style.display = ''; 
             item.dataset.step = itemLogicalStep;
             const nameEl = item.querySelector('.step-name'); 
             if(nameEl) nameEl.textContent = LOGICAL_STEP_NAMES[itemLogicalStep-1] || `Step ${itemLogicalStep}`;
             item.classList.remove('active', 'completed', 'disabled');
             const dot = item.querySelector('.step-dot'); 
             if(dot) { dot.classList.remove('active', 'completed'); dot.textContent = itemLogicalStep; }
             if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot?.classList.add('completed'); } 
             else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot?.classList.add('active'); }
             if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) { item.classList.add('disabled'); }
        });
        stepLinesHTML.forEach((line, htmlLineIndex) => {
             if (htmlLineIndex >= TOTAL_LOGICAL_STEPS - 1) { line.style.display = 'none'; return; }
             line.style.display = ''; line.classList.remove('active');
             const prevItem = stepIndicatorItems[htmlLineIndex]; 
             const prevItemLogicalStep = parseInt(prevItem?.dataset?.step);
             if (prevItem && prevItem.style.display !== 'none') { if (prevItem.classList.contains('completed')) { line.classList.add('active'); } else if (currentLogicalStep > prevItemLogicalStep) { line.classList.add('active'); } }
        });
    }

    function initializeNavigation() {
         stepIndicatorItems.forEach(item => { item.addEventListener('click', () => { if (item.classList.contains('disabled') || item.style.display === 'none') return; const targetLogicalStep = parseInt(item.dataset.step); if (isNaN(targetLogicalStep) || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return; console.log(`Indicator click -> Step ${targetLogicalStep}`); if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { const canShowSummary = selections.brand && selections.configType && selections.indoorSeries && selections.outdoorUnit && (!selections.configType.numUnits > 0 || (selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null))); if (!canShowSummary) { alert("Completa passaggi precedenti."); return; } generateSummary(); } showStep(targetLogicalStep, true); }); });
         if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { console.log("Finalize button clicked."); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); generateSummary(); showStep(TOTAL_LOGICAL_STEPS); }); }
         document.querySelectorAll('.prev-btn').forEach(button => { const currentStepElement = button.closest('.config-step'); if (!currentStepElement) return; const currentHtmlId = currentStepElement.id; const currentLogical = HTML_TO_LOGICAL_STEP_MAP[currentHtmlId]; if (currentLogical === undefined || currentLogical === 1) { button.style.display = 'none'; return; } let prevLogicalStep = currentLogical - 1; button.style.display = ''; button.addEventListener('click', () => { console.log(`Prev clicked: ${currentLogical} -> ${prevLogicalStep}`); showStep(prevLogicalStep, true); }); });
         document.getElementById('reset-config-btn')?.addEventListener('click', () => { console.log("Reset config clicked."); if (!confirm("Sei sicuro?")) return; highestLogicalStepCompleted = 0; selections.brand = null; selections.configType = null; selections.indoorSeries = null; selections.outdoorUnit = null; selections.indoorUnits = []; clearFutureSelections(0, false); summaryDiv.innerHTML = ''; if (finalizeBtn) finalizeBtn.disabled = true; document.getElementById('summary-main-title')?.classList.remove('print-main-title'); showStep(1); });
         document.getElementById('print-summary-btn')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Vai al Riepilogo (Passaggio 6) prima di stampare."); });
         document.getElementById('print-list')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Completa fino al Riepilogo (Passaggio 6)."); });
    }

    // --- Application Initialization ---
    async function initializeApp() {
        // ... (Keep as is from previous full script version, using metadataDoc directly)
        console.log("DEBUG: initializeApp started (6-Step Flow)");
        document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex';
        let brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc;
        try {
            console.log("DEBUG: Fetching all Firestore data...");
            [ brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc ] = 
            await Promise.all([
                fetchFirestoreCollection('brands'), fetchFirestoreCollection('configTypes'),
                fetchFirestoreCollection('uiSeriesImageMapping'), fetchFirestoreCollection('outdoorUnits'),
                fetchFirestoreCollection('indoorUnits'), db.collection('metadata').doc('appInfo').get() 
            ]);
            console.log("DEBUG: Firestore data fetching complete.");
             processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs);
        } catch (error) { console.error("CRITICAL ERROR fetching/processing Firestore data:", error); loadingOverlay.innerHTML = `<p style="color:red;">Errore grave nel caricamento dati.</p>`; return; }
        stepsHtmlContainers.forEach(el => el.classList.remove('active-step')); document.getElementById('step-1')?.classList.add('active-step'); 
        currentLogicalStep = 1; highestLogicalStepCompleted = 0; updateStepIndicator(); 
        populateBrands(); 
        const brandSelectionContent = brandSelectionDiv.innerHTML.trim();
        if (brandSelectionContent.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p'))) {
             console.warn("INIT WARNING: No brands populated.");
             if (loadingOverlay.style.display !== 'none') { loadingOverlay.innerHTML = `<p style="color:orange;">Errore: Nessuna marca disponibile.</p>`; }
        } else { loadingOverlay.style.display = 'none'; }
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        try { if (metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate) { const timestamp = metadataDoc.data().lastDataUpdate; document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }); } else { console.log("DEBUG: metadata/appInfo missing."); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); }
        } catch(err) { console.warn("Error retrieving metadata:", err); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); }
        initializeNavigation();
        console.log("DEBUG: initializeApp finished.");
    }
    
    // --- Run ---
    initializeApp();
});
// --- END OF SCRIPT.JS (FIREBASE - 6 STEP FLOW - REFINEMENTS V1) ---