const DOMAIN_LABELS = Object.freeze({
  PURE_TECHNICAL: 'Pure Technical',
  ETUDE: 'Etude / Study / Caprice',
  REPERTOIRE: 'Repertoire',
});

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const itemStatus = item => item.status === 'COMPLETED' ? 'Completed' : 'Planned';

function renderItem(item) {
  const completed = item.status === 'COMPLETED';
  return `<article class="agenda-item ${completed ? 'is-complete' : ''}" data-item-id="${escapeHtml(item.id)}">
    <div class="agenda-item-main">
      <strong>${escapeHtml(item.title)}</strong>
      <span class="agenda-item-meta">${escapeHtml(itemStatus(item))}</span>
    </div>
    <div class="agenda-item-actions">
      <label><input type="checkbox" data-action="select-item" value="${escapeHtml(item.id)}" ${completed ? 'disabled' : ''}> Review</label>
      ${completed ? '' : `<button type="button" data-action="complete" data-item-id="${escapeHtml(item.id)}">Complete</button>`}
      ${completed ? '' : `<button type="button" data-action="carry" data-item-id="${escapeHtml(item.id)}">Carry →</button>`}
    </div>
  </article>`;
}

function renderDomainColumn(domain, items) {
  return `<section class="agenda-column" data-domain="${escapeHtml(domain)}">
    <header><h3>${escapeHtml(DOMAIN_LABELS[domain] ?? domain)}</h3><span>${items.length}</span></header>
    <div class="agenda-items">${items.length ? items.map(renderItem).join('') : '<p class="empty">Nothing assigned this week.</p>'}</div>
  </section>`;
}

export function renderTeacherAgenda(state) {
  const weeklyItems = state.weekly?.items ?? [];
  const grouped = Object.groupBy ? Object.groupBy(weeklyItems, item => item.curriculumDomain) : weeklyItems.reduce((acc, item) => {
    (acc[item.curriculumDomain] ??= []).push(item);
    return acc;
  }, {});
  const term = state.termContext?.term;
  const card = state.termContext?.card;
  const student = state.termContext?.student;
  const error = state.error ? `<div class="agenda-error" role="alert">${escapeHtml(state.error)}</div>` : '';

  return `<main class="teacher-agenda" aria-busy="${state.loading ? 'true' : 'false'}">
    ${error}
    <header class="agenda-header">
      <div>
        <p class="eyebrow">Teacher Agenda</p>
        <h1>${escapeHtml(student?.name ?? 'Students')}</h1>
        ${term ? `<p>L${escapeHtml(term.level)} · Term ${escapeHtml(term.termNumber)} · Card ${escapeHtml(card?.id ?? '')}</p>` : '<p>Select a student and active term.</p>'}
      </div>
      <div class="agenda-progress">
        <strong>${state.weekly?.summary?.completed ?? 0}/${state.weekly?.summary?.total ?? 0}</strong>
        <span>completed · Week ${escapeHtml(state.week)}</span>
      </div>
    </header>

    <section class="agenda-toolbar">
      <label>Student
        <select data-action="student">
          <option value="">Select student</option>
          ${state.students.map(s => `<option value="${escapeHtml(s.id)}" ${s.id === state.selectedStudentId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </label>
      <label>Term
        <select data-action="term" ${state.terms.length ? '' : 'disabled'}>
          ${state.terms.length ? state.terms.map(t => `<option value="${escapeHtml(t.id)}" ${t.id === state.selectedTermId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('') : '<option>No term</option>'}
        </select>
      </label>
      <label>Week
        <input data-action="week" type="number" min="1" value="${escapeHtml(state.week)}">
      </label>
      <button type="button" data-action="new-lesson" ${state.selectedTermId ? '' : 'disabled'}>New Lesson</button>
    </section>

    <section class="agenda-grid">
      ${renderDomainColumn('PURE_TECHNICAL', grouped.PURE_TECHNICAL ?? [])}
      ${renderDomainColumn('ETUDE', grouped.ETUDE ?? [])}
      ${renderDomainColumn('REPERTOIRE', grouped.REPERTOIRE ?? [])}
    </section>

    <aside class="lesson-panel">
      <div><h2>Lesson</h2><p>${state.activeLessonId ? `Active lesson: ${escapeHtml(state.activeLessonId)}` : 'Create a lesson to review this week\'s work.'}</p></div>
      <button type="button" data-action="review" ${state.activeLessonId ? '' : 'disabled'}>Review selected</button>
    </aside>
  </main>`;
}
