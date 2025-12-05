// File: components.js

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Definiamo il codice HTML del menu laterale (SIDEBAR)
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

    // 2. Inseriamo il menu nella pagina
    const sidebarList = document.querySelector('.sidebar-menu');
    if (sidebarList) {
        sidebarList.innerHTML = sidebarContent;
        
        // 3. Logica per attivare i sottomenu (Accordion)
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

        // 4. Logica per evidenziare la pagina corrente (Active State)
        const currentPath = window.location.pathname;
        const allLinks = sidebarList.querySelectorAll('a');
        
        allLinks.forEach(link => {
            // Ottieni il path del link (es. /PREVENTIVI/index.html)
            const linkPath = link.getAttribute('href');
            
            // Se il link corrisponde alla pagina attuale
            if (currentPath.includes(linkPath) && linkPath !== '/' && linkPath !== '#') {
                link.classList.add('active'); // Colora di blu
                
                // Se è dentro un sottomenu, apri il sottomenu padre
                const parentItem = link.closest('.has-submenu');
                if (parentItem) {
                    const parentLink = parentItem.querySelector('.nav-link');
                    const parentSub = parentItem.querySelector('.submenu-list');
                    if(parentLink) parentLink.classList.add('active');
                    if(parentSub) parentSub.style.maxHeight = parentSub.scrollHeight + "px";
                }
            } 
            // Caso speciale per la Home
            else if (currentPath === '/' && linkPath === '/') {
                link.classList.add('active');
            }
        });
    }
});