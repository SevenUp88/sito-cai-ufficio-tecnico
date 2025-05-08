// --- START OF SCRIPT.JS (FIREBASE - 6 STEP FLOW) ---
// Flow: Marca -> Config -> Serie -> UE -> UI Taglie -> Riepilogo

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Contenuto Caricato - Inizio script.js (6-Step Flow)");

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyCWHMshTGoiZbRj_nK0uoZjHCv8fe2UnaU", 
        authDomain: "clima-multisplit.firebaseapp.com",   
        projectId: "clima-multisplit",                    
        storageBucket: "clima-multisplit.appspot.com", 
        messagingSenderId: "314966609042",            
        appId: "1:314966609042:web:694658c76e56579b12ea4b", 
        measurementId: "G-MWFX55K8CH"                     
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // --- App Data & State ---
    const APP_DATA = {
        brands: [], 
        uiSeriesImageMapping: {}, 
        configTypes: {}, 
        outdoorUnits: [],
        indoorUnits: [] // Will also contain processed seriesName, seriesId, btu, kw
    };
    let currentLogicalStep = 1;
    let highestLogicalStepCompleted = 0;
    // Added indoorSeries selection
    const selections = { 
        brand: null,          // {id, name, logo}
        configType: null,     // {id, name, numUnits}
        indoorSeries: null,   // {name, id (like "revive_ui")}
        outdoorUnit: null,    // Full outdoor unit object
        indoorUnits: []       // Array of selected indoor unit objects (specific sizes)
    };

    // --- DOM Element References ---
    const brandSelectionDiv = document.getElementById('brand-selection');         // HTML div for Step 1 (Marca)
    const configTypeSelectionDiv = document.getElementById('config-type-selection');  // HTML div for Step 2 (Config)
    const indoorSeriesSelectionDiv = document.getElementById('model-selection');    // HTML div for Step 3 (Serie UI) -> USING step-2 div in HTML
    const outdoorUnitSelectionDiv = document.getElementById('outdoor-unit-selection'); // HTML div for Step 4 (UE)
    const indoorUnitsSelectionArea = document.getElementById('indoor-units-selection-area'); // HTML div for Step 5 (UI Sizes)
    const summaryDiv = document.getElementById('config-summary');             // HTML div for Step 6 (Summary)
    const finalizeBtn = document.getElementById('finalize-btn');
    const stepsHtmlContainers = document.querySelectorAll('.config-step'); // All divs like <div id="step-1" class="config-step">...</div>
    const stepIndicatorItems = document.querySelectorAll('.step-indicator .step-item');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.2em;color:var(--primary-color);z-index:2000;text-align:center;padding:20px;box-sizing:border-box;`;
    loadingOverlay.innerHTML = '<div class="loading-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px;"></div><p>Caricamento dati...</p><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

    // --- Step Mapping (Updated for 6 steps, inserting Series between Config and UE) ---
    const TOTAL_LOGICAL_STEPS = 6;
    // Map Logical Step Number -> HTML Div ID used for that step's content
    const LOGICAL_TO_HTML_STEP_MAP = { 
        1: "step-1", // Marca
        2: "step-3", // Config
        3: "step-2", // Serie UI *** USES HTML div#step-2 ***
        4: "step-4", // Unità Est.
        5: "step-5", // Unità Int. (Taglie)
        6: "step-6"  // Riepilogo
    };
    // Map HTML Div ID -> Logical Step Number
    const HTML_TO_LOGICAL_STEP_MAP = { 
        "step-1": 1, 
        "step-3": 2, 
        "step-2": 3, // *** NOTE MAPPING ***
        "step-4": 4, 
        "step-5": 5, 
        "step-6": 6 
    };
    // Map Logical Step Number -> Name for Display
    const LOGICAL_STEP_NAMES = [ 
        "Marca", 
        "Config.", 
        "Serie UI", 
        "Unità Est.", 
        "Unità Int.", 
        "Riepilogo" 
    ];


    // --- Utility & Data Fetching ---
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

    function parsePowerString(powerStr) { // Parses "2,5kW - 9000BTU" type strings
        let btu = 0;
        let kw = "N/A";
        if (typeof powerStr === 'string' && powerStr !== "Dati mancanti") {
            const btuMatch = powerStr.match(/([\d.,]+)\s*BTU/i);
            if (btuMatch && btuMatch[1]) {
                btu = parseInt(btuMatch[1].replace(/[.,]/g, ''), 10) || 0;
            }
            const kwMatch = powerStr.match(/([\d.,]+)\s*kW/i);
            if (kwMatch && kwMatch[1]) {
                kw = kwMatch[1].replace(',', '.');
            } else if (btu > 0 && kw === "N/A") {
                 kw = (btu / 3412.14).toFixed(1);
            }
        }
        return { btu, kw };
    }

    function sanitizeForId(str) {
         if (!str) return '';
         return String(str).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/gi, '');
    }

    // Process Firestore data into usable structures
    function processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs) {
        console.log("DEBUG: Processing Firestore data. Brands:", brandsDocs.length, "Configs:", configTypesDocs.length, "Series Maps:", seriesMapDocs.length, "UE:", outdoorUnitsDocs.length, "UI:", indoorUnitsDocs.length);
        
        // 1. Brands (simple pass-through, already uploaded correctly)
        APP_DATA.brands = brandsDocs; 

        // 2. Config Types (convert to object keyed by id for easy lookup)
        APP_DATA.configTypes = configTypesDocs.reduce((acc, ct) => {
            acc[ct.id] = { id: ct.id, name: ct.name, numUnits: ct.numUnits };
            return acc;
        }, {});

        // 3. UI Series Image Mapping (convert to object { seriesId -> imageName })
        APP_DATA.uiSeriesImageMapping = seriesMapDocs.reduce((acc, mapping) => {
            if(mapping.seriesKey) acc[mapping.seriesKey] = mapping.imageName; // seriesKey is like "revive_ui"
            return acc;
        }, {});

        // 4. Outdoor Units (process kW -> BTU, ensure compatibleIds array exists)
        APP_DATA.outdoorUnits = outdoorUnitsDocs.map((ue_doc, index) => {
            const brandId = String(ue_doc.marca || 'sconosciuta').toLowerCase(); 
            const connections = Number(ue_doc.unit_collegabili) || 0; 
            const minConnectionsFallback = connections > 0 ? (connections < 2 ? 1 : 2) : 1;
            const uePotenzaKw = Number(ue_doc.potenza) || 0; // Potenza field is kW number from migration
            
            // Estimate BTU from kW - IMPROVE THIS if UE sheet has specific BTU
            const coolingBTU_UE = Math.round(uePotenzaKw * 3412.14); 
            const heatingBTU_UE = coolingBTU_UE; // Placeholder

            return {
                id: ue_doc.id || `ue_${index}`, // Use Firestore ID
                brandId: brandId,
                modelCode: ue_doc.codice_prodotto || "N/A", 
                name: ue_doc.nome_modello_ue && ue_doc.nome_modello_ue !== "Dati mancanti" 
                    ? `${String(ue_doc.marca || '').toUpperCase()} ${ue_doc.nome_modello_ue}` 
                    : `UE ${String(ue_doc.marca || '').toUpperCase()} (${ue_doc.codice_prodotto || 'ID: ' + ue_doc.id})`,
                connections: connections,
                minConnections: Number(ue_doc.min_connessioni_ue) || minConnectionsFallback, // Expect 'min_connessioni_ue' field from migration
                capacityCoolingBTU: coolingBTU_UE,
                capacityHeatingBTU: heatingBTU_UE,
                price: Number(ue_doc.prezzo) || 0,
                dimensions: ue_doc.dimensioni_ue || "N/A",
                weight: (ue_doc.peso_ue !== "Dati mancanti" && ue_doc.peso_ue !== undefined) ? ue_doc.peso_ue : "N/D", 
                energyClassCooling: ue_doc.classe_energetica_raffrescamento || "N/D",
                energyClassHeating: ue_doc.classe_energetica_riscaldamento || "N/D",
                // Expecting an Array from updated migration script
                compatibleIndoorSeriesIds: Array.isArray(ue_doc.compatibleIndoorSeriesIds) ? ue_doc.compatibleIndoorSeriesIds : [] 
            };
        });

        // 5. Indoor Units (parse potenza, derive seriesId, get image path)
        APP_DATA.indoorUnits = indoorUnitsDocs.map((ui_doc, index) => {
            const brandId = String(ui_doc.marca || 'sconosciuta').toLowerCase();
            const seriesName = String(ui_doc.modello || `serie_${index}`).trim(); // Use modello as Series Name
            const seriesId = sanitizeForId(seriesName) + "_ui"; // Generate seriesId like "revive_ui"

            const { btu, kw } = parsePowerString(ui_doc.potenza); 
            
            let imagePath = "";
            if (ui_doc.percorso_immagine_ui && ui_doc.percorso_immagine_ui !== "Dati mancanti") {
                imagePath = ui_doc.percorso_immagine_ui; // Priority 1: Specific path from data
            } else {
                let imageNameMapped = APP_DATA.uiSeriesImageMapping[seriesId]; // Priority 2: Mapped name
                if (!imageNameMapped) {
                    imageNameMapped = sanitizeForId(seriesName); // Priority 3: Sanitized series name
                     // Optional: console.warn if no mapping found and fallback used
                     // console.warn(`No image mapping found for seriesId: ${seriesId} (Derived from: ${seriesName}). Falling back to ${imageNameMapped}.png`);
                }
                 imagePath = `img/${imageNameMapped}.png`; 
            }
            
            return {
                id: ui_doc.id || `ui_${index}`, // Use Firestore ID
                brandId: brandId,
                seriesId: seriesId,     // Generated ID, e.g., "revive_ui"
                seriesName: seriesName, // Original name, e.g., "REVIVE"
                modelCode: ui_doc.codice_prodotto || "N/A",
                name: `${String(ui_doc.marca || '').toUpperCase()} ${seriesName} ${kw}kW (${btu} BTU)`, // Name reflects model+power
                type: String(ui_doc.tipo_unit || 'Parete').toLowerCase() === "interna" ? "Parete" : ui_doc.tipo_unit,
                capacityBTU: btu,
                kw: kw, // Store kW as well
                price: Number(ui_doc.prezzo_ui) || 0,
                image: imagePath,
                dimensions: ui_doc.dimensioni_ui || "N/A",
                wifi: ui_doc.wifi === true // Boolean expected from migration
            };
        });

        console.log("DEBUG: Processing Firestore data finished.");
         console.log("DEBUG: First Processed UE:", APP_DATA.outdoorUnits.length > 0 ? JSON.stringify(APP_DATA.outdoorUnits[0]) : "ND");
         console.log("DEBUG: First Processed UI:", APP_DATA.indoorUnits.length > 0 ? JSON.stringify(APP_DATA.indoorUnits[0]) : "ND");
    }

    // --- UI Population Functions ---

    // STEP 1: MARCA
    function populateBrands() {
        brandSelectionDiv.innerHTML = ''; 
        console.log("DEBUG: populateBrands called. Using APP_DATA.brands:", APP_DATA.brands.length);
        
        if (!APP_DATA.outdoorUnits || APP_DATA.outdoorUnits.length === 0) { 
            brandSelectionDiv.innerHTML = '<p>Dati unità esterne non disponibili. Impossibile mostrare marche.</p>';
            console.warn("populateBrands - outdoorUnits empty!"); 
            return; 
        }
        
        const uniqueBrandIdsFromUEs = [...new Set(APP_DATA.outdoorUnits.map(ue => ue.brandId).filter(id => id && id !== 'sconosciuta'))]; 
        console.log("DEBUG: populateBrands - brandId unique from UEs:", uniqueBrandIdsFromUEs);
        
        const brandsToShow = APP_DATA.brands.filter(b => uniqueBrandIdsFromUEs.includes(b.id));
        console.log("DEBUG: populateBrands - brandsToShow:", brandsToShow.length);
        
        if (brandsToShow.length === 0) {
            brandSelectionDiv.innerHTML = '<p>Nessuna marca trovata con unità esterne compatibili. Controlla la coerenza tra la collezione `brands` e il campo `marca` nella collezione `outdoorUnits` in Firestore.</p>'; 
            return;
        }

        brandsToShow.forEach(brand => { 
            brandSelectionDiv.appendChild(createSelectionItem(brand, 'brand', (selectedBrand) => {
                const brandHasChanged = selections.brand?.id !== selectedBrand.id; 
                selections.brand = selectedBrand; 
                if (brandHasChanged) { 
                    clearFutureSelections(1, false); // Clear from Config onwards
                    highestLogicalStepCompleted = 1; 
                }
                populateConfigTypes(!brandHasChanged && !!selections.configType); // Populate Step 2 (Config)
                showStep(2); // Show Step 2
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 1);
                updateStepIndicator();
            }, selections.brand && selections.brand.id === brand.id));
        });
    }

    // STEP 2: CONFIG TYPE
    function populateConfigTypes(restoring = false) {
        configTypeSelectionDiv.innerHTML = '';
        if (!selections.brand) { 
            configTypeSelectionDiv.innerHTML = '<p>Seleziona una marca.</p>'; 
            if(restoring) selections.configType = null; 
            return; 
        }
        console.log(`DEBUG: populateConfigTypes - Marca: ${selections.brand.id}`);
        
        const configTypeList = Object.values(APP_DATA.configTypes); 
        // Filter valid config types for the selected brand
        const validConfigs = configTypeList.filter(ct => {
            return APP_DATA.outdoorUnits.some(ue => 
                ue.brandId === selections.brand.id && 
                ue.connections >= ct.numUnits && 
                ue.minConnections <= ct.numUnits
            );
        }).sort((a, b) => a.numUnits - b.numUnits); // Sort by numUnits

        console.log("DEBUG: populateConfigTypes - Valid Configs:", validConfigs.length);
        if (validConfigs.length === 0) { 
            configTypeSelectionDiv.innerHTML = `<p>Nessuna configurazione (Dual, Trial, etc.) trovata per le unità esterne della marca ${selections.brand.name}. Controllare i campi 'unit_collegabili' e 'min_connessioni_ue' delle UE ${selections.brand.name} in Firestore.</p>`; 
            if (restoring) selections.configType = null; 
            return; 
        }
        
        validConfigs.forEach(item => { 
            configTypeSelectionDiv.appendChild(createSelectionItem(item, 'config', (selectedConfig) => {
                const configHasChanged = selections.configType?.id !== selectedConfig.id;
                selections.configType = selectedConfig; 
                if (configHasChanged) { 
                    clearFutureSelections(2, false); // Clear from Series onwards
                    highestLogicalStepCompleted = 2; 
                }
                populateIndoorSeries(!configHasChanged && !!selections.indoorSeries); // Populate Step 3 (Series)
                showStep(3); // Show Step 3
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 2); 
                updateStepIndicator();
            }, selections.configType && selections.configType.id === item.id));
        });

        if(restoring && selections.configType && validConfigs.some(vc => vc.id === selections.configType.id)) {
            populateIndoorSeries(true); // Attempt restore Step 3
        } else if (restoring && selections.configType) {
            selections.configType = null;
        }
    }

    // STEP 3: INDOOR SERIES / MODELLO UI (New)
    function populateIndoorSeries(restoring = false) {
        indoorSeriesSelectionDiv.innerHTML = ''; // Uses #model-selection div (HTML step-2)
        if (!selections.brand || !selections.configType) {
            indoorSeriesSelectionDiv.innerHTML = '<p>Seleziona Marca e Configurazione.</p>';
            if (restoring) selections.indoorSeries = null;
            return;
        }
        console.log(`DEBUG: populateIndoorSeries - Marca: ${selections.brand.id}, Config: ${selections.configType.id}`);

        // Find candidate Outdoor Units matching Brand & Config Type
        const candidateUEs = APP_DATA.outdoorUnits.filter(ue =>
            ue.brandId === selections.brand.id &&
            ue.connections >= selections.configType.numUnits &&
            ue.minConnections <= selections.configType.numUnits
        );
        if (candidateUEs.length === 0) {
             indoorSeriesSelectionDiv.innerHTML = `<p>Nessuna Unità Esterna ${selections.brand.name} trovata compatibile con la configurazione ${selections.configType.name}. Impossibile determinare le serie UI.</p>`;
             if (restoring) selections.indoorSeries = null;
            return;
        }

        // Collect all unique indoor series IDs supported by these candidate UEs
        const compatibleSeriesIdsSet = new Set();
        candidateUEs.forEach(ue => {
            if (Array.isArray(ue.compatibleIndoorSeriesIds)) {
                ue.compatibleIndoorSeriesIds.forEach(id => compatibleSeriesIdsSet.add(id));
            }
        });
        console.log(`DEBUG: populateIndoorSeries - Compatible UI Series IDs from relevant UEs:`, [...compatibleSeriesIdsSet]);

        // Find Indoor Units of the selected Brand whose seriesId is in the compatible set
        const validIndoorUnitsForSeriesSelection = APP_DATA.indoorUnits.filter(ui =>
            ui.brandId === selections.brand.id &&
            compatibleSeriesIdsSet.has(ui.seriesId)
        );

        // Extract unique Series (Name and ID) from these valid Indoor Units
        const uniqueSeries = [];
        const seenSeriesNames = new Set();
        validIndoorUnitsForSeriesSelection.forEach(ui => {
            if (!seenSeriesNames.has(ui.seriesName)) {
                uniqueSeries.push({ name: ui.seriesName, id: ui.seriesId }); // Store both name and id
                seenSeriesNames.add(ui.seriesName);
            }
        });
         console.log(`DEBUG: populateIndoorSeries - Unique Series Found:`, uniqueSeries);

        if (uniqueSeries.length === 0) {
            indoorSeriesSelectionDiv.innerHTML = `<p>Nessuna Serie di Unità Interne ${selections.brand.name} trovata che sia compatibile con le Unità Esterne adatte alla configurazione ${selections.configType.name}.</p>`;
             if (restoring) selections.indoorSeries = null;
            return;
        }

         uniqueSeries.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        uniqueSeries.forEach(series => {
            // NOTE: Using createSelectionItem assumes a certain visual style. You might want a different card here.
            indoorSeriesSelectionDiv.appendChild(createSelectionItem({ name: series.name, id: series.id }, 'series', (selectedSeries) => {
                const seriesHasChanged = selections.indoorSeries?.id !== selectedSeries.id;
                 // We store the object { name: "REVIVE", id: "revive_ui"}
                selections.indoorSeries = selectedSeries; 
                if (seriesHasChanged) {
                    clearFutureSelections(3, false); // Clear from UE onwards
                    highestLogicalStepCompleted = 3;
                }
                populateOutdoorUnits(!seriesHasChanged && !!selections.outdoorUnit); // Populate Step 4 (UE)
                showStep(4); // Show Step 4
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 3);
                updateStepIndicator();
            }, selections.indoorSeries && selections.indoorSeries.id === series.id));
        });
        
         if(restoring && selections.indoorSeries && uniqueSeries.some(s => s.id === selections.indoorSeries.id)) {
            populateOutdoorUnits(true); // Attempt restore Step 4
        } else if (restoring && selections.indoorSeries) {
            selections.indoorSeries = null;
        }
    }


    // STEP 4: OUTDOOR UNIT
    function populateOutdoorUnits(restoring = false) {
        outdoorUnitSelectionDiv.innerHTML = '';
        if (!selections.brand || !selections.configType || !selections.indoorSeries) { 
            outdoorUnitSelectionDiv.innerHTML = '<p>Seleziona Marca, Configurazione e Serie UI.</p>'; 
            if(restoring) selections.outdoorUnit = null; 
            return; 
        }
        console.log(`DEBUG: populateOutdoorUnits - Brand: ${selections.brand.id}, Config: ${selections.configType.id}, Series: ${selections.indoorSeries.id}`);
        
        const numRequired = selections.configType.numUnits;
        const requiredSeriesId = selections.indoorSeries.id;

        // Filter UEs by Brand, Config Num Units, AND Compatibility with Selected UI Series
        const compatibleUEs = APP_DATA.outdoorUnits.filter(ue => 
            ue.brandId === selections.brand.id && 
            ue.connections >= numRequired && 
            ue.minConnections <= numRequired &&
            Array.isArray(ue.compatibleIndoorSeriesIds) && // Ensure it's an array
            ue.compatibleIndoorSeriesIds.includes(requiredSeriesId) // Check if selected series is compatible
        );
        
        console.log(`DEBUG: populateOutdoorUnits - Found ${compatibleUEs.length} compatible UEs.`);
        if (compatibleUEs.length === 0) { 
            outdoorUnitSelectionDiv.innerHTML = `<p>Nessuna Unità Esterna ${selections.brand.name} trovata per Config. ${selections.configType.name} CHE SIA COMPATIBILE con la Serie UI "${selections.indoorSeries.name}". Prova una Serie UI diversa.</p>`; 
            if(restoring) selections.outdoorUnit = null; 
            return; 
        }
        
        compatibleUEs.forEach(ue => {
            outdoorUnitSelectionDiv.appendChild(createUnitSelectionCard(ue, (selectedUE) => {
                const ueHasChanged = selections.outdoorUnit?.id !== selectedUE.id;
                selections.outdoorUnit = selectedUE;
                if (ueHasChanged) { 
                    clearFutureSelections(4, false); // Clear from UI Sizes onwards
                    highestLogicalStepCompleted = 4; 
                }
                populateIndoorUnitSelectors(!ueHasChanged && selections.indoorUnits.length > 0 && selections.indoorUnits.some(ui => ui !== null)); // Populate Step 5
                showStep(5); // Show Step 5
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 4); 
                updateStepIndicator();
            }, selections.outdoorUnit && selections.outdoorUnit.id === ue.id));
        });

        if(restoring && selections.outdoorUnit && compatibleUEs.some(ue => ue.id === selections.outdoorUnit.id)) {
           populateIndoorUnitSelectors(true); // Attempt restore Step 5
        } else if (restoring && selections.outdoorUnit) {
            selections.outdoorUnit = null;
        }
    }
    
    // STEP 5: INDOOR UNIT SIZES/VARIANTS
    function populateIndoorUnitSelectors(restoring = false) { 
        indoorUnitsSelectionArea.innerHTML = '';
        if (!selections.outdoorUnit || !selections.configType || !selections.brand || !selections.indoorSeries) { 
            indoorUnitsSelectionArea.innerHTML = `<p>Completa i passaggi precedenti.</p>`; 
            checkAllIndoorUnitsSelected(); // Update button state
            return; 
        }
        console.log(`DEBUG: populateIndoorUnitSelectors - Series Chosen: ${selections.indoorSeries.name} (${selections.indoorSeries.id})`);

        // Filter available indoor units by Brand AND the selected Series ID ONLY
        const availableIndoorUnitsForSeries = APP_DATA.indoorUnits.filter(ui => 
            ui.brandId === selections.brand.id && 
            ui.seriesId === selections.indoorSeries.id
        ).sort((a,b) => a.capacityBTU - b.capacityBTU); // Sort by BTU

        if (availableIndoorUnitsForSeries.length === 0) { 
            indoorUnitsSelectionArea.innerHTML = `<p>Nessuna Unità Interna trovata per la serie ${selections.indoorSeries.name} della marca ${selections.brand.name}. Controlla i dati.</p>`; 
            checkAllIndoorUnitsSelected(); 
            return; 
        }
        console.log(`DEBUG: populateIndoorUnitSelectors - Units available for series ${selections.indoorSeries.name}:`, availableIndoorUnitsForSeries.length);

        // Initialize or check restore state for the selections.indoorUnits array
        let validRestore = restoring && 
                           selections.indoorUnits.length === selections.configType.numUnits && 
                           selections.indoorUnits.every(ui => ui === null || (ui && ui.seriesId === selections.indoorSeries.id));
        if (!validRestore) {
            console.log("DEBUG: Resetting indoor units selection array for new series/config.");
            selections.indoorUnits = new Array(selections.configType.numUnits).fill(null);
        }

        // Create selectors for the required number of units
        for (let i = 0; i < selections.configType.numUnits; i++) {
            const slotDiv = document.createElement('div'); 
            slotDiv.classList.add('indoor-unit-slot');
            slotDiv.style.marginBottom = '20px'; 
            slotDiv.style.paddingBottom = '15px';
            slotDiv.style.borderBottom = '1px dashed #eee';
            
            const label = document.createElement('label'); 
            label.htmlFor = `indoor-unit-select-${i}`; 
            label.textContent = `Unità Interna ${i + 1} (Serie: ${selections.indoorSeries.name}):`; 
            label.style.display = 'block'; label.style.marginBottom = '5px'; label.style.fontWeight = 'bold';
            slotDiv.appendChild(label);
            
            const select = document.createElement('select'); 
            select.id = `indoor-unit-select-${i}`; 
            select.dataset.index = i;
            select.style.width = '100%'; select.style.padding = '8px'; select.style.marginBottom = '10px';
            
            const placeholder = document.createElement('option'); 
            placeholder.value = ""; placeholder.textContent = "-- Seleziona Taglia/Modello --"; 
            select.appendChild(placeholder);
            
            availableIndoorUnitsForSeries.forEach(uiVariant => { // Variants within the chosen series
                const option = document.createElement('option');
                option.value = uiVariant.id; // Firestore ID of the specific size/variant
                // Text shows the distinguishing feature (usually power)
                option.textContent = `${uiVariant.name} (Cod: ${uiVariant.modelCode} Prezzo: ${uiVariant.price.toFixed(2)}€)`;
                if (validRestore && selections.indoorUnits[i] && selections.indoorUnits[i].id === uiVariant.id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
            const detailsDiv = document.createElement('div'); 
            detailsDiv.classList.add('unit-details'); detailsDiv.style.fontSize = '0.9em'; detailsDiv.style.paddingLeft = '10px';
            
            if (validRestore && selections.indoorUnits[i]) {
                const currentUI = selections.indoorUnits[i];
                 detailsDiv.innerHTML = `
                    <p style="margin: 3px 0;"><strong>Modello Selezionato:</strong> ${currentUI.modelCode}</p>
                    <p style="margin: 3px 0;"><strong>Potenza:</strong> ${currentUI.kw}kW (${currentUI.capacityBTU} BTU) - <strong>Prezzo:</strong> ${currentUI.price.toFixed(2)}€</p>
                    ${currentUI.image ? `<img src="${currentUI.image}" alt="${currentUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px;">` : ''}`;
            } 
            
            select.addEventListener('change', (e) => {
                const selectedId = e.target.value;
                const unitIndex = parseInt(e.target.dataset.index);
                // Find the selected VARIANT from the list available for this series
                const selectedUIVariant = availableIndoorUnitsForSeries.find(u => u.id === selectedId); 
                
                selections.indoorUnits[unitIndex] = selectedUIVariant || null; 
                
                if (selectedUIVariant) {
                     const currentUI = selectedUIVariant;
                    detailsDiv.innerHTML = `
                        <p style="margin: 3px 0;"><strong>Modello Selezionato:</strong> ${currentUI.modelCode}</p>
                        <p style="margin: 3px 0;"><strong>Potenza:</strong> ${currentUI.kw}kW (${currentUI.capacityBTU} BTU) - <strong>Prezzo:</strong> ${currentUI.price.toFixed(2)}€</p>
                        ${currentUI.image ? `<img src="${currentUI.image}" alt="${currentUI.name}" class="ui-details-img" style="max-width: 150px; max-height: 100px; object-fit: contain; margin-top: 5px;">` : ''}`;
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

    // STEP 6: SUMMARY (Minor text adjustments perhaps)
    function generateSummary() {
        console.log("DEBUG: generateSummary called. Selections:", JSON.parse(JSON.stringify(selections)));
        summaryDiv.innerHTML = ''; 
        
        if (!selections.brand || !selections.configType || !selections.indoorSeries || !selections.outdoorUnit ) {
            summaryDiv.innerHTML = "<p>Configurazione incompleta. Selezionare Marca, Config., Serie UI e Unità Esterna.</p>";
            return;
        }
        if (selections.configType.numUnits > 0 && 
            (selections.indoorUnits.length !== selections.configType.numUnits || selections.indoorUnits.some(ui => !ui))) {
             summaryDiv.innerHTML = "<p>Selezione Unità Interne incompleta. Selezionare un modello per ogni unità richiesta.</p>";
            return;
        }

        let totalNominalBTU_UI = 0;
        let totalPrice = selections.outdoorUnit.price || 0;

        const valOrNA = (val, suffix = '') => (val !== undefined && val !== null && val !== '' && val !== "Dati mancanti") ? `${val}${suffix}` : 'N/A';
        const priceOrND = (price) => typeof price === 'number' ? price.toFixed(2) + " €" : 'N/D';

        const summaryHTML = `
            <div class="summary-block">
                <h3>Selezione Utente</h3>
                <p><strong>Marca:</strong> ${selections.brand.name}</p>
                <p><strong>Configurazione:</strong> ${selections.configType.name} (${selections.configType.numUnits} UI)</p>
                 <p><strong>Serie Unità Interna:</strong> ${selections.indoorSeries.name}</p>
            </div>

            <div class="summary-block">
                <h3>Unità Esterna Selezionata</h3>
                <h4>${selections.outdoorUnit.name}</h4>
                <p><strong>Modello:</strong> ${valOrNA(selections.outdoorUnit.modelCode)}</p>
                <p><strong>Potenza (Freddo/Caldo BTU):</strong> ${valOrNA(selections.outdoorUnit.capacityCoolingBTU, ' BTU')} / ${valOrNA(selections.outdoorUnit.capacityHeatingBTU, ' BTU')}</p>
                <p><strong>Classe Energetica (F/C):</strong> ${valOrNA(selections.outdoorUnit.energyClassCooling)} / ${valOrNA(selections.outdoorUnit.energyClassHeating)}</p>
                <p><strong>Dimensioni (LxAxP mm):</strong> ${valOrNA(selections.outdoorUnit.dimensions)}</p>
                <p><strong>Peso:</strong> ${valOrNA(selections.outdoorUnit.weight, ' kg')}</p>
                <p class="price-highlight"><strong>Prezzo UE:</strong> ${priceOrND(selections.outdoorUnit.price)} (IVA Escl.)</p>
            </div>

            ${selections.configType.numUnits > 0 ? `
            <div class="summary-block">
                <h3>Unità Interne Selezionate (Serie ${selections.indoorSeries.name})</h3>
                ${selections.indoorUnits.map((ui, index) => {
                    if (!ui) return `<div class="summary-indoor-unit" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;"><p>Unità interna ${index + 1} non selezionata.</p></div>`;
                    totalNominalBTU_UI += ui.capacityBTU || 0; 
                    totalPrice += ui.price || 0;
                    return `
                        <div class="summary-indoor-unit" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                            <h4>Unità ${index + 1}: ${ui.name}</h4> 
                            ${ui.image ? `<img src="${ui.image}" alt="${ui.name}" class="summary-ui-img" style="float:right; max-width:100px; max-height:80px; margin-left:10px; object-fit:contain;">` : ''}
                            <p><strong>Modello:</strong> ${valOrNA(ui.modelCode)}</p>
                            <p><strong>Potenza:</strong> ${valOrNA(ui.kw, 'kW')} (${valOrNA(ui.capacityBTU, ' BTU')})</p>
                            <p><strong>Tipo:</strong> ${valOrNA(ui.type)}</p>
                            <p><strong>Dimensioni (LxAxP mm):</strong> ${valOrNA(ui.dimensions)}</p>
                            <p><strong>WiFi:</strong> ${ui.wifi ? 'Sì' : 'No'}</p>
                            <p class="price-highlight"><strong>Prezzo UI:</strong> ${priceOrND(ui.price)} (IVA Escl.)</p>
                            <div style="clear:both;"></div>
                        </div>
                    `;
                }).join('')}
            </div>
            ` : '<div class="summary-block"><p>Nessuna unità interna richiesta.</p></div>'}
            
            <div class="summary-total" style="margin-top:20px; padding-top:15px; border-top: 2px solid var(--primary-color);">
                ${selections.configType.numUnits > 0 ? `<p><strong>Somma Potenza Nominale UI:</strong> ${totalNominalBTU_UI} BTU</p>` : ''}
                <p style="font-size: 1.2em; font-weight: bold;"><strong>Prezzo Totale Configurazione:</strong> <span class="total-price-value">${priceOrND(totalPrice)}</span> (IVA Esclusa)</p>
            </div>
        `;
        summaryDiv.innerHTML = summaryHTML;
        document.getElementById('summary-main-title')?.classList.add('print-main-title');
        console.log("DEBUG: Riepilogo generato. Prezzo Totale:", totalPrice);
    }

    // --- Step Navigation & Controls ---

    function checkAllIndoorUnitsSelected() { 
        let allSelected = true; // Default true if 0 units needed
        if (selections.configType && selections.configType.numUnits > 0) {
             // Check if array has correct length AND every element is a valid UI object
             allSelected = selections.indoorUnits.length === selections.configType.numUnits &&
                           selections.indoorUnits.every(ui => ui !== null && ui !== undefined);
        }
        
        if(finalizeBtn) {
            finalizeBtn.disabled = !allSelected;
        }

        if(allSelected) {
            highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); // UI selection (step 5) complete
        }
        // updateStepIndicator(); // Called by functions that change selection state
    }
    
    function updateStepIndicator() {
        // Uses TOTAL_LOGICAL_STEPS = 6 and LOGICAL_STEP_NAMES
        const stepLinesHTML = document.querySelectorAll('.step-indicator .step-line');
        stepIndicatorItems.forEach((item, htmlIndex) => {
             // Map HTML index (0-5) to Logical Step (1-6)
             // Assume HTML step items match the desired visual order now
             const itemLogicalStep = htmlIndex + 1; 
             
             // If somehow HTML has more items than needed (unlikely now), hide extras
             if (itemLogicalStep > TOTAL_LOGICAL_STEPS) { 
                item.style.display = 'none'; 
                if (stepLinesHTML[htmlIndex-1]) stepLinesHTML[htmlIndex-1].style.display = 'none';
                return;
             }
             item.style.display = ''; // Ensure visible

            item.dataset.step = itemLogicalStep;
            const nameEl = item.querySelector('.step-name'); 
            if(nameEl) nameEl.textContent = LOGICAL_STEP_NAMES[itemLogicalStep-1] || `Step ${itemLogicalStep}`;
            
            item.classList.remove('active', 'completed', 'disabled');
            const dot = item.querySelector('.step-dot'); 
            if(dot) {
                 dot.classList.remove('active', 'completed');
                 dot.textContent = itemLogicalStep; // Ensure dot shows correct number
             }

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
            // Lines are between items: line 0 between item 0 and 1, line 1 between 1 and 2, etc.
             if (htmlLineIndex >= TOTAL_LOGICAL_STEPS - 1) {
                  line.style.display = 'none'; // Hide lines after last item
                  return;
              }
              line.style.display = ''; // Ensure visible
             line.classList.remove('active');

            const prevItem = stepIndicatorItems[htmlLineIndex]; // Item before the line
            const prevItemLogicalStep = parseInt(prevItem?.dataset?.step);

            if (prevItem && prevItem.style.display !== 'none') {
                if (prevItem.classList.contains('completed')) {
                    line.classList.add('active');
                } else if (currentLogicalStep > prevItemLogicalStep) { // If current step is past the item before the line
                    line.classList.add('active');
                }
            }
        });
    }

    // Initialize Step Navigation (Buttons, Indicators)
    function initializeNavigation() {
         // Step Indicator Clicks
        stepIndicatorItems.forEach(item => { 
            item.addEventListener('click', () => {
                if (item.classList.contains('disabled') || item.style.display === 'none') return;
                
                const targetLogicalStep = parseInt(item.dataset.step); 
                if (isNaN(targetLogicalStep) || targetLogicalStep < 1 || targetLogicalStep > TOTAL_LOGICAL_STEPS) return;
                
                console.log(`Indicator click -> Step ${targetLogicalStep}`);

                if (targetLogicalStep === TOTAL_LOGICAL_STEPS) { // Attempting jump to Summary
                    // Check if all prerequisites are met
                    const canShowSummary = selections.brand && selections.configType && selections.indoorSeries && selections.outdoorUnit &&
                                          (!selections.configType.numUnits > 0 || (selections.indoorUnits.length === selections.configType.numUnits && selections.indoorUnits.every(ui => ui !== null)));
                     if (!canShowSummary) {
                        alert("Completa tutti i passaggi precedenti prima di visualizzare il riepilogo."); 
                        return; 
                     }
                     generateSummary(); 
                }
                showStep(targetLogicalStep, true); 
            });
        });

         // Finalize Button (Go to Summary)
         if(finalizeBtn) { 
            finalizeBtn.addEventListener('click', () => { 
                console.log("Finalize button clicked.");
                highestLogicalStepCompleted = Math.max(highestLogicalStepCompleted, 5); // Mark UI selection complete
                generateSummary(); 
                showStep(TOTAL_LOGICAL_STEPS); // Show summary (step 6)
            });
        }

         // Previous Buttons
         document.querySelectorAll('.prev-btn').forEach(button => { 
            const currentStepElement = button.closest('.config-step');
            if (!currentStepElement) return;
            const currentHtmlId = currentStepElement.id;
            const currentLogical = HTML_TO_LOGICAL_STEP_MAP[currentHtmlId];
            
            if (currentLogical === undefined || currentLogical === 1) { // No prev on step 1
                 button.style.display = 'none';
                 return;
            }
            let prevLogicalStep = currentLogical - 1;
            button.style.display = ''; // Ensure visible otherwise
            
            button.addEventListener('click', () => { 
                console.log(`Prev clicked: ${currentLogical} -> ${prevLogicalStep}`);
                showStep(prevLogicalStep, true); 
            });
        });

         // Reset Button
        document.getElementById('reset-config-btn')?.addEventListener('click', () => { 
             console.log("Reset config clicked.");
             if (!confirm("Sei sicuro di voler resettare l'intera configurazione?")) return;
             highestLogicalStepCompleted = 0; 
             selections.brand = null; selections.configType = null; selections.indoorSeries = null; selections.outdoorUnit = null; selections.indoorUnits = [];
             clearFutureSelections(0, false); // Clear everything after logical step 0 (i.e., clear all)
             summaryDiv.innerHTML = ''; 
             if(finalizeBtn) finalizeBtn.disabled = true;
             document.getElementById('summary-main-title')?.classList.remove('print-main-title'); 
             showStep(1); 
        });

         // Print Buttons
        document.getElementById('print-summary-btn')?.addEventListener('click', () => {
            if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) {
                window.print();
            } else { alert("Completa la configurazione e vai al Riepilogo (Passaggio 6) prima di stampare."); }
        });
        document.getElementById('print-list')?.addEventListener('click', () => { 
            if (currentLogicalStep === TOTAL_LOGICAL_STEPS && summaryDiv.innerHTML && !summaryDiv.innerHTML.includes("incompleta")) {
                window.print();
            } else { alert("Completa la configurazione fino al Riepilogo (Passaggio 6) prima di stampare."); }
        });
    }

    // --- Application Initialization ---
    async function initializeApp() {
        console.log("DEBUG: initializeApp started (6-Step Flow)");
        document.body.appendChild(loadingOverlay);
        loadingOverlay.style.display = 'flex';
        let brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc;

        try {
            console.log("DEBUG: Fetching all Firestore data...");
            [ brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs, metadataDoc ] = 
            await Promise.all([
                fetchFirestoreCollection('brands'), fetchFirestoreCollection('configTypes'),
                fetchFirestoreCollection('uiSeriesImageMapping'), fetchFirestoreCollection('outdoorUnits'),
                fetchFirestoreCollection('indoorUnits'), db.collection('metadata').doc('appInfo').get() 
            ]);
            console.log("DEBUG: Firestore data fetching complete.");

             // Ensure all data processing happens after data is loaded
             processLoadedData(brandsDocs, configTypesDocs, seriesMapDocs, outdoorUnitsDocs, indoorUnitsDocs);
             
        } catch (error) {
            console.error("CRITICAL ERROR fetching/processing Firestore data:", error);
            loadingOverlay.innerHTML = `<p style="color:red;">Errore grave nel caricamento dei dati. Riprovare più tardi o contattare l'assistenza.</p>`;
            return; 
        }

        // --- UI Setup AFTER Data Processing ---

        // Set up HTML elements (Show Step 1 initially)
        stepsHtmlContainers.forEach(el => el.classList.remove('active-step'));
        document.getElementById('step-1')?.classList.add('active-step'); // Start at Brand Selection

        // Update Step Indicator for the initial state
        currentLogicalStep = 1;
        highestLogicalStepCompleted = 0;
        updateStepIndicator(); 
        
        // Populate the first step
        populateBrands(); 

        // Check if brands were successfully populated
        const brandSelectionContent = brandSelectionDiv.innerHTML.trim();
        if (brandSelectionContent.includes("Nessuna marca") || (brandSelectionDiv.children.length === 0 && !brandSelectionDiv.querySelector('p'))) {
             console.warn("INITIALIZATION WARNING: No brands populated.");
              // Keep loading overlay with error message?
               if (loadingOverlay.style.display !== 'none') { 
                loadingOverlay.innerHTML = `<p style="color:orange;">Errore dati iniziali: Nessuna marca disponibile. Controlla dati Firestore.</p>`;
             }
             // Or maybe hide overlay and show message in the brand area itself
             // loadingOverlay.style.display = 'none';
             // brandSelectionDiv.innerHTML = `<p style="color:orange;">Errore dati iniziali...</p>`

        } else {
             loadingOverlay.style.display = 'none'; // Hide loading overlay ONLY if brands populated ok
        }
        
        // Setup footer year/date
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        try {
            if (metadataDoc && metadataDoc.exists && metadataDoc.data()?.lastDataUpdate) {
                const timestamp = metadataDoc.data().lastDataUpdate;
                document.getElementById('lastUpdated').textContent = new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
            } else {
                 console.log("DEBUG: metadata/appInfo document or lastDataUpdate field missing.");
                document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
            }
        } catch(err) {
             console.warn("Error retrieving lastDataUpdate metadata:", err);
             document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('it-IT');
        }

        // Setup button/indicator event listeners
        initializeNavigation();

        console.log("DEBUG: initializeApp finished.");
    }

    // --- Run Application ---
    initializeApp();

});
// --- END OF SCRIPT.JS (FIREBASE - 6 STEP FLOW) ---