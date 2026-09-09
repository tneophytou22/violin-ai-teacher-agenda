(function(w){'use strict';
const frame=document.getElementById('app');
const STORE='VIOLIN_AI_CURRICULUM_SELECTION_V2';
const HOME='VIOLIN_AI_HOMEWORK_QUEUE_V1';
const ACTIVE='VIOLIN_AI_LESSON_ACTIVE_V13';
let bound=null,observer=null,lastKey='';
const read=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
const text=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function students(){const x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x?.students)?x.students:Array.isArray(x)?x:[]}
function sid(s){return String(s?.id??s?.studentId??s?.uid??'')}
function levelOf(s){return Number(String(s?.level??s?.Level??s?.currentLevel??1).match(/\d+/)?.[0]||1)}
function termOf(s){return Number(String(s?.term??s?.Term??s?.currentTerm??1).match(/\d+/)?.[0]||1)}
function byId(id){return students().find(x=>sid(x)===String(id))||null}
function currentStudent(d){
 try{const u=new URL(frame.contentWindow.location.href),id=u.searchParams.get('studentId')||u.searchParams.get('sid');if(id){const s=byId(id);if(s)return s}}catch(e){}
 const e=d.querySelector('[data-student-id],[data-studentid],[data-sid]');if(e){const s=byId(e.getAttribute('data-student-id')||e.getAttribute('data-studentid')||e.getAttribute('data-sid'));if(s)return s}
 for(const el of d.querySelectorAll('h1,h2,h3,h4,.title,.page-title,.student-title,[class*="title"]')){const m=text(el.textContent).match(/(?:ÉTUDES|ETUDES)\s*[·•—-]\s*(.+)$/i);if(m){const s=students().find(x=>text(x.name||x.studentName).toLowerCase()===text(m[1]).toLowerCase());if(s)return s}}
 return null;
}
function itemsFor(s){
 const l=levelOf(s),t=termOf(s);try{const a=w.VIOLIN_AI_CURRICULUM?.controller?.list?.('etudes',l,t);if(Array.isArray(a)&&a.length)return a}catch(e){}
 const c=w.VIOLIN_ETUDES_CURRICULUM_V1?.getTerm?.(l,t)||w.VIOLIN_ETUDES_CURRICULUM_V1?.levels?.[l]?.terms?.[t];
 return (c?.etudes||[]).map(x=>({id:x.id,curriculum:'etudes',category:'Études',title:(x.composer||'')+(x.opus?' '+x.opus:'')+' No.'+x.number,level:l,term:t,requirements:{primaryTechnique:x.primaryTechnique,technicalRequirementsCovered:x.technicalRequirementsCovered,prerequisites:x.prerequisites},objective:x.masteryObjective,mastery:x.masteryObjective,source:'etudes-curriculum-data.js',etude:x}));
}
function save(s,items,kind){
 const id=sid(s);if(!id||!items.length)return null;const p={studentId:id,studentName:text(s.name||s.studentName||'Student'),level:levelOf(s),term:termOf(s),kind,curriculum:'etudes',items,updatedAt:new Date().toISOString(),source:'V13 Etudes Bridge'};
 const C=w.VIOLIN_AI_CURRICULUM?.controller;if(C?.select)C.select(p);else{const db=read(STORE,{}),v=db[id]&&typeof db[id]==='object'?db[id]:{lesson:{},homework:{}};v[kind]=v[kind]&&typeof v[kind]==='object'?v[kind]:{};v[kind].etudes=p;db[id]=v;write(STORE,db);if(kind==='homework'){const h=read(HOME,{}),old=h[id]||{},merged=(old.items||[]).concat(items),seen={};old.items=merged.filter(x=>{const k=(x.curriculum||'')+'|'+(x.id||'')+'|'+(x.title||'');if(seen[k])return false;seen[k]=1;return true});old.studentId=id;old.studentName=p.studentName;old.level=p.level;old.term=p.term;h[id]=old;write(HOME,h)}}
 if(kind==='lesson')write(ACTIVE,{...p,version:3});return p;
}
function ensureCss(d){if(d.getElementById('v13-etude-css'))return;const st=d.createElement('style');st.id='v13-etude-css';st.textContent='.v13-etude-box{display:block!important;visibility:visible!important;margin:12px 0!important;padding:14px!important;border:1px solid #f0d9c8!important;border-radius:16px!important;background:#fffaf6!important;color:#24344c!important;position:relative!important;z-index:20!important}.v13-etude-box h3{margin:0 0 3px;font-size:19px}.v13-etude-sub{font-size:12px;color:#687487;margin-bottom:10px}.v13-etude-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v13-etude-item{display:flex;gap:8px;align-items:flex-start;background:#fff;border:1px solid #eadfd6;border-radius:10px;padding:10px}.v13-etude-item input{width:18px;height:18px;margin-top:2px}.v13-etude-item b{font-size:13px}.v13-etude-item small{display:block;color:#687487;margin-top:3px}.v13-etude-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v13-etude-actions button{border:0;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.v13-etude-actions button:first-child{background:#24344c;color:#fff}.v13-etude-actions button:last-child{background:#64c6a3;color:#12372c}@media(max-width:650px){.v13-etude-grid{grid-template-columns:1fr}}';d.head.appendChild(st)}
function remove(d){d.getElementById('v13-curriculum-etudes')?.remove();lastKey=''}
function render(d){
 const title=text(d.querySelector('h1')?.textContent||d.title||'').toUpperCase();if(!/(ÉTUDES|ETUDES)/.test(title)){remove(d);return}
 const s=currentStudent(d);if(!s){remove(d);return}const it=itemsFor(s);if(!it.length){remove(d);return}
 const key=sid(s)+'|'+levelOf(s)+'|'+termOf(s);let host=d.getElementById('v13-curriculum-etudes');if(host&&lastKey===key)return;
 if(!host){const tabs=d.querySelector('.tabs'),anchor=tabs||d.querySelector('.wrap')||d.body;host=d.createElement('section');host.id='v13-curriculum-etudes';if(tabs)tabs.insertAdjacentElement('afterend',host);else anchor.appendChild(host)}
 lastKey=key;let h='<div class="v13-etude-box"><h3>📚 Curriculum Études</h3><div class="v13-etude-sub">Level '+levelOf(s)+' · Term '+termOf(s)+' · Exact numbered studies</div><div class="v13-etude-grid">';
 it.forEach((x,i)=>{const title=String(x.title||x.name||x),tech=x.requirements?.primaryTechnique||x.etude?.primaryTechnique||'';h+='<label class="v13-etude-item"><input type="checkbox" data-i="'+i+'"><span><b>'+esc(title)+'</b><small>No.'+esc(x.etude?.number??'')+' · '+esc(tech)+'</small></span></label>'});
 h+='</div><div class="v13-etude-actions"><button type="button" data-a="lesson">🎓 Add selected to Lesson</button><button type="button" data-a="homework">🏠 Add selected to Homework</button></div></div>';host.innerHTML=h;ensureCss(d);
 const chosen=()=>it.filter((x,i)=>host.querySelector('[data-i="'+i+'"]')?.checked);
 host.querySelector('[data-a="lesson"]').onclick=()=>{const x=chosen();if(!x.length)return alert('Select at least one étude.');const p=save(s,x,'lesson');if(!p)return alert('Could not save the Études selection.');write('VIOLIN_AI_ETUDE_SELECTION_STUDENT_V1_'+sid(s),x);const u=new URL('./lesson-v13.html',window.location.href);u.searchParams.set('studentId',p.studentId);u.searchParams.set('selection',encodeURIComponent(JSON.stringify(p)));u.searchParams.set('v','etudes-to-lesson-v1-'+Date.now());window.top.location.assign(u.href)};
 host.querySelector('[data-a="homework"]').onclick=()=>{const x=chosen();if(!x.length)return alert('Select at least one étude.');save(s,x,'homework');write('VIOLIN_AI_ETUDE_SELECTION_STUDENT_V1_'+sid(s),x);const hb=[...d.querySelectorAll('button')].find(b=>/\bHOMEWORK\b/i.test(b.textContent||''));if(hb)hb.click();else alert('Selected études added to Homework.')};
}
function sync(){try{const d=frame?.contentDocument;if(d?.body)render(d)}catch(e){console.error('[V13 Etudes] sync error',e)}}
function bind(){const d=frame?.contentDocument;if(!d?.body||bound===d)return;bound=d;if(observer)observer.disconnect();observer=new MutationObserver(()=>{clearTimeout(sync._t);sync._t=setTimeout(sync,50)});observer.observe(d.body,{childList:true,subtree:true});sync()}
frame?.addEventListener('load',()=>{bound=null;lastKey='';setTimeout(bind,0);setTimeout(bind,150);setTimeout(bind,500)});if(frame?.contentDocument)bind();w.VIOLIN_AI_ETUDES_BRIDGE={version:'1.0',sync:bind};
})(window);
