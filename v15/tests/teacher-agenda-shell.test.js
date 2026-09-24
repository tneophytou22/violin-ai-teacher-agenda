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
