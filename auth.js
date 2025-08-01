document.addEventListener('DOMContentLoaded', function () {
    if (typeof firebase === 'undefined') {
        console.error("Firebase non caricato.");
        return;
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Elementi HOME
    const loginSection = document.getElementById('login-section');
    const appContent = document.getElementById('app-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    // Elementi COMUNI (trovati in header)
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const initialLoader = document.getElementById('initial-loader');
    
    const isHomePage = !!loginSection; // Un modo semplice per sapere se siamo sulla home

    auth.onAuthStateChanged(user => {
        if (initialLoader) initialLoader.classList.add('hidden');
        document.body.classList.remove('hidden');

        if (user) {
            // Utente Loggato
            console.log("Utente autenticato:", user.email);
            
            // Aggiorna sempre l'header
            if (userDashboard) userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;

            // Logica specifica per la HOME
            if (isHomePage) {
                if(loginSection) loginSection.classList.add('hidden');
                if(appContent) appContent.classList.remove('hidden');
            }

        } else {
            // Utente NON loggato
            if (!isHomePage) {
                // Se non siamo sulla home, reindirizza
                console.log("Utente non loggato, reindirizzo...");
                window.location.href = '../../index.html'; // Assumendo che la pagina sia 2 livelli sotto
            } else {
                // Se siamo sulla home, mostra il login
                if(loginSection) loginSection.classList.remove('hidden');
                if(appContent) appContent.classList.add('hidden');
            }
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            auth.signInWithEmailAndPassword(loginForm.email.value, loginForm.password.value)
                .catch(error => {
                    if (loginError) loginError.textContent = "Credenziali non valide.";
                    console.error(error);
                });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut();
        });
    }
});
