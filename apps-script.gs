// ============================================================
//  GOOGLE APPS SCRIPT — Maria Electro Tech Backend
//  Linked to Sheet ID: 1iyXAdEllgcvVJGh2n7N_CbYcG1mQCxPe7w9qPNDbNB0
//
//  HOW TO SET UP:
//  1. Open your Google Sheet
//  2. Click: Extensions → Apps Script
//  3. Delete everything, paste this whole file
//  4. Click Save (Ctrl+S), name it "Maria Backend"
//  5. Click Deploy → New Deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  6. Click Deploy → Authorize → Copy the URL
//  7. Paste the URL into script.js where it says PASTE_YOUR_APPS_SCRIPT_URL_HERE
// ============================================================

// Column order must match your Google Sheet exactly:
// A=Date, B=Customer Name, C=Phone, D=Address,
// E=Service Category, F=Service Description, G=Staff,
// H=Material Cost, I=Labour Cost, J=Amount Charged,
// K=Profit, L=Payment Status

function doGet(e) {
  const action = e.parameter.action;

  if (action === "add") return addJob(e.parameter);
  if (action === "get") return getJobs();

  return respond({ status: "error", message: "Unknown action: " + action });
}

// ── ADD JOB ────────────────────────────────────────────────
function addJob(p) {
  try {
    const ss    = SpreadsheetApp.openById("1iyXAdEllgcvVJGh2n7N_CbYcG1mQCxPe7w9qPNDbNB0");
    const sheet = ss.getSheetByName("Sheet1"); // Change "Sheet1" if your tab has a different name

    // Add header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Date", "Customer Name", "Phone", "Address",
        "Service Category", "Service Description", "Staff",
        "Material Cost", "Labour Cost", "Amount Charged",
        "Profit", "Payment Status"
      ]);

      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setBackground("#3DB8E8");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      p.date        || "",
      p.name        || "",
      p.phone       || "",
      p.address     || "",
      p.category    || "",
      p.description || "",
      p.staff       || "",
      parseFloat(p.material) || 0,
      parseFloat(p.labour)   || 0,
      parseFloat(p.charged)  || 0,
      parseFloat(p.profit)   || 0,
      p.payment     || "Pending"
    ]);

    return respond({ status: "ok", message: "Job saved successfully!" });

  } catch (err) {
    return respond({ status: "error", message: err.toString() });
  }
}

// ── GET ALL JOBS ────────────────────────────────────────────
function getJobs() {
  try {
    const ss      = SpreadsheetApp.openById("1iyXAdEllgcvVJGh2n7N_CbYcG1mQCxPe7w9qPNDbNB0");
    const sheet   = ss.getSheetByName("Sheet1"); // Change if needed
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return respond({ status: "ok", data: [] });
    }

    const range  = sheet.getRange(2, 1, lastRow - 1, 12);
    const values = range.getValues();

    // Convert Date objects to YYYY-MM-DD strings
    const rows = values.map(row => {
      if (row[0] instanceof Date) {
        const d  = row[0];
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        row[0]   = yy + "-" + mm + "-" + dd;
      }
      return row;
    });

    return respond({ status: "ok", data: rows });

  } catch (err) {
    return respond({ status: "error", message: err.toString() });
  }
}

// ── HELPER ─────────────────────────────────────────────────
function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
