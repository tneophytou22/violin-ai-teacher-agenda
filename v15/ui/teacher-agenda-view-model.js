export class TeacherAgendaViewModel {
  constructor({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService, homeworkService, scaleMasteryService = null }) {
    this.students = studentService;
    this.terms = termService;
    this.teacherTerms = teacherTermService;
    this.weekly = weeklyProgrammeService;
    this.lessons = lessonService;
    this.lessonProgramme = lessonProgrammeService;
    this.homework = homeworkService;
    this.scaleMastery = scaleMasteryService;
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

  async loadTermProgress(termId) {
    const items = (await this.weekly.listForTerm(termId)).filter(item => item.curriculumDomain !== 'SCALES');
    const byDomain = {};
    for (const item of items) {
      byDomain[item.curriculumDomain] ??= { total: 0, completed: 0 };
      byDomain[item.curriculumDomain].total += 1;
      if (item.status === 'COMPLETED') byDomain[item.curriculumDomain].completed += 1;
    }
    return {
      total: items.length,
      completed: items.filter(item => item.status === 'COMPLETED').length,
      byDomain,
    };
  }

  async loadScaleProgress(termId) {
    const items = (await this.weekly.listForTerm(termId)).filter(item => item.curriculumDomain === 'SCALES');
    const byCategory = {};
    for (const item of items) {
      const category = item.details?.category ?? 'Other';
      byCategory[category] ??= { total: 0, completed: 0 };
      byCategory[category].total += 1;
      if (item.status === 'COMPLETED') byCategory[category].completed += 1;
    }
    const total = items.length;
    const completed = items.filter(item => item.status === 'COMPLETED').length;
    return {
      total,
      completed,
      masteryPercent: total ? Math.round((completed / total) * 100) : 0,
      inProgressCategories: Object.values(byCategory).filter(v => v.completed > 0 && v.completed < v.total).length,
      byCategory,
      items,
    };
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

  async assessScale(programmeItemId, assessment) {
    if (!this.scaleMastery) throw new Error('Scale mastery service is not configured');
    return this.scaleMastery.assess({ programmeItemId, ...assessment });
  }

  async saveHomework(lessonId, items) {
    return this.homework.assignHomework({ lessonId, items });
  }

  async loadHomework(lessonId) {
    return this.homework.getForLesson(lessonId);
  }
}
