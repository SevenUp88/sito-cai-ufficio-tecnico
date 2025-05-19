document.addEventListener('DOMContentLoaded', () => {
    // --- Elementi DOM ---
    // const bodyElement = document.body; // Non più necessario per aggiungere/rimuovere classe
    const btnListini = document.getElementById('btn-listini');
    const submenuListini = document.getElementById('submenu-listini');
    const mainNav = document.querySelector('.main-nav');

    // Elementi Admin Login
    const adminToggleButton = document.getElementById('admin-toggle');
    const adminLoginPopup = document.getElementById('admin-login-popup');
    const adminPasswordInput = document.getElementById('admin-password');
    const adminLoginSubmit = document.getElementById('admin-login-submit');
    const adminLoginCancel = document.getElementById('admin-login-cancel');
    const adminErrorMessage = document.getElementById('admin-error-message');

    // Elementi Pannello Aggiungi Categoria
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

    // --- Logica Sottomenu Listini (Invariata) ---
    const toggleSubmenu = (show) => { /* ... codice invariato ... */
        if (!submenuListini || !btnListini) return;
        if (show) { submenuListini.classList.add('visible'); btnListini.setAttribute('aria-expanded', 'true'); btnListini.classList.add('active'); }
        else { submenuListini.classList.remove('visible'); btnListini.setAttribute('aria-expanded', 'false'); btnListini.classList.remove('active'); }
    };
    if (btnListini) { btnListini.addEventListener('click', (event) => { event.stopPropagation(); toggleSubmenu(!submenuListini.classList.contains('visible')); }); }
    document.addEventListener('click', (event) => { if (submenuListini && submenuListini.classList.contains('visible')) { if (btnListini && !btnListini.contains(event.target) && !submenuListini.contains(event.target)) { toggleSubmenu(false); } } });

    // --- Logica Admin / Pannelli ---

    const showAdminLoginPopup = () => { /* ... codice invariato ... */
        if (!adminLoginPopup || !adminOverlay || !adminPasswordInput || !adminErrorMessage) return;
        adminLoginPopup.classList.remove('hidden'); adminOverlay.classList.remove('hidden');
        adminPasswordInput.value = ''; adminPasswordInput.focus(); adminErrorMessage.classList.add('hidden');
    };
    const hideAdminLoginPopup = () => { /* ... codice invariato ... */
        if (!adminLoginPopup || !adminOverlay || !adminPasswordInput) return;
        adminLoginPopup.classList.add('hidden'); adminPasswordInput.value = ''; adminErrorMessage.classList.add('hidden');
        if (addCategoryPanel && addCategoryPanel.classList.contains('hidden')) { if(adminOverlay) adminOverlay.classList.add('hidden'); }
    };
    const showAddCategoryPanel = () => { /* ... codice invariato ... */
        if (!addCategoryPanel || !adminOverlay || !categoryNameInput) return;
        addCategoryPanel.classList.remove('hidden'); adminOverlay.classList.remove('hidden');
        categoryNameInput.focus();
        if(categoryNameInput) categoryNameInput.value = ''; if(categoryPathInput) categoryPathInput.value = ''; if(categoryIconInput) categoryIconInput.value = '';
        if(addCategoryFeedback) addCategoryFeedback.classList.add('hidden');
    };
    const hideAddCategoryPanel = () => { /* ... codice invariato ... */
         if (!addCategoryPanel || !adminOverlay) return;
        addCategoryPanel.classList.add('hidden');
        if (adminLoginPopup && adminLoginPopup.classList.contains('hidden')) { if(adminOverlay) adminOverlay.classList.add('hidden'); }
         if(categoryNameInput) categoryNameInput.value = ''; if(categoryPathInput) categoryPathInput.value = ''; if(categoryIconInput) categoryIconInput.value = '';
         if(addCategoryFeedback) addCategoryFeedback.classList.add('hidden');
    };

    // Mostra popup login
    if (adminToggleButton) {
        adminToggleButton.addEventListener('click', () => {
            if (adminLoginPopup && !adminLoginPopup.classList.contains('hidden')) return;
            if (addCategoryPanel && !addCategoryPanel.classList.contains('hidden')) return;
            showAdminLoginPopup();
        });
    }

    // Gestisce il submit del login admin -> ORA MOSTRA SOLO BOTTONE '+'
    if (adminLoginSubmit) {
        adminLoginSubmit.addEventListener('click', () => {
            if (!adminPasswordInput || !adminToggleButton) return;
            const enteredPassword = adminPasswordInput.value;
            if (enteredPassword === '123stella') { // Controlla la password
                hideAdminLoginPopup();
                // NON aggiunge più la classe admin-mode al body
                // bodyElement.classList.add('admin-mode');
                adminToggleButton.disabled = true; // Disabilita il login
                adminToggleButton.title = "Modalità Admin Attiva";
                if (addCategoryTriggerBtn) { // Mostra il bottone '+'
                    addCategoryTriggerBtn.classList.remove('hidden');
                }
            } else {
                if (adminErrorMessage) adminErrorMessage.classList.remove('hidden');
                adminPasswordInput.value = '';
                adminPasswordInput.focus();
            }
        });
    }

     // Invio con Invio nel campo password login
     if (adminPasswordInput) { /* ... codice invariato ... */
         adminPasswordInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); if(adminLoginSubmit) adminLoginSubmit.click(); } });
     }

    // --- Event Listener per bottone '+' che apre il pannello ---
    if (addCategoryTriggerBtn) {
        addCategoryTriggerBtn.addEventListener('click', () => {
             if (addCategoryPanel && !addCategoryPanel.classList.contains('hidden')) return;
            showAddCategoryPanel();
        });
    }

    // --- Logica Pannello Aggiungi Categoria (Submit) (Invariata) ---
    if (addCategorySubmitBtn) { /* ... codice invariato ... */
        addCategorySubmitBtn.addEventListener('click', () => {
            if (!categoryNameInput || !categoryPathInput || !categoryIconInput || !mainNav || !addCategoryFeedback) return;
            const name = categoryNameInput.value.trim(); const path = categoryPathInput.value.trim(); const iconClass = categoryIconInput.value.trim() || 'fas fa-folder';
            if (!name || !path) { addCategoryFeedback.textContent = 'Nome categoria e percorso sono obbligatori!'; addCategoryFeedback.className = 'feedback-message error'; addCategoryFeedback.classList.remove('hidden'); return; }
            const newLink = document.createElement('a'); newLink.href = path; newLink.className = 'nav-button';
            const newIcon = document.createElement('i');
            if (iconClass.includes('fa-')) { newIcon.className = iconClass; if (!iconClass.startsWith('fa')) { newIcon.className = `fas ${iconClass}`; } } else { newIcon.className = `fas ${iconClass}`; }
            const linkText = document.createTextNode(` ${name}`);
            newLink.appendChild(newIcon); newLink.appendChild(linkText); mainNav.appendChild(newLink);
            categoryNameInput.value = ''; categoryPathInput.value = ''; categoryIconInput.value = '';
            addCategoryFeedback.textContent = `Categoria "${name}" aggiunta!`; addCategoryFeedback.className = 'feedback-message success'; addCategoryFeedback.classList.remove('hidden');
            setTimeout(() => { addCategoryFeedback.classList.add('hidden'); }, 3000);
            categoryNameInput.focus();
        });
    }

    // --- Chiusura Pannelli (Invariata) ---
    if (adminLoginCancel) { adminLoginCancel.addEventListener('click', hideAdminLoginPopup); }
    if (addCategoryCloseBtn) { addCategoryCloseBtn.addEventListener('click', hideAddCategoryPanel); }
    if (adminOverlay) { adminOverlay.addEventListener('click', () => { hideAdminLoginPopup(); hideAddCategoryPanel(); }); }

});
