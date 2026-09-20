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
            <div data-view="term-overview-grid">
            <fieldset data-view="current-term">
              <legend>Current term</legend>
              <select data-action="term" aria-label="Current term">
                ${state.terms.map(t => `<option value="${esc(t.id)}" ${t.id === state.selectedTermId ? 'selected' : ''}>${esc(t.name)} · L${t.level}T${t.termNumber}</option>`).join('')}
              </select>
              ${state.termContext ? `<div data-view="term-context"><strong>L${state.termContext.term.level} · Term ${state.termContext.term.termNumber}</strong><span> — ${esc(state.termContext.card.technicalIntent ?? '')}</span></div>` : ''}
              ${state.termContext?.scales ? `<section data-view="scales-curriculum"><h3>SCALES CURRICULUM · L${state.termContext.term.level}T${state.termContext.term.termNumber}</h3><div data-view="scale-requirements"><div><strong>Major:</strong> ${esc((state.termContext.scales.major ?? []).join(' · ') || '—')}</div><div><strong>Minor:</strong> ${esc((state.termContext.scales.minor ?? []).join(' · ') || '—')}</div><div><strong>Arpeggios:</strong> ${esc((state.termContext.scales.arpeggios ?? []).join(' · ') || '—')}</div><div><strong>Dominant 7th:</strong> ${esc((state.termContext.scales.dominant7 ?? []).join(' · ') || '—')}</div><div><strong>Diminished 7th:</strong> ${esc((state.termContext.scales.diminished7 ?? []).join(' · ') || '—')}</div><div><strong>Chromatic:</strong> ${esc((state.termContext.scales.chromatic ?? []).join(' · ') || '—')}</div><div><strong>Double Stops:</strong> ${esc((state.termContext.scales.doubleStops ?? []).join(' · ') || '—')}</div><div><strong>One String:</strong> ${esc((state.termContext.scales.oneString ?? []).join(' · ') || '—')}</div><div><strong>Positions:</strong> ${esc(state.termContext.scales.positions ?? '—')} · <strong>Tempo:</strong> ${esc(state.termContext.scales.tempo ?? '—')}</div><div><strong>Objective:</strong> ${esc(state.termContext.scales.objective ?? '—')}</div><div><strong>Mastery:</strong> ${esc(state.termContext.scales.mastery ?? '—')}</div></section>` : ''}
              ${state.termProgress ? `<div data-view="term-progress"><strong>Term progress: ${state.termProgress.completed}/${state.termProgress.total}</strong><div>${['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => { const summary = state.termProgress.byDomain?.[domain] ?? { completed: 0, total: 0 }; return `<span>${domain.replace('_', ' ')} ${summary.completed}/${summary.total}</span>`; }).join('')}</div></div>` : ''}
            </fieldset>
            ${state.scaleProgress ? '<section data-view="scale-progress" aria-label="Scale Progress and Mastery"><div data-view="scale-progress-header"><div><h2>Scale Progress / Mastery</h2><p>' + state.scaleProgress.completed + '/' + state.scaleProgress.total + ' completed · ' + state.scaleProgress.masteryPercent + '% assessed mastery</p></div><strong data-view="scale-mastery">' + state.scaleProgress.masteryPercent + '%</strong></div><div data-view="scale-category-list">' + Object.entries(state.scaleProgress.byCategory).map(([category, summary]) => '<div data-scale-category><div><strong>' + esc(category) + '</strong><span>' + summary.completed + '/' + summary.total + ' · ' + summary.masteryPercent + '%</span></div><progress max="100" value="' + summary.masteryPercent + '"></progress></div>').join('') + '</div><div data-view="scale-progress-footer"><span>Mastery: Developing 40 · Secure 75 · Performance Ready 100</span><span>Mastery is teacher-assessed; completion is tracked separately.</span></div></section>' : ''}
            </div>
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
            ${weekly ? `<div data-view="weekly-summary" aria-label="Weekly progress">
              <strong>${weekly.summary.completed}/${weekly.summary.total} completed</strong>
              <span> · ${state.selectedItemIds.length} selected</span>
              <div data-view="domain-progress">
                ${['SCALES', 'PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => {
                  const summary = weekly.summary.byDomain?.[domain] ?? { completed: 0, total: 0 };
                  return `<span>${domain.replace('_', ' ')} ${summary.completed}/${summary.total}</span>`;
                }).join('')}
              </div>
            </div>` : '<p>Loading week…</p>'}
            <div data-view="programme-actions">
              <button type="button" data-action="complete-selected" ${state.selectedItemIds.length ? '' : 'disabled'}>Complete selected</button>
              <button type="button" data-action="review" ${state.activeLessonId && state.selectedItemIds.length ? '' : 'disabled'}>Review selected (${state.selectedItemIds.length})</button>
            </div>
            ${grouped.map(group => `<section data-domain="${group.domain}"><h3>${group.domain.replace('_', ' ')}</h3><ul>${group.items.map(item => `<li><label><input type="checkbox" data-item="${esc(item.id)}" ${state.selectedItemIds.includes(item.id) ? 'checked' : ''}> ${esc(item.title)}${item.status === 'COMPLETED' ? ' <small>(completed)</small>' : ''}${state.reviewedItemIds.includes(item.id) ? ' <small>(reviewed)</small>' : ''}</label><button type="button" data-carry="${esc(item.id)}" ${item.status === 'COMPLETED' ? 'disabled' : ''}>${item.status === 'COMPLETED' ? 'Completed' : 'Carry to next week'}</button></li>`).join('')}</ul></section>`).join('')}
            ${weekly?.items?.some(item => item.curriculumDomain === 'SCALES') ? `<section data-domain="SCALES"><h3>Scales · Mastery Assessment</h3><ul>${weekly.items.filter(item => item.curriculumDomain === 'SCALES').map(item => { const mastery = item.details?.mastery ?? {}; const status = mastery.status ?? 'NOT_STARTED'; return `<li data-scale-item><div><strong>${esc(item.title)}</strong><small> · ${esc(item.details?.category ?? 'Other')} · ${status.replaceAll('_', ' ')}</small></div><div data-view="scale-assessment-row"><select data-scale-status="${esc(item.id)}" aria-label="Mastery status for ${esc(item.title)}">${['NOT_STARTED','DEVELOPING','SECURE','PERFORMANCE_READY'].map(value => `<option value="${value}" ${status === value ? 'selected' : ''}>${value.replaceAll('_', ' ')}</option>`).join('')}</select><input type="number" min="1" max="300" data-scale-current-tempo="${esc(item.id)}" value="${mastery.currentTempo ?? ''}" placeholder="Current bpm" aria-label="Current tempo"><input type="number" min="1" max="300" data-scale-target-tempo="${esc(item.id)}" value="${mastery.targetTempo ?? ''}" placeholder="Target bpm" aria-label="Target tempo"><button type="button" data-action="assess-scale" data-scale-id="${esc(item.id)}">Save assessment</button></div></li>`; }).join('')}</ul></section>` : ''}
          </section>
          <section data-view="lesson">
            <h2>Lesson Session</h2>
            <button type="button" data-action="lesson">${state.activeLessonId ? 'Lesson active ✓' : `Start lesson · ${this.now()}`}</button>
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
        } else if (action === 'assess-scale') {
          const id = target.dataset.scaleId;
          const status = this.root.querySelector(`[data-scale-status="${id}"]`)?.value ?? 'NOT_STARTED';
          const currentTempoRaw = this.root.querySelector(`[data-scale-current-tempo="${id}"]`)?.value ?? '';
          const targetTempoRaw = this.root.querySelector(`[data-scale-target-tempo="${id}"]`)?.value ?? '';
          await this.controller.assessScale(id, {
            status,
            currentTempo: currentTempoRaw === '' ? null : Number(currentTempoRaw),
            targetTempo: targetTempoRaw === '' ? null : Number(targetTempoRaw),
          });
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
