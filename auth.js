// ========================================================== //
//      SCRIPT DI AUTENTICAZIONE UNIVERSALE (auth.js)         //
//    Funziona sia sulla Home Page che sulle pagine interne   //
// ========================================================== //

document.addEventListener('DOMContentLoaded', function () {
    // Controllo che Firebase sia stato caricato
    if (typeof firebase === 'undefined') {
        console.error("Firebase non è stato caricato. Verifica gli script nell'HTML.");
        document.body.innerHTML = '<h1>Errore di configurazione. Contattare l\'amministratore.</h1>';
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- ELEMENTI DOM ---
    // Elementi specifici della HOME PAGE (potrebbero essere null su altre pagine)
    const loginSection = document.getElementById('login-section');
    const appContent = document.getElementById('app-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    // Elementi COMUNI a tutte le pagine (o almeno, che ci aspettiamo di trovare)
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const addCategoryTriggerButton = document.getElementById('add-category-trigger');
    const initialLoader = document.getElementById('initial-loader');

    const ADMIN_EMAILS = ['tecnicovillalta@gmail.com'];

    // Funzione per mostrare il contenuto e nascondere il loader
    function showPageContent(user) {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.classList.remove('hidden');

        // Aggiorna l'header (comune a tutte le pagine)
        if (userDashboard) userDashboard.classList.remove('hidden');
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;

        // Gestione del pulsante admin (comune a tutte le pagine)
        if (addCategoryTriggerButton) {
            if (ADMIN_EMAILS.includes(user.email)) {
                addCategoryTriggerButton.classList.remove('hidden');
            } else {
                addCategoryTriggerButton.classList.add('hidden');
            }
        }
    }

    // Gestore centrale dello stato di autenticazione
    auth.onAuthStateChanged(user => {
        if (user) {
            // L'UTENTE È LOGGATO
            console.log("Utente autenticato:", user.email);

            // Se siamo sulla HOME PAGE, mostra l'area dell'app
            if (loginSection && appContent) {
                loginSection.classList.add('hidden');
                appContent.classList.remove('hidden');
            }
            
            // In ogni caso, mostra il contenuto della pagina corrente e l'header utente
            showPageContent(user);

        } else {
            // L'UTENTE NON È LOGGATO
            const currentPagePath = window.location.pathname;
            
            // Controlliamo se siamo sulla pagina di login (home) o su una pagina interna
            const isHomePage = currentPagePath.endsWith('/index.html') || currentPagePath.endsWith('/');

            if (!isHomePage) {
                // Se non siamo sulla home, reindirizza alla home per il login
                console.log("Utente non loggato, accesso negato. Reindirizzamento alla Home.");
                window.location.href = '../../index.html'; // Percorso per risalire alla root
            } else {
                // Se siamo sulla Home, mostra la schermata di login
                if (initialLoader) initialLoader.classList.add('hidden');
                if (loginSection) loginSection.classList.remove('hidden');
                if (appContent) appContent.classList.add('hidden');
                document.body.classList.remove('hidden');
            }
        }
    });

    // Gestore del form di login (si attiva solo se il form è presente, cioè sulla HOME)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => {
                    console.error("Errore di login:", error);
                    if(loginError) {
                         loginError.textContent = getFirebaseErrorMessage(error);
                         loginError.classList.remove('hidden');
                    }
                });
        });
    }

    // Gestore del logout (presente in tutte le pagine)
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("Logout effettuato.");
                // Reindirizza sempre alla home dopo il logout
                window.location.href = '../../index.html';
            });
        });
    }
    
    // Funzioni helper (già presenti nel tuo codice)
    function getFirebaseErrorMessage(error) { /* ...il tuo codice per gli errori... */ 
        switch (error.code) {
            case 'auth/invalid-email': return 'Formato email non valido.';
            case 'auth/user-disabled': return 'Questo account utente è stato disabilitato.';
            case 'auth/user-not-found': return 'Nessun utente trovato con questa email.';
            case 'auth/wrong-password': return 'Password errata.';
            case 'auth/invalid-credential': return 'Credenziali non valide. Controlla email e password.';
            default: return 'Errore di accesso. Riprova.';
        }
    }
});
