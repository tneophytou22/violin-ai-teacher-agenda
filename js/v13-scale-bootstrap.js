/* V13 Scale Curriculum bootstrap
 * Loads the student-scale modules and exposes a single safe initializer.
 */
(function(){'use strict';
  var files=[
    'js/student-scale-module.js',
    'js/student-scale-panel.js',
    'js/student-scale-integration.js',
    'js/v13-student-scale-hook.js'
  ];
  window.ViolinV13ScaleBootstrap={
    version:'1.0',
    ready:false,
    init:function(done){
      if(this.ready){if(done)done(true);return;}
      var i=0,self=this;
      function next(){
        if(i>=files.length){self.ready=true;if(window.ViolinV13StudentScaleHook)window.ViolinV13StudentScaleHook.attach(document);if(done)done(true);return;}
        var s=document.createElement('script');s.src=files[i++];s.onload=next;s.onerror=function(){if(done)done(false,s.src);};document.head.appendChild(s);
      }
      next();
    }
  };
})();
