/*
 * ==========================================================
 *     File di Configurazione Globale di Firebase (Versione Definitiva)
 * ==========================================================
 *  Questo file si aspetta di trovare un oggetto 'window.firebaseConfigFromNetlify'
 *  che viene creato e iniettato direttamente da Netlify.
 */

// Controlla se lo snippet di Netlify ha funzionato
if (typeof window.firebaseConfigFromNetlify === 'undefined' || !window.firebaseConfigFromNetlify.projectId) {
    console.error("ERRORE CRITICO: La configurazione di Firebase da Netlify non è stata trovata o è incompleta!");
    document.body.innerHTML = '<h1>Errore di Configurazione Applicazione. Contattare l\'amministratore.</h1>';
} else {
    // Inizializza Firebase usando la configurazione iniettata da Netlify
    if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfigFromNetlify);
        console.log(`Firebase inizializzato per il progetto: ${window.firebaseConfigFromNetlify.projectId}`);
    }
}
