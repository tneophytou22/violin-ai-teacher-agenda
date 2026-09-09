/* V13 ETUDES STUDENT BRIDGE v4 — independent from SCALES
   Reads ETUDES curriculum from the parent V13 master context, because the
   Student UI is rendered inside #app iframe. No Scales data/path is used.
*/
(function(){
'use strict';
var frame=document.getElementById('app');
if(!frame)return;
var STORE='VIOLIN_AI_CURRICULUM_SELECTION_V2';
var HOME='VIOLIN_AI_HOMEWORK_QUEUE_V1';
var ACTIVE='VIOLIN_AI_LESSON_ACTIVE_V13';
var PREFIX='VIOLIN_AI_ETUDE_SELECTION_STUDENT_V1_';
var bound=null,observer=null,lastKey='';
function read(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function text(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c]})}
function students(){var x=read('VIOLIN_AI_AGENDA_V10',{});return Array.isArray(x.students)?x.students:Array.isArray(x)?x:[]}
function sid(s){return String(s&&(s.id??s.studentId??s.uid)||'')}
function byId(id){return students().find(function(s){return sid(s)===String(id)})||null}
function levelOf(s){var v=s&&(s.level??s.Level??s.currentLevel??s.grade??1),m=String(v).match(/\d+/);return m?+m[0]:1}
function termOf(s){var v=s&&(s.term??s.Term??s.currentTerm??1),m=String(v).match(/[12]/);return m?+m[0]:1}
function studentName(s){return text(s&&(s.name||s.studentName)||'Student')}
function doc(){try{return frame.contentDocument||frame.contentWindow.document}catch(e){return null}}
function currentStudent(d){
 var id=null;
 try{var u=new URL(frame.contentWindow.location.href);id=u.searchParams.get('studentId')||u.searchParams.get('sid')}catch(e){}
 if(id){var a=byId(id);if(a)return a}
 try{var st=frame.contentWindow.state;if(st&&st.sid){var b=byId(st.sid);if(b)return b}}catch(e){}
 ['VIOLIN_AI_ACTIVE_STUDENT_ID','VIOLIN_AI_STUDENT_ID'].some(function(k){var v=localStorage.getItem(k);if(v){var s=byId(String(v).replace(/^\"|\"$/g,''));if(s){id=sid(s);return true}}return false});
 if(id){var c=byId(id);if(c)return c}
 var els=d.querySelectorAll('h1,h2,h3,h4,.title,.page-title,.student-title,[class*="title"]');
 for(var i=0;i<els.length;i++){var raw=text(els[i].textContent),m=raw.match(/(?:ÉTUDΕΣ|ÉTUDES|ETUDES)\s*[·•—-]\s*(.+)$/i);if(m){var n=text(m[1]).toLowerCase();var exact=students().find(function(s){return studentName(s).toLowerCase()===n});if(exact)return exact;var part=students().find(function(s){var sn=studentName(s).toLowerCase();return sn&&n&&(sn.indexOf(n)>=0||n.indexOf(sn)>=0)});if(part)return part}}
 return null;
}
function isEtudesPage(d){
 var els=d.querySelectorAll('h1,h2,h3,h4,.title,.page-title,.student-title,[class*="title"]');
 for(var i=0;i<els.length;i++)if(/(?:ÉΤUDΕΣ|ÉTUDES|ETUDES)/i.test(text(els[i].textContent)))return true;
 var tabs=d.querySelectorAll('.tabs .tab.active,.tab.active,button.active');
 for(var j=0;j<tabs.length;j++)if(/(?:ÉΤUDΕΣ|ÉTUDES|ETUDES)/i.test(text(tabs[j].textContent)))return true;
 return false;
}
function itemsFor(s){
 /* IMPORTANT: data is loaded by final-v13-master.html in the PARENT window. */
 var D=window.VIOLIN_ETUDES_CURRICULUM_V1,l=levelOf(s),t=termOf(s);
 var c=D&&D.levels&&D.levels[l]&&D.levels[l].terms&&D.levels[l].terms[t];
 if(!c||!Array.isArray(c.etudes))return [];
 return c.etudes.map(function(x,i){return {id:x.id||('etude-'+l+'-'+t+'-'+i),curriculum:'etudes',category:'Études',title:(x.composer||'')+(x.opus?' '+x.opus:'')+' No.'+x.number,level:l,term:t,requirements:{primaryTechnique:x.primaryTechnique,technicalRequirementsCovered:x.technicalRequirementsCovered,prerequisites:x.prerequisites},objective:x.masteryObjective,mastery:x.masteryObjective,source:'etudes-curriculum-data.js',etude:x}});
}
function ensureCss(d){if(d.getElementById('v13-etude-css-v6'))return;var st=d.createElement('style');st.id='v13-etude-css-v6';st.textContent='.v13-etude-box{display:block!important;visibility:visible!important;margin:12px 0!important;padding:14px!important;border:1px solid #f0d9c8!important;border-radius:16px!important;background:#fffaf6!important;color:#24344c!important;position:relative!important;z-index:20!important}.v13-etude-box h3{margin:0 0 3px;font-size:19px}.v13-etude-sub{font-size:12px;color:#687487;margin-bottom:10px}.v13-etude-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v13-etude-item{display:flex;gap:8px;align-items:flex-start;background:#fff;border:1px solid #eadfd6;border-radius:10px;padding:10px}.v13-etude-item input{width:18px;height:18px;margin-top:2px}.v13-etude-item b{font-size:13px}.v13-etude-item small{display:block;color:#687487;margin-top:3px}.v13-etude-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v13-etude-actions button{border:0;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.v13-etude-actions button:first-child{background:#24344c;color:#fff}.v13-etude-actions button:last-child{background:#64c6a3;color:#12372c}@media(max-width:650px){.v13-etude-grid{grid-template-columns:1fr}}';d.head.appendChild(st)}
function remove(d){var x=d.getElementById('v13-curriculum-etudes');if(x)x.remove();lastKey=''}
function save(s,items,kind){
 var id=sid(s);if(!id||!items.length)return null;
 var p={studentId:id,studentName:studentName(s),level:levelOf(s),term:termOf(s),kind:kind,curriculum:'etudes',items:items,updatedAt:new Date().toISOString(),source:'V13 Etudes Bridge v6'};
 var db=read(STORE,{}),entry=db[id]&&typeof db[id]==='object'?db[id]:{};entry.lesson=entry.lesson&&typeof entry.lesson==='object'?entry.lesson:{};entry.homework=entry.homework&&typeof entry.homework==='object'?entry.homework:{};entry[kind].etudes=p;db[id]=entry;
 if(!write(STORE,db))return null;
 if(kind==='homework'){var h=read(HOME,{}),old=h[id]&&typeof h[id]==='object'?h[id]:{},all=(Array.isArray(old.items)?old.items:[]).concat(items),seen={};old.items=all.filter(function(x){var k=(x.curriculum||'')+'|'+(x.id||'')+'|'+(x.title||'');if(seen[k])return false;seen[k]=1;return true});old.studentId=id;old.studentName=p.studentName;old.level=p.level;old.term=p.term;h[id]=old;if(!write(HOME,h))return null}else if(!write(ACTIVE,Object.assign({},p,{version:6})))return null;
 if(!write(PREFIX+id,items))return null;
 return p;
}
function render(d){
 if(!isEtudesPage(d)){remove(d);return}
 var s=currentStudent(d);if(!s){remove(d);return}
 var it=itemsFor(s);if(!it.length){remove(d);return}
 var key=sid(s)+'|'+levelOf(s)+'|'+termOf(s),host=d.getElementById('v13-curriculum-etudes');
 if(host&&lastKey===key)return;
 if(!host){host=d.createElement('section');host.id='v13-curriculum-etudes';var tabs=d.querySelector('.tabs');if(tabs)tabs.insertAdjacentElement('afterend',host);else{var h=d.querySelector('h1,h2,.title');(h&&h.parentElement||d.body).appendChild(host)}}
 lastKey=key;ensureCss(d);
 var prior=read(PREFIX+sid(s),[]),priorIds=new Set((Array.isArray(prior)?prior:[]).map(function(x){return String(x.id)}));
 var h='<div class="v13-etude-box"><h3>📚 Curriculum Études</h3><div class="v13-etude-sub">Level '+levelOf(s)+' · Term '+termOf(s)+' · 5 exact numbered studies</div><div class="v13-etude-grid">';
 it.forEach(function(x,i){h+='<label class="v13-etude-item"><input type="checkbox" data-i="'+i+'"'+(priorIds.has(String(x.id))?' checked':'')+'><span><b>'+esc(x.title)+'</b><small>No.'+esc(x.etude.number)+' · '+esc(x.requirements.primaryTechnique||'')+'</small></span></label>'});
 h+='</div><div class="v13-etude-actions"><button type="button" data-a="lesson">🎓 Add selected to Lesson</button><button type="button" data-a="homework">🏠 Add selected to Homework</button></div></div>';host.innerHTML=h;
 function chosen(){return it.filter(function(x,i){var q=host.querySelector('[data-i="'+i+'"]');return q&&q.checked})}
 host.querySelector('[data-a="lesson"]').onclick=function(){var x=chosen();if(!x.length)return alert('Select at least one étude.');var p=save(s,x,'lesson');if(!p)return alert('Could not save the Études selection.');var u=new URL('./lesson-v13.html',window.location.href);u.searchParams.set('studentId',p.studentId);u.searchParams.set('v','etudes-to-lesson-v6-'+Date.now());window.top.location.assign(u.href)};
 host.querySelector('[data-a="homework"]').onclick=function(){var x=chosen();if(!x.length)return alert('Select at least one étude.');var p=save(s,x,'homework');if(!p)return alert('Could not save the Études Homework selection.');alert('Selected études added to Homework.')};
}
function sync(){var d=doc();if(d&&d.body)try{render(d)}catch(e){console.error('[V13 Etudes v6]',e)}}
function bind(){var d=doc();if(!d||!d.body||bound===d)return;bound=d;if(observer)observer.disconnect();observer=new MutationObserver(function(){clearTimeout(sync._t);sync._t=setTimeout(sync,80)});observer.observe(d.body,{childList:true,subtree:true});sync()}
frame.addEventListener('load',function(){bound=null;lastKey='';setTimeout(bind,0);setTimeout(bind,150);setTimeout(bind,500);setTimeout(bind,1200)});
setTimeout(bind,100);setTimeout(bind,500);setTimeout(bind,1200);
window.VIOLIN_AI_ETUDES_BRIDGE={version:'6.0',sync:bind};
})();
