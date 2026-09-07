(function(){'use strict';
/* V13 Scales -> Lesson V23
   MASTER hosts the Agenda in an iframe. Transport is bound inside that iframe.
   Student identity is resolved from URL first and from the visible Scales
   student heading / agenda data as a fallback.
*/
const frame=document.getElementById('app');
function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}}
function sid(s){return String(s?.id??s?.studentId??s?.uid??'')}
function text(v){return String(v??'').replace(/\s+/g,' ').trim()}
function students(){const x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x?.students)?x.students:Array.isArray(x)?x:[]}
function currentStudent(doc){
  try{const u=new URL(doc.location.href),id=u.searchParams.get('studentId')||u.searchParams.get('sid');if(id){const s=students().find(x=>sid(x)===id);if(s)return s}}catch(e){}
  const ss=students();
  const heads=[...doc.querySelectorAll('h1,h2,h3,h4,.title,.section-title')].map(x=>text(x.textContent)).filter(Boolean);
  for(const h of heads){
    const m=h.match(/(?:scales|κλίμακες?)\s*[-–—:]\s*(.+)$/i);
    const candidate=m?m[1].trim():'';
    if(candidate){const s=ss.find(x=>text(x.name||x.studentName).toLowerCase()===candidate.toLowerCase());if(s)return s}
    const s=ss.find(x=>{const n=text(x.name||x.studentName);return n&&h.toLowerCase().includes(n.toLowerCase())});
    if(s)return s;
  }
  try{const w=frame.contentWindow;for(const k of ['currentStudentId','selectedStudentId','activeStudentId']){const id=w?.[k];if(id){const s=ss.find(x=>sid(x)===String(id));if(s)return s}}}catch(e){}
  return null;
}
function isLessonButton(el){const b=el?.closest?.('button,a,[role="button"],input[type="button"],input[type="submit"]');if(!b)return false;const t=text(b.innerText||b.textContent||b.value||'').toLowerCase();return /add\s+to\s+lesson|lesson\s*\+|add.*lesson/.test(t)}
function scaleContext(b,doc){let n=b;for(let i=0;i<9&&n;i++,n=n.parentElement){const t=text(n.innerText||'').toLowerCase();if(/scales|κλίμακ/.test(t)&&n.querySelectorAll('input[type="checkbox"]').length)return n}return doc.body}
function collectItems(doc,b,s){const context=scaleContext(b,doc);let boxes=[...context.querySelectorAll('input[type="checkbox"]:checked')];if(!boxes.length)boxes=[...doc.querySelectorAll('input[type="checkbox"]:checked')];const seen=new Set(),items=[];boxes.forEach((inp,i)=>{const label=inp.closest('label')||inp.parentElement;const title=text(label?.querySelector('[data-title],.title,.name,strong,b')?.textContent||label?.textContent||inp.value||inp.getAttribute('aria-label')||'');if(!title)return;const clean=title.replace(/^(select|choose|add)\s*/i,'').replace(/\s*☑\s*$/,'').trim();if(!clean||/^(all|select all|none|add to lesson)$/i.test(clean))return;const key=clean.toLowerCase();if(seen.has(key))return;seen.add(key);let cat='Scales',p=label;for(let j=0;j<6&&p;j++,p=p.parentElement){const h=p.querySelector('h1,h2,h3,h4,b,strong');if(h&&text(h.textContent)){const ht=text(h.textContent);if(ht.length<80&&!/add\s+to\s+lesson/i.test(ht)&&!/scales/i.test(ht)){cat=ht;break}}}const idx=inp.dataset.i??inp.value??i;items.push({id:'scale-'+String(idx)+'-'+clean,curriculum:'scales',category:cat,title:clean,level:Number(s.level)||1,term:Number(s.term)||1})});return items}
function transport(e){if(!isLessonButton(e.target))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const doc=e.currentTarget,s=currentStudent(doc);if(!s){alert('Student context could not be resolved.');return}const items=collectItems(doc,e.target,s);if(!items.length){alert('Select at least one scale.');return}const payload={version:23,studentId:sid(s),studentName:text(s.name||s.studentName||'Student'),level:Number(s.level)||1,term:Number(s.term)||1,kind:'lesson',curriculum:'scales',items,createdAt:new Date().toISOString()};const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const u=new URL('./lesson-handoff-v13.html',window.location.href);u.searchParams.set('studentId',payload.studentId);u.searchParams.set('selection',encoded);u.searchParams.set('v','23-'+Date.now());window.top.location.assign(u.href)}
function bind(){try{const doc=frame.contentDocument;if(!doc)return;doc.removeEventListener('click',transport,true);doc.addEventListener('click',transport,true)}catch(e){console.error('[V13 Scales V23] iframe bind failed',e)}}
frame.addEventListener('load',function(){setTimeout(bind,0);setTimeout(bind,500)});bind();
})();
