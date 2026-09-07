(function(){'use strict';
/* V13 — SINGLE OWNER SCALES
   The real application is the root /index.html inside #app iframe.
   Its `state` is a lexical `let`, not window.state, and openStudent() keeps the
   student id in memory rather than the URL. Therefore student resolution MUST
   come from the rendered DOM (or URL when available), never window.state.
   This module is the sole owner of Curriculum Scales inside the Student Scales tab.
*/
const frame=document.getElementById('app');
const STORE='VIOLIN_AI_CURRICULUM_SELECTION_V2';
const HANDOFF='VIOLIN_AI_LESSON_HANDOFF_V1';
const PREFIX='VIOLIN_AI_SCALE_SELECTION_STUDENT_V1_';
let bound=null,observer=null,lastKey='';
function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function text(v){return String(v??'').replace(/\s+/g,' ').trim()}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function students(){const x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x?.students)?x.students:Array.isArray(x)?x:[]}
function sid(s){return String(s?.id??s?.studentId??s?.uid??'')}
function level(s){return Number(String(s?.level??s?.Level??s?.currentLevel??s?.grade??1).match(/\d+/)?.[0]||1)}
function term(s){return Number(String(s?.term??s?.Term??s?.currentTerm??1).match(/\d+/)?.[0]||1)}
function norm(v){return text(v).replace(/^🎵\s*/,'').replace(/^🎼\s*/,'').replace(/^SCALES\s*[·•—:-]\s*/i,'').trim().toLowerCase()}
/* Definitive student resolution for the actual root app:
   - URL studentId if a caller supplied one
   - the real Scales page heading: "🎵 SCALES · Student"
   - the real Student page title plus active SCALES tab
   - the real Student-tab title: "🎵 SCALES · Student"
   No window.state assumption. */
function resolveStudent(d){
  try{const u=new URL(frame.contentWindow.location.href);const q=u.searchParams.get('studentId');if(q){const s=students().find(x=>sid(x)===q);if(s)return s}}catch(e){}
  const list=students();
  const heads=[...d.querySelectorAll('.title h2,h1,h2,h3')].map(x=>text(x.textContent)).filter(Boolean);
  const scalesHead=heads.find(x=>/^🎵?\s*SCALES\s*[·•—:-]/i.test(x)||/\bSCALES\s*[·•—:-]/i.test(x));
  if(scalesHead){const n=norm(scalesHead);const s=list.find(x=>norm(x.name||x.studentName)===n);if(s)return s}
  const active=[...d.querySelectorAll('.tab.active,[aria-selected="true"]')].find(x=>/SCALES/i.test(text(x.textContent)));
  if(active){const title=d.querySelector('.title h2,h1,h2');const n=norm(title?.textContent||'');if(n){const s=list.find(x=>norm(x.name||x.studentName)===n);if(s)return s}}
  return null;
}
function curriculumItems(s){
  const l=level(s),t=term(s);
  const C=window.VIOLIN_AI_CURRICULUM?.controller;
  try{const a=C?.list?.('scales',l,t);if(Array.isArray(a)&&a.length)return a}catch(e){}
  const c=window.VIOLIN_SCALE_CURRICULUM_V1?.[l]?.[t]||window.VIOLIN_SCALE_CURRICULUM_V1?.[l]?.[1];
  if(!c)return[];
  const groups=[['major','Major Scales'],['minor','Minor Scales'],['arpeggios','Tonic Arpeggios'],['dominant7','Dominant 7th'],['diminished7','Diminished 7th'],['chromatic','Chromatic Scales'],['doubleStops','Double Stops'],['oneString','One-String Scales']];
  const out=[];groups.forEach(([k,cat])=>(Array.isArray(c[k])?c[k]:c[k]!=null?[c[k]]:[]).forEach(x=>out.push({id:'scale-'+l+'-'+t+'-'+out.length,curriculum:'scales',category:cat,title:String(x),level:l,term:t,requirements:{tempo:c.tempo,octaves:c.octaves,bowing:c.bowing,articulation:c.articulation,rhythmicGroups:c.rhythmicGroups||c.rhythm,accents:c.accents,dynamics:c.dynamics,positions:c.positions},objective:c.objective,mastery:c.mastery,source:'scale-curriculum-data.js'})));
  return out;
}
function saveSelection(s,chosen){
  const id=sid(s);if(!id||!chosen.length)return null;
  const now=new Date().toISOString();
  const payload={studentId:id,studentName:text(s.name||s.studentName||'Student'),level:level(s),term:term(s),kind:'lesson',curriculum:'scales',items:chosen,updatedAt:now,source:'V13 Scales Single Owner'};
  const db=read(STORE,{});const entry=db[id]&&typeof db[id]==='object'?db[id]:{lesson:{},homework:{}};entry.lesson=entry.lesson&&typeof entry.lesson==='object'?entry.lesson:{};entry.homework=entry.homework&&typeof entry.homework==='object'?entry.homework:{};entry.lesson.scales=payload;db[id]=entry;
  const token='lh-'+id+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  const hd=read(HANDOFF,{});hd[token]={version:7,token,...payload};
  if(!write(STORE,db)||!write(PREFIX+id,chosen)||!write('VIOLIN_AI_LESSON_SELECTION_V1',payload)||!write('VIOLIN_AI_CURRENT_SELECTION_V1',payload)||!write(HANDOFF,hd))return null;
  const verify=read(STORE,{}),vh=read(HANDOFF,{});
  if(String(verify?.[id]?.lesson?.scales?.studentId)!==id||!Array.isArray(verify?.[id]?.lesson?.scales?.items)||verify[id].lesson.scales.items.length!==chosen.length||!vh[token]||vh[token].items.length!==chosen.length)return null;
  return{payload,token};
}
function installCSS(d){if(d.getElementById('v25-scale-css'))return;const st=d.createElement('style');st.id='v25-scale-css';st.textContent='.v25-scales{display:block!important;visibility:visible!important;position:relative!important;z-index:20!important;margin:14px 0;padding:14px;border:1px solid #dfd4ff;border-radius:16px;background:#faf8ff}.v25-scales h3{margin:0 0 4px}.v25-scales .sub{font-size:12px;color:#687487;margin-bottom:10px}.v25-scales .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v25-scales label{display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid #e2e5eb;border-radius:10px;background:#fff;font-size:12px;font-weight:700}.v25-scales input{width:18px;height:18px;flex:0 0 auto}.v25-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.v25-actions button{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.v25-lesson{background:#24344c;color:#fff}.v25-home{background:#64c6a3;color:#12372c}@media(max-width:650px){.v25-scales .grid{grid-template-columns:1fr}}';d.head.appendChild(st)}
function render(d,s,it){d.getElementById('v25-curriculum-scales')?.remove();installCSS(d);const host=d.createElement('section');host.id='v25-curriculum-scales';host.className='v25-scales';let h='<h3>🎼 Curriculum Scales</h3><div class="sub">Level '+level(s)+' · Term '+term(s)+'</div><div class="grid">';const old=read(PREFIX+sid(s),[]);const oldKeys=new Set((Array.isArray(old)?old:[]).map(x=>String(x.id||'')+'|'+String(x.title||x.name||'')));it.forEach((x,i)=>{const title=String(x.title||x.name||x);const checked=oldKeys.has(String(x.id||'')+'|'+title)?' checked':'';h+='<label><input type="checkbox" data-v25="'+i+'"'+checked+'><span><b>'+esc(title)+'</b><br><small>'+esc(x.category||'Scales')+'</small></span></label>'});h+='</div><div class="v25-actions"><button type="button" class="v25-lesson">🎓 Add selected to Lesson</button><button type="button" class="v25-home">🏠 Add selected to Homework</button></div>';host.innerHTML=h;
  const tabs=d.querySelector('.tabs');if(tabs)tabs.insertAdjacentElement('afterend',host);else(d.querySelector('.title')||d.body).after(host);
  host.querySelector('.v25-lesson').onclick=()=>{const chosen=it.filter((x,i)=>host.querySelector('[data-v25="'+i+'"]')?.checked);if(!chosen.length){alert('Select at least one scale.');return}const saved=saveSelection(s,chosen);if(!saved){alert('Could not verify the selected scale.');return}const u=new URL('/violin-ai-teacher-agenda/v13/lesson-v13.html',location.origin);u.searchParams.set('studentId',saved.payload.studentId);u.searchParams.set('handoff',saved.token);u.searchParams.set('v','v25-'+Date.now());location.href=u.href};
  host.querySelector('.v25-home').onclick=()=>{const chosen=it.filter((x,i)=>host.querySelector('[data-v25="'+i+'"]')?.checked);if(!chosen.length){alert('Select at least one scale.');return}write('VIOLIN_AI_HOMEWORK_SELECTION_V1',{studentId:sid(s),studentName:text(s.name||s.studentName||'Student'),level:level(s),term:term(s),kind:'homework',curriculum:'scales',items:chosen,createdAt:new Date().toISOString()});alert('Selected scales added to Homework.')};
}
function isScalesPage(d){const active=[...d.querySelectorAll('.tab.active,[aria-selected="true"]')].some(x=>/SCALES/i.test(text(x.textContent)));const heading=[...d.querySelectorAll('.title h2,h1,h2,h3')].some(x=>/\bSCALES\b/i.test(text(x.textContent)));return active||heading}
function sync(){const d=frame?.contentDocument;if(!d?.body||!isScalesPage(d))return;const s=resolveStudent(d);if(!s)return;const it=curriculumItems(s);if(!it.length)return;const k=sid(s)+'|'+level(s)+'|'+term(s);if(lastKey===k&&d.getElementById('v25-curriculum-scales'))return;lastKey=k;render(d,s,it)}
function bind(){const d=frame?.contentDocument;if(!d?.body||bound===d)return;bound=d;lastKey='';observer?.disconnect();observer=new MutationObserver(()=>{clearTimeout(sync.t);sync.t=setTimeout(sync,60)});observer.observe(d.body,{childList:true,subtree:true});[0,100,300,700,1200].forEach(ms=>setTimeout(sync,ms))}
frame?.addEventListener('load',()=>{bound=null;lastKey='';[0,150,500].forEach(ms=>setTimeout(bind,ms))});bind();window.VIOLIN_AI_SCALES_SINGLE_OWNER={version:'25.0',sync:bind};})();