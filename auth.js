// auth.js - For main index.html authentication

document.addEventListener('DOMContentLoaded', function () {
    // window.auth è inizializzato e configurato per la persistenza in firebase-config.js
    
    // --- SELEZIONE DEGLI ELEMENTI DOM ---
    const loginSection = document.getElementById('login-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    const appContent = document.getElementById('app-content');
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');

    const addCategoryTriggerButton = document.getElementById('add-category-trigger');
    const ADMIN_EMAILS = ['tecnicovillalta@gmail.com'];

    // === NUOVO: Selezione dell'indicatore di caricamento ===
    const initialLoader = document.getElementById('initial-loader');

    // Controllo iniziale per la disponibilità di window.auth
    if (!window.auth) {
        console.error("Home Page auth.js: Firebase Auth object (window.auth) is not available.");
        if (initialLoader) initialLoader.classList.add('hidden'); // Nascondi il loader
        if (loginSection) loginSection.classList.remove('hidden'); // Mostra il login
        if (loginError) {
             loginError.textContent = "Errore critico: Servizio di autenticazione non inizializzato.";
             loginError.classList.remove('hidden');
        }
        return;
    }

    // === MODIFICATO: Funzioni di gestione UI per includere il loader ===
    const showLoginScreen = () => {
        if(loginSection) loginSection.classList.remove('hidden');
        if(appContent) appContent.classList.add('hidden');
        if(userDashboard) userDashboard.classList.add('hidden');
        if(addCategoryTriggerButton) addCategoryTriggerButton.classList.add('hidden');
        // Nascondi il loader quando mostri la schermata di login
        if (initialLoader) initialLoader.classList.add('hidden');
    };

    const showAppContent = (user) => {
        if(loginSection) loginSection.classList.add('hidden');
        if(appContent) appContent.classList.remove('hidden');
        if(userDashboard) userDashboard.classList.remove('hidden');
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;

        if (ADMIN_EMAILS.includes(user.email)) {
            if(addCategoryTriggerButton) addCategoryTriggerButton.classList.remove('hidden');
            ensureAdminRoleInFirestore(user.uid, user.email);
        } else {
            if(addCategoryTriggerButton) addCategoryTriggerButton.classList.add('hidden');
        }
        // Nascondi il loader quando mostri il contenuto dell'app
        if (initialLoader) initialLoader.classList.add('hidden');
    };

    // === MODIFICATO: Logica di onAuthStateChanged ===
    // Questa funzione ora viene chiamata solo quando Firebase ha una risposta definitiva.
    // Durante l'attesa, l'utente vede il loader.
    window.auth.onAuthStateChanged(user => {
        console.log(`Home Page: onAuthStateChanged has a definitive answer. User:`, user ? user.email : 'Not authenticated');
        
        if (user) {
            // Utente loggato
            showAppContent(user);
        } else {
            // Utente non loggato
            showLoginScreen();
        }
    });

    // Handle login form submission (nessuna modifica qui)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            window.auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Home Page: Login successful for", userCredential.user.email);
                    if(loginError) loginError.classList.add('hidden');
                    loginForm.reset();
                })
                .catch((error) => {
                    console.error("Home Page: Login error", error);
                    if(loginError) {
                         loginError.textContent = getFirebaseErrorMessage(error);
                         loginError.classList.remove('hidden');
                    }
                });
        });
    }

    // Handle logout (nessuna modifica qui)
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.auth.signOut().then(() => {
                console.log("Home Page: User logged out successfully.");
            }).catch((error) => {
                console.error("Home Page: Logout error:", error);
                alert("Errore durante il logout.");
            });
        });
    }

    // Funzione per tradurre i codici di errore di Firebase (nessuna modifica qui)
    function getFirebaseErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email': return 'Formato email non valido.';
            case 'auth/user-disabled': return 'Questo account utente è stato disabilitato.';
            case 'auth/user-not-found': return 'Nessun utente trovato con questa email.';
            case 'auth/wrong-password': return 'Password errata.';
            case 'auth/invalid-credential': return 'Credenziali non valide. Controlla email e password.';
            default:
                console.warn("Unhandled Firebase auth error code:", error.code);
                return 'Errore di accesso. Riprova.';
        }
    }

    // Funzione per assicurare il ruolo admin in Firestore (nessuna modifica qui)
    function ensureAdminRoleInFirestore(uid, email) {
        if (!window.db) {
            console.error("Home Page auth.js: Firestore (window.db) not available to ensure admin role.");
            return;
        }
        const userDocRef = window.db.collection('users').doc(uid);
        userDocRef.get().then(doc => {
            if (doc.exists) {
                if (doc.data().role !== 'admin') {
                    console.log(`Home Page: Updating role to admin for ${email} in Firestore.`);
                    userDocRef.update({ role: 'admin' }).catch(err => console.error("Error updating user role:", err));
                }
            } else {
                console.log(`Home Page: Setting role to admin for new user ${email} in Firestore.`);
                userDocRef.set({ email: email, role: 'admin' }).catch(err => console.error("Error setting new admin user:", err));
            }
        }).catch(error => {
            console.error("Home Page: Error fetching user document from Firestore:", error);
        });
    }

}); // Fine DOMContentLoaded
