// firebase-config.js

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y", // Ricorda di proteggere le tue chiavi in produzione se necessario
    authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
    projectId: "consorzio-artigiani-idraulici",
    storageBucket: "consorzio-artigiani-idraulici.appspot.com", // Corretto con .appspot.com
    messagingSenderId: "136848104008",
    appId: "1:136848104008:web:2724f60607dbe91d09d67d",
    measurementId: "G-NNPV2607G7"
};

let app;
// Initialize Firebase
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized in firebase-config.js");
} else {
    app = firebase.app(); // if already initialized, use that one
    console.log("Firebase already initialized, using existing app in firebase-config.js");
}

// Esponi globalmente db e auth dopo averli inizializzati
// Questa è una pratica comune quando non si usano moduli ES6,
// ma assicurati che sia ciò che vuoi.
window.firebaseApp = app; // Opzionale, se ti serve l'app instance altrove
window.db = firebase.firestore(); // Se usi firestore nella home
window.auth = firebase.auth(); // Inizializza auth qui

// Imposta la persistenza per l'istanza di auth appena creata
if (window.auth) {
    window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("Home Page: Firebase Auth persistence set to LOCAL.");
        })
        .catch((error) => {
            console.error("Home Page: Error setting Firebase Auth persistence:", error);
        });
} else {
    console.error("Home Page: Firebase Auth object (window.auth) not available to set persistence.");
}
