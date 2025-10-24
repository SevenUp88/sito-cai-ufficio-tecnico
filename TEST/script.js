// File: TEST/script.js - VERSIONE FINALE CON PARSING MULTI-PAGINA CORRETTO

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const statusMessage = document.getElementById('status-message');
    const resultsTbody = document.getElementById('results-tbody');
    const spinner = document.getElementById('spinner');

    const API_KEY = 'AIzaSyDlL_Cz_rKxOby1-mKdUMzRPWSb5AalzCQ';
    const VISION_API_URL = `https://vision.googleapis.com/v1/files:annotate?key=${API_KEY}`;
    
    let extractedData = [];

    processBtn.addEventListener('click', handleAllFiles);
    exportCsvBtn.addEventListener('click', exportToCsv);

    async function handleAllFiles() {
        const files = fileInput.files;
        if (files.length === 0) {
            statusMessage.textContent = 'Per favore, seleziona uno o più file.';
            return;
        }

        spinner.style.display = 'block';
        statusMessage.textContent = `Processo ${files.length} file...`;
        resultsTbody.innerHTML = '';
        extractedData = [];
        exportCsvBtn.disabled = true;
        processBtn.disabled = true;

        for (const file of files) {
            await handleFileProcessing(file);
        }

        spinner.style.display = 'none';
        statusMessage.textContent = 'Processo completato.';
        if (extractedData.length > 0) {
            exportCsvBtn.disabled = false;
        }
        processBtn.disabled = false;
    }

    async function handleFileProcessing(file) {
        try {
            const base64Data = await fileToBase64(file);
            const requestBody = {
                requests: [{
                    inputConfig: { mimeType: file.type, content: base64Data },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
                }]
            };

            const response = await fetch(VISION_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error(`Errore API per ${file.name}`);
            
            const data = await response.json();
            const fileResponse = data.responses[0];
            let fullText = '';

            if (fileResponse && fileResponse.responses) {
                fileResponse.responses.forEach(pageResponse => {
                    if (pageResponse.fullTextAnnotation) {
                        fullText += pageResponse.fullTextAnnotation.text + '\n';
                    }
                });
            }

            const parsedResults = parseRawText(fullText);
            displayResults(file.name, parsedResults, fullText);
            
        } catch (error) {
            console.error(`Errore processando ${file.name}:`, error);
            resultsTbody.innerHTML += `<tr><td colspan="5">Errore durante l'analisi del file ${file.name}</td></tr>`;
        }
    }

    function parseRawText(text) {
        const results = [];
        
        // Regex per trovare le righe dei prodotti
        const lineRegex = /^(.*?(?:AZOTO|OSSIGENO|ACETILENE).*?(\d{1,2})\s*L.*)$/gm;
        let match;
        
        while ((match = lineRegex.exec(text)) !== null) {
            const line = match[1];
            const capacity = match[2];
            
            const gasMatch = line.match(/AZOTO|OSSIGENO|ACETILENE/);
            const gas = gasMatch ? gasMatch[0] : 'N/A';

            // --- INIZIO LOGICA DI RICERCA MIGLIORATA ---
            // Definiamo un'area di ricerca più ampia dopo la riga del prodotto
            const searchAreaEnd = text.indexOf('Situazione Giacenza', match.index);
            const searchArea = text.substring(
                match.index + line.length, 
                searchAreaEnd !== -1 ? searchAreaEnd : match.index + 800 // Limita la ricerca per sicurezza
            );

            let serials = [];
            // Cerca la parola "Barcode:" e prendi la riga successiva
            const barcodeMatch = searchArea.match(/Barcode:\s*\n(.*?)\n/);
            if (barcodeMatch && barcodeMatch[1]) {
                // Trovato "Barcode:", estrai tutte le matricole da quella riga
                serials = [...barcodeMatch[1].matchAll(/S\d{6,}/g)].map(m => m[0]);
            } else {
                // Fallback: se non trova "Barcode:", cerca le matricole liberamente nell'area
                serials = [...searchArea.matchAll(/S\d{6,}/g)].map(m => m[0]);
            }
            // --- FINE LOGICA DI RICERCA MIGLIORATA ---

            results.push({
                gas: gas,
                capacity: capacity,
                serials: serials.length > 0 ? serials.join(', ') : 'Nessuna trovata'
            });
        }
        
        return results.length > 0 ? results : [{ gas: 'N/A', capacity: 'N/A', serials: 'Nessuna trovata' }];
    }

    function displayResults(fileName, parsedResults, rawText) {
        if (parsedResults.length === 1 && parsedResults[0].gas === 'N/A') {
             resultsTbody.innerHTML += `<tr>
                <td>${fileName}</td>
                <td colspan="3"><i>Nessun prodotto riconosciuto in questo file.</i></td>
                <td><details><summary>Mostra testo</summary><pre style="white-space: pre-wrap; font-size: 0.8em;">${rawText}</pre></details></td>
            </tr>`;
            return;
        }

        parsedResults.forEach(result => {
            const row = resultsTbody.insertRow();
            row.innerHTML = `
                <td>${fileName}</td>
                <td>${result.gas}</td>
                <td>${result.capacity} L</td>
                <td>${result.serials}</td>
                <td><details><summary>Mostra testo</summary><pre style="white-space: pre-wrap; font-size: 0.8em;">${rawText}</pre></details></td>
            `;
            extractedData.push({
                file: fileName,
                gas: result.gas,
                capacity: result.capacity,
                serials: result.serials
            });
        });
    }

    function exportToCsv() {
        if (extractedData.length === 0) {
            alert("Nessun dato da esportare.");
            return;
        }
        const headers = "File,Gas,Capacita,Matricole\n";
        const rows = extractedData.map(d => `"${d.file}","${d.gas}","${d.capacity}","${d.serials.replace(/"/g, '""')}"`).join("\n");
        
        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "estrazione_bolle.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
