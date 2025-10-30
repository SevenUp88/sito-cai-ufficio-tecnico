// auth.js - VERSIONE FINALE, CORRETTA E UNIVERSALE

document.addEventListener('DOMContentLoaded', function () {
    if (typeof firebase === 'undefined' || !window.auth || !window.db) {
        console.error("auth.js: Firebase non è pronto. Assicurati che firebase-config.js sia caricato prima.");
        return;
    }

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
                btnConfiguratori.disabled = !isAdmin;
                btnConfiguratori.classList.toggle('disabled', !isAdmin);
                btnConfiguratori.title = isAdmin ? "Accedi ai configuratori" : "Accesso riservato all'amministratore";
            }
            
            if (btnTestArea) {
                btnTestArea.classList.toggle('hidden', !isAdmin);
            }

            if (userDashboard) userDashboard.classList.remove('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            
            if (appContent) appContent.classList.remove('hidden');
            if (isHomePage && loginSection) {
