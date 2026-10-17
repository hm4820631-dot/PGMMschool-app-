// fees-tab.js : নতুন Fees ট্যাব (Student ID দিয়ে সার্চ -> ফিস খাতা)
// index.html এর শেষে এই ফাইল জুড়লে পুরনো feesPane() এর জায়গায় এটা চলবে।
// আগের `fees` টেবিলই ব্যবহার হচ্ছে (student, month, amount, paid)।

async function feesPane(){
  const m=window._fm||ym();window._fm=m;
  $('#pane').innerHTML=`<h2>Fees</h2>
  <div class="row"><input id="fxq" placeholder="Student ID বা নাম দিয়ে সার্চ" onkeydown="if(event.key==='Enter')fxSearch()"><button class="s" style="flex:0" onclick="fxSearch()">Search</button></div>
  <div id="fxres"></div>
  <div style="border-top:2px solid #dcecfb;margin-top:16px;padding-top:12px"><b>সবার জন্য এক ক্লিকে মাসের ফিস</b>
   <div class="row"><input type="month" id="fxm" value="${m}" onchange="window._fm=this.value"><button class="o" onclick="fxBulk()">Create month for all</button></div>
   <p><small>প্রত্যেকের নিজের মাসিক ফিস অনুযায়ী তৈরি হবে। যাদের ওই মাস আগেই আছে তাদের বদলাবে না।</small></p>
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
  if(!hit.length){window._fs=null;return r.innerHTML='<p>কোনো স্টুডেন্ট পাওয়া যায়নি।</p>'}
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
  const txt=encodeURIComponent(`Dear ${s.guardian_name||'Guardian'}, ${s.name}'s school fee due is ${money(due)}. - Pransagar Girl's Model Mission (H.S)`);
  r.innerHTML=`<div style="border:2px solid var(--sky);border-radius:14px;padding:12px;margin-top:12px">
   <div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-size:18px">${esc(s.name)}</b><br><small>${esc(s.class)} · Roll ${esc(s.roll)} · ID ${esc(s.student_id)}</small></div>
    <b style="color:${due>0?'#c0392b':'#22a06b'}">${due>0?'মোট বাকি '+money(due):'বাকি নেই'}</b></div>
   <label><small>মাসিক ফিস (নির্ধারিত)</small></label>
   <div class="row"><input id="fxmf" type="number" value="${mf}"><button class="s" style="flex:0" onclick="fxSaveMF('${s.id}')">Save</button></div>
   <label><small>নতুন মাস যোগ করুন</small></label>
   <div class="row"><input id="fxnm" type="month" value="${window._fm}"><input id="fxna" type="number" placeholder="ফিস" value="${mf||''}"><input id="fxnp" type="number" placeholder="দেওয়া" value="0"></div>
   <button class="g" style="width:100%;margin:6px 0" onclick="fxAdd('${s.id}')">Add month</button>
   ${due>0&&ph?`<div class="row"><a href="sms:${esc(ph)}?&body=${txt}"><button class="o sm" style="width:100%">SMS</button></a><a target="_blank" href="https://wa.me/91${ph.replace(/\D/g,'').slice(-10)}?text=${txt}"><button class="g sm" style="width:100%">WhatsApp</button></a></div>`:''}
   ${rec.map(f=>{const d=f.amount-f.paid;return `<div style="border-top:1.5px solid #dcecfb;margin-top:10px;padding-top:8px">
    <div style="display:flex;justify-content:space-between"><b>${f.month}</b><b style="color:${d>0?'#c0392b':'#22a06b'}">${d>0?'Due '+money(d):(d<0?'Extra '+money(-d):'✓ Paid')}</b></div>
    <div class="row"><label><small>Amount</small><input type="number" value="${f.amount}" onchange="fxSet('${f.id}','amount',this.value)"></label><label><small>Paid</small><input type="number" value="${f.paid}" onchange="fxSet('${f.id}','paid',this.value)"></label></div>
    <div class="row"><button class="g sm" onclick="fxPay('${f.id}',${f.paid})">+ জমা নিন</button><button class="r sm" onclick="fxDel('${f.id}')">Delete</button></div></div>`}).join('')||'<p>এখনো কোনো মাস যোগ করা হয়নি।</p>'}
  </div>`;
}

async function fxSaveMF(id){
  const v=+$('#fxmf').value;if(isNaN(v)||v<0)return alert('সঠিক টাকা লিখুন');
  const {error}=await db.from('students').update({monthly_fee:v}).eq('id',id);
  if(error)return alert(error.message);alert('মাসিক ফিস সেভ হয়েছে');fxShow(id)}

async function fxAdd(id){
  const m=$('#fxnm').value;if(!m)return alert('মাস বেছে নিন');
  const {data:ex}=await db.from('fees').select('id').eq('student',id).eq('month',m);
  if(ex&&ex.length)return alert('এই মাস আগেই যোগ করা আছে');
  const {error}=await db.from('fees').insert({student:id,month:m,amount:+$('#fxna').value||0,paid:+$('#fxnp').value||0});
  if(error)return alert(error.message);fxShow(id)}

async function fxSet(fid,col,v){
  const {error}=await db.from('fees').update({[col]:+v||0}).eq('id',fid);
  if(error)alert(error.message);fxShow(window._fs)}

async function fxPay(fid,cur){
  const add=+prompt('কত টাকা জমা নিলেন?');if(!add||add<0)return;
  const {error}=await db.from('fees').update({paid:cur+add}).eq('id',fid);
  if(error)alert(error.message);fxShow(window._fs)}

async function fxDel(fid){
  if(!confirm('এই মাসের ফিস মুছবেন?'))return;
  const {error}=await db.from('fees').delete().eq('id',fid);
  if(error)alert(error.message);fxShow(window._fs)}

async function fxBulk(){
  const m=$('#fxm').value;if(!m)return alert('মাস বেছে নিন');window._fm=m;
  const [a,b]=await Promise.all([db.from('students').select('id,monthly_fee'),db.from('fees').select('student').eq('month',m)]);
  if(a.error||b.error)return alert((a.error||b.error).message);
  const have=new Set((b.data||[]).map(x=>x.student));
  const left=(a.data||[]).filter(s=>!have.has(s.id));
  const todo=left.filter(s=>Number(s.monthly_fee)>0),skip=left.length-todo.length;
  if(!todo.length)return alert('নতুন তৈরি করার মতো কেউ নেই'+(skip?`\n(${skip} জনের মাসিক ফিস সেট করা নেই)`:''));
  if(!confirm(`${m} মাসের ফিস ${todo.length} জনের জন্য তৈরি হবে।`+(skip?`\n${skip} জনের মাসিক ফিস সেট করা নেই, তারা বাদ যাবে।`:'')))return;
  const {error}=await db.from('fees').insert(todo.map(s=>({student:s.id,month:m,amount:Number(s.monthly_fee),paid:0})));
  if(error)return alert(error.message);
  alert(`${todo.length} জনের ${m} মাসের ফিস তৈরি হয়েছে`);if(window._fs)fxShow(window._fs)}

async function fxDelMonth(){
  const m=$('#fxm').value;if(!m)return;
  if(!confirm(`${m} মাসের সবার ফিস মুছে যাবে। নিশ্চিত?`))return;
  const {error}=await db.from('fees').delete().eq('month',m);
  if(error)alert(error.message);if(window._fs)fxShow(window._fs)}
