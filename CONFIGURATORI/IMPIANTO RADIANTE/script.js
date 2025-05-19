// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", // Considera le variabili d'ambiente per Netlify
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
    if (!db) { 
        console.error("Firestore non inizializzato!"); 
        alert("Errore: Impossibile connettersi al database dei prodotti."); 
        return Promise.reject("Firestore not initialized"); // Restituisci una Promise rigettata
    }
    try {
        const productsRef = collection(db, FIRESTORE_RADIANT_COLLECTION_NAME);
        const querySnapshot = await getDocs(productsRef);
        thermolutzProducts = []; 
        querySnapshot.forEach((doc) => { 
            const productData = doc.data(); 
            productData.id = doc.id; 
            thermolutzProducts.push(productData); 
        });
        console.log(`Dati Thermolutz caricati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, thermolutzProducts.length, "prodotti.");
        
        if (thermolutzProducts.length === 0) { 
            console.warn("Attenzione: Nessun dato prodotto Thermolutz trovato in Firestore. Eseguire la sincronizzazione da Google Sheets?");
            // Non mostrare alert all'utente qui, gestisci il feedback UI diversamente se necessario
        }
        // La chiamata a updateDynamicSelectsBasedOnBrandAndPanel avverrà nel .then() di DOMContentLoaded
        return Promise.resolve(); // Restituisci una Promise risolta
    } catch (error) { 
        console.error(`Errore nel caricamento dati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, error); 
        alert(`Errore caricamento dati prodotti da Firestore. Alcune funzionalità potrebbero essere limitate.`); 
        return Promise.reject(error); // Restituisci una Promise rigettata
    }
}

function getFloatValue(elementId) { 
    const el = document.getElementById(elementId); 
    return el ? (parseFloat(el.value.replace(',', '.')) || 0) : 0; 
}
function getIntValue(elementId) { 
    const el = document.getElementById(elementId); 
    return el ? (parseInt(el.value) || 0) : 0; 
}
function updateTotalSurface() {
    let total = 0; 
    document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template) .roomSurface').forEach(input => {
        const surfaceValue = parseFloat(input.value.replace(',', '.')) || 0;
        if (surfaceValue > 0) { 
            total += surfaceValue;
        }
    });
    const outputEl = document.getElementById('totalRadiantSurfaceOutput'); 
    if (outputEl) outputEl.textContent = total.toFixed(2);
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

    let nextRoomCardIdSuffix = 4; 

    function updateRoomCardIdentifiers(cardElement, cardIndex) { /* ... (Contenuto come fornito nella risposta precedente) ... */
        const headerTitle = cardElement.querySelector('.room-card-header h4');
        const roomNumberSpan = cardElement.querySelector('.room-card-header .room-number-display');
        if (roomNumberSpan) roomNumberSpan.textContent = cardIndex;
        else if (headerTitle) headerTitle.textContent = `Stanza ${cardIndex}`;
        cardElement.dataset.roomIndex = cardIndex;
        ['.roomName', '.roomSurface', '.roomFlooring'].forEach(selector => {
            const input = cardElement.querySelector(selector);
            if (input) {
                const baseId = input.id ? input.id.replace(/\d+$/, '') : selector.substring(1).toLowerCase(); 
                const baseName = input.name ? input.name.replace(/\d+$/, '') : selector.substring(1).toLowerCase();
                const oldId = input.id;
                input.id = baseId + cardIndex;
                input.name = baseName + cardIndex;
                const label = cardElement.querySelector(`label[for="${oldId}"]`);
                if (label) label.setAttribute('for', input.id);
                if (cardElement.dataset.isNewlyAdded === 'true') { // Solo per card APPENA aggiunte
                    if (input.classList.contains('roomName')) input.value = `Stanza ${cardIndex}`;
                    else if (input.classList.contains('roomSurface')) input.value = '0';
                    else if (input.classList.contains('roomFlooring')) input.selectedIndex = 0;
                }
            }
        });
        delete cardElement.dataset.isNewlyAdded;
        const removeBtn = cardElement.querySelector('.remove-room-btn');
        if (removeBtn) {
            const isOnlyActiveCard = document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template)').length <= 1 && !cardElement.classList.contains('room-placeholder-template');
            removeBtn.style.display = isOnlyActiveCard ? 'none' : 'inline-block';
            const newRemoveBtn = removeBtn.cloneNode(true);
            removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
            newRemoveBtn.addEventListener('click', function() {
                cardElement.remove();
                renumberAndSetupVisibleRoomCards();
            });
        }
    }

    function renumberAndSetupVisibleRoomCards() {
        const visibleCards = roomsGridContainer.querySelectorAll('.room-card:not(.room-placeholder-template)');
        visibleCards.forEach((card, index) => {
            updateRoomCardIdentifiers(card, index + 1);
        });
        nextRoomCardIdSuffix = visibleCards.length + 1;
        updateTotalSurface();
    }

    if(roomsGridContainer){
        const initialCards = roomsGridContainer.querySelectorAll('.room-card');
        initialCards.forEach((card, index) => {
            updateRoomCardIdentifiers(card, index + 1);
        });
        updateTotalSurface(); 
    }

    if (addRoomBtn && roomsGridContainer) {
        addRoomBtn.addEventListener('click', function() {
            const templateCardSource = document.getElementById('roomCardTemplate2') || roomsGridContainer.querySelector('.room-card');
            if (!templateCardSource) { console.error("Template card non trovato!"); return; }
            const newRoomCard = templateCardSource.cloneNode(true);
            newRoomCard.classList.remove('room-placeholder');
            newRoomCard.id = `roomCardAuto${nextRoomCardIdSuffix}`; 
            newRoomCard.dataset.isNewlyAdded = 'true'; 
            updateRoomCardIdentifiers(newRoomCard, nextRoomCardIdSuffix); 
            roomsGridContainer.appendChild(newRoomCard);
            nextRoomCardIdSuffix++;
            updateTotalSurface();
        });
    }

    if (roomsGridContainer) {
        roomsGridContainer.addEventListener('input', function(e) {
            const card = e.target.closest('.room-card.room-placeholder');
            if (card && e.target.classList.contains('roomSurface') && e.target.value !== '0' && e.target.value !== '') {
                // card.classList.remove('room-placeholder'); // Esempio di attivazione placeholder
            }
            if (e.target.classList.contains('roomSurface')) {
                updateTotalSurface();
            }
        });
    }
    
    function updateDynamicSelectsBasedOnBrandAndPanel() {
        // ... (CONTENUTO COMPLETO di questa funzione come fornito nella risposta precedente) ...
        // Assicurati che questa funzione ora acceda ai campi CORRETTI di thermolutzProducts
        // che sono stati salvati da Apps Script (es. p.nome_articolo_specifico, p.spessore_totale_mm,
        // p.passi_posa_disponibili_mm, etc.)
        const selectedBrand = brandSystemSelect.value;
        const selectedPanelTypeKey = panelTypeSelect.value;
        const selectedPanelThickness = getIntValue('panelThickness');

        panelModelSelect.innerHTML = '<option value="">-- Caricamento/Non disponibile --</option>';
        panelModelSelect.disabled = true;
        if(panelModelContainer) panelModelContainer.style.display = 'none';
        generalPipePitchSelect.innerHTML = '<option value="10">10 cm</option><option value="15" selected>15 cm</option><option value="20">20 cm</option>';

        if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
            let panelQueryType = selectedPanelTypeKey.toLowerCase();
            const matchingPanels = thermolutzProducts.filter(p =>
                p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) &&
                p.spessore_totale_mm === selectedPanelThickness &&
                p.nome_articolo_specifico // Usa il nome del campo corretto da Firestore
            );

            if (matchingPanels.length > 0) {
                if(panelModelContainer) panelModelContainer.style.display = 'block';
                panelModelSelect.innerHTML = '<option value="">-- Seleziona Modello Lastra --</option>';
                matchingPanels.forEach(panel => {
                    const opt = document.createElement('option');
                    opt.value = panel.codice_fornitore || panel.id; // Usa il campo ID corretto
                    opt.textContent = panel.nome_articolo_specifico + (panel.dimensione_mm ? ` (${panel.dimensione_mm})` : '');
                    opt.dataset.passiDisponibili = JSON.stringify(panel.passi_posa_disponibili_mm || []); // Usa il campo corretto
                    opt.dataset.codice = panel.codice_fornitore || panel.id;
                    panelModelSelect.appendChild(opt);
                });
                panelModelSelect.disabled = false;
                panelModelSelect.onchange = function() {
                    const selectedOption = this.options[this.selectedIndex];
                    const passiDisponibiliMm = JSON.parse(selectedOption.dataset.passiDisponibili || "[]");
                    generalPipePitchSelect.innerHTML = '';
                    if (passiDisponibiliMm.length > 0) {
                        passiDisponibiliMm.forEach(passoMm => {
                            if (typeof passoMm === 'number' && !isNaN(passoMm)) {
                                const passoCm = passoMm / 10;
                                const opt = document.createElement('option');
                                opt.value = passoCm;
                                opt.textContent = `${passoCm} cm (${passoMm}mm)`;
                                generalPipePitchSelect.appendChild(opt);
                            }
                        });
                        const defaultPitchCm = 15;
                        if (passiDisponibiliMm.includes(defaultPitchCm * 10)) {
                            generalPipePitchSelect.value = defaultPitchCm.toString();
                        } else if (passiDisponibiliMm.length > 0 && !isNaN(passiDisponibiliMm[0])) {
                            generalPipePitchSelect.value = (passiDisponibiliMm[0] / 10).toString();
                        }
                    } else {
                         generalPipePitchSelect.innerHTML = '<option value="10">10 cm</option><option value="15" selected>15 cm</option><option value="20">20 cm</option>';
                    }
                };
                if (matchingPanels.length >= 1) {
                    panelModelSelect.selectedIndex = 1; 
                    if (typeof panelModelSelect.onchange === "function") panelModelSelect.onchange();
                }
            } else {
                panelModelSelect.innerHTML = '<option value="">Nessun modello per criteri</option>';
                if(panelModelContainer) panelModelContainer.style.display = 'block'; 
            }
        }
    }


    if (brandSystemSelect) brandSystemSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    if (panelTypeSelect) panelTypeSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    if (panelThicknessInput) panelThicknessInput.addEventListener('input', updateDynamicSelectsBasedOnBrandAndPanel); 

    loadThermolutzData()
        .then(() => {
            console.log("Dati caricati, ora aggiorno UI.");
            updateDynamicSelectsBasedOnBrandAndPanel(); 
            renumberAndSetupVisibleRoomCards(); 
        })
        .catch(err => {
            console.error("Errore nella catena di caricamento dati iniziale:", err);
        });


    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // === INCOLLA QUI IL CORPO COMPLETO DI calculateBtn CHE HAI RICEVUTO PRIMA ===
            // Assicurandoti di adattare:
            // const userGeneralPipePitchCm = parseFloat(generalPipePitchSelect.value);
            // const selectedPanelModelOption = panelModelSelect.options[panelModelSelect.selectedIndex];
            // const selectedPanelModelCode = selectedPanelModelOption ? selectedPanelModelOption.dataset.codice : null;
            // La raccolta `const rooms = [];` è già all'inizio della funzione `calculateBtn` sopra.
            // Tutti gli accessi a `foundThermolutzPanel.fieldName` devono usare i nomi dei campi
            // corretti come salvati da Apps Script a Firestore.

            // CORPO DELLA FUNZIONE calculateBtn DA INTEGRARE QUI (esempio da ultima versione):
            const insulationLevel = document.getElementById('insulationLevel').value;
            const screedHeightAvailable = getFloatValue('screedHeight');
            const flowTemperature = getIntValue('flowTemperature');
            const coolingSelected = document.getElementById('cooling').value === 'yes';
            const userPanelTypeKey = panelTypeSelect.value; 
            const userPanelThickness = getIntValue('panelThickness');
            const selectedPanelModelOption = panelModelSelect.options[panelModelSelect.selectedIndex];
            const selectedPanelModelCode = selectedPanelModelOption ? selectedPanelModelOption.dataset.codice : null; // Codice del modello lastra
            const userPipeDiameter = document.getElementById('pipeDiameter').value;
            const userGeneralPipePitchCm = parseFloat(generalPipePitchSelect.value);
            const selectedBrand = brandSystemSelect.value;
            
            document.getElementById('thermolutzPanelInfo').innerHTML = ''; 
            document.getElementById('thermolutzPipeInfo').innerHTML = '';
            // ... altri reset ...
            const additionalMaterialsDiv = document.getElementById('additionalMaterialsOutput');
            if(additionalMaterialsDiv) additionalMaterialsDiv.innerHTML = '';

            const rooms = [];
            roomsGridContainer.querySelectorAll('.room-card:not(.room-placeholder-template)').forEach((card) => {
                const nameInput = card.querySelector('.roomName');
                const surfaceInput = card.querySelector('.roomSurface');
                const flooringSelect = card.querySelector('.roomFlooring');
                if (nameInput && surfaceInput && flooringSelect) {
                    const name = nameInput.value || `Stanza ${card.dataset.roomIndex || '?'}`;
                    const surface = parseFloat(surfaceInput.value.replace(',', '.')) || 0;
                    const flooring = flooringSelect.value;
                    if (surface > 0) { rooms.push({ name, surface, flooring }); }
                }
            });
            if (rooms.length === 0) { alert("Aggiungi almeno una stanza con superficie >0 mq."); return; }
            
            let totalRadiantSurface = 0;
            rooms.forEach(room => totalRadiantSurface += room.surface);

            const SFRIDO_PERCENTAGE = 1.07; /* ... tue costanti ... */
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
                let panelQueryType = userPanelTypeKey.toLowerCase();
                foundThermolutzPanel = thermolutzProducts.find(p => 
                    p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) &&
                    p.spessore_totale_mm === userPanelThickness && // Chiave da Firestore
                    p.descrizione && !p.descrizione.toUpperCase().includes("ACCESSORIO")
                );
            }

            if (foundThermolutzPanel) {
                actualPanelThicknessCm = (foundThermolutzPanel.spessore_totale_mm || userPanelThickness) / 10; // Chiave da Firestore
                let panelInfoText = `TL Pannello: ${foundThermolutzPanel.codice_fornitore || foundThermolutzPanel.id} - ${foundThermolutzPanel.nome_articolo_specifico || foundThermolutzPanel.descrizione.substring(0,40)}... (Sp: ${foundThermolutzPanel.spessore_totale_mm}mm)`; // Chiavi da Firestore
                if (foundThermolutzPanel.mq_per_confezione && foundThermolutzPanel.mq_per_confezione > 0) { // Chiave da Firestore
                    const insulationPanelAreaTotal = totalRadiantSurface * SFRIDO_PERCENTAGE;
                    const numConfezioniPannello = Math.ceil(insulationPanelAreaTotal / foundThermolutzPanel.mq_per_confezione);
                    panelInfoText += ` (${numConfezioniPannello} conf. da ${foundThermolutzPanel.mq_per_confezione.toFixed(2)} mq/cad)`;
                }
                const passiDisponibili = foundThermolutzPanel.passi_posa_disponibili_mm || []; // Chiave da Firestore
                if (passiDisponibili.length > 0) {
                    panelInfoText += `<br><small>Passi disponibili (mm): ${passiDisponibili.join('/')}</small>`;
                }
                document.getElementById('thermolutzPanelInfo').innerHTML = panelInfoText;
            } else { /* ... fallback generico ... */ 
                 actualPanelThicknessCm = userPanelTypeKey === 'secco' ? (userPanelThickness / 10 || 2.5) : (userPanelThickness / 10 || 3.0);
                if(selectedBrand === 'thermolutz') document.getElementById('thermolutzPanelInfo').textContent = `TL Pannello specifico non trovato. Stima generica.`;
            }

            let estimatedTotalPipeLength = 0;
            let estimatedTotalCircuits = 0;
            const roomResultsTableBody = document.getElementById('roomResultsTableBody');
            if (roomResultsTableBody) roomResultsTableBody.innerHTML = '';
    
            rooms.forEach(room => { /* ... (logica calcolo per stanza come prima, usando rese da foundThermolutzPanel.resa_passo_XX_wmq) ... */
                let currentRoomPipePitchCm = userGeneralPipePitchCm;
                let estimatedWattPerMq;
                if (selectedBrand === 'thermolutz' && foundThermolutzPanel) {
                    let resaTL = 0;
                    const r10 = foundThermolutzPanel.resa_passo_10_wmq || 0; // Chiavi da Firestore
                    const r15 = foundThermolutzPanel.resa_passo_15_wmq || 0;
                    const r20 = foundThermolutzPanel.resa_passo_20_wmq || 0;
                    if (currentRoomPipePitchCm <= 10 && r10 > 0) { resaTL = r10; } 
                    else if (currentRoomPipePitchCm > 10 && currentRoomPipePitchCm < 15 && r10 > 0 && r15 > 0) { resaTL = r10 - ((r10 - r15) / 5) * (currentRoomPipePitchCm - 10); } 
                    else if (currentRoomPipePitchCm == 15 && r15 > 0) { resaTL = r15; } 
                    else if (currentRoomPipePitchCm > 15 && currentRoomPipePitchCm < 20 && r15 > 0 && r20 > 0) { resaTL = r15 - ((r15 - r20) / 5) * (currentRoomPipePitchCm - 15); } 
                    else if (currentRoomPipePitchCm == 20 && r20 > 0) { resaTL = r20; } 
                    else { resaTL = r20 || r15 || r10 || 50; }
                    estimatedWattPerMq = resaTL;
                    if (room.flooring === 'parquet') estimatedWattPerMq *= 0.90; else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.85;
                } else {  /* ... stima generica ... */ 
                    let baseWatt = 70; if (flowTemperature < 35) baseWatt *= 0.8; if (flowTemperature > 40) baseWatt *= 1.15; if (insulationLevel === 'good') baseWatt *= 0.9; if (insulationLevel === 'poor') baseWatt *= 0.75; let powerFactorByPitch = (10 / currentRoomPipePitchCm); estimatedWattPerMq = baseWatt * powerFactorByPitch; if (room.flooring === 'parquet') estimatedWattPerMq *= 0.85; else if (room.flooring === 'laminate') estimatedWattPerMq *= 0.90; else if (room.flooring === 'resin') estimatedWattPerMq *= 0.95; else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.80;
                }
                estimatedWattPerMq = Math.max(15, Math.min(150, estimatedWattPerMq)); const estimatedTotalWattRoom = estimatedWattPerMq * room.surface; const roomPipeLength = (room.surface / (currentRoomPipePitchCm / 100)) * 1.08; const roomCircuits = Math.ceil(roomPipeLength / MAX_CIRCUIT_LENGTH); estimatedTotalPipeLength += roomPipeLength; estimatedTotalCircuits += roomCircuits;
                if (roomResultsTableBody) { /* ... popola tabella ... */ 
                    const row = roomResultsTableBody.insertRow(); row.insertCell().textContent = room.name; row.insertCell().textContent = room.surface.toFixed(2); row.insertCell().textContent = currentRoomPipePitchCm.toFixed(1); row.insertCell().textContent = estimatedWattPerMq.toFixed(1); row.insertCell().textContent = estimatedTotalWattRoom.toFixed(0); row.insertCell().textContent = roomPipeLength.toFixed(1); row.insertCell().textContent = roomCircuits;
                }
            });
            
            // ... (Ricerca Tubo, Collettore, Accessori Thermolutz - usando foundThermolutzPanel.attacchi_collettore etc. Chiavi da Firestore)
            let actualPipeRollLength = PIPE_ROLL_LENGTH_GENERIC;
            if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
                let tlPipeKeywords = ["TUBO"]; if (userPipeDiameter === '16x2') tlPipeKeywords.push("16X2", "16 X 2", "16x2,0"); else if (userPipeDiameter === '17x2') tlPipeKeywords.push("17X2", "17 X 2", "17x2,0");
                const foundPipe = thermolutzProducts.find(p => p.descrizione && tlPipeKeywords.some(kw => p.descrizione.toUpperCase().includes(kw)) && (p.descrizione.toUpperCase().includes("PE-XA") || p.descrizione.toUpperCase().includes("PERT") || p.descrizione.toUpperCase().includes("MULTISTRATO")) && (p.descrizione.toUpperCase().includes("ROTOL") || p.descrizione.toUpperCase().includes(" MT")) && !p.descrizione.toUpperCase().includes("RACCORDO"));
                if (foundPipe) { document.getElementById('thermolutzPipeInfo').innerHTML = `<li>TL Tubo: ${foundPipe.codice_fornitore || foundPipe.id} - ${foundPipe.descrizione.substring(0,60)}...</li>`; const match = foundPipe.descrizione.match(/(\d+)\s*MT/i); if (match && match[1]) { actualPipeRollLength = parseInt(match[1]); } else if (foundPipe.imballo && typeof foundPipe.imballo === 'number' && foundPipe.imballo > 50) { actualPipeRollLength = foundPipe.imballo; }} else { document.getElementById('thermolutzPipeInfo').innerHTML = `<li>TL Tubo (${userPipeDiameter}): Non trovato.</li>`;}
                const foundCollector = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") && parseInt(p.attacchi_collettore) === estimatedTotalCircuits && !p.descrizione.toUpperCase().includes("CASSETTA")); // Usa attacchi_collettore da Firestore
                if (foundCollector) { document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore (${estimatedTotalCircuits} vie): ${foundCollector.codice_fornitore || foundCollector.id} - ${foundCollector.descrizione.substring(0,60)}...</li>`; } else { /* ... fallback collettore ... */ const genericCollector = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") && parseInt(p.attacchi_collettore) >= estimatedTotalCircuits ); if(genericCollector){ document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore: ${genericCollector.codice_fornitore || genericCollector.id} - ${genericCollector.descrizione.substring(0,60)}... (Vie disp: ${genericCollector.attacchi_collettore}, Nec: ${estimatedTotalCircuits})</li>`; } else { document.getElementById('thermolutzCollectorInfo').innerHTML = `<li>TL Collettore: Non trovato.</li>`; } }
                const foundStrip = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("STRISCIA PERIMETRALE")); if(foundStrip) document.getElementById('thermolutzStripInfo').innerHTML = `TL Striscia: ${foundStrip.codice_fornitore || foundStrip.id} - ${foundStrip.descrizione.substring(0,60)}...`;
                const foundActuator = thermolutzProducts.find(p => p.descrizione && (p.descrizione.toUpperCase().includes("TESTINA ELETTROTERMICA") || p.descrizione.toUpperCase().includes("ATTUATORE"))); if(foundActuator) document.getElementById('thermolutzActuatorInfo').innerHTML = `TL Testina: ${foundActuator.codice_fornitore || foundActuator.id} - ${foundActuator.descrizione.substring(0,60)}...`;
            }

            // ... (Calcolo pipeRolls e aggiornamento DOM per output generali e materiali aggiuntivi come prima)
             const pipeRolls = Math.ceil(estimatedTotalPipeLength / actualPipeRollLength);
            document.getElementById('panelTypeOutput').textContent = `${panelTypeSelect.options[panelTypeSelect.selectedIndex].text} (Marca: ${selectedBrand}, Sp: ${userPanelThickness}mm)`;
            document.getElementById('insulationPanelAreaOutput').textContent = (totalRadiantSurface * SFRIDO_PERCENTAGE).toFixed(2);
            document.getElementById('pipeDiameterOutput').textContent = userPipeDiameter;
            document.getElementById('pipePitchOutput').textContent = userGeneralPipePitchCm.toFixed(1);
            document.getElementById('totalPipeLengthOutput').textContent = estimatedTotalPipeLength.toFixed(1);
            document.getElementById('pipeRollsOutput').textContent = `${pipeRolls} (da ${actualPipeRollLength}m/cad)`;
            const numCollectors = Math.ceil(estimatedTotalCircuits / MAX_WAYS_PER_COLLECTOR); let collectorsDetail = `${numCollectors} collettore/i`; if (numCollectors === 1 && estimatedTotalCircuits > 0) { collectorsDetail = `1 collettore da ${estimatedTotalCircuits} vie`; } else if (numCollectors > 1 && estimatedTotalCircuits > 0) { let vpc = Math.floor(estimatedTotalCircuits/numCollectors);let r=estimatedTotalCircuits%numCollectors;if(r===0){collectorsDetail=`${numCollectors} da ${vpc} vie/cad`;}else{collectorsDetail=`${numCollectors-r} da ${vpc} vie/cad e ${r} da ${vpc+1} vie/cad`;}}
            document.getElementById('numCircuitsOutput').textContent = estimatedTotalCircuits; document.getElementById('numCollectorsOutput').textContent = numCollectors; document.getElementById('collectorsDetailOutput').textContent = collectorsDetail;
            const perimeterStripLength = (Math.sqrt(totalRadiantSurface) * 4) * 1.20 * SFRIDO_PERCENTAGE; document.getElementById('perimeterStripLengthOutput').textContent = perimeterStripLength.toFixed(1); document.getElementById('actuatorsOutput').textContent = estimatedTotalCircuits; document.getElementById('thermostatsOutput').textContent = rooms.length;
            let materialiAggiuntiviHTML = "<h3>Materiali Aggiuntivi (Stima):</h3><ul>"; const materialiSpecs = [{cod:'87288',descDefault:'Foglio Protettivo Isolante',coeff:1.1,unita:'mq'},{cod:'174454',descDefault:'Isolcasa Lastre',coeff:1.1,unita:'mq'},{cod:'60303',descDefault:'Additivo Fluidificante',coeff:0.20,unita:'kg'},{cod:'136402',descDefault:'Clips Fissaggio Tubo',coeff:1,unita:'pz (stima x mq)'},{cod:'265982',descDefault:'Tubo Corrugato Protettivo',coeff:1,unita:'mt'}];
            materialiSpecs.forEach(spec => { const qty=totalRadiantSurface*spec.coeff;const p=thermolutzProducts.find(pr=>pr.codice_fornitore===spec.cod||pr.articolo_cai===spec.cod);const d=p?(p.descrizione||spec.descDefault):spec.descDefault;const c=p?(p.codice_fornitore||p.id||spec.cod):spec.cod;materialiAggiuntiviHTML+=`<li>${d} (Art. ${c}): ${qty.toFixed(spec.unita==='kg'||spec.unita==='mt'?1:2)} ${spec.unita}</li>`;}); materialiAggiuntiviHTML+="</ul><p><small>Le quantità sono indicative.</small></p>";
            if (additionalMaterialsDiv) { additionalMaterialsDiv.innerHTML = materialiAggiuntiviHTML;} else { const rsFieldset = document.querySelector('#resultsSection fieldset'); if(rsFieldset){const nDiv=document.createElement('div');nDiv.id='additionalMaterialsOutput';nDiv.innerHTML=materialiAggiuntiviHTML;const cTitle=Array.from(rsFieldset.querySelectorAll('h3')).find(h=>h.textContent.includes("Considerazioni"));if(cTitle)rsFieldset.insertBefore(nDiv,cTitle);else rsFieldset.appendChild(nDiv);}}
            const totalScreedActualHeight = actualPanelThicknessCm + PIPE_DIAMETER_CM_VAL + MIN_SCREED_ABOVE_PIPE; document.getElementById('totalScreedHeightOutput').textContent = totalScreedActualHeight.toFixed(1); if (totalScreedActualHeight > screedHeightAvailable) { document.getElementById('totalScreedHeightOutput').innerHTML += ` <strong style="color:red;">ATTENZIONE: Altezza (${totalScreedActualHeight.toFixed(1)}cm) supera disponibilità (${screedHeightAvailable}cm)!</strong>`; }
            document.getElementById('maxCircuitLengthOutput').textContent = MAX_CIRCUIT_LENGTH; document.getElementById('mixingGroupNote').style.display = (flowTemperature > 45 && document.getElementById('heatSource').value === 'condensing_boiler') ? 'block' : 'none'; document.getElementById('coolingNote').style.display = coolingSelected ? 'block' : 'none';
            if (resultsSection) resultsSection.style.display = 'block'; if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth' });
        }); 
    } 
}); 
