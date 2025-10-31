// configurator.js - VERSIONE FINALE, COMPLETA E PRECISA

document.addEventListener('DOMContentLoaded', () => {
    const checkFirebase = setInterval(() => {
        if (window.db) {
            clearInterval(checkFirebase);
            initializeApp();
        }
    }, 100);

    function initializeApp() {
        const db = window.db;
        let allProducts = []; // Usiamo let perché la riordineremo

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

        // --- FUNZIONE MANCANTE AGGIUNTA QUI ---
        function formatPrice(price) {
            if (price == null || price === '') return '€ 0,00';
            const numericPrice = Number(price);
            return !isNaN(numericPrice) ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice) : 'N/D';
        }

        async function fetchData() {
            resultsContainer.innerHTML = '<div class="loader-spinner"></div><p>Caricamento prodotti...</p>';
            try {
                const snapshot = await db.collection("thermolutzRadiantProducts").get();
                snapshot.forEach(doc => allProducts.push(doc.data()));
                
                // Ordiniamo i prodotti per essere sicuri di trovare sempre il più piccolo/grande
                allProducts.sort((a, b) => (a.vendita || 0) - (b.vendita || 0));

                if (allProducts.length > 0) {
                    populateFilters();
                    calculateBtn.disabled = false;
                    resultsContainer.innerHTML = '<p>Dati caricati. Pronto per il calcolo.</p>';
                } else {
                    resultsContainer.innerHTML = '<p style="color:red;">Nessun prodotto trovato. Esegui la sincronizzazione dal foglio Google.</p>';
                }
            } catch (error) {
                console.error("Errore nel caricare i dati:", error);
                resultsContainer.innerHTML = '<p style="color:red;">Errore caricamento dati.</p>';
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
            const thicknesses = allProducts
                .filter(p => p.serie === selectedSeries && p.tipo_pannello === 'bugnato')
                .map(p => {
                    const match = p.nome_articolo.match(/Base (\d+)/);
                    return match ? parseInt(match[1], 10) : null;
                })
                .filter(Boolean)
                .sort((a, b) => a - b);
            panelThicknessSelect.innerHTML = [...new Set(thicknesses)].map(t => `<option value="${t}">${t} mm</option>`).join('');
        }

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

            // --- LOGICA DI SELEZIONE PRECISA ---

            // 1. Pannello
            const panel = allProducts.find(p => p.serie === selectedSeries && p.nome_articolo.includes(`Base ${selectedThickness}`));
            if (panel) {
                const total = area * panel.vendita;
                components.push({ name: `Pannello ${panel.nome_articolo}`, qty: `${area.toFixed(2)} mq`, price: panel.vendita, total });
                totalPrice += total;
            }

            // 2. Tubo
            const requiredPipeLength = area * 8;
            const smallRoll = allProducts.find(p => p.codice_fornitore === 'TH15819-N'); // Tubo 250mt
            const bigRoll = allProducts.find(p => p.codice_fornitore === 'TH15820-N');   // Tubo 500mt
            if (bigRoll && smallRoll) {
                let numBigRolls = 0;
                let numSmallRolls = 0;
                let remainingLength = requiredPipeLength;
                if (remainingLength > 500) {
                    numBigRolls = Math.floor(remainingLength / 500);
                    remainingLength %= 500;
                }
                if (remainingLength > 0) {
                    numSmallRolls = Math.ceil(remainingLength / 250);
                }
                if (numBigRolls > 0) {
                    const total = numBigRolls * (500 * bigRoll.vendita);
                    components.push({ name: `Tubo ${bigRoll.nome_articolo}`, qty: numBigRolls, price: 500 * bigRoll.vendita, total });
                    totalPrice += total;
                }
                if (numSmallRolls > 0) {
                    const total = numSmallRolls * (250 * smallRoll.vendita);
                    components.push({ name: `Tubo ${smallRoll.nome_articolo}`, qty: numSmallRolls, price: 250 * smallRoll.vendita, total });
                    totalPrice += total;
                }
            }

            // 3. Collettore e Cassetta
            const collector = allProducts.find(p => p.serie === 'Full Black' && p.attacchi_collettore >= numCircuits);
            if (collector) {
                components.push({ name: `Collettore ${collector.nome_articolo}`, qty: 1, price: collector.vendita, total: collector.vendita });
                totalPrice += collector.vendita;

                const cassette = allProducts.find(c => c.serie === 'Cassetta' && c.compatibilita && c.compatibilita.includes(collector.codice_fornitore));
                if (cassette) {
                    components.push({ name: `Cassetta ${cassette.nome_articolo}`, qty: 1, price: cassette.vendita, total: cassette.vendita });
                    totalPrice += cassette.vendita;
                }
            }

            // 4. Accessori
            const perimeter = 4 * Math.sqrt(area);
            const banda = allProducts.find(p => p.codice_fornitore === 'TH18420');
            if (banda) {
                const qty = Math.ceil(perimeter / 50);
                const total = qty * (banda.vendita * 50);
                components.push({ name: banda.descrizione, qty: `${qty} rotoli`, price: banda.vendita * 50, total });
                totalPrice += total;
            }

            const additivo = allProducts.find(p => p.codice_fornitore === 'TH18020');
            if (additivo) {
                const qty = Math.ceil(area / 100);
                const total = qty * additivo.vendita;
                components.push({ name: additivo.descrizione, qty: qty, price: additivo.vendita, total });
                totalPrice += total;
            }

            const adattatore = allProducts.find(p => p.codice_fornitore === 'TH22030');
            if (adattatore) {
                const qty = numCircuits * 2;
                const total = qty * adattatore.vendita;
                components.push({ name: adattatore.descrizione, qty: qty, price: adattatore.vendita, total });
                totalPrice += total;
            }

            displayResults(components, totalPrice);
        }

        function displayResults(components, total) {
            resultsContainer.innerHTML = ''; // Pulisce il messaggio iniziale
            resultsList.innerHTML = '';
            components.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.name} <strong>(x${item.qty})</strong></span>
                    <span>${formatPrice(item.total)}</span>
                `;
                resultsList.appendChild(li);
            });
            totalPriceEl.textContent = formatPrice(total);
            printBtn.style.display = 'inline-block';
        }

        calculateBtn.addEventListener('click', calculateConfiguration);
        printBtn.addEventListener('click', () => window.print());

        fetchData();
    }
});
