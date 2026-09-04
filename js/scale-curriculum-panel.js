/* VIOLIN AI Teacher Agenda — Scale Curriculum Panel model
 * UI-independent presentation adapter. Safe to integrate after review.
 */
(function () {
  'use strict';
  window.ViolinScaleCurriculumPanel = {
    build: function (student) {
      var link = window.ViolinScaleCurriculumService && window.ViolinScaleCurriculumService.getForStudent(student);
      if (!link || !link.curriculum) return null;
      var c = link.curriculum;
      return {
        title: 'Scale & Arpeggio Curriculum',
        level: link.level,
        term: link.term,
        curriculum: c,
        sections: [
          ['Major Scales', c.major], ['Minor Scales', c.minor],
          ['Arpeggios', c.arpeggios], ['Dominant 7th', c.dominant7],
          ['Diminished 7th', c.diminished7], ['Chromatic Scales', c.chromatic],
          ['Double Stops', c.doubleStops], ['Scales on One String', c.oneString],
          ['Positions', c.positions], ['Bowing & Articulation', [c.bowing, c.articulation]],
          ['Rhythm & Accents', [c.rhythm, c.patterns, c.accents]], ['Dynamics', c.dynamics],
          ['Target Tempo', c.tempo], ['Technical Objective', c.objective]
        ].filter(function (item) { return item[1] != null; })
      };
    }
  };
})();
