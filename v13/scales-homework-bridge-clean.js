(function(){'use strict';
/* V13 CLEAN SCALES → HOMEWORK DISPLAY BRIDGE
   The Scales owner remains the only writer of the exact selection.
   This file is display-only: it reads the persisted homework selection and
   exposes it inside the existing Homework view. It does not rebuild or
   re-select curriculum items.
*/
const root=document.getElementById('app');
const STORE='VIOLIN_AI_HOMEWORK_SELECTION_V1';
const ID='v13-clean-homework-scales';
const txt=v=>String(v??'').replace(/\s+/g,' ').trim();
function read(){try{const x=JSON.parse(localStorage.getItem(STORE)||'null');return x&&Array.isArray(x.items)&&x.items.length?x:null}catch(e){return null}}
function isHomework(d){const body=txt(d?.body?.innerText||'');if(!body)return false;return /homework/i.test(body)&&(/today|student|lesson|homework/i.test(body))}
function render(d,p){if(!d?.body||!isHomework(d))return;let old=d.getElementById(ID);if(old)old.remove();const anchor=d.querySelector('.wrap')||d.body;const card=d.createElement('section');card.id=ID;card.className='section';card.style.cssText='background:#f2fbf7;border:1px solid #cfeadd;border-radius:16px;padding:14px;margin:14px 0';const title=d.createElement('h3');title.textContent='🎼 Selected Scales';title.style.margin='0 0 8px';card.appendChild(title);const meta=d.createElement('div');meta.textContent=(p.studentName||'Student')+' · '+(p.level?'Level '+p.level+' · ':'')+(p.term?'Term '+p.term:'');meta.style.cssText='font-size:12px;color:#687487;margin-bottom:9px';card.appendChild(meta);p.items.forEach(x=>{const row=d.createElement('div');row.style.cssText='background:#fff;border:1px solid #dcefe6;border-radius:10px;padding:8px 10px;margin:5px 0;font-weight:700';row.textContent=txt(x.title||x.name||x)+' · '+txt(x.category||x.cat||'Scales');card.appendChild(row)});const note=d.createElement('div');note.textContent='✓ Transferred from the teacher’s exact scale selection';note.style.cssText='font-size:11px;font-weight:800;color:#27865f;margin-top:9px';card.appendChild(note);anchor.insertBefore(card,anchor.firstChild)}
function walk(d){try{if(!d?.body)return;const p=read();if(p&&isHomework(d))render(d,p);[...d.querySelectorAll('iframe')].forEach(f=>{try{walk(f.contentDocument)}catch(e){}})}catch(e){}}
function run(){try{walk(root?.contentDocument)}catch(e){}}
root?.addEventListener('load',()=>{[100,400,1000].forEach(ms=>setTimeout(run,ms))});
setInterval(run,750);run();
})();
