import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StudentService, TermService, TeacherTermService, WeeklyProgrammeService, LessonService, LessonProgrammeService, StudentIntelligenceService } from '../index.js';
import { TeacherAgendaViewModel } from '../ui/teacher-agenda-view-model.js';
import { TeacherAgendaController, localDateString } from '../ui/teacher-agenda-controller.js';
import { TeacherAgendaShell } from '../ui/teacher-agenda-shell.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

class FakeRoot {
  constructor() { this.innerHTML = ''; this.listeners = {}; this.fields = new Map(); }
  querySelector(selector) { return this.fields.get(selector) ?? null; }
  querySelectorAll() { return []; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  async dispatch(type, event) { return this.listeners[type]?.(event); }
}

test('date-only helper uses local calendar date rather than UTC date', () => {
  const lateLocalDate = new Date(2026, 8, 23, 23, 30, 0);
  assert.equal(localDateString(lateLocalDate), '2026-09-23');
});

test('teacher agenda shell renders the V15 workspace from controller state', async () => {
  const repo = new InMemoryRepository(); registerV1Curricula();
  const studentService = new StudentService(repo); const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo); const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo); const lessonProgramme = new LessonProgrammeService(repo);
  const vm = new TeacherAgendaViewModel({ studentService, termService, teacherTermService, weeklyProgrammeService: weekly, lessonService: lessons, lessonProgrammeService: lessonProgramme });
  const controller = new TeacherAgendaController(vm); const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-17' });
  await studentService.create({ name: 'Shell Test' });
  await shell.start();
  assert.match(root.innerHTML, /Teacher Agenda/); assert.match(root.innerHTML, /Select student/);
});

test('shell requires the V15 controller boundary', () => assert.throws(() => new TeacherAgendaShell({ controller: {}, root: new FakeRoot() }), /TeacherAgendaController/));

test('shell renders lesson-session controls after a student and term are selected', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService: weekly,
    lessonService: lessons,
    lessonProgrammeService: lessonProgramme,
    homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-18' });

  const student = await studentService.create({ name: 'Lesson Shell Test' });
  await termService.create({
    studentId: student.id,
    name: 'L5T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 5,
    termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  shell.render();

  assert.match(root.innerHTML, /Lesson Session/);
  assert.match(root.innerHTML, /Start lesson/);
  await controller.createLesson('2026-09-18');
  shell.render();
  assert.match(root.innerHTML, /data-action="lesson" disabled/);
  assert.match(root.innerHTML, /Lesson active ✓/);
  assert.match(root.innerHTML, /data-action="teacher-note"/);
  assert.doesNotMatch(root.innerHTML, /Start lesson/);
  assert.match(root.innerHTML, /Lesson History/);
  assert.match(root.innerHTML, /data-lesson-history-item/);
  assert.match(root.innerHTML, /Complete selected \(0\)/);
  assert.match(root.innerHTML, /Select all pending core \(15\)/);
  assert.match(root.innerHTML, /Clear selection \(0\)/);
  assert.doesNotMatch(root.innerHTML, /Start a lesson below to enable Review selected/);
  assert.match(root.innerHTML, /Review records lesson activity; Complete selected updates progress/);
  assert.match(root.innerHTML, /Lesson activity: 0 reviewed/);
  assert.match(root.innerHTML, /Current term/);
  assert.match(root.innerHTML, /Create new term/);
  assert.match(root.innerHTML, /Weekly progress/);
  assert.match(root.innerHTML, /pending/);
  assert.match(root.innerHTML, /data-item=/);
  assert.match(root.innerHTML, /Weekly Agenda/);
  assert.match(root.innerHTML, /Lesson dashboard/);
  assert.match(root.innerHTML, /Term progress/);
  assert.match(root.innerHTML, /Scale mastery/);
  assert.doesNotMatch(root.innerHTML, /No lesson started/);
  assert.match(root.innerHTML, /SCALES/);
  assert.match(root.innerHTML, /Scale Progress \/ Mastery/);
  assert.match(root.innerHTML, /Mastery is teacher-assessed/);
  assert.match(root.innerHTML, /Save assessment/);
  assert.match(root.innerHTML, /PURE TECHNICAL 0\/5/);
  assert.match(root.innerHTML, /ETUDE 0\/5/);
  assert.match(root.innerHTML, /REPERTOIRE 0\/5/);
  assert.match(root.innerHTML, /New student/);

  const itemId = controller.snapshot().weekly.items.find(item => item.curriculumDomain !== 'SCALES').id;
  controller.toggleItemSelection(itemId);
  shell.render();
  assert.match(root.innerHTML, /Complete selected \(1\)/);
  assert.match(root.innerHTML, /Clear selection \(1\)/);
  assert.match(root.innerHTML, /Review selected \(1\)/);
  assert.match(root.innerHTML, /Carry to Week 2/);
  await controller.reviewItems([itemId]);
  shell.render();
  assert.match(root.innerHTML, /Review records lesson activity; Complete selected updates progress/);
  assert.match(root.innerHTML, /Lesson activity: 1 reviewed/);
  assert.match(root.innerHTML, /\(reviewed\)/);
});

test('shell exposes a live weekly selection-count target', async () => {
  const repo = new InMemoryRepository(); registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-21' });
  const student = await studentService.create({ name: 'Selection Summary Test' });
  await termService.create({
    studentId: student.id, name: 'L1T1',
    startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  await shell.start();
  await controller.selectStudent(student.id);
  shell.render();

  assert.match(root.innerHTML, /data-view="weekly-selection-count"/);
  assert.match(root.innerHTML, /21 pending · 0 selected/);
});


test('shell disables select-all when no pending core items remain', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService: weekly,
    lessonService: lessons,
    lessonProgrammeService: lessonProgramme,
    homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-19' });

  const student = await studentService.create({ name: 'Select All Boundary Test' });
  await termService.create({
    studentId: student.id,
    name: 'L1T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 1,
    termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  shell.render();

  const coreIds = controller.snapshot().weekly.items
    .filter(item => item.curriculumDomain !== 'SCALES')
    .map(item => item.id);
  await controller.completeItems(coreIds);
  shell.render();

  assert.match(root.innerHTML, /Select all pending core \(0\)/);
  assert.match(root.innerHTML, /data-action="select-all-pending"[^>]*disabled/);
});


test('shell renders Uncomplete for completed core programme items', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService: weekly,
    lessonService: lessons,
    lessonProgrammeService: lessonProgramme,
    homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-20' });

  const student = await studentService.create({ name: 'Uncomplete Shell Test' });
  await termService.create({
    studentId: student.id,
    name: 'L1T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 1,
    termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  const item = controller.snapshot().weekly.items.find(candidate => candidate.curriculumDomain !== 'SCALES');
  await controller.completeItems([item.id]);
  shell.render();

  assert.match(root.innerHTML, /Uncomplete/);
  assert.doesNotMatch(root.innerHTML, /data-uncomplete=""[^>]*>Uncomplete/);
});


test('shell escapes persisted scale mastery status before rendering HTML', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-23' });
  const student = await studentService.create({ name: 'Encoding Test' });
  await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  await shell.start();
  await controller.selectStudent(student.id);
  const scaleItem = controller.snapshot().weekly.items.find(item => item.curriculumDomain === 'SCALES');
  scaleItem.details.mastery = { status: '<img src=x onerror=alert(1)>', currentTempo: null, targetTempo: null };
  await repo.put('programmeItems', scaleItem);
  await controller.selectWeek(1);
  shell.render();

  assert.doesNotMatch(root.innerHTML, /<img src=x onerror=alert\(1\)>/);
  assert.match(root.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
});


test('shell renders teacher decision prompts from evidence-linked TKTL guidance', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService,
    termService,
    weeklyProgrammeService: weekly,
    lessonService: lessons,
    homeworkService: homework,
    teacherTermService,
    repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-23' });

  const student = await studentService.create({ name: 'Decision Prompt Test' });
  await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  shell.render();

  assert.match(root.innerHTML, /Teacher Decision Prompts/);
  assert.match(root.innerHTML, /Evidence:/);
  assert.match(root.innerHTML, /Teacher decision logic/);
  assert.match(root.innerHTML, /Readiness criteria/);
  assert.match(root.innerHTML, /Next-term dependency/);
  assert.match(root.innerHTML, /Teacher readiness decision/);
  assert.match(root.innerHTML, /Advance to next term/);
  assert.match(root.innerHTML, /Continue current term/);
  assert.match(root.innerHTML, /Targeted review before advance/);
  assert.match(root.innerHTML, /Save teacher decision/);
});


test('shell routes teacher readiness save through the controller boundary', async () => {
  const repo = new InMemoryRepository(); registerV1Curricula();
  const studentService = new StudentService(repo); const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo); const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo); const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    homeworkService: homework, repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  root.fields.set('[data-action="teacher-readiness-decision"]', { value: 'TARGETED_REVIEW_BEFORE_ADVANCE' });
  root.fields.set('[data-action="teacher-readiness-note"]', { value: '  Shell-saved note.  ' });
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Readiness Shell Save Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term.id);
  await root.dispatch('click', {
    target: {
      dataset: { action: 'save-teacher-readiness-decision' },
      closest: () => ({ dataset: { action: 'save-teacher-readiness-decision' } }),
    },
  });

  const stored = await repo.get('terms', term.id);
  assert.equal(stored.readinessDecision, 'TARGETED_REVIEW_BEFORE_ADVANCE');
  assert.equal(stored.readinessDecisionNote, 'Shell-saved note.');
  assert.equal(controller.snapshot().teacherReadinessReview.checklist[0].decision, 'TARGETED_REVIEW_BEFORE_ADVANCE');
});
test('shell reports an invalid teacher readiness save without mutating the prior decision', async () => {
  const repo = new InMemoryRepository(); registerV1Curricula();
  const studentService = new StudentService(repo); const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo); const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo); const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    homeworkService: homework, repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  root.fields.set('[data-action="teacher-readiness-decision"]', { value: 'READY' });
  root.fields.set('[data-action="teacher-readiness-note"]', { value: 'Invalid replacement.' });
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Readiness Shell Error Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  await termService.setReadinessDecision(term.id, {
    decision: 'CONTINUE_CURRENT_TERM',
    note: 'Prior decision.',
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term.id);
  await root.dispatch('click', {
    target: {
      dataset: { action: 'save-teacher-readiness-decision' },
      closest: () => ({ dataset: { action: 'save-teacher-readiness-decision' } }),
    },
  });

  const stored = await repo.get('terms', term.id);
  assert.equal(stored.readinessDecision, 'CONTINUE_CURRENT_TERM');
  assert.equal(stored.readinessDecisionNote, 'Prior decision.');
  assert.equal(controller.snapshot().teacherReadinessReview.checklist[0].decision, 'CONTINUE_CURRENT_TERM');
  assert.equal(controller.snapshot().teacherReadinessReview.checklist[0].decisionNote, 'Prior decision.');
  assert.equal(controller.snapshot().error, 'Teacher readiness decision is invalid');
});
test('shell clears a recorded teacher readiness decision through the same save boundary', async () => {
  const repo = new InMemoryRepository(); registerV1Curricula();
  const studentService = new StudentService(repo); const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo); const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo); const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    homeworkService: homework, repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const decisionField = { value: '' };
  const noteField = { value: '' };
  root.fields.set('[data-action="teacher-readiness-decision"]', decisionField);
  root.fields.set('[data-action="teacher-readiness-note"]', noteField);
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Readiness Shell Clear Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  await termService.setReadinessDecision(term.id, {
    decision: 'TARGETED_REVIEW_BEFORE_ADVANCE',
    note: 'Clear this decision.',
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term.id);
  await root.dispatch('click', {
    target: {
      dataset: { action: 'save-teacher-readiness-decision' },
      closest: () => ({ dataset: { action: 'save-teacher-readiness-decision' } }),
    },
  });

  const stored = await repo.get('terms', term.id);
  assert.equal(stored.readinessDecision, null);
  assert.equal(stored.readinessDecisionNote, '');
  assert.equal(stored.readinessDecisionAt, null);
  assert.equal(controller.snapshot().teacherReadinessReview.checklist[0].decision, null);
  assert.equal(controller.snapshot().teacherReadinessReview.checklist[0].decisionNote, '');
});
test('shell renders lesson teacher notes from the student intelligence timeline', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    homeworkService: homework, repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Timeline Note Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  await lessons.create({
    termId: term.id,
    date: '2026-09-23',
    attendance: 'PRESENT',
    mark: 14,
    teacherNote: '  Relax the bow hand.  ',
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term.id);
  shell.render();

  assert.match(root.innerHTML, /Student timeline · 1 event\(s\)/);
  assert.match(root.innerHTML, /LESSON/);
  assert.match(root.innerHTML, /2026-09-23/);
  assert.match(root.innerHTML, /Mark 14/);
  assert.match(root.innerHTML, /Teacher note:<\/strong> Relax the bow hand\./);
});

test('shell renders teacher readiness review as a teacher-led checklist', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    homeworkService: homework, repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Readiness Review Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L1T2', startDate: '2027-01-01', endDate: '2027-04-30',
    level: 1, termNumber: 2,
  });
  await termService.setReadinessDecision(term1.id, {
    decision: 'CONTINUE_CURRENT_TERM',
    note: 'Historical term decision.',
  });
  await termService.setReadinessDecision(term2.id, {
    decision: 'ADVANCE_TO_NEXT_TERM',
    note: 'Latest term decision.',
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term1.id);
  shell.render();

  assert.match(root.innerHTML, /Teacher Readiness Review/);
  assert.match(root.innerHTML, /Teacher review checklist · L1T1/);
  assert.match(root.innerHTML, /Continue current term/);
  assert.match(root.innerHTML, /Historical term decision\./);
  assert.doesNotMatch(root.innerHTML, /Latest term decision\./);
  assert.doesNotMatch(root.innerHTML, /(?:^|>)\\s*(?:PASS|FAIL|Ready|Not ready)\\s*(?:<|$)/i);
});


test('shell routes term selection through the controller and refreshes readiness review', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    homeworkService: homework, repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Term Shell Selection Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L1T2', startDate: '2027-01-01', endDate: '2027-04-30',
    level: 1, termNumber: 2,
  });
  await termService.setReadinessDecision(term1.id, {
    decision: 'CONTINUE_CURRENT_TERM',
    note: 'Term one decision.',
  });
  await termService.setReadinessDecision(term2.id, {
    decision: 'TARGETED_REVIEW_BEFORE_ADVANCE',
    note: 'Term two decision.',
  });

  await shell.start();
  await controller.selectStudent(student.id);
  shell.render();

  const termTarget = {
    value: term2.id,
    matches: selector => selector === '[data-action="term"]',
  };
  await root.dispatch('change', { target: termTarget });

  const state = controller.snapshot();
  assert.equal(state.selectedTermId, term2.id);
  assert.equal(state.teacherReadinessReview.currentTerm.id, term2.id);
  assert.match(root.innerHTML, /Teacher review checklist · L1T2/);
  assert.match(root.innerHTML, /Targeted review before advance/);
  assert.match(root.innerHTML, /Term two decision\./);
  assert.doesNotMatch(root.innerHTML, /Term one decision\./);
});

test('shell reports an invalid historical lesson selection without mutating the active lesson', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Cross Term Lesson Shell Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L1T2', startDate: '2027-01-01', endDate: '2027-04-30',
    level: 1, termNumber: 2,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term1.id);
  const active = await controller.createLesson('2026-09-24', { teacherNote: 'Keep this lesson active.' });
  const foreign = await lessons.create({ termId: term2.id, date: '2027-01-10', teacherNote: 'Foreign lesson.' });
  shell.render();

  await root.dispatch('click', {
    target: {
      dataset: { action: 'select-lesson', lessonId: foreign.id },
      closest: () => ({ dataset: { action: 'select-lesson', lessonId: foreign.id } }),
    },
  });

  const state = controller.snapshot();
  assert.equal(state.activeLessonId, active.id);
  assert.equal(state.activeLesson.teacherNote, 'Keep this lesson active.');
  assert.match(root.innerHTML, /Lesson does not belong to selected term/);
});

test('shell reopens a historical lesson through the lesson-history control', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Historical Lesson Shell Test' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L1T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 1,
    termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term.id);
  const firstLesson = await controller.createLesson('2026-09-10', { mark: 17, attendance: 'LATE', teacherNote: 'Historical shell note.' });
  await controller.createLesson('2026-09-24', { mark: 19 });
  shell.render();

  assert.match(root.innerHTML, new RegExp(`data-lesson-history-item="${firstLesson.id}"`));

  await root.dispatch('click', {
    target: {
      dataset: { action: 'select-lesson', lessonId: firstLesson.id },
      closest: () => ({ dataset: { action: 'select-lesson', lessonId: firstLesson.id } }),
    },
  });

  const state = controller.snapshot();
  assert.equal(state.activeLessonId, firstLesson.id);
  assert.equal(state.activeLesson.teacherNote, 'Historical shell note.');
  assert.equal(state.activeLesson.attendance, 'LATE');
  assert.equal(state.activeLesson.mark, 17);
  assert.match(root.innerHTML, /Historical shell note\./);
  assert.match(root.innerHTML, /data-selected="true"/);
});

test('shell routes lesson details save through the controller with teacher note', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  root.fields.set('[data-action="attendance"]', { value: 'LATE' });
  root.fields.set('[data-action="mark"]', { value: '18' });
  root.fields.set('[data-action="teacher-note"]', { value: '  Shell lesson note.  ' });
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Lesson Details Shell Save Test' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L1T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 1,
    termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term.id);
  await controller.createLesson('2026-09-24');
  shell.render();

  await root.dispatch('click', {
    target: {
      dataset: { action: 'save-details' },
      closest: () => ({ dataset: { action: 'save-details' } }),
    },
  });

  const stored = await repo.get('lessons', controller.snapshot().activeLessonId);
  assert.equal(stored.attendance, 'LATE');
  assert.equal(stored.mark, 18);
  assert.equal(stored.teacherNote, 'Shell lesson note.');
  assert.match(root.innerHTML, /Shell lesson note./);
});


test('shell reports invalid lesson details without mutating the active lesson', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const attendanceField = { value: 'LATE' };
  const markField = { value: '21' };
  const noteField = { value: 'Invalid shell update.' };
  root.fields.set('[data-action="attendance"]', attendanceField);
  root.fields.set('[data-action="mark"]', markField);
  root.fields.set('[data-action="teacher-note"]', noteField);
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Invalid Lesson Details Shell Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L1T1',
    startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term.id);
  const lesson = await controller.createLesson('2026-09-24', {
    mark: 17,
    attendance: 'PRESENT',
    teacherNote: 'Original shell lesson note.',
  });
  shell.render();

  await root.dispatch('click', {
    target: {
      dataset: { action: 'save-details' },
      closest: () => ({ dataset: { action: 'save-details' } }),
    },
  });

  const state = controller.snapshot();
  assert.equal(state.activeLessonId, lesson.id);
  assert.equal(state.activeLesson.mark, 17);
  assert.equal(state.activeLesson.attendance, 'PRESENT');
  assert.equal(state.activeLesson.teacherNote, 'Original shell lesson note.');
  assert.match(root.innerHTML, /Lesson.mark must be 1–20 or null/);

  const stored = await repo.get('lessons', lesson.id);
  assert.equal(stored.mark, 17);
  assert.equal(stored.attendance, 'PRESENT');
  assert.equal(stored.teacherNote, 'Original shell lesson note.');
});

test('shell reports an invalid term selection without mutating the selected term', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    homeworkService: homework, repository: repo,
  });
  const vm = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService,
    weeklyProgrammeService: weekly, lessonService: lessons,
    lessonProgrammeService: lessonProgramme, homeworkService: homework,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-24' });

  const student = await studentService.create({ name: 'Invalid Term Shell Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L1T1',
    startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  shell.render();

  await root.dispatch('change', {
    target: {
      value: 'missing-term',
      matches: selector => selector === '[data-action="term"]',
    },
  });

  const state = controller.snapshot();
  assert.equal(state.selectedTermId, term.id);
  assert.equal(state.termContext.term.id, term.id);
  assert.equal(state.error, 'Term does not belong to selected student');
  assert.match(root.innerHTML, /Term does not belong to selected student/);
  assert.match(root.innerHTML, /Teacher Readiness Review/);
});
