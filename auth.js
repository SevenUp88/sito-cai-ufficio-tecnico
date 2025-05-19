// auth.js - For main index.html authentication

document.addEventListener('DOMContentLoaded', function () {
    // window.auth è inizializzato e configurato per la persistenza in firebase-config.js
    
    // Controllo iniziale per la disponibilità di window.auth
    if (!window.auth) {
        console.error("Home Page auth.js: Firebase Auth object (window.auth) is not available. Check firebase-config.js loading order and initialization.");
        const loginSection = document.getElementById('login-section');
        const loginError = document.getElementById('login-error');
        if(loginSection) loginSection.classList.remove('hidden'); // Mostra il login form se non è già visibile
        if(loginError) {
             loginError.textContent = "Errore critico: Servizio di autenticazione non inizializzato.";
             loginError.classList.remove('hidden');
        }
        return; // Interrompi l'esecuzione se auth non è pronto
    }

    const loginSection = document.getElementById('login-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    const appContent = document.getElementById('app-content');
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');

    const addCategoryTriggerButton = document.getElementById('add-category-trigger');
    // !!! IMPORTANTE: Sostituisci con le tue email admin effettive !!!
    const ADMIN_EMAILS = ['tecnicovillalta@gmail.com']; // Array di email amministrative

    let authStateChangeCount = 0; // Variabile di debug per contare i trigger
    // Listen for auth state changes
    window.auth.onAuthStateChanged(user => {
        authStateChangeCount++;
        console.log(`Home Page: onAuthStateChanged triggered (Count: ${authStateChangeCount}). User:`, user ? user.email : 'Not authenticated');

        if (user) {
            // User is signed in
            loginSection.classList.add('hidden');
            if(loginError) loginError.classList.add('hidden'); // Nascondi eventuali errori di login precedenti
            appContent.classList.remove('hidden');
            userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;

            // Controlla se l'utente è un admin basandosi sull'array ADMIN_EMAILS
            if (ADMIN_EMAILS.includes(user.email)) {
                if(addCategoryTriggerButton) addCategoryTriggerButton.classList.remove('hidden');
                // Assicura che il ruolo 'admin' sia presente in Firestore per questo utente
                ensureAdminRoleInFirestore(user.uid, user.email);
            } else {
                if(addCategoryTriggerButton) addCategoryTriggerButton.classList.add('hidden');
            }

        } else {
            // User is signed out
            loginSection.classList.remove('hidden');
            appContent.classList.add('hidden');
            userDashboard.classList.add('hidden');
            if(addCategoryTriggerButton) addCategoryTriggerButton.classList.add('hidden');
            console.log("Home Page: User is signed out.");
            // Qui potresti voler resettare altre parti della UI o dello stato dell'app
            // se necessario quando un utente fa logout.
        }
    });

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            // Usa l'istanza di auth globale
            window.auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in
                    console.log("Home Page: Login successful for", userCredential.user.email);
                    // onAuthStateChanged gestirà l'aggiornamento della UI
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

    // Handle logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Usa l'istanza di auth globale
            window.auth.signOut().then(() => {
                // Sign-out successful.
                console.log("Home Page: User logged out successfully.");
                // onAuthStateChanged gestirà l'aggiornamento della UI
            }).catch((error) => {
                console.error("Home Page: Logout error:", error);
                alert("Errore durante il logout."); // Feedback all'utente
            });
        });
    }

    // Funzione per tradurre i codici di errore di Firebase in messaggi user-friendly
    function getFirebaseErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Formato email non valido.';
            case 'auth/user-disabled':
                return 'Questo account utente è stato disabilitato.';
            case 'auth/user-not-found':
                return 'Nessun utente trovato con questa email.';
            case 'auth/wrong-password':
                return 'Password errata.';
            case 'auth/invalid-credential': // Codice più generico per v9+
                 return 'Credenziali non valide. Controlla email e password.';
            default:
                console.warn("Unhandled Firebase auth error code:", error.code); // Log per errori non gestiti
                return 'Errore di accesso. Riprova.'; // Messaggio generico
        }
    }

    // Funzione per assicurare che un utente admin (secondo ADMIN_EMAILS)
    // abbia il ruolo 'admin' nel documento Firestore corrispondente.
    function ensureAdminRoleInFirestore(uid, email) {
        // window.db è inizializzato in firebase-config.js
        if (!window.db) {
            console.error("Home Page auth.js: Firestore (window.db) not available to ensure admin role.");
            return;
        }
        const userDocRef = window.db.collection('users').doc(uid);

        userDocRef.get().then(doc => {
            if (doc.exists) {
                // Il documento utente esiste, controlla il ruolo
                if (doc.data().role !== 'admin') {
                    console.log(`Home Page: Updating role to admin for ${email} (UID: ${uid}) in Firestore.`);
                    // Aggiorna il ruolo se non è 'admin'
                    userDocRef.update({ role: 'admin' })
                        .catch(err => console.error("Error updating user role to admin in Firestore:", err));
                } else {
                    // console.log(`Home Page: User ${email} already has admin role in Firestore.`);
                }
            } else {
                // Il documento utente non esiste, crealo con il ruolo admin
                console.log(`Home Page: Setting role to admin for new user ${email} (UID: ${uid}) in Firestore.`);
                userDocRef.set({ email: email, role: 'admin' })
                    .catch(err => console.error("Error setting new admin user with role in Firestore:", err));
            }
        }).catch(error => {
            console.error("Home Page: Error fetching user document from Firestore to ensure admin role:", error);
        });
    }

}); // Fine DOMContentLoaded
