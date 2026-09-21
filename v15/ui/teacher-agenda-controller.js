export class TeacherAgendaController {
  constructor(viewModel, { today = () => new Date().toISOString().slice(0, 10) } = {}) {
    this.viewModel = viewModel;
    this.today = today;
    this.state = {
      students: [],
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
      homework: null,
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
      const student = await this.viewModel.students.create(input);
      this.state.students = await this.viewModel.students.list();
      await this.selectStudent(student.id);
      return student;
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
      return term;
    });
  }

  async loadStudents() {
    return this.#run(async () => {
      this.state.students = await this.viewModel.students.list();
      return this.snapshot();
    });
  }

  async selectStudent(studentId) {
    return this.#run(async () => {
      const context = await this.viewModel.loadStudent(studentId);
      this.state.selectedStudentId = studentId;
      this.state.terms = context.terms;
      this.state.selectedTermId = context.terms[0]?.id ?? null;
      this.state.termContext = null;
      this.state.weekly = null;
      this.state.termProgress = null;
      this.state.scaleProgress = null;
      this.#resetLessonState();
      this.state.week = 1;
      if (this.state.selectedTermId) await this.#loadSelectedTerm();
      return this.snapshot();
    });
  }

  async selectTerm(termId) {
    return this.#run(async () => {
      const term = this.state.terms.find(item => item.id === termId);
      if (!term) throw new Error('Term does not belong to selected student');
      this.state.selectedTermId = termId;
      this.state.week = 1;
      this.#resetLessonState();
      await this.#loadSelectedTerm();
      return this.snapshot();
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

  async createLesson(date = this.today(), options = {}) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      const lessons = await this.viewModel.listLessons(this.state.selectedTermId);
      const existing = lessons.find(lesson => lesson.date === date);
      const lesson = existing ?? await this.viewModel.createLesson(this.state.selectedTermId, date, options);
      await this.#activateLesson(lesson);
      return lesson;
    });
  }

  async selectLesson(lessonId) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      const lesson = await this.viewModel.getLesson(lessonId);
      if (!lesson || lesson.termId !== this.state.selectedTermId) throw new Error('Lesson does not belong to selected term');
      await this.#activateLesson(lesson);
      return this.snapshot();
    });
  }

  async updateLessonDetails({ mark = null, attendance = 'PRESENT' }) {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      const lesson = await this.viewModel.updateLessonDetails(this.state.activeLessonId, { mark, attendance });
      await this.#activateLesson(lesson);
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
      return this.snapshot();
    });
  }

  async saveHomework(items) {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      this.state.homework = await this.viewModel.saveHomework(this.state.activeLessonId, items);
      return this.snapshot();
    });
  }

  async assessScale(programmeItemId, assessment) {
    return this.#run(async () => {
      const item = await this.viewModel.assessScale(programmeItemId, assessment);
      if (this.state.selectedTermId) {
        this.state.scaleProgress = await this.viewModel.loadScaleProgress(this.state.selectedTermId);
      }
      return item;
    });
  }

  async completeItems(programmeItemIds) {
    return this.#run(async () => {
      await this.viewModel.completeProgrammeItems(programmeItemIds);
      this.state.selectedItemIds = [];
      await this.#reloadWeek();
      if (this.state.selectedTermId) {
        this.state.termProgress = await this.viewModel.loadTermProgress(this.state.selectedTermId);
        this.state.scaleProgress = await this.viewModel.loadScaleProgress(this.state.selectedTermId);
      }
      return this.snapshot();
    });
  }

  async carryForward(programmeItemId, targetWeek) {
    return this.#run(async () => {
      await this.viewModel.carryForward(programmeItemId, targetWeek);
      this.state.week = targetWeek;
      this.state.selectedItemIds = [];
      await this.#reloadWeek();
      return this.snapshot();
    });
  }

  #resetLessonState() {
    this.state.activeLessonId = null;
    this.state.activeLesson = null;
    this.state.lessonHistory = [];
    this.state.homework = null;
    this.state.selectedItemIds = [];
    this.state.reviewedItemIds = [];
  }

  async #activateLesson(lesson) {
    this.state.activeLessonId = lesson.id;
    this.state.activeLesson = lesson;
    this.state.reviewedItemIds = [...new Set(lesson.reviewedProgrammeItemIds ?? [])];
    this.state.homework = await this.viewModel.loadHomework(lesson.id);
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

  async #run(operation) {
    this.state.loading = true;
    this.state.error = null;
    try {
      return await operation();
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      this.state.loading = false;
    }
  }
}
