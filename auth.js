// auth.js - VERSIONE CON CONTROLLO ADMIN E AREA TEST

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

    // Selettori per i pulsanti con accesso limitato
    const btnConfiguratori = document.getElementById('btn-configuratori');
    const btnTestArea = document.getElementById('btn-test-area'); // --- NUOVO SELETTORE ---
    
    const isHomePage = !!loginSection;

    auth.onAuthStateChanged(user => {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.classList.remove('hidden');
        document.body.style.visibility = 'visible';

        if (user) {
            const isAdmin = user.email === 'tecnicovillalta@gmail.com';

            // --- LOGICA ADMIN PER CONFIGURATORI ---
            if (btnConfiguratori) {
                if (isAdmin) {
                    btnConfiguratori.disabled = false;
                    btnConfiguratori.classList.remove('disabled');
                    btnConfiguratori.title = "Accedi ai configuratori";
                } else {
                    btnConfiguratori.disabled = true;
                    btnConfiguratori.classList.add('disabled');
                    btnConfiguratori.title = "Accesso riservato all'amministratore";
                }
            }
            
            // --- NUOVA LOGICA ADMIN PER AREA TEST ---
            if (btnTestArea) {
                if (isAdmin) {
                    btnTestArea.classList.remove('hidden'); // Mostra il pulsante se è l'admin
                } else {
                    btnTestArea.classList.add('hidden'); // Nascondi il pulsante per tutti gli altri
                }
            }

            // Il resto della logica rimane invariato
            console.log("Utente autenticato:", user.email);
            if (userDashboard) userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            
            // Logica per mostrare/nascondere il contenuto (già corretta per funzionare su tutte le pagine)
            if (appContent) appContent.classList.remove('hidden');
            if (isHomePage && loginSection) {
                loginSection.classList.add('hidden');
            }

        } else {
            // Se l'utente non è loggato, nascondi/disabilita tutto per sicurezza
            if (btnConfiguratori) {
                btnConfiguratori.disabled = true;
                btnConfiguratori.classList.add('disabled');
            }
            if (btnTestArea) {
                btnTestArea.classList.add('hidden');
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
