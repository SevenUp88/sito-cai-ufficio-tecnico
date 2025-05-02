// scripts/fetch-google-data.js

const fs = require('fs'); // Modulo Node.js per lavorare con il file system
const { google } = require('googleapis'); // Libreria ufficiale di Google per le API
const path = require('path'); // Modulo Node.js per lavorare con i percorsi dei file

async function fetchDataFromGoogleSheets() {
    console.log('Avvio script di recupero dati da Google Sheets...');

    // --- Recupera le variabili d'ambiente da Netlify ---
    const credentialsJsonString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // --- Verifica che le variabili d'ambiente siano impostate ---
    if (!credentialsJsonString) {
        console.error('ERRORE: La variabile d\'ambiente GOOGLE_SERVICE_ACCOUNT_CREDENTIALS non è impostata. Assicurati di aver copiato correttamente il contenuto JSON delle credenziali del Service Account nelle impostazioni di Netlify.');
        process.exit(1); // Termina il processo di build con errore
    }
    if (!sheetId) {
        console.error('ERRORE: La variabile d\'ambiente GOOGLE_SHEET_ID non è impostata. Assicurati di aver impostato l\'ID del tuo foglio Google nelle impostazioni di Netlify.');
        process.exit(1); // Termina il processo di build con errore
    }

    let credentials;
    try {
        // Parsa la stringa JSON delle credenziali in un oggetto JavaScript
        // Gestisce anche i caratteri di newline che potrebbero essere escapati se copiati male
        credentials = JSON.parse(credentialsJsonString.replace(/\\n/g, '\n'));
    } catch (error) {
        console.error('ERRORE: Impossibile parsare le credenziali JSON della variabile GOOGLE_SERVICE_ACCOUNT_CREDENTIALS.');
        console.error('Dettagli errore:', error);
        process.exit(1); // Termina il processo di build con errore
    }

    // --- Configura l'autenticazione con il Service Account ---
    const auth = new google.auth.JWT(
        credentials.client_email, // L'email del Service Account
        null,
        credentials.private_key, // La chiave privata del Service Account
        ['https://www.googleapis.com/auth/spreadsheets.readonly'] // Scope per leggere i fogli Google
    );

    // --- Inizializza il client API di Google Sheets ---
    const sheets = google.sheets({ version: 'v4', auth });

    // --- Definisce dove salvare il file JSON di output ---
    // Questo percorso è relativo alla root del tuo progetto (dove si trova la cartella 'scripts')
    const outputFilePath = path.join(__dirname, '../src/data/prices.json'); // Esempio: '../src/data/prices.json'

    // --- Recupera i dati dal foglio Google ---
    // IMPORTANTE: Modifica 'Sheet1' con il nome esatto del tuo foglio nel documento Google
    // Puoi anche specificare un range specifico, ad esempio 'Sheet1!A2:C10'
    const sheetName = 'Sheet1'; // <--- MODIFICA QUESTO CON IL NOME DEL TUO FOGLIO!
    const range = `${sheetName}!A:Z`; // <--- MODIFICA QUESTO RANGE SE NECESSARIO! (A:Z copre tutte le colonne)

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: range,
        });

        const rows = response.data.values;

        // --- Verifica se sono stati trovati dati ---
        if (!rows || rows.length === 0) {
            console.log(`AVVISO: Nessun dato trovato nel foglio "${sheetName}" o nel range "${range}". Creazione di un file JSON vuoto.`);
            // Assicurati che la directory di output esista
            const outputDir = path.dirname(outputFilePath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true }); // Crea la directory e quelle parenti se non esistono
            }
            // Scrive un file JSON vuoto
            fs.writeFileSync(outputFilePath, JSON.stringify([]), 'utf8');
            console.log(`File JSON vuoto salvato in ${outputFilePath}`);
            return; // Termina l'esecuzione (successo, ma senza dati)
        }

        // --- Processa i dati (Trasforma da array di array a array di oggetti) ---
        // Assumiamo che la prima riga (indice 0) contenga le intestazioni delle colonne
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                // Pulisce l'intestazione per usarla come chiave JSON (rimuove spazi, caratteri speciali, converte in camelCase ecc.)
                // Per semplicità, qui usiamo l'intestazione così com'è. Potresti volerla "sanificare"
                const cleanedHeader = header.trim().replace(/\s+/g, '_'); // Esempio: "Nome Prodotto" -> "Nome_Prodotto"
                rowData[cleanedHeader] = row[index]; // Mappa il valore della cella all'intestazione corrispondente
            });
            return rowData;
        });

        console.log(`Recuperati ${data.length} righe di dati (esclusa l'intestazione).`);

        // --- Scrive i dati in un file JSON locale ---
        const outputDir = path.dirname(outputFilePath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true }); // Crea la directory e quelle parenti se non esistono
        }

        fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf8'); // Usa null, 2 per formattare il JSON in modo leggibile

        console.log(`Dati salvati con successo in ${outputFilePath}`);

    } catch (error) {
        console.error('ERRORE DURANTE IL RECUPERO DEI DATI DA GOOGLE SHEETS API:');
        console.error(error);

        // Logga errori specifici dell'API se disponibili
        if (error.response && error.response.data && error.response.data.error) {
            console.error('Dettagli errore API Google:');
            console.error('  Status:', error.response.status);
            console.error('  Message:', error.response.data.error.message);
            if (error.response.data.error.errors) {
                 error.response.data.error.errors.forEach((err, i) => {
                    console.error(`  Error ${i + 1}: ${err.message} (Reason: ${err.reason})`);
                });
            }
            console.error('  Controlla che l\'API Sheets sia abilitata, che le credenziali siano corrette e che l\'account di servizio abbia i permessi per leggere il foglio.');
        } else {
             console.error('Errore generico:', error.message);
        }


        process.exit(1); // Termina il processo di build con errore
    }
}

// Esegue la funzione principale quando lo script viene chiamato
fetchDataFromGoogleSheets();
