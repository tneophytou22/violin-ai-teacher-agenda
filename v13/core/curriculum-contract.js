(function(w){'use strict';
  var C=w.VIOLIN_AI_CURRICULUM||{};
  C.VERSION='1.0';
  C.registry=C.registry||{};
  C.register=function(name,adapter){if(!name||typeof adapter!=='object')return;C.registry[name]=adapter};
  C.get=function(name){return C.registry[name]||null};
  C.normalize=function(raw,meta){
    raw=raw||{}; meta=meta||{};
    var req=raw.requirements||raw.requirement||{};
    function pick(a,b){return a!=null?a:b}
    return {
      id:pick(raw.id,meta.id)||null,
      curriculum:pick(raw.curriculum,meta.curriculum)||'unknown',
      category:pick(raw.category,meta.category)||'General',
      title:pick(raw.title,raw.name)||'Untitled',
      level:pick(raw.level,meta.level)||null,
      term:pick(raw.term,meta.term)||null,
      requirements:{
        tempo:pick(raw.tempo,req.tempo),
        octaves:pick(raw.octaves,req.octaves),
        bowing:pick(raw.bowing,req.bowing),
        articulation:pick(raw.articulation,req.articulation),
        rhythmicGroups:pick(raw.rhythmicGroups,pick(raw.rhythm,req.rhythmicGroups)),
        accents:pick(raw.accents,req.accents),
        dynamics:pick(raw.dynamics,req.dynamics),
        positions:pick(raw.positions,req.positions)
      },
      objective:pick(raw.objective,req.objective),
      mastery:pick(raw.mastery,req.mastery),
      source:raw.source||meta.source||'curriculum'
    };
  };
  C.selection=function(item,meta){
    var x=C.normalize(item,meta);
    return {id:x.id||('ci-'+Date.now()),curriculum:x.curriculum,category:x.category,title:x.title,level:x.level,term:x.term,requirements:x.requirements,objective:x.objective,mastery:x.mastery,source:x.source};
  };
  w.VIOLIN_AI_CURRICULUM=C;
})(window);