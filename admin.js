import { sb, esc } from './config.js';
const $ = s => document.querySelector(s);

// To add a column or a new field, edit the lists below.
const TABS = {
  students: { cols: ['roll_no', 'name', 'grade', 'dob', 'guardian_phone'],
    form: [['roll_no', 'Roll no'], ['name', 'Name'], ['grade', 'Grade'], ['dob', 'Date of birth', 'date'], ['guardian_phone', 'Guardian phone']] },
  teachers: { cols: ['name', 'subject', 'phone'],
    form: [['name', 'Name'], ['subject', 'Subject'], ['phone', 'Phone']] },
  fees: { cols: ['student', 'title', 'amount', 'paid', 'due_date'], join: true,
    form: [['student_id', 'Student', 'student'], ['title', 'Fee title'], ['amount', 'Amount', 'number'], ['paid', 'Paid so far', 'number'], ['due_date', 'Due date', 'date']] },
  exams: { cols: ['student', 'exam_name', 'subject', 'marks', 'max_marks', 'exam_date'], join: true,
    form: [['student_id', 'Student', 'student'], ['exam_name', 'Exam (e.g. Midterm)'], ['subject', 'Subject'], ['marks', 'Marks', 'number'], ['max_marks', 'Out of', 'number'], ['exam_date', 'Exam date', 'date']] }
};
let tab = 'students', rows = [], students = [], sort = { k: null, dir: 1 }, q = '';

async function loadStudents() {
  const { data } = await sb.from('students').select('*').order('name');
  students = data || [];
}
async function load() {
  const t = TABS[tab];
  const { data, error } = await sb.from(tab).select(t.join ? '*, students(name, roll_no)' : '*');
  if (error) return alert(error.message);
  rows = data.map(r => ({ ...r, student: r.students ? `${r.students.name} (${r.students.roll_no})` : '' }));
  if (tab === 'students') students = rows;
  render();
}
function visible() {
  const cols = TABS[tab].cols;
  const out = rows.filter(r => !q || cols.some(c => String(r[c] ?? '').toLowerCase().includes(q)));
  if (sort.k) out.sort((a, b) => {
    const x = a[sort.k] ?? '', y = b[sort.k] ?? '';
    const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
    return d * sort.dir;
  });
  return out;
}
function render() {
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  const t = TABS[tab];
  $('#form').innerHTML = t.form.map(([k, l, type]) => type === 'student'
    ? `<select name="${k}" required><option value="">${l}</option>${students.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.roll_no)})</option>`).join('')}</select>`
    : `<input name="${k}" placeholder="${l}" title="${l}" type="${type || 'text'}" ${type === 'number' ? 'step="any"' : ''} ${k === 'paid' ? '' : 'required'}>`
  ).join('') + '<button class="add">Add</button>';
  const v = visible();
  $('#table').innerHTML = `<thead><tr>${t.cols.map(c => `<th data-k="${c}">${c.replace(/_/g, ' ')}${sort.k === c ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}<th></th></tr></thead>
  <tbody>${v.map(r => `<tr>${t.cols.map(c => `<td>${esc(r[c])}</td>`).join('')}<td><button class="del" data-id="${r.id}" title="Delete">×</button></td></tr>`).join('') || '<tr><td colspan="9">Nothing here yet. Add a record above.</td></tr>'}</tbody>`;
}

document.querySelector('nav').onclick = e => {
  if (!e.target.dataset.t) return;
  tab = e.target.dataset.t; sort = { k: null, dir: 1 }; q = ''; $('#search').value = ''; load();
};
$('#search').oninput = e => { q = e.target.value.toLowerCase(); render(); };
$('#table').onclick = async e => {
  if (e.target.dataset.k) {
    sort = { k: e.target.dataset.k, dir: sort.k === e.target.dataset.k ? -sort.dir : 1 }; render();
  } else if (e.target.dataset.id && confirm('Delete this record? Linked fees and exams are deleted too.')) {
    const { error } = await sb.from(tab).delete().eq('id', e.target.dataset.id);
    if (error) alert(error.message); else load();
  }
};
$('#form').onsubmit = async e => {
  e.preventDefault();
  const rec = {};
  new FormData(e.target).forEach((v, k) => { v = v.trim(); if (v !== '') rec[k] = v; });
  TABS[tab].form.forEach(([k, , type]) => { if (type === 'number' && k in rec) rec[k] = Number(rec[k]); });
  const { error } = await sb.from(tab).insert(rec);
  if (error) return alert(error.message);
  e.target.reset(); load();
};
$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
  if (error) alert(error.message); else start();
};
$('#logout').onclick = async () => { await sb.auth.signOut(); start(); };

async function start() {
  const { data: { session } } = await sb.auth.getSession();
  $('#login').hidden = !!session; $('#app').hidden = !session;
  if (session) { await loadStudents(); load(); }
}
start();
