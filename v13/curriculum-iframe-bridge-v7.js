(function(){'use strict';
/* V13 SCALES -> LESSON BRIDGE v20
   SINGLE OWNER: this bridge owns only the Scales curriculum UI and the transport
   of an explicit teacher selection into Lesson. It writes a redundant, verified
   student-specific snapshot so Lesson cannot lose a valid selection because one
   storage contract or navigation path changed.
*/
const frame=document.getElementById('app');
const STORE='VIOLIN_AI_CURRICULUM_SELECTION_V2';
const HANDOFF='VIOLIN_AI_LESSON_HANDOFF_V1';
const ACTIVE='VIOLIN_AI_LESSON_ACTIVE_V13';
const STUDENT_SCALE_PREFIX='VIOLIN_AI_SCALE_SELECTION_STUDENT_V1_';
let bound=null,observer=null,lastKey='';
function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){console.error('[V13 Scales] storage write failed',k,e);return false}}
function text(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function norm(v){return text(v).toLowerCase()}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function students(){const x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x?.students)?x.students:Array.isArray(x)?x:[]}
function sid(s){return String(s&&(s.id??s.studentId??s.uid)??'')}
function levelOf(s){return Number(String(s?.level??s?.Level??s?.currentLevel??1).match(/\d+/)?.[0]||1)}
function termOf(s){return Number(String(s?.term??s?.Term??s?.currentTerm??1).match(/\d+/)?.[0]||1)}
function byId(id){return students().find(x=>sid(x)===String(id))||null}
function studentFromHref(w){try{const u=new URL(w.location.href);const id=u.searchParams.get('studentId')||u.searchParams.get('sid');if(id)return byId(id)}catch(e){}return null}
function currentStudent(d){
 let s=studentFromHref(frame?.contentWindow);if(s)return s;
 const e=d.querySelector('[data-student-id],[data-studentid],[data-sid]');
 if(e){s=byId(e.getAttribute('data-student-id')||e.getAttribute('data-studentid')||e.getAttribute('data-sid'));if(s)return s}
 for(const el of d.querySelectorAll('h1,h2,h3,h4,.title,.page-title,.student-title,[class*="title"]')){
  const t=text(el.textContent),m=t.match(/SCALES\s*[·•—-]\s*(.+)$/i);if(m){const n=text(m[1]);s=students().find(x=>norm(x.name||x.studentName)===norm(n));if(s)return s}
 }
 return null;
}
function curriculumItems(s){
 const l=levelOf(s),t=termOf(s);
 try{const C=window.VIOLIN_AI_CURRICULUM?.controller;if(C&&typeof C.list==='function'){const a=C.list('scales',l,t);if(Array.isArray(a)&&a.length)return a}}catch(e){}
 const c=window.VIOLIN_SCALE_CURRICULUM_V1?.[l]?.[t]||window.VIOLIN_SCALE_CURRICULUM_V1?.[l]?.[1];if(!c)return[];
 const groups=[['major','Major Scales'],['minor','Minor Scales'],['arpeggios','Tonic Arpeggios'],['dominant7','Dominant 7th'],['diminished7','Diminished 7th'],['chromatic','Chromatic Scales'],['doubleStops','Double Stops'],['oneString','One-String Scales']];
 const out=[];groups.forEach(([k,cat])=>{const v=Array.isArray(c[k])?c[k]:(c[k]!=null?[c[k]]:[]);v.forEach(x=>out.push({id:'scale-'+l+'-'+t+'-'+out.length,curriculum:'scales',category:cat,title:String(x),level:l,term:t,requirements:{tempo:c.tempo,octaves:c.octaves,bowing:c.bowing,articulation:c.articulation,rhythmicGroups:c.rhythmicGroups||c.rhythm,accents:c.accents,dynamics:c.dynamics,positions:c.positions},objective:c.objective,mastery:c.mastery,source:'scale-curriculum-data.js'}))});return out;
}
function selectedForStudent(id){const x=read(STUDENT_SCALE_PREFIX+String(id),null);return Array.isArray(x)?x:[]}
function canonicalPayload(s,items){return{studentId:sid(s),studentName:text(s.name||s.studentName||'Student'),level:levelOf(s),term:termOf(s),kind:'lesson',curriculum:'scales',items:Array.isArray(items)?items:[],updatedAt:new Date().toISOString(),source:'V13 Scales Bridge v20'}}
function saveSelection(s,items){
 const p=canonicalPayload(s,items),id=p.studentId;
 if(!id||!p.items.length)return null;
 const db=read(STORE,{}),entry=db[id]&&typeof db[id]==='object'?db[id]:{};
 entry.lesson=entry.lesson&&typeof entry.lesson==='object'?entry.lesson:{};entry.homework=entry.homework&&typeof entry.homework==='object'?entry.homework:{};
 entry.lesson.scales=p;db[id]=entry;
 const token='lh-'+id+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),hdb=read(HANDOFF,{});
 hdb[token]={version:3,token,...p,createdAt:p.updatedAt};
 const keys=Object.keys(hdb).sort((a,b)=>String(hdb[b]?.createdAt||'').localeCompare(String(hdb[a]?.createdAt||''))),keep={};keys.slice(0,30).forEach(k=>keep[k]=hdb[k]);
 const active={...p,version:3,token,source:'V13 Scales Bridge v20'};
 if(!write(STORE,db)||!write(STUDENT_SCALE_PREFIX+id,items)||!write(HANDOFF,keep)||!write(ACTIVE,active))return null;
 const verifyDb=read(STORE,{}),verifyStudent=selectedForStudent(id),verifyHand=read(HANDOFF,{}),verifyActive=read(ACTIVE,null);
 if(!Array.isArray(verifyDb?.[id]?.lesson?.scales?.items)||verifyDb[id].lesson.scales.items.length!==items.length||verifyStudent.length!==items.length||!verifyHand?.[token]?.items?.length||verifyHand[token].items.length!==items.length||String(verifyActive?.studentId)!==id||verifyActive.items.length!==items.length){console.error('[V13 Scales] selection verification failed',{id,items,verifyDb,verifyStudent,verifyHand:verifyHand[token],verifyActive});return null}
 return {payload:p,token};
}
function ensureCss(d){if(d.getElementById('v13-scale-css'))return;const st=d.createElement('style');st.id='v13-scale-css';st.textContent='.v13-scale-box{display:block!important;visibility:visible!important;margin:12px 0!important;padding:14px!important;border:1px solid #dfd4ff!important;border-radius:16px!important;background:#faf8ff!important;color:#24344c!important;position:relative!important;z-index:20!important}.v13-scale-box h3{margin:0 0 3px;font-size:19px}.v13-scale-sub{font-size:12px;color:#687487;margin-bottom:10px}.v13-scale-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v13-scale-cat{border:1px solid #e4e0ef;border-radius:10px;background:#fff;padding:9px}.v13-scale-cat>b{display:block;margin-bottom:5px;font-size:12px}.v13-scale-cat label{display:flex;gap:7px;align-items:flex-start;margin:5px 0;font-size:12px;font-weight:800}.v13-scale-cat input{width:17px;height:17px;margin:0}.v13-scale-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v13-scale-actions button{border:0;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.v13-scale-actions button:first-child{background:#24344c;color:#fff}.v13-scale-actions button:last-child{background:#64c6a3;color:#12372c}@media(max-width:650px){.v13-scale-grid{grid-template-columns:1fr}}';d.head.appendChild(st)}
function remove(d){d.getElementById('v13-curriculum-scales')?.remove();lastKey=''}
function render(d){
 const s=currentStudent(d);if(!s){remove(d);return}const it=curriculumItems(s);if(!it.length){remove(d);return};const key=sid(s)+'|'+levelOf(s)+'|'+termOf(s);let host=d.getElementById('v13-curriculum-scales');if(host&&lastKey===key)return;
 if(!host){const tabs=d.querySelector('.tabs');const anchor=tabs||d.querySelector('.wrap')||d.body;host=d.createElement('section');host.id='v13-curriculum-scales';if(tabs)tabs.insertAdjacentElement('afterend',host);else anchor.appendChild(host)}
 lastKey=key;const prior=selectedForStudent(sid(s)),priorKeys=new Set(prior.map(x=>String(x.id||'')+'|'+String(x.title||x.name||'')));const groups={};it.forEach((x,i)=>(groups[x.category]??=[]).push([x,i]);
 let h='<div class="v13-scale-box"><h3>🎼 Curriculum Scales</h3><div class="v13-scale-sub">Level '+levelOf(s)+' · Term '+termOf(s)+'</div><div class="v13-scale-grid">';
 Object.entries(groups).forEach(([cat,a])=>{h+='<div class="v13-scale-cat"><b>'+esc(cat)+'</b>';a.forEach(([x,i])=>{const title=String(x.title||x.name||x),checked=priorKeys.has(String(x.id||'')+'|'+title)?' checked':'';h+='<label><input type="checkbox" data-i="'+i+'"'+checked+'><span>'+esc(title)+'</span></label>'});h+='</div>'});
 h+='</div><div class="v13-scale-actions"><button type="button" data-a="lesson">🎓 Add selected to Lesson</button><button type="button" data-a="homework">🏠 Add selected to Homework</button></div></div>';host.innerHTML=h;ensureCss(d);
 const chosen=()=>it.filter((x,i)=>host.querySelector('[data-i="'+i+'"]')?.checked);
 host.querySelector('[data-a="lesson"]').onclick=()=>{const x=chosen();if(!x.length){alert('Select at least one scale.');return}const saved=saveSelection(s,x);if(!saved){alert('Could not verify the Lesson selection. Please try again.');return}const u=new URL('./lesson-v13.html',window.location.href);u.searchParams.set('studentId',saved.payload.studentId);u.searchParams.set('handoff',saved.token);u.searchParams.set('v','scales-to-lesson-v20-'+Date.now());window.top.location.assign(u.href)};
 host.querySelector('[data-a="homework"]').onclick=()=>{const x=chosen();if(!x.length){alert('Select at least one scale.');return}const p={...canonicalPayload(s,x),kind:'homework',source:'V13 Scales Bridge v20'};write('VIOLIN_AI_HOMEWORK_SELECTION_V1',p);alert('Selected scales added to Homework.')};
}
function sync(){try{const d=frame?.contentDocument;if(d?.body)render(d)}catch(e){console.error('[V13 Scales] sync error',e)}}
function bind(){const d=frame?.contentDocument;if(!d?.body||bound===d)return;bound=d;if(observer)observer.disconnect();observer=new MutationObserver(()=>{clearTimeout(sync._t);sync._t=setTimeout(sync,30)});observer.observe(d.body,{childList:true,subtree:true});sync()}
frame?.addEventListener('load',()=>{bound=null;lastKey='';setTimeout(bind,0);setTimeout(bind,150);setTimeout(bind,500)});if(frame?.contentDocument)bind();
window.VIOLIN_AI_CURRICULUM_BRIDGE={version:'20.0',sync:bind};
})();