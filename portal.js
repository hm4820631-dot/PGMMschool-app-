import { sb, esc } from './config.js';
const $ = s => document.querySelector(s);
const n = x => Number(x || 0).toLocaleString();

$('#f').onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const { data, error } = await sb.rpc('student_portal', { p_roll: f.get('roll').trim(), p_dob: f.get('dob') });
  if (error) return $('#out').innerHTML = `<div class="card">${esc(error.message)}</div>`;
  if (!data) return $('#out').innerHTML = '<div class="card">No student found. Check the roll number and date of birth.</div>';

  const { student: s, fees, exams } = data;
  const total = fees.reduce((a, x) => a + x.amount, 0), paid = fees.reduce((a, x) => a + x.paid, 0);
  const pct = x => (x.marks / x.max_marks * 100);
  const avg = exams.length ? (exams.reduce((a, x) => a + pct(x), 0) / exams.length).toFixed(1) : '–';

  $('#out').innerHTML = `
  <div class="card"><b style="font-size:19px">${esc(s.name)}</b><br>Roll ${esc(s.roll_no)} · Grade ${esc(s.grade)}</div>

  <h2>Fees</h2>
  <div class="card">
    <div class="stats"><div>Total<b>${n(total)}</b></div><div>Paid<b>${n(paid)}</b></div>
    <div>Balance<b class="${total - paid > 0 ? 'due' : 'clear'}">${n(total - paid)}</b></div></div>
    <div class="wrap"><table><thead><tr><th>Fee</th><th>Amount</th><th>Paid</th><th>Due date</th></tr></thead><tbody>
    ${fees.map(x => `<tr><td>${esc(x.title)}</td><td>${n(x.amount)}</td><td>${n(x.paid)}</td><td>${esc(x.due_date)}</td></tr>`).join('') || '<tr><td colspan="4">No fees recorded.</td></tr>'}
    </tbody></table></div>
  </div>

  <h2>Exams</h2>
  <div class="card">
    <div class="stats"><div>Exams taken<b>${exams.length}</b></div><div>Average<b>${avg}${exams.length ? '%' : ''}</b></div></div>
    <div class="wrap"><table><thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Percent</th><th>Date</th></tr></thead><tbody>
    ${exams.map(x => `<tr><td>${esc(x.exam_name)}</td><td>${esc(x.subject)}</td><td>${n(x.marks)} / ${n(x.max_marks)}</td><td>${pct(x).toFixed(1)}%</td><td>${esc(x.exam_date)}</td></tr>`).join('') || '<tr><td colspan="5">No exam results yet.</td></tr>'}
    </tbody></table></div>
  </div>`;
};
