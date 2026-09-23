import { ScaleMasteryService } from '../services/scale-mastery-service.js';

export class TeacherAgendaViewModel {
  constructor({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService, homeworkService, scaleMasteryService = null, studentIntelligenceService = null }) {
    this.students = studentService;
    this.terms = termService;
    this.teacherTerms = teacherTermService;
    this.weekly = weeklyProgrammeService;
    this.lessons = lessonService;
    this.lessonProgramme = lessonProgrammeService;
    this.homework = homeworkService;
    this.scaleMastery = scaleMasteryService;
    this.studentIntelligence = studentIntelligenceService;
  }

  async loadStudent(studentId) {
    const student = await this.students.get(studentId);
    if (!student) throw new Error('Student not found');
    const terms = await this.terms.listForStudent(studentId);
    return { student, terms };
  }

  async loadStudentIntelligence(studentId) {
    if (!this.studentIntelligence) return null;
    return this.studentIntelligence.getStudentProfile(studentId);
  }

  async loadLongitudinalDevelopment(studentId) {
    if (!this.studentIntelligence) return null;
    return this.studentIntelligence.getLongitudinalDevelopment(studentId);
  }

  async loadEvidenceSignals(studentId) {
    if (!this.studentIntelligence) return null;
    return this.studentIntelligence.getEvidenceSignals(studentId);
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
    const mastery = ScaleMasteryService.summarise(items);
    for (const [category, summary] of Object.entries(byCategory)) {
      const categoryItems = items.filter(item => (item.details?.category ?? 'Other') === category);
      const categoryMastery = ScaleMasteryService.summarise(categoryItems);
      Object.assign(summary, {
        masteryPercent: categoryMastery.masteryPercent,
        masteryCounts: categoryMastery.counts,
      });
    }
    return {
      total,
      completed,
      masteryPercent: mastery.masteryPercent,
      masteryCounts: mastery.counts,
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

  async completeProgrammeItems(termId, programmeItemIds) {
    return this.lessonProgramme.completeItemsForTerm(termId, programmeItemIds);
  }

  async uncompleteProgrammeItem(termId, programmeItemId) {
    return this.lessonProgramme.uncompleteItemForTerm(termId, programmeItemId);
  }

  async carryForward(termId, programmeItemId, targetWeek) {
    return this.lessonProgramme.carryForwardForTerm(termId, programmeItemId, targetWeek);
  }

  async assessScale(programmeItemId, assessment, termId = null) {
    if (!this.scaleMastery) throw new Error('Scale mastery service is not configured');
    if (termId !== null) {
      const termItems = await this.weekly.listForTerm(termId);
      const item = termItems.find(candidate => candidate.id === programmeItemId);
      if (!item) throw new Error('Scale ProgrammeItem does not belong to the selected term');
      if (item.curriculumDomain !== 'SCALES') throw new Error('ProgrammeItem is not a scale item');
    }
    return this.scaleMastery.assess({ programmeItemId, ...assessment });
  }

  async saveHomework(lessonId, items) {
    return this.homework.assignHomework({ lessonId, items });
  }

  async loadHomework(lessonId) {
    return this.homework.getForLesson(lessonId);
  }
}
