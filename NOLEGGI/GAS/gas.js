// firebase-config.js (DEVE essere così ora)

const firebaseConfig = {
    apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
    authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
    projectId: "consorzio-artigiani-idraulici",
    storageBucket: "consorzio-artigiani-idraulici.appspot.com", // Assicurati che questo sia corretto
    messagingSenderId: "136848104008",
    appId: "1:136848104008:web:2724f60607dbe91d09d67d",
    measurementId: "G-NNPV2607G7"
};

let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized in firebase-config.js (Home)");
} else {
    app = firebase.app();
    console.log("Firebase already initialized, using existing app in firebase-config.js (Home)");
}

window.db = firebase.firestore();
window.auth = firebase.auth();

// Set persistence after auth is initialized
if (window.auth) {
    window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("Home Page: Firebase Auth persistence set to LOCAL.");
        })
        .catch((error) => {
            console.error("Home Page: Error setting Firebase Auth persistence:", error);
        });
} else {
    console.error("Home Page firebase-config.js: window.auth not defined, cannot set persistence.");
}
