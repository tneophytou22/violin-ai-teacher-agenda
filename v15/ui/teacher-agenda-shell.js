import { TeacherAgendaController, localDateString } from './teacher-agenda-controller.js';
import { generateViberHomeworkMessage, generateParentHomeworkMessage } from '../services/homework-messages.js';

const esc = value => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
    const practicePlan = state.practicePlanDraft;
    const savedHomeworkItems = state.homework?.items ?? [];
    const savedPracticePlan = state.homework?.practicePlan ?? null;
    const homeworkNeedsSave = JSON.stringify(homeworkItems) !== JSON.stringify(savedHomeworkItems)
      || JSON.stringify(practicePlan ?? null) !== JSON.stringify(savedPracticePlan ?? null);
    const reviewedTitles = (weekly?.items ?? []).filter(item => state.reviewedItemIds.includes(item.id)).map(item => item.title).slice(0, 3);
    const hasSavedHomework = Boolean(state.homework);
    const viberMessage = student ? generateViberHomeworkMessage({ studentName: student.name, level: state.termContext?.term?.level, termNumber: state.termContext?.term?.termNumber, items: savedHomeworkItems, practicePlan: savedPracticePlan }) : '';
    const parentMessage = student ? generateParentHomeworkMessage({ studentName: student.name, level: state.termContext?.term?.level, items: savedHomeworkItems, practicePlan: savedPracticePlan }) : '';
        const scaleProgressMarkup = state.scaleProgress ? '<section id="scale-progress" data-view="scale-progress" aria-label="Scale Progress and Mastery"><div data-view="scale-progress-header"><div><h2>Scale Progress / Mastery</h2><p>' + state.scaleProgress.completed + '/' + state.scaleProgress.total + ' completed · ' + state.scaleProgress.masteryPercent + '% assessed mastery</p></div><div data-view="scale-progress-actions"><strong data-view="scale-mastery">' + state.scaleProgress.masteryPercent + '%</strong><button type="button" data-action="focus-scale-assessment">Assess scales</button></div></div><div data-view="scale-category-list">' + Object.entries(state.scaleProgress.byCategory).map(([category, summary]) => '<div data-scale-category><div data-view="scale-category-heading"><strong>' + esc(category) + '</strong><span>' + summary.completed + '/' + summary.total + '</span></div><div data-view="scale-category-track"><progress max="100" value="' + summary.masteryPercent + '"></progress><span>' + summary.masteryPercent + '%</span></div></div>').join('') + '</div><div data-view="scale-progress-footer"><span>Mastery: Developing 40 · Secure 75 · Performance Ready 100</span><span>Mastery is teacher-assessed; completion is tracked separately.</span></div></section>' : '';

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
          <div data-view="student-roster" aria-label="Student list">
            ${state.students.map(s => {
              const type = s.schoolType === 'MUSIC_SCHOOL' ? 'music-school' : s.schoolType === 'PRIVATE' ? 'private' : 'other';
              const label = s.schoolType === 'MUSIC_SCHOOL' ? 'Music School' : s.schoolType === 'PRIVATE' ? 'Private' : 'Other';
              return `<button type="button" data-action="student-card" data-student-id="${esc(s.id)}" class="${s.id === state.selectedStudentId ? 'is-selected' : ''} ${type}">
                <span data-student-dot aria-hidden="true"></span><span><strong>${esc(s.name)}</strong><small>${label}${s.lessonDay ? ` · ${esc(s.lessonDay)}` : ''}${s.lessonTime ? ` ${esc(s.lessonTime)}` : ''}</small></span>
              </button>`;
            }).join('')}
          </div>
          <section data-view="backup-panel" aria-label="Backup and restore">
            <div data-view="backup-panel-header">
              <div><strong>Data backup</strong><small>Protect your students, lessons, homework and mastery data.</small></div>
              <span data-view="backup-status">Local IndexedDB</span>
            </div>
            <div data-view="backup-actions">
              <button type="button" data-action="backup-now">Backup now</button>
              <button type="button" data-action="restore-backup">Restore backup</button>
              <input data-action="restore-backup-file" type="file" accept="application/json,.json" hidden>
            </div>
            <small data-view="backup-note">Backup creates a complete portable V15 data file. Restore replaces the current data.</small>
          </section>
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
                <div data-view="new-student-schedule">
                  <strong>Weekly lessons</strong>
                  <small>Most students have two lessons per week. Add one or two weekly lesson slots.</small>
                  <div data-view="new-student-schedule-grid">
                    <label>Lesson 1 · Day
                      <select data-action="new-student-lesson-day-1">
                        <option value="">Not set</option>
                        <option value="MONDAY">Monday</option><option value="TUESDAY">Tuesday</option><option value="WEDNESDAY">Wednesday</option><option value="THURSDAY">Thursday</option><option value="FRIDAY">Friday</option><option value="SATURDAY">Saturday</option><option value="SUNDAY">Sunday</option>
                      </select>
                    </label>
                    <label>Time
                      <input data-action="new-student-lesson-time-1" type="time">
                    </label>
                    <label>Lesson 2 · Day
                      <select data-action="new-student-lesson-day-2">
                        <option value="">Optional</option>
                        <option value="MONDAY">Monday</option><option value="TUESDAY">Tuesday</option><option value="WEDNESDAY">Wednesday</option><option value="THURSDAY">Thursday</option><option value="FRIDAY">Friday</option><option value="SATURDAY">Saturday</option><option value="SUNDAY">Sunday</option>
                      </select>
                    </label>
                    <label>Time
                      <input data-action="new-student-lesson-time-2" type="time">
                    </label>
                  </div>
                </div>
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
        <section data-view="teacher-agenda-week" aria-label="This week's lessons">
          <div data-view="teacher-agenda-week-header">
            <div>
              <h2>Teaching Agenda</h2>
              <p>${esc(state.agenda?.weekStart ?? '')} → ${esc(state.agenda?.weekEnd ?? '')}${state.agenda?.today ? ` · Today ${esc(state.agenda.today)}` : ''}</p>
            </div>
            <div data-view="teacher-agenda-week-actions">
              <button type="button" data-action="agenda-week-prev" aria-label="Previous week">←</button>
              <button type="button" data-action="agenda-week-today">Today</button>
              <button type="button" data-action="agenda-week-next" aria-label="Next week">→</button>
            </div>
          </div>
          <div data-view="teacher-agenda-days">
            ${(state.agenda?.days ?? []).map(day => {
              const entries = day.entries ?? [];
              return `<section data-view="teacher-agenda-day" data-date="${esc(day.date)}">
                <div data-view="teacher-agenda-day-header"><strong>${esc(day.date)}</strong><span>${entries.length} lesson${entries.length === 1 ? '' : 's'}</span></div>
                ${entries.length ? `<div data-view="teacher-agenda-day-entries">${entries.map(entry => `<button type="button" data-action="agenda-entry" data-agenda-entry="${esc(entry.id)}" class="${entry.date === state.agenda?.today ? 'is-today' : ''}">
                  <span data-view="agenda-entry-time">${esc(entry.time)}</span>
                  <span data-view="agenda-entry-student"><strong>${esc(entry.studentName)}</strong><small>${entry.level ? `Level ${esc(entry.level)}${entry.termNumber ? ` · Term ${esc(entry.termNumber)}` : ''}` : 'No level set'} · ${entry.status === 'RECORDED' ? esc(entry.attendance ?? 'Recorded') : 'Scheduled'}</small></span>
                </button>`).join('')}</div>` : '<small>No lessons scheduled.</small>'}
              </section>`;
            }).join('')}
          </div>
        </section>
        ${student ? `
          <section data-view="student-dashboard">
            <div data-view="student-identity"><div data-view="student-avatar" aria-hidden="true">${esc(student.name.slice(0, 2).toUpperCase())}</div><div><h2>${esc(student.name)}</h2><p>${state.termContext ? `Level ${esc(state.termContext.term.level)} · Term ${esc(state.termContext.term.termNumber)}` : 'Select a term'}${student.schoolType ? ` · ${esc(student.schoolType.replaceAll('_', ' '))}` : ''}</p><small>${esc(student.schoolName || '')}${student.phone ? ` · ${esc(student.phone)}` : ''}${(student.lessonSchedule?.length ? student.lessonSchedule : (student.lessonDay && student.lessonTime ? [{ day: student.lessonDay, time: student.lessonTime }] : [])).map(slot => ` · ${esc(slot.day)} ${esc(slot.time)}`).join('')}</small></div></div>

            <button type="button" data-action="open-student-profile">Edit profile</button>
            <dialog data-view="student-profile-dialog" aria-labelledby="student-profile-title">
              <form method="dialog" data-view="student-profile-form">
                <div data-view="student-profile-header">
                  <div><h2 id="student-profile-title">Student Profile</h2><p>Update contact and school information. Level remains owned by the selected Term.</p></div>
                  <button type="button" data-action="close-student-profile" aria-label="Close">×</button>
                </div>
                <div data-view="student-profile-grid">
                  <label>Full name *
                    <input data-action="student-profile-name" required value="${esc(student.name)}">
                  </label>
                  <label>Phone
                    <input data-action="student-profile-phone" type="tel" value="${esc(student.phone || '')}">
                  </label>
                  <label>School type
                    <select data-action="student-profile-school-type">
                      <option value="PRIVATE" ${student.schoolType === 'PRIVATE' ? 'selected' : ''}>Private</option>
                      <option value="MUSIC_SCHOOL" ${student.schoolType === 'MUSIC_SCHOOL' ? 'selected' : ''}>Music School</option>
                      <option value="OTHER" ${student.schoolType === 'OTHER' ? 'selected' : ''}>Other</option>
                    </select>
                  </label>
                  <label>School / Music School
                    <input data-action="student-profile-school-name" value="${esc(student.schoolName || '')}">
                  </label>
                  <label>Instrument
                    <select data-action="student-profile-instrument">
                      <option value="VIOLIN" ${student.instrument === 'VIOLIN' ? 'selected' : ''}>Violin</option>
                      <option value="VIOLA" ${student.instrument === 'VIOLA' ? 'selected' : ''}>Viola</option>
                      <option value="CELLO" ${student.instrument === 'CELLO' ? 'selected' : ''}>Cello</option>
                      <option value="OTHER" ${student.instrument === 'OTHER' ? 'selected' : ''}>Other</option>
                    </select>
                  </label>
                  <div data-view="student-profile-schedule">
                    <strong>Weekly lessons</strong>
                    <small>Add one or two weekly lesson slots.</small>
                    <div data-view="student-profile-schedule-grid">
                      <label>Lesson 1 · Day
                        <select data-action="student-profile-lesson-day-1">${this.#lessonDayOptions(student.lessonSchedule?.[0]?.day ?? student.lessonDay ?? '')}</select>
                      </label>
                      <label>Time
                        <input data-action="student-profile-lesson-time-1" type="time" value="${esc(student.lessonSchedule?.[0]?.time ?? student.lessonTime ?? '')}">
                      </label>
                      <label>Lesson 2 · Day
                        <select data-action="student-profile-lesson-day-2">${this.#lessonDayOptions(student.lessonSchedule?.[1]?.day ?? '')}</select>
                      </label>
                      <label>Time
                        <input data-action="student-profile-lesson-time-2" type="time" value="${esc(student.lessonSchedule?.[1]?.time ?? '')}">
                      </label>
                    </div>
                  </div>
                </div>
                <p data-view="student-profile-term-note">Current level: ${state.termContext?.term?.level ? 'Level ' + esc(state.termContext.term.level) + ' · Term ' + esc(state.termContext.term.termNumber) : 'No level set'} · change level from Term Details.</p>
                <div data-view="student-profile-actions">
                  <button type="button" data-action="delete-student" class="danger">Delete student</button>
                  <span data-view="student-profile-delete-note">Deletes this student and all associated terms, lessons, programme work and homework.</span>
                  <button type="button" data-action="close-student-profile">Cancel</button>
                  <button type="button" data-action="save-student-profile" class="primary">Save profile</button>
                </div>
              </form>
            </dialog>

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
              <button type="button" data-action="add-selected-to-homework" ${state.activeLessonId && state.selectedItemIds.length ? '' : 'disabled'}>Add selected work${state.selectedItemIds.length ? ` (${state.selectedItemIds.length})` : ''}</button>
              ${!state.activeLessonId ? '<span data-view="lesson-action-hint">Start a lesson below to enable Review and Homework.</span>' : `<span data-view="lesson-action-hint">Review records lesson activity; Complete selected updates progress. Homework uses the same selected work.</span><span data-view="lesson-action-status" aria-live="polite">Lesson activity: ${state.reviewedItemIds.length} reviewed</span>`}
            </div>
            ${grouped.map(group => {
              const completedCount = group.items.filter(item => item.status === 'COMPLETED').length;
              const selectedCount = group.items.filter(item => state.selectedItemIds.includes(item.id)).length;
              const reviewedCount = group.items.filter(item => state.reviewedItemIds.includes(item.id)).length;
              const isPrimary = group.domain === 'PURE_TECHNICAL';
              return `<details data-domain="${group.domain}" ${isPrimary ? 'open' : ''}>
                <summary data-view="domain-summary"><span><strong>${group.domain.replace('_', ' ')}</strong><small>${completedCount}/${group.items.length} complete · ${reviewedCount} reviewed${selectedCount ? ` · ${selectedCount} selected` : ''}</small></span><span data-view="domain-summary-progress">${group.items.length ? Math.round((completedCount / group.items.length) * 100) : 0}%</span></summary>
                <div data-view="domain-bar" aria-hidden="true"><span style="width:${group.items.length ? Math.round((completedCount / group.items.length) * 100) : 0}%"></span></div>
                <ul>${group.items.map(item => { const completed = item.status === 'COMPLETED'; const reviewed = state.reviewedItemIds.includes(item.id); return `<li data-status="${completed ? 'completed' : 'planned'}" data-reviewed="${reviewed}"><div data-view="programme-item-main"><label><input type="checkbox" data-item="${esc(item.id)}" aria-label="${esc(item.title)}" ${state.selectedItemIds.includes(item.id) ? 'checked' : ''} ${completed ? 'disabled' : ''}><span data-view="programme-item-title">${esc(item.title)}</span></label><div data-view="programme-item-meta">${completed ? '<span data-status-chip="completed">Completed</span>' : '<span data-status-chip="planned">Planned</span>'}${reviewed ? '<span data-status-chip="reviewed">Reviewed</span>' : ''}</div></div><div data-view="programme-item-actions"><button type="button" ${completed ? `data-uncomplete="${esc(item.id)}"` : `data-carry="${esc(item.id)}"`} title="${completed ? 'Return item to planned status' : `Carry this item to Week ${state.week + 1}`}">${completed ? 'Uncomplete' : `Carry to Week ${state.week + 1}`}</button></div></li>`; }).join('')}</ul>
              </details>`;
            }).join('')}
            ${weekly?.items?.some(item => item.curriculumDomain === 'SCALES') ? `<details data-domain="SCALES"><summary>Scales · Mastery Assessment</summary><ul>${weekly.items.filter(item => item.curriculumDomain === 'SCALES').map(item => { const mastery = item.details?.mastery ?? {}; const status = mastery.status ?? 'NOT_STARTED'; return `<li data-scale-item><div><strong>${esc(item.title)}</strong><small> · ${esc(item.details?.category ?? 'Other')} · ${esc(status).replaceAll('_', ' ')}</small></div><div data-view="scale-assessment-row"><select data-scale-status="${esc(item.id)}" aria-label="Mastery status for ${esc(item.title)}">${['NOT_STARTED','DEVELOPING','SECURE','PERFORMANCE_READY'].map(value => `<option value="${value}" ${status === value ? 'selected' : ''}>${value.replaceAll('_', ' ')}</option>`).join('')}</select><input type="number" min="1" max="300" data-scale-current-tempo="${esc(item.id)}" value="${esc(mastery.currentTempo ?? '')}" placeholder="Current bpm" aria-label="Current tempo"><input type="number" min="1" max="300" data-scale-target-tempo="${esc(item.id)}" value="${esc(mastery.targetTempo ?? '')}" placeholder="Target bpm" aria-label="Target tempo"><select data-scale-intonation="${esc(item.id)}" aria-label="Intonation"><option value="">Intonation</option><option value="DEVELOPING" ${mastery.intonation === 'DEVELOPING' ? 'selected' : ''}>Intonation · Developing</option><option value="SECURE" ${mastery.intonation === 'SECURE' ? 'selected' : ''}>Intonation · Secure</option></select><select data-scale-bow="${esc(item.id)}" aria-label="Bow control"><option value="">Bow control</option><option value="DEVELOPING" ${mastery.bowControl === 'DEVELOPING' ? 'selected' : ''}>Bow · Developing</option><option value="SECURE" ${mastery.bowControl === 'SECURE' ? 'selected' : ''}>Bow · Secure</option></select><select data-scale-consistency="${esc(item.id)}" aria-label="Consistency"><option value="">Consistency</option><option value="DEVELOPING" ${mastery.consistency === 'DEVELOPING' ? 'selected' : ''}>Consistency · Developing</option><option value="SECURE" ${mastery.consistency === 'SECURE' ? 'selected' : ''}>Consistency · Secure</option></select><input type="text" data-scale-note="${esc(item.id)}" value="${esc(mastery.note ?? '')}" placeholder="Teacher note" aria-label="Teacher note"><button type="button" data-action="assess-scale" data-scale-id="${esc(item.id)}">Save assessment</button></div></li>`; }).join('')}</ul></details>` : ''}
          </section>
            </div>
            <aside data-view="agenda-side-rail" aria-label="Lesson and scale summary">
              <div data-view="lesson-column">
<section data-view="lesson">
  <div data-view="lesson-header">
    <div><h2>Lesson Session</h2><p>Record the lesson, review work and assign focused practice.</p></div>
    ${state.activeLessonId
      ? (lesson?.date === this.now()
        ? '<button type="button" data-action="end-lesson" ' + (homeworkNeedsSave ? 'disabled' : '') + ' title="' + (homeworkNeedsSave ? 'Save Homework before ending the lesson' : 'End the current lesson') + '">End lesson</button>'
        : '<button type="button" data-action="close-lesson-view" title="Close historical lesson view">Close view</button>')
      : '<button type="button" data-action="lesson" ' + (!state.selectedTermId ? 'disabled' : '') + '>Start lesson · ' + this.now() + '</button>'}
  </div>
  ${lesson ? `
    <p data-view="lesson-status"><strong>${esc(lesson.date)}</strong> · ${esc(lesson.attendance)} · ${lesson.mark ?? 'No mark'} · ${state.reviewedItemIds.length} item(s) reviewed.</p>
    <div data-view="lesson-session-flow" aria-label="Lesson workflow">
      <div data-session-step="record" data-complete="true"><span>1</span><strong>Record</strong><small>Attendance · mark · note</small></div>
      <div data-session-step="review" data-complete="${state.reviewedItemIds.length > 0}"><span>2</span><strong>Review</strong><small>${state.reviewedItemIds.length ? `${state.reviewedItemIds.length} recorded` : 'Select work in Week View'}</small></div>
      <div data-session-step="homework" data-complete="${homeworkItems.length > 0}"><span>3</span><strong>Homework</strong><small>${homeworkItems.length ? `${homeworkItems.length} assigned` : 'Assign selected work'}</small></div>
      <div data-session-step="save" data-complete="${!homeworkItems.length || !homeworkNeedsSave}"><span>4</span><strong>Save</strong><small>${homeworkItems.length ? (homeworkNeedsSave ? 'Save homework' : 'Saved') : 'No homework'}</small></div>
    </div>
    <div data-view="lesson-next-action" aria-live="polite">
      <span>${!state.reviewedItemIds.length ? 'Next action' : !homeworkItems.length ? 'Next action' : !practicePlan ? 'Next action' : homeworkNeedsSave ? 'Next action' : 'Session ready'}</span>
      <strong>${!state.reviewedItemIds.length ? 'Select and review today’s work in Week View' : !homeworkItems.length ? 'Add reviewed work to Homework' : !practicePlan ? 'Create a Practice Plan for the assigned work' : homeworkNeedsSave ? 'Review the plan, then Save Homework' : 'Lesson record is complete · ready for the next student'}</strong>
    </div>
    <div data-view="lesson-session-summary" aria-label="Lesson session summary">
      <div><span>Reviewed</span><strong>${state.reviewedItemIds.length}</strong></div>
      <div><span>Homework</span><strong>${homeworkItems.length}</strong></div>
      <div><span>Mark</span><strong>${lesson.mark ?? '—'}</strong></div>
    </div>
    <div data-view="lesson-reviewed-work">
      <div><strong>Reviewed work</strong><span>${state.reviewedItemIds.length ? 'Recorded in this lesson' : 'Nothing reviewed yet'}</span></div>
      ${state.reviewedItemIds.length ? `<ul>${reviewedTitles.map(title => `<li>${esc(title)}</li>`).join('')}${state.reviewedItemIds.length > 3 ? `<li>+${state.reviewedItemIds.length - 3} more</li>` : ''}</ul>` : ''}
    </div>
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
        <div><h3>Homework</h3><p>Teacher-selected work → focused home-practice plan.</p></div>
        ${homeworkItems.length ? '<span data-view="homework-count">' + homeworkItems.length + ' assigned' + (homeworkNeedsSave ? ' · Draft' : '') + '</span>' : '<span data-view="homework-count">0 assigned</span>'}
      </div>

      ${homeworkItems.length
        ? '<div data-view="homework-list" aria-label="Assigned homework">' +
          homeworkItems.map((item, index) => {
            const title = item.title ?? item.text ?? 'Homework task';
            const domain = item.curriculumDomain ? item.curriculumDomain.replace('_', ' ') : 'Custom';
            const planTask = practicePlan?.tasks?.find(task => task.homeworkItemIndex === index);
            const itemMeta = planTask ? domain + ' · ' + planTask.minutes + ' min' : domain;
            return '<article data-view="homework-item">' +
              '<div data-view="homework-item-main"><span data-view="homework-item-number">' + (index + 1) + '</span><div><strong>' + esc(title) + '</strong><span>' + esc(itemMeta) + '</span></div></div>' +
              '<button type="button" data-action="remove-homework-item" data-homework-index="' + index + '" aria-label="Remove ' + esc(title) + '">×</button>' +
            '</article>';
          }).join('') +
        '</div>'
        : '<div data-view="homework-empty"><strong>No homework assigned yet.</strong><span>Select work from the weekly agenda or add a custom task.</span></div>'}

      <details data-view="custom-homework">
        <summary>+ Add custom task</summary>
        <div data-view="custom-homework-row">
          <input data-action="custom-homework-input" type="text" placeholder="e.g. Practise Ravel opening from bar 12">
          <button type="button" data-action="add-custom-homework">Add</button>
        </div>
      </details>

      <div data-view="homework-actions">
        <button type="button" data-action="add-selected-to-homework" ${state.selectedItemIds.length ? '' : 'disabled'}>Add selected work</button>
        <button type="button" data-action="generate-practice-plan" ${homeworkItems.length ? '' : 'disabled'}>${practicePlan ? 'Regenerate Practice Plan' : 'Create Practice Plan'}</button>
        <button type="button" data-action="save-homework" ${homeworkItems.length ? '' : 'disabled'}>Save Homework</button>
      </div>

      ${practicePlan
        ? '<div data-view="practice-plan" aria-label="Practice Plan">' +
          '<div data-view="practice-plan-header"><div><strong>Practice Plan</strong><span>Suggested structure · teacher approval required</span></div><strong>' + practicePlan.totalMinutes + ' min</strong></div>' +
          '<div data-view="practice-plan-tasks">' +
          practicePlan.tasks.map((task, index) => {
            const item = homeworkItems[task.homeworkItemIndex] ?? {};
            const title = item.text ?? item.title ?? 'Homework task';
            return '<article data-view="practice-task">' +
              '<div data-view="practice-task-title"><span>' + (index + 1) + '</span><strong>' + esc(title) + '</strong></div>' +
              '<label>Min <input type="number" min="0" max="180" data-plan-minutes="' + index + '" value="' + esc(task.minutes) + '" aria-label="Minutes for ' + esc(title) + '"></label>' +
              '<label>Focus <input type="text" data-plan-focus="' + index + '" value="' + esc(task.focus) + '" aria-label="Practice focus for ' + esc(title) + '"></label>' +
            '</article>';
          }).join('') +
          '</div><p data-view="practice-plan-note">The planner organises how to practise the teacher-selected work. It does not change curriculum or progression.</p>' +
        '</div>'
        : '<div data-view="practice-plan-empty"><strong>Practice Plan</strong><span>Create a suggested plan after assigning the homework tasks.</span></div>'}

      ${hasSavedHomework && savedHomeworkItems.length
        ? '<details data-view="homework-communication"><summary>Communication · Viber / Parent</summary><div data-view="message-preview"><strong>Viber</strong><pre>' + esc(viberMessage) + '</pre><button type="button" data-action="copy-viber">Copy Viber Message</button></div><div data-view="message-preview"><strong>Parent support</strong><pre>' + esc(parentMessage) + '</pre><button type="button" data-action="copy-parent">Copy Parent Message</button></div><p>Messages use the last saved Homework + Practice Plan. V15 does not send Viber automatically.</p></details>'
        : ''}
    </div>
  ` : `<p>Start a lesson to record attendance, mark, reviewed work and homework.</p>${!state.selectedTermId ? '<span data-view="lesson-disabled-hint">Select a term first.</span>' : ''}`}
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
              const longitudinal = state.longitudinalDevelopment?.terms ?? [];
              const currentLongitudinal = longitudinal.find(entry => entry.term.id === current?.term.id) ?? longitudinal.at(-1) ?? null;
              if (!current) return '';
              const coreTotal = Object.values(current.programme).reduce((sum, entry) => sum + entry.total, 0);
              const coreCompleted = Object.values(current.programme).reduce((sum, entry) => sum + entry.completed, 0);
              const corePercent = coreTotal ? Math.round(coreCompleted / coreTotal * 100) : 0;
              const domainRows = ['PURE_TECHNICAL', 'ETUDE', 'REPERTOIRE'].map(domain => {
                const summary = current.programme[domain] ?? { total: 0, completed: 0, reviewed: 0, pending: 0 };
                const percent = summary.total ? Math.round(summary.completed / summary.total * 100) : 0;
                return `<div data-view="progress-domain-row">
                  <div data-view="progress-domain-label"><strong>${domain.replace('_', ' ')}</strong><span>${summary.completed}/${summary.total}</span></div>
                  <div data-view="progress-track"><span style="width:${percent}%"></span></div>
                  <small>${summary.reviewed} reviewed · ${summary.pending} pending</small>
                </div>`;
              }).join('');
              const deltaText = value => value === null || value === undefined ? '—' : value > 0 ? `+${value}` : String(value);
              const termHistory = longitudinal.slice(-4).map(entry => {
                const progressTotal = entry.metrics.pureTechnicalCompleted + entry.metrics.etudeCompleted + entry.metrics.repertoireCompleted;
                const scale = entry.metrics.scaleMasteryPercent ?? 0;
                return `<div data-view="progress-term-row">
                  <strong>L${esc(entry.term.level)} · T${esc(entry.term.termNumber)}</strong>
                  <span>${progressTotal} core completed</span>
                  <span>${scale}% scale mastery</span>
                  <span>${entry.metrics.lessons} lessons</span>
                </div>`;
              }).join('');
              return `<section id="student-intelligence" data-view="student-intelligence" aria-label="Student Progress">
                <div data-view="progress-header">
                  <div><h2>Progress</h2><p>Evidence from lessons, programme work, homework and scale assessment.</p></div>
                  <span data-view="progress-term-label">L${esc(current.term.level)} · Term ${esc(current.term.termNumber)}</span>
                </div>
                <div data-view="progress-metrics">
                  <div data-view="progress-metric"><strong>${corePercent}%</strong><span>Core progress</span><small>${coreCompleted}/${coreTotal} completed</small></div>
                  <div data-view="progress-metric"><strong>${current.scales.mastery.masteryPercent}%</strong><span>Scale mastery</span><small>${current.scales.completed}/${current.scales.total} completed</small></div>
                  <div data-view="progress-metric"><strong>${current.lessons.count}</strong><span>Lessons</span><small>${current.lessons.attendance.PRESENT} present · ${current.lessons.attendance.LATE} late</small></div>
                  <div data-view="progress-metric"><strong>${current.homework.itemCount}</strong><span>Homework items</span><small>${current.homework.lessonCount} lessons assigned</small></div>
                </div>
                <div data-view="progress-grid">
                  <article data-view="progress-card">
                    <div data-view="progress-card-header"><strong>Programme progress</strong><span>${coreCompleted}/${coreTotal}</span></div>
                    <div data-view="progress-domains">${domainRows}</div>
                  </article>
                  <article data-view="progress-card">
                    <div data-view="progress-card-header"><strong>Lesson evidence</strong><span>${current.lessons.marks.count} marked</span></div>
                    <div data-view="progress-evidence-list">
                      <div><span>Attendance</span><strong>${current.lessons.attendance.PRESENT} present · ${current.lessons.attendance.ABSENT} absent</strong></div>
                      <div><span>Latest mark</span><strong>${current.lessons.marks.latest ?? '—'}</strong></div>
                      <div><span>Average mark</span><strong>${current.lessons.marks.average ?? '—'}</strong></div>
                      <div><span>Homework coverage</span><strong>${current.homework.lessonCount} / ${current.lessons.count} lessons</strong></div>
                    </div>
                  </article>
                </div>
                ${currentLongitudinal ? `<div data-view="progress-current-change">
                  <strong>Change vs previous term</strong>
                  <span>Lessons ${deltaText(currentLongitudinal.delta.lessons)} · Average mark ${deltaText(currentLongitudinal.delta.averageMark)} · Scale mastery ${deltaText(currentLongitudinal.delta.scaleMasteryPercent)}%</span>
                </div>` : ''}
                ${termHistory ? `<details data-view="progress-term-history">
                  <summary>Term development · ${longitudinal.length} term(s)</summary>
                  <div data-view="progress-term-list">${termHistory}</div>
                </details>` : ''}
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
            <summary><span>Recent lesson history · ${state.lessonHistory.length} lesson(s)</span>${state.lessonHistory.length ? ` <small>${state.lessonHistory.filter(entry => (entry.reviewedProgrammeItemIds ?? []).length).length} reviewed lessons · ${state.lessonHistory.reduce((sum, entry) => sum + (entry.reviewedProgrammeItemIds ?? []).length, 0)} reviewed records</small>` : ''}</summary>
            ${state.lessonHistory.length ? `<div data-view="history-insight">
              <span><strong>${state.lessonHistory.filter(entry => (entry.reviewedProgrammeItemIds ?? []).length).length}</strong> lessons with reviewed work</span>
              <span><strong>${state.lessonHistory.reduce((sum, entry) => sum + (entry.reviewedProgrammeItemIds ?? []).length, 0)}</strong> reviewed records</span>
              <span><strong>${state.lessonHistory.filter(entry => entry.attendance === 'PRESENT').length}</strong> present</span>
            </div><ul>${state.lessonHistory.map(entry => { const selected = entry.id === state.activeLessonId; const reviewedCount = (entry.reviewedProgrammeItemIds ?? []).length; return `<li data-lesson-history-item="${esc(entry.id)}"${selected ? ' data-selected="true"' : ''}><button type="button" data-action="select-lesson" data-lesson-id="${esc(entry.id)}"${selected ? ' aria-current="true" disabled' : ''}><span>${esc(entry.date)}</span><span>${esc(entry.attendance)} · ${entry.mark ?? 'No mark'} · ${reviewedCount} reviewed</span>${selected ? '<em>Selected</em>' : ''}</button></li>`; }).join('')}</ul>` : '<p>No lessons recorded for this term.</p>'}
          </details>
        ` : '<p>Select a student to begin.</p>'}
      </section>`;

    this.#bind();
    this.#bindDialogActions();
  }

  #lessonDayOptions(selectedDay = '') {
    const days = [
      ['MONDAY', 'Monday'], ['TUESDAY', 'Tuesday'], ['WEDNESDAY', 'Wednesday'],
      ['THURSDAY', 'Thursday'], ['FRIDAY', 'Friday'], ['SATURDAY', 'Saturday'], ['SUNDAY', 'Sunday'],
    ];
    return ['<option value="">Not set</option>', ...days.map(([value, label]) => `<option value="${value}" ${selectedDay === value ? 'selected' : ''}>${label}</option>`)].join('');
  }
  #openDialog(selector) {
    const dialog = this.root.querySelector(selector);
    if (!dialog) throw new Error('Dialog not found');
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    dialog.setAttribute('aria-hidden', 'false');
  }

  #closeDialog(selector) {
    const dialog = this.root.querySelector(selector);
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    dialog.setAttribute('aria-hidden', 'true');
  }

  #bindDialogActions() {
    const bindings = [
      ['[data-action="open-new-student"]', () => this.#openDialog('[data-view="new-student-dialog"]')],
      ['[data-action="open-student-profile"]', () => this.#openDialog('[data-view="student-profile-dialog"]')],
      ['[data-action="close-new-student"]', () => this.#closeDialog('[data-view="new-student-dialog"]')],
      ['[data-action="close-student-profile"]', () => this.#closeDialog('[data-view="student-profile-dialog"]')],
    ];
    for (const [selector, handler] of bindings) {
      const button = this.root.querySelector(selector);
      if (button) button.addEventListener('click', async event => {
        event.stopPropagation();
        try {
          await handler();
        } catch (error) {
          this.#showError(error);
        }
      });
    }
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
        } else if (target.matches('[data-action="restore-backup-file"]')) {
          const file = target.files?.[0];
          if (!file) return;
          const safety = await this.controller.createBackup();
          this.#downloadBackup(safety);
          const backup = JSON.parse(await file.text());
          await this.controller.restoreBackup(backup);
          target.value = '';
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
          this.#openDialog('[data-view="new-student-dialog"]');
        } else if (action === 'close-new-student') {
          this.#closeDialog('[data-view="new-student-dialog"]');
        } else if (action === 'open-student-profile') {
          this.#openDialog('[data-view="student-profile-dialog"]');
        } else if (action === 'close-student-profile') {
          this.#closeDialog('[data-view="student-profile-dialog"]');
        } else if (action === 'backup-now') {
          const backup = await this.controller.createBackup();
          this.#downloadBackup(backup);
        } else if (action === 'restore-backup') {
          this.root.querySelector('[data-action="restore-backup-file"]')?.click();
        } else if (action === 'delete-student') {
          const studentName = this.root.querySelector('[data-action="student-profile-name"]')?.value?.trim() || 'this student';
          const confirmed = window.confirm(`Delete ${studentName}? This permanently removes the student and all associated terms, lessons, programme work and homework. This cannot be undone.`);
          if (confirmed) {
            const safety = await this.controller.createBackup();
            this.#downloadBackup(safety);
            await this.controller.deleteStudent();
            this.#closeDialog('[data-view="student-profile-dialog"]');
            this.render();
          }
        } else if (action === 'save-student-profile') {
          const name = this.root.querySelector('[data-action="student-profile-name"]')?.value?.trim() ?? '';
          const phone = this.root.querySelector('[data-action="student-profile-phone"]')?.value?.trim() ?? '';
          const schoolType = this.root.querySelector('[data-action="student-profile-school-type"]')?.value ?? 'PRIVATE';
          const schoolName = this.root.querySelector('[data-action="student-profile-school-name"]')?.value?.trim() ?? '';
          const instrument = this.root.querySelector('[data-action="student-profile-instrument"]')?.value ?? 'VIOLIN';
          const lessonDay1 = this.root.querySelector('[data-action="student-profile-lesson-day-1"]')?.value ?? '';
          const lessonTime1 = this.root.querySelector('[data-action="student-profile-lesson-time-1"]')?.value ?? '';
          const lessonDay2 = this.root.querySelector('[data-action="student-profile-lesson-day-2"]')?.value ?? '';
          const lessonTime2 = this.root.querySelector('[data-action="student-profile-lesson-time-2"]')?.value ?? '';
          const lessonSchedule = [];
          if (lessonDay1 || lessonTime1) lessonSchedule.push({ day: lessonDay1, time: lessonTime1 });
          if (lessonDay2 || lessonTime2) lessonSchedule.push({ day: lessonDay2, time: lessonTime2 });
          await this.controller.updateStudent({ name, phone, schoolType, schoolName, instrument, lessonSchedule });
          this.#closeDialog('[data-view="student-profile-dialog"]');
          this.render();
        } else if (action === 'create-student') {
          const name = this.root.querySelector('[data-action="new-student-name"]')?.value?.trim() ?? '';
          const phone = this.root.querySelector('[data-action="new-student-phone"]')?.value?.trim() ?? '';
          const schoolType = this.root.querySelector('[data-action="new-student-school-type"]')?.value ?? 'PRIVATE';
          const schoolName = this.root.querySelector('[data-action="new-student-school-name"]')?.value?.trim() ?? '';
          const instrument = this.root.querySelector('[data-action="new-student-instrument"]')?.value ?? 'VIOLIN';
          const lessonDay1 = this.root.querySelector('[data-action="new-student-lesson-day-1"]')?.value ?? '';
          const lessonTime1 = this.root.querySelector('[data-action="new-student-lesson-time-1"]')?.value ?? '';
          const lessonDay2 = this.root.querySelector('[data-action="new-student-lesson-day-2"]')?.value ?? '';
          const lessonTime2 = this.root.querySelector('[data-action="new-student-lesson-time-2"]')?.value ?? '';
          const lessonSchedule = [];
          if (lessonDay1 || lessonTime1) lessonSchedule.push({ day: lessonDay1, time: lessonTime1 });
          if (lessonDay2 || lessonTime2) lessonSchedule.push({ day: lessonDay2, time: lessonTime2 });
          const levelRaw = this.root.querySelector('[data-action="new-student-level"]')?.value ?? '';
          const termNumber = Number(this.root.querySelector('[data-action="new-student-term-number"]')?.value ?? 1);
          const termName = this.root.querySelector('[data-action="new-student-term-name"]')?.value?.trim() ?? '';
          const startDate = this.root.querySelector('[data-action="new-student-term-start"]')?.value ?? '';
          const endDate = this.root.querySelector('[data-action="new-student-term-end"]')?.value ?? '';
          await this.controller.createStudent({
            name, phone, schoolType, schoolName, instrument, lessonSchedule,
            initialTerm: levelRaw === '' ? null : { name: termName || `Term ${termNumber}`, level: Number(levelRaw), termNumber, startDate, endDate },
          });
          this.#closeDialog('[data-view="new-student-dialog"]');
          this.render();
        } else if (action === 'create-term') {
          const name = this.root.querySelector('[data-action="new-term-name"]')?.value?.trim() ?? '';
          const level = Number(this.root.querySelector('[data-action="new-term-level"]')?.value);
          const termNumber = Number(this.root.querySelector('[data-action="new-term-number"]')?.value);
          const startDate = this.root.querySelector('[data-action="new-term-start"]')?.value ?? '';
          const endDate = this.root.querySelector('[data-action="new-term-end"]')?.value ?? '';
          await this.controller.createTerm({ name, level, termNumber, startDate, endDate });
        } else if (action === 'agenda-week-prev') {
          await this.controller.shiftAgendaWeek(-1);
        } else if (action === 'agenda-week-next') {
          await this.controller.shiftAgendaWeek(1);
        } else if (action === 'agenda-week-today') {
          await this.controller.loadAgenda(this.now());
        } else if (action === 'agenda-entry') {
          const entryId = target.dataset.agendaEntry;
          const entry = this.controller.snapshot().agenda?.entries?.find(item => item.id === entryId);
          if (!entry) throw new Error('Agenda entry not found');
          await this.controller.openAgendaEntry(entry);
        } else if (action === 'student-card') {
          await this.controller.selectStudent(target.dataset.studentId);
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
        } else if (action === 'close-lesson-view') {
          await this.controller.closeLessonView();
        } else if (action === 'end-lesson') {
          const attendance = this.root.querySelector('[data-action="attendance"]')?.value ?? 'PRESENT';
          const rawMark = this.root.querySelector('[data-action="mark"]')?.value ?? '';
          const mark = rawMark === '' ? null : Number(rawMark);
          const teacherNote = this.root.querySelector('[data-action="teacher-note"]')?.value ?? '';
          await this.controller.updateLessonDetails({ attendance, mark, teacherNote });
          await this.controller.endLesson();
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
        } else if (action === 'add-custom-homework') {
          const input = this.root.querySelector('[data-action="custom-homework-input"]');
          const text = input?.value?.trim() ?? '';
          if (!text) throw new Error('Custom homework task cannot be empty');
          const snapshot = this.controller.snapshot();
          this.controller.setHomeworkDraftItems([
            ...(snapshot.homeworkDraftItems ?? []),
            { text, completed: false }
          ]);
        } else if (action === 'remove-homework-item') {
          const index = Number(target.dataset.homeworkIndex);
          const snapshot = this.controller.snapshot();
          const items = snapshot.homeworkDraftItems ?? [];
          if (!Number.isInteger(index) || index < 0 || index >= items.length) throw new Error('Invalid homework item');
          this.controller.setHomeworkDraftItems(items.filter((_, itemIndex) => itemIndex !== index));
        } else if (action === 'generate-practice-plan') {
          const snapshot = this.controller.snapshot();
          await this.controller.generatePracticePlan(snapshot.homeworkDraftItems ?? []);
        } else if (action === 'save-homework') {
          const snapshot = this.controller.snapshot();
          let plan = snapshot.practicePlanDraft;
          if (plan) {
            const tasks = plan.tasks.map((task, index) => ({
              ...task,
              minutes: Number(this.root.querySelector(`[data-plan-minutes="${index}"]`)?.value ?? task.minutes),
              focus: this.root.querySelector(`[data-plan-focus="${index}"]`)?.value ?? task.focus
            }));
            plan = { ...plan, totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0), tasks };
          }
          await this.controller.saveHomework(snapshot.homeworkDraftItems ?? [], plan);
        } else if (action === 'save-teacher-readiness-decision') {
          const decision = this.root.querySelector('[data-action="teacher-readiness-decision"]')?.value ?? '';
          const note = this.root.querySelector('[data-action="teacher-readiness-note"]')?.value ?? '';
          await this.controller.saveTeacherReadinessDecision({ decision, note });
        } else if (action === 'focus-scale-assessment') {
          const assessment = this.root.querySelector('details[data-domain="SCALES"]');
          if (assessment) {
            assessment.open = true;
            assessment.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
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
    const addHomeworkButton = this.root.querySelector('[data-action="add-selected-to-homework"]');
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
    if (addHomeworkButton) {
      addHomeworkButton.disabled = !state.activeLessonId || state.selectedItemIds.length === 0;
      addHomeworkButton.textContent = `Add selected work${state.selectedItemIds.length ? ` (${state.selectedItemIds.length})` : ''}`;
    }
  }

  #downloadBackup(backup) {
    const stamp = (backup.createdAt ?? new Date().toISOString()).replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ViolinAI_V15_Backup_${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  #showError() {
    // Controller operations record their own error state and rollback before rejecting.
    // The Shell only re-renders that state; it must not mutate Controller state directly.
    this.render();
  }
}
