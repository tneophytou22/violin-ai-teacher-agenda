import { ScaleMasteryService } from './scale-mastery-service.js';

export class StudentIntelligenceService {
  constructor({ studentService, termService, weeklyProgrammeService, lessonService, homeworkService, teacherTermService }) {
    this.students = studentService;
    this.terms = termService;
    this.weekly = weeklyProgrammeService;
    this.lessons = lessonService;
    this.homework = homeworkService;
    this.teacherTerms = teacherTermService;
  }

  async getStudentProfile(studentId) {
    const student = await this.students.get(studentId);
    if (!student) throw new Error('Student not found');

    const terms = await this.terms.listForStudent(studentId);
    const orderedTerms = [...terms].sort((a, b) =>
      String(a.startDate ?? '').localeCompare(String(b.startDate ?? '')) ||
      String(a.id).localeCompare(String(b.id))
    );
    const currentTerm = orderedTerms.at(-1) ?? null;
    const termProfiles = [];
    for (const term of orderedTerms) {
      termProfiles.push(await this.#buildTermProfile(term));
    }

    return {
      student,
      terms: orderedTerms,
      currentTerm,
      termProfiles,
      timeline: await this.getStudentTimeline(studentId),
    };
  }

  async getStudentTimeline(studentId) {
    const terms = await this.terms.listForStudent(studentId);
    const termIds = new Set(terms.map(term => term.id));
    const lessons = (await this.lessons.listForTerm)
      ? (await Promise.all([...termIds].map(termId => this.lessons.listForTerm(termId)))).flat()
      : [];

    const events = [];
    for (const lesson of lessons) {
      events.push({
        type: 'LESSON',
        date: lesson.date,
        id: lesson.id,
        termId: lesson.termId,
        mark: lesson.mark,
        attendance: lesson.attendance,
        reviewedCount: (lesson.reviewedProgrammeItemIds ?? []).length,
      });

      const homework = await this.homework.getForLesson(lesson.id);
      if (homework) {
        events.push({
          type: 'HOMEWORK',
          date: lesson.date,
          id: homework.id,
          lessonId: lesson.id,
          itemCount: homework.items.length,
        });
      }
    }

    const programmeItems = (await this.weekly.repo.list('programmeItems')).filter(item => termIds.has(item.termId));
    for (const item of programmeItems) {
      if (item.status === 'COMPLETED' && item.completedAt) {
        events.push({
          type: 'PROGRAMME_COMPLETION',
          date: item.completedAt,
          id: item.id,
          termId: item.termId,
          curriculumDomain: item.curriculumDomain,
          title: item.title,
        });
      }
    }

    return events.sort((a, b) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')) ||
      String(b.id).localeCompare(String(a.id))
    );
  }

  async #buildTermProfile(term) {
    const items = await this.weekly.listForTerm(term.id);
    const coreItems = items.filter(item => item.curriculumDomain !== 'SCALES');
    const scaleItems = items.filter(item => item.curriculumDomain === 'SCALES');

    const programme = {};
    for (const domain of ['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE']) {
      const domainItems = coreItems.filter(item => item.curriculumDomain === domain);
      programme[domain] = {
        total: domainItems.length,
        completed: domainItems.filter(item => item.status === 'COMPLETED').length,
        reviewed: domainItems.filter(item => false).length,
        pending: domainItems.filter(item => item.status !== 'COMPLETED').length,
      };
    }

    const lessons = await this.lessons.listForTerm(term.id);
    const homework = [];
    for (const lesson of lessons) {
      const record = await this.homework.getForLesson(lesson.id);
      if (record) homework.push(record);
    }

    const attendance = Object.fromEntries(['PRESENT', 'LATE', 'ABSENT'].map(status => [
      status,
      lessons.filter(lesson => lesson.attendance === status).length,
    ]));
    const markedLessons = lessons.filter(lesson => Number.isInteger(lesson.mark));
    const marks = {
      count: markedLessons.length,
      latest: markedLessons[0]?.mark ?? null,
      average: markedLessons.length
        ? Math.round(markedLessons.reduce((sum, lesson) => sum + lesson.mark, 0) / markedLessons.length * 10) / 10
        : null,
    };

    const scaleMastery = ScaleMasteryService.summarise(scaleItems);

    let tktl = null;
    if (Number.isInteger(term.level) && Number.isInteger(term.termNumber)) {
      const context = await this.teacherTerms.getContext(term.id);
      tktl = {
        cardId: context.card.id,
        technicalIntent: context.card.technicalIntent ?? null,
        readinessCriteria: context.card.readinessCriteria ?? null,
        nextTermDependency: context.card.nextTermDependency ?? null,
      };
    }

    return {
      term,
      programme,
      scales: {
        total: scaleItems.length,
        completed: scaleItems.filter(item => item.status === 'COMPLETED').length,
        mastery: scaleMastery,
      },
      lessons: {
        count: lessons.length,
        latest: lessons[0] ?? null,
        attendance,
        marks,
      },
      homework: {
        lessonCount: homework.length,
        itemCount: homework.reduce((sum, record) => sum + record.items.length, 0),
      },
      tktl,
    };
  }
}
