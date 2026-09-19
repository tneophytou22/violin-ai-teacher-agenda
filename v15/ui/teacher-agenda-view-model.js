export class TeacherAgendaViewModel {
  constructor({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService, homeworkService }) {
    this.students = studentService;
    this.terms = termService;
    this.teacherTerms = teacherTermService;
    this.weekly = weeklyProgrammeService;
    this.lessons = lessonService;
    this.lessonProgramme = lessonProgrammeService;
    this.homework = homeworkService;
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

  async updateLessonDetails(lessonId, details) {
    return this.lessons.updateDetails(lessonId, details);
  }

  async getLesson(lessonId) {
    return this.lessons.get(lessonId);
  }

  async listLessons(termId) {
    return this.lessons.listForTerm(termId);
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

  async saveHomework(lessonId, items) {
    return this.homework.assignHomework({ lessonId, items });
  }

  async loadHomework(lessonId) {
    return this.homework.getForLesson(lessonId);
  }
}
