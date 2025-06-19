const { GoogleSpreadsheet } = require('google-spreadsheet');

const SHEET_ID = "1STfiqCxhSvl0iAM5-baq9XE95_PCz2ZdOFiyPQP9rC0";
const creds = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { idToDelete } = JSON.parse(event.body);
    if (!idToDelete) {
      return { statusCode: 400, body: 'ID dell\'articolo da cancellare mancante.' };
    }

    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['inventario'];
    if (!sheet) throw new Error("Scheda 'inventario' non trovata.");

    const rows = await sheet.getRows(); // Carica tutte le righe
    let rowDeleted = false;
    
    // Cerca la riga con l'ID corrispondente e la cancella
    for (const row of rows) {
      if (row.id === idToDelete) {
        await row.delete();
        rowDeleted = true;
        console.log(`Riga con ID ${idToDelete} cancellata con successo.`);
        break; // Esci dal ciclo una volta trovata e cancellata
      }
    }
    
    if (!rowDeleted) {
       console.warn(`Nessuna riga trovata con ID ${idToDelete} da cancellare.`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Operazione di cancellazione per ID ${idToDelete} completata.` }),
    };

  } catch (error) {
    console.error("Errore nella funzione di cancellazione:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Impossibile cancellare la riga dal foglio Google.' }),
    };
  }
};
