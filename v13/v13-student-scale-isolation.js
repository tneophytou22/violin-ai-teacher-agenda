(function(){'use strict';
var root=document.getElementById('app');
function state(){return window.ViolinAI&&window.ViolinAI.State?window.ViolinAI.State:null}
function txt(x){return String(x||'').replace(/\s+/g,' ').trim()}
function currentStudent(d){var S=state(),a=S?S.students.getAll():[];var body=txt(d.body&&d.body.innerText),head=txt(d.querySelector('h1,h2')?.textContent);for(var i=0;i<a.length;i++){var s=a[i],n=txt(s.name||s.studentName),id=s.id??s.studentId;if(n&&body.indexOf(n)>=0)return{id:id,name:n};if(n&&head.indexOf(n)>=0)return{id:id,name:n}}return null}
function sid(s){return s&&s.id!=null?String(s.id):''}
function removeForeignVisuals(d,s){var S=state(),p=S&&S.scales.getCurrentSelection(),id=sid(s);if(!p)return;if(p.studentId!=null&&String(p.studentId)!==id){[...d.querySelectorAll('section,.card,.section')].forEach(function(n){var t=txt(n.innerText);if(/^Selected Scales\b/i.test(t)||/^🎼 Selected Scales\b/i.test(t))n.remove()});S.scales.clearCurrentSelection()}}
function syncStudent(d){var S=state(),s=currentStudent(d);if(!S||!s)return;var id=sid(s);if(!id)return;var p=S.scales.getCurrentSelection();
 if(p&&p.studentId!=null&&String(p.studentId)!==id){if(Array.isArray(p.items))S.scales.setSelected(String(p.studentId),p.items);S.scales.clearCurrentSelection();p=null}
 var saved=S.scales.getSelected(id);
 if(!p&&Array.isArray(saved)&&saved.length)S.scales.setCurrentSelection({studentId:id,items:saved});
 if(p&&String(p.studentId)===id&&Array.isArray(p.items))S.scales.setSelected(id,p.items);
 removeForeignVisuals(d,s);
}
function walk(d){try{if(!d||!d.body)return;syncStudent(d);[...d.querySelectorAll('iframe')].forEach(function(f){try{walk(f.contentDocument)}catch(e){}})}catch(e){}}
function run(){try{walk(root.contentDocument)}catch(e){}}
root&&root.addEventListener('load',function(){setTimeout(run,100);setTimeout(run,500);setTimeout(run,1200)});
setInterval(run,400);run();
})();
