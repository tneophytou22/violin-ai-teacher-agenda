export class TeacherAgendaViewModel {
  constructor({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService }) {
    this.students = studentService;
    this.terms = termService;
    this.teacherTerms = teacherTermService;
    this.weekly = weeklyProgrammeService;
    this.lessons = lessonService;
    this.lessonProgramme = lessonProgrammeService;
  }

  async loadStudent(studentId) {
    const student = await this.students.get(studentId);
    if (!student) throw new Error('Student not found');
    const terms = await this.terms.listForStudent(studentId);
    return { student, terms };
  }

  async loadTerm(termId) {
    return this.teacherTerms.getContext(termId);
  }

  async loadWeek(termId, week) {
    const [items, summary] = await Promise.all([
      this.weekly.listForTerm(termId, week),
      this.weekly.summary(termId, week),
    ]);
    return { items, summary };
  }

  async createLesson(termId, date, options = {}) {
    return this.lessons.create({ termId, date, ...options });
  }

  async reviewLessonItems(lessonId, programmeItemIds) {
    return this.lessonProgramme.reviewWeeklyItems(lessonId, programmeItemIds);
  }

  async completeProgrammeItems(programmeItemIds) {
    return this.lessonProgramme.completeItems(programmeItemIds);
  }

  async carryForward(programmeItemId, targetWeek) {
    return this.lessonProgramme.carryForward(programmeItemId, targetWeek);
  }
}
