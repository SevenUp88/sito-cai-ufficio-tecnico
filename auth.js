// auth.js - VERSIONE ROBUSTA CON ATTESA INIZIALIZZAZIONE

document.addEventListener('DOMContentLoaded', function () {
    // Attende un istante per dare tempo allo script di inizializzazione inline di essere eseguito
    setTimeout(initializeApp, 100); 
});

function initializeApp() {
    // Controlla se Firebase e i suoi servizi sono pronti
    if (typeof firebase === 'undefined' || typeof window.auth === 'undefined' || typeof window.db === 'undefined') {
        console.error("auth.js: Firebase non è ancora pronto. Riprovo...");
        setTimeout(initializeApp, 200); // Riprova dopo 200ms
        return;
    }

    console.log("auth.js: Firebase è pronto. Avvio logica di autenticazione.");

    const auth = window.auth;
    const db = window.db;

    // Elementi DOM
    const loginSection = document.getElementById('login-section');
    const appContent = document.getElementById('app-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const initialLoader = document.getElementById('initial-loader');

    const btnConfiguratori = document.getElementById('btn-configuratori');
    const btnTestArea = document.getElementById('btn-test-area');
    
    const isHomePage = !!loginSection;

    auth.onAuthStateChanged(user => {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.classList.remove('hidden');
        document.body.style.visibility = 'visible';

        if (user) {
            const isAdmin = user.email === 'tecnicovillalta@gmail.com';

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
            
            if (btnTestArea) {
                if (isAdmin) {
                    btnTestArea.classList.remove('hidden');
                } else {
                    btnTestArea.classList.add('hidden');
                }
            }

            if (userDashboard) userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            
            if (appContent) appContent.classList.remove('hidden');
            if (isHomePage && loginSection) {
                loginSection.classList.add('hidden');
            }

        } else {
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
}```
