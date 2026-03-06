// ============================================================
//  GOOGLE APPS SCRIPT — Maria Electro Tech v2
//  Handles: Jobs + Staff Expenses + Staff List + Photos
// ============================================================

const SHEET_ID    = "1iyXAdEllgcvVJGh2n7N_CbYcG1mQCxPe7w9qPNDbNB0"; // ← your sheet ID
const FOLDER_ID   = "1uibwTofMdknDrx9I6hBUy35NeuktCfrQ";              // ← your Drive folder ID
const JOBS_SHEET  = "Jobs";
const EXP_SHEET   = "Staff_Expenses";
const STAFF_SHEET = "Staff";   // ← new sheet for staff list
const GAL_SHEET   = "Gallery";

// ── ROUTER ────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;
    switch (action) {
      case "add":          return addJob(e.parameter);
      case "get":          return getJobs();
      case "addExpense":   return addExpense(e.parameter);
      case "getExpenses":  return getExpenses();
      case "addStaff":     return addStaff(e.parameter);
      case "getStaff":     return getStaff();
      case "removeStaff":  return removeStaff(e.parameter);
      case "uploadPhoto":  return uploadPhoto(e.parameter);
      case "getPhotos":    return getPhotos();
      case "deletePhoto":  return deletePhoto(e.parameter);
      default:             return respond({ status: "error", message: "Unknown action: " + action });
    }
  } catch (err) {
    return respond({ status: "error", message: err.toString() });
  }
}

// ══════════════════════════════════════════════════════════
//  STAFF LIST
// ══════════════════════════════════════════════════════════

function getOrCreateStaffSheet(ss) {
  let sheet = ss.getSheetByName(STAFF_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(STAFF_SHEET);
    sheet.appendRow(["Name", "Added Date"]);
    formatHeaderRow(sheet, 1, 2);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function addStaff(p) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateStaffSheet(ss);

  // Check for duplicates (case-insensitive)
  const existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
    : [];
  const alreadyExists = existing.some(n => String(n).toLowerCase() === String(p.name).toLowerCase());
  if (alreadyExists) {
    return respond({ status: "error", message: "Staff member already exists." });
  }

  sheet.appendRow([p.name || "", p.addedDate || ""]);
  return respond({ status: "ok" });
}

function getStaff() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateStaffSheet(ss);

  if (sheet.getLastRow() <= 1) {
    return respond({ status: "ok", data: [] });
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const data   = values
    .filter(r => r[0]) // skip empty rows
    .map(r => ({ name: r[0], addedDate: r[1] || "" }));

  return respond({ status: "ok", data });
}

function removeStaff(p) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateStaffSheet(ss);

  if (sheet.getLastRow() <= 1) {
    return respond({ status: "ok" }); // nothing to remove
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase() === String(p.name).toLowerCase()) {
      sheet.deleteRow(i + 2); // +2 because row 1 is header, array is 0-indexed
      return respond({ status: "ok" });
    }
  }

  return respond({ status: "error", message: "Staff not found." });
}

// ══════════════════════════════════════════════════════════
//  JOBS
// ══════════════════════════════════════════════════════════

function addJob(p) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(JOBS_SHEET);
  if (!sheet) sheet = ss.insertSheet(JOBS_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Date", "Customer Name", "Phone", "Address",
      "Service Category", "Service Description", "Staff",
      "Material Charged", "Material Actual Cost",
      "Labour Charged", "Staff Cut", "Total Charged",
      "Material Profit", "Labour Profit", "Final Profit", "Payment Status"
    ]);
    formatHeaderRow(sheet, 1, 16);
    sheet.setFrozenRows(1);
  }

  const matCharged    = parseFloat(p.matCharged)    || 0;
  const matActual     = parseFloat(p.matActual)     || 0;
  const labourCharged = parseFloat(p.labourCharged) || 0;
  const staffCut      = parseFloat(p.staffCut)      || 0;
  const totalCharged  = parseFloat(p.totalCharged)  || 0;
  const matProfit     = matCharged - matActual;
  const labourProfit  = labourCharged - staffCut;
  const margin        = totalCharged - (matCharged + labourCharged);
  const finalProfit   = matProfit + labourProfit + margin;

  sheet.appendRow([
    p.date || "", p.name || "", p.phone || "", p.address || "",
    p.category || "", p.description || "", p.staff || "",
    matCharged, matActual, labourCharged, staffCut, totalCharged,
    matProfit, labourProfit, finalProfit, p.payment || "Pending"
  ]);

  return respond({ status: "ok" });
}

function getJobs() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(JOBS_SHEET);
  if (!sheet || sheet.getLastRow() <= 1) return respond({ status: "ok", data: [] });

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 16).getValues();
  const rows = values.map(row => {
    if (row[0] instanceof Date)
      row[0] = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd");
    return row;
  });
  return respond({ status: "ok", data: rows });
}

// ══════════════════════════════════════════════════════════
//  STAFF EXPENSES
// ══════════════════════════════════════════════════════════

function addExpense(p) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(EXP_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(EXP_SHEET);
    sheet.appendRow(["Date", "Staff Name", "Type", "Amount", "Note"]);
    formatHeaderRow(sheet, 1, 5);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([p.date||"", p.staff||"", p.type||"", parseFloat(p.amount)||0, p.note||""]);
  return respond({ status: "ok" });
}

function getExpenses() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(EXP_SHEET);
  if (!sheet || sheet.getLastRow() <= 1) return respond({ status: "ok", data: [] });

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const rows = values.map(row => {
    if (row[0] instanceof Date)
      row[0] = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd");
    return row;
  });
  return respond({ status: "ok", data: rows });
}

// ══════════════════════════════════════════════════════════
//  GALLERY PHOTOS
// ══════════════════════════════════════════════════════════

function uploadPhoto(p) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const bytes  = Utilities.base64Decode(p.imageData);
  const blob   = Utilities.newBlob(bytes, p.mimetype, p.filename);
  const file   = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId  = file.getId();
  const caption = p.caption || p.filename.replace(/\.[^.]+$/, "");

  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(GAL_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(GAL_SHEET);
    sheet.appendRow(["File ID", "Caption", "Uploaded At"]);
    formatHeaderRow(sheet, 1, 3);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([fileId, caption, new Date().toISOString()]);
  return respond({ status: "ok", fileId });
}

function getPhotos() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(GAL_SHEET);
  if (!sheet || sheet.getLastRow() <= 1) return respond({ status: "ok", photos: [] });

  const photos = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues()
    .filter(r => r[0])
    .map(r => ({
      fileId:  r[0],
      caption: r[1] || "Project Photo",
      url:     "https://drive.google.com/thumbnail?id=" + r[0] + "&sz=w600"
    }));
  return respond({ status: "ok", photos });
}

function deletePhoto(p) {
  try { DriveApp.getFileById(p.fileId).setTrashed(true); } catch(e) {}
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(GAL_SHEET);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(p.fileId)) { sheet.deleteRow(i + 1); break; }
    }
  }
  return respond({ status: "ok" });
}

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════

function formatHeaderRow(sheet, row, numCols) {
  const range = sheet.getRange(row, 1, 1, numCols);
  range.setBackground("#3DB8E8");
  range.setFontColor("#FFFFFF");
  range.setFontWeight("bold");
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
