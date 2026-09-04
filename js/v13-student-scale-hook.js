/* V13 Student Scale Curriculum UI hook
 * Non-destructive: exposes a delegated click handler and creates its panel lazily.
 */
(function(){'use strict';
  function ensurePanel(){
    var p=document.getElementById('violin-student-scale-panel');
    if(p) return p;
    p=document.createElement('div'); p.id='violin-student-scale-panel'; p.hidden=true;
    p.style.cssText='position:fixed;inset:6%;z-index:99999;background:#fff;border:1px solid #ccc;border-radius:12px;padding:20px;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.25)';
    document.body.appendChild(p); return p;
  }
  window.ViolinV13StudentScaleHook={
    attach:function(root){
      root=root||document;
      if(root.__violinScaleHookAttached) return;
      root.__violinScaleHookAttached=true;
      root.addEventListener('click',function(e){
        var el=e.target.closest&&e.target.closest('[data-student-id],[data-student],[data-student-name]');
        if(!el) return;
        if(!window.ViolinStudentScaleIntegration) return;
        var student=window.violinAgendaGetStudent&&window.violinAgendaGetStudent(el.getAttribute('data-student-id')||el.getAttribute('data-student'));
        if(!student) return;
        e.preventDefault(); e.stopPropagation();
        var panel=ensurePanel();
        window.ViolinStudentScaleIntegration.openForStudent(student);
      },true);
    }
  };
})();
