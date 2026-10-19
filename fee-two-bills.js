/* =========================================================
   TWO-BILL PRINT SETTING FOR STUDENT FEE DETAILS
   Pransagar Girls' Model Mission (H.S) - P.G.M.M
   ---------------------------------------------------------
   1) Paste the HTML below into the Fee Details section:

   <label style="display:flex;gap:8px;align-items:center">
     <input type="checkbox" id="twoBillSetting">
     Print 2 bills when a fee is paid (Guardian copy + School copy)
   </label>

   2) Paste this whole JS into your app script.
   3) After a fee is saved successfully, call:
        handleFeePaid(student, payment);
   ========================================================= */

const SCHOOL_NAME = "Pransagar Girls' Model Mission (H.S)";
const SETTING_KEY = "twoBillPrint";

/* ---------- Setting: remember checkbox state ---------- */
function initTwoBillSetting() {
  const chk = document.getElementById("twoBillSetting");
  if (!chk) return;
  chk.checked = localStorage.getItem(SETTING_KEY) !== "off";
  chk.addEventListener("change", () => {
    localStorage.setItem(SETTING_KEY, chk.checked ? "on" : "off");
  });
}
document.addEventListener("DOMContentLoaded", initTwoBillSetting);

function isTwoBillEnabled() {
  return localStorage.getItem(SETTING_KEY) !== "off";
}

/* ---------- Build one bill ---------- */
function buildBill(copyLabel, s, p, pos) {
  const date = new Date().toLocaleDateString("en-GB");
  return `
    <div class="bill ${pos}">
      <div class="head">
        <h2>${SCHOOL_NAME}</h2>
        <div class="copy">${copyLabel}</div>
      </div>
      <table>
        <tr><td>Bill No</td><td>${p.id ?? "-"}</td></tr>
        <tr><td>Date</td><td>${date}</td></tr>
        <tr><td>Student Name</td><td>${s.name}</td></tr>
        <tr><td>Student ID</td><td>${s.student_id}</td></tr>
        <tr><td>Month</td><td>${p.month}</td></tr>
        <tr><td>Total Fee</td><td>${p.total} BDT</td></tr>
        <tr><td>Amount Paid</td><td>${p.paid} BDT</td></tr>
        <tr><td>Amount Due</td><td>${p.due} BDT</td></tr>
      </table>
      <div class="sign">
        <span>Guardian Signature</span>
        <span>Authorized Signature</span>
      </div>
    </div>`;
}

/* ---------- Print both bills on one A4 page (each bill = A5 size) ---------- */
function printTwoBills(student, payment) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to print bills.");
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fee Receipt</title>
      <style>
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; color: #000; width: 210mm; }
        /* Each bill is exactly A5 landscape (210mm x 148.5mm) = half of A4 */
        .bill { width: 210mm; height: 148.5mm; padding: 10mm 14mm; overflow: hidden; page-break-inside: avoid; }
        .bill.top { border-bottom: 2px dashed #555; }
        .head { text-align: center; border-bottom: 1px solid #000; margin-bottom: 6px; }
        .head h2 { margin: 0 0 4px; font-size: 18px; }
        .copy { font-weight: bold; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 4px; border-bottom: 1px dotted #888; font-size: 14px; }
        td:first-child { width: 40%; font-weight: bold; }
        .sign { display: flex; justify-content: space-between; margin-top: 28px; font-size: 12px; }
        .sign span { border-top: 1px solid #000; padding-top: 4px; }
      </style>
    </head>
    <body>
      ${buildBill("GUARDIAN COPY", student, payment, "top")}
      ${buildBill("SCHOOL COPY", student, payment, "bottom")}
    </body>
    </html>`);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

/* ---------- Call this after the fee is saved ---------- */
function handleFeePaid(student, payment) {
  if (isTwoBillEnabled()) {
    printTwoBills(student, payment);
  }
}

/* ---------- Expected data shape ----------
const student = { name: "Student Name", student_id: "PGMM-001" };
const payment = { id: 101, month: "October 2026", total: 500, paid: 300, due: 200 };
handleFeePaid(student, payment);
------------------------------------------- */
