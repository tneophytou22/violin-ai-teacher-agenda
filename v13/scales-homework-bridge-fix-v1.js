/* V13 SCALES -> CENTRAL HOMEWORK FIX
   Keeps the existing Scales UI intact. Mirrors the legacy homework handoff
   into the central per-student homework queue used by Student/Homework. */
(function(){
  'use strict';
  var frame=document.getElementById('app');
  if(!frame)return;
  var KEY='VIOLIN_AI_HOMEWORK_SELECTION_V1';
  function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
  function controller(){return window.VIOLIN_AI_CURRICULUM&&window.VIOLIN_AI_CURRICULUM.controller}
  function install(){
    try{
      var d=frame.contentDocument;
      if(!d||!d.body)return false;
      var b=d.querySelector('#v13-curriculum-scales [data-a="homework"]');
      if(!b)return false;
      if(b.__centralHomeworkFix)return true;
      b.__centralHomeworkFix=true;
      b.addEventListener('click',function(){
        setTimeout(function(){
          var p=read(KEY),c=controller();
          if(!p||!p.studentId||!Array.isArray(p.items)||!p.items.length||!c||!c.addHomework)return;
          var rec=c.addHomework({
            studentId:String(p.studentId),
            studentName:p.studentName||'Student',
            level:p.level||1,
            term:p.term||1,
            items:p.items,
            source:'Scales Curriculum'
          });
          if(!rec||!Array.isArray(rec.items))console.warn('[V13 Scales Homework] Central queue write failed');
        },0);
      },false);
      return true;
    }catch(e){console.warn('[V13 Scales Homework]',e);return false}
  }
  function boot(){install();setTimeout(install,100);setTimeout(install,500);setTimeout(install,1200)}
  frame.addEventListener('load',boot);
  boot();
  try{
    var obs=new MutationObserver(function(){install()});
    var d=frame.contentDocument;
    if(d&&d.body)obs.observe(d.body,{childList:true,subtree:true});
    frame.addEventListener('load',function(){try{var x=frame.contentDocument;if(x&&x.body)obs.observe(x.body,{childList:true,subtree:true})}catch(e){}});
  }catch(e){}
})();
