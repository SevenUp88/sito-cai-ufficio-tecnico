document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione Completa Definitiva)");

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
        if (!url || typeof url !== 'string') {
            console.error("DEBUG CRITICO: fetchCSVData chiamata con URL non valido o undefined:", url);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore interno: URL CSV non valido per fetch.</span>`;
            return [];
        }
        console.log(`DEBUG: Chiamata a fetchCSVData per ${url}`);
        const typeForLog = url.includes(CSV_URLS.outdoorUnits) ? 'UE' : (url.includes(CSV_URLS.indoorUnits) ? 'UI' : 'Sconosciuto');
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) {
                console.error(`HTTP error ${response.status} for ${url} (${typeForLog})`);
                throw new Error(`HTTP error ${response.status} for ${url}`);
            }
            const text = await response.text();
            console.log(`DEBUG: Testo CSV ricevuto per ${typeForLog}. Lunghezza: ${text.length}`);
            return parseCSV(text, typeForLog);
        } catch (error) {
            console.error(`DEBUG: Errore in fetchCSVData per ${typeForLog} (${url}):`, error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore fetch (JS): ${typeForLog}.</span>`;
            return [];
        }
    }

    function parseCSV(text, typeForLog = '') {
    console.log(`DEBUG: Parsing CSV text for ${typeForLog}...`);
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) { console.warn(`DEBUG: parseCSV ${typeForLog}: No data.`); return []; }
    const rawHeaders = lines[0].split(',');
    const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
    console.log(`DEBUG: parseCSV ${typeForLog} - Headers (count: ${headers.length}):`, headers);
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
        if (values.length > headers.length) {
            console.warn(`DEBUG: parseCSV ${typeForLog} - Linea ${lineIndex + 2}: Valori (${values.length}) > Headers (${headers.length}). Tronco.`);
            values.length = headers.length;
        }
        const entry = {};
        headers.forEach((header, i) => {
            let value = values[i] ? values[i].trim() : '';
            if (value === '') value = "Dati mancanti";
            if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
            
            // LOG VALORE ORIGINALE PER 'unità_collegabili'
            if (typeForLog === 'UE' && header === 'unità_collegabili' && lineIndex < 5) { // Log per le prime 5 righe UE
                console.log(`DEBUG: parseCSV UE - Riga ${lineIndex + 2}, Header '${header}', Valore GREZZO: "${value}"`);
            }

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
                // LOG RISULTATO PARSING PER 'unità_collegabili'
                if (typeForLog === 'UE' && header === 'unità_collegabili' && lineIndex < 5) {
                     console.log(`DEBUG: parseCSV UE - Riga ${lineIndex + 2}, Header '${header}', Valore PARSATO: ${entry[header]}`);
                }
            } else {
                entry[header] = value;
            }
        });
        if (lineIndex < 1 && typeForLog) console.log(`DEBUG: parseCSV ${typeForLog} - Prima entry (oggetto completo):`, JSON.parse(JSON.stringify(entry)));
        return entry;
    });
    console.log(`DEBUG: parseCSV ${typeForLog} - Totale entries: ${data.length}`);
    return data;
}
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        console.log("DEBUG: Chiamata a processLoadedData. UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        APP_DATA.outdoorUnits = loadedOutdoorUnits.map(ue_csv => {
            const brandId = String(ue_csv.marca).toLowerCase();
            let compatibleIds = [];
            if (ue_csv.unità_collega_compatibili && ue_csv.unità_collega_compatibili !== "Dati mancanti") {
                compatibleIds = ue_csv.unità_collega_compatibili.split(';')
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            }
            const connections = parseInt(ue_csv.unità_collegabili) || 0;
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : 2) : 1;
            return {
                id: ue_csv.codice_prod || `ue_csv_${Math.random().toString(36).substr(2, 9)}`,
                brandId: brandId, modelCode: ue_csv.codice_prod || "Dati mancanti",
                name: ue_csv.nome_modello_ue && ue_csv.nome_modello_ue !== "Dati mancanti" ? `${String(ue_csv.marca).toUpperCase()} ${ue_csv.nome_modello_ue}` : `UE (${brandId} - ${ue_csv.codice_prod || 'N/D'})`,
                connections: connections,
                minConnections: parseInt(ue_csv.min_connessioni_ue) || minConnectionsFallback,
                capacityCoolingBTU: parseInt(ue_csv.potenza_btu_freddo_ue) || 0,
                capacityHeatingBTU: parseInt(ue_csv.potenza_btu_caldo_ue) || 0,
                price: ue_csv.prezzo || 0,
                image: ue_csv.percorso_immagine_ue && ue_csv.percorso_immagine_ue !== "Dati mancanti" ? ue_csv.percorso_immagine_ue : 'img/ue_placeholder.png',
                dimensions: ue_csv.dimensioni_peso_ue || "Dati mancanti",
                compatibleIndoorSeriesIds: compatibleIds
            };
        });
        APP_DATA.indoorUnits = loadedIndoorUnits.map(ui_csv => {
            const brandId = String(ui_csv.marca).toLowerCase();
            const uiModelNameNormalized = String(ui_csv.modello).toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
            const seriesIdUI = `${uiModelNameNormalized}_ui`;
            let btu = 0; let kw_ui = "N/D";
            if (ui_csv.potenza && ui_csv.potenza !== "Dati mancanti") {
                const btuMatch = String(ui_csv.potenza).match(/(\d{1,3}(?:\.?\d{3})*)\s*BTU/i);
                if (btuMatch) btu = parseInt(String(btuMatch[1]).replace(/\./g,''));
                const kwMatch = String(ui_csv.potenza).match(/([\d,]+)\s*kW/i);
                if(kwMatch) kw_ui = kwMatch[1];
            }
            let imageName = APP_DATA.uiSeriesImageMapping[seriesIdUI] || uiModelNameNormalized;
            return {
                id: ui_csv.codice_prod_ui || `ui_csv_${Math.random().toString(36).substr(2, 9)}`,
                brandId: brandId, seriesId: seriesIdUI, modelCode: ui_csv.codice_prod_ui || "Dati mancanti",
                name: `${String(ui_csv.marca).toUpperCase()} ${ui_csv.modello} ${kw_ui} (${btu} BTU)`,
                type: String(ui_csv.tipo_unità) === "Interna" ? "Parete" : ui_csv.tipo_unità,
                capacityBTU: btu, price: ui_csv.prezzo_ui || 0,
                image: ui_csv.percorso_immagine_ui && ui_csv.percorso_immagine_ui !== "Dati mancanti" ? ui_csv.percorso_immagine_ui : `img/${imageName}.png`,
                dimensions: ui_csv.dimensioni_peso_ui || "Dati mancanti",
                wifi: ui_csv.wifi === "si"
            };
        });
        console.log("DEBUG: processLoadedData - Fine. outdoorUnits:", APP_DATA.outdoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.outdoorUnits.slice(0,1))) : "Nessuna UE");
        console.log("DEBUG: processLoadedData - Fine. indoorUnits:", APP_DATA.indoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.indoorUnits.slice(0,1))) : "Nessuna UI");
    }

    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];

        stepIndicatorItems.forEach((item, htmlIndex) => {
            let itemLogicalStep = parseInt(item.dataset.step);
            if (stepIndicatorItems.length === 6) { // Gestione HTML con 6 items
                if (htmlIndex === 1) { item.style.display = 'none'; if (stepLinesHTML[0]) stepLinesHTML[0].style.display = 'none'; return; }
                itemLogicalStep = (htmlIndex > 1) ? htmlIndex : (htmlIndex + 1);
                item.dataset.step = itemLogicalStep;
            }
             if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { item.style.display = 'none'; if (stepLinesHTML[htmlIndex -1] && htmlIndex > 0) stepLinesHTML[htmlIndex-1].style.display = 'none'; return; }

            const nameEl = item.querySelector('.step-name');
            if (nameEl && stepNamesNewFlow[itemLogicalStep - 1]) nameEl.textContent = stepNamesNewFlow[itemLogicalStep - 1];
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot');
            dot.classList.remove('active', 'completed');
            if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot.classList.add('completed'); }
            else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot.classList.add('active'); }
            if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) item.classList.add('disabled');
        });

        stepLinesHTML.forEach((line, htmlLineIndex) => {
            line.classList.remove('active');
            if (stepIndicatorItems.length === 6 && htmlLineIndex === 0) { line.style.display = 'none'; return; }
            let prevVisibleItem;
            if (stepIndicatorItems.length === 6) {
                 if(htmlLineIndex === 1) prevVisibleItem = stepIndicatorItems[0];
                 else if (htmlLineIndex > 1) prevVisibleItem = stepIndicatorItems[htmlLineIndex];
            } else prevVisibleItem = stepIndicatorItems[htmlLineIndex];
            if (prevVisibleItem && prevVisibleItem.style.display !== 'none' && prevVisibleItem.classList.contains('completed')) line.classList.add('active');
            else if (prevVisibleItem && prevVisibleItem.style.display !== 'none') {
                let prevItemLogicalStep = parseInt(prevVisibleItem.dataset.step);
                if (currentLogicalStep > prevItemLogicalStep) line.classList.add('active');
            }
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) { console.warn("ShowStep: Step logico non valido:", logicalStepNumber); return; }
        const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
        if (!htmlContainerId) { console.error("ID HTML non trovato per step:", logicalStepNumber); return; }
        if (!fromDirectNavigation) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        else if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1 && currentLogicalStep < logicalStepNumber) {
            if (logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted < (TOTAL_LOGICAL_STEPS - 1) ) return;
            else if (logicalStepNumber !== TOTAL_LOGICAL_STEPS) return;
        }
        stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) targetStepEl.classList.add('active-step');
        else console.error(`Contenitore HTML '${htmlContainerId}' non trovato.`);
        currentLogicalStep = logicalStepNumber;
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted && logicalStepNumber < TOTAL_LOGICAL_STEPS) {
             clearFutureSelections(logicalStepNumber -1, true);
        }
        updateStepIndicator(); window.scrollTo(0, 0);
    }

    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) {
        if (preserveCurrentLevelSelections) {
            if (stepJustCompletedLogical < 1) selections.configType = null;
            if (stepJustCompletedLogical < 2) selections.outdoorUnit = null;
            if (stepJustCompletedLogical < 3) selections.indoorUnits = [];
        } else {
            if (stepJustCompletedLogical < 0) selections.brand = null;
            if (stepJustCompletedLogical < 1) selections.configType = null;
            if (stepJustCompletedLogical < 2) selections.outdoorUnit = null;
            if (stepJustCompletedLogical < 3) selections.indoorUnits = [];
        }
        if (selections.brand) populateConfigTypes(preserveCurrentLevelSelections && stepJustCompletedLogical === 0);
        else {
            brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            configTypeSelectionDiv.innerHTML = '<p>Scegli Marca.</p>';
            outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>';
        }
        if (selections.configType && selections.brand) populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedLogical === 1);
        else if(selections.brand) {
            configTypeSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Config.</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>';
        }
        if (selections.outdoorUnit && selections.configType && selections.brand) populateIndoorUnitSelectors(preserveCurrentLevelSelections && stepJustCompletedLogical === 2);
        else if (selections.configType) {
            outdoorUnitSelectionDiv.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
            indoorUnitsSelectionArea.innerHTML = '<p>Scegli Unità Esterna.</p>';
        }
        if (stepJustCompletedLogical < TOTAL_LOGICAL_STEPS - 1) summaryDiv.innerHTML = '';
        if (!preserveCurrentLevelSelections) highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        checkAllIndoorUnitsSelected();
    }
    
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected');
        itemDiv.dataset[type + 'Id'] = item.id;
        let logoSrc = '';
        if (type === 'brand' && item.logo) logoSrc = item.logo;
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;
        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc; logoImg.alt = `${item.name} Logo`;
            logoImg.classList.add('brand-logo');
            logoImg.onload = () => { nameSpan.style.display = 'none'; };
            logoImg.onerror = () => { logoImg.style.display = 'none'; nameSpan.style.display = 'block';};
            itemDiv.appendChild(logoImg);
        }
        itemDiv.appendChild(nameSpan);
        if (type === 'brand') nameSpan.style.display = logoSrc ? 'none' : 'block';
        else nameSpan.style.display = 'block';
        itemDiv.addEventListener('click', () => {
            itemDiv.parentElement.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            itemDiv.classList.add('selected');
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep);
            clickHandler(item);
        });
        return itemDiv;
    }
    
    function createUnitSelectionCard(unit, clickHandler, isSelected = false) {
        const card = document.createElement('div'); card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected'); card.dataset.unitId = unit.id;
        const img = document.createElement('img'); img.src = unit.image || 'img/ue_placeholder.png'; img.alt = unit.name;
        img.classList.add('unit-image'); img.onerror = () => { img.src = 'img/ue_placeholder.png'; }; card.appendChild(img);
        const infoDiv = document.createElement('div'); infoDiv.classList.add('unit-info');
        const nameH4 = document.createElement('h4'); nameH4.textContent = unit.name; infoDiv.appendChild(nameH4);
        const modelP = document.createElement('p'); modelP.innerHTML = `Modello: <strong>${unit.modelCode}</strong> | Max UI: ${unit.connections}`; infoDiv.appendChild(modelP);
        const capacityP = document.createElement('p'); capacityP.textContent = `Freddo: ${unit.capacityCoolingBTU} BTU | Caldo: ${unit.capacityHeatingBTU} BTU`; infoDiv.appendChild(capacityP);
        const priceP = document.createElement('p'); priceP.classList.add('unit-price');
        priceP.textContent = `Prezzo: ${typeof unit.price === 'number' ? unit.price.toFixed(2) : unit.price} €`; infoDiv.appendChild(priceP);
        card.appendChild(infoDiv);
        card.addEventListener('click', () => {
            card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep);
            clickHandler(unit);
        });
        return card;
    }
    
    function populateBrands(){
        brandSelectionDiv.innerHTML = '';
        console.log("DEBUG: populateBrands - APP_DATA.brands (statici):", JSON.parse(JSON.stringify(APP_DATA.brands)));
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId))];
        console.log("DEBUG: populateBrands - brandId UNICI in APP_DATA.outdoorUnits:", uniqueBrandIdsFromUEs);
        const brandsToShow = APP_DATA.brands.filter(b_static => APP_DATA.outdoorUnits.some(ue_csv => ue_csv.brandId === b_static.id));
        console.log("DEBUG: populateBrands - brandsToShow (dopo filtro):", JSON.parse(JSON.stringify(brandsToShow)));
        if (brandsToShow.length === 0) {
            let msg = '<p>Nessuna marca con unità esterne disponibili trovata. ';
            if (APP_DATA.outdoorUnits.length > 0 && uniqueBrandIdsFromUEs.length > 0) msg += `Marche CSV UE: ${uniqueBrandIdsFromUEs.join(', ')}. Controlla 'id' in APP_DATA.brands. </p>`;
            else if (APP_DATA.outdoorUnits.length === 0) msg += `Nessuna UE caricata dai CSV.</p>`;
            else msg += `Controllare i dati.</p>`;
            brandSelectionDiv.innerHTML = msg; console.log("DEBUG: populateBrands - Nessuna marca da mostrare."); return;
        }
        brandsToShow.forEach(brand => { 
            console.log("DEBUG: populateBrands - Creazione card per:", brand.id);
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand);
                selections.brand = selectedBrand;
                if (brandHasChanged) { clearFutureSelections(0, false); highestLogicalStepCompleted = 0; }
                populateConfigTypes(!brandHasChanged && !!selections.configType);
                showStep(2); // Vai a Config
            }, selections.brand && selections.brand.id === brand.id));
        });
        console.log("DEBUG: populateBrands - Fine. Marche popolate.");
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) populateConfigTypes(true);
        else if (selections.brand) selections.brand = null;
    }

            function populateConfigTypes(restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) {
            configTypeSelectionDiv.innerHTML = '<p>Errore: Marca non selezionata per popolare le configurazioni.</p>';
            if (restoring) selections.configType = null;
            return;
        }
        console.log(`DEBUG: populateConfigTypes - Marca selezionata: ${selections.brand.name} (ID: ${selections.brand.id})`);
        console.log("DEBUG: populateConfigTypes - APP_DATA.configTypes disponibili (statici):", JSON.parse(JSON.stringify(APP_DATA.configTypes)));
        console.log("DEBUG: populateConfigTypes - Numero totale di UE caricate:", APP_DATA.outdoorUnits.length);

        const outdoorUnitsForSelectedBrand = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id);
        console.log(`DEBUG: populateConfigTypes - Unità Esterne trovate per ${selections.brand.name}:`, outdoorUnitsForSelectedBrand.length);
        if (outdoorUnitsForSelectedBrand.length > 0) {
             console.log("DEBUG: populateConfigTypes - Esempio prima UE per questa marca:", JSON.parse(JSON.stringify(outdoorUnitsForSelectedBrand[0])));
        }

        const validConfigs = Object.entries(APP_DATA.configTypes).map(([id, data]) => {
            console.log(`DEBUG: populateConfigTypes - Valutazione per config '${data.name}' (numUnits: ${data.numUnits})`);
            const matchingUEs = APP_DATA.outdoorUnits.filter(ue => { // ERRORE ERA QUI: PARENTESI MANCANTE PER .filter(...)
                const brandMatch = ue.brandId === selections.brand.id;
                const connectionsMatch = ue.connections >= data.numUnits;
                const minConnectionsMatch = ue.minConnections <= data.numUnits;
                
                if (brandMatch) { // Log per ogni UE della marca giusta
                     console.log(`  -> Check UE: ${ue.name || ue.id}, marcaOK: ${brandMatch}, UE conn: ${ue.connections} (req: >=${data.numUnits} -> ${connectionsMatch}), UE minConn: ${ue.minConnections} (req: <=${data.numUnits} -> ${minConnectionsMatch})`);
                }
                return brandMatch && connectionsMatch && minConnectionsMatch;
            }); // PARENTESI CHIUSA PER .filter

            if (matchingUEs.length > 0) {
                console.log(`DEBUG: populateConfigTypes - Config '${data.name}' È VALIDA (trovate ${matchingUEs.length} UE compatibili)`);
                return { id, ...data }; // Ritornare l'oggetto config completo
            } else {
                console.log(`DEBUG: populateConfigTypes - Config '${data.name}' NON È VALIDA (0 UE compatibili)`);
                return null; // Ritornare null se non valida
            }
        }).filter(Boolean); // Rimuove i null

        console.log("DEBUG: populateConfigTypes - validConfigs (dopo filtro):", JSON.parse(JSON.stringify(validConfigs)));

        if (validConfigs.length === 0) {
            configTypeSelectionDiv.innerHTML = `<p>Nessuna configurazione (Dual, Trial, ecc.) compatibile trovata per le unità esterne ${selections.brand.name} caricate.</p>`;
            if (APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id).length === 0) {
                 configTypeSelectionDiv.innerHTML += `<p>Nota: Non ci sono unità esterne per la marca ${selections.brand.name} nei dati caricati.</p>`;
            }
            if (restoring) selections.configType = null;
            return;
        }

        validConfigs.forEach(item => {
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig);
                selections.configType = selectedConfig;
                if (configHasChanged) { clearFutureSelections(1, false); highestLogicalStepCompleted = 1; }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                const UEsForThisConfig = APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= selectedConfig.numUnits && ue.minConnections <= selectedConfig.numUnits);
                if (UEsForThisConfig) {
                    showStep(3); 
                } else {
                     console.warn("Nessuna UE trovata per la config selezionata, non si dovrebbe arrivare qui.")
                }
            }, selections.configType && selections.configType.id === item.id));
        });

        if (restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) {
            populateOutdoorUnits(true);
        } else if (restoring && selections.configType) {
            selections.configType = null;
        }
    }

    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType) { outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Marca e Config.</p>'; if(restoring) selections.outdoorUnit = null; return; }
        const numRequiredConnections = selections.configType.numUnits;
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections >= numRequiredConnections && ue.minConnections <= numRequiredConnections);
        if (compatibleUEs.length === 0) {
            outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} per ${selections.configType.name}.</p>`; if(restoring) selections.outdoorUnit = null; return;
        }
        compatibleUEs.forEach(ue => {
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                const ueHasChanged = ueChanged(selections.outdoorUnit, selectedUE); selections.outdoorUnit = selectedUE;
                 if (ueHasChanged) { clearFutureSelections(2, false); highestLogicalStepCompleted = 2; }
                populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0);
                if (selections.configType.numUnits === 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); generateSummary(); showStep(5); } // Vai a Riepilogo
                else showStep(4); // Vai a UI
                checkAllIndoorUnitsSelected();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });
        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) populateIndoorUnitSelectors(true);
        else if (restoring && selections.outdoorUnit) selections.outdoorUnit = null;
    }
    
    function populateIndoorUnitSelectors(restoring = false) {
        indoorUnitsSelectionArea.innerHTML = '';
        if (!selections.outdoorUnit || !selections.configType || !selections.brand) {
            indoorUnitsSelectionArea.innerHTML = `<p>Info mancanti.</p>`; checkAllIndoorUnitsSelected(); return;
        }
        if (selections.configType.numUnits === 0) { checkAllIndoorUnitsSelected(); return; }
        let indoorUnitsAreValidForRestore = restoring && selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui === null || (ui && ui.brandId === selections.brand.id));
        if (!indoorUnitsAreValidForRestore) selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
        const compatibleIndoorSeriesIdsForUE = selections.outdoorUnit.compatibleIndoorSeriesIds || [];
        const availableIndoorUnits = APP_DATA.indoorUnits.filter(ui => ui.brandId === selections.brand.id && compatibleIndoorSeriesIdsForUE.includes(ui.seriesId));
        if (availableIndoorUnits.length === 0 && selections.configType.numUnits > 0) {
            indoorUnitsSelectionArea.innerHTML = `<p>Nessuna UI compatibile.</p>`; checkAllIndoorUnitsSelected(); return;
        }
        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div'); slotDiv.classList.add('indoor-unit-slot');
            const label = document.createElement('label'); label.htmlFor = `indoor-unit-select-${i}`; label.textContent = `Unità Interna ${i + 1}:`; slotDiv.appendChild(label);
            const select = document.createElement('select'); select.id = `indoor-unit-select-${i}`; select.dataset.index = i;
            const placeholderOption = document.createElement('option'); placeholderOption.value = ""; placeholderOption.textContent = "-- Seleziona UI --"; select.appendChild(placeholderOption);
            availableIndoorUnits.forEach(ui => {
                const option = document.createElement('option'); option.value = ui.id;
                option.textContent = `${ui.name} (${ui.capacityBTU} BTU) - ${typeof ui.price === 'number' ? ui.price.toFixed(2) : ui.price} €`; select.appendChild(option);
            });
            const detailsDiv = document.createElement('div'); detailsDiv.classList.add('unit-details');
            if (indoorUnitsAreValidForRestore && selections.indoorUnits[i]) {
                const isStillAvailable = availableIndoorUnits.some(avail_ui => avail_ui.id === selections.indoorUnits[i].id);
                if (isStillAvailable) {
                    select.value = selections.indoorUnits[i].id;
                    detailsDiv.textContent = `Modello: ${selections.indoorUnits[i].modelCode}, Tipo: ${selections.indoorUnits[i].type}, Dimensioni: ${selections.indoorUnits[i].dimensions}`;
                } else selections.indoorUnits[i] = null; 
            }
            select.addEventListener('change', (e) => {
                const selectedId = e.target.value; const unitIndex = parseInt(e.target.dataset.index);
                if (selectedId) {
                    const selectedUI = APP_DATA.indoorUnits.find(ui => ui.id === selectedId); selections.indoorUnits[unitIndex] = selectedUI;
                    detailsDiv.textContent = `Modello: ${selectedUI.modelCode}, Tipo: ${selectedUI.type}, Dim: ${selectedUI.dimensions}`;
                } else { selections.indoorUnits[unitIndex] = null; detailsDiv.textContent = ''; }
                checkAllIndoorUnitsSelected();
            });
            slotDiv.appendChild(select); slotDiv.appendChild(detailsDiv); indoorUnitsSelectionArea.appendChild(slotDiv);
        }
        checkAllIndoorUnitsSelected();
    }

    function checkAllIndoorUnitsSelected() {
        let allSelected = false;
        if (selections.configType && selections.configType.numUnits === 0) allSelected = true;
        else if (selections.configType && selections.indoorUnits.length === selections.configType.numUnits) {
            allSelected = selections.indoorUnits.every(ui => ui !== null);
        }
        if(finalizeBtn) finalizeBtn.disabled = !allSelected;
        if(allSelected) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep);
        updateStepIndicator();
    }

    function generateSummary() {
        summaryDiv.innerHTML = ''; 
        let totalPrice = 0;
        const { brand, configType, outdoorUnit, indoorUnits } = selections; // series rimosso da qui perché non è una selezione esplicita
        const allIndoorUnitsSelected = configType && indoorUnits.length === configType.numUnits && indoorUnits.every(ui => ui !== null);
        const zeroIndoorUnitsRequired = configType && configType.numUnits === 0;
        if (!brand || !configType || !outdoorUnit || (!allIndoorUnitsSelected && !zeroIndoorUnitsRequired) ) {
            summaryDiv.innerHTML = '<p>Configurazione incompleta.</p>'; return;
        }
        const brandLogoPrint = document.createElement('img'); brandLogoPrint.src = brand.logo || `img/logos/${brand.id}.png`; // Usa brand.logo se definito
        brandLogoPrint.alt = `${brand.name} Logo`; brandLogoPrint.classList.add('brand-logo-print'); 
        brandLogoPrint.onerror = function() { this.style.display = 'none'; }; summaryDiv.appendChild(brandLogoPrint);
        // Nome Serie UE non è più una selezione, potremmo mostrare il nome dell'UE selezionata
        let summaryHTML = `
            <h3>Configurazione Scelta</h3>
            <div class="summary-item"><strong>Marca:</strong> ${brand.name}</div>
            <div class="summary-item"><strong>Tipo Configurazione:</strong> ${configType.name}</div>
            <hr>
            <h3>Unità Esterna Selezionata</h3>
            <div class="summary-item"><strong>Nome:</strong> ${outdoorUnit.name}</div>
            <div class="summary-item"><strong>Modello:</strong> ${outdoorUnit.modelCode}</div>
            <div class="summary-item"><strong>Capacità (F/C):</strong> ${outdoorUnit.capacityCoolingBTU} BTU / ${outdoorUnit.capacityHeatingBTU} BTU</div>
            <div class="summary-item"><strong>Dimensioni:</strong> ${outdoorUnit.dimensions}</div>
            <div class="summary-item"><strong>Prezzo UE:</strong> ${typeof outdoorUnit.price === 'number' ? outdoorUnit.price.toFixed(2) : outdoorUnit.price} €</div>`;
        totalPrice += (typeof outdoorUnit.price === 'number' ? outdoorUnit.price : 0);
        if (configType.numUnits > 0 && allIndoorUnitsSelected) {
            summaryHTML += `<hr><h3>Unità Interne Selezionate (${indoorUnits.length})</h3><ul class="summary-indoor-unit-list">`;
            indoorUnits.forEach((ui, index) => {
                 const imageNameUI = APP_DATA.uiSeriesImageMapping[ui.seriesId] || ui.seriesId.replace('_ui','');
                summaryHTML += `<li>
                    <img src="${ui.image && ui.image !== "Dati mancanti" && !ui.image.endsWith("undefined.png") ? ui.image : `img/${imageNameUI}.png`}" alt="${ui.name}" onerror="this.style.display='none';">
                    <div class="ui-details-container">
                        <strong>UI ${index + 1}:</strong> ${ui.name} (Mod: ${ui.modelCode}) <br>
                        Tipo: ${ui.type}, Capacità: ${ui.capacityBTU} BTU <br>
                        Dim: ${ui.dimensions} | Prezzo: ${typeof ui.price === 'number' ? ui.price.toFixed(2) : ui.price} €
                    </div></li>`;
                totalPrice += (typeof ui.price === 'number' ? ui.price : 0);
            });
            summaryHTML += `</ul>`;
        }
        summaryHTML += `<hr><div class="summary-total"><strong>Prezzo Totale:</strong> ${totalPrice.toFixed(2)} €</div>`;
        const contentDiv = document.createElement('div'); contentDiv.innerHTML = summaryHTML; summaryDiv.appendChild(contentDiv);
        const summaryTitleH2 = document.getElementById('summary-main-title'); // Usa la variabile definita globalmente
        if (summaryTitleH2) summaryTitleH2.classList.add('print-main-title');
    }
    
    stepIndicatorItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return;
            const targetLogicalStep = parseInt(item.dataset.step);
            if (!targetLogicalStep || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return;
            if (targetLogicalStep === TOTAL_LOGICAL_STEPS) {
                 if (!finalizeBtn || finalizeBtn.disabled && selections.configType?.numUnits > 0) {
                     alert("Completa la selezione."); return;
                 }
                 generateSummary(); 
            }
            showStep(targetLogicalStep, true); 
        });
    });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, TOTAL_LOGICAL_STEPS - 1); generateSummary(); showStep(TOTAL_LOGICAL_STEPS);}); }
    document.querySelectorAll('.prev-btn').forEach(button => {
        const currentStepHtmlContainerId = button.closest('.config-step').id;
        let prevLogicalStep = HTML_TO_LOGICAL_STEP_MAP[currentStepHtmlContainerId] - 1;
        if(prevLogicalStep && prevLogicalStep >= 1) button.addEventListener('click', () => { showStep(prevLogicalStep, true); });
        else button.style.display = 'none';
    });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => {
        highestLogicalStepCompleted = 0;
        clearFutureSelections(-1, false); 
        selections.brand = null; selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = [];
        const summaryTitleH2 = document.getElementById('summary-main-title');
        if(summaryTitleH2) summaryTitleH2.classList.remove('print-main-title');
        showStep(1);
    });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => {
        if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML.includes("Prezzo Totale")) window.print();
        else alert("Completa e vai al riepilogo per stampare.");
    });

    async function initializeApp() {
        console.log("DEBUG: Chiamata a initializeApp");
        document.body.appendChild(loadingOverlay);
        loadingOverlay.style.display = 'flex';
        console.log("DEBUG: initializeApp - Verifying CSV_URLS.outdoorUnits:", CSV_URLS.outdoorUnits);
        console.log("DEBUG: initializeApp - Verifying CSV_URLS.indoorUnits:", CSV_URLS.indoorUnits);
        if (!CSV_URLS.outdoorUnits || !CSV_URLS.indoorUnits) { console.error("URL CSV mancanti!"); return; }

        let loadedOutdoorUnits, loadedIndoorUnits;
        try {
            console.log("DEBUG: initializeApp - Prima di Promise.all");
            const promiseOutdoor = fetchCSVData(CSV_URLS.outdoorUnits);
            const promiseIndoor = fetchCSVData(CSV_URLS.indoorUnits);
            promiseOutdoor.then(data => console.log("DEBUG: Promise Outdoor risolta:", data ? data.length + " items" : data));
            promiseIndoor.then(data => console.log("DEBUG: Promise Indoor risolta:", data ? data.length + " items" : data));
            [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([promiseOutdoor, promiseIndoor]);
            console.log("DEBUG: initializeApp - Dopo Promise.all");
        } catch (error) {
            console.error("DEBUG: ERRORE in Promise.all initializeApp:", error);
            loadedOutdoorUnits = []; loadedIndoorUnits = [];
        }
        if (typeof loadedOutdoorUnits === 'undefined') { console.error("DEBUG: loadedOutdoorUnits è UNDEFINED!"); loadedOutdoorUnits = []; }
        if (typeof loadedIndoorUnits === 'undefined') { console.error("DEBUG: loadedIndoorUnits è UNDEFINED!"); loadedIndoorUnits = []; }
        
        console.log("DEBUG: initializeApp - Dati (post-check). UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        if (loadedOutdoorUnits.length > 0) console.log("DEBUG: Primo UE GREZZO:", JSON.parse(JSON.stringify(loadedOutdoorUnits[0])));
        
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        
        const oldModelSerieStepHtmlContainer = document.getElementById('step-2');
        if (oldModelSerieStepHtmlContainer) oldModelSerieStepHtmlContainer.style.display = 'none';
        updateStepIndicator(); 
        
        populateBrands();
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca") || brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p')) {
             loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Problema visualizzazione marche. Vedi console.</span>`;
             if(APP_DATA.outdoorUnits.length > 0 && APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id)).length === 0 ){
                loadingOverlay.style.display = 'none'; 
             }
        } else if (brandSelectionDiv.children.length > 0) {
            loadingOverlay.style.display = 'none';
        } else {
             loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Stato inatteso dopo populateBrands.</span>`;
        }
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1);
    }

    console.log("DEBUG: Prima di chiamare initializeApp");
    initializeApp();
    console.log("DEBUG: Dopo aver chiamato initializeApp (fine DOMContentLoaded)");
});
