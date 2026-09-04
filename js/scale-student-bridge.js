/* Student ↔ Scale Curriculum bridge — non-invasive foundation for V13.
 * Keeps existing student records untouched and provides helpers for future UI wiring.
 */
window.VIOLIN_SCALE_STUDENT_BRIDGE = {
  getLevel(student) {
    const n = Number(student?.level);
    return Number.isFinite(n) ? Math.max(1, Math.min(9, n)) : null;
  },
  getTerm(student) {
    const n = Number(student?.term || student?.semester || student?.currentTerm);
    return n === 2 ? 2 : 1;
  },
  getCurriculum(student) {
    const level = this.getLevel(student);
    if (!level || !window.VIOLIN_SCALE_CURRICULUM_V1) return null;
    return window.VIOLIN_SCALE_CURRICULUM_V1.getTerm(level, this.getTerm(student));
  },
  ensureMastery(student) {
    if (!student) return null;
    if (!student.scaleMastery) student.scaleMastery = {};
    return student.scaleMastery;
  },
  getScaleMastery(student, scaleName) {
    const mastery = this.ensureMastery(student);
    if (!mastery[scaleName]) {
      mastery[scaleName] = window.VIOLIN_SCALE_CURRICULUM_V1
        ? window.VIOLIN_SCALE_CURRICULUM_V1.createMastery()
        : {};
    }
    return mastery[scaleName];
  }
};
