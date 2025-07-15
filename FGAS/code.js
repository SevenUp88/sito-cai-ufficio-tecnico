document.addEventListener('DOMContentLoaded', () => {

    // Seleziona gli elementi del DOM
    const printButton = document.getElementById('print-button');
    
    const checkImpresaCertificata = document.getElementById('is-impresa-certificata');
    const checkAltreFinalita = document.getElementById('is-altre-finalita');

    const sectionImpresaCertificata = document.getElementById('section-impresa-certificata');
    const sectionAltreFinalita = document.getElementById('section-altre-finalita');

    const inputsImpresaCertificata = sectionImpresaCertificata.querySelectorAll('input:not([type="checkbox"])');
    const inputsAltreFinalita = sectionAltreFinalita.querySelectorAll('input:not([type="checkbox"])');

    // Funzione per abilitare/disabilitare i campi di una sezione
    const toggleSectionInputs = (inputs, enable) => {
        inputs.forEach(input => {
            input.disabled = !enable;
            if (!enable) {
                input.value = ''; // Pulisce i campi quando vengono disabilitati
            }
        });
    };

    // Gestore per il checkbox "Impresa Certificata"
    checkImpresaCertificata.addEventListener('change', () => {
        const isChecked = checkImpresaCertificata.checked;
        toggleSectionInputs(inputsImpresaCertificata, isChecked);

        // Se questo è spuntato, deseleziona e disabilita l'altro
        if (isChecked) {
            checkAltreFinalita.checked = false;
            toggleSectionInputs(inputsAltreFinalita, false);
        }
    });

    // Gestore per il checkbox "Altre Finalità"
    checkAltreFinalita.addEventListener('change', () => {
        const isChecked = checkAltreFinalita.checked;
        toggleSectionInputs(inputsAltreFinalita, isChecked);
        
        // Se questo è spuntato, deseleziona e disabilita l'altro
        if (isChecked) {
            checkImpresaCertificata.checked = false;
            toggleSectionInputs(inputsImpresaCertificata, false);
        }
    });

    // Gestore per il pulsante di stampa
    if (printButton) {
        printButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.print();
        });
    }
});