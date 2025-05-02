// scripts/fetch-google-data.js

const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

async function fetchDataFromGoogleSheets() {
    console.log('Avvio script di recupero dati da Google Sheets...');

    // --- Recupera i componenti delle credenziali dalle variabili d'ambiente ---
    // Usiamo i nomi corretti basati sulle chiavi JSON e il prefisso GOOGLE_AUTH_
    const type = process.env.GOOGLE_AUTH_TYPE;
    const project_id = process.env.GOOGLE_AUTH_PROJECT_ID;
    const private_key_id = process.env.GOOGLE_AUTH_PRIVATE_KEY_ID;
    const private_key = process.env.GOOGLE_AUTH_PRIVATE_KEY; // Questa è la stringa multilinea con \n
    const client_email = process.env.GOOGLE_AUTH_CLIENT_EMAIL;
    const client_id = process.env.GOOGLE_AUTH_CLIENT_ID;
    const auth_uri = process.env.GOOGLE_AUTH_URI; // Corretto
    const token_uri = process.env.GOOGLE_AUTH_TOKEN_URI; // Corretto
    const auth_provider_x509_cert_url = process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL; // Corretto
    const client_x509_cert_url = process.env.GOOGLE_AUTH_CLIENT_X509_CERT_URL; // Corretto
    const universe_domain = process.env.GOOGLE_AUTH_UNIVERSE_DOMAIN; // Corretto

    // --- Recupera l'ID del foglio e il nome del foglio ---
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = 'Noleggi'; // <--- ASSICURATI CHE QUESTO NOME SIA ESATTO!
    const range = `${sheetName}!A:Z`; // <--- MODIFICA QUESTO RANGE SE NECESSARIO!

    // --- Verifica che le variabili NECESSARIE per l'autenticazione siano impostate ---
    // Il costruttore JWT ha bisogno almeno di email, chiave privata e scopes. Progetto è utile.
    if (!client_email || !private_key || !project_id) {
         console.error('ERRORE: Variabili d\'ambiente delle credenziali del Service Account mancanti o incomplete.');
         console.error('Assicurati che GOOGLE_AUTH_CLIENT_EMAIL, GOOGLE_AUTH_PRIVATE_KEY e GOOGLE_AUTH_PROJECT_ID siano impostate su Netlify.');
        process.exit(1);
    }
     if (!sheetId) {
        console.error('ERRORE: La variabile d\'ambiente GOOGLE_SHEET_ID non è impostata.');
        process.exit(1);
    }


    // --- Configura l'autenticazione usando il costruttore JWT con i componenti separati ---
    // Questo evita di dover parsare un JSON complesso da una singola stringa e usa i componenti diretti.
    // I parametri sono: email, keyFile (null), key (stringa), scopes, projectId
    const auth = new google.auth.JWT(
        client_email, // 1. email del Service Account (variabile GOOGLE_AUTH_CLIENT_EMAIL)
        null,         // 2. keyFile è null perché usiamo la chiave privata come stringa
        private_key,  // 3. chiave privata come stringa (variabile GOOGLE_AUTH_PRIVATE_KEY)
        ['https://www.googleapis.com/auth/spreadsheets.readonly'], // 4. Scope
        project_id    // 5. ID del progetto (variabile GOOGLE_AUTH_PROJECT_ID) - utile per autenticazione
        // Le altre variabili (type, private_key_id, client_id, auth_uri, ecc.) non sono parametri standard del costruttore JWT
        // quando si autentica con key string e projectId. La libreria le gestisce internamente o non ne ha bisogno.
    );


    // --- Inizializza il client API di Google Sheets ---
    // Attendi che l'autenticazione sia pronta prima di creare il client sheets
     await auth.authorize(); // Aggiungi questa riga per assicurarti che l'autenticazione avvenga prima della chiamata API
     console.log('Autenticazione Service Account riuscita.');

    const sheets = google.sheets({ version: 'v4', auth });

    // --- Definisce dove salvare il file JSON di output ---
    // Questo percorso è relativo alla root del tuo progetto (dove si trova la cartella 'scripts')
    const outputFilePath = path.join(__dirname, '../src/data/prices.json'); // Esempio: '../src/data/prices.json'
     // Rivedi questo percorso in base alla tua Publish directory su Netlify
     // Se Publish directory è '/' e vuoi il file a /data/prices.json, usa:
     // const outputFilePath = path.join(__dirname, '../data/prices.json');
     // Se Publish directory è 'public' e vuoi il file a /data/prices.json, usa:
     // const outputFilePath = path.join(__dirname, '../public/data/prices.json'); // Assicurati che public/data esista o usa mkdir nel build command


    try {
        console.log(`Recupero dati dal foglio "${sheetName}" (ID: ${sheetId}, Range: "${range}")...`);
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
                fs.mkdirSync(outputDir, { recursive: true });
            }
            // Scrive un file JSON vuoto
            fs.writeFileSync(outputFilePath, JSON.stringify([]), 'utf8');
            console.log(`File JSON vuoto salvato in ${outputFilePath}`);
            return;
        }

        // --- Processa i dati (Trasforma da array di array a array di oggetti) ---
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            const rowData = {};
             headers.forEach((header, index) => {
                if (index < row.length) {
                     const cleanedHeader = header.trim().replace(/\s+/g, '_');
                     rowData[cleanedHeader] = row[index];
                }
            });
            return rowData;
        });

        console.log(`Recuperate ${data.length} righe di dati (esclusa l'intestazione).`);

        // --- Scrive i dati in un file JSON locale ---
        const outputDir = path.dirname(outputFilePath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf8');

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
             console.error('  Controlla che l\'API Sheets sia abilitata, che le credenziali (email Service Account, ID chiave privata) siano corrette e che l\'account di servizio abbia i permessi per leggere il foglio.');
        } else if (error.code === 'ENOTFOUND') {
             console.error('Errore di rete: impossibile raggiungere Google API.');
        } else {
             console.error('Errore generico:', error.message);
        }

        process.exit(1); // Termina il processo di build con errore
    }
}

fetchDataFromGoogleSheets();
