/* VIOLIN AI Teacher Agenda — safe module loader
 * Loads optional modular components without replacing the legacy V12 UI.
 * The loader is inert until explicitly called by a future integration build.
 */
(function () {
  'use strict';
  window.ViolinModuleLoader = {
    version: '1.0',
    modules: [
      'curriculum/scale-arpeggio-v1.js',
      'js/scale-curriculum-service.js',
      'js/scale-mastery.js',
      'js/scale-curriculum-panel.js'
    ],
    load: function (done) {
      var list = this.modules.slice(), i = 0;
      function next() {
        if (i >= list.length) { if (done) done(true); return; }
        var s = document.createElement('script');
        s.src = list[i++];
        s.onload = next;
        s.onerror = function () { if (done) done(false, s.src); };
        document.head.appendChild(s);
      }
      next();
    }
  };
})();
