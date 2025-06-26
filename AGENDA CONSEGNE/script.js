import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyC6tvhoIlvIyh8L_jwSVWs_TkXNLKrt540", authDomain: "consorzio-artigiani-idraulici.firebaseapp.com", projectId: "consorzio-artigiani-idraulici", storageBucket: "consorzio-artigiani-idraulici.appspot.com", messagingSenderId: "136848104008", appId: "1:136848104008:web:2724f60607dbe91d09d67d" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser, agendaData = {}, unsubscribe, saveTimeout, isMapsScriptLoaded = false;
let currentDisplayedDate = new Date();
const dayKeyMapping = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri" };
const dayLabels = { mon: "Lunedì", tue: "Martedì", wed: "Mercoledì", thu: "Giovedì", fri: "Venerdì" };
const allHours = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    addEventListeners();
    onAuthStateChanged(auth, handleAuthStateChange);
}

async function handleAuthStateChange(user) {
    document.getElementById('authOverlay').style.display = user ? 'none' : 'flex';
    document.getElementById('app').style.display = user ? 'block' : 'none';
    if (user) {
        currentUser = user;
        document.getElementById('user-info').textContent = user.email;
        await setupRealtimeListener();
        loadGoogleMapsScript();
    } else {
        if (unsubscribe) unsubscribe();
        currentUser = null;
    }
}

function loadGoogleMapsScript() {
    if (isMapsScriptLoaded) return;
    isMapsScriptLoaded = true;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${firebaseConfig.apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => console.log("Google Maps API caricata.");
    document.head.appendChild(script);
}

async function setupRealtimeListener() {
    if (unsubscribe) unsubscribe();
    const docRef = doc(db, 'agende', 'principale');
    unsubscribe = onSnapshot(docRef, (docSnap) => {
        agendaData = docSnap.exists() ? docSnap.data() : {};
        buildWeekOverview();
    });
}

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
        weekDates[dayKeyMapping[key]] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const endDate = new Date(startOfWeek);
    endDate.setDate(startOfWeek.getDate() + 4);
    const weekTitle = `Settimana ${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
    return { weekDates, weekTitle };
}

function buildWeekOverview() {
    const table = document.getElementById('week-overview-table');
    const { weekDates, weekTitle } = getWeekInfo(currentDisplayedDate);
    document.getElementById('week-title').textContent = weekTitle;
    let header = `<thead><tr><th>Ora</th>`;
    Object.keys(dayLabels).forEach(key => header += `<th>${dayLabels[key].substring(0, 3)} ${weekDates[key].split('-')[2]}</th>`);
    header += `</tr></thead>`;
    let body = '<tbody>';
    allHours.forEach(hour => {
        if (hour === '14:00') body += `<tr><td class="pause-label-week" colspan="6">Pausa</td></tr>`;
        body += `<tr><td class="time-col">${hour}</td>`;
        Object.keys(dayLabels).forEach(dayKey => {
            const date = weekDates[dayKey];
            const dataKey = `${date}-${hour}`;
            const cliente = agendaData[dataKey + '-cliente'] || "";
            const indirizzo = agendaData[dataKey + '-indirizzo'] || "";
            body += `<td class="slot ${cliente || indirizzo ? 'is-filled' : ''}" data-date="${date}" data-hour="${hour}" data-daykey="${dayKey}"><div class="slot-summary"><strong>${cliente}</strong>${indirizzo}</div></td>`;
        });
        body += '</tr>';
    });
    table.innerHTML = header + body;
    table.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => handleSlotClick(slot.dataset.date, slot.dataset.hour, slot.dataset.daykey));
    });
}

function handleSlotClick(date, hour, dayKey) {
    const modal = document.getElementById('slot-modal');
    const dataKey = `${date}-${hour}`;
    document.getElementById('modal-title').textContent = `Consegna: ${dayLabels[dayKey]} ${date.split('-')[2]}, ore ${hour}`;
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label for="modal-cliente">Cliente</label><input type="text" id="modal-cliente" value="${agendaData[dataKey + '-cliente'] || ""}" placeholder="Nome Cliente"></div>
        <div class="form-group"><label for="modal-indirizzo">Indirizzo</label><input type="text" id="modal-indirizzo" value="${agendaData[dataKey + '-indirizzo'] || ""}" placeholder="Via, numero, città"></div>
        <div class="form-group"><label for="modal-note">Note</label><textarea id="modal-note" placeholder="Materiale, dettagli, contatto...">${agendaData[dataKey + '-note'] || ""}</textarea></div>
    `;
    ['cliente', 'indirizzo', 'note'].forEach(field => {
        document.getElementById(`modal-${field}`).addEventListener('input', (e) => handleModalAutoSave(e, dataKey, field));
    });
    if (isMapsScriptLoaded && window.google) new google.maps.places.Autocomplete(document.getElementById('modal-indirizzo'), { componentRestrictions: { country: 'it' } });
    const navBtn = document.getElementById('modal-nav-btn');
    const hasAddress = agendaData[dataKey + '-indirizzo'] && agendaData[dataKey + '-indirizzo'].trim() !== '';
    navBtn.style.display = hasAddress ? 'inline-flex' : 'none';
    navBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agendaData[dataKey + '-indirizzo'] || '')}`;
    document.getElementById('modal-delete-btn').onclick = () => deleteSlot(dataKey, dayLabels[dayKey], hour);
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closeModal() {
    const modal = document.getElementById('slot-modal');
    modal.classList.remove('visible');
    setTimeout(() => modal.style.display = 'none', 300);
}

function handleModalAutoSave(event, dataKey, field) {
    clearTimeout(saveTimeout);
    const firestoreKey = `${dataKey}-${field}`;
    agendaData[firestoreKey] = event.target.value.trim();
    saveTimeout = setTimeout(async () => {
        if (!currentUser) return;
        await setDoc(doc(db, "agende", "principale"), agendaData, { merge: true });
    }, 800);
    if (field === 'indirizzo') {
        const navBtn = document.getElementById('modal-nav-btn');
        const indirizzo = event.target.value.trim();
        navBtn.style.display = indirizzo ? 'inline-flex' : 'none';
        navBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo)}`;
    }
}

function deleteSlot(dataKey, dayName, hour) {
    if (confirm(`Cancellare la consegna delle ${hour} di ${dayName}?`)) {
        ['cliente', 'indirizzo', 'note'].forEach(f => delete agendaData[`${dataKey}-${f}`]);
        clearTimeout(saveTimeout);
        handleModalAutoSave({ target: { value: '' } }, dataKey.substring(0, dataKey.lastIndexOf('-')), 'fake');
        closeModal();
    }
}

function addEventListeners() {
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
    document.getElementById('prev-week-btn').addEventListener('click', () => { currentDisplayedDate.setDate(currentDisplayedDate.getDate() - 7); buildWeekOverview(); });
    document.getElementById('next-week-btn').addEventListener('click', () => { currentDisplayedDate.setDate(currentDisplayedDate.getDate() + 7); buildWeekOverview(); });
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-done-btn').addEventListener('click', closeModal);
    document.getElementById('slot-modal').addEventListener('click', (e) => { if (e.target.id === 'slot-modal') closeModal(); });
    document.getElementById('print-weekly-btn').addEventListener('click', printWeek);
}

function printWeek() {
    const { weekDates } = getWeekInfo(currentDisplayedDate);
    let tableHtml = `<thead><tr><th>Ora</th>`;
    Object.keys(dayLabels).forEach(dayKey => tableHtml += `<th>${dayLabels[dayKey]} ${weekDates[dayKey].split('-')[2]}</th>`);
    tableHtml += `</tr></thead><tbody>`;

    allHours.forEach(hour => {
        if (hour === '14:00') tableHtml += `<tr><td colspan="6" style="text-align:center;font-style:italic;">Pausa</td></tr>`;
        tableHtml += `<tr><td><b>${hour}</b></td>`;
        Object.keys(dayLabels).forEach(dayKey => {
            const date = weekDates[dayKey];
            const cliente = agendaData[`${date}-${hour}-cliente`] || "";
            const indirizzo = agendaData[`${date}-${hour}-indirizzo`] || "";
            const note = agendaData[`${date}-${hour}-note`] || "";
            let content = '';
            if (cliente) content += `<strong>${cliente.toUpperCase()}</strong><br>`;
            if (indirizzo) content += `${indirizzo}<br>`;
            if (note) content += `<small><em>${note.replace(/\n/g, "<br>")}</em></small>`;
            tableHtml += `<td>${content || '-'}</td>`;
        });
        tableHtml += `</tr>`;
    });
    const finalHtml = `<h2>Agenda ${document.getElementById('week-title').textContent}</h2><table>${tableHtml}</tbody></table>`;
    printContent(finalHtml);
}

function printContent(html) {
    const printable = document.getElementById("printable");
    printable.innerHTML = html;
    window.print();
}

const handleLogin = () => { /* Già definito sopra, questo è un duplicato */ };
