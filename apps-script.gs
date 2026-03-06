// ============================================================
//  GOOGLE APPS SCRIPT — Maria Electro Tech v2
//  Handles: Jobs (new profit model) + Staff Expenses + Photos
//
//  ══════════════════════════════════════════════════════════
//  ONE-TIME SETUP — DO THIS BEFORE DEPLOYING:
//
//  1. Open your Google Sheet
//  2. Rename the first tab to: Jobs
//  3. The script will auto-create a "Gallery" and
//     "Staff_Expenses" sheet on first use
//
//  4. Go to drive.google.com
//  5. Create a folder called "Maria Gallery"
//  6. Right-click → Share → Anyone with link → Viewer
//  7. Open folder, copy the ID from the URL bar:
//     drive.google.com/drive/folders/THIS_PART
//  8. Paste it below where it says PASTE_FOLDER_ID_HERE
//
//  9. After saving this code, click:
//     Deploy → New Deployment → Web App
//     Execute as: Me
//     Who has access: Anyone
//     → Copy the deployment URL → paste into script.js
// ============================================================

const SHEET_ID   = "1iyXAdEllgcvVJGh2n7N_CbYcG1mQCxPe7w9qPNDbNB0"; // ← your sheet ID
const FOLDER_ID  = "PASTE_FOLDER_ID_HERE"; // ← paste your Google Drive folder ID
const JOBS_SHEET = "Jobs";
const EXP_SHEET  = "Staff_Expenses";
const GAL_SHEET  = "Gallery";

// ── ROUTER ────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;
    switch (action) {
      case "add":          return addJob(e.parameter);
      case "get":          return getJobs();
      case "addExpense":   return addExpense(e.parameter);
      case "getExpenses":  return getExpenses();
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
//  JOBS
// ══════════════════════════════════════════════════════════

// New column structure (16 columns):
// [0]  Date
// [1]  Customer Name
// [2]  Phone
// [3]  Address
// [4]  Service Category
// [5]  Service Description
// [6]  Staff
// [7]  Material Charged To Customer
// [8]  Material Actual Cost (Dealer)
// [9]  Total Labour Charged
// [10] Staff Cut
// [11] Total Amount Charged
// [12] Material Profit
// [13] Labour Profit
// [14] Final Profit
// [15] Payment Status

function addJob(p) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let sheet   = ss.getSheetByName(JOBS_SHEET);

  if (!sheet) sheet = ss.insertSheet(JOBS_SHEET);

  // Auto-create header row if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Date", "Customer Name", "Phone", "Address",
      "Service Category", "Service Description", "Staff",
      "Material Charged", "Material Actual Cost",
      "Labour Charged", "Staff Cut",
      "Total Charged",
      "Material Profit", "Labour Profit", "Final Profit",
      "Payment Status"
    ]);
    formatHeaderRow(sheet, 1, 16);
    sheet.setFrozenRows(1);
  }

  const matCharged    = parseFloat(p.matCharged)    || 0;
  const matActual     = parseFloat(p.matActual)     || 0;
  const labourCharged = parseFloat(p.labourCharged) || 0;
  const staffCut      = parseFloat(p.staffCut)      || 0;
  const totalCharged  = parseFloat(p.totalCharged)  || 0;

  const matProfit    = matCharged - matActual;
  const labourProfit = labourCharged - staffCut;
  const margin       = totalCharged - (matCharged + labourCharged);
  const finalProfit  = matProfit + labourProfit + margin;

  sheet.appendRow([
    p.date || "",
    p.name || "",
    p.phone || "",
    p.address || "",
    p.category || "",
    p.description || "",
    p.staff || "",
    matCharged,
    matActual,
    labourCharged,
    staffCut,
    totalCharged,
    matProfit,
    labourProfit,
    finalProfit,
    p.payment || "Pending"
  ]);

  return respond({ status: "ok" });
}

function getJobs() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(JOBS_SHEET);

  if (!sheet || sheet.getLastRow() <= 1) {
    return respond({ status: "ok", data: [] });
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 16).getValues();

  // Format date column
  const rows = values.map(row => {
    if (row[0] instanceof Date) {
      row[0] = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    return row;
  });

  return respond({ status: "ok", data: rows });
}

// ══════════════════════════════════════════════════════════
//  STAFF EXPENSES (Advances & Deductions)
// ══════════════════════════════════════════════════════════

function addExpense(p) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let sheet   = ss.getSheetByName(EXP_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(EXP_SHEET);
    sheet.appendRow(["Date", "Staff Name", "Type", "Amount", "Note"]);
    formatHeaderRow(sheet, 1, 5);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    p.date   || "",
    p.staff  || "",
    p.type   || "",
    parseFloat(p.amount) || 0,
    p.note   || ""
  ]);

  return respond({ status: "ok" });
}

function getExpenses() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(EXP_SHEET);

  if (!sheet || sheet.getLastRow() <= 1) {
    return respond({ status: "ok", data: [] });
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();

  const rows = values.map(row => {
    if (row[0] instanceof Date) {
      row[0] = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    return row;
  });

  return respond({ status: "ok", data: rows });
}

// ══════════════════════════════════════════════════════════
//  GALLERY PHOTOS
// ══════════════════════════════════════════════════════════

function uploadPhoto(p) {
  // Check folder ID is configured
  if (FOLDER_ID === "PASTE_FOLDER_ID_HERE") {
    return respond({ status: "error", message: "Please set FOLDER_ID in the script." });
  }

  const folder  = DriveApp.getFolderById(FOLDER_ID);
  const bytes   = Utilities.base64Decode(p.imageData);
  const blob    = Utilities.newBlob(bytes, p.mimetype, p.filename);
  const file    = folder.createFile(blob);

  // Make publicly viewable
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId  = file.getId();
  const caption = p.caption || p.filename.replace(/\.[^.]+$/, "");

  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let sheet   = ss.getSheetByName(GAL_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(GAL_SHEET);
    sheet.appendRow(["File ID", "Caption", "Uploaded At"]);
    formatHeaderRow(sheet, 1, 3);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([fileId, caption, new Date().toISOString()]);

  return respond({ status: "ok", fileId: fileId });
}

function getPhotos() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(GAL_SHEET);

  if (!sheet || sheet.getLastRow() <= 1) {
    return respond({ status: "ok", photos: [] });
  }

  const rows   = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const photos = rows
    .filter(r => r[0])
    .map(r => ({
      fileId:  r[0],
      caption: r[1] || "Project Photo",
      url:     "https://drive.google.com/thumbnail?id=" + r[0] + "&sz=w600"
    }));

  return respond({ status: "ok", photos: photos });
}

function deletePhoto(p) {
  try {
    const file = DriveApp.getFileById(p.fileId);
    file.setTrashed(true);
  } catch(e) {
    // File may already be gone
  }

  // Remove from Gallery sheet
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(GAL_SHEET);

  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(p.fileId)) {
        sheet.deleteRow(i + 1);
        break;
      }
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
