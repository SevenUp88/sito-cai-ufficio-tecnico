document.addEventListener('DOMContentLoaded', function() {
    const addRoomBtn = document.getElementById('addRoomBtn');
    const roomsContainer = document.getElementById('roomsContainer');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsSection = document.getElementById('resultsSection');
    const brandSystemSelect = document.getElementById('brandSystem');

    let roomCounter = 1;
    let thermolutzProducts = [];

    const THERMOLUTZ_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTg9-d742f7l8_ubFCJGqkBAWUxg0fBZf3cLT5pAl7O91Be2_e8C2qKGIhmhuGGBqQaxYxJMJiM4m_r/pub?output=csv';

    async function loadThermolutzData() {
        try {
            const response = await fetch(THERMOLUTZ_CSV_URL);
            if (!response.ok) {
                console.error('Errore nel caricamento del CSV Thermolutz:', response.statusText);
                alert('Attenzione: Impossibile caricare i dati dei prodotti Thermolutz.');
                return;
            }
            const csvText = await response.text();
            parseThermolutzCSV(csvText);
            console.log("Dati Thermolutz caricati e parsati:", thermolutzProducts.length, "prodotti.");
        } catch (error) {
            console.error('Errore fetch CSV Thermolutz:', error);
            alert('Attenzione: Errore di rete nel caricare i dati Thermolutz.');
        }
    }

    function parseThermolutzCSV(csvText) {
        thermolutzProducts = [];
        const lines = csvText.split(/\r\n|\n/); // Gestisce fine riga Windows e Unix
        if (lines.length < 2) {
            console.warn("CSV Thermolutz vuoto o con solo header.");
            return;
        }

        const headersRaw = lines[0].split(',');
        const headers = headersRaw.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''));
        // console.log("CSV Headers Normalizzati:", headers); // Per debug

        // Nomi colonna attesi (normalizzati)
        const expectedCols = {
            codiceFornitore: headers.indexOf("codice_fornitore"),
            descrizione: headers.indexOf("descrizione"),
            tipoPannello: headers.indexOf("tipo_pannello"),
            spessoreMm: headers.indexOf("spessore_mm"),
            passoPosaMm: headers.indexOf("passo_posa_mm"),
            passo10: headers.indexOf("passo_10"),
            passo15: headers.indexOf("passo_15"),
            passo20: headers.indexOf("passo_20"),
            imballo: headers.indexOf("imballo")
            // Aggiungi altri indici se necessario
        };

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "") continue;

            // Split più robusto per CSV (semplice, non gestisce campi quotati con virgole interne)
            const values = line.split(',').map(v => v.trim());
            
            const product = {};
            // Mappatura esplicita per chiarezza e robustezza
            product.codice_fornitore = values[expectedCols.codiceFornitore] || '';
            product.descrizione = values[expectedCols.descrizione] || '';
            product.tipo_pannello = values[expectedCols.tipoPannello] || '';
            product.spessore_mm = parseFloat(String(values[expectedCols.spessoreMm]).replace(',', '.')) || 0;
            product.passo_posa_mm = parseFloat(String(values[expectedCols.passoPosaMm]).replace(',', '.')) || 0;
            product.passo_10 = parseFloat(String(values[expectedCols.passo10]).replace(',', '.')) || 0; // Resa W/mq
            product.passo_15 = parseFloat(String(values[expectedCols.passo15]).replace(',', '.')) || 0; // Resa W/mq
            product.passo_20 = parseFloat(String(values[expectedCols.passo20]).replace(',', '.')) || 0; // Resa W/mq
            let imballoVal = String(values[expectedCols.imballo]).replace(',', '.');
            product.imballo = parseFloat(imballoVal) || imballoVal; // Può essere numero o stringa

            thermolutzProducts.push(product);
        }
    }
    
    loadThermolutzData();

    function getFloatValue(id) {
        const val = parseFloat(document.getElementById(id).value.replace(',', '.'));
        return isNaN(val) ? 0 : val;
    }
    function getIntValue(id) {
        const val = parseInt(document.getElementById(id).value);
        return isNaN(val) ? 0 : val;
    }

    function updateTotalSurface() {
        let totalSurface = 0;
        document.querySelectorAll('.roomSurface').forEach(input => {
            totalSurface += parseFloat(input.value.replace(',', '.')) || 0;
        });
        document.getElementById('totalRadiantSurfaceOutput').textContent = totalSurface.toFixed(2);
    }

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

    roomsContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('roomSurface')) {
            updateTotalSurface();
        }
    });
    updateTotalSurface(); // Chiamata iniziale

    calculateBtn.addEventListener('click', function() {
        const insulationLevel = document.getElementById('insulationLevel').value;
        const screedHeightAvailable = getFloatValue('screedHeight');
        const flowTemperature = getIntValue('flowTemperature');
        const coolingSelected = document.getElementById('cooling').value === 'yes';
        
        const userPanelTypeKey = document.getElementById('panelType').value; // bugnato, liscio, secco, zero
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
            const surface = getFloatValue(entry.querySelector('.roomSurface').id); // Usa getFloatValue per la virgola
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
        roomResultsTableBody.innerHTML = '';

        let foundThermolutzPanel = null;

        if (selectedBrand === 'thermolutz' && thermolutzProducts.length > 0) {
            // Mappatura più precisa per tipo pannello Thermolutz
            let csvPanelTypeQueryTerm = userPanelTypeKey.toLowerCase();
            if (userPanelTypeKey === 'bugnato') csvPanelTypeQueryTerm = 'bugnato'; // Esatto come nel CSV se c'è
            else if (userPanelTypeKey === 'liscio') csvPanelTypeQueryTerm = 'liscio'; // Es. "Liscio", "Piano"
            else if (userPanelTypeKey === 'secco') csvPanelTypeQueryTerm = 'secco'; // Es. "A secco", "Secolutz"
            else if (userPanelTypeKey === 'zero') csvPanelTypeQueryTerm = 'zero'; // Es. "THERMOLUTZ ZERO"

            foundThermolutzPanel = thermolutzProducts.find(p => 
                p.tipo_pannello && p.tipo_pannello.toLowerCase().includes(csvPanelTypeQueryTerm) &&
                p.spessore_mm === userPanelThickness &&
                p.descrizione && !p.descrizione.toUpperCase().includes("ACCESSORIO")
            );

            if (foundThermolutzPanel) {
                document.getElementById('thermolutzPanelInfo').innerHTML = `TL Pannello: ${foundThermolutzPanel.codice_fornitore} - ${foundThermolutzPanel.descrizione.substring(0,60)}... (Sp: ${foundThermolutzPanel.spessore_mm}mm)`;
                actualPanelThicknessCm = foundThermolutzPanel.spessore_mm / 10;
            } else {
                document.getElementById('thermolutzPanelInfo').textContent = `TL Pannello (${userPanelTypeKey}, ${userPanelThickness}mm): Non trovato. Verrà usata stima generica.`;
            }
        }

        rooms.forEach(room => {
            let currentRoomPipePitchCm = userGeneralPipePitchCm;
            let estimatedWattPerMq;

            if (selectedBrand === 'thermolutz' && foundThermolutzPanel) {
                let resaTL = 0;
                // Scegli la resa corretta o interpola
                if (currentRoomPipePitchCm <= 10 && foundThermolutzPanel.passo_10 > 0) {
                    resaTL = foundThermolutzPanel.passo_10;
                    // Se passo < 10 e abbiamo resa per passo 5 (es. p.passo_posa_mm=50), si potrebbe usare quella
                } else if (currentRoomPipePitchCm > 10 && currentRoomPipePitchCm <= 15 && foundThermolutzPanel.passo_10 > 0 && foundThermolutzPanel.passo_15 > 0) {
                    // Interpolazione lineare tra passo 10 e 15
                    const p10 = foundThermolutzPanel.passo_10;
                    const p15 = foundThermolutzPanel.passo_15;
                    resaTL = p10 - ((p10 - p15) / (15 - 10)) * (currentRoomPipePitchCm - 10);
                } else if (currentRoomPipePitchCm > 15 && currentRoomPipePitchCm <= 20 && foundThermolutzPanel.passo_15 > 0 && foundThermolutzPanel.passo_20 > 0) {
                    // Interpolazione lineare tra passo 15 e 20
                    const p15 = foundThermolutzPanel.passo_15;
                    const p20 = foundThermolutzPanel.passo_20;
                    resaTL = p15 - ((p15 - p20) / (20 - 15)) * (currentRoomPipePitchCm - 15);
                } else if (currentRoomPipePitchCm == 15 && foundThermolutzPanel.passo_15 > 0) {
                     resaTL = foundThermolutzPanel.passo_15;
                } else if (currentRoomPipePitchCm == 20 && foundThermolutzPanel.passo_20 > 0) {
                     resaTL = foundThermolutzPanel.passo_20;
                }
                 else { // Fallback se il passo è > 20 o mancano dati per interpolazione
                    resaTL = foundThermolutzPanel.passo_20 || foundThermolutzPanel.passo_15 || foundThermolutzPanel.passo_10 || 50; // Ultimo fallback
                }
                estimatedWattPerMq = resaTL;
                
                if (room.flooring === 'parquet') estimatedWattPerMq *= 0.90;
                else if (room.flooring === 'carpet_low_res') estimatedWattPerMq *= 0.85;

            } else { // Stima Generica
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

            const roomPipeLength = (room.surface / (currentRoomPipePitchCm / 100)) * 1.08; // 8% per curve
            const roomCircuits = Math.ceil(roomPipeLength / MAX_CIRCUIT_LENGTH);
            
            estimatedTotalPipeLength += roomPipeLength;
            estimatedTotalCircuits += roomCircuits;

            const row = roomResultsTableBody.insertRow();
            row.insertCell().textContent = room.name;
            row.insertCell().textContent = room.surface.toFixed(2);
            row.insertCell().textContent = currentRoomPipePitchCm.toFixed(1);
            row.insertCell().textContent = estimatedWattPerMq.toFixed(1);
            row.insertCell().textContent = estimatedTotalWattRoom.toFixed(0);
            row.insertCell().textContent = roomPipeLength.toFixed(1);
            row.insertCell().textContent = roomCircuits;
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
                (p.descrizione.toUpperCase().includes("PE-XA") || p.descrizione.toUpperCase().includes("PERT") || p.descrizione.toUpperCase().includes("MULTISTRATO")) && // Tipi di tubo
                (p.descrizione.toUpperCase().includes("ROTOL") || p.descrizione.toUpperCase().includes(" MT")) && // Indica che è un rotolo
                !p.descrizione.toUpperCase().includes("RACCORDO") && !p.descrizione.toUpperCase().includes("CURVA") && !p.descrizione.toUpperCase().includes("ADATTATORE")
            );
            if (foundPipe) {
                document.getElementById('thermolutzPipeInfo').innerHTML = `TL Tubo: ${foundPipe.codice_fornitore} - ${foundPipe.descrizione.substring(0,60)}...`;
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
                document.getElementById('thermolutzCollectorInfo').innerHTML = `TL Collettore (${estimatedTotalCircuits} vie): ${foundCollector.codice_fornitore} - ${foundCollector.descrizione.substring(0,60)}...`;
            } else {
                const genericCollector = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("COLLETTORE") && (p.descrizione.toUpperCase().includes("COMPOSTO") || p.descrizione.toUpperCase().includes("INOX")) && !p.descrizione.toUpperCase().includes("ACCESSORIO"));
                if(genericCollector){ document.getElementById('thermolutzCollectorInfo').innerHTML = `TL Collettore: ${genericCollector.codice_fornitore} - ${genericCollector.descrizione.substring(0,60)}... (Verificare n° vie)`; }
                else { document.getElementById('thermolutzCollectorInfo').innerHTML = `TL Collettore: Non trovato.`; }
            }

            const foundStrip = thermolutzProducts.find(p => p.descrizione && p.descrizione.toUpperCase().includes("STRISCIA PERIMETRALE") && !p.descrizione.toUpperCase().includes("ANGOLARE"));
            if(foundStrip) document.getElementById('thermolutzStripInfo').innerHTML = `TL Striscia: ${foundStrip.codice_fornitore} - ${foundStrip.descrizione.substring(0,60)}...`;

            const foundActuator = thermolutzProducts.find(p => p.descrizione && (p.descrizione.toUpperCase().includes("TESTINA ELETTROTERMICA") || p.descrizione.toUpperCase().includes("ATTUATORE")));
            if(foundActuator) document.getElementById('thermolutzActuatorInfo').innerHTML = `TL Testina: ${foundActuator.codice_fornitore} - ${foundActuator.descrizione.substring(0,60)}...`;
        }

        pipeRolls = Math.ceil(estimatedTotalPipeLength / actualPipeRollLength);

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

        const perimeterStripLength = (Math.sqrt(totalRadiantSurface) * 4) * 1.20 * SFRIDO_PERCENTAGE; // Aggiunto sfrido anche qui
        document.getElementById('perimeterStripLengthOutput').textContent = perimeterStripLength.toFixed(1);
        document.getElementById('actuatorsOutput').textContent = estimatedTotalCircuits; // Un attuatore per circuito
        document.getElementById('thermostatsOutput').textContent = rooms.length; // Un termostato per stanza

        const totalScreedActualHeight = actualPanelThicknessCm + PIPE_DIAMETER_CM_VAL + MIN_SCREED_ABOVE_PIPE;
        document.getElementById('totalScreedHeightOutput').textContent = totalScreedActualHeight.toFixed(1);
        if (totalScreedActualHeight > screedHeightAvailable) {
            document.getElementById('totalScreedHeightOutput').innerHTML += ` <strong style="color:red;">ATTENZIONE: Altezza (${totalScreedActualHeight.toFixed(1)}cm) supera disponibilità (${screedHeightAvailable}cm)!</strong>`;
        }
        document.getElementById('maxCircuitLengthOutput').textContent = MAX_CIRCUIT_LENGTH;
        document.getElementById('mixingGroupNote').style.display = (flowTemperature > 45 && document.getElementById('heatSource').value === 'condensing_boiler') ? 'block' : 'none';
        document.getElementById('coolingNote').style.display = coolingSelected ? 'block' : 'none';

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    });
});