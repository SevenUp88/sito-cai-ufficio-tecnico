document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const registerBtn = document.getElementById('register-btn');
    const receptionDateInput = document.getElementById('reception-date');
    const selectAllCb = document.getElementById('select-all-cb');
    const statusMessage = document.getElementById('status-message');
    const resultsTbody = document.getElementById('results-tbody');
    const spinner = document.getElementById('spinner');

    const API_KEY = 'AIzaSyDlL_Cz_rKxOby1-mKdUMzRPWSb5AalzCQ';
    const VISION_API_URL = `https://vision.googleapis.com/v1/files:annotate?key=${API_KEY}`;
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyyBeWhl1rH4flw59NVvNyIFYoVE0cDFlqRfcd0SVWKKAAh4mo0nfJ-O009FpIfUljT/exec';

    let extractedData = [];

    processBtn.addEventListener('click', handleAllFiles);
    registerBtn.addEventListener('click', handleRegistration);
    selectAllCb.addEventListener('change', (e) => {
        document.querySelectorAll('.row-cb').forEach(cb => cb.checked = e.target.checked);
    });

    async function handleAllFiles() {
        const files = fileInput.files;
        if (files.length === 0) { statusMessage.textContent = 'Seleziona uno o più file.'; return; }

        spinner.style.display = 'block';
        statusMessage.textContent = `Processo ${files.length} file...`;
        resultsTbody.innerHTML = '';
        extractedData = [];
        [registerBtn, exportCsvBtn].forEach(btn => btn.disabled = true);
        processBtn.disabled = true;

        for (const file of files) {
            await handleFileProcessing(file);
        }

        spinner.style.display = 'none';
        statusMessage.textContent = 'Processo completato. Seleziona le righe da registrare.';
        if (extractedData.length > 0) registerBtn.disabled = false;
        processBtn.disabled = false;
    }

    async function handleFileProcessing(file) {
        try {
            const base64Data = await fileToBase64(file);
            const requestBody = { requests: [{ inputConfig: { mimeType: file.type, content: base64Data }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] };
            const response = await fetch(VISION_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
            if (!response.ok) throw new Error(`Errore API per ${file.name}`);
            const data = await response.json();
            const fileResponse = data.responses[0];
            let fullText = '';
            if (fileResponse && fileResponse.responses) {
                fileResponse.responses.forEach(page => { if (page.fullTextAnnotation) fullText += page.fullTextAnnotation.text + '\n'; });
            }
            const parsedResults = parseRawText(fullText);
            displayResults(file.name, parsedResults);
        } catch (error) {
            console.error(`Errore processando ${file.name}:`, error);
            resultsTbody.innerHTML += `<tr><td colspan="5">Errore durante l'analisi del file ${file.name}</td></tr>`;
        }
    }

    function parseRawText(text) {
        const results = [];
        const productLineRegex = /^(.*?(?:AZOTO|OSSIGENO|ACETILENE).*?\d{1,2}\s*L.*)$/gm;
        const productLines = [...text.matchAll(productLineRegex)].map(match => ({ line: match[1], index: match.index }));
        if (productLines.length === 0) return [];

        productLines.forEach((product, i) => {
            const { line, index } = product;
            const gasMatch = line.match(/AZOTO|OSSIGENO|ACETILENE/);
            const capacityMatch = line.match(/(\d+)\s*L/);
            if (!gasMatch || !capacityMatch) return;

            const startIndex = index + line.length;
            const nextProduct = productLines[i + 1];
            const endIndex = nextProduct ? nextProduct.index : text.length;
            const searchArea = text.substring(startIndex, endIndex);
            const serialsLineMatch = searchArea.match(/S\d{6,}[\s/S\d]*/);
            let serials = [];
            if (serialsLineMatch) {
                serials = [...serialsLineMatch[0].matchAll(/S\d{6,}/g)].map(m => m[0]);
            }
            if (serials.length > 0) {
                results.push({ gas: gasMatch[0], capacity: capacityMatch[1], serials: serials.join(', ') });
            }
        });
        return results;
    }

    function displayResults(fileName, parsedResults) {
        if (parsedResults.length === 0) {
             resultsTbody.innerHTML += `<tr><td><input type="checkbox" disabled></td><td>${fileName}</td><td colspan="3"><i>Nessun prodotto riconosciuto.</i></td></tr>`;
             return;
        }
        parsedResults.forEach((result, index) => {
            const row = resultsTbody.insertRow();
            row.innerHTML = `
                <td><input type="checkbox" class="row-cb" data-index="${extractedData.length}"></td>
                <td>${fileName}</td>
                <td>${result.gas}</td>
                <td>${result.capacity} L</td>
                <td>${result.serials}</td>
            `;
            extractedData.push({ file: fileName, ...result });
        });
    }

    async function handleRegistration() {
        const selectedIndexes = [...document.querySelectorAll('.row-cb:checked')].map(cb => parseInt(cb.dataset.index, 10));
        const receptionDate = receptionDateInput.value;

        if (selectedIndexes.length === 0) {
            alert("Seleziona almeno una riga da registrare.");
            return;
        }
        if (!receptionDate) {
            alert("Per favore, inserisci una data di ricezione.");
            receptionDateInput.focus();
            return;
        }

        const cylindersToRegister = selectedIndexes.map(index => extractedData[index]);
        
        spinner.style.display = 'block';
        statusMessage.textContent = `Registrazione di ${cylindersToRegister.length} lotti...`;
        registerBtn.disabled = true;

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                // Usiamo la modalità CORS standard perché ora lo script di Google risponde correttamente
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'registerGasCylinders',
                    receptionDate: receptionDate,
                    cylinders: cylindersToRegister
                })
            });
            if (!response.ok) throw new Error("La risposta dal server non è OK.");
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            
            statusMessage.textContent = `Successo! ${result.message || 'Bombole registrate.'}`;
            // Deseleziona tutto
            document.querySelectorAll('.row-cb:checked').forEach(cb => cb.checked = false);
            selectAllCb.checked = false;

        } catch (error) {
            statusMessage.textContent = `Errore durante la registrazione: ${error.message}`;
            console.error("Errore registrazione:", error);
        } finally {
            spinner.style.display = 'none';
            registerBtn.disabled = false;
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }
});
