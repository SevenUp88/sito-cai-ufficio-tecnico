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
    if (!db) { console.error("Firestore non inizializzato!"); alert("Errore: Impossibile connettersi al database."); return; }
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
        }
        // Chiamata per aggiornare le select DOPO che i dati sono stati caricati
        if (typeof updateDynamicSelectsBasedOnBrandAndPanel === "function") {
            updateDynamicSelectsBasedOnBrandAndPanel();
        }
    } catch (error) { 
        console.error(`Errore caricamento dati da Firestore (${FIRESTORE_RADIANT_COLLECTION_NAME}):`, error); 
        alert(`Errore caricamento dati: ${error.message}`); 
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

    function updateRoomCardIdentifiers(cardElement, cardIndex) { /* ... (Funzione come fornita prima, per aggiornare ID, nomi, label 'for', e bottone rimuovi) ... */
        const headerTitle = cardElement.querySelector('.room-card-header h4');
        const roomNumberSpan = cardElement.querySelector('.room-card-header .room-number-display');
        if (roomNumberSpan) roomNumberSpan.textContent = cardIndex;
        else if (headerTitle) headerTitle.textContent = `Stanza ${cardIndex}`;
        cardElement.dataset.roomIndex = cardIndex;
        ['.roomName', '.roomSurface', '.roomFlooring'].forEach(selector => {
            const input = cardElement.querySelector(selector);
            if (input) {
                const baseId = input.id ? input.id.replace(/\d+$/, '') : selector.substring(1).toLowerCase(); // Fallback se ID non c'è
                const baseName = input.name ? input.name.replace(/\d+$/, '') : selector.substring(1).toLowerCase();
                const oldId = input.id;
                input.id = baseId + cardIndex;
                input.name = baseName + cardIndex;
                const label = cardElement.querySelector(`label[for="${oldId}"]`);
                if (label) label.setAttribute('for', input.id);

                 // Pulisci o imposta valori di default se è una card appena aggiunta o un placeholder attivato
                if (cardElement.dataset.isNewlyAdded === 'true' || cardElement.classList.contains('room-placeholder')) {
                    if (input.classList.contains('roomName')) input.value = `Stanza ${cardIndex}`;
                    else if (input.classList.contains('roomSurface')) input.value = '0';
                    else if (input.classList.contains('roomFlooring')) input.selectedIndex = 0;
                }
            }
        });
        delete cardElement.dataset.isNewlyAdded; // Rimuovi il flag
        const removeBtn = cardElement.querySelector('.remove-room-btn');
        if (removeBtn) {
            const isOnlyActiveCard = document.querySelectorAll('#roomsGridContainer .room-card:not(.room-placeholder-template)').length <= 1 && !cardElement.classList.contains('room-placeholder');
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
             // Le card placeholder iniziali potrebbero necessitare di una logica diversa per il bottone rimuovi
            if(card.classList.contains('room-placeholder')){
                const removeBtn = card.querySelector('.remove-room-btn');
                if(removeBtn){ // Listener per placeholder: se l'utente inserisce dati, la "attiva"
                    // Potrebbe essere meglio attivare la card quando l'utente clicca per modificarla
                }
            }
        });
        updateTotalSurface(); 
    }

    if (addRoomBtn && roomsGridContainer) {
        addRoomBtn.addEventListener('click', function() {
            const templateCardSource = document.getElementById('roomCardTemplate2') || roomsGridContainer.querySelector('.room-card');
            if (!templateCardSource) { console.error("Template card non trovato!"); return; }
            const newRoomCard = templateCardSource.cloneNode(true);
            newRoomCard.classList.remove('room-placeholder');
            newRoomCard.id = `roomCard${nextRoomCardIdSuffix}`; // Dai un ID univoco anche alla card
            newRoomCard.dataset.isNewlyAdded = 'true'; // Flag per la pulizia
            updateRoomCardIdentifiers(newRoomCard, nextRoomCardIdSuffix);
            roomsGridContainer.appendChild(newRoomCard);
            nextRoomCardIdSuffix++;
            // Non chiamare renumber qui perché lo fa già updateRoomCardIdentifiers per la nuova card
            updateTotalSurface();
        });
    }

    if (roomsGridContainer) {
        roomsGridContainer.addEventListener('input', function(e) {
            // Se si modifica un placeholder, "attivalo" (togli la classe placeholder)
            const card = e.target.closest('.room-card.room-placeholder');
            if (card) {
                // card.classList.remove('room-placeholder'); // O gestisci diversamente l'attivazione
                // Qui potresti voler anche mostrare il bottone remove per i placeholder
            }
            if (e.target.classList.contains('roomSurface')) {
                updateTotalSurface();
            }
        });
    }
    
    function updateDynamicSelectsBasedOnBrandAndPanel() {
        // Implementazione della logica per popolare panelModelSelect e generalPipePitchSelect
        // Questa funzione è chiamata dopo che thermolutzProducts sono caricati e quando
        // brand, tipo pannello o spessore cambiano.
        // ... (codice da mia risposta precedente per questa funzione) ...
        const selectedBrand = brandSystemSelect.value;
        const selectedPanelTypeKey = panelTypeSelect.value;
        const selectedPanelThickness = getIntValue('panelThickness');

        panelModelSelect.innerHTML = '<option value="">-- Caricamento/Non disponibile --</option>';
        panelModelSelect.disabled = true;
        if(panelModelContainer) panelModelContainer.style.display = 'none';
        generalPipePitchSelect.innerHTML = '<option value="10">10 cm</option><option value="15" selected>15 cm</option><option value="20">20 cm</option>';

        if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
            let panelQueryType = selectedPanelTypeKey.toLowerCase();
            // Esempio: if (selectedPanelTypeKey === 'secco') panelQueryType = 'a secco';

            const matchingPanels = thermolutzProducts.filter(p =>
                p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(panelQueryType) &&
                p.spessore_totale_mm === selectedPanelThickness && // Assicura che spessore_totale_mm sia in Firestore
                p.nome_articolo_specifico // Usa il campo corretto per il nome/modello
            );

            if (matchingPanels.length > 0) {
                if(panelModelContainer) panelModelContainer.style.display = 'block';
                panelModelSelect.innerHTML = '<option value="">-- Seleziona Modello Lastra --</option>';
                matchingPanels.forEach(panel => {
                    const opt = document.createElement('option');
                    opt.value = panel.codice_fornitore || panel.id;
                    opt.textContent = panel.nome_articolo_specifico + (panel.dimensione_mm ? ` (${panel.dimensione_mm})` : '');
                    opt.dataset.passiDisponibili = JSON.stringify(panel.passi_posa_disponibili_mm || []); // Assicura che passi_posa_disponibili_mm sia un array
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
                            if (typeof passoMm === 'number' && !isNaN(passoMm)) { // Controllo aggiuntivo
                                const passoCm = passoMm / 10;
                                const opt = document.createElement('option');
                                opt.value = passoCm;
                                opt.textContent = `${passoCm} cm (${passoMm}mm)`;
                                generalPipePitchSelect.appendChild(opt);
                            }
                        });
                        // Preselezione
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
                if (matchingPanels.length >= 1) { // Seleziona il primo o l'unico
                    panelModelSelect.selectedIndex = 1; // Seleziona la prima vera opzione (non "-- Seleziona --")
                    if (typeof panelModelSelect.onchange === "function") panelModelSelect.onchange(); // Triggera per popolare i passi
                }
            } else {
                panelModelSelect.innerHTML = '<option value="">Nessun modello per criteri</option>';
                 if(panelModelContainer) panelModelContainer.style.display = 'block'; // Mostra anche se vuoto per dare feedback
            }
        }
    }

    if (brandSystemSelect) brandSystemSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    if (panelTypeSelect) panelTypeSelect.addEventListener('change', updateDynamicSelectsBasedOnBrandAndPanel);
    if (panelThicknessInput) panelThicknessInput.addEventListener('input', updateDynamicSelectsBasedOnBrandAndPanel); // 'input' per aggiornamento live

    loadThermolutzData(); // Carica i dati all'avvio

    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // Inizio `calculateBtn` logica completa come fornita nella risposta precedente, 
            // adattata per leggere i dati delle stanze dal nuovo layout a card
            // e per leggere il passo posa da `generalPipePitchSelect.value`
            // e il modello pannello da `panelModelSelect.value` o `selectedOption.dataset.codice`
            // (Il codice completo della funzione calculateBtn va qui, riprendendo quello fornito in precedenza)

            // ... COPIA/INCOLLA IL CORPO COMPLETO DI calculateBtn CHE HAI RICEVUTO PRIMA QUI ...
            // assicurandoti di usare:
            // const userGeneralPipePitchCm = parseFloat(generalPipePitchSelect.value);
            // const selectedPanelModelOption = panelModelSelect.options[panelModelSelect.selectedIndex];
            // const selectedPanelModelCode = selectedPanelModelOption ? selectedPanelModelOption.dataset.codice : null;
            // e la raccolta rooms:
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
            if (rooms.length === 0) { alert("Aggiungi almeno una stanza con superficie >0 mq."); return; }
            // ... e il resto ...


            // --- Esempio di integrazione (SOSTITUISCI CON IL TUO CODICE CALCULATEBTN COMPLETO): ---
            console.log("Calculate button clicked!");
            console.log("Brand:", brandSystemSelect.value);
            console.log("Panel Type:", panelTypeSelect.value);
            console.log("Panel Thickness:", getIntValue('panelThickness'));
            const selPanelModelOpt = panelModelSelect.options[panelModelSelect.selectedIndex];
            console.log("Panel Model:", selPanelModelOpt ? selPanelModelOpt.textContent : "N/A", "Code:", selPanelModelOpt ? selPanelModelOpt.dataset.codice : "N/A");
            console.log("Pipe Pitch:", parseFloat(generalPipePitchSelect.value));
            console.log("Rooms data:", rooms);
            console.log("Thermolutz Products Available:", thermolutzProducts.length);
            
            // --- IL TUO CODICE CALCULATEBTN VERO E PROPRIO DOVREBBE ANDARE QUI ---
            // (come quello dettagliato nella risposta precedente, con la ricerca del pannello
            //  basata su selectedPanelModelCode, i calcoli delle rese, materiali, etc.)
            // Questo è solo un placeholder per dimostrare l'integrazione.
             alert("Logica di calcolo principale da implementare/incollare qui. Controlla la console per i valori selezionati.");
            // Mostra la sezione risultati (anche se vuota per ora)
            if(resultsSection) resultsSection.style.display = 'block';
            if(resultsSection) resultsSection.scrollIntoView({behavior: 'smooth'});


        }); // Fine calculateBtn listener
    } 
}); // Fine DOMContentLoaded
