(function(){'use strict';
/* V13 Scales -> Lesson V22
   The MASTER page hosts the real Agenda inside #app. A listener attached to
   the MASTER document cannot receive clicks occurring inside that iframe.
   Therefore this transport binds directly to the iframe document after every
   iframe load and owns the Scales -> Lesson transition from inside the app.
*/
const frame=document.getElementById('app');
function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}}
function sid(s){return String(s?.id??s?.studentId??s?.uid??'')}
function text(v){return String(v??'').replace(/\s+/g,' ').trim()}
function students(){const x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x?.students)?x.students:Array.isArray(x)?x:[]}
function currentStudent(doc){try{const u=new URL(doc.location.href),id=u.searchParams.get('studentId')||u.searchParams.get('sid');if(id){const s=students().find(x=>sid(x)===id);if(s)return s}}catch(e){}return null}
function isLessonButton(el){const b=el?.closest?.('button,a,[role="button"],input[type="button"],input[type="submit"]');if(!b)return false;const t=text(b.innerText||b.textContent||b.value||'').toLowerCase();return /add\s+to\s+lesson|lesson\s*\+|add.*lesson/.test(t)}
function scaleContext(b,doc){let n=b;for(let i=0;i<7&&n;i++,n=n.parentElement){const t=text(n.innerText||'').toLowerCase();if(/scales|κλίμακ/.test(t)&&n.querySelectorAll('input[type="checkbox"]').length)return n}return doc.body}
function collectItems(doc,b,s){const context=scaleContext(b,doc);let boxes=[...context.querySelectorAll('input[type="checkbox"]:checked')];if(!boxes.length)boxes=[...doc.querySelectorAll('input[type="checkbox"]:checked')];const seen=new Set(),items=[];boxes.forEach((inp,i)=>{const label=inp.closest('label')||inp.parentElement;const title=text(label?.querySelector('[data-title],.title,.name,strong,b')?.textContent||label?.textContent||inp.value||inp.getAttribute('aria-label')||'');if(!title)return;const clean=title.replace(/^(select|choose|add)\s*/i,'').trim();if(!clean||/^(all|select all|none)$/i.test(clean))return;const key=clean.toLowerCase();if(seen.has(key))return;seen.add(key);let cat='Scales';let p=label;for(let j=0;j<5&&p;j++,p=p.parentElement){const h=p.querySelector('h1,h2,h3,h4,b,strong');if(h&&text(h.textContent)){const ht=text(h.textContent);if(ht.length<80&&!/add\s+to\s+lesson/i.test(ht)){cat=ht;break}}}const idx=inp.dataset.i??inp.value??i;items.push({id:'scale-'+String(idx)+'-'+clean,curriculum:'scales',category:cat,title:clean,level:Number(s.level)||1,term:Number(s.term)||1})});return items}
function transport(e){if(!isLessonButton(e.target))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const doc=e.currentTarget;const s=currentStudent(doc);if(!s){alert('Student context could not be resolved.');return}const items=collectItems(doc,e.target,s);if(!items.length){alert('Select at least one scale.');return}const payload={version:22,studentId:sid(s),studentName:text(s.name||s.studentName||'Student'),level:Number(s.level)||1,term:Number(s.term)||1,kind:'lesson',curriculum:'scales',items,createdAt:new Date().toISOString()};const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const u=new URL('./lesson-handoff-v13.html',window.location.href);u.searchParams.set('studentId',payload.studentId);u.searchParams.set('selection',encoded);u.searchParams.set('v','22-'+Date.now());window.top.location.assign(u.href)}
function bind(){try{const doc=frame.contentDocument;if(!doc)return;doc.removeEventListener('click',transport,true);doc.addEventListener('click',transport,true)}catch(e){console.error('[V13 Scales V22] iframe bind failed',e)}}
frame.addEventListener('load',function(){setTimeout(bind,0)});bind();
})();
