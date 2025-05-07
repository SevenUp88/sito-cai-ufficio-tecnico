document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione Fix processLoadedData Log)");

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
    // NUOVO CONTROLLO
if (!configTypeSelectionDiv) {
    console.error("ERRORE CRITICO: Impossibile trovare l'elemento HTML con id='config-type-selection'. Controllare l'index.html.");
    // Potresti anche voler fermare l'esecuzione o mostrare un messaggio all'utente qui
    // loadingOverlay.innerHTML += '<br/><span style="color:red; font-size:0.8em">Errore interno: Elemento necessario mancante!</span>'; // Esempio
}
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
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore interno: URL CSV non valido.</span>`;
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
        console.log(`DEBUG: parseCSV ${typeForLog} - HEADERS NORMALIZZATI (count: ${headers.length}):`, JSON.stringify(headers)); 
        const unitaCollegabiliNormalizedHeader = 'unit_collegabili'; 
        if (typeForLog === 'UE') {
             const unitaCollegabiliHeaderIndex = headers.indexOf(unitaCollegabiliNormalizedHeader);
             console.log(`DEBUG: parseCSV UE - Indice rilevato per '${unitaCollegabiliNormalizedHeader}': ${unitaCollegabiliHeaderIndex}`);
        }
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
            if (values.length > headers.length) { values.length = headers.length; }
            const entry = {};
            headers.forEach((headerKey, i) => { 
                let value = values[i] ? values[i].trim() : '';
                if (value === '') value = "Dati mancanti";
                if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
                const generalNumericHeaders = ['prezzo', 'prezzo_ui', 'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui', 'min_connessioni_ue'];
                if (typeForLog === 'UE' && headerKey === unitaCollegabiliNormalizedHeader) { // Log sempre per questa colonna critica per UE
                    console.log(`DEBUG: parseCSV UE (Riga ${lineIndex + 2}, Colonna '${headerKey}') - Valore GREZZO: "${value}"`);
                }
                if (headerKey === unitaCollegabiliNormalizedHeader) { 
                    const parsedInt = parseInt(value, 10);
                    entry[headerKey] = isNaN(parsedInt) ? (value === "Dati mancanti" ? "Dati mancanti" : 0) : parsedInt;
                    if (typeForLog === 'UE') { // Log sempre il risultato per questa colonna critica per UE
                         console.log(`DEBUG: parseCSV UE (Riga ${lineIndex + 2}, Colonna '${headerKey}') - Valore PARSATO: ${entry[headerKey]}`);
                    }
                } else if (generalNumericHeaders.includes(headerKey)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); 
                    numStr = numStr.replace(',', '.');          
                    const num = parseFloat(numStr);
                    entry[headerKey] = (value === "Dati mancanti" && isNaN(num)) ? "Dati mancanti" : (isNaN(num) ? 0 : num);
                } else { entry[headerKey] = value; }
            });
            if (lineIndex < 1 && typeForLog) console.log(`DEBUG: parseCSV ${typeForLog} - Prima entry completa:`, JSON.parse(JSON.stringify(entry)));
            return entry;
        });
        console.log(`DEBUG: parseCSV ${typeForLog} - Totale entries: ${data.length}`);
        return data;
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        console.log("DEBUG: Chiamata a processLoadedData. UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        APP_DATA.outdoorUnits = loadedOutdoorUnits.map((ue_csv, index) => {
            const brandId = String(ue_csv.marca).toLowerCase();
            let compatibleIds = [];
            if (ue_csv.compatibleindoorseriesids && ue_csv.compatibleindoorseriesids !== "Dati mancanti") { 
                compatibleIds = ue_csv.compatibleindoorseriesids.split(';')
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            }
            
            const connections = parseInt(ue_csv.unit_collegabili, 10) || 0; 

            if (index < 5) { 
                console.log(`DEBUG: processLoadedData (UE ${index + 1}) - Da CSV ue_csv.unit_collegabili: "${ue_csv.unit_collegabili}", Risultato per 'connections': ${connections}`);
            }
            
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
                dimensions: ue_csv.dimensioni_ue || "Dati mancanti", 
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
                id: ui_csv.codice_prodotto || `ui_csv_${Math.random().toString(36).substr(2, 9)}`,
                brandId: brandId, seriesId: seriesIdUI, modelCode: ui_csv.codice_prodotto || "Dati mancanti",
                name: `${String(ui_csv.marca).toUpperCase()} ${ui_csv.modello} ${kw_ui} (${btu} BTU)`,
                type: String(ui_csv.tipo_unit) === "Interna" ? "Parete" : ui_csv.tipo_unit,
                capacityBTU: btu, price: ui_csv.prezzo_ui || 0,
                image: ui_csv.percorso_immagine_ui && ui_csv.percorso_immagine_ui !== "Dati mancanti" ? ui_csv.percorso_immagine_ui : `img/${imageName}.png`,
                dimensions: ui_csv.dimensioni_ui || "Dati mancanti",
                wifi: ui_csv.wifi === "si"
            };
        });
        console.log("DEBUG: processLoadedData - Fine. outdoorUnits (primo):", APP_DATA.outdoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.outdoorUnits[0])) : "Nessuna UE");
        console.log("DEBUG: processLoadedData - Fine. indoorUnits (primo):", APP_DATA.indoorUnits.length > 0 ? JSON.parse(JSON.stringify(APP_DATA.indoorUnits[0])) : "Nessuna UI");
    }

    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];
        stepIndicatorItems.forEach((item, htmlIndex) => {
            let itemLogicalStep = parseInt(item.dataset.step);
            if (stepIndicatorItems.length === 6) {
                if (htmlIndex === 1) { item.style.display = 'none'; if (stepLinesHTML[0]) stepLinesHTML[0].style.display = 'none'; return; }
                itemLogicalStep = (htmlIndex > 1) ? htmlIndex : (htmlIndex + 1); item.dataset.step = itemLogicalStep;
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
            logoImg.onerror = () => { console.warn(`DEBUG: Errore logo ${logoSrc}`); logoImg.style.display = 'none'; nameSpan.style.display = 'block';};
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
        const card = document.createElement('div');
        card.classList.add('unit-selection-card'); // Mantieni la classe base per CSS
        if (isSelected) card.classList.add('selected');
        card.dataset.unitId = unit.id;
        card.style.flexDirection = "row"; // Assicurati che rimanga in riga anche senza immagine (se il CSS dipendeva da quello)

        // *** LA PARTE DELL'IMMAGINE È STATA RIMOSSA ***

        const infoDiv = document.createElement('div'); 
        infoDiv.classList.add('unit-info');
        // Non serve più padding extra se non c'è immagine, il CSS base per .unit-info dovrebbe bastare
        // infoDiv.style.paddingLeft = "10px"; // Rimuoviamo eventuali aggiustamenti inline

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
            else if (APP_DATA.outdoorUnits.length === 0) msg += `Nessuna UE caricata.</p>`;
            else msg += `Controllare i dati.</p>`;
            brandSelectionDiv.innerHTML = msg; console.log("DEBUG: populateBrands - Nessuna marca."); return;
        }
        brandsToShow.forEach(brand => { 
            console.log("DEBUG: populateBrands - Creazione card per:", brand.id);
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand); selections.brand = selectedBrand;
                if (brandHasChanged) { clearFutureSelections(0, false); highestLogicalStepCompleted = 0; }
                populateConfigTypes(!brandHasChanged && !!selections.configType); showStep(2);
            }, selections.brand && selections.brand.id === brand.id));
        });
        console.log("DEBUG: populateBrands - Fine. Marche popolate.");
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) populateConfigTypes(true);
        else if (selections.brand) selections.brand = null;
    }

    function populateConfigTypes(restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>Scegli una marca.</p>'; if(restoring) selections.configType = null; return; }
        console.log(`DEBUG: populateConfigTypes - Marca: ${selections.brand.name}`);
        const validConfigs = Object.entries(APP_DATA.configTypes).map(([id, data]) => {
            const matchingUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections >= data.numUnits && ue.minConnections <= data.numUnits);
            if (matchingUEs.length > 0) { console.log(`DEBUG: Config '${data.name}' VALIDA per ${selections.brand.name}`); return { id, ...data }; }
            else { console.log(`DEBUG: Config '${data.name}' NON VALIDA per ${selections.brand.name}`); return null; }
        }).filter(Boolean);
        console.log("DEBUG: populateConfigTypes - validConfigs:", JSON.parse(JSON.stringify(validConfigs)));
        if(validConfigs.length === 0) {
            configTypeSelectionDiv.innerHTML = `<p>Nessuna config per ${selections.brand.name}.</p>`; if (restoring) selections.configType = null; return;
        }
        validConfigs.forEach(item => {
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig); selections.configType = selectedConfig;
                if (configHasChanged) { clearFutureSelections(1, false); highestLogicalStepCompleted = 1; }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                if (APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= selectedConfig.numUnits && ue.minConnections <= selectedConfig.numUnits)) showStep(3);
                else console.warn("Nessuna UE per config scelta.");
            }, selections.configType && selections.configType.id === item.id));
        });
        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) populateOutdoorUnits(true);
        else if (restoring && selections.configType) selections.configType = null;
    }
    
    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType) { outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; if(restoring) selections.outdoorUnit = null; return; }
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
                if (selections.configType.numUnits === 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); generateSummary(); showStep(5); }
                else showStep(4);
                checkAllIndoorUnitsSelected();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });
        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) populateIndoorUnitSelectors(true);
        else if (restoring && selections.outdoorUnit) selections.outdoorUnit = null;
    }
    
    function populateIndoorUnitSelectors(restoring = false) { /* ... COME PRIMA ... */ }
    function checkAllIndoorUnitsSelected() { /* ... COME PRIMA ... */ }
    function generateSummary() { /* ... COME PRIMA ... */ }
    stepIndicatorItems.forEach(item => { /* ... COME PRIMA ... */ });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { /* ... COME PRIMA ... */ }); }
    document.querySelectorAll('.prev-btn').forEach(button => { /* ... COME PRIMA ... */ });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { /* ... COME PRIMA ... */ });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { /* ... COME PRIMA ... */ });

    async function initializeApp() {
        console.log("DEBUG: Chiamata a initializeApp");
        document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex'; 
        console.log("DEBUG: initializeApp - CSV_URLS.outdoorUnits:", CSV_URLS.outdoorUnits);
        console.log("DEBUG: initializeApp - CSV_URLS.indoorUnits:", CSV_URLS.indoorUnits);
        if (!CSV_URLS.outdoorUnits || !CSV_URLS.indoorUnits) { console.error("URL CSV mancanti!"); return; }
        let loadedOutdoorUnits, loadedIndoorUnits;
        try {
            console.log("DEBUG: initializeApp - Prima di Promise.all");
            const promiseOutdoor = fetchCSVData(CSV_URLS.outdoorUnits);
            const promiseIndoor = fetchCSVData(CSV_URLS.indoorUnits);
            promiseOutdoor.then(data => console.log("DEBUG: Promise Outdoor:", data ? data.length + " items" : data));
            promiseIndoor.then(data => console.log("DEBUG: Promise Indoor:", data ? data.length + " items" : data));
            [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([promiseOutdoor, promiseIndoor]);
            console.log("DEBUG: initializeApp - Dopo Promise.all");
        } catch (error) { console.error("DEBUG: ERRORE in Promise.all:", error); loadedOutdoorUnits = []; loadedIndoorUnits = []; }
        if (typeof loadedOutdoorUnits === 'undefined') { console.error("DEBUG: loadedOutdoorUnits UNDEFINED!"); loadedOutdoorUnits = []; }
        if (typeof loadedIndoorUnits === 'undefined') { console.error("DEBUG: loadedIndoorUnits UNDEFINED!"); loadedIndoorUnits = []; }
        console.log("DEBUG: initializeApp - Dati (post-check). UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        if (loadedOutdoorUnits.length > 0) console.log("DEBUG: Primo UE GREZZO:", JSON.parse(JSON.stringify(loadedOutdoorUnits[0])));
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        document.getElementById('step-2')?.remove(); // Rimuovi lo step HTML non usato
        updateStepIndicator(); 
        populateBrands();
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
    console.log("DEBUG: Dopo aver chiamato initializeApp (fine DOMContentLoaded)");
});
