// --- START OF FILE multi_data.js ---
// File: multi_data.js
// Dati per configuratore Multisplit (convertiti da multisplit.csv)
// Percorsi immagine aggiornati secondo la struttura ../images/ e ../images/logos/
// !! ATTENZIONE: DATI UI MANCANTI/INCOMPLETI PER ALCUNE MARCHE (DAIKIN, VIESSMANN) !!

// Helper function per creare nomi file immagine (minuscolo, sostituisci spazi/etc con underscore)
function normalizeForFilename(name) {
    if (!name) return '';
    return name.toLowerCase()
               .replace(/\s+/g, '_') // Replace spaces with underscores
               .replace(/[^a-z0-9_]/g, ''); // Remove non-alphanumeric characters except underscore
}

// Helper function per determinare l'URL immagine UE
function getUeImageUrl(marca, modelloNote) {
    const brandLower = marca.toLowerCase();
    let baseName = `${brandLower}_generic`; // Default generic brand image

    // Attempt to find a specific model name from note_compatibilita if it lists ONLY ONE series
    if (modelloNote && typeof modelloNote === 'string' && modelloNote.toLowerCase().includes('compatibile con ui:')) {
        const modelsText = modelloNote.split(':')[1];
        if (modelsText) {
            const models = modelsText.split(',')
                                   .map(m => m.trim())
                                   .filter(m => m !== '');
            if (models.length === 1) { // Only if exactly one model is listed
                baseName = normalizeForFilename(models[0]);
            }
        }
    }
    // Se non è stato trovato un modello specifico o c'erano più modelli, usa il nome generico del brand se non esiste l'immagine specifica
    // Costruisci il path specifico e verifica se esiste (in un ambiente reale, lato server), altrimenti usa il generico.
    // Qui assumiamo che l'immagine specifica esista se baseName non è più il generico.
    let specificImage = `../images/ue_${baseName}.png`;
    let genericImage = `../images/ue_${brandLower}_generic.png`;

    // In questo ambiente JS lato client, non possiamo verificare l'esistenza del file.
    // Daremo priorità al nome specifico se derivato. L'utente dovrà assicurarsi che esista.
    // Se baseName è ancora '[brand]_generic', useremo direttamente genericImage.
    if (baseName === `${brandLower}_generic`){
        return genericImage;
    } else {
         // Prova a usare l'immagine specifica derivata dal nome del modello UI compatibile
         // Esempio: Se compatibile solo con "REVIVE", prova "../images/ue_revive.png"
         return specificImage;
         // NOTA: Potrebbe essere necessario aggiungere una logica di fallback qui se `specificImage` non esiste.
         // Ad esempio, usando un `onerror` nell'HTML o pre-verificando l'elenco delle immagini disponibili.
         // Per semplicità, ora assumiamo che se deriviamo un nome specifico, l'immagine esista.
    }

}


const multiProducts = [
    // === HAIER ===
    // --- UE ---
    {
        id: "835806", type: 'UE', marca: "HAIER", modello: "REVIVE UE 4kW", codice_prodotto: "835806", articolo_fornitore: "835806",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 491.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: REVIVE",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: REVIVE") // Should resolve to ../images/ue_revive.png
    },
    {
        id: "835807", type: 'UE', marca: "HAIER", modello: "REVIVE UE 5kW", codice_prodotto: "835807", articolo_fornitore: "835807",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 581.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: REVIVE",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: REVIVE") // Should resolve to ../images/ue_revive.png
    },
    {
        id: "835704", type: 'UE', marca: "HAIER", modello: "REVIVE UE 5.5kW", codice_prodotto: "835704", articolo_fornitore: "835704",
        potenza_kw: 5.5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 706.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: REVIVE",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: REVIVE") // Should resolve to ../images/ue_revive.png
    },
    {
        id: "573470", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 4kW", codice_prodotto: "573470", articolo_fornitore: "573470",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 682.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic ../images/ue_haier_generic.png
    },
    {
        id: "573473", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 5kW", codice_prodotto: "573473", articolo_fornitore: "573473",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 824.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic
    },
    {
        id: "715459", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 5.5kW", codice_prodotto: "715459", articolo_fornitore: "715459",
        potenza_kw: 5.5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 928.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic
    },
    {
        id: "764471", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 7kW", codice_prodotto: "764471", articolo_fornitore: "764471",
        potenza_kw: 7, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1232.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic
    },
    {
        id: "765278", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 7.5kW", codice_prodotto: "765278", articolo_fornitore: "765278",
        potenza_kw: 7.5, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1337.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic
    },
    {
        id: "730440", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 8.5kW", codice_prodotto: "730440", articolo_fornitore: "730440",
        potenza_kw: 8.5, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1464.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic
    },
    {
        id: "733865", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 9kW", codice_prodotto: "733865", articolo_fornitore: "733865",
        potenza_kw: 9, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 1805.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic
    },
    {
        id: "785562", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 10.5kW", codice_prodotto: "785562", articolo_fornitore: "785562",
        potenza_kw: 10.5, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 1858.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PEARL, FLEXIS",
        image_url: getUeImageUrl("HAIER", "Compatibile con UI: PEARL, FLEXIS") // Ambiguo -> Generic
    },
    // --- UI ---
    {
        id: "835688", type: 'UI', marca: "HAIER", modello: "REVIVE", codice_prodotto: "835688", articolo_fornitore: "835688",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 135.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("REVIVE")}.png`, note_compatibilita: null
    },
    {
        id: "835703", type: 'UI', marca: "HAIER", modello: "REVIVE", codice_prodotto: "835703", articolo_fornitore: "835703",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 150.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("REVIVE")}.png`, note_compatibilita: null
    },
    {
        id: "836088", type: 'UI', marca: "HAIER", modello: "PEARL", codice_prodotto: "836088", articolo_fornitore: "836088",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 146.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("PEARL")}.png`, note_compatibilita: null
    },
    {
        id: "836090", type: 'UI', marca: "HAIER", modello: "PEARL", codice_prodotto: "836090", articolo_fornitore: "836090",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 166.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("PEARL")}.png`, note_compatibilita: null
    },
    {
        id: "764459", type: 'UI', marca: "HAIER", modello: "PEARL", codice_prodotto: "764459", articolo_fornitore: "764459",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 259.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("PEARL")}.png`, note_compatibilita: null
    },
    {
        id: "783641", type: 'UI', marca: "HAIER", modello: "PEARL", codice_prodotto: "783641", articolo_fornitore: "783641",
        potenza_kw: 6.8, potenza_btu: 24000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 353.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("PEARL")}.png`, note_compatibilita: null
    },
    {
        id: "730442", type: 'UI', marca: "HAIER", modello: "FLEXIS", codice_prodotto: "730442", articolo_fornitore: "730442",
        potenza_kw: 2.0, potenza_btu: 7000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 266.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("FLEXIS")}.png`, note_compatibilita: null
    },
    {
        id: "732350", type: 'UI', marca: "HAIER", modello: "FLEXIS", codice_prodotto: "732350", articolo_fornitore: "732350",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 291.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("FLEXIS")}.png`, note_compatibilita: null
    },
    {
        id: "736328", type: 'UI', marca: "HAIER", modello: "FLEXIS", codice_prodotto: "736328", articolo_fornitore: "736328",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 316.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("FLEXIS")}.png`, note_compatibilita: null
    },
    {
        id: "756534", type: 'UI', marca: "HAIER", modello: "FLEXIS", codice_prodotto: "756534", articolo_fornitore: "756534",
        potenza_kw: 4.2, potenza_btu: 15000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 426.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("FLEXIS")}.png`, note_compatibilita: null
    },
    {
        id: "810406", type: 'UI', marca: "HAIER", modello: "FLEXIS", codice_prodotto: "810406", articolo_fornitore: "810406",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 510.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("FLEXIS")}.png`, note_compatibilita: null
    },
     {
        id: "810406-24k", type: 'UI', marca: "HAIER", modello: "FLEXIS", codice_prodotto: "810406-24k", articolo_fornitore: "810406-24k", // ID Unico
        potenza_kw: 7.1, potenza_btu: 24000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 609.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("FLEXIS")}.png`, note_compatibilita: null
    },

    // === MITSUBISHI ===
    // --- UE ---
    {
        id: "651195", type: 'UE', marca: "MITSUBISHI", modello: "HR UE 4kW", codice_prodotto: "651195", articolo_fornitore: "651195",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 751.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: HR",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: HR") // Should resolve to ../images/ue_hr.png
    },
    {
        id: "716846", type: 'UE', marca: "MITSUBISHI", modello: "HR UE 5kW", codice_prodotto: "716846", articolo_fornitore: "716846",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 903.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: HR",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: HR") // Should resolve to ../images/ue_hr.png
    },
    {
        id: "716687", type: 'UE', marca: "MITSUBISHI", modello: "HR UE 5kW Trial", codice_prodotto: "716687", articolo_fornitore: "716687",
        potenza_kw: 5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1158.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: HR",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: HR") // Should resolve to ../images/ue_hr.png
    },
    {
        id: "715005", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 3.3kW", codice_prodotto: "715005", articolo_fornitore: "715005",
        potenza_kw: 3.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 710.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "730613", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 4.2kW", codice_prodotto: "730613", articolo_fornitore: "730613",
        potenza_kw: 4.2, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 893.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "716667", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 5.3kW", codice_prodotto: "716667", articolo_fornitore: "716667",
        potenza_kw: 5.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1077.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "757920", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 5.4kW", codice_prodotto: "757920", articolo_fornitore: "757920",
        potenza_kw: 5.4, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1373.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "681483", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 6.8kW", codice_prodotto: "681483", articolo_fornitore: "681483",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1667.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "689636", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 7.2kW", codice_prodotto: "689636", articolo_fornitore: "689636",
        potenza_kw: 7.2, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1955.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "710734", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 8kW", codice_prodotto: "710734", articolo_fornitore: "710734",
        potenza_kw: 8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2249.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "816479", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 10.2kW", codice_prodotto: "816479", articolo_fornitore: "816479",
        potenza_kw: 10.2, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 2873.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN") // Ambiguo -> Generic
    },
    {
        id: "817055", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 12kW", codice_prodotto: "817055", articolo_fornitore: "817055",
        potenza_kw: 12, potenza_btu: null, max_split: 6, classe_raff: null, classe_risc: null, prezzo: 3297.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AY",
        image_url: getUeImageUrl("MITSUBISHI", "Compatibile con UI: AY") // Should resolve to ../images/ue_ay.png
    },
     // --- UI ---
    {
        id: "760295", type: 'UI', marca: "MITSUBISHI", modello: "HR", codice_prodotto: "760295", articolo_fornitore: "760295",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 189.00, wifi: "No",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("HR")}.png`, note_compatibilita: null
    },
    {
        id: "760296", type: 'UI', marca: "MITSUBISHI", modello: "HR", codice_prodotto: "760296", articolo_fornitore: "760296",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 213.00, wifi: "No",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("HR")}.png`, note_compatibilita: null
    },
    {
        id: "679857", type: 'UI', marca: "MITSUBISHI", modello: "HR", codice_prodotto: "679857", articolo_fornitore: "679857",
        potenza_kw: 4.2, potenza_btu: 15000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 267.00, wifi: "No",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("HR")}.png`, note_compatibilita: null
    },
    {
        id: "667317", type: 'UI', marca: "MITSUBISHI", modello: "HR", codice_prodotto: "667317", articolo_fornitore: "667317",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 297.00, wifi: "No",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("HR")}.png`, note_compatibilita: null
    },
     {
        id: "834032", type: 'UI', marca: "MITSUBISHI", modello: "AY", codice_prodotto: "834032", articolo_fornitore: "834032",
        potenza_kw: 2.0, potenza_btu: 7000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 370.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("AY")}.png`, note_compatibilita: null
    },
    {
        id: "801940", type: 'UI', marca: "MITSUBISHI", modello: "AY", codice_prodotto: "801940", articolo_fornitore: "801940",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 407.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("AY")}.png`, note_compatibilita: null
    },
    {
        id: "801936", type: 'UI', marca: "MITSUBISHI", modello: "AY", codice_prodotto: "801936", articolo_fornitore: "801936",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 419.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("AY")}.png`, note_compatibilita: null
    },
    {
        id: "813624", type: 'UI', marca: "MITSUBISHI", modello: "AY", codice_prodotto: "813624", articolo_fornitore: "813624",
        potenza_kw: 4.2, potenza_btu: 15000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 466.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("AY")}.png`, note_compatibilita: null
    },
    {
        id: "800724", type: 'UI', marca: "MITSUBISHI", modello: "AY", codice_prodotto: "800724", articolo_fornitore: "800724",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 499.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("AY")}.png`, note_compatibilita: null
    },
    {
        id: "714755", type: 'UI', marca: "MITSUBISHI", modello: "KIRIGAMINE STYLE", codice_prodotto: "714755", articolo_fornitore: "714755",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 509.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("kirigamine_style")}.png`, note_compatibilita: null
    },
    {
        id: "714757", type: 'UI', marca: "MITSUBISHI", modello: "KIRIGAMINE STYLE", codice_prodotto: "714757", articolo_fornitore: "714757",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 549.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("kirigamine_style")}.png`, note_compatibilita: null
    },
    {
        id: "687306", type: 'UI', marca: "MITSUBISHI", modello: "KIRIGAMINE STYLE", codice_prodotto: "687306", articolo_fornitore: "687306",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 674.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("kirigamine_style")}.png`, note_compatibilita: null
    },
    {
        id: "688038", type: 'UI', marca: "MITSUBISHI", modello: "KIRIGAMINE ZEN", codice_prodotto: "688038", articolo_fornitore: "688038",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 443.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("kirigamine_zen")}.png`, note_compatibilita: null
    },
    {
        id: "686747", type: 'UI', marca: "MITSUBISHI", modello: "KIRIGAMINE ZEN", codice_prodotto: "686747", articolo_fornitore: "686747",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 467.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("kirigamine_zen")}.png`, note_compatibilita: null
    },
    {
        id: "688063", type: 'UI', marca: "MITSUBISHI", modello: "KIRIGAMINE ZEN", codice_prodotto: "688063", articolo_fornitore: "688063",
        potenza_kw: 4.2, potenza_btu: 15000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 520.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("kirigamine_zen")}.png`, note_compatibilita: null
    },
    {
        id: "691046", type: 'UI', marca: "MITSUBISHI", modello: "KIRIGAMINE ZEN", codice_prodotto: "691046", articolo_fornitore: "691046",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 559.00, wifi: "Sì",
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("kirigamine_zen")}.png`, note_compatibilita: null
    },

    // === LG ===
    // --- UE ---
    {
        id: "836713", type: 'UE', marca: "LG", modello: "LIBERO SMART UE Dual", codice_prodotto: "836713", articolo_fornitore: "836713",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 672.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: LIBERO SMART",
        image_url: getUeImageUrl("LG", "Compatibile con UI: LIBERO SMART") // Should resolve to ../images/ue_libero_smart.png
    },
    {
        id: "836715", type: 'UE', marca: "LG", modello: "LIBERO SMART UE Dual High", codice_prodotto: "836715", articolo_fornitore: "836715",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 835.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: LIBERO SMART",
        image_url: getUeImageUrl("LG", "Compatibile con UI: LIBERO SMART") // Should resolve to ../images/ue_libero_smart.png
    },
    {
        id: "792716", type: 'UE', marca: "LG", modello: "LIBERO SMART UE Trial", codice_prodotto: "792716", articolo_fornitore: "792716",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1022.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: LIBERO SMART",
        image_url: getUeImageUrl("LG", "Compatibile con UI: LIBERO SMART") // Should resolve to ../images/ue_libero_smart.png
    },
    {
        id: "836718", type: 'UE', marca: "LG", modello: "LIBERO SMART UE Trial High", codice_prodotto: "836718", articolo_fornitore: "836718",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1485.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: LIBERO SMART",
        image_url: getUeImageUrl("LG", "Compatibile con UI: LIBERO SMART") // Should resolve to ../images/ue_libero_smart.png
    },
     // --- UI LG --- (Populated from data.js)
     {
        id: "681154", type: 'UI', marca: "LG", modello: "LIBERO SMART", codice_prodotto: "681154", articolo_fornitore: "S09EC.NSJS",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 173.00, wifi: "Sì",
        dimensioni_ui: "308X837X189", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("libero_smart")}.png`, note_compatibilita: null
     },
     {
        id: "681156", type: 'UI', marca: "LG", modello: "LIBERO SMART", codice_prodotto: "681156", articolo_fornitore: "S12EC.NSJS",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 184.00, wifi: "Sì",
        dimensioni_ui: "308X837X189", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("libero_smart")}.png`, note_compatibilita: null
     },

    // === SAMSUNG ===
    // --- UE ---
    {
        id: "681400", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 4kW", codice_prodotto: "681400", articolo_fornitore: "681400",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 733.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: WINDFREE AVANT",
        image_url: getUeImageUrl("SAMSUNG", "Compatibile con UI: WINDFREE AVANT") // Should resolve to ../images/ue_windfree_avant.png
    },
    {
        id: "681402", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 5kW", codice_prodotto: "681402", articolo_fornitore: "681402",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 923.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: WINDFREE AVANT",
        image_url: getUeImageUrl("SAMSUNG", "Compatibile con UI: WINDFREE AVANT") // Should resolve to ../images/ue_windfree_avant.png
    },
    {
        id: "681403", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 5.2kW", codice_prodotto: "681403", articolo_fornitore: "681403",
        potenza_kw: 5.2, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1102.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: WINDFREE AVANT",
        image_url: getUeImageUrl("SAMSUNG", "Compatibile con UI: WINDFREE AVANT") // Should resolve to ../images/ue_windfree_avant.png
    },
    {
        id: "680714", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 6.8kW", codice_prodotto: "680714", articolo_fornitore: "680714",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1461.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: WINDFREE AVANT",
        image_url: getUeImageUrl("SAMSUNG", "Compatibile con UI: WINDFREE AVANT") // Should resolve to ../images/ue_windfree_avant.png
    },
    {
        id: "682202", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 8kW", codice_prodotto: "682202", articolo_fornitore: "682202",
        potenza_kw: 8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1842.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: WINDFREE AVANT",
        image_url: getUeImageUrl("SAMSUNG", "Compatibile con UI: WINDFREE AVANT") // Should resolve to ../images/ue_windfree_avant.png
    },
    {
        id: "682461", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 10kW", codice_prodotto: "682461", articolo_fornitore: "682461",
        potenza_kw: 10, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 2338.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: WINDFREE AVANT",
        image_url: getUeImageUrl("SAMSUNG", "Compatibile con UI: WINDFREE AVANT") // Should resolve to ../images/ue_windfree_avant.png
    },
    // --- UI SAMSUNG --- (Populated from data.js)
     {
        id: "878437", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878437", articolo_fornitore: "AR70F07C1AWNEU",
        potenza_kw: 2.0, potenza_btu: 7000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 280.00, wifi: "Sì",
        dimensioni_ui: "229x889x215", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
      {
        id: "878438", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878438", articolo_fornitore: "AR70F09C1AWNEU",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 333.00, wifi: "Sì",
        dimensioni_ui: "229x889x215", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
     {
        id: "878439", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878439", articolo_fornitore: "AR70F12C1AWNEU",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 368.00, wifi: "Sì",
        dimensioni_ui: "229x889x215", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
     {
        id: "878441", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878441", articolo_fornitore: "AR70F18C1AWNEU",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 584.00, wifi: "Sì",
        dimensioni_ui: "299x1055x215", peso_ui: 12, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
     {
        id: "878442", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878442", articolo_fornitore: "AR70F24C1AWNEU",
        potenza_kw: 7.0, potenza_btu: 24000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 683.00, wifi: "Sì",
        dimensioni_ui: "299x1055x215", peso_ui: 12, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },


    // === DAIKIN ===
    // --- UE ---
    {
        id: "822100", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 4kW", codice_prodotto: "822100", articolo_fornitore: "822100",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 942.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SENSIRA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: SENSIRA") // Should resolve to ../images/ue_sensira.png
    },
    {
        id: "835927", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 5kW", codice_prodotto: "835927", articolo_fornitore: "835927",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1140.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SENSIRA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: SENSIRA") // Should resolve to ../images/ue_sensira.png
    },
    {
        id: "835928", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 5.2kW", codice_prodotto: "835928", articolo_fornitore: "835928",
        potenza_kw: 5.2, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1412.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SENSIRA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: SENSIRA") // Should resolve to ../images/ue_sensira.png
    },
    {
        id: "835930", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 6.8kW", codice_prodotto: "835930", articolo_fornitore: "835930",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1883.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SENSIRA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: SENSIRA") // Should resolve to ../images/ue_sensira.png
    },
    {
        id: "799633", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 4kW Dual", codice_prodotto: "799633", articolo_fornitore: "799633",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1168.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
    {
        id: "799634", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 5kW Dual", codice_prodotto: "799634", articolo_fornitore: "799634",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1340.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
    {
        id: "799636", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 6.8kW Dual", codice_prodotto: "799636", articolo_fornitore: "799636",
        potenza_kw: 6.8, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1755.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
    {
        id: "799638", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 4kW Trial", codice_prodotto: "799638", articolo_fornitore: "799638",
        potenza_kw: 4, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1567.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
    {
        id: "799639", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 5.2kW Trial", codice_prodotto: "799639", articolo_fornitore: "799639",
        potenza_kw: 5.2, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1848.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
    {
        id: "799640", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 6.8kW Trial", codice_prodotto: "799640", articolo_fornitore: "799640",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 2209.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
    {
        id: "799641", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 6.8kW Poker", codice_prodotto: "799641", articolo_fornitore: "799641",
        potenza_kw: 6.8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2577.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
     {
        id: "799642", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 8kW Poker", codice_prodotto: "799642", articolo_fornitore: "799642",
        potenza_kw: 8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2949.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
     {
        id: "799643", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 9kW Penta", codice_prodotto: "799643", articolo_fornitore: "799643",
        potenza_kw: 9, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 3505.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: PERFERA, EMURA",
        image_url: getUeImageUrl("DAIKIN", "Compatibile con UI: PERFERA, EMURA") // Ambiguo -> Generic
    },
     // --- UI DAIKIN MANCANTI ---
     // !! AGGIUNGERE QUI I DATI DELLE UI DAIKIN (SENSIRA, PERFERA, EMURA) (CODICE, PREZZO) !!
     /* Esempio struttura:
     {
        id: "883307_UI", type: 'UI', marca: "DAIKIN", modello: "SENSIRA", codice_prodotto: "883307_UI", articolo_fornitore: "FTXF25E", // Articolo UI
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: ---.??, wifi: "Sì", // Trovare prezzo UI singola
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("sensira")}.png`, note_compatibilita: null
     },
      {
        id: "836193_UI", type: 'UI', marca: "DAIKIN", modello: "PERFERA", codice_prodotto: "836193_UI", articolo_fornitore: "FTXM25A", // Articolo UI
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: ---.??, wifi: "Sì", // Trovare prezzo UI singola
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("perfera")}.png`, note_compatibilita: null
     },
     {
        id: "774561_UI", type: 'UI', marca: "DAIKIN", modello: "EMURA", codice_prodotto: "774561_UI", articolo_fornitore: "FTXJ25A", // Articolo UI
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: ---.??, wifi: "Sì", // Trovare prezzo UI singola
        dimensioni_ui: null, peso_ui: null, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("emura")}.png`, note_compatibilita: null
     },
     // ... aggiungere altre potenze per ciascun modello ...
     */

    // === IMMERGAS ===
    // --- UE ---
    {
        id: "842416", type: 'UE', marca: "IMMERGAS", modello: "THOR UE Dual", codice_prodotto: "842416", articolo_fornitore: "842416",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 534.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: THOR",
        image_url: getUeImageUrl("IMMERGAS", "Compatibile con UI: THOR") // Should resolve to ../images/ue_thor.png
    },
    {
        id: "844244", type: 'UE', marca: "IMMERGAS", modello: "THOR UE Trial", codice_prodotto: "844244", articolo_fornitore: "844244",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 749.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: THOR",
        image_url: getUeImageUrl("IMMERGAS", "Compatibile con UI: THOR") // Should resolve to ../images/ue_thor.png
    },
     // --- UI IMMERGAS --- (Populated from data.js)
     {
        id: "842199", type: 'UI', marca: "IMMERGAS", modello: "THOR", codice_prodotto: "842199", articolo_fornitore: "3.035.031",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 133.00, wifi: "No",
        dimensioni_ui: "292x729x204", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("thor")}.png`, note_compatibilita: null
     },
      {
        id: "842200", type: 'UI', marca: "IMMERGAS", modello: "THOR", codice_prodotto: "842200", articolo_fornitore: "3.035.033",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 142.00, wifi: "No",
        dimensioni_ui: "296x805x205", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("thor")}.png`, note_compatibilita: null
     },

    // === TOSHIBA ===
    // --- UE ---
     {
        id: "604322", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Dual", codice_prodotto: "604322", articolo_fornitore: "604322",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 758.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC",
        image_url: getUeImageUrl("TOSHIBA", "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC") // Ambiguo -> Generic
    },
     {
        id: "604581", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Dual High", codice_prodotto: "604581", articolo_fornitore: "604581",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 978.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC",
        image_url: getUeImageUrl("TOSHIBA", "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC") // Ambiguo -> Generic
    },
    {
        id: "602581", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Trial", codice_prodotto: "602581", articolo_fornitore: "602581",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1245.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC",
        image_url: getUeImageUrl("TOSHIBA", "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC") // Ambiguo -> Generic
    },
     {
        id: "604324", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Trial High", codice_prodotto: "604324", articolo_fornitore: "604324",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1556.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC",
        image_url: getUeImageUrl("TOSHIBA", "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC") // Ambiguo -> Generic
    },
    {
        id: "602582", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Poker", codice_prodotto: "602582", articolo_fornitore: "602582",
        potenza_kw: null, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2025.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC",
        image_url: getUeImageUrl("TOSHIBA", "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC") // Ambiguo -> Generic
    },
     // --- UI TOSHIBA --- (Populated from data.js)
     {
        id: "814569", type: 'UI', marca: "TOSHIBA", modello: "SHORAI EDGE", codice_prodotto: "814569", articolo_fornitore: "RAS-07J2AVSG",
        potenza_kw: 2.0, potenza_btu: 7000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 325.00, wifi: "Sì",
        dimensioni_ui: "293x800x226", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("shorai_edge")}.png`, note_compatibilita: null
     },
      {
        id: "812538", type: 'UI', marca: "TOSHIBA", modello: "SHORAI EDGE", codice_prodotto: "812538", articolo_fornitore: "RAS-10J2AVSG",
        potenza_kw: 2.5, potenza_btu: 10000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 348.00, wifi: "Sì",
        dimensioni_ui: "293x800x226", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("shorai_edge")}.png`, note_compatibilita: null
     },
     {
        id: "814570", type: 'UI', marca: "TOSHIBA", modello: "SHORAI EDGE", codice_prodotto: "814570", articolo_fornitore: "RAS-13J2AVSG",
        potenza_kw: 3.5, potenza_btu: 13000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 399.00, wifi: "Sì",
        dimensioni_ui: "293x800x226", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("shorai_edge")}.png`, note_compatibilita: null
     },
      {
        id: "754979", type: 'UI', marca: "TOSHIBA", modello: "SEIYA CLASSIC", codice_prodotto: "754979", articolo_fornitore: "RAS-B10B2KVG",
        potenza_kw: 2.5, potenza_btu: 10000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 166.00, wifi: "No",
        dimensioni_ui: "288x770x225", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("seiya_classic")}.png`, note_compatibilita: null
     },
     {
        id: "754980", type: 'UI', marca: "TOSHIBA", modello: "SEIYA CLASSIC", codice_prodotto: "754980", articolo_fornitore: "RAS-B13B2KVG",
        potenza_kw: 3.5, potenza_btu: 13000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 199.00, wifi: "No",
        dimensioni_ui: "288x770x225", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("seiya_classic")}.png`, note_compatibilita: null
     },

    // === HITACHI ===
    // --- UE ---
     {
        id: "844136", type: 'UE', marca: "HITACHI", modello: "AIR HOME 400 UE 4.3kW", codice_prodotto: "844136", articolo_fornitore: "844136",
        potenza_kw: 4.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 656.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AIR HOME 400",
        image_url: getUeImageUrl("HITACHI", "Compatibile con UI: AIR HOME 400") // Should resolve to ../images/ue_air_home_400.png
    },
    {
        id: "844248", type: 'UE', marca: "HITACHI", modello: "AIR HOME 400 UE 5.5kW Dual", codice_prodotto: "844248", articolo_fornitore: "844248",
        potenza_kw: 5.5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 744.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AIR HOME 400",
        image_url: getUeImageUrl("HITACHI", "Compatibile con UI: AIR HOME 400") // Should resolve to ../images/ue_air_home_400.png
    },
    {
        id: "855738", type: 'UE', marca: "HITACHI", modello: "AIR HOME 400 UE 5.5kW Trial", codice_prodotto: "855738", articolo_fornitore: "855738",
        potenza_kw: 5.5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1006.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: AIR HOME 400",
        image_url: getUeImageUrl("HITACHI", "Compatibile con UI: AIR HOME 400") // Should resolve to ../images/ue_air_home_400.png
    },
    // --- UI HITACHI --- (Populated from data.js)
     {
        id: "838081", type: 'UI', marca: "HITACHI", modello: "AIR HOME 400", codice_prodotto: "838081", articolo_fornitore: "RAK-DJ25PHAE",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 136.00, wifi: "Sì",
        dimensioni_ui: "280x780x222", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("air_home_400")}.png`, note_compatibilita: null
     },
      {
        id: "838082", type: 'UI', marca: "HITACHI", modello: "AIR HOME 400", codice_prodotto: "838082", articolo_fornitore: "RAK-DJ35PHAE",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 150.00, wifi: "Sì",
        dimensioni_ui: "280x780x222", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("air_home_400")}.png`, note_compatibilita: null
     },
      {
        id: "838083", type: 'UI', marca: "HITACHI", modello: "AIR HOME 400", codice_prodotto: "838083", articolo_fornitore: "RAK-DJ50PHAE",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 211.00, wifi: "Sì",
        dimensioni_ui: "280x780x222", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("air_home_400")}.png`, note_compatibilita: null
     },


    // === VIESSMANN ===
    // --- UE ---
     {
        id: "760111", type: 'UE', marca: "VIESSMANN", modello: "VITOCLIMA 232S UE 5.3kW", codice_prodotto: "760111", articolo_fornitore: "760111",
        potenza_kw: 5.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 850.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: VITOCLIMA 232",
        image_url: getUeImageUrl("VIESSMANN", "Compatibile con UI: VITOCLIMA 232") // Should resolve to ../images/ue_vitoclima_232.png
    },
    {
        id: "769229", type: 'UE', marca: "VIESSMANN", modello: "VITOCLIMA 232S UE 6.1kW", codice_prodotto: "769229", articolo_fornitore: "769229",
        potenza_kw: 6.1, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1143.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: VITOCLIMA 232",
        image_url: getUeImageUrl("VIESSMANN", "Compatibile con UI: VITOCLIMA 232") // Should resolve to ../images/ue_vitoclima_232.png
    },
    {
        id: "765905", type: 'UE', marca: "VIESSMANN", modello: "VITOCLIMA 232S UE 8.2kW", codice_prodotto: "765905", articolo_fornitore: "765905",
        potenza_kw: 8.2, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1170.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, note_compatibilita: "Compatibile con UI: VITOCLIMA 232",
        image_url: getUeImageUrl("VIESSMANN", "Compatibile con UI: VITOCLIMA 232") // Should resolve to ../images/ue_vitoclima_232.png
    },
     // --- UI VIESSMANN MANCANTI ---
     // !! AGGIUNGERE QUI I DATI DELLE UI VIESSMANN VITOCLIMA 232 (CODICE, PREZZO) !!
     // I prezzi UI non sono facilmente deducibili da data.js per Viessmann
     /* Esempio struttura:
      {
        id: "CODICE_VIE_UI_9K", type: 'UI', marca: "VIESSMANN", modello: "VITOCLIMA 232", codice_prodotto: "...", articolo_fornitore: "...",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: ---.??, wifi: "Sì", // Trovare prezzo UI singola
        dimensioni_ui: "290x865x210", peso_ui: 11, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("vitoclima_232")}.png`, note_compatibilita: null
     },
      {
        id: "CODICE_VIE_UI_12K", type: 'UI', marca: "VIESSMANN", modello: "VITOCLIMA 232", codice_prodotto: "...", articolo_fornitore: "...",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: ---.??, wifi: "Sì", // Trovare prezzo UI singola
        dimensioni_ui: "290x865x210", peso_ui: 11, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("vitoclima_232")}.png`, note_compatibilita: null
     },
      {
        id: "CODICE_VIE_UI_18K", type: 'UI', marca: "VIESSMANN", modello: "VITOCLIMA 232", codice_prodotto: "...", articolo_fornitore: "...",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: ---.??, wifi: "Sì", // Trovare prezzo UI singola
        dimensioni_ui: "290x865x210", peso_ui: 13, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("vitoclima_232")}.png`, note_compatibilita: null
     },
     */

]; // <-- FINE ARRAY multiProducts

// Helper function per ottenere path logo
function getLogoPathMulti(brand) {
    if (!brand) return '../images/logos/placeholder_logo.png';
    const safeBrandName = brand.toLowerCase().replace(/\s+/g, '');
    // Path relativo da multisplit/ a images/logos/
    return `../images/logos/${safeBrandName}.png`;
}

// Helper per formattare prezzo
function formatPriceMulti(price) {
     if (price === null || price === undefined || price === '') { return 'N/D'; }
     let numericPrice = NaN;
     if (typeof price === 'number') { numericPrice = price; }
     else if (typeof price === 'string') {
         try {
             // Pulisci prezzo: rimuovi '€', spazi, normalizza separatori (tratta . come migliaia, , come decimale)
             const cleanedPrice = price.replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
             numericPrice = parseFloat(cleanedPrice);
         } catch (e) { console.warn(`Error parsing price string: ${price}`, e); }
     }
     if (!isNaN(numericPrice)) {
         return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericPrice);
     } else { return 'N/D';     }
 }
// --- END OF FILE multi_data.js ---