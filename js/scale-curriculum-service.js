/* VIOLIN AI Teacher Agenda — Scale Curriculum Service
 * Connects an existing student's Level/Term to the canonical curriculum.
 * Non-invasive: does not mutate the existing student record or localStorage.
 */
(function () {
  'use strict';
  window.ViolinScaleCurriculumService = {
    getForStudent: function (student) {
      if (!student || !window.VIOLIN_SCALE_CURRICULUM_V1) return null;
      var level = Number(student.level);
      var term = Number(student.term || student.currentTerm || student.quarter || 1);
      if (!Number.isInteger(level) || level < 1 || level > 9) return null;
      if (!Number.isInteger(term) || term < 1 || term > 2) term = 1;
      return {
        level: level,
        term: term,
        curriculum: window.VIOLIN_SCALE_CURRICULUM_V1.getTerm(level, term)
      };
    },
    getMastery: function (student, scaleKey) {
      var mastery = student && student.scaleMastery;
      return mastery && mastery[scaleKey] ? mastery[scaleKey] :
        (window.VIOLIN_SCALE_CURRICULUM_V1 ? window.VIOLIN_SCALE_CURRICULUM_V1.createMastery() : null);
    },
    averageMastery: function (mastery) {
      return window.VIOLIN_SCALE_CURRICULUM_V1
        ? window.VIOLIN_SCALE_CURRICULUM_V1.averageMastery(mastery)
        : null;
    }
  };
})();
