import { ScaleMasteryService } from './scale-mastery-service.js';
import { getTeacherUnitCard } from '../tktl/registry.js';

export class StudentIntelligenceService {
  constructor({ studentService, termService, weeklyProgrammeService, lessonService, homeworkService, teacherTermService, repository }) {
    this.students = studentService;
    this.terms = termService;
    this.weekly = weeklyProgrammeService;
    this.lessons = lessonService;
    this.homework = homeworkService;
    this.teacherTerms = teacherTermService;
    this.repo = repository ?? weeklyProgrammeService.repo;
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

  async getEvidenceSignals(studentId) {
    const profile = await this.getStudentProfile(studentId);
    const signals = [];

    for (const entry of profile.termProfiles) {
      for (const [domain, summary] of Object.entries(entry.programme)) {
        if (summary.pending > 0) {
          signals.push({
            type: 'PENDING_PROGRAMME',
            termId: entry.term.id,
            domain,
            count: summary.pending,
            evidence: `${summary.pending} programme item(s) are not completed`,
          });
        }
        const reviewedPending = Math.max(0, summary.reviewed - summary.completed);
        if (reviewedPending > 0) {
          signals.push({
            type: 'REVIEWED_NOT_COMPLETED',
            termId: entry.term.id,
            domain,
            count: reviewedPending,
            evidence: `${reviewedPending} reviewed programme item(s) are still not completed`,
          });
        }
      }

      const developing = entry.scales.mastery.counts.DEVELOPING ?? 0;
      const notStarted = entry.scales.mastery.counts.NOT_STARTED ?? 0;
      if (developing > 0) {
        signals.push({
          type: 'SCALE_DEVELOPING',
          termId: entry.term.id,
          count: developing,
          evidence: `${developing} scale assessment(s) are marked DEVELOPING`,
        });
      }
      if (notStarted > 0) {
        signals.push({
          type: 'SCALE_NOT_STARTED',
          termId: entry.term.id,
          count: notStarted,
          evidence: `${notStarted} scale assessment(s) are NOT_STARTED`,
        });
      }

      if (entry.lessons.attendance.ABSENT > 0) {
        signals.push({
          type: 'ABSENCE_RECORDED',
          termId: entry.term.id,
          count: entry.lessons.attendance.ABSENT,
          evidence: `${entry.lessons.attendance.ABSENT} lesson(s) recorded ABSENT`,
        });
      }

      if (entry.lessons.count === 0) {
        signals.push({
          type: 'NO_LESSONS_RECORDED',
          termId: entry.term.id,
          count: 0,
          evidence: 'No lessons are recorded for this term',
        });
      }
    }

    return {
      student: profile.student,
      currentTermId: profile.currentTerm?.id ?? null,
      signals,
    };
  }

  async getTeacherDecisionPrompts(studentId) {
    const evidence = await this.getEvidenceSignals(studentId);
    const profile = await this.getStudentProfile(studentId);
    const prompts = [];

    for (const signal of evidence.signals) {
      const termProfile = profile.termProfiles.find(entry => entry.term.id === signal.termId);
      const tktl = termProfile?.tktl;
      if (!tktl) continue;

      prompts.push({
        signalType: signal.type,
        termId: signal.termId,
        domain: signal.domain ?? null,
        evidence: signal.evidence,
        teacherDecisionLogic: [...(tktl.teacherDecisionLogic ?? [])],
        readinessCriteria: [...(tktl.readinessCriteria ?? [])],
        nextTermDependency: tktl.nextTermDependency ?? null,
      });
    }

    return {
      student: evidence.student,
      currentTermId: evidence.currentTermId,
      prompts,
    };
  }

  async getTeacherReadinessReview(studentId, termId = null) {
    const profile = await this.getStudentProfile(studentId);
    const current = termId
      ? profile.termProfiles.find(termProfile => termProfile.term.id === termId) ?? null
      : profile.termProfiles.at(-1) ?? null;
    if (termId && !current) throw new Error('Term not found for student');
    if (!current) {
      return { student: profile.student, currentTerm: null, checklist: [] };
    }

    const tktl = current.tktl;
    return {
      student: profile.student,
      currentTerm: current.term,
      checklist: [{
        termId: current.term.id,
        cardId: tktl?.cardId ?? null,
        evidence: current,
        readinessCriteria: [...(tktl?.readinessCriteria ?? [])],
        nextTermDependency: tktl?.nextTermDependency ?? null,
        teacherDecisionLogic: [...(tktl?.teacherDecisionLogic ?? [])],
        decision: current.term.readinessDecision ?? null,
        decisionNote: current.term.readinessDecisionNote ?? '',
        decisionRecordedAt: current.term.readinessDecisionAt ?? null,
      }],
    };
  }

  async getLongitudinalDevelopment(studentId) {
    const profile = await this.getStudentProfile(studentId);
    const rows = profile.termProfiles.map((entry, index) => {
      const previous = profile.termProfiles[index - 1] ?? null;
      const metrics = {
        lessons: entry.lessons.count,
        averageMark: entry.lessons.marks.average,
        attendancePresent: entry.lessons.attendance.PRESENT,
        attendanceLate: entry.lessons.attendance.LATE,
        attendanceAbsent: entry.lessons.attendance.ABSENT,
        pureTechnicalCompleted: entry.programme.PURE_TECHNICAL.completed,
        etudeCompleted: entry.programme.ETUDE.completed,
        repertoireCompleted: entry.programme.REPERTOIRE.completed,
        scalesCompleted: entry.scales.completed,
        scaleMasteryPercent: entry.scales.mastery.masteryPercent,
        homeworkItems: entry.homework.itemCount,
      };

      const delta = {};
      for (const [key, value] of Object.entries(metrics)) {
        const previousValue = previous
          ? ({
              lessons: previous.lessons.count,
              averageMark: previous.lessons.marks.average,
              attendancePresent: previous.lessons.attendance.PRESENT,
              attendanceLate: previous.lessons.attendance.LATE,
              attendanceAbsent: previous.lessons.attendance.ABSENT,
              pureTechnicalCompleted: previous.programme.PURE_TECHNICAL.completed,
              etudeCompleted: previous.programme.ETUDE.completed,
              repertoireCompleted: previous.programme.REPERTOIRE.completed,
              scalesCompleted: previous.scales.completed,
              scaleMasteryPercent: previous.scales.mastery.masteryPercent,
              homeworkItems: previous.homework.itemCount,
            }[key])
          : null;
        delta[key] = previousValue === null || value === null || previousValue === null
          ? null
          : value - previousValue;
      }

      return { term: entry.term, metrics, delta };
    });

    return {
      student: profile.student,
      currentTerm: profile.currentTerm,
      terms: rows,
      timeline: profile.timeline,
    };
  }

  async getStudentTimeline(studentId) {
    const student = await this.students.get(studentId);
    if (!student) throw new Error('Student not found');

    const terms = await this.terms.listForStudent(studentId);
    const termIds = new Set(terms.map(term => term.id));
    const lessons = (await Promise.all([...termIds].map(termId => this.lessons.listForTerm(termId)))).flat();

    const events = [];
    for (const lesson of lessons) {
      events.push({
        type: 'LESSON',
        date: lesson.date,
        id: lesson.id,
        termId: lesson.termId,
        mark: lesson.mark,
        attendance: lesson.attendance,
        teacherNote: lesson.teacherNote ?? '',
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

    const programmeItems = (await this.repo.list('programmeItems')).filter(item => termIds.has(item.termId));
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

    const lessons = await this.lessons.listForTerm(term.id);
    const reviewedIds = new Set(lessons.flatMap(lesson => lesson.reviewedProgrammeItemIds ?? []));
    const programme = {};
    for (const domain of ['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE']) {
      const domainItems = coreItems.filter(item => item.curriculumDomain === domain);
      programme[domain] = {
        total: domainItems.length,
        completed: domainItems.filter(item => item.status === 'COMPLETED').length,
        reviewed: domainItems.filter(item => reviewedIds.has(item.id)).length,
        pending: domainItems.filter(item => item.status !== 'COMPLETED').length,
      };
    }

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
      const card = getTeacherUnitCard(term.level, term.termNumber);
      if (card) {
        const context = await this.teacherTerms.getContext(term.id);
        tktl = {
          cardId: context.card.id,
          technicalIntent: context.card.technicalIntent ?? null,
          readinessCriteria: context.card.readinessCriteria ?? null,
          teacherDecisionLogic: context.card.teacherDecisionLogic ?? null,
          nextTermDependency: context.card.nextTermDependency ?? null,
        };
      }
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
