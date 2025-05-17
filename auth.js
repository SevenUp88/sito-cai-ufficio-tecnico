// auth.js - For main index.html authentication

document.addEventListener('DOMContentLoaded', function () {
    const auth = firebase.auth();

    const loginSection = document.getElementById('login-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    const appContent = document.getElementById('app-content');
    const userDashboard = document.getElementById('user-dashboard');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');

    // Admin-specific elements (e.g., for adding categories)
    const addCategoryTriggerButton = document.getElementById('add-category-trigger');
    // Define your admin email(s) here or implement a more robust role check with custom claims
    const ADMIN_EMAILS = ['tecnicovillalta@gmail.com']; // !!! REPLACE WITH YOUR ACTUAL ADMIN EMAIL(S)


    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            loginSection.classList.add('hidden');
            loginError.classList.add('hidden');
            appContent.classList.remove('hidden');
            userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;

            // Check if user is an admin to show admin-specific UI elements
            if (ADMIN_EMAILS.includes(user.email)) {
                if(addCategoryTriggerButton) addCategoryTriggerButton.classList.remove('hidden');
            } else {
                if(addCategoryTriggerButton) addCategoryTriggerButton.classList.add('hidden');
            }

        } else {
            // User is signed out
            loginSection.classList.remove('hidden');
            appContent.classList.add('hidden');
            userDashboard.classList.add('hidden');
            if(addCategoryTriggerButton) addCategoryTriggerButton.classList.add('hidden');
        }
    });

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in
                    loginError.classList.add('hidden');
                    loginForm.reset();
                    // onAuthStateChanged will handle UI update
                })
                .catch((error) => {
                    loginError.textContent = getFirebaseErrorMessage(error);
                    loginError.classList.remove('hidden');
                });
        });
    }

    // Handle logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                // Sign-out successful.
                // onAuthStateChanged will handle UI update
                // Optionally, redirect to a public page or clear state further
                console.log("User logged out.");
            }).catch((error) => {
                console.error("Logout error:", error);
                alert("Errore durante il logout.");
            });
        });
    }

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
            case 'auth/invalid-credential':
                 return 'Credenziali non valide. Controlla email e password.';
            default:
                return 'Errore di accesso. Riprova. (' + error.message + ')';
        }
    }
});
