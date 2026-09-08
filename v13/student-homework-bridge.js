/* VIOLIN AI V13 — Student Homework Mirror
   Central Homework is the single source of truth.
   IMPORTANT: this bridge only owns the Student -> Homework tab handoff.
   It must never intercept the Master top navigation. */
(function(){
'use strict';
var frame=document.getElementById('app')||document.getElementById('appFrame');if(!frame)return;
function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]})}
function getW(){return frame.contentWindow}
function master(){try{return window}catch(e){return window}}
function controller(){var m=master();return m&&m.VIOLIN_AI_CURRICULUM&&m.VIOLIN_AI_CURRICULUM.controller}
function items(id){try{var c=controller(),r=c&&c.getHomework&&c.getHomework(id);if(r&&Array.isArray(r.items))return r.items}catch(e){}try{var db=JSON.parse(localStorage.getItem('VIOLIN_AI_HOMEWORK_QUEUE_V1')||'{}');return db[String(id)]&&Array.isArray(db[String(id)].items)?db[String(id)].items:[]}catch(e){return []}}
function openHomework(){var w=getW();if(!w||!w.state||!w.state.sid)return false;w.state.studentTab='Homework';w.state.page='studentTab';return render()}
function render(){var w=getW(),id=String(w.state&&w.state.sid||''),s=w.data&&w.data.students&&w.data.students.find(function(x){return String(x.id)===id});if(!id||!s)return false;var a=items(id),c=controller();var body='<div class="title"><h2>🏠 HOMEWORK · '+esc(s.name)+'</h2><button class="btn ghost" id="studentHomeworkBack">← Daily Planner</button></div><div class="tabs">'+
'<button class="tab" data-student-tab="Pieces">🎼 REPERTOIRE</button><button class="tab" data-student-tab="Scales">🎵 SCALES</button><button class="tab" data-student-tab="Études">📚 ÉTUDΕΣ</button><button class="tab" data-student-tab="Technical Studies">🧩 TECHNIQUE</button><button class="tab active" data-student-tab="Homework">🏠 HOMEWORK</button></div><div class="card"><div class="section-head"><h3>📚 CENTRAL HOMEWORK</h3><span class="pill">'+a.length+' selected</span></div><p class="small">Live mirror — Central Homework is the single source of truth.</p>'+
(a.length?a.map(function(x){var k=[x.curriculum||'',x.id||'',x.title||''].join('|').toLowerCase();return '<div class="repcard mintbg"><b>🎼 '+esc(x.title||x.name||'Selected item')+'</b><div class="small">'+esc(x.category||'Homework')+(x.curriculum?' · '+esc(x.curriculum):'')+'</div><div class="mini-actions"><button class="btn danger" data-hw-key="'+esc(k)+'">Delete</button></div></div>'}).join(''):'<div class="empty">No homework for this student yet.</div>')+
'<div style="margin-top:12px"><button class="btn mint" id="studentCentralAddHW">＋ Add Homework</button></div></div>';w.shell(body);
var back=w.document.getElementById('studentHomeworkBack');if(back)back.onclick=function(){w.student()};
Array.prototype.forEach.call(w.document.querySelectorAll('[data-student-tab]'),function(b){b.onclick=function(){var t=b.getAttribute('data-student-tab');if(t==='Homework'){openHomework();return}if(typeof w.openStudentTab==='function')w.openStudentTab(t)}});
var add=w.document.getElementById('studentCentralAddHW');if(add)add.onclick=function(){var text=w.prompt('Homework:');if(!text||!text.trim())return;if(!c||!c.addHomework)return alert('Central Homework controller unavailable.');c.addHomework({studentId:id,studentName:s.name,level:s.level,term:1,items:[{id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),curriculum:'manual',category:'Homework',title:text.trim(),source:'student-homework'}],source:'student-homework'});render()};
Array.prototype.forEach.call(w.document.querySelectorAll('[data-hw-key]'),function(b){b.onclick=function(){if(!c||!c.removeHomework)return;if(!w.confirm('Delete this homework from Central Homework?'))return;c.removeHomework(id,b.getAttribute('data-hw-key'));render()}});return true}
function hook(){try{var w=getW();if(!w||!w.document||!w.document.body)return false;if(w.__centralHomeworkMirrorHook)return true;var original=w.openStudentTab;if(typeof original!=='function')return false;w.openStudentTab=function(tab){if(String(tab)==='Homework')return openHomework();return original.apply(w,arguments)};w.__centralHomeworkMirrorHook=true;
/* Capture only Student tab clicks. Never inspect or intercept .nav. */
w.document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('.tabs .tab'):null;if(!b)return;var t=b.getAttribute('data-student-tab')||String(b.textContent||'').replace(/\s+/g,' ').trim();if(t==='Homework'||t==='🏠 HOMEWORK'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openHomework()}},true);
return true}catch(e){return false}}
function boot(){hook();setTimeout(hook,100);setTimeout(hook,500);setTimeout(hook,1200)}
frame.addEventListener('load',boot);boot();setInterval(hook,1000);
})();
