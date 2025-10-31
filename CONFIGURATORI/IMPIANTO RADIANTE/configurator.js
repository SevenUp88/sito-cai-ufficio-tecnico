document.addEventListener('DOMContentLoaded', () => {
    // Attende che auth.js abbia preparato tutto
    const checkFirebase = setInterval(() => {
        if (window.db) {
            clearInterval(checkFirebase);
            initializeApp();
        }
    }, 100);

    function initializeApp() {
        const db = window.db;
        const allProducts = [];

        // Elementi DOM
        const areaInput = document.getElementById('area-mq');
        const panelSeriesSelect = document.getElementById('panel-series');
        const panelThicknessSelect = document.getElementById('panel-thickness');
        const circuitsInput = document.getElementById('circuits');
        const calculateBtn = document.getElementById('calculate-btn');
        const resultsList = document.getElementById('results-list');
        const totalPriceEl = document.getElementById('total-price');
        const printBtn = document.getElementById('print-btn');
        const resultsContainer = document.getElementById('results-container');

        // Carica i dati da Firestore
        async function fetchData() {
            resultsContainer.innerHTML = '<div class="loader-spinner"></div><p>Caricamento prodotti...</p>';
            try {
                const snapshot = await db.collection("thermolutzRadiantProducts").get();
                snapshot.forEach(doc => allProducts.push(doc.data()));
                if (allProducts.length > 0) {
                    populateFilters();
                    calculateBtn.disabled = false;
                    resultsContainer.innerHTML = '<p>Dati caricati. Pronto per il calcolo.</p>';
                } else {
                    resultsContainer.innerHTML = '<p style="color:red;">Nessun prodotto trovato nel database.</p>';
                }
            } catch (error) {
                console.error("Errore nel caricare i dati:", error);
                resultsContainer.innerHTML = '<p style="color:red;">Errore caricamento dati.</p>';
            }
        }

        // Popola i menu a tendina in base ai prodotti trovati
        function populateFilters() {
            const panelSeries = [...new Set(allProducts.filter(p => p.tipo_pannello).map(p => p.serie))];
            panelSeriesSelect.innerHTML = panelSeries.map(s => `<option value="${s}">${s}</option>`).join('');
            
            panelSeriesSelect.addEventListener('change', updateThicknessOptions);
            updateThicknessOptions();
        }

        function updateThicknessOptions() {
            const selectedSeries = panelSeriesSelect.value;
            const thicknesses = allProducts
                .filter(p => p.serie === selectedSeries && p.tipo_pannello)
                .map(p => {
                    const match = p.nome_articolo.match(/Base (\d+)/);
                    return match ? parseInt(match[1], 10) : null;
                })
                .filter(Boolean)
                .sort((a, b) => a - b);
            
            panelThicknessSelect.innerHTML = [...new Set(thicknesses)].map(t => `<option value="${t}">${t} mm</option>`).join('');
        }

       // Funzione principale di calcolo (CORRETTA)
        function calculateConfiguration() {
            const area = parseFloat(areaInput.value);
            const selectedSeries = panelSeriesSelect.value;
            const selectedThickness = panelThicknessSelect.value;
            const numCircuits = parseInt(circuitsInput.value, 10);

            if (isNaN(area) || isNaN(numCircuits) || area <= 0 || numCircuits <= 0) {
                alert("Inserisci valori validi per area e numero di circuiti.");
                return;
            }

            const components = [];
            let totalPrice = 0;

            // 1. Calcolo Pannelli
            const panel = allProducts.find(p => p.serie === selectedSeries && p.nome_articolo && p.nome_articolo.includes(`Base ${selectedThickness}`));
            if (panel) {
                const panelCost = area * panel.vendita;
                components.push({ name: `Pannello ${panel.nome_articolo}`, qty: `${area.toFixed(2)} mq`, price: panel.vendita, total: panelCost });
                totalPrice += panelCost;
            }

            // 2. Calcolo Tubo (stima 8m/mq)
            const requiredPipeLength = area * 8;
            const pipeRolls = allProducts.filter(p => p.nome_articolo && p.nome_articolo.includes('TUBO NOVAPE-RT'));
            const smallRoll = pipeRolls.find(p => p.nome_articolo.includes('250'));
            const bigRoll = pipeRolls.find(p => p.nome_articolo.includes('500'));
            
            if (bigRoll && smallRoll) {
                const numBigRolls = Math.floor(requiredPipeLength / 500);
                const remainingLength = requiredPipeLength % 500;
                const numSmallRolls = Math.ceil(remainingLength / 250);
                
                if (numBigRolls > 0) {
                    const pipeCost = numBigRolls * 500 * bigRoll.vendita;
                    components.push({ name: `Tubo ${bigRoll.nome_articolo}`, qty: numBigRolls, price: 500 * bigRoll.vendita, total: pipeCost });
                    totalPrice += pipeCost;
                }
                if (numSmallRolls > 0) {
                    const pipeCost = numSmallRolls * 250 * smallRoll.vendita;
                    components.push({ name: `Tubo ${smallRoll.nome_articolo}`, qty: numSmallRolls, price: 250 * smallRoll.vendita, total: pipeCost });
                    totalPrice += pipeCost;
                }
            }

            // 3. Calcolo Collettore e Cassetta
            // --- CORREZIONE QUI ---
            const collector = allProducts.find(p => 
                p.attacchi_collettore >= numCircuits && 
                p.serie && p.serie.includes('Black') // Aggiunto controllo "p.serie &&"
            ); 
            if (collector) {
                components.push({ name: `Collettore ${collector.nome_articolo}`, qty: 1, price: collector.vendita, total: collector.vendita });
                totalPrice += collector.vendita;

                // Stima grossolana della dimensione della cassetta
                let cassetteSize = 500;
                if (numCircuits > 3) cassetteSize = 600;
                if (numCircuits > 5) cassetteSize = 700;
                if (numCircuits > 7) cassetteSize = 800;
                if (numCircuits > 9) cassetteSize = 900;
                if (numCircuits > 11) cassetteSize = 1000;
                if (numCircuits > 13) cassetteSize = 1200;

                const cassette = allProducts.find(p => p.serie && p.serie.includes('Cassetta') && p.nome_articolo.includes(String(cassetteSize)));
                if (cassette) {
                    components.push({ name: `Cassetta ${cassette.nome_articolo}`, qty: 1, price: cassette.vendita, total: cassette.vendita });
                    totalPrice += cassette.vendita;
                }
            }

            // 4. Calcolo Accessori
            const perimeter = 4 * Math.sqrt(area);
            const banda = allProducts.find(p => p.nome_articolo && p.nome_articolo.includes('BANDA PERIMETRALE'));
            if (banda) {
                const qty = Math.ceil(perimeter / 50);
                const cost = qty * banda.vendita * 50; // Prezzo al rotolo
                components.push({ name: banda.nome_articolo, qty: `${qty} rotoli`, price: banda.vendita * 50, total: cost });
                totalPrice += cost;
            }

            const additivo = allProducts.find(p => p.nome_articolo && p.nome_articolo.includes('ADDITIVO'));
            if (additivo) {
                const qty = Math.ceil(area / 100); // 1 tanica ogni 100mq
                const cost = qty * additivo.vendita;
                components.push({ name: additivo.nome_articolo, qty: qty, price: additivo.vendita, total: cost });
                totalPrice += cost;
            }

            const adattatore = allProducts.find(p => p.nome_articolo && p.nome_articolo.includes('ADATTATORE PER TUBO D.17X2'));
            if (adattatore) {
                const qty = numCircuits * 2; // 2 adattatori per circuito (mandata + ritorno)
                const cost = qty * adattatore.vendita;
                components.push({ name: adattatore.nome_articolo, qty: qty, price: adattatore.vendita, total: cost });
                totalPrice += cost;
            }

            displayResults(components, totalPrice);
        }
        function displayResults(components, total) {
            resultsList.innerHTML = '';
            components.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.name} (x${item.qty})</span>
                    <span>${formatPrice(item.total)}</span>
                `;
                resultsList.appendChild(li);
            });
            totalPriceEl.textContent = formatPrice(total);
            printBtn.style.display = 'block';
        }

        // Event Listeners
        calculateBtn.addEventListener('click', calculateConfiguration);
        printBtn.addEventListener('click', () => window.print());

        // Avvio
        fetchData();
    }
});
