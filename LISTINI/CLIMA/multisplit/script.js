// --- START OF SCRIPT.JS (FIREBASE VERSION FOR clima-multisplit) ---
// COPIA E INCOLLA TUTTO QUESTO CONTENUTO NEL TUO script.js, SOSTITUENDO TUTTO.

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (Versione Firebase per clima-multisplit)");

    // --- Firebase Configuration for "clima-multisplit" project ---
    const firebaseConfig = {
        apiKey: "AIzaSyCWHMshTGoiZbRj_nK0uoZjHCv8fe2UnaU", // YOURS
        authDomain: "clima-multisplit.firebaseapp.com",   // YOURS
        projectId: "clima-multisplit",                    // YOURS
        storageBucket: "clima-multisplit.appspot.com", // Standard format, or clima-multisplit.firebasestorage.app if that's what console shows specifically for Storage and it works
        messagingSenderId: "314966609042",            // YOURS
        appId: "1:314966609042:web:694658c76e56579b12ea4b", // YOURS
        measurementId: "G-MWFX55K8CH"                     // YOURS (Optional for Firestore, used by Analytics)
    };

    // Initialize Firebase (using v8 SDK loaded via <script> tags)
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Original APP_DATA structure (will be populated from Firestore)
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
            
            return {
                id: ue_doc.firestore_id || ue_doc.codice_prod || ue_doc.id || `ue_${index}`, 
                brandId: brandId,
                modelCode: ue_doc.codice_prod || "N/A",
                name: ue_doc.nome_modello_ue && ue_doc.nome_modello_ue !== "Dati mancanti" ? `${String(ue_doc.marca || '').toUpperCase()} ${ue_doc.nome_modello_ue}` : `UE (${brandId})`,
                connections: connections,
                minConnections: Number(ue_doc.min_connessioni_ue) || minConnectionsFallback,
                capacityCoolingBTU: Number(ue_doc.potenza_btu_freddo_ue) || 0,
                capacityHeatingBTU: Number(ue_doc.potenza_btu_caldo_ue) || 0,
                price: Number(ue_doc.prezzo) || 0,
                dimensions: ue_doc.dimensioni_ue || "N/A",
                weight: (ue_doc.peso_ue !== "Dati mancanti" && ue_doc.peso_ue !== undefined && ue_doc.peso_ue !== null && ue_doc.peso_ue !== '') ? ue_doc.peso_ue : "N/D", 
                energyClassCooling: ue_doc.classe_energetica_raffrescamento || "N/D",
                energyClassHeating: ue_doc.classe_energetica_riscaldamento || "N/D",
                compatibleIndoorSeriesIds: compatibleIds
            };
        });

        APP_DATA.indoorUnits = loadedIndoorUnitsDocs.map((ui_doc, index) => {
            const brandId = String(ui_doc.marca || 'sconosciuta').toLowerCase();
            const uiModelNameNormalized = String(ui_doc.modello || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
            const seriesIdUI = `${uiModelNameNormalized}_ui`;
            
            let btu = Number(ui_doc.potenza_btu_ui) || 0; 
            let kw_ui = ui_doc.kw_ui || "N/A"; // Assuming a kw_ui field might exist

            let imageName = APP_DATA.uiSeriesImageMapping[seriesIdUI] || uiModelNameNormalized; 
            let imagePath = `img/${imageName}.png`;
            
            return {
                id: ui_doc.firestore_id || ui_doc.codice_prodotto || ui_doc.id || `ui_${index}`,
                brandId: brandId,
                seriesId: seriesIdUI,
                modelCode: ui_doc.codice_prodotto || "N/A",
                name: `${String(ui_doc.marca || '').toUpperCase()} ${ui_doc.modello || ''} ${kw_ui} (${btu} BTU)`,
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
    
    function updateStepIndicator() {
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        const stepNamesNewFlow = ["Marca", "Config.", "Unità Est.", "Unità Int.", "Riepilogo"];
        stepIndicatorItems.forEach((item, htmlIndex) => {
            let itemLogicalStep;
            if (stepIndicatorItems.length === 6) { // If HTML has 6 step items (one is hidden)
                if (htmlIndex === 1) { // This is the "Serie" step which is hidden
                    item.style.display = 'none'; 
                    if (stepLinesHTML[0]) stepLinesHTML[0].style.display = 'none'; // Hide line before it
                    return; 
                }
                // Adjust logical step for items after the hidden one
                itemLogicalStep = (htmlIndex > 1) ? htmlIndex : (htmlIndex + 1); // Step 1 (HTML 0) is 1, Step 3 (HTML 2) is 2, etc.
            } else { // If HTML has 5 items (no hidden "Serie" step)
                itemLogicalStep = htmlIndex + 1; 
            }
            
            if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { 
                item.style.display = 'none'; 
                // Hide the line before this now-hidden item if it exists
                // The index for stepLinesHTML is usually htmlIndex-1 for the line *before* item at htmlIndex
                // but care is needed if items are skipped.
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
            
            // Disable future steps that haven't been reached yet and are not the current active step or the first step
            if (itemLogicalStep > highestLogicalStepCompleted + 1 && itemLogicalStep !== currentLogicalStep && itemLogicalStep !== 1) {
                item.classList.add('disabled');
            }
        });

        // Update step lines based on the state of the *preceding visible* step item
        stepLinesHTML.forEach((line, htmlLineIndex) => {
            line.classList.remove('active');
            if (stepIndicatorItems.length === 6 && htmlLineIndex === 0) { // Line before hidden "Serie"
                line.style.display = 'none'; 
                return; 
            }

            let prevItemIndexForLine;
            if (stepIndicatorItems.length === 6) { // HTML with 6 items
                if (htmlLineIndex === 1) { // Line between hidden "Serie" and "Config." -> check "Marca"
                     prevItemIndexForLine = 0; // "Marca" is HTML index 0
                } else if (htmlLineIndex > 1) { // Other lines
                    prevItemIndexForLine = htmlLineIndex; // Item before line (e.g., line 2 is after item 2)
                } else { // Should be covered by htmlLineIndex === 0 case
                    prevItemIndexForLine = htmlLineIndex;
                }
            } else { // HTML with 5 items
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
        
        // Update highest logical step completed if moving forward sequentially
        if (!fromDirectNavigation) {
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep - 1);
        } 
        // Handle direct navigation (clicking on step indicator)
        else if (logicalStepNumber > highestLogicalStepCompleted + 1 && logicalStepNumber !== 1) {
            // Allow jumping to summary only if all prior steps up to UI selection are done or not applicable
            const canJumpToSummary = logicalStepNumber === TOTAL_LOGICAL_STEPS && 
                                   (highestLogicalStepCompleted >= TOTAL_LOGICAL_STEPS - 1 || (selections.configType && selections.configType.numUnits === 0 && highestLogicalStepCompleted >= TOTAL_LOGICAL_STEPS - 2));
            if (!canJumpToSummary && logicalStepNumber !== TOTAL_LOGICAL_STEPS) { // Don't allow jumping far ahead unless to summary
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
        
        // If navigating back or to an already completed step, clear selections for subsequent steps
        if (fromDirectNavigation && logicalStepNumber <= highestLogicalStepCompleted +1) { // allow navigation to next step
             // Clear selections of steps *after* the one we are navigating TO
            clearFutureSelections(logicalStepNumber - 1, true); // preserveCurrentLevelSelections if navigating to that level
        }
        updateStepIndicator(); 
        window.scrollTo(0, 0);
    }

    function clearFutureSelections(stepJustCompletedLogical, preserveCurrentLevelSelections = false) {
        // stepJustCompletedLogical is the LOGICAL step number that was just finished OR the target step's preceding step on direct nav
        console.log(`clearFutureSelections called. Logical step completed/navigating to: ${stepJustCompletedLogical+1}, Preserve current: ${preserveCurrentLevelSelections}`);

        if (preserveCurrentLevelSelections) {
            // Clear data for steps AFTER the one being preserved
            if (stepJustCompletedLogical < 1) { selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = []; } // After Brand
            else if (stepJustCompletedLogical < 2) { selections.outdoorUnit = null; selections.indoorUnits = []; } // After Config Type
            else if (stepJustCompletedLogical < 3) { selections.indoorUnits = []; } // After Outdoor Unit
            // else if (stepJustCompletedLogical < 4) {} // After Indoor Units (nothing further to clear before summary)
        } else {
            // Clear data for the current step AND subsequent steps
            if (stepJustCompletedLogical < 0) { selections.brand = null; selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = []; } // Before Brand (full reset)
            else if (stepJustCompletedLogical < 1) { selections.configType = null; selections.outdoorUnit = null; selections.indoorUnits = []; } // After Brand selection changed
            else if (stepJustCompletedLogical < 2) { selections.outdoorUnit = null; selections.indoorUnits = []; } // After Config Type selection changed
            else if (stepJustCompletedLogical < 3) { selections.indoorUnits = []; } // After Outdoor Unit selection changed
        }

        // Repopulate or clear UI sections based on cleared data
        if (selections.brand) {
            populateConfigTypes(preserveCurrentLevelSelections && stepJustCompletedLogical === 0); // Repopulate if brand still selected and it was the preserved level
        } else {
            brandSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            configTypeSelectionDiv.innerHTML = '<p>Seleziona una marca per continuare.</p>';
            outdoorUnitSelectionDiv.innerHTML = '<p>Completa i passaggi precedenti.</p>';
            indoorUnitsSelectionArea.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        }

        if (selections.configType && selections.brand) {
            populateOutdoorUnits(preserveCurrentLevelSelections && stepJustCompletedLogical === 1);
        } else if (selections.brand) { // Config type was cleared
            configTypeSelectionDiv.querySelectorAll('.selection-item.selected').forEach(el => el.classList.remove('selected'));
            outdoorUnitSelectionDiv.innerHTML = '<p>Seleziona una configurazione per continuare.</p>';
            indoorUnitsSelectionArea.innerHTML = '<p>Completa i passaggi precedenti.</p>';
        }

        if (selections.outdoorUnit && selections.configType && selections.brand) {
            populateIndoorUnitSelectors(preserveCurrentLevelSelections && stepJustCompletedLogical === 2);
        } else if (selections.configType) { // Outdoor unit was cleared
            outdoorUnitSelectionDiv.querySelectorAll('.unit-selection-card.selected').forEach(el => el.classList.remove('selected'));
            indoorUnitsSelectionArea.innerHTML = '<p>Seleziona un\'unità esterna per continuare.</p>';
        }
        
        // Always clear summary if changes happen before the summary step
        if (stepJustCompletedLogical < TOTAL_LOGICAL_STEPS - 1) { // If changes before summary step (5th logical step)
            summaryDiv.innerHTML = '';
             if(document.getElementById('summary-main-title')) document.getElementById('summary-main-title').classList.remove('print-main-title');

        }
        
        // Adjust highestLogicalStepCompleted downwards if we've cleared future selections
        // (unless we are preserving the current level and just clearing beyond it for navigation)
        if (!preserveCurrentLevelSelections) {
            highestLogicalStepCompleted = Math.min(highestLogicalStepCompleted, stepJustCompletedLogical);
        }

        checkAllIndoorUnitsSelected(); // Update finalize button state
        updateStepIndicator(); // Reflect changes in step indicator
    }
    
    const brandChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const configChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);
    const ueChanged = (prev, current) => (!prev && current) || (prev && current && prev.id !== current.id);

    function createSelectionItem(item, type, clickHandler, isSelected = false) {
        const itemDiv = document.createElement('div'); itemDiv.classList.add('selection-item');
        if (isSelected) itemDiv.classList.add('selected'); 
        itemDiv.dataset[type + 'Id'] = item.id; // item.id comes from Firestore document ID or a field you designated
        
        let logoSrc = ''; if (type === 'brand' && item.logo) logoSrc = item.logo;
        const nameSpan = document.createElement('span'); nameSpan.textContent = item.name; // item.name from Firestore
        
        if (logoSrc) {
            const logoImg = document.createElement('img'); logoImg.src = logoSrc; logoImg.alt = `${item.name} Logo`;
            logoImg.classList.add('brand-logo');
            // Handle image load/error to show name as fallback
            logoImg.onload = () => { nameSpan.style.display = 'none'; }; // Hide text if logo loads
            logoImg.onerror = () => { 
                console.warn(`DEBUG: Errore caricamento logo ${logoSrc}`); 
                logoImg.style.display = 'none'; 
                nameSpan.style.display = 'block'; // Show text if logo fails
            };
            itemDiv.appendChild(logoImg);
            nameSpan.style.display = 'none'; // Initially hide text if logo is attempted
        } else {
             nameSpan.style.display = 'block'; // Show text if no logo URL
        }
        itemDiv.appendChild(nameSpan);

        itemDiv.addEventListener('click', () => {
            // Visually deselect others, select this one
            const siblings = itemDiv.parentElement.querySelectorAll('.selection-item.selected');
            siblings.forEach(el => el.classList.remove('selected'));
            itemDiv.classList.add('selected');
            
            // highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); // This should be set based on moving FORWARD or VALID selection. Not just any click.
            clickHandler(item); // Pass the full item object
        }); 
        return itemDiv;
    }
    
   function createUnitSelectionCard(unit, clickHandler, isSelected = false) {
        const card = document.createElement('div'); 
        card.classList.add('unit-selection-card');
        if (isSelected) card.classList.add('selected'); 
        card.dataset.unitId = unit.id; // unit.id from Firestore (or your processed object's id)
        
        card.style.flexDirection = "column"; 
        card.style.alignItems = 'flex-start'; // Align items to the start for a cleaner look

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
        if (unit.weight && unit.weight !== "N/D") { // N/D is a string, check for number or valid string
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
            // highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, currentLogicalStep); // Set by handler logic
            clickHandler(unit); // Pass the full unit object
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
        
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId).filter(id => id))]; // Filter out undefined/null brandIds
        console.log("DEBUG: populateBrands - brandId UNICI in outdoorUnits:", uniqueBrandIdsFromUEs);
        
        // Filter APP_DATA.brands to only include those for which we have UEs
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
                selections.brand = selectedBrand; // selectedBrand is {id:"haier", name:"Haier", logo:"..."}
                
                if (brandHasChanged) { 
                    clearFutureSelections(0, false); // Clear from step configType onwards
                    highestLogicalStepCompleted = 0; // Reset completion since brand changed
                }
                populateConfigTypes(!brandHasChanged && !!selections.configType); 
                showStep(2); // Move to logical step 2 (Config Type)
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 1); // Mark Brand selection as complete
                updateStepIndicator();

            }, selections.brand && selections.brand.id === brand.id));
        });
        console.log("DEBUG: populateBrands - Fine.");

        // If restoring state and a brand was already selected & is still valid
        if(selections.brand && brandsToShow.some(b => b.id === selections.brand.id)) {
            populateConfigTypes(true); // Attempt to restore config type selection
        } else if (selections.brand) { // If previously selected brand is no longer valid (e.g. UEs changed)
            selections.brand = null; // Clear invalid selection
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
        
        const configTypeList = Object.values(APP_DATA.configTypes); // APP_DATA.configTypes is an object {id: data}

        const validConfigs = configTypeList.map(ct => { // ct is like { id: "dual", name: "...", numUnits: 2 }
            const hasMatchingUE = APP_DATA.outdoorUnits.some(ue => 
                ue.brandId === selections.brand.id && 
                ue.connections >= ct.numUnits && 
                ue.minConnections <= ct.numUnits
            );
            return hasMatchingUE ? ct : null;
        }).filter(Boolean); // Remove nulls

        console.log("DEBUG: populateConfigTypes - Configurazioni valide per marca:", JSON.parse(JSON.stringify(validConfigs)));
        
        if(validConfigs.length === 0) { 
            configTypeSelectionDiv.innerHTML = `<p>Nessuna configurazione multi-split disponibile per ${selections.brand.name} con le unità esterne attualmente caricate. Controlla i dati delle unità esterne ('unit_collegabili' e 'min_connessioni_ue').</p>`; 
            if (restoring) selections.configType = null; 
            return; 
        }
        
        validConfigs.forEach(item => { // item is { id: "dual", name: "Dual Split...", numUnits: 2 }
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = configChanged(selections.configType, selectedConfig); 
                selections.configType = selectedConfig; // selectedConfig is {id:"dual", name:"...", numUnits:2}
                
                if (configHasChanged) { 
                    clearFutureSelections(1, false); // Clear from outdoorUnit onwards
                    highestLogicalStepCompleted = 1; // Reset completion to after brand, as config changed
                }
                populateOutdoorUnits(!configHasChanged && !!selections.outdoorUnit);
                showStep(3); // Move to logical step 3 (Outdoor Unit)
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 2); // Mark Config Type selection as complete
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
                    clearFutureSelections(2, false); // Clear from indoorUnits onwards
                    highestLogicalStepCompleted = 2; // Reset completion
                }
                
                if (selections.configType.numUnits === 0) { // Should not happen for standard multi-split
                    console.log("Configurazione non richiede unità interne. Finalizzo.");
                    generateSummary(); 
                    showStep(TOTAL_LOGICAL_STEPS); // Skip to summary (logical step 5)
                    highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); // effectively completes UI selection step too
                } else {
                    populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0 && selections.indoorUnits.some(ui => ui !== null));
                    showStep(4); // Move to logical step 4 (Indoor Units)
                    highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3); // Mark UE selection as complete
                }
                checkAllIndoorUnitsSelected(); // Enable/disable finalize btn
                updateStepIndicator();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });

        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) {
            if (selections.configType.numUnits > 0) {
                populateIndoorUnitSelectors(true);
            } else {
                 // If 0 UI, summary might need to be triggered if this was the last step of restore
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
                           selections.indoorUnits.every(ui => ui === null || (ui && ui.brandId === selections.brand.id)); // Check if all slots have a UI or are null
        
        if (!validRestore) {
            console.log("DEBUG: populateIndoorUnitSelectors - Resettando array unità interne.");
            selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
        }

        // Get compatible series IDs from the selected Outdoor Unit
        const compatibleSeriesForUE = selections.outdoorUnit.compatibleIndoorSeriesIds || [];
        if (compatibleSeriesForUE.length === 0 && APP_DATA.indoorUnits.some(ui => ui.brandId === selections.brand.id)) { // Only warn if UIs for brand exist
            console.warn(`Nessuna serie di Unità Interne compatibile specificata per l'Unità Esterna ${selections.outdoorUnit.id} (${selections.outdoorUnit.name}). Saranno mostrate tutte le UI della marca ${selections.brand.name}, ma la compatibilità effettiva non è garantita senza specifiche. Aggiungere 'compatibleIndoorSeriesIds' all'UE.`);
        }
        
        // Filter available Indoor Units based on brand and (if available) compatible series
        const availableIndoorUnits = APP_DATA.indoorUnits.filter(ui => {
            const brandMatch = ui.brandId === selections.brand.id;
            // If UE has no compatible series specified, show all UIs of that brand (with a warning).
            // Otherwise, filter by the specified compatible series.
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
            slotDiv.style.marginBottom = '20px'; // Add some spacing
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
                // Provide more details in the option text if helpful
                option.textContent = `${ui.name} (Mod: ${ui.modelCode}, BTU: ${ui.capacityBTU}, Prezzo: ${ui.price.toFixed(2)}€)`;
                // If restoring and this UI was selected for this slot
                if (validRestore && selections.indoorUnits[i] && selections.indoorUnits[i].id === ui.id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
            const detailsDiv = document.createElement('div'); 
            detailsDiv.classList.add('unit-details');
            detailsDiv.style.fontSize = '0.9em';
            detailsDiv.style.paddingLeft = '10px';
            
            // If restoring, and a valid UI was selected, populate its details
            if (validRestore && selections.indoorUnits[i] && availableIndoorUnits.some(avail => avail.id === selections.indoorUnits[i].id)) {
                const currentSelectedUI = selections.indoorUnits[i];
                 detailsDiv.innerHTML = `
                    <p style="margin: 3px 0;"><strong>Modello:</strong> ${currentSelectedUI.modelCode}</p>
                    <p style="margin: 3px 0;"><strong>BTU:</strong> ${currentSelectedUI.capacityBTU} - <strong>Prezzo:</strong> ${currentSelectedUI.price.toFixed(2)}€</p>
                    ${currentSelectedUI.image ? `<img src="${currentSelectedUI.image}" alt="${currentSelectedUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px;">` : ''}`;
            } else if (validRestore && selections.indoorUnits[i]) {
                // Selected UI from restore is not in available list (e.g., due to UE change or data update), invalidate it
                console.warn(`DEBUG: UI ${selections.indoorUnits[i].id} precedentemente selezionata per lo slot ${i+1} non è più disponibile/compatibile con la UE attuale. Slot resettato.`);
                selections.indoorUnits[i] = null; // Clear the invalid restored selection
            }
            
            select.addEventListener('change', (e) => {
                const selectedId = e.target.value;
                const unitIndex = parseInt(e.target.dataset.index);
                const selectedUI = availableIndoorUnits.find(u => u.id === selectedId);
                
                selections.indoorUnits[unitIndex] = selectedUI || null; // Update the global selections
                
                if (selectedUI) {
                    detailsDiv.innerHTML = `
                        <p style="margin: 3px 0;"><strong>Modello:</strong> ${selectedUI.modelCode}</p>
                        <p style="margin: 3px 0;"><strong>BTU:</strong> ${selectedUI.capacityBTU} - <strong>Prezzo:</strong> ${selectedUI.price.toFixed(2)}€</p>
                        ${selectedUI.image ? `<img src="${selectedUI.image}" alt="${selectedUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px;">` : ''}`;
                } else {
                    detailsDiv.innerHTML = ''; // Clear details if placeholder selected
                }
                checkAllIndoorUnitsSelected(); // Update finalize button
                // highestLogicalStepCompleted is managed by checkAllIndoorUnitsSelected or next button
            });
            
            slotDiv.appendChild(select); 
            slotDiv.appendChild(detailsDiv); 
            indoorUnitsSelectionArea.appendChild(slotDiv);
        }
        checkAllIndoorUnitsSelected(); // Initial check after populating
    }

    function checkAllIndoorUnitsSelected() { 
        let allSelected = false;
        if (selections.configType?.numUnits === 0) { // Edge case: config requires 0 UI
            allSelected = true; // No UI selection needed
        } else if (selections.configType && selections.indoorUnits.length === selections.configType.numUnits) {
            // All slots must have a non-null UI object selected
            allSelected = selections.indoorUnits.every(ui => ui !== null && ui !== undefined);
        }
        
        if(finalizeBtn) {
            finalizeBtn.disabled = !allSelected;
        }

        // If all UIs are selected (or not needed), this step is considered complete or ready for completion
        if(allSelected) {
             if (selections.configType && selections.configType.numUnits > 0) {
                 highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); // UI selection (step 4) complete
             } else if (selections.configType && selections.configType.numUnits === 0) {
                 // If 0 UIs needed, then after UE selection (step 3), this stage (step 4 conceptually) is also complete
                 highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3);
             }
        }
        updateStepIndicator(); // Update indicator based on new completion status
    }

    function generateSummary() {
        console.log("DEBUG: generateSummary called. Current Selections:", JSON.parse(JSON.stringify(selections)));
        summaryDiv.innerHTML = ''; // Clear previous summary
        
        if (!selections.brand || !selections.configType || !selections.outdoorUnit ) {
            summaryDiv.innerHTML = "<p>Configurazione incompleta. Torna indietro e completa tutti i passaggi richiesti.</p>";
            return;
        }
        // Check if indoor units selection is complete IF configType requires them
        if (selections.configType.numUnits > 0 && 
            (selections.indoorUnits.length !== selections.configType.numUnits || selections.indoorUnits.some(ui => !ui))) {
             summaryDiv.innerHTML = "<p>Selezione delle unità interne incompleta. Torna indietro e completa la selezione per tutte le unità richieste.</p>";
            return;
        }

        let totalNominalBTU_UI = 0;
        let totalPrice = selections.outdoorUnit.price || 0;

        // Helper to format optional values
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
                    totalNominalBTU_UI += ui.capacityBTU || 0; // Summing nominal BTU of selected UIs
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

    // Event Listeners (Prev/Next buttons, Step indicators, Reset, Print)
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

            if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { // Attempting to go to Summary
                 // Check if prerequisite steps are met before generating summary
                 const uisNeeded = selections.configType && selections.configType.numUnits > 0;
                 const uisNotFullySelected = uisNeeded && (!selections.indoorUnits.every(ui => ui !== null));

                 if ( !selections.brand || !selections.configType || !selections.outdoorUnit || uisNotFullySelected ) {
                    alert("Completa tutti i passaggi precedenti, inclusa la selezione di tutte le unità interne richieste, prima di visualizzare il riepilogo."); 
                    return; 
                 }
                 generateSummary(); 
            }
            showStep(targetLogicalStep, true); // fromDirectNavigation = true
        });
    });

    if(finalizeBtn) { 
        finalizeBtn.addEventListener('click', () => { 
            console.log("Finalize button clicked.");
            // This button should only be enabled if all UIs are selected.
            // So, at this point, logical step 4 (UI selection) is complete.
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); 
            generateSummary(); 
            showStep(TOTAL_LOGICAL_STEPS); // Show summary step (logical step 5)
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
                showStep(prevLogicalStep, true); // fromDirectNavigation = true
            });
        } else {
            button.style.display = 'none'; // Hide prev button on the first logical step
        }
     });

    document.getElementById('reset-config-btn')?.addEventListener('click', () => { 
         console.log("Reset configuration button clicked.");
         if (!confirm("Sei sicuro di voler resettare l'intera configurazione?")) return;

         highestLogicalStepCompleted = 0; 
         // Clear all selections
         selections.brand = null; 
         selections.configType = null; 
         selections.outdoorUnit = null; 
         selections.indoorUnits = [];
         
         clearFutureSelections(-1, false); // Special value to clear all, not preserving any level
         
         const summaryTitleEl = document.getElementById('summary-main-title');
         if (summaryTitleEl) summaryTitleEl.classList.remove('print-main-title'); 
         summaryDiv.innerHTML = ''; 
         if (finalizeBtn) finalizeBtn.disabled = true;
         
         showStep(1); // Go back to the first step
    });

    document.getElementById('print-summary-btn')?.addEventListener('click', () => {
        if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("Configurazione incompleta")) {
            window.print();
        } else {
            alert("Assicurati di aver completato la configurazione e di essere nella pagina di Riepilogo prima di stampare.");
        }
    });
    
    // This button is in the main app header, usually for printing a general price list.
    // For the configurator context, it should also check if a summary is ready.
    document.getElementById('print-list')?.addEventListener('click', () => { 
         if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("Configurazione incompleta")) {
            window.print();
         } else {
            alert("Per stampare la configurazione, completa tutti i passaggi fino al Riepilogo (Passaggio 5).");
         }
    });


    // --- MODIFIED initializeApp function ---
    async function initializeApp() {
        console.log("DEBUG: Chiamata a initializeApp (Firebase Version for clima-multisplit)");
        document.body.appendChild(loadingOverlay);
        loadingOverlay.style.display = 'flex';

        try {
            console.log("DEBUG: Inizio caricamento dati da Firestore...");
            const [
                brandsData,
                configTypesData,
                uiSeriesMapData,
                outdoorUnitsDocs,
                indoorUnitsDocs,
                metadataDoc // Fetch metadata for last update
            ] = await Promise.all([
                fetchFirestoreCollection('brands'),
                fetchFirestoreCollection('configTypes'),
                fetchFirestoreCollection('uiSeriesImageMapping'),
                fetchFirestoreCollection('outdoorUnits'),
                fetchFirestoreCollection('indoorUnits'),
                db.collection('metadata').doc('appInfo').get() // Specific doc
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
            brandSelectionContent === "" || brandSelectionContent === "<p>...</p>") { // Added check for placeholder
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

            // Keep overlay or show a more detailed error in place of the loading overlay
             if (loadingOverlay.style.display !== 'none') { // Only update if still visible
                loadingOverlay.innerHTML = `<p style="color:orange; font-weight:bold; font-size:1.1em;">Errore nel Caricamento Dati Iniziali</p><div style="font-size:0.9em; text-align:left; max-width: 500px; margin: 0 auto;">${errorMsg}</div>`;
             } else { // If overlay was hidden too fast, show error in brand section
                brandSelectionDiv.innerHTML = `<div style="color:orange; padding:10px; border:1px solid orange;">${errorMsg}</div>`;
             }

        } else if (brandSelectionDiv.children.length > 0) {
            loadingOverlay.style.display = 'none'; 
        } else {
             // Fallback for unexpected empty brandSelectionDiv
             if (loadingOverlay.style.display !== 'none') {
                 loadingOverlay.innerHTML += `<br><span style="color:orange;font-size:0.8em;">Configurazione iniziale UI inattesa dopo il caricamento dei dati.</span>`;
             }
        }
        
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        try {
            const metadata = arguments[0][5]; // arguments is de-structured promise array from Promise.all
                                        // index 5 was db.collection('metadata').doc('appInfo').get()
            if (metadata && metadata.exists && metadata.data().lastDataUpdate) {
                // Firestore Timestamps need to be converted
                const timestamp = metadata.data().lastDataUpdate;
                document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
            } else {
                 console.log("DEBUG: Documento metadata/appInfo non trovato o campo lastDataUpdate mancante.");
                document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
            }
        } catch(err) {
             console.warn("Impossibile caricare metadata.lastDataUpdate:", err);
             document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        }


        showStep(1); // Show the first logical step
    }

    console.log("DEBUG: Prima di chiamare initializeApp (Firebase Version for clima-multisplit)");
    initializeApp();
    console.log("DEBUG: Dopo aver chiamato initializeApp (Firebase Version for clima-multisplit)");
});
// --- END OF SCRIPT.JS (FIREBASE VERSION FOR clima-multisplit) ---