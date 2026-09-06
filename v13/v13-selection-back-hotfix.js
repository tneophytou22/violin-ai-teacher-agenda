/* VIOLIN AI V13 — Selection + Back Hotfix
 * Temporary compatibility layer. No curriculum data changes.
 */
(function(){'use strict';
  var root=document.getElementById('app');
  function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function text(x){return String(x==null?'':x).replace(/\s+/g,' ').trim()}
  function installSelection(doc){
    if(!doc||!doc.body||doc.body.dataset.v13SelectionHotfix)return;
    doc.body.dataset.v13SelectionHotfix='1';
    doc.addEventListener('click',function(e){
      var b=e.target&&e.target.closest?e.target.closest('#v13fixaddlesson'):null;
      if(!b)return;
      setTimeout(function(){
        var card=doc.getElementById('v13fixscale');if(!card)return;
        var frame=doc.defaultView&&doc.defaultView.frameElement;
        var studentId=(frame&&frame.getAttribute('data-student-id'))||null;
        var title=doc.querySelector('h1,h2')?.textContent||'';
        var agenda=read('VIOLIN_AI_AGENDA_V10')||{},students=Array.isArray(agenda.students)?agenda.students:[];
        var s=students.find(function(x){return text(title).indexOf(text(x.name||x.studentName))>=0});
        studentId=studentId||(s&&(s.id??s.studentId));
        var items=[...card.querySelectorAll('.v13fixpick')].filter(function(p){return p.querySelector('input')?.checked}).map(function(p){var t=text(p.querySelector('b')?.textContent),c=text(p.querySelector('small')?.textContent)||'Scales';var id='scale:'+c.toLowerCase()+'::'+t.toLowerCase();return {assignmentId:id,scaleId:id,title:t,cat:c,category:c,source:'teacher-selection',selectedAt:new Date().toISOString()}});
        if(!items.length||!studentId)return;
        var p={studentId:studentId,studentName:s&&(s.name||s.studentName),level:s&&(s.level??s.Level??s.currentLevel),term:s&&(s.term??s.Term??s.currentTerm),kind:'lesson',items:items,createdAt:new Date().toISOString()};
        write('VIOLIN_AI_LESSON_SELECTION_V1',p);
        write('VIOLIN_AI_SELECTED_LESSON_V1',p);
        write('VIOLIN_AI_CURRENT_SELECTION_V1',p);
      },20);
    },true);
  }
  function installBack(doc){
    if(!doc||!doc.body||doc.body.dataset.v13BackHotfix)return;
    var b=doc.querySelector('.back');if(!b)return;
    doc.body.dataset.v13BackHotfix='1';
    b.addEventListener('click',function(){
      var p=read('VIOLIN_AI_LESSON_SELECTION_V1')||read('VIOLIN_AI_SELECTED_LESSON_V1')||{};
      try{window.top.postMessage({type:'V13_BACK_STUDENT_HOTFIX',studentId:p.studentId||null,studentName:p.studentName||''},'*')}catch(e){}
    },false);
  }
  function walk(){
    try{
      if(!root||!root.contentDocument)return;
      var d1=root.contentDocument;installSelection(d1);installBack(d1);
      var f1=d1.getElementById('app');
      if(f1&&f1.contentDocument){installSelection(f1.contentDocument);installBack(f1.contentDocument);var f2=f1.contentDocument.querySelector('iframe');if(f2&&f2.contentDocument){installSelection(f2.contentDocument);installBack(f2.contentDocument)}}
    }catch(e){}
  }
  function goStudent(studentId,studentName){
    try{
      var d=root.contentDocument;if(!d)return;
      var frame=d.getElementById('app');if(!frame)return;
      frame.src='../index.html?v=v13-back-hotfix-'+Date.now();
      frame.addEventListener('load',function(){
        var doc=frame.contentDocument;if(!doc)return;
        var tries=0;
        function findStudents(){
          var btn=[...doc.querySelectorAll('.nav button,.nav a,button')].find(function(x){return /^(students|μαθητές)$/i.test(text(x.textContent))||/students/i.test(text(x.textContent))});
          if(btn){try{btn.click()}catch(e){}}
          setTimeout(findStudent,250);
        }
        function findStudent(){
          tries++;
          var els=[...doc.querySelectorAll('[data-student-id],button,a,.card,.student,.level')];
          var el=els.find(function(x){return studentId&&String(x.getAttribute('data-student-id'))===String(studentId)})||els.find(function(x){return studentName&&text(x.textContent).toLowerCase().includes(text(studentName).toLowerCase())});
          if(el){try{(el.closest('button,a')||el).click();return}catch(e){}}
          if(tries<15)setTimeout(findStudent,200);
        }
        setTimeout(findStudents,100);
      },{once:true});
    }catch(e){}
  }
  window.addEventListener('message',function(e){if(e.data&&e.data.type==='V13_BACK_STUDENT_HOTFIX')setTimeout(function(){goStudent(e.data.studentId,e.data.studentName)},350)});
  setInterval(walk,400);walk();
})();
