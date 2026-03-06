// ============================================================
//  script.js — Maria Electro Tech v2
//  Updated profit model: Material margin + Labour split
// ============================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxI41At2-GMrk0S8CU0qb04XKsOcR4WgwJeC-M3WWAxkD3V5Ekn2sKYZhV8EPjotaN_nQ/exec";

// ── SAVE JOB (new profit model) ───────────────────────────
async function saveJobToSheet(data) {
  try {
    const params = new URLSearchParams({ action: "add", ...data });
    const res    = await fetch(SCRIPT_URL + "?" + params.toString());
    const result = await res.json();
    return result.status === "ok";
  } catch (err) { console.error("saveJob:", err); return false; }
}

// ── FETCH ALL JOBS ─────────────────────────────────────────
async function fetchJobsFromSheet() {
  try {
    const res    = await fetch(SCRIPT_URL + "?action=get");
    const result = await res.json();
    return result.status === "ok" ? result.data : null;
  } catch (err) { console.error("fetchJobs:", err); return null; }
}

// ── FETCH GALLERY PHOTOS ───────────────────────────────────
async function fetchGalleryPhotos() {
  try {
    const res    = await fetch(SCRIPT_URL + "?action=getPhotos");
    const result = await res.json();
    return result.status === "ok" ? result.photos : null;
  } catch (err) { console.error("fetchPhotos:", err); return null; }
}

// ── STAFF EXPENSES ─────────────────────────────────────────
async function saveStaffExpense(data) {
  try {
    const params = new URLSearchParams({ action: "addExpense", ...data });
    const res    = await fetch(SCRIPT_URL + "?" + params.toString());
    const result = await res.json();
    return result.status === "ok";
  } catch (err) { console.error("saveExpense:", err); return false; }
}

async function fetchStaffExpenses() {
  try {
    const res    = await fetch(SCRIPT_URL + "?action=getExpenses");
    const result = await res.json();
    return result.status === "ok" ? result.data : null;
  } catch (err) { console.error("fetchExpenses:", err); return null; }
}

// ── PHOTO UPLOAD ───────────────────────────────────────────
async function uploadPhotoToSheet(file, caption) {
  try {
    const base64 = await toBase64(file);
    const params = new URLSearchParams({
      action: 'uploadPhoto', filename: file.name,
      mimetype: file.type, caption, imageData: base64
    });
    const res    = await fetch(SCRIPT_URL + '?' + params.toString());
    const result = await res.json();
    return result.status === 'ok';
  } catch (err) { console.error("uploadPhoto:", err); return false; }
}

async function deletePhotoFromSheet(fileId) {
  try {
    const params = new URLSearchParams({ action: 'deletePhoto', fileId });
    const res    = await fetch(SCRIPT_URL + '?' + params.toString());
    const result = await res.json();
    return result.status === 'ok';
  } catch (err) { return false; }
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── STAFF LIST (add / remove / fetch) ─────────────────────
async function fetchStaffList() {
  try {
    const res    = await fetch(SCRIPT_URL + "?action=getStaff");
    const result = await res.json();
    return result.status === "ok" ? result.data : [];
  } catch (err) { console.error("fetchStaff:", err); return []; }
}

async function saveStaffMember(data) {
  try {
    const params = new URLSearchParams({ action: "addStaff", ...data });
    const res    = await fetch(SCRIPT_URL + "?" + params.toString());
    const result = await res.json();
    return result.status === "ok";
  } catch (err) { console.error("saveStaff:", err); return false; }
}

async function deleteStaffMember(name) {
  try {
    const params = new URLSearchParams({ action: "removeStaff", name });
    const res    = await fetch(SCRIPT_URL + "?" + params.toString());
    const result = await res.json();
    return result.status === "ok";
  } catch (err) { console.error("deleteStaff:", err); return false; }
}
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className   = "show " + type;
  setTimeout(() => { t.className = ""; }, 3500);
}

// ── DATE HELPERS ───────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getWeekRange(offset = 0) {
  // Week = Mon–Sun
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun
  const mon  = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  const sun  = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: toDateStr(mon), end: toDateStr(sun) };
}

function toDateStr(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

function formatDateDisplay(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function inRange(dateStr, start, end) {
  return dateStr >= start && dateStr <= end;
}

// ── PROFIT CALCULATIONS (new model) ───────────────────────
function calcJobProfit(job) {
  // job columns: [date, name, phone, address, category, desc, staff,
  //   matCharged, matActual, labourCharged, staffCut, totalCharged,
  //   matProfit, labourProfit, finalProfit, payment]
  const matCharged    = parseFloat(job[7])  || 0;
  const matActual     = parseFloat(job[8])  || 0;
  const labourCharged = parseFloat(job[9])  || 0;
  const staffCut      = parseFloat(job[10]) || 0;
  const totalCharged  = parseFloat(job[11]) || 0;

  const matProfit    = matCharged - matActual;
  const labourProfit = labourCharged - staffCut;
  const margin       = totalCharged - (matCharged + labourCharged);
  const finalProfit  = matProfit + labourProfit + margin;

  return { matProfit, labourProfit, margin, finalProfit, staffCut };
}

function fmt(n) {
  return '₹' + (parseFloat(n)||0).toLocaleString('en-IN');
}
