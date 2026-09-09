(function(w){'use strict';
var C=w.VIOLIN_AI_CURRICULUM||{},DATA=w.VIOLIN_ETUDES_CURRICULUM_V1;
if(C.register&&C.normalize&&DATA){
function get(level,term){return typeof DATA.getTerm==='function'?DATA.getTerm(level,term):DATA.levels?.[level]?.terms?.[term]||null}
function list(level,term){var c=get(level,term),a=c&&Array.isArray(c.etudes)?c.etudes:[];return a.map(function(x,i){return C.normalize({id:x.id||('etude-'+level+'-'+term+'-'+i),curriculum:'etudes',category:'Études',title:(x.composer||'')+(x.opus?' '+x.opus:'')+' No.'+x.number,level:level,term:term,requirements:{primaryTechnique:x.primaryTechnique,technicalRequirementsCovered:x.technicalRequirementsCovered,prerequisites:x.prerequisites},objective:x.masteryObjective,mastery:x.masteryObjective,source:'etudes-curriculum-data.js',etude:x},{level:level,term:term,source:'etudes-curriculum-data.js'})})}
C.register('etudes',{version:'1.0',get:get,list:list,normalize:function(item,meta){return C.normalize(item,meta||{})}});
}

/* V13 compatibility: the V10 student app keeps `state` lexical, so the parent
   bridge cannot read frame.contentWindow.state. We add only an invisible exact
   student-name marker to the existing Études H1. No Scales state or curriculum
   is modified. The existing student bridge then resolves the correct student. */
function installStudentContextFix(){
var frame=document.getElementById('app')||document.getElementById('appFrame');
if(!frame||frame.__v13EtudesContextFix)return;
frame.__v13EtudesContextFix=true;
function students(){try{var d=JSON.parse(localStorage.getItem('VIOLIN_AI_AGENDA_V10')||'{}');return Array.isArray(d.students)?d.students:[]}catch(e){return[]}}
function nameOf(s){return s&&String(s.name||s.studentName||'').trim()}
function patch(){try{
var doc=frame.contentDocument;if(!doc||!doc.body)return;
var h1=doc.querySelector('h1');if(!h1)return;
var title=(h1.textContent||'').toUpperCase();if(title.indexOf('ÉTUDES')<0&&title.indexOf('ETUDES')<0)return;
var bodyText=(doc.body.textContent||'').toLowerCase(),found=null,best=-1;
students().forEach(function(s){var n=nameOf(s),q=n.toLowerCase();if(q&&bodyText.indexOf(q)>=0&&q.length>best){found=s;best=q.length}});
if(!found)return;
var marker=h1.querySelector('[data-v13-etudes-student-context]');
if(!marker){marker=doc.createElement('span');marker.setAttribute('data-v13-etudes-student-context','1');marker.style.display='none';h1.appendChild(marker)}
marker.textContent=' '+nameOf(found);
}catch(e){console.warn('V13 Etudes context fix',e)}}
function observe(){patch();try{var doc=frame.contentDocument;if(!doc||!doc.body)return;if(frame.__v13EtudesObserver)frame.__v13EtudesObserver.disconnect();var timer;frame.__v13EtudesObserver=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(patch,80)});frame.__v13EtudesObserver.observe(doc.body,{childList:true,subtree:true})}catch(e){}}
frame.addEventListener('load',function(){setTimeout(observe,50);setTimeout(observe,400);setTimeout(observe,1000)});setTimeout(observe,250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installStudentContextFix,{once:true});else installStudentContextFix();
})(window);
