/* Student Scale Curriculum integration bridge V1
 * Safe delegation helper. It does not alter existing student records.
 */
(function(){'use strict';
window.ViolinStudentScaleIntegration={
 version:'1.0',
 openForStudent:function(student){
   if(!student) return false;
   if(window.ViolinStudentScalePanel&&typeof window.ViolinStudentScalePanel.open==='function'){
     return window.ViolinStudentScalePanel.open(student);
   }
   return false;
 }
};
})();
