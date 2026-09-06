(function(w){'use strict';
  var C=w.VIOLIN_AI_CURRICULUM||{};
  if(!C.register||!C.normalize)return;
  var DATA=w.VIOLIN_SCALE_CURRICULUM_V1;
  function get(level,term){
    if(!DATA)return null;
    return typeof DATA.getTerm==='function'?DATA.getTerm(level,term):(DATA[level]&&DATA[level][term])||null;
  }
  function list(level,term){
    var c=get(level,term),out=[]; if(!c)return out;
    [['major','Major Scales'],['minor','Minor Scales'],['arpeggios','Tonic Arpeggios'],['dominant7','Dominant 7th'],['diminished7','Diminished 7th'],['chromatic','Chromatic Scales'],['doubleStops','Double Stops'],['oneString','One-String Scales']].forEach(function(f){
      var v=c[f[0]]; (Array.isArray(v)?v:[v]).forEach(function(x){if(x)out.push(C.normalize({id:'scale-'+level+'-'+term+'-'+out.length,curriculum:'scales',category:f[1],title:String(x),level:level,term:term,requirements:{tempo:c.tempo,octaves:c.octaves,bowing:c.bowing,articulation:c.articulation,rhythmicGroups:c.rhythmicGroups,accents:c.accents,dynamics:c.dynamics,positions:c.positions},objective:c.objective,mastery:c.mastery,source:'scale-curriculum-data.js'}))});
    }); return out;
  }
  C.register('scales',{version:'1.0',get:function(level,term){return get(level,term)},list:list,normalize:function(item,meta){return C.normalize(item,meta)},selection:function(item){return C.selection(item,{curriculum:'scales',source:'scale-curriculum-data.js'})}});
})(window);
