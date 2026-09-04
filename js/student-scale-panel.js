/* Student Scale Curriculum Panel V1 */
(function(){'use strict';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
window.ViolinStudentScalePanel={
 open:function(student){
   var root=document.getElementById('violin-student-scale-panel');
   if(!root) return false;
   var ctx=window.ViolinStudentScaleModule&&window.ViolinStudentScaleModule.getContext(student);
   if(!ctx){root.innerHTML='<div class="scale-panel-empty">Curriculum not available for this student.</div>';root.hidden=false;return true;}
   var c=ctx.curriculum||{};
   var html='<div class="scale-panel-header"><div><h2>Scale &amp; Arpeggio Curriculum</h2><div>Level '+esc(ctx.level||'—')+' · Term '+esc(ctx.term)+'</div></div><button type="button" id="violin-scale-panel-close">Close</button></div><div class="scale-panel-body">';
   Object.keys(c).forEach(function(k){var v=c[k];if(v==null||v===''||(Array.isArray(v)&&!v.length))return;html+='<section><h3>'+esc(k)+'</h3><div>'+esc(Array.isArray(v)?v.join(', '):v)+'</div></section>';});
   html+='</div>';root.innerHTML=html;root.hidden=false;
   var close=document.getElementById('violin-scale-panel-close');if(close)close.onclick=function(){root.hidden=true;};
   return true;
 }
};
})();
