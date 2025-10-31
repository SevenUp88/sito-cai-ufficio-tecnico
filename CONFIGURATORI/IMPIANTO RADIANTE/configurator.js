// configurator.js - VERSIONE PROFESSIONALE

document.addEventListener('DOMContentLoaded', () => {
    const checkFirebase = setInterval(() => {
        if (window.db) {
            clearInterval(checkFirebase);
            initializeApp();
        }
    }, 100);

    function initializeApp() {
        const db = window.db;
        let allProducts = [];

        // Costanti di Progettazione
        const METERS_PER_SQM = 8; // Metri di tubo per metro quadro
        const MAX_CIRCUIT_LENGTH = 80; // Lunghezza massima di un singolo circuito

        // Elementi DOM
        const panelSeriesSelect = document.getElementById('panel-series');
        const panelThicknessSelect = document.getElementById('panel-thickness');
        const roomsContainer = document.getElementById('rooms-container');
        const addRoomBtn = document.getElementById('add-room-btn');
        const calculateBtn = document.getElementById('calculate-btn');
        const resultsPanel = document.getElementById('config-results');
        const resultsTbody = document.getElementById('results-tbody');
        const circuitsSummary = document.getElementById('circuits-summary');
        const totalPriceEl = document.getElementById('total-price');
        const printBtn = document.getElementById('print-btn');
        const configInputs = document.getElementById('config-inputs');

        function formatPrice(price) {
            if (price == null || price === '') return '€ 0,00';
            const numericPrice = Number(price);
            return !isNaN(numericPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice) : 'N/D';
        }

        async function fetchData() {
            configInputs.style.opacity = '0.5';
            calculateBtn.textContent = 'Caricamento prodotti...';
            try {
                const snapshot = await db.collection("thermolutzRadiantProducts").get();
                snapshot.forEach(doc => allProducts.push(doc.data()));
                allProducts.sort((a, b) => (a.vendita || 0) - (b.vendita || 0));

                if (allProducts.length > 0) {
                    populateFilters();
                    calculateBtn.disabled = false;
                    calculateBtn.textContent = 'Calcola Preventivo';
                } else {
                    calculateBtn.textContent = 'Dati non trovati!';
                }
            } catch (error) {
                console.error("Errore nel caricare i dati:", error);
                calculateBtn.textContent = 'Errore Caricamento Dati!';
            } finally {
                configInputs.style.opacity = '1';
            }
        }

        function populateFilters() {
            const panelSeries = [...new Set(allProducts.filter(p => p.tipo_pannello === 'bugnato').map(p => p.serie))];
            panelSeriesSelect.innerHTML = panelSeries.map(s => `<option value="${s}">${s}</option>`).join('');
            panelSeriesSelect.addEventListener('change', updateThicknessOptions);
            updateThicknessOptions();
        }

        function updateThicknessOptions() {
            const selectedSeries = panelSeriesSelect.value;
            const thicknesses = [...new Set(allProducts
                .filter(p => p.serie === selectedSeries && p.tipo_pannello === 'bugnato')
                .map(p => p.nome_articolo.match(/Base (\d+)/)?.[1])
                .filter(Boolean)
                .map(Number)
            )].sort((a, b) => a - b);
            panelThicknessSelect.innerHTML = thicknesses.map(t => `<option value="${t}">${t} mm</option>`).join('');
        }

        function addRoom() {
            const roomCount = roomsContainer.children.length;
            const newRoom = document.createElement('div');
            newRoom.className = 'room-item';
            newRoom.innerHTML = `
                <input type="text" class="room-name" placeholder="Nome Locale" value="Camera ${roomCount}">
                <input type="number" class="room-mq" placeholder="mq" value="15" min="1">
                <button class="remove-room-btn">&times;</button>
            `;
            newRoom.querySelector('.remove-room-btn').addEventListener('click', () => newRoom.remove());
            roomsContainer.appendChild(newRoom);
        }

        function calculateConfiguration() {
            const rooms = [...roomsContainer.querySelectorAll('.room-item')].map(item => ({
                name: item.querySelector('.room-name').value || 'Locale',
                mq: parseFloat(item.querySelector('.room-mq').value) || 0
            })).filter(r => r.mq > 0);

            if (rooms.length === 0) {
                alert("Aggiungi almeno un locale con una superficie valida.");
                return;
            }

            const selectedSeries = panelSeriesSelect.value;
            const selectedThickness = panelThicknessSelect.value;
            const totalMq = rooms.reduce((sum, room) => sum + room.mq, 0);
            
            let totalCircuits = 0;
            let summaryHtml = '<h4>Riepilogo Circuiti:</h4><ul>';
            rooms.forEach(room => {
                const pipeNeeded = room.mq * METERS_PER_SQM;
                const circuitsForRoom = Math.ceil(pipeNeeded / MAX_CIRCUIT_LENGTH);
                totalCircuits += circuitsForRoom;
                summaryHtml += `<li>${room.name} (${room.mq} mq): <strong>${circuitsForRoom} circuiti</strong></li>`;
            });
            summaryHtml += '</ul>';
            circuitsSummary.innerHTML = summaryHtml;

            const components = [];
            let totalPrice = 0;

            const addComponent = (product, qty, unit = 'pz') => {
                if (!product) return;
                const total = qty * (product.vendita || 0);
                components.push({
                    cai: product.articolo_cai,
                    fornitore: product.codice_fornitore,
                    desc: product.descrizione,
                    qty: `${qty.toFixed(2)} ${unit}`.replace('.00 ', ' '),
                    price: product.vendita,
                    total
                });
                totalPrice += total;
            };

            // Calcoli
            const panel = allProducts.find(p => p.serie === selectedSeries && p.nome_articolo.includes(`Base ${selectedThickness}`));
            addComponent(panel, totalMq, 'mq');

            const requiredPipeLength = totalMq * METERS_PER_SQM;
            const smallRoll = allProducts.find(p => p.codice_fornitore === 'TH15819-N');
            const bigRoll = allProducts.find(p => p.codice_fornitore === 'TH15820-N');
            if (bigRoll && smallRoll) {
                let numBig = Math.floor(requiredPipeLength / 500);
                let rem = requiredPipeLength % 500;
                let numSmall = Math.ceil(rem / 250);
                addComponent(bigRoll, numBig);
                addComponent(smallRoll, numSmall);
            }

            const collector = allProducts.find(p => p.serie === 'Full Black' && p.attacchi_collettore >= totalCircuits);
            if (collector) {
                addComponent(collector, 1);
                const cassette = allProducts.find(c => c.serie === 'Cassetta' && c.compatibilita && c.compatibilita.includes(collector.codice_fornitore));
                addComponent(cassette, 1);
            }

            const banda = allProducts.find(p => p.codice_fornitore === 'TH18420');
            if (banda) addComponent(banda, Math.ceil((4 * Math.sqrt(totalMq)) / 50));

            const additivo = allProducts.find(p => p.codice_fornitore === 'TH18020');
            if (additivo) addComponent(additivo, Math.ceil(totalMq / 100));

            const adattatore = allProducts.find(p => p.codice_fornitore === 'TH22030');
            if (adattatore) addComponent(adattatore, totalCircuits * 2);

            displayResults(components, totalPrice);
        }

        function displayResults(components, total) {
            resultsTbody.innerHTML = '';
            components.forEach(item => {
                const row = resultsTbody.insertRow();
                row.innerHTML = `
                    <td>${item.cai || 'N/A'}</td>
                    <td>${item.fornitore || 'N/A'}</td>
                    <td>${item.desc || 'N/A'}</td>
                    <td>${item.qty}</td>
                    <td class="price-col">${formatPrice(item.price)}</td>
                    <td class="price-col">${formatPrice(item.total)}</td>
                `;
            });
            totalPriceEl.textContent = formatPrice(total);
            resultsPanel.style.display = 'block';
        }

        // Event Listeners
        addRoomBtn.addEventListener('click', addRoom);
        calculateBtn.addEventListener('click', calculateConfiguration);
        printBtn.addEventListener('click', () => window.print());

        fetchData();
    }
});
