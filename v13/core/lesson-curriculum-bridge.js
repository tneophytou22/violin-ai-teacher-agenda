(function(w,d){'use strict';
/* V13 Lesson Curriculum Bridge
   Lesson consumes curriculum selections only through the V13 controller.
   Legacy lesson rendering is visually isolated so curriculum lists never leak into Lesson.
   Generic by design: any registered curriculum can participate without changing Lesson code.
*/
var NS=w.VIOLIN_AI_CURRICULUM=w.VIOLIN_AI_CURRICULUM||{};
var C=NS.controller;
if(!C)return;
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
function read(k,f){try{var x=JSON.parse(w.localStorage.getItem(k)||'null');return x==null?f:x}catch(e){return f}}
function agenda(){var x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x.students)?x.students:[]}
function sid(s){return String(s&&(s.id??s.studentId??s.uid)??'')}
function student(doc){var q='';try{q=new URL(w.document.getElementById('app').contentWindow.location.href).searchParams.get('studentId')||''}catch(e){}var a=agenda();if(q){var z=a.find(function(x){return sid(x)===String(q)});if(z)return z}var body=(doc.body&&doc.body.innerText)||'';for(var i=0;i<a.length;i++){var n=String(a[i].name||a[i].studentName||'').trim();if(n&&body.indexOf(n)>=0)return a[i]}return null}
function isLesson(doc){var u='';try{u=String(w.document.getElementById('app').contentWindow.location.href)}catch(e){}return /\/lesson\.html(?:\?|$)/i.test(u)}
function selections(s){var out=[];var reg=NS.registry||{};Object.keys(reg).forEach(function(name){var p=C.getSelection(sid(s),'lesson',name);if(p&&Array.isArray(p.items))p.items.forEach(function(x){out.push({curriculum:name,item:x})})});return out}
function css(doc){if(doc.getElementById('v13lessonbridgecss'))return;var st=doc.createElement('style');st.id='v13lessonbridgecss';st.textContent='.v13-controller-selection{margin:12px 0;padding:12px 14px;border:1px solid #dfd4ff;border-radius:14px;background:#faf8ff;color:#24344c}.v13-controller-selection h3{margin:0 0 3px;font-size:17px}.v13-controller-selection-sub{font-size:12px;color:#687487;margin-bottom:8px}.v13-controller-selection-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.v13-controller-selection-card{padding:8px 10px;border:1px solid #e2e5eb;border-radius:9px;background:#fff}.v13-controller-selection-card b{font-size:12px}.v13-controller-selection-card small{display:block;color:#687487;font-size:10px;margin-top:2px}@media(max-width:900px){.v13-controller-selection-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.v13-controller-selection-grid{grid-template-columns:1fr}}';doc.head.appendChild(st)}
function removeLegacyCurriculum(doc){var detail=doc.getElementById('content');if(detail){detail.querySelectorAll('.v13-lesson-scale-details').forEach(function(x){x.remove()});detail.querySelectorAll('.collapse').forEach(function(c){var h=(c.querySelector('.collapse-head')||{}).textContent||'';if(/^(\s*)Scales\b|^\s*Technique\b|^\s*Technical Exercises\b/i.test(h.trim()))c.remove()})}
var plan=doc.getElementById('plan');if(plan){plan.querySelectorAll('.selectrow').forEach(function(row){var t=(row.textContent||'').trim();if(/^Scales\s*·|^Technique\s*·|^Technical Exercises\s*·/i.test(t))row.remove()})}}
function render(s,doc){var picks=selections(s);removeLegacyCurriculum(doc);css(doc);var old=doc.getElementById('v13controllerselection');if(!picks.length){if(old)old.remove();return}if(!old){old=doc.createElement('section');old.id='v13controllerselection';old.className='v13-controller-selection';var plan=doc.getElementById('plan'),pc=plan&&plan.parentElement;if(pc)pc.parentElement.insertBefore(old,pc.nextSibling);else(doc.querySelector('.wrap')||doc.body).appendChild(old)}var h='<h3>🎼 Curriculum Selection</h3><div class="v13-controller-selection-sub">Only items selected by the teacher for this lesson.</div><div class="v13-controller-selection-grid">';picks.forEach(function(p){var x=p.item||{},r=x.requirements||{};var meta=[p.curriculum,x.category,r.octaves,r.tempo].filter(Boolean).map(esc).join(' · ');h+='<div class="v13-controller-selection-card"><b>'+esc(x.title||x.name||'Selected item')+'</b><small>'+meta+'</small></div>'});h+='</div>';old.innerHTML=h}
function run(){try{var frame=d.getElementById('app');if(!frame||!frame.contentDocument)return;var doc=frame.contentDocument;if(!isLesson(doc)){var x=doc.getElementById('v13controllerselection');if(x)x.remove();return}var s=student(doc);if(s)render(s,doc)}catch(e){console.log('V13 LESSON BRIDGE',e)}}
w.VIOLIN_AI_LESSON_BRIDGE={version:'1.0',run:run};
w.addEventListener('load',function(){setTimeout(run,200);setTimeout(run,700);setTimeout(run,1500);setTimeout(run,3000)});w.setInterval(run,700);
})(window,document);
