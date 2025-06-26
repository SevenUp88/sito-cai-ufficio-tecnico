// File: script.js - VERSIONE FINALE E CORRETTA
import { auth, db, doc, setDoc, getDoc, onSnapshot } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// --- Dichiarazioni Globali ---
let currentUser, agendaData = {}, saveTimeout, isMapsScriptLoaded = false, unsubscribe;
const dayKeyMapping = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri" };
const dayLabels = { mon: "Lunedì", tue: "Martedì", wed: "Mercoledì", thu: "Giovedì", fri: "Venerdì" };
const allHours = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const ICONS = {
    note: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
    address: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    contact: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
};

// --- Funzione Helper per ID sicuri ---
function sanitizeId(str) {
    return str.replace(/:/g, '-');
}

// --- Funzioni Principali di Avvio ---
function loadGoogleMapsScript() {
    if (isMapsScriptLoaded || document.getElementById('google-maps-script')) return;
    isMapsScriptLoaded = true;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC6tvhoIlvIyh8L_jwSVWs_TkXNLKrt540&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => { if (currentUser) initAutocomplete(document.getElementById('daySelect').value); };
    document.head.appendChild(script);
}

async function setupRealtimeListener() {
    if (unsubscribe) unsubscribe();
    const docRef = doc(db, 'agende', 'principale');
    unsubscribe = onSnapshot(docRef, (docSnap) => {
        agendaData = docSnap.exists() ? docSnap.data() : {};
        const currentDayKey = document.getElementById('daySelect')?.value || 'mon';
        buildWeekOverview(currentDayKey);
        buildDayDetailView(currentDayKey, false);
    });
}

onAuthStateChanged(auth, async (user) => {
    document.getElementById('authOverlay').style.display = user ? 'none' : 'flex';
    document.getElementById('app').style.display = user ? 'block' : 'none';
    if (user) {
        currentUser = user;
        document.getElementById('user-info').textContent = `Utente: ${user.email}`;
        populateDaySelector();
        await setupRealtimeListener();
        loadGoogleMapsScript();
    } else {
        if (unsubscribe) unsubscribe();
        currentUser = null;
    }
});

// --- Gestione Eventi UI ---
const handleLogin = () => {
    const [email, pass, errorP] = [document.getElementById('email').value, document.getElementById('password').value, document.getElementById('authError')];
    errorP.textContent = '';
    signInWithEmailAndPassword(auth, email, pass).catch(e => errorP.textContent = "Credenziali non valide.");
};
document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
document.getElementById('clear-day-btn').addEventListener('click', () => {
    const sel = document.getElementById('daySelect');
    const [dayKey, dayName] = [sel.value, sel.options[sel.selectedIndex].text];
    if (!confirm(`Sei sicuro di voler cancellare TUTTE le consegne di ${dayName}?`)) return;
    allHours.forEach(h => ['note', 'indirizzo', 'contatto'].forEach(f => delete agendaData[`${dayKey}-${h}-${f}`]));
    clearTimeout(saveTimeout);
    handleAutoSave({ target: { id: `${dayKey}-${sanitizeId(allHours[0])}-fake` } });
});

// --- Costruzione Viste (Dashboard e Dettaglio) ---
function getWeekDays() {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(today.setDate(today.getDate() + diff));
    const weekDates = {};
    Object.keys(dayKeyMapping).forEach(key => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + (key - 1));
        weekDates[dayKeyMapping[key]] = day.getDate();
    });
    return weekDates;
}

function buildWeekOverview(activeDayKey) {
    const table = document.getElementById('week-overview-table');
    if (!table) return;
    const dayKeys = Object.keys(dayLabels);
    const weekDates = getWeekDays();
    let header = `<thead><tr><th>Ora</th>`;
    dayKeys.forEach(key => header += `<th>${dayLabels[key].substring(0, 3)} ${weekDates[key]}</th>`);
    header += `</tr></thead>`;
    let body = '<tbody>';
    allHours.forEach(hour => {
        if (hour === '14:00') body += `<tr><td class="pause-label-week" colspan="${dayKeys.length + 1}">Pausa</td></tr>`;
        body += `<tr><td class="time-col">${hour}</td>`;
        dayKeys.forEach(dayKey => {
            const note = agendaData[`${dayKey}-${hour}-note`] || "";
            const indirizzo = agendaData[`${dayKey}-${hour}-indirizzo`] || "";
            body += `<td class="slot ${note || indirizzo ? 'is-filled' : ''} ${dayKey === activeDayKey ? 'active-day-slot' : ''}" data-day="${dayKey}">
                        <div class="slot-summary">${note || indirizzo}</div>
                     </td>`;
        });
        body += '</tr>';
    });
    table.innerHTML = header + body;
    table.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const dayKey = slot.dataset.day;
            document.getElementById('daySelect').value = dayKey;
            buildDayDetailView(dayKey);
            buildWeekOverview(dayKey);
        });
    });
}

function buildDayDetailView(dayKey, scrollToTop = true) {
    if (!dayKey) return;
    const container = document.getElementById("consegneContainer");
    container.innerHTML = "";
    
    allHours.forEach(hour => {
        const [note, indirizzo, contatto] = ['note', 'indirizzo', 'contatto'].map(f => agendaData[`${dayKey}-${hour}-${f}`] || "");
        
        // --- QUESTA È LA CORREZIONE FONDAMENTALE ---
        const sanitizedHour = sanitizeId(hour);
        const cardId = `card-${dayKey}-${sanitizedHour}`;
        const noteId = `${dayKey}-${sanitizedHour}-note`;
        const indirizzoId = `${dayKey}-${sanitizedHour}-indirizzo`;
        const contattoId = `${dayKey}-${sanitizedHour}-contatto`;
        const addressLink = indirizzo ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo)}` : '#';

        const cardHTML = `
            <div class="delivery-card" id="${cardId}">
                <div class="card-fields">
                    <div class="card-header">
                        <div class="card-time">${hour}</div>
                        <button class="delete-slot-btn" data-day="${dayKey}" data-hour="${hour}" title="Cancella questa consegna">${ICONS.delete}</button>
                    </div>
                    <div class="form-group">${ICONS.note}<textarea id="${noteId}" placeholder="Materiale, dettagli...">${note}</textarea></div>
                    <div class="form-group row">
                        <div class="form-group address-group">
                            <a href="${addressLink}" target="_blank" class="address-link">${ICONS.address}</a>
                            <input type="text" id="${indirizzoId}" value="${indirizzo}" placeholder="Indirizzo">
                        </div>
                        <div class="form-group">${ICONS.contact}<input type="text" id="${contattoId}" value="${contatto}" placeholder="Contatto/Tel."></div>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);

        // Ora la querySelector funzionerà perché l'ID è valido
        document.querySelector(`#${cardId} .delete-slot-btn`).addEventListener('click', deleteSingleSlot);
        [noteId, indirizzoId, contattoId].forEach(id => {
            document.getElementById(id).addEventListener('input', handleAutoSave);
        });
    });
    
    if (isMapsScriptLoaded) initAutocomplete(dayKey);
}

// --- Funzioni di Supporto ---
function handleAutoSave(event) {
    clearTimeout(saveTimeout);
    
    const parts = event.target.id.split('-');
    if (parts.length < 4) return; // Gestisce l'evento 'fake' per il clear

    // --- RICOSTRUISCI LA CHIAVE CORRETTA PER FIRESTORE ---
    const dayKey = parts[0];
    const hour = `${parts[1]}:${parts[2]}`; // Riconverte "08-00" in "08:00"
    const field = parts[3];
    
    const firestoreKey = `${dayKey}-${hour}-${field}`;
    agendaData[firestoreKey] = event.target.value.trim();
    
    saveTimeout = setTimeout(async () => {
        if (!currentUser) return;
        await setDoc(doc(db, 'agende', 'principale'), agendaData, { merge: true });
    }, 1200);
}

function populateDaySelector() {
    const select = document.getElementById('daySelect');
    select.innerHTML = '';
    Object.entries(dayLabels).forEach(([key, label]) => select.add(new Option(label, key)));
    select.onchange = (e) => {
        buildDayDetailView(e.target.value);
        buildWeekOverview(e.target.value);
    };
}

function initAutocomplete(dayKey) {
    if (!window.google || !window.google.maps.places) return setTimeout(() => initAutocomplete(dayKey), 300);
    allHours.forEach(hour => {
        const sanitizedHour = sanitizeId(hour);
        const input = document.getElementById(`${dayKey}-${sanitizedHour}-indirizzo`);
        if (input) new google.maps.places.Autocomplete(input, { componentRestrictions: { country: 'it' } });
    });
}

function deleteSingleSlot(event) {
    const { day, hour } = event.currentTarget.dataset;
    if (confirm(`Sei sicuro di voler cancellare la consegna delle ${hour} di ${dayLabels[day]}?`)) {
        ['note', 'indirizzo', 'contatto'].forEach(f => delete agendaData[`${day}-${hour}-${f}`]);
        clearTimeout(saveTimeout);
        handleAutoSave({ target: { id: `${day}-${sanitizeId(hour)}-fake` } });
    }
}

// --- Logica di Stampa (Corretta e Completa) ---
function generatePrintTable(days) {
    const weekDates = getWeekDays();
    let html = `<thead><tr><th>Ora</th>`;
    days.forEach(dayKey => html += `<th>${dayLabels[dayKey]} ${weekDates[dayKey]}</th>`);
    html += `</tr></thead><tbody>`;
    allHours.forEach(hour => {
        if(hour === '14:00') html += `<tr><td colspan="${days.length+1}" style="background:#f0f0f0; text-align:center; font-style:italic;">Pausa Pranzo</td></tr>`;
        html += `<tr><td><b>${hour}</b></td>`;
        days.forEach(dayKey => {
            const note = (agendaData[`${dayKey}-${hour}-note`] || "").replace(/\n/g, "<br>");
            const addr = agendaData[`${dayKey}-${hour}-indirizzo`] || "";
            const contact = agendaData[`${dayKey}-${hour}-contatto`] || "";
            let content = '';
            if(note) content += `<strong>Note:</strong> ${note}<br>`;
            if(addr) content += `<strong>Ind.:</strong> ${addr}<br>`;
            if(contact) content += `<strong>Cont.:</strong> ${contact}`;
            html += `<td>${content || ' - '}</td>`;
        });
        html += '</tr>';
    });
    return `<table>${html}</tbody></table>`;
}

document.getElementById('print-weekly-btn').addEventListener('click', () => {
    const part1 = generatePrintTable(['mon', 'tue', 'wed']).replace('<table>', '<table class="page-break">');
    const part2 = generatePrintTable(['thu', 'fri']);
    printContent(`<h2>Agenda Settimanale</h2>${part1}${part2}`);
});

function printContent(html) {
    const printable = document.getElementById("printable");
    printable.innerHTML = html;
    window.print();
}
