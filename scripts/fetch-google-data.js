// scripts/fetch-google-data.js

const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

async function fetchDataFromGoogleSheets() {
    console.log('Avvio script di recupero dati da Google Sheets...');

    // --- Recupera l'ID del foglio dalla variabile d'ambiente ---
    // GOOGLE_APPLICATION_CREDENTIALS è gestita automaticamente dalla libreria di autenticazione Google
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // --- Verifica che l'ID del foglio sia impostato ---
    if (!sheetId) {
        console.error('ERRORE: La variabile d\'ambiente GOOGLE_SHEET_ID non è impostata. Assicurati di aver impostato l\'ID del tuo foglio Google nelle impostazioni di Netlify.');
        process.exit(1);
    }

    // --- Configura l'autenticazione usando la libreria standard ---
    // Questa libreria cercherà automaticamente le credenziali nella variabile d'ambiente GOOGLE_APPLICATION_CREDENTIALS
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Scope per leggere i fogli Google
    });

    // --- Inizializza il client API di Google Sheets ---
    const sheets = google.sheets({ version: 'v4', auth });

    // --- Definisce dove salvare il file JSON di output ---
    // Questo percorso è relativo alla root del tuo progetto (dove si trova la cartella 'scripts')
    const outputFilePath = path.join(__dirname, '../src/data/prices.json'); // Esempio: '../src/data/prices.json'
    // Rivedi questo percorso in base alla tua Publish directory su Netlify
    // Se Publish directory è '/' e vuoi il file a /data/prices.json, usa:
    // const outputFilePath = path.join(__dirname, '../data/prices.json');
    // Se Publish directory è 'public' e vuoi il file a /data/prices.json, usa:
    // const outputFilePath = path.join(__dirname, '../public/data/prices.json'); // Assicurati che public/data esista o usa mkdir nel build command

    // --- Recupera i dati dal foglio Google ---
    // IMPORTANTE: Modifica 'Sheet1' con il nome esatto del tuo foglio nel documento Google
    // Hai detto che il tuo foglio si chiama 'Noleggi', quindi cambia 'Sheet1' in 'Noleggi'
    const sheetName = 'Noleggi'; // <--- MODIFICA QUESTO CON IL NOME ESATTO DEL TUO FOGLIO!
    const range = `${sheetName}!A:Z`; // <--- MODIFICA QUESTO RANGE SE NECESSARIO!

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
        // Assumiamo che la prima riga (indice 0) contenga le intestazioni delle colonne
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            const rowData = {};
             // Assicura che la riga abbia almeno lo stesso numero di colonne delle intestazioni
            headers.forEach((header, index) => {
                if (index < row.length) { // Evita errori se le righe successive hanno meno colonne dell'intestazione
                     const cleanedHeader = header.trim().replace(/\s+/g, '_'); // "Nome Prodotto" -> "Nome_Prodotto"
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

        fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf8'); // Usa null, 2 per formattare il JSON in modo leggibile

        console.log(`Dati salvati con successo in ${outputFilePath}`);

    } catch (error) {
        console.error('ERRORE DURANTE IL RECUPERO DEI DATI DA GOOGLE SHEETS API:');
        // L'errore dal fetch dei dati avrà più dettagli rispetto all'errore di parsing credenziali
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
        } else if (error.code === 'ENOTFOUND') {
             console.error('Errore di rete: impossibile raggiungere Google API. Controlla la tua connessione o lo stato dei servizi Google.');
        } else {
             console.error('Errore generico:', error.message);
        }

        process.exit(1); // Termina il processo di build con errore
    }
}

// Esegue la funzione principale quando lo script viene chiamato
fetchDataFromGoogleSheets();
