(function(){'use strict';
/* V13 Scales -> Lesson V21
   Deterministic transport layer. It intercepts the Scales "Add to Lesson"
   action before legacy navigation and carries the exact checked items in the
   URL. This removes runtime dependence on localStorage timing/bridge state.
*/
const frame=document.getElementById('app');
function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}}
function sid(s){return String(s?.id??s?.studentId??s?.uid??'')}
function text(v){return String(v??'').replace(/\s+/g,' ').trim()}
function students(){const x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x?.students)?x.students:Array.isArray(x)?x:[]}
function currentStudent(){try{const u=new URL(frame.contentWindow.location.href),id=u.searchParams.get('studentId')||u.searchParams.get('sid');if(id){const s=students().find(x=>sid(x)===id);if(s)return s}}catch(e){}return null}
function transport(e){
  const b=e.target?.closest?.('#v13-curriculum-scales [data-a="lesson"], #v13ScaleLesson');
  if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const d=frame?.contentDocument;if(!d)return;
  const s=currentStudent();if(!s){alert('Student context could not be resolved.');return}
  const checks=[...d.querySelectorAll('#v13-curriculum-scales [data-i], #v13ScaleLesson')];
  let items=[];
  const host=d.getElementById('v13-curriculum-scales');
  if(host){
    const selected=[...host.querySelectorAll('input[type="checkbox"][data-i]:checked')];
    const all=[...host.querySelectorAll('input[type="checkbox"][data-i]')];
    selected.forEach(inp=>{
      const label=inp.closest('label');const title=text(label?.querySelector('span')?.textContent||'');
      const category=text(label?.closest('.v13-scale-cat')?.querySelector('b')?.textContent||'Scales');
      const idx=Number(inp.dataset.i);items.push({id:'scale-'+idx+'-'+title,curriculum:'scales',category,title,level:Number(s.level)||1,term:Number(s.term)||1});
    });
  }
  if(!items.length){alert('Select at least one scale.');return}
  const payload={version:21,studentId:sid(s),studentName:text(s.name||s.studentName||'Student'),level:Number(s.level)||1,term:Number(s.term)||1,kind:'lesson',curriculum:'scales',items,createdAt:new Date().toISOString()};
  const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const u=new URL('./lesson-handoff-v13.html',window.location.href);u.searchParams.set('studentId',payload.studentId);u.searchParams.set('selection',encoded);u.searchParams.set('v','21-'+Date.now());
  window.top.location.assign(u.href);
}
document.addEventListener('click',transport,true);
})();
