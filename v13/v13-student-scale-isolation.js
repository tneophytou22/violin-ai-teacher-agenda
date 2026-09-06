(function(){'use strict';
var root=document.getElementById('app');
var KEY='VIOLIN_AI_CURRENT_SELECTION_V1';
var PREFIX='VIOLIN_AI_SCALE_SELECTION_STUDENT_V1_';
function txt(x){return String(x||'').replace(/\s+/g,' ').trim()}
function agenda(){try{var x=JSON.parse(localStorage.getItem('VIOLIN_AI_AGENDA_V10')||'{}');return Array.isArray(x.students)?x.students:[]}catch(e){return[]}}
function currentStudent(d){var a=agenda(),body=txt(d.body&&d.body.innerText),head=txt(d.querySelector('h1,h2')?.textContent);for(var i=0;i<a.length;i++){var s=a[i],n=txt(s.name||s.studentName),id=s.id??s.studentId;if(n&&body.indexOf(n)>=0)return {id:id,name:n};if(n&&head.indexOf(n)>=0)return {id:id,name:n}}return null}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function write(key,p){try{localStorage.setItem(key,JSON.stringify(p))}catch(e){}}
function sid(s){return s&&s.id!=null?String(s.id):''}
function removeForeignVisuals(d,s){var p=read(KEY),id=sid(s);if(!p)return;if(p.studentId!=null&&String(p.studentId)!==id){
  [...d.querySelectorAll('section,.card,.section')].forEach(function(n){var t=txt(n.innerText);if(/^Selected Scales\b/i.test(t)||/^🎼 Selected Scales\b/i.test(t))n.remove()});
  localStorage.removeItem(KEY);
}}
function syncStudent(d){var s=currentStudent(d);if(!s)return;var id=sid(s);if(!id)return;var p=read(KEY);
 if(p&&p.studentId!=null&&String(p.studentId)!==id){write(PREFIX+String(p.studentId),p);localStorage.removeItem(KEY);p=null}
 var saved=read(PREFIX+id);
 if(!p&&saved&&saved.studentId!=null&&String(saved.studentId)===id)write(KEY,saved);
 if(p&&String(p.studentId)===id)write(PREFIX+id,p);
 removeForeignVisuals(d,s);
}
function walk(d){try{if(!d||!d.body)return;syncStudent(d);[...d.querySelectorAll('iframe')].forEach(function(f){try{walk(f.contentDocument)}catch(e){}})}catch(e){}}
function run(){try{walk(root.contentDocument)}catch(e){}}
root&&root.addEventListener('load',function(){setTimeout(run,100);setTimeout(run,500);setTimeout(run,1200)});
setInterval(run,400);run();
})();