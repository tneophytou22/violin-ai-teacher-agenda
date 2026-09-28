export const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export class TeacherAgendaController {
  constructor(viewModel, { today = localDateString } = {}) {
    this.viewModel = viewModel;
    this.today = today;
    this.operationTail = Promise.resolve();
    this.state = {
      students: [],
      agenda: null,
      agendaDate: this.today(),
      selectedStudentId: null,
      terms: [],
      selectedTermId: null,
      termContext: null,
      week: 1,
      weekly: null,
      activeLessonId: null,
      activeLesson: null,
      lessonHistory: [],
      termProgress: null,
      scaleProgress: null,
      studentIntelligence: null,
      longitudinalDevelopment: null,
      evidenceSignals: null,
      teacherDecisionPrompts: null,
      teacherReadinessReview: null,
      homework: null,
      homeworkDraftItems: [],
      practicePlanDraft: null,
      selectedItemIds: [],
      reviewedItemIds: [],
      error: null,
      loading: false,
    };
  }

  snapshot() {
    return structuredClone(this.state);
  }

  async createStudent(input) {
    return this.#run(async () => {
      const { initialTerm = null, ...studentInput } = input ?? {};
      let student;
      if (initialTerm?.level !== null && initialTerm?.level !== undefined) {
        ({ student } = await this.viewModel.students.createWithInitialTerm(studentInput, initialTerm));
      } else {
        student = await this.viewModel.students.create(studentInput);
      }
      this.state.students = await this.viewModel.students.list();
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      await this.#selectStudent(student.id);
      return student;
    });
  }

  async updateStudent(changes = {}) {
    return this.#run(async () => {
      if (!this.state.selectedStudentId) throw new Error('No student selected');
      const student = await this.viewModel.updateStudent(this.state.selectedStudentId, changes);
      this.state.students = await this.viewModel.students.list();
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      return student;
    });
  }

  async deleteStudent() {
    return this.#run(async () => {
      if (!this.state.selectedStudentId) throw new Error('No student selected');
      const studentId = this.state.selectedStudentId;
      await this.viewModel.deleteStudent(studentId);
      this.state.students = await this.viewModel.students.list();
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      this.state.selectedStudentId = null;
      this.state.selectedTermId = null;
      this.state.terms = [];
      this.state.termContext = null;
      this.state.week = 1;
      this.#resetLessonState();
      this.state.weekly = null;
      this.state.scaleProgress = null;
      this.state.termProgress = null;
      this.state.lessonHistory = [];
      this.state.studentIntelligence = null;
      this.state.longitudinalDevelopment = null;
      this.state.evidenceSignals = [];
      this.state.teacherDecisionPrompts = [];
      this.state.teacherReadinessReview = null;
      return this.snapshot();
    });
  }

  async createBackup() {
    return this.#run(async () => this.viewModel.createBackup());
  }

  async restoreBackup(backup) {
    return this.#run(async () => {
      const restored = await this.viewModel.restoreBackup(backup);
      this.state.students = await this.viewModel.students.list();
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      this.state.selectedStudentId = null;
      this.state.selectedTermId = null;
      this.state.terms = [];
      this.state.termContext = null;
      this.state.week = 1;
      this.#resetLessonState();
      this.state.weekly = null;
      this.state.scaleProgress = null;
      this.state.termProgress = null;
      this.state.lessonHistory = [];
      this.state.studentIntelligence = null;
      this.state.longitudinalDevelopment = null;
      this.state.evidenceSignals = [];
      this.state.teacherDecisionPrompts = [];
      this.state.teacherReadinessReview = null;
      return { backup: restored, state: this.snapshot() };
    });
  }

  async createTerm(input) {
    return this.#run(async () => {
      if (!this.state.selectedStudentId) throw new Error('No student selected');
      const term = await this.viewModel.terms.create({ ...input, studentId: this.state.selectedStudentId });
      const context = await this.viewModel.loadStudent(this.state.selectedStudentId);
      this.state.terms = context.terms;
      this.state.selectedTermId = term.id;
      this.state.week = 1;
      this.#resetLessonState();
      await this.#loadSelectedTerm();
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      this.state.longitudinalDevelopment = await this.viewModel.loadLongitudinalDevelopment(this.state.selectedStudentId);
      this.state.evidenceSignals = await this.viewModel.loadEvidenceSignals(this.state.selectedStudentId);
      this.state.teacherDecisionPrompts = await this.viewModel.loadTeacherDecisionPrompts(this.state.selectedStudentId);
      this.state.teacherReadinessReview = await this.viewModel.loadTeacherReadinessReview(this.state.selectedStudentId, this.state.selectedTermId);
      return term;
    });
  }

  async loadStudents() {
    return this.#run(async () => {
      this.state.students = await this.viewModel.students.list();
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      return this.snapshot();
    });
  }

  async selectStudent(studentId) {
    return this.#run(() => this.#selectStudent(studentId));
  }

  async loadAgenda(date = this.today()) {
    return this.#run(async () => {
      this.state.agendaDate = date;
      this.state.agenda = await this.viewModel.loadAgenda(date);
      return this.snapshot();
    });
  }

  async openAgendaEntry(entry) {
    return this.#run(async () => {
      if (!entry?.studentId) throw new Error('Agenda entry has no student');
      await this.#selectStudent(entry.studentId);
      if (entry.termId && this.state.terms.some(term => term.id === entry.termId)) {
        this.state.selectedTermId = entry.termId;
        await this.#loadSelectedTerm();
      }
      if (entry.lessonId) {
        await this.#activateLesson(await this.viewModel.getLesson(entry.lessonId));
      } else if (this.state.selectedTermId) {
        const lesson = await this.viewModel.createLesson(this.state.selectedTermId, entry.date);
        await this.#activateLesson(lesson);
      }
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      return this.snapshot();
    });
  }

  async shiftAgendaWeek(direction) {
    return this.#run(async () => {
      if (!Number.isInteger(direction) || ![-1, 1].includes(direction)) {
        throw new Error('Agenda week direction must be -1 or 1');
      }
      const current = String(this.state.agendaDate).split('-').map(Number);
      const date = new Date(current[0], current[1] - 1, current[2]);
      date.setDate(date.getDate() + direction * 7);
      this.state.agendaDate = localDateString(date);
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      return this.snapshot();
    });
  }

  async #selectStudent(studentId) {
    const context = await this.viewModel.loadStudent(studentId);
    this.state.selectedStudentId = studentId;
    this.state.terms = context.terms;
    this.state.selectedTermId = context.terms[0]?.id ?? null;
    this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(studentId);
    this.state.longitudinalDevelopment = await this.viewModel.loadLongitudinalDevelopment(studentId);
    this.state.evidenceSignals = await this.viewModel.loadEvidenceSignals(studentId);
    this.state.teacherDecisionPrompts = await this.viewModel.loadTeacherDecisionPrompts(studentId);
    this.state.teacherReadinessReview = null;
    this.state.termContext = null;
    this.state.weekly = null;
    this.state.termProgress = null;
    this.state.scaleProgress = null;
    this.#resetLessonState();
    this.state.week = 1;
    if (this.state.selectedTermId) {
      await this.#loadSelectedTerm();
      this.state.teacherReadinessReview = await this.viewModel.loadTeacherReadinessReview(studentId, this.state.selectedTermId);
    }
    return this.snapshot();
  }

  async selectTerm(termId) {
    return this.#run(async () => {
      const term = this.state.terms.find(item => item.id === termId);
      if (!term) throw new Error('Term does not belong to selected student');
      this.state.selectedTermId = termId;
      this.state.week = 1;
      this.#resetLessonState();
      await this.#loadSelectedTerm();
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      this.state.teacherReadinessReview = await this.viewModel.loadTeacherReadinessReview(this.state.selectedStudentId, this.state.selectedTermId);
      return this.snapshot();
    });
  }

  async saveTeacherReadinessDecision({ decision, note = '' }) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      const term = await this.viewModel.saveTeacherReadinessDecision(this.state.selectedTermId, decision || null, note);
      await this.#loadSelectedTerm();
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      this.state.teacherReadinessReview = await this.viewModel.loadTeacherReadinessReview(this.state.selectedStudentId, this.state.selectedTermId);
      return term;
    });
  }

  async selectWeek(week) {
    return this.#run(async () => {
      if (!Number.isInteger(week) || week < 1) throw new Error('Week must be an integer >= 1');
      if (!this.state.selectedTermId) throw new Error('No term selected');
      this.state.week = week;
      this.state.selectedItemIds = [];
      this.state.weekly = await this.viewModel.loadWeek(this.state.selectedTermId, week);
      return this.snapshot();
    });
  }

  toggleItemSelection(itemId) {
    const item = (this.state.weekly?.items ?? []).find(candidate => candidate.id === itemId);
    if (!item || item.curriculumDomain === 'SCALES' || item.status === 'COMPLETED') return this.snapshot();

    const selected = new Set(this.state.selectedItemIds);
    if (selected.has(itemId)) selected.delete(itemId);
    else selected.add(itemId);
    this.state.selectedItemIds = [...selected];
    return this.snapshot();
  }

  selectAllPendingItems() {
    const pendingIds = (this.state.weekly?.items ?? [])
      .filter(item => item.curriculumDomain !== 'SCALES' && item.status !== 'COMPLETED')
      .map(item => item.id);
    this.state.selectedItemIds = pendingIds;
    return this.snapshot();
  }

  clearItemSelection() {
    this.state.selectedItemIds = [];
    return this.snapshot();
  }

  setHomeworkDraftItems(items) {
    if (!Array.isArray(items)) throw new Error('Homework draft items must be an array');
    this.state.homeworkDraftItems = items.map(item => ({ ...item }));
    this.state.practicePlanDraft = null;
    return this.snapshot();
  }

  async createLesson(date = this.today(), options = {}) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      const lessons = await this.viewModel.listLessons(this.state.selectedTermId);
      const existing = lessons.find(lesson => lesson.date === date);
      const lesson = existing ?? await this.viewModel.createLesson(this.state.selectedTermId, date, options);
      await this.#activateLesson(lesson);
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return lesson;
    });
  }

  async selectLesson(lessonId) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      const lesson = await this.viewModel.getLesson(lessonId);
      if (!lesson || lesson.termId !== this.state.selectedTermId) throw new Error('Lesson does not belong to selected term');
      await this.#activateLesson(lesson);
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return this.snapshot();
    });
  }

  closeLessonView() {
    return this.#run(async () => {
      if (!this.state.activeLessonId) return this.snapshot();
      this.#resetLessonState();
      return this.snapshot();
    });
  }

  async endLesson() {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      const savedItems = this.state.homework?.items ?? [];
      const draftItems = this.state.homeworkDraftItems ?? [];
      const savedPlan = this.state.homework?.practicePlan ?? null;
      const draftPlan = this.state.practicePlanDraft ?? null;
      if (JSON.stringify(savedItems) !== JSON.stringify(draftItems) || JSON.stringify(savedPlan) !== JSON.stringify(draftPlan)) {
        throw new Error('Save Homework before ending the lesson');
      }
      const lesson = this.state.activeLesson;
      await this.viewModel.updateLessonDetails(this.state.activeLessonId, {
        mark: lesson?.mark ?? null,
        attendance: lesson?.attendance ?? 'PRESENT',
        teacherNote: lesson?.teacherNote ?? '',
      });
      this.state.activeLessonId = null;
      this.state.activeLesson = null;
      this.state.homework = null;
      this.state.homeworkDraftItems = [];
      this.state.practicePlanDraft = null;
      this.state.selectedItemIds = [];
      this.state.reviewedItemIds = [];
      this.state.lessonHistory = await this.viewModel.listLessons(this.state.selectedTermId);
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      this.state.agenda = await this.viewModel.loadAgenda(this.state.agendaDate);
      return this.snapshot();
    });
  }

  async updateLessonDetails({ mark = null, attendance = 'PRESENT', teacherNote = '' }) {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      const lesson = await this.viewModel.updateLessonDetails(this.state.activeLessonId, { mark, attendance, teacherNote });
      await this.#activateLesson(lesson);
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return this.snapshot();
    });
  }

  async reviewItems(programmeItemIds) {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      const result = await this.viewModel.reviewLessonItems(this.state.activeLessonId, programmeItemIds);
      this.state.activeLesson = result.lesson;
      this.state.reviewedItemIds = [...new Set(result.lesson?.reviewedProgrammeItemIds ?? programmeItemIds)];
      this.state.selectedItemIds = [];
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return this.snapshot();
    });
  }

  async generatePracticePlan(items = this.state.homeworkDraftItems) {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      const level = this.state.termContext?.term?.level;
      if (!Number.isInteger(level)) throw new Error('Practice Planner requires the selected term to have a level');
      const plan = this.viewModel.generatePracticePlan({ level, items });
      this.state.homeworkDraftItems = items.map(item => ({ ...item }));
      this.state.practicePlanDraft = structuredClone(plan);
      return this.snapshot();
    });
  }

  async saveHomework(items = this.state.homeworkDraftItems, practicePlan = this.state.practicePlanDraft) {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      this.state.homeworkDraftItems = items.map(item => ({ ...item }));
      this.state.practicePlanDraft = practicePlan ? structuredClone(practicePlan) : null;
      this.state.homework = await this.viewModel.saveHomework(this.state.activeLessonId, this.state.homeworkDraftItems, this.state.practicePlanDraft);
      this.state.homeworkDraftItems = this.state.homework.items.map(item => ({ ...item }));
      this.state.practicePlanDraft = this.state.homework.practicePlan ? structuredClone(this.state.homework.practicePlan) : null;
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return this.snapshot();
    });
  }

  async assessScale(programmeItemId, assessment) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      const item = await this.viewModel.assessScale(programmeItemId, assessment, this.state.selectedTermId);
      await this.#reloadWeek();
      if (this.state.selectedTermId) {
        this.state.scaleProgress = await this.viewModel.loadScaleProgress(this.state.selectedTermId);
      }
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return item;
    });
  }

  async completeItems(programmeItemIds) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      await this.viewModel.completeProgrammeItems(this.state.selectedTermId, programmeItemIds);
      this.state.selectedItemIds = [];
      await this.#reloadWeek();
      if (this.state.selectedTermId) {
        this.state.termProgress = await this.viewModel.loadTermProgress(this.state.selectedTermId);
        this.state.scaleProgress = await this.viewModel.loadScaleProgress(this.state.selectedTermId);
      }
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return this.snapshot();
    });
  }

  async uncompleteItem(programmeItemId) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      await this.viewModel.uncompleteProgrammeItem(this.state.selectedTermId, programmeItemId);
      this.state.selectedItemIds = [];
      await this.#reloadWeek();
      if (this.state.selectedTermId) {
        this.state.termProgress = await this.viewModel.loadTermProgress(this.state.selectedTermId);
        this.state.scaleProgress = await this.viewModel.loadScaleProgress(this.state.selectedTermId);
      }
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return this.snapshot();
    });
  }

  async carryForward(programmeItemId, targetWeek) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      await this.viewModel.carryForward(this.state.selectedTermId, programmeItemId, targetWeek);
      this.state.week = targetWeek;
      this.state.selectedItemIds = [];
      await this.#reloadWeek();
      this.state.studentIntelligence = await this.viewModel.loadStudentIntelligence(this.state.selectedStudentId);
      return this.snapshot();
    });
  }

  #resetLessonState() {
    this.state.activeLessonId = null;
    this.state.activeLesson = null;
    this.state.lessonHistory = [];
    this.state.homework = null;
    this.state.homeworkDraftItems = [];
    this.state.practicePlanDraft = null;
    this.state.selectedItemIds = [];
    this.state.reviewedItemIds = [];
  }

  async #activateLesson(lesson) {
    this.state.activeLessonId = lesson.id;
    this.state.activeLesson = lesson;
    this.state.reviewedItemIds = [...new Set(lesson.reviewedProgrammeItemIds ?? [])];
    this.state.homework = await this.viewModel.loadHomework(lesson.id);
    this.state.homeworkDraftItems = this.state.homework?.items?.map(item => ({ ...item })) ?? [];
    this.state.practicePlanDraft = this.state.homework?.practicePlan ? structuredClone(this.state.homework.practicePlan) : null;
    this.state.lessonHistory = await this.viewModel.listLessons(this.state.selectedTermId);
  }

  async #loadSelectedTerm() {
    this.state.termContext = await this.viewModel.loadTerm(this.state.selectedTermId);
    await this.viewModel.teacherTerms.activateCard(this.state.selectedTermId);
    this.state.termProgress = await this.viewModel.loadTermProgress(this.state.selectedTermId);
    this.state.scaleProgress = await this.viewModel.loadScaleProgress(this.state.selectedTermId);
    this.state.weekly = await this.viewModel.loadWeek(this.state.selectedTermId, this.state.week);
    const lessons = await this.viewModel.listLessons(this.state.selectedTermId);
    const existing = lessons.find(lesson => lesson.date === this.today());
    this.state.lessonHistory = lessons;
    if (existing) await this.#activateLesson(existing);
  }

  async #reloadWeek() {
    if (this.state.selectedTermId) {
      this.state.weekly = await this.viewModel.loadWeek(this.state.selectedTermId, this.state.week);
    }
  }

  #run(operation) {
    const execute = async () => {
      const previousState = this.snapshot();
      this.state.loading = true;
      this.state.error = null;
      try {
        return await operation();
      } catch (error) {
        this.state = previousState;
        this.state.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.state.loading = false;
      }
    };

    const queued = this.operationTail.then(execute, execute);
    this.operationTail = queued.catch(() => {});
    return queued;
  }
}
