/* VIOLIN AI Teacher Agenda — Scale Mastery Matrix
 * Teacher-facing data model. Scores are 1–5 per skill, per scale.
 */
(function () {
  'use strict';
  var SKILLS = ['Intonation','Rhythm','Bow control','Tone','Coordination','Shifting','Relaxation','Speed','Articulation','Memory'];
  window.ViolinScaleMastery = {
    skills: SKILLS.slice(),
    blank: function () {
      return SKILLS.reduce(function (out, skill) { out[skill] = null; return out; }, {});
    },
    validateScore: function (value) {
      var n = Number(value);
      return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
    },
    average: function (record) {
      var values = SKILLS.map(function (s) { return Number(record && record[s]); }).filter(function (n) { return Number.isFinite(n); });
      return values.length ? Math.round(values.reduce(function (a,b) { return a+b; }, 0) / values.length * 10) / 10 : null;
    },
    priorities: function (record, threshold) {
      var t = Number.isFinite(Number(threshold)) ? Number(threshold) : 3;
      return SKILLS.filter(function (s) { var n = Number(record && record[s]); return Number.isFinite(n) && n < t; })
        .sort(function (a,b) { return Number(record[a]) - Number(record[b]); });
    }
  };
})();
