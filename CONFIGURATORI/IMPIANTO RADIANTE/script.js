// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js"; // Usa una versione recente
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js"; // Se usi Analytics
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"; // <--- AGGIUNTO PER FIRESTORE

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", // Per un'app client pubblica è OK, la sicurezza è via Regole Firestore
  authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
  projectId: "consorzio-artigiani-idraulici",
  storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
  messagingSenderId: "136848104008",
  appId: "1:136848104008:web:2724f60607dbe91d09d67d",
  measurementId: "G-NNPV2607G7" // Opzionale se usi solo Firestore e non Analytics in questa pagina specifica
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Se usi Analytics, altrimenti puoi ometterlo per questa pagina
const db = getFirestore(app); // <--- INIZIALIZZA ISTANZA FIRESTORE

// ---------------------------------------------------------------------------------
// IL TUO CODICE DEL CONFIGURATORE RADIANTE INIZIA QUI
// (La parte che ti ho dato precedentemente, modificata per usare 'db')
// ---------------------------------------------------------------------------------

// Esempio della funzione loadThermolutzData modificata:
let thermolutzProducts = []; // Array globale per i prodotti
const FIRESTORE_RADIANT_COLLECTION_NAME = "thermolutzRadiantProducts"; // Deve corrispondere a Apps Script e Regole Firestore

async function loadThermolutzData() {
    if (!db) {
        console.error("Firestore non inizializzato!");
        alert("Errore: Impossibile connettersi al database dei prodotti.");
        return;
    }
    try {
        // 'collection' e 'getDocs' sono importati da firebase/firestore
        const productsRef = collection(db, FIRESTORE_RADIANT_COLLECTION_NAME);
        const querySnapshot = await getDocs(productsRef);
        
        thermolutzProducts = []; // Resetta prima di riempire
        querySnapshot.forEach((doc) => {
            const productData = doc.data();
            productData.id = doc.id; // Aggiungi l'ID del documento Firestore all'oggetto
            thermolutzProducts.push(productData);
        });
        console.log(`Dati Thermolutz caricati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, thermolutzProducts.length, "prodotti.");
        
        if (thermolutzProducts.length === 0) {
            alert("Attenzione: Nessun dato prodotto Thermolutz trovato nel database. La funzionalità di selezione prodotti Thermolutz potrebbe non funzionare correttamente. Eseguire la sincronizzazione da Google Sheets?");
        }

    } catch (error) {
        console.error(`Errore nel caricamento dati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, error);
        alert(`Attenzione: Impossibile caricare i dati dei prodotti Thermolutz da Firestore. Errore: ${error.message}`);
    }
}


// Chiamata per caricare i dati all'avvio dello script principale della pagina
document.addEventListener('DOMContentLoaded', function() {
    // Codice di inizializzazione dell'interfaccia utente del configuratore...
    const addRoomBtn = document.getElementById('addRoomBtn');
    const roomsContainer = document.getElementById('roomsContainer');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsSection = document.getElementById('resultsSection');
    // ... e altre variabili per gli elementi DOM

    let roomCounter = 1;

    // Funzioni helper (getFloatValue, getIntValue, updateTotalSurface)
    function getFloatValue(id) { /* ... la tua implementazione ... */ 
        const element = document.getElementById(id);
        if (!element) return 0;
        const val = parseFloat(element.value.replace(',', '.'));
        return isNaN(val) ? 0 : val;
    }
    function getIntValue(id) { /* ... la tua implementazione ... */
        const element = document.getElementById(id);
        if (!element) return 0;
        const val = parseInt(element.value);
        return isNaN(val) ? 0 : val;
    }
     function updateTotalSurface() { /* ... la tua implementazione ... */
        let totalSurface = 0;
        document.querySelectorAll('.roomSurface').forEach(input => {
            totalSurface += parseFloat(input.value.replace(',', '.')) || 0;
        });
        document.getElementById('totalRadiantSurfaceOutput').textContent = totalSurface.toFixed(2);
    }


    // Event listener per i bottoni (addRoomBtn, calculateBtn)
     if (addRoomBtn) {
        addRoomBtn.addEventListener('click', function() {
            roomCounter++;
            const newRoomEntry = document.querySelector('.room-entry').cloneNode(true);
            newRoomEntry.querySelector('h4').textContent = `Stanza ${roomCounter}`;
            const inputs = newRoomEntry.querySelectorAll('input, select');
            inputs.forEach(input => {
                const oldId = input.id;
                const oldName = input.name;
                if (oldId) input.id = oldId.slice(0, -1) + roomCounter;
                if (oldName) input.name = oldName.slice(0, -1) + roomCounter;
                if (input.type === 'text') input.value = `Stanza ${roomCounter}`;
                if (input.type === 'number' && input.classList.contains('roomSurface')) input.value = '10';
            });
            const removeBtn = newRoomEntry.querySelector('.remove-room-btn');
            removeBtn.style.display = 'inline-block';
            removeBtn.addEventListener('click', function() {
                newRoomEntry.remove();
                updateTotalSurface();
            });
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
        updateTotalSurface(); // Chiamata iniziale
    }


    // Carica i dati Thermolutz (o dei prodotti radianti)
    loadThermolutzData(); 

    // Logica del bottone CALCOLA (calculateBtn.addEventListener)
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // --- INIZIO LOGICA DI CALCOLO (come fornita precedentemente, adattata per usare i campi da Firestore) ---
            const insulationLevel = document.getElementById('insulationLevel').value;
            const screedHeightAvailable = getFloatValue('screedHeight');
            const flowTemperature = getIntValue('flowTemperature');
            const coolingSelected = document.getElementById('cooling').value === 'yes';
            
            const userPanelTypeKey = document.getElementById('panelType').value; 
            const userPanelThickness = getIntValue('panelThickness');
            const userPipeDiameter = document.getElementById('pipeDiameter').value;
            const userGeneralPipePitchCm = getIntValue('generalPipePitch');
    
            const selectedBrand = document.getElementById('brandSystem').value;
    
            // Pulisci info Thermolutz precedenti
            document.getElementById('thermolutzPanelInfo').textContent = '';
            document.getElementById('thermolutzPipeInfo').textContent = '';
            document.getElementById('thermolutzCollectorInfo').textContent = '';
            document.getElementById('thermolutzStripInfo').textContent = '';
            document.getElementById('thermolutzActuatorInfo').textContent = '';
    
            const rooms = [];
            document.querySelectorAll('.room-entry').forEach((entry, index) => {
                const name = entry.querySelector('.roomName').value || `Stanza ${index + 1}`;
                const surface = getFloatValue(entry.querySelector('.roomSurface').id);
                const flooring = entry.querySelector('.roomFlooring').value;
                if (surface > 0) {
                    rooms.push({ name, surface, flooring });
                }
            });
    
            if (rooms.length === 0) { alert("Aggiungi almeno una stanza con una superficie valida."); return; }
    
            let totalRadiantSurface = 0;
            rooms.forEach(room => totalRadiantSurface += room.surface);
    
            const SFRIDO_PERCENTAGE = 1.07;
            const MAX_CIRCUIT_LENGTH = 90;
            const PIPE_ROLL_LENGTH_GENERIC = 240;
            const MAX_WAYS_PER_COLLECTOR = 12;
            const MIN_SCREED_ABOVE_PIPE = 3; // cm
            const PIPE_DIAMETER_CM_VAL = userPipeDiameter === '16x2' ? 1.6 : 1.7;
            
            let actualPanelThicknessCm = userPanelTypeKey === 'secco' ? (userPanelThickness / 10 || 2.5) : (userPanelThickness / 10 || 3.0);
    
            let estimatedTotalPipeLength = 0;
            let estimatedTotalCircuits = 0;
            
            const roomResultsTableBody = document.getElementById('roomResultsTableBody');
            if (roomResultsTableBody) roomResultsTableBody.innerHTML = '';
    
            let foundThermolutzPanel = null;
    
            if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
                let csvPanelTypeQueryTerm = userPanelTypeKey.toLowerCase();
                 if (userPanelTypeKey === 'bugnato') csvPanelTypeQueryTerm = 'bugnato'; 
                 else if (userPanelTypeKey === 'liscio') csvPanelTypeQueryTerm = 'liscio'; 
                 else if (userPanelTypeKey === 'secco') csvPanelTypeQueryTerm = 'secco'; 
                 else if (userPanelTypeKey === 'zero') csvPanelTypeQueryTerm = 'zero';
    
                foundThermolutzPanel = thermolutzProducts.find(p => 
                    p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(csvPanelTypeQueryTerm) &&
                    p.spessore_mm === userPanelThickness && // Confronta con spessore_mm da Firestore
                    p.descrizione && !p.descrizione.toUpperCase().includes("ACCESSORIO")
                );
    
                if (foundThermolutzPanel) {
                    document.getElementById('thermolutzPanelInfo').innerHTML = `TL Pannello: ${foundThermolutzPanel.codice_fornitore || foundThermolutzPanel.id} - ${foundThermolutzPanel.descrizione.substring(0,60)}... (Sp: ${foundThermolutzPanel.spessore_mm}mm)`;
                    actualPanelThicknessCm = foundThermolutzPanel.spessore_mm / 10;
                } else {
                    document.getElementById('thermolutzPanelInfo').textContent = `TL Pannello (${userPanelTypeKey}, ${userPanelThickness}mm): Non trovato. Stima generica.`;
                }
            }
    
            rooms.forEach(room => {
                let currentRoomPipePitchCm = userGeneralPipePitchCm;
                let estimatedWattPerMq;
    
                if (selectedBrand === 'thermolutz' && foundThermolutzPanel) {
                    let resaTL = 0;
                    // Accedi ai campi di resa con i nomi definiti in Apps Script (es. resa_passo_10_wmq)
                    if (currentRoomPipePitchCm <= 10 && foundThermolutzPanel.resa_passo_10_wmq > 0) {
                        resaTL = foundThermolutzPanel.resa_passo_10_wmq;
                    } else if (currentRoomPipePitchCm > 10 && currentRoomPipePitchCm <= 15 && foundThermolutzPanel.resa_passo_10_wmq > 0 && foundThermolutzPanel.resa_passo_15_wmq > 0) {
                        const p10 = foundThermolutzPanel.resa_passo_10_wmq;
                        const p15 = foundThermolutzPanel.resa_passo_15_wmq;
                        resaTL = p10 - ((p10 - p15) / (15 - 10)) * (currentRoomPipePitchCm - 10);
                    } else if (currentRoomPipePitchCm > 15 && currentRoomPipePitchCm <= 20 && foundThermolutzPanel.resa_passo_15_wmq > 0 && foundThermolutzPanel.resa_passo_20_wmq > 0) {
                        const p15 = foundThermolutzPanel.resa_passo_15_wmq;
                        const p20 = foundThermolutzPanel.resa_passo_20_wmq;
                        resaTL = p15 - ((p15 - p20) / (20 - 15)) * (currentRoomPipePitchCm - 15);
                    } else if (currentRoomPipePitchCm == 15 && foundThermolutzPanel.resa_passo_15_wmq > 0) {
                         resaTL = foundThermolutzPanel.resa_passo_15_wmq;
                    } else if (currentRoomPipePitchCm == 20 && foundThermolutzPanel.resa_passo_20_wmq > 0) {
                         resaTL = foundThermolutzPanel.resa_passo_20_wmq;
                    } else { 
                        resaTL = foundThermolutzPanel.resa_passo_20_wmq || foundThermolutzPanel.resa_passo_15_wmq || foundThermolutzPanel.resa_passo_10_wmq || 50;
                    }
                    estimatedWattPerMq = resaTL;
                    if (room.flooring === 'parquet') estimatedWattPerMq *= 0.90;
                    else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.85;
    
                } else { 
                    let baseWatt = 70; 
                    if (flowTemperature < 35) baseWatt *= 0.8; if (flowTemperature > 40) baseWatt *= 1.15;
                    if (insulationLevel === 'good') baseWatt *= 0.9; if (insulationLevel === 'poor') baseWatt *= 0.75;
                    let powerFactorByPitch = (10 / currentRoomPipePitchCm);
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
                    document.getElementById('thermolutzPipeInfo').innerHTML = `TL Tubo: ${foundPipe.codice_fornitore || foundPipe.id} - ${foundPipe.descrizione.substring(0,60)}...`;
                    const match = foundPipe.descrizione.match(/(\d+)\s*MT/i) || foundPipe.descrizione.match(/MT\s*(\d+)/i);
                    if (match && match[1]) {
                        actualPipeRollLength = parseInt(match[1]);
                    } else if (foundPipe.imballo && typeof foundPipe.imballo === 'number' && foundPipe.imballo > 50 && foundPipe.imballo % 10 === 0) {
                        actualPipeRollLength = foundPipe.imballo;
                    }
                } else {
                     document.getElementById('thermolutzPipeInfo').innerHTML = `TL Tubo (${userPipeDiameter}): Non trovato.`;
                }
                
                const foundCollector = thermolutzProducts.find(p =>
                    p.descrizione &&
                    p.descrizione.toUpperCase().includes("COLLETTORE") &&
                    (p.descrizione.includes(estimatedTotalCircuits + " VIE") || p.descrizione.includes(estimatedTotalCircuits + "V")) &&
                    !p.descrizione.toUpperCase().includes("CASSETTA") && !p.descrizione.toUpperCase().includes("ACCESSORIO") && !p.descrizione.toUpperCase().includes("SUPPORTO")
                );
                 if (foundCollector) {
                    document.getElementById('thermolutzCollectorInfo').innerHTML = `TL Collettore (${estimatedTotalCircuits} vie): ${foundCollector.codice_fornitore || foundCollector.id} - ${foundCollector.descrizione.substring(0,60)}...`;
                } else {
                    const genericCollector = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") && (p.descrizione.toUpperCase().includes("COMPOSTO") || p.descrizione.toUpperCase().includes("INOX")) && !p.descrizione.toUpperCase().includes("ACCESSORIO"));
                    if(genericCollector){ document.getElementById('thermolutzCollectorInfo').innerHTML = `TL Collettore: ${genericCollector.codice_fornitore || genericCollector.id} - ${genericCollector.descrizione.substring(0,60)}... (Verificare n° vie)`; }
                    else { document.getElementById('thermolutzCollectorInfo').innerHTML = `TL Collettore: Non trovato.`; }
                }
    
                const foundStrip = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("STRISCIA PERIMETRALE") && !p.descrizione.toUpperCase().includes("ANGOLARE"));
                if(foundStrip) document.getElementById('thermolutzStripInfo').innerHTML = `TL Striscia: ${foundStrip.codice_fornitore || foundStrip.id} - ${foundStrip.descrizione.substring(0,60)}...`;
    
                const foundActuator = thermolutzProducts.find(p => p.descrizione && (p.descrizione.toUpperCase().includes("TESTINA ELETTROTERMICA") || p.descrizione.toUpperCase().includes("ATTUATORE")));
                if(foundActuator) document.getElementById('thermolutzActuatorInfo').innerHTML = `TL Testina: ${foundActuator.codice_fornitore || foundActuator.id} - ${foundActuator.descrizione.substring(0,60)}...`;
            }
    
            pipeRolls = Math.ceil(estimatedTotalPipeLength / actualPipeRollLength);
    
            // Aggiornamento output DOM
            document.getElementById('panelTypeOutput').textContent = `${document.getElementById('panelType').options[document.getElementById('panelType').selectedIndex].text} (Marca: ${selectedBrand}, Sp: ${userPanelThickness}mm)`;
            document.getElementById('insulationPanelAreaOutput').textContent = insulationPanelArea.toFixed(2);
            document.getElementById('pipeDiameterOutput').textContent = userPipeDiameter;
            document.getElementById('pipePitchOutput').textContent = userGeneralPipePitchCm.toFixed(1);
            document.getElementById('totalPipeLengthOutput').textContent = estimatedTotalPipeLength.toFixed(1);
            document.getElementById('pipeRollsOutput').textContent = `${pipeRolls} (rotoli da ${actualPipeRollLength}m/cad)`;
    
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
            // --- FINE LOGICA DI CALCOLO ---
        });
    }

}); // Fine DOMContentLoaded
