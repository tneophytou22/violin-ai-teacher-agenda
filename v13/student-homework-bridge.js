/*
 * VIOLIN AI V13 — Student Homework Bridge
 *
 * Student HOMEWORK is a live mirror of the Central Homework queue.
 * Central Homework remains the single source of truth.
 * Presentation/navigation only: no second homework storage is created.
 */
(function(){
  'use strict';
  var frame=document.getElementById('app') || document.getElementById('appFrame');
  if(!frame) return;
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]});}
  function studentId(w){return w&&w.state?String(w.state.sid||''):'';}
  function student(w,id){return w&&w.data&&Array.isArray(w.data.students)?w.data.students.find(function(s){return String(s.id)===String(id)}):null;}
  function controller(w){return w&&w.VIOLIN_AI_CURRICULUM&&w.VIOLIN_AI_CURRICULUM.controller;}
  function queue(w,id){
    try{var C=controller(w);var q=C&&C.getHomework&&C.getHomework(id);if(q&&Array.isArray(q.items))return q.items;}catch(e){}
    try{var db=JSON.parse(w.localStorage.getItem('VIOLIN_AI_HOMEWORK_QUEUE_V1')||'{}');return db&&db[String(id)]&&Array.isArray(db[String(id)].items)?db[String(id)].items:[];}catch(e){return []}
  }
  function meta(x){var r=x&&x.requirements||{},a=[];if(x&&x.curriculum)a.push(x.curriculum);if(x&&x.category)a.push(x.category);if(r.positions)a.push('Positions: '+r.positions);if(r.octaves)a.push('Octaves: '+r.octaves);if(r.bowing)a.push('Bowing: '+(Array.isArray(r.bowing)?r.bowing.join(' · '):r.bowing));if(r.articulation)a.push('Articulation: '+(Array.isArray(r.articulation)?r.articulation.join(' · '):r.articulation));if(r.tempo)a.push('Tempo: '+r.tempo);return a.join(' · ');}
  function renderHomeworkTab(w){
    var id=studentId(w),s=student(w,id),items=queue(w,id);if(!s||!id)return false;
    var body='<div class="title"><h2>🏠 HOMEWORK · '+esc(s.name)+'</h2><button class="btn ghost" onclick="student()">← Daily Planner</button></div>'+\
      '<div class="tabs"><button class="tab" onclick="openStudentTab(\'Pieces\')">🎼 REPERTOIRE</button><button class="tab" onclick="openStudentTab(\'Scales\')">🎵 SCALES</button><button class="tab" onclick="openStudentTab(\'Études\')">📚 ÉTUDES</button><button class="tab" onclick="openStudentTab(\'Technical Studies\')">🧩 TECHNIQUE</button><button class="tab active">🏠 HOMEWORK</button></div>'+\
      '<div class="card"><div class="section-head"><h3>📚 SELECTED FOR HOMEWORK</h3><span class="pill">'+items.length+' selected</span></div><p class="small">Αυτά είναι τα ίδια αντικείμενα που βρίσκονται στο Central Homework για αυτόν τον μαθητή.</p>'+\
      (items.length?items.map(function(x){return '<div class="repcard mintbg"><b>🎼 '+esc(x.title||x.name||'Selected item')+'</b><div class="small">'+esc(meta(x))+'</div></div>';}).join(''):'<div class="empty">Δεν έχεις επιλέξει ακόμη κάτι για homework από το Curriculum.</div>')+\
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn purple" id="studentHwDesigner">✨ Open Homework Designer</button><button class="btn ghost" onclick="openStudentTab(\'Scales\')">🎵 Add / Manage Scales</button></div></div>';
    w.shell(body);var b=w.document.getElementById('studentHwDesigner');if(b)b.onclick=function(){frame.src='./homework-v13.html?studentId='+encodeURIComponent(id)+'&v=student-homework-mirror'};return true;
  }
  function install(){try{var w=frame.contentWindow,doc=w&&w.document;if(!w||!doc||!doc.body)return;if(doc.__studentHomeworkBridgeInstalled)return;doc.__studentHomeworkBridgeInstalled=true;
    if(typeof w.openStudentTab==='function' && !w.__studentHomeworkOpenTabHook){
      var originalOpenStudentTab=w.openStudentTab;
      w.openStudentTab=function(tab){
        if(String(tab)==='Homework'){
          w.state.studentTab='Homework';w.state.page='studentTab';return renderHomeworkTab(w);
        }
        return originalOpenStudentTab.apply(w,arguments);
      };
      w.__studentHomeworkOpenTabHook=true;
    }
    doc.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('button'):null;if(!el)return;var t=clean(el.textContent).toUpperCase();if(t!=='🏠 HOMEWORK'&&t!=='HOMEWORK')return;if(!el.closest('.tabs'))return;if(w.state&&w.state.sid){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();renderHomeworkTab(w);}},true);
  }catch(e){}}
  frame.addEventListener('load',function(){setTimeout(install,50);setTimeout(install,250);setTimeout(install,700)});setInterval(install,1000);
})();

(function(){
  'use strict';
  var frame=document.getElementById('app') || document.getElementById('appFrame');
  if(!frame)return;
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]});}
  function hook(){
    try{
      var w=frame.contentWindow;
      if(!w||typeof w.openStudentTab!=='function')return;
      if(w.__studentHomeworkOpenTabHook)return;
      var original=w.openStudentTab;
      w.openStudentTab=function(tab){
        if(String(tab)==='Homework'){
          w.state.studentTab='Homework';w.state.page='studentTab';
          var C=window.VIOLIN_AI_CURRICULUM&&window.VIOLIN_AI_CURRICULUM.controller;
          var id=String(w.state.sid||''),rec=C&&C.getHomework?C.getHomework(id):null,items=rec&&Array.isArray(rec.items)?rec.items:[];
          var s=w.data&&w.data.students&&w.data.students.find(function(x){return String(x.id)===id});if(!s)return;
          var body='<div class="title"><h2>🏠 HOMEWORK · '+esc(s.name)+'</h2><button class="btn ghost" onclick="student()">← Daily Planner</button></div>'+
            '<div class="tabs"><button class="tab" onclick="openStudentTab(\'Pieces\')">🎼 REPERTOIRE</button><button class="tab" onclick="openStudentTab(\'Scales\')">🎵 SCALES</button><button class="tab" onclick="openStudentTab(\'Études\')">📚 ÉTUDΕΣ</button><button class="tab" onclick="openStudentTab(\'Technical Studies\')">🧩 TECHNIQUE</button><button class="tab active">🏠 HOMEWORK</button></div>'+
            '<div class="card"><div class="section-head"><h3>📚 CENTRAL HOMEWORK</h3><span class="pill">'+items.length+' selected</span></div><p class="small">Live mirror of Central Homework — no separate homework list is used here.</p>'+
            (items.length?items.map(function(x){var key=[x.curriculum||'',x.id||'',x.title||''].join('|').toLowerCase();return '<div class="repcard mintbg"><b>🎼 '+esc(x.title||x.name||'Selected item')+'</b><div class="small">'+esc(x.category||'Homework')+(x.curriculum?' · '+esc(x.curriculum):'')+'</div><div class="mini-actions"><button class="btn danger" data-hw-key="'+esc(key)+'">Delete</button></div></div>';}).join(''):'<div class="empty">No homework for this student yet.</div>')+
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn mint" id="studentCentralAddHW">＋ Add Homework</button></div></div>';
          w.shell(body);
          var add=w.document.getElementById('studentCentralAddHW');
          if(add)add.onclick=function(){var text=w.prompt('Homework:');if(!text||!text.trim())return;var controller=window.VIOLIN_AI_CURRICULUM&&window.VIOLIN_AI_CURRICULUM.controller;if(!controller||!controller.addHomework)return alert('Central Homework controller is unavailable.');controller.addHomework({studentId:id,studentName:s.name,level:s.level,term:1,items:[{id:(window.crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now())),curriculum:'manual',category:'Homework',title:text.trim(),source:'student-homework'}],source:'student-homework'});w.openStudentTab('Homework');};
          Array.from(w.document.querySelectorAll('[data-hw-key]')).forEach(function(btn){btn.onclick=function(){var controller=window.VIOLIN_AI_CURRICULUM&&window.VIOLIN_AI_CURRICULUM.controller;if(!controller||!controller.removeHomework)return alert('Central Homework controller is unavailable.');if(!w.confirm('Delete this homework from Central Homework?'))return;controller.removeHomework(id,btn.getAttribute('data-hw-key'));w.openStudentTab('Homework');};});
          return true;
        }
        return original.apply(w,arguments);
      };
      w.__studentHomeworkOpenTabHook=true;
    }catch(e){}
  }
  frame.addEventListener('load',function(){setTimeout(hook,0);setTimeout(hook,100);setTimeout(hook,500)});setInterval(hook,500);
})();

/* Final resilient override: replace the existing hook when it was installed before this file's latest layer. */
(function(){
  'use strict';
  var frame=document.getElementById('app') || document.getElementById('appFrame');if(!frame)return;
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]});}
  function apply(){try{var w=frame.contentWindow;if(!w||typeof w.openStudentTab!=='function'||w.__studentHomeworkFinalHook)return;var prior=w.openStudentTab;w.openStudentTab=function(tab){if(String(tab)!=='Homework')return prior.apply(w,arguments);var C=window.VIOLIN_AI_CURRICULUM&&window.VIOLIN_AI_CURRICULUM.controller,id=String(w.state.sid||''),rec=C&&C.getHomework?C.getHomework(id):null,items=rec&&Array.isArray(rec.items)?rec.items:[],s=w.data.students.find(function(x){return String(x.id)===id});if(!s)return;var key=function(x){return [x.curriculum||'',x.id||'',x.title||''].join('|').toLowerCase()};var body='<div class="title"><h2>🏠 HOMEWORK · '+esc(s.name)+'</h2><button class="btn ghost" onclick="student()">← Daily Planner</button></div><div class="tabs"><button class="tab" onclick="openStudentTab(\'Pieces\')">🎼 REPERTOIRE</button><button class="tab" onclick="openStudentTab(\'Scales\')">🎵 SCALES</button><button class="tab" onclick="openStudentTab(\'Études\')">📚 ÉTUDΕΣ</button><button class="tab" onclick="openStudentTab(\'Technical Studies\')">🧩 TECHNIQUE</button><button class="tab active">🏠 HOMEWORK</button></div><div class="card"><div class="section-head"><h3>📚 CENTRAL HOMEWORK</h3><span class="pill">'+items.length+' selected</span></div><p class="small">Live mirror — Central Homework is the single source of truth.</p>'+(items.length?items.map(function(x){return '<div class="repcard mintbg"><b>🎼 '+esc(x.title||x.name||'Selected item')+'</b><div class="small">'+esc(x.category||'Homework')+(x.curriculum?' · '+esc(x.curriculum):'')+'</div><div class="mini-actions"><button class="btn danger" data-hw-key="'+esc(key(x))+'">Delete</button></div></div>';}).join(''):'<div class="empty">No homework for this student yet.</div>')+'<div style="margin-top:12px"><button class="btn mint" id="studentCentralAddHW">＋ Add Homework</button></div></div>';w.shell(body);var add=w.document.getElementById('studentCentralAddHW');if(add)add.onclick=function(){var text=w.prompt('Homework:');if(!text||!text.trim())return;if(!C||!C.addHomework)return alert('Central Homework controller is unavailable.');C.addHomework({studentId:id,studentName:s.name,level:s.level,term:1,items:[{id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),curriculum:'manual',category:'Homework',title:text.trim(),source:'student-homework'}],source:'student-homework'});w.openStudentTab('Homework');};Array.from(w.document.querySelectorAll('[data-hw-key]')).forEach(function(btn){btn.onclick=function(){if(!C||!C.removeHomework)return;if(!w.confirm('Delete this homework from Central Homework?'))return;C.removeHomework(id,btn.getAttribute('data-hw-key'));w.openStudentTab('Homework');};});return true;};w.__studentHomeworkFinalHook=true;}catch(e){}}
  frame.addEventListener('load',function(){setTimeout(apply,50);setTimeout(apply,300);setTimeout(apply,1000)});setInterval(apply,1000);
})();
