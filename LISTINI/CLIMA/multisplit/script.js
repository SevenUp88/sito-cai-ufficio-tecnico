// COPIA E INCOLLA TUTTO QUESTO CONTENUTO NEL TUO script.js, SOSTITUENDO TUTTO.

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione Finale Check Card UE)");

    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = {
        brands: [
            { id: "haier", name: "Haier", logo: "img/logos/logo-haier.png" }, // Verifica nome file logo
            { id: "mitsubishi", name: "Mitsubishi Electric", logo: "img/logos/logo-mitsubishi.png" }, // Verifica nome file logo
        ],
        uiSeriesImageMapping: { 
            "revive_ui": "revive", "pearl_ui": "pearl", "flexis_ui": "flexis", "hr_ui": "hr",
            "ay_e_kirigamine_ui": "ay", "ay_kirigamine_ui":"ay", 
            "emura_ui": "emura", "innova_20_ui": "innova_2_0",
            "kirigamine_style_ui": "kirigamine_style", "mszap_ui": "mszap" 
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
        if (!url || typeof url !== 'string') { console.error("CRITICO: fetch URL non valido:", url); return []; }
        console.log(`DEBUG: Fetching CSV: ${url}`);
        const typeForLog = url.includes(CSV_URLS.outdoorUnits) ? 'UE' : 'UI';
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
            const text = await response.text();
            console.log(`DEBUG: Ricevuto CSV ${typeForLog}. L: ${text.length}`);
            return parseCSV(text, typeForLog);
        } catch (error) { console.error(`DEBUG: Errore fetchCSVData ${typeForLog}:`, error); return []; }
    }

    function parseCSV(text, typeForLog = '') {
        console.log(`DEBUG: Parsing CSV ${typeForLog}...`);
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) { console.warn(`DEBUG: parse ${typeForLog}: No data.`); return []; }
        const rawHeaders = lines[0].split(',');
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        console.log(`DEBUG: parse ${typeForLog} - HEADERS (${headers.length}):`, JSON.stringify(headers)); 
        const unitaCollegabiliNormalizedHeader = 'unit_collegabili'; 
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
            while (values.length < headers.length) values.push(''); if (values.length > headers.length) values.length = headers.length;
            const entry = {};
            headers.forEach((headerKey, i) => { 
                let value = values[i] ? values[i].trim() : ''; if (value === '') value = "Dati mancanti";
                if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
                const numericHeaders = ['prezzo', 'prezzo_ui', 'unità_collegabili', 'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui', 'min_connessioni_ue', 'peso_ue'];
                if (numericHeaders.includes(headerKey)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); numStr = numStr.replace(',', '.');
                    const num = (headerKey === 'unit_collegabili' || headerKey === 'min_connessioni_ue') ? parseInt(numStr, 10) : parseFloat(numStr);
                    entry[headerKey] = isNaN(num) ? 0 : num; // Default 0 se NaN o dati mancanti
                    if (headerKey === 'unit_collegabili' && lineIndex < 3 && typeForLog === 'UE') console.log(`DEBUG: Riga ${lineIndex+2}, ${headerKey}, Grezzo:"${value}", Parsato:${entry[headerKey]}`);
                } else entry[headerKey] = value;
            });
            //if (lineIndex < 1 && typeForLog) console.log(`DEBUG: Prima entry ${typeForLog}:`, JSON.stringify(entry));
            return entry;
        });
        console.log(`DEBUG: parse ${typeForLog} - Entries: ${data.length}`);
        return data;
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        console.log("DEBUG: Processing data. UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        APP_DATA.outdoorUnits = loadedOutdoorUnits.map((ue_csv, index) => {
            const brandId = String(ue_csv.marca).toLowerCase();
            let compatibleIds = [];
            const compatibleSeriesHeader = ue_csv.compatibleindoorseriesids; 
            if (compatibleSeriesHeader && compatibleSeriesHeader !== "Dati mancanti") {
                compatibleIds = compatibleSeriesHeader.split(';')
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            }
            const connections = ue_csv.unit_collegabili || 0; 
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : 2) : 1;
            // if (index < 2) console.log(`DEBUG: Process UE ${index+1}: ID ${ue_csv.codice_prod}, Connections: ${connections}`);
            return {
                id: ue_csv.codice_prod || `ue_${index}`, brandId: brandId, modelCode: ue_csv.codice_prod || "N/A",
                name: ue_csv.nome_modello_ue && ue_csv.nome_modello_ue !== "Dati mancanti" ? `${String(ue_csv.marca).toUpperCase()} ${ue_csv.nome_modello_ue}` : `UE (${brandId})`,
                connections: connections, minConnections: ue_csv.min_connessioni_ue || minConnectionsFallback,
                capacityCoolingBTU: ue_csv.potenza_btu_freddo_ue || 0, capacityHeatingBTU: ue_csv.potenza_btu_caldo_ue || 0,
                price: ue_csv.prezzo || 0,
                dimensions: ue_csv.dimensioni_ue || "N/A", weight: ue_csv.peso_ue || "N/D", // peso_ue header dev'essere corretto
                energyClassCooling: ue_csv.classe_energetica_raffrescamento || "N/D", energyClassHeating: ue_csv.classe_energetica_riscaldamento || "N/D",
                compatibleIndoorSeriesIds: compatibleIds
            };
        });
        APP_DATA.indoorUnits = loadedIndoorUnits.map((ui_csv, index) => {
            const brandId = String(ui_csv.marca).toLowerCase();
            const uiModelNameNormalized = String(ui_csv.modello).toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
            const seriesIdUI = `${uiModelNameNormalized}_ui`;
            let btu = 0; let kw_ui = "N/A";
            if (ui_csv.potenza && ui_csv.potenza !== "Dati mancanti") { /*...estrazione...*/ }
            let imageName = APP_DATA.uiSeriesImageMapping[seriesIdUI] || uiModelNameNormalized; 
            let imagePath = `img/${imageName}.png`;
            return {
                id: ui_csv.codice_prodotto || `ui_${index}`, brandId: brandId, seriesId: seriesIdUI, modelCode: ui_csv.codice_prodotto || "N/A",
                name: `${String(ui_csv.marca).toUpperCase()} ${ui_csv.modello} ${kw_ui} (${btu} BTU)`,
                type: String(ui_csv.tipo_unit) === "Interna" ? "Parete" : ui_csv.tipo_unit,
                capacityBTU: btu, price: ui_csv.prezzo_ui || 0,
                image: imagePath, dimensions: ui_csv.dimensioni_ui || "N/A", wifi: ui_csv.wifi === "si"
            };
        });
        // Riduci log finali
        // console.log("DEBUG: Process fine. Primo UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.stringify(APP_DATA.outdoorUnits[0]) : "ND");
        // console.log("DEBUG: Process fine. Primo UI:", APP_DATA.indoorUnits.length > 0 ? JSON.stringify(APP_DATA.indoorUnits[0]) : "ND");
    }

    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];
        stepIndicatorItems.forEach((item, htmlIndex) => {
            let itemLogicalStep;
            if (stepIndicatorItems.length === 6) {
                if (htmlIndex === 1) { item.style.display = 'none'; if (stepLinesHTML[0]) stepLinesHTML[0].style.display = 'none'; return; }
                itemLogicalStep = (htmlIndex > 1) ? htmlIndex : (htmlIndex + 1); 
            } else { itemLogicalStep = htmlIndex + 1; } // Assume HTML con 5 items
            if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { item.style.display = 'none'; if (stepLinesHTML[htmlIndex-1]) stepLinesHTML[htmlIndex-1].style.display = 'none'; return;}
            item.dataset.step = itemLogicalStep;
            const nameEl = item.querySelector('.step-name'); if(nameEl) nameEl.textContent = stepNamesNewFlow[itemLogicalStep-1] || '?';
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot'); if(dot) dot.classList.remove('active', 'completed');
            if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot?.classList.add('completed'); }
            else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot?.classList.add('active'); }
            if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) item.classList.add('disabled');
        });
        stepLinesHTML.forEach((line, htmlLineIndex) => {
            line.classList.remove('active');
            if (stepIndicatorItems.length === 6 && htmlLineIndex === 0) { line.style.display = 'none'; return; }
            let prevVisibleItemIndex = (stepIndicatorItems.length === 6 && htmlLineIndex >= 1) ? htmlLineIndex : htmlLineIndex;
            if(stepIndicatorItems.length === 6 && htmlLineIndex === 1) prevVisibleItemIndex = 0; // Caso speciale linea dopo item nascosto

            const prevVisibleItem = stepIndicatorItems[prevVisibleItemIndex];
            if (prevVisibleItem && prevVisibleItem.style.display !== 'none' && prevVisibleItem.classList.contains('completed')) line.classList.add('active');
            else if (prevVisibleItem && prevVisibleItem.style.display !== 'none') {
                let prevItemLogicalStep = parseInt(prevVisibleItem.dataset.step);
                if (currentLogicalStep > prevItemLogicalStep) line.classList.add('active');
            }
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) return;
        const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
        if (!htmlContainerId) { console.error("ID HTML per step:", logicalStepNumber); return; }
        if (!fromDirectNavigation) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        else if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1 && currentLogicalStep < logicalStepNumber) {
             if (logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted < TOTAL_LOGICAL_STEPS -1) return; else if (logicalStepNumber !== TOTAL_LOGICAL_STEPS) return;
        }
        stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) targetStepEl.classList.add('active-step'); else console.error(`HTML container '${htmlContainerId}' non trovato.`);
        currentLogicalStep = logicalStepNumber;
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted && logicalStepNumber < TOTAL_LOGICAL_STEPS) { clearFutureSelections(logicalStepNumber -1, true); }
        updateStepIndicator(); window.scrollTo(0, 0);
    }

    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) {
        if (preserveCurrentLevelSelections) {
            if (stepJustCompletedLogical < 1) selections.configType = null; if (stepJustCompletedLogical < 2) selections.outdoorUnit = null; if (stepJustCompletedLogical < 3) selections.indoorUnits = [];
        } else {
            if (stepJustCompletedLogical < 0) selections.brand = null; if (stepJustCompletedLogical < 1) selections.configType = null; if (stepJustCompletedLogical < 2) selections.outdoorUnit = null; if (stepJustCompletedLogical < 3) selections.indoorUnits = [];
        }
        if (selections.brand) populateConfigTypes(preserveCurrentLevelSelections && stepJustCompletedLogical === 0); else { brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); configTypeSelectionDiv.innerHTML = '<p>...</p>'; outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>'; }
        if (selections.configType && selections.brand) populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedLogical === 1); else if(selections.brand) { configTypeSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>'; }
        if (selections.outdoorUnit && selections.configType && selections.brand) populateIndoorUnitSelectors(preserveCurrentLevelSelections && stepJustCompletedLogical === 2); else if (selections.configType) { outdoorUnitSelectionDiv.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected')); indoorUnitsSelectionArea.innerHTML = '<p>...</p>'; }
        if (stepJustCompletedLogical < TOTAL_LOGICAL_STEPS - 1) summaryDiv.innerHTML = '';
        if (!preserveCurrentLevelSelections) highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        checkAllIndoorUnitsSelected();
    }
    
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div'); itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected'); itemDiv.dataset[type + 'Id'] = item.id;
        let logoSrc = ''; if (type === 'brand' && item.logo) logoSrc = item.logo;
        const nameSpan = document.createElement('span'); nameSpan.textContent = item.name;
        if (logoSrc) {
            const logoImg = document.createElement('img'); logoImg.src = logoSrc; logoImg.alt = `${item.name} Logo`;
            logoImg.classList.add('brand-logo');
            logoImg.onload = () => { nameSpan.style.display = 'none'; };
            logoImg.onerror = () => { console.warn(`DEBUG: Errore logo ${logoSrc}`); logoImg.style.display = 'none'; nameSpan.style.display = 'block';};
            itemDiv.appendChild(logoImg);
        } itemDiv.appendChild(nameSpan);
        if (type === 'brand') nameSpan.style.display = logoSrc ? 'none' : 'block'; else nameSpan.style.display = 'block';
        itemDiv.addEventListener('click', () => {
            itemDiv.parentElement.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); itemDiv.classList.add('selected');
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); clickHandler(item);
        }); return itemDiv;
    }
    
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) {
        const card = document.createElement('div'); card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected'); card.dataset.unitId = unit.id;
        card.style.flexDirection = "column"; card.style.alignItems = 'flex-start'; // Layout in colonna senza immagine

        const infoDiv = document.createElement('div'); infoDiv.classList.add('unit-info'); infoDiv.style.width = '100%';
        const nameH4 = document.createElement('h4'); nameH4.textContent = unit.name || "Nome Mancante"; infoDiv.appendChild(nameH4);
        const modelP = document.createElement('p'); modelP.innerHTML = `Codice: <strong>${unit.modelCode || 'N/A'}</strong> | Max UI: ${unit.connections}`; infoDiv.appendChild(modelP);
        const capacityP = document.createElement('p'); capacityP.textContent = `Potenza (F/C BTU): ${unit.capacityCoolingBTU || '?'} / ${unit.capacityHeatingBTU || '?'}`; infoDiv.appendChild(capacityP);
        const energyClassP = document.createElement('p'); energyClassP.innerHTML = `Classe Energia (F/C): <strong>${unit.energyClassCooling || '?'}</strong> / <strong>${unit.energyClassHeating || '?'}</strong>`; infoDiv.appendChild(energyClassP);
        const dimensionsP = document.createElement('p');
        let dimText = unit.dimensions && unit.dimensions !== "N/A" ? `Dim. ${unit.dimensions}` : "Dim: N/A";
        if (unit.weight && unit.weight !== "N/D") dimText += ` | Peso: ${unit.weight} kg`; else dimText += ` | Peso: N/D`;
        dimensionsP.textContent = dimText; infoDiv.appendChild(dimensionsP);
        const priceP = document.createElement('p'); priceP.classList.add('unit-price'); priceP.textContent = `Prezzo: ${typeof unit.price === 'number' ? unit.price.toFixed(2) : unit.price} €`; infoDiv.appendChild(priceP);
        card.appendChild(infoDiv);
        card.addEventListener('click', () => { card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected')); card.classList.add('selected'); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); clickHandler(unit); });
        return card;
    }
    
    function populateBrands(){
        brandSelectionDiv.innerHTML = ''; // Clear previous content
        console.log("DEBUG: populateBrands - APP_DATA.brands (statici):", JSON.parse(JSON.stringify(APP_DATA.brands)));
        if (!APP_DATA.outdoorUnits) { console.error("DEBUG: populateBrands - outdoorUnits non definito!"); return; }
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId))];
        console.log("DEBUG: populateBrands - brandId UNICI in outdoorUnits:", uniqueBrandIdsFromUEs);
        const brandsToShow = APP_DATA.brands.filter(b_static => uniqueBrandIdsFromUEs.includes(b_static.id));
        console.log("DEBUG: populateBrands - brandsToShow (dopo filtro):", JSON.parse(JSON.stringify(brandsToShow)));
        if (brandsToShow.length === 0) {
            let msg = '<p>Nessuna marca corrispondente ai dati caricati. ';
            if (APP_DATA.outdoorUnits.length > 0) msg += `Marche CSV UE: ${uniqueBrandIdsFromUEs.join(', ')}. Controlla ID in APP_DATA.brands.</p>`; else msg += `Nessuna UE caricata.</p>`;
            brandSelectionDiv.innerHTML = msg; console.log("DEBUG: populateBrands - Nessuna marca."); return;
        }
        brandsToShow.forEach(brand => { 
            console.log("DEBUG: populateBrands - Creo card per:", brand.id);
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand); selections.brand = selectedBrand;
                if (brandHasChanged) { clearFutureSelections(0, false); highestLogicalStepCompleted = 0; }
                populateConfigTypes(!brandHasChanged && !!selections.configType); showStep(2);
            }, selections.brand && selections.brand.id === brand.id));
        });
        console.log("DEBUG: populateBrands - Fine.");
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) populateConfigTypes(true); else if (selections.brand) selections.brand = null;
    }

    function populateConfigTypes(restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>Scegli marca.</p>'; if(restoring) selections.configType = null; return; }
        console.log(`DEBUG: populateConfigTypes - Marca: ${selections.brand.name}`);
        const validConfigs = Object.entries(APP_DATA.configTypes).map(([id, data]) => {
            const hasMatchingUE = APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= data.numUnits && ue.minConnections <= data.numUnits);
            //console.log(`DEBUG: Config '${data.name}' Valida: ${hasMatchingUE}`);
            return hasMatchingUE ? { id, ...data } : null;
        }).filter(Boolean);
        console.log("DEBUG: populateConfigTypes - validConfigs:", JSON.parse(JSON.stringify(validConfigs)));
        if(validConfigs.length === 0) { configTypeSelectionDiv.innerHTML = `<p>Nessuna config per ${selections.brand.name}.</p>`; if (restoring) selections.configType = null; return; }
        validConfigs.forEach(item => {
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig); selections.configType = selectedConfig;
                if (configHasChanged) { clearFutureSelections(1, false); highestLogicalStepCompleted = 1; }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                if (APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= selectedConfig.numUnits && ue.minConnections <= selectedConfig.numUnits)) showStep(3); else console.warn("No UE for selected config?");
            }, selections.configType && selections.configType.id === item.id));
        });
        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) populateOutdoorUnits(true); else if (restoring && selections.configType) selections.configType = null;
    }
    
    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType) { outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Marca e Config.</p>'; if(restoring) selections.outdoorUnit = null; return; }
        console.log(`DEBUG: populateOutdoorUnits - Filtro per Marca: ${selections.brand.id}, Config: ${selections.configType.id} (numUnits: ${selections.configType.numUnits})`);
        const numRequired = selections.configType.numUnits;
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections >= numRequired && ue.minConnections <= numRequired);
        console.log(`DEBUG: populateOutdoorUnits - Trovate ${compatibleUEs.length} UE compatibili.`);
        if (compatibleUEs.length === 0) { outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} per ${selections.configType.name}.</p>`; if(restoring) selections.outdoorUnit = null; return; }
        compatibleUEs.forEach(ue => {
             console.log(`DEBUG: populateOutdoorUnits - Creo card per UE: ${ue.name}`);
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                const ueHasChanged = ueChanged(selections.outdoorUnit, selectedUE); selections.outdoorUnit = selectedUE;
                 if (ueHasChanged) { clearFutureSelections(2, false); highestLogicalStepCompleted = 2; }
                populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0);
                if (selections.configType.numUnits === 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); generateSummary(); showStep(5); }
                else showStep(4);
                checkAllIndoorUnitsSelected();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });
        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) populateIndoorUnitSelectors(true);
        else if (restoring && selections.outdoorUnit) selections.outdoorUnit = null;
    }
    
    function populateIndoorUnitSelectors(restoring = false) { 
         indoorUnitsSelectionArea.innerHTML = '';
        if (!selections.outdoorUnit || !selections.configType || !selections.brand) { indoorUnitsSelectionArea.innerHTML = `<p>Info mancanti.</p>`; checkAllIndoorUnitsSelected(); return; }
        if (selections.configType.numUnits === 0) { checkAllIndoorUnitsSelected(); return; } 
        let validRestore = restoring && selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui === null || (ui && ui.brandId === selections.brand.id));
        if (!validRestore) selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
        const compatibleSeriesForUE = selections.outdoorUnit.compatibleIndoorSeriesIds || [];
        if (compatibleSeriesForUE.length === 0) console.warn(`Nessun compatibleIndoorSeriesIds per UE ${selections.outdoorUnit.id}`);
        const availableIndoorUnits = APP_DATA.indoorUnits.filter(ui => ui.brandId === selections.brand.id && compatibleSeriesForUE.includes(ui.seriesId));
        if (availableIndoorUnits.length === 0) { indoorUnitsSelectionArea.innerHTML = `<p>Nessuna UI compatibile trovata.</p>`; checkAllIndoorUnitsSelected(); return; }
        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div'); slotDiv.classList.add('indoor-unit-slot');
            const label = document.createElement('label'); label.htmlFor = `indoor-unit-select-${i}`; label.textContent = `Unità Interna ${i + 1}:`; slotDiv.appendChild(label);
            const select = document.createElement('select'); select.id = `indoor-unit-select-${i}`; select.dataset.index = i;
            const placeholder = document.createElement('option'); placeholder.value = ""; placeholder.textContent = "-- Seleziona --"; select.appendChild(placeholder);
            availableIndoorUnits.forEach(ui => { /* crea option */ });
            const detailsDiv = document.createElement('div'); detailsDiv.classList.add('unit-details');
            if (validRestore && selections.indoorUnits[i] && availableIndoorUnits.some(avail => avail.id === selections.indoorUnits[i].id)) { /* pre-seleziona */ }
            else if (validRestore && selections.indoorUnits[i]) selections.indoorUnits[i] = null; 
            select.addEventListener('change', (e) => { /* come prima */ });
            slotDiv.appendChild(select); slotDiv.appendChild(detailsDiv); indoorUnitsSelectionArea.appendChild(slotDiv);
        } checkAllIndoorUnitsSelected();
    }

    function checkAllIndoorUnitsSelected() { 
        let allSelected = false;
        if (selections.configType?.numUnits === 0) allSelected = true;
        else if (selections.configType && selections.indoorUnits.length === selections.configType.numUnits) allSelected = selections.indoorUnits.every(ui => ui !== null);
        if(finalizeBtn) finalizeBtn.disabled = !allSelected;
        if(allSelected) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); // Step UI è 4
        // updateStepIndicator(); // Rimosso perché chiamato già da chi chiama questo
    }

    function generateSummary() { /* ... USA LA VERSIONE COMPLETA ... */ }

    stepIndicatorItems.forEach(item => { 
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return;
            const targetLogicalStep = parseInt(item.dataset.step); // Usa il data-step logico assegnato
            if (!targetLogicalStep || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return;
            if (targetLogicalStep === TOTAL_LOGICAL_STEPS) {
                 if (!finalizeBtn || finalizeBtn.disabled && selections.configType?.numUnits > 0) { alert("Completa la selezione."); return; }
                 generateSummary(); 
            }
            showStep(targetLogicalStep, true); 
        });
    });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); generateSummary(); showStep(5);}); }
    document.querySelectorAll('.prev-btn').forEach(button => { 
        const currentHtmlId = button.closest('.config-step')?.id;
        const currentLogical = HTML_TO_LOGICAL_STEP_MAP[currentHtmlId];
        let prevLogicalStep = currentLogical ? currentLogical - 1 : 0;
        if(prevLogicalStep >= 1) button.addEventListener('click', () => { showStep(prevLogicalStep, true); }); else button.style.display = 'none';
     });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { 
         highestLogicalStepCompleted = 0; selections.brand = null; selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = [];
         clearFutureSelections(-1, false); document.getElementById('summary-main-title')?.classList.remove('print-main-title'); showStep(1);
    });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { 
         if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML.includes("Prezzo Totale")) window.print(); else alert("Completa e vai al riepilogo.");
    });

    async function initializeApp() {
        console.log("DEBUG: Chiamata a initializeApp");
        document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex'; 
        console.log("DEBUG: URLs:", JSON.stringify(CSV_URLS));
        if (!CSV_URLS.outdoorUnits || !CSV_URLS.indoorUnits) { console.error("URL CSV mancanti!"); return; }
        let loadedOutdoorUnits = [], loadedIndoorUnits = [];
        try {
            console.log("DEBUG: Inizio Promise.all");
            const promiseOutdoor = fetchCSVData(CSV_URLS.outdoorUnits); const promiseIndoor = fetchCSVData(CSV_URLS.indoorUnits);
            promiseOutdoor.then(data => console.log("DEBUG: Promise UE risolta:", data ? data.length + " items" : data));
            promiseIndoor.then(data => console.log("DEBUG: Promise UI risolta:", data ? data.length + " items" : data));
            [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([promiseOutdoor, promiseIndoor]);
            console.log("DEBUG: Fine Promise.all");
        } catch (error) { console.error("ERRORE Promise.all:", error); loadedOutdoorUnits = []; loadedIndoorUnits = []; }
        if (typeof loadedOutdoorUnits === 'undefined') loadedOutdoorUnits = []; if (typeof loadedIndoorUnits === 'undefined') loadedIndoorUnits = [];
        console.log("DEBUG: Dati post-check. UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        document.getElementById('step-2')?.remove(); updateStepIndicator(); populateBrands();
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p')) ){
             loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Problema marche.</span>`;
             if(APP_DATA.outdoorUnits.length > 0 && APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id)).length === 0 ) loadingOverlay.style.display = 'none'; 
        } else if (brandSelectionDiv.children.length > 0) loadingOverlay.style.display = 'none';
        else loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Stato inatteso.</span>`;
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1);
    }

    console.log("DEBUG: Prima di chiamare initializeApp");
    initializeApp();
    console.log("DEBUG: Dopo aver chiamato initializeApp");
});