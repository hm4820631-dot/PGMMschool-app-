/* =========================================================
   two-bills.js
   Prints 2 bills (Guardian copy + School copy) when a fee
   payment is received. Each bill is A5 size, so both fit on
   one A4 page.

   Add this line in index.html AFTER fees-tab.js:
     <script src="two-bills.js"></script>

   It works on top of fees-tab.js (no edit to that file needed):
   - adds a checkbox setting in the student's fee ledger
   - shows the 2 bills with a Print button after "+ Add payment"
   - prints after "Add month" when the Paid amount is above 0
   ========================================================= */
(function () {
  const KEY = 'twoBillPrint';
  const SCHOOL = "Pransagar Girls' Model Mission (H.S)";

  const isOn = () => localStorage.getItem(KEY) !== 'off';
  const safe = v => String(v == null ? '' : v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cash = n => (typeof money === 'function')
    ? money(n)
    : 'Rs ' + Number(n || 0).toLocaleString('en-IN');

  /* ---------- One bill (A5) ---------- */
  function bill(copyName, s, f, received, pos) {
    const due = Number(f.amount) - Number(f.paid);
    const today = new Date().toLocaleDateString('en-GB');
    return `
      <div class="bill ${pos}">
        <div class="head">
          <h2>${safe(SCHOOL)}</h2>
          <div class="copy">FEE RECEIPT - ${copyName}</div>
        </div>
        <table>
          <tr><td>Receipt No</td><td>${safe(String(f.id).slice(0, 8).toUpperCase())}</td></tr>
          <tr><td>Date</td><td>${today}</td></tr>
          <tr><td>Student Name</td><td>${safe(s.name)}</td></tr>
          <tr><td>Class / Roll</td><td>${safe(s.class)} / ${safe(s.roll)}</td></tr>
          <tr><td>Student ID</td><td>${safe(s.student_id)}</td></tr>
          <tr><td>Guardian</td><td>${safe(s.guardian_name || '-')}</td></tr>
          <tr><td>Fee Month</td><td>${safe(f.month)}</td></tr>
          <tr><td>Month Fee</td><td>${cash(f.amount)}</td></tr>
          <tr><td>Received Now</td><td><b>${cash(received)}</b></td></tr>
          <tr><td>Total Paid</td><td>${cash(f.paid)}</td></tr>
          <tr><td>Balance Due</td><td>${due > 0 ? cash(due) : 'NIL'}</td></tr>
        </table>
        <div class="sign">
          <span>Guardian Signature</span>
          <span>Authorized Signature</span>
        </div>
      </div>`;
  }

  /* ---------- Show both bills on screen, then print (A4 page, 2 x A5) ---------- */
  function addStyle() {
    if (document.getElementById('billStyle')) return;
    const st = document.createElement('style');
    st.id = 'billStyle';
    st.textContent = `
      #billOverlay { position: fixed; inset: 0; z-index: 99999; background: #fff; overflow: auto; }
      #billOverlay .bar { position: sticky; top: 0; display: flex; gap: 8px; padding: 10px; background: #eaf5ff; border-bottom: 2px solid #4aa8e8; }
      #billOverlay .bar button { flex: 1; padding: 12px; border: 0; border-radius: 12px; color: #fff; font-size: 16px; font-weight: 600; }
      #billOverlay .bar .pr { background: #21a06a; }
      #billOverlay .bar .cl { background: #e8588c; }
      #billOverlay .sheet { zoom: 0.45; width: 210mm; background: #fff; }
      #billOverlay * { box-sizing: border-box; }
      #billOverlay .bill { width: 210mm; height: 148.5mm; padding: 10mm 14mm; overflow: hidden; page-break-inside: avoid; font-family: Arial, sans-serif; color: #000; }
      #billOverlay .bill.top { border-bottom: 2px dashed #555; }
      #billOverlay .head { text-align: center; border-bottom: 1px solid #000; margin-bottom: 6px; }
      #billOverlay .head h2 { margin: 0 0 3px; font-size: 18px; }
      #billOverlay .copy { font-weight: bold; font-size: 13px; margin-bottom: 5px; }
      #billOverlay table { width: 100%; border-collapse: collapse; }
      #billOverlay td { padding: 3px 4px; border-bottom: 1px dotted #888; font-size: 13px; }
      #billOverlay td:first-child { width: 38%; font-weight: bold; }
      #billOverlay .sign { display: flex; justify-content: space-between; margin-top: 22px; font-size: 12px; }
      #billOverlay .sign span { border-top: 1px solid #000; padding-top: 4px; }
      @media print {
        @page { size: A4 portrait; margin: 0; }
        body > *:not(#billOverlay) { display: none !important; }
        html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        #billOverlay { position: static !important; overflow: visible !important; inset: auto !important; }
        #billOverlay .bar { display: none !important; }
        #billOverlay .sheet { zoom: 1 !important; }
      }`;
    document.head.appendChild(st);
  }

  function printBills(s, f, received) {
    addStyle();
    const old = document.getElementById('billOverlay');
    if (old) old.remove();

    const box = document.createElement('div');
    box.id = 'billOverlay';
    box.innerHTML = `
      <div class="bar">
        <button class="pr" id="billPrintBtn">Print 2 Bills</button>
        <button class="cl" id="billCloseBtn">Close</button>
      </div>
      <div class="sheet">
        ${bill('GUARDIAN COPY', s, f, received, 'top')}
        ${bill('SCHOOL COPY', s, f, received, 'bottom')}
      </div>`;
    document.body.appendChild(box);

    document.getElementById('billPrintBtn').onclick = () => window.print();
    document.getElementById('billCloseBtn').onclick = () => box.remove();
  }

  /* ---------- Setting checkbox inside the fee ledger ---------- */
  const origShow = window.fxShow;
  window.fxShow = async function (id) {
    await origShow(id);
    const card = document.querySelector('#fxres > div');
    if (!card || card.querySelector('#twoBillSetting')) return;

    const label = document.createElement('label');
    label.style.cssText =
      'display:flex;gap:8px;align-items:center;margin:10px 0;font-size:14px';
    label.innerHTML =
      '<input type="checkbox" id="twoBillSetting" style="width:auto"> ' +
      'Print 2 bills when fee is paid (Guardian + School)';
    card.insertBefore(label, card.children[1] || null);

    const chk = label.querySelector('input');
    chk.checked = isOn();
    chk.onchange = () => localStorage.setItem(KEY, chk.checked ? 'on' : 'off');
  };

  /* ---------- "+ Add payment" : save, then print ---------- */
  window.fxPay = async function (fid, cur) {
    const add = +prompt('How much payment was received?');
    if (!add || add < 0) return;

    const { data: f, error } = await db.from('fees')
      .update({ paid: cur + add }).eq('id', fid).select().single();
    if (error) { alert(error.message); return window.fxShow(window._fs); }

    await window.fxShow(window._fs);
    if (isOn()) {
      const { data: s } = await db.from('students')
        .select('*').eq('id', f.student).single();
      if (s) printBills(s, f, add);
    }
  };

  /* ---------- "Add month" : save, print if Paid > 0 ---------- */
  window.fxAdd = async function (id) {
    const m = document.querySelector('#fxnm').value;
    if (!m) return alert('Select a month');

    const { data: ex } = await db.from('fees').select('id')
      .eq('student', id).eq('month', m);
    if (ex && ex.length) return alert('This month is already added');

    const paid = +document.querySelector('#fxnp').value || 0;
    const { data: f, error } = await db.from('fees').insert({
      student: id,
      month: m,
      amount: +document.querySelector('#fxna').value || 0,
      paid: paid
    }).select().single();
    if (error) return alert(error.message);

    await window.fxShow(id);
    if (isOn() && paid > 0) {
      const { data: s } = await db.from('students')
        .select('*').eq('id', id).single();
      if (s) printBills(s, f, paid);
    }
  };
})();
