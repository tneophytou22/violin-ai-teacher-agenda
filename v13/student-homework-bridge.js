/* VIOLIN AI V13 — Student Homework Mirror
   Central Homework is the single source of truth. */
(function(){
'use strict';
var frame=document.getElementById('app')||document.getElementById('appFrame');if(!frame)return;
function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]})}
function master(){try{return frame.contentWindow.parent||window}catch(e){return window}}
function getW(){return frame.contentWindow}
function controller(){var m=master();return m&&m.VIOLIN_AI_CURRICULUM&&m.VIOLIN_AI_CURRICULUM.controller}
function agendaStudents(){try{var x=JSON.parse(master().localStorage.getItem('VIOLIN_AI_AGENDA_V10')||'{}');return Array.isArray(x&&x.students)?x.students:Array.isArray(x)?x:[]}catch(e){return []}}
function items(id){try{var c=controller(),r=c&&c.getHomework&&c.getHomework(id);if(r&&Array.isArray(r.items))return r.items}catch(e){}try{var db=JSON.parse(master().localStorage.getItem('VIOLIN_AI_HOMEWORK_QUEUE_V1')||'{}');return db[String(id)]&&Array.isArray(db[String(id)].items)?db[String(id)].items:[]}catch(e){return []}}
function findStudentByHeading(w){
 var d=w.document,h=d&&d.querySelector&&d.querySelector('.title h2');
 var heading=String(h&&h.textContent||'').replace(/\s+/g,' ').trim();
 var name=heading.replace(/^🏠\s*HOMEWORK\s*[·•—:-]\s*/i,'').trim();
 var list=agendaStudents();
 if(name){var byName=list.find(function(x){return String(x&&x.name||x&&x.studentName||'').trim()===name});if(byName)return byName}
 return null;
}
function resolveStudent(w){
 var pending=w.__centralHomeworkMirrorStudent;
 if(pending)return pending;
 var byHeading=findStudentByHeading(w);if(byHeading)return byHeading;
 var sid=(w.location&&new URL(w.location.href).searchParams.get('studentId'))||'';
 if(sid){var list=agendaStudents(),byId=list.find(function(x){return String(x&&x.id)===String(sid)});if(byId)return byId}
 return null;
}
function valueText(v){return Array.isArray(v)?v.join(' · '):String(v==null?'':v)}
function studyInfo(x){
 var r=x&&x.requirements||{},a=[];
 if(r.octaves)a.push('Octaves: '+valueText(r.octaves));
 if(r.positions)a.push('Positions: '+valueText(r.positions));
 if(r.bowing)a.push('Bowing: '+valueText(r.bowing));
 if(r.articulation)a.push('Articulation: '+valueText(r.articulation));
 if(r.rhythmicGroups||r.rhythm)a.push('Rhythm: '+valueText(r.rhythmicGroups||r.rhythm));
 if(r.accents)a.push('Accents: '+valueText(r.accents));
 if(r.dynamics)a.push('Dynamics: '+valueText(r.dynamics));
 if(r.tempo)a.push('Tempo: '+valueText(r.tempo));
 return a;
}
function removeQueueItem(id,key){
 try{
  var m=master(),raw=m.localStorage.getItem('VIOLIN_AI_HOMEWORK_QUEUE_V1')||'{}',db=JSON.parse(raw),rec=db[String(id)];
  if(!rec||!Array.isArray(rec.items))return false;
  var before=rec.items.length;
  rec.items=rec.items.filter(function(x){return [x&&x.curriculum||'',x&&x.id||'',x&&x.title||''].join('|').toLowerCase()!==String(key||'').toLowerCase()});
  if(rec.items.length===before)return false;
  rec.updatedAt=new Date().toISOString();db[String(id)]=rec;
  m.localStorage.setItem('VIOLIN_AI_HOMEWORK_QUEUE_V1',JSON.stringify(db));
  var verify=JSON.parse(m.localStorage.getItem('VIOLIN_AI_HOMEWORK_QUEUE_V1')||'{}'),v=verify[String(id)];
  return !!(v&&Array.isArray(v.items)&&v.items.length===rec.items.length);
 }catch(e){return false}
}
function render(){var w=getW(),s=resolveStudent(w);if(!s)return false;var id=String(s.id||s.studentId||s.uid||''),a=items(id),c=controller();if(!id)return false;
var body='<div class="title"><h2>🏠 HOMEWORK · '+esc(s.name||s.studentName||'Student')+'</h2><button class="btn ghost" onclick="student()">← Daily Planner</button></div><div class="tabs">'+
'<button class="tab" onclick="openStudentTab(\'Pieces\')">🎼 REPERTOIRE</button><button class="tab" onclick="openStudentTab(\'Scales\')">🎵 SCALES</button><button class="tab" onclick="openStudentTab(\'Études\')">📚 ÉΤΥΔΕΣ</button><button class="tab" onclick="openStudentTab(\'Technical Studies\')">🧩 TECHNIQUE</button><button class="tab active">🏠 HOMEWORK</button></div><div class="card"><div class="section-head"><h3>📚 CENTRAL HOMEWORK</h3><span class="pill">'+a.length+' selected</span></div><p class="small">Live mirror — Central Homework is the single source of truth.</p>'+
(a.length?a.map(function(x){var k=[x.curriculum||'',x.id||'',x.title||''].join('|').toLowerCase(),info=studyInfo(x);return '<div class="repcard mintbg"><b>🎼 '+esc(x.title||x.name||'Selected item')+'</b><div class="small">'+esc(x.category||'Homework')+(x.curriculum?' · '+esc(x.curriculum):'')+'</div>'+(info.length?'<div class="small" style="margin-top:8px;line-height:1.55"><b>Study requirements:</b> '+esc(info.join(' · '))+'</div>':'')+(x.objective?'<div class="small" style="margin-top:5px"><b>Objective:</b> '+esc(x.objective)+'</div>':'')+(x.mastery?'<div class="small" style="margin-top:5px"><b>Mastery:</b> '+esc(x.mastery)+'</div>':'')+'<div class="mini-actions"><button class="btn danger" data-hw-key="'+esc(k)+'">Delete</button></div></div>'}).join(''):'<div class="empty">No homework for this student yet.</div>')+
'<div style="margin-top:12px"><button class="btn mint" id="studentCentralAddHW">＋ Add Homework</button></div></div>';w.shell(body);
var add=w.document.getElementById('studentCentralAddHW');if(add)add.onclick=function(){var text=w.prompt('Homework:');if(!text||!text.trim())return;if(!c||!c.addHomework)return alert('Central Homework controller unavailable.');c.addHomework({studentId:id,studentName:s.name,level:s.level,term:1,items:[{id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),curriculum:'manual',category:'Homework',title:text.trim(),source:'student-homework'}],source:'student-homework'});render()};
Array.prototype.forEach.call(w.document.querySelectorAll('[data-hw-key]'),function(b){b.onclick=function(){if(!w.confirm('Delete this homework from Central Homework?'))return;var ok=removeQueueItem(id,b.getAttribute('data-hw-key'));if(!ok){w.alert('The homework item could not be deleted. No data was changed.');return}render()}});return true}
function install(){try{var w=getW();if(!w||!w.document||!w.document.body)return false;if(w.document.__centralHomeworkMirrorClickHook)return true;w.document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('.tabs .tab'):null;if(!b)return;var t=String(b.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();if(t!=='🏠 HOMEWORK'&&t!=='HOMEWORK')return;
 var s=findStudentByHeading(w);if(s)w.__centralHomeworkMirrorStudent=s;
 setTimeout(render,0)},false);w.document.__centralHomeworkMirrorClickHook=true;return true}catch(e){return false}}
function boot(){install();setTimeout(install,100);setTimeout(install,500);setTimeout(install,1200)}
frame.addEventListener('load',boot);boot();setInterval(install,1000);
})();
