// ============================================================
//  script.js — Maria Electro Tech Business System
//  Google Sheet ID: 1iyXAdEllgcvVJGh2n7N_CbYcG1mQCxPe7w9qPNDbNB0
// ============================================================

// ⚠️ STEP: Paste your Google Apps Script URL below.
// You'll get this URL after deploying the Apps Script (Step 4 in guide).
// It looks like: https://script.google.com/macros/s/AKfycb.../exec

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxI41At2-GMrk0S8CU0qb04XKsOcR4WgwJeC-M3WWAxkD3V5Ekn2sKYZhV8EPjotaN_nQ/exec";

// ============================================================
//  SAVE A NEW JOB ROW TO GOOGLE SHEETS
// ============================================================
async function saveJobToSheet(data) {
  try {
    const params = new URLSearchParams({
      action:      "add",
      date:        data.date,
      name:        data.name,
      phone:       data.phone,
      address:     data.address,
      category:    data.category,
      description: data.description,
      staff:       data.staff,
      material:    data.material,
      labour:      data.labour,
      charged:     data.charged,
      profit:      data.profit,
      payment:     data.payment
    });

    const res    = await fetch(SCRIPT_URL + "?" + params.toString());
    const result = await res.json();
    return result.status === "ok";

  } catch (err) {
    console.error("saveJobToSheet error:", err);
    return false;
  }
}

// ============================================================
//  FETCH ALL JOBS FROM GOOGLE SHEETS
// ============================================================
async function fetchJobsFromSheet() {
  try {
    const res    = await fetch(SCRIPT_URL + "?action=get");
    const result = await res.json();
    return result.status === "ok" ? result.data : null;
  } catch (err) {
    console.error("fetchJobsFromSheet error:", err);
    return null;
  }
}

// ============================================================
//  TOAST NOTIFICATION HELPER
// ============================================================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className   = "show " + type;
  setTimeout(() => { toast.className = ""; }, 3500);
}
