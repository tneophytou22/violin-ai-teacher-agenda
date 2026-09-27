import { TeacherAgendaController, localDateString } from './teacher-agenda-controller.js';
import { generateViberHomeworkMessage, generateParentHomeworkMessage } from '../services/homework-messages.js';

const esc = value => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const homeworkItemsFromText = (text, existingItems = []) => {
  const lines = String(text ?? '').split('\n').map(value => value.trim()).filter(Boolean);
  const unused = new Set(existingItems.map((_, index) => index));
  return lines.map((line, lineIndex) => {
    const exactIndex = existingItems.findIndex((item, index) => unused.has(index) && String(item?.title ?? item?.text ?? '').trim() === line);
    const sourceIndex = exactIndex >= 0 ? exactIndex : (unused.has(lineIndex) ? lineIndex : -1);
    if (sourceIndex < 0) return { text: line, completed: false };
    unused.delete(sourceIndex);
    const source = { ...existingItems[sourceIndex], completed: false };
    if (Object.prototype.hasOwnProperty.call(source, 'title')) source.title = line;
    else source.text = line;
    return source;
  });
};

export class TeacherAgendaShell {
  constructor({ controller, root, now = localDateString }) {
    if (!controller || !(controller instanceof TeacherAgendaController)) throw new Error('TeacherAgendaShell requires TeacherAgendaController');
    if (!root) throw new Error('TeacherAgendaShell requires a root element');
    this.controller = controller;
    this.root = root;
    this.now = now;
    this.bound = false;
  }

  async start() {
    try {
      await this.controller.loadStudents();
    } catch (error) {
      this.#showError();
      return this;
    }
    this.render();
    return this;
  }

  render() {
    const state = this.controller.snapshot();
    const student = state.students.find(s => s.id === state.selectedStudentId);
    const weekly = state.weekly;
    const items = weekly?.items ?? [];
    const pendingCoreCount = items.filter(item => item.curriculumDomain !== 'SCALES' && item.status !== 'COMPLETED').length;
    const grouped = ['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => ({
      domain,
      items: items.filter(i => i.curriculumDomain === domain),
    }));
    const lesson = state.activeLesson;
    const homeworkItems = state.homeworkDraftItems ?? state.homework?.items ?? [];
    const homeworkText = homeworkItems.map(item => item.text ?? item.title ?? '').join('\n');
    const practicePlan = state.practicePlanDraft;
    const viberMessage = student ? generateViberHomeworkMessage({ studentName: student.name, level: state.termContext?.term?.level, termNumber: state.termContext?.term?.termNumber, items: homeworkItems, practicePlan }) : '';
    const parentMessage = student ? generateParentHomeworkMessage({ studentName: student.name, level: state.termContext?.term?.level, items: homeworkItems, practicePlan }) : '';
    const scaleProgressMarkup = state.scaleProgress ? '<section id="scale-progress" data-view="scale-progress" aria-label="Scale Progress and Mastery"><div data-view="scale-progress-header"><div><h2>Scale Progress / Mastery</h2><p>' + state.scaleProgress.completed + '/' + state.scaleProgress.total + ' completed · ' + state.scaleProgress.masteryPercent + '% assessed mastery</p></div><strong data-view="scale-mastery">' + state.scaleProgress.masteryPercent + '%</strong></div><div data-view="scale-category-list">' + Object.entries(state.scaleProgress.byCategory).map(([category, summary]) => '<div data-scale-category><div data-view="scale-category-heading"><strong>' + esc(category) + '</strong><span>' + summary.completed + '/' + summary.total + '</span></div><div data-view="scale-category-track"><progress max="100" value="' + summary.masteryPercent + '"></progress><span>' + summary.masteryPercent + '%</span></div></div>').join('') + '</div><div data-view="scale-progress-footer"><span>Mastery: Developing 40 · Secure 75 · Performance Ready 100</span><span>Mastery is teacher-assessed; completion is tracked separately.</span></div></section>' : '';

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
            <button type="button" data-action="open-new-student">+ New student</button>
          </div>
          <dialog data-view="new-student-dialog" aria-labelledby="new-student-title">
            <form method="dialog" data-view="new-student-form">
              <div data-view="new-student-header">
                <div><h2 id="new-student-title">New Student</h2><p>Create the student profile and, if known, the first term.</p></div>
                <button type="button" data-action="close-new-student" aria-label="Close">×</button>
              </div>
              <div data-view="new-student-grid">
                <label>Full name *
                  <input data-action="new-student-name" required placeholder="Student name">
                </label>
                <label>Phone
                  <input data-action="new-student-phone" type="tel" placeholder="+357 …">
                </label>
                <label>School type
                  <select data-action="new-student-school-type">
                    <option value="PRIVATE">Private</option>
                    <option value="MUSIC_SCHOOL">Music School</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label>School / Music School
                  <input data-action="new-student-school-name" placeholder="School name">
                </label>
                <label>Instrument
                  <select data-action="new-student-instrument">
                    <option value="VIOLIN">Violin</option>
                    <option value="VIOLA">Viola</option>
                    <option value="CELLO">Cello</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label>Level
                  <select data-action="new-student-level">
                    <option value="">Not set yet</option>
                    <option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option><option value="5">Level 5</option><option value="6">Level 6</option><option value="7">Level 7</option><option value="8">Level 8</option><option value="9">Level 9</option><option value="10">Level 10</option>
                  </select>
                </label>
                <label>Term
                  <select data-action="new-student-term-number">
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                  </select>
                </label>
                <label>Term name
                  <input data-action="new-student-term-name" value="Term 1" placeholder="e.g. 2026–27 Term 1">
                </label>
                <label>Start date
                  <input data-action="new-student-term-start" type="date">
                </label>
                <label>End date
                  <input data-action="new-student-term-end" type="date">
                </label>
              </div>
              <div data-view="new-student-actions">
                <button type="button" data-action="close-new-student">Cancel</button>
                <button type="button" data-action="create-student" class="primary">Create student</button>
              </div>
            </form>
          </dialog>
        </section>
        ${student ? `
          <section data-view="student-dashboard">
            <div data-view="student-identity"><div data-view="student-avatar" aria-hidden="true">${esc(student.name.slice(0, 2).toUpperCase())}</div><div><h2>${esc(student.name)}</h2><p>${state.termContext ? `Level ${esc(state.termContext.term.level)} · Term ${esc(state.termContext.term.termNumber)}` : 'Select a term'}</p></div></div>
            <nav data-view="dashboard-tabs" aria-label="Agenda sections"><a href="#weekly-agenda">Week View</a><a href="#scale-progress">Scales</a><a href="#student-intelligence">Progress</a><a href="#lesson-history">History</a><a href="#current-term">Term Details</a></nav>
            <section data-view="lesson-dashboard" aria-label="Lesson dashboard">
              <div data-lesson-dashboard-card>
                <strong>Week ${state.week}</strong>
                <span>${weekly ? `${weekly.summary.completed}/${weekly.summary.total} completed` : 'Loading week…'}</span>
              </div>
              <div data-lesson-dashboard-card>
                <strong>Term progress</strong>
                <span>${state.termProgress ? `${state.termProgress.completed}/${state.termProgress.total} core items` : 'Loading…'}</span>
              </div>
              <div data-lesson-dashboard-card>
                <strong>Scale mastery</strong>
                <span>${state.scaleProgress ? `${state.scaleProgress.masteryPercent}% assessed · ${state.scaleProgress.completed}/${state.scaleProgress.total} completed` : 'Loading…'}</span>
              </div>
              <div data-lesson-dashboard-card>
                <strong>Lesson</strong>
                <span>${lesson ? `${esc(lesson.date)} · ${esc(lesson.attendance)} · ${lesson.mark ?? 'No mark'} · ${state.reviewedItemIds.length} reviewed` : 'No lesson started'}</span>
              </div>
            </section>
          <section data-view="agenda-workspace" aria-label="Weekly teaching workspace">
            <div data-view="weekly-column">
<section id="weekly-agenda" data-view="weekly-agenda">
            <h2>Weekly Agenda</h2>
            <div><button type="button" data-action="week-prev" ${state.week <= 1 ? 'disabled' : ''}>←</button> Week ${state.week} <button type="button" data-action="week-next">→</button></div>
            ${weekly ? `<div data-view="weekly-summary" aria-label="Weekly progress">
              <strong>${weekly.summary.completed}/${weekly.summary.total} completed</strong>
              <span data-view="weekly-selection-count"> · ${Math.max(weekly.summary.total - weekly.summary.completed, 0)} pending · ${state.selectedItemIds.length} selected</span>
              <div data-view="domain-progress">
                ${['SCALES', 'PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => {
                  const summary = weekly.summary.byDomain?.[domain] ?? { completed: 0, total: 0 };
                  return `<span>${domain.replace('_', ' ')} ${summary.completed}/${summary.total}</span>`;
                }).join('')}
              </div>
            </div>` : '<p>Loading week…</p>'}
            <div data-view="programme-actions">
              <button type="button" data-action="select-all-pending" ${pendingCoreCount ? '' : 'disabled'}>Select all pending core (${pendingCoreCount})</button>
              <button type="button" data-action="clear-selection" ${state.selectedItemIds.length ? '' : 'disabled'}>Clear selection (${state.selectedItemIds.length})</button>
              <button type="button" data-action="complete-selected" ${state.selectedItemIds.length ? '' : 'disabled'}>Complete selected (${state.selectedItemIds.length})</button>
              <button type="button" data-action="review" ${state.activeLessonId && state.selectedItemIds.length ? '' : 'disabled'}>Review selected (${state.selectedItemIds.length})</button>
              ${!state.activeLessonId ? '<span data-view="lesson-action-hint">Start a lesson below to enable Review selected.</span>' : `<span data-view="lesson-action-hint">Review records lesson activity; Complete selected updates progress.</span><span data-view="lesson-action-status" aria-live="polite">Lesson activity: ${state.reviewedItemIds.length} reviewed</span>`}
            </div>
            ${grouped.map(group => `<section data-domain="${group.domain}"><div data-view="domain-heading"><h3>${group.domain.replace('_', ' ')}</h3><span data-view="domain-count">${group.items.filter(item => item.status === 'COMPLETED').length}/${group.items.length}</span></div><div data-view="domain-bar" aria-hidden="true"><span style="width:${group.items.length ? Math.round((group.items.filter(item => item.status === 'COMPLETED').length / group.items.length) * 100) : 0}%"></span></div><ul>${group.items.map(item => { const completed = item.status === 'COMPLETED'; const reviewed = state.reviewedItemIds.includes(item.id); return `<li data-status="${completed ? 'completed' : 'planned'}" data-reviewed="${reviewed}"><div data-view="programme-item-main"><label><input type="checkbox" data-item="${esc(item.id)}" ${state.selectedItemIds.includes(item.id) ? 'checked' : ''} ${completed ? 'disabled' : ''}><span data-view="programme-item-title">${esc(item.title)}</span></label><div data-view="programme-item-meta">${completed ? '<span data-status-chip="completed">Completed</span>' : '<span data-status-chip="planned">Planned</span>'}${reviewed ? '<span data-status-chip="reviewed">Reviewed</span>' : ''}</div></div><div data-view="programme-item-actions"><button type="button" ${completed ? `data-uncomplete="${esc(item.id)}"` : `data-carry="${esc(item.id)}"`} title="${completed ? 'Return item to planned status' : `Carry this item to Week ${state.week + 1}`}">${completed ? 'Uncomplete' : `Carry to Week ${state.week + 1}`}</button></div></li>`; }).join('')}</ul></section>`).join('')}            ${weekly?.items?.some(item => item.curriculumDomain === 'SCALES') ? `<details data-domain="SCALES"><summary>Scales · Mastery Assessment</summary><ul>${weekly.items.filter(item => item.curriculumDomain === 'SCALES').map(item => { const mastery = item.details?.mastery ?? {}; const status = mastery.status ?? 'NOT_STARTED'; return `<li data-scale-item><div><strong>${esc(item.title)}</strong><small> · ${esc(item.details?.category ?? 'Other')} · ${esc(status).replaceAll('_', ' ')}</small></div><div data-view="scale-assessment-row"><select data-scale-status="${esc(item.id)}" aria-label="Mastery status for ${esc(item.title)}">${['NOT_STARTED','DEVELOPING','SECURE','PERFORMANCE_READY'].map(value => `<option value="${value}" ${status === value ? 'selected' : ''}>${value.replaceAll('_', ' ')}</option>`).join('')}</select><input type="number" min="1" max="300" data-scale-current-tempo="${esc(item.id)}" value="${esc(mastery.currentTempo ?? '')}" placeholder="Current bpm" aria-label="Current tempo"><input type="number" min="1" max="300" data-scale-target-tempo="${esc(item.id)}" value="${esc(mastery.targetTempo ?? '')}" placeholder="Target bpm" aria-label="Target tempo"><select data-scale-intonation="${esc(item.id)}" aria-label="Intonation"><option value="">Intonation</option><option value="DEVELOPING" ${mastery.intonation === 'DEVELOPING' ? 'selected' : ''}>Intonation · Developing</option><option value="SECURE" ${mastery.intonation === 'SECURE' ? 'selected' : ''}>Intonation · Secure</option></select><select data-scale-bow="${esc(item.id)}" aria-label="Bow control"><option value="">Bow control</option><option value="DEVELOPING" ${mastery.bowControl === 'DEVELOPING' ? 'selected' : ''}>Bow · Developing</option><option value="SECURE" ${mastery.bowControl === 'SECURE' ? 'selected' : ''}>Bow · Secure</option></select><select data-scale-consistency="${esc(item.id)}" aria-label="Consistency"><option value="">Consistency</option><option value="DEVELOPING" ${mastery.consistency === 'DEVELOPING' ? 'selected' : ''}>Consistency · Developing</option><option value="SECURE" ${mastery.consistency === 'SECURE' ? 'selected' : ''}>Consistency · Secure</option></select><input type="text" data-scale-note="${esc(item.id)}" value="${esc(mastery.note ?? '')}" placeholder="Teacher note" aria-label="Teacher note"><button type="button" data-action="assess-scale" data-scale-id="${esc(item.id)}">Save assessment</button></div></li>`; }).join('')}</ul></details>` : ''}
          </section>
            </div>
            <aside data-view="agenda-side-rail" aria-label="Lesson and scale summary">
              <div data-view="lesson-column">
<section data-view="lesson">
  <h2>Lesson Session</h2>
  <button type="button" data-action="lesson" ${state.activeLessonId ? 'disabled' : ''}>${state.activeLessonId ? 'Lesson active ✓' : `Start lesson · ${this.now()}`}</button>
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
      <label>Teacher note
        <textarea data-action="teacher-note" rows="4" placeholder="Lesson observations, technical notes, next focus…">${esc(lesson.teacherNote ?? '')}</textarea>
      </label>
      <button type="button" data-action="save-details">Save lesson details</button>
    </div>
    <div data-view="homework" aria-label="Homework workspace">
      <div data-view="homework-header">
        <div><h3>Homework Workspace</h3><p>Teacher-selected work → focused home-practice plan.</p></div>
        <span data-view="homework-count">${homeworkItems.length} task(s)</span>
      </div>
      <textarea data-action="homework" rows="4" placeholder="One homework task per line">${esc(homeworkText)}</textarea>
      <div data-view="homework-actions">
        <button type="button" data-action="add-selected-to-homework" ${state.selectedItemIds.length ? '' : 'disabled'}>Add selected work</button>
        <button type="button" data-action="generate-practice-plan" ${homeworkText.trim() ? '' : 'disabled'}>Create Practice Plan</button>
        <button type="button" data-action="save-homework" ${homeworkItems.length ? '' : 'disabled'}>Save Homework</button>
      </div>
      ${practicePlan ? `
        <div data-view="practice-plan" aria-label="Practice Plan">
          <div data-view="practice-plan-header"><div><strong>Practice Plan</strong><span>Planner V1 · teacher approval required</span></div><strong>${practicePlan.totalMinutes} min</strong></div>
          <div data-view="practice-plan-tasks">
            ${practicePlan.tasks.map((task, index) => {
              const item = homeworkItems[task.homeworkItemIndex] ?? {};
              return `<article data-view="practice-task"><div data-view="practice-task-title"><span>${index + 1}</span><strong>${esc(item.text ?? item.title ?? 'Homework task')}</strong></div><label>Min <input type="number" min="0" max="180" data-plan-minutes="${index}" value="${esc(task.minutes)}" aria-label="Minutes for task ${index + 1}"></label><label>Focus <input type="text" data-plan-focus="${index}" value="${esc(task.focus)}" aria-label="Practice focus for task ${index + 1}"></label></article>`;
            }).join('')}
          </div>
          <p data-view="practice-plan-note">The planner organises how to practise teacher-selected material; it does not change curriculum or progression.</p>
        </div>
      ` : `<div data-view="practice-plan-empty"><strong>No practice plan yet.</strong><span>Create one after entering the tasks you want the student to practise.</span></div>`}
      ${homeworkItems.length ? `<details data-view="homework-communication"><summary>Communication · Viber / Parent</summary><div data-view="message-preview"><strong>Viber</strong><pre>${esc(viberMessage)}</pre><button type="button" data-action="copy-viber">Copy Viber Message</button></div><div data-view="message-preview"><strong>Parent support</strong><pre>${esc(parentMessage)}</pre><button type="button" data-action="copy-parent">Copy Parent Message</button></div><p>Messages are generated from the saved Homework + Practice Plan. V15 does not send Viber automatically.</p></details>` : ''}
    </div>
  ` : '<p>Start a lesson to record attendance, mark, reviewed work and homework.</p>'}
</section>
              </div>
              ${scaleProgressMarkup}
            </aside>
          </section>
<section data-view="term-and-context" aria-label="Current term and context">
            <fieldset id="current-term" data-view="current-term">
              <legend>Current term</legend>
              <select data-action="term" aria-label="Current term">
                ${state.terms.map(t => `<option value="${esc(t.id)}" ${t.id === state.selectedTermId ? 'selected' : ''}>${esc(t.name)} · L${t.level}T${t.termNumber}</option>`).join('')}
              </select>
              ${state.termContext ? `<div data-view="term-context"><strong>L${state.termContext.term.level} · Term ${state.termContext.term.termNumber}</strong><span> — ${esc(state.termContext.card.technicalIntent ?? '')}</span></div>` : ''}
              ${state.termContext?.scales ? `<details data-view="scales-curriculum"><summary>Scales curriculum · L${state.termContext.term.level}T${state.termContext.term.termNumber}</summary><div data-view="scale-requirements"><div><strong>Major:</strong> ${esc((state.termContext.scales.major ?? []).join(' · ') || '—')}</div><div><strong>Minor:</strong> ${esc((state.termContext.scales.minor ?? []).join(' · ') || '—')}</div><div><strong>Arpeggios:</strong> ${esc((state.termContext.scales.arpeggios ?? []).join(' · ') || '—')}</div><div><strong>Dominant 7th:</strong> ${esc((state.termContext.scales.dominant7 ?? []).join(' · ') || '—')}</div><div><strong>Diminished 7th:</strong> ${esc((state.termContext.scales.diminished7 ?? []).join(' · ') || '—')}</div><div><strong>Chromatic:</strong> ${esc((state.termContext.scales.chromatic ?? []).join(' · ') || '—')}</div><div><strong>Double Stops:</strong> ${esc((state.termContext.scales.doubleStops ?? []).join(' · ') || '—')}</div><div><strong>One String:</strong> ${esc((state.termContext.scales.oneString ?? []).join(' · ') || '—')}</div><div><strong>Positions:</strong> ${esc(state.termContext.scales.positions ?? '—')} · <strong>Tempo:</strong> ${esc(state.termContext.scales.tempo ?? '—')}</div><div><strong>Objective:</strong> ${esc(state.termContext.scales.objective ?? '—')}</div><div><strong>Mastery:</strong> ${esc(state.termContext.scales.mastery ?? '—')}</div></div></details>` : ''}
              ${state.termProgress ? `<div data-view="term-progress"><strong>Term progress: ${state.termProgress.completed}/${state.termProgress.total}</strong><div>${['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => { const summary = state.termProgress.byDomain?.[domain] ?? { completed: 0, total: 0 }; return `<span>${domain.replace('_', ' ')} ${summary.completed}/${summary.total}</span>`; }).join('')}</div></div>` : ''}
            </fieldset>
            <details data-view="term-create"><summary>Create new term</summary><fieldset>
              <legend>Create new term</legend>
              <label>Term name <input data-action="new-term-name" placeholder="e.g. 2026–27 Term 1" aria-label="New term name"></label>
              <label>Level <select data-action="new-term-level" aria-label="New term level"><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option><option value="5">Level 5</option><option value="6">Level 6</option><option value="7">Level 7</option><option value="8">Level 8</option><option value="9">Level 9</option><option value="10">Level 10</option></select></label>
              <label>Term <select data-action="new-term-number" aria-label="New term number"><option value="1">Term 1</option><option value="2">Term 2</option></select></label>
              <label>Start date <input type="date" data-action="new-term-start" aria-label="New term start date"></label>
              <label>End date <input type="date" data-action="new-term-end" aria-label="New term end date"></label>
              <button type="button" data-action="create-term">Create term</button>
            </fieldset></details>
</section>
            ${state.studentIntelligence ? (() => {
              const profile = state.studentIntelligence;
              const current = profile.termProfiles.find(entry => entry.term.id === state.selectedTermId) ?? profile.termProfiles.at(-1);
              if (!current) return '';
              const programme = current.programme;
              const domainSummary = ['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => {
                const summary = programme[domain] ?? { total: 0, completed: 0, reviewed: 0 };
                return `<span>${domain.replace('_', ' ')} ${summary.completed}/${summary.total} completed · ${summary.reviewed} reviewed</span>`;
              }).join('');
              return `<section id="student-intelligence" data-view="student-intelligence" aria-label="Student Intelligence">
                <h2>Student Intelligence</h2>
                <div data-view="intelligence-overview">
                  <div data-view="intelligence-metric"><strong>${profile.terms.length}</strong><span>Terms</span></div>
                  <div data-view="intelligence-metric"><strong>${current.lessons.count}</strong><span>Lessons</span></div>
                  <div data-view="intelligence-metric"><strong>${current.scales.mastery.masteryPercent}%</strong><span>Scale mastery</span></div>
                </div>
                <div data-view="intelligence-programme">${domainSummary}</div>
                <div data-view="intelligence-lessons">
                  <div><strong>Attendance</strong><span>Present ${current.lessons.attendance.PRESENT} · Late ${current.lessons.attendance.LATE} · Absent ${current.lessons.attendance.ABSENT}</span></div>
                  <div><strong>Marks</strong><span>${current.lessons.marks.latest ?? '—'} latest · ${current.lessons.marks.average ?? '—'} average</span></div>
                  <div><strong>Homework</strong><span>${current.homework.itemCount} item(s) · ${current.homework.lessonCount} lesson(s)</span></div>
                </div>
                <details data-view="intelligence-timeline">
                  <summary>Student timeline · ${profile.timeline.length} event(s)</summary>
                  ${profile.timeline.slice(0, 10).map(event => `
                    <article data-view="intelligence-timeline-event">
                      <strong>${esc(event.type.replaceAll('_', ' '))}</strong>
                      <span> · ${esc(event.date ?? 'No date')}</span>
                      ${event.type === 'LESSON' ? `
                        <span> · ${esc(event.attendance ?? '')}${event.mark !== null && event.mark !== undefined ? ` · Mark ${esc(event.mark)}` : ''}</span>
                        ${event.teacherNote ? `<p><strong>Teacher note:</strong> ${esc(event.teacherNote)}</p>` : ''}
                      ` : ''}
                    </article>
                  `).join('')}
                </details>
                ${current.tktl ? `<details data-view="intelligence-tktl"><summary>Current TKTL context · ${esc(current.tktl.cardId)}</summary><p>${esc(current.tktl.technicalIntent ?? 'No technical intent recorded.')}</p></details>` : ''}
              </section>`;
            })() : ''}
            <details data-view="teacher-readiness-review" aria-label="Teacher Readiness Review">
              <summary>Readiness Checklist · ${state.teacherReadinessReview?.checklist?.[0]?.cardId ?? "Current term"}</summary>
              ${state.teacherReadinessReview?.checklist?.length ? state.teacherReadinessReview.checklist.map(check => `
                <article data-view="teacher-readiness-checklist">
                  <strong>Teacher review checklist · ${esc(check.cardId ?? 'No TKTL card')}</strong>
                  <p><strong>Readiness criteria</strong></p>
                  <ul>${check.readinessCriteria.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
                  <p><strong>Next-term dependency</strong></p>
                  <p>${esc(check.nextTermDependency ?? 'No next-term dependency recorded.')}</p>
                  <p><strong>Teacher decision</strong></p>
                  <label>Decision
                    <select data-action="teacher-readiness-decision" aria-label="Teacher readiness decision">
                      <option value="" ${!check.decision ? 'selected' : ''}>Not recorded</option>
                      <option value="ADVANCE_TO_NEXT_TERM" ${check.decision === 'ADVANCE_TO_NEXT_TERM' ? 'selected' : ''}>Advance to next term</option>
                      <option value="CONTINUE_CURRENT_TERM" ${check.decision === 'CONTINUE_CURRENT_TERM' ? 'selected' : ''}>Continue current term</option>
                      <option value="TARGETED_REVIEW_BEFORE_ADVANCE" ${check.decision === 'TARGETED_REVIEW_BEFORE_ADVANCE' ? 'selected' : ''}>Targeted review before advance</option>
                    </select>
                  </label>
                  <label>Teacher note
                    <textarea data-action="teacher-readiness-note" rows="3" placeholder="Optional teacher note">${esc(check.decisionNote ?? '')}</textarea>
                  </label>
                  <button type="button" data-action="save-teacher-readiness-decision">Save teacher decision</button>
                  <p data-view="teacher-decision-status">${check.decision ? `Recorded: ${esc(check.decision.replaceAll('_', ' ').toLowerCase())}` : 'Not recorded — teacher review required.'}</p>
                </article>
              `).join('') : '<p>No current-term readiness checklist is available.</p>'}
            </details>
            <details data-view="teacher-decision-layer" aria-label="Teacher Decision Prompts">
              <summary>Teacher Decision Support · ${state.teacherDecisionPrompts?.prompts?.length ?? 0} evidence signal(s)</summary>
              ${state.teacherDecisionPrompts?.prompts?.length ? state.teacherDecisionPrompts.prompts.map(prompt => `
                <article data-view="teacher-decision-prompt">
                  <strong>${esc(prompt.signalType.replaceAll('_', ' '))}</strong>
                  ${prompt.domain ? `<span> · ${esc(prompt.domain.replaceAll('_', ' '))}</span>` : ''}
                  <p><strong>Evidence:</strong> ${esc(prompt.evidence)}</p>
                  <details>
                    <summary>TKTL guidance</summary>
                    <div><strong>Teacher decision logic</strong><ul>${prompt.teacherDecisionLogic.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
                    <div><strong>Readiness criteria</strong><ul>${prompt.readinessCriteria.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
                    <div><strong>Next-term dependency</strong><p>${esc(prompt.nextTermDependency)}</p></div>
                  </details>
                </article>
              `).join('') : '<p>No evidence-linked decision prompts for the current data.</p>'}
            </details>
          <details id="lesson-history" data-view="lesson-history">
            <summary>Recent lesson history · ${state.lessonHistory.length} lesson(s)</summary>
            ${state.lessonHistory.length ? `<ul>${state.lessonHistory.map(entry => { const selected = entry.id === state.activeLessonId; return `<li data-lesson-history-item="${esc(entry.id)}"${selected ? ' data-selected="true"' : ''}><button type="button" data-action="select-lesson" data-lesson-id="${esc(entry.id)}"${selected ? ' aria-current="true" disabled' : ''}>${esc(entry.date)} · ${esc(entry.attendance)} · ${entry.mark ?? 'No mark'} · ${(entry.reviewedProgrammeItemIds ?? []).length} reviewed${selected ? ' · Selected' : ''}</button></li>`; }).join('')}</ul>` : '<p>No lessons recorded for this term.</p>'}
          </details>
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
        if (action === 'open-new-student') {
          const dialog = this.root.querySelector('[data-view="new-student-dialog"]');
          dialog?.showModal();
        } else if (action === 'close-new-student') {
          const dialog = this.root.querySelector('[data-view="new-student-dialog"]');
          dialog?.close();
        } else if (action === 'create-student') {
          const name = this.root.querySelector('[data-action="new-student-name"]')?.value?.trim() ?? '';
          const phone = this.root.querySelector('[data-action="new-student-phone"]')?.value?.trim() ?? '';
          const schoolType = this.root.querySelector('[data-action="new-student-school-type"]')?.value ?? 'PRIVATE';
          const schoolName = this.root.querySelector('[data-action="new-student-school-name"]')?.value?.trim() ?? '';
          const instrument = this.root.querySelector('[data-action="new-student-instrument"]')?.value ?? 'VIOLIN';
          const levelRaw = this.root.querySelector('[data-action="new-student-level"]')?.value ?? '';
          const termNumber = Number(this.root.querySelector('[data-action="new-student-term-number"]')?.value ?? 1);
          const termName = this.root.querySelector('[data-action="new-student-term-name"]')?.value?.trim() ?? '';
          const startDate = this.root.querySelector('[data-action="new-student-term-start"]')?.value ?? '';
          const endDate = this.root.querySelector('[data-action="new-student-term-end"]')?.value ?? '';
          await this.controller.createStudent({
            name, phone, schoolType, schoolName, instrument,
            initialTerm: levelRaw === '' ? null : { name: termName || `Term ${termNumber}`, level: Number(levelRaw), termNumber, startDate, endDate },
          });
          this.root.querySelector('[data-view="new-student-dialog"]')?.close();
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
        } else if (action === 'select-all-pending') {
          this.controller.selectAllPendingItems();
        } else if (action === 'clear-selection') {
          this.controller.clearItemSelection();
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
          const teacherNote = this.root.querySelector('[data-action="teacher-note"]')?.value ?? '';
          await this.controller.updateLessonDetails({ attendance, mark, teacherNote });
        } else if (action === 'copy-viber') {
          const snapshot = this.controller.snapshot();
          const student = snapshot.students.find(item => item.id === snapshot.selectedStudentId);
          const message = generateViberHomeworkMessage({
            studentName: student?.name,
            level: snapshot.termContext?.term?.level,
            termNumber: snapshot.termContext?.term?.termNumber,
            items: snapshot.homework?.items ?? snapshot.homeworkDraftItems ?? [],
            practicePlan: snapshot.homework?.practicePlan ?? snapshot.practicePlanDraft,
          });
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable in this browser');
          await navigator.clipboard.writeText(message);
        } else if (action === 'copy-parent') {
          const snapshot = this.controller.snapshot();
          const student = snapshot.students.find(item => item.id === snapshot.selectedStudentId);
          const message = generateParentHomeworkMessage({
            studentName: student?.name,
            level: snapshot.termContext?.term?.level,
            items: snapshot.homework?.items ?? snapshot.homeworkDraftItems ?? [],
            practicePlan: snapshot.homework?.practicePlan ?? snapshot.practicePlanDraft,
          });
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable in this browser');
          await navigator.clipboard.writeText(message);
        } else if (action === 'add-selected-to-homework') {
          const snapshot = this.controller.snapshot();
          const selected = (snapshot.weekly?.items ?? []).filter(item => snapshot.selectedItemIds.includes(item.id));
          const current = snapshot.homeworkDraftItems ?? [];
          const existingIds = new Set(current.map(item => item.id).filter(Boolean));
          const additions = selected.filter(item => !existingIds.has(item.id)).map(item => ({
            id: item.id, title: item.title, curriculumId: item.curriculumId, curriculumDomain: item.curriculumDomain,
            cardId: item.cardId, objectId: item.objectId, requirements: item.details?.requirements ?? item.requirements ?? null,
            objective: item.details?.objective ?? item.objective ?? null, completed: false
          }));
          this.controller.setHomeworkDraftItems([...current, ...additions]);
        } else if (action === 'generate-practice-plan') {
          const text = this.root.querySelector('[data-action="homework"]')?.value ?? '';
          const snapshot = this.controller.snapshot();
          const items = homeworkItemsFromText(text, snapshot.homeworkDraftItems ?? []);
          await this.controller.generatePracticePlan(items);
        } else if (action === 'save-homework') {
          const text = this.root.querySelector('[data-action="homework"]')?.value ?? '';
          const snapshot = this.controller.snapshot();
          const items = homeworkItemsFromText(text, snapshot.homeworkDraftItems ?? []);
          let plan = snapshot.practicePlanDraft;
          if (plan) {
            const tasks = plan.tasks.map((task, index) => ({ ...task, minutes: Number(this.root.querySelector(`[data-plan-minutes="${index}"]`)?.value ?? task.minutes), focus: this.root.querySelector(`[data-plan-focus="${index}"]`)?.value ?? task.focus }));
            plan = { ...plan, totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0), tasks };
          }
          await this.controller.saveHomework(items, plan);
        } else if (action === 'save-teacher-readiness-decision') {
          const decision = this.root.querySelector('[data-action="teacher-readiness-decision"]')?.value ?? '';
          const note = this.root.querySelector('[data-action="teacher-readiness-note"]')?.value ?? '';
          await this.controller.saveTeacherReadinessDecision({ decision, note });
        } else if (action === 'assess-scale') {
          const id = target.dataset.scaleId;
          const status = this.root.querySelector(`[data-scale-status="${id}"]`)?.value ?? 'NOT_STARTED';
          const currentTempoRaw = this.root.querySelector(`[data-scale-current-tempo="${id}"]`)?.value ?? '';
          const targetTempoRaw = this.root.querySelector(`[data-scale-target-tempo="${id}"]`)?.value ?? '';
          const intonation = this.root.querySelector(`[data-scale-intonation="${id}"]`)?.value || null;
          const bowControl = this.root.querySelector(`[data-scale-bow="${id}"]`)?.value || null;
          const consistency = this.root.querySelector(`[data-scale-consistency="${id}"]`)?.value || null;
          const note = this.root.querySelector(`[data-scale-note="${id}"]`)?.value ?? '';
          await this.controller.assessScale(id, {
            status,
            currentTempo: currentTempoRaw === '' ? null : Number(currentTempoRaw),
            targetTempo: targetTempoRaw === '' ? null : Number(targetTempoRaw),
            intonation,
            bowControl,
            consistency,
            note,
          });
        } else if (target.dataset.uncomplete) {
          await this.controller.uncompleteItem(target.dataset.uncomplete);
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
    const clearButton = this.root.querySelector('[data-action="clear-selection"]');
    const reviewButton = this.root.querySelector('[data-action="review"]');
    const selectionCount = this.root.querySelector('[data-view="weekly-selection-count"]');
    if (clearButton) {
      clearButton.disabled = state.selectedItemIds.length === 0;
      clearButton.textContent = `Clear selection (${state.selectedItemIds.length})`;
    }
    if (completeButton) {
      completeButton.disabled = state.selectedItemIds.length === 0;
      completeButton.textContent = `Complete selected (${state.selectedItemIds.length})`;
    }
    if (selectionCount) {
      const weekly = state.weekly;
      const pendingCount = weekly ? Math.max(weekly.summary.total - weekly.summary.completed, 0) : 0;
      selectionCount.textContent = ` · ${pendingCount} pending · ${state.selectedItemIds.length} selected`;
    }
    if (reviewButton) {
      reviewButton.disabled = !state.activeLessonId || state.selectedItemIds.length === 0;
      reviewButton.textContent = `Review selected (${state.selectedItemIds.length})`;
    }
  }

  #showError() {
    // Controller operations record their own error state and rollback before rejecting.
    // The Shell only re-renders that state; it must not mutate Controller state directly.
    this.render();
  }
}
