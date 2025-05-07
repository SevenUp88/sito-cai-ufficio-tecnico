document.addEventListener('DOMContentLoaded', async () => {
    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const APP_DATA = {
        brands: [
            { id: "haier", name: "Haier", logo: "img/logos/haier.png" },
            { id: "mitsubishi", name: "Mitsubishi Electric", logo: "img/logos/mitsubishi.png" },
            // Aggiungere altre marche se sono nei CSV e hai i loghi
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

    let currentLogicalStep = 1; // 1:Marca, 2:Config, 3:UE, 4:UI, 5:Riepilogo
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
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status} for ${url}`);
            return parseCSV(await response.text());
        } catch (error) {
            console.error("Error fetchCSVData:", error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore durante il caricamento di: ${url}. Dettagli in console.</span>`;
            return [];
        }
    }

    function parseCSV(text) {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h =>
            h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '')
        );
        
        return lines.slice(1).map(line => {
            const values = []; let currentVal = ''; let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
                        currentVal += '"'; i++; continue;
                    }
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentVal.trim()); currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim());

            const entry = {};
            headers.forEach((header, i) => {
                let value = values[i] !== undefined && values[i] !== '' ? values[i] : "Dati mancanti";
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                
                const numericHeaders = [
                    'prezzo', 'prezzo_ui', 'unità_collegabili', // Questo è il N. MAX UI per UE
                    'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui',
                    'min_connessioni_ue'
                ];

                if (numericHeaders.includes(header)) {
                    let numStr = String(value).replace(/\.(?=.*\.)/g, ''); 
                    numStr = numStr.replace(',', '.');          
                    const num = parseFloat(numStr);
                    entry[header] = (value === "Dati mancanti" && isNaN(num)) ? "Dati mancanti" : (isNaN(num) ? 0 : num);
                } else {
                    entry[header] = value;
                }
            });
            return entry;
        });
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        // outdoorUnits
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
                brandId: brandId,
                modelCode: ue_csv.codice_prod || "Dati mancanti",
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

        // indoorUnits
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
        console.log("Dati processati UE:", APP_DATA.outdoorUnits);
        console.log("Dati processati UI:", APP_DATA.indoorUnits);
    }

    function updateStepIndicator() {
        const stepIndicatorItemsHTML = document.querySelectorAll('.step-indicator .step-item'); // Rileggi dal DOM ogni volta
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];

        stepIndicatorItemsHTML.forEach((item, index) => {
            const displayStepNum = index + 1; // Numero step visivo (1-based)
            
            // Se ci sono 6 items nell'HTML ma solo 5 logici, gestisci quello in più
            if (displayStepNum === 2 && stepItemsHTML.length === 6) { // Il vecchio "Serie" (secondo elemento HTML)
                item.style.display = 'none'; // Nascondilo
                if (stepLinesHTML[0]) stepLinesHTML[0].style.display = 'none'; // Nascondi la linea prima
                return; // Salta questo item
            }
            // Aggiusta l'indice per i successivi se abbiamo saltato il secondo item HTML
            let logicalDisplayNumForCurrentItem = displayStepNum;
            if(stepItemsHTML.length === 6 && displayStepNum > 2) {
                logicalDisplayNumForCurrentItem = displayStepNum -1;
            }
            if (logicalDisplayNumForCurrentItem > TOTAL_LOGICAL_STEPS) {
                item.style.display = 'none'; // Nascondi items extra se l'HTML ne ha di più dei logici
                if (stepLinesHTML[index-1]) stepLinesHTML[index-1].style.display = 'none';
                return;
            }

            item.dataset.step = logicalDisplayNumForCurrentItem; // Assicurati che il data-step sia logico
            const nameEl = item.querySelector('.step-name');
            if(nameEl) nameEl.textContent = stepNamesNewFlow[logicalDisplayNumForCurrentItem-1] || `Passo ${logicalDisplayNumForCurrentItem}`;
            
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot');
            dot.classList.remove('active', 'completed');
            
            if (logicalDisplayNumForCurrentItem < currentLogicalStep) { item.classList.add('completed'); dot.classList.add('completed'); }
            else if (logicalDisplayNumForCurrentItem === currentLogicalStep) { item.classList.add('active'); dot.classList.add('active'); }
            if (logicalDisplayNumForCurrentItem > highestLogicalStepCompleted + 1 && logicalDisplayNumForCurrentItem !== currentLogicalStep && logicalDisplayNumForCurrentItem !== 1) item.classList.add('disabled');
        });

        // Gestione linee: devono essere visibili solo quelle tra step visibili
        stepLinesHTML.forEach((line, index) => {
            // index della linea: 0 (tra 1 e 2 HTML), 1 (tra 2 e 3 HTML) etc.
            line.classList.remove('active');
            if (stepItemsHTML.length === 6 && index === 0) { // linea tra Marca e il "Serie" nascosto
                 line.style.display = 'none'; // Nascondi
                 return;
            }
            // Gli indicatori di step logici ora sono 1, 2, 3, 4, 5
            // La linea `index` (delle 4 visibili) connette lo step logico `index+1` a `index+2`
            // quindi la linea `index` è attiva se lo step `index+1` è completato.
            const previousVisibleStepIndexInHtmlArray = (stepItemsHTML.length === 6 && index >= 1) ? index+1 : index;

            if(stepItemsHTML[previousVisibleStepIndexInHtmlArray]?.classList.contains('completed') || currentLogicalStep > (index + (stepItemsHTML.length === 6 && index >=1 ? 1:0) +1 ) ){
                line.classList.add('active');
            }
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) return;
        const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
        if (!htmlContainerId) { console.error("ID HTML non trovato per step logico:", logicalStepNumber); return; }

        if (!fromDirectNavigation) highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        else if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1 && currentLogicalStep < logicalStepNumber) {
            if (logicalStepNumber === TOTAL_LOGICAL_STEPS && highestLogicalStepCompleted < TOTAL_LOGICAL_STEPS -1 ) return;
            else if (logicalStepNumber !== TOTAL_LOGICAL_STEPS) return;
        }

        stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) targetStepEl.classList.add('active-step');
        
        currentLogicalStep = logicalStepNumber;
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted && logicalStepNumber < TOTAL_LOGICAL_STEPS) {
             clearFutureSelections(logicalStepNumber -1, true);
        }
        updateStepIndicator();
        window.scrollTo(0, 0);
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
        else { configTypeSelectionDiv.innerHTML = '<p>Scegli Marca.</p>'; outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>'; }
        
        if (selections.configType && selections.brand) populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedLogical === 1);
        else if(selections.brand) { outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Config.</p>'; indoorUnitsSelectionArea.innerHTML = '<p>...</p>'; }
        
        if (selections.outdoorUnit && selections.configType && selections.brand) populateIndoorUnitSelectors(preserveCurrentLevelSelections && stepJustCompletedLogical === 2);
        else if (selections.configType) indoorUnitsSelectionArea.innerHTML = '<p>Scegli Unità Esterna.</p>';

        if (stepJustCompletedLogical < TOTAL_LOGICAL_STEPS - 1) summaryDiv.innerHTML = ''; // -1 perché l'ultimo step è riepilogo
        if (!preserveCurrentLevelSelections) highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        
        // Dopo aver pulito e ripopolato, check per UI solo se siamo nello step UI o precedente
        if(currentLogicalStep <= 4) checkAllIndoorUnitsSelected(); // 4 è lo step UI
        updateStepIndicator();
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
            logoImg.onerror = () => { logoImg.style.display = 'none'; nameSpan.style.display = 'block'; };
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
        card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected');
        card.dataset.unitId = unit.id;
        const img = document.createElement('img');
        img.src = unit.image || 'img/ue_placeholder.png'; img.alt = unit.name;
        img.classList.add('unit-image'); img.onerror = () => { img.src = 'img/ue_placeholder.png'; };
        card.appendChild(img);
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
        const brandsToShow = APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id));
        if (brandsToShow.length === 0) {
            brandSelectionDiv.innerHTML = '<p>Nessuna marca con unità esterne disponibili.</p>'; return;
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
        if(selections.brand) populateConfigTypes(true);
    }

    function populateConfigTypes(restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) { configTypeSelectionDiv.innerHTML = '<p>Scegli una marca.</p>'; if(restoring) selections.configType = null; return; }

        const validConfigs = Object.entries(APP_DATA.configTypes).map(([id, data]) => ({ id, ...data }))
            .filter(config => APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= config.numUnits && ue.minConnections <= config.numUnits));
        if(validConfigs.length === 0) {
            configTypeSelectionDiv.innerHTML = `<p>Nessuna configurazione (Dual, etc.) per ${selections.brand.name}.</p>`;
            if (restoring) selections.configType = null; return;
        }
        validConfigs.forEach(item => {
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig);
                selections.configType = selectedConfig;
                if (configHasChanged) { clearFutureSelections(1, false); highestLogicalStepCompleted = 1; }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                if (APP_DATA.outdoorUnits.some(ue => ue.brandId === selections.brand.id && ue.connections >= selectedConfig.numUnits && ue.minConnections <= selectedConfig.numUnits)) {
                    showStep(3);
                }
            }, selections.configType && selections.configType.id === item.id));
        });
        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) populateOutdoorUnits(true);
        else if (restoring && selections.configType) selections.configType = null;
    }
    
    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType) { outdoorUnitSelectionDiv.innerHTML = '<p>...</p>'; if(restoring) selections.outdoorUnit = null; return; }
        const numRequiredConnections = selections.configType.numUnits;
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue =>
            ue.brandId === selections.brand.id &&
            ue.connections >= numRequiredConnections && ue.minConnections <= numRequiredConnections
        );
        if (compatibleUEs.length === 0) {
            outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna UE ${selections.brand.name} per ${selections.configType.name}.</p>`;
            if(restoring) selections.outdoorUnit = null; return;
        }
        compatibleUEs.forEach(ue => {
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                const ueHasChanged = ueChanged(selections.outdoorUnit, selectedUE);
                selections.outdoorUnit = selectedUE;
                 if (ueHasChanged) { clearFutureSelections(2, false); highestLogicalStepCompleted = 2; }
                populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0); // Preparare lo step successivo
                if (selections.configType.numUnits === 0) { // Config senza UI
                    highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3);
                    generateSummary(); showStep(5); // Vai diretto a riepilogo (step logico 5)
                } else { showStep(4); } // Vai a UI (step logico 4)
                checkAllIndoorUnitsSelected();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });
        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) populateIndoorUnitSelectors(true);
        else if (restoring && selections.outdoorUnit) selections.outdoorUnit = null;
    }
    
    function populateIndoorUnitSelectors(restoring = false) {
        indoorUnitsSelectionArea.innerHTML = ''; // Questo è per lo step 4 logico (div HTML step-5)
        if (!selections.outdoorUnit || !selections.configType || !selections.brand) {
            indoorUnitsSelectionArea.innerHTML = `<p>Selezioni precedenti mancanti.</p>`; checkAllIndoorUnitsSelected(); return;
        }
        if (selections.configType.numUnits === 0) { checkAllIndoorUnitsSelected(); return; } // Niente da popolare

        let indoorUnitsAreValidForRestore = restoring && selections.indoorUnits.length === selections.configType.numUnits &&
                                            selections.indoorUnits.every(ui => ui === null || (ui && ui.brandId === selections.brand.id));
        if (!indoorUnitsAreValidForRestore) selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);

        const compatibleIndoorSeriesIdsForUE = selections.outdoorUnit.compatibleIndoorSeriesIds || [];
        const availableIndoorUnits = APP_DATA.indoorUnits.filter(ui =>
            ui.brandId === selections.brand.id && compatibleIndoorSeriesIdsForUE.includes(ui.seriesId)
        );
        
        if (availableIndoorUnits.length === 0 && selections.configType.numUnits > 0) {
            indoorUnitsSelectionArea.innerHTML = `<p>Nessuna Unità Interna compatibile trovata per l'Unità Esterna selezionata.</p>`;
            checkAllIndoorUnitsSelected(); return;
        }

        for (let i = 0; i < selections.configType.numUnits; i++) { /* ... Logica per creare select e options come prima ... */ }
        checkAllIndoorUnitsSelected();
    }

    function checkAllIndoorUnitsSelected() {
        let allSelected = false;
        if (selections.configType && selections.configType.numUnits === 0) allSelected = true;
        else if (selections.configType && selections.indoorUnits.length === selections.configType.numUnits) {
            allSelected = selections.indoorUnits.every(ui => ui !== null);
        }
        if(finalizeBtn) finalizeBtn.disabled = !allSelected;
        if(allSelected) {
             highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); // Marca lo step corrente UI come completo se tutte UI ok
        }
        updateStepIndicator();
    }

    function generateSummary() { /* ... Logica come prima (assicurati che usi APP_DATA.uiSeriesImageMapping) ... */ }
    
    // Event Listeners per Navigazione (aggiornati per il flusso logico)
    stepIndicatorItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return;
            const targetLogicalStep = parseInt(item.dataset.step); // ASSUME che data-step ora sia 1-5
            if (!targetLogicalStep || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return;

            if (targetLogicalStep === TOTAL_LOGICAL_STEPS) {
                 if (!finalizeBtn || finalizeBtn.disabled) { // Non si può andare a riepilogo se UI non ok
                     alert("Completa prima la selezione delle unità interne."); return;
                 }
                 generateSummary(); 
            }
            showStep(targetLogicalStep, true); 
        });
    });

    if(finalizeBtn) { 
        finalizeBtn.addEventListener('click', () => { 
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); // Step 4 (UI) è completato
            generateSummary(); 
            showStep(5); // Vai a Riepilogo (Step 5)
        }); 
    }

    document.querySelectorAll('.prev-btn').forEach(button => {
        const currentStepHtmlContainerId = button.closest('.config-step').id;
        let prevLogicalStep = HTML_TO_LOGICAL_STEP_MAP[currentStepHtmlContainerId] - 1;
        if(prevLogicalStep && prevLogicalStep >= 1) {
            button.addEventListener('click', () => { showStep(prevLogicalStep, true); });
        } else button.style.display = 'none';
    });
    
    document.getElementById('reset-config-btn')?.addEventListener('click', () => {
        highestLogicalStepCompleted = 0;
        clearFutureSelections(-1, false); // -1 per indicare reset da prima della marca
        showStep(1);
    });
    document.getElementById('print-summary-btn')?.addEventListener('click', () => window.print() );
    document.getElementById('print-list')?.addEventListener('click', () => {
        if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML.includes("Prezzo Totale")) window.print();
        else alert("Completa la configurazione e vai al riepilogo per stampare.");
    });

    async function initializeApp() {
        document.body.appendChild(loadingOverlay);
        const [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([
            fetchCSVData(CSV_URLS.outdoorUnits), fetchCSVData(CSV_URLS.indoorUnits)
        ]);
        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        
        // Nascondi il vecchio Step 2 HTML (Selezione Modello/Serie) perché non più usato
        const oldModelSerieStepHtmlContainer = document.getElementById('step-2');
        if (oldModelSerieStepHtmlContainer) oldModelSerieStepHtmlContainer.style.display = 'none';
        
        // ASSICURATI che il tuo HTML .step-indicator sia stato aggiornato a 5 items con data-step 1-5
        // e 4 linee. Se ha ancora 6 items, il codice in updateStepIndicator() cercherà di gestirlo.
        
        populateBrands();
        if (brandSelectionDiv.innerHTML.includes("Nessuna marca")) {
             loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Nessuna marca valida.</span>`;
             return; 
        } else loadingOverlay.style.display = 'none';
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        showStep(1); 
        updateStepIndicator(); // Chiama dopo lo showStep iniziale per lo stato corretto.
    }

    initializeApp();
});
