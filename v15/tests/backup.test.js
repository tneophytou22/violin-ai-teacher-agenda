import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BackupService,
  BACKUP_FORMAT_VERSION,
  InMemoryRepository,
  createTeacherAgendaApp,
  registerV1Curricula,
} from '../index.js';
import { TeacherAgendaShell } from '../ui/teacher-agenda-shell.js';

const STORE_NAMES = ['students', 'terms', 'lessons', 'programmeItems', 'homework'];

const sampleData = () => ({
  students: [{
    id: 'student-1',
    name: 'Backup Student',
    lessonDay: 'TUESDAY',
    lessonTime: '17:30',
    schoolType: 'PRIVATE',
    instrument: 'VIOLIN',
  }],
  terms: [{
    id: 'term-1',
    studentId: 'student-1',
    name: 'L4T1',
    level: 4,
    termNumber: 1,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  }],
  lessons: [{
    id: 'lesson-1',
    termId: 'term-1',
    date: '2026-09-27',
    attendance: 'PRESENT',
    mark: 18,
    reviewedProgrammeItemIds: ['programme-1'],
  }],
  programmeItems: [{
    id: 'programme-1',
    termId: 'term-1',
    curriculumDomain: 'SCALES',
    title: 'D major 2 octaves',
    status: 'PLANNED',
    details: {
      mastery: {
        status: 'DEVELOPING',
        currentTempo: 52,
        targetTempo: 60,
        intonation: 'SECURE',
        bowControl: 'DEVELOPING',
        consistency: 'DEVELOPING',
        note: 'Keep the bow straight.',
      },
    },
  }],
  homework: [{
    id: 'homework-1',
    lessonId: 'lesson-1',
    items: [{
      title: 'Slow scale practice',
      minutes: 10,
      curriculumDomain: 'SCALES',
    }],
    practicePlan: {
      totalMinutes: 25,
      generatedBy: 'Practice Planner / Practice Intelligence',
      generatedAt: '2026-09-27T10:00:00.000Z',
      tasks: [{
        homeworkItemIndex: 0,
        minutes: 25,
        focus: 'slow accurate repetitions',
      }],
    },
  }],
});

const seedRepository = async repo => {
  const data = sampleData();
  for (const name of STORE_NAMES) {
    for (const record of data[name]) await repo.put(name, record);
  }
  return data;
};

test('BackupService creates a portable backup containing exactly the five V15 stores', async () => {
  const repo = new InMemoryRepository();
  await seedRepository(repo);

  const service = new BackupService(repo);
  const backup = await service.createBackup();

  assert.equal(backup.format, 'violin-ai-teacher-agenda-v15-backup');
  assert.equal(backup.formatVersion, BACKUP_FORMAT_VERSION);
  assert.ok(backup.createdAt);
  assert.deepEqual(Object.keys(backup.stores), STORE_NAMES);
  assert.deepEqual(backup.counts, {
    students: 1,
    terms: 1,
    lessons: 1,
    programmeItems: 1,
    homework: 1,
  });
  assert.deepEqual(backup.stores.students[0], sampleData().students[0]);
  assert.deepEqual(backup.stores.homework[0].practicePlan, sampleData().homework[0].practicePlan);
  assert.deepEqual(backup.stores.programmeItems[0].details.mastery, sampleData().programmeItems[0].details.mastery);
  assert.equal(Object.prototype.hasOwnProperty.call(backup, 'curriculumRegistry'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(backup, 'controllerState'), false);
});

test('BackupService restores all five stores after current data is mutated', async () => {
  const repo = new InMemoryRepository();
  const original = await seedRepository(repo);
  const service = new BackupService(repo);
  const backup = await service.createBackup();

  await repo.put('students', { id: 'student-2', name: 'Unrelated Mutation' });
  await repo.delete('lessons', 'lesson-1');
  await repo.put('homework', {
    id: 'homework-mutated',
    lessonId: 'lesson-2',
    items: [{ title: 'Mutated' }],
  });

  await service.restoreBackup(backup);

  for (const name of STORE_NAMES) {
    assert.deepEqual(await repo.list(name), original[name]);
  }
});

test('BackupService rejects invalid backup format', async () => {
  const service = new BackupService(new InMemoryRepository());
  assert.throws(
    () => service.validateBackup({ format: 'wrong', formatVersion: 1, stores: {} }),
    /Invalid V15 backup file/
  );
});

test('BackupService rejects unsupported format version', async () => {
  const service = new BackupService(new InMemoryRepository());
  assert.throws(
    () => service.validateBackup({
      format: 'violin-ai-teacher-agenda-v15-backup',
      formatVersion: BACKUP_FORMAT_VERSION + 1,
      stores: Object.fromEntries(STORE_NAMES.map(name => [name, []])),
    }),
    /Unsupported V15 backup format version/
  );
});

test('BackupService rejects missing store', async () => {
  const service = new BackupService(new InMemoryRepository());
  const stores = Object.fromEntries(STORE_NAMES.map(name => [name, []]));
  delete stores.homework;
  assert.throws(
    () => service.validateBackup({
      format: 'violin-ai-teacher-agenda-v15-backup',
      formatVersion: BACKUP_FORMAT_VERSION,
      stores,
      counts: Object.fromEntries(STORE_NAMES.map(name => [name, stores[name]?.length ?? 0])),
    }),
    /missing store: homework/
  );
});

test('BackupService rejects missing store counts', async () => {
  const service = new BackupService(new InMemoryRepository());
  const stores = Object.fromEntries(STORE_NAMES.map(name => [name, []]));
  assert.throws(
    () => service.validateBackup({
      format: 'violin-ai-teacher-agenda-v15-backup',
      formatVersion: BACKUP_FORMAT_VERSION,
      stores,
    }),
    /missing store counts/
  );
});

test('BackupService rejects store count mismatch', async () => {
  const service = new BackupService(new InMemoryRepository());
  const stores = Object.fromEntries(STORE_NAMES.map(name => [name, []]));
  stores.students = [{ id: 'student-1', name: 'Count mismatch' }];
  const counts = Object.fromEntries(STORE_NAMES.map(name => [name, stores[name].length]));
  counts.students = 0;
  assert.throws(
    () => service.validateBackup({
      format: 'violin-ai-teacher-agenda-v15-backup',
      formatVersion: BACKUP_FORMAT_VERSION,
      stores,
      counts,
    }),
    /count mismatch for store: students/
  );
});

test('BackupService rejects invalid records', async () => {
  const service = new BackupService(new InMemoryRepository());
  const stores = Object.fromEntries(STORE_NAMES.map(name => [name, []]));
  stores.students = [{ name: 'Missing id' }];
  assert.throws(
    () => service.validateBackup({
      format: 'violin-ai-teacher-agenda-v15-backup',
      formatVersion: BACKUP_FORMAT_VERSION,
      stores,
    }),
    /Invalid record in V15 backup store: students/
  );
});

test('controller restore clears stale selection/runtime state and reloads restored students', async () => {
  registerV1Curricula();
  const repository = new InMemoryRepository();
  const app = createTeacherAgendaApp({ repository, root: { innerHTML: '', addEventListener() {}, removeEventListener() {} } });

  const student = await app.controller.createStudent({
    name: 'Restore Student',
    lessonDay: 'THURSDAY',
    lessonTime: '18:00',
  });
  const term = await app.controller.createTerm({
    name: 'L4T1',
    level: 4,
    termNumber: 1,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  });
  await app.controller.createLesson('2026-09-27');
  const backup = await app.controller.createBackup();

  await repository.put('students', { id: 'mutated-student', name: 'Mutation' });
  await app.controller.restoreBackup(backup);

  let state = app.controller.snapshot();
  assert.equal(state.selectedStudentId, null);
  assert.equal(state.selectedTermId, null);
  assert.equal(state.termContext, null);
  assert.equal(state.week, 1);
  assert.equal(state.activeLessonId, null);
  assert.equal(state.weekly, null);
  assert.equal(state.scaleProgress, null);
  assert.equal(state.termProgress, null);
  assert.equal(state.lessonHistory.length, 0);
  assert.equal(state.homework, null);
  assert.equal(state.practicePlanDraft, null);
  assert.equal(state.studentIntelligence, null);
  assert.equal(state.longitudinalDevelopment, null);
  assert.equal(state.evidenceSignals.length, 0);
  assert.equal(state.teacherDecisionPrompts.length, 0);
  assert.equal(state.teacherReadinessReview, null);

  assert.deepEqual(await repository.get('students', student.id), backup.stores.students[0]);
  assert.equal(await repository.get('students', 'mutated-student'), null);
  assert.equal(await repository.get('terms', term.id) !== null, true);
});

test('restored schedule, homework practice plan and scale mastery survive app reload', async () => {
  registerV1Curricula();
  const repository = new InMemoryRepository();
  const root = { innerHTML: '', addEventListener() {}, removeEventListener() {} };
  const app = createTeacherAgendaApp({ repository, root });

  const student = await app.controller.createStudent({
    name: 'Persistence Restore Student',
    lessonDay: 'FRIDAY',
    lessonTime: '16:45',
  });
  await app.controller.createTerm({
    name: 'L7T1',
    level: 7,
    termNumber: 1,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  });
  const before = app.controller.snapshot();
  const scale = before.weekly.items.find(item => item.curriculumDomain === 'SCALES');
  const core = before.weekly.items.find(item => item.curriculumDomain !== 'SCALES');
  assert.ok(scale);
  assert.ok(core);

  await app.controller.createLesson('2026-09-27');
  const homework = [{ id: core.id, title: core.title, curriculumDomain: core.curriculumDomain }];
  await app.controller.generatePracticePlan(homework);
  await app.controller.saveHomework(homework);
  await app.controller.assessScale(scale.id, {
    status: 'DEVELOPING',
    currentTempo: 52,
    targetTempo: 60,
    intonation: 'SECURE',
    bowControl: 'DEVELOPING',
    consistency: 'DEVELOPING',
    note: 'Keep the bow straight.',
  });

  const backup = await app.controller.createBackup();
  await app.controller.restoreBackup(backup);

  const refreshed = createTeacherAgendaApp({ repository, root: { innerHTML: '', addEventListener() {}, removeEventListener() {} } });
  await refreshed.controller.loadStudents();
  await refreshed.controller.selectStudent(student.id);

  const state = refreshed.controller.snapshot();
  assert.equal(state.students[0].lessonDay, 'FRIDAY');
  assert.equal(state.students[0].lessonTime, '16:45');
  assert.equal(state.lessonHistory.length, 1);
  assert.deepEqual(state.homework.items, homework);
  assert.ok(state.homework.practicePlan);
  assert.equal(state.homework.practicePlan.totalMinutes, 65);

  const restoredScale = state.scaleProgress.items.find(item => item.id === scale.id);
  assert.equal(restoredScale.details.mastery.status, 'DEVELOPING');
  assert.equal(restoredScale.details.mastery.currentTempo, 52);
});

test('delete student keeps the safety backup before cascade deletion', async () => {
  registerV1Curricula();
  const repository = new InMemoryRepository();
  const root = {
    innerHTML: '',
    listeners: {},
    fields: new Map(),
    querySelector(selector) {
      if (this.fields.has(selector)) return this.fields.get(selector);
      return {
        open: false,
        setAttribute() {},
        removeAttribute() {},
      };
    },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    removeEventListener() {},
    async dispatch(type, event) { return this.listeners[type]?.(event); },
  };
  const app = createTeacherAgendaApp({ repository, root });
  const student = await app.controller.createStudent({
    name: 'Delete Safety Student',
    lessonDay: 'MONDAY',
    lessonTime: '17:00',
  });
  await app.controller.createTerm({
    name: 'L4T1',
    level: 4,
    termNumber: 1,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  });
  await app.shell.start();
  await app.controller.selectStudent(student.id);

  root.fields.set('[data-action="student-profile-name"]', { value: student.name });
  root.fields.set('[data-view="student-profile-dialog"]', {
    open: false,
    setAttribute() {},
    removeAttribute() {},
  });

  const downloads = [];
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldURL = globalThis.URL;
  globalThis.window = { confirm: () => true };
  globalThis.document = {
    body: {
      appendChild(link) {
        downloads.push(link);
      },
    },
    createElement() {
      return {
        href: '',
        download: '',
        click() {},
        remove() {},
      };
    },
  };
  globalThis.URL = {
    createObjectURL() { return 'blob:test'; },
    revokeObjectURL() {},
  };

  try {
    await root.dispatch('click', {
      target: {
        closest: () => ({ dataset: { action: 'delete-student' } }),
      },
    });
  } finally {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.URL = oldURL;
  }

  assert.equal(downloads.length, 1);
  assert.match(downloads[0].download, /^ViolinAI_V15_Backup_/);
  assert.equal(await repository.get('students', student.id), null);
  assert.deepEqual(root.innerHTML.includes('Delete Safety Student'), false);
});
