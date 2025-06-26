// File: script.js
import { auth, db, doc, setDoc, getDoc, onSnapshot } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// --- Stato Globale ---
let currentUser = null, agendaData = {}, unsubscribe;
let currentDisplayedDate = new Date(); 
let isMapsScriptLoaded = false;
let saveTimeout = null;

// --- Costanti e Dizionari ---
const dayKeyMapping = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri" };
const dayLabels = { mon: "Lunedì", tue: "Martedì", wed: "Mercoledì", thu: "Giovedì", fri: "Venerdì" };
const allHours = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const ICONS = {
    note: `<svg ... ></svg>`,
    address: `<svg ... ></svg>`,
    contact: `<svg ... ></svg>`,
    delete: `<svg ... ></svg>`
};
// Riempio le icone per evitare l'errore, ma ti prego di incollarle complete
ICONS.note = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
ICONS.address = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
ICONS.contact = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
ICONS.delete = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;


// --- Inizializzazione ---
initializeApp();

function initializeApp() {
    addEventListeners();
    onAuthStateChanged(auth, handleAuthStateChange);
}

// --- Funzioni Principali ---
async function handleAuthStateChange(user) {
    document.getElementById('authOverlay').style.display = user ? 'none' : 'flex';
    document.getElementById('app').style.display = user ? 'block' : 'none';
    if (user) {
        currentUser = user;
        document.getElementById('user-info').textContent = `Utente: ${user.email}`;
        await setupRealtimeListener();
        loadGoogleMapsScript();
    } else {
        if (unsubscribe) unsubscribe();
        currentUser = null;
    }
}

function loadGoogleMapsScript(){
    if (isMapsScriptLoaded || document.getElementById('google-maps-script')) return;
    isMapsScriptLoaded = true;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC6tvhoIlvIyh8L_jwSVWs_TkXNLKrt540&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initAutocompleteForCurrentDay();
    document.head.appendChild(script);
}

async function setupRealtimeListener() {
    if (unsubscribe) unsubscribe();
    const docRef = doc(db, 'agende', 'principale');
    unsubscribe = onSnapshot(docRef, (docSnap) => {
        agendaData = docSnap.exists() ? docSnap.data() : {};
        updateAllViews();
    });
}

function updateAllViews() {
    buildWeekOverview();
    buildDayDetailView(getDayFromDate(currentDisplayedDate));
}

// --- Costruzione UI ---
function buildWeekOverview() {
    const table = document.getElementById('week-overview-table');
    const { weekDates, weekTitle } = getWeekInfo(currentDisplayedDate);
    document.getElementById('week-title').textContent = weekTitle;
    let header = `<thead><tr><th>Ora</th>`;
    Object.keys(dayLabels).forEach(key => header += `<th>${dayLabels[key].substring(0, 3)} ${weekDates[key]}</th>`);
    header += `</tr></thead>`;
    let body = '<tbody>';
    allHours.forEach(hour => {
        if (hour === '14:00') body += `<tr><td class="pause-label-week" colspan="6">Pausa</td></tr>`;
        body += `<tr><td class="time-col">${hour}</td>`;
        Object.keys(dayLabels).forEach(dayKey => {
            const date = weekDates[dayKey];
            const dataKey = `${date}-${hour}`;
            const note = agendaData[dataKey + '-note'] || "";
            const indirizzo = agendaData[dataKey + '-indirizzo'] || "";
            body += `<td class="slot ${note || indirizzo ? 'is-filled' : ''}" data-date="${date}" data-hour="${hour}" data-daykey="${dayKey}">
                        <div class="slot-summary">${note || indirizzo}</div>
                     </td>`;
        });
        body += `</tr>`;
    });
    table.innerHTML = header + body;
    table.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => handleSlotClick(slot.dataset.date, slot.dataset.hour, slot.dataset.daykey));
    });
}

function buildDayDetailView(dayKey) {
    const container = document.getElementById("consegneContainer");
    const { weekDates } = getWeekInfo(currentDisplayedDate);
    const date = weekDates[dayKey];
    document.getElementById('detail-day-title').textContent = `Dettaglio per ${dayLabels[dayKey]} ${date}`;
    container.innerHTML = "";
    allHours.forEach(hour => {
        const dataKey = `${date}-${hour}`;
        const note = agendaData[dataKey + '-note'] || "";
        const indirizzo = agendaData[dataKey + '-indirizzo'] || "";
        const contatto = agendaData[dataKey + '-contatto'] || "";
        container.insertAdjacentHTML('beforeend', createCardHTML(date, hour, note, indirizzo, contatto));
    });
    addCardEventListeners(date);
    if (isMapsScriptLoaded) initAutocompleteForCurrentDay();
}

function createCardHTML(date, hour, note, indirizzo, contatto) {
    const dataKey = `${date}-${hour}`;
    return `
        <div class="delivery-card ${note || indirizzo || contatto ? 'is-filled' : ''}" id="card-${dataKey}">
            <div class="card-header">
                <div class="card-time">${hour}</div>
                <button class="delete-slot-btn" data-date="${date}" data-hour="${hour}" title="Cancella questa consegna">${ICONS.delete}</button>
            </div>
            <div class="form-group">${ICONS.note}<textarea id="${dataKey}-note" placeholder="Note consegna...">${note}</textarea></div>
            <div class="form-group address-group">
                <a href="${addressLink}" target="_blank" class="address-link">${ICONS.address}</a>
                <input type="text" id="${dataKey}-indirizzo" value="${indirizzo}" placeholder="Indirizzo">
            </div>
            <div class="form-group">${ICONS.contact}<input type="text" id="${dataKey}-contatto" value="${contatto}" placeholder="Contatto/Tel."></div>
        </div>`;
}

// --- Funzioni di Supporto ---
function getWeekInfo(baseDate) {
    const startOfWeek = new Date(baseDate);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    const weekDates = {};
    const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
    Object.keys(dayKeyMapping).forEach(key => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + (key - 1));
        weekDates[dayKeyMapping[key]] = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    });
    const endDate = new Date(startOfWeek);
    endDate.setDate(startOfWeek.getDate() + 4);
    const weekTitle = `Settimana ${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
    return { weekDates, weekTitle };
}

function getDayFromDate(date) { return dayKeyMapping[date.getDay() === 0 ? 7 : date.getDay()]; }
function handleAutoSave(event) {
    clearTimeout(saveTimeout);
    const key = event.target.id;
    agendaData[key] = event.target.value.trim();
    saveTimeout = setTimeout(async () => {
        if (!currentUser) return;
        await setDoc(doc(db, 'agende', 'principale'), agendaData, { merge: true });
    }, 1200);
}

function initAutocompleteForCurrentDay() {
    const dayKey = getDayFromDate(currentDisplayedDate);
    const { weekDates } = getWeekInfo(currentDisplayedDate);
    const date = weekDates[dayKey];
    if (!window.google || !window.google.maps.places) return setTimeout(initAutocompleteForCurrentDay, 300);
    allHours.forEach(hour => {
        const input = document.getElementById(`${date}-${hour}-indirizzo`);
        if (input) new google.maps.places.Autocomplete(input, { componentRestrictions: { country: 'it' } });
    });
}

function addCardEventListeners(date) {
    allHours.forEach(hour => {
        const dataKey = `${date}-${hour}`;
        ['note', 'indirizzo', 'contatto'].forEach(field => {
            document.getElementById(`${dataKey}-${field}`).addEventListener('input', handleAutoSave);
        });
    });
}

// --- Modale e Navigazione ---
function handleSlotClick(date, hour, dayKey) {
    const modal = document.getElementById('slot-modal');
    const note = agendaData[`${date}-${hour}-note`] || "Nessuna nota";
    const indirizzo = agendaData[`${date}-${hour}-indirizzo`] || "Nessun indirizzo";
    const contatto = agendaData[`${date}-${hour}-contatto`] || "Nessun contatto";

    document.getElementById('modal-title').textContent = `Consegna ${dayLabels[dayKey]} ${new Date(date).getDate()} ore ${hour}`;
    document.getElementById('modal-body').innerHTML = `<p><strong>Note:</strong><br>${note}</p><p><strong>Indirizzo:</strong><br>${indirizzo}</p><p><strong>Contatto:</strong><br>${contatto}</p>`;
    
    const navBtn = document.getElementById('modal-nav-btn');
    if (indirizzo !== "Nessun indirizzo") {
        navBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo)}`;
        navBtn.style.display = 'inline-flex';
    } else {
        navBtn.style.display = 'none';
    }

    document.getElementById('modal-delete-btn').onclick = () => deleteSlot(date, hour);
    document.getElementById('modal-edit-btn').onclick = () => {
        const targetDate = new Date(date + 'T00:00:00'); // Assicura che la data non abbia problemi di fuso orario
        currentDisplayedDate = targetDate;
        updateAllViews();
        closeModal();
    };
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function deleteSlot(date, hour) {
    if (confirm(`Cancellare la consegna delle ${hour} del ${date}?`)) {
        ['note','indirizzo','contatto'].forEach(f => delete agendaData[`${date}-${hour}-${f}`]);
        clearTimeout(saveTimeout);
        handleAutoSave({target:{id:`${date}-fake`}});
        closeModal();
    }
}

function closeModal() {
    const modal = document.getElementById('slot-modal');
    modal.classList.remove('visible');
    setTimeout(() => modal.style.display = 'none', 300);
}

// --- Listener Globali ---
function addEventListeners() {
    document.getElementById('prev-week-btn').addEventListener('click', () => { currentDisplayedDate.setDate(currentDisplayedDate.getDate() - 7); updateAllViews(); });
    document.getElementById('next-week-btn').addEventListener('click', () => { currentDisplayedDate.setDate(currentDisplayedDate.getDate() + 7); updateAllViews(); });
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('slot-modal').addEventListener('click', (e) => { if(e.target.id === 'slot-modal') closeModal(); });
}

initializeApp(); // Avvia tutto
