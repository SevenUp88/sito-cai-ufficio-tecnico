// --- START OF SCRIPT.JS (FIREBASE VERSION FOR clima-multisplit - CORRECTED) ---
// COPIA E INCOLLA TUTTO QUESTO CONTENUTO NEL TUO script.js, SOSTITUENDO TUTTO.

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione Firebase per clima-multisplit)");

    // --- Firebase Configuration for "clima-multisplit" project ---
    const firebaseConfig = {
        apiKey: "AIzaSyCWHMshTGoiZbRj_nK0uoZjHCv8fe2UnaU", // YOURS
        authDomain: "clima-multisplit.firebaseapp.com",   // YOURS
        projectId: "clima-multisplit",                    // YOURS
        storageBucket: "clima-multisplit.appspot.com", 
        messagingSenderId: "314966609042",            // YOURS
        appId: "1:314966609042:web:694658c76e56579b12ea4b", // YOURS
        measurementId: "G-MWFX55K8CH"                     // YOURS
    };

    // Initialize Firebase (using v8 SDK loaded via <script> tags)
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const APP_DATA = {
        brands: [], 
        uiSeriesImageMapping: {}, 
        configTypes: {}, 
        outdoorUnits: [],
        indoorUnits: []
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
    loadingOverlay.innerHTML = '<div class="loading-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px;"></div><p>Caricamento dati...</p><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

    const LOGICAL_TO_HTML_STEP_MAP = { 1: "step-1", 2: "step-3", 3: "step-4", 4: "step-5", 5: "step-6" };
    const HTML_TO_LOGICAL_STEP_MAP = { "step-1": 1, "step-3": 2, "step-4": 3, "step-5": 4, "step-6": 5 };
    const TOTAL_LOGICAL_STEPS = 5;

    async function fetchFirestoreCollection(collectionName) {
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
        let btu = 0;
        let kw = "N/A";

        if (typeof powerStr === 'string' && powerStr !== "Dati mancanti") {
            // Try to extract BTU (e.g., "9000BTU" or "9.000 BTU" or "9,000BTU")
            const btuMatch = powerStr.match(/([\d.,]+)\s*BTU/i);
            if (btuMatch && btuMatch[1]) {
                btu = parseInt(btuMatch[1].replace(/[.,]/g, ''), 10) || 0;
            }

            // Try to extract kW (e.g., "2,5kW" or "2.5 kW")
            const kwMatch = powerStr.match(/([\d.,]+)\s*kW/i);
            if (kwMatch && kwMatch[1]) {
                kw = kwMatch[1].replace(',', '.'); // Normalize to use dot as decimal
            } else if (btu > 0 && kw === "N/A") { // Estimate kW from BTU if not found
                 // 1 kW ≈ 3412.14 BTU
                 kw = (btu / 3412.14).toFixed(1);
            }
        }
        return { btu, kw };
    }

    function processLoadedData(loadedOutdoorUnitsDocs, loadedIndoorUnitsDocs) {
        console.log("DEBUG: Processing Firestore data. UE docs:", loadedOutdoorUnitsDocs.length, "UI docs:", loadedIndoorUnitsDocs.length);
        
        APP_DATA.outdoorUnits = loadedOutdoorUnitsDocs.map((ue_doc, index) => {
            const brandId = String(ue_doc.marca || 'sconosciuta').toLowerCase(); 
            let compatibleIds = [];
            const compatibleSeriesHeader = ue_doc.compatibleindoorseriesids; 
            if (compatibleSeriesHeader && compatibleSeriesHeader !== "Dati mancanti" && typeof compatibleSeriesHeader === 'string') {
                compatibleIds = compatibleSeriesHeader.split(';')
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            } else if (Array.isArray(compatibleSeriesHeader)) { 
                 compatibleIds = compatibleSeriesHeader
                    .map(name => String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '') + "_ui")
                    .filter(id => id && id !== "_ui");
            }

            const connections = Number(ue_doc.unit_collegabili) || 0; 
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : 2) : 1;
            
            // Power for Outdoor Units: ue_doc.potenza seems to be a simple number (e.g., "4")
            // This needs clear definition: Is it kW? Nominal size? Needs specific parsing for BTU.
            // Placeholder: Assume ue_doc.potenza is nominal kW and convert to BTU.
            // IMPORTANT: You MUST adjust this logic if ue_doc.potenza is not kW for outdoor units.
            // It's better if your CSV for outdoor units explicitly has potenza_btu_freddo_ue and potenza_btu_caldo_ue
            let coolingBTU_UE = 0;
            let heatingBTU_UE = 0;
            if (ue_doc.potenza && ue_doc.potenza !== "Dati mancanti") {
                const uePotenzaVal = parseFloat(String(ue_doc.potenza).replace(',', '.'));
                if (!isNaN(uePotenzaVal)) {
                    coolingBTU_UE = Math.round(uePotenzaVal * 3412.14); // Example: kW to BTU
                    heatingBTU_UE = coolingBTU_UE; // Assuming same for heating, often different
                }
            }
            // If your CSV provides direct BTU values for UE cooling/heating, use those ue_doc.your_btu_cooling_field_name

            return {
                id: ue_doc.id || ue_doc.codice_prodotto || `ue_${index}`, // Prefer Firestore doc ID
                brandId: brandId,
                modelCode: ue_doc.codice_prodotto || "N/A", // Use codice_prodotto from UE sheet
                name: ue_doc.nome_modello_ue && ue_doc.nome_modello_ue !== "Dati mancanti" ? `${String(ue_doc.marca || '').toUpperCase()} ${ue_doc.nome_modello_ue}` : `UE ${String(ue_doc.marca || '').toUpperCase()} (${ue_doc.codice_prodotto || 'ID: ' + (ue_doc.id || index)})`,
                connections: connections,
                minConnections: Number(ue_doc.min_connessioni_ue) || minConnectionsFallback, // CSV should have min_connessioni_ue
                capacityCoolingBTU: coolingBTU_UE, // Placeholder based on ue_doc.potenza
                capacityHeatingBTU: heatingBTU_UE, // Placeholder
                price: Number(ue_doc.prezzo) || 0,
                dimensions: ue_doc.dimensioni_ue || "N/A",
                weight: (ue_doc.peso_ue !== "Dati mancanti" && ue_doc.peso_ue !== undefined && ue_doc.peso_ue !== null && String(ue_doc.peso_ue).trim() !== '') ? ue_doc.peso_ue : "N/D", 
                energyClassCooling: ue_doc.classe_energetica_raffrescamento || "N/D",
                energyClassHeating: ue_doc.classe_energetica_riscaldamento || "N/D",
                compatibleIndoorSeriesIds: compatibleIds
            };
        });

        APP_DATA.indoorUnits = loadedIndoorUnitsDocs.map((ui_doc, index) => {
            const brandId = String(ui_doc.marca || 'sconosciuta').toLowerCase();
            const uiModelNameNormalized = String(ui_doc.modello || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
            const seriesIdUI = `${uiModelNameNormalized}_ui`;
            
            const { btu, kw } = parsePowerString(ui_doc.potenza); // ui_doc.potenza is like "2,5kW - 9000BTU"
            
            let imagePath = "";
            if (ui_doc.percorso_immagine_ui && ui_doc.percorso_immagine_ui !== "Dati mancanti") {
                imagePath = ui_doc.percorso_immagine_ui; // Use direct path if provided
            } else {
                let imageNameMapped = APP_DATA.uiSeriesImageMapping[seriesIdUI] || uiModelNameNormalized; 
                imagePath = `img/${imageNameMapped}.png`; // Fallback to mapping
            }
            
            return {
                id: ui_doc.id || ui_doc.codice_prodotto || `ui_${index}`, // Prefer Firestore doc ID
                brandId: brandId,
                seriesId: seriesIdUI,
                modelCode: ui_doc.codice_prodotto || "N/A",
                name: `${String(ui_doc.marca || '').toUpperCase()} ${ui_doc.modello || ''} ${kw}kW (${btu} BTU)`,
                type: String(ui_doc.tipo_unit || 'Parete') === "Interna" ? "Parete" : ui_doc.tipo_unit,
                capacityBTU: btu,
                price: Number(ui_doc.prezzo_ui) || 0,
                image: imagePath,
                dimensions: ui_doc.dimensioni_ui || "N/A",
                wifi: ui_doc.wifi === true || String(ui_doc.wifi).toLowerCase() === "si"
            };
        });
        console.log("DEBUG: Processing Firestore data finished. First UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.stringify(APP_DATA.outdoorUnits[0]) : "ND", "First UI:", APP_DATA.indoorUnits.length > 0 ? JSON.stringify(APP_DATA.indoorUnits[0]) : "ND");
    }
    
    // --- Start of functions that were previously copy-pasted ---
    // updateStepIndicator, showStep, clearFutureSelections, createSelectionItem, createUnitSelectionCard, 
    // populateBrands, populateConfigTypes, populateOutdoorUnits, populateIndoorUnitSelectors, 
    // checkAllIndoorUnitsSelected, generateSummary, and event listeners
    // Ensure these functions correctly use the processed APP_DATA

    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];
        stepIndicatorItems.forEach((item, htmlIndex) => {
            let itemLogicalStep;
            if (stepIndicatorItems.length === 6) { 
                if (htmlIndex === 1) { 
                    item.style.display = 'none'; 
                    if (stepLinesHTML[0]) stepLinesHTML[0].style.display = 'none'; 
                    return; 
                }
                itemLogicalStep = (htmlIndex > 1) ? htmlIndex : (htmlIndex + 1); 
            } else { 
                itemLogicalStep = htmlIndex + 1; 
            }
            
            if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { 
                item.style.display = 'none'; 
                if (stepLinesHTML[htmlIndex-1]) stepLinesHTML[htmlIndex-1].style.display = 'none';
                return;
            }

            item.dataset.step = itemLogicalStep;
            const nameEl = item.querySelector('.step-name'); 
            if(nameEl) nameEl.textContent = stepNamesNewFlow[itemLogicalStep-1] || `Step ${itemLogicalStep}?`;
            
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot'); 
            if(dot) dot.classList.remove('active', 'completed');

            if (itemLogicalStep < currentLogicalStep) { 
                item.classList.add('completed'); 
                dot?.classList.add('completed'); 
            } else if (itemLogicalStep === currentLogicalStep) { 
                item.classList.add('active'); 
                dot?.classList.add('active'); 
            }
            
            if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) {
                item.classList.add('disabled');
            }
        });

        stepLinesHTML.forEach((line, htmlLineIndex) => {
            line.classList.remove('active');
            if (stepIndicatorItems.length === 6 && htmlLineIndex === 0) { 
                line.style.display = 'none'; 
                return; 
            }

            let prevItemIndexForLine;
            if (stepIndicatorItems.length === 6) { 
                if (htmlLineIndex === 1) { 
                     prevItemIndexForLine = 0; 
                } else if (htmlLineIndex > 1) { 
                    prevItemIndexForLine = htmlLineIndex; 
                } else { 
                    prevItemIndexForLine = htmlLineIndex;
                }
            } else { 
                 prevItemIndexForLine = htmlLineIndex;
            }
            
            const prevVisibleItem = stepIndicatorItems[prevItemIndexForLine];

            if (prevVisibleItem && prevVisibleItem.style.display !== 'none' && prevVisibleItem.classList.contains('completed')) {
                line.classList.add('active');
            } else if (prevVisibleItem && prevVisibleItem.style.display !== 'none') {
                let prevItemLogicalStep = parseInt(prevVisibleItem.dataset.step);
                if (currentLogicalStep > prevItemLogicalStep) {
                    line.classList.add('active');
                }
            }
        });
    }

    function showStep(logicalStepNumber, fromDirectNavigation = false) {
        if (logicalStepNumber < 1 || logicalStepNumber > TOTAL_LOGICAL_STEPS) {
            console.warn("Attempted to show invalid logical step:", logicalStepNumber);
            return;
        }
        const htmlContainerId = LOGICAL_TO_HTML_STEP_MAP[logicalStepNumber];
        if (!htmlContainerId) { 
            console.error("No HTML container ID mapped for logical step:", logicalStepNumber); 
            return; 
        }
        
        if (!fromDirectNavigation) {
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        } 
        else if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1) {
            const canJumpToSummary = logicalStepNumber === TOTAL_LOGICAL_STEPS && 
                                   (highestLogicalStepCompleted >= TOTAL_LOGICAL_STEPS - 1 || (selections.configType && selections.configType.numUnits === 0 && highestLogicalStepCompleted >= TOTAL_LOGICAL_STEPS - 2));
            if (!canJumpToSummary && logicalStepNumber !== TOTAL_LOGICAL_STEPS) { 
                console.log(`Navigation to step ${logicalStepNumber} blocked. Highest completed: ${highestLogicalStepCompleted}.`);
                return;
            }
        }

        stepsHtmlContainers.forEach(s => s.classList.remove('active-step'));
        const targetStepEl = document.getElementById(htmlContainerId);
        if (targetStepEl) {
            targetStepEl.classList.add('active-step');
        } else {
            console.error(`HTML container '${htmlContainerId}' for logical step ${logicalStepNumber} not found.`);
        }
        
        currentLogicalStep = logicalStepNumber;
        
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted +1) { 
            clearFutureSelections(logicalStepNumber - 1, true); 
        }
        updateStepIndicator(); 
        window.scrollTo(0, 0);
    }

    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) {
        console.log(`clearFutureSelections called. Logical step completed/navigating to: ${stepJustCompletedLogical+1}, Preserve current: ${preserveCurrentLevelSelections}`);

        if (preserveCurrentLevelSelections) {
            if (stepJustCompletedLogical < 1) { selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = []; } 
            else if (stepJustCompletedLogical < 2) { selections.outdoorUnit = null; selections.indoorUnits = []; } 
            else if (stepJustCompletedLogical < 3) { selections.indoorUnits = []; } 
        } else {
            if (stepJustCompletedLogical < 0) { selections.brand = null; selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = []; } 
            else if (stepJustCompletedLogical < 1) { selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = []; } 
            else if (stepJustCompletedLogical < 2) { selections.outdoorUnit = null; selections.indoorUnits = []; } 
            else if (stepJustCompletedLogical < 3) { selections.indoorUnits = []; } 
        }

        if (selections.brand) {
            populateConfigTypes(preserveCurrentLevelSelections && stepJustCompletedLogical === 0); 
        } else {
            brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            configTypeSelectionDiv.innerHTML = '<p>Seleziona una marca per continuare.</p>';
            outdoorUnitSelectionDiv.innerHTML = '<p>Completa i passaggi precedenti.</p>';
            indoorUnitsSelectionArea.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        }

        if (selections.configType && selections.brand) {
            populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedLogical === 1);
        } else if (selections.brand) { 
            configTypeSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            outdoorUnitSelectionDiv.innerHTML = '<p>Seleziona una configurazione per continuare.</p>';
            indoorUnitsSelectionArea.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        }

        if (selections.outdoorUnit && selections.configType && selections.brand) {
            populateIndoorUnitSelectors(preserveCurrentLevelSelections && stepJustCompletedLogical === 2);
        } else if (selections.configType) { 
            outdoorUnitSelectionDiv.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
            indoorUnitsSelectionArea.innerHTML = '<p>Seleziona un\'unità esterna per continuare.</p>';
        }
        
        if (stepJustCompletedLogical < TOTAL_LOGICAL_STEPS - 1) { 
            summaryDiv.innerHTML = '';
             if(document.getElementById('summary-main-title')) document.getElementById('summary-main-title').classList.remove('print-main-title');
        }
        
        if (!preserveCurrentLevelSelections) {
            highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        }

        checkAllIndoorUnitsSelected(); 
        updateStepIndicator(); 
    }
    
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div'); itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected'); 
        itemDiv.dataset[type + 'Id'] = item.id; 
        
        let logoSrc = ''; if (type === 'brand' && item.logo) logoSrc = item.logo;
        const nameSpan = document.createElement('span'); nameSpan.textContent = item.name; 
        
        if (logoSrc) {
            const logoImg = document.createElement('img'); logoImg.src = logoSrc; logoImg.alt = `${item.name} Logo`;
            logoImg.classList.add('brand-logo');
            logoImg.onload = () => { nameSpan.style.display = 'none'; }; 
            logoImg.onerror = () => { 
                console.warn(`DEBUG: Errore caricamento logo ${logoSrc}`); 
                logoImg.style.display = 'none'; 
                nameSpan.style.display = 'block'; 
            };
            itemDiv.appendChild(logoImg);
            nameSpan.style.display = 'none'; 
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
        
        card.style.flexDirection = "column"; 
        card.style.alignItems = 'flex-start'; 

        const infoDiv = document.createElement('div'); 
        infoDiv.classList.add('unit-info'); 
        infoDiv.style.width = '100%';

        const nameH4 = document.createElement('h4'); 
        nameH4.textContent = unit.name || "Nome Mancante"; 
        infoDiv.appendChild(nameH4);

        const modelP = document.createElement('p'); 
        modelP.innerHTML = `Codice: <strong>${unit.modelCode || 'N/A'}</strong> | Max UI Collegabili: ${unit.connections === undefined || unit.connections === null ? '?' : unit.connections}`; 
        infoDiv.appendChild(modelP);

        const capacityP = document.createElement('p'); 
        capacityP.textContent = `Potenza (Freddo/Caldo BTU): ${unit.capacityCoolingBTU || '?'} / ${unit.capacityHeatingBTU || '?'}`; 
        infoDiv.appendChild(capacityP);

        const energyClassP = document.createElement('p'); 
        energyClassP.innerHTML = `Classe Energetica (F/C): <strong>${unit.energyClassCooling || '?'}</strong> / <strong>${unit.energyClassHeating || '?'}</strong>`; 
        infoDiv.appendChild(energyClassP);

        const dimensionsP = document.createElement('p');
        let dimText = unit.dimensions && unit.dimensions !== "N/A" ? `Dimensioni (LxAxP): ${unit.dimensions}` : "Dimensioni: N/A";
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
            card.parentElement.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected')); 
            card.classList.add('selected'); 
            clickHandler(unit); 
        });
        return card;
    }
    
    function populateBrands(){
        brandSelectionDiv.innerHTML = ''; 
        console.log("DEBUG: populateBrands - APP_DATA.brands (from Firestore):", JSON.parse(JSON.stringify(APP_DATA.brands)));
        
        if (!APP_DATA.outdoorUnits || APP_DATA.outdoorUnits.length === 0) { 
            brandSelectionDiv.innerHTML = '<p>Dati sulle unità esterne non ancora caricati o nessuna unità esterna disponibile. Impossibile determinare le marche.</p>';
            console.warn("DEBUG: populateBrands - outdoorUnits non definito o vuoto!"); 
            return; 
        }
        
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId).filter(id => id))]; 
        console.log("DEBUG: populateBrands - brandId UNICI in outdoorUnits:", uniqueBrandIdsFromUEs);
        
        const brandsToShow = APP_DATA.brands.filter(b_static => uniqueBrandIdsFromUEs.includes(b_static.id));
        console.log("DEBUG: populateBrands - brandsToShow (dopo filtro):", JSON.parse(JSON.stringify(brandsToShow)));
        
        if (brandsToShow.length === 0) {
            let msg = '<p>Nessuna marca corrispondente ai dati delle unità esterne caricate. ';
            if (uniqueBrandIdsFromUEs.length > 0) {
                msg += `Marche rilevate nelle Unità Esterne: ${uniqueBrandIdsFromUEs.join(', ')}. Controlla che questi ID esistano nella collezione 'brands' di Firestore e che i dati siano consistenti.</p>`;
            } else {
                msg += `Nessuna marca valida identificata nelle Unità Esterne caricate.</p>`;
            }
            brandSelectionDiv.innerHTML = msg; 
            console.warn("DEBUG: populateBrands - Nessuna marca da mostrare."); 
            return;
        }

        brandsToShow.forEach(brand => { 
            console.log("DEBUG: populateBrands - Creo card per marca:", brand.id, brand.name);
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = brandChanged(selections.brand, selectedBrand); 
                selections.brand = selectedBrand; 
                
                if (brandHasChanged) { 
                    clearFutureSelections(0, false); 
                    highestLogicalStepCompleted = 0; 
                }
                populateConfigTypes(!brandHasChanged && !!selections.configType); 
                showStep(2); 
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 1); 
                updateStepIndicator();

            }, selections.brand && selections.brand.id === brand.id));
        });
        console.log("DEBUG: populateBrands - Fine.");

        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) {
            populateConfigTypes(true); 
        } else if (selections.brand) { 
            selections.brand = null; 
        }
    }

    function populateConfigTypes(restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) { 
            configTypeSelectionDiv.innerHTML = '<p>Scegli prima una marca per vedere le configurazioni disponibili.</p>'; 
            if(restoring) selections.configType = null; 
            return; 
        }
        console.log(`DEBUG: populateConfigTypes - Marca selezionata: ${selections.brand.name} (ID: ${selections.brand.id})`);
        
        const configTypeList = Object.values(APP_DATA.configTypes); 

        const validConfigs = configTypeList.map(ct => { 
            const hasMatchingUE = APP_DATA.outdoorUnits.some(ue => 
                ue.brandId === selections.brand.id && 
                ue.connections >= ct.numUnits && 
                ue.minConnections <= ct.numUnits
            );
            return hasMatchingUE ? ct : null;
        }).filter(Boolean); 

        console.log("DEBUG: populateConfigTypes - Configurazioni valide per marca:", JSON.parse(JSON.stringify(validConfigs)));
        
        if(validConfigs.length === 0) { 
            configTypeSelectionDiv.innerHTML = `<p>Nessuna configurazione multi-split disponibile per ${selections.brand.name} con le unità esterne attualmente caricate. Controlla i dati delle unità esterne ('unit_collegabili' e 'min_connessioni_ue').</p>`; 
            if (restoring) selections.configType = null; 
            return; 
        }
        
        validConfigs.forEach(item => { 
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig); 
                selections.configType = selectedConfig; 
                
                if (configHasChanged) { 
                    clearFutureSelections(1, false); 
                    highestLogicalStepCompleted = 1; 
                }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                showStep(3); 
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 2); 
                updateStepIndicator();

            }, selections.configType && selections.configType.id === item.id));
        });

        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) {
            populateOutdoorUnits(true);
        } else if (restoring && selections.configType) {
            selections.configType = null;
        }
    }
    
    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType) { 
            outdoorUnitSelectionDiv.innerHTML = '<p>Scegli Marca e Tipo di Configurazione per vedere le unità esterne.</p>'; 
            if(restoring) selections.outdoorUnit = null; 
            return; 
        }
        console.log(`DEBUG: populateOutdoorUnits - Filtro per Marca: ${selections.brand.id}, Config ID: ${selections.configType.id} (numUnits: ${selections.configType.numUnits})`);
        
        const numRequired = selections.configType.numUnits;
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => 
            ue.brandId === selections.brand.id && 
            ue.connections >= numRequired && 
            ue.minConnections <= numRequired
        );
        
        console.log(`DEBUG: populateOutdoorUnits - Trovate ${compatibleUEs.length} UE compatibili.`);
        if (compatibleUEs.length === 0) { 
            outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna Unità Esterna ${selections.brand.name} trovata per la configurazione ${selections.configType.name}. Verifica i campi 'unit_collegabili' (deve essere >= ${numRequired}) e 'min_connessioni_ue' (deve essere <= ${numRequired}) per le unità esterne di questa marca.</p>`; 
            if(restoring) selections.outdoorUnit = null; 
            return; 
        }
        
        compatibleUEs.forEach(ue => {
            console.log(`DEBUG: populateOutdoorUnits - Creo card per UE: ${ue.name} (ID: ${ue.id})`);
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                const ueHasChanged = ueChanged(selections.outdoorUnit, selectedUE); 
                selections.outdoorUnit = selectedUE;
                
                if (ueHasChanged) { 
                    clearFutureSelections(2, false); 
                    highestLogicalStepCompleted = 2; 
                }
                
                if (selections.configType.numUnits === 0) { 
                    console.log("Configurazione non richiede unità interne. Finalizzo.");
                    generateSummary(); 
                    showStep(TOTAL_LOGICAL_STEPS); 
                    highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); 
                } else {
                    populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0 && selections.indoorUnits.some(ui => ui !== null));
                    showStep(4); 
                    highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); 
                }
                checkAllIndoorUnitsSelected(); 
                updateStepIndicator();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });

        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) {
            if (selections.configType.numUnits > 0) {
                populateIndoorUnitSelectors(true);
            }
        } else if (restoring && selections.outdoorUnit) {
            selections.outdoorUnit = null;
        }
    }
    
    function populateIndoorUnitSelectors(restoring = false) { 
        indoorUnitsSelectionArea.innerHTML = '';
        if (!selections.outdoorUnit || !selections.configType || !selections.brand) { 
            indoorUnitsSelectionArea.innerHTML = `<p>Informazioni preliminari (Marca, Configurazione, Unità Esterna) mancanti. Completa i passaggi precedenti.</p>`; 
            checkAllIndoorUnitsSelected(); 
            return; 
        }
        
        if (selections.configType.numUnits === 0) { 
            console.log("DEBUG: populateIndoorUnitSelectors - Numero unità per la configurazione è 0. Salto selezione UI.");
            indoorUnitsSelectionArea.innerHTML = `<p>Questa configurazione non richiede unità interne.</p>`;
            checkAllIndoorUnitsSelected(); 
            return; 
        } 
        
        let validRestore = restoring && 
                           selections.indoorUnits.length === selections.configType.numUnits && 
                           selections.indoorUnits.every(ui => ui === null || (ui && ui.brandId === selections.brand.id)); 
        
        if (!validRestore) {
            console.log("DEBUG: populateIndoorUnitSelectors - Resettando array unità interne.");
            selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
        }

        const compatibleSeriesForUE = selections.outdoorUnit.compatibleIndoorSeriesIds || [];
        if (compatibleSeriesForUE.length === 0 && APP_DATA.indoorUnits.some(ui => ui.brandId === selections.brand.id)) { 
            console.warn(`Nessuna serie di Unità Interne compatibile specificata per l'Unità Esterna ${selections.outdoorUnit.id} (${selections.outdoorUnit.name}). Saranno mostrate tutte le UI della marca ${selections.brand.name}, ma la compatibilità effettiva non è garantita senza specifiche. Aggiungere 'compatibleIndoorSeriesIds' all'UE.`);
        }
        
        const availableIndoorUnits = APP_DATA.indoorUnits.filter(ui => {
            const brandMatch = ui.brandId === selections.brand.id;
            const seriesMatch = compatibleSeriesForUE.length > 0 ? compatibleSeriesForUE.includes(ui.seriesId) : true; 
            return brandMatch && seriesMatch;
        });

        if (availableIndoorUnits.length === 0) { 
            indoorUnitsSelectionArea.innerHTML = `<p>Nessuna Unità Interna compatibile trovata per la marca ${selections.brand.name} e l'unità esterna ${selections.outdoorUnit.name} (basato su 'compatibleIndoorSeriesIds' se fornito). Verifica i dati o le serie compatibili definite per l'UE.</p>`; 
            checkAllIndoorUnitsSelected(); return; 
        }
        
        console.log(`DEBUG: populateIndoorUnitSelectors - Numero slot UI richiesti: ${selections.configType.numUnits}. Unità interne disponibili filtrati: ${availableIndoorUnits.length}`);

        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div'); 
            slotDiv.classList.add('indoor-unit-slot');
            slotDiv.style.marginBottom = '20px'; 
            slotDiv.style.paddingBottom = '15px';
            slotDiv.style.borderBottom = '1px dashed #eee';
            
            const label = document.createElement('label'); 
            label.htmlFor = `indoor-unit-select-${i}`; 
            label.textContent = `Unità Interna ${i + 1}:`; 
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            label.style.fontWeight = 'bold';
            slotDiv.appendChild(label);
            
            const select = document.createElement('select'); 
            select.id = `indoor-unit-select-${i}`; 
            select.dataset.index = i;
            select.style.width = '100%';
            select.style.padding = '8px';
            select.style.marginBottom = '10px';
            
            const placeholder = document.createElement('option'); 
            placeholder.value = ""; 
            placeholder.textContent = "-- Seleziona Unità Interna --"; 
            select.appendChild(placeholder);
            
            availableIndoorUnits.forEach(ui => {
                const option = document.createElement('option');
                option.value = ui.id;
                option.textContent = `${ui.name} (Mod: ${ui.modelCode}, BTU: ${ui.capacityBTU}, Prezzo: ${ui.price.toFixed(2)}€)`;
                if (validRestore && selections.indoorUnits[i] && selections.indoorUnits[i].id === ui.id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
            const detailsDiv = document.createElement('div'); 
            detailsDiv.classList.add('unit-details');
            detailsDiv.style.fontSize = '0.9em';
            detailsDiv.style.paddingLeft = '10px';
            
            if (validRestore && selections.indoorUnits[i] && availableIndoorUnits.some(avail => avail.id === selections.indoorUnits[i].id)) {
                const currentSelectedUI = selections.indoorUnits[i];
                 detailsDiv.innerHTML = `
                    <p style="margin: 3px 0;"><strong>Modello:</strong> ${currentSelectedUI.modelCode}</p>
                    <p style="margin: 3px 0;"><strong>BTU:</strong> ${currentSelectedUI.capacityBTU} - <strong>Prezzo:</strong> ${currentSelectedUI.price.toFixed(2)}€</p>
                    ${currentSelectedUI.image ? `<img src="${currentSelectedUI.image}" alt="${currentSelectedUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px;">` : ''}`;
            } else if (validRestore && selections.indoorUnits[i]) {
                console.warn(`DEBUG: UI ${selections.indoorUnits[i].id} precedentemente selezionata per lo slot ${i+1} non è più disponibile/compatibile con la UE attuale. Slot resettato.`);
                selections.indoorUnits[i] = null; 
            }
            
            select.addEventListener('change', (e) => {
                const selectedId = e.target.value;
                const unitIndex = parseInt(e.target.dataset.index);
                const selectedUI = availableIndoorUnits.find(u => u.id === selectedId);
                
                selections.indoorUnits[unitIndex] = selectedUI || null; 
                
                if (selectedUI) {
                    detailsDiv.innerHTML = `
                        <p style="margin: 3px 0;"><strong>Modello:</strong> ${selectedUI.modelCode}</p>
                        <p style="margin: 3px 0;"><strong>BTU:</strong> ${selectedUI.capacityBTU} - <strong>Prezzo:</strong> ${selectedUI.price.toFixed(2)}€</p>
                        ${selectedUI.image ? `<img src="${selectedUI.image}" alt="${selectedUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px;">` : ''}`;
                } else {
                    detailsDiv.innerHTML = ''; 
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
        if (selections.configType?.numUnits === 0) { 
            allSelected = true; 
        } else if (selections.configType && selections.indoorUnits.length === selections.configType.numUnits) {
            allSelected = selections.indoorUnits.every(ui => ui !== null && ui !== undefined);
        }
        
        if(finalizeBtn) {
            finalizeBtn.disabled = !allSelected;
        }

        if(allSelected) {
             if (selections.configType && selections.configType.numUnits > 0) {
                 highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); 
             } else if (selections.configType && selections.configType.numUnits === 0) {
                 highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3);
             }
        }
        updateStepIndicator(); 
    }

    function generateSummary() {
        console.log("DEBUG: generateSummary called. Current Selections:", JSON.parse(JSON.stringify(selections)));
        summaryDiv.innerHTML = ''; 
        
        if (!selections.brand || !selections.configType || !selections.outdoorUnit ) {
            summaryDiv.innerHTML = "<p>Configurazione incompleta. Torna indietro e completa tutti i passaggi richiesti.</p>";
            return;
        }
        if (selections.configType.numUnits > 0 && 
            (selections.indoorUnits.length !== selections.configType.numUnits || selections.indoorUnits.some(ui => !ui))) {
             summaryDiv.innerHTML = "<p>Selezione delle unità interne incompleta. Torna indietro e completa la selezione per tutte le unità richieste.</p>";
            return;
        }

        let totalNominalBTU_UI = 0;
        let totalPrice = selections.outdoorUnit.price || 0;

        const valOrNA = (val, suffix = '') => (val !== undefined && val !== null && val !== '' && val !== "Dati mancanti") ? `${val}${suffix}` : 'N/A';
        const priceOrND = (price) => typeof price === 'number' ? price.toFixed(2) + " €" : 'N/D';

        const summaryHTML = `
            <div class="summary-block">
                <h3>Marca e Configurazione</h3>
                <p><strong>Marca:</strong> ${selections.brand.name}</p>
                <p><strong>Configurazione:</strong> ${selections.configType.name} (${selections.configType.numUnits} Unità Interne)</p>
            </div>

            <div class="summary-block">
                <h3>Unità Esterna Selezionata</h3>
                <h4>${selections.outdoorUnit.name}</h4>
                <p><strong>Modello:</strong> ${valOrNA(selections.outdoorUnit.modelCode)}</p>
                <p><strong>Potenza Raffrescamento:</strong> ${valOrNA(selections.outdoorUnit.capacityCoolingBTU, ' BTU')}</p>
                <p><strong>Potenza Riscaldamento:</strong> ${valOrNA(selections.outdoorUnit.capacityHeatingBTU, ' BTU')}</p>
                <p><strong>Classe Energetica (Freddo/Caldo):</strong> ${valOrNA(selections.outdoorUnit.energyClassCooling)} / ${valOrNA(selections.outdoorUnit.energyClassHeating)}</p>
                <p><strong>Dimensioni (LxAxP mm):</strong> ${valOrNA(selections.outdoorUnit.dimensions)}</p>
                <p><strong>Peso:</strong> ${valOrNA(selections.outdoorUnit.weight, ' kg')}</p>
                <p class="price-highlight"><strong>Prezzo UE:</strong> ${priceOrND(selections.outdoorUnit.price)} (IVA Escl.)</p>
            </div>

            ${selections.configType.numUnits > 0 ? `
            <div class="summary-block">
                <h3>Unità Interne Selezionate</h3>
                ${selections.indoorUnits.map((ui, index) => {
                    if (!ui) return `<div class="summary-indoor-unit" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;"><p>Unità interna ${index + 1} non selezionata correttamente.</p></div>`;
                    totalNominalBTU_UI += ui.capacityBTU || 0; 
                    totalPrice += ui.price || 0;
                    return `
                        <div class="summary-indoor-unit" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                            <h4>Unità Interna ${index + 1}: ${ui.name}</h4>
                            ${ui.image ? `<img src="${ui.image}" alt="${ui.name}" class="summary-ui-img" style="float:right; max-width:100px; max-height:80px; margin-left:10px; object-fit:contain;">` : ''}
                            <p><strong>Modello:</strong> ${valOrNA(ui.modelCode)}</p>
                            <p><strong>Potenza Nominale:</strong> ${valOrNA(ui.capacityBTU, ' BTU')}</p>
                            <p><strong>Tipo:</strong> ${valOrNA(ui.type)}</p>
                            <p><strong>Dimensioni (LxAxP mm):</strong> ${valOrNA(ui.dimensions)}</p>
                            <p><strong>WiFi Integrato:</strong> ${ui.wifi ? 'Sì' : 'No'}</p>
                            <p class="price-highlight"><strong>Prezzo UI:</strong> ${priceOrND(ui.price)} (IVA Escl.)</p>
                            <div style="clear:both;"></div>
                        </div>
                    `;
                }).join('')}
            </div>
            ` : '<div class="summary-block"><p>Nessuna unità interna richiesta o selezionata per questa configurazione.</p></div>'}
            
            <div class="summary-total" style="margin-top:20px; padding-top:15px; border-top: 2px solid var(--primary-color);">
                ${selections.configType.numUnits > 0 ? `<p><strong>Somma Potenza Nominale UI:</strong> ${totalNominalBTU_UI} BTU</p>` : ''}
                <p style="font-size: 1.2em; font-weight: bold;"><strong>Prezzo Totale Configurazione:</strong> <span class="total-price-value">${priceOrND(totalPrice)}</span> (IVA Esclusa)</p>
            </div>
        `;
        summaryDiv.innerHTML = summaryHTML;
        const summaryTitleEl = document.getElementById('summary-main-title');
        if (summaryTitleEl) summaryTitleEl.classList.add('print-main-title');
        console.log("DEBUG: Riepilogo generato. Prezzo Totale Calcolato:", totalPrice);
    }

    stepIndicatorItems.forEach(item => { 
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) {
                console.log("Click su step disabilitato:", item.dataset.step);
                return;
            }
            const targetLogicalStep = parseInt(item.dataset.step); 
            if (isNaN(targetLogicalStep) || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) {
                console.warn("Click su step con target non valido:", targetLogicalStep);
                return;
            }
            
            console.log(`Step indicator clicked. Target logical step: ${targetLogicalStep}. Current highest completed: ${highestLogicalStepCompleted}`);

            if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { 
                 const uisNeeded = selections.configType && selections.configType.numUnits > 0;
                 const uisNotFullySelected = uisNeeded && (!selections.indoorUnits.every(ui => ui !== null));

                 if ( !selections.brand || !selections.configType || !selections.outdoorUnit || uisNotFullySelected ) {
                    alert("Completa tutti i passaggi precedenti, inclusa la selezione di tutte le unità interne richieste, prima di visualizzare il riepilogo."); 
                    return; 
                 }
                 generateSummary(); 
            }
            showStep(targetLogicalStep, true); 
        });
    });

    if(finalizeBtn) { 
        finalizeBtn.addEventListener('click', () => { 
            console.log("Finalize button clicked.");
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); 
            generateSummary(); 
            showStep(TOTAL_LOGICAL_STEPS); 
        });
    }

    document.querySelectorAll('.prev-btn').forEach(button => { 
        const currentStepElement = button.closest('.config-step');
        if (!currentStepElement) return;
        const currentHtmlId = currentStepElement.id;
        const currentLogical = HTML_TO_LOGICAL_STEP_MAP[currentHtmlId];
        
        if (currentLogical === undefined) {
             console.warn("Could not determine current logical step for prev-btn in:", currentHtmlId);
             button.style.display = 'none';
             return;
        }

        let prevLogicalStep = currentLogical - 1;
        
        if(prevLogicalStep >= 1) {
            button.addEventListener('click', () => { 
                console.log(`Prev button clicked. From logical step ${currentLogical} to ${prevLogicalStep}`);
                showStep(prevLogicalStep, true); 
            });
        } else {
            button.style.display = 'none'; 
        }
     });

    document.getElementById('reset-config-btn')?.addEventListener('click', () => { 
         console.log("Reset configuration button clicked.");
         if (!confirm("Sei sicuro di voler resettare l'intera configurazione?")) return;

         highestLogicalStepCompleted = 0; 
         selections.brand = null; 
         selections.configType = null; 
         selections.outdoorUnit = null; 
         selections.indoorUnits = [];
         
         clearFutureSelections(-1, false); 
         
         const summaryTitleEl = document.getElementById('summary-main-title');
         if (summaryTitleEl) summaryTitleEl.classList.remove('print-main-title'); 
         summaryDiv.innerHTML = ''; 
         if (finalizeBtn) finalizeBtn.disabled = true;
         
         showStep(1); 
    });

    document.getElementById('print-summary-btn')?.addEventListener('click', () => {
        if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("Configurazione incompleta")) {
            window.print();
        } else {
            alert("Assicurati di aver completato la configurazione e di essere nella pagina di Riepilogo prima di stampare.");
        }
    });
    
    document.getElementById('print-list')?.addEventListener('click', () => { 
         if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("Configurazione incompleta")) {
            window.print();
         } else {
            alert("Per stampare la configurazione, completa tutti i passaggi fino al Riepilogo (Passaggio 5).");
         }
    });

    async function initializeApp() {
        console.log("DEBUG: Chiamata a initializeApp (Firebase Version for clima-multisplit)");
        document.body.appendChild(loadingOverlay);
        loadingOverlay.style.display = 'flex';

        let brandsData, configTypesData, uiSeriesMapData, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc;

        try {
            console.log("DEBUG: Inizio caricamento dati da Firestore...");
            // Use destructuring correctly here
            [
                brandsData,
                configTypesData,
                uiSeriesMapData,
                outdoorUnitsDocs,
                indoorUnitsDocs,
                metadataDoc 
            ] = await Promise.all([
                fetchFirestoreCollection('brands'),
                fetchFirestoreCollection('configTypes'),
                fetchFirestoreCollection('uiSeriesImageMapping'),
                fetchFirestoreCollection('outdoorUnits'),
                fetchFirestoreCollection('indoorUnits'),
                db.collection('metadata').doc('appInfo').get() 
            ]);

            APP_DATA.brands = brandsData;
            APP_DATA.configTypes = configTypesData.reduce((acc, ct) => {
                acc[ct.id] = { name: ct.name, numUnits: ct.numUnits, id: ct.id };
                return acc;
            }, {});
            APP_DATA.uiSeriesImageMapping = uiSeriesMapData.reduce((acc, mapping) => {
                acc[mapping.seriesKey] = mapping.imageName;
                return acc;
            }, {});

            console.log("DEBUG: Dati statici (brands, configTypes, uiSeriesMappings) caricati e mappati.");
            console.log("DEBUG: APP_DATA.brands:", APP_DATA.brands.length);
            console.log("DEBUG: APP_DATA.configTypes:", Object.keys(APP_DATA.configTypes).length);
            console.log("DEBUG: APP_DATA.uiSeriesImageMapping:", Object.keys(APP_DATA.uiSeriesImageMapping).length);
            
            processLoadedData(outdoorUnitsDocs, indoorUnitsDocs);

            if (APP_DATA.brands.length === 0 && outdoorUnitsDocs.length > 0) {
                 console.warn("ATTENZIONE: Unità esterne caricate, ma nessuna marca trovata in Firestore 'brands' collection.");
                 loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Dati marche mancanti in Firestore.</span>`;
            }
            if (Object.keys(APP_DATA.configTypes).length === 0 && outdoorUnitsDocs.length > 0) {
                 console.warn("ATTENZIONE: Nessun tipo di configurazione trovato in Firestore 'configTypes' collection.");
                 loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Dati tipi configurazione mancanti.</span>`;
            }

        } catch (error) {
            console.error("ERRORE CRITICO durante il caricamento dati da Firestore:", error);
            loadingOverlay.innerHTML += `<br><span style="color:red;font-size:0.8em;">Errore grave nel caricamento dei dati. Controlla la console per dettagli e verifica le regole di sicurezza di Firestore e la connessione.</span>`;
            return; 
        }
        
        const step2Element = document.getElementById('step-2');
        if (step2Element) {
            step2Element.remove();
            console.log("DEBUG: Elemento HTML 'step-2' (Selezione Serie) rimosso.");
        } else {
            console.log("DEBUG: Elemento HTML 'step-2' non trovato, potrebbe essere già stato rimosso.");
        }
        
        updateStepIndicator(); 
        populateBrands(); 

        const brandSelectionContent = brandSelectionDiv.innerHTML.trim();
        if (brandSelectionContent.includes("Nessuna marca") || 
           (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p')) ||
            brandSelectionContent === "" || brandSelectionContent === "<p>...</p>") { 
             console.warn("DEBUG: Nessuna marca popolata nell'interfaccia dopo populateBrands().");
             let errorMsg = "Possibile problema con i dati delle marche o delle unità esterne. Controlla:";
             errorMsg += "<ul>";
             if (APP_DATA.brands.length === 0) errorMsg += "<li>Collezione 'brands' in Firestore è vuota o inaccessibile.</li>";
             if (APP_DATA.outdoorUnits.length === 0) errorMsg += "<li>Collezione 'outdoorUnits' in Firestore è vuota o inaccessibile.</li>";
             if (APP_DATA.brands.length > 0 && APP_DATA.outdoorUnits.length > 0 && APP_DATA.brands.filter(b => APP_DATA.outdoorUnits.some(ue => ue.brandId === b.id)).length === 0) {
                 errorMsg += "<li>Nessuna corrispondenza tra 'brandId' nelle unità esterne e gli 'id' delle marche.</li>";
             }
             errorMsg += "<li>Regole di sicurezza di Firestore.</li>";
             errorMsg += "<li>Output della console per errori specifici.</li></ul>";

             if (loadingOverlay.style.display !== 'none') { 
                loadingOverlay.innerHTML = `<p style="color:orange; font-weight:bold; font-size:1.1em;">Errore nel Caricamento Dati Iniziali</p><div style="font-size:0.9em; text-align:left; max-width: 500px; margin: 0 auto;">${errorMsg}</div>`;
             } else { 
                brandSelectionDiv.innerHTML = `<div style="color:orange; padding:10px; border:1px solid orange;">${errorMsg}</div>`;
             }

        } else if (brandSelectionDiv.children.length > 0) {
            loadingOverlay.style.display = 'none'; 
        } else {
             if (loadingOverlay.style.display !== 'none') {
                 loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Configurazione iniziale UI inattesa dopo il caricamento dei dati.</span>`;
             }
        }
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        try {
            // Use the metadataDoc variable that was de-structured from Promise.all
            if (metadataDoc && metadataDoc.exists && metadataDoc.data().lastDataUpdate) {
                const timestamp = metadataDoc.data().lastDataUpdate;
                document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
            } else {
                 console.log("DEBUG: Documento metadata/appInfo non trovato o campo lastDataUpdate mancante.");
                document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
            }
        } catch(err) {
             console.warn("Errore durante il recupero di metadata.lastDataUpdate:", err);
             document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        }

        showStep(1); 
    }

    console.log("DEBUG: Prima di chiamare initializeApp (Firebase Version for clima-multisplit)");
    initializeApp();
    console.log("DEBUG: Dopo aver chiamato initializeApp (Firebase Version for clima-multisplit)");
});
// --- END OF SCRIPT.JS (FIREBASE VERSION FOR clima-multisplit - CORRECTED) ---