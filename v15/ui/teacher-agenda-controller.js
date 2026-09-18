export class TeacherAgendaController {
  constructor(viewModel) {
    this.viewModel = viewModel;
    this.state = {
      students: [],
      selectedStudentId: null,
      terms: [],
      selectedTermId: null,
      termContext: null,
      week: 1,
      weekly: null,
      activeLessonId: null,
      selectedItemIds: [],
      error: null,
      loading: false,
    };
  }

  snapshot() {
    return structuredClone(this.state);
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
      this.state.activeLessonId = null;
      this.state.selectedItemIds = [];
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
      this.state.activeLessonId = null;
      this.state.selectedItemIds = [];
      await this.#loadSelectedTerm();
      return this.snapshot();
    });
  }

  async selectWeek(week) {
    return this.#run(async () => {
      if (!Number.isInteger(week) || week < 1) throw new Error('Week must be an integer >= 1');
      if (!this.state.selectedTermId) throw new Error('No term selected');
      this.state.week = week;
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

  async createLesson(date, options = {}) {
    return this.#run(async () => {
      if (!this.state.selectedTermId) throw new Error('No term selected');
      const lesson = await this.viewModel.createLesson(this.state.selectedTermId, date, options);
      this.state.activeLessonId = lesson.id;
      return this.snapshot();
    });
  }

  async reviewItems(programmeItemIds) {
    return this.#run(async () => {
      if (!this.state.activeLessonId) throw new Error('No lesson selected');
      await this.viewModel.reviewLessonItems(this.state.activeLessonId, programmeItemIds);
      return this.snapshot();
    });
  }

  async completeItems(programmeItemIds) {
    return this.#run(async () => {
      await this.viewModel.completeProgrammeItems(programmeItemIds);
      await this.#reloadWeek();
      return this.snapshot();
    });
  }

  async carryForward(programmeItemId, targetWeek) {
    return this.#run(async () => {
      await this.viewModel.carryForward(programmeItemId, targetWeek);
      this.state.week = targetWeek;
      await this.#reloadWeek();
      return this.snapshot();
    });
  }

  async #loadSelectedTerm() {
    this.state.termContext = await this.viewModel.loadTerm(this.state.selectedTermId);
    await this.viewModel.teacherTerms.activateCard(this.state.selectedTermId);
    this.state.weekly = await this.viewModel.loadWeek(this.state.selectedTermId, this.state.week);
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
