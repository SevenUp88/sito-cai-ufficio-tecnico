// --- START OF SCRIPT.JS (FIREBASE - 6 STEP FLOW - SCENARIO 1: EXACT CONNECTIONS) ---
// Flow: Marca -> Config -> Modello -> UE -> UI Taglie -> Riepilogo

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (6-Step Flow - Scenario 1)");

    // --- START: Stili CSS per la stampa ---
    // Print styles are handled by the CSS files.
    // --- END: Stili CSS per la stampa ---


    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
      authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
      projectId: "consorzio-artigiani-idraulici",
      storageBucket: "consorzio-artigiani-idraulici.appspot.com",
      messagingSenderId: "136848104008",
      appId: "1:136848104008:web:2724f60607dbe91d09d67d",
      measurementId: "G-NNPV2607G7"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

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
    async function fetchFirestoreCollection(collectionName) { console.log(`DEBUG: Fetching Firestore collection: ${collectionName}`); try { const snapshot = await db.collection(collectionName).get(); const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); console.log(`DEBUG: Fetched ${data.length} items from ${collectionName}.`); return data; } catch (error) { console.error(`DEBUG: Error fetching collection ${collectionName}:`, error); loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore caricamento ${collectionName}.</span>`; return []; } }
    function parsePowerString(powerStr) { let btu = 0; let kw = "N/A"; if (typeof powerStr === 'string' && powerStr !== "Dati mancanti") { const btuMatch = powerStr.match(/([\d.,]+)\s*BTU/i); if (btuMatch && btuMatch[1]) btu = parseInt(btuMatch[1].replace(/[.,]/g, ''), 10) || 0; const kwMatch = powerStr.match(/([\d.,]+)\s*kW/i); if (kwMatch && kwMatch[1]) kw = kwMatch[1].replace(',', '.'); else if (btu > 0 && kw === "N/A") kw = (btu / 3412.14).toFixed(1); } return { btu, kw }; }
    function sanitizeForId(str) { if (!str) return ''; return String(str).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''); }

    // MODIFIED processLoadedData
    function processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs) {
        APP_DATA.brands = brandsDocs;
        APP_DATA.configTypes = configTypesDocs.reduce((acc, ct) => { acc[ct.id] = { id: ct.id, name: ct.name, numUnits: ct.numUnits }; return acc; }, {});
        APP_DATA.uiSeriesImageMapping = seriesMapDocs.reduce((acc, mapping) => { if(mapping.seriesKey) acc[mapping.seriesKey] = mapping.imageName; return acc; }, {});

        const getFieldOrPlaceholder = (fieldValue, placeholder = "N/D") => {
            if (fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim() !== "" && String(fieldValue).toUpperCase() !== "DATI MANCANTI") {
                return String(fieldValue);
            }
            return placeholder;
        };

        APP_DATA.outdoorUnits = outdoorUnitsDocs.map((ue_doc, index) => {
            const brandId = String(ue_doc.marca || 'sconosciuta').toLowerCase();
            const connections = Number(ue_doc.unit_collegabili) || 0;
            const uePotenzaKw = Number(ue_doc.potenza) || 0;
            
            return {
                id: ue_doc.id || `ue_${index}`, brandId: brandId,
                modelCode: getFieldOrPlaceholder(ue_doc.codice_prodotto, "N/A"),
                name: ue_doc.nome_modello_ue && ue_doc.nome_modello_ue !== "Dati mancanti" ? `${String(ue_doc.marca || '').toUpperCase()} ${ue_doc.nome_modello_ue}` : `UE ${String(ue_doc.marca || '').toUpperCase()} (${getFieldOrPlaceholder(ue_doc.codice_prodotto, 'ID: ' + ue_doc.id)})`,
                kw: uePotenzaKw,
                connections: connections,
                price: Number(ue_doc.prezzo) || 0,
                dimensions: getFieldOrPlaceholder(ue_doc.dimensioni_ue),
                weight: getFieldOrPlaceholder(ue_doc.peso_ue),
                energyClassCooling: getFieldOrPlaceholder(ue_doc.classe_energetica_raffrescamento),
                energyClassHeating: getFieldOrPlaceholder(ue_doc.classe_energetica_riscaldamento),
                compatibleIndoorSeriesIds: Array.isArray(ue_doc.compatibleIndoorSeriesIds) ? ue_doc.compatibleIndoorSeriesIds : []
            };
        });
        APP_DATA.indoorUnits = indoorUnitsDocs.map((ui_doc, index) => {
            const brandId = String(ui_doc.marca || 'sconosciuta').toLowerCase();
            const seriesName = String(ui_doc.modello || `serie_${index}`).trim();
            const seriesId = sanitizeForId(seriesName) + "_ui";
            const { btu, kw } = parsePowerString(ui_doc.potenza);
            let imagePath = "";
            if (ui_doc.percorso_immagine_ui && ui_doc.percorso_immagine_ui !== "Dati mancanti") { imagePath = ui_doc.percorso_immagine_ui;}
            else { let imageNameMapped = APP_DATA.uiSeriesImageMapping[seriesId]; if (!imageNameMapped) { imageNameMapped = sanitizeForId(seriesName);} imagePath = `img/${imageNameMapped}.png`;}
            return {
                id: ui_doc.id || `ui_${index}`, brandId: brandId, seriesId: seriesId, seriesName: seriesName,
                modelCode: getFieldOrPlaceholder(ui_doc.codice_prodotto, "N/A"), 
                name: `${String(ui_doc.marca || '').toUpperCase()} ${seriesName} ${kw}kW (${btu} BTU)`,
                type: String(ui_doc.tipo_unit || 'Parete').toLowerCase() === "interna" ? "Parete" : ui_doc.tipo_unit,
                capacityBTU: btu, kw: kw, price: Number(ui_doc.prezzo_ui) || 0, image: imagePath,
                dimensions: getFieldOrPlaceholder(ui_doc.dimensioni_ui), 
                weight: getFieldOrPlaceholder(ui_doc.peso_ui), 
                wifi: ui_doc.wifi === true
            };
        });
    } 

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('selection-item');
    if (isSelected) itemDiv.classList.add('selected');
    if (item && item.id != null) { itemDiv.setAttribute('data-' + type + '-id', String(item.id));}
    let logoSrc = '';
    if (type === 'brand' && item && item.logo) { logoSrc = item.logo;}
    else if (type === 'series' && item && item.image) { logoSrc = item.image; itemDiv.classList.add('series-selection-item');}
    const nameSpan = document.createElement('span');
    nameSpan.textContent = (item && item.name) ? String(item.name) : ''; 
    if (logoSrc) {
        const logoImg = document.createElement('img');
        logoImg.src = String(logoSrc); 
        let altText = "Immagine";
        if (item && item.name) {altText = String(item.name) + " Immagine";} else if (type) { altText = String(type) + " Immagine";}
        logoImg.alt = altText;
        if (type === 'brand') logoImg.classList.add('brand-logo');
        if (type === 'series') logoImg.classList.add('series-logo');
        logoImg.onload = () => { if (type === 'brand' && nameSpan) nameSpan.style.display = 'none';};
        logoImg.onerror = () => { console.warn(`DEBUG: Errore caricamento ${type} immagine ${logoSrc} per '${altText}'`); if (logoImg) logoImg.style.display = 'none'; if (nameSpan) nameSpan.style.display = 'block';};
        itemDiv.appendChild(logoImg);
        if (type === 'brand' && nameSpan) nameSpan.style.display = 'none';
    } else { if (nameSpan) nameSpan.style.display = 'block';}
    itemDiv.appendChild(nameSpan);
    itemDiv.addEventListener('click', () => {
        if (itemDiv.parentElement) { itemDiv.parentElement.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));}
        itemDiv.classList.add('selected');
        if (item) { clickHandler(item);} else { console.error("Tentativo di click handler con item non definito per tipo:", type);}
    });
    return itemDiv;
    }

    // MODIFIED createUnitSelectionCard
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) {
        const card = document.createElement('div');
        card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected');

        if (unit && unit.id != null) {
            card.setAttribute('data-unit-id', String(unit.id));
        }

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('unit-info');

        const nameH4 = document.createElement('h4');
        let unitTitle = "UNITA' ESTERNA";
        if (unit && unit.kw && String(unit.kw).toUpperCase() !== "DATI MANCANTI" && unit.kw !== 0 && String(unit.kw).toUpperCase() !== "N/A") {
            unitTitle += ` ${String(unit.kw)}kW`;
        }
        nameH4.textContent = unitTitle;
        infoDiv.appendChild(nameH4);

        const valOrDashDisplay = (val, suffix = '', placeholder = '-') => {
            const strVal = val ? String(val).trim() : "";
            if (strVal && strVal.toUpperCase() !== "DATI MANCANTI" && strVal.toUpperCase() !== "N/A" && strVal.toUpperCase() !== "N/D" && strVal.toUpperCase() !== "N.D.") {
                return `${strVal}${suffix}`;
            }
            return placeholder;
        };
        
        const modelP = document.createElement('p');
        let modelP_html = "Codice: ";
        const modelCodeDisplay = valOrDashDisplay(unit?.modelCode);
        modelP_html += `<strong>${modelCodeDisplay}</strong>`;
        modelP_html += ` | Max UI: ${(unit && unit.connections !== undefined) ? String(unit.connections) : '?'}`;
        modelP.innerHTML = modelP_html;
        infoDiv.appendChild(modelP);

        const energyClassContainerP = document.createElement('p');
        const energyLabelSpan = document.createElement('span');
        energyLabelSpan.classList.add('energy-class-label');
        energyLabelSpan.textContent = "Classe Energetica (F/C):";
        energyClassContainerP.appendChild(energyLabelSpan);
        
        const coolingVal = unit?.energyClassCooling;
        let coolingDisplayText = valOrDashDisplay(coolingVal);
        let isCoolingDataValid = !(coolingVal === undefined || coolingVal === null || String(coolingVal).toUpperCase() === "N/D" || String(coolingVal).toUpperCase() === "DATI MANCANTI" || String(coolingVal).trim() === "" || String(coolingVal).trim() === "-");

        const coolingSpan = document.createElement('span');
        coolingSpan.classList.add('energy-rating');
        coolingSpan.classList.toggle('cooling', isCoolingDataValid);
        coolingSpan.classList.toggle('unknown', !isCoolingDataValid);
        coolingSpan.textContent = coolingDisplayText;
        energyClassContainerP.appendChild(coolingSpan);

        const separatorSpan = document.createElement('span');
        separatorSpan.classList.add('energy-separator');
        separatorSpan.textContent = "/";
        energyClassContainerP.appendChild(separatorSpan);

        const heatingVal = unit?.energyClassHeating;
        let heatingDisplayText = valOrDashDisplay(heatingVal);
        let isHeatingDataValid = !(heatingVal === undefined || heatingVal === null || String(heatingVal).toUpperCase() === "N/D" || String(heatingVal).toUpperCase() === "DATI MANCANTI" || String(heatingVal).trim() === "" || String(heatingVal).trim() === "-");
        
        const heatingSpan = document.createElement('span');
        heatingSpan.classList.add('energy-rating');
        heatingSpan.classList.toggle('heating', isHeatingDataValid);
        heatingSpan.classList.toggle('unknown', !isHeatingDataValid);
        heatingSpan.textContent = heatingDisplayText;
        energyClassContainerP.appendChild(heatingSpan);
        infoDiv.appendChild(energyClassContainerP);

        const dimensionsP = document.createElement('p');
        const dimDisplay = valOrDashDisplay(unit?.dimensions);
        
        let weightSuffix = '';
        const weightRaw = unit?.weight;
        if (weightRaw && String(weightRaw).trim() !== "" && String(weightRaw).toUpperCase() !== "N/D" && String(weightRaw).toUpperCase() !== "DATI MANCANTI" && !isNaN(parseFloat(String(weightRaw))) && isFinite(Number(weightRaw))) {
             weightSuffix = ' kg';
        }
        const weightDisplay = valOrDashDisplay(weightRaw, weightSuffix);
        
        dimensionsP.textContent = `Dimensioni: ${dimDisplay} | Peso: ${weightDisplay}`;
        infoDiv.appendChild(dimensionsP);

        const priceP = document.createElement('p');
        priceP.classList.add('unit-price');
        let priceText = "Prezzo: ";
        if (unit && typeof unit.price === 'number') {
            priceText += unit.price.toFixed(2);
        } else {
            priceText += valOrDashDisplay(unit?.price, '', '-'); // Ensure '-' if price is not valid
        }
        priceText += " € (IVA escl.)";
        priceP.textContent = priceText;
        infoDiv.appendChild(priceP);

        card.appendChild(infoDiv);
        card.addEventListener('click', () => {
            if (card.parentElement) {
                card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
            }
            card.classList.add('selected');
            if (unit) { 
                clickHandler(unit);
            } else {
                console.error("Tentativo di click handler con unit non definito.");
            }
        });
        return card;
    }


    function clearAndResetUIForStep(logicalStep) { const divId = LOGICAL_TO_HTML_STEP_MAP[logicalStep]; const div = document.getElementById(divId); if (div) { const contentArea = div.querySelector('.selection-grid') || div.querySelector('.selection-list') || div.querySelector('#indoor-units-selection-area'); if (contentArea) { contentArea.innerHTML = '<p>Completa i passaggi precedenti.</p>'; } else { div.innerHTML = '<p>Contenuto non disponibile.</p>';} } }
    function resetSelectionsAndUIFrom(stepToClearFrom) { console.log(`resetSelectionsAndUIFrom: Clearing data and UI from step ${stepToClearFrom} onwards.`); if (stepToClearFrom <= 5 && (selections.indoorUnits.length > 0 || indoorUnitsSelectionArea.innerHTML.includes('indoor-unit-choice-card'))) { selections.indoorUnits = []; clearAndResetUIForStep(5); console.log("Cleared: indoorUnits & UI Step 5"); if(finalizeBtn) finalizeBtn.disabled = true; } if (stepToClearFrom <= 4 && (selections.outdoorUnit || outdoorUnitSelectionDiv.innerHTML.includes('card'))) { selections.outdoorUnit = null; clearAndResetUIForStep(4); console.log("Cleared: outdoorUnit & UI Step 4"); } if (stepToClearFrom <= 3 && (selections.indoorSeries || indoorSeriesSelectionDiv.innerHTML.includes('item'))) { selections.indoorSeries = null; clearAndResetUIForStep(3); console.log("Cleared: indoorSeries & UI Step 3"); } if (stepToClearFrom <= 2 && (selections.configType || configTypeSelectionDiv.innerHTML.includes('item'))) { selections.configType = null; clearAndResetUIForStep(2); console.log("Cleared: configType & UI Step 2"); } if (stepToClearFrom <= 1 && (selections.brand || brandSelectionDiv.innerHTML.includes('item'))) { selections.brand = null; brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); console.log("Cleared: brand (data only, UI repopulated by populateBrands)"); } if (stepToClearFrom <= TOTAL_LOGICAL_STEPS) { summaryDiv.innerHTML = ''; document.getElementById('summary-main-title')?.classList.remove('print-main-title');} }

    function populateBrands() { brandSelectionDiv.innerHTML = ''; if (!APP_DATA.outdoorUnits?.length) { brandSelectionDiv.innerHTML = '<p>Dati unità esterne non disponibili.</p>'; return; } const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId).filter(id => id && id !== 'sconosciuta'))]; const brandsToShow = APP_DATA.brands.filter(b => uniqueBrandIdsFromUEs.includes(b.id)); if (!brandsToShow.length) { brandSelectionDiv.innerHTML = '<p>Nessuna marca con UEs.</p>'; return; } brandsToShow.forEach(brand => { brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => { if (selections.brand?.id !== selectedBrand.id) { resetSelectionsAndUIFrom(2); selections.brand = selectedBrand; highestLogicalStepCompleted = 1; } populateConfigTypes(); showStep(2); }, selections.brand?.id === brand.id)); }); if (selections.brand && !brandsToShow.some(b => b.id === selections.brand.id)) selections.brand = null; }
    function populateConfigTypes() { configTypeSelectionDiv.innerHTML = ''; if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>Scegli marca.</p>'; return; } const validConfigs = Object.values(APP_DATA.configTypes).filter(ct => APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections === ct.numUnits)).sort((a,b) => a.numUnits - b.numUnits); if (!validConfigs.length) { configTypeSelectionDiv.innerHTML = `<p>Nessuna config. per ${selections.brand.name}.</p>`; return; } validConfigs.forEach(config => { configTypeSelectionDiv.appendChild(createSelectionItem(config, 'config', (selectedConfig) => { if (selections.configType?.id !== selectedConfig.id) { resetSelectionsAndUIFrom(3); selections.configType = selectedConfig; highestLogicalStepCompleted = 2; } populateIndoorSeries(); showStep(3); }, selections.configType?.id === config.id)); }); if (selections.configType && !validConfigs.some(vc => vc.id === selections.configType.id)) selections.configType = null;}
    function populateIndoorSeries() { indoorSeriesSelectionDiv.innerHTML = ''; if (!selections.brand || !selections.configType) { indoorSeriesSelectionDiv.innerHTML = '<p>Scegli Marca & Config.</p>'; return; } const brandId = selections.brand.id; const numUnitsRequired = selections.configType.numUnits; const candidateUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === brandId && ue.connections === numUnitsRequired); if (!candidateUEs.length) { indoorSeriesSelectionDiv.innerHTML = `<p>Nessuna UE ${brandId} per ${numUnitsRequired} UI.</p>`; return; } const compatibleSeriesIdsSet = new Set(candidateUEs.flatMap(ue => ue.compatibleIndoorSeriesIds || [])); if (compatibleSeriesIdsSet.size === 0) { indoorSeriesSelectionDiv.innerHTML = `<p>Nessun modello UI compatibile per UE ${brandId}/${numUnitsRequired}-split.</p>`; return; } const validIndoorUnitsForSeriesSelection = APP_DATA.indoorUnits.filter(ui => ui.brandId === brandId && compatibleSeriesIdsSet.has(ui.seriesId)); const uniqueSeries = []; const seenSeriesIds = new Set(); validIndoorUnitsForSeriesSelection.forEach(ui => { if (!seenSeriesIds.has(ui.seriesId)) { let img = APP_DATA.uiSeriesImageMapping[ui.seriesId] ? `img/${APP_DATA.uiSeriesImageMapping[ui.seriesId]}.png` : (ui.image || null); uniqueSeries.push({ name: ui.seriesName, id: ui.seriesId, image: img }); seenSeriesIds.add(ui.seriesId); } }); if (!uniqueSeries.length) { indoorSeriesSelectionDiv.innerHTML = `<p>Nessun Modello UI ${brandId} compatibile trovato.</p>`; return; } uniqueSeries.sort((a,b) => a.name.localeCompare(b.name)); uniqueSeries.forEach(series => { indoorSeriesSelectionDiv.appendChild(createSelectionItem(series, 'series', (selectedSeries) => { if (selections.indoorSeries?.id !== selectedSeries.id) { resetSelectionsAndUIFrom(4); selections.indoorSeries = selectedSeries; highestLogicalStepCompleted = 3; } populateOutdoorUnits(); showStep(4); }, selections.indoorSeries?.id === series.id));}); if (selections.indoorSeries && !uniqueSeries.some(s => s.id === selections.indoorSeries.id)) selections.indoorSeries = null;}
    function populateOutdoorUnits() { outdoorUnitSelectionDiv.innerHTML = ''; if (!selections.brand || !selections.configType || !selections.indoorSeries) { outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Marca, Config., Modello.</p>'; return;} const numRequired = selections.configType.numUnits; const requiredSeriesId = selections.indoorSeries.id; const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections === numRequired && Array.isArray(ue.compatibleIndoorSeriesIds) && ue.compatibleIndoorSeriesIds.includes(requiredSeriesId)); if (!compatibleUEs.length) { outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} per ${numRequired} UI compatibile con "${selections.indoorSeries.name}".</p>`; return; } const uniqueUEsToDisplay = []; const seenUEKeys = new Set(); for (const ue of compatibleUEs) { const ueKey = `${ue.modelCode}-${ue.kw}-${ue.connections}-${ue.price.toFixed(2)}`; if (!seenUEKeys.has(ueKey)) { seenUEKeys.add(ueKey); uniqueUEsToDisplay.push(ue);}} if (!uniqueUEsToDisplay.length) { outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE unica trovata per ${selections.brand.name}.</p>`; return; } uniqueUEsToDisplay.forEach(ue => { outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => { if (selections.outdoorUnit?.id !== selectedUE.id) { resetSelectionsAndUIFrom(5); selections.outdoorUnit = selectedUE; highestLogicalStepCompleted = 4; } populateIndoorUnitSelectors(); showStep(5); }, selections.outdoorUnit?.id === ue.id));}); if (selections.outdoorUnit && !uniqueUEsToDisplay.some(ue => ue.id === selections.outdoorUnit.id)) { selections.outdoorUnit = null;}}
    
    const valOrDash = (val, suffix = '') => { // Global helper for consistency
        const S = (str) => str != null ? String(str).replace(/`/g, "'") : '';
        const strVal = S(val);
        if (strVal && strVal.toUpperCase() !== "DATI MANCANTI" && strVal.toUpperCase() !== "N/A" && strVal.toUpperCase() !== "N.D" && strVal.toUpperCase() !== "N.D." && strVal.trim() !== "" && strVal.trim() !== "-") {
            return `${strVal}${suffix}`;
        }
        return '-';
    };

    function updateStepSelectionInfo() {
        const S = (str) => str != null ? String(str).replace(/`/g, "'") : ''; 
        const formatText = (text, isNumericOrSpecial = false) => {
            if (!text) return ' ';
            const processedText = isNumericOrSpecial ? S(text) : S(text).toUpperCase();
            return `<strong>${processedText}</strong>`;
        };
    
        const stepInfo1 = document.getElementById('step-info-1');
        if (stepInfo1) { stepInfo1.innerHTML = selections.brand && selections.brand.name ? formatText(selections.brand.name) : ' ';}
        const stepInfo2 = document.getElementById('step-info-2');
        if (stepInfo2) { stepInfo2.innerHTML = selections.configType && selections.configType.name ? formatText(selections.configType.name) : ' ';}
        const stepInfo3 = document.getElementById('step-info-3');
        if (stepInfo3) { stepInfo3.innerHTML = selections.indoorSeries && selections.indoorSeries.name ? formatText(selections.indoorSeries.name) : ' ';}
        const stepInfo4 = document.getElementById('step-info-4');
        if (stepInfo4) { if (selections.outdoorUnit && (selections.outdoorUnit.kw != null)) { let kwText = `${S(selections.outdoorUnit.kw)}KW`; stepInfo4.innerHTML = formatText(kwText, true); } else { stepInfo4.innerHTML = ' ';}}
        const stepInfo5 = document.getElementById('step-info-5');
        if (stepInfo5) {
            if (selections.outdoorUnit && selections.configType) {
                const numSlots = selections.configType.numUnits;
                if (numSlots > 0) {
                    let btuParts = [];
                    for (let i = 0; i < numSlots; i++) { if (selections.indoorUnits[i] && selections.indoorUnits[i].capacityBTU != null) { btuParts.push(String(selections.indoorUnits[i].capacityBTU));} else { btuParts.push("..."); }}
                    if (btuParts.length > 0) { stepInfo5.innerHTML = formatText(btuParts.join(' + '), true); } else { stepInfo5.innerHTML = formatText('DA SELEZIONARE'); }
                } else { stepInfo5.innerHTML = formatText('N/A'); }
            } else if (currentLogicalStep === 5 && selections.brand && selections.configType && selections.indoorSeries) { stepInfo5.innerHTML = formatText('DA SELEZIONARE');}
            else { stepInfo5.innerHTML = ' '; }
        }
        const stepInfo6 = document.getElementById('step-info-6');
        if (stepInfo6) { stepInfo6.innerHTML = ' '; }
    }
    
    function generateIndoorUnitDetailsHtml(unit) {
        if (!unit) return '<p>Seleziona una taglia/potenza.</p>';
        let html = `<p>Cod: <strong>${valOrDash(unit.modelCode)}</strong></p>`;
        html += `<p>Potenza: <strong>${valOrDash(unit.kw, 'kW')} (${valOrDash(unit.capacityBTU, ' BTU')})</strong></p>`;
        html += `<p>Dimensioni: <strong>${valOrDash(unit.dimensions)}</strong></p>`;
        html += `<p>Peso: <strong>${valOrDash(unit.weight, ' kg')}</strong></p>`;
        html += `<p class="details-price">Prezzo: <strong>€${(unit.price || 0).toFixed(2)}</strong></p>`;
        return html;
    }

    function handleIndoorUnitChoiceClick(event) {
        const clickedCard = event.currentTarget;
        const unitId = clickedCard.dataset.unitId;
        const choicesContainer = clickedCard.parentElement;
        const slotIndex = parseInt(choicesContainer.dataset.slotIndex);

        choicesContainer.querySelectorAll('.indoor-unit-choice-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        clickedCard.classList.add('selected');
        
        const selectedUnitData = APP_DATA.indoorUnits.find(ui => ui.id === unitId);
        selections.indoorUnits[slotIndex] = selectedUnitData || null;

        const slotDiv = choicesContainer.closest('.indoor-unit-slot');
        if (slotDiv) {
            const detailsDiv = slotDiv.querySelector('.unit-details');
            if (detailsDiv) {
                detailsDiv.innerHTML = generateIndoorUnitDetailsHtml(selectedUnitData);
            }
        }
        checkAllIndoorUnitsSelected();
    }

    function populateIndoorUnitSelectors() {
        indoorUnitsSelectionArea.innerHTML = '';
        if (!selections.outdoorUnit || !selections.configType || !selections.brand || !selections.indoorSeries) {
            indoorUnitsSelectionArea.innerHTML = `<p>Completa passaggi precedenti per visualizzare le Unità Interne.</p>`;
            checkAllIndoorUnitsSelected();
            return;
        }

        const availableIndoorUnitsForSeries = APP_DATA.indoorUnits
            .filter(ui => ui.brandId === selections.brand.id && ui.seriesId === selections.indoorSeries.id)
            .sort((a, b) => (a.capacityBTU || 0) - (b.capacityBTU || 0));

        if (!availableIndoorUnitsForSeries.length) {
            indoorUnitsSelectionArea.innerHTML = `<p>Nessuna variante disponibile per il modello UI "${selections.indoorSeries.name}".</p>`;
            checkAllIndoorUnitsSelected();
            return;
        }
        const uniqueDisplayOptionsMap = new Map();
        availableIndoorUnitsForSeries.forEach(uiVariant => {
            const displayKey = `${uiVariant.kw}-${uiVariant.capacityBTU}`;
            if (!uniqueDisplayOptionsMap.has(displayKey)) {
                uniqueDisplayOptionsMap.set(displayKey, uiVariant);
            }
        });
        const uniqueDisplayOptions = Array.from(uniqueDisplayOptionsMap.values());
        
        if (!Array.isArray(selections.indoorUnits) || selections.indoorUnits.length !== selections.configType.numUnits) {
            selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
        }

        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('indoor-unit-slot');

            const label = document.createElement('label');
            label.htmlFor = `indoor-unit-choices-${i}`;
            const safeIndoorSeriesName = String(selections.indoorSeries.name || '').replace(/`/g, "'");
            label.innerHTML = `Unità ${i + 1} (Modello: <strong>${safeIndoorSeriesName}</strong>):`;
            slotDiv.appendChild(label);

            const choicesContainer = document.createElement('div');
            choicesContainer.id = `indoor-unit-choices-${i}`;
            choicesContainer.classList.add('indoor-unit-choices-container');
            choicesContainer.dataset.slotIndex = i;

            if (uniqueDisplayOptions.length === 0) {
                 choicesContainer.innerHTML = `<p>Opzioni UI non chiaramente distinguibili.</p>`;
            } else {
                uniqueDisplayOptions.forEach(displayUnit => {
                    const choiceCard = document.createElement('div');
                    choiceCard.classList.add('indoor-unit-choice-card');
                    choiceCard.dataset.unitId = displayUnit.id; 
                    
                    choiceCard.innerHTML = `
                        <span class="unit-kw">${valOrDash(displayUnit.kw, 'Kw')}</span>
                        <span class="unit-btu">${valOrDash(displayUnit.capacityBTU, ' BTU')}</span>
                    `;

                    if (selections.indoorUnits[i] && selections.indoorUnits[i].id === displayUnit.id) {
                        choiceCard.classList.add('selected');
                    }

                    choiceCard.addEventListener('click', handleIndoorUnitChoiceClick);
                    choicesContainer.appendChild(choiceCard);
                });
            }
            slotDiv.appendChild(choicesContainer);

            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('unit-details');
            if (selections.indoorUnits[i]) {
                detailsDiv.innerHTML = generateIndoorUnitDetailsHtml(selections.indoorUnits[i]);
            } else {
                 detailsDiv.innerHTML = '<p>Seleziona una taglia/potenza dalle opzioni sopra.</p>';
            }
            slotDiv.appendChild(detailsDiv);
            
            indoorUnitsSelectionArea.appendChild(slotDiv);
        }
        checkAllIndoorUnitsSelected();
    }

    function generateSummary() {
        console.log("DEBUG: generateSummary called. Selections:", JSON.parse(JSON.stringify(selections)));
        summaryDiv.innerHTML = ''; 
        
        const mainSummaryTitleEl = document.getElementById('summary-main-title');
        if (mainSummaryTitleEl) {
            mainSummaryTitleEl.textContent = "Riepilogo Configurazione"; 
        }

        const referenceInput = document.getElementById('config-reference'); // Assumes HTML for input is present
        const referenceValue = referenceInput ? referenceInput.value.trim() : "";

        if (!selections.brand || !selections.configType || !selections.indoorSeries || !selections.outdoorUnit) {
            summaryDiv.innerHTML = "<p>Configurazione incompleta. Seleziona tutti i componenti richiesti.</p>";
            return;
        }
        if (selections.configType.numUnits > 0 && (selections.indoorUnits.length !== selections.configType.numUnits || selections.indoorUnits.some(ui => !ui))) {
            summaryDiv.innerHTML = "<p>Selezione Unità Interne incompleta.</p>";
            return;
        }

        let totalPrice = 0;
        if (selections.outdoorUnit) totalPrice += selections.outdoorUnit.price || 0;
        selections.indoorUnits.forEach(ui => { if (ui) totalPrice += ui.price || 0; });

        const S_SUMMARY = (str) => str != null ? String(str).replace(/</g, "<").replace(/>/g, ">").replace(/&/g, "&") : '-';
        const priceOrDash = (price) => typeof price === 'number' ? price.toFixed(2) + " €" : '-';

        let indoorUnitsBtuList = selections.indoorUnits.map(ui => ui ? valOrDash(ui.capacityBTU) : '...').join(' + ');
        if (selections.configType && selections.configType.numUnits === 0) {
            indoorUnitsBtuList = "Nessuna";
        } else if (!selections.configType) {
            indoorUnitsBtuList = "N/D";
        }

        const layoutContainer = document.createElement('div');
        layoutContainer.classList.add('summary-layout-container');

        const printHeaderContainer = document.createElement('div');
        printHeaderContainer.classList.add('summary-print-page-header'); 

        const printTitleSpan = document.createElement('span');
        printTitleSpan.classList.add('print-page-title');
        printTitleSpan.textContent = "RIEPILOGO CONFIGURAZIONE";
        printHeaderContainer.appendChild(printTitleSpan);

        if (referenceValue) {
            const printReferenceSpan = document.createElement('span');
            printReferenceSpan.classList.add('print-page-reference');
            printReferenceSpan.innerHTML = `<strong>Rif:</strong> ${escapeHtml(referenceValue)}`;
            printHeaderContainer.appendChild(printReferenceSpan);
        } else {
            const emptyReferenceSpan = document.createElement('span');
            emptyReferenceSpan.classList.add('print-page-reference');
            printHeaderContainer.appendChild(emptyReferenceSpan); 
        }
        summaryDiv.appendChild(printHeaderContainer); 
        
        const headerInfoDiv = document.createElement('div');
        headerInfoDiv.classList.add('summary-header-info');
        headerInfoDiv.innerHTML = ` 
            <div class="info-group">
                <p><strong>Marca:</strong> ${S_SUMMARY(selections.brand?.name)}</p>
                <p><strong>Modello UI:</strong> ${S_SUMMARY(selections.indoorSeries?.name)}</p>
                <p><strong>Configurazione:</strong> ${S_SUMMARY(selections.configType?.name)}</p>
            </div>
            <div class="info-group">
                <p><strong>Unità Esterna:</strong> ${valOrDash(selections.outdoorUnit?.kw, 'kW')}</p>
                <p><strong>Unità interne:</strong> ${indoorUnitsBtuList}</p>
                <p class="total-price-iva"><strong>Prezzo totale:</strong> ${priceOrDash(totalPrice)} + IVA</p>
            </div>
        `;
        layoutContainer.appendChild(headerInfoDiv);

        const detailsTitle = document.createElement('h2');
        detailsTitle.classList.add('summary-details-title');
        detailsTitle.textContent = "DETTAGLI CONFIGURAZIONE";
        layoutContainer.appendChild(detailsTitle);

        const outdoorUnitBlock = document.createElement('div');
        outdoorUnitBlock.classList.add('summary-detail-block');
        outdoorUnitBlock.innerHTML = `
            <h3>UNITA' ESTERNA</h3>
            <div class="outdoor-unit-details-content">
                <p><strong>Articolo:</strong> ${valOrDash(selections.outdoorUnit?.modelCode)}</p>
                <p><strong>Dimensioni:</strong> ${valOrDash(selections.outdoorUnit?.dimensions)}</p>
                <p><strong>Peso:</strong> ${valOrDash(selections.outdoorUnit?.weight, ' kg')}</p>
                <p><strong>Classe (F/C):</strong> ${valOrDash(selections.outdoorUnit?.energyClassCooling)} / ${valOrDash(selections.outdoorUnit?.energyClassHeating)}</p>
                <p><strong>Prezzo:</strong> ${priceOrDash(selections.outdoorUnit?.price)}</p>
            </div>
        `;
        layoutContainer.appendChild(outdoorUnitBlock);

        if (selections.configType?.numUnits > 0) {
            const indoorUnitsSectionBlock = document.createElement('div');
            indoorUnitsSectionBlock.classList.add('summary-detail-block');
            indoorUnitsSectionBlock.innerHTML = `<h3>UNITA' INTERNE</h3>`;
            
            const indoorUnitsContainer = document.createElement('div');
            indoorUnitsContainer.classList.add('summary-indoor-units-container');

            selections.indoorUnits.forEach((ui, index) => {
                if (!ui) return; 
                const uiCard = document.createElement('div');
                uiCard.classList.add('summary-indoor-unit-detail-card');
                uiCard.innerHTML = `
                    <h4>UNITA' ${index + 1}:</h4>
                    <p><strong>Articolo:</strong> ${valOrDash(ui.modelCode)}</p>
                    <p><strong>Dimensioni:</strong> ${valOrDash(ui.dimensions)}</p>
                    <p><strong>Peso:</strong> ${valOrDash(ui.weight, ' kg')}</p>
                    <p><strong>Wifi:</strong> ${ui.wifi ? 'Sì' : 'No'}</p>
                    <p><strong>Prezzo:</strong> ${priceOrDash(ui.price)}</p>
                `;
                indoorUnitsContainer.appendChild(uiCard);
            });
            indoorUnitsSectionBlock.appendChild(indoorUnitsContainer);
            layoutContainer.appendChild(indoorUnitsSectionBlock);
        }
        summaryDiv.appendChild(layoutContainer); 
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) { if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) { console.warn("Invalid step:", logicalStepNumber); return; } const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber]; if (!htmlContainerId) { console.error("No HTML ID for step:", logicalStepNumber); return;} if (!fromDirectNavigation) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); } else { if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1) { const canJumpToSummary = logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted >= (TOTAL_LOGICAL_STEPS - 1); if (!canJumpToSummary) {showStep(highestLogicalStepCompleted + 1 > TOTAL_LOGICAL_STEPS ? 1 : highestLogicalStepCompleted + 1, true); return;}} if (logicalStepNumber <= highestLogicalStepCompleted) { resetSelectionsAndUIFrom(logicalStepNumber + 1); highestLogicalStepCompleted = logicalStepNumber - 1; }} stepsHtmlContainers.forEach(s => s.classList.remove('active-step')); const targetStepEl = document.getElementById(htmlContainerId); if (targetStepEl) { targetStepEl.classList.add('active-step'); } else { console.error(`HTML container '${htmlContainerId}' not found.`);} currentLogicalStep = logicalStepNumber; updateStepIndicator(); window.scrollTo(0, 0);}
    function updateStepIndicator() { const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line'); stepIndicatorItems.forEach((item, htmlIndex) => { const itemLogicalStep = htmlIndex + 1; if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { item.style.display = 'none'; if (stepLinesHTML[htmlIndex-1]) stepLinesHTML[htmlIndex-1].style.display = 'none'; return;} item.style.display = ''; item.dataset.step = itemLogicalStep; const nameEl = item.querySelector('.step-name'); if(nameEl) nameEl.textContent = LOGICAL_STEP_NAMES[itemLogicalStep-1] || `Step ${itemLogicalStep}`; item.classList.remove('active', 'completed', 'disabled'); const dot = item.querySelector('.step-dot'); if(dot) { dot.classList.remove('active', 'completed'); dot.textContent = itemLogicalStep;} if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot?.classList.add('completed');}  else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot?.classList.add('active');} if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) { item.classList.add('disabled'); }}); stepLinesHTML.forEach((line, htmlLineIndex) => { if (htmlLineIndex >= TOTAL_LOGICAL_STEPS - 1) { line.style.display = 'none'; return;} line.style.display = ''; line.classList.remove('active'); const prevItem = stepIndicatorItems[htmlLineIndex]; if (prevItem && prevItem.style.display !== 'none') { if (prevItem.classList.contains('completed')) { line.classList.add('active');} else if (currentLogicalStep > parseInt(prevItem.dataset.step)) { line.classList.add('active');}}}); updateStepSelectionInfo(); }
    function checkAllIndoorUnitsSelected() { let allSelected = true; if (selections.configType && selections.configType.numUnits > 0) { allSelected = selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null && ui !== undefined); } if(finalizeBtn) { finalizeBtn.disabled = !allSelected; } if(allSelected && selections.configType?.numUnits > 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); } else if (allSelected && selections.configType?.numUnits === 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); } updateStepIndicator();  }
    function initializeNavigation() { stepIndicatorItems.forEach(item => { item.addEventListener('click', () => { if (item.classList.contains('disabled') || item.style.display === 'none') return; const targetLogicalStep = parseInt(item.dataset.step); if (isNaN(targetLogicalStep) || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return; if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { const canShowSummary = selections.brand && selections.configType && selections.indoorSeries && selections.outdoorUnit && (!selections.configType.numUnits > 0 || (selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null))); if (!canShowSummary) { alert("Completa passaggi precedenti."); return;} generateSummary(); } showStep(targetLogicalStep, true); }); }); if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); generateSummary(); showStep(TOTAL_LOGICAL_STEPS); }); } document.querySelectorAll('.prev-btn').forEach(button => { const currentStepElement = button.closest('.config-step'); if (!currentStepElement) return; const currentHtmlId = currentStepElement.id; const currentLogical = HTML_TO_LOGICAL_STEP_MAP[currentHtmlId]; if (currentLogical === undefined || currentLogical === 1) { button.style.display = 'none'; return;} let prevLogicalStep = currentLogical - 1; button.style.display = ''; button.addEventListener('click', () => {showStep(prevLogicalStep, true); }); }); document.getElementById('reset-config-btn')?.addEventListener('click', () => { if (!confirm("Sei sicuro?")) return; selections.brand = null; selections.configType = null; selections.indoorSeries = null; selections.outdoorUnit = null; selections.indoorUnits = []; resetSelectionsAndUIFrom(1); populateBrands(); highestLogicalStepCompleted = 0; showStep(1); }); document.getElementById('print-summary-btn')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Vai al Riepilogo (Passaggio 6) prima di stampare."); }); document.getElementById('print-list')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Completa fino al Riepilogo (Passaggio 6)."); }); }
    async function initializeApp() { document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex'; let brandsDocs,configTypesDocs,seriesMapDocs,outdoorUnitsDocs,indoorUnitsDocs,metadataDoc; try { [brandsDocs,configTypesDocs,seriesMapDocs,outdoorUnitsDocs,indoorUnitsDocs,metadataDoc] = await Promise.all([fetchFirestoreCollection('brands'),fetchFirestoreCollection('configTypes'),fetchFirestoreCollection('uiSeriesImageMapping'),fetchFirestoreCollection('outdoorUnits'),fetchFirestoreCollection('indoorUnits'),db.collection('metadata').doc('appInfo').get()]); processLoadedData(brandsDocs,configTypesDocs,seriesMapDocs,outdoorUnitsDocs,indoorUnitsDocs); } catch (error) { console.error("CRITICAL ERROR:", error); loadingOverlay.innerHTML = `<p style="color:red;">Errore caricamento.</p>`; return;} stepsHtmlContainers.forEach(el=>el.classList.remove('active-step')); document.getElementById('step-1')?.classList.add('active-step'); currentLogicalStep=1; highestLogicalStepCompleted=0; updateStepIndicator(); populateBrands(); const brandSelContent = brandSelectionDiv.innerHTML.trim(); if (brandSelContent.includes("Nessuna marca")||(brandSelectionDiv.children.length===0 && !brandSelectionDiv.querySelector('p'))) { if(loadingOverlay.style.display!=='none'){loadingOverlay.innerHTML = `<p style="color:orange;">Nessuna marca.</p>`;}} else {loadingOverlay.style.display='none';} document.getElementById('currentYear').textContent = new Date().getFullYear(); try { if (metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate) { const ts=metadataDoc.data().lastDataUpdate;document.getElementById('lastUpdated').textContent=new Date(ts.seconds*1000).toLocaleDateString('it-IT',{year:'numeric',month:'long',day:'numeric'});} else {document.getElementById('lastUpdated').textContent=new Date().toLocaleDateString('it-IT');}}catch(err){console.warn("Err metadata:",err);document.getElementById('lastUpdated').textContent=new Date().toLocaleDateString('it-IT');} initializeNavigation();}
    
    window.currentUserRole = null; 
    let adminBrandsListener = null; 
    
    function escapeHtml(unsafeString) {
        if (typeof unsafeString !== 'string') {
            unsafeString = String(unsafeString);
        }
        let newString = unsafeString;
        newString = newString.replace(/&/g, "&");
        newString = newString.replace(/</g, "<");
        newString = newString.replace(/>/g, ">");
        newString = newString.replace(/"/g, "'");
        newString = newString.replace(/'/g, "'");
        return newString;
    }

    function toggleAdminSectionVisibility() {
        const adminSection = document.getElementById('admin-section');
        const isAdminUser = window.currentUserRole === 'admin';
        if (adminSection) {
            adminSection.style.display = isAdminUser ? 'block' : 'none';
            if (isAdminUser && !adminBrandsListener) {
                loadAndDisplayAdminBrands();
                setupAdminBrandFormListener();
            } else if (!isAdminUser && adminBrandsListener) {
                if (typeof adminBrandsListener === 'function') adminBrandsListener(); 
                adminBrandsListener = null;
                const listDiv = document.getElementById('admin-brands-list');
                if (listDiv) listDiv.innerHTML = '<p>Accesso admin richiesto.</p>';
            }
        }
    }

    async function loadAndDisplayAdminBrands() {
        const listDiv = document.getElementById('admin-brands-list');
        if (!listDiv) return;
        listDiv.innerHTML = '<p>Caricamento marche admin...</p>';
        if (adminBrandsListener && typeof adminBrandsListener === 'function') {
            adminBrandsListener(); 
        }
        adminBrandsListener = db.collection("brands").orderBy("name").onSnapshot(snapshot => {
            if (snapshot.empty) {
                listDiv.innerHTML = '<p>Nessuna marca trovata.</p>';
                return;
            }
            let html = '<ul>';
            snapshot.forEach(doc => {
                const brand = { id: doc.id, ...doc.data() };
                html += `<li data-id="${brand.id}" style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dotted #eee;">
                            <span style="flex-grow:1;">
                                <img src="${brand.logo || 'img/placeholder.png'}" alt="${escapeHtml(brand.name)}" style="height:20px; vertical-align:middle; margin-right:8px;">
                                ${escapeHtml(brand.name)} <small>(ID: ${brand.id})</small>
                            </span>
                            <div>
                                <button class="btn-admin-edit-brand" data-id="${brand.id}" style="margin-left:5px; padding:3px 6px; font-size:0.8em;">Mod</button>
                                <button class="btn-admin-delete-brand" data-id="${brand.id}" style="padding:3px 6px; font-size:0.8em;">Elim</button>
                            </div>
                         </li>`;
            });
            html += '</ul>';
            listDiv.innerHTML = html;

            listDiv.querySelectorAll('.btn-admin-edit-brand').forEach(button => { 
                button.addEventListener('click', (event) => { 
                    handleEditBrand(event.target.dataset.id);
                });
            });
            listDiv.querySelectorAll('.btn-admin-delete-brand').forEach(button => { 
                button.addEventListener('click', (event) => { 
                    handleDeleteBrand(event.target.dataset.id);
                });
            });
        }, 
        (error) => { 
            console.error("Errore admin marche: ", error);
            listDiv.innerHTML = '<p>Errore caricamento marche.</p>';
        });
    }

    function clearAdminBrandForm() {
        document.getElementById('brand-doc-id').value = '';
        document.getElementById('brand-id').value = '';
        document.getElementById('brand-id').disabled = false;
        document.getElementById('brand-name').value = '';
        document.getElementById('brand-logo-path').value = '';
        document.getElementById('brand-id').focus();
    }

    function setupAdminBrandFormListener() {
        const form = document.getElementById('admin-brand-form');
        const clearBtn = document.getElementById('admin-brand-form-clear');
        if (!form) return;

        form.addEventListener('submit', async (event) => { 
            event.preventDefault();
            const docIdForEdit = document.getElementById('brand-doc-id').value;
            const brandId = document.getElementById('brand-id').value.trim().toLowerCase();
            const brandName = document.getElementById('brand-name').value.trim();
            const brandLogoPath = document.getElementById('brand-logo-path').value.trim();
            if (!brandId || !brandName || !brandLogoPath) {
                alert("Tutti i campi sono obbligatori.");
                return;
            }
            const brandData = { id: brandId, name: brandName, logo: brandLogoPath }; 
            try {
                if (docIdForEdit && docIdForEdit !== brandId && !document.getElementById('brand-id').disabled) {
                     console.warn("Brand ID changed during edit form submission. This will result in a new document or overwrite an existing one with the new ID.");
                }
                await db.collection("brands").doc(brandId).set(brandData, { merge: true }); 
                alert(`Marca ${docIdForEdit && brandId === document.getElementById('brand-doc-id').value ? 'modificata' : 'aggiunta/aggiornata'}!`);
                clearAdminBrandForm();
            } catch (error) {
                console.error("Errore salvataggio marca: ", error);
                alert("Errore salvataggio marca: " + error.message);
            }
        });
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAdminBrandForm);
        }
    }
    
    async function handleEditBrand(brandIdToEdit) {
        try {
            const brandDoc = await db.collection("brands").doc(brandIdToEdit).get();
            if (brandDoc.exists) {
                const brand = brandDoc.data();
                document.getElementById('brand-doc-id').value = brandDoc.id; 
                document.getElementById('brand-id').value = brand.id || brandDoc.id;  
                document.getElementById('brand-id').disabled = true;      
                document.getElementById('brand-name').value = brand.name;
                document.getElementById('brand-logo-path').value = brand.logo;
                document.getElementById('brand-name').focus();
            } else {
                alert("Marca non trovata.");
            }
        } catch (error) {
            console.error("Errore caricamento marca per modifica:", error);
            alert("Errore caricamento marca.");
        }
    }

    async function handleDeleteBrand(brandIdToDelete) {
        if (!confirm(`Sei sicuro di voler eliminare la marca '${brandIdToDelete}'?`)) return;
        try {
            await db.collection("brands").doc(brandIdToDelete).delete();
            alert("Marca eliminata!");
        } catch (error) {
            console.error("Errore eliminazione marca:", error);
            alert("Errore eliminazione marca.");
        }
    }

    function setupAuthUI() {
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
                if (!loginModal) { console.error("Login modal not found"); return; }
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
        if (closeModalBtn) { closeModalBtn.addEventListener('click', () => { if (loginModal) loginModal.style.display = 'none'; }); }
        if (loginModal) { loginModal.addEventListener('click', (event) => { if (event.target === loginModal) loginModal.style.display = 'none'; }); } 

        if (loginForm) {
            loginForm.addEventListener('submit', (event) => { 
                event.preventDefault();
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                if (!email || !password) {
                    if (loginErrorEl) { loginErrorEl.textContent = 'Email e Password obbligatori.'; loginErrorEl.style.display = 'block'; }
                    return;
                }
                if (loginErrorEl) loginErrorEl.style.display = 'none';
                auth.signInWithEmailAndPassword(email, password)
                    .then(userCredential => { 
                        if (loginModal) loginModal.style.display = 'none';
                        if (loginPasswordInput) loginPasswordInput.value = '';
                    })
                    .catch(error => { 
                        if (loginErrorEl) { loginErrorEl.textContent = `Errore: ${error.message}`; loginErrorEl.style.display = 'block'; }
                    });
            });
        }
        if (logoutButton) {
            logoutButton.addEventListener('click', () => { 
                auth.signOut().then(() => { 
                    if (loginModal) loginModal.style.display = 'none';
                });
            });
        }
        auth.onAuthStateChanged(user => { 
            if (user) {
                db.collection('users').doc(user.uid).get().then(doc => { 
                    window.currentUserRole = doc.exists && doc.data().role ? doc.data().role : 'user';
                    if (authStatusEl) authStatusEl.textContent = ` (${window.currentUserRole})`;
                    if (adminTriggerBtn) adminTriggerBtn.title = (window.currentUserRole === 'admin' ? `Admin Logout (${user.email.split('@')[0]})` : `Logout (${user.email.split('@')[0]})`);
                    toggleAdminSectionVisibility();
                }).catch(() => { 
                    window.currentUserRole = null;
                    toggleAdminSectionVisibility();
                });
            } else {
                window.currentUserRole = null;
                if (authStatusEl) authStatusEl.textContent = '';
                if (adminTriggerBtn) adminTriggerBtn.title = "Accesso Admin";
                toggleAdminSectionVisibility();
            }
        });
    }
    async function initializeConfiguratorApp() { document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex'; let brandsDocs,configTypesDocs,seriesMapDocs,outdoorUnitsDocs,indoorUnitsDocs,metadataDoc; try { [brandsDocs,configTypesDocs,seriesMapDocs,outdoorUnitsDocs,indoorUnitsDocs,metadataDoc] = await Promise.all([fetchFirestoreCollection('brands'),fetchFirestoreCollection('configTypes'),fetchFirestoreCollection('uiSeriesImageMapping'),fetchFirestoreCollection('outdoorUnits'),fetchFirestoreCollection('indoorUnits'),db.collection('metadata').doc('appInfo').get()]); processLoadedData(brandsDocs,configTypesDocs,seriesMapDocs,outdoorUnitsDocs,indoorUnitsDocs); } catch (error) { console.error("CRITICAL ERROR config init:", error); loadingOverlay.innerHTML = `<p style="color:red;">Errore config.</p>`; return;} stepsHtmlContainers.forEach(el=>el.classList.remove('active-step')); document.getElementById('step-1')?.classList.add('active-step'); currentLogicalStep=1; highestLogicalStepCompleted=0; updateStepIndicator(); populateBrands(); const brandSelCont=brandSelectionDiv.innerHTML.trim(); if (brandSelCont.includes("Nessuna marca")||(brandSelectionDiv.children.length===0 && !brandSelectionDiv.querySelector('p'))) { if(loadingOverlay.style.display!=='none'){loadingOverlay.innerHTML = `<p style="color:orange;">Errore config.</p>`;}} else {if(loadingOverlay.isConnected && loadingOverlay.style.display !== 'none') loadingOverlay.style.display = 'none';} document.getElementById('currentYear').textContent=new Date().getFullYear(); try{if(metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate){const ts=metadataDoc.data().lastDataUpdate;document.getElementById('lastUpdated').textContent=new Date(ts.seconds*1000).toLocaleDateString('it-IT',{year:'numeric',month:'long',day:'numeric'});}else{document.getElementById('lastUpdated').textContent=new Date().toLocaleDateString('it-IT');}}catch(err){console.warn("Err meta config:",err);document.getElementById('lastUpdated').textContent=new Date().toLocaleDateString('it-IT');} initializeNavigation();}

    setupAuthUI(); 
    initializeConfiguratorApp(); 
});
// --- END OF SCRIPT.JS ---
