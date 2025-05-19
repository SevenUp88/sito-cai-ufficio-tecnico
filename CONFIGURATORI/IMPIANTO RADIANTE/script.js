// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
  authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
  projectId: "consorzio-artigiani-idraulici",
  storageBucket: "consorzio-artigiani-idraulici.firebasestorage.app",
  messagingSenderId: "136848104008",
  appId: "1:136848104008:web:2724f60607dbe91d09d67d",
  measurementId: "G-NNPV2607G7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let thermolutzProducts = []; 
const FIRESTORE_RADIANT_COLLECTION_NAME = "thermolutzRadiantProducts"; 

async function loadThermolutzData() {
    if (!db) { console.error("Firestore non inizializzato!"); alert("Errore: Impossibile connettersi al database dei prodotti."); return; }
    try {
        const productsRef = collection(db, FIRESTORE_RADIANT_COLLECTION_NAME);
        const querySnapshot = await getDocs(productsRef);
        thermolutzProducts = []; 
        querySnapshot.forEach((doc) => { const productData = doc.data(); productData.id = doc.id; thermolutzProducts.push(productData); });
        console.log(`Dati Thermolutz caricati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, thermolutzProducts.length, "prodotti.");
        if (thermolutzProducts.length === 0) { 
            // alert("Attenzione: Nessun dato prodotto Thermolutz trovato nel database..."); // Commentato per non essere fastidioso
        }
        updateDynamicSelectsBasedOnBrandAndPanel(); // Chiama dopo caricamento dati
    } catch (error) { console.error(`Errore caricamento dati (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, error); alert(`Errore caricamento dati: ${error.message}`); }
}

function getFloatValue(id) { const el = document.getElementById(id); return el ? (parseFloat(el.value.replace(',', '.')) || 0) : 0; }
function getIntValue(id) { const el = document.getElementById(id); return el ? (parseInt(el.value) || 0) : 0; }
function updateTotalSurface() {
    let total = 0; 
    document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template) .roomSurface').forEach(i => {
        if (i.value && parseFloat(i.value.replace(',', '.')) > 0) { // Considera solo se la superficie è > 0
            total += (parseFloat(i.value.replace(',', '.')) || 0);
        }
    });
    const out = document.getElementById('totalRadiantSurfaceOutput'); 
    if (out) out.textContent = total.toFixed(2);
}


document.addEventListener('DOMContentLoaded', function() {
    const addRoomBtn = document.getElementById('addRoomBtn');
    const roomsGridContainer = document.getElementById('roomsGridContainer');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsSection = document.getElementById('resultsSection');
    const brandSystemSelect = document.getElementById('brandSystem');
    const panelTypeSelect = document.getElementById('panelType');
    const panelThicknessInput = document.getElementById('panelThickness');
    const panelModelSelect = document.getElementById('panelModelSelect'); 
    const panelModelContainer = document.getElementById('panelModelContainer');
    const generalPipePitchSelect = document.getElementById('generalPipePitchSelect');

    let nextRoomCardIdSuffix = 4; // Inizia da 4 perché 1, 2, 3 sono già nell'HTML

    function updateRoomCardIdentifiers(cardElement, cardIndex) {
        const headerTitle = cardElement.querySelector('.room-card-header h4');
        const roomNumberSpan = cardElement.querySelector('.room-card-header .room-number-display');
        if (roomNumberSpan) roomNumberSpan.textContent = cardIndex;
        else if (headerTitle) headerTitle.textContent = `Stanza ${cardIndex}`;
        
        cardElement.dataset.roomIndex = cardIndex;

        ['.roomName', '.roomSurface', '.roomFlooring'].forEach(selector => {
            const input = cardElement.querySelector(selector);
            if (input) {
                const baseId = input.id.replace(/\d+$/, '');
                const baseName = input.name.replace(/\d+$/, '');
                const oldId = input.id;
                input.id = baseId + cardIndex;
                input.name = baseName + cardIndex;
                const label = cardElement.querySelector(`label[for="${oldId}"]`);
                if (label) label.setAttribute('for', input.id);
            }
        });

        const removeBtn = cardElement.querySelector('.remove-room-btn');
        if (removeBtn) {
            const isFirstCard = (cardIndex === 1 && cardElement.parentElement.firstChild === cardElement) || // se è il primo figlio diretto
                                !Array.from(cardElement.parentElement.children).slice(0, Array.from(cardElement.parentElement.children).indexOf(cardElement)).some(el => el.classList.contains('room-card') && !el.classList.contains('room-placeholder-template'));


            if(cardIndex === 1 && document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template)').length <=1 && !removeBtn.closest('.room-placeholder-template')){
                removeBtn.style.display = 'none'; // Nascondi per la prima card ATTIVA
            } else {
                 removeBtn.style.display = 'inline-block';
            }
            const newRemoveBtn = removeBtn.cloneNode(true);
            removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
            newRemoveBtn.addEventListener('click', function() {
                cardElement.remove();
                renumberAndSetupVisibleRoomCards();
                updateTotalSurface();
            });
        }
    }

    function renumberAndSetupVisibleRoomCards() {
        const visibleCards = roomsGridContainer.querySelectorAll('.room-card:not(.room-placeholder-template)');
        visibleCards.forEach((card, index) => {
            updateRoomCardIdentifiers(card, index + 1);
        });
        nextRoomCardIdSuffix = visibleCards.length + 1;
        // Assicura che il totale superficie si aggiorni se una card viene rimossa e questa era l'ultima con valore
        updateTotalSurface();
    }

    // Setup iniziale per le card esistenti
    if(roomsGridContainer){
        const initialCards = roomsGridContainer.querySelectorAll('.room-card');
        initialCards.forEach((card, index) => {
            updateRoomCardIdentifiers(card, index + 1);
        });
        updateTotalSurface(); // Calcola superficie iniziale
    }


    if (addRoomBtn && roomsGridContainer) {
        addRoomBtn.addEventListener('click', function() {
            const templateCardSource = document.getElementById('roomCardTemplate2'); // Usa il secondo placeholder come template
            if (!templateCardSource) { console.error("Template card non trovato!"); return; }
            
            const newRoomCard = templateCardSource.cloneNode(true);
            newRoomCard.classList.remove('room-placeholder');
            newRoomCard.id = ''; // Rimuovi l'ID del template
            
            // Pulisci e imposta i valori per la nuova card
            newRoomCard.querySelector('.roomName').value = `Stanza ${nextRoomCardIdSuffix}`;
            newRoomCard.querySelector('.roomSurface').value = '0';
            newRoomCard.querySelector('.roomFlooring').selectedIndex = 0;
            
            updateRoomCardIdentifiers(newRoomCard, nextRoomCardIdSuffix);
            
            roomsGridContainer.appendChild(newRoomCard);
            nextRoomCardIdSuffix++;
            updateTotalSurface();
        });
    }

    if (roomsGridContainer) {
        roomsGridContainer.addEventListener('input', function(e) {
            if (e.target.classList.contains('roomSurface') || e.target.classList.contains('roomName')) {
                updateTotalSurface(); // Ricalcola quando superficie o nome (per attivare la card) cambia
            }
        });
    }
    
    // Funzione per popolare dinamicamente Modello Lastra e Passo Posa
    function updateDynamicSelectsBasedOnBrandAndPanel() {
        const selectedBrand = brandSystemSelect.value;
        const selectedPanelTypeKey = panelTypeSelect.value;
        const selectedPanelThickness = getIntValue('panelThickness');

        // Reset e gestione visibilità panelModelSelect
        panelModelSelect.innerHTML = '<option value="">-- Prima seleziona Tipo e Spessore --</option>';
        panelModelSelect.disabled = true;
        if(panelModelContainer) panelModelContainer.style.display = 'none';


        // Reset generalPipePitchSelect a opzioni generiche
        generalPipePitchSelect.innerHTML = '<option value="10">10 cm</option><option value="15" selected>15 cm</option><option value="20">20 cm</option>';

        if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
            let panelQueryType = selectedPanelTypeKey.toLowerCase();
            // if (selectedPanelTypeKey === 'secco') panelQueryType = 'a secco'; // Adatta se necessario

            const matchingPanels = thermolutzProducts.filter(p =>
                p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) &&
                p.spessore_totale_mm === selectedPanelThickness && // Usa spessore_totale_mm
                p.nome_articolo_specifico // Assicurati che abbiano un nome_articolo
            );

            if (matchingPanels.length > 0) {
                if(panelModelContainer) panelModelContainer.style.display = 'block';
                panelModelSelect.innerHTML = '<option value="">-- Seleziona Modello Lastra --</option>';
                matchingPanels.forEach(panel => {
                    const opt = document.createElement('option');
                    opt.value = panel.codice_fornitore || panel.id; // Usa codice fornitore o ID come valore
                    opt.textContent = panel.nome_articolo_specifico + (panel.dimensione_mm ? ` (${panel.dimensione_mm})` : '');
                    // Potresti voler salvare altri dati sull'opzione, es. passi disponibili
                    opt.dataset.passiDisponibili = JSON.stringify(panel.passi_posa_disponibili_mm || []);
                    opt.dataset.codice = panel.codice_fornitore || panel.id;
                    panelModelSelect.appendChild(opt);
                });
                panelModelSelect.disabled = false;

                // Listener per quando cambia il modello di lastra, per aggiornare il passo posa
                panelModelSelect.onchange = function() {
                    const selectedOption = this.options[this.selectedIndex];
                    const passiDisponibiliMm = JSON.parse(selectedOption.dataset.passiDisponibili || "[]");
                    
                    generalPipePitchSelect.innerHTML = ''; // Pulisci
                    if (passiDisponibiliMm.length > 0) {
                        passiDisponibiliMm.forEach(passoMm => {
                            const passoCm = passoMm / 10;
                            const opt = document.createElement('option');
                            opt.value = passoCm;
                            opt.textContent = `${passoCm} cm (${passoMm}mm)`;
                            generalPipePitchSelect.appendChild(opt);
                        });
                        // Preseleziona un valore (es. il primo o quello più vicino a 15cm)
                        generalPipePitchSelect.value = passiDisponibiliMm.includes(150) ? "15" : (passiDisponibiliMm[0] / 10);
                    } else {
                        // Fallback se il pannello selezionato non ha passi specifici
                         generalPipePitchSelect.innerHTML = '<option value="10">10 cm</option><option value="15" selected>15 cm</option><option value="20">20 cm</option>';
                    }
                };
                 // Triggera onchange se c'è una sola opzione o per impostare il default iniziale
                if (matchingPanels.length === 1) {
                    panelModelSelect.selectedIndex = 1; // Seleziona la prima vera opzione
                    panelModelSelect.onchange(); 
                }


            } else {
                panelModelSelect.innerHTML = '<option value="">Nessun modello per questi criteri</option>';
            }
        }
    }

    // Event listeners per aggiornare le select dinamiche
    if (brandSystemSelect) brandSystemSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    if (panelTypeSelect) panelTypeSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    if (panelThicknessInput) panelThicknessInput.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);

    // Chiamata iniziale per caricare i dati da Firestore
    loadThermolutzData();


    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // --- INIZIO LOGICA DI CALCOLO (Integrata) ---
            const insulationLevel = document.getElementById('insulationLevel').value;
            const screedHeightAvailable = getFloatValue('screedHeight');
            const flowTemperature = getIntValue('flowTemperature');
            const coolingSelected = document.getElementById('cooling').value === 'yes';
            
            const userPanelTypeKey = panelTypeSelect.value; 
            const userPanelThickness = getIntValue('panelThickness');
            // IMPORTANTE: Il "modello lastra" ora viene da panelModelSelect
            const selectedPanelModelOption = panelModelSelect.options[panelModelSelect.selectedIndex];
            const selectedPanelModelCode = selectedPanelModelOption ? selectedPanelModelOption.dataset.codice : null;


            const userPipeDiameter = document.getElementById('pipeDiameter').value;
            const userGeneralPipePitchCm = parseFloat(generalPipePitchSelect.value); // LEGGI DALLA SELECT


            const selectedBrand = brandSystemSelect.value;
    
            document.getElementById('thermolutzPanelInfo').innerHTML = '';
            document.getElementById('thermolutzPipeInfo').innerHTML = '';
            document.getElementById('thermolutzCollectorInfo').innerHTML = '';
            document.getElementById('thermolutzStripInfo').innerHTML = '';
            document.getElementById('thermolutzActuatorInfo').innerHTML = '';
            const additionalMaterialsDiv = document.getElementById('additionalMaterialsOutput');
            if (additionalMaterialsDiv) additionalMaterialsDiv.innerHTML = '';

            const rooms = [];
            roomsGridContainer.querySelectorAll('.room-card:not(.room-placeholder-template)').forEach((card) => {
                const nameInput = card.querySelector('.roomName');
                const surfaceInput = card.querySelector('.roomSurface');
                const flooringSelect = card.querySelector('.roomFlooring');
                if (nameInput && surfaceInput && flooringSelect) {
                    const name = nameInput.value || `Stanza (Sup. ${surfaceInput.value || 0}mq)`;
                    const surface = parseFloat(surfaceInput.value.replace(',', '.')) || 0;
                    const flooring = flooringSelect.value;
                    if (surface > 0) { rooms.push({ name, surface, flooring }); }
                }
            });
    
            if (rooms.length === 0) { alert("Aggiungi almeno una stanza con una superficie valida (>0 mq)."); return; }
    
            let totalRadiantSurface = 0;
            rooms.forEach(room => totalRadiantSurface += room.surface);
    
            const SFRIDO_PERCENTAGE = 1.07; 
            const MAX_CIRCUIT_LENGTH = 90; 
            const PIPE_ROLL_LENGTH_GENERIC = 240; 
            const MAX_WAYS_PER_COLLECTOR = 12;
            const MIN_SCREED_ABOVE_PIPE = 3; 
            const PIPE_DIAMETER_CM_VAL = userPipeDiameter === '16x2' ? 1.6 : 1.7;
            
            let actualPanelThicknessCm; 
            let foundThermolutzPanel = null;
    
            if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0 && selectedPanelModelCode) {
                 foundThermolutzPanel = thermolutzProducts.find(p => (p.codice_fornitore === selectedPanelModelCode || p.id === selectedPanelModelCode));
            } else if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0 ) {
                 // Fallback se il modello non è stato selezionato dalla select ma si basa su tipo e spessore
                let panelQueryType = userPanelTypeKey.toLowerCase();
                foundThermolutzPanel = thermolutzProducts.find(p => 
                    p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) &&
                    p.spessore_totale_mm === userPanelThickness &&
                    p.descrizione && !p.descrizione.toUpperCase().includes("ACCESSORIO")
                );
            }


            if (foundThermolutzPanel) {
                actualPanelThicknessCm = (foundThermolutzPanel.spessore_totale_mm || userPanelThickness) / 10;
                let panelInfoText = `TL Pannello: ${foundThermolutzPanel.codice_fornitore || foundThermolutzPanel.id} - ${foundThermolutzPanel.nome_articolo_specifico || foundThermolutzPanel.descrizione.substring(0,40)}... (Sp: ${foundThermolutzPanel.spessore_totale_mm}mm)`;
                if (foundThermolutzPanel.mq_per_confezione > 0) {
                    const insulationPanelAreaTotal = totalRadiantSurface * SFRIDO_PERCENTAGE;
                    const numConfezioniPannello = Math.ceil(insulationPanelAreaTotal / foundThermolutzPanel.mq_per_confezione);
                    panelInfoText += ` (${numConfezioniPannello} conf. da ${foundThermolutzPanel.mq_per_confezione.toFixed(2)} mq/cad)`;
                }
                const passiDisponibili = foundThermolutzPanel.passi_posa_disponibili_mm || [];
                if (passiDisponibili.length > 0) {
                    panelInfoText += `<br><small>Passi disponibili (mm): ${passiDisponibili.join('/')}</small>`;
                }
                document.getElementById('thermolutzPanelInfo').innerHTML = panelInfoText;
            } else {
                actualPanelThicknessCm = userPanelTypeKey === 'secco' ? (userPanelThickness / 10 || 2.5) : (userPanelThickness / 10 || 3.0);
                if(selectedBrand === 'thermolutz') document.getElementById('thermolutzPanelInfo').textContent = `TL Pannello specifico non trovato per criteri. Stima generica spessore.`;
            }

            let estimatedTotalPipeLength = 0;
            let estimatedTotalCircuits = 0;
            const roomResultsTableBody = document.getElementById('roomResultsTableBody');
            if (roomResultsTableBody) roomResultsTableBody.innerHTML = '';
    
            rooms.forEach(room => {
                let currentRoomPipePitchCm = userGeneralPipePitchCm;
                let estimatedWattPerMq;
                if (selectedBrand === 'thermolutz' && foundThermolutzPanel) {
                    let resaTL = 0;
                    const r10 = foundThermolutzPanel.resa_passo_10_wmq || 0;
                    const r15 = foundThermolutzPanel.resa_passo_15_wmq || 0;
                    const r20 = foundThermolutzPanel.resa_passo_20_wmq || 0;
                    if (currentRoomPipePitchCm <= 10 && r10 > 0) { resaTL = r10;
                    } else if (currentRoomPipePitchCm > 10 && currentRoomPipePitchCm < 15 && r10 > 0 && r15 > 0) { resaTL = r10 - ((r10 - r15) / 5) * (currentRoomPipePitchCm - 10);
                    } else if (currentRoomPipePitchCm == 15 && r15 > 0) { resaTL = r15;
                    } else if (currentRoomPipePitchCm > 15 && currentRoomPipePitchCm < 20 && r15 > 0 && r20 > 0) { resaTL = r15 - ((r15 - r20) / 5) * (currentRoomPipePitchCm - 15);
                    } else if (currentRoomPipePitchCm == 20 && r20 > 0) { resaTL = r20;
                    } else { resaTL = r20 || r15 || r10 || 50; }
                    estimatedWattPerMq = resaTL;
                    if (room.flooring === 'parquet') estimatedWattPerMq *= 0.90; else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.85;
                } else { 
                    let baseWatt = 70; 
                    if (flowTemperature < 35) baseWatt *= 0.8; if (flowTemperature > 40) baseWatt *= 1.15;
                    if (insulationLevel === 'good') baseWatt *= 0.9; if (insulationLevel === 'poor') baseWatt *= 0.75;
                    let powerFactorByPitch = (10 / currentRoomPipePitchCm); 
                    estimatedWattPerMq = baseWatt * powerFactorByPitch;
                    if (room.flooring === 'parquet') estimatedWattPerMq *= 0.85; else if (room.flooring === 'laminate') estimatedWattPerMq *= 0.90;
                    else if (room.flooring === 'resin') estimatedWattPerMq *= 0.95; else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.80;
                }
                estimatedWattPerMq = Math.max(15, Math.min(150, estimatedWattPerMq));
                const estimatedTotalWattRoom = estimatedWattPerMq * room.surface;
                const roomPipeLength = (room.surface / (currentRoomPipePitchCm / 100)) * 1.08;
                const roomCircuits = Math.ceil(roomPipeLength / MAX_CIRCUIT_LENGTH);
                estimatedTotalPipeLength += roomPipeLength; estimatedTotalCircuits += roomCircuits;
                if (roomResultsTableBody) {
                    const row = roomResultsTableBody.insertRow();
                    row.insertCell().textContent = room.name; row.insertCell().textContent = room.surface.toFixed(2);
                    row.insertCell().textContent = currentRoomPipePitchCm.toFixed(1); row.insertCell().textContent = estimatedWattPerMq.toFixed(1);
                    row.insertCell().textContent = estimatedTotalWattRoom.toFixed(0); row.insertCell().textContent = roomPipeLength.toFixed(1);
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
                const foundPipe = thermolutzProducts.find(p => p.descrizione && tlPipeKeywords.some(kw => p.descrizione.toUpperCase().includes(kw)) && (p.descrizione.toUpperCase().includes("PE-XA") || p.descrizione.toUpperCase().includes("PERT") || p.descrizione.toUpperCase().includes("MULTISTRATO")) && (p.descrizione.toUpperCase().includes("ROTOL") || p.descrizione.toUpperCase().includes(" MT")) && !p.descrizione.toUpperCase().includes("RACCORDO") && !p.descrizione.toUpperCase().includes("CURVA") && !p.descrizione.toUpperCase().includes("ADATTATORE"));
                if (foundPipe) {
                    document.getElementById('thermolutzPipeInfo').innerHTML = `<li>TL Tubo: ${foundPipe.codice_fornitore || foundPipe.id} - ${foundPipe.descrizione.substring(0,60)}...</li>`;
                    const match = foundPipe.descrizione.match(/(\d+)\s*MT/i) || foundPipe.descrizione.match(/MT\s*(\d+)/i);
                    if (match && match[1]) { actualPipeRollLength = parseInt(match[1]); }
                    else if (foundPipe.imballo && typeof foundPipe.imballo === 'number' && foundPipe.imballo > 50 && foundPipe.imballo % 10 === 0) { actualPipeRollLength = foundPipe.imballo; }
                } else { document.getElementById('thermolutzPipeInfo').innerHTML = `<li>TL Tubo (${userPipeDiameter}): Non trovato.</li>`;}
                const foundCollector = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") && parseInt(p.attacchi_collettore) === estimatedTotalCircuits && !p.descrizione.toUpperCase().includes("CASSETTA") && !p.descrizione.toUpperCase().includes("ACCESSORIO") && !p.descrizione.toUpperCase().includes("SUPPORTO"));
                if (foundCollector) { document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore (${estimatedTotalCircuits} vie): ${foundCollector.codice_fornitore || foundCollector.id} - ${foundCollector.descrizione.substring(0,60)}...</li>`;
                } else {
                    const genericCollector = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") && (p.descrizione.toUpperCase().includes("COMPOSTO") || p.descrizione.toUpperCase().includes("INOX")) && !p.descrizione.toUpperCase().includes("ACCESSORIO") && parseInt(p.attacchi_collettore) >= estimatedTotalCircuits );
                    if(genericCollector){ document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore: ${genericCollector.codice_fornitore || genericCollector.id} - ${genericCollector.descrizione.substring(0,60)}... (Vie disp: ${genericCollector.attacchi_collettore}, Nec: ${estimatedTotalCircuits})</li>`; }
                    else { document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore: Non trovato.</li>`; }
                }
                const foundStrip = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("STRISCIA PERIMETRALE") && !p.descrizione.toUpperCase().includes("ANGOLARE"));
                if(foundStrip) document.getElementById('thermolutzStripInfo').innerHTML = `TL Striscia: ${foundStrip.codice_fornitore || foundStrip.id} - ${foundStrip.descrizione.substring(0,60)}...`;
                const foundActuator = thermolutzProducts.find(p => p.descrizione && (p.descrizione.toUpperCase().includes("TESTINA ELETTROTERMICA") || p.descrizione.toUpperCase().includes("ATTUATORE")));
                if(foundActuator) document.getElementById('thermolutzActuatorInfo').innerHTML = `TL Testina: ${foundActuator.codice_fornitore || foundActuator.id} - ${foundActuator.descrizione.substring(0,60)}...`;
            }
    
            pipeRolls = Math.ceil(estimatedTotalPipeLength / actualPipeRollLength);
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
                 let vpc = Math.floor(estimatedTotalCircuits / numCollectors); let r = estimatedTotalCircuits % numCollectors;
                 if (r === 0) { collectorsDetail = `${numCollectors} da ${vpc} vie/cad`; } else { collectorsDetail = `${numCollectors - r} da ${vpc} vie/cad e ${r} da ${vpc + 1} vie/cad`; }
            }
            document.getElementById('numCircuitsOutput').textContent = estimatedTotalCircuits;
            document.getElementById('numCollectorsOutput').textContent = numCollectors;
            document.getElementById('collectorsDetailOutput').textContent = collectorsDetail;
            const perimeterStripLength = (Math.sqrt(totalRadiantSurface) * 4) * 1.20 * SFRIDO_PERCENTAGE;
            document.getElementById('perimeterStripLengthOutput').textContent = perimeterStripLength.toFixed(1);
            document.getElementById('actuatorsOutput').textContent = estimatedTotalCircuits;
            document.getElementById('thermostatsOutput').textContent = rooms.length;
            
            let materialiAggiuntiviHTML = "<h3>Materiali Aggiuntivi (Stima):</h3><ul>";
            const materialiSpecs = [ /* ... (come prima) ... */
                { cod: '87288', descDefault: 'Foglio Protettivo Isolante', coeff: 1.1, unita: 'mq' },
                { cod: '174454', descDefault: 'Isolcasa Lastre', coeff: 1.1, unita: 'mq' },
                { cod: '60303', descDefault: 'Additivo Fluidificante', coeff: 0.20, unita: 'kg' },
                { cod: '136402', descDefault: 'Clips Fissaggio Tubo', coeff: 1, unita: 'pz (stima x mq)' },
                { cod: '265982', descDefault: 'Tubo Corrugato Protettivo', coeff: 1, unita: 'mt' }
            ];
            materialiSpecs.forEach(spec => { /* ... (come prima) ... */
                const qty = totalRadiantSurface * spec.coeff; const p = thermolutzProducts.find(pr => pr.codice_fornitore === spec.cod || pr.articolo_cai === spec.cod);
                const d = p ? (p.descrizione || spec.descDefault) : spec.descDefault; const c = p ? (p.codice_fornitore || p.id || spec.cod) : spec.cod;
                materialiAggiuntiviHTML += `<li>${d} (Art. ${c}): ${qty.toFixed(spec.unita === 'kg' || spec.unita === 'mt' ? 1:2)} ${spec.unita}</li>`;
            });
            materialiAggiuntiviHTML += "</ul><p><small>Le quantità sono indicative.</small></p>";
            if (additionalMaterialsDiv) { additionalMaterialsDiv.innerHTML = materialiAggiuntiviHTML;
            } else { const rsFieldset = document.querySelector('#resultsSection fieldset'); if (rsFieldset) { const nDiv = document.createElement('div'); nDiv.id = 'additionalMaterialsOutput'; nDiv.innerHTML = materialiAggiuntiviHTML; const cTitle = Array.from(rsFieldset.querySelectorAll('h3')).find(h => h.textContent.includes("Considerazioni")); if(cTitle) rsFieldset.insertBefore(nDiv, cTitle); else rsFieldset.appendChild(nDiv); }}
            
            const totalScreedActualHeight = actualPanelThicknessCm + PIPE_DIAMETER_CM_VAL + MIN_SCREED_ABOVE_PIPE;
            document.getElementById('totalScreedHeightOutput').textContent = totalScreedActualHeight.toFixed(1);
            if (totalScreedActualHeight > screedHeightAvailable) { document.getElementById('totalScreedHeightOutput').innerHTML += ` <strong style="color:red;">ATTENZIONE: Altezza (${totalScreedActualHeight.toFixed(1)}cm) supera disponibilità (${screedHeightAvailable}cm)!</strong>`; }
            document.getElementById('maxCircuitLengthOutput').textContent = MAX_CIRCUIT_LENGTH;
            document.getElementById('mixingGroupNote').style.display = (flowTemperature > 45 && document.getElementById('heatSource').value === 'condensing_boiler') ? 'block' : 'none';
            document.getElementById('coolingNote').style.display = coolingSelected ? 'block' : 'none';
            if (resultsSection) resultsSection.style.display = 'block';
            if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth' });
        }); // Fine calculateBtn listener
    } 
}); // Fine DOMContentLoaded
