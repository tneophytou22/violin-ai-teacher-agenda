/* VIOLIN AI Teacher Agenda — Student Scale Module V1
 * Safe, UI-independent student detail component.
 * It reads existing student data but does not mutate it.
 */
(function () {
  'use strict';
  var SKILLS = ['Intonation','Rhythm','Bow control','Tone','Coordination','Shifting','Relaxation','Speed','Articulation','Memory'];

  function normaliseLevel(value) {
    var match = String(value == null ? '' : value).match(/\d+/);
    var n = match ? Number(match[0]) : NaN;
    return n >= 1 && n <= 9 ? n : null;
  }
  function normaliseTerm(value) {
    var match = String(value == null ? '' : value).match(/[12]/);
    return match ? Number(match[0]) : 1;
  }

  window.ViolinStudentScaleModule = {
    version: '1.0',
    getContext: function (student) {
      if (!student) return null;
      var level = normaliseLevel(student.level || student.Level || student.grade);
      var term = normaliseTerm(student.term || student.Term || student.currentTerm);
      var curriculum = window.ViolinScaleCurriculumService && window.ViolinScaleCurriculumService.getForStudent
        ? window.ViolinScaleCurriculumService.getForStudent({level: level, term: term}) : null;
      return { student: student, level: level, term: term, curriculum: curriculum && curriculum.curriculum };
    },
    render: function (container, student) {
      var ctx = this.getContext(student);
      if (!container || !ctx) return false;
      container.innerHTML = '';
      var title = document.createElement('h3');
      title.textContent = 'Scale & Arpeggio Curriculum';
      container.appendChild(title);
      var meta = document.createElement('p');
      meta.textContent = 'Level ' + (ctx.level || '—') + ' · Term ' + ctx.term;
      container.appendChild(meta);
      if (!ctx.curriculum) {
        var empty = document.createElement('p');
        empty.textContent = 'Curriculum not available for this Level / Term.';
        container.appendChild(empty);
        return true;
      }
      var list = document.createElement('div');
      Object.keys(ctx.curriculum).forEach(function (key) {
        var value = ctx.curriculum[key];
        if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
        var row = document.createElement('div');
        row.className = 'scale-curriculum-row';
        var label = document.createElement('strong');
        label.textContent = key;
        row.appendChild(label);
        var text = document.createElement('span');
        text.textContent = ' ' + (Array.isArray(value) ? value.join(', ') : String(value));
        row.appendChild(text);
        list.appendChild(row);
      });
      container.appendChild(list);
      return true;
    },
    skills: SKILLS.slice()
  };
})();
