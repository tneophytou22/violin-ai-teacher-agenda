import { renderTeacherAgenda } from './teacher-agenda-view.js';

export class TeacherAgendaApp {
  constructor({ controller, root, today = () => new Date().toISOString().slice(0, 10), prompt = globalThis.prompt }) {
    if (!controller) throw new Error('TeacherAgendaApp requires a controller');
    if (!root) throw new Error('TeacherAgendaApp requires a root element');
    this.controller = controller;
    this.root = root;
    this.today = today;
    this.prompt = prompt;
    this.#onChange = this.#onChange.bind(this);
  }

  async start() {
    this.root.addEventListener('change', this.#onChange);
    this.root.addEventListener('click', this.#onClick);
    await this.controller.loadStudents();
    this.render();
    return this.controller.snapshot();
  }

  destroy() {
    this.root.removeEventListener('change', this.#onChange);
    this.root.removeEventListener('click', this.#onClick);
  }

  render() {
    this.root.innerHTML = renderTeacherAgenda(this.controller.snapshot());
  }

  async #onChange(event) {
    const action = event.target?.dataset?.action;
    try {
      if (action === 'student') await this.controller.selectStudent(event.target.value);
      if (action === 'term') await this.controller.selectTerm(event.target.value);
      if (action === 'week') await this.controller.selectWeek(Number(event.target.value));
      this.render();
    } catch (error) {
      this.render();
    }
  }

  async #onClick(event) {
    const action = event.target?.dataset?.action;
    try {
      if (action === 'new-lesson') {
        const date = this.prompt?.('Lesson date (YYYY-MM-DD):', this.today());
        if (date) await this.controller.createLesson(date);
      } else if (action === 'review') {
        const ids = [...this.root.querySelectorAll('[data-action="select-item"]:checked')].map(input => input.value);
        await this.controller.reviewItems(ids);
      } else if (action === 'complete') {
        await this.controller.completeItems([event.target.dataset.itemId]);
      } else if (action === 'carry') {
        const targetWeek = Number(this.prompt?.('Carry to week:', String(this.controller.snapshot().week + 1)));
        if (Number.isInteger(targetWeek) && targetWeek >= 1) await this.controller.carryForward(event.target.dataset.itemId, targetWeek);
      }
      this.render();
    } catch (error) {
      this.render();
    }
  }
}
