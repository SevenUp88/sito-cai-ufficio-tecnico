// auth.js - VERSIONE CON CONTROLLO ADMIN

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

    // --- NUOVO: Selettore per il pulsante Configuratori ---
    const btnConfiguratori = document.getElementById('btn-configuratori');
    
    const isHomePage = !!loginSection;

    auth.onAuthStateChanged(user => {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.classList.remove('hidden');
        document.body.style.visibility = 'visible';

        if (user) {
            // --- INIZIO LOGICA ADMIN ---
            if (btnConfiguratori) { // Controlla se il pulsante esiste nella pagina
                if (user.email === 'tecnicovillalta@gmail.com') {
                    // È l'admin: il pulsante è attivo e funzionante
                    btnConfiguratori.disabled = false;
                    btnConfiguratori.classList.remove('disabled');
                    btnConfiguratori.title = "Accedi ai configuratori";
                } else {
                    // È un utente normale: il pulsante viene disabilitato
                    btnConfiguratori.disabled = true;
                    btnConfiguratori.classList.add('disabled');
                    btnConfiguratori.title = "Accesso riservato all'amministratore";
                }
            }
            // --- FINE LOGICA ADMIN ---

            // Il resto della logica rimane invariato
            console.log("Utente autenticato:", user.email);
            if (userDashboard) userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            if (isHomePage) {
                if(loginSection) loginSection.classList.add('hidden');
                if(appContent) appContent.classList.remove('hidden');
            }
        } else {
            // Se l'utente non è loggato, disabilita comunque il pulsante per sicurezza
            if (btnConfiguratori) {
                btnConfiguratori.disabled = true;
                btnConfiguratori.classList.add('disabled');
            }

            if (!isHomePage) {
                console.log("Utente non loggato, reindirizzo alla home...");
                const pathSegments = window.location.pathname.split('/').filter(Boolean);
                const depth = pathSegments.length > 1 ? pathSegments.length - 1 : 0;
                const rootPath = '../'.repeat(depth) || './';
                window.location.href = `${rootPath}index.html`;
            } else {
                if(loginSection) loginSection.classList.remove('hidden');
                if(appContent) appContent.classList.add('hidden');
            }
        }
    });

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
