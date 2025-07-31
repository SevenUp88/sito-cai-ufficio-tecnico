// script.js per IMPIANTO_RADIATORI

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se siamo sulla pagina giusta tramite l'URL o un ID specifico.
    if (!document.getElementById('radiator-configurator')) return;

    // ---------- Elementi DOM ----------
    const buildingTypeSelect = document.getElementById('building-type');
    const buildingSurfaceInput = document.getElementById('building-surface');
    const buildingVolumeInput = document.getElementById('building-volume');
    const targetTemperatureInput = document.getElementById('target-temperature');
    const heatLossFactorInput = document.getElementById('heat-loss-factor');
    const designTemperatureInput = document.getElementById('design-temperature');
    const flowTemperatureInput = document.getElementById('flow-temperature');
    const returnTemperatureInput = document.getElementById('return-temperature');
    const radiatorMaterialSelect = document.getElementById('radiator-material');
    const radiatorTemplateInput = document.getElementById('radiator-template');
    const radiatorPowerRatingInput = document.getElementById('radiator-power-rating');
    const radiatorElementDimsInput = document.getElementById('radiator-element-dims');
    const radiatorElementsCountInput = document.getElementById('radiator-elements-count');

    const calculateButton = document.getElementById('calculate-radiator-system');
    const resultsDisplayDiv = document.getElementById('radiator-results');
    const resultsSummaryDiv = document.getElementById('results-summary');
    const roomDetailsDiv = document.getElementById('room-details');
    const configuratorErrorDiv = document.getElementById('configurator-error');

    // Simulazione dei dati dei radiatori (meglio caricarli da Firestore come fatto per gli altri prodotti)
    // Al momento, questo è un esempio di come li gestiresti se fossero qui
    const availableRadiators = {
        ghisa: {
            "Gialli 1500": { potenza_watt: 150, temperatura_riferimento: '75/65', elementi_peso_kg: 5, dimensioni_mm: '1500x80x180'},
            "Gialli 1000": { potenza_watt: 120, temperatura_riferimento: '75/65', elementi_peso_kg: 4, dimensioni_mm: '1000x80x180'},
            "Fero": { potenza_watt: 180, temperatura_riferimento: '75/65', elementi_peso_kg: 6, dimensioni_mm: '1750x80x180'}
        },
        alluminio: {
            "Alux K8 600": { potenza_watt: 160, temperatura_riferimento: '75/65', elementi_peso_kg: 2.5, dimensioni_mm: '600x80x80'},
            "Alux K8 750": { potenza_watt: 190, temperatura_riferimento: '75/65', elementi_peso_kg: 2.8, dimensioni_mm: '750x80x80'},
            "Alux K8 1800": { potenza_watt: 250, temperatura_riferimento: '75/65', elementi_peso_kg: 4.0, dimensioni_mm: '1800x80x80'}
        },
        acciaio: {
             "CaldoBagno Slim": { potenza_watt: 180, temperatura_riferimento: '75/65', elementi_peso_kg: 4.5, dimensioni_mm: '1000x70x50'}
        }
    };

    // Mappe per conversioni e coefficienti (esempio)
    const lossFactorsW_mc = { // Esempio di perdite di calore specifiche (W/mc)
        residenziale_nuovo: 25,
        residenziale_medio: 40,
        commerciale: 55,
        alto_prestazione: 20
    };
    
    const designTemperatures = { // Esempio di temperature esterne di progetto (°C)
        italia_nord: -7,
        italia_centro: -3,
        italia_sud: 2
    };

    // Costanti e Conversioni
    const W_TO_KCAlH = 0.860; // 1 W = 0.860 Kcal/h
    const KCAlH_TO_W = 1.163; // 1 Kcal/h = 1.163 W

    // ---------- Funzioni di Calcolo ----------

    // --- Funzione per calcolare la potenza richiesta dalla stanza ---
    // Le formule qui sono SEMPLIFICATE e DEVONO ESSERE SOSTITUITE CON FORMULE REALI DA NORMATIVA TECNICA (es. UNI EN 12831)
    const calculateRoomHeatLoss = (volume_mc, heat_loss_factor_w_mc, target_temp_c, design_temp_c) => {
        // Perdita di calore = Volume * Fattore Perdita * (Temp Interna - Temp Esterna)
        const deltaT = target_temp_c - design_temp_c;
        const totalHeatLoss = volume_mc * heat_loss_factor_w_mc * deltaT;
        return totalHeatLoss; // In Watt
    };

    // --- Funzione per adattare la potenza del radiatore alla temperatura di mandata/ritorno attuale ---
    // Questo richiede l'uso di un diagramma di legge termica o tabelle specifiche del produttore
    const adaptRadiatorPower = (basePower_watt, baseTempRef, currentFlowTemp, currentReturnTemp) => {
        // Esempio MOLTO SEMPLIFICATO (linearizzato) che NON VA BENE PER PROGETTI REALI
        // In realtà servono esponenziali o tabelle dal produttore!
        const [, baseReturnTemp] = baseTempRef.split('/').map(Number);
        const deltaT_base = (basePower_watt / 100) / W_TO_KCAlH ; // Rough estimate, assume 100 W per grado a elemento (ESTREMAMENTE VOLTAICO!)
        const baseDeltaT_ref = baseReturnTemp - (basePower_watt/100) ; // VERY rough estimate. Needs a reference delta T, let's guess
        
        const currentDeltaT = currentFlowTemp - currentReturnTemp;

        // Calcolo approssimativo basato su legge di Carnot o regressioni specifiche (QUESTO È SOLO UN PLACEHOLDER!)
        // Un approccio migliore è trovare il fattore di correzione K dal produttore.
        // Ad esempio: Potenza_Corretta = Potenza_Base * (DeltaT_Corretto / DeltaT_Base_Riferimento)^(1.3)
        // Ma ci serve il DeltaT di riferimento corretto, basato sulla basePower.
        
        // Metodo semplificato usando il riscaldamento della legge potenza
        // Power = k * (DeltaT)^n
        // k = Potenza_Base / (DeltaT_Base)^n
        // Power_new = k * (DeltaT_new)^n = Potenza_Base * (DeltaT_new / DeltaT_Base)^n
        // Per i radiatori standard n è circa 1.3

        // Stima MOLTO ROBUSTA del DeltaT di riferimento (dove la potenza è data in tabella)
        // Spesso i produttori specificano che la potenza è data per un dT di 50K (es. 75/65)
        const assumedBaseDeltaT = 50; // Delta T medio su base della potenza data
        
        const actualDeltaT_current = currentFlowTemp - currentReturnTemp;

        // Si applica la legge: Potenza_Corretta = Potenza_Base * ( (T_mandata_curr - T_ritorno_curr) / (T_mandata_base - T_ritorno_base) )^n
        // dove n è circa 1.3 per radiatori in alluminio/acciaio, 1.4-1.5 per ghisa
        
        let exponent = 1.3; // Di default, potrebbe variare per materiale
        const material = radiatorMaterialSelect.value;
        if (material === 'ghisa') {
            exponent = 1.4; 
        }

        // Si assume che la potenza sia già espressa in W e la sua legge termica
        // È cruciale che 'basePower_watt' sia valida alla 'temperatura_riferimento' indicata
        // La potenza di riferimento fornita (radiatorPowerRatingInput) dovrebbe essere normalizzata a una temperatura comune
        // Se ad es. è data per 75/65 (deltaT 50K)
        const correctedPower = basePower_watt * Math.pow(actualDeltaT_current / assumedBaseDeltaT, exponent);

        return correctedPower; // In Watt
    };

    // ---------- Funzioni per l'Interfaccia ----------
    const displayError = (message) => {
        configuratorErrorDiv.textContent = message;
        configuratorErrorDiv.classList.remove('hidden');
        resultsDisplayDiv.classList.add('hidden');
    };

    const clearError = () => {
        configuratorErrorDiv.textContent = '';
        configuratorErrorDiv.classList.add('hidden');
    };

    const populateRadiatorInfo = (radiator) => {
        if (!radiator) return;
        // Questa funzione andrebbe usata se carichi i radiatori da DB
        // Ad esempio, selezionando un radiatore dalla ricerca.
        // radiatorPowerRatingInput.value = `${radiator.potenza_watt}W (${(radiator.potenza_watt * W_TO_KCAlH).toFixed(1)} Kcal/h) @ ${radiator.temperatura_riferimento}`;
        // radiatorElementDimsInput.value = radiator.dimensioni_mm;
        // Potremmo pre-compilare il numero di elementi o lasciarlo libero
    };
    
    const resetForms = () => {
        document.getElementById('building-data-form').reset();
        document.getElementById('heating-system-form').reset();
        document.getElementById('radiator-data-form').reset();
        clearError();
        resultsDisplayDiv.classList.add('hidden');
        roomDetailsDiv.innerHTML = '';
        resultsSummaryDiv.innerHTML = '';
    };

    // ---------- Gestori Eventi ----------
    
    // Se hai un database con radiatori specifici:
    // Implementa la ricerca e la selezione del radiatore qui per popolarli

    calculateButton.addEventListener('click', () => {
        clearError();
        resultsDisplayDiv.classList.add('hidden');

        // ---------- Validazione dei Dati ----------
        const buildingType = buildingTypeSelect.value;
        const buildingSurface = parseFloat(buildingSurfaceInput.value);
        const buildingVolume = parseFloat(buildingVolumeInput.value); // Considera se renderlo opzionale
        const targetTemp = parseFloat(targetTemperatureInput.value);
        const heatLossFactorRaw = parseFloat(heatLossFactorInput.value); // In W/mc o Kcal/m3h
        const designTemp = parseFloat(designTemperatureInput.value);
        const flowTemp = parseFloat(flowTemperatureInput.value);
        const returnTemp = parseFloat(returnTemperatureInput.value);
        const radiatorMaterial = radiatorMaterialSelect.value;
        const radiatorTemplate = radiatorTemplateInput.value.trim();
        const radiatorPowerRaw = radiatorPowerRatingInput.value; // Stringa che va parsata
        const radiatorElements = parseInt(radiatorElementsCountInput.value, 10);

        let heatLossFactor_W_mc;
        // Controllo sull'unità di misura inserita per le perdite di calore
        if (heatLossFactorRaw > 0 && (heatLossFactorRaw < 1000)) { // Potrebbe essere Kcal/m³h o W/mc
            if (heatLossFactorRaw < 100) { // Assumiamo sia W/mc
                heatLossFactor_W_mc = heatLossFactorRaw;
            } else { // Assumiamo sia Kcal/m³h e convertiamo in W/mc
                heatLossFactor_W_mc = heatLossFactorRaw * W_TO_KCAlH;
            }
        } else {
            displayError("Perdite di calore specifiche non valide o mancanti.");
            return;
        }

        // --------- PARSING DATI RADIATORE (molto importante!) -----------
        // Questo è un parsing MOLTO BASILARE, necessita di una gestione robusta degli errori
        // Dobbiamo estrarre potenza, unità, e unità di misura. Esempio: "150W / 130 Kcal/h per elemento (a 75/65°C)"
        
        let baseRadiatorPower_watt = 0;
        let referenceRadiatorTemp = '75/65'; // Assunto standard

        if (radiatorPowerRaw) {
            const powerMatchW = radiatorPowerRaw.match(/([\d.]+)\s*W/i); // Cerca Watt
            const powerMatchKcal = radiatorPowerRaw.match(/([\d.]+)\s*Kcal\/h/i); // Cerca Kcal/h

            if (powerMatchW) {
                baseRadiatorPower_watt = parseFloat(powerMatchW[1]);
            } else if (powerMatchKcal) {
                baseRadiatorPower_watt = parseFloat(powerMatchKcal[1]) * W_TO_KCAlH; // Converti in Watt
            }
            
            // Prova a estrarre anche la temperatura di riferimento (anche se la gestiamo a monte con una media)
            const tempRefMatch = radiatorPowerRaw.match(/a\s+([\d\/\-]+°C)/i);
            if (tempRefMatch) {
                referenceRadiatorTemp = tempRefMatch[1].replace('°C', '').trim(); // "75/65"
            }
        }
        
        // -- VALIDAZIONI ESSENZIALI --
        if (isNaN(buildingSurface) || buildingSurface <= 0) {
            displayError("Superficie edificio non valida.");
            return;
        }
        // Volume è opzionale se non lo hai richiesto
        // if (isNaN(buildingVolume) || buildingVolume <= 0) { displayError("Volume edificio non valido."); return; }
        if (isNaN(targetTemp) || targetTemp < 10 || targetTemp > 30) { displayError("Temperatura ambiente non valida."); return; }
        if (isNaN(heatLossFactor_W_mc) || heatLossFactor_W_mc <= 0) { displayError("Fattore perdite di calore non valido."); return; }
        if (isNaN(designTemp)) { displayError("Temperatura esterna di progetto non valida."); return; }
        if (isNaN(flowTemp) || flowTemp <= 0) { displayError("Temperatura di mandata non valida."); return; }
        if (isNaN(returnTemp) || returnTemp <= 0 || returnTemp >= flowTemp) { displayError("Temperatura di ritorno non valida."); return; }
        if (isNaN(radiatorElements) || radiatorElements <= 0) {
            displayError("Numero di elementi radiatore non valido.");
            return;
        }
        if (baseRadiatorPower_watt <= 0) {
             displayError("Potenza radiatore per elemento non valida o mancante.");
            return;
        }
        if (radiatorTemplate === "" && Object.keys(availableRadiators[radiatorMaterial]).length > 0) {
             //displayError("Seleziona un modello di radiatore."); // Forse questo messaggio non è sempre necessario, a seconda del design.
             // Se vuoi forzarla, decommenta qui sopra. Se offri solo un "generico", questo if non serve.
        }
        

        // --- DATI DI PROGETTO AGGIUNTIVI --
        // Qui dovresti aggiungere l'input per "Numero stanze", o definire delle stanze standard
        // Per semplicità, al momento ipotizziamo di poter definire manualmente delle stanze.
        
        // Esempio di stanze da configurare (lo user deve inserire queste o possiamo farle con un form dinamicamente)
        // Qui è necessario creare una UI più complessa se si vogliono aggiungere molte stanze dinamiche
        const rooms = [
            { name: "Salotto", volume_mc: 100, elements: 3 },
            { name: "Cucina", volume_mc: 60, elements: 2 },
            { name: "Camera Letto", volume_mc: 75, elements: 2 },
            { name: "Bagno", volume_mc: 30, elements: 1 }
        ];

        let totalSystemPower_W = 0;
        let formattedRoomDetails = '';

        // ---------- CICLO DI CALCOLO PER OGNI STANZA ----------
        rooms.forEach(room => {
            // Correzione dei dati per la stanza se specificati (altrimenti prendi i valori generali)
            const roomVolume = room.volume_mc; // Volume della stanza specifica
            const roomElements = room.elements; // Numero elementi per stanza
            
            const roomHeatLoss_W = calculateRoomHeatLoss(roomVolume, heatLossFactor_W_mc, targetTemp, designTemp);
            
            // Correzione della potenza del radiatore in base alle temperature di progetto
            // Uso il radiatore come "template generico" o un radiatore specifico se è stato selezionato
            let selectedRadiatorTemplate = null;
            if(radiatorTemplate && availableRadiators[radiatorMaterial] && availableRadiators[radiatorMaterial][radiatorTemplate]) {
                selectedRadiatorTemplate = availableRadiators[radiatorMaterial][radiatorTemplate];
            } else {
                // Se non è stato specificato o non trovato, uso la potenza inserita manualmente e il primo disponibile per materiale come riferimento
                // Necessario se non si implementa bene la ricerca
                selectedRadiatorTemplate = { 
                    potenza_watt: baseRadiatorPower_watt, 
                    temperatura_riferimento: referenceRadiatorTemp, 
                    elementi_peso_kg: parseFloat(radiatorElementDimsInput.value.split(' ')[0].split('-')[1]?.trim().replace(/[^0-9.]/g, '')) || 3, // Stima dal testo inserito o default
                    material: radiatorMaterial 
                };
            }

            const correctedRadiatorPower_W_per_element = adaptRadiatorPower(
                selectedRadiatorTemplate.potenza_watt, 
                selectedRadiatorTemplate.temperatura_riferimento, 
                flowTemp, 
                returnTemp
            );

            const requiredRadiatorPower_W = roomHeatLoss_W; // La potenza che deve fornire il sistema di radiatori
            const neededElements = Math.ceil(requiredRadiatorPower_W / correctedRadiatorPower_W_per_element);

            // Se il numero di elementi è stato SPECIFICATO DALL'UTENTE per la stanza, uso quello, ALTRIMENTI QUello calcolato
            const finalElementsForRoom = roomElements > 0 ? roomElements : neededElements; // Assumiamo che rooms[] possa avere già gli elementi, altrimenti usiamo il calcolato
            const actualRadiatorPower_W = finalElementsForRoom * correctedRadiatorPower_W_per_element;
            
            totalSystemPower_W += actualRadiatorPower_W; // Aggiorna la potenza totale del sistema
            
            formattedRoomDetails += `
                <div class="room-result-item">
                    <h4>Stanza: ${room.name}</h4>
                    <p>Volume: ${roomVolume} mc</p>
                    <p>Potenza Termica Richiesta: ${roomHeatLoss_W.toFixed(0)} W (${(roomHeatLoss_W * W_TO_KCAlH).toFixed(1)} Kcal/h)</p>
                    <p>Modello Radiatore Utilizzato (riferimento): ${radiatorTemplate || `[${selectedRadiatorTemplate.material}] ${baseRadiatorPower_watt.toFixed(0)}W`}</p>
                    <p>Potenza Per Elemento (corretta a ${flowTemp}/${returnTemp}°C): ${correctedRadiatorPower_W_per_element.toFixed(0)} W (${(correctedRadiatorPower_W_per_element * W_TO_KCAlH).toFixed(1)} Kcal/h)</p>
                    <p>Elementi Radiatore necessari/specificati: <strong>${finalElementsForRoom}</strong></p>
                    <p>Potenza Impianto Effettiva: ${actualRadiatorPower_W.toFixed(0)} W (${(actualRadiatorPower_W * W_TO_KCAlH).toFixed(1)} Kcal/h)</p>
                </div>
            `;
        });

        // ---------- VISUALIZZAZIONE RISULTATI GENERALI ----------
        resultsSummaryDiv.innerHTML = `
            <p>Superficie Totale: ${buildingSurface} mq</p>
            <p>Perdite di Calore Specifiche (media stimata): ${(buildingVolume * heatLossFactor_W_mc / buildingSurface).toFixed(0)} W/mq o ${((buildingVolume * heatLossFactor_W_mc * W_TO_KCAlH) / buildingSurface).toFixed(1)} Kcal/hmq</p>
            <p>Temperatura Esterna di Progetto: ${designTemp}°C</p>
            <p>Temperature di Circolo Progetto: ${flowTemp}/${returnTemp}°C</p>
            <p><strong>Potenza Totale Impianto Stimata: ${totalSystemPower_W.toFixed(0)} W (${(totalSystemPower_W * W_TO_KCAlH).toFixed(1)} Kcal/h)</strong></p>
        `;
        
        roomDetailsDiv.innerHTML = formattedRoomDetails;
        resultsDisplayDiv.classList.remove('hidden');
    });

    // ---------- Inizializzazione ----------
    // Potresti inizializzare con valori predefiniti, un esempio o suggerire di caricare dati
    
    // Esempio di caricamento valori predefiniti dal tuo database Firestore
    // o da una configurazione locale se non hai molti dati.
    // Dovrai decidere se salvare questi configuratori su Firestore.

    // Esempio di precompilazione con dati tipici di progetto
    const defaultBuildingType = 'residenziale_medio';
    const defaultTargetTemp = 20;
    const defaultHeatLossFactor = 40; // W/mc (ipotizzando un buon isolamento medio)
    const defaultDesignTemp = -5; // Tipico per molte zone italiane
    const defaultFlowTemp = 70; // Per impianti tradizionali, 55-60 per bassa temperatura
    const defaultReturnTemp = 60; 

    buildingTypeSelect.value = defaultBuildingType;
    targetTemperatureInput.value = defaultTargetTemp;
    heatLossFactorInput.value = defaultHeatLossFactor;
    designTemperatureInput.value = defaultDesignTemp;
    flowTemperatureInput.value = defaultFlowTemp;
    returnTemperatureInput.value = defaultReturnTemp;

    // Aggiorna input dimensioni elementi radiatore quando si seleziona un materiale se usi i nostri esempi
    // E NON hai un input dinamico o una selezione del modello specifico.
    const updateRadiatorPlaceholder = () => {
        const selectedMaterial = radiatorMaterialSelect.value;
        if (!selectedMaterial) return;
        
        // Tenta di trovare un radiatore d'esempio per impostare i placeholder
        const exampleRadiator = Object.values(availableRadiators[selectedMaterial])[0];
        if (exampleRadiator) {
            radiatorPowerRatingInput.placeholder = `Es: ${exampleRadiator.potenza_watt}W / ${(exampleRadiator.potenza_watt * W_TO_KCAlH).toFixed(1)} Kcal/h (${exampleRadiator.temperatura_riferimento}°C)`;
            radiatorElementDimsInput.placeholder = exampleRadiator.dimensioni_mm;
        }
    };
    
    radiatorMaterialSelect.addEventListener('change', updateRadiatorPlaceholder);
    updateRadiatorPlaceholder(); // Imposta i placeholder al caricamento iniziale

    // Gestisci l'invio della home page (es. login e redirect) qui o nel tuo script principale auth.js

    // Controlli base se Firebase è inizializzato e lo user è loggato (se questa pagina richiede autenticazione)
    // firebase.auth().onAuthStateChanged(user => {
    //     if (!user) {
    //         // Se non loggato, redirigi alla home o mostra errore
    //         window.location.href = '../index.html'; // Assicurati che il percorso sia corretto
    //     } else {
    //         // Qui puoi caricare dati specifici per l'utente, se necessario
    //     }
    // });
});