/*
 * Violin AI V13 — Navigation Core
 *
 * Extracted from v13-master-fixes.js.
 * Scope: Lesson → Student navigation only.
 * No scale, curriculum, lesson rendering, or storage ownership.
 */
(function(){
  'use strict';
  window.ViolinAI = window.ViolinAI || {};
  var Navigation = {};

  function txt(x){ return String(x || '').replace(/\s+/g,' ').trim(); }
  function norm(x){ return txt(x).toLowerCase(); }

  function findStudent(doc, id, name){
    var els = Array.prototype.slice.call(doc.querySelectorAll('button,[role="button"],a,.card,.student,.level'));
    var sid = id == null ? '' : String(id);
    var nn = norm(name);

    var exact = els.find(function(el){
      var a = el.getAttribute && el.getAttribute('data-student-id');
      return sid && a && String(a) === sid;
    });
    if(exact) return exact;

    var byName = els.find(function(el){
      var t = norm(el.textContent);
      return nn && t === nn;
    });
    if(byName) return byName;

    return els.find(function(el){
      var t = norm(el.textContent);
      return nn && t.indexOf(nn) >= 0;
    }) || null;
  }

  function activateStudent(doc, id, name){
    var el = findStudent(doc, id, name);
    if(!el) return false;
    var target = el.closest && el.closest('button,[role="button"],a');
    try {
      (target || el).click();
      return true;
    } catch(e) {
      try {
        (target || el).dispatchEvent(new MouseEvent('click', {
          bubbles:true,
          cancelable:true,
          view:doc.defaultView
        }));
        return true;
      } catch(x) {
        return false;
      }
    }
  }

  Navigation.activateStudent = activateStudent;
  Navigation.findStudent = findStudent;
  Navigation.handleBack = function(root, id, name){
    if(!root) return false;
    var fd = root.contentDocument;
    if(!fd) return false;
    var frame = fd.getElementById('app');
    if(!frame) return false;

    var url = '../index.html?v=v13-back-' + Date.now();
    frame.src = url;
    frame.addEventListener('load', function(){
      var idoc = frame.contentDocument;
      if(!idoc) return;
      var tries = 0;
      function attempt(){
        tries++;
        if(activateStudent(idoc,id,name)) return;
        if(tries === 1){
          var nav = Array.prototype.slice.call(idoc.querySelectorAll('.nav button,.nav a,button')).find(function(x){
            var t = norm(x.textContent);
            return t === 'students' || t.indexOf('students') >= 0;
          });
          if(nav) try { nav.click(); } catch(e) {}
        }
        if(tries < 12) setTimeout(attempt,180);
      }
      setTimeout(attempt,250);
    }, {once:true});
    return true;
  };

  window.ViolinAI.Navigation = Navigation;
})();
