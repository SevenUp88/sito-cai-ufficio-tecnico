// --- START OF SCRIPT.JS (FIREBASE - 6 STEP FLOW - SCENARIO 1: EXACT CONNECTIONS) ---
// Flow: Marca -> Config -> Modello -> UE -> UI Taglie -> Riepilogo

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (6-Step Flow - Scenario 1)");

    // --- START: Stili CSS per la stampa ---
    const printStyles = `
    @media print {
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background-color: white !important;
      }
      body * { /* Nasconde tutto di default */
        visibility: hidden !important;
        background-image: none !important;
        box-shadow: none !important;
        border-style: none !important;
        color: black !important; /* Assicura testo nero su sfondo bianco */
      }

      /* Elementi da rendere visibili */
      #summary-main-title, #summary-main-title *,
      #config-summary, #config-summary * {
        visibility: visible !important;
      }

      #summary-main-title {
        display: block !important;
        text-align: center !important;
        font-size: 16pt !important;
        margin: 20px auto 15px auto !important;
        width: auto !important;
      }

      #config-summary {
        font-size: 10pt !important;
        width: calc(100% - 40px) !important; /* Larghezza con margini di 20px per lato */
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        position: static !important;
        box-sizing: border-box !important;
      }

      #config-summary .summary-block,
      #config-summary .summary-indoor-unit,
      #config-summary .summary-total {
        page-break-inside: avoid !important;
        margin-bottom: 8px !important;
        padding-bottom: 4px !important;
        border-bottom: 0.5px solid #cccccc !important;
      }
      #config-summary .summary-block:last-of-type, /* Per l'ultimo blocco principale */
      #config-summary .summary-indoor-unit:last-of-type { /* Per l'ultima UI in una lista */
        border-bottom: none !important;
      }
      /* Caso specifico per il blocco totali */
      #config-summary .summary-total {
         border-bottom: none !important; /* Il blocco totali non ha bisogno di un bordo inferiore */
         border-top: 1px solid #000000 !important; /* Bordo superiore nero per i totali */
         margin-top: 15px !important;
         padding-top: 10px !important;
      }


      #config-summary .summary-ui-img {
        max-width: 50px !important;
        max-height: 50px !important;
        float: right !important;
        margin-left: 5px !important;
        border: 0.5px solid #eeeeee !important; /* Leggero bordo immagine se necessario */
      }

      #config-summary .price-highlight {
        font-weight: bold !important;
      }

      #config-summary h3, #config-summary h4 {
        font-size: 1.05em !important;
        margin-top: 0.4em !important;
        margin-bottom: 0.2em !important;
      }

      #config-summary p {
        margin-top: 0.1em !important;
        margin-bottom: 0.1em !important;
        line-height: 1.15 !important;
      }
    }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);
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

    function processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs) {
        console.log("DEBUG: Processing Firestore data. Brands:", brandsDocs.length, "Configs:", configTypesDocs.length, "Series Maps:", seriesMapDocs.length, "UE:", outdoorUnitsDocs.length, "UI:", indoorUnitsDocs.length);
        APP_DATA.brands = brandsDocs;
        APP_DATA.configTypes = configTypesDocs.reduce((acc, ct) => { acc[ct.id] = { id: ct.id, name: ct.name, numUnits: ct.numUnits }; return acc; }, {});
        APP_DATA.uiSeriesImageMapping = seriesMapDocs.reduce((acc, mapping) => { if(mapping.seriesKey) acc[mapping.seriesKey] = mapping.imageName; return acc; }, {});

        APP_DATA.outdoorUnits = outdoorUnitsDocs.map((ue_doc, index) => {
            const brandId = String(ue_doc.marca || 'sconosciuta').toLowerCase();
            const connections = Number(ue_doc.unit_collegabili) || 0;
            const uePotenzaKw = Number(ue_doc.potenza) || 0;
            const coolingBTU_UE = Math.round(uePotenzaKw * 3412.14);
            const heatingBTU_UE = coolingBTU_UE;
            return {
                id: ue_doc.id || `ue_${index}`, brandId: brandId,
                modelCode: ue_doc.codice_prodotto || "N/A",
                name: ue_doc.nome_modello_ue && ue_doc.nome_modello_ue !== "Dati mancanti" ? `${String(ue_doc.marca || '').toUpperCase()} ${ue_doc.nome_modello_ue}` : `UE ${String(ue_doc.marca || '').toUpperCase()} (${ue_doc.codice_prodotto || 'ID: ' + ue_doc.id})`,
                kw: uePotenzaKw,
                connections: connections,
                capacityCoolingBTU: coolingBTU_UE, capacityHeatingBTU: heatingBTU_UE,
                price: Number(ue_doc.prezzo) || 0,
                dimensions: ue_doc.dimensioni_ue || "N/A",
                weight: (ue_doc.peso_ue !== "Dati mancanti" && ue_doc.peso_ue !== undefined) ? ue_doc.peso_ue : "N/D",
                energyClassCooling: ue_doc.classe_energetica_raffrescamento || "N/D",
                energyClassHeating: ue_doc.classe_energetica_riscaldamento || "N/D",
                compatibleIndoorSeriesIds: Array.isArray(ue_doc.compatibleIndoorSeriesIds) ? ue_doc.compatibleIndoorSeriesIds : []
            };
        });
        // QUESTA È LA SEZIONE CORRETTA PER PROCESSARE APP_DATA.indoorUnits
        APP_DATA.indoorUnits = indoorUnitsDocs.map((ui_doc, index) => {
            const brandId = String(ui_doc.marca || 'sconosciuta').toLowerCase();
            const seriesName = String(ui_doc.modello || `serie_${index}`).trim();
            const seriesId = sanitizeForId(seriesName) + "_ui";
            const { btu, kw } = parsePowerString(ui_doc.potenza);
            let imagePath = "";
            if (ui_doc.percorso_immagine_ui && ui_doc.percorso_immagine_ui !== "Dati mancanti") {
                imagePath = ui_doc.percorso_immagine_ui;
            } else {
                let imageNameMapped = APP_DATA.uiSeriesImageMapping[seriesId];
                if (!imageNameMapped) {
                    imageNameMapped = sanitizeForId(seriesName);
                }
                imagePath = `img/${imageNameMapped}.png`;
            }
            return {
                id: ui_doc.id || `ui_${index}`,
                brandId: brandId,
                seriesId: seriesId,
                seriesName: seriesName,
                modelCode: ui_doc.codice_prodotto || "N/A",
                name: `${String(ui_doc.marca || '').toUpperCase()} ${seriesName} ${kw}kW (${btu} BTU)`,
                type: String(ui_doc.tipo_unit || 'Parete').toLowerCase() === "interna" ? "Parete" : ui_doc.tipo_unit,
                capacityBTU: btu,
                kw: kw,
                price: Number(ui_doc.prezzo_ui) || 0,
                image: imagePath,
                dimensions: ui_doc.dimensioni_ui || "N/A",
                weight: (ui_doc.peso_ui !== "Dati mancanti" && ui_doc.peso_ui !== undefined) ? ui_doc.peso_ui : "N/D", // Assicurati che peso_ui sia nei dati
                wifi: ui_doc.wifi === true
            };
        });
        // FINE SEZIONE CORRETTA PER PROCESSARE APP_DATA.indoorUnits

        console.log("DEBUG: Processing Firestore data finished.");
        console.log("DEBUG: First Processed UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.stringify(APP_DATA.outdoorUnits[0]) : "ND");
        console.log("DEBUG: First Processed UI:", APP_DATA.indoorUnits.length > 0 ? JSON.stringify(APP_DATA.indoorUnits[0]) : "ND");
    } // <<< CORRETTA CHIUSURA DI processLoadedData

    // --- UI Element Creation Helper Functions ---
    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected');
        itemDiv.dataset[type + 'Id'] = item.id;
        let logoSrc = '';
        if (type === 'brand' && item.logo) {
            logoSrc = item.logo;
        } else if (type === 'series' && item.image) {
            logoSrc = item.image;
            itemDiv.classList.add('series-selection-item');
        }
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;

        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc;
            // Sanificazione per attributo alt
            const safeItemNameForAlt = String(item.name || type || '').replace(/`/g, "'");
            logoImg.alt = `${safeItemNameForAlt} Immagine`;
            if (type === 'brand') logoImg.classList.add('brand-logo');
            if (type === 'series') logoImg.classList.add('series-logo');
            logoImg.onload = () => { if (type === 'brand') nameSpan.style.display = 'none'; };
            logoImg.onerror = () => {
                console.warn(`DEBUG: Errore caricamento ${type} immagine ${logoSrc} per '${safeItemNameForAlt}'`);
                logoImg.style.display = 'none';
                nameSpan.style.display = 'block';
            };
            itemDiv.appendChild(logoImg);
            if (type === 'brand') nameSpan.style.display = 'none';
        } else {
            nameSpan.style.display = 'block';
        }
        itemDiv.appendChild(nameSpan);
        itemDiv.addEventListener('click', () => {
            if (itemDiv.parentElement) {
                itemDiv.parentElement.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            }
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
    card.style.flexDirection = "column";
    card.style.alignItems = 'flex-start';
    
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('unit-info');
    infoDiv.style.width = '100%';

    const nameH4 = document.createElement('h4');
    let unitTitle = "UNITA' ESTERNA";
    if (unit.kw && unit.kw !== "Dati mancanti" && unit.kw !== 0 && unit.kw !== "N/A") {
        unitTitle += ` ${unit.kw}kW`;
    }
    nameH4.textContent = unitTitle;
    infoDiv.appendChild(nameH4);

    const modelP = document.createElement('p');
    modelP.innerHTML = `Codice: <strong>${unit.modelCode || 'N/A'}</strong> | Max UI: ${unit.connections === undefined ? '?' : unit.connections}`;
    infoDiv.appendChild(modelP);

    const energyClassContainerP = document.createElement('p');
    const energyLabelSpan = document.createElement('span');
    energyLabelSpan.classList.add('energy-class-label');
    energyLabelSpan.textContent = "Classe Energetica (F/C):";
    energyClassContainerP.appendChild(energyLabelSpan);

    const coolingClass = unit.energyClassCooling || 'N/D';
    const coolingSpan = document.createElement('span');
    coolingSpan.classList.add('energy-rating');
    if (coolingClass === 'N/D' || coolingClass === '?') {
        coolingSpan.classList.add('unknown');
    } else {
        coolingSpan.classList.add('cooling');
    }
    coolingSpan.textContent = coolingClass;
    energyClassContainerP.appendChild(coolingSpan);

    const separatorSpan = document.createElement('span');
    separatorSpan.classList.add('energy-separator');
    separatorSpan.textContent = "/";
    energyClassContainerP.appendChild(separatorSpan);

    const heatingClass = unit.energyClassHeating || 'N/D';
    const heatingSpan = document.createElement('span');
    heatingSpan.classList.add('energy-rating');
    if (heatingClass === 'N/D' || heatingClass === '?') {
        heatingSpan.classList.add('unknown');
    } else {
        heatingSpan.classList.add('heating');
    }
    heatingSpan.textContent = heatingClass;
    energyClassContainerP.appendChild(heatingSpan);
    infoDiv.appendChild(energyClassContainerP);

    const dimensionsP = document.createElement('p');
    let dimText = unit.dimensions && unit.dimensions !== "N/A" ? `Dimensioni: ${unit.dimensions}` : "Dimensioni: N/A";
    if (unit.weight && unit.weight !== "N/D") {
        dimText += ` | Peso: ${unit.weight} kg`;
    } else if (unit.weight === "N/D") {
        dimText += ` | Peso: N/D`;
    } else {
        dimText += ` | Peso: ?`;
    }
    dimensionsP.textContent = dimText;
    infoDiv.appendChild(dimensionsP);

    const priceP = document.createElement('p');
    priceP.classList.add('unit-price');
    priceP.textContent = `Prezzo: ${typeof unit.price === 'number' ? unit.price.toFixed(2) : (unit.price || 'N/D')} € (IVA escl.)`;
    infoDiv.appendChild(priceP);

    card.appendChild(infoDiv);
    card.addEventListener('click', () => {
        if (card.parentElement) {
            card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
        }
        card.classList.add('selected');
        clickHandler(unit);
    });
    return card;
}
    // --- State Management for Clearing UI ---
    function clearAndResetUIForStep(logicalStep) { const divId = LOGICAL_TO_HTML_STEP_MAP[logicalStep]; const div = document.getElementById(divId); if (div) { const contentArea = div.querySelector('.selection-grid') || div.querySelector('.selection-list') || div.querySelector('#indoor-units-selection-area'); if (contentArea) { contentArea.innerHTML = '<p>Completa i passaggi precedenti.</p>'; } else { div.innerHTML = '<p>Contenuto non disponibile.</p>';} } }
    function resetSelectionsAndUIFrom(stepToClearFrom) { console.log(`resetSelectionsAndUIFrom: Clearing data and UI from step ${stepToClearFrom} onwards.`); if (stepToClearFrom <= 5 && (selections.indoorUnits.length > 0 || indoorUnitsSelectionArea.innerHTML.includes('<select'))) { selections.indoorUnits = []; clearAndResetUIForStep(5); console.log("Cleared: indoorUnits & UI Step 5"); if(finalizeBtn) finalizeBtn.disabled = true; } if (stepToClearFrom <= 4 && (selections.outdoorUnit || outdoorUnitSelectionDiv.innerHTML.includes('card'))) { selections.outdoorUnit = null; clearAndResetUIForStep(4); console.log("Cleared: outdoorUnit & UI Step 4"); } if (stepToClearFrom <= 3 && (selections.indoorSeries || indoorSeriesSelectionDiv.innerHTML.includes('item'))) { selections.indoorSeries = null; clearAndResetUIForStep(3); console.log("Cleared: indoorSeries & UI Step 3"); } if (stepToClearFrom <= 2 && (selections.configType || configTypeSelectionDiv.innerHTML.includes('item'))) { selections.configType = null; clearAndResetUIForStep(2); console.log("Cleared: configType & UI Step 2"); } if (stepToClearFrom <= 1 && (selections.brand || brandSelectionDiv.innerHTML.includes('item'))) { selections.brand = null; brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); console.log("Cleared: brand (data only, UI repopulated by populateBrands)"); } if (stepToClearFrom <= TOTAL_LOGICAL_STEPS) { summaryDiv.innerHTML = ''; document.getElementById('summary-main-title')?.classList.remove('print-main-title');} }

    // --- UI Population Functions ---
    function populateBrands() { brandSelectionDiv.innerHTML = ''; console.log("DEBUG: populateBrands called..."); if (!APP_DATA.outdoorUnits?.length) { brandSelectionDiv.innerHTML = '<p>Dati unità esterne non disponibili.</p>'; return; } const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId).filter(id => id && id !== 'sconosciuta'))]; const brandsToShow = APP_DATA.brands.filter(b => uniqueBrandIdsFromUEs.includes(b.id)); if (!brandsToShow.length) { brandSelectionDiv.innerHTML = '<p>Nessuna marca con UEs.</p>'; return; } brandsToShow.forEach(brand => { brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => { if (selections.brand?.id !== selectedBrand.id) { resetSelectionsAndUIFrom(2); selections.brand = selectedBrand; highestLogicalStepCompleted = 1; } populateConfigTypes(); showStep(2); }, selections.brand?.id === brand.id)); }); if (selections.brand && !brandsToShow.some(b => b.id === selections.brand.id)) selections.brand = null; }

    function populateConfigTypes() {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>Scegli marca.</p>'; return; }
        console.log(`DEBUG: populateConfigTypes for Brand: ${selections.brand.id}`);
        const validConfigs = Object.values(APP_DATA.configTypes).filter(ct =>
            APP_DATA.outdoorUnits.some(ue =>
                ue.brandId === selections.brand.id &&
                ue.connections === ct.numUnits
            )
        ).sort((a, b) => a.numUnits - b.numUnits);

        if (!validConfigs.length) { configTypeSelectionDiv.innerHTML = `<p>Nessuna config. per ${selections.brand.name} con un numero esatto di unità collegabili.</p>`; return; }
        validConfigs.forEach(config => { configTypeSelectionDiv.appendChild(createSelectionItem(config, 'config', (selectedConfig) => { if (selections.configType?.id !== selectedConfig.id) { resetSelectionsAndUIFrom(3); selections.configType = selectedConfig; highestLogicalStepCompleted = 2; } populateIndoorSeries(); showStep(3); }, selections.configType?.id === config.id)); });
        if (selections.configType && !validConfigs.some(vc => vc.id === selections.configType.id)) selections.configType = null;
    }

    function populateIndoorSeries() {
        indoorSeriesSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType) { indoorSeriesSelectionDiv.innerHTML = '<p>Scegli Marca & Config.</p>'; return; }
        console.log(`DEBUG: populateIndoorSeries - Brand: ${selections.brand.id}, Config: ${selections.configType.name} (${selections.configType.numUnits} UIs)`);
        const brandId = selections.brand.id;
        const numUnitsRequired = selections.configType.numUnits;

        const candidateUEs = APP_DATA.outdoorUnits.filter(ue =>
            ue.brandId === brandId &&
            ue.connections === numUnitsRequired
        );
        if (!candidateUEs.length) { indoorSeriesSelectionDiv.innerHTML = `<p>Nessuna UE ${brandId} per esattamente ${numUnitsRequired} UI.</p>`; return; }
        console.log(`DEBUG: populateIndoorSeries - Candidate UEs for ${brandId} & ${numUnitsRequired}-exact-split: ${candidateUEs.length}`);

        const compatibleSeriesIdsSet = new Set(candidateUEs.flatMap(ue => ue.compatibleIndoorSeriesIds || []));
        if (compatibleSeriesIdsSet.size === 0) { indoorSeriesSelectionDiv.innerHTML = `<p>UE per ${brandId}/${numUnitsRequired}-split non specificano modelli UI compatibili.</p>`; return; }
        console.log(`DEBUG: populateIndoorSeries - All compatible UI Series IDs from these exact UEs:`, [...compatibleSeriesIdsSet]);

        const validIndoorUnitsForSeriesSelection = APP_DATA.indoorUnits.filter(ui => ui.brandId === brandId && compatibleSeriesIdsSet.has(ui.seriesId));
        console.log(`DEBUG: populateIndoorSeries - Indoor Units matching brand & compatible series IDs: ${validIndoorUnitsForSeriesSelection.length}`);

        const uniqueSeries = []; const seenSeriesIds = new Set();
        validIndoorUnitsForSeriesSelection.forEach(ui => { if (!seenSeriesIds.has(ui.seriesId)) { let img = APP_DATA.uiSeriesImageMapping[ui.seriesId] ? `img/${APP_DATA.uiSeriesImageMapping[ui.seriesId]}.png` : (ui.image || null); uniqueSeries.push({ name: ui.seriesName, id: ui.seriesId, image: img }); seenSeriesIds.add(ui.seriesId); } });
        console.log(`DEBUG: populateIndoorSeries - Unique Series (Models) to show:`, uniqueSeries);

        if (!uniqueSeries.length) { indoorSeriesSelectionDiv.innerHTML = `<p>Nessun Modello UI ${brandId} compatibile.</p>`; return; }
        uniqueSeries.sort((a, b) => a.name.localeCompare(b.name));

        uniqueSeries.forEach(series => {
             indoorSeriesSelectionDiv.appendChild(createSelectionItem(series, 'series', (selectedSeries) => { if (selections.indoorSeries?.id !== selectedSeries.id) { resetSelectionsAndUIFrom(4); selections.indoorSeries = selectedSeries; highestLogicalStepCompleted = 3; } populateOutdoorUnits(); showStep(4); }, selections.indoorSeries?.id === series.id));
         });
        if (selections.indoorSeries && !uniqueSeries.some(s => s.id === selections.indoorSeries.id)) selections.indoorSeries = null;
    }

    function populateOutdoorUnits() {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType || !selections.indoorSeries) {
            outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Marca, Config., Modello.</p>';
            return;
        }
        console.log(`DEBUG: populateOutdoorUnits - Brand: ${selections.brand.id}, Config: ${selections.configType.id}, Modello: ${selections.indoorSeries.id}`);
        const numRequired = selections.configType.numUnits;
        const requiredSeriesId = selections.indoorSeries.id;

        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue =>
            ue.brandId === selections.brand.id &&
            ue.connections === numRequired &&
            Array.isArray(ue.compatibleIndoorSeriesIds) &&
            ue.compatibleIndoorSeriesIds.includes(requiredSeriesId)
        );

        if (!compatibleUEs.length) {
            outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} esattamente per ${numRequired} UI e compatibile con Modello "${selections.indoorSeries.name}".</p>`;
            return;
        }
        console.log(`DEBUG: Found ${compatibleUEs.length} compatible UEs for exact ${numRequired} UI and series ${requiredSeriesId}.`);

        const uniqueUEsToDisplay = [];
        const seenUEKeys = new Set();

        for (const ue of compatibleUEs) {
            const ueKey = `${ue.modelCode}-${ue.kw}-${ue.connections}-${ue.capacityCoolingBTU}-${ue.capacityHeatingBTU}-${ue.price.toFixed(2)}`;
            if (!seenUEKeys.has(ueKey)) {
                seenUEKeys.add(ueKey);
                uniqueUEsToDisplay.push(ue);
            }
        }
        console.log(`DEBUG: After deduplication, ${uniqueUEsToDisplay.length} unique UEs to display.`);

        if (!uniqueUEsToDisplay.length) {
            outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE unica trovata dopo il filtro di de-duplicazione per ${selections.brand.name}.</p>`;
            return;
        }

        uniqueUEsToDisplay.forEach(ue => {
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                if (selections.outdoorUnit?.id !== selectedUE.id) {
                    resetSelectionsAndUIFrom(5);
                    selections.outdoorUnit = selectedUE;
                    highestLogicalStepCompleted = 4;
                }
                populateIndoorUnitSelectors();
                showStep(5);
            }, selections.outdoorUnit?.id === ue.id));
        });

        if (selections.outdoorUnit && !uniqueUEsToDisplay.some(ue => ue.id === selections.outdoorUnit.id)) {
            selections.outdoorUnit = null;
        }
    }

    function populateIndoorUnitSelectors() {
    indoorUnitsSelectionArea.innerHTML = '';
    if (!selections.outdoorUnit || !selections.configType || !selections.brand || !selections.indoorSeries) {
        indoorUnitsSelectionArea.innerHTML = `<p>Completa passaggi.</p>`;
        checkAllIndoorUnitsSelected();
        return;
    }

    const availableIndoorUnitsForSeries = APP_DATA.indoorUnits
        .filter(ui => ui.brandId === selections.brand.id && ui.seriesId === selections.indoorSeries.id)
        .sort((a, b) => a.capacityBTU - b.capacityBTU);

    if (!availableIndoorUnitsForSeries.length) {
        indoorUnitsSelectionArea.innerHTML = `<p>Nessuna variante per ${selections.indoorSeries.name}.</p>`;
        checkAllIndoorUnitsSelected();
        return;
    }

    const uniqueUnitsToDisplay = [];
    const seenKeys = new Set();
    for (const uiVariant of availableIndoorUnitsForSeries) {
        const key = `${uiVariant.modelCode}-${uiVariant.kw}-${uiVariant.capacityBTU}-${uiVariant.price.toFixed(2)}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueUnitsToDisplay.push(uiVariant);
        }
    }

    if (selections.indoorUnits.length !== selections.configType.numUnits || !selections.indoorUnits.every(ui => ui === null || (ui && ui.seriesId === selections.indoorSeries.id))) {
        selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
    }

    for (let i = 0; i < selections.configType.numUnits; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('indoor-unit-slot');

        const label = document.createElement('label');
        label.htmlFor = `indoor-unit-select-${i}`;
        // Sanificazione per label.innerHTML
        const safeIndoorSeriesName = String(selections.indoorSeries.name || '').replace(/`/g, "'");
        label.innerHTML = `Unità ${i + 1} (<strong>Modello: ${safeIndoorSeriesName}</strong>):`;
        slotDiv.appendChild(label);

        const select = document.createElement('select');
        select.id = `indoor-unit-select-${i}`;
        select.dataset.index = i;

        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "-- Seleziona Taglia/Potenza --";
        select.appendChild(placeholder);

        uniqueUnitsToDisplay.forEach(uiVariant => {
            const option = document.createElement('option');
            option.value = uiVariant.id;
            // Sanificazione per option.innerHTML
            const safeModelCodeOpt = String(uiVariant.modelCode || '').replace(/`/g, "'");
            const safeKwOpt = String(uiVariant.kw || '').replace(/`/g, "'");
            const safeBtuOpt = String(uiVariant.capacityBTU || '').replace(/`/g, "'");
            option.innerHTML = `${safeModelCodeOpt} - <strong>${safeKwOpt}kW (${safeBtuOpt} BTU)</strong> - Prezzo: ${uiVariant.price.toFixed(2)}€`;
            if (selections.indoorUnits[i]?.id === uiVariant.id) option.selected = true;
            select.appendChild(option);
        });

        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('unit-details');

        const S = (str) => str != null ? String(str).replace(/`/g, "'") : '';

        const generateDetailsHtml = (unit) => {
            if (!unit) return '';
            let html = `<p>Cod: <strong>${S(unit.modelCode) || 'N/A'}</strong></p>`;
            html += `<p>Pwr: <strong>${S(unit.kw) || 'N/A'}kW (${S(unit.capacityBTU) || 'N/A'} BTU)</strong> - €<strong>${(unit.price || 0).toFixed(2)}</strong></p>`;
            if (unit.dimensions && unit.dimensions !== "N/A") {
                html += `<p>Dimensioni: <strong>${S(unit.dimensions)}</strong></p>`;
            }
            if (unit.weight && unit.weight !== "N/A" && unit.weight !== "N/D") {
                html += `<p>Peso: <strong>${S(unit.weight)} kg</strong></p>`;
            }
            if (unit.image) {
                 html += `<img src="${S(unit.image)}" alt="Immagine ${S(unit.modelCode) || 'UI'}" class="ui-details-img">`;
            }
            return html;
        };

        if (selections.indoorUnits[i]) {
            detailsDiv.innerHTML = generateDetailsHtml(selections.indoorUnits[i]);
        }

        select.addEventListener('change', (e) => {
            const selId = e.target.value;
            const idx = parseInt(e.target.dataset.index);
            const selUI = uniqueUnitsToDisplay.find(u => u.id === selId);
            selections.indoorUnits[idx] = selUI || null;

            detailsDiv.innerHTML = generateDetailsHtml(selUI);
            checkAllIndoorUnitsSelected();
        });

        slotDiv.appendChild(select);
        slotDiv.appendChild(detailsDiv);
        indoorUnitsSelectionArea.appendChild(slotDiv);
    }
    checkAllIndoorUnitsSelected();
}
    function generateSummary() {
        console.log("DEBUG: generateSummary called. Selections:", JSON.parse(JSON.stringify(selections)));
        summaryDiv.innerHTML = '';
        if (!selections.brand || !selections.configType || !selections.indoorSeries || !selections.outdoorUnit ) {
            summaryDiv.innerHTML = "<p>Configurazione incompleta.</p>";
            return;
        }
        if (selections.configType.numUnits > 0 && (selections.indoorUnits.length !== selections.configType.numUnits || selections.indoorUnits.some(ui => !ui))) {
            summaryDiv.innerHTML = "<p>Selezione UI incomplete.</p>";
            return;
        }

        let totalPrice = selections.outdoorUnit.price || 0;
        const valOrNA = (val, suffix = '') => (val !== undefined && val !== null && val !== '' && val !== "Dati mancanti") ? `${String(val).replace(/`/g, "'")}${suffix}` : 'N/A'; // Sanificato
        const priceOrND = (price) => typeof price === 'number' ? price.toFixed(2) + " €" : 'N/D';

        // Sanificazione per i nomi nel riepilogo
        const S_SUMMARY = (str) => str != null ? String(str).replace(/`/g, "'") : '';


        const summaryHTML = `
            <div class="summary-block">
                <h3>Selezione Utente</h3>
                <p><strong>Marca:</strong> ${S_SUMMARY(selections.brand.name)}</p>
                <p><strong>Configurazione:</strong> ${S_SUMMARY(selections.configType.name)} (${selections.configType.numUnits} UI)</p>
                <p><strong>Modello UI:</strong> ${S_SUMMARY(selections.indoorSeries.name)}</p>
            </div>
            <div class="summary-block">
                <h3>Unità Esterna</h3>
                <h4>UNITA' ESTERNA ${selections.outdoorUnit.kw && selections.outdoorUnit.kw !== "N/A" && selections.outdoorUnit.kw !== 0 ? S_SUMMARY(selections.outdoorUnit.kw) + 'kW' : ''}</h4>
                <p><strong>Codice:</strong> ${valOrNA(selections.outdoorUnit.modelCode)}</p>
                <p><strong>Classe Energetica (F/C):</strong> ${valOrNA(selections.outdoorUnit.energyClassCooling)} / ${valOrNA(selections.outdoorUnit.energyClassHeating)}</p>
                <p><strong>Dimensioni:</strong> ${valOrNA(selections.outdoorUnit.dimensions)}</p>
                <p><strong>Peso:</strong> ${valOrNA(selections.outdoorUnit.weight, ' kg')}</p>
                <p class="price-highlight"><strong>Prezzo UE:</strong> ${priceOrND(selections.outdoorUnit.price)} (IVA Escl.)</p>
            </div>
            ${selections.configType.numUnits > 0 ? `
            <div class="summary-block">
                <h3>Unità Interne (Modello ${S_SUMMARY(selections.indoorSeries.name)})</h3>
                ${selections.indoorUnits.map((ui, index) => {
                    if (!ui) return `<div class="summary-indoor-unit error">UI ${index + 1} non selezionata.</div>`;
                    totalPrice += ui.price || 0;
                    return `
                    <div class="summary-indoor-unit" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                        <h4>Unità ${index + 1}: <strong>${S_SUMMARY(ui.seriesName)}</strong></h4>
                        ${ui.image ? `<img src="${S_SUMMARY(ui.image)}" alt="${S_SUMMARY(ui.name)}" class="summary-ui-img" style="float:right; margin-left:10px; object-fit:contain;">` : ''}
                        <p><strong>Codice:</strong> ${valOrNA(ui.modelCode)}</p>
                        <p><strong>Potenza: ${valOrNA(ui.kw, 'kW')} (${valOrNA(ui.capacityBTU, ' BTU')})</strong></p>
                        <p><strong>Tipo:</strong> ${valOrNA(ui.type)}</p>
                        <p><strong>Dimensioni:</strong> ${valOrNA(ui.dimensions)}</p>
                        <p><strong>WiFi:</strong> ${ui.wifi ? 'Sì' : 'No'}</p>
                        <p class="price-highlight"><strong>Prezzo UI:</strong> ${priceOrND(ui.price)} (IVA Escl.)</p>
                        <div style="clear:both;"></div>
                    </div>
                    `;
                }).join('')}
            </div>
            ` : '<div class="summary-block"><p>Nessuna UI richiesta.</p></div>'}
            <div class="summary-total" style="margin-top:20px; padding-top:15px; border-top: 2px solid var(--primary-color);">
                <p style="font-size: 1.2em; font-weight: bold;"><strong>Prezzo Totale:</strong> <span class="total-price-value">${priceOrND(totalPrice)}</span> (IVA Escl.)</p>
            </div>
        `;
        summaryDiv.innerHTML = summaryHTML;
        document.getElementById('summary-main-title')?.classList.add('print-main-title');
        console.log("DEBUG: Riepilogo generato. Prezzo Totale:", totalPrice);
    }

    // --- Navigation Logic ---
    function showStep(logicalStepNumber, fromDirectNavigation = false) { if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) { console.warn("Invalid logical step:", logicalStepNumber); return; } const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber]; if (!htmlContainerId) { console.error("No HTML ID for step:", logicalStepNumber); return; } console.log(`ShowStep: Target=${logicalStepNumber}, DirectNav=${fromDirectNavigation}, Prev CurrHighest=${highestLogicalStepCompleted}, Prev CurrStep=${currentLogicalStep}`); if (!fromDirectNavigation) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); } else { if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1) { const canJumpToSummary = logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted >= (TOTAL_LOGICAL_STEPS - 1); if (!canJumpToSummary) { console.log(`Navigation to step ${logicalStepNumber} blocked by completion rules.`); showStep(highestLogicalStepCompleted + 1 > TOTAL_LOGICAL_STEPS ? 1 : highestLogicalStepCompleted + 1, true); return; } } if (logicalStepNumber <= highestLogicalStepCompleted) { resetSelectionsAndUIFrom(logicalStepNumber + 1); highestLogicalStepCompleted = logicalStepNumber - 1; } } stepsHtmlContainers.forEach(s => s.classList.remove('active-step')); const targetStepEl = document.getElementById(htmlContainerId); if (targetStepEl) { targetStepEl.classList.add('active-step'); } else { console.error(`HTML container '${htmlContainerId}' not found.`); } currentLogicalStep = logicalStepNumber; updateStepIndicator(); window.scrollTo(0, 0); console.log(`ShowStep END: Now currentStep=${currentLogicalStep}, CurrHighest=${highestLogicalStepCompleted}`); }
    function updateStepIndicator() { const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line'); stepIndicatorItems.forEach((item, htmlIndex) => { const itemLogicalStep = htmlIndex + 1; if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { item.style.display = 'none'; if (stepLinesHTML[htmlIndex-1]) stepLinesHTML[htmlIndex-1].style.display = 'none'; return; } item.style.display = ''; item.dataset.step = itemLogicalStep; const nameEl = item.querySelector('.step-name'); if(nameEl) nameEl.textContent = LOGICAL_STEP_NAMES[itemLogicalStep-1] || `Step ${itemLogicalStep}`; item.classList.remove('active', 'completed', 'disabled'); const dot = item.querySelector('.step-dot'); if(dot) { dot.classList.remove('active', 'completed'); dot.textContent = itemLogicalStep; } if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot?.classList.add('completed'); }  else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot?.classList.add('active'); } if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) { item.classList.add('disabled'); } }); stepLinesHTML.forEach((line, htmlLineIndex) => { if (htmlLineIndex >= TOTAL_LOGICAL_STEPS - 1) { line.style.display = 'none'; return; } line.style.display = ''; line.classList.remove('active'); const prevItem = stepIndicatorItems[htmlLineIndex];  const prevItemLogicalStep = parseInt(prevItem?.dataset?.step); if (prevItem && prevItem.style.display !== 'none') { if (prevItem.classList.contains('completed')) { line.classList.add('active'); } else if (currentLogicalStep > prevItemLogicalStep) { line.classList.add('active'); } } }); }
    function checkAllIndoorUnitsSelected() { let allSelected = true; if (selections.configType && selections.configType.numUnits > 0) { allSelected = selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null && ui !== undefined); } if(finalizeBtn) { finalizeBtn.disabled = !allSelected; } if(allSelected && selections.configType?.numUnits > 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); } else if (allSelected && selections.configType?.numUnits === 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); } updateStepIndicator();  }
    function initializeNavigation() {  stepIndicatorItems.forEach(item => { item.addEventListener('click', () => { if (item.classList.contains('disabled') || item.style.display === 'none') return; const targetLogicalStep = parseInt(item.dataset.step); if (isNaN(targetLogicalStep) || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return; console.log(`Indicator click -> Step ${targetLogicalStep}`); if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { const canShowSummary = selections.brand && selections.configType && selections.indoorSeries && selections.outdoorUnit && (!selections.configType.numUnits > 0 || (selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null))); if (!canShowSummary) { alert("Completa passaggi precedenti."); return; } generateSummary(); } showStep(targetLogicalStep, true); }); }); if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { console.log("Finalize button clicked."); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); generateSummary(); showStep(TOTAL_LOGICAL_STEPS); }); } document.querySelectorAll('.prev-btn').forEach(button => { const currentStepElement = button.closest('.config-step'); if (!currentStepElement) return; const currentHtmlId = currentStepElement.id; const currentLogical = HTML_TO_LOGICAL_STEP_MAP[currentHtmlId]; if (currentLogical === undefined || currentLogical === 1) { button.style.display = 'none'; return; } let prevLogicalStep = currentLogical - 1; button.style.display = ''; button.addEventListener('click', () => { console.log(`Prev clicked from ${currentLogical} to ${prevLogicalStep}`); showStep(prevLogicalStep, true); }); }); document.getElementById('reset-config-btn')?.addEventListener('click', () => { console.log("Reset config clicked."); if (!confirm("Sei sicuro?")) return; selections.brand = null; selections.configType = null; selections.indoorSeries = null; selections.outdoorUnit = null; selections.indoorUnits = []; resetSelectionsAndUIFrom(1); populateBrands(); highestLogicalStepCompleted = 0; showStep(1); }); document.getElementById('print-summary-btn')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Vai al Riepilogo (Passaggio 6) prima di stampare."); }); document.getElementById('print-list')?.addEventListener('click', () => { if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) window.print(); else alert("Completa fino al Riepilogo (Passaggio 6)."); }); }
    async function initializeApp() { console.log("DEBUG: initializeApp started (6-Step Flow V2.1)"); document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex'; let brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc; try { console.log("DEBUG: Fetching all Firestore data..."); [ brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc ] = await Promise.all([ fetchFirestoreCollection('brands'), fetchFirestoreCollection('configTypes'), fetchFirestoreCollection('uiSeriesImageMapping'), fetchFirestoreCollection('outdoorUnits'), fetchFirestoreCollection('indoorUnits'), db.collection('metadata').doc('appInfo').get() ]); console.log("DEBUG: Firestore data fetching complete."); processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs); } catch (error) { console.error("CRITICAL ERROR fetching/processing Firestore data:", error); loadingOverlay.innerHTML = `<p style="color:red;">Errore grave caricamento dati.</p>`; return; } stepsHtmlContainers.forEach(el => el.classList.remove('active-step')); document.getElementById('step-1')?.classList.add('active-step'); currentLogicalStep = 1; highestLogicalStepCompleted = 0; updateStepIndicator(); populateBrands(); const brandSelectionContent = brandSelectionDiv.innerHTML.trim(); if (brandSelectionContent.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p'))) { console.warn("INIT WARNING: No brands populated."); if (loadingOverlay.style.display !== 'none') { loadingOverlay.innerHTML = `<p style="color:orange;">Errore: Nessuna marca disponibile.</p>`; } } else { loadingOverlay.style.display = 'none'; } document.getElementById('currentYear').textContent = new Date().getFullYear(); try { if (metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate) { const timestamp = metadataDoc.data().lastDataUpdate; document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }); } else { console.log("DEBUG: metadata/appInfo missing."); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); } } catch(err) { console.warn("Error retrieving metadata:", err); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); } initializeNavigation(); console.log("DEBUG: initializeApp finished."); }

    // --- Global Admin Functions & Auth UI Setup ---
    window.currentUserRole = null;
    let adminBrandsListener = null;
    function escapeHtml (unsafe) { if (typeof unsafe !== 'string') unsafe = String(unsafe); return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/'/g, "'"); };
    function toggleAdminSectionVisibility() { const adminSection = document.getElementById('admin-section'); const isAdminUser = window.currentUserRole === 'admin'; if (adminSection) { adminSection.style.display = isAdminUser ? 'block' : 'none'; if (isAdminUser && !adminBrandsListener) { loadAndDisplayAdminBrands(); setupAdminBrandFormListener(); } else if (!isAdminUser && adminBrandsListener) { if(typeof adminBrandsListener === 'function') adminBrandsListener(); adminBrandsListener = null; const listDiv = document.getElementById('admin-brands-list'); if(listDiv) listDiv.innerHTML = '<p>Accesso admin richiesto.</p>'; } } }
    async function loadAndDisplayAdminBrands() { const listDiv = document.getElementById('admin-brands-list'); if (!listDiv) return; listDiv.innerHTML = '<p>Caricamento marche admin...</p>'; if (adminBrandsListener && typeof adminBrandsListener === 'function') adminBrandsListener(); adminBrandsListener = db.collection("brands").orderBy("name").onSnapshot(snapshot => { if (snapshot.empty) { listDiv.innerHTML = '<p>Nessuna marca trovata.</p>'; return; } let html = '<ul>'; snapshot.forEach(doc => { const brand = { id: doc.id, ...doc.data() }; html += `<li data-id="${brand.id}" style="margin-bottom:5px; padding:5px; border-bottom:1px dotted #eee;"> <img src="${brand.logo || 'img/placeholder.png'}" alt="${brand.name}" style="height:20px; vertical-align:middle; margin-right:5px;"> ${escapeHtml(brand.name)} (ID: ${brand.id}) <button class="btn-admin-edit-brand" data-id="${brand.id}" style="margin-left:10px;font-size:0.8em;">Mod.</button> <button class="btn-admin-delete-brand" data-id="${brand.id}" style="font-size:0.8em;">Elim.</button> </li>`; }); html += '</ul>'; listDiv.innerHTML = html; listDiv.querySelectorAll('.btn-admin-edit-brand').forEach(b => b.addEventListener('click', (e) => handleEditBrand(e.target.dataset.id))); listDiv.querySelectorAll('.btn-admin-delete-brand').forEach(b => b.addEventListener('click', (e) => handleDeleteBrand(e.target.dataset.id))); }, error => { console.error("Errore admin marche: ", error); listDiv.innerHTML = '<p>Errore.</p>'; }); }
    function clearAdminBrandForm() { document.getElementById('brand-doc-id').value = ''; document.getElementById('brand-id').value = ''; document.getElementById('brand-id').disabled = false; document.getElementById('brand-name').value = ''; document.getElementById('brand-logo-path').value = ''; document.getElementById('brand-id').focus(); }
    function setupAdminBrandFormListener() { const form = document.getElementById('admin-brand-form'); const clearBtn = document.getElementById('admin-brand-form-clear'); if(!form) return; form.addEventListener('submit', async (e) => { e.preventDefault(); const docIdForEdit = document.getElementById('brand-doc-id').value; const brandId = document.getElementById('brand-id').value.trim().toLowerCase(); const brandName = document.getElementById('brand-name').value.trim(); const brandLogoPath = document.getElementById('brand-logo-path').value.trim(); if (!brandId || !brandName || !brandLogoPath) { alert("Tutti i campi sono obbligatori."); return; } const brandData = { id: brandId, name: brandName, logo: brandLogoPath }; try { if (docIdForEdit && docIdForEdit !== brandId) { alert("Modifica ID marca non permessa. Elimina e ricrea."); return;} await db.collection("brands").doc(brandId).set(brandData, { merge: true }); alert(`Marca ${docIdForEdit ? 'modificata' : 'aggiunta'}!`); clearAdminBrandForm(); initializeConfiguratorApp(); } catch (error) { console.error("Errore salvataggio marca: ", error); alert("Errore: " + error.message); } }); if (clearBtn) clearBtn.addEventListener('click', clearAdminBrandForm); }
    async function handleEditBrand(brandIdToEdit) { try { const brandDoc = await db.collection("brands").doc(brandIdToEdit).get(); if (brandDoc.exists) { const brand = brandDoc.data(); document.getElementById('brand-doc-id').value = brandDoc.id; document.getElementById('brand-id').value = brand.id; document.getElementById('brand-id').disabled = true; document.getElementById('brand-name').value = brand.name; document.getElementById('brand-logo-path').value = brand.logo; document.getElementById('brand-name').focus(); } else { alert("Marca non trovata."); } } catch (error) { alert("Errore caricamento marca."); } }
    async function handleDeleteBrand(brandIdToDelete) { if (!confirm(`Eliminare marca '${brandIdToDelete}'?`)) return; try { await db.collection("brands").doc(brandIdToDelete).delete(); alert("Marca eliminata!"); initializeConfiguratorApp(); } catch (error) { alert("Errore eliminazione marca."); } }
    function setupAuthUI() { console.log("Setting up Auth UI for Configurator Admin..."); const loginModal = document.getElementById('login-modal-configurator'); const loginForm = document.getElementById('login-form-configurator'); const logoutButton = document.getElementById('logout-button-configurator'); const adminTriggerBtn = document.getElementById('admin-trigger'); const authStatusEl = document.getElementById('auth-status-configurator'); const loginEmailInput = document.getElementById('login-email-configurator'); const loginPasswordInput = document.getElementById('login-password-configurator'); const loginErrorEl = document.getElementById('login-error-configurator'); const closeModalBtn = loginModal ? loginModal.querySelector('.close-btn') : null; const loginModalTitle = document.getElementById('login-modal-title-configurator'); if (adminTriggerBtn) { adminTriggerBtn.addEventListener('click', () => { if (!loginModal) { console.error("Login modal not found!"); return;} if (auth.currentUser) { if (logoutButton) logoutButton.style.display = 'block'; if (loginForm) loginForm.style.display = 'none'; if (loginErrorEl) loginErrorEl.style.display = 'none'; if (loginModalTitle) loginModalTitle.textContent = `Loggato: ${auth.currentUser.email}`; } else { if (logoutButton) logoutButton.style.display = 'none'; if (loginForm) loginForm.style.display = 'block'; if (loginModalTitle) loginModalTitle.textContent = 'Accesso Amministratore'; } loginModal.style.display = 'block'; }); } if (closeModalBtn) { closeModalBtn.addEventListener('click', () => {if(loginModal)loginModal.style.display = 'none'});} if (loginModal) { loginModal.addEventListener('click', (e) => { if(e.target === loginModal) loginModal.style.display = 'none';}); } if (loginForm) { loginForm.addEventListener('submit', (e) => { e.preventDefault(); const email = loginEmailInput.value; const password = loginPasswordInput.value; if (!email || !password) { if(loginErrorEl) {loginErrorEl.textContent = 'Email e Password obbligatori.'; loginErrorEl.style.display = 'block';} return; } if(loginErrorEl) loginErrorEl.style.display = 'none'; auth.signInWithEmailAndPassword(email, password) .then(userCredential => { if(loginModal) loginModal.style.display = 'none'; if(loginPasswordInput) loginPasswordInput.value = ''; }) .catch(error => { if(loginErrorEl) {loginErrorEl.textContent = `Errore: ${error.message}`; loginErrorEl.style.display = 'block';} }); }); } if (logoutButton) { logoutButton.addEventListener('click', () => { auth.signOut().then(() => { if(loginModal)loginModal.style.display = 'none';}); }); } auth.onAuthStateChanged(user => { if (user) { db.collection('users').doc(user.uid).get().then(doc => { window.currentUserRole = doc.exists && doc.data().role ? doc.data().role : 'user'; if (authStatusEl) authStatusEl.textContent = ` (${window.currentUserRole})`; if (adminTriggerBtn) adminTriggerBtn.title = (window.currentUserRole === 'admin' ? `Admin Logout (${user.email.split('@')[0]})` : `Logout (${user.email.split('@')[0]})` ); toggleAdminSectionVisibility(); }).catch(() => { window.currentUserRole = null; toggleAdminSectionVisibility();}); } else { window.currentUserRole = null; if (authStatusEl) authStatusEl.textContent = ''; if (adminTriggerBtn) adminTriggerBtn.title = "Accesso Admin"; toggleAdminSectionVisibility(); } }); }
    async function initializeConfiguratorApp() { console.log("DEBUG: initializeConfiguratorApp called"); document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex'; let brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc; try { console.log("DEBUG: Fetching all Firestore data for configurator..."); [ brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc ] = await Promise.all([ fetchFirestoreCollection('brands'), fetchFirestoreCollection('configTypes'), fetchFirestoreCollection('uiSeriesImageMapping'), fetchFirestoreCollection('outdoorUnits'), fetchFirestoreCollection('indoorUnits'), db.collection('metadata').doc('appInfo').get() ]); console.log("DEBUG: Configurator Firestore data fetching complete."); processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs); } catch (error) { console.error("CRITICAL ERROR fetching/processing configurator data:", error); loadingOverlay.innerHTML = `<p style="color:red;">Errore caricamento dati configuratore.</p>`; return; } stepsHtmlContainers.forEach(el => el.classList.remove('active-step')); document.getElementById('step-1')?.classList.add('active-step'); currentLogicalStep = 1; highestLogicalStepCompleted = 0; updateStepIndicator(); populateBrands(); const brandSelectionContent = brandSelectionDiv.innerHTML.trim(); if (brandSelectionContent.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p'))) { console.warn("INIT WARNING: No brands populated for configurator."); if (loadingOverlay.style.display !== 'none') { loadingOverlay.innerHTML = `<p style="color:orange;">Errore: Nessuna marca configuratore disponibile.</p>`; } } else { if(loadingOverlay.isConnected && loadingOverlay.style.display !== 'none') loadingOverlay.style.display = 'none'; } document.getElementById('currentYear').textContent = new Date().getFullYear(); try { if (metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate) { const timestamp = metadataDoc.data().lastDataUpdate; document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }); } else { console.log("DEBUG: metadata/appInfo (configurator) missing."); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); } } catch(err) { console.warn("Error retrieving configurator metadata:", err); document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT'); } initializeNavigation(); console.log("DEBUG: Configurator app part initialized."); }

    // --- Run Application ---
    setupAuthUI(); // Sets up login modal listeners and onAuthStateChanged
    initializeConfiguratorApp(); // Loads configurator data and sets up its UI

});
// --- END OF SCRIPT.JS ---
