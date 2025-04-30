// File: data.js
// Percorsi immagine aggiornati per la posizione in monosplit/

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
        scheda_tecnica_url: "https://drive.google.com/file/d/1Pbhd5ObgVUBuyvefknmYhlKM8oWyCGel/view?usp=drive_link", // URL Ripristinato
        image_url: "../images/revive.png", // CORRETTO
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
        scheda_tecnica_url: "https://drive.google.com/file/d/1Pbhd5ObgVUBuyvefknmYhlKM8oWyCGel/view?usp=drive_link", // URL Ripristinato
        image_url: "../images/revive.png", // CORRETTO
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
        scheda_tecnica_url: "https://drive.google.com/file/d/1Pbhd5ObgVUBuyvefknmYhlKM8oWyCGel/view?usp=drive_link", // URL Ripristinato
        image_url: "../images/revive.png", // CORRETTO
        tipo: "Monosplit"
    },
    {
        id: 4, // Combinazione PEARL 9k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "2,5kW - 9000BTU",
        prezzo: 456.00, // Somma 310 + 146 (prezzo_ui/ue non presenti nel backup)
        wifi: "Sì",
        dimensioni_ui: "290x805x200", dimensioni_ue: "544x700x245", peso_ui: 8, peso_ue: 23,
        codice_prodotto: "UI: 836088 / UE: 836091",
        articolo_fornitore: "UI: AS25PBAHRA / UE: 1U25YEGFRA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // CORRETTO
        tipo: "Monosplit"
    },
    {
        id: 5, // Combinazione PEARL 12k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "3,5kW - 12000BTU",
        prezzo: 513.00, // Somma 347 + 166
        wifi: "Sì",
        dimensioni_ui: "290x805x200", dimensioni_ue: "544x700x245", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 836090 / UE: 836094",
        articolo_fornitore: "UI: AS35PBAHRA / UE: 1U35YEGFRA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // CORRETTO
        tipo: "Monosplit"
    },
    {
        id: 6, // Combinazione PEARL 18k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "5,0kW - 18000BTU",
        prezzo: 793.00, // Somma 534 + 259
        wifi: "Sì",
        dimensioni_ui: "320x975x220", dimensioni_ue: "553x800x275", peso_ui: 12, peso_ue: 33,
        codice_prodotto: "UI: 764459 / UE: 764467",
        articolo_fornitore: "UI: AS50PDAHRA / UE: 1U50MEGFRA",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // CORRETTO
        tipo: "Monosplit"
    },
    {
        id: 7, // Combinazione PEARL 24k
        marca: "HAIER",
        modello: "PEARL",
        potenza: "7,0kW - 24000BTU",
        prezzo: 1040.00, // Somma 687 + 353
        wifi: "Sì",
        dimensioni_ui: "320x975x220", dimensioni_ue: "553x800x275", peso_ui: 12, peso_ue: 44,
        codice_prodotto: "UI: 783641 / UE: 783648",
        articolo_fornitore: "UI: AS68PDAHRA / UE: 1U68WEGFRA",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11186/d-1/t-file/PEARL-monosplit.pdf",
        image_url: "../images/pearl.png", // CORRETTO
        tipo: "Monosplit"
    },
    {
        id: 8, // Combinazione FLEXIS 9k
        marca: "HAIER",
        modello: "FLEXIS",
        potenza: "2,5kW - 9000BTU",
        prezzo: 682.00, // Somma 391 + 291
        wifi: "Sì",
        dimensioni_ui: "300x856x197", dimensioni_ue: "553x800x275", peso_ui: 10, peso_ue: 30,
        codice_prodotto: "UI: 732350 / UE: 644831",
        articolo_fornitore: "UI: AS25S2SF1FA-MW3 / UE: 1U25S2SM1FA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11185/d-1/t-file/FLEXIS-PLUS-monosplit.pdf",
        image_url: "../images/flexis.png", // CORRETTO
        tipo: "Monosplit"
    },
    {
        id: 9, // Combinazione FLEXIS 12k
        marca: "HAIER",
        modello: "FLEXIS",
        potenza: "3,5kW - 12000BTU",
        prezzo: 748.00, // Somma 432 + 316
        wifi: "Sì",
        dimensioni_ui: "300x856x197", dimensioni_ue: "553x800x275", peso_ui: 10, peso_ue: 30,
        codice_prodotto: "UI: 736328 / UE: 653075",
        articolo_fornitore: "UI: AS35S2SF1FA-MW3 / UE: 1U35S2SM1FA",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.haiercondizionatori.it/media/11185/d-1/t-file/FLEXIS-PLUS-monosplit.pdf",
        image_url: "../images/flexis.png", // CORRETTO
        tipo: "Monosplit"
    },

    // === MITSUBISHI ===
     {
        id: 10,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "2,5kW - 9000BTU",
        prezzo: 455.00, // Somma 266 + 189
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "538x699x249", peso_ui: 9, peso_ue: 23,
        codice_prodotto: "UI: 760295 / UE: 716679",
        articolo_fornitore: "UI: MSZ-HR25VF / UE: MUZ-HR25VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 11,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "3,5kW - 12000BTU",
        prezzo: 552.00, // Somma 339 + 213
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "538x699x249", peso_ui: 9, peso_ue: 24,
        codice_prodotto: "UI: 760296 / UE: 716682",
        articolo_fornitore: "UI: MSZ-HR35VF / UE: MUZ-HR35VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 12,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "4,2kW - 15000BTU",
        prezzo: 715.00, // Somma 448 + 267
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "550x800x285", peso_ui: 9, peso_ue: 34,
        codice_prodotto: "UI: 679857 / UE: 679860",
        articolo_fornitore: "UI: MSZ-HR42VF / UE: MUZ-HR42VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 13,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "5,0kW - 18000BTU",
        prezzo: 811.00, // Somma 514 + 297
        wifi: "No",
        dimensioni_ui: "280x838x228", dimensioni_ue: "550x800x285", peso_ui: 9, peso_ue: 35,
        codice_prodotto: "UI: 667317 / UE: 716843",
        articolo_fornitore: "UI: MSZ-HR50VF / UE: MUZ-HR50VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 14,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "6,0kW - 21000BTU",
        prezzo: 1050.00, // Somma 634 + 416
        wifi: "No",
        dimensioni_ui: "305x923x263", dimensioni_ue: "714x800x285", peso_ui: 13, peso_ue: 40,
        codice_prodotto: "UI: 714644 / UE: 714645",
        articolo_fornitore: "UI: MSZ-HR60VF / UE: MUZ-HR60VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 15,
        marca: "MITSUBISHI",
        modello: "HR",
        potenza: "7,1kW - 24000BTU",
        prezzo: 1336.00, // Somma 797 + 539
        wifi: "No",
        dimensioni_ui: "305x923x263", dimensioni_ue: "714x800x285", peso_ui: 13, peso_ue: 40,
        codice_prodotto: "UI: 708752 / UE: 708753",
        articolo_fornitore: "UI: MSZ-HR71VF / UE: MUZ-HR71VF",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda_Tecnica_MSZ-HR_web_0.pdf",
        image_url: "../images/hr.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 16,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "2,0kW - 7000BTU",
        prezzo: 832.00, // Somma 462 + 370
        wifi: "Sì",
        dimensioni_ui: "250x760x199", dimensioni_ue: "550x800x285", peso_ui: 9, peso_ue: 28,
        codice_prodotto: "UI: 834032 / UE: 834443",
        articolo_fornitore: "UI: MSZ-AY20VGKP / UE: MUZ-AY20VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 17,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "2,5kW - 9000BTU",
        prezzo: 877.00, // Somma 470 + 407
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "550x800x285", peso_ui: 11, peso_ue: 28,
        codice_prodotto: "UI: 801940 / UE: 802160",
        articolo_fornitore: "UI: MSZ-AY25VGKP / UE: MUZ-AY25VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 18,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "3,5kW - 12000BTU",
        prezzo: 999.00, // Somma 580 + 419
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "550x800x285", peso_ui: 11, peso_ue: 29,
        codice_prodotto: "UI: 801936 / UE: 802161",
        articolo_fornitore: "UI: MSZ-AY35VGKP / UE: MUZ-AY35VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 19,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "4,2kW - 15000BTU",
        prezzo: 1194.00, // Somma 728 + 466
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "550x800x285", peso_ui: 11, peso_ue: 34,
        codice_prodotto: "UI: 813624 / UE: 813622",
        articolo_fornitore: "UI: MSZ-AY42VGKP / UE: MUZ-AY42VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 20,
        marca: "MITSUBISHI",
        modello: "AY",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1359.00, // Somma 860 + 499
        wifi: "Sì",
        dimensioni_ui: "299x798x245", dimensioni_ue: "714x800x285", peso_ui: 11, peso_ue: 41,
        codice_prodotto: "UI: 800724 / UE: 800726",
        articolo_fornitore: "UI: MSZ-AY50VGKP / UE: MUZ-AY50VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-AY%20-%20191124.pdf",
        image_url: "../images/ay.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 21,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE STYLE",
        potenza: "2,5kW - 9000BTU",
        prezzo: 1122.00, // Somma 613 + 509
        wifi: "Sì",
        dimensioni_ui: "307x890x233", dimensioni_ue: "550x800x285", peso_ui: 16, peso_ue: 35,
        codice_prodotto: "UI: 714755 / UE: 747052",
        articolo_fornitore: "UI: MSZ-LN25VG2V / UE: MUZ-LN25VG2",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-LN%20-%20191124.pdf",
        image_url: "../images/kirigamine_style.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 22,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE STYLE",
        potenza: "3,5kW - 12000BTU",
        prezzo: 1316.00, // Somma 767 + 549
        wifi: "Sì",
        dimensioni_ui: "307x890x233", dimensioni_ue: "550x800x285", peso_ui: 16, peso_ue: 35,
        codice_prodotto: "UI: 714757 / UE: 708362",
        articolo_fornitore: "UI: MSZ-LN35VG2V / UE: MUZ-LN35VG2",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-LN%20-%20191124.pdf",
        image_url: "../images/kirigamine_style.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 23,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE STYLE",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1776.00, // Somma 1102 + 674
        wifi: "Sì",
        dimensioni_ui: "307x890x233", dimensioni_ue: "714x800x285", peso_ui: 16, peso_ue: 40,
        codice_prodotto: "UI: 687306 / UE: 722800",
        articolo_fornitore: "UI: MSZ-LN50VG2V / UE: MUZ-LN50VG2",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-LN%20-%20191124.pdf",
        image_url: "../images/kirigamine_style.png", // CORRETTO
        tipo: "Monosplit"
    },
      {
        id: 24,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "2,5kW - 9000BTU",
        prezzo: 955.00, // Somma 512 + 443
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "550x800x285", peso_ui: 12, peso_ue: 31,
        codice_prodotto: "UI: 688038 / UE: 651606",
        articolo_fornitore: "UI: MSZ-EF25VGK / UE: MUZ-EF25VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 25,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "3,5kW - 12000BTU",
        prezzo: 1116.00, // Somma 649 + 467
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "550x800x285", peso_ui: 12, peso_ue: 34,
        codice_prodotto: "UI: 686747 / UE: 649516",
        articolo_fornitore: "UI: MSZ-EF35VGK / UE: MUZ-EF35VG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 26,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "4,2kW - 15000BTU",
        prezzo: 1306.00, // Somma 786 + 520
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "714x800x285", peso_ui: 12, peso_ue: 35,
        codice_prodotto: "UI: 688063 / UE: 682951",
        articolo_fornitore: "UI: MSZ-EF42VGK / UE: MUZ-EF42VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 27,
        marca: "MITSUBISHI",
        modello: "KIRIGAMINE ZEN",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1486.00, // Somma 927 + 559
        wifi: "Sì",
        dimensioni_ui: "299x885x195", dimensioni_ue: "714x800x285", peso_ui: 12, peso_ue: 40,
        codice_prodotto: "UI: 691046 / UE: 734588",
        articolo_fornitore: "UI: MSZ-EF50VGK / UE: MUZ-EF50VG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://climatizzazione.mitsubishielectric.it/sites/default/files/2024-11/Scheda%20tecnica%20MSZ-EF%20-%20191124.pdf",
        image_url: "../images/kirigamine_zen.png", // CORRETTO
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
        image_url: "../images/sensira.png", // CORRETTO
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
        articolo_fornitore: "RXF25E + FTXF25E", // Corretto
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // CORRETTO
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
        articolo_fornitore: "RXF35E + FTXF35E", // Corretto
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // CORRETTO
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
        articolo_fornitore: "RXF42E + FTXF42E", // Corretto
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // CORRETTO
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
        articolo_fornitore: "RXF50E + FTXF50E", // Corretto
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.daikin.ch/content/dam/internet-denv/catalogues_brochures/residential/Sensira_ECPEN18-006_Product%20profile_English.pdf",
        image_url: "../images/sensira.png", // CORRETTO
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
        articolo_fornitore: "RXM20A + FTXM20A", // Corretto
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // CORRETTO
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
        articolo_fornitore: "RXM25A + FTXM25A", // Corretto
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // CORRETTO
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
        articolo_fornitore: "RXM35A + FTXM35A", // Corretto
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // CORRETTO
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
        articolo_fornitore: "RXM42A + FTXM42A", // Corretto
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // CORRETTO
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
        articolo_fornitore: "RXM50A + FTXM50A", // Corretto
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.daikin.it/content/dam/DACI-Internet/Download/Climatizzazione/Leaflet-perfera-singole.pdf",
        image_url: "../images/perfera.png", // CORRETTO
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
        image_url: "../images/emura.png", // CORRETTO
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
        image_url: "../images/emura.png", // CORRETTO
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
        image_url: "../images/emura.png", // CORRETTO
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
        image_url: "../images/emura.png", // CORRETTO
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
        image_url: "../images/emura.png", // CORRETTO
        tipo: "Monosplit"
    },
    // === LG ===
     {
        id: 43,
        marca: "LG",
        modello: "LIBERO SMART",
        potenza: "2,5kW - 9000BTU",
        prezzo: 458.00, // Somma 285 + 173
        wifi: "Sì",
        dimensioni_ui: "308X837X189", dimensioni_ue: "495X717X230", peso_ui: 9, peso_ue: 25,
        codice_prodotto: "UI: 681154 / UE: 799931",
        articolo_fornitore: "UI: S09EC.NSJS / UE: S09EC.UA3S",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://drive.google.com/file/d/17h8ICBGw6RrYdryPgWXCs2Gh48LE0Kjb/view?usp=sharing",
        image_url: "../images/libero_smart.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 44,
        marca: "LG",
        modello: "LIBERO SMART",
        potenza: "3,5kW - 12000BTU",
        prezzo: 497.00, // Somma 313 + 184
        wifi: "Sì",
        dimensioni_ui: "308X837X189", dimensioni_ue: "495X717X230", peso_ui: 9, peso_ue: 25,
        codice_prodotto: "UI: 681156 / UE: 764408",
        articolo_fornitore: "UI: S12EC.NSJS / UE: S12EC.UA3S",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://drive.google.com/file/d/17h8ICBGw6RrYdryPgWXCs2Gh48LE0Kjb/view?usp=sharing",
        image_url: "../images/libero_smart.png", // CORRETTO
        tipo: "Monosplit"
    },
    // === HITACHI ===
     {
        id: 45,
        marca: "HITACHI",
        modello: "AIR HOME 400",
        potenza: "2,5kW - 9000BTU",
        prezzo: 426.00, // Somma 290 + 136
        wifi: "Sì",
        dimensioni_ui: "280x780x222", dimensioni_ue: "530x660x278", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 838081 / UE: 838085",
        articolo_fornitore: "UI: RAK-DJ25PHAE / UE: RAC-DJ25PHAE",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.hitachiaircon.com/it/download_datatable/93",
        image_url: "../images/air_home_400.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 46,
        marca: "HITACHI",
        modello: "AIR HOME 400",
        potenza: "3,5kW - 12000BTU",
        prezzo: 518.00, // Somma 368 + 150
        wifi: "Sì",
        dimensioni_ui: "280x780x222", dimensioni_ue: "530x660x278", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 838082 / UE: 838087",
        articolo_fornitore: "UI: RAK-DJ35PHAE / UE: RAC-DJ35PHAE",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://www.hitachiaircon.com/it/download_datatable/93",
        image_url: "../images/air_home_400.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 47,
        marca: "HITACHI",
        modello: "AIR HOME 400",
        potenza: "5,0kW - 18000BTU",
        prezzo: 868.00, // Somma 657 + 211
        wifi: "Sì",
        dimensioni_ui: "280x780x222", dimensioni_ue: "600x792x299", peso_ui: 8, peso_ue: 40,
        codice_prodotto: "UI: 838083 / UE: 838088",
        articolo_fornitore: "UI: RAK-DJ50PHAE / UE: RAC-DJ50PHAE",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.hitachiaircon.com/it/download_datatable/93",
        image_url: "../images/air_home_400.png", // CORRETTO
        tipo: "Monosplit"
    },
    // === TOSHIBA ===
     {
        id: 48,
        marca: "TOSHIBA",
        modello: "SHORAI EDGE",
        potenza: "2,0kW - 7000BTU",
        prezzo: 749.00, // Somma 424 + 325
        wifi: "Sì",
        dimensioni_ui: "293x800x226", dimensioni_ue: "550x780x290", peso_ui: 10, peso_ue: 26,
        codice_prodotto: "UI: 814569 / UE: 677994",
        articolo_fornitore: "UI: RAS-07J2AVSG / UE: RAS-B07G3KVSG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/shorai_edge_black_white/dati-tecnici-shorai-edge-black-white/tech-sheet-ajax?sheet=0",
        image_url: "../images/shorai_edge.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 49,
        marca: "TOSHIBA",
        modello: "SHORAI EDGE",
        potenza: "2,5kW - 10000BTU",
        prezzo: 803.00, // Somma 455 + 348
        wifi: "Sì",
        dimensioni_ui: "293x800x226", dimensioni_ue: "550x780x290", peso_ui: 10, peso_ue: 26,
        codice_prodotto: "UI: 812538 / UE: 678015",
        articolo_fornitore: "UI: RAS-10J2AVSG / UE: RAS-B10G3KVSG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/shorai_edge_black_white/dati-tecnici-shorai-edge-black-white/tech-sheet-ajax?sheet=0",
        image_url: "../images/shorai_edge.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 50,
        marca: "TOSHIBA",
        modello: "SHORAI EDGE",
        potenza: "3,5kW - 13000BTU",
        prezzo: 955.00, // Somma 556 + 399
        wifi: "Sì",
        dimensioni_ui: "293x800x226", dimensioni_ue: "550x780x290", peso_ui: 10, peso_ue: 30,
        codice_prodotto: "UI: 814570 / UE: 716115",
        articolo_fornitore: "UI: RAS-13J2AVSG / UE: RAS-B13G3KVSG",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A+++",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/shorai_edge_black_white/dati-tecnici-shorai-edge-black-white/tech-sheet-ajax?sheet=0",
        image_url: "../images/shorai_edge.png", // CORRETTO
        tipo: "Monosplit"
    },
    // === NUOVI ARTICOLI DA CSV ===
     {
        id: 51,
        marca: "TOSHIBA",
        modello: "SEIYA CLASSIC",
        potenza: "2,5kW - 10000BTU",
        prezzo: 414.00, // Somma 248 + 166
        wifi: "No",
        dimensioni_ui: "288x770x225", dimensioni_ue: "530x660x240", peso_ui: 9, peso_ue: 21,
        codice_prodotto: "UI: 754979 / UE: 754994",
        articolo_fornitore: "UI: RAS-B10B2KVG / UE: RAS-10B2AVG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/classic/TOSHIBALeafletCLASSIC.pdf",
        image_url: "../images/seiya_classic.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 52,
        marca: "TOSHIBA",
        modello: "SEIYA CLASSIC",
        potenza: "3,5kW - 13000BTU",
        prezzo: 475.00, // Somma 276 + 199
        wifi: "No",
        dimensioni_ui: "288x770x225", dimensioni_ue: "530x660x240", peso_ui: 9, peso_ue: 22,
        codice_prodotto: "UI: 754980 / UE: 754997",
        articolo_fornitore: "UI: RAS-B13B2KVG / UE: RAS-13B2AVG",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.toshibaclima.it/prodotti/residenziale/monosplit/classic/TOSHIBALeafletCLASSIC.pdf",
        image_url: "../images/seiya_classic.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 53,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "2,0kW - 7000BTU",
        prezzo: 694.00, // Somma 414 + 280
        wifi: "Sì",
        dimensioni_ui: "229x889x215", dimensioni_ue: "548x790x285", peso_ui: 10, peso_ue: 31,
        codice_prodotto: "UI: 878437 / UE: 878460",
        articolo_fornitore: "UI: AR70F07C1AWNEU / UE: AR70F07C1AWXEU",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // CORRETTO
        tipo: "Monosplit"
    },
      {
        id: 54,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "2,5kW - 9000BTU",
        prezzo: 756.00, // Somma 423 + 333
        wifi: "Sì",
        dimensioni_ui: "229x889x215", dimensioni_ue: "548x790x285", peso_ui: 10, peso_ue: 31,
        codice_prodotto: "UI: 878438 / UE: 878461",
        articolo_fornitore: "UI: AR70F09C1AWNEU / UE: AR70F09C1AWXEU",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // CORRETTO
        tipo: "Monosplit"
    },
      {
        id: 55,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "3,5kW - 12000BTU",
        prezzo: 840.00, // Somma 472 + 368
        wifi: "Sì",
        dimensioni_ui: "229x889x215", dimensioni_ue: "548x790x285", peso_ui: 10, peso_ue: 31,
        codice_prodotto: "UI: 878439 / UE: 878462",
        articolo_fornitore: "UI: AR70F12C1AWNEU / UE: AR70F12C1AWXEU",
        classe_energetica_raffrescamento: "A+++", classe_energetica_riscaldamento: "A++",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // CORRETTO
        tipo: "Monosplit"
    },
      {
        id: 56,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "5,0kW - 18000BTU",
        prezzo: 1327.00, // Somma 743 + 584
        wifi: "Sì",
        dimensioni_ui: "299x1055x215", dimensioni_ue: "638x880x310", peso_ui: 12, peso_ue: 37,
        codice_prodotto: "UI: 878441 / UE: 878464",
        articolo_fornitore: "UI: AR70F18C1AWNEU / UE: AR70F18C1AWXEU",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // CORRETTO
        tipo: "Monosplit"
    },
      {
        id: 57,
        marca: "SAMSUNG",
        modello: "WINDFREE AVANT",
        potenza: "7,0kW - 24000BTU",
        prezzo: 1543.00, // Somma 860 + 683
        wifi: "Sì",
        dimensioni_ui: "299x1055x215", dimensioni_ue: "638x880x310", peso_ui: 12, peso_ue: 37,
        codice_prodotto: "UI: 878442 / UE: 878465",
        articolo_fornitore: "UI: AR70F24C1AWNEU / UE: AR70F24C1AWXEU",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://samsung-climatesolutions.com/content/dam/dtnl-aem-samsung-seace/it/it-it/documents/schede-tecniche/Samsung_Scheda%20Tecnica%20WindFree%20Avant%20S2_2025.pdf",
        image_url: "../images/windfree_avant.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 58,
        marca: "IMMERGAS",
        modello: "THOR",
        potenza: "2,5kW - 9000BTU",
        prezzo: 375.00, // Somma 242 + 133
        wifi: "No",
        dimensioni_ui: "292x729x204", dimensioni_ue: "495x727x270", peso_ui: 8, peso_ue: 24,
        codice_prodotto: "UI: 842199 / UE: 842413",
        articolo_fornitore: "UI: 3.035.031 / UE: 3.035.032",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.immergas.com/media/Prodotto/660567cc8ff9c282fc91b7e1/GOTHA_THOR_MULTI%20-%20S266.pdf",
        image_url: "../images/thor.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 59,
        marca: "IMMERGAS",
        modello: "THOR",
        potenza: "3,5kW - 12000BTU",
        prezzo: 395.00, // Somma 253 + 142
        wifi: "No",
        dimensioni_ui: "296x805x205", dimensioni_ue: "495x727x270", peso_ui: 9, peso_ue: 24,
        codice_prodotto: "UI: 842200 / UE: 842414",
        articolo_fornitore: "UI: 3.035.033 / UE: 3.035.034",
        classe_energetica_raffrescamento: "A++", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.immergas.com/media/Prodotto/660567cc8ff9c282fc91b7e1/GOTHA_THOR_MULTI%20-%20S266.pdf",
        image_url: "../images/thor.png", // CORRETTO
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
        image_url: "../images/vitoclima_232.png", // CORRETTO
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
        image_url: "../images/vitoclima_232.png", // CORRETTO
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
        image_url: "../images/vitoclima_232.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 63,
        marca: "INNOVA",
        modello: "2.0",
        potenza: "1,70kW - 9000BTU",
        prezzo: 1305.00,
        wifi: "Sì",
        dimensioni_ui: "549x810x165", dimensioni_ue: null, peso_ui: 38, peso_ue: null,
        codice_prodotto: "840761",
        articolo_fornitore: "C5MO09IC3II",
        classe_energetica_raffrescamento: "A+", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.innovaenergie.com/site/assets/files/2792/20_it.pdf",
        image_url: "../images/innova_2_0.png", // CORRETTO
        tipo: "Monosplit" // Considerato Monosplit per semplicità, ma è un monoblocco
    },
     {
        id: 64,
        marca: "INNOVA",
        modello: "2.0",
        potenza: "2,10kW - 10000 BTU",
        prezzo: 1305.00,
        wifi: "Sì",
        dimensioni_ui: "549x1010x165", dimensioni_ue: null, peso_ui: 41, peso_ue: null,
        codice_prodotto: "844814",
        articolo_fornitore: "C3MO10IC3II",
        classe_energetica_raffrescamento: "A+", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.innovaenergie.com/site/assets/files/2792/20_it.pdf",
        image_url: "../images/innova_2_0.png", // CORRETTO
        tipo: "Monosplit"
    },
     {
        id: 65,
        marca: "INNOVA",
        modello: "2.0",
        potenza: "2,30kW - 12000 BTU",
        prezzo: 1410.00,
        wifi: "Sì",
        dimensioni_ui: "549x1010x165", dimensioni_ue: null, peso_ui: 41, peso_ue: null,
        codice_prodotto: "839117",
        articolo_fornitore: "C3MO12IC3II",
        classe_energetica_raffrescamento: "A+", classe_energetica_riscaldamento: "A+",
        scheda_tecnica_url: "https://www.innovaenergie.com/site/assets/files/2792/20_it.pdf",
        image_url: "../images/innova_2_0.png", // CORRETTO
        tipo: "Monosplit"
    }
]; // <-- FINE ARRAY products