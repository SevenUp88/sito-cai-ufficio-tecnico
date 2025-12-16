/**
 * components.js
 * Gestisce la generazione centralizzata della Sidebar e della Top Bar (Header)
 * con gestione automatica dell'utente Firebase.
 * 
 * @param {string} pageTitle - Il titolo da visualizzare in alto (es. "Configuratore Multisplit")
 */
function initLayout(pageTitle) {
    
    // =========================================================================
    // 1. GENERAZIONE SIDEBAR (Menu Laterale)
    // =========================================================================
    
    const sidebarContent = `
        <!-- Voce Dashboard -->
        <li>
            <a href="/" class="nav-link">
                <i class="fas fa-th-large"></i> <span>Dashboard</span>
            </a>
        </li>

        <!-- Noleggi -->
        <li class="has-submenu">
            <a href="#" class="nav-link">
                <i class="fas fa-handshake"></i> <span>Noleggi</span>
                <i class="fas fa-chevron-right arrow"></i>
            </a>
            <ul class="submenu-list">
                <li><a href="/NOLEGGI/code.html"><i class="fas fa-wrench"></i> Attrezzature</a></li>
                <li><a href="/NOLEGGI/GAS/index.html"><i class="fas fa-gas-pump"></i> Gas</a></li>
            </ul>
        </li>

        <!-- Preventivazione -->
        <li>
            <a href="/PREVENTIVI/index.html" class="nav-link">
                <i class="fas fa-calculator"></i> <span>Preventivazione</span>
            </a>
        </li>

        <!-- Listini -->
        <li class="has-submenu">
            <a href="#" class="nav-link">
                <i class="fas fa-list"></i> <span>Listini</span>
                <i class="fas fa-chevron-right arrow"></i>
            </a>
            <ul class="submenu-list">
                <li><a href="/LISTINI/CLIMA/monosplit/index.html"><i class="fas fa-snowflake"></i> Clima Monosplit</a></li>
                <li><a href="/LISTINI/CLIMA/multisplit/index.html"><i class="fas fa-wind"></i> Clima Multisplit</a></li>
                <li><a href="/LISTINI/CALDAIE/index.html"><i class="fas fa-fire-alt"></i> Caldaie</a></li>
                <li><a href="/LISTINI/SCALDABAGNI/index.html"><i class="fas fa-shower"></i> Scaldabagno</a></li>
                <li><a href="/LISTINI/SANITARI/index.html"><i class="fas fa-toilet"></i> Sanitari</a></li>
                <li><a href="/LISTINI/LISTINI%20FORNITORI/index.html"><i class="fas fa-truck-fast"></i> Fornitori</a></li>
            </ul>
        </li>

        <!-- Schede Tecniche -->
        <li>
            <a href="/SCHEDE%20TECNICHE/index.html" class="nav-link">
                <i class="fas fa-clipboard-list"></i> <span>Schede Tecniche</span>
            </a>
        </li>

        <!-- Configuratori -->
        <li class="has-submenu">
            <a href="#" class="nav-link">
                <i class="fas fa-cogs"></i> <span>Configuratori</span>
                <i class="fas fa-chevron-right arrow"></i>
            </a>
            <ul class="submenu-list">
                <li><a href="/CONFIGURATORI/IMPIANTO RADIANTE/index.html"><i class="fas fa-border-all"></i> Radiante</a></li>
                <li><a href="/CONFIGURATORI/RADIATORI/index.html"><i class="fas fa-thermometer-half"></i> Radiatori</a></li>
                <li><a href="/CONFIGURATORI/CANNE FUMARIE/index.html"><i class="fas fa-smog"></i> Canne Fumarie</a></li>
                <li><a href="/CONFIGURATORI/MULTISPLIT/index.html"><i class="fas fa-wind"></i> Multisplit</a></li>
            </ul>
        </li>

        <!-- Modulo FGAS -->
        <li class="has-submenu">
            <a href="#" class="nav-link">
                <i class="fas fa-file-signature"></i> <span>Modulo FGAS</span>
                <i class="fas fa-chevron-right arrow"></i>
            </a>
            <ul class="submenu-list">
                <li><a href="/FGAS/apparecchiature.html"><i class="fas fa-tools"></i> Apparecchiature</a></li>
                <li><a href="/FGAS/gas.html"><i class="fas fa-wind"></i> Gas Fluorurati</a></li>
            </ul>
        </li>

        <!-- Scontistiche -->
        <li>
            <a href="/SCONTISTICHE/index.html" class="nav-link">
                <i class="fas fa-tags"></i> <span>Scontistiche</span>
            </a>
        </li>

        <!-- Agenda -->
        <li>
            <a href="/AGENDA%20CONSEGNE/index.html" class="nav-link">
                <i class="fas fa-calendar-alt"></i> <span>Agenda Consegne</span>
            </a>
        </li>
    `;

    // Inserimento HTML nel DOM
    const sidebarList = document.querySelector('.sidebar-menu');
    if (sidebarList) {
        sidebarList.innerHTML = sidebarContent;
        
        // Logica Accordion (Sottomenu)
        const linksWithSubmenu = sidebarList.querySelectorAll('.has-submenu > .nav-link');
        linksWithSubmenu.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                link.classList.toggle('active');
                const submenu = link.nextElementSibling;
                if (submenu.style.maxHeight) {
                    submenu.style.maxHeight = null;
                } else {
                    submenu.style.maxHeight = submenu.scrollHeight + "px";
                }
            });
        });

        // Logica Active State (Evidenzia pagina corrente)
        const currentPath = window.location.pathname;
        const allLinks = sidebarList.querySelectorAll('a');
        
        allLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            // Gestione normalizzata dei path
            if (currentPath.includes(linkPath) && linkPath !== '/' && linkPath !== '#') {
                link.classList.add('active'); 
                const parentItem = link.closest('.has-submenu');
                if (parentItem) {
                    const parentLink = parentItem.querySelector('.nav-link');
                    const parentSub = parentItem.querySelector('.submenu-list');
                    if(parentLink) parentLink.classList.add('active');
                    if(parentSub) parentSub.style.maxHeight = parentSub.scrollHeight + "px";
                }
            } else if (currentPath === '/' && linkPath === '/') {
                link.classList.add('active');
            }
        });
    }

    // =========================================================================
    // 2. GENERAZIONE TOP BAR (Header con Titolo e Utente)
    // =========================================================================

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        // Rimuove eventuali header esistenti per evitare duplicati
        const existingHeader = mainContent.querySelector('header');
        if(existingHeader) existingHeader.remove();

        const headerHTML = `
            <header class="top-bar">
                <div class="page-title"><h2>${pageTitle}</h2></div>
                <div class="user-menu">
                    <div class="user-profile-info">
                        <div class="user-details">
                            <span class="welcome-text">Utente</span>
                            <span id="global-user-name">Caricamento...</span>
                        </div>
                        <div class="user-avatar"><i class="fas fa-user"></i></div>
                        <button id="global-logout-btn" class="btn-logout" title="Esci">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </header>
        `;
        // Inserisce l'header all'inizio del main-content
        mainContent.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // =========================================================================
    // 3. LOGICA UTENTE (Firebase Auth & Firestore)
    // =========================================================================

    if (typeof firebase !== 'undefined') {
        const auth = firebase.auth();
        const db = firebase.firestore();

        auth.onAuthStateChanged(user => {
            const nameEl = document.getElementById('global-user-name');
            const logoutBtn = document.getElementById('global-logout-btn');
            
            if (user) {
                // 1. Mostra email come fallback immediato
                if(nameEl) nameEl.textContent = user.email;

                // 2. Recupera il nome dalla collezione 'users'
                db.collection('users').where('email', '==', user.email).limit(1).get()
                    .then(snapshot => {
                        if (!snapshot.empty) {
                            const userData = snapshot.docs[0].data();
                            if (userData.name && nameEl) {
                                nameEl.textContent = userData.name;
                            }
                        }
                    })
                    .catch(err => console.error("Errore Header User:", err));

                // 3. Gestione Logout
                if(logoutBtn) {
                    logoutBtn.onclick = () => {
                        auth.signOut().then(() => {
                            // Ricarica la pagina o vai al login
                            window.location.reload();
                        });
                    };
                }

            } else {
                // Utente non loggato
                if(nameEl) nameEl.textContent = "Non connesso";
            }
        });
    }
}
