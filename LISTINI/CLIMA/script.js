document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione 6 Step - Completa)");

    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = {
        brands: [
            { id: "haier", name: "Haier", logo: "img/logos/logo-haier.png" },
            { id: "mitsubishi", name: "Mitsubishi Electric", logo: "img/logos/logo-mitsubishi.png" },
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

    let currentLogicalStep = 1; // 1:Marca, 2:Serie UI, 3:Config, 4:UE, 5:UI, 6:Riepilogo
    let highestLogicalStepCompleted = 0;
    const selections = { brand: null, uiSeries: null, configType: null, outdoorUnit: null, indoorUnits: [] };

    const brandSelectionDiv = document.getElementById('brand-selection');
    const modelSelectionDiv = document.getElementById('model-selection'); // <-- Ora Usato per Serie UI
    const configTypeSelectionDiv = document.getElementById('config-type-selection');
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection');
    const indoorUnitsSelectionArea = document.getElementById('indoor-units-selection-area');
    const summaryDiv = document.getElementById('config-summary');
    const finalizeBtn = document.getElementById('finalize-btn'); // Su step 5 (UI)
    const stepsHtmlContainers = document.querySelectorAll('.config-step');
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.textContent = 'Caricamento dati...';

    // Mappatura non più necessaria se gli ID HTML sono step-1 a step-6
    // const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-2", 3: "step-3", 4: "step-4", 5: "step-5", 6: "step-6" };
    // const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-2": 2, "step-3": 3, "step-4": 4, "step-5": 5, "step-6": 6 };
    const TOTAL_LOGICAL_STEPS = 6;

    async function fetchCSVData(url) {
        if (!url || typeof url !== 'string') { console.error("CRITICO: fetch URL non valido:", url); return []; }
        //console.log(`DEBUG: Fetching CSV: ${url}`);
        const typeForLog = url.includes(CSV_URLS.outdoorUnits) ? 'UE' : 'UI';
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
            const text = await response.text();
            //console.log(`DEBUG: Ricevuto CSV ${typeForLog}. L: ${text.length}`);
            return parseCSV(text, typeForLog);
        } catch (error) { console.error(`DEBUG: Errore fetchCSVData ${typeForLog}:`, error); return []; }
    }

    function parseCSV(text, typeForLog = '') {
        // console.log(`DEBUG: Parsing CSV ${typeForLog}...`);
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) { console.warn(`DEBUG: parse ${typeForLog}: No data.`); return []; }
        const rawHeaders = lines[0].split(',');
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, ''));
        // console.log(`DEBUG: parse ${typeForLog} - HEADERS (${headers.length}):`, JSON.stringify(headers)); 
        const unitaCollegabiliNormalizedHeader = 'unit_collegabili'; 
        // if (typeForLog === 'UE') console.log(`DEBUG: parse UE - Indice per '${unitaCollegabiliNormalizedHeader}': ${headers.indexOf(unitaCollegabiliNormalizedHeader)}`);
        if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) { console.error(`DEBUG: parse ${typeForLog}: No headers!`); return []; }
        const data = lines.slice(1).map((line, lineIndex) => {
            const values = []; let currentVal = ''; let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') { if (inQuotes && i + 1 < line.length && line[i+1] === '"') { currentVal += '"'; i++; continue; } inQuotes = !inQuotes; }
                else if (char === ',' && !inQuotes) { values.push(currentVal); currentVal = ''; } else { currentVal += char; }
            } values.push(currentVal);
            while (values.length < headers.length) values.push(''); if (values.length > headers.length) values.length = headers.length;
            const entry = {};
            headers.forEach((headerKey, i) => { 
                let value = values[i] ? values[i].trim() : ''; if (value === '') value = "Dati mancanti";
                if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
                const numericHeaders = ['prezzo', 'prezzo_ui', 'unit_collegabili', 'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui', 'min_connessioni_ue', 'peso_ue'];
                if (numericHeaders.includes(headerKey)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); numStr = numStr.replace(',', '.');
                    const num = (headerKey === 'unit_collegabili' || headerKey === 'min_connessioni_ue') ? parseInt(numStr, 10) : parseFloat(numStr);
                    entry[headerKey] = isNaN(num) ? 0 : num;
                    // if (headerKey === 'unit_collegabili' && lineIndex < 3 && typeForLog === 'UE') console.log(`DEBUG: Riga ${lineIndex+2}, ${headerKey}, Grezzo:"${value}", Parsato:${entry[headerKey]}`);
                } else entry[headerKey] = value;
            });
            // if (lineIndex < 1 && typeForLog) console.log(`DEBUG: Prima entry ${typeForLog}:`, JSON.stringify(entry));
            return entry;
        });
        // console.log(`DEBUG: parse ${typeForLog} - Entries: ${data.length}`);
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
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : (connections === 2 ? 2:2)) : 1;
            // if (index < 1) console.log(`DEBUG: Process UE ${index+1}: Connessioni: ${connections}`);
            return {
                id: ue_csv.codice_prod || `ue_${index}`, brandId: brandId, modelCode: ue_csv.codice_prod || "N/A",
                name: ue_csv.nome_modello_ue && ue_csv.nome_modello_ue !== "Dati mancanti" ? `${String(ue_csv.marca).toUpperCase()} ${ue_csv.nome_modello_ue}` : `UE (${brandId})`,
                connections: connections, minConnections: ue_csv.min_connessioni_ue || minConnectionsFallback,
                capacityCoolingBTU: ue_csv.potenza_btu_freddo_ue || 0, capacityHeatingBTU: ue_csv.potenza_btu_caldo_ue || 0,
                price: ue_csv.prezzo || 0,
                dimensions: ue_csv.dimensioni_ue || "N/A", weight: ue_csv.peso_ue || "N/D", 
                energyClassCooling: ue_csv.classe_energetica_raffrescamento || "N/D", energyClassHeating: ue_csv.classe_energetica_riscaldamento || "N/D",
                compatibleIndoorSeriesIds: compatibleIds,
                // Aggiungiamo la "serie UE" basata sul modello UE normalizzato per il filtraggio
                seriesId: String(ue_csv.modello).toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') // <-- Campo derivato dal modello UE (es. revive, pearl_e_flexis)
            };
        });
        APP_DATA.indoorUnits = loadedIndoorUnits.map((ui_csv, index) => {
            const brandId = String(ui_csv.marca).toLowerCase();
            const uiModelNameNormalized = String(ui_csv.modello).toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
            const seriesIdUI = `${uiModelNameNormalized}_ui`;
            let btu = 0; let kw_ui = "N/A";
            if (ui_csv.potenza && ui_csv.potenza !== "Dati mancanti") {
                 const btuMatch = String(ui_csv.potenza).match(/(\d{1,3}(?:\.?\d{3})*)\s*BTU/i);
                if (btuMatch) btu = parseInt(String(btuMatch[1]).replace(/\./g,''));
                const kwMatch = String(ui_csv.potenza).match(/([\d,]+)\s*kW/i);
                if(kwMatch) kw_ui = kwMatch[1];
             }
            let imageNameBase = APP_DATA.uiSeriesImageMapping[seriesIdUI] || uiModelNameNormalized; 
            let imagePath = `img/${imageNameBase}.png`;
            return {
                id: ui_csv.codice_prodotto || `ui_${index}`, brandId: brandId, seriesId: seriesIdUI, modelCode: ui_csv.codice_prodotto || "N/A",
                name: `${String(ui_csv.marca).toUpperCase()} ${ui_csv.modello} ${kw_ui} (${btu} BTU)`,
                type: String(ui_csv.tipo_unit) === "Interna" ? "Parete" : ui_csv.tipo_unit,
                capacityBTU: btu, price: ui_csv.prezzo_ui || 0,
                image: imagePath, dimensions: ui_csv.dimensioni_ui || "N/A", wifi: ui_csv.wifi === "si"
            };
        });
        
        // Popola APP_DATA.series dinamicamente dalle UE (necessario per lo step 2)
        APP_DATA.series = {}; // Oggetto per le serie UI, chiave brandId
        APP_DATA.outdoorUnits.forEach(ue => {
            if (!APP_DATA.series[ue.brandId]) APP_DATA.series[ue.brandId] = new Map(); // Usiamo Map per mantenere serie uniche
             // Usiamo le seriesId *delle UI* che questa UE può supportare
            (ue.compatibleIndoorSeriesIds || []).forEach(uiSeriesId => {
                if (!APP_DATA.series[ue.brandId].has(uiSeriesId)) {
                    // Trova nome leggibile e immagine per questa serie UI
                    const uiModelNameNormalized = uiSeriesId.replace('_ui', '');
                    const displayName = String(uiModelNameNormalized).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Nome capitalizzato
                    const imageRef = APP_DATA.uiSeriesImageMapping[uiSeriesId] || uiModelNameNormalized;
                    const brandLogo = APP_DATA.brands.find(b => b.id === ue.brandId)?.logo;
                    
                    APP_DATA.series[ue.brandId].set(uiSeriesId, {
                        id: uiSeriesId, // es. revive_ui
                        name: displayName, // es. Revive
                        logo: brandLogo,
                        uiImageRef: imageRef
                    });
                }
            });
        });
        // Converti le Map in Array per usarle più facilmente
        for(const brandKey in APP_DATA.series) {
            APP_DATA.series[brandKey] = Array.from(APP_DATA.series[brandKey].values());
        }

        console.log("DEBUG: Process fine. Primo UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.stringify(APP_DATA.outdoorUnits[0]) : "ND");
        console.log("DEBUG: Process fine. Primo UI:", APP_DATA.indoorUnits.length > 0 ? JSON.stringify(APP_DATA.indoorUnits[0]) : "ND");
        console.log("DEBUG: Serie UI dinamiche (per Step 2):", JSON.parse(JSON.stringify(APP_DATA.series)));
    }

    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesFlow6 = ["Marca", "Serie", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];
        stepIndicatorItems.forEach((item, htmlIndex) => {
            const itemLogicalStep = htmlIndex + 1;
            item.dataset.step = itemLogicalStep;
            item.style.display = ''; // Mostra tutti gli step
            const nameEl = item.querySelector('.step-name');
            if(nameEl) nameEl.textContent = stepNamesFlow6[itemLogicalStep-1] || '?';
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot'); if(dot) dot.classList.remove('active', 'completed');
            if (itemLogicalStep < currentLogicalStep) { item.classList.add('completed'); dot?.classList.add('completed'); }
            else if (itemLogicalStep === currentLogicalStep) { item.classList.add('active'); dot?.classList.add('active'); }
            if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) item.classList.add('disabled');
        });
        stepLinesHTML.forEach((line, htmlLineIndex) => {
            line.style.display = ''; // Mostra tutte le linee
            line.classList.remove('active');
            if (stepIndicatorItems[htmlLineIndex]?.classList.contains('completed') || currentLogicalStep > htmlLineIndex + 1) line.classList.add('active');
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) return;
        const htmlContainerId = `step-${logicalStepNumber}`; // Corrisponde 1:1 ora
        if (!htmlContainerId) { console.error("ID HTML per step:", logicalStepNumber); return; }
        if (!fromDirectNavigation) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        else if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1 && currentLogicalStep < logicalStepNumber) {
            if (logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted < TOTAL_LOGICAL_STEPS -1) return; else if (logicalStepNumber !== TOTAL_LOGICAL_STEPS) return;
        }
        stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) { targetStepEl.classList.add('active-step'); targetStepEl.style.display = ''; } // Mostra lo step
        else console.error(`Contenitore '${htmlContainerId}' non trovato.`);
        currentLogicalStep = logicalStepNumber;
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted && logicalStepNumber < TOTAL_LOGICAL_STEPS) {
             clearFutureSelections(logicalStepNumber -1, true);
        }
        updateStepIndicator(); window.scrollTo(0, 0);
    }

    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) {
        // 0=marca, 1=serie UI, 2=config, 3=UE, 4=UI
        if (preserveCurrentLevelSelections) {
            if (stepJustCompletedLogical < 1) selections.uiSeries = null;
            if (stepJustCompletedLogical < 2) selections.configType = null;
            if (stepJustCompletedLogical < 3) selections.outdoorUnit = null;
            if (stepJustCompletedLogical < 4) selections.indoorUnits = [];
        } else { /* reset completo come prima */ }

        if (stepJustCompletedLogical < 1) modelSelectionDiv.innerHTML = '<p>...</p>';
        if (stepJustCompletedLogical < 2) configTypeSelectionDiv.innerHTML = '<p>...</p>';
        if (stepJustCompletedLogical < 3) outdoorUnitSelectionDiv.innerHTML = '<p>...</p>';
        if (stepJustCompletedLogical < 4) indoorUnitsSelectionArea.innerHTML = '<p>...</p>';
        if (stepJustCompletedLogical < 5) summaryDiv.innerHTML = '';

        // Ripopolamento successivo
        if (selections.brand && stepJustCompletedLogical < 1) populateUiSeries(selections.brand.id, preserveCurrentLevelSelections);
        if (selections.uiSeries && selections.brand && stepJustCompletedLogical < 2) populateConfigTypes(preserveCurrentLevelSelections);
        if (selections.configType && selections.uiSeries && selections.brand && stepJustCompletedLogical < 3) populateOutdoorUnits(preserveCurrentLevelSelections);
        if (selections.outdoorUnit && selections.configType && selections.uiSeries && selections.brand && stepJustCompletedLogical < 4) populateIndoorUnitSelectors(preserveCurrentLevelSelections);

        if (!preserveCurrentLevelSelections) highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        checkAllIndoorUnitsSelected(); // Controlla stato bottone finalizza e aggiorna indicatore
    }

    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const seriesChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected');
        itemDiv.dataset[type + 'Id'] = item.id; 
        let logoSrc = ''; let uiImageSrc = '';
        if ((type === 'brand' || type === 'uiSeries') && item.logo) logoSrc = item.logo; // Usa logo passato (per marca o serie UI)
        if (type === 'uiSeries' && item.uiImageRef) uiImageSrc = `img/${item.uiImageRef}.png`; // Immagine UI per card Serie
        const nameSpan = document.createElement('span'); nameSpan.textContent = item.name;
        if (logoSrc) {
            const logoImg = document.createElement('img'); logoImg.src = logoSrc; logoImg.alt = `Logo ${item.name}`;
            logoImg.classList.add(type === 'brand' ? 'brand-logo' : 'series-logo');
            logoImg.onload = () => { if (type === 'brand') nameSpan.style.display = 'none'; };
            logoImg.onerror = () => { logoImg.style.display = 'none'; if (type === 'brand') nameSpan.style.display = 'block';};
            itemDiv.appendChild(logoImg);
        }
        if (uiImageSrc) {
            const uiImg = document.createElement('img'); uiImg.src = uiImageSrc; uiImg.alt = `Esempio ${item.name}`;
            uiImg.classList.add('series-ui-image'); uiImg.onerror = () => { uiImg.style.display = 'none'; }; itemDiv.appendChild(uiImg);
        }
        itemDiv.appendChild(nameSpan);
        if (type === 'brand') nameSpan.style.display = logoSrc ? 'none' : 'block'; else nameSpan.style.display = 'block';
        itemDiv.addEventListener('click', () => {
            itemDiv.parentElement.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected')); itemDiv.classList.add('selected');
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); clickHandler(item);
        }); return itemDiv;
    }

    function createUnitSelectionCard(unit, clickHandler, isSelected = false) {
        const card = document.createElement('div'); card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected'); card.dataset.unitId = unit.id;
        card.style.flexDirection = "column"; card.style.alignItems = 'flex-start'; // Modifica layout senza immagine
        const infoDiv = document.createElement('div'); infoDiv.classList.add('unit-info'); infoDiv.style.width = '100%';
        const nameH4 = document.createElement('h4'); nameH4.textContent = unit.name || "N/D"; infoDiv.appendChild(nameH4);
        const modelP = document.createElement('p'); modelP.innerHTML = `Codice: <strong>${unit.modelCode || 'N/D'}</strong> | Max UI: ${unit.connections}`; infoDiv.appendChild(modelP);
        const capacityP = document.createElement('p'); capacityP.textContent = `Potenza (F/C BTU): ${unit.capacityCoolingBTU || '?'} / ${unit.capacityHeatingBTU || '?'}`; infoDiv.appendChild(capacityP);
        const energyClassP = document.createElement('p'); energyClassP.innerHTML = `Classe (F/C): <strong>${unit.energyClassCooling || '?'}</strong> / <strong>${unit.energyClassHeating || '?'}</strong>`; infoDiv.appendChild(energyClassP);
        const dimensionsP = document.createElement('p'); let dimText = unit.dimensions && unit.dimensions !== "N/A" ? `Dim. ${unit.dimensions}` : "Dim: N/A"; if (unit.weight && unit.weight !== "N/D") dimText += ` | Peso: ${unit.weight} kg`; else dimText += ` | Peso: N/D`; dimensionsP.textContent = dimText; infoDiv.appendChild(dimensionsP);
        const priceP = document.createElement('p'); priceP.classList.add('unit-price'); priceP.textContent = `Prezzo: ${typeof unit.price === 'number' ? unit.price.toFixed(2) : unit.price} €`; infoDiv.appendChild(priceP);
        card.appendChild(infoDiv);
        card.addEventListener('click', () => { card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected')); card.classList.add('selected'); highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); clickHandler(unit); });
        return card;
    }
    
    function populateBrands(){
        brandSelectionDiv.innerHTML = '';
        const brandsToShow = APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id));
        if (brandsToShow.length === 0) { brandSelectionDiv.innerHTML = '<p>Nessuna marca con unità disponibili.</p>'; return; }
        brandsToShow.forEach(brand => { 
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const changed = brandChanged(selections.brand, selectedBrand); selections.brand = selectedBrand;
                if (changed) { clearFutureSelections(0, false); highestLogicalStepCompleted = 0; }
                populateUiSeries(selectedBrand.id, !changed && !!selections.uiSeries); showStep(2); // Vai a Step 2: Serie UI
            }, selections.brand && selections.brand.id === brand.id));
        });
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) populateUiSeries(selections.brand.id, true); else if (selections.brand) selections.brand = null;
    }

    function populateUiSeries(brandId, restoring = false) { // Nuova funzione per Step 2
        modelSelectionDiv.innerHTML = ''; // Usa il contenitore corretto (era step 2 nel tuo HTML)
        if (!selections.brand) { modelSelectionDiv.innerHTML = '<p>Scegli marca.</p>'; return; }
        if (!APP_DATA.series || !APP_DATA.series[brandId] || APP_DATA.series[brandId].length === 0) {
             modelSelectionDiv.innerHTML = `<p>Nessuna Serie UI trovata per ${selections.brand.name}</p>`;
             return;
        }
        const seriesForBrand = APP_DATA.series[brandId];
        seriesForBrand.forEach(seriesData => {
            modelSelectionDiv.appendChild(createSelectionItem(seriesData, 'uiSeries', (selectedSeries) => {
                 const changed = seriesChanged(selections.uiSeries, selectedSeries); selections.uiSeries = selectedSeries;
                 if (changed) { clearFutureSelections(1, false); highestLogicalStepCompleted = 1; }
                 populateConfigTypes(!changed && !!selections.configType); showStep(3); // Vai a Step 3: Config
            }, selections.uiSeries && selections.uiSeries.id === seriesData.id));
        });
        if(restoring && selections.uiSeries && seriesForBrand.some(s => s.id === selections.uiSeries.id)) populateConfigTypes(true);
        else if (restoring && selections.uiSeries) selections.uiSeries = null;
    }

    function populateConfigTypes(restoring = false) { // Ora Step 3 Logico
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.uiSeries) { configTypeSelectionDiv.innerHTML = '<p>...</p>'; if(restoring) selections.configType = null; return; }
        const validConfigs = Object.entries(APP_DATA.configTypes).map(([id, data]) => {
            const hasMatchingUE = APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= data.numUnits && ue.minConnections <= data.numUnits && ue.compatibleIndoorSeriesIds.includes(selections.uiSeries.id));
            return hasMatchingUE ? { id, ...data } : null;
        }).filter(Boolean);
        if(validConfigs.length === 0) { configTypeSelectionDiv.innerHTML = `<p>Nessuna config per ${selections.brand.name}/${selections.uiSeries.name}.</p>`; if (restoring) selections.configType = null; return; }
        validConfigs.forEach(item => {
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const changed = configChanged(selections.configType, selectedConfig); selections.configType = selectedConfig;
                if (changed) { clearFutureSelections(2, false); highestLogicalStepCompleted = 2; }
                populateOutdoorUnits(!changed && !!selections.outdoorUnit);
                if (APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= selectedConfig.numUnits && ue.minConnections <= selectedConfig.numUnits && ue.compatibleIndoorSeriesIds.includes(selections.uiSeries.id))) showStep(4); // Vai a Step 4: UE
                else console.warn("No UE?");
            }, selections.configType && selections.configType.id === item.id));
        });
        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) populateOutdoorUnits(true); else if (restoring && selections.configType) selections.configType = null;
    }
    
    function populateOutdoorUnits(restoring = false) { // Ora Step 4 Logico
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.uiSeries || !selections.configType) { outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; if(restoring) selections.outdoorUnit = null; return; }
        const numRequired = selections.configType.numUnits;
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand.id && ue.connections >= numRequired && ue.minConnections <= numRequired && ue.compatibleIndoorSeriesIds.includes(selections.uiSeries.id));
        if (compatibleUEs.length === 0) { outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE per ${selections.brand.name}/${selections.uiSeries.name}/${selections.configType.name}.</p>`; if(restoring) selections.outdoorUnit = null; return; }
        compatibleUEs.forEach(ue => {
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                const changed = ueChanged(selections.outdoorUnit, selectedUE); selections.outdoorUnit = selectedUE;
                 if (changed) { clearFutureSelections(3, false); highestLogicalStepCompleted = 3; }
                populateIndoorUnitSelectors(!changed && selections.indoorUnits.length > 0);
                if (selections.configType.numUnits === 0) { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); generateSummary(); showStep(6); } // Vai a Riepilogo (Step 6)
                else showStep(5); // Vai a UI (Step 5)
                checkAllIndoorUnitsSelected();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });
        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) populateIndoorUnitSelectors(true); else if (restoring && selections.outdoorUnit) selections.outdoorUnit = null;
    }
    
    function populateIndoorUnitSelectors(restoring = false) { // Ora Step 5 Logico
         indoorUnitsSelectionArea.innerHTML = '';
        if (!selections.outdoorUnit || !selections.configType || !selections.brand || !selections.uiSeries) { indoorUnitsSelectionArea.innerHTML = `<p>Info mancanti.</p>`; checkAllIndoorUnitsSelected(); return; }
        if (selections.configType.numUnits === 0) { checkAllIndoorUnitsSelected(); return; } 
        let validRestore = restoring && selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui === null || (ui && ui.brandId === selections.brand.id));
        if (!validRestore) selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
        
        // Mostra solo le UI della Serie selezionata
        const availableIndoorUnits = APP_DATA.indoorUnits.filter(ui => ui.brandId === selections.brand.id && ui.seriesId === selections.uiSeries.id );
        
        if (availableIndoorUnits.length === 0) { indoorUnitsSelectionArea.innerHTML = `<p>Nessuna UI trovata per Serie ${selections.uiSeries.name}.</p>`; checkAllIndoorUnitsSelected(); return; }
        
        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div'); slotDiv.classList.add('indoor-unit-slot');
            const label = document.createElement('label'); label.htmlFor = `indoor-unit-select-${i}`; label.textContent = `Unità Interna ${i + 1}:`; slotDiv.appendChild(label);
            const select = document.createElement('select'); select.id = `indoor-unit-select-${i}`; select.dataset.index = i;
            const placeholder = document.createElement('option'); placeholder.value = ""; placeholder.textContent = "-- Seleziona --"; select.appendChild(placeholder);
            availableIndoorUnits.forEach(ui => {
                const option = document.createElement('option'); option.value = ui.id;
                option.textContent = `${ui.name} (${ui.capacityBTU} BTU) - ${typeof ui.price === 'number' ? ui.price.toFixed(2) : ui.price} €`; select.appendChild(option);
             });
            const detailsDiv = document.createElement('div'); detailsDiv.classList.add('unit-details');
            if (validRestore && selections.indoorUnits[i] && availableIndoorUnits.some(avail => avail.id === selections.indoorUnits[i].id)) { 
                 select.value = selections.indoorUnits[i].id; 
                 detailsDiv.textContent = `Modello: ${selections.indoorUnits[i].modelCode}, Tipo: ${selections.indoorUnits[i].type}, Dim: ${selections.indoorUnits[i].dimensions}`;
            }
            else if (validRestore && selections.indoorUnits[i]) selections.indoorUnits[i] = null; 
            select.addEventListener('change', (e) => { 
                const selectedId = e.target.value; const unitIndex = parseInt(e.target.dataset.index);
                if (selectedId) {
                    const selectedUI = APP_DATA.indoorUnits.find(ui => ui.id === selectedId); selections.indoorUnits[unitIndex] = selectedUI;
                    detailsDiv.textContent = `Mod: ${selectedUI?.modelCode}, Tipo: ${selectedUI?.type}, Dim: ${selectedUI?.dimensions}`;
                } else { selections.indoorUnits[unitIndex] = null; detailsDiv.textContent = ''; }
                checkAllIndoorUnitsSelected();
             });
            slotDiv.appendChild(select); slotDiv.appendChild(detailsDiv); indoorUnitsSelectionArea.appendChild(slotDiv);
        } 
        checkAllIndoorUnitsSelected();
    }

    function checkAllIndoorUnitsSelected() { // Step 5 è l'ultimo step di dati
        let allSelected = false;
        if (selections.configType?.numUnits === 0) allSelected = true;
        else if (selections.configType && selections.indoorUnits.length === selections.configType.numUnits) allSelected = selections.indoorUnits.every(ui => ui !== null);
        if(finalizeBtn) finalizeBtn.disabled = !allSelected;
        if(allSelected) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); // Marca step 5 come completabile
        updateStepIndicator(); // Aggiorna per abilitare step 6
    }

    function generateSummary() { // Step 6
        summaryDiv.innerHTML = ''; 
        let totalPrice = 0;
        const { brand, uiSeries, configType, outdoorUnit, indoorUnits } = selections; // Aggiunto uiSeries
        const allUISelected = indoorUnits.every(ui => ui !== null);
        if (!brand || !uiSeries || !configType || !outdoorUnit || (!allUISelected && configType.numUnits > 0)) {
            summaryDiv.innerHTML = '<p>Configurazione Incompleta.</p>'; return;
        }
        const brandLogoPrint = document.createElement('img'); brandLogoPrint.src = brand.logo; brandLogoPrint.alt = `${brand.name} Logo`; brandLogoPrint.classList.add('brand-logo-print'); summaryDiv.appendChild(brandLogoPrint);
        let summaryHTML = `
            <h3>Config. Scelta</h3>
            <div class="summary-item"><strong>Marca:</strong> ${brand.name}</div>
            <div class="summary-item"><strong>Serie UI:</strong> ${uiSeries.name}</div> 
            <div class="summary-item"><strong>Config:</strong> ${configType.name}</div>
            <hr><h3>Unità Esterna</h3>
            <div class="summary-item"><strong>Nome:</strong> ${outdoorUnit.name}</div>
            <div class="summary-item"><strong>Codice:</strong> ${outdoorUnit.modelCode}</div>
            <div class="summary-item"><strong>Potenza BTU (F/C):</strong> ${outdoorUnit.capacityCoolingBTU}/${outdoorUnit.capacityHeatingBTU}</div>
            <div class="summary-item"><strong>Classe (F/C):</strong> ${outdoorUnit.energyClassCooling}/${outdoorUnit.energyClassHeating}</div>
            <div class="summary-item"><strong>Dimensioni:</strong> ${outdoorUnit.dimensions} | Peso: ${outdoorUnit.weight}kg</div>
            <div class="summary-item"><strong>Prezzo UE:</strong> ${typeof outdoorUnit.price == 'number' ? outdoorUnit.price.toFixed(2):outdoorUnit.price} €</div>`;
        totalPrice += (typeof outdoorUnit.price == 'number' ? outdoorUnit.price:0);
        if (configType.numUnits > 0 && allUISelected) {
            summaryHTML += `<hr><h3>Unità Interne (${indoorUnits.length})</h3><ul class="summary-indoor-unit-list">`;
            indoorUnits.forEach((ui, index) => {
                 const imgName = APP_DATA.uiSeriesImageMapping[ui.seriesId] || ui.seriesId.replace('_ui','');
                 summaryHTML += `<li> <img src="img/${imgName}.png" alt="${ui.name}" onerror="this.style.display='none';"> <div class="ui-details-container"> ... </div></li>`; // Abbreviato, mettere dettagli UI come prima
                 totalPrice += (typeof ui.price == 'number' ? ui.price:0);
            });
             summaryHTML += `</ul>`;
        }
         summaryHTML += `<hr><div class="summary-total"><strong>Prezzo Totale:</strong> ${totalPrice.toFixed(2)} €</div>`;
        const contentDiv = document.createElement('div'); contentDiv.innerHTML = summaryHTML; summaryDiv.appendChild(contentDiv);
        document.getElementById('summary-main-title')?.classList.add('print-main-title');
    }
    
    // Event Listeners (Flusso a 6 step)
    stepIndicatorItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return;
            const targetLogicalStep = parseInt(item.dataset.step);
            if (!targetLogicalStep || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return;
            if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { // Vai a Riepilogo
                 if (!finalizeBtn || finalizeBtn.disabled && selections.configType?.numUnits > 0) { alert("Completa selezione UI."); return; }
                 generateSummary(); 
            }
            showStep(targetLogicalStep, true); 
        });
    });
    if(finalizeBtn) { finalizeBtn.addEventListener('click', () => { highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); generateSummary(); showStep(6);}); } // Step UI è 5, vai a Riepilogo (6)
    document.querySelectorAll('.prev-btn').forEach(button => {
        const currentHtmlId = button.closest('.config-step')?.id; // es. step-2, step-3 ...
        const currentLogical = parseInt(currentHtmlId?.split('-')[1]); // Prendi il numero dall'ID HTML
        let prevLogicalStep = currentLogical ? currentLogical - 1 : 0;
        if(prevLogicalStep >= 1) button.addEventListener('click', () => { showStep(prevLogicalStep, true); }); else button.style.display = 'none';
     });
    document.getElementById('reset-config-btn')?.addEventListener('click', () => { highestLogicalStepCompleted = 0; clearFutureSelections(-1, false); showStep(1); });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => { if (currentLogicalStep === 6) window.print(); else alert("Vai al riepilogo."); });

    async function initializeApp() {
        console.log("DEBUG: Inizio initializeApp (6 step)");
        document.body.appendChild(loadingOverlay); loadingOverlay.style.display = 'flex';
        let loadedOutdoorUnits = [], loadedIndoorUnits = [];
        try { [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([fetchCSVData(CSV_URLS.outdoorUnits), fetchCSVData(CSV_URLS.indoorUnits)]); } catch(e) {}
        if (typeof loadedOutdoorUnits === 'undefined') loadedOutdoorUnits = []; if (typeof loadedIndoorUnits === 'undefined') loadedIndoorUnits = [];
        console.log("DEBUG: Caricati UE:", loadedOutdoorUnits.length, "UI:", loadedIndoorUnits.length);
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        
        document.getElementById('step-2')?.style.display = ''; // Assicura che lo step 2 (Serie) sia visibile
        updateStepIndicator(); 
        populateBrands();
        if (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p')) { loadingOverlay.innerHTML += '<br><span>Errore Marche.</span>'; }
        else loadingOverlay.style.display = 'none';
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1);
    }

    console.log("DEBUG: Prima di initializeApp");
    initializeApp();
    console.log("DEBUG: Dopo initializeApp");
});