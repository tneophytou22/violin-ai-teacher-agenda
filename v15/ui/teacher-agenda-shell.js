import { TeacherAgendaController } from './teacher-agenda-controller.js';

const esc = value => String(value ?? '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class TeacherAgendaShell {
  constructor({ controller, root, now = () => new Date().toISOString().slice(0, 10) }) {
    if (!controller || !(controller instanceof TeacherAgendaController)) throw new Error('TeacherAgendaShell requires TeacherAgendaController');
    if (!root) throw new Error('TeacherAgendaShell requires a root element');
    this.controller = controller;
    this.root = root;
    this.now = now;
    this.bound = false;
  }

  async start() {
    await this.controller.loadStudents();
    this.render();
    return this;
  }

  render() {
    const state = this.controller.snapshot();
    const student = state.students.find(s => s.id === state.selectedStudentId);
    const weekly = state.weekly;
    const items = weekly?.items ?? [];
    const grouped = ['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => ({
      domain,
      items: items.filter(i => i.curriculumDomain === domain),
    }));
    const lesson = state.activeLesson;
    const homeworkText = state.homework?.items?.map(item => item.text ?? item.title ?? '').join('\n') ?? '';

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
          <div data-view="student-create">
            <input data-action="new-student-name" placeholder="Student name" aria-label="New student name">
            <button type="button" data-action="create-student">New student</button>
          </div>
        </section>
        ${student ? `
          <section data-view="student-dashboard">
            <h2>${esc(student.name)}</h2>
            <fieldset data-view="current-term">
              <legend>Current term</legend>
              <select data-action="term" aria-label="Current term">
                ${state.terms.map(t => `<option value="${esc(t.id)}" ${t.id === state.selectedTermId ? 'selected' : ''}>${esc(t.name)} · L${t.level}T${t.termNumber}</option>`).join('')}
              </select>
              ${state.termContext ? `<div data-view="term-context"><strong>L${state.termContext.term.level} · Term ${state.termContext.term.termNumber}</strong><span> — ${esc(state.termContext.card.technicalIntent ?? '')}</span></div>` : ''}
            </fieldset>
            <fieldset data-view="term-create">
              <legend>Create new term</legend>
              <label>Term name <input data-action="new-term-name" placeholder="e.g. 2026–27 Term 1" aria-label="New term name"></label>
              <label>Level <select data-action="new-term-level" aria-label="New term level"><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option><option value="5">Level 5</option><option value="6">Level 6</option><option value="7">Level 7</option><option value="8">Level 8</option><option value="9">Level 9</option><option value="10">Level 10</option></select></label>
              <label>Term <select data-action="new-term-number" aria-label="New term number"><option value="1">Term 1</option><option value="2">Term 2</option></select></label>
              <label>Start date <input type="date" data-action="new-term-start" aria-label="New term start date"></label>
              <label>End date <input type="date" data-action="new-term-end" aria-label="New term end date"></label>
              <button type="button" data-action="create-term">Create term</button>
            </fieldset>
          </section>
          <section data-view="weekly-agenda">
            <div><button type="button" data-action="week-prev" ${state.week <= 1 ? 'disabled' : ''}>←</button> Week ${state.week} <button type="button" data-action="week-next">→</button></div>
            <p>${weekly ? `${weekly.summary.completed}/${weekly.summary.total} completed` : 'Loading week…'}</p>
            <div data-view="programme-actions">
              <button type="button" data-action="complete-selected" ${state.selectedItemIds.length ? '' : 'disabled'}>Complete selected</button>
              <button type="button" data-action="review" ${state.activeLessonId && state.selectedItemIds.length ? '' : 'disabled'}>Review selected (${state.selectedItemIds.length})</button>
            </div>
            ${grouped.map(group => `<section data-domain="${group.domain}"><h3>${group.domain.replace('_', ' ')}</h3><ul>${group.items.map(item => `<li><label><input type="checkbox" data-item="${esc(item.id)}" ${state.selectedItemIds.includes(item.id) ? 'checked' : ''}> ${esc(item.title)}${item.status === 'COMPLETED' ? ' <small>(completed)</small>' : ''}${state.reviewedItemIds.includes(item.id) ? ' <small>(reviewed)</small>' : ''}</label><button type="button" data-carry="${esc(item.id)}">Carry</button></li>`).join('')}</ul></section>`).join('')}
          </section>
          <section data-view="lesson">
            <h2>Lesson Session</h2>
            <button type="button" data-action="lesson">${state.activeLessonId ? 'Lesson active ✓' : 'Start lesson'}</button>
            ${lesson ? `
              <p data-view="lesson-status"><strong>${esc(lesson.date)}</strong> · ${esc(lesson.attendance)} · ${lesson.mark ?? 'No mark'} · ${state.reviewedItemIds.length} item(s) reviewed.</p>
              <div data-view="lesson-details">
                <label>Attendance
                  <select data-action="attendance">
                    ${['PRESENT','LATE','ABSENT'].map(value => `<option value="${value}" ${lesson.attendance === value ? 'selected' : ''}>${value}</option>`).join('')}
                  </select>
                </label>
                <label>Mark
                  <input type="number" min="1" max="20" data-action="mark" value="${lesson.mark ?? ''}" placeholder="1–20">
                </label>
                <button type="button" data-action="save-details">Save lesson details</button>
              </div>
              <div data-view="homework">
                <h3>Homework</h3>
                <textarea data-action="homework" rows="5" placeholder="One homework task per line">${esc(homeworkText)}</textarea>
                <button type="button" data-action="save-homework">Save homework</button>
                <p>${state.homework ? `${state.homework.items.length} homework item(s)` : 'No homework assigned yet.'}</p>
              </div>
            ` : '<p>Start a lesson to record attendance, mark, reviewed work and homework.</p>'}
          </section>

          <section data-view="lesson-history">
            <h2>Lesson History</h2>
            ${state.lessonHistory.length ? `<ul>${state.lessonHistory.map(entry => `<li><button type="button" data-action="select-lesson" data-lesson-id="${esc(entry.id)}">${esc(entry.date)} · ${esc(entry.attendance)} · ${entry.mark ?? 'No mark'} · ${(entry.reviewedProgrammeItemIds ?? []).length} reviewed</button></li>`).join('')}</ul>` : '<p>No lessons recorded for this term.</p>'}
          </section>
        ` : '<p>Select a student to begin.</p>'}
      </section>`;

    this.#bind();
  }

  #bind() {
    if (this.bound) return;
    this.bound = true;

    this.root.addEventListener('change', async event => {
      const target = event.target;
      try {
        if (target.matches('[data-action="student"]')) {
          await this.controller.selectStudent(target.value);
          this.render();
        } else if (target.matches('[data-action="term"]')) {
          await this.controller.selectTerm(target.value);
          this.render();
        } else if (target.matches('[data-item]')) {
          this.controller.toggleItemSelection(target.dataset.item);
          this.#refreshActionButtons();
        }
      } catch (error) {
        this.#showError(error);
      }
    });

    this.root.addEventListener('click', async event => {
      const target = event.target.closest?.('button');
      if (!target) return;
      try {
        const action = target.dataset.action;
        if (action === 'create-student') {
          const name = this.root.querySelector('[data-action="new-student-name"]')?.value?.trim() ?? '';
          await this.controller.createStudent({ name });
        } else if (action === 'create-term') {
          const name = this.root.querySelector('[data-action="new-term-name"]')?.value?.trim() ?? '';
          const level = Number(this.root.querySelector('[data-action="new-term-level"]')?.value);
          const termNumber = Number(this.root.querySelector('[data-action="new-term-number"]')?.value);
          const startDate = this.root.querySelector('[data-action="new-term-start"]')?.value ?? '';
          const endDate = this.root.querySelector('[data-action="new-term-end"]')?.value ?? '';
          await this.controller.createTerm({ name, level, termNumber, startDate, endDate });
        } else if (action === 'select-lesson') {
          await this.controller.selectLesson(target.dataset.lessonId);
        } else if (action === 'week-prev') {
          await this.controller.selectWeek(this.controller.snapshot().week - 1);
        } else if (action === 'week-next') {
          await this.controller.selectWeek(this.controller.snapshot().week + 1);
        } else if (action === 'lesson') {
          await this.controller.createLesson(this.now());
        } else if (action === 'review') {
          await this.controller.reviewItems(this.controller.snapshot().selectedItemIds);
        } else if (action === 'complete-selected') {
          await this.controller.completeItems(this.controller.snapshot().selectedItemIds);
        } else if (action === 'save-details') {
          const attendance = this.root.querySelector('[data-action="attendance"]')?.value ?? 'PRESENT';
          const rawMark = this.root.querySelector('[data-action="mark"]')?.value ?? '';
          const mark = rawMark === '' ? null : Number(rawMark);
          await this.controller.updateLessonDetails({ attendance, mark });
        } else if (action === 'save-homework') {
          const text = this.root.querySelector('[data-action="homework"]')?.value ?? '';
          const items = text.split('\n').map(value => value.trim()).filter(Boolean).map(value => ({ text: value, completed: false }));
          await this.controller.saveHomework(items);
        } else if (target.dataset.carry) {
          await this.controller.carryForward(target.dataset.carry, this.controller.snapshot().week + 1);
        } else {
          return;
        }
        this.render();
      } catch (error) {
        this.#showError(error);
      }
    });
  }

  #refreshActionButtons() {
    const state = this.controller.snapshot();
    const completeButton = this.root.querySelector('[data-action="complete-selected"]');
    const reviewButton = this.root.querySelector('[data-action="review"]');
    if (completeButton) completeButton.disabled = state.selectedItemIds.length === 0;
    if (reviewButton) {
      reviewButton.disabled = !state.activeLessonId || state.selectedItemIds.length === 0;
      reviewButton.textContent = `Review selected (${state.selectedItemIds.length})`;
    }
  }

  #showError(error) {
    this.controller.state.error = error instanceof Error ? error.message : String(error);
    this.render();
  }
}
