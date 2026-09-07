(function(){'use strict';
var root=window;
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
function run(){
 try{
  var f=document.getElementById('app'), d=f&&f.contentDocument, w=f&&f.contentWindow;
  if(!d||!d.body)return;
  var rows=[];
  function row(k,v,ok){rows.push('<div><b>'+esc(k)+'</b>: '+esc(v)+' <strong>'+ (ok?'✓':'✗')+'</strong></div>')}
  row('MASTER', 'loaded', true);
  row('IFRAME', f?f.src:'missing', !!f&&!!d);
  row('SCALES UI', typeof w.VIOLIN_SCALES_UI, typeof w.VIOLIN_SCALES_UI!=='undefined');
  var txt=(d.body.innerText||'').toUpperCase();
  var scaleTab=[].slice.call(d.querySelectorAll('button')).find(function(b){return /^SCALES$/i.test((b.textContent||'').trim())});
  row('SCALES PAGE', !!scaleTab?'tab found':(txt.indexOf('SCALES')>=0?'text found':'not detected'), !!scaleTab||txt.indexOf('SCALES')>=0);
  var a; try{a=JSON.parse(w.localStorage.getItem('VIOLIN_AI_AGENDA_V10')||'{}')}catch(e){a={}}
  var students=Array.isArray(a.students)?a.students:[];
  row('STUDENTS',students.length,students.length>0);
  var headings=(d.querySelector('h1,h2')?.textContent||'').trim();
  var s=students.find(function(x){var n=String(x.name||x.studentName||'').trim();return n&&txt.indexOf(n.toUpperCase())>=0});
  row('STUDENT',s?(s.name||s.studentName):'not detected',!!s);
  var lv=s&&(s.level??s.Level??s.currentLevel??s.grade), tm=s&&(s.term??s.Term??s.currentTerm);
  row('LEVEL',lv==null?'unknown':lv,lv!=null); row('TERM',tm==null?'unknown':tm,tm!=null);
  var data=w.VIOLIN_SCALE_CURRICULUM_V1;
  row('CURRICULUM DATA',typeof data,!!data);
  var c=w.VIOLIN_CURRICULUM_CONTROLLER||w.VIOLIN_CURRICULUM_CONTROLLER_V1||w.VIOLIN_AI_CURRICULUM_CONTROLLER;
  row('CONTROLLER',typeof c,!!c);
  var items=[]; try{if(data&&typeof data.getTerm==='function'&&lv!=null)items=data.getTerm(+lv,+tm)||[]}catch(e){row('getTerm ERROR',e.message,false)}
  row('SCALE ITEMS',Array.isArray(items)?items.length:'non-array',Array.isArray(items)&&items.length>0);
  var host=d.getElementById('violin-curriculum-scales')||d.getElementById('v13-curriculum-scales')||d.querySelector('[data-curriculum="scales"]');
  row('MOUNT HOST',host?'found':'not found',!!host);
  var rendered=d.body.innerText.indexOf('Curriculum Scales')>=0;
  row('RENDER',rendered?'text present':'not present',rendered);
  var box=d.createElement('div');box.id='v13-diagnostic';box.style='position:fixed;right:14px;bottom:14px;z-index:99999;background:#fff;border:2px solid #24344c;border-radius:14px;padding:14px;width:360px;max-width:calc(100vw - 28px);box-shadow:0 10px 35px #0003;font:13px Arial;color:#24344c';box.innerHTML='<b>V13 CURRICULUM DIAGNOSTIC</b>'+rows.join('');(d.body||d.documentElement).appendChild(box);
 }catch(e){console.error('V13 diagnostic',e)}
}
window.addEventListener('load',function(){setTimeout(run,1000)});
setTimeout(run,2500);
})();
