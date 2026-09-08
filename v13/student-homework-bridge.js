/* VIOLIN AI V13 — Student Homework Bridge: Central Homework mirror. */
(function(){
'use strict';
var frame=document.getElementById('app')||document.getElementById('appFrame');if(!frame)return;
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]})}
function master(w){try{return w.parent||w}catch(e){return w}}
function controller(w){var m=master(w);return m&&m.VIOLIN_AI_CURRICULUM&&m.VIOLIN_AI_CURRICULUM.controller}
function queue(w,id){try{var C=controller(w),q=C&&C.getHomework&&C.getHomework(id);if(q&&Array.isArray(q.items))return q.items}catch(e){}try{var db=JSON.parse(master(w).localStorage.getItem('VIOLIN_AI_HOMEWORK_QUEUE_V1')||'{}');return db&&db[String(id)]&&Array.isArray(db[String(id)].items)?db[String(id)].items:[]}catch(e){return []}}
function render(w){
var id=w.state&&String(w.state.sid||'');var s=w.data&&Array.isArray(w.data.students)?w.data.students.find(function(x){return String(x.id)===id}):null;if(!id||!s)return false;var items=queue(w,id);
var body='<div class="title"><h2>🏠 HOMEWORK · '+esc(s.name)+'</h2><button class="btn ghost" onclick="student()">← Daily Planner</button></div>'+
'<div class="tabs"><button class="tab" onclick="openStudentTab(\'Pieces\')">🎼 REPERTOIRE</button><button class="tab" onclick="openStudentTab(\'Scales\')">🎵 SCALES</button><button class="tab" onclick="openStudentTab(\'Études\')">📚 ÉTUDES</button><button class="tab" onclick="openStudentTab(\'Technical Studies\')">🧩 TECHNIQUE</button><button class="tab active">🏠 HOMEWORK</button></div>'+
'<div class="card"><div class="section-head"><h3>📚 CENTRAL HOMEWORK</h3><span class="pill">'+items.length+' selected</span></div><p class="small">Live mirror του Central Homework — η ίδια πηγή δεδομένων.</p>'+
(items.length?items.map(function(x){return '<div class="repcard mintbg"><b>🎼 '+esc(x.title||x.name||'Selected item')+'</b><div class="small">'+esc(x.curriculum||x.category||'')+'</div></div>'}).join(''):'<div class="empty">Δεν υπάρχει homework για αυτόν τον μαθητή.</div>')+'</div>';
w.shell(body);return true}
function install(){try{var w=frame.contentWindow,doc=w&&w.document;if(!w||!doc||!doc.body)return;if(doc.__studentHomeworkBridgeInstalled)return;doc.__studentHomeworkBridgeInstalled=true;doc.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('button'):null;if(!el||!el.closest('.tabs'))return;var t=clean(el.textContent).toUpperCase();if((t==='🏠 HOMEWORK'||t==='HOMEWORK')&&w.state&&w.state.sid){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();render(w)}},true)}catch(e){}}
frame.addEventListener('load',function(){setTimeout(install,100);setTimeout(install,500);setTimeout(install,1200)});setInterval(install,1000);
})();
