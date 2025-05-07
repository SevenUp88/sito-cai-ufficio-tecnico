document.addEventListener('DOMContentLoaded', async () => {
    const CSV_URLS = {
        outdoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1116648252&single=true&output=csv',
        indoorUnits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7adRsTXVEHY2zeVqHmlYj1n259pWbMxE1I9ihp1DKmOtlHH135ZxC5xLeF2xn_EKaNcZB0NpLbBX5/pub?gid=1846948703&single=true&output=csv'
    };

    const STATIC_DATA = { // Per ora, brand/serie/config sono statici. UE/UI da CSV.
        brands: [
            { id: "daikin", name: "Daikin" }, { id: "mitsubishi", name: "Mitsubishi Electric" },
            { id: "hitachi", name: "Hitachi" }, { id: "toshiba", name: "Toshiba" }, { id: "haier", name: "Haier" }
        ],
        series: {
            "daikin": [
                { id: "perfera_multi", name: "Perfera", compatibleConfigs: ["dual", "trial", "quadri"], uiImageRef: "perfera" },
                { id: "stylish_multi", name: "Stylish", compatibleConfigs: ["dual", "trial"], uiImageRef: "stylish" }
            ],
            "mitsubishi": [
                { id: "msz_ap_multi", name: "MSZ-AP", compatibleConfigs: ["dual", "trial", "quadri", "penta"], uiImageRef: "mszap" },
                { id: "msz_ln_multi", name: "MSZ-LN (Kirigamine Style)", compatibleConfigs: ["dual", "trial", "quadri"], uiImageRef: "kirigamine_style"}
            ],
            "hitachi": [ // Aggiorna 'id' se il CSV UE usa un id_serie_ue diverso per hitachi
                { id: "performance_multi", name: "Performance", compatibleConfigs: ["dual", "trial"], uiImageRef: "hitachi_performance" } 
            ],
            "toshiba": [ // Aggiorna 'id' se il CSV UE usa un id_serie_ue diverso per toshiba
                { id: "shorai_edge_multi", name: "Shorai Edge", compatibleConfigs: ["dual", "trial"], uiImageRef: "toshiba_shorai" } 
            ],
            "haier": [
                { id: "expert_multi", name: "Expert", compatibleConfigs: ["dual", "trial", "quadri"], uiImageRef: "expert" }
            ]
        },
        configTypes: {
            "dual": { name: "Dual Split (2 UI)", numUnits: 2 },
            "trial": { name: "Trial Split (3 UI)", numUnits: 3 },
            "quadri": { name: "Quadri Split (Poker)", numUnits: 4 },
            "penta": { name: "Penta Split (5 UI)", numUnits: 5 },
            "esa": { name: "Esa Split (6 UI)", numUnits: 6 }
        },
        outdoorUnits: [],
        indoorUnits: []
    };

    let currentStep = 1;
    let highestStepCompleted = 0;
    const selections = {
        brand: null, series: null, configType: null, outdoorUnit: null, indoorUnits: []
    };

    const brandSelectionDiv = document.getElementById('brand-selection');
    const modelSelectionDiv = document.getElementById('model-selection');
    const configTypeSelectionDiv = document.getElementById('config-type-selection');
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection');
    const indoorUnitsSelectionArea = document.getElementById('indoor-units-selection-area');
    const summaryDiv = document.getElementById('config-summary');
    const finalizeBtn = document.getElementById('finalize-btn');
    const pageControlsTitle = document.querySelector('.page-controls h1');
    const summaryMainTitle = document.getElementById('summary-main-title');
    const steps = document.querySelectorAll('.config-step');
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background-color: rgba(255,255,255,0.9); display: flex; 
        justify-content: center; align-items: center; font-size: 1.2em; 
        color: var(--primary-color); z-index: 2000; text-align: center; padding: 20px; box-sizing: border-box;`;
    loadingOverlay.textContent = 'Caricamento dati climatizzatori... Attendere prego.';


    async function fetchCSVData(url) {
        try {
            const response = await fetch(url + `&v=${new Date().getTime()}`); // Cache busting
            if (!response.ok) throw new Error(`Errore HTTP ${response.status} su ${url}`);
            return parseCSV(await response.text());
        } catch (error) {
            console.error("Errore fetchCSVData:", error);
            loadingOverlay.innerHTML += `<br><span style="color:red; font-size:0.8em;">Errore caricando ${url}. Controllare la console.</span>`;
            return [];
        }
    }

    function parseCSV(text) {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '')); // Sanitize headers
        
        return lines.slice(1).map(line => {
            // Gestione semplice di CSV con stringhe quotate che potrebbero contenere virgole
            const values = [];
            let currentVal = '';
            let inQuotes = false;
            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentVal.trim());
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim()); // Aggiungi l'ultimo valore


            const entry = {};
            headers.forEach((header, i) => {
                const value = values[i] !== undefined && values[i] !== '' ? values[i] : "Dati mancanti";
                if (['prezzo_listino_ue', 'prezzo_listino_ui', 'potenza_btu_freddo_ue', 'potenza_btu_caldo_ue', 'potenza_btu_ui', 'numero_connessioni_ue', 'min_connessioni_ue'].includes(header)) {
                    const num = parseFloat(String(value).replace('.', '').replace(',', '.')); // Gestisce . come migliaia e , come decimale (tipico IT)
                    entry[header] = isNaN(num) ? (value === "Dati mancanti" ? value : 0) : num;
                } else {
                    entry[header] = value;
                }
            });
            return entry;
        });
    }
    
    function processLoadedData(loadedOutdoorUnits, loadedIndoorUnits) {
        STATIC_DATA.outdoorUnits = loadedOutdoorUnits.map(ue => {
            const brandId = ue.id_marca ? String(ue.id_marca).toLowerCase() : "dati_mancanti_marca";
            const seriesId = ue.id_serie_ue ? String(ue.id_serie_ue).toLowerCase() : "dati_mancanti_serie_ue";
            
            // Processa la nuova colonna compatibleindoorseriesids
            let compatibleIds = [];
            if (ue.compatibleindoorseriesids && ue.compatibleindoorseriesids !== "Dati mancanti") {
                compatibleIds = ue.compatibleindoorseriesids.split(';').map(id => id.trim().toLowerCase()).filter(id => id);
            }
            // Se compatibleIds è vuoto dopo il parsing, potremmo usare un fallback, ma con la colonna non dovrebbe servire.
            // Se ancora vuoto e serve un fallback, potresti aggiungerlo qui, ma è meglio avere dati buoni.

            return {
                id: ue.id_unita_esterna || `ue_csv_${Math.random().toString(36).substr(2, 5)}`,
                brandId: brandId,
                seriesId: seriesId,
                modelCode: ue.codice_modello_ue || "Dati mancanti",
                name: ue.nome_modello_ue || `Unità Esterna (${seriesId})`,
                connections: parseInt(ue.numero_connessioni_ue) || 0,
                minConnections: parseInt(ue.min_connessioni_ue) || 1,
                capacityCoolingBTU: ue.potenza_btu_freddo_ue, // già parsato a numero
                capacityHeatingBTU: ue.potenza_btu_caldo_ue, // già parsato
                price: ue.prezzo_listino_ue, // già parsato
                image: ue.percorso_immagine_ue && ue.percorso_immagine_ue !== "Dati mancanti" ? ue.percorso_immagine_ue : 'img/ue_placeholder.png',
                dimensions: ue.dimensioni_lxaxp_ue || "Dati mancanti",
                compatibleIndoorSeriesIds: compatibleIds.length > 0 ? compatibleIds : [`fallback_no_compat_ids_for_ue_${seriesId}`] // Usa array vuoto o fallback se la colonna è vuota
            };
        });

        STATIC_DATA.indoorUnits = loadedIndoorUnits.map(ui => {
            const brandId = ui.id_marca ? String(ui.id_marca).toLowerCase() : "dati_mancanti_marca";
            const seriesId = ui.id_serie_ui ? String(ui.id_serie_ui).toLowerCase() : "dati_mancanti_serie_ui";
            let imageName = seriesId.replace('_ui', ''); // Tenta di derivare nome immagine da seriesId

            return {
                id: ui.id_unita_interna || `ui_csv_${Math.random().toString(36).substr(2, 5)}`,
                brandId: brandId,
                seriesId: seriesId,
                modelCode: ui.codice_modello_ui || "Dati mancanti",
                name: ui.nome_modello_ui || `Unità Interna (${seriesId})`,
                type: ui.tipologia_ui || "Parete",
                capacityBTU: ui.potenza_btu_ui, // già parsato
                price: ui.prezzo_listino_ui, // già parsato
                image: ui.percorso_immagine_ui && ui.percorso_immagine_ui !== "Dati mancanti" ? ui.percorso_immagine_ui : `img/${imageName}.png`,
                dimensions: ui.dimensioni_lxaxp_ui || "Dati mancanti"
            };
        });

        // Consistenza: assicurati che ogni seriesId in STATIC_DATA.series esista e abbia i dati UE corrispondenti
        for (const brandKey in STATIC_DATA.series) {
            STATIC_DATA.series[brandKey] = STATIC_DATA.series[brandKey].filter(serieDef => {
                const ueExistsForSeries = STATIC_DATA.outdoorUnits.some(ue => ue.brandId === brandKey && ue.seriesId === serieDef.id);
                if (!ueExistsForSeries) {
                    console.warn(`La serie statica ${brandKey}/${serieDef.id} non ha Unità Esterne corrispondenti dai CSV. Verrà rimossa.`);
                }
                return ueExistsForSeries;
            });
            if (STATIC_DATA.series[brandKey].length === 0) {
                console.warn(`La marca ${brandKey} non ha più serie valide dopo il controllo con i dati CSV UE. La marca potrebbe non funzionare correttamente.`);
                // Potresti decidere di rimuovere la marca da STATIC_DATA.brands se non ha serie.
            }
        }
        console.log("Dati processati UE:", STATIC_DATA.outdoorUnits);
        console.log("Dati processati UI:", STATIC_DATA.indoorUnits);
        console.log("Serie Multi valide dopo processamento:", STATIC_DATA.series);

    }
    
    // --- Inizio Blocco Codice Precedente (con MOCK_DATA -> STATIC_DATA) ---
    // Assicurati che il codice qui sotto utilizzi STATIC_DATA invece di MOCK_DATA per brands, series, ecc.

    function updateStepIndicator() {
        stepIndicatorItems.forEach(item => {
            const stepNum = parseInt(item.dataset.step);
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot');
            dot.classList.remove('active', 'completed');
            if (stepNum < currentStep) {
                item.classList.add('completed');
                dot.classList.add('completed');
            } else if (stepNum === currentStep) {
                item.classList.add('active');
                dot.classList.add('active');
            }
            if (stepNum > highestStepCompleted + 1 && stepNum !== currentStep && stepNum !== 1) {
                 item.classList.add('disabled');
            }
        });
        document.querySelectorAll('.step-line').forEach((line, index) => {
            line.classList.remove('active');
            const prevStepItem = stepIndicatorItems[index]; 
            if (prevStepItem && prevStepItem.classList.contains('completed')) {
                 line.classList.add('active');
            } else if (currentStep > index + 1) { 
                 line.classList.add('active');
            }
        });
    }

    function showStep(stepNumber, fromDirectNavigation = false) {
        if (!fromDirectNavigation) {
            highestStepCompleted = Math.max(highestStepCompleted, currentStep - 1);
        } else {
             if (stepNumber > highestStepCompleted + 1 && stepNumber !== 1 && currentStep < stepNumber ) { 
                if (stepNumber === 6 && highestStepCompleted < 5) {
                     return;
                } else if (stepNumber !== 6) {
                     return;
                }
            }
        }
        steps.forEach(step => step.classList.remove('active-step'));
        const targetStepEl = document.getElementById(`step-${stepNumber}`);
        if (targetStepEl) {
            targetStepEl.classList.add('active-step');
        }
        currentStep = stepNumber;
        if (fromDirectNavigation && stepNumber < highestStepCompleted + 1 && stepNumber < 6) { 
             clearFutureSelections(stepNumber -1, true); 
        }
        updateStepIndicator();
        window.scrollTo(0, 0);
    }
    
    function clearFutureSelections(stepJustCompletedCurrentLevel, preserveCurrentLevelSelections = false) {
        const prevBrand = selections.brand;
        const prevSeries = selections.series;
        const prevConfig = selections.configType;
        const prevUE = selections.outdoorUnit;

        if (preserveCurrentLevelSelections) {
            if (stepJustCompletedCurrentLevel < 1) selections.series = null; 
            if (stepJustCompletedCurrentLevel < 2) selections.configType = null;
            if (stepJustCompletedCurrentLevel < 3) selections.outdoorUnit = null;
            if (stepJustCompletedCurrentLevel < 4) selections.indoorUnits = [];
        } else { 
            if (stepJustCompletedCurrentLevel < 1) selections.brand = null;
            if (stepJustCompletedCurrentLevel < 2) selections.series = null;
            if (stepJustCompletedCurrentLevel < 3) selections.configType = null;
            if (stepJustCompletedCurrentLevel < 4) selections.outdoorUnit = null;
            if (stepJustCompletedCurrentLevel < 5) selections.indoorUnits = [];
        }
        
        const repopulateModelsFlag = (preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 0 && selections.brand) || 
                                   (!preserveCurrentLevelSelections && selections.brand);
        const repopulateConfigsFlag = (preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 1 && selections.series && selections.brand) ||
                                     (!preserveCurrentLevelSelections && selections.series && selections.brand);
        const repopulateUEsFlag = (preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 2 && selections.configType && selections.series && selections.brand) ||
                                  (!preserveCurrentLevelSelections && selections.configType && selections.series && selections.brand);
        const repopulateUIsFlag = (preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 3 && selections.outdoorUnit && selections.configType && selections.series && selections.brand) ||
                                 (!preserveCurrentLevelSelections && selections.outdoorUnit && selections.configType && selections.series && selections.brand);

        if (selections.brand) {
             if (brandChanged(prevBrand, selections.brand) || repopulateModelsFlag || !preserveCurrentLevelSelections && stepJustCompletedCurrentLevel < 1 ) populateModels(selections.brand.id, preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 1 && !brandChanged(prevBrand, selections.brand));
        } else {
            modelSelectionDiv.innerHTML = '<p>Seleziona prima una marca.</p>';
            configTypeSelectionDiv.innerHTML = '<p>Seleziona prima una serie.</p>';
            outdoorUnitSelectionDiv.innerHTML = '<p>Seleziona prima una configurazione.</p>';
            indoorUnitsSelectionArea.innerHTML = '<p>Seleziona prima un\'unità esterna.</p>';
        }

        if (selections.series && selections.brand) {
             if (seriesChanged(prevSeries, selections.series) || repopulateConfigsFlag || !preserveCurrentLevelSelections && stepJustCompletedCurrentLevel < 2) populateConfigTypes(selections.series.compatibleConfigs, preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 2 && !seriesChanged(prevSeries, selections.series));
        } else if (selections.brand) {
             configTypeSelectionDiv.innerHTML = '<p>Seleziona prima una serie.</p>';
             outdoorUnitSelectionDiv.innerHTML = '<p>Seleziona prima una configurazione.</p>';
             indoorUnitsSelectionArea.innerHTML = '<p>Seleziona prima un\'unità esterna.</p>';
        }
        
        if (selections.configType && selections.series && selections.brand) {
             if (configChanged(prevConfig, selections.configType) || repopulateUEsFlag || !preserveCurrentLevelSelections && stepJustCompletedCurrentLevel < 3) populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 3 && !configChanged(prevConfig, selections.configType));
        } else if (selections.series) {
             outdoorUnitSelectionDiv.innerHTML = '<p>Seleziona prima una configurazione.</p>';
             indoorUnitsSelectionArea.innerHTML = '<p>Seleziona prima un\'unità esterna.</p>';
        }

        if (selections.outdoorUnit && selections.configType && selections.brand && selections.series) {
            if(ueChanged(prevUE, selections.outdoorUnit) || repopulateUIsFlag || !preserveCurrentLevelSelections && stepJustCompletedCurrentLevel < 4) populateIndoorUnitSelectors(preserveCurrentLevelSelections && stepJustCompletedCurrentLevel === 4 && !ueChanged(prevUE, selections.outdoorUnit));
        } else if (selections.configType) {
             indoorUnitsSelectionArea.innerHTML = '<p>Seleziona prima un\'unità esterna.</p>';
        }

        if (stepJustCompletedCurrentLevel < 5) summaryDiv.innerHTML = '';
        
        if (!preserveCurrentLevelSelections) { 
            highestStepCompleted = Math.min(highestStepCompleted, stepJustCompletedCurrentLevel);
        }
        
        checkAllIndoorUnitsSelected(); 
        updateStepIndicator();
    }
    const brandChanged = (prev, current) => (!prev && current) || (prev && !current) || (prev && current && prev.id !== current.id);
    const seriesChanged = (prev, current) => (!prev && current) || (prev && !current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && !current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && !current) || (prev && current && prev.id !== current.id);

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected');
        itemDiv.dataset[type + 'Id'] = item.id;
        let logoMarcaSrc = '';
        let logoMarcaAlt = '';
        let displayName = item.name;
        if (type === 'model') { 
            displayName = String(displayName).replace(/\sMulti\s*$/i, '').replace(/\s*Multi\s+/i, ' ').trim();
        }
        const nameSpan = document.createElement('span');
        nameSpan.textContent = displayName;

        if (type === 'brand') {
            logoMarcaSrc = `img/logos/${item.id}.png`;
            logoMarcaAlt = `${item.name} Logo`;
        } else if (type === 'model' && selections.brand) { 
            logoMarcaSrc = `img/logos/${selections.brand.id}.png`; 
            logoMarcaAlt = `${selections.brand.name} Logo`;
        }
        if (logoMarcaSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoMarcaSrc;
            logoImg.alt = logoMarcaAlt;
            logoImg.classList.add(type === 'brand' ? 'brand-logo' : 'series-logo'); 
            logoImg.onload = () => { if (type === 'brand') nameSpan.style.display = 'none'; };
            logoImg.onerror = () => { logoImg.style.display = 'none'; if (type === 'brand') nameSpan.style.display = 'block';};
            itemDiv.appendChild(logoImg);
        }
        if (type === 'model' && item.uiImageRef) {
            const uiImg = document.createElement('img');
            uiImg.src = `img/${item.uiImageRef}.png`;
            uiImg.alt = `${item.name} Unità Interna`;
            uiImg.classList.add('series-ui-image');
            uiImg.onerror = () => { uiImg.style.display = 'none'; };
            itemDiv.appendChild(uiImg);
        }
        itemDiv.appendChild(nameSpan);
        if (type === 'brand') nameSpan.style.display = logoMarcaSrc ? 'none' : 'block'; 
        else nameSpan.style.display = 'block';

        itemDiv.addEventListener('click', () => {
            const parentGrid = itemDiv.parentElement;
            if (parentGrid) parentGrid.querySelectorAll('.selection-item, .unit-selection-card').forEach(el => el.classList.remove('selected'));
            itemDiv.classList.add('selected');
            highestStepCompleted = Math.max(highestStepCompleted, currentStep); 
            clickHandler(item);
        });
        return itemDiv;
    }
    
    function populateBrands(){ 
        brandSelectionDiv.innerHTML = '';
        STATIC_DATA.brands.forEach(brand => { 
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand);
                selections.brand = selectedBrand;
                if (brandHasChanged) {
                     clearFutureSelections(0, false); 
                     highestStepCompleted = 0; 
                }
                populateModels(selectedBrand.id, !brandHasChanged && !!selections.series); 
                const modelsForBrand = STATIC_DATA.series[selectedBrand.id] || [];
                if (modelsForBrand.length > 0) showStep(2);
                updateStepIndicator();
            }, selections.brand && selections.brand.id === brand.id));
        });
        if(selections.brand) populateModels(selections.brand.id, true);
    }

    function populateModels(brandId, restoring = false) {
        modelSelectionDiv.innerHTML = ''; 
        const modelsForThisBrand = STATIC_DATA.series[brandId] || [];
        if (modelsForThisBrand.length === 0) {
            modelSelectionDiv.innerHTML = '<p>Nessuna serie disponibile per questa marca.</p>';
            if (restoring) selections.series = null; 
            return;
        }
        modelsForThisBrand.forEach(model => {
            const seriesItem = {...model, brandId: brandId}; 
            modelSelectionDiv.appendChild(createSelectionItem(seriesItem, 'model', (selectedSeries) => {
                const seriesHasChanged = seriesChanged(selections.series, selectedSeries);
                selections.series = selectedSeries; 
                 if (seriesHasChanged) {
                    clearFutureSelections(1, false); 
                    highestStepCompleted = 1;
                }
                populateConfigTypes(selectedSeries.compatibleConfigs, !seriesHasChanged && !!selections.configType);
                if (selectedSeries.compatibleConfigs.length > 0) showStep(3);
                updateStepIndicator();
            }, selections.series && selections.series.id === model.id));
        });
        if(restoring && selections.series && selections.series.brandId === brandId) populateConfigTypes(selections.series.compatibleConfigs, true);
        else if (restoring && selections.series && selections.series.brandId !== brandId) selections.series = null;
    }

    function populateConfigTypes(compatibleConfigIds, restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.series) { 
             configTypeSelectionDiv.innerHTML = '<p>Seleziona prima una serie.</p>';
             if (restoring) selections.configType = null;
             return;
        }
        if (!compatibleConfigIds || compatibleConfigIds.length === 0) {
             configTypeSelectionDiv.innerHTML = '<p>Nessuna configurazione compatibile.</p>'; 
             if (restoring) selections.configType = null;
             return;
        }
        const validConfigs = compatibleConfigIds
            .map(configId => STATIC_DATA.configTypes[configId] ? { id: configId, name: STATIC_DATA.configTypes[configId].name, numUnits: STATIC_DATA.configTypes[configId].numUnits } : null)
            .filter(Boolean);
        if(validConfigs.length === 0) {
            configTypeSelectionDiv.innerHTML = '<p>Nessuna configurazione valida.</p>'; 
            if (restoring) selections.configType = null;
            return;
        }
        validConfigs.forEach(item => {
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig);
                selections.configType = selectedConfig;
                if (configHasChanged) {
                    clearFutureSelections(2, false); 
                    highestStepCompleted = 2;
                }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                const compatibleUEs = STATIC_DATA.outdoorUnits.filter(ue => ue.brandId === selections.brand?.id && ue.seriesId === selections.series?.id && ue.connections >= selections.configType?.numUnits && ue.minConnections <= selections.configType?.numUnits);
                if (compatibleUEs.length > 0) showStep(4);
                updateStepIndicator();
            }, selections.configType && selections.configType.id === item.id));
        });
        if(restoring && selections.configType && selections.series && selections.series.compatibleConfigs?.includes(selections.configType.id)) populateOutdoorUnits(true);
        else if (restoring && selections.configType) selections.configType = null; 
    }
    
    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.series || !selections.configType) {
            outdoorUnitSelectionDiv.innerHTML = '<p>Info mancanti.</p>'; 
            if(restoring) selections.outdoorUnit = null;
            return;
        }
        const numRequiredConnections = selections.configType.numUnits;
        const compatibleUEs = STATIC_DATA.outdoorUnits.filter(ue =>
            ue.brandId === selections.brand.id &&
            ue.seriesId === selections.series.id && 
            ue.connections >= numRequiredConnections &&
            ue.minConnections <= numRequiredConnections 
        );
        if (compatibleUEs.length === 0) {
            outdoorUnitSelectionDiv.innerHTML = '<p>Nessuna UE compatibile.</p>'; 
            if(restoring) selections.outdoorUnit = null;
            return;
        }
        compatibleUEs.forEach(ue => {
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                const ueHasChanged = ueChanged(selections.outdoorUnit, selectedUE);
                selections.outdoorUnit = selectedUE;
                 if (ueHasChanged) {
                    clearFutureSelections(3, false); 
                    highestStepCompleted = 3;
                }
                populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0);
                if(selections.outdoorUnit?.compatibleIndoorSeriesIds && STATIC_DATA.indoorUnits.some(ui => ui.brandId === selections.brand.id && selections.outdoorUnit.compatibleIndoorSeriesIds.includes(ui.seriesId)) && selections.configType.numUnits > 0) {
                     showStep(5);
                } else if (selections.configType.numUnits === 0) { 
                    highestStepCompleted = Math.max(highestStepCompleted, 4); // Completo step 4
                    showStep(6); generateSummary();
                }
                checkAllIndoorUnitsSelected(); 
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });
         if(restoring && selections.outdoorUnit && STATIC_DATA.outdoorUnits.find(ue => ue.id === selections.outdoorUnit.id && ue.brandId === selections.brand?.id && ue.seriesId === selections.series?.id)) {
             populateIndoorUnitSelectors(true);
        } else if (restoring && selections.outdoorUnit) selections.outdoorUnit = null; 
    }

    function createUnitSelectionCard(unit, clickHandler, isSelected = false) {
        const card = document.createElement('div');
        card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected');
        card.dataset.unitId = unit.id;
        const img = document.createElement('img');
        img.src = unit.image || 'img/ue_placeholder.png';
        img.alt = unit.name;
        img.classList.add('unit-image');
        img.onerror = () => { img.src = 'img/ue_placeholder.png'; }
        card.appendChild(img);
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('unit-info');
        const nameH4 = document.createElement('h4');
        nameH4.textContent = unit.name;
        infoDiv.appendChild(nameH4);
        const modelP = document.createElement('p');
        modelP.innerHTML = `Modello: <strong>${unit.modelCode}</strong> | Max UI: ${unit.connections}`;
        infoDiv.appendChild(modelP);
        const capacityP = document.createElement('p');
        capacityP.textContent = `Freddo: ${unit.capacityCoolingBTU} BTU | Caldo: ${unit.capacityHeatingBTU} BTU`;
        infoDiv.appendChild(capacityP);
        const priceP = document.createElement('p');
        priceP.classList.add('unit-price');
        priceP.textContent = `Prezzo: ${typeof unit.price === 'number' ? unit.price.toFixed(2) : unit.price} €`;
        infoDiv.appendChild(priceP);
        card.appendChild(infoDiv);
        card.addEventListener('click', () => {
            const parentList = card.parentElement;
            if (parentList) parentList.querySelectorAll('.unit-selection-card').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            highestStepCompleted = Math.max(highestStepCompleted, currentStep);
            clickHandler(unit);
        });
        return card;
    }

    function populateIndoorUnitSelectors(restoring = false) {
        indoorUnitsSelectionArea.innerHTML = '';
        if (!selections.outdoorUnit || !selections.configType || !selections.brand) {
            indoorUnitsSelectionArea.innerHTML = `<p>Info mancanti.</p>`;
            checkAllIndoorUnitsSelected(); return;
        }
        let indoorUnitsAreValidForRestore = restoring && 
                                            selections.indoorUnits.length === selections.configType.numUnits &&
                                            selections.indoorUnits.every(ui => ui === null || (ui && ui.brandId === selections.brand.id));
        if (!indoorUnitsAreValidForRestore) selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);

        const compatibleIndoorSeriesIds = selections.outdoorUnit.compatibleIndoorSeriesIds || [];
        const availableIndoorUnits = STATIC_DATA.indoorUnits.filter(ui =>
            ui.brandId === selections.brand.id &&
            compatibleIndoorSeriesIds.includes(ui.seriesId)
        );
        if (availableIndoorUnits.length === 0 && selections.configType.numUnits > 0) {
            indoorUnitsSelectionArea.innerHTML = `<p>Nessuna UI compatibile con l'UE selezionata.</p>`;
            checkAllIndoorUnitsSelected(); return;
        }
         if (selections.configType.numUnits === 0) { 
            checkAllIndoorUnitsSelected(); return;
        }
        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('indoor-unit-slot');
            const label = document.createElement('label');
            label.htmlFor = `indoor-unit-select-${i}`;
            label.textContent = `Unità Interna ${i + 1}:`;
            slotDiv.appendChild(label);
            const select = document.createElement('select');
            select.id = `indoor-unit-select-${i}`;
            select.dataset.index = i;
            const placeholderOption = document.createElement('option');
            placeholderOption.value = ""; placeholderOption.textContent = "-- Seleziona UI --";
            select.appendChild(placeholderOption);
            availableIndoorUnits.forEach(ui => {
                const option = document.createElement('option');
                option.value = ui.id;
                option.textContent = `${ui.name} (${ui.capacityBTU} BTU) - ${typeof ui.price === 'number' ? ui.price.toFixed(2) : ui.price} €`;
                select.appendChild(option);
            });
            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('unit-details');
            if (indoorUnitsAreValidForRestore && selections.indoorUnits[i]) {
                const isStillAvailable = availableIndoorUnits.some(avail_ui => avail_ui.id === selections.indoorUnits[i].id);
                if (isStillAvailable) {
                    select.value = selections.indoorUnits[i].id;
                    detailsDiv.textContent = `Modello: ${selections.indoorUnits[i].modelCode}, Tipo: ${selections.indoorUnits[i].type}, Dimensioni: ${selections.indoorUnits[i].dimensions}`;
                } else selections.indoorUnits[i] = null; 
            }
            select.addEventListener('change', (e) => {
                const selectedId = e.target.value;
                const unitIndex = parseInt(e.target.dataset.index);
                if (selectedId) {
                    const selectedUI = STATIC_DATA.indoorUnits.find(ui => ui.id === selectedId);
                    selections.indoorUnits[unitIndex] = selectedUI;
                    detailsDiv.textContent = `Modello: ${selectedUI.modelCode}, Tipo: ${selectedUI.type}, Dimensioni: ${selectedUI.dimensions}`;
                } else {
                    selections.indoorUnits[unitIndex] = null;
                    detailsDiv.textContent = '';
                }
                checkAllIndoorUnitsSelected();
            });
            slotDiv.appendChild(select);
            slotDiv.appendChild(detailsDiv);
            indoorUnitsSelectionArea.appendChild(slotDiv);
        }
        checkAllIndoorUnitsSelected();
    }

    function checkAllIndoorUnitsSelected() {
        let allSelected = false;
        if (selections.configType && selections.indoorUnits.length === selections.configType.numUnits) {
            allSelected = selections.indoorUnits.every(ui => ui !== null);
        }
        if (selections.configType && selections.configType.numUnits === 0) allSelected = true;
        finalizeBtn.disabled = !allSelected;
        if(allSelected && selections.configType.numUnits > 0) highestStepCompleted = Math.max(highestStepCompleted, 5);
        else if (allSelected && selections.configType.numUnits === 0) highestStepCompleted = Math.max(highestStepCompleted, 4); 
        updateStepIndicator();
    }

    function generateSummary() {
        summaryDiv.innerHTML = ''; 
        let totalPrice = 0;
        const { brand, series, configType, outdoorUnit, indoorUnits } = selections;
        const allIndoorUnitsSelected = configType && indoorUnits.length === configType.numUnits && indoorUnits.every(ui => ui !== null);
        const zeroIndoorUnitsRequired = configType && configType.numUnits === 0;

        if (!brand || !series || !configType || !outdoorUnit || (!allIndoorUnitsSelected && !zeroIndoorUnitsRequired) ) {
            summaryDiv.innerHTML = '<p>Configurazione incompleta.</p>'; return;
        }
        const brandLogoPrint = document.createElement('img');
        brandLogoPrint.src = `img/logos/${brand.id}.png`;
        brandLogoPrint.alt = `${brand.name} Logo`;
        brandLogoPrint.classList.add('brand-logo-print'); 
        brandLogoPrint.onerror = function() { this.style.display = 'none'; };
        summaryDiv.appendChild(brandLogoPrint);
        let seriesDisplayName = String(series.name).replace(/\sMulti\s*$/i, '').replace(/\s*Multi\s+/i, ' ').trim();
        let summaryHTML = `
            <h3>Configurazione Scelta</h3>
            <div class="summary-item"><strong>Marca:</strong> ${brand.name}</div>
            <div class="summary-item"><strong>Serie:</strong> ${seriesDisplayName}</div>
            <div class="summary-item"><strong>Tipo Configurazione:</strong> ${configType.name}</div>
            <hr>
            <h3>Unità Esterna Selezionata</h3>
            <div class="summary-item"><strong>Modello:</strong> ${outdoorUnit.modelCode} (${outdoorUnit.name})</div>
            <div class="summary-item"><strong>Capacità (F/C):</strong> ${outdoorUnit.capacityCoolingBTU} BTU / ${outdoorUnit.capacityHeatingBTU} BTU</div>
            <div class="summary-item"><strong>Dimensioni:</strong> ${outdoorUnit.dimensions}</div>
            <div class="summary-item"><strong>Prezzo UE:</strong> ${typeof outdoorUnit.price === 'number' ? outdoorUnit.price.toFixed(2) : outdoorUnit.price} €</div>
        `;
        totalPrice += (typeof outdoorUnit.price === 'number' ? outdoorUnit.price : 0);
        if (configType.numUnits > 0 && allIndoorUnitsSelected) {
            summaryHTML += `<hr><h3>Unità Interne Selezionate (${indoorUnits.length})</h3>`;
            summaryHTML += `<ul class="summary-indoor-unit-list">`;
            indoorUnits.forEach((ui, index) => {
                 const uiSeriesInfo = STATIC_DATA.series[ui.brandId]?.find(s => ui.seriesId.startsWith(s.id.replace('_multi','')) );
                 const uiImageRefForSummary = uiSeriesInfo?.uiImageRef || ui.seriesId.replace('_ui','');
                summaryHTML += `<li>
                    <img src="${ui.image && ui.image !== "Dati mancanti" && ui.image !== "img/.png" ? ui.image : `img/${uiImageRefForSummary}.png`}" alt="${ui.name}" onerror="this.style.display='none'; this.style.float='none';">
                    <div class="ui-details-container">
                        <strong>UI ${index + 1}:</strong> ${ui.modelCode} (${ui.name}) <br>
                        Tipo: ${ui.type}, Capacità: ${ui.capacityBTU} BTU <br>
                        Dimensioni: ${ui.dimensions} <br>
                        Prezzo UI: ${typeof ui.price === 'number' ? ui.price.toFixed(2) : ui.price} €
                    </div>
                </li>`;
                totalPrice += (typeof ui.price === 'number' ? ui.price : 0);
            });
            summaryHTML += `</ul>`;
        }
        summaryHTML += `<hr><div class="summary-total"><strong>Prezzo Totale Configurazione:</strong> ${totalPrice.toFixed(2)} €</div>`;
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = summaryHTML;
        summaryDiv.appendChild(contentDiv);
        if (pageControlsTitle) pageControlsTitle.classList.remove('print-main-title');
        if (summaryMainTitle) summaryMainTitle.classList.add('print-main-title');
    }
        
    stepIndicatorItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return; 
            const targetStep = parseInt(item.dataset.step);
            if (targetStep === 6) { 
                if (selections.configType && ( (selections.indoorUnits.every(ui => ui !== null) && selections.indoorUnits.length === selections.configType.numUnits) || selections.configType.numUnits === 0) ) {
                     generateSummary(); 
                     highestStepCompleted = Math.max(highestStepCompleted, 5); 
                } else { alert("Completa la selezione prima di visualizzare il riepilogo."); return; }
            }
            showStep(targetStep, true); 
        });
    });

    if(finalizeBtn) {
        finalizeBtn.addEventListener('click', () => {
            generateSummary();
            highestStepCompleted = Math.max(highestStepCompleted, 5); 
            showStep(6);
            updateStepIndicator(); 
        });
    }

    document.querySelectorAll('.prev-btn').forEach(button => {
        button.addEventListener('click', () => {
            const prevStepNumber = parseInt(button.dataset.prev);
            showStep(prevStepNumber, true); 
        });
    });
    
    document.getElementById('reset-config-btn').addEventListener('click', () => {
        highestStepCompleted = 0;
        clearFutureSelections(0, false); 
        document.querySelectorAll('.selection-item.selected, .unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
        if (pageControlsTitle) pageControlsTitle.classList.remove('print-main-title');
        if (summaryMainTitle) summaryMainTitle.classList.remove('print-main-title');
        showStep(1); 
    });

    document.getElementById('print-summary-btn').addEventListener('click', () => window.print() );
    document.getElementById('print-list').addEventListener('click', () => {
        if (currentStep === 6 && summaryDiv.innerHTML.includes("Prezzo Totale")) window.print();
        else alert("Completa la configurazione e vai al riepilogo per stampare.");
    });

    // --- Fine Blocco Codice Precedente ---

    async function initializeApp() {
        document.body.appendChild(loadingOverlay);
        loadingOverlay.style.display = 'flex';

        const [loadedOutdoorUnits, loadedIndoorUnits] = await Promise.all([
            fetchCSVData(CSV_URLS.outdoorUnits),
            fetchCSVData(CSV_URLS.indoorUnits)
        ]);
        
        if ((loadedOutdoorUnits.length === 0 || loadedIndoorUnits.length === 0) && (CSV_URLS.outdoorUnits || CSV_URLS.indoorUnits)) {
            // Se gli URL sono specificati ma i dati non caricati, mostra un errore più specifico
            loadingOverlay.innerHTML += `<br><span style="color:red; font-size:0.8em;">Attenzione: dati per unità esterne e/o interne non caricati o vuoti. L'applicazione potrebbe non funzionare correttamente.</span>`;
             // Non bloccare se i dati sono parziali ma consentire il debug
        } else if (!CSV_URLS.outdoorUnits && !CSV_URLS.indoorUnits) {
             loadingOverlay.innerHTML += `<br><span style="color:orange; font-size:0.8em;">Nessun CSV specificato, l'app userà solo dati statici (se presenti).</span>`;
        }


        processLoadedData(loadedOutdoorUnits, loadedIndoorUnits);
        
        populateBrands(); // Popola le marche basate su STATIC_DATA.brands e filtra per quelle con UE nei CSV
        if (STATIC_DATA.brands.filter(b => STATIC_DATA.series[b.id] && STATIC_DATA.series[b.id].length > 0).length === 0) {
            brandSelectionDiv.innerHTML = '<p>Nessuna marca con serie valide trovata dopo il caricamento dei dati. Controllare i CSV e la configurazione delle serie.</p>';
            loadingOverlay.innerHTML += `<br><span style="color:red; font-size:0.8em;">Nessuna marca con serie valide trovata!</span>`;
            // Non nascondere overlay per debug
            return; 
        } else {
             loadingOverlay.style.display = 'none';
        }
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        const lastUpdatedDate = new Date();
        document.getElementById('lastUpdated').textContent = lastUpdatedDate.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });

        showStep(1); 
        updateStepIndicator(); 
    }

    initializeApp();

});