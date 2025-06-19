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
    const data = JSON.parse(event.body);
    const { id, brand, name, totalQuantity, dailyRate } = data;

    if (!id || !brand || !name || totalQuantity == null || dailyRate == null) {
      return { statusCode: 400, body: 'Dati mancanti o non validi' };
    }

    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo(); 
    const sheet = doc.sheetsByTitle['inventario'];
    if (!sheet) throw new Error("Scheda 'inventario' non trovata.");

    // Assicurati che questi nomi di proprietà corrispondano
    // ESATTAMENTE alle intestazioni della prima riga del tuo foglio Google.
    await sheet.addRow({
      id: id,
      marca: brand,
      nome: name,
      quantita_totale: totalQuantity, // Se nel foglio è 'quantita-totale', scrivi 'quantita-totale': totalQuantity
      costo_giornaliero: dailyRate,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Articolo ${id} aggiunto con successo.` }),
    };

  } catch (error) {
    console.error("Errore Netlify Function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Impossibile scrivere sul foglio Google.' }),
    };
  }
};
