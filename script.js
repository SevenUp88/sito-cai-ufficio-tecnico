document.addEventListener('DOMContentLoaded', () => {
    // --- Elementi DOM ---
    const btnListini = document.getElementById('btn-listini');
    const submenuListini = document.getElementById('submenu-listini');
    
    // Elementi per il nuovo sottomenu Configuratori
    const btnConfiguratori = document.getElementById('btn-configuratori');
    const submenuConfiguratori = document.getElementById('submenu-configuratori');

    const mainNav = document.getElementById('mainNav'); // Assicurati che <nav class="main-nav"> abbia id="mainNav"

    // Elementi Pannello Aggiungi Categoria
    const addCategoryTriggerBtn = document.getElementById('add-category-trigger');
    const addCategoryPanel = document.getElementById('add-category-panel');
    const addCategoryCloseBtn = document.getElementById('add-category-close');
    const categoryNameInput = document.getElementById('category-name');
    const categoryPathInput = document.getElementById('category-path');
    const categoryIconInput = document.getElementById('category-icon');
    const addCategorySubmitBtn = document.getElementById('add-category-submit');
    const addCategoryFeedback = document.getElementById('add-category-feedback');
    const adminOverlay = document.getElementById('admin-overlay');

    // --- Logica Sottomenu Generica ---
    const currentlyOpenSubmenu = { btn: null, menu: null };

    const toggleSubmenu = (button, submenu) => {
        if (!button || !submenu) {
            console.error("Pulsante o sottomenu non trovato per toggle:", button, submenu);
            return;
        }
        const isCurrentlyVisible = submenu.classList.contains('visible');

        // Chiudi qualsiasi altro sottomenu aperto
        if (currentlyOpenSubmenu.menu && currentlyOpenSubmenu.menu !== submenu) {
            currentlyOpenSubmenu.menu.classList.remove('visible');
            if (currentlyOpenSubmenu.btn) {
                currentlyOpenSubmenu.btn.setAttribute('aria-expanded', 'false');
                currentlyOpenSubmenu.btn.classList.remove('active');
            }
        }

        // Apri/Chiudi il sottomenu corrente
        if (!isCurrentlyVisible) {
            submenu.classList.add('visible');
            button.setAttribute('aria-expanded', 'true');
            button.classList.add('active');
            currentlyOpenSubmenu.btn = button;
            currentlyOpenSubmenu.menu = submenu;
        } else {
            submenu.classList.remove('visible');
            button.setAttribute('aria-expanded', 'false');
            button.classList.remove('active');
            // Se stiamo chiudendo il sottomenu attualmente registrato come aperto
            if (currentlyOpenSubmenu.menu === submenu) {
                currentlyOpenSubmenu.btn = null;
                currentlyOpenSubmenu.menu = null;
            }
        }
    };

    // Event Listener per Sottomenu Listini
    if (btnListini && submenuListini) {
        btnListini.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleSubmenu(btnListini, submenuListini);
        });
    }

    // Event Listener per Sottomenu Configuratori
    if (btnConfiguratori && submenuConfiguratori) {
        btnConfiguratori.addEventListener('click', (event) => {
            event.stopPropagation();
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
                toggleSubmenu(currentlyOpenSubmenu.btn, currentlyOpenSubmenu.menu); // Chiude quello aperto
            }
        }
    });


    // --- Logica Pannello "Aggiungi Categoria" ---
    // (La visibilità di addCategoryTriggerBtn è gestita da auth.js)

    const showAddCategoryPanel = () => {
        if (!addCategoryPanel || !adminOverlay || !categoryNameInput) return;
        addCategoryPanel.classList.remove('hidden');
        adminOverlay.classList.remove('hidden');
        categoryNameInput.value = ''; 
        categoryPathInput.value = ''; 
        categoryIconInput.value = '';
        if(addCategoryFeedback) addCategoryFeedback.classList.add('hidden');
        categoryNameInput.focus();
    };

    const hideAddCategoryPanel = () => {
         if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.add('hidden');
        adminOverlay.classList.add('hidden'); // Nasconde l'overlay generale
    };
    
    if (addCategoryTriggerBtn) {
        addCategoryTriggerBtn.addEventListener('click', () => {
            if (addCategoryPanel && !addCategoryPanel.classList.contains('hidden')) return; 
            showAddCategoryPanel();
        });
    }

    if (addCategorySubmitBtn) {
        addCategorySubmitBtn.addEventListener('click', () => {
            if (!categoryNameInput || !categoryPathInput || !categoryIconInput || !mainNav || !addCategoryFeedback) return;
            
            const name = categoryNameInput.value.trim();
            const path = categoryPathInput.value.trim();
            const iconClassRaw = categoryIconInput.value.trim() || 'folder'; 
            
            if (!name || !path) {
                addCategoryFeedback.textContent = 'Nome categoria e percorso sono obbligatori!';
                addCategoryFeedback.className = 'feedback-message error'; 
                addCategoryFeedback.classList.remove('hidden');
                return;
            }
            
            const newLink = document.createElement('a'); 
            newLink.href = path; 
            newLink.className = 'nav-button';
            
            const newIcon = document.createElement('i');
            if (iconClassRaw.startsWith('fa-') || iconClassRaw.startsWith('fas ') || iconClassRaw.startsWith('far ') || iconClassRaw.startsWith('fab ')) {
                 newIcon.className = iconClassRaw;
            } else {
                 newIcon.className = `fas fa-${iconClassRaw}`; 
            }

            const linkText = document.createTextNode(` ${name}`); 
            newLink.appendChild(newIcon);
            newLink.appendChild(linkText);
            
            mainNav.appendChild(newLink);
            
            categoryNameInput.value = ''; categoryPathInput.value = ''; categoryIconInput.value = '';
            addCategoryFeedback.textContent = `Categoria "${name}" aggiunta!`;
            addCategoryFeedback.className = 'feedback-message success';
            addCategoryFeedback.classList.remove('hidden');
            
            setTimeout(() => {
                addCategoryFeedback.classList.add('hidden');
                // hideAddCategoryPanel(); // Opzionale: chiudi il pannello dopo successo
            }, 3000);
            categoryNameInput.focus(); // Per aggiungere un'altra categoria subito
        });
    }

    if (addCategoryCloseBtn) { addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel); }
    if (adminOverlay) { adminOverlay.addEventListener('click', () => { hideAddCategoryPanel(); }); }

    // Nota: la logica di admin login (showAdminLoginPopup, hideAdminLoginPopup, adminLoginSubmit ecc.)
    // sembra essere gestita primariamente da auth.js. Ho rimosso le chiamate dirette a show/hideAdminLoginPopup
    // da questo script se non strettamente necessarie per il flusso "Aggiungi Categoria",
    // dato che addCategoryTriggerBtn è controllato da auth.js.

}); // Fine DOMContentLoaded
