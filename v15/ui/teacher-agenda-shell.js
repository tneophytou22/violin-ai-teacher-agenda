import { TeacherAgendaController } from './teacher-agenda-controller.js';

const esc = value => String(value ?? '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));

export class TeacherAgendaShell {
  constructor({ controller, root, now = () => new Date().toISOString().slice(0, 10) }) {
    if (!controller || !(controller instanceof TeacherAgendaController)) throw new Error('TeacherAgendaShell requires TeacherAgendaController');
    if (!root) throw new Error('TeacherAgendaShell requires a root element');
    this.controller = controller;
    this.root = root;
    this.now = now;
  }

  async start() {
    await this.controller.loadStudents();
    this.render();
    return this;
  }

  render() {
    const state = this.controller.snapshot();
    const student = state.students.find(s => s.id === state.selectedStudentId);
    const term = state.terms.find(t => t.id === state.selectedTermId);
    const weekly = state.weekly;
    const items = weekly?.items ?? [];
    const grouped = ['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => ({ domain, items: items.filter(i => i.curriculumDomain === domain) }));

    this.root.innerHTML = `
      <section data-v15="teacher-agenda" aria-busy="${state.loading}">
        <header><h1>Teacher Agenda</h1><p>V15 · TKTL-driven weekly teaching workspace</p></header>
        ${state.error ? `<div role="alert">${esc(state.error)}</div>` : ''}
        <section data-view="students">
          <h2>Students</h2>
          <select data-action="student" aria-label="Student">
            <option value="">Select student</option>
            ${state.students.map(s => `<option value="${esc(s.id)}" ${s.id === state.selectedStudentId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
          </select>
        </section>
        ${student ? `
          <section data-view="student-dashboard">
            <h2>${esc(student.name)}</h2>
            <select data-action="term" aria-label="Term">
              ${state.terms.map(t => `<option value="${esc(t.id)}" ${t.id === state.selectedTermId ? 'selected' : ''}>${esc(t.name)} · L${t.level}T${t.termNumber}</option>`).join('')}
            </select>
          </section>
          ${state.termContext ? `<section data-view="term-context"><strong>L${state.termContext.term.level} · Term ${state.termContext.term.termNumber}</strong><span> ${esc(state.termContext.card.technicalIntent ?? '')}</span></section>` : ''}
          <section data-view="weekly-agenda">
            <div><button data-action="week-prev" ${state.week <= 1 ? 'disabled' : ''}>←</button> Week ${state.week} <button data-action="week-next">→</button></div>
            <p>${weekly ? `${weekly.summary.completed}/${weekly.summary.total} completed` : 'Loading week…'}</p>
            <div data-view="programme-actions">
              <button data-action="complete-selected" ${state.selectedItemIds.length ? '' : 'disabled'}>Complete selected</button>
              <button data-action="review" ${state.activeLessonId && state.selectedItemIds.length ? '' : 'disabled'}>Review selected (${state.selectedItemIds.length})</button>
            </div>
            ${grouped.map(group => `<section data-domain="${group.domain}"><h3>${group.domain.replace('_', ' ')}</h3><ul>${group.items.map(item => `<li><label><input type="checkbox" data-item="${esc(item.id)}" ${state.selectedItemIds.includes(item.id) ? 'checked' : ''}> ${esc(item.title)}${item.status === 'COMPLETED' ? ' <small>(completed)</small>' : ''}${state.reviewedItemIds.includes(item.id) ? ' <small>(reviewed)</small>' : ''}</label><button data-carry="${esc(item.id)}">Carry</button></li>`).join('')}</ul></section>`).join('')}
          </section>
          <section data-view="lesson">
            <button data-action="lesson">${state.activeLessonId ? 'Lesson active ✓' : 'Start lesson'}</button>
            ${state.activeLessonId ? `<p data-view="lesson-status">Lesson is active. ${state.reviewedItemIds.length} item(s) reviewed.</p>` : '<p>Start a lesson to record what you work on today.</p>'}
          </section>
        ` : '<p>Select a student to begin.</p>'}
      </section>`;

    this.#bind();
  }

  #bind() {
    const find = selector => this.root.querySelector(selector);
    find('[data-action="student"]')?.addEventListener('change', async e => { await this.controller.selectStudent(e.target.value); this.render(); });
    find('[data-action="term"]')?.addEventListener('change', async e => { await this.controller.selectTerm(e.target.value); this.render(); });
    find('[data-action="week-prev"]')?.addEventListener('click', async () => { await this.controller.selectWeek(this.controller.snapshot().week - 1); this.render(); });
    find('[data-action="week-next"]')?.addEventListener('click', async () => { await this.controller.selectWeek(this.controller.snapshot().week + 1); this.render(); });
    find('[data-action="lesson"]')?.addEventListener('click', async () => { await this.controller.createLesson(this.now()); this.render(); });
    find('[data-action="review"]')?.addEventListener('click', async () => { await this.controller.reviewItems(this.controller.snapshot().selectedItemIds); this.render(); });
    find('[data-action="complete-selected"]')?.addEventListener('click', async () => { await this.controller.completeItems(this.controller.snapshot().selectedItemIds); this.render(); });
    this.root.querySelectorAll('[data-item]').forEach(input => input.addEventListener('change', e => {
      this.controller.toggleItemSelection(e.target.dataset.item);
      const state = this.controller.snapshot();
      const completeButton = find('[data-action="complete-selected"]');
      const reviewButton = find('[data-action="review"]');
      if (completeButton) completeButton.disabled = state.selectedItemIds.length === 0;
      if (reviewButton) {
        reviewButton.disabled = !state.activeLessonId || state.selectedItemIds.length === 0;
        reviewButton.textContent = `Review selected (${state.selectedItemIds.length})`;
      }
    }));
    this.root.querySelectorAll('[data-carry]').forEach(button => button.addEventListener('click', async e => { await this.controller.carryForward(e.target.dataset.carry, this.controller.snapshot().week + 1); this.render(); }));
  }
}
