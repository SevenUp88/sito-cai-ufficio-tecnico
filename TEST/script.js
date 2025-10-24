// File: TEST/script.js

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const statusMessage = document.getElementById('status-message');
    const rawTextOutput = document.getElementById('raw-text-output');
    const spinner = document.getElementById('spinner');

    // --- CONFIGURAZIONE ---
    // !!! INCOLLA QUI LA TUA CHIAVE API !!!
    const API_KEY = 'AIzaSyDlL_Cz_rKxOby1-mKdUMzRPWSb5AalzCQ';
    
    const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

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
            // Converte il file in formato base64, che è quello che Google Vision richiede
            const base64Data = await fileToBase64(file);
            
            statusMessage.textContent = 'Invio a Google Cloud Vision API...';

            // Prepara la richiesta per l'API
            const requestBody = {
                requests: [
                    {
                        image: {
                            content: base64Data
                        },
                        features: [
                            {
                                type: 'DOCUMENT_TEXT_DETECTION' // Usiamo la modalità specifica per documenti
                            }
                        ]
                    }
                ]
            };

            // Invia la richiesta a Google
            const response = await fetch(VISION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Errore dall'API: ${errorData.error.message}`);
            }

            const data = await response.json();
            
            // Estrae il testo dalla risposta di Google
            const detection = data.responses[0];
            if (detection && detection.fullTextAnnotation) {
                const fullText = detection.fullTextAnnotation.text;
                rawTextOutput.textContent = fullText;
                statusMessage.textContent = 'Estrazione completata!';
            } else {
                rawTextOutput.textContent = 'Nessun testo trovato nel documento.';
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

    // Funzione helper per convertire un file in una stringa base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Rimuove l'intestazione (es. "data:image/jpeg;base64,") per ottenere solo i dati puri
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    }
});
