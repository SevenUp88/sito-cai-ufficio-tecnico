// --- START OF SCRIPT.JS (FIREBASE - 6 STEP FLOW - V2.1 COMPLETE - CON INIT CORRETTA) ---
// Flow: Marca -> Config -> Modello -> UE -> UI Taglie -> Riepilogo

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (6-Step Flow - V2.1 Complete)");

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", // TUA CONFIG CORRETTA per consorzio-artigiani-idraulici
      authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
      projectId: "consorzio-artigiani-idraulici",
      storageBucket: "consorzio-artigiani-idraulici.appspot.com", // Preferibile .appspot.com se usi solo Firestore/Auth
      messagingSenderId: "136848104008",
      appId: "1:136848104008:web:2724f60607dbe91d09d67d",
      measurementId: "G-NNPV2607G7"
    };

    // Initialize Firebase using v8 SDK style (global firebase object)
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth(); // Aggiunto se non c'era, necessario per le funzionalità admin

    // --- App Data & State ---
    const APP_DATA = { brands: [], uiSeriesImageMapping: {}, configTypes: {}, outdoorUnits: [], indoorUnits: [] };
    let currentLogicalStep = 1;
    let highestLogicalStepCompleted = 0;
    const selections = { brand: null, configType: null, indoorSeries: null, outdoorUnit: null, indoorUnits: [] };

    // --- DOM Element References ---
    const brandSelectionDiv = document.getElementById('brand-selection');        
    const configTypeSelectionDiv = document.getElementById('config-type-selection'); 
    const indoorSeriesSelectionDiv = document.getElementById('model-selection');    
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

    // --- Step Mapping & Names ---
    const TOTAL_LOGICAL_STEPS = 6;
    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-2", 4: "step-4", 5: "step-5", 6: "step-6" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-2": 3, "step-4": 4, "step-5": 5, "step-6": 6 };
    const LOGICAL_STEP_NAMES = [ "Marca", "Config.", "Modello", "Unità Est.", "Unità Int.", "Riepilogo" ];

    // --- Utility & Data Fetching / Processing ---
    // ... (TUTTE LE TUE FUNZIONI fetchFirestoreCollection, parsePowerString, sanitizeForId, processLoadedData, 
    //      createSelectionItem, createUnitSelectionCard, clearAndResetUIForStep, resetSelectionsAndUIFrom,
    //      populateBrands, populateConfigTypes, populateIndoorSeries, populateOutdoorUnits, 
    //      populateIndoorUnitSelectors, generateSummary, showStep, updateStepIndicator, 
    //      checkAllIndoorUnitsSelected, le funzioni ADMIN (toggleAdminSectionVisibility, loadAndDisplayAdminBrands, etc.), 
    //      setupAuthUI, initializeNavigation, initializeApp 
    //      devono essere ESATTAMENTE come erano nel tuo file "script (1).js" / "V2.1 COMPLETE", 
    //      COPIALE QUI DAL TUO FILE) ...
    
    // Esempio di dove finirebbero queste funzioni (incolla il corpo completo dal tuo file):
    async function fetchFirestoreCollection(collectionName) { /* ...corpo dal tuo file... */ console.log(`DEBUG: Fetching Firestore collection: ${collectionName}`); try { const snapshot = await db.collection(collectionName).get(); const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); console.log(`DEBUG: Fetched ${data.length} items from ${collectionName}.`); return data; } catch (error) { console.error(`DEBUG: Error fetching collection ${collectionName}:`, error); loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore caricamento ${collectionName}.</span>`; return []; } }
    function parsePowerString(powerStr) { /* ...corpo dal tuo file... */ let btu = 0; let kw = "N/A"; if (typeof powerStr === 'string' && powerStr !== "Dati mancanti") { const btuMatch = powerStr.match(/([\d.,]+)\s*BTU/i); if (btuMatch && btuMatch[1]) btu = parseInt(btuMatch[1].replace(/[.,]/g, ''), 10) || 0; const kwMatch = powerStr.match(/([\d.,]+)\s*kW/i); if (kwMatch && kwMatch[1]) kw = kwMatch[1].replace(',', '.'); else if (btu > 0 && kw === "N/A") kw = (btu / 3412.14).toFixed(1); } return { btu, kw }; }
    function sanitizeForId(str) { /* ...corpo dal tuo file... */ if (!str) return ''; return String(str).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''); }
    function processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs) { /* ...corpo COMPLETO dal tuo file... */ console.log("DEBUG: Processing Firestore data. Brands:", brandsDocs.length, "Configs:", configTypesDocs.length, "Series Maps:", seriesMapDocs.length, "UE:", outdoorUnitsDocs.length, "UI:", indoorUnitsDocs.length); APP_DATA.brands = brandsDocs; APP_DATA.configTypes = configTypesDocs.reduce((acc, ct) => { acc[ct.id] = { id: ct.id, name: ct.name, numUnits: ct.numUnits }; return acc; }, {}); APP_DATA.uiSeriesImageMapping = seriesMapDocs.reduce((acc, mapping) => { if(mapping.seriesKey) acc[mapping.seriesKey] = mapping.imageName; return acc; }, {}); APP_DATA.outdoorUnits = outdoorUnitsDocs.map((ue_doc, index) => { const brandId = String(ue_doc.marca || 'sconosciuta').toLowerCase(); const connections = Number(ue_doc.unit_collegabili) || 0; const minConnections = Number(ue_doc.min_connessioni_ue) || (connections > 0 ? (connections < 2 ? 1 : 2) : 1); const uePotenzaKw = Number(ue_doc.potenza) || 0; const coolingBTU_UE = Math.round(uePotenzaKw * 3412.14); const heatingBTU_UE = coolingBTU_UE; return { id: ue_doc.id || `ue_${index}`, brandId: brandId, modelCode: ue_doc.codice_prodotto || "N/A", name: ue_doc.nome_modello_ue && ue_doc.nome_modello_ue !== "Dati mancanti" ? `${String(ue_doc.marca || '').toUpperCase()} ${ue_doc.nome_modello_ue}` : `UE ${String(ue_doc.marca || '').toUpperCase()} (${ue_doc.codice_prodotto || 'ID: ' + ue_doc.id})`, kw: uePotenzaKw, connections: connections, minConnections: minConnections, capacityCoolingBTU: coolingBTU_UE, capacityHeatingBTU: heatingBTU_UE, price: Number(ue_doc.prezzo) || 0, dimensions: ue_doc.dimensioni_ue || "N/A", weight: (ue_doc.peso_ue !== "Dati mancanti" && ue_doc.peso_ue !== undefined) ? ue_doc.peso_ue : "N/D", energyClassCooling: ue_doc.classe_energetica_raffrescamento || "N/D", energyClassHeating: ue_doc.classe_energetica_riscaldamento || "N/D", compatibleIndoorSeriesIds: Array.isArray(ue_doc.compatibleIndoorSeriesIds) ? ue_doc.compatibleIndoorSeriesIds : [] }; }); APP_DATA.indoorUnits = indoorUnitsDocs.map((ui_doc, index) => { const brandId = String(ui_doc.marca || 'sconosciuta').toLowerCase(); const seriesName = String(ui_doc.modello || `serie_${index}`).trim(); const seriesId = sanitizeForId(seriesName) + "_ui"; const { btu, kw } = parsePowerString(ui_doc.potenza); let imagePath = ""; if (ui_doc.percorso_immagine_ui && ui_doc.percorso_immagine_ui !== "Dati mancanti") { imagePath = ui_doc.percorso_immagine_ui; } else { let imageNameMapped = APP_DATA.uiSeriesImageMapping[seriesId]; if (!imageNameMapped) { imageNameMapped = sanitizeForId(seriesName); } imagePath = `img/${imageNameMapped}.png`; } return { id: ui_doc.id || `ui_${index}`, brandId: brandId, seriesId: seriesId, seriesName: seriesName, modelCode: ui_doc.codice_prodotto || "N/A", name: `${String(ui_doc.marca || '').toUpperCase()} ${seriesName} ${kw}kW (${btu} BTU)`, type: String(ui_doc.tipo_unit || 'Parete').toLowerCase() === "interna" ? "Parete" : ui_doc.tipo_unit, capacityBTU: btu, kw: kw, price: Number(ui_doc.prezzo_ui) || 0, image: imagePath, dimensions: ui_doc.dimensioni_ui || "N/A", wifi: ui_doc.wifi === true }; }); console.log("DEBUG: Processing Firestore data finished."); console.log("DEBUG: First Processed UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.stringify(APP_DATA.outdoorUnits[0]) : "ND"); console.log("DEBUG: First Processed UI:", APP_DATA.indoorUnits.length > 0 ? JSON.stringify(APP_DATA.indoorUnits[0]) : "ND");}
    function createSelectionItem(item, type, clickHandler, isSelected = false) { /* ...corpo dal tuo file... */ const itemDiv = document.createElement('div'); itemDiv.classList.add('selection-item'); if (isSelected) itemDiv.classList.add('selected'); itemDiv.dataset[type + 'Id'] = item.id; let logoSrc = ''; if (type === 'brand' && item.logo) { logoSrc = item.logo; } else if (type === 'series' && item.image) { logoSrc = item.image; itemDiv.classList.add('series-selection-item'); } const nameSpan = document.createElement('span'); nameSpan.textContent = item.name; if (logoSrc) { const logoImg = document.createElement('img'); logoImg.src = logoSrc; logoImg.alt = `${item.name} Immagine`; if (type === 'brand') logoImg.classList.add('brand-logo'); if (type === 'series') logoImg.classList.add('series-logo'); logoImg.onload = () => { if (type === 'brand') nameSpan.style.display = 'none'; }; logoImg.onerror = () => { console.warn(`DEBUG: Errore caricamento ${type} immagine ${logoSrc}`); logoImg.style.display = 'none'; nameSpan.style.display = 'block'; }; itemDiv.appendChild(logoImg); if (type === 'brand') nameSpan.style.display = 'none'; } else { nameSpan.style.display = 'block'; } itemDiv.appendChild(nameSpan); itemDiv.addEventListener('click', () => { itemDiv.parentElement.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); itemDiv.classList.add('selected'); clickHandler(item); }); return itemDiv; }
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) { /* ...corpo dal tuo file... */ const card = document.createElement('div'); card.classList.add('unit-selection-card'); if (isSelected) card.classList.add('selected'); card.dataset.unitId = unit.id; card.style.flexDirection = "column"; card.style.alignItems = 'flex-start'; const infoDiv = document.createElement('div'); infoDiv.classList.add('unit-info'); infoDiv.style.width = '100%'; const nameH4 = document.createElement('h4'); let unitTitle = "UNITA' ESTERNA"; if (unit.kw && unit.kw !== "Dati mancanti" && unit.kw !== 0 && unit.kw !== "N/A") { unitTitle += ` ${unit.kw}kW`; } nameH4.textContent = unitTitle; infoDiv.appendChild(nameH4); const modelNameP = document.createElement('p'); modelNameP.style.cssText = 'font-size: 0.9em; color: var(--secondary-color); margin-top: -2px; margin-bottom: 5px;'; modelNameP.textContent = `(${unit.name || "Dettagli non disponibili"})`; infoDiv.appendChild(modelNameP); const modelP = document.createElement('p'); modelP.innerHTML = `Codice: <strong>${unit.modelCode || 'N/A'}</strong> | Max UI: ${unit.connections === undefined ? '?' : unit.connections}`; infoDiv.appendChild(modelP); const capacityP = document.createElement('p'); capacityP.textContent = `Potenza (F/C BTU): ${unit.capacityCoolingBTU || '?'} / ${unit.capacityHeatingBTU || '?'}`; infoDiv.appendChild(capacityP); const energyClassP = document.createElement('p'); energyClassP.innerHTML = `Classe (F/C): <strong>${unit.energyClassCooling || '?'}</strong> / <strong>${unit.energyClassHeating || '?'}</strong>`; infoDiv.appendChild(energyClassP); const dimensionsP = document.createElement('p'); let dimText = unit.dimensions && unit.dimensions !== "N/A" ? `Dimensioni: ${unit.dimensions}` : "Dimensioni: N/A"; if (unit.weight && unit.weight !== "N/D") { dimText += ` | Peso: ${unit.weight} kg`; } else if (unit.weight === "N/D") { dimText += ` | Peso: N/D`; } else { dimText += ` | Peso: ?`; } dimensionsP.textContent = dimText; infoDiv.appendChild(dimensionsP); const priceP = document.createElement('p'); priceP.classList.add('unit-price'); priceP.textContent = `Prezzo: ${typeof unit.price === 'number' ? unit.price.toFixed(2) : (unit.price || 'N/D')} € (IVA escl.)`; infoDiv.appendChild(priceP); card.appendChild(infoDiv); card.addEventListener('click', () => { card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected')); card.classList.add('selected'); clickHandler(unit); }); return card; }
    function clearAndResetUIForStep(logicalStep) { /* ...corpo dal tuo file... */ const divId = LOGICAL_TO_HTML_STEP_MAP[logicalStep]; const div = document.getElementById(divId); if (div) { const contentArea = div.querySelector('.selection-grid') || div.querySelector('.selection-list') || div.querySelector('#indoor-units-selection-area'); if (contentArea) { contentArea.innerHTML = '<p>Completa i passaggi precedenti.</p>'; } else { div.innerHTML = '<p>Contenuto non disponibile.</p>';} } }
    function resetSelectionsAndUIFrom(stepToClearFrom) { /* ...corpo dal tuo file... */ console.log(`resetSelectionsAndUIFrom: Clearing data and UI from step ${stepToClearFrom} onwards.`); if (stepToClearFrom <= 5 && (selections.indoorUnits.length > 0 || indoorUnitsSelectionArea.innerHTML.includes('<select'))) { selections.indoorUnits = []; clearAndResetUIForStep(5); console.log("Cleared: indoorUnits & UI Step 5"); if(finalizeBtn) finalizeBtn.disabled = true; } if (stepToClearFrom <= 4 && (selections.outdoorUnit || outdoorUnitSelectionDiv.innerHTML.includes('card'))) { selections.outdoorUnit = null; clearAndResetUIForStep(4); console.log("Cleared: outdoorUnit & UI Step 4"); } if (stepToClearFrom <= 3 && (selections.indoorSeries || indoorSeriesSelectionDiv.innerHTML.includes('item'))) { selections.indoorSeries = null; clearAndResetUIForStep(3); console.log("Cleared: indoorSeries & UI Step 3"); } if (stepToClearFrom <= 2 && (selections.configType || configTypeSelectionDiv.innerHTML.includes('item'))) { selections.configType = null; clearAndResetUIForStep(2); console.log("Cleared: configType & UI Step 2"); } if (stepToClearFrom <= 1 && (selections.brand || brandSelectionDiv.innerHTML.includes('item'))) { selections.brand = null; brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); /*clearAndResetUIForStep(1);*/ console.log("Cleared: brand (data only, UI repopulated by populateBrands)"); } if (stepToClearFrom <= TOTAL_LOGICAL_STEPS) { summaryDiv.innerHTML = ''; document.getElementById('summary-main-title')?.classList.remove('print-main-title');} }
    function populateBrands() { /* ...corpo dal tuo file... */ brandSelectionDiv.innerHTML = ''; console.log("DEBUG: populateBrands called..."); if (!APP_DATA.outdoorUnits?.length) { brandSelectionDiv.innerHTML = '<p>Dati unità esterne non disponibili.</p>'; return; } const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId).filter(id => id && id !== 'sconosciuta'))]; const brandsToShow = APP_DATA.brands.filter(b => uniqueBrandIdsFromUEs.includes(b.id)); if (!brandsToShow.length) { brandSelectionDiv.innerHTML = '<p>Nessuna marca con UEs.</p>'; return; } brandsToShow.forEach(brand => { brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => { if (selections.brand?.id !== selectedBrand.id) { resetSelectionsAndUIFrom(2); selections.brand = selectedBrand; highestLogicalStepCompleted = 1; } populateConfigTypes(); showStep(2); }, selections.brand?.id === brand.id)); }); if (selections.brand && !brandsToShow.some(b => b.id === selections.brand.id)) selections.brand = null; }
    function populateConfigTypes() { /* ...corpo dal tuo file... */ configTypeSelectionDiv.innerHTML = ''; if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>Scegli marca.</p>'; return; } const validConfigs = Object.values(APP_DATA.configTypes).filter(ct => APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= ct.numUnits && ue.minConnections <= ct.numUnits)).sort((a, b) => a.numUnits - b.numUnits); if (!validConfigs.length) { configTypeSelectionDiv.innerHTML = `<p>Nessuna config. per ${selections.brand.name}.</p>`; return; } validConfigs.forEach(config => { configTypeSelectionDiv.appendChild(createSelectionItem(config, 'config', (selectedConfig) => { if (selections.configType?.id !== selectedConfig.id) { resetSelectionsAndUIFrom(3); selections.configType = selectedConfig; highestLogicalStepCompleted = 2; } populateIndoorSeries(); showStep(3); }, selections.configType?.id === config.id)); }); if (selections.configType && !validConfigs.some(vc => vc.id === selections.configType.id)) selections.configType = null;}
    // STEP 3: MODELLO UI (Indoor Series Selection) - REVISED LOGIC
function populateIndoorSeries() {
    indoorSeriesSelectionDiv.innerHTML = ''; // HTML div#step-2 (#model-selection)
    if (!selections.brand || !selections.configType) {
        indoorSeriesSelectionDiv.innerHTML = '<p>Scegli Marca e Configurazione prima.</p>';
        if (selections.indoorSeries) selections.indoorSeries = null; // Clear if previously selected
        return;
    }
    console.log(`DEBUG: populateIndoorSeries - Brand: ${selections.brand.id}, Config: ${selections.configType.name} (${selections.configType.numUnits} UIs)`);

    const brandId = selections.brand.id;
    const numUnitsRequired = selections.configType.numUnits;

    const candidateUEs = APP_DATA.outdoorUnits.filter(ue => 
        ue.brandId === brandId &&
        ue.minConnections <= numUnitsRequired &&
        ue.connections >= numUnitsRequired
    );

    if (candidateUEs.length === 0) {
         indoorSeriesSelectionDiv.innerHTML = `<p>Nessuna Unità Esterna ${selections.brand.name} trovata per ${selections.configType.name}. Impossibile determinare Modelli UI.</p>`;
         if (selections.indoorSeries) selections.indoorSeries = null;
        return;
    }
    console.log(`DEBUG: populateIndoorSeries - Candidate UEs for ${brandId} & ${numUnitsRequired}-split: ${candidateUEs.length}`);

    const compatibleSeriesIdsSet = new Set();
    candidateUEs.forEach(ue => {
        if (Array.isArray(ue.compatibleIndoorSeriesIds)) {
            ue.compatibleIndoorSeriesIds.forEach(id => compatibleSeriesIdsSet.add(id));
        }
    });
    console.log(`DEBUG: populateIndoorSeries - All compatible UI Series IDs from these UEs:`, [...compatibleSeriesIdsSet]);

    if (compatibleSeriesIdsSet.size === 0) {
        indoorSeriesSelectionDiv.innerHTML = `<p>Le Unità Esterne ${selections.brand.name} per ${selections.configType.name} non specificano modelli UI compatibili.</p>`;
        if (selections.indoorSeries) selections.indoorSeries = null;
        return;
    }

    const validIndoorUnitsForSeriesSelection = APP_DATA.indoorUnits.filter(ui =>
        ui.brandId === brandId &&
        compatibleSeriesIdsSet.has(ui.seriesId)
    );
    console.log(`DEBUG: populateIndoorSeries - Indoor Units matching brand & compatible series IDs: ${validIndoorUnitsForSeriesSelection.length}`);
    
    const uniqueSeries = []; // Questa è la variabile corretta da usare sotto
    const seenSeriesIdsInThisStep = new Set();
    validIndoorUnitsForSeriesSelection.forEach(ui => {
        if (!seenSeriesIdsInThisStep.has(ui.seriesId)) {
            let representativeImage = APP_DATA.uiSeriesImageMapping[ui.seriesId] 
                                    ? `img/${APP_DATA.uiSeriesImageMapping[ui.seriesId]}.png` 
                                    : (ui.image || null) ;
            uniqueSeries.push({ 
                name: ui.seriesName,
                id: ui.seriesId,
                image: representativeImage 
            });
            seenSeriesIdsInThisStep.add(ui.seriesId);
        }
    });
    console.log(`DEBUG: populateIndoorSeries - Unique Series (Models) to show:`, uniqueSeries);

    if (uniqueSeries.length === 0) {
        indoorSeriesSelectionDiv.innerHTML = `<p>Nessun Modello di Unità Interna ${selections.brand.name} trovato che sia compatibile con Unità Esterne adatte alla configurazione ${selections.configType.name}.</p>`;
        if (selections.indoorSeries) selections.indoorSeries = null;
        return;
    }

    uniqueSeries.sort((a, b) => a.name.localeCompare(b.name));
    
    // L'auto-selezione non la implementiamo per ora per evitare cicli di navigazione durante i test iniziali.
    // Vediamo prima se la lista si popola correttamente.
    // if (uniqueSeries.length === 1 && !selections.indoorSeries && currentLogicalStep === 3) { 
    //     console.log(`DEBUG: Auto-selecting single valid series: ${uniqueSeries[0].name}`);
    //     selections.indoorSeries = uniqueSeries[0]; 
    //     highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3);
    //     populateOutdoorUnits();
    //     showStep(4); 
    //     return; 
    // }

    uniqueSeries.forEach(series => { // <--- Corretto a uniqueSeries
         indoorSeriesSelectionDiv.appendChild(createSelectionItem(
             series, 
             'series', 
             (selectedSeries) => {
                 if (selections.indoorSeries?.id !== selectedSeries.id) {
                     resetSelectionsAndUIFrom(4); 
                     selections.indoorSeries = selectedSeries; 
                     highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); 
                 }
                 populateOutdoorUnits(); 
                 showStep(4); 
             }, 
             selections.indoorSeries?.id === series.id
         ));
     });
    
    if (selections.indoorSeries && !uniqueSeries.some(s => s.id === selections.indoorSeries.id)) { // <--- Corretto a uniqueSeries
        selections.indoorSeries = null;
    }
}
    function populateOutdoorUnits() { /* ...corpo dal tuo file... */ outdoorUnitSelectionDiv.innerHTML = ''; if (!selections.brand || !selections.configType || !selections.indoorSeries) { outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Marca, Config., Modello.</p>'; return; } const numRequired = selections.configType.numUnits; const requiredSeriesId = selections.indoorSeries.id; const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections >= numRequired && ue.minConnections <= numRequired && ue.compatibleIndoorSeriesIds?.includes(requiredSeriesId)); if (!compatibleUEs.length) { outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} compatibile con Modello "${selections.indoorSeries.name}".</p>`; return; } compatibleUEs.forEach(ue => { outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => { if (selections.outdoorUnit?.id !== selectedUE.id) { resetSelectionsAndUIFrom(5); selections.outdoorUnit = selectedUE; highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted,4); } populateIndoorUnitSelectors(); showStep(5); }, selections.outdoorUnit?.id === ue.id)); }); if (selections.outdoorUnit && !compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) selections.outdoorUnit = null; }
    function populateIndoorUnitSelectors() { /* ...corpo dal tuo file... */ indoorUnitsSelectionArea.innerHTML = ''; if (!selections.outdoorUnit || !selections.configType || !selections.brand || !selections.indoorSeries) { indoorUnitsSelectionArea.innerHTML = `<p>Completa passaggi.</p>`; checkAllIndoorUnitsSelected(); return; } const availableIndoorUnitsForSeries = APP_DATA.indoorUnits.filter(ui => ui.brandId === selections.brand.id && ui.seriesId === selections.indoorSeries.id).sort((a,b) => a.capacityBTU - b.capacityBTU); if (!availableIndoorUnitsForSeries.length) { indoorUnitsSelectionArea.innerHTML = `<p>Nessuna variante per ${selections.indoorSeries.name}.</p>`; checkAllIndoorUnitsSelected(); return; } if (selections.indoorUnits.length !== selections.configType.numUnits || !selections.indoorUnits.every(ui => ui === null || (ui && ui.seriesId === selections.indoorSeries.id))) { selections.indoorUnits = new Array(selections.configType.numUnits).fill(null); } for (let i = 0; i < selections.configType.numUnits; i++) { const slotDiv = document.createElement('div'); slotDiv.classList.add('indoor-unit-slot'); slotDiv.style.marginBottom = '20px'; slotDiv.style.paddingBottom = '15px'; slotDiv.style.borderBottom = '1px dashed #eee'; const label = document.createElement('label'); label.htmlFor = `indoor-unit-select-${i}`; label.innerHTML = `Unità ${i + 1} (<strong>Modello: ${selections.indoorSeries.name}</strong>):`; label.style.cssText = 'display:block;margin-bottom:5px;font-weight:500;'; slotDiv.appendChild(label); const select = document.createElement('select'); select.id = `indoor-unit-select-${i}`; select.dataset.index = i; select.style.cssText = 'width:100%;padding:8px;margin-bottom:10px;'; const placeholder = document.createElement('option'); placeholder.value = ""; placeholder.textContent = "-- Seleziona Taglia/Potenza --"; select.appendChild(placeholder); availableIndoorUnitsForSeries.forEach(uiVariant => { const option = document.createElement('option'); option.value = uiVariant.id; option.innerHTML = `${uiVariant.modelCode} - <strong>${uiVariant.kw}kW (${uiVariant.capacityBTU} BTU)</strong> - Prezzo: ${uiVariant.price.toFixed(2)}€`; if (selections.indoorUnits[i]?.id === uiVariant.id) option.selected = true; select.appendChild(option); }); const detailsDiv = document.createElement('div'); detailsDiv.classList.add('unit-details'); detailsDiv.style.cssText = 'font-size:0.9em;padding-left:10px;'; if (selections.indoorUnits[i]) { const cui = selections.indoorUnits[i]; detailsDiv.innerHTML = `<p>Cod:<strong>${cui.modelCode}</strong></p><p>Pwr:<strong>${cui.kw}kW(${cui.capacityBTU}BTU)</strong>-€<strong>${cui.price.toFixed(2)}</strong></p>${cui.image ? `<img src="${cui.image}" class="ui-details-img" style="max-width:100px;max-height:80px;object-fit:contain;background:transparent;">` : ''}`; } select.addEventListener('change', (e) => { const selId = e.target.value; const idx = parseInt(e.target.dataset.index); const selUI = availableIndoorUnitsForSeries.find(u => u.id === selId); selections.indoorUnits[idx] = selUI || null; if (selUI) { detailsDiv.innerHTML = `<p>Cod:<strong>${selUI.modelCode}</strong></p><p>Pwr:<strong>${selUI.kw}kW(${selUI.capacityBTU}BTU)</strong>-€<strong>${selUI.price.toFixed(2)}</strong></p>${selUI.image ? `<img src="${selUI.image}" class="ui-details-img" style="max-width:100px;max-height:80px;object-fit:contain;background:transparent;">` : ''}`; } else { detailsDiv.innerHTML = ''; } checkAllIndoorUnitsSelected(); }); slotDiv.appendChild(select); slotDiv.appendChild(detailsDiv); indoorUnitsSelectionArea.appendChild(slotDiv); } checkAllIndoorUnitsSelected(); }
    function generateSummary() { /* ...corpo dal tuo file... */ console.log("DEBUG: generateSummary called. Selections:", JSON.parse(JSON.stringify(selections))); summaryDiv.innerHTML = ''; if (!selections.brand || !selections.configType || !selections.indoorSeries || !selections.outdoorUnit ) { summaryDiv.innerHTML = "<p>Configurazione incompleta.</p>"; return; } if (selections.configType.numUnits > 0 && (selections.indoorUnits.length !== selections.configType.numUnits || selections.indoorUnits.some(ui => !ui))) { summaryDiv.innerHTML = "<p>Selezione UI incomplete.</p>"; return; } let totalNominalBTU_UI = 0; let totalPrice = selections.outdoorUnit.price || 0; const valOrNA = (val, suffix = '') => (val !== undefined && val !== null && val !== '' && val !== "Dati mancanti") ? `${val}${suffix}` : 'N/A'; const priceOrND = (price) => typeof price === 'number' ? price.toFixed(2) + " €" : 'N/D'; const summaryHTML = ` <div class="summary-block"> <h3>Selezione Utente</h3> <p><strong>Marca:</strong> ${selections.brand.name}</p> <p><strong>Configurazione:</strong> ${selections.configType.name} (${selections.configType.numUnits} UI)</p> <p><strong>Modello UI:</strong> ${selections.indoorSeries.name}</p> </div> <div class="summary-block"> <h3>Unità Esterna</h3> <h4>UNITA' ESTERNA ${selections.outdoorUnit.kw && selections.outdoorUnit.kw !== "N/A" && selections.outdoorUnit.kw !== 0 ? selections.outdoorUnit.kw + 'kW' : ''}</h4> <p><em>(${selections.outdoorUnit.name})</em></p> <p><strong>Codice:</strong> ${valOrNA(selections.outdoorUnit.modelCode)}</p> <p><strong>Potenza (F/C BTU):</strong> ${valOrNA(selections.outdoorUnit.capacityCoolingBTU, ' BTU')} / ${valOrNA(selections.outdoorUnit.capacityHeatingBTU, ' BTU')}</p> <p><strong>Classe Energetica (F/C):</strong> ${valOrNA(selections.outdoorUnit.energyClassCooling)} / ${valOrNA(selections.outdoorUnit.energyClassHeating)}</p> <p><strong>Dimensioni:</strong> ${valOrNA(selections.outdoorUnit.dimensions)}</p> <p><strong>Peso:</strong> ${valOrNA(selections.outdoorUnit.weight, ' kg')}</p> <p class="price-highlight"><strong>Prezzo UE:</strong> ${priceOrND(selections.outdoorUnit.price)} (IVA Escl.)</p> </div> ${selections.configType.numUnits > 0 ? ` <div class="summary-block"> <h3>Unità Interne (Modello ${selections.indoorSeries.name})</h3> ${selections.indoorUnits.map((ui, index) => { if (!ui) return `<div class="summary-indoor-unit error">UI ${index + 1} non selezionata.</div>`; totalNominalBTU_UI += ui.capacityBTU || 0; totalPrice += ui.price || 0; return ` <div class="summary-indoor-unit" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;"> <h4>Unità ${index + 1}: <strong>${ui.seriesName}</strong></h4> ${ui.image ? `<img src="${ui.image}" alt="${ui.name}" class="summary-ui-img" style="float:right; margin-left:10px; object-fit:contain;">` : ''} <p><strong>Codice:</strong> ${valOrNA(ui.modelCode)}</p> <p><strong>Potenza: ${valOrNA(ui.kw, 'kW')} (${valOrNA(ui.capacityBTU, ' BTU')})</strong></p> <p><strong>Tipo:</strong> ${valOrNA(ui.type)}</p> <p><strong>Dimensioni:</strong> ${valOrNA(ui.dimensions)}</p> <p><strong>WiFi:</strong> ${ui.wifi ? 'Sì' : 'No'}</p> <p class="price-highlight"><strong>Prezzo UI:</strong> ${priceOrND(ui.price)} (IVA Escl.)</p> <div style="clear:both;"></div> </div> `; }).join('')} </div> ` : '<div class="summary-block"><p>Nessuna UI richiesta.</p></div>'} <div class="summary-total" style="margin-top:20px; padding-top:15px; border-top: 2px solid var(--primary-color);"> ${selections.configType.numUnits > 0 ? `<p><strong>Somma Potenza Nominale UI:</strong> ${totalNominalBTU_UI} BTU</p>` : ''} <p style="font-size: 1.2em; font-weight: bold;"><strong>Prezzo Totale Config.:</strong> <span class="total-price-value">${priceOrND(totalPrice)}</span> (IVA Escl.)</p> </div> `; summaryDiv.innerHTML = summaryHTML; document.getElementById('summary-main-title')?.classList.add('print-main-title'); console.log("DEBUG: Riepilogo generato. Prezzo Totale:", totalPrice); }
    // MODIFICA SOLO QUESTA FUNZIONE NEL TUO script.js ATTUALE
function showStep(logicalStepNumber, fromDirectNavigation = false) {
    if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) { console.warn("Invalid logical step:", logicalStepNumber); return; }
    const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
    if (!htmlContainerId) { console.error("No HTML ID for step:", logicalStepNumber); return; }

    console.log(`ShowStep: Target=${logicalStepNumber}, DirectNav=${fromDirectNavigation}, Prev CurrHighest=${highestLogicalStepCompleted}, Prev CurrStep=${currentLogicalStep}`);

    if (fromDirectNavigation) {
        // Se sto navigando (indietro o avanti con indicatore) a un passo X,
        // lo stato e l'UI per i passi >X devono essere resettati.
        // E il highestLogicalStepCompleted deve essere al massimo X-1.
        resetSelectionsAndUIFrom(logicalStepNumber + 1); 
        highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, logicalStepNumber -1); 
        
        // Se navigo a un passo che NON è il successivo a quello completato, blocco
        if (logicalStepNumber > highestLogicalStepCompleted + 2 && logicalStepNumber !== 1 && logicalStepNumber !== TOTAL_LOGICAL_STEPS) { // Allow jump to 1 or summary (if valid)
             const canJumpToSummary = logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted >= (TOTAL_LOGICAL_STEPS - 2); // Check prev step of summary is done
             if (!canJumpToSummary){
                 console.log(`Navigation jump to step ${logicalStepNumber} blocked. Current completion state: ${highestLogicalStepCompleted}. Displaying last allowed step.`);
                 // Re-show the last validly accessible step if the jump is too far
                 showStep(highestLogicalStepCompleted + 1, true); 
                 return;
             }
        }

    } else { // Avanzamento tramite una selezione in un passo (es. click su una marca)
        // Il currentLogicalStep QUI è il passo DOVE è avvenuta la selezione.
        // Quindi questo passo è ora "completato".
        highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); 
    }

    stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
    const targetStepEl = document.getElementById(htmlContainerId);
    if (targetStepEl) { targetStepEl.classList.add('active-step'); } 
    else { console.error(`HTML container '${htmlContainerId}' for step ${logicalStepNumber} not found.`); }
    
    currentLogicalStep = logicalStepNumber; // Imposta il nuovo passo corrente
    updateStepIndicator(); 
    window.scrollTo(0, 0);
    console.log(`ShowStep END: Now currentStep=${currentLogicalStep}, CurrHighest=${highestLogicalStepCompleted}`);
}
    function updateStepIndicator() { /* ...corpo dal tuo file... */ const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line'); stepIndicatorItems.forEach((item, htmlIndex) => { const itemLogicalStep = htmlIndex + 1; if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { item.style.display = 'none'; if (stepLinesHTML[htmlIndex-1]) stepLinesHTML[htmlIndex-1].style.display = 'none'; return; } item.style.display = ''; item.dataset.step = itemLogicalStep; const nameEl = item.querySelector('.step-name'); if(nameEl) nameEl.textContent = LOGICAL_STEP_NAMES[itemLogicalStep-1] || `Step ${itemLogicalStep}`; item.classList.remove('active', 'completed', 'disabled'); const dot = item.querySelector('.step-dot'); if(dot) { dot.classList.remove('active', 'completed'); dot.textContent = itemLogicalStep; } if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot?.classList.add('completed'); }  else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot?.classList.add('active'); } if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) { item.classList.add('disabled'); } }); stepLinesHTML.forEach((line, htmlLineIndex) => { if (htmlLineIndex >= TOTAL_LOGICAL_STEPS - 1) { line.style.display = 'none'; return; } line.style.display = ''; line.classList.remove('active'); const prevItem = stepIndicatorItems[htmlLineIndex];  const prevItemLogicalStep = parseInt(prevItem?.dataset?.step); if (prevItem && prevItem.style.display !== 'none') { if (prevItem.classList.contains('completed')) { line.classList.add('active'); } else if (currentLogicalStep > prevItemLogicalStep) { line.classList.add('active'); } } }); }
    function checkAllIndoorUnitsSelected() { /* ...corpo dal tuo file... */ let allSelected = true; if (selections.configType && selections.configType.numUnits > 0) { allSelected = selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null && ui !== undefined); } if(finalizeBtn) { finalizeBtn.disabled = !allSelected; } if(allSelected && selections.configType?.numUnits > 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); } else if (allSelected && selections.configType?.numUnits === 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); } updateStepIndicator();  }
    function initializeNavigation() { /* ...corpo dal tuo file... */  stepIndicatorItems.forEach(item => { item.addEventListener('click', () => { if (item.classList.contains('disabled') || item.style.display === 'none') return; const targetLogicalStep = parseInt(item.dataset.step); if (isNaN(targetLogicalStep) || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return; console.log(`Indicator click -> Step ${targetLogicalStep}`); if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { const canShowSummary = selections.brand && selections.configType && selections.indoorSeries && selections.outdoorUnit && (!selections.configType.numUnits > 0 || (selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null))); if (!canShowSummary) { alert("Completa passaggi precedenti."); return; } generateSummary(); } showStep(targetLogicalStep, true); }); }); if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { console.log("Finalize button clicked."); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); generateSummary(); showStep(TOTAL_LOGICAL_STEPS); }); } document.querySelectorAll('.prev-btn').forEach(button => { const currentStepElement = button.closest('.config-step'); if (!currentStepElement) return; const currentHtmlId = currentStepElement.id; const currentLogical = HTML_TO_LOGICAL_STEP_MAP[currentHtmlId]; if (currentLogical === undefined || currentLogical === 1) { button.style.display = 'none'; return; } let prevLogicalStep = currentLogical - 1; button.style.display = ''; button.addEventListener('click', () => { console.log(`Prev clicked from ${currentLogical} to ${prevLogicalStep}`); showStep(prevLogicalStep, true); }); }); document.getElementById('reset-config-btn')?.addEventListener('click', () => { console.log("Reset config clicked."); if (!confirm("Sei sicuro?")) return; selections.brand = null; selections.configType = null; selections.indoorSeries = null; selections.outdoorUnit = null; selections.indoorUnits = []; resetSelectionsAndUIFrom(1); /* Clears step 1's UI and all subsequent data/UI */ populateBrands(); highestLogicalStepCompleted = 0; showStep(1); }); document.getElementById('print-summary-btn')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Vai al Riepilogo (Passaggio 6) prima di stampare."); }); document.getElementById('print-list')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Completa fino al Riepilogo (Passaggio 6)."); }); }
    async function initializeApp() { /* ...corpo dal tuo file... */ console.log("DEBUG: initializeApp started (6-Step Flow V2.1)"); document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex'; let brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc; try { console.log("DEBUG: Fetching all Firestore data..."); [ brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc ] = await Promise.all([ fetchFirestoreCollection('brands'), fetchFirestoreCollection('configTypes'), fetchFirestoreCollection('uiSeriesImageMapping'), fetchFirestoreCollection('outdoorUnits'), fetchFirestoreCollection('indoorUnits'), db.collection('metadata').doc('appInfo').get() ]); console.log("DEBUG: Firestore data fetching complete."); processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs); } catch (error) { console.error("CRITICAL ERROR fetching/processing Firestore data:", error); loadingOverlay.innerHTML = `<p style="color:red;">Errore grave caricamento dati.</p>`; return; } stepsHtmlContainers.forEach(el => el.classList.remove('active-step')); document.getElementById('step-1')?.classList.add('active-step'); currentLogicalStep = 1; highestLogicalStepCompleted = 0; updateStepIndicator(); populateBrands(); const brandSelectionContent = brandSelectionDiv.innerHTML.trim(); if (brandSelectionContent.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p'))) { console.warn("INIT WARNING: No brands populated."); if (loadingOverlay.style.display !== 'none') { loadingOverlay.innerHTML = `<p style="color:orange;">Errore: Nessuna marca disponibile.</p>`; } } else { loadingOverlay.style.display = 'none'; } document.getElementById('currentYear').textContent = new Date().getFullYear(); try { if (metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate) { const timestamp = metadataDoc.data().lastDataUpdate; document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }); } else { console.log("DEBUG: metadata/appInfo missing."); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); } } catch(err) { console.warn("Error retrieving metadata:", err); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); } initializeNavigation(); console.log("DEBUG: initializeApp finished."); }
    
    // --- Global Admin Functions & Auth UI Setup (New or Adapted) ---
    window.currentUserRole = null; // Defined for clarity
    let adminBrandsListener = null; // Listener unsubscribe function
    function escapeHtml (unsafe) { if (typeof unsafe !== 'string') unsafe = String(unsafe); return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#039;"); };
    function toggleAdminSectionVisibility() { const adminSection = document.getElementById('admin-section'); const isAdminUser = window.currentUserRole === 'admin'; if (adminSection) { adminSection.style.display = isAdminUser ? 'block' : 'none'; if (isAdminUser && !adminBrandsListener) { loadAndDisplayAdminBrands(); setupAdminBrandFormListener(); } else if (!isAdminUser && adminBrandsListener) { if(typeof adminBrandsListener === 'function') adminBrandsListener(); adminBrandsListener = null; const listDiv = document.getElementById('admin-brands-list'); if(listDiv) listDiv.innerHTML = '<p>Accesso admin richiesto.</p>'; } } }
    async function loadAndDisplayAdminBrands() { const listDiv = document.getElementById('admin-brands-list'); if (!listDiv) return; listDiv.innerHTML = '<p>Caricamento marche admin...</p>'; if (adminBrandsListener && typeof adminBrandsListener === 'function') adminBrandsListener(); adminBrandsListener = db.collection("brands").orderBy("name").onSnapshot(snapshot => { if (snapshot.empty) { listDiv.innerHTML = '<p>Nessuna marca trovata.</p>'; return; } let html = '<ul>'; snapshot.forEach(doc => { const brand = { id: doc.id, ...doc.data() }; html += `<li data-id="${brand.id}" style="margin-bottom:5px; padding:5px; border-bottom:1px dotted #eee;"> <img src="${brand.logo || 'img/placeholder.png'}" alt="${brand.name}" style="height:20px; vertical-align:middle; margin-right:5px;"> ${escapeHtml(brand.name)} (ID: ${brand.id}) <button class="btn-admin-edit-brand" data-id="${brand.id}" style="margin-left:10px;font-size:0.8em;">Mod.</button> <button class="btn-admin-delete-brand" data-id="${brand.id}" style="font-size:0.8em;">Elim.</button> </li>`; }); html += '</ul>'; listDiv.innerHTML = html; listDiv.querySelectorAll('.btn-admin-edit-brand').forEach(b => b.addEventListener('click', (e) => handleEditBrand(e.target.dataset.id))); listDiv.querySelectorAll('.btn-admin-delete-brand').forEach(b => b.addEventListener('click', (e) => handleDeleteBrand(e.target.dataset.id))); }, error => { console.error("Errore admin marche: ", error); listDiv.innerHTML = '<p>Errore.</p>'; }); }
    function clearAdminBrandForm() { document.getElementById('brand-doc-id').value = ''; document.getElementById('brand-id').value = ''; document.getElementById('brand-id').disabled = false; document.getElementById('brand-name').value = ''; document.getElementById('brand-logo-path').value = ''; document.getElementById('brand-id').focus(); }
    function setupAdminBrandFormListener() { const form = document.getElementById('admin-brand-form'); const clearBtn = document.getElementById('admin-brand-form-clear'); if(!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const docIdForEdit = document.getElementById('brand-doc-id').value; const brandId = document.getElementById('brand-id').value.trim().toLowerCase(); const brandName = document.getElementById('brand-name').value.trim(); const brandLogoPath = document.getElementById('brand-logo-path').value.trim(); if (!brandId || !brandName || !brandLogoPath) { alert("Tutti i campi sono obbligatori."); return; } const brandData = { id: brandId, name: brandName, logo: brandLogoPath }; try { if (docIdForEdit && docIdForEdit !== brandId) { alert("Modifica ID marca non permessa. Elimina e ricrea."); return;} await db.collection("brands").doc(brandId).set(brandData, { merge: true }); alert(`Marca ${docIdForEdit ? 'modificata' : 'aggiunta'}!`); clearAdminBrandForm(); initializeConfiguratorApp(); /* Ricarica tutti i dati per riflettere modifiche */ } catch (error) { console.error("Errore salvataggio marca: ", error); alert("Errore: " + error.message); } }); if (clearBtn) clearBtn.addEventListener('click', clearAdminBrandForm); }
    async function handleEditBrand(brandIdToEdit) { try { const brandDoc = await db.collection("brands").doc(brandIdToEdit).get(); if (brandDoc.exists) { const brand = brandDoc.data(); document.getElementById('brand-doc-id').value = brandDoc.id; document.getElementById('brand-id').value = brand.id; document.getElementById('brand-id').disabled = true; document.getElementById('brand-name').value = brand.name; document.getElementById('brand-logo-path').value = brand.logo; document.getElementById('brand-name').focus(); } else { alert("Marca non trovata."); } } catch (error) { alert("Errore caricamento marca."); } }
    async function handleDeleteBrand(brandIdToDelete) { if (!confirm(`Eliminare marca '${brandIdToDelete}'?`)) return; try { await db.collection("brands").doc(brandIdToDelete).delete(); alert("Marca eliminata!"); initializeConfiguratorApp(); } catch (error) { alert("Errore eliminazione marca."); } }
    
    function setupAuthUI() {
        console.log("Setting up Auth UI for Configurator Admin...");
        const loginModal = document.getElementById('login-modal-configurator');
        const loginForm = document.getElementById('login-form-configurator');
        const logoutButton = document.getElementById('logout-button-configurator');
        const adminTriggerBtn = document.getElementById('admin-trigger');
        const authStatusEl = document.getElementById('auth-status-configurator');
        const loginEmailInput = document.getElementById('login-email-configurator');
        const loginPasswordInput = document.getElementById('login-password-configurator');
        const loginErrorEl = document.getElementById('login-error-configurator');
        const closeModalBtn = loginModal ? loginModal.querySelector('.close-btn') : null;
        const loginModalTitle = document.getElementById('login-modal-title-configurator');


        if (adminTriggerBtn) {
            adminTriggerBtn.addEventListener('click', () => {
                if (!loginModal) { console.error("Login modal not found!"); return;}
                if (auth.currentUser) {
                    if (logoutButton) logoutButton.style.display = 'block';
                    if (loginForm) loginForm.style.display = 'none';
                    if (loginErrorEl) loginErrorEl.style.display = 'none';
                    if (loginModalTitle) loginModalTitle.textContent = `Loggato: ${auth.currentUser.email}`;
                } else {
                    if (logoutButton) logoutButton.style.display = 'none';
                    if (loginForm) loginForm.style.display = 'block';
                    if (loginModalTitle) loginModalTitle.textContent = 'Accesso Amministratore';
                }
                loginModal.style.display = 'block';
            });
        }
        if (closeModalBtn) { closeModalBtn.addEventListener('click', () => {if(loginModal)loginModal.style.display = 'none'});}
        if (loginModal) { loginModal.addEventListener('click', (e) => { if(e.target === loginModal) loginModal.style.display = 'none';}); }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                if (!email || !password) { if(loginErrorEl) {loginErrorEl.textContent = 'Email e Password obbligatori.'; loginErrorEl.style.display = 'block';} return; }
                if(loginErrorEl) loginErrorEl.style.display = 'none';
                auth.signInWithEmailAndPassword(email, password)
                    .then(userCredential => {
                        if(loginModal) loginModal.style.display = 'none';
                        if(loginPasswordInput) loginPasswordInput.value = '';
                    })
                    .catch(error => {
                        if(loginErrorEl) {loginErrorEl.textContent = `Errore: ${error.message}`; loginErrorEl.style.display = 'block';}
                    });
            });
        }
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                auth.signOut().then(() => { if(loginModal)loginModal.style.display = 'none';});
            });
        }

        auth.onAuthStateChanged(user => {
            if (user) {
                db.collection('users').doc(user.uid).get().then(doc => {
                    window.currentUserRole = doc.exists && doc.data().role ? doc.data().role : 'user';
                    if (authStatusEl) authStatusEl.textContent = ` (${window.currentUserRole})`;
                    if (adminTriggerBtn) adminTriggerBtn.title = (window.currentUserRole === 'admin' ? `Admin Logout (${user.email.split('@')[0]})` : `Logout (${user.email.split('@')[0]})` );
                    toggleAdminSectionVisibility();
                }).catch(() => { window.currentUserRole = null; toggleAdminSectionVisibility();});
            } else {
                window.currentUserRole = null;
                if (authStatusEl) authStatusEl.textContent = '';
                if (adminTriggerBtn) adminTriggerBtn.title = "Accesso Admin";
                toggleAdminSectionVisibility();
            }
        });
    }
    
    // Rename original initializeApp to avoid conflict
    async function initializeConfiguratorApp() {
        console.log("DEBUG: initializeConfiguratorApp called"); // For clarity
        document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex';
        let brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc;
        try {
            console.log("DEBUG: Fetching all Firestore data for configurator...");
            [ brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc ] = 
            await Promise.all([
                fetchFirestoreCollection('brands'), fetchFirestoreCollection('configTypes'),
                fetchFirestoreCollection('uiSeriesImageMapping'), fetchFirestoreCollection('outdoorUnits'),
                fetchFirestoreCollection('indoorUnits'), db.collection('metadata').doc('appInfo').get() 
            ]);
            console.log("DEBUG: Configurator Firestore data fetching complete.");
            processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs);
        } catch (error) { console.error("CRITICAL ERROR fetching/processing configurator data:", error); loadingOverlay.innerHTML = `<p style="color:red;">Errore caricamento dati configuratore.</p>`; return; }
        
        stepsHtmlContainers.forEach(el => el.classList.remove('active-step')); 
        document.getElementById('step-1')?.classList.add('active-step'); 
        currentLogicalStep = 1; 
        highestLogicalStepCompleted = 0; 
        updateStepIndicator(); 
        populateBrands(); 
        
        const brandSelectionContent = brandSelectionDiv.innerHTML.trim();
        if (brandSelectionContent.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p'))) {
             console.warn("INIT WARNING: No brands populated for configurator.");
             if (loadingOverlay.style.display !== 'none') { loadingOverlay.innerHTML = `<p style="color:orange;">Errore: Nessuna marca configuratore disponibile.</p>`; }
        } else { 
            if(loadingOverlay.isConnected) loadingOverlay.style.display = 'none'; 
        }
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        try { 
            if (metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate) { 
                const timestamp = metadataDoc.data().lastDataUpdate; 
                document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }); 
            } else { 
                console.log("DEBUG: metadata/appInfo (configurator) missing."); 
                document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); 
            }
        } catch(err) { 
            console.warn("Error retrieving configurator metadata:", err); 
            document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); 
        }
        
        initializeNavigation(); // Configurator step navigation
        console.log("DEBUG: Configurator app part initialized.");
    }
    
    // --- Run Application ---
    setupAuthUI(); // Sets up login modal listeners and onAuthStateChanged
    initializeConfiguratorApp(); // Loads configurator data and sets up its UI

});
// --- END OF SCRIPT.JS ---
