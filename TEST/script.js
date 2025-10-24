// File: TEST/script.js - VERSIONE CORRETTA PER PDF

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const statusMessage = document.getElementById('status-message');
    const rawTextOutput = document.getElementById('raw-text-output');
    const spinner = document.getElementById('spinner');

    const API_KEY = 'AIzaSyDlL_Cz_rKxOby1-mKdUMzRPWSb5AalzCQ';
    
    // --- MODIFICA 1: URL DELL'API ---
    // Usiamo l'endpoint "files:annotate" invece di "images:annotate"
    const VISION_API_URL = `https://vision.googleapis.com/v1/files:annotate?key=${API_KEY}`;

    processBtn.addEventListener('click', handleFileProcessing);

    async function handleFileProcessing() {
        const file = fileInput.files[0];
        if (!file) {
            statusMessage.textContent = 'Per favore, seleziona un file.';
            return;
        }

        statusMessage.textContent = 'Lettura del file...';
        spinner.style.display = 'block';
        rawTextOutput.textContent = '';
        processBtn.disabled = true;

        try {
            const base64Data = await fileToBase64(file);
            statusMessage.textContent = 'Invio a Google Cloud Vision API...';

            // --- MODIFICA 2: CORPO DELLA RICHIESTA ---
            const requestBody = {
                requests: [
                    {
                        inputConfig: {
                            // Specifichiamo che il contenuto è un PDF
                            mimeType: 'application/pdf',
                            content: base64Data
                        },
                        features: [
                            {
                                type: 'DOCUMENT_TEXT_DETECTION'
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(VISION_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Errore dall'API: ${errorData.error.message}`);
            }

            const data = await response.json();
            
            // La struttura della risposta per i file è leggermente diversa
            const detection = data.responses[0];
            if (detection && detection.fullTextAnnotation) {
                const fullText = detection.fullTextAnnotation.text;
                rawTextOutput.textContent = fullText;
                statusMessage.textContent = 'Estrazione completata!';
            } else {
                // Aggiungiamo un log più specifico per il debug
                console.log("Risposta dall'API:", data);
                rawTextOutput.textContent = 'Nessun testo trovato nel documento. Controlla la console per la risposta completa dall\'API.';
                statusMessage.textContent = 'Completato, ma nessun testo rilevato.';
            }

        } catch (error) {
            statusMessage.textContent = `Errore: ${error.message}`;
            console.error('Errore durante il processo:', error);
        } finally {
            spinner.style.display = 'none';
            processBtn.disabled = false;
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    }
});
