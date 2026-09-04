/* Integration test marker — no UI mutation. */
(function(){
  'use strict';
  window.VIOLIN_AI_INTEGRATION_TEST = {
    modulesExpected: [
      'VIOLIN_SCALE_CURRICULUM_V1',
      'ViolinScaleCurriculumService',
      'ViolinScaleMastery',
      'ViolinScaleCurriculumPanel'
    ],
    status: function(){
      return this.modulesExpected.map(function(name){ return {name:name, loaded: !!window[name]}; });
    }
  };
})();
