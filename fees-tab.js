// fees-tab.js : Student-wise Fees tab (search by Student ID -> fee ledger)
// Loaded after the main script in index.html; it replaces the old feesPane().
// Uses the existing `fees` table (student, month, amount, paid) and students.monthly_fee.

async function feesPane(){
  const m=window._fm||ym();window._fm=m;
  $('#pane').innerHTML=`<h2>Fees</h2>
  <div class="row"><input id="fxq" placeholder="Search by Student ID or name" onkeydown="if(event.key==='Enter')fxSearch()"><button class="s" style="flex:0" onclick="fxSearch()">Search</button></div>
  <div id="fxres"></div>
  <div style="border-top:2px solid #dcecfb;margin-top:16px;padding-top:12px"><b>Create a month's fees for everyone</b>
   <div class="row"><input type="month" id="fxm" value="${m}" onchange="window._fm=this.value"><button class="o" onclick="fxBulk()">Create month for all</button></div>
   <p><small>Each student's own monthly fee is used. Students who already have this month are not changed.</small></p>
   <button class="r sm" onclick="fxDelMonth()">Delete whole month</button></div>`;
  if(window._fs)fxShow(window._fs);
}

async function fxSearch(){
  const q=($('#fxq').value||'').trim().toLowerCase();if(!q)return;
  const {data,error}=await db.from('students').select('id,student_id,name,class,roll');
  if(error)return alert(error.message);
  let hit=(data||[]).filter(s=>String(s.student_id||'').toLowerCase()===q);
  if(!hit.length)hit=(data||[]).filter(s=>`${s.name} ${s.student_id} ${s.class}`.toLowerCase().includes(q)).slice(0,20);
  const r=$('#fxres');
  if(!hit.length){window._fs=null;return r.innerHTML='<p>No student found.</p>'}
  if(hit.length===1)return fxShow(hit[0].id);
  r.innerHTML=hit.map(s=>`<div style="border:1.5px solid #dcecfb;border-radius:12px;padding:10px;margin:8px 0;display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b>${esc(s.name)}</b><br><small>${esc(s.class)} · Roll ${esc(s.roll)} · ID ${esc(s.student_id)}</small></div><button class="s sm" onclick="fxShow('${s.id}')">Open</button></div>`).join('');
}

async function fxShow(id){
  window._fs=id;const r=$('#fxres');
  const [a,b]=await Promise.all([
    db.from('students').select('*').eq('id',id).single(),
    db.from('fees').select('*').eq('student',id).order('month',{ascending:false})]);
  if(a.error||b.error)return r.innerHTML=`<p style="color:#c0392b">${esc((a.error||b.error).message)}</p>`;
  const s=a.data,rec=b.data||[],mf=Number(s.monthly_fee||0);
  const due=rec.reduce((t,x)=>t+x.amount-x.paid,0);
  const ph=String(s.guardian_phone||'');
  const txt=encodeURIComponent(`Dear ${s.guardian_name||'Guardian'}, ${s.name}'s school fee due is ${money(due)}. Please pay at your earliest. - Pransagar Girl's Model Mission (H.S)`);
  r.innerHTML=`<div style="border:2px solid var(--sky);border-radius:14px;padding:12px;margin-top:12px">
   <div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-size:18px">${esc(s.name)}</b><br><small>${esc(s.class)} · Roll ${esc(s.roll)} · ID ${esc(s.student_id)}</small></div>
    <b style="color:${due>0?'#c0392b':'#22a06b'}">${due>0?'Total due '+money(due):'No dues'}</b></div>
   <label><small>Monthly fee (fixed)</small></label>
   <div class="row"><input id="fxmf" type="number" value="${mf}"><button class="s" style="flex:0" onclick="fxSaveMF('${s.id}')">Save</button></div>
   <label><small>Add a new month</small></label>
   <div class="row"><input id="fxnm" type="month" value="${window._fm}"><input id="fxna" type="number" placeholder="Fee" value="${mf||''}"><input id="fxnp" type="number" placeholder="Paid" value="0"></div>
   <button class="g" style="width:100%;margin:6px 0" onclick="fxAdd('${s.id}')">Add month</button>
   ${due>0&&ph?`<div class="row"><a href="sms:${esc(ph)}?&body=${txt}"><button class="o sm" style="width:100%">SMS</button></a><a target="_blank" href="https://wa.me/91${ph.replace(/\D/g,'').slice(-10)}?text=${txt}"><button class="g sm" style="width:100%">WhatsApp</button></a></div>`:''}
   ${rec.map(f=>{const d=f.amount-f.paid;return `<div style="border-top:1.5px solid #dcecfb;margin-top:10px;padding-top:8px">
    <div style="display:flex;justify-content:space-between"><b>${f.month}</b><b style="color:${d>0?'#c0392b':'#22a06b'}">${d>0?'Due '+money(d):(d<0?'Extra '+money(-d):'✓ Paid')}</b></div>
    <div class="row"><label><small>Amount</small><input type="number" value="${f.amount}" onchange="fxSet('${f.id}','amount',this.value)"></label><label><small>Paid</small><input type="number" value="${f.paid}" onchange="fxSet('${f.id}','paid',this.value)"></label></div>
    <div class="row"><button class="g sm" onclick="fxPay('${f.id}',${f.paid})">+ Add payment</button><button class="r sm" onclick="fxDel('${f.id}')">Delete</button></div></div>`}).join('')||'<p>No months added yet.</p>'}
  </div>`;
}

async function fxSaveMF(id){
  const v=+$('#fxmf').value;if(isNaN(v)||v<0)return alert('Enter a valid amount');
  const {error}=await db.from('students').update({monthly_fee:v}).eq('id',id);
  if(error)return alert(error.message);alert('Monthly fee saved');fxShow(id)}

async function fxAdd(id){
  const m=$('#fxnm').value;if(!m)return alert('Select a month');
  const {data:ex}=await db.from('fees').select('id').eq('student',id).eq('month',m);
  if(ex&&ex.length)return alert('This month is already added');
  const {error}=await db.from('fees').insert({student:id,month:m,amount:+$('#fxna').value||0,paid:+$('#fxnp').value||0});
  if(error)return alert(error.message);fxShow(id)}

async function fxSet(fid,col,v){
  const {error}=await db.from('fees').update({[col]:+v||0}).eq('id',fid);
  if(error)alert(error.message);fxShow(window._fs)}

async function fxPay(fid,cur){
  const add=+prompt('How much payment was received?');if(!add||add<0)return;
  const {error}=await db.from('fees').update({paid:cur+add}).eq('id',fid);
  if(error)alert(error.message);fxShow(window._fs)}

async function fxDel(fid){
  if(!confirm('Delete this month\'s fee?'))return;
  const {error}=await db.from('fees').delete().eq('id',fid);
  if(error)alert(error.message);fxShow(window._fs)}

async function fxBulk(){
  const m=$('#fxm').value;if(!m)return alert('Select a month');window._fm=m;
  const [a,b]=await Promise.all([db.from('students').select('id,monthly_fee'),db.from('fees').select('student').eq('month',m)]);
  if(a.error||b.error)return alert((a.error||b.error).message);
  const have=new Set((b.data||[]).map(x=>x.student));
  const left=(a.data||[]).filter(s=>!have.has(s.id));
  const todo=left.filter(s=>Number(s.monthly_fee)>0),skip=left.length-todo.length;
  if(!todo.length)return alert('Nothing new to create.'+(skip?`\n${skip} student(s) have no monthly fee set.`:''));
  if(!confirm(`Create ${m} fees for ${todo.length} student(s)?`+(skip?`\n${skip} student(s) have no monthly fee set and will be skipped.`:'')))return;
  const {error}=await db.from('fees').insert(todo.map(s=>({student:s.id,month:m,amount:Number(s.monthly_fee),paid:0})));
  if(error)return alert(error.message);
  alert(`${m} fees created for ${todo.length} student(s)`);if(window._fs)fxShow(window._fs)}

async function fxDelMonth(){
  const m=$('#fxm').value;if(!m)return;
  if(!confirm(`All fee entries of ${m} will be deleted. Are you sure?`))return;
  const {error}=await db.from('fees').delete().eq('month',m);
  if(error)alert(error.message);if(window._fs)fxShow(window._fs)}
