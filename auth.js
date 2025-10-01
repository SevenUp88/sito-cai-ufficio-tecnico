// auth.js - VERSIONE CORRETTA E UNIVERSALE

document.addEventListener('DOMContentLoaded', function () {
    if (typeof firebase === 'undefined') {
        console.error("Firebase non caricato.");
        return;
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Elementi DOM
    const loginSection = document.getElementById('login-section');
    const appContent = document.getElementById('app-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const initialLoader = document.getElementById('initial-loader');

    // Selettore per il pulsante Configuratori
    const btnConfiguratori = document.getElementById('btn-configuratori');
    
    // Determina se siamo sulla home page controllando la presenza della sezione di login
    const isHomePage = !!loginSection;

    auth.onAuthStateChanged(user => {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.classList.remove('hidden');
        document.body.style.visibility = 'visible';

        if (user) {
            // --- LOGICA ADMIN ---
            if (btnConfiguratori) { // Controlla se il pulsante esiste nella pagina
                if (user.email === 'tecnicovillalta@gmail.com') {
                    btnConfiguratori.disabled = false;
                    btnConfiguratori.classList.remove('disabled');
                    btnConfiguratori.title = "Accedi ai configuratori";
                } else {
                    btnConfiguratori.disabled = true;
                    btnConfiguratori.classList.add('disabled');
                    btnConfiguratori.title = "Accesso riservato all'amministratore";
                }
            }
            
            // --- LOGICA PER TUTTE LE PAGINE QUANDO L'UTENTE È LOGGATO ---
            console.log("Utente autenticato:", user.email);

            // Mostra sempre la dashboard e il contenuto dell'app su qualsiasi pagina
            if (userDashboard) userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            if (appContent) appContent.classList.remove('hidden'); // <-- SPOSTATO QUI!

            // Nascondi la sezione di login, ma solo se siamo sulla home page
            if (isHomePage) {
                if(loginSection) loginSection.classList.add('hidden');
            }

        } else {
            // --- LOGICA PER TUTTE LE PAGINE QUANDO L'UTENTE NON È LOGGATO ---

            // Se l'utente non è loggato, disabilita comunque il pulsante per sicurezza
            if (btnConfiguratori) {
                btnConfiguratori.disabled = true;
                btnConfiguratori.classList.add('disabled');
            }

            // Se non siamo sulla home page, reindirizza
            if (!isHomePage) {
                console.log("Utente non loggato, reindirizzo alla home...");
                // Calcola il percorso relativo per tornare alla root del sito
                const pathSegments = window.location.pathname.split('/').filter(Boolean);
                // Calcola la profondità, es. /NOLEGGI/GAS/ -> 2 segmenti -> 2 livelli di ../
                const depth = pathSegments.length > 1 ? pathSegments.length - 1 : 0;
                const rootPath = '../'.repeat(depth) || './';
                window.location.href = `${rootPath}index.html`;
            } else {
                // Se siamo sulla home page, mostra la sezione di login
                if(loginSection) loginSection.classList.remove('hidden');
                if(appContent) appContent.classList.add('hidden');
            }
        }
    });

    // --- GESTIONE LOGIN E LOGOUT (invariata) ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            if (loginError) loginError.textContent = "";
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => {
                    if (loginError) loginError.textContent = "Credenziali non valide. Riprova.";
                    console.error("Errore di login:", error);
                });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut();
        });
    }
});
