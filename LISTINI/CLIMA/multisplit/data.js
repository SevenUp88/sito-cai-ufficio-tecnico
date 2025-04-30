// File: data.js
// Dati Monosplit con percorsi relativi alla cartella 'multisplit/'

const products = [
    // === HAIER ===
    {
        id: 1,
        marca: "HAIER",
        modello: "REVIVE",
        potenza: "2,5kW - 9000BTU",
        prezzo: 301.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "835682",
        articolo_fornitore: null,
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://drive.google.com/file/d/1Pbhd5ObgVUBuyvefknmYhlKM8oWyCGel/view?usp=drive_link",
        image_url: "../images/revive.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 2,
        marca: "HAIER",
        modello: "REVIVE",
        potenza: "3,5kW - 12000BTU",
        prezzo: 340.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "835686",
        articolo_fornitore: null,
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://drive.google.com/file/d/1Pbhd5ObgVUBuyvefknmYhlKM8oWyCGel/view?usp=drive_link",
        image_url: "../images/revive.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 3,
        marca: "HAIER",
        modello: "REVIVE",
        potenza: "5,0kW - 18000BTU",
        prezzo: 591.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "835687",
        articolo_fornitore: null,
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://drive.google.com/file/d/1Pbhd5ObgVUBuyvefknmYhlKM8oWyCGel/view?usp=drive_link",
        image_url: "../images/revive.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 4, // Combinazione PEARL 9k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "2,5kW - 9000BTU",
        prezzo: 456.00, // Somma 310 + 146
        prezzo_ui: 146.00, // Aggiunto per riferimento
        prezzo_ue: 310.00, // Aggiunto per riferimento
        wifi: "Sì",
        dimensioni_ui: "290x805x200", dimensioni_ue: "544x700x245", peso_ui: 8, peso_ue: 23,
        codice_prodotto: "UI: 836088 / UE: 836091",
        articolo_fornitore: "UI: AS25PBAHRA / UE: 1U25YEGFRA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 5, // Combinazione PEARL 12k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "3,5kW - 12000BTU",
        prezzo: 513.00, // Somma 347 + 166
        prezzo_ui: 166.00, // Aggiunto
        prezzo_ue: 347.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "290x805x200", dimensioni_ue: "544x700x245", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 836090 / UE: 836094",
        articolo_fornitore: "UI: AS35PBAHRA / UE: 1U35YEGFRA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 6, // Combinazione PEARL 18k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "5,0kW - 18000BTU",
        prezzo: 793.00, // Somma 534 + 259
        prezzo_ui: 259.00, // Aggiunto
        prezzo_ue: 534.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "320x975x220", dimensioni_ue: "553x800x275", peso_ui: 12, peso_ue: 33,
        codice_prodotto: "UI: 764459 / UE: 764467",
        articolo_fornitore: "UI: AS50PDAHRA / UE: 1U50MEGFRA",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 7, // Combinazione PEARL 24k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "7,0kW - 24000BTU",
        prezzo: 1040.00, // Somma 687 + 353
        prezzo_ui: 353.00, // Aggiunto
        prezzo_ue: 687.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "320x975x220", dimensioni_ue: "553x800x275", peso_ui: 12, peso_ue: 44,
        codice_prodotto: "UI: 783641 / UE: 783648",
        articolo_fornitore: "UI: AS68PDAHRA / UE: 1U68WEGFRA",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 8, // Combinazione FLEXIS 9k
        marca: "HAIER",
        modello: "FLEXIS",
        potenza: "2,5kW - 9000BTU",
        prezzo: 682.00, // Somma 391 + 291
        prezzo_ui: 291.00, // Aggiunto
        prezzo_ue: 391.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "300x856x197", dimensioni_ue: "553x800x275", peso_ui: 10, peso_ue: 30,
        codice_prodotto: "UI: 732350 / UE: 644831",
        articolo_fornitore: "UI: AS25S2SF1FA-MW3 / UE: 1U25S2SM1FA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11185/d-1/t-file/FLEXIS-PLUS-monosplit.pdf",
        image_url: "../images/flexis.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    {
        id: 9, // Combinazione FLEXIS 12k
        marca: "HAIER",
        modello: "FLEXIS",
        potenza: "3,5kW - 12000BTU",
        prezzo: 748.00, // Somma 432 + 316
        prezzo_ui: 316.00, // Aggiunto
        prezzo_ue: 432.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "300x856x197", dimensioni_ue: "553x800x275", peso_ui: 10, peso_ue: 30,
        codice_prodotto: "UI: 736328 / UE: 653075",
        articolo_fornitore: "UI: AS35S2SF1FA-MW3 / UE: 1U35S2SM1FA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11185/d-1/t-file/FLEXIS-PLUS-monosplit.pdf",
        image_url: "../images/flexis.png", // Path relativo corretto
        tipo: "Monosplit"
    },

    // === MITSUBISHI ===
     {
        id: 10,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "2,5kW - 9000BTU",
        prezzo: 455.00, // Somma 266 + 189
        prezzo_ui: 189.00, // Aggiunto
        prezzo_ue: 266.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "538x699x249", peso_ui: 9, peso_ue: 23,
        codice_prodotto: "UI: 760295 / UE: 716679",
        articolo_fornitore: "UI: MSZ-HR25VF / UE: MUZ-HR25VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 11,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "3,5kW - 12000BTU",
        prezzo: 552.00, // Somma 339 + 213
        prezzo_ui: 213.00, // Aggiunto
        prezzo_ue: 339.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "538x699x249", peso_ui: 9, peso_ue: 24,
        codice_prodotto: "UI: 760296 / UE: 716682",
        articolo_fornitore: "UI: MSZ-HR35VF / UE: MUZ-HR35VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 12,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "4,2kW - 15000BTU",
        prezzo: 715.00, // Somma 448 + 267
        prezzo_ui: 267.00, // Aggiunto
        prezzo_ue: 448.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "550x800x285", peso_ui: 9, peso_ue: 34,
        codice_prodotto: "UI: 679857 / UE: 679860",
        articolo_fornitore: "UI: MSZ-HR42VF / UE: MUZ-HR42VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 13,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "5,0kW - 18000BTU",
        prezzo: 811.00, // Somma 514 + 297
        prezzo_ui: 297.00, // Aggiunto
        prezzo_ue: 514.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "550x800x285", peso_ui: 9, peso_ue: 35,
        codice_prodotto: "UI: 667317 / UE: 716843",
        articolo_fornitore: "UI: MSZ-HR50VF / UE: MUZ-HR50VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 14,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "6,0kW - 21000BTU",
        prezzo: 1050.00, // Somma 634 + 416
        prezzo_ui: 416.00, // Aggiunto
        prezzo_ue: 634.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "305x923x263", dimensioni_ue: "714x800x285", peso_ui: 13, peso_ue: 40,
        codice_prodotto: "UI: 714644 / UE: 714645",
        articolo_fornitore: "UI: MSZ-HR60VF / UE: MUZ-HR60VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 15,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "7,1kW - 24000BTU",
        prezzo: 1336.00, // Somma 797 + 539
        prezzo_ui: 539.00, // Aggiunto
        prezzo_ue: 797.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "305x923x263", dimensioni_ue: "714x800x285", peso_ui: 13, peso_ue: 40,
        codice_prodotto: "UI: 708752 / UE: 708753",
        articolo_fornitore: "UI: MSZ-HR71VF / UE: MUZ-HR71VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 16,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "2,0kW - 7000BTU",
        prezzo: 832.00, // Somma 462 + 370
        prezzo_ui: 370.00, // Aggiunto
        prezzo_ue: 462.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "250x760x199", dimensioni_ue: "550x800x285", peso_ui: 9, peso_ue: 28,
        codice_prodotto: "UI: 834032 / UE: 834443",
        articolo_fornitore: "UI: MSZ-AY20VGKP / UE: MUZ-AY20VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 17,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "2,5kW - 9000BTU",
        prezzo: 877.00, // Somma 470 + 407
        prezzo_ui: 407.00, // Aggiunto
        prezzo_ue: 470.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "550x800x285", peso_ui: 11, peso_ue: 28,
        codice_prodotto: "UI: 801940 / UE: 802160",
        articolo_fornitore: "UI: MSZ-AY25VGKP / UE: MUZ-AY25VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 18,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "3,5kW - 12000BTU",
        prezzo: 999.00, // Somma 580 + 419
        prezzo_ui: 419.00, // Aggiunto
        prezzo_ue: 580.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "550x800x285", peso_ui: 11, peso_ue: 29,
        codice_prodotto: "UI: 801936 / UE: 802161",
        articolo_fornitore: "UI: MSZ-AY35VGKP / UE: MUZ-AY35VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 19,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "4,2kW - 15000BTU",
        prezzo: 1194.00, // Somma 728 + 466
        prezzo_ui: 466.00, // Aggiunto
        prezzo_ue: 728.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "550x800x285", peso_ui: 11, peso_ue: 34,
        codice_prodotto: "UI: 813624 / UE: 813622",
        articolo_fornitore: "UI: MSZ-AY42VGKP / UE: MUZ-AY42VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 20,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1359.00, // Somma 860 + 499
        prezzo_ui: 499.00, // Aggiunto
        prezzo_ue: 860.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "714x800x285", peso_ui: 11, peso_ue: 41,
        codice_prodotto: "UI: 800724 / UE: 800726",
        articolo_fornitore: "UI: MSZ-AY50VGKP / UE: MUZ-AY50VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 21,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE STYLE",
        potenza: "2,5kW - 9000BTU",
        prezzo: 1122.00, // Somma 613 + 509
        prezzo_ui: 509.00, // Aggiunto
        prezzo_ue: 613.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "307x890x233", dimensioni_ue: "550x800x285", peso_ui: 16, peso_ue: 35,
        codice_prodotto: "UI: 714755 / UE: 747052",
        articolo_fornitore: "UI: MSZ-LN25VG2V / UE: MUZ-LN25VG2",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-LN%20-%20191124.pdf",
        image_url: "../images/kirigamine_style.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 22,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE STYLE",
        potenza: "3,5kW - 12000BTU",
        prezzo: 1316.00, // Somma 767 + 549
        prezzo_ui: 549.00, // Aggiunto
        prezzo_ue: 767.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "307x890x233", dimensioni_ue: "550x800x285", peso_ui: 16, peso_ue: 35,
        codice_prodotto: "UI: 714757 / UE: 708362",
        articolo_fornitore: "UI: MSZ-LN35VG2V / UE: MUZ-LN35VG2",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-LN%20-%20191124.pdf",
        image_url: "../images/kirigamine_style.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 23,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE STYLE",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1776.00, // Somma 1102 + 674
        prezzo_ui: 674.00, // Aggiunto
        prezzo_ue: 1102.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "307x890x233", dimensioni_ue: "714x800x285", peso_ui: 16, peso_ue: 40,
        codice_prodotto: "UI: 687306 / UE: 722800",
        articolo_fornitore: "UI: MSZ-LN50VG2V / UE: MUZ-LN50VG2",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-LN%20-%20191124.pdf",
        image_url: "../images/kirigamine_style.png", // Path relativo corretto
        tipo: "Monosplit"
    },
      {
        id: 24,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "2,5kW - 9000BTU",
        prezzo: 955.00, // Somma 512 + 443
        prezzo_ui: 443.00, // Aggiunto
        prezzo_ue: 512.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "550x800x285", peso_ui: 12, peso_ue: 31,
        codice_prodotto: "UI: 688038 / UE: 651606",
        articolo_fornitore: "UI: MSZ-EF25VGK / UE: MUZ-EF25VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 25,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "3,5kW - 12000BTU",
        prezzo: 1116.00, // Somma 649 + 467
        prezzo_ui: 467.00, // Aggiunto
        prezzo_ue: 649.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "550x800x285", peso_ui: 12, peso_ue: 34,
        codice_prodotto: "UI: 686747 / UE: 649516",
        articolo_fornitore: "UI: MSZ-EF35VGK / UE: MUZ-EF35VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 26,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "4,2kW - 15000BTU",
        prezzo: 1306.00, // Somma 786 + 520
        prezzo_ui: 520.00, // Aggiunto
        prezzo_ue: 786.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "714x800x285", peso_ui: 12, peso_ue: 35,
        codice_prodotto: "UI: 688063 / UE: 682951",
        articolo_fornitore: "UI: MSZ-EF42VGK / UE: MUZ-EF42VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 27,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1486.00, // Somma 927 + 559
        prezzo_ui: 559.00, // Aggiunto
        prezzo_ue: 927.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "714x800x285", peso_ui: 12, peso_ue: 40,
        codice_prodotto: "UI: 691046 / UE: 734588",
        articolo_fornitore: "UI: MSZ-EF50VGK / UE: MUZ-EF50VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // Path relativo corretto
        tipo: "Monosplit"
    },

    // === DAIKIN ===
      {
        id: 28,
        marca: "DAIKIN",
        modello: "SENSIRA",
        potenza: "2,0kW - 7000BTU",
        prezzo: 486.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "883305",
        articolo_fornitore: "RXF20E + FTXF20E",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 29,
        marca: "DAIKIN",
        modello: "SENSIRA",
        potenza: "2,5kW - 9000BTU",
        prezzo: 503.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "883307",
        articolo_fornitore: "RXF25E + FTXF25E",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 30,
        marca: "DAIKIN",
        modello: "SENSIRA",
        potenza: "3,5kW - 12000BTU",
        prezzo: 575.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "883310",
        articolo_fornitore: "RXF35E + FTXF35E",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 31,
        marca: "DAIKIN",
        modello: "SENSIRA",
        potenza: "4,2kW - 15000BTU",
        prezzo: 693.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "883313",
        articolo_fornitore: "RXF42E + FTXF42E",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 32,
        marca: "DAIKIN",
        modello: "SENSIRA",
        potenza: "5,0kW - 18000BTU",
        prezzo: 957.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "883314",
        articolo_fornitore: "RXF50E + FTXF50E",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 33,
        marca: "DAIKIN",
        modello: "PERFERA",
        potenza: "2,0kW - 7000BTU",
        prezzo: 928.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "836191",
        articolo_fornitore: "RXM20A + FTXM20A",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 34,
        marca: "DAIKIN",
        modello: "PERFERA",
        potenza: "2,5kW - 9000BTU",
        prezzo: 1026.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "836193",
        articolo_fornitore: "RXM25A + FTXM25A",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 35,
        marca: "DAIKIN",
        modello: "PERFERA",
        potenza: "3,5kW - 12000BTU",
        prezzo: 1187.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "836198",
        articolo_fornitore: "RXM35A + FTXM35A",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 36,
        marca: "DAIKIN",
        modello: "PERFERA",
        potenza: "4,2kW - 15000BTU",
        prezzo: 1438.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "836200",
        articolo_fornitore: "RXM42A + FTXM42A",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 37,
        marca: "DAIKIN",
        modello: "PERFERA",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1751.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "835557",
        articolo_fornitore: "RXM50A + FTXM50A",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 38,
        marca: "DAIKIN",
        modello: "EMURA",
        potenza: "2,0kW - 7000BTU",
        prezzo: 1312.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "786615",
        articolo_fornitore: "RXJ20A + FTXJ20A",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.eu/content/dam/document-library/catalogues/ac/split/Daikin%20Emura%203_Product%20profile_ECPIT22-003_Italian.pdf",
        image_url: "../images/emura.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 39,
        marca: "DAIKIN",
        modello: "EMURA",
        potenza: "2,5kW - 9000BTU",
        prezzo: 1379.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "774561",
        articolo_fornitore: "RXJ25A + FTXJ25A",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.eu/content/dam/document-library/catalogues/ac/split/Daikin%20Emura%203_Product%20profile_ECPIT22-003_Italian.pdf",
        image_url: "../images/emura.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 40,
        marca: "DAIKIN",
        modello: "EMURA",
        potenza: "3,5kW - 12000BTU",
        prezzo: 1560.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "774563",
        articolo_fornitore: "RXJ35A + FTXJ35A",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.eu/content/dam/document-library/catalogues/ac/split/Daikin%20Emura%203_Product%20profile_ECPIT22-003_Italian.pdf",
        image_url: "../images/emura.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 41,
        marca: "DAIKIN",
        modello: "EMURA",
        potenza: "4,2kW - 15000BTU",
        prezzo: 1966.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "807987",
        articolo_fornitore: "RXJ42A + FTXJ42A",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.daikin.eu/content/dam/document-library/catalogues/ac/split/Daikin%20Emura%203_Product%20profile_ECPIT22-003_Italian.pdf",
        image_url: "../images/emura.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 42,
        marca: "DAIKIN",
        modello: "EMURA",
        potenza: "5,0kW - 18000BTU",
        prezzo: 2377.00,
        wifi: "Sì",
        dimensioni_ui: null, dimensioni_ue: null, peso_ui: null, peso_ue: null,
        codice_prodotto: "774220",
        articolo_fornitore: "RXJ50A + FTXJ50A",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.daikin.eu/content/dam/document-library/catalogues/ac/split/Daikin%20Emura%203_Product%20profile_ECPIT22-003_Italian.pdf",
        image_url: "../images/emura.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    // === LG ===
     {
        id: 43,
        marca: "LG",
        modello: "LIBERO SMART",
        potenza: "2,5kW - 9000BTU",
        prezzo: 458.00, // Somma 285 + 173
        prezzo_ui: 173.00, // Aggiunto
        prezzo_ue: 285.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "308X837X189", dimensioni_ue: "495X717X230", peso_ui: 9, peso_ue: 25,
        codice_prodotto: "UI: 681154 / UE: 799931",
        articolo_fornitore: "UI: S09EC.NSJS / UE: S09EC.UA3S",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://drive.google.com/file/d/17h8ICBGw6RrYdryPgWXCs2Gh48LE0Kjb/view?usp=sharing",
        image_url: "../images/libero_smart.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 44,
        marca: "LG",
        modello: "LIBERO SMART",
        potenza: "3,5kW - 12000BTU",
        prezzo: 497.00, // Somma 313 + 184
        prezzo_ui: 184.00, // Aggiunto
        prezzo_ue: 313.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "308X837X189", dimensioni_ue: "495X717X230", peso_ui: 9, peso_ue: 25,
        codice_prodotto: "UI: 681156 / UE: 764408",
        articolo_fornitore: "UI: S12EC.NSJS / UE: S12EC.UA3S",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://drive.google.com/file/d/17h8ICBGw6RrYdryPgWXCs2Gh48LE0Kjb/view?usp=sharing",
        image_url: "../images/libero_smart.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    // === HITACHI ===
     {
        id: 45,
        marca: "HITACHI",
        modello: "AIR HOME 400",
        potenza: "2,5kW - 9000BTU",
        prezzo: 426.00, // Somma 290 + 136
        prezzo_ui: 136.00, // Aggiunto
        prezzo_ue: 290.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "280x780x222", dimensioni_ue: "530x660x278", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 838081 / UE: 838085",
        articolo_fornitore: "UI: RAK-DJ25PHAE / UE: RAC-DJ25PHAE",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.hitachiaircon.com/it/download_datatable/93",
        image_url: "../images/air_home_400.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 46,
        marca: "HITACHI",
        modello: "AIR HOME 400",
        potenza: "3,5kW - 12000BTU",
        prezzo: 518.00, // Somma 368 + 150
        prezzo_ui: 150.00, // Aggiunto
        prezzo_ue: 368.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "280x780x222", dimensioni_ue: "530x660x278", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 838082 / UE: 838087",
        articolo_fornitore: "UI: RAK-DJ35PHAE / UE: RAC-DJ35PHAE",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.hitachiaircon.com/it/download_datatable/93",
        image_url: "../images/air_home_400.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 47,
        marca: "HITACHI",
        modello: "AIR HOME 400",
        potenza: "5,0kW - 18000BTU",
        prezzo: 868.00, // Somma 657 + 211
        prezzo_ui: 211.00, // Aggiunto
        prezzo_ue: 657.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "280x780x222", dimensioni_ue: "600x792x299", peso_ui: 8, peso_ue: 40,
        codice_prodotto: "UI: 838083 / UE: 838088",
        articolo_fornitore: "UI: RAK-DJ50PHAE / UE: RAC-DJ50PHAE",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.hitachiaircon.com/it/download_datatable/93",
        image_url: "../images/air_home_400.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    // === TOSHIBA ===
     {
        id: 48,
        marca: "TOSHIBA",
        modello: "SHORAI EDGE",
        potenza: "2,0kW - 7000BTU",
        prezzo: 749.00, // Somma 424 + 325
        prezzo_ui: 325.00, // Aggiunto
        prezzo_ue: 424.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "293x800x226", dimensioni_ue: "550x780x290", peso_ui: 10, peso_ue: 26,
        codice_prodotto: "UI: 814569 / UE: 677994",
        articolo_fornitore: "UI: RAS-07J2AVSG / UE: RAS-B07G3KVSG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/shorai_edge_black_white/dati-tecnici-shorai-edge-black-white/tech-sheet-ajax?sheet=0",
        image_url: "../images/shorai_edge.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 49,
        marca: "TOSHIBA",
        modello: "SHORAI EDGE",
        potenza: "2,5kW - 10000BTU",
        prezzo: 803.00, // Somma 455 + 348
        prezzo_ui: 348.00, // Aggiunto
        prezzo_ue: 455.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "293x800x226", dimensioni_ue: "550x780x290", peso_ui: 10, peso_ue: 26,
        codice_prodotto: "UI: 812538 / UE: 678015",
        articolo_fornitore: "UI: RAS-10J2AVSG / UE: RAS-B10G3KVSG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/shorai_edge_black_white/dati-tecnici-shorai-edge-black-white/tech-sheet-ajax?sheet=0",
        image_url: "../images/shorai_edge.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 50,
        marca: "TOSHIBA",
        modello: "SHORAI EDGE",
        potenza: "3,5kW - 13000BTU",
        prezzo: 955.00, // Somma 556 + 399
        prezzo_ui: 399.00, // Aggiunto
        prezzo_ue: 556.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "293x800x226", dimensioni_ue: "550x780x290", peso_ui: 10, peso_ue: 30,
        codice_prodotto: "UI: 814570 / UE: 716115",
        articolo_fornitore: "UI: RAS-13J2AVSG / UE: RAS-B13G3KVSG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/shorai_edge_black_white/dati-tecnici-shorai-edge-black-white/tech-sheet-ajax?sheet=0",
        image_url: "../images/shorai_edge.png", // Path relativo corretto
        tipo: "Monosplit"
    },
    // === NUOVI ARTICOLI DA CSV (già presenti nell'originale) ===
     {
        id: 51,
        marca: "TOSHIBA",
        modello: "SEIYA CLASSIC",
        potenza: "2,5kW - 10000BTU",
        prezzo: 414.00, // Somma 248 + 166
        prezzo_ui: 166.00, // Aggiunto
        prezzo_ue: 248.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "288x770x225", dimensioni_ue: "530x660x240", peso_ui: 9, peso_ue: 21,
        codice_prodotto: "UI: 754979 / UE: 754994",
        articolo_fornitore: "UI: RAS-B10B2KVG / UE: RAS-10B2AVG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/classic/TOSHIBALeafletCLASSIC.pdf",
        image_url: "../images/seiya_classic.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 52,
        marca: "TOSHIBA",
        modello: "SEIYA CLASSIC",
        potenza: "3,5kW - 13000BTU",
        prezzo: 475.00, // Somma 276 + 199
        prezzo_ui: 199.00, // Aggiunto
        prezzo_ue: 276.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "288x770x225", dimensioni_ue: "530x660x240", peso_ui: 9, peso_ue: 22,
        codice_prodotto: "UI: 754980 / UE: 754997",
        articolo_fornitore: "UI: RAS-B13B2KVG / UE: RAS-13B2AVG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/classic/TOSHIBALeafletCLASSIC.pdf",
        image_url: "../images/seiya_classic.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 53,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "2,0kW - 7000BTU",
        prezzo: 694.00, // Somma 414 + 280
        prezzo_ui: 280.00, // Aggiunto
        prezzo_ue: 414.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "229x889x215", dimensioni_ue: "548x790x285", peso_ui: 10, peso_ue: 31,
        codice_prodotto: "UI: 878437 / UE: 878460",
        articolo_fornitore: "UI: AR70F07C1AWNEU / UE: AR70F07C1AWXEU",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // Path relativo corretto
        tipo: "Monosplit"
    },
      {
        id: 54,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "2,5kW - 9000BTU",
        prezzo: 756.00, // Somma 423 + 333
        prezzo_ui: 333.00, // Aggiunto
        prezzo_ue: 423.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "229x889x215", dimensioni_ue: "548x790x285", peso_ui: 10, peso_ue: 31,
        codice_prodotto: "UI: 878438 / UE: 878461",
        articolo_fornitore: "UI: AR70F09C1AWNEU / UE: AR70F09C1AWXEU",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // Path relativo corretto
        tipo: "Monosplit"
    },
      {
        id: 55,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "3,5kW - 12000BTU",
        prezzo: 840.00, // Somma 472 + 368
        prezzo_ui: 368.00, // Aggiunto
        prezzo_ue: 472.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "229x889x215", dimensioni_ue: "548x790x285", peso_ui: 10, peso_ue: 31,
        codice_prodotto: "UI: 878439 / UE: 878462",
        articolo_fornitore: "UI: AR70F12C1AWNEU / UE: AR70F12C1AWXEU",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // Path relativo corretto
        tipo: "Monosplit"
    },
      {
        id: 56,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1327.00, // Somma 743 + 584
        prezzo_ui: 584.00, // Aggiunto
        prezzo_ue: 743.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x1055x215", dimensioni_ue: "638x880x310", peso_ui: 12, peso_ue: 37,
        codice_prodotto: "UI: 878441 / UE: 878464",
        articolo_fornitore: "UI: AR70F18C1AWNEU / UE: AR70F18C1AWXEU",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // Path relativo corretto
        tipo: "Monosplit"
    },
      {
        id: 57,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "7,0kW - 24000BTU",
        prezzo: 1543.00, // Somma 860 + 683
        prezzo_ui: 683.00, // Aggiunto
        prezzo_ue: 860.00, // Aggiunto
        wifi: "Sì",
        dimensioni_ui: "299x1055x215", dimensioni_ue: "638x880x310", peso_ui: 12, peso_ue: 37,
        codice_prodotto: "UI: 878442 / UE: 878465",
        articolo_fornitore: "UI: AR70F24C1AWNEU / UE: AR70F24C1AWXEU",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 58,
        marca: "IMMERGAS",
        modello: "THOR",
        potenza: "2,5kW - 9000BTU",
        prezzo: 375.00, // Somma 242 + 133
        prezzo_ui: 133.00, // Aggiunto
        prezzo_ue: 242.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "292x729x204", dimensioni_ue: "495x727x270", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 842199 / UE: 842413",
        articolo_fornitore: "UI: 3.035.031 / UE: 3.035.032",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.immergas.com/media/Prodotto/660567cc8ff9c282fc91b7e1/GOTHA_THOR_MULTI%20-%20S266.pdf",
        image_url: "../images/thor.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 59,
        marca: "IMMERGAS",
        modello: "THOR",
        potenza: "3,5kW - 12000BTU",
        prezzo: 395.00, // Somma 253 + 142
        prezzo_ui: 142.00, // Aggiunto
        prezzo_ue: 253.00, // Aggiunto
        wifi: "No",
        dimensioni_ui: "296x805x205", dimensioni_ue: "495x727x270", peso_ui: 9, peso_ue: 24,
        codice_prodotto: "UI: 842200 / UE: 842414",
        articolo_fornitore: "UI: 3.035.033 / UE: 3.035.034",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.immergas.com/media/Prodotto/660567cc8ff9c282fc91b7e1/GOTHA_THOR_MULTI%20-%20S266.pdf",
        image_url: "../images/thor.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 60,
        marca: "VIESSMANN",
        modello: "VITOCLIMA 232",
        potenza: "2,5kW - 9000BTU",
        prezzo: 540.00,
        wifi: "Sì",
        dimensioni_ui: "290x865x210", dimensioni_ue: "555x732x330", peso_ui: 11, peso_ue: 27,
        codice_prodotto: "834350",
        articolo_fornitore: null, // Non presente nel CSV
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.viessmann.it/content/dam/public-brands/it/prodotti/climatizzatori/vitoclima-232-s/Vitoclima%20232-S-072024-web.pdf/_jcr_content/renditions/original./Vitoclima%20232-S-072024-web.pdf",
        image_url: "../images/vitoclima_232.png", // Path relativo corretto
        tipo: "Monosplit"
    },
      {
        id: 61,
        marca: "VIESSMANN",
        modello: "VITOCLIMA 232",
        potenza: "3,5kW - 12000BTU",
        prezzo: 560.00,
        wifi: "Sì",
        dimensioni_ui: "290x865x210", dimensioni_ue: "555x802x350", peso_ui: 11, peso_ue: 29,
        codice_prodotto: "836443",
        articolo_fornitore: null, // Non presente nel CSV
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.viessmann.it/content/dam/public-brands/it/prodotti/climatizzatori/vitoclima-232-s/Vitoclima%20232-S-072024-web.pdf/_jcr_content/renditions/original./Vitoclima%20232-S-072024-web.pdf",
        image_url: "../images/vitoclima_232.png", // Path relativo corretto
        tipo: "Monosplit"
    },
      {
        id: 62,
        marca: "VIESSMANN",
        modello: "VITOCLIMA 232",
        potenza: "5,0kW - 18000BTU",
        prezzo: 800.00,
        wifi: "Sì",
        dimensioni_ui: "290x865x210", dimensioni_ue: "660x958x402", peso_ui: 13, peso_ue: 42,
        codice_prodotto: "843460",
        articolo_fornitore: null, // Non presente nel CSV
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.viessmann.it/content/dam/public-brands/it/prodotti/climatizzatori/vitoclima-232-s/Vitoclima%20232-S-072024-web.pdf/_jcr_content/renditions/original./Vitoclima%20232-S-072024-web.pdf",
        image_url: "../images/vitoclima_232.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 63,
        marca: "INNOVA",
        modello: "2.0",
        potenza: "1,70kW - 9000BTU", // Potenza nominale, BTU indicativo
        prezzo: 1305.00,
        wifi: "Sì",
        dimensioni_ui: "549x810x165", dimensioni_ue: null, peso_ui: 38, peso_ue: null,
        codice_prodotto: "840761",
        articolo_fornitore: "C5MO09IC3II",
        classe_energetica_raffrescamento: "A+", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.innovaenergie.com/site/assets/files/2792/20_it.pdf",
        image_url: "../images/innova_2_0.png", // Path relativo corretto
        tipo: "Monosplit" // Considerato Monosplit per semplicità, ma è un monoblocco
    },
     {
        id: 64,
        marca: "INNOVA",
        modello: "2.0",
        potenza: "2,10kW - 10000 BTU", // Potenza nominale, BTU indicativo
        prezzo: 1305.00,
        wifi: "Sì",
        dimensioni_ui: "549x1010x165", dimensioni_ue: null, peso_ui: 41, peso_ue: null,
        codice_prodotto: "844814",
        articolo_fornitore: "C3MO10IC3II",
        classe_energetica_raffrescamento: "A+", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.innovaenergie.com/site/assets/files/2792/20_it.pdf",
        image_url: "../images/innova_2_0.png", // Path relativo corretto
        tipo: "Monosplit"
    },
     {
        id: 65,
        marca: "INNOVA",
        modello: "2.0",
        potenza: "2,30kW - 12000 BTU", // Potenza nominale, BTU indicativo
        prezzo: 1410.00,
        wifi: "Sì",
        dimensioni_ui: "549x1010x165", dimensioni_ue: null, peso_ui: 41, peso_ue: null,
        codice_prodotto: "839117",
        articolo_fornitore: "C3MO12IC3II",
        classe_energetica_raffrescamento: "A+", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.innovaenergie.com/site/assets/files/2792/20_it.pdf",
        image_url: "../images/innova_2_0.png", // Path relativo corretto
        tipo: "Monosplit"
    }
];
```

---

**4. File: `multi_data.js`** (Updated with new image path logic, still requires missing UI data)

```javascript
// --- START OF FILE multi_data.js ---
// File: multi_data.js
// Dati per configuratore Multisplit (convertiti da multisplit.csv)
// !! ATTENZIONE: DATI UI MANCANTI PER ALCUNE MARCHE - DEVONO ESSERE AGGIUNTI MANUALMENTE !!
// Percorsi immagine aggiornati secondo la nuova struttura ../images/ e ../images/logos/

// Helper function per creare nomi file immagine (minuscolo, sostituisci spazi con underscore)
function normalizeForFilename(name) {
    if (!name) return '';
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

const multiProducts = [
    // === HAIER ===
    // --- UE ---
    {
        id: "835806", type: 'UE', marca: "HAIER", modello: "REVIVE UE 4kW", codice_prodotto: "835806", articolo_fornitore: "835806",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 491.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_revive.png", note_compatibilita: "Compatibile con UI: REVIVE"
    },
    {
        id: "835807", type: 'UE', marca: "HAIER", modello: "REVIVE UE 5kW", codice_prodotto: "835807", articolo_fornitore: "835807",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 581.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_revive.png", note_compatibilita: "Compatibile con UI: REVIVE"
    },
    {
        id: "835704", type: 'UE', marca: "HAIER", modello: "REVIVE UE 5.5kW", codice_prodotto: "835704", articolo_fornitore: "835704",
        potenza_kw: 5.5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 706.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_revive.png", note_compatibilita: "Compatibile con UI: REVIVE"
    },
    {
        id: "573470", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 4kW", codice_prodotto: "573470", articolo_fornitore: "573470",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 682.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
    },
    {
        id: "573473", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 5kW", codice_prodotto: "573473", articolo_fornitore: "573473",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 824.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
    },
    {
        id: "715459", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 5.5kW", codice_prodotto: "715459", articolo_fornitore: "715459",
        potenza_kw: 5.5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 928.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
    },
    {
        id: "764471", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 7kW", codice_prodotto: "764471", articolo_fornitore: "764471",
        potenza_kw: 7, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1232.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
    },
    {
        id: "765278", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 7.5kW", codice_prodotto: "765278", articolo_fornitore: "765278",
        potenza_kw: 7.5, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1337.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
    },
    {
        id: "730440", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 8.5kW", codice_prodotto: "730440", articolo_fornitore: "730440",
        potenza_kw: 8.5, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1464.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
    },
    {
        id: "733865", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 9kW", codice_prodotto: "733865", articolo_fornitore: "733865",
        potenza_kw: 9, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 1805.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
    },
    {
        id: "785562", type: 'UE', marca: "HAIER", modello: "PEARL/FLEXIS UE 10.5kW", codice_prodotto: "785562", articolo_fornitore: "785562",
        potenza_kw: 10.5, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 1858.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_haier_generic.png", note_compatibilita: "Compatibile con UI: PEARL, FLEXIS" // Ambiguo -> Generic
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
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_hr.png", note_compatibilita: "Compatibile con UI: HR"
    },
    {
        id: "716846", type: 'UE', marca: "MITSUBISHI", modello: "HR UE 5kW", codice_prodotto: "716846", articolo_fornitore: "716846",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 903.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_hr.png", note_compatibilita: "Compatibile con UI: HR"
    },
    {
        id: "716687", type: 'UE', marca: "MITSUBISHI", modello: "HR UE 5kW Trial", codice_prodotto: "716687", articolo_fornitore: "716687",
        potenza_kw: 5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1158.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_hr.png", note_compatibilita: "Compatibile con UI: HR"
    },
    {
        id: "715005", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 3.3kW", codice_prodotto: "715005", articolo_fornitore: "715005",
        potenza_kw: 3.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 710.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "730613", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 4.2kW", codice_prodotto: "730613", articolo_fornitore: "730613",
        potenza_kw: 4.2, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 893.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "716667", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 5.3kW", codice_prodotto: "716667", articolo_fornitore: "716667",
        potenza_kw: 5.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1077.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "757920", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 5.4kW", codice_prodotto: "757920", articolo_fornitore: "757920",
        potenza_kw: 5.4, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1373.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "681483", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 6.8kW", codice_prodotto: "681483", articolo_fornitore: "681483",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1667.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "689636", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 7.2kW", codice_prodotto: "689636", articolo_fornitore: "689636",
        potenza_kw: 7.2, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1955.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "710734", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 8kW", codice_prodotto: "710734", articolo_fornitore: "710734",
        potenza_kw: 8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2249.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "816479", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 10.2kW", codice_prodotto: "816479", articolo_fornitore: "816479",
        potenza_kw: 10.2, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 2873.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_mitsubishi_generic.png", note_compatibilita: "Compatibile con UI: AY, KIRIGAMINE STYLE, KIRIGAMINE ZEN" // Ambiguo -> Generic
    },
    {
        id: "817055", type: 'UE', marca: "MITSUBISHI", modello: "AY/KIRIGAMINE UE 12kW", codice_prodotto: "817055", articolo_fornitore: "817055",
        potenza_kw: 12, potenza_btu: null, max_split: 6, classe_raff: null, classe_risc: null, prezzo: 3297.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_ay.png", note_compatibilita: "Compatibile con UI: AY" // Esasplit solo AY -> Usa ue_ay.png
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
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_libero_smart.png", note_compatibilita: "Compatibile con UI: LIBERO SMART"
    },
    {
        id: "836715", type: 'UE', marca: "LG", modello: "LIBERO SMART UE Dual High", codice_prodotto: "836715", articolo_fornitore: "836715",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 835.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_libero_smart.png", note_compatibilita: "Compatibile con UI: LIBERO SMART"
    },
    {
        id: "792716", type: 'UE', marca: "LG", modello: "LIBERO SMART UE Trial", codice_prodotto: "792716", articolo_fornitore: "792716",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1022.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_libero_smart.png", note_compatibilita: "Compatibile con UI: LIBERO SMART"
    },
    {
        id: "836718", type: 'UE', marca: "LG", modello: "LIBERO SMART UE Trial High", codice_prodotto: "836718", articolo_fornitore: "836718",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1485.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_libero_smart.png", note_compatibilita: "Compatibile con UI: LIBERO SMART"
    },
     // --- UI LG ---
     {
        id: "681154", type: 'UI', marca: "LG", modello: "LIBERO SMART", codice_prodotto: "681154", articolo_fornitore: "S09EC.NSJS",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 173.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "308X837X189", peso_ui: 9, scheda_tecnica_url: "https://drive.google.com/file/d/17h8ICBGw6RrYdryPgWXCs2Gh48LE0Kjb/view?usp=sharing", image_url: `../images/${normalizeForFilename("libero_smart")}.png`, note_compatibilita: null
     },
     {
        id: "681156", type: 'UI', marca: "LG", modello: "LIBERO SMART", codice_prodotto: "681156", articolo_fornitore: "S12EC.NSJS",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 184.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "308X837X189", peso_ui: 9, scheda_tecnica_url: "https://drive.google.com/file/d/17h8ICBGw6RrYdryPgWXCs2Gh48LE0Kjb/view?usp=sharing", image_url: `../images/${normalizeForFilename("libero_smart")}.png`, note_compatibilita: null
     },

    // === SAMSUNG ===
    // --- UE ---
    {
        id: "681400", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 4kW", codice_prodotto: "681400", articolo_fornitore: "681400",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 733.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_windfree_avant.png", note_compatibilita: "Compatibile con UI: WINDFREE AVANT"
    },
    {
        id: "681402", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 5kW", codice_prodotto: "681402", articolo_fornitore: "681402",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 923.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_windfree_avant.png", note_compatibilita: "Compatibile con UI: WINDFREE AVANT"
    },
    {
        id: "681403", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 5.2kW", codice_prodotto: "681403", articolo_fornitore: "681403",
        potenza_kw: 5.2, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1102.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_windfree_avant.png", note_compatibilita: "Compatibile con UI: WINDFREE AVANT"
    },
    {
        id: "680714", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 6.8kW", codice_prodotto: "680714", articolo_fornitore: "680714",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1461.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_windfree_avant.png", note_compatibilita: "Compatibile con UI: WINDFREE AVANT"
    },
    {
        id: "682202", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 8kW", codice_prodotto: "682202", articolo_fornitore: "682202",
        potenza_kw: 8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1842.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_windfree_avant.png", note_compatibilita: "Compatibile con UI: WINDFREE AVANT"
    },
    {
        id: "682461", type: 'UE', marca: "SAMSUNG", modello: "WINDFREE UE 10kW", codice_prodotto: "682461", articolo_fornitore: "682461",
        potenza_kw: 10, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 2338.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_windfree_avant.png", note_compatibilita: "Compatibile con UI: WINDFREE AVANT"
    },
    // --- UI SAMSUNG ---
     {
        id: "878437", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878437", articolo_fornitore: "AR70F07C1AWNEU",
        potenza_kw: 2.0, potenza_btu: 7000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 280.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "229x889x215", peso_ui: 10, scheda_tecnica_url: "...", image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
      {
        id: "878438", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878438", articolo_fornitore: "AR70F09C1AWNEU",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 333.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "229x889x215", peso_ui: 10, scheda_tecnica_url: "...", image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
     {
        id: "878439", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878439", articolo_fornitore: "AR70F12C1AWNEU",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 368.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "229x889x215", peso_ui: 10, scheda_tecnica_url: "...", image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
     {
        id: "878441", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878441", articolo_fornitore: "AR70F18C1AWNEU",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 584.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "299x1055x215", peso_ui: 12, scheda_tecnica_url: "...", image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },
     {
        id: "878442", type: 'UI', marca: "SAMSUNG", modello: "WINDFREE AVANT", codice_prodotto: "878442", articolo_fornitore: "AR70F24C1AWNEU",
        potenza_kw: 7.0, potenza_btu: 24000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 683.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "299x1055x215", peso_ui: 12, scheda_tecnica_url: "...", image_url: `../images/${normalizeForFilename("windfree_avant")}.png`, note_compatibilita: null
     },


    // === DAIKIN ===
    // --- UE ---
    {
        id: "822100", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 4kW", codice_prodotto: "822100", articolo_fornitore: "822100",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 942.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_sensira.png", note_compatibilita: "Compatibile con UI: SENSIRA"
    },
    {
        id: "835927", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 5kW", codice_prodotto: "835927", articolo_fornitore: "835927",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1140.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_sensira.png", note_compatibilita: "Compatibile con UI: SENSIRA"
    },
    {
        id: "835928", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 5.2kW", codice_prodotto: "835928", articolo_fornitore: "835928",
        potenza_kw: 5.2, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1412.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_sensira.png", note_compatibilita: "Compatibile con UI: SENSIRA"
    },
    {
        id: "835930", type: 'UE', marca: "DAIKIN", modello: "SENSIRA UE 6.8kW", codice_prodotto: "835930", articolo_fornitore: "835930",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1883.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_sensira.png", note_compatibilita: "Compatibile con UI: SENSIRA"
    },
    {
        id: "799633", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 4kW Dual", codice_prodotto: "799633", articolo_fornitore: "799633",
        potenza_kw: 4, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1168.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
    {
        id: "799634", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 5kW Dual", codice_prodotto: "799634", articolo_fornitore: "799634",
        potenza_kw: 5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1340.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
    {
        id: "799636", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 6.8kW Dual", codice_prodotto: "799636", articolo_fornitore: "799636",
        potenza_kw: 6.8, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 1755.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
    {
        id: "799638", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 4kW Trial", codice_prodotto: "799638", articolo_fornitore: "799638",
        potenza_kw: 4, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1567.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
    {
        id: "799639", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 5.2kW Trial", codice_prodotto: "799639", articolo_fornitore: "799639",
        potenza_kw: 5.2, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1848.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
    {
        id: "799640", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 6.8kW Trial", codice_prodotto: "799640", articolo_fornitore: "799640",
        potenza_kw: 6.8, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 2209.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
    {
        id: "799641", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 6.8kW Poker", codice_prodotto: "799641", articolo_fornitore: "799641",
        potenza_kw: 6.8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2577.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
     {
        id: "799642", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 8kW Poker", codice_prodotto: "799642", articolo_fornitore: "799642",
        potenza_kw: 8, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2949.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
    },
     {
        id: "799643", type: 'UE', marca: "DAIKIN", modello: "PERFERA/EMURA UE 9kW Penta", codice_prodotto: "799643", articolo_fornitore: "799643",
        potenza_kw: 9, potenza_btu: null, max_split: 5, classe_raff: null, classe_risc: null, prezzo: 3505.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_daikin_generic.png", note_compatibilita: "Compatibile con UI: PERFERA, EMURA" // Ambiguo -> Generic
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
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_thor.png", note_compatibilita: "Compatibile con UI: THOR"
    },
    {
        id: "844244", type: 'UE', marca: "IMMERGAS", modello: "THOR UE Trial", codice_prodotto: "844244", articolo_fornitore: "844244",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 749.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_thor.png", note_compatibilita: "Compatibile con UI: THOR"
    },
     // --- UI IMMERGAS ---
     {
        id: "842199", type: 'UI', marca: "IMMERGAS", modello: "THOR", codice_prodotto: "842199", articolo_fornitore: "3.035.031",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 133.00, wifi: "No", // Prezzo da data.js
        dimensioni_ui: "292x729x204", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("thor")}.png`, note_compatibilita: null
     },
      {
        id: "842200", type: 'UI', marca: "IMMERGAS", modello: "THOR", codice_prodotto: "842200", articolo_fornitore: "3.035.033",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 142.00, wifi: "No", // Prezzo da data.js
        dimensioni_ui: "296x805x205", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("thor")}.png`, note_compatibilita: null
     },

    // === TOSHIBA ===
    // --- UE ---
     {
        id: "604322", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Dual", codice_prodotto: "604322", articolo_fornitore: "604322",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 758.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_toshiba_generic.png", note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC" // Ambiguo -> Generic
    },
     {
        id: "604581", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Dual High", codice_prodotto: "604581", articolo_fornitore: "604581",
        potenza_kw: null, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 978.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_toshiba_generic.png", note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC" // Ambiguo -> Generic
    },
    {
        id: "602581", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Trial", codice_prodotto: "602581", articolo_fornitore: "602581",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1245.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_toshiba_generic.png", note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC" // Ambiguo -> Generic
    },
     {
        id: "604324", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Trial High", codice_prodotto: "604324", articolo_fornitore: "604324",
        potenza_kw: null, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1556.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_toshiba_generic.png", note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC" // Ambiguo -> Generic
    },
    {
        id: "602582", type: 'UE', marca: "TOSHIBA", modello: "SHORAI/SEIYA UE Poker", codice_prodotto: "602582", articolo_fornitore: "602582",
        potenza_kw: null, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 2025.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_toshiba_generic.png", note_compatibilita: "Compatibile con UI: SHORAI EDGE, SEIYA CLASSIC" // Ambiguo -> Generic
    },
     // --- UI TOSHIBA ---
     {
        id: "814569", type: 'UI', marca: "TOSHIBA", modello: "SHORAI EDGE", codice_prodotto: "814569", articolo_fornitore: "RAS-07J2AVSG",
        potenza_kw: 2.0, potenza_btu: 7000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 325.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "293x800x226", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("shorai_edge")}.png`, note_compatibilita: null
     },
      {
        id: "812538", type: 'UI', marca: "TOSHIBA", modello: "SHORAI EDGE", codice_prodotto: "812538", articolo_fornitore: "RAS-10J2AVSG",
        potenza_kw: 2.5, potenza_btu: 10000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 348.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "293x800x226", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("shorai_edge")}.png`, note_compatibilita: null
     },
     {
        id: "814570", type: 'UI', marca: "TOSHIBA", modello: "SHORAI EDGE", codice_prodotto: "814570", articolo_fornitore: "RAS-13J2AVSG",
        potenza_kw: 3.5, potenza_btu: 13000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 399.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "293x800x226", peso_ui: 10, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("shorai_edge")}.png`, note_compatibilita: null
     },
      {
        id: "754979", type: 'UI', marca: "TOSHIBA", modello: "SEIYA CLASSIC", codice_prodotto: "754979", articolo_fornitore: "RAS-B10B2KVG",
        potenza_kw: 2.5, potenza_btu: 10000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 166.00, wifi: "No", // Prezzo da data.js
        dimensioni_ui: "288x770x225", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("seiya_classic")}.png`, note_compatibilita: null
     },
     {
        id: "754980", type: 'UI', marca: "TOSHIBA", modello: "SEIYA CLASSIC", codice_prodotto: "754980", articolo_fornitore: "RAS-B13B2KVG",
        potenza_kw: 3.5, potenza_btu: 13000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 199.00, wifi: "No", // Prezzo da data.js
        dimensioni_ui: "288x770x225", peso_ui: 9, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("seiya_classic")}.png`, note_compatibilita: null
     },

    // === HITACHI ===
    // --- UE ---
     {
        id: "844136", type: 'UE', marca: "HITACHI", modello: "AIR HOME 400 UE 4.3kW", codice_prodotto: "844136", articolo_fornitore: "844136",
        potenza_kw: 4.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 656.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_air_home_400.png", note_compatibilita: "Compatibile con UI: AIR HOME 400"
    },
    {
        id: "844248", type: 'UE', marca: "HITACHI", modello: "AIR HOME 400 UE 5.5kW Dual", codice_prodotto: "844248", articolo_fornitore: "844248",
        potenza_kw: 5.5, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 744.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_air_home_400.png", note_compatibilita: "Compatibile con UI: AIR HOME 400"
    },
    {
        id: "855738", type: 'UE', marca: "HITACHI", modello: "AIR HOME 400 UE 5.5kW Trial", codice_prodotto: "855738", articolo_fornitore: "855738",
        potenza_kw: 5.5, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1006.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_air_home_400.png", note_compatibilita: "Compatibile con UI: AIR HOME 400"
    },
    // --- UI HITACHI ---
     {
        id: "838081", type: 'UI', marca: "HITACHI", modello: "AIR HOME 400", codice_prodotto: "838081", articolo_fornitore: "RAK-DJ25PHAE",
        potenza_kw: 2.5, potenza_btu: 9000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 136.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "280x780x222", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("air_home_400")}.png`, note_compatibilita: null
     },
      {
        id: "838082", type: 'UI', marca: "HITACHI", modello: "AIR HOME 400", codice_prodotto: "838082", articolo_fornitore: "RAK-DJ35PHAE",
        potenza_kw: 3.5, potenza_btu: 12000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 150.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "280x780x222", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("air_home_400")}.png`, note_compatibilita: null
     },
      {
        id: "838083", type: 'UI', marca: "HITACHI", modello: "AIR HOME 400", codice_prodotto: "838083", articolo_fornitore: "RAK-DJ50PHAE",
        potenza_kw: 5.0, potenza_btu: 18000, max_split: null, classe_raff: null, classe_risc: null, prezzo: 211.00, wifi: "Sì", // Prezzo da data.js
        dimensioni_ui: "280x780x222", peso_ui: 8, scheda_tecnica_url: null, image_url: `../images/${normalizeForFilename("air_home_400")}.png`, note_compatibilita: null
     },


    // === VIESSMANN ===
    // --- UE ---
     {
        id: "760111", type: 'UE', marca: "VIESSMANN", modello: "VITOCLIMA 232S UE 5.3kW", codice_prodotto: "760111", articolo_fornitore: "760111",
        potenza_kw: 5.3, potenza_btu: null, max_split: 2, classe_raff: null, classe_risc: null, prezzo: 850.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_vitoclima_232.png", note_compatibilita: "Compatibile con UI: VITOCLIMA 232"
    },
    {
        id: "769229", type: 'UE', marca: "VIESSMANN", modello: "VITOCLIMA 232S UE 6.1kW", codice_prodotto: "769229", articolo_fornitore: "769229",
        potenza_kw: 6.1, potenza_btu: null, max_split: 3, classe_raff: null, classe_risc: null, prezzo: 1143.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_vitoclima_232.png", note_compatibilita: "Compatibile con UI: VITOCLIMA 232"
    },
    {
        id: "765905", type: 'UE', marca: "VIESSMANN", modello: "VITOCLIMA 232S UE 8.2kW", codice_prodotto: "765905", articolo_fornitore: "765905",
        potenza_kw: 8.2, potenza_btu: null, max_split: 4, classe_raff: null, classe_risc: null, prezzo: 1170.00, wifi: "No",
        dimensioni_ue: null, peso_ue: null, scheda_tecnica_url: null, image_url: "../images/ue_vitoclima_232.png", note_compatibilita: "Compatibile con UI: VITOCLIMA 232"
    },
     // --- UI VIESSMANN MANCANTI ---
     // !! AGGIUNGERE QUI I DATI DELLE UI VIESSMANN VITOCLIMA 232 (CODICE, PREZZO) !!
     /* Esempio struttura (prezzi UI non deducibili da data.js monosplit)
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
```