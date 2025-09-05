/*
 * ==========================================================
 *     File di Configurazione Globale di Firebase
 * ==========================================================
 *  Questo file legge le chiavi dalle variabili d'ambiente di Netlify.
 *  In questo modo, il sito di produzione userà le chiavi di produzione
 *  e il sito di test userà le chiavi di test, in modo sicuro.
 */

const firebaseConfig = {
  apiKey:             process.env.apiKey,
  authDomain:         process.env.authDomain,
  projectId:          process.env.PROJECT_ID,
  storageBucket:      process.env.STORAGE_BUCKET,
  messagingSenderId:  process.env.messagingSenderId,
  appId:              process.env.appId
};

// Controlla che le variabili siano state caricate
// Se questo controllo fallisce, significa che le variabili d'ambiente su Netlify
// non sono state lette correttamente.
if (!firebaseConfig.projectId) {
    console.error("ERRORE CRITICO: Le variabili d'ambiente di Firebase non sono state caricate!");
    document.body.innerHTML = '<h1>Errore di Configurazione Applicazione. Contattare l\'amministratore.</h1>';
} else {
    // Inizializza Firebase solo se non è già stato fatto
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log(`Firebase inizializzato per il progetto: ${firebaseConfig.projectId}`);
    }
}
