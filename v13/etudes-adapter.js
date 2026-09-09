(function(w){'use strict';
var C=w.VIOLIN_AI_CURRICULUM||{},DATA=w.VIOLIN_ETUDES_CURRICULUM_V1;
if(!C.register||!C.normalize||!DATA)return;
function get(level,term){return typeof DATA.getTerm==='function'?DATA.getTerm(level,term):DATA.levels?.[level]?.terms?.[term]||null}
function list(level,term){var c=get(level,term),a=c&&Array.isArray(c.etudes)?c.etudes:[];return a.map(function(x,i){return C.normalize({id:x.id||('etude-'+level+'-'+term+'-'+i),curriculum:'etudes',category:'Études',title:(x.composer||'')+(x.opus?' '+x.opus:'')+' No.'+x.number,level:level,term:term,requirements:{primaryTechnique:x.primaryTechnique,technicalRequirementsCovered:x.technicalRequirementsCovered,prerequisites:x.prerequisites},objective:x.masteryObjective,mastery:x.masteryObjective,source:'etudes-curriculum-data.js',etude:x},{level:level,term:term,source:'etudes-curriculum-data.js'})})}
C.register('etudes',{version:'1.0',get:get,list:list,normalize:function(item,meta){return C.normalize(item,meta||{})}});
})(window);
