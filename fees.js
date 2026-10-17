/* Fees ট্যাব: Student ID দিয়ে সার্চ -> ওই স্টুডেন্টের ফিস খাতা
 * ব্যবহার: renderFees(document.getElementById('tab-content'), supabaseClient);
 *
 * ধরে নেওয়া হয়েছে students টেবিলে এই কলামগুলো আছে:
 *   id (uuid), student_code (Student ID), name, class, guardian_phone, monthly_fee
 * নাম আলাদা হলে নিচের COL অংশটা বদলান।
 */
const COL = { code: 'student_code', name: 'name', cls: 'class', phone: 'guardian_phone' };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const taka = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const monthLabel = ym => {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

function renderFees(root, sb) {
  const thisMonth = new Date().toISOString().slice(0, 7);

  root.innerHTML = `
    <style>
      .fx h2{color:#132a5b;margin:0 0 12px}
      .fx .row{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
      .fx input{flex:1;min-width:0;padding:12px;border:2px solid #d6e4f5;border-radius:12px;font-size:16px}
      .fx button{padding:12px 14px;border:0;border-radius:12px;color:#fff;font-weight:600;font-size:15px;background:#4aa8e8}
      .fx .gold{background:#c9a44e}.fx .green{background:#21a06a}
      .fx .orange{background:#f39a4a}.fx .red{background:#e8588c}
      .fx .card{border:2px solid #d6e4f5;border-radius:16px;padding:14px;margin-top:12px;background:#fff}
      .fx .due{color:#c0392b;font-weight:700}.fx .ok{color:#21a06a;font-weight:700}
      .fx .rec{border-top:1px solid #e3edf8;padding-top:10px;margin-top:10px}
      .fx .rec .row{margin-bottom:6px}
      .fx .rec label{font-size:13px;color:#555;display:block}
      .fx .msg{margin:8px 0;font-size:14px}
    </style>
    <div class="fx">
      <h2>Fees</h2>
      <div class="row">
        <input id="fxSearch" placeholder="Student ID বা নাম লিখুন">
        <button id="fxGo">Search</button>
      </div>
      <div class="card">
        <b>সবার জন্য একসাথে মাসের ফিস তৈরি</b>
        <div class="row" style="margin-top:8px">
          <input id="fxBulkMonth" type="month" value="${thisMonth}">
          <button id="fxBulk" class="gold">তৈরি করুন</button>
        </div>
        <div class="msg" id="fxBulkMsg"></div>
      </div>
      <div id="fxResult"></div>
    </div>`;

  const $ = id => root.querySelector('#' + id);
  const result = $('fxResult');

  /* ---------- সার্চ ---------- */
  async function search() {
    const q = $('fxSearch').value.trim().replace(/[,()%]/g, '');
    if (!q) return;
    result.innerHTML = '<div class="msg">খোঁজা হচ্ছে...</div>';
    const { data, error } = await sb.from('students').select('*')
      .or(`${COL.code}.eq.${q},${COL.name}.ilike.%${q}%`).limit(10);
    if (error) { result.innerHTML = `<div class="msg due">ত্রুটি: ${esc(error.message)}</div>`; return; }
    if (!data.length) { result.innerHTML = '<div class="msg">কোনো স্টুডেন্ট পাওয়া যায়নি।</div>'; return; }
    if (data.length === 1) return showStudent(data[0]);
    result.innerHTML = data.map(s => `
      <div class="card"><b>${esc(s[COL.name])}</b> (${esc(s[COL.cls])}) · ID: ${esc(s[COL.code])}
        <div class="row" style="margin-top:8px"><button data-open="${s.id}">ফিস খাতা খুলুন</button></div>
      </div>`).join('');
    result.querySelectorAll('[data-open]').forEach(b =>
      b.onclick = () => showStudent(data.find(s => s.id === b.dataset.open)));
  }

  /* ---------- একজন স্টুডেন্টের ফিস খাতা ---------- */
  async function showStudent(s) {
    const { data: recs = [], error } = await sb.from('fee_records').select('*')
      .eq('student_id', s.id).order('month', { ascending: false });
    if (error) { result.innerHTML = `<div class="msg due">ত্রুটি: ${esc(error.message)}</div>`; return; }

    const totalDue = recs.reduce((a, r) => a + (Number(r.amount) - Number(r.paid)), 0);
    const msg = `${s[COL.name]} (${s[COL.cls]}) এর ফিস বাকি আছে: ${taka(totalDue)}। অনুগ্রহ করে পরিশোধ করুন। - P.G.M.M`;
    const phone = String(s[COL.phone] || '').replace(/\D/g, '');
    const wa = phone.length === 10 ? '91' + phone : phone;

    result.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <div><b style="font-size:18px">${esc(s[COL.name])}</b><br>
            ${esc(s[COL.cls])} · ID: ${esc(s[COL.code])}</div>
          <div class="${totalDue > 0 ? 'due' : 'ok'}">${totalDue > 0 ? 'মোট বাকি ' + taka(totalDue) : 'কিছু বাকি নেই'}</div>
        </div>

        <div class="rec">
          <label>মাসিক ফিস (নির্ধারিত)</label>
          <div class="row">
            <input id="fxMonthly" type="number" inputmode="numeric" value="${Number(s.monthly_fee || 0)}">
            <button id="fxSaveMonthly">Save</button>
          </div>
        </div>

        <div class="rec">
          <label>নতুন মাস যোগ করুন (হাতে)</label>
          <div class="row">
            <input id="fxNewMonth" type="month" value="${thisMonth}">
            <input id="fxNewAmt" type="number" inputmode="numeric" placeholder="ফিস" value="${Number(s.monthly_fee || 0)}">
            <input id="fxNewPaid" type="number" inputmode="numeric" placeholder="দেওয়া" value="0">
            <button id="fxAdd" class="green">যোগ করুন</button>
          </div>
        </div>

        <div class="row" style="margin-top:12px">
          <a href="sms:${esc(phone)}?body=${encodeURIComponent(msg)}"><button class="orange" type="button">SMS</button></a>
          <a href="https://wa.me/${esc(wa)}?text=${encodeURIComponent(msg)}" target="_blank"><button class="green" type="button">WhatsApp</button></a>
        </div>

        ${recs.length ? recs.map(r => {
          const due = Number(r.amount) - Number(r.paid);
          return `
          <div class="rec" data-id="${r.id}">
            <b>${monthLabel(r.month)}</b> —
            <span class="${due > 0 ? 'due' : 'ok'}">${due > 0 ? 'বাকি ' + taka(due) : 'পরিশোধিত'}</span>
            <div class="row" style="margin-top:6px">
              <div style="flex:1"><label>ফিস</label><input class="rAmt" type="number" inputmode="numeric" value="${Number(r.amount)}"></div>
              <div style="flex:1"><label>দেওয়া</label><input class="rPaid" type="number" inputmode="numeric" value="${Number(r.paid)}"></div>
            </div>
            <div class="row">
              <button class="rPay green">+ জমা নিন</button>
              <button class="rSave">Save</button>
              <button class="rDel red">Delete</button>
            </div>
          </div>`;
        }).join('') : '<div class="msg">এখনো কোনো মাসের ফিস যোগ করা হয়নি।</div>'}
      </div>`;

    const reload = () => showStudent(s);

    $('fxSaveMonthly').onclick = async () => {
      const v = Number($('fxMonthly').value) || 0;
      const { error } = await sb.from('students').update({ monthly_fee: v }).eq('id', s.id);
      if (error) return alert(error.message);
      s.monthly_fee = v; alert('মাসিক ফিস সেভ হয়েছে');
    };

    $('fxAdd').onclick = async () => {
      const month = $('fxNewMonth').value;
      if (!month) return alert('মাস বেছে নিন');
      const { error } = await sb.from('fee_records').insert({
        student_id: s.id, month,
        amount: Number($('fxNewAmt').value) || 0,
        paid: Number($('fxNewPaid').value) || 0
      });
      if (error) return alert(error.code === '23505' ? 'এই মাস আগেই যোগ করা আছে' : error.message);
      reload();
    };

    result.querySelectorAll('.rec[data-id]').forEach(box => {
      const id = box.dataset.id;
      const rec = recs.find(r => r.id === id);
      const amt = () => Number(box.querySelector('.rAmt').value) || 0;
      const paid = () => Number(box.querySelector('.rPaid').value) || 0;

      box.querySelector('.rSave').onclick = async () => {
        const { error } = await sb.from('fee_records').update({ amount: amt(), paid: paid() }).eq('id', id);
        if (error) return alert(error.message);
        reload();
      };
      box.querySelector('.rPay').onclick = async () => {
        const add = Number(prompt('কত টাকা জমা নিলেন?'));
        if (!add || add < 0) return;
        const { error } = await sb.from('fee_records').update({ paid: Number(rec.paid) + add }).eq('id', id);
        if (error) return alert(error.message);
        reload();
      };
      box.querySelector('.rDel').onclick = async () => {
        if (!confirm(monthLabel(rec.month) + ' মাসের ফিস মুছবেন?')) return;
        const { error } = await sb.from('fee_records').delete().eq('id', id);
        if (error) return alert(error.message);
        reload();
      };
    });
  }

  /* ---------- সবার জন্য একসাথে মাসের ফিস ---------- */
  $('fxBulk').onclick = async () => {
    const month = $('fxBulkMonth').value;
    const out = $('fxBulkMsg');
    if (!month) return (out.textContent = 'মাস বেছে নিন');
    if (!confirm(monthLabel(month) + ' মাসের ফিস সবার জন্য তৈরি করবেন?\n(যাদের আগেই আছে তাদের বদলাবে না)')) return;

    const { data: studs, error } = await sb.from('students').select('id, monthly_fee').gt('monthly_fee', 0);
    if (error) return (out.textContent = 'ত্রুটি: ' + error.message);
    if (!studs.length) return (out.textContent = 'কারো মাসিক ফিস সেট করা নেই।');

    const rows = studs.map(s => ({ student_id: s.id, month, amount: s.monthly_fee, paid: 0 }));
    const { error: e2 } = await sb.from('fee_records')
      .upsert(rows, { onConflict: 'student_id,month', ignoreDuplicates: true });
    out.textContent = e2 ? 'ত্রুটি: ' + e2.message : `${studs.length} জন স্টুডেন্টের ${monthLabel(month)} মাসের ফিস তৈরি হয়েছে।`;
  };

  $('fxGo').onclick = search;
  $('fxSearch').addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
}
