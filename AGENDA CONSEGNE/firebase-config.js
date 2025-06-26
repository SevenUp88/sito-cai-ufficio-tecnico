// File: /agenda/firebase-config.js  (Versione a Moduli)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// La tua configurazione Firebase (presa dal tuo file)
const firebaseConfig = {
    apiKey: "AIzaSyC_gm-MK5dk2jc_MmmwO7TWBm7oW_D5t1Y",
    authDomain: "consorzio-artigiani-idraulici.firebaseapp.com",
    projectId: "consorzio-artigiani-idraulici",
    storageBucket: "consorzio-artigiani-idraulici.appspot.com",
    messagingSenderId: "136848104008",
    appId: "1:136848104008:web:2724f60607dbe91d09d67d",
    measurementId: "G-NNPV2607G7"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Esporta le istanze per renderle importabili
export { auth, db, doc, setDoc, getDoc };
