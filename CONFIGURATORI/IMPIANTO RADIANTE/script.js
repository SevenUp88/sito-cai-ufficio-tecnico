// Import Firebase SDK (se usi moduli ES6 e non script globali)
// Assicurati che questi percorsi siano corretti per il tuo setup Netlify
// Potrebbe essere necessario installare 'firebase' via npm/yarn e importare come 'firebase/app', ecc.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js"; // Se usi Analytics

// Configurazione Firebase (se non già importata o definita globalmente)
const firebaseConfig = {
  apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
  authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
  projectId: "consorzio-artigiani-idraulici",
  storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
  messagingSenderId: "136848104008",
  appId: "1:1368104008:web:2724f60607dbe91d09d67d", // Verificato da un esempio precedente, controlla se corretto
  measurementId: "G-NNPV2607G7"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const analytics = getAnalytics(app); // Se usi Analytics

let thermolutzProducts = []; // Array globale per i prodotti
const FIRESTORE_RADIANT_COLLECTION_NAME = "thermolutzRadiantProducts"; 

async function loadThermolutzData() {
    if (!db) {
        console.error("Firestore non inizializzato!");
        alert("Errore: Impossibile connettersi al database dei prodotti.");
        return;
    }
    try {
        const productsRef = collection(db, FIRESTORE_RADIANT_COLLECTION_NAME);
        const querySnapshot = await getDocs(productsRef);
        
        thermolutzProducts = []; 
        querySnapshot.forEach((doc) => {
            const productData = doc.data();
            productData.id = doc.id; 
            // I campi qui devono corrispondere a quelli salvati da Apps Script:
            // es. tipo_pannello, spessore_totale_mm, resa_passo_10_wmq, mq_per_confezione, attacchi_collettore etc.
            thermolutzProducts.push(productData);
        });
        console.log(`Dati Thermolutz caricati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, thermolutzProducts.length, "prodotti.");
        
        if (thermolutzProducts.length === 0) {
            alert("Attenzione: Nessun dato prodotto Thermolutz trovato nel database. La funzionalità di selezione prodotti Thermolutz potrebbe non funzionare correttamente. Eseguire la sincronizzazione da Google Sheets?");
        }
        // Qui potresti chiamare una funzione per aggiornare l'UI basata sui dati caricati, es. Punto 1.
        // updatePanelTypeOptions(); 

    } catch (error) {
        console.error(`Errore nel caricamento dati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, error);
        alert(`Attenzione: Impossibile caricare i dati dei prodotti Thermolutz da Firestore. Errore: ${error.message}`);
    }
}

// --- Funzioni Helper ---
function getFloatValue(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    const val = parseFloat(element.value.replace(',', '.'));
    return isNaN(val) ? 0 : val;
}
function getIntValue(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    const val = parseInt(element.value);
    return isNaN(val) ? 0 : val;
}
 function updateTotalSurface() {
    let totalSurface = 0;
    document.querySelectorAll('.roomSurface').forEach(input => {
        totalSurface += parseFloat(input.value.replace(',', '.')) || 0;
    });
    const outputEl = document.getElementById('totalRadiantSurfaceOutput');
    if (outputEl) outputEl.textContent = totalSurface.toFixed(2);
}

// --- Gestione UI ---
document.addEventListener('DOMContentLoaded', function() {
    const addRoomBtn = document.getElementById('addRoomBtn');
    const roomsContainer = document.getElementById('roomsContainer');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsSection = document.getElementById('resultsSection');
    const brandSystemSelect = document.getElementById('brandSystem');
    const panelTypeSelect = document.getElementById('panelType');

    let roomCounter = 1;

    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', function() {
            roomCounter++;
            const firstRoomEntry = roomsContainer.querySelector('.room-entry');
            if (!firstRoomEntry) return; // Fallback se il template non c'è
            const newRoomEntry = firstRoomEntry.cloneNode(true);
            
            newRoomEntry.querySelector('h4').textContent = `Stanza ${roomCounter}`;
            const inputs = newRoomEntry.querySelectorAll('input, select');
            inputs.forEach(input => {
                const oldId = input.id;
                const oldName = input.name;
                if (oldId) input.id = oldId.replace(/\d+$/, '') + roomCounter; // Aggiorna ID
                if (oldName) input.name = oldName.replace(/\d+$/, '') + roomCounter; // Aggiorna Name
                if (input.type === 'text' && input.classList.contains('roomName')) input.value = `Stanza ${roomCounter}`;
                else if (input.type === 'number' && input.classList.contains('roomSurface')) input.value = '10';
                else if (input.tagName === 'SELECT') input.selectedIndex = 0; // Resetta select
            });
            
            const removeBtn = newRoomEntry.querySelector('.remove-room-btn');
            if (removeBtn) {
                 removeBtn.style.display = 'inline-block';
                 removeBtn.addEventListener('click', function() {
                    newRoomEntry.remove();
                    updateTotalSurface();
                });
            }
            roomsContainer.appendChild(newRoomEntry);
            updateTotalSurface();
        });
    }

    if (roomsContainer) {
        roomsContainer.addEventListener('input', function(e) {
            if (e.target.classList.contains('roomSurface')) {
                updateTotalSurface();
            }
        });
        updateTotalSurface();
    }
    
    // Punto 1: Disabilitare opzioni tipo pannello per Thermolutz (se necessario)
    function updatePanelTypeOptions() {
        const selectedBrand = brandSystemSelect.value;
        if (selectedBrand === 'thermolutz') {
            Array.from(panelTypeSelect.options).forEach(option => {
                if (option.value !== 'bugnato') { // Solo 'bugnato' attivo per Thermolutz (secondo chiarimento)
                    option.disabled = true;
                    // Aggiungi classe CSS per feedback visivo
                    // option.classList.add('option-disabled-visual');
                } else {
                    option.disabled = false;
                    // option.classList.remove('option-disabled-visual');
                }
            });
             // Se il valore selezionato è ora disabilitato, reimposta su bugnato
            if (panelTypeSelect.selectedOptions.length > 0 && panelTypeSelect.selectedOptions[0].disabled) {
                panelTypeSelect.value = 'bugnato';
            }
        } else { // Per altre marche o generico, tutte le opzioni sono attive
            Array.from(panelTypeSelect.options).forEach(option => {
                option.disabled = false;
                // option.classList.remove('option-disabled-visual');
            });
        }
    }
    if (brandSystemSelect) brandSystemSelect.addEventListener('change', updatePanelTypeOptions);
    // Chiamata iniziale per impostare lo stato corretto
    // updatePanelTypeOptions(); // Commentato finché non la abiliti attivamente


    // Inizio Caricamento Dati
    loadThermolutzData().then(() => {
        // Esegui updatePanelTypeOptions solo dopo che thermolutzProducts sono caricati se serve info da lì
        updatePanelTypeOptions(); // Ora puoi chiamarla se la logica dipende dai dati
    });


    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // Raccolta Dati Utente
            const insulationLevel = document.getElementById('insulationLevel').value;
            const screedHeightAvailable = getFloatValue('screedHeight');
            const flowTemperature = getIntValue('flowTemperature');
            const coolingSelected = document.getElementById('cooling').value === 'yes';
            
            const userPanelTypeKey = panelTypeSelect.value; 
            const userPanelThickness = getIntValue('panelThickness');
            const userPipeDiameter = document.getElementById('pipeDiameter').value;
            const userGeneralPipePitchCm = getIntValue('generalPipePitch');
            const selectedBrand = brandSystemSelect.value;
    
            // Reset Output Precedenti
            document.getElementById('thermolutzPanelInfo').innerHTML = ''; // innerHTML per <small>
            document.getElementById('thermolutzPipeInfo').innerHTML = '';
            document.getElementById('thermolutzCollectorInfo').innerHTML = '';
            document.getElementById('thermolutzStripInfo').innerHTML = '';
            document.getElementById('thermolutzActuatorInfo').innerHTML = '';
            const additionalMaterialsDiv = document.getElementById('additionalMaterialsOutput');
            if (additionalMaterialsDiv) additionalMaterialsDiv.innerHTML = '';

            const rooms = [];
            document.querySelectorAll('.room-entry').forEach((entry) => {
                const nameInput = entry.querySelector('.roomName');
                const surfaceInput = entry.querySelector('.roomSurface');
                const flooringSelect = entry.querySelector('.roomFlooring');

                if (nameInput && surfaceInput && flooringSelect) {
                    const name = nameInput.value || `Stanza indefinita`;
                    const surface = parseFloat(surfaceInput.value.replace(',', '.')) || 0;
                    const flooring = flooringSelect.value;
                    if (surface > 0) {
                        rooms.push({ name, surface, flooring });
                    }
                }
            });
    
            if (rooms.length === 0) { alert("Aggiungi almeno una stanza con una superficie valida."); return; }
    
            let totalRadiantSurface = 0;
            rooms.forEach(room => totalRadiantSurface += room.surface);
    
            // Costanti e Parametri di Calcolo
            const SFRIDO_PERCENTAGE = 1.07; // 7%
            const MAX_CIRCUIT_LENGTH = 90; // metri
            const PIPE_ROLL_LENGTH_GENERIC = 240; // metri
            const MAX_WAYS_PER_COLLECTOR = 12;
            const MIN_SCREED_ABOVE_PIPE = 3; // cm
            const PIPE_DIAMETER_CM_VAL = userPipeDiameter === '16x2' ? 1.6 : 1.7;
            
            // Stima spessore pannello
            let actualPanelThicknessCm; // Sarà determinato da Thermolutz o da input utente
            let foundThermolutzPanel = null; // Pannello Thermolutz specifico trovato
    
            if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
                let panelQueryType = userPanelTypeKey.toLowerCase();
                // Adatta query per tipo pannello Thermolutz se necessario dai dati CSV
                // if (userPanelTypeKey === 'bugnato') panelQueryType = 'bugnato tl'; // Esempio
                
                foundThermolutzPanel = thermolutzProducts.find(p => 
                    p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) &&
                    p.spessore_totale_mm === userPanelThickness && // Usa spessore_totale_mm se parsato in Apps Script
                    p.descrizione && !p.descrizione.toUpperCase().includes("ACCESSORIO")
                );
    
                if (foundThermolutzPanel) {
                    actualPanelThicknessCm = (foundThermolutzPanel.spessore_totale_mm || userPanelThickness) / 10; // Usa spessore_totale_mm
                    let panelInfoText = `TL Pannello: ${foundThermolutzPanel.codice_fornitore || foundThermolutzPanel.id} - ${foundThermolutzPanel.descrizione.substring(0,60)}... (Sp: ${foundThermolutzPanel.spessore_totale_mm}mm)`;
                    
                    // Punto 5: Calcolo confezioni pannello
                    if (foundThermolutzPanel.mq_per_confezione > 0) { // Assumo chiave 'mq_per_confezione'
                        const insulationPanelAreaTotal = totalRadiantSurface * SFRIDO_PERCENTAGE;
                        const numConfezioniPannello = Math.ceil(insulationPanelAreaTotal / foundThermolutzPanel.mq_per_confezione);
                        panelInfoText += ` (${numConfezioniPannello} conf. da ${foundThermolutzPanel.mq_per_confezione.toFixed(2)} mq/cad)`;
                    }
                    // Punto 7: Visualizza passi disponibili
                    if (foundThermolutzPanel.passi_posa_disponibili_mm_str) {
                        panelInfoText += `<br><small>Passi disponibili (mm): ${foundThermolutzPanel.passi_posa_disponibili_mm_str}</small>`;
                    }
                    document.getElementById('thermolutzPanelInfo').innerHTML = panelInfoText;

                } else {
                    actualPanelThicknessCm = userPanelTypeKey === 'secco' ? (userPanelThickness / 10 || 2.5) : (userPanelThickness / 10 || 3.0); // Fallback generico
                    document.getElementById('thermolutzPanelInfo').textContent = `TL Pannello (${userPanelTypeKey}, ${userPanelThickness}mm): Non trovato. Stima generica.`;
                }
            } else { // Generico o altra marca
                actualPanelThicknessCm = userPanelTypeKey === 'secco' ? (userPanelThickness / 10 || 2.5) : (userPanelThickness / 10 || 3.0);
            }

            let estimatedTotalPipeLength = 0;
            let estimatedTotalCircuits = 0;
            const roomResultsTableBody = document.getElementById('roomResultsTableBody');
            if (roomResultsTableBody) roomResultsTableBody.innerHTML = ''; // Pulisci tabella
    
            rooms.forEach(room => {
                let currentRoomPipePitchCm = userGeneralPipePitchCm;
                let estimatedWattPerMq;
    
                if (selectedBrand === 'thermolutz' && foundThermolutzPanel) {
                    let resaTL = 0;
                    // Assicurati che questi campi esistano su foundThermolutzPanel e contengano numeri
                    const r10 = foundThermolutzPanel.resa_passo_10_wmq || 0;
                    const r15 = foundThermolutzPanel.resa_passo_15_wmq || 0;
                    const r20 = foundThermolutzPanel.resa_passo_20_wmq || 0;

                    if (currentRoomPipePitchCm <= 10 && r10 > 0) {
                        resaTL = r10;
                    } else if (currentRoomPipePitchCm > 10 && currentRoomPipePitchCm <= 15 && r10 > 0 && r15 > 0) {
                        resaTL = r10 - ((r10 - r15) / (15 - 10)) * (currentRoomPipePitchCm - 10);
                    } else if (currentRoomPipePitchCm > 15 && currentRoomPipePitchCm <= 20 && r15 > 0 && r20 > 0) {
                        resaTL = r15 - ((r15 - r20) / (20 - 15)) * (currentRoomPipePitchCm - 15);
                    } else if (currentRoomPipePitchCm == 15 && r15 > 0) {
                         resaTL = r15;
                    } else if (currentRoomPipePitchCm == 20 && r20 > 0) {
                         resaTL = r20;
                    } else { 
                        resaTL = r20 || r15 || r10 || 50; // Fallback
                    }
                    estimatedWattPerMq = resaTL;
                    if (room.flooring === 'parquet') estimatedWattPerMq *= 0.90;
                    else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.85;
                } else { 
                    // Stima generica
                    let baseWatt = 70; 
                    if (flowTemperature < 35) baseWatt *= 0.8; if (flowTemperature > 40) baseWatt *= 1.15;
                    if (insulationLevel === 'good') baseWatt *= 0.9; if (insulationLevel === 'poor') baseWatt *= 0.75;
                    let powerFactorByPitch = (10 / currentRoomPipePitchCm); // Semplificato
                    estimatedWattPerMq = baseWatt * powerFactorByPitch;
                    if (room.flooring === 'parquet') estimatedWattPerMq *= 0.85;
                    else if (room.flooring === 'laminate') estimatedWattPerMq *= 0.90;
                    else if (room.flooring === 'resin') estimatedWattPerMq *= 0.95;
                    else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.80;
                }
                estimatedWattPerMq = Math.max(15, Math.min(150, estimatedWattPerMq));
                const estimatedTotalWattRoom = estimatedWattPerMq * room.surface;
    
                const roomPipeLength = (room.surface / (currentRoomPipePitchCm / 100)) * 1.08;
                const roomCircuits = Math.ceil(roomPipeLength / MAX_CIRCUIT_LENGTH);
                
                estimatedTotalPipeLength += roomPipeLength;
                estimatedTotalCircuits += roomCircuits;
    
                if (roomResultsTableBody) {
                    const row = roomResultsTableBody.insertRow();
                    row.insertCell().textContent = room.name;
                    row.insertCell().textContent = room.surface.toFixed(2);
                    row.insertCell().textContent = currentRoomPipePitchCm.toFixed(1);
                    row.insertCell().textContent = estimatedWattPerMq.toFixed(1);
                    row.insertCell().textContent = estimatedTotalWattRoom.toFixed(0);
                    row.insertCell().textContent = roomPipeLength.toFixed(1);
                    row.insertCell().textContent = roomCircuits;
                }
            });
            
            const insulationPanelArea = totalRadiantSurface * SFRIDO_PERCENTAGE;
            let actualPipeRollLength = PIPE_ROLL_LENGTH_GENERIC;
            let pipeRolls;
    
            // Logica Thermolutz per Tubo e Collettore (e altri accessori)
            if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
                let tlPipeKeywords = ["TUBO"];
                if (userPipeDiameter === '16x2') tlPipeKeywords.push("16X2", "16 X 2", "16x2,0");
                else if (userPipeDiameter === '17x2') tlPipeKeywords.push("17X2", "17 X 2", "17x2,0");
                
                const foundPipe = thermolutzProducts.find(p => 
                    p.descrizione &&
                    tlPipeKeywords.some(kw => p.descrizione.toUpperCase().includes(kw)) &&
                    (p.descrizione.toUpperCase().includes("PE-XA") || p.descrizione.toUpperCase().includes("PERT") || p.descrizione.toUpperCase().includes("MULTISTRATO")) &&
                    (p.descrizione.toUpperCase().includes("ROTOL") || p.descrizione.toUpperCase().includes(" MT")) &&
                    !p.descrizione.toUpperCase().includes("RACCORDO") && !p.descrizione.toUpperCase().includes("CURVA") && !p.descrizione.toUpperCase().includes("ADATTATORE")
                );
                if (foundPipe) {
                    document.getElementById('thermolutzPipeInfo').innerHTML = `<li>TL Tubo: ${foundPipe.codice_fornitore || foundPipe.id} - ${foundPipe.descrizione.substring(0,60)}...</li>`;
                    const match = foundPipe.descrizione.match(/(\d+)\s*MT/i) || foundPipe.descrizione.match(/MT\s*(\d+)/i);
                    if (match && match[1]) {
                        actualPipeRollLength = parseInt(match[1]);
                    } else if (foundPipe.imballo && typeof foundPipe.imballo === 'number' && foundPipe.imballo > 50 && foundPipe.imballo % 10 === 0) {
                        actualPipeRollLength = foundPipe.imballo; // Usa imballo come lunghezza rotolo tubo
                    }
                } else {
                     document.getElementById('thermolutzPipeInfo').innerHTML = `<li>TL Tubo (${userPipeDiameter}): Non trovato.</li>`;
                }
                
                // Punto 2: Trova Collettore Thermolutz usando attacchi_collettore
                const foundCollector = thermolutzProducts.find(p =>
                    p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") &&
                    parseInt(p.attacchi_collettore) === estimatedTotalCircuits && // Confronta con attacchi_collettore
                    !p.descrizione.toUpperCase().includes("CASSETTA") && !p.descrizione.toUpperCase().includes("ACCESSORIO") && !p.descrizione.toUpperCase().includes("SUPPORTO")
                );
                 if (foundCollector) {
                    document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore (${estimatedTotalCircuits} vie): ${foundCollector.codice_fornitore || foundCollector.id} - ${foundCollector.descrizione.substring(0,60)}...</li>`;
                } else {
                    // Fallback se non trovo il numero esatto di vie o prodotto con attacchi_collettore
                    const genericCollector = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") && (p.descrizione.toUpperCase().includes("COMPOSTO") || p.descrizione.toUpperCase().includes("INOX")) && !p.descrizione.toUpperCase().includes("ACCESSORIO") && parseInt(p.attacchi_collettore) >= estimatedTotalCircuits);
                    if(genericCollector){ document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore: ${genericCollector.codice_fornitore || genericCollector.id} - ${genericCollector.descrizione.substring(0,60)}... (N. vie: ${genericCollector.attacchi_collettore}, necessarie ${estimatedTotalCircuits})</li>`; }
                    else { document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore: Non trovato.</li>`; }
                }
    
                // Altri accessori Thermolutz
                const foundStrip = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("STRISCIA PERIMETRALE") && !p.descrizione.toUpperCase().includes("ANGOLARE"));
                if(foundStrip) document.getElementById('thermolutzStripInfo').innerHTML = `TL Striscia: ${foundStrip.codice_fornitore || foundStrip.id} - ${foundStrip.descrizione.substring(0,60)}...`;
    
                const foundActuator = thermolutzProducts.find(p => p.descrizione && (p.descrizione.toUpperCase().includes("TESTINA ELETTROTERMICA") || p.descrizione.toUpperCase().includes("ATTUATORE")));
                if(foundActuator) document.getElementById('thermolutzActuatorInfo').innerHTML = `TL Testina: ${foundActuator.codice_fornitore || foundActuator.id} - ${foundActuator.descrizione.substring(0,60)}...`;
            }
    
            pipeRolls = Math.ceil(estimatedTotalPipeLength / actualPipeRollLength);
    
            // Aggiornamento UI con Risultati Finali
            document.getElementById('panelTypeOutput').textContent = `${panelTypeSelect.options[panelTypeSelect.selectedIndex].text} (Marca: ${selectedBrand}, Sp: ${userPanelThickness}mm)`;
            document.getElementById('insulationPanelAreaOutput').textContent = insulationPanelArea.toFixed(2);
            document.getElementById('pipeDiameterOutput').textContent = userPipeDiameter;
            document.getElementById('pipePitchOutput').textContent = userGeneralPipePitchCm.toFixed(1);
            document.getElementById('totalPipeLengthOutput').textContent = estimatedTotalPipeLength.toFixed(1);
            document.getElementById('pipeRollsOutput').textContent = `${pipeRolls} (da ${actualPipeRollLength}m/cad)`;
    
            const numCollectors = Math.ceil(estimatedTotalCircuits / MAX_WAYS_PER_COLLECTOR);
            let collectorsDetail = `${numCollectors} collettore/i`;
            if (numCollectors === 1 && estimatedTotalCircuits > 0) { collectorsDetail = `1 collettore da ${estimatedTotalCircuits} vie`; }
            else if (numCollectors > 1 && estimatedTotalCircuits > 0) { 
                 let viePerCollettore = Math.floor(estimatedTotalCircuits / numCollectors);
                 let resto = estimatedTotalCircuits % numCollectors;
                 if (resto === 0) { collectorsDetail = `${numCollectors} collettori da ${viePerCollettore} vie/cad`; }
                 else { collectorsDetail = `${numCollectors - resto} collettori da ${viePerCollettore} vie/cad e ${resto} da ${viePerCollettore + 1} vie/cad`; }
            }
            document.getElementById('numCircuitsOutput').textContent = estimatedTotalCircuits;
            document.getElementById('numCollectorsOutput').textContent = numCollectors;
            document.getElementById('collectorsDetailOutput').textContent = collectorsDetail;
    
            const perimeterStripLength = (Math.sqrt(totalRadiantSurface) * 4) * 1.20 * SFRIDO_PERCENTAGE;
            document.getElementById('perimeterStripLengthOutput').textContent = perimeterStripLength.toFixed(1);
            document.getElementById('actuatorsOutput').textContent = estimatedTotalCircuits;
            document.getElementById('thermostatsOutput').textContent = rooms.length;
    
            // Punto 8: Calcolo e Visualizzazione Materiali Aggiuntivi
            const SUPERFICIE_IMPIANTO_EFF = totalRadiantSurface; // Usiamo la superficie totale radiante
            let materialiAggiuntiviHTML = "<h3>Materiali Aggiuntivi (Stima):</h3><ul>";
            const materialiSpecs = [
                { cod: '87288', descDefault: 'Foglio Protettivo Isolante', coeff: 1.1, unita: 'mq' },
                { cod: '174454', descDefault: 'Isolcasa Lastre', coeff: 1.1, unita: 'mq' },
                { cod: '60303', descDefault: 'Additivo Fluidificante', coeff: 0.20, unita: 'kg' },
                { cod: '136402', descDefault: 'Clips Fissaggio Tubo', coeff: 1, unita: 'unità (stima x mq)' }, // Nota: clips spesso a scatola
                { cod: '265982', descDefault: 'Tubo Corrugato Protettivo', coeff: 1, unita: 'mt' }
            ];

            materialiSpecs.forEach(spec => {
                const qty = SUPERFICIE_IMPIANTO_EFF * spec.coeff;
                const prodotto = thermolutzProducts.find(p => p.codice_fornitore === spec.cod || p.articolo_cai === spec.cod); // articolo_cai se presente
                const desc = prodotto ? (prodotto.descrizione || spec.descDefault) : spec.descDefault;
                const codiceMostrato = prodotto ? (prodotto.codice_fornitore || prodotto.id || spec.cod) : spec.cod;
                materialiAggiuntiviHTML += `<li>${desc} (Art. ${codiceMostrato}): ${qty.toFixed(spec.unita === 'kg' || spec.unita === 'mt' ? 1:2)} ${spec.unita}</li>`;
            });
            materialiAggiuntiviHTML += "</ul><p><small>Le quantità per mq sono indicative.</small></p>";
            
            if (additionalMaterialsDiv) {
                additionalMaterialsDiv.innerHTML = materialiAggiuntiviHTML;
            } else {
                const resultsFieldset = document.querySelector('#resultsSection fieldset');
                if (resultsFieldset) {
                    const newDiv = document.createElement('div');
                    newDiv.id = 'additionalMaterialsOutput';
                    newDiv.innerHTML = materialiAggiuntiviHTML;
                    const considerationsTitle = Array.from(resultsFieldset.querySelectorAll('h3')).find(h => h.textContent.includes("Considerazioni Progettuali"));
                    if (considerationsTitle) resultsFieldset.insertBefore(newDiv, considerationsTitle);
                    else resultsFieldset.appendChild(newDiv);
                }
            }

            // Fine Calcolo Materiali Aggiuntivi
            
            const totalScreedActualHeight = actualPanelThicknessCm + PIPE_DIAMETER_CM_VAL + MIN_SCREED_ABOVE_PIPE;
            document.getElementById('totalScreedHeightOutput').textContent = totalScreedActualHeight.toFixed(1);
            if (totalScreedActualHeight > screedHeightAvailable) {
                document.getElementById('totalScreedHeightOutput').innerHTML += ` <strong style="color:red;">ATTENZIONE: Altezza (${totalScreedActualHeight.toFixed(1)}cm) supera disponibilità (${screedHeightAvailable}cm)!</strong>`;
            }
            document.getElementById('maxCircuitLengthOutput').textContent = MAX_CIRCUIT_LENGTH;
            document.getElementById('mixingGroupNote').style.display = (flowTemperature > 45 && document.getElementById('heatSource').value === 'condensing_boiler') ? 'block' : 'none';
            document.getElementById('coolingNote').style.display = coolingSelected ? 'block' : 'none';
    
            if (resultsSection) resultsSection.style.display = 'block';
            if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth' });
        });
    } // Fine if (calculateBtn)
}); // Fine DOMContentLoaded
