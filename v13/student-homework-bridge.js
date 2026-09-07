/*
 * VIOLIN AI V13 — Student Homework Bridge
 *
 * The student's HOMEWORK tab must show the same curriculum homework queue
 * used by Homework Center / Homework V13.
 *
 * Presentation/navigation only. No curriculum/homework storage is changed.
 */
(function(){
  'use strict';
  var frame=document.getElementById('app');
  if(!frame) return;

  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]});}
  function studentId(w){return w && w.state ? String(w.state.sid||'') : '';}
  function student(w,id){return w && w.data && Array.isArray(w.data.students) ? w.data.students.find(function(s){return String(s.id)===String(id)}) : null;}
  function queue(w,id){
    try{
      var C=w.VIOLIN_AI_CURRICULUM && w.VIOLIN_AI_CURRICULUM.controller;
      var q=C && C.getHomework && C.getHomework(id);
      if(q && Array.isArray(q.items)) return q.items;
    }catch(e){}
    try{
      var db=JSON.parse(w.localStorage.getItem('VIOLIN_AI_HOMEWORK_QUEUE_V1')||'{}');
      return db && db[String(id)] && Array.isArray(db[String(id)].items) ? db[String(id)].items : [];
    }catch(e){return [];}
  }
  function meta(x){
    var r=x && x.requirements || {}, a=[];
    if(x && x.curriculum) a.push(x.curriculum);
    if(x && x.category) a.push(x.category);
    if(r.positions) a.push('Positions: '+r.positions);
    if(r.octaves) a.push('Octaves: '+r.octaves);
    if(r.bowing) a.push('Bowing: '+(Array.isArray(r.bowing)?r.bowing.join(' · '):r.bowing));
    if(r.articulation) a.push('Articulation: '+(Array.isArray(r.articulation)?r.articulation.join(' · '):r.articulation));
    if(r.tempo) a.push('Tempo: '+r.tempo);
    return a.join(' · ');
  }
  function renderHomeworkTab(w){
    var id=studentId(w), s=student(w,id), items=queue(w,id);
    if(!s || !id) return false;
    var body='<div class="title"><h2>🏠 HOMEWORK · '+esc(s.name)+'</h2><button class="btn ghost" onclick="student()">← Daily Planner</button></div>'+
      '<div class="tabs"><button class="tab" onclick="openStudentTab(\'Pieces\')">🎼 REPERTOIRE</button><button class="tab" onclick="openStudentTab(\'Scales\')">🎵 SCALES</button><button class="tab" onclick="openStudentTab(\'Études\')">📚 ÉTUDES</button><button class="tab" onclick="openStudentTab(\'Technical Studies\')">🧩 TECHNIQUE</button><button class="tab active">🏠 HOMEWORK</button></div>'+
      '<div class="card"><div class="section-head"><h3>📚 SELECTED FOR HOMEWORK</h3><span class="pill">'+items.length+' selected</span></div><p class="small">Αυτά είναι τα αντικείμενα που έχεις επιλέξει από το Curriculum για αυτόν τον μαθητή. Είναι η ίδια λίστα που χρησιμοποιούν το Homework Center και το AI Homework Designer.</p>'+
      (items.length ? items.map(function(x){return '<div class="repcard mintbg"><b>🎼 '+esc(x.title||x.name||'Selected item')+'</b><div class="small">'+esc(meta(x))+'</div></div>';}).join('') : '<div class="empty">Δεν έχεις επιλέξει ακόμη κάτι για homework από το Curriculum.</div>')+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn purple" id="studentHwDesigner">✨ Open Homework Designer</button><button class="btn ghost" onclick="openStudentTab(\'Scales\')">🎵 Add / Manage Scales</button></div></div>';
    w.shell(body);
    var b=w.document.getElementById('studentHwDesigner');
    if(b) b.onclick=function(){ frame.src='./homework-v13.html?studentId='+encodeURIComponent(id)+'&v=student-homework-bridge'; };
    return true;
  }
  function install(){
    try{
      var w=frame.contentWindow, doc=w && w.document;
      if(!w||!doc||!doc.body) return;
      if(doc.__studentHomeworkBridgeInstalled) return;
      doc.__studentHomeworkBridgeInstalled=true;
      doc.addEventListener('click',function(e){
        var el=e.target && e.target.closest ? e.target.closest('button') : null;
        if(!el) return;
        var t=clean(el.textContent).toUpperCase();
        if(t!=='🏠 HOMEWORK' && t!=='HOMEWORK') return;
        /* Only the student's tab strip is intercepted. The top navigation
           HOMEWORK remains owned by the central Homework Router. */
        if(!el.closest('.tabs')) return;
        if(w.state && w.state.sid){
          e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
          renderHomeworkTab(w);
        }
      },true);
    }catch(e){}
  }
  frame.addEventListener('load',function(){setTimeout(install,50);setTimeout(install,250);setTimeout(install,700);});
  setInterval(install,1000);
})();
