(function(){'use strict';
/* V13 SCALES -> LESSON BRIDGE
   Single responsibility: render the student-specific Scales curriculum inside
   the legacy student iframe and transport ONLY teacher-selected items to V13 Lesson.
   No full curriculum is ever copied into Lesson.
*/
const frame=document.getElementById('app');
const STORE='VIOLIN_AI_CURRICULUM_SELECTION_V2';
const HANDOFF='VIOLIN_AI_LESSON_HANDOFF_V1';
const LEGACY_LESSON='VIOLIN_AI_LESSON_SELECTION_V1';
const LEGACY_CURRENT='VIOLIN_AI_CURRENT_SELECTION_V1';
const STUDENT_SCALE_PREFIX='VIOLIN_AI_SCALE_SELECTION_STUDENT_V1_';
let bound=null,observer=null,lastKey='';

function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}}
function write(k,v){localStorage.setItem(k,JSON.stringify(v));return v}
function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim().toLowerCase()}
function text(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function students(){const x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x?.students)?x.students:Array.isArray(x)?x:[]}
function sid(s){return String(s&&(s.id??s.studentId??s.uid)??'')}
function levelOf(s){return Number(String(s?.level??s?.Level??s?.currentLevel??1).match(/\d+/)?.[0]||1)}
function termOf(s){return Number(String(s?.term??s?.Term??s?.currentTerm??1).match(/\d+/)?.[0]||1)}

/* Resolve the actual student without depending on one exact DOM class/name shape. */
function currentStudent(d){
  const explicit=d.querySelector('[data-student-id]');
  if(explicit){const id=explicit.getAttribute('data-student-id');const s=students().find(x=>sid(x)===String(id));if(s)return s}
  const h=[...d.querySelectorAll('h1,h2,h3,.title')].find(x=>/\bSCALES\b/i.test(text(x.textContent)));
  if(!h)return null;
  const m=text(h.textContent).match(/SCALES\s*[·•—-]\s*(.+)$/i);if(!m)return null;
  const name=text(m[1]);
  return students().find(s=>text(s.name||s.studentName)===name)||students().find(s=>norm(s.name||s.studentName)===norm(name))||null;
}

function curriculumItems(s){
  const C=window.VIOLIN_AI_CURRICULUM?.controller;
  const l=levelOf(s),t=termOf(s);
  if(C&&typeof C.list==='function'){const a=C.list('scales',l,t);if(Array.isArray(a)&&a.length)return a}
  const D=window.VIOLIN_SCALE_CURRICULUM_V1,c=D?.[l]?.[t]||D?.[l]?.[1];if(!c)return[];
  const groups=[['major','Major Scales'],['minor','Minor Scales'],['arpeggios','Tonic Arpeggios'],['dominant7','Dominant 7th'],['diminished7','Diminished 7th'],['chromatic','Chromatic Scales'],['doubleStops','Double Stops'],['oneString','One-String Scales']];
  const out=[];
  groups.forEach(([k,cat])=>{const v=Array.isArray(c[k])?c[k]:[c[k]];v.forEach(x=>{if(!x)return;out.push({id:'scale-'+l+'-'+t+'-'+out.length,curriculum:'scales',category:cat,title:String(x),level:l,term:t,requirements:{tempo:c.tempo,octaves:c.octaves,bowing:c.bowing,articulation:c.articulation,rhythmicGroups:c.rhythmicGroups||c.rhythm,accents:c.accents,dynamics:c.dynamics,positions:c.positions},objective:c.objective,mastery:c.mastery,source:'scale-curriculum-data.js'})})});
  return out;
}
function remove(d){d.getElementById('v13-curriculum-scales')?.remove();lastKey=''}
function selectedForStudent(id){
  const s=read(STUDENT_SCALE_PREFIX+String(id),[]);
  if(Array.isArray(s))return s;
  const db=read(STORE,{}),v=db?.[String(id)]?.lesson?.scales;
  return Array.isArray(v?.items)?v.items:[];
}
function ensureCanonical(p){
  const db=read(STORE,{});const id=String(p.studentId);const b=db[id]&&typeof db[id]==='object'?db[id]:{};
  b.lesson=b.lesson&&typeof b.lesson==='object'?b.lesson:{};b.homework=b.homework&&typeof b.homework==='object'?b.homework:{};
  b[p.kind==='homework'?'homework':'lesson'].scales={studentId:id,studentName:p.studentName,level:p.level,term:p.term,kind:p.kind,curriculum:'scales',items:Array.isArray(p.items)?p.items:[],updatedAt:new Date().toISOString(),source:'V13 Scales Bridge'};
  db[id]=b;write(STORE,db);
}
function createHandoff(p,returnUrl){
  const token='lh-'+String(p.studentId)+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  const db=read(HANDOFF,{});db[token]={version:2,token,studentId:String(p.studentId),studentName:p.studentName,level:p.level,term:p.term,kind:'lesson',curriculum:'scales',items:Array.isArray(p.items)?p.items:[],returnUrl:returnUrl||'',createdAt:new Date().toISOString()};
  const keys=Object.keys(db).sort((a,b)=>String(db[b]?.createdAt||'').localeCompare(String(db[a]?.createdAt||'')));const keep={};keys.slice(0,30).forEach(k=>keep[k]=db[k]);write(HANDOFF,keep);return token;
}
function save(kind,s,it,host){
  const chosen=it.filter((x,i)=>host.querySelector('[data-i="'+i+'"]')?.checked);
  if(!chosen.length){alert('Select at least one scale.');return}
  const id=sid(s),p={studentId:id,studentName:String(s.name||s.studentName||'Student'),level:levelOf(s),term:termOf(s),kind,curriculum:'scales',items:chosen,createdAt:new Date().toISOString()};
  ensureCanonical(p);
  write(STUDENT_SCALE_PREFIX+id,chosen);
  if(kind==='lesson'){
    /* Legacy mirrors are intentional compatibility caches; canonical V2 remains authoritative. */
    write(LEGACY_LESSON,p);write(LEGACY_CURRENT,p);
    const returnUrl=new URL('../index.html',window.location.href);returnUrl.searchParams.set('studentId',id);returnUrl.searchParams.set('page','student');
    const token=createHandoff(p,returnUrl.href);
    const db=read(STORE,{}),saved=db?.[id]?.lesson?.scales;
    const hand=read(HANDOFF,{}),h=hand?.[token];
    if(!saved||!Array.isArray(saved.items)||saved.items.length!==chosen.length||!h||String(h.studentId)!==id||h.items.length!==chosen.length){console.error('[V13 Scales] handoff verification failed',{saved,h,chosen});alert('Could not verify the Lesson selection. Please try again.');return}
    const u=new URL('./lesson-v13.html',window.location.href);u.searchParams.set('studentId',id);u.searchParams.set('handoff',token);u.searchParams.set('v','scales-to-lesson-v18-'+Date.now());window.location.assign(u.href);
  }else{
    write('VIOLIN_AI_HOMEWORK_SELECTION_V1',p);alert('Selected scales added to Homework.');
  }
}
function render(d){
  const s=currentStudent(d);if(!s){remove(d);return}
  const it=curriculumItems(s);if(!it.length){remove(d);return}
  const key=sid(s)+'|'+levelOf(s)+'|'+termOf(s);let host=d.getElementById('v13-curriculum-scales');
  if(host&&lastKey===key)return;
  if(!host){const tabs=d.querySelector('.tabs');if(!tabs)return;host=d.createElement('section');host.id='v13-curriculum-scales';tabs.insertAdjacentElement('afterend',host)}
  lastKey=key;
  const prior=selectedForStudent(sid(s));
  const priorKeys=new Set(prior.map(x=>String(x.id||'')+'|'+String(x.title||x.name||'')));
  let h='<div class="v13-scale-box"><h3>🎼 Curriculum Scales</h3><div class="v13-scale-sub">Level '+levelOf(s)+' · Term '+termOf(s)+'</div><div class="v13-scale-grid">';
  const groups={};it.forEach((x,i)=>(groups[x.category]??=[]).push([x,i]));
  Object.entries(groups).forEach(([cat,a])=>{h+='<div class="v13-scale-cat"><b>'+esc(cat)+'</b>';a.forEach(([x,i])=>{const title=String(x.title||x.name||x);const checked=priorKeys.has(String(x.id||'')+'|'+title)?' checked':'';h+='<label><input type="checkbox" data-i="'+i+'"'+checked+'><span>'+esc(title)+'</span></label>'});h+='</div>'});
  h+='</div><div class="v13-scale-actions"><button type="button" data-a="lesson">🎓 Add selected to Lesson</button><button type="button" data-a="homework">🏠 Add selected to Homework</button></div></div>';host.innerHTML=h;
  if(!d.getElementById('v13-scale-css')){const st=d.createElement('style');st.id='v13-scale-css';st.textContent='.v13-scale-box{margin:12px 0;padding:14px;border:1px solid #dfd4ff;border-radius:16px;background:#faf8ff;color:#24344c}.v13-scale-box h3{margin:0 0 3px;font-size:19px}.v13-scale-sub{font-size:12px;color:#687487;margin-bottom:10px}.v13-scale-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v13-scale-cat{border:1px solid #e4e0ef;border-radius:10px;background:#fff;padding:9px}.v13-scale-cat>b{display:block;margin-bottom:5px;font-size:12px}.v13-scale-cat label{display:flex;gap:7px;align-items:flex-start;margin:5px 0;font-size:12px;font-weight:800}.v13-scale-cat input{width:17px;height:17px;margin:0}.v13-scale-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v13-scale-actions button{border:0;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.v13-scale-actions button:first-child{background:#24344c;color:#fff}.v13-scale-actions button:last-child{background:#64c6a3;color:#12372c}@media(max-width:650px){.v13-scale-grid{grid-template-columns:1fr}}';d.head.appendChild(st)}
  host.querySelector('[data-a="lesson"]').onclick=()=>save('lesson',s,it,host);host.querySelector('[data-a="homework"]').onclick=()=>save('homework',s,it,host);
}
function sync(){const d=frame?.contentDocument;if(!d?.body)return;const s=currentStudent(d);if(s)render(d);else remove(d)}
function bind(){const d=frame?.contentDocument;if(!d?.body||bound===d)return;bound=d;if(observer)observer.disconnect();observer=new MutationObserver(()=>sync());observer.observe(d.body,{childList:true,subtree:true});sync()}
frame?.addEventListener('load',()=>{bound=null;lastKey='';bind()});if(frame?.contentDocument)bind();
window.VIOLIN_AI_CURRICULUM_BRIDGE={version:'18.0',sync:bind};
})();