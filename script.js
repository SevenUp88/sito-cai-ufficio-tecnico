document.addEventListener('DOMContentLoaded', () => {
    // --- Elementi DOM ---
    const btnListini = document.getElementById('btn-listini');
    const submenuListini = document.getElementById('submenu-listini');
    
    // NUOVI Elementi DOM per Configuratori
    const btnConfiguratori = document.getElementById('btn-configuratori');
    const submenuConfiguratori = document.getElementById('submenu-configuratori');

    const mainNav = document.querySelector('.main-nav'); // Usato per aggiungere nuove categorie

    // Elementi Pannello Aggiungi Categoria (Controllati da auth.js per la visibilità del trigger)
    const addCategoryTriggerBtn = document.getElementById('add-category-trigger'); // Bottone "+" nell'header
    const addCategoryPanel = document.getElementById('add-category-panel');
    const addCategoryCloseBtn = document.getElementById('add-category-close');
    const categoryNameInput = document.getElementById('category-name');
    const categoryPathInput = document.getElementById('category-path');
    const categoryIconInput = document.getElementById('category-icon');
    const addCategorySubmitBtn = document.getElementById('add-category-submit');
    const addCategoryFeedback = document.getElementById('add-category-feedback');

    // Overlay condiviso
    const adminOverlay = document.getElementById('admin-overlay');

    // --- Logica Sottomenu Generica ---
    // Tiene traccia dell'ultimo sottomenu aperto
    const currentlyOpenSubmenu = { btn: null, menu: null };

    /**
     * Apre o chiude un sottomenu. Chiude automaticamente altri sottomenu aperti.
     * @param {HTMLElement} button - Il pulsante che controlla il sottomenu.
     * @param {HTMLElement} submenu - L'elemento sottomenu da mostrare/nascondere.
     */
    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) return;

        const isAlreadyOpen = submenu.classList.contains('visible');

        // 1. Chiudi qualsiasi altro sottomenu che potrebbe essere aperto
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) {
                currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
                currentlyOpenSubmenu.btn.classList.remove('active');
            }
        }

        // 2. Apri/Chiudi il sottomenu corrente
        if (isAlreadyOpen) {
            submenu.classList.remove('visible');
            button.setAttribute('aria-expanded', 'false');
            button.classList.remove('active');
            currentlyOpenSubmenu.btn = null;
            currentlyOpenSubmenu.menu = null;
        } else {
            submenu.classList.add('visible');
            button.setAttribute('aria-expanded', 'true');
            button.classList.add('active');
            currentlyOpenSubmenu.btn = button;
            currentlyOpenSubmenu.menu = submenu;
        }
    };

    // Event Listener per Sottomenu Listini
    if (btnListini && submenuListini) {
        btnListini.addEventListener('click', (event) => {
            event.stopPropagation(); // Impedisce al click di chiudere immediatamente il menu
            toggleSubmenu(btnListini, submenuListini);
        });
    }

    // Event Listener per Sottomenu Configuratori
    if (btnConfiguratori && submenuConfiguratori) {
        btnConfiguratori.addEventListener('click', (event) => {
            event.stopPropagation(); // Impedisce al click di chiudere immediatamente il menu
            toggleSubmenu(btnConfiguratori, submenuConfiguratori);
        });
    }

    // Chiudi i sottomenu se si clicca altrove nel documento
    document.addEventListener('click', (event) => {
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.btn) {
            // Controlla se il click è avvenuto fuori dal pulsante attivo E fuori dal sottomenu attivo
            const isClickInsideButton = currentlyOpenSubmenu.btn.contains(event.target);
            const isClickInsideSubmenu = currentlyOpenSubmenu.menu.contains(event.target);

            if (!isClickInsideButton && !isClickInsideSubmenu) {
                // Chiama toggleSubmenu sull'elemento aperto per chiuderlo
                toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu); 
            }
        }
    });


    // --- Logica Pannello "Aggiungi Categoria" ---

    /** Mostra il pannello per aggiungere una nuova categoria. */
    const showAddCategoryPanel = () => {
        if (!addCategoryPanel || !adminOverlay || !categoryNameInput) return;
        addCategoryPanel.classList.remove('hidden');
        adminOverlay.classList.remove('hidden'); // Mostra l'overlay
        categoryNameInput.value = ''; // Pulisci i campi
        categoryPathInput.value = '';
        categoryIconInput.value = '';
        addCategoryFeedback.classList.add('hidden'); // Nascondi messaggi precedenti
        categoryNameInput.focus();
    };

    /** Nasconde il pannello per aggiungere una nuova categoria. */
    const hideAddCategoryPanel = () => {
         if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.add('hidden');
        adminOverlay.classList.add('hidden'); // Nasconde l'overlay solo se non ci sono altri popup aperti (non necessario qui)
    };
    
    // Event Listener per il bottone trigger "+" nell'header (visibile solo per admin via auth.js)
    if (addCategoryTriggerBtn) {
        addCategoryTriggerBtn.addEventListener('click', () => {
            // Non riaprire se già aperto
            if (addCategoryPanel && !addCategoryPanel.classList.contains('hidden')) return; 
            showAddCategoryPanel();
        });
    }

    // Gestione del submit del pannello "Aggiungi Categoria"
    if (addCategorySubmitBtn) {
        addCategorySubmitBtn.addEventListener('click', () => {
            if (!categoryNameInput || !categoryPathInput || !categoryIconInput || !mainNav || !addCategoryFeedback) return;
            
            const name = categoryNameInput.value.trim();
            const path = categoryPathInput.value.trim();
            const iconClassRaw = categoryIconInput.value.trim() || 'folder'; // Default a 'folder' se vuoto
            
            if (!name || !path) {
                addCategoryFeedback.textContent = 'Nome categoria e percorso sono obbligatori!';
                addCategoryFeedback.className = 'feedback-message error'; // Applica stile errore
                addCategoryFeedback.classList.remove('hidden');
                return;
            }
            
            const newLink = document.createElement('a'); 
            newLink.href = path; 
            newLink.className = 'nav-button';
            
            const newIcon = document.createElement('i');
            // Gestione intelligente della classe dell'icona Font Awesome
            if (iconClassRaw.startsWith('fa-') || iconClassRaw.startsWith('fas ') || iconClassRaw.startsWith('far ') || iconClassRaw.startsWith('fab ')) {
                newIcon.className = iconClassRaw; // L'utente ha fornito la classe completa (es. "fas fa-tools")
            } else {
                newIcon.className = `fas fa-${iconClassRaw}`; // Aggiunge "fas fa-" di default (es. "tools" -> "fas fa-tools")
            }

            const linkText = document.createTextNode(` ${name}`); // Spazio aggiunto prima del nome
            newLink.appendChild(newIcon);
            newLink.appendChild(linkText);
            
            if (mainNav) { // Assicurati che mainNav esista
                mainNav.appendChild(newLink); // Aggiunge alla navigazione principale
            }
            
            // Feedback visivo e reset campi
            addCategoryFeedback.textContent = `Categoria "${name}" aggiunta!`;
            addCategoryFeedback.className = 'feedback-message success'; // Applica stile successo
            addCategoryFeedback.classList.remove('hidden');
            
            // Pulisci i campi
            categoryNameInput.value = ''; 
            categoryPathInput.value = ''; 
            categoryIconInput.value = '';
            
            // Nascondi il feedback e il pannello dopo un po'
            setTimeout(() => {
                addCategoryFeedback.classList.add('hidden');
                hideAddCategoryPanel(); 
            }, 2500);
        });
    }

    // Gestione chiusura pannello "Aggiungi Categoria"
    if (addCategoryCloseBtn) {
        addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel);
    }

    // Chiusura dei popup (solo il pannello categorie, il login è in auth.js) cliccando sull'overlay
    if (adminOverlay) { 
        adminOverlay.addEventListener('click', () => { 
            // La logica di login è gestita da auth.js, quindi qui chiudiamo solo il pannello categorie se aperto
            if (addCategoryPanel && !addCategoryPanel.classList.contains('hidden')) {
                hideAddCategoryPanel();
            }
        }); 
    }
});
