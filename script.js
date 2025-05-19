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

async function loadThermolutzData() { /* ... (Codice INVARIATO rispetto all'ultima versione, assicura che chiami updateDynamicSelectsBasedOnBrandAndPanel dopo il caricamento) ... */
    if (!db) { console.error("Firestore non inizializzato!"); alert("Errore: Database non connesso."); return Promise.reject("Firestore not initialized"); }
    try {
        const productsRef = collection(db, FIRESTORE_RADIANT_COLLECTION_NAME);
        const querySnapshot = await getDocs(productsRef);
        thermolutzProducts = []; 
        querySnapshot.forEach((doc) => { const productData = doc.data(); productData.id = doc.id; thermolutzProducts.push(productData); });
        console.log(`Dati Thermolutz da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, thermolutzProducts.length, "prodotti.");
        if (thermolutzProducts.length === 0) { console.warn("Attenzione: Dati Thermolutz non trovati. Sincronizzare da GSheets?"); }
        if (typeof updateDynamicSelectsBasedOnBrandAndPanel === "function") { updateDynamicSelectsBasedOnBrandAndPanel(); } // Chiamata qui o nel .then()
        return Promise.resolve(); 
    } catch (error) { console.error(`Errore caricamento dati Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, error); alert(`Errore caricamento dati prodotti.`); return Promise.reject(error); }
}
function getFloatValue(elementId) { const el = document.getElementById(elementId); return el ? (parseFloat(el.value.replace(',', '.')) || 0) : 0; }
function getIntValue(elementId) { const el = document.getElementById(elementId); return el ? (parseInt(el.value) || 0) : 0; }

// Variabile per contatore ID stanza globale
let nextRoomCardIdSuffix = 4; 

document.addEventListener('DOMContentLoaded', function() {
    // Riferimenti Elementi DOM
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
    const pipeDiameterSelect = document.getElementById('pipeDiameter'); // Aggiunto riferimento

    // Elementi DOM per la Card Riepilogo
    const summaryLogoContainer = document.getElementById('summaryLogoContainer');
    const summaryBrand = document.getElementById('summaryBrand');
    const summaryPanelType = document.getElementById('summaryPanelType');
    const summaryPanelModel = document.getElementById('summaryPanelModel');
    const summaryPanelThickness = document.getElementById('summaryPanelThickness');
    const summaryTotalSurface = document.getElementById('summaryTotalSurface');
    const summaryPipePitch = document.getElementById('summaryPipePitch');
    const summaryPipeDiameter = document.getElementById('summaryPipeDiameter');
    const summaryNumCircuits = document.getElementById('summaryNumCircuits');
    const summaryPerimeterStripEst = document.getElementById('summaryPerimeterStripEst');
    const summaryAdditiveEst = document.getElementById('summaryAdditiveEst');

    function updateTotalSurfaceAndSummary() {
        let total = 0; 
        document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template) .roomSurface').forEach(input => {
            const surfaceValue = parseFloat(input.value.replace(',', '.')) || 0;
            if (surfaceValue > 0) { total += surfaceValue; }
        });
        const outputEl = document.getElementById('totalRadiantSurfaceOutput'); 
        if (outputEl) outputEl.textContent = total.toFixed(2);
        updateSummaryCard(); 
    }

    function updateRoomCardIdentifiers(cardElement, cardIndex) { /* ... (Implementazione INVARIATA rispetto all'ultima che ti ho dato, che gestisce correttamente il bottone rimuovi) ... */
        const headerTitle = cardElement.querySelector('.room-card-header h4'); const roomNumberSpan = cardElement.querySelector('.room-card-header .room-number-display'); if (roomNumberSpan) roomNumberSpan.textContent = cardIndex; else if (headerTitle) headerTitle.textContent = `Stanza ${cardIndex}`; cardElement.dataset.roomIndex = cardIndex; ['.roomName', '.roomSurface', '.roomFlooring'].forEach(selector => { const input = cardElement.querySelector(selector); if (input) { const baseId = input.id ? input.id.replace(/\d+$/, '') : selector.substring(1).toLowerCase(); const baseName = input.name ? input.name.replace(/\d+$/, '') : selector.substring(1).toLowerCase(); const oldId = input.id; input.id = baseId + cardIndex; input.name = baseName + cardIndex; const label = cardElement.querySelector(`label[for="${oldId}"]`); if (label) label.setAttribute('for', input.id); if (cardElement.dataset.isNewlyAdded === 'true') { if (input.classList.contains('roomName')) input.value = `Stanza ${cardIndex}`; else if (input.classList.contains('roomSurface')) input.value = '0'; else if (input.classList.contains('roomFlooring')) input.selectedIndex = 0; } } }); delete cardElement.dataset.isNewlyAdded; const removeBtn = cardElement.querySelector('.remove-room-btn'); if (removeBtn) { const isOnlyActiveCard = document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template)').length <= 1 && !cardElement.classList.contains('room-placeholder-template') && cardIndex === 1; removeBtn.style.display = isOnlyActiveCard ? 'none' : 'inline-block'; const newRemoveBtn = removeBtn.cloneNode(true); removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn); newRemoveBtn.addEventListener('click', function() { cardElement.remove(); renumberAndSetupVisibleRoomCards(); }); }
    }

    function renumberAndSetupVisibleRoomCards() { /* ... (Implementazione INVARIATA rispetto all'ultima, chiama updateTotalSurfaceAndSummary alla fine) ... */
        const visibleCards = roomsGridContainer.querySelectorAll('.room-card:not(.room-placeholder-template)'); visibleCards.forEach((card, index) => { updateRoomCardIdentifiers(card, index + 1); }); nextRoomCardIdSuffix = visibleCards.length + 1; updateTotalSurfaceAndSummary();
    }

    if(roomsGridContainer){ /* ... (Setup iniziale card, chiama updateTotalSurfaceAndSummary) ... */
        const initialCards = roomsGridContainer.querySelectorAll('.room-card'); initialCards.forEach((card, index) => { updateRoomCardIdentifiers(card, index + 1); }); updateTotalSurfaceAndSummary(); 
    }
    if (addRoomBtn && roomsGridContainer) { /* ... (Listener addRoomBtn, chiama updateTotalSurfaceAndSummary) ... */
        addRoomBtn.addEventListener('click', function() { const templateCardSource = document.getElementById('roomCardTemplate2') || roomsGridContainer.querySelector('.room-card'); if (!templateCardSource) { console.error("Template card non trovato!"); return; } const newRoomCard = templateCardSource.cloneNode(true); newRoomCard.classList.remove('room-placeholder'); newRoomCard.id = `roomCardAuto${nextRoomCardIdSuffix}`; newRoomCard.dataset.isNewlyAdded = 'true'; updateRoomCardIdentifiers(newRoomCard, nextRoomCardIdSuffix); roomsGridContainer.appendChild(newRoomCard); nextRoomCardIdSuffix++; updateTotalSurfaceAndSummary(); });
    }
    if (roomsGridContainer) { /* ... (Listener input roomsGridContainer, chiama updateTotalSurfaceAndSummary) ... */
        roomsGridContainer.addEventListener('input', function(e) { if (e.target.classList.contains('roomSurface')) { updateTotalSurfaceAndSummary(); }});
    }
    
    window.updateDynamicSelectsBasedOnBrandAndPanel = function updateDynamicSelectsBasedOnBrandAndPanel() { /* ... (Implementazione INVARIATA rispetto all'ultima, che popola panelModelSelect e generalPipePitchSelect e aggiunge listener onchange a panelModelSelect) ... */
        const selectedBrand = brandSystemSelect.value; const selectedPanelTypeKey = panelTypeSelect.value; const selectedPanelThickness = getIntValue('panelThickness');
        panelModelSelect.innerHTML = '<option value="">-- Caricamento --</option>'; panelModelSelect.disabled = true; if(panelModelContainer) panelModelContainer.style.display = 'none';
        generalPipePitchSelect.innerHTML = '<option value="10">10 cm</option><option value="15" selected>15 cm</option><option value="20">20 cm</option><option value="25">25 cm</option>'; updateSummaryCard(); // Aggiorna il riepilogo anche se cambiano solo le opzioni
        if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
            let panelQueryType = selectedPanelTypeKey.toLowerCase();
            const matchingPanels = thermolutzProducts.filter(p => p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) && p.spessore_totale_mm === selectedPanelThickness && p.nome_articolo_specifico );
            if (matchingPanels.length > 0) {
                if(panelModelContainer) panelModelContainer.style.display = 'block'; panelModelSelect.innerHTML = '<option value="">-- Seleziona Modello Lastra --</option>';
                matchingPanels.forEach(panel => { const opt = document.createElement('option'); opt.value = panel.codice_fornitore || panel.id; opt.textContent = panel.nome_articolo_specifico + (panel.dimensione_mm ? ` (${panel.dimensione_mm})` : ''); opt.dataset.passiDisponibili = JSON.stringify(panel.passi_posa_disponibili_mm || []); opt.dataset.codice = panel.codice_fornitore || panel.id; panelModelSelect.appendChild(opt); });
                panelModelSelect.disabled = false;
                panelModelSelect.onchange = function() {
                    const selectedOption = this.options[this.selectedIndex]; const passiDisponibiliMm = JSON.parse(selectedOption.dataset.passiDisponibili || "[]"); generalPipePitchSelect.innerHTML = '';
                    if (passiDisponibiliMm.length > 0) {
                        passiDisponibiliMm.forEach(passoMm => { if (typeof passoMm === 'number' && !isNaN(passoMm) && passoMm > 0) { const passoCm = passoMm / 10; const opt = document.createElement('option'); opt.value = passoCm; opt.textContent = `${passoCm} cm (${passoMm}mm)`; generalPipePitchSelect.appendChild(opt); }});
                        const defaultPitchCm = 15; if (passiDisponibiliMm.map(pVal => pVal/10).includes(defaultPitchCm)) { generalPipePitchSelect.value = defaultPitchCm.toString(); } else if (passiDisponibiliMm.length > 0 && !isNaN(passiDisponibiliMm[0]) && passiDisponibiliMm[0] > 0) { generalPipePitchSelect.value = (passiDisponibiliMm[0] / 10).toString(); }
                    } else { generalPipePitchSelect.innerHTML = '<option value="10">10 cm (100mm)</option><option value="15" selected>15 cm (150mm)</option><option value="20">20 cm (200mm)</option><option value="25">25 cm (250mm)</option>';}
                    updateSummaryCard(); // Aggiorna riepilogo quando cambia il passo
                };
                if (matchingPanels.length >= 1) { panelModelSelect.selectedIndex = 1; if (typeof panelModelSelect.onchange === "function") panelModelSelect.onchange(); } else { panelModelSelect.onchange(); /* Trigger per fallback passi */ }
            } else { panelModelSelect.innerHTML = '<option value="">Nessun modello per criteri</option>'; if(panelModelContainer && selectedBrand === 'thermolutz') panelModelContainer.style.display = 'block'; updateSummaryCard(); /* Aggiorna il riepilogo*/ }
        } else { updateSummaryCard(); /* Aggiorna il riepilogo se non è Thermolutz */ }
    }
    
    function updateSummaryCard() { /* ... (Implementazione COMPLETA come fornita nella risposta precedente) ... */
        summaryBrand.textContent = brandSystemSelect.options[brandSystemSelect.selectedIndex].text; if (brandSystemSelect.value === 'thermolutz') { summaryLogoContainer.innerHTML = `<img src="img/thermolutz_logo.jpg" alt="Thermolutz Logo">`;} else { summaryLogoContainer.innerHTML = '';}
        summaryPanelType.textContent = panelTypeSelect.options[panelTypeSelect.selectedIndex].text; summaryPanelThickness.textContent = panelThicknessInput.value || 'N/D';
        const selPanelModelOpt = panelModelSelect.options[panelModelSelect.selectedIndex]; if (selPanelModelOpt && selPanelModelOpt.value !== "") { summaryPanelModel.textContent = selPanelModelOpt.text;} else if (brandSystemSelect.value === 'thermolutz'){ summaryPanelModel.textContent = "Scegli tipo/spessore"; } else { summaryPanelModel.textContent = "N/A";}
        const currentTotalSurf = parseFloat(document.getElementById('totalRadiantSurfaceOutput').textContent) || 0; summaryTotalSurface.textContent = currentTotalSurf.toFixed(2);
        const selPitchOpt = generalPipePitchSelect.options[generalPipePitchSelect.selectedIndex]; summaryPipePitch.textContent = selPitchOpt ? selPitchOpt.text.split('(')[0].trim() : 'N/D';
        summaryPipeDiameter.textContent = pipeDiameterSelect.options[pipeDiameterSelect.selectedIndex].text;
        const MAX_C_LEN_SUM = 90; let tempTotalPipeL=0; let tempNumCirc=0; if(currentTotalSurf>0 && generalPipePitchSelect.value){ const pitchCmSum = parseFloat(generalPipePitchSelect.value); if(pitchCmSum>0){document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template) .roomSurface').forEach(inp=>{const surf=parseFloat(inp.value.replace(',','.'))||0; if(surf>0){tempTotalPipeL+=(surf/(pitchCmSum/100))*1.08;}}); tempNumCirc = Math.ceil(tempTotalPipeL/MAX_C_LEN_SUM);}} summaryNumCircuits.textContent = tempNumCirc > 0 ? tempNumCirc : "N/D";
        if (currentTotalSurf > 0) { summaryPerimeterStripEst.textContent = ((Math.sqrt(currentTotalSurf) * 4) * 1.20 * 1.07).toFixed(1); summaryAdditiveEst.textContent = (currentTotalSurf * 0.20).toFixed(2); } else { summaryPerimeterStripEst.textContent = "N/D"; summaryAdditiveEst.textContent = "N/D"; }
    }

    // Event Listeners per aggiornare la Card Riepilogo
    brandSystemSelect.addEventListener('change', updateSummaryCard);
    panelTypeSelect.addEventListener('change', updateSummaryCard);
    panelThicknessInput.addEventListener('input', updateSummaryCard);
    // panelModelSelect ha il suo onchange che chiama già updateSummaryCard indirettamente tramite updateDynamicSelects o direttamente.
    pipeDiameterSelect.addEventListener('change', updateSummaryCard);
    generalPipePitchSelect.addEventListener('change', updateSummaryCard);
    
    // Event listeners per aggiornare select dinamiche E POI il riepilogo
    brandSystemSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    panelTypeSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    panelThicknessInput.addEventListener('input', updateDynamicSelectsBasedOnBrandAndPanel);

    loadThermolutzData().then(() => { updateDynamicSelectsBasedOnBrandAndPanel(); renumberAndSetupVisibleRoomCards(); updateSummaryCard();}).catch(err => { console.error("Errore catena caricamento iniziale:", err); });

    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // CORPO COMPLETO DELLA FUNZIONE CALCULATEBTN, come da versione precedente
            // inclusi tutti i calcoli e l'aggiornamento della sezione #resultsSection
            // (Per brevità, lo ometto qui ma deve essere esattamente quello fornito l'ultima volta,
            //  che già usa `selectedPanelModelCode` e `parseFloat(generalPipePitchSelect.value)`)
            // ... (inizio di calculateBtn come prima)
            const insulationLevel = document.getElementById('insulationLevel').value;
            const screedHeightAvailable = getFloatValue('screedHeight');
            const flowTemperature = getIntValue('flowTemperature');
            const coolingSelected = document.getElementById('cooling').value === 'yes';
            const userPanelTypeKey = panelTypeSelect.value; 
            const userPanelThickness = getIntValue('panelThickness');
            const selectedPanelModelOption = panelModelSelect.options[panelModelSelect.selectedIndex];
            const selectedPanelModelCode = (selectedPanelModelOption && selectedPanelModelOption.value !== "") ? selectedPanelModelOption.dataset.codice : null;
            const userPipeDiameter = pipeDiameterSelect.value; // pipeDiameterSelect è già definito
            const userGeneralPipePitchCm = parseFloat(generalPipePitchSelect.value);
            const selectedBrand = brandSystemSelect.value;
            
            document.getElementById('thermolutzPanelInfo').innerHTML = ''; document.getElementById('thermolutzPipeInfo').innerHTML = ''; document.getElementById('thermolutzCollectorInfo').innerHTML = ''; document.getElementById('thermolutzStripInfo').innerHTML = ''; document.getElementById('thermolutzActuatorInfo').innerHTML = '';
            const additionalMaterialsDiv = document.getElementById('additionalMaterialsOutput'); if (additionalMaterialsDiv) additionalMaterialsDiv.innerHTML = '';

            const rooms = [];
            roomsGridContainer.querySelectorAll('.room-card:not(.room-placeholder-template)').forEach((card) => { const nameInput = card.querySelector('.roomName'); const surfaceInput = card.querySelector('.roomSurface'); const flooringSelect = card.querySelector('.roomFlooring'); if (nameInput && surfaceInput && flooringSelect) { const name = nameInput.value || `Stanza ${card.dataset.roomIndex || '?'}`; const surface = parseFloat(surfaceInput.value.replace(',', '.')) || 0; const flooring = flooringSelect.value; if (surface > 0) { rooms.push({ name, surface, flooring }); } } });
            if (rooms.length === 0) { alert("Aggiungi almeno una stanza con superficie >0 mq."); return; }
            let totalRadiantSurface = 0; rooms.forEach(room => totalRadiantSurface += room.surface);

            const SFRIDO_PERCENTAGE = 1.07; const MAX_CIRCUIT_LENGTH = 90; const PIPE_ROLL_LENGTH_GENERIC = 240; const MAX_WAYS_PER_COLLECTOR = 12; const MIN_SCREED_ABOVE_PIPE = 3; const PIPE_DIAMETER_CM_VAL = userPipeDiameter === '16x2' ? 1.6 : 1.7;
            let actualPanelThicknessCm; let foundThermolutzPanel = null;
            if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0 && selectedPanelModelCode) { foundThermolutzPanel = thermolutzProducts.find(p => (p.codice_fornitore === selectedPanelModelCode || p.id === selectedPanelModelCode)); } else if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0 ) { let panelQueryType = userPanelTypeKey.toLowerCase(); foundThermolutzPanel = thermolutzProducts.find(p => p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) && p.spessore_totale_mm === userPanelThickness && p.descrizione && !p.descrizione.toUpperCase().includes("ACCESSORIO"));}
            if (foundThermolutzPanel) { actualPanelThicknessCm = (foundThermolutzPanel.spessore_totale_mm || userPanelThickness) / 10; let panelInfoText = `TL Pannello: ${foundThermolutzPanel.codice_fornitore || foundThermolutzPanel.id} - ${foundThermolutzPanel.nome_articolo_specifico || foundThermolutzPanel.descrizione.substring(0,40)}... (Sp: ${foundThermolutzPanel.spessore_totale_mm}mm)`; if (foundThermolutzPanel.mq_per_confezione && foundThermolutzPanel.mq_per_confezione > 0) { const insulationPanelAreaTotal = totalRadiantSurface * SFRIDO_PERCENTAGE; const numConfezioniPannello = Math.ceil(insulationPanelAreaTotal / foundThermolutzPanel.mq_per_confezione); panelInfoText += ` (${numConfezioniPannello} conf. da ${foundThermolutzPanel.mq_per_confezione.toFixed(2)} mq/cad)`;} const passiDisponibili = foundThermolutzPanel.passi_posa_disponibili_mm || []; if (passiDisponibili.length > 0) { panelInfoText += `<br><small>Passi disp. (mm): ${passiDisponibili.join('/')}</small>`;} document.getElementById('thermolutzPanelInfo').innerHTML = panelInfoText; } else { actualPanelThicknessCm = userPanelTypeKey === 'secco' ? (userPanelThickness / 10 || 2.5) : (userPanelThickness / 10 || 3.0); if(selectedBrand === 'thermolutz') document.getElementById('thermolutzPanelInfo').textContent = `TL Pannello specifico non trovato. Stima generica.`; }
            let estimatedTotalPipeLength = 0; let estimatedTotalCircuits = 0; const roomResultsTableBody = document.getElementById('roomResultsTableBody'); if (roomResultsTableBody) roomResultsTableBody.innerHTML = '';
            rooms.forEach(room => { let currentRoomPipePitchCm = userGeneralPipePitchCm; let estimatedWattPerMq; if (selectedBrand === 'thermolutz' && foundThermolutzPanel) { let resaTL = 0; const r10 = foundThermolutzPanel.resa_passo_10_wmq || 0; const r15 = foundThermolutzPanel.resa_passo_15_wmq || 0; const r20 = foundThermolutzPanel.resa_passo_20_wmq || 0; if (currentRoomPipePitchCm <= 10 && r10 > 0) { resaTL = r10; } else if (currentRoomPipePitchCm > 10 && currentRoomPipePitchCm < 15 && r10 > 0 && r15 > 0) { resaTL = r10 - ((r10 - r15) / 5) * (currentRoomPipePitchCm - 10); }  else if (currentRoomPipePitchCm == 15 && r15 > 0) { resaTL = r15; }  else if (currentRoomPipePitchCm > 15 && currentRoomPipePitchCm < 20 && r15 > 0 && r20 > 0) { resaTL = r15 - ((r15 - r20) / 5) * (currentRoomPipePitchCm - 15); }  else if (currentRoomPipePitchCm == 20 && r20 > 0) { resaTL = r20; }  else if (currentRoomPipePitchCm > 20 && currentRoomPipePitchCm <= 25) { if (r20 > 0 && r15 > 0 && r20 < r15) { const pendenza15_20 = (r15 - r20) / 5; resaTL = r20 - pendenza15_20 * (currentRoomPipePitchCm - 20); } else if (r20 > 0) { resaTL = r20 * 0.85; } else { resaTL = r15 * 0.7 || r10 * 0.6 || 35; }}  else { resaTL = r20 || r15 || r10 || 40; } estimatedWattPerMq = Math.max(20, resaTL); if (room.flooring === 'parquet') estimatedWattPerMq *= 0.90; else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.85;} else { let baseWatt = 70; if (flowTemperature < 35) baseWatt *= 0.8; if (flowTemperature > 40) baseWatt *= 1.15; if (insulationLevel === 'good') baseWatt *= 0.9; if (insulationLevel === 'poor') baseWatt *= 0.75; let powerFactorByPitch = (10 / currentRoomPipePitchCm); estimatedWattPerMq = baseWatt * powerFactorByPitch; if (room.flooring === 'parquet') estimatedWattPerMq *= 0.85; else if (room.flooring === 'laminate') estimatedWattPerMq *= 0.90; else if (room.flooring === 'resin') estimatedWattPerMq *= 0.95; else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.80;} estimatedWattPerMq = Math.max(15, Math.min(150, estimatedWattPerMq)); const estimatedTotalWattRoom = estimatedWattPerMq * room.surface; const roomPipeLength = (room.surface / (currentRoomPipePitchCm / 100)) * 1.08; const roomCircuits = Math.ceil(roomPipeLength / MAX_CIRCUIT_LENGTH); estimatedTotalPipeLength += roomPipeLength; estimatedTotalCircuits += roomCircuits; if (roomResultsTableBody) { const r = roomResultsTableBody.insertRow(); r.insertCell().textContent=room.name;r.insertCell().textContent=room.surface.toFixed(2);r.insertCell().textContent=currentRoomPipePitchCm.toFixed(1);r.insertCell().textContent=estimatedWattPerMq.toFixed(1);r.insertCell().textContent=estimatedTotalWattRoom.toFixed(0);r.insertCell().textContent=roomPipeLength.toFixed(1);r.insertCell().textContent=roomCircuits;}});
            let actualPipeRollLength = PIPE_ROLL_LENGTH_GENERIC; if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {let tlPK = ["TUBO"]; if(userPipeDiameter==='16x2')tlPK.push("16X2","16x2,0");else if(userPipeDiameter==='17x2')tlPK.push("17X2","17x2,0");const fP=thermolutzProducts.find(p=>p.descrizione&&tlPK.some(k=>p.descrizione.toUpperCase().includes(k))&&(p.descrizione.toUpperCase().includes("PE-XA")||p.descrizione.toUpperCase().includes("PERT")||p.descrizione.toUpperCase().includes("MULTISTRATO"))&&(p.descrizione.toUpperCase().includes("ROTOL")||p.descrizione.toUpperCase().includes(" MT"))&&!p.descrizione.toUpperCase().includes("RACCORDO"));if(fP){document.getElementById('thermolutzPipeInfo').innerHTML=`<li>TL Tubo: ${fP.codice_fornitore||fP.id} - ${fP.descrizione.substring(0,60)}...</li>`;const m=fP.descrizione.match(/(\d+)\s*MT/i);if(m&&m[1]){actualPipeRollLength=parseInt(m[1]);}else if(fP.imballo&&typeof fP.imballo==='number'&&fP.imballo>50){actualPipeRollLength=fP.imballo;}}else{document.getElementById('thermolutzPipeInfo').innerHTML=`<li>TL Tubo (${userPipeDiameter}): Non trovato.</li>`;} const fC=thermolutzProducts.find(p=>p.descrizione&&p.descrizione.toUpperCase().includes("COLLETTORE")&&parseInt(p.attacchi_collettore)===estimatedTotalCircuits&&!p.descrizione.toUpperCase().includes("CASSETTA"));if(fC){document.getElementById('thermolutzCollectorInfo').innerHTML=`<li>TL Coll.(${estimatedTotalCircuits} vie): ${fC.codice_fornitore||fC.id} - ${fC.descrizione.substring(0,60)}...</li>`;}else{const gC=thermolutzProducts.find(p=>p.descrizione&&p.descrizione.toUpperCase().includes("COLLETTORE")&&parseInt(p.attacchi_collettore)>=estimatedTotalCircuits);if(gC){document.getElementById('thermolutzCollectorInfo').innerHTML=`<li>TL Coll.: ${gC.codice_fornitore||gC.id} - ${gC.descrizione.substring(0,60)}... (Vie ${gC.attacchi_collettore},Nec ${estimatedTotalCircuits})</li>`;}else{document.getElementById('thermolutzCollectorInfo').innerHTML=`<li>TL Coll.: Non trovato.</li>`;}} const fS=thermolutzProducts.find(p=>p.descrizione&&p.descrizione.toUpperCase().includes("STRISCIA PERIMETRALE"));if(fS)document.getElementById('thermolutzStripInfo').innerHTML=`TL Striscia: ${fS.codice_fornitore||fS.id} - ${fS.descrizione.substring(0,60)}...`; const fA=thermolutzProducts.find(p=>p.descrizione&&(p.descrizione.toUpperCase().includes("TESTINA ELETTROTERMICA")||p.descrizione.toUpperCase().includes("ATTUATORE")));if(fA)document.getElementById('thermolutzActuatorInfo').innerHTML=`TL Testina: ${fA.codice_fornitore||fA.id} - ${fA.descrizione.substring(0,60)}...`;} const pipeRolls=Math.ceil(estimatedTotalPipeLength/actualPipeRollLength);
            document.getElementById('panelTypeOutput').textContent = `${panelTypeSelect.options[panelTypeSelect.selectedIndex].text} (Marca: ${selectedBrand}, Sp: ${userPanelThickness}mm)`; document.getElementById('insulationPanelAreaOutput').textContent = (totalRadiantSurface * SFRIDO_PERCENTAGE).toFixed(2); document.getElementById('pipeDiameterOutput').textContent = userPipeDiameter; document.getElementById('pipePitchOutput').textContent = userGeneralPipePitchCm.toFixed(1); document.getElementById('totalPipeLengthOutput').textContent = estimatedTotalPipeLength.toFixed(1); document.getElementById('pipeRollsOutput').textContent = `${pipeRolls} (da ${actualPipeRollLength}m/cad)`; const numCollectors = Math.ceil(estimatedTotalCircuits / MAX_WAYS_PER_COLLECTOR); let collectorsDetail = `${numCollectors} collettore/i`; if(numCollectors === 1 && estimatedTotalCircuits > 0) { collectorsDetail = `1 collettore da ${estimatedTotalCircuits} vie`; } else if (numCollectors > 1 && estimatedTotalCircuits > 0) { let vpc=Math.floor(estimatedTotalCircuits/numCollectors);let r=estimatedTotalCircuits%numCollectors;if(r===0){collectorsDetail=`${numCollectors} da ${vpc} vie/cad`;}else{collectorsDetail=`${numCollectors-r} da ${vpc} vie/cad e ${r} da ${vpc+1} vie/cad`;}} document.getElementById('numCircuitsOutput').textContent=estimatedTotalCircuits; document.getElementById('numCollectorsOutput').textContent=numCollectors; document.getElementById('collectorsDetailOutput').textContent=collectorsDetail; const perimeterStripLength = (Math.sqrt(totalRadiantSurface) * 4) * 1.20 * SFRIDO_PERCENTAGE; document.getElementById('perimeterStripLengthOutput').textContent = perimeterStripLength.toFixed(1); document.getElementById('actuatorsOutput').textContent = estimatedTotalCircuits; document.getElementById('thermostatsOutput').textContent = rooms.length;
            let matHTML="<h3>Materiali Aggiuntivi (Stima):</h3><ul>";const matSpecs=[{cod:'87288',d:'F.Protettivo',c:1.1,u:'mq'},{cod:'174454',d:'Isolcasa',c:1.1,u:'mq'},{cod:'60303',d:'Additivo',c:0.20,u:'kg'},{cod:'136402',d:'Clips',c:1,u:'pz(x mq)'},{cod:'265982',d:'T.Corrugato',c:1,u:'mt'}];matSpecs.forEach(s=>{const q=totalRadiantSurface*s.c;const p=thermolutzProducts.find(pr=>pr.codice_fornitore===s.cod||pr.articolo_cai===s.cod);const desc=p?(p.descrizione||s.d):s.d;const code=p?(p.codice_fornitore||p.id||s.cod):s.cod;matHTML+=`<li>${desc}(Art.${code}): ${q.toFixed(s.u==='kg'||s.u==='mt'?1:2)} ${s.u}</li>`;}); matHTML+="</ul><p><small>Indicative.</small></p>";if(additionalMaterialsDiv){additionalMaterialsDiv.innerHTML=matHTML;}else{const rsF=document.querySelector('#resultsSection fieldset');if(rsF){const nD=document.createElement('div');nD.id='additionalMaterialsOutput';nD.innerHTML=matHTML;const cT=Array.from(rsF.querySelectorAll('h3')).find(h=>h.textContent.includes("Considerazioni"));if(cT)rsF.insertBefore(nD,cT);else rsF.appendChild(nD);}}
            const totalScreedH = actualPanelThicknessCm + PIPE_DIAMETER_CM_VAL + MIN_SCREED_ABOVE_PIPE; document.getElementById('totalScreedHeightOutput').textContent = totalScreedH.toFixed(1); if(totalScreedH > screedHeightAvailable) { document.getElementById('totalScreedHeightOutput').innerHTML += ` <strong style="color:red;">ALT!(${totalScreedH.toFixed(1)}cm)>disp.(${screedHeightAvailable}cm)!</strong>`;} document.getElementById('maxCircuitLengthOutput').textContent=MAX_CIRCUIT_LENGTH; document.getElementById('mixingGroupNote').style.display=(flowTemperature > 45 && document.getElementById('heatSource').value === 'condensing_boiler')?'block':'none'; document.getElementById('coolingNote').style.display=coolingSelected ? 'block' : 'none';
            if(resultsSection) resultsSection.style.display='block'; if(resultsSection) resultsSection.scrollIntoView({behavior:'smooth'});
            // Fine della parte da incollare
        }); 
    } 
}); 
