import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StudentService, TermService, TeacherTermService, WeeklyProgrammeService } from '../index.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

const setup = async (level = 7, termNumber = 1) => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const student = await new StudentService(repo).create({ name: 'Weekly Test' });
  const term = await new TermService(repo).create({
    studentId: student.id,
    name: `L${level}T${termNumber}`,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level,
    termNumber,
  });
  await new TeacherTermService(repo).activateCard(term.id);
  return { repo, term };
};

test('activating the same TKTL card twice is idempotent and preserves existing item state', async () => {
  const { repo, term } = await setup(7, 1);
  const teacherTerms = new TeacherTermService(repo);

  const first = await teacherTerms.activateCard(term.id);
  const core = first.programmeItems.find(item => item.curriculumDomain === 'PURE_TECHNICAL');
  const scale = first.programmeItems.find(item => item.curriculumDomain === 'SCALES');
  assert.ok(core);
  assert.ok(scale);

  core.targetWeek = 4;
  core.status = 'COMPLETED';
  core.completedAt = '2026-09-20T10:00:00.000Z';
  await repo.put('programmeItems', core);

  scale.details = {
    ...(scale.details ?? {}),
    mastery: {
      status: 'SECURE',
      currentTempo: 72,
      targetTempo: 80,
      note: 'Preserve assessment.',
    },
  };
  await repo.put('programmeItems', scale);

  const second = await teacherTerms.activateCard(term.id);
  const records = await repo.list('programmeItems');

  assert.equal(records.length, 25);
  assert.equal(second.programmeItems.length, 25);
  assert.equal(new Set(records.map(item => item.id)).size, 25);

  const restoredCore = await repo.get('programmeItems', core.id);
  const restoredScale = await repo.get('programmeItems', scale.id);
  assert.equal(restoredCore.targetWeek, 4);
  assert.equal(restoredCore.status, 'COMPLETED');
  assert.equal(restoredCore.completedAt, '2026-09-20T10:00:00.000Z');
  assert.equal(restoredScale.details.mastery.status, 'SECURE');
  assert.equal(restoredScale.details.mastery.currentTempo, 72);
  assert.equal(restoredScale.details.mastery.note, 'Preserve assessment.');
});

test('activated TKTL card creates 15 core items plus scale requirements', async () => {
  const { repo, term } = await setup(7, 1);
  const weekly = new WeeklyProgrammeService(repo);
  const items = await weekly.listForTerm(term.id, 1);
  assert.equal(items.length, 25);
  const coreItems = items.filter(i => i.curriculumDomain !== 'SCALES');
  assert.equal(coreItems.length, 15);

  const pureTechnical = items.filter(i => i.curriculumDomain === 'PURE_TECHNICAL');
  const etudes = items.filter(i => i.curriculumDomain === 'ETUDE');
  const repertoire = items.filter(i => i.curriculumDomain === 'REPERTOIRE');
  assert.equal(pureTechnical.length, 5);
  assert.equal(etudes.length, 5);
  assert.equal(repertoire.length, 5);

  await weekly.assignWeek(coreItems[0].id, 3);
  assert.equal((await weekly.listForTerm(term.id, 1)).length, 24);
  assert.equal((await weekly.listForTerm(term.id, 3)).length, 1);

  const summary = await weekly.summary(term.id, 3);
  assert.equal(summary.total, 1);
  assert.equal(summary.completed, 0);
  assert.equal(summary.byDomain.PURE_TECHNICAL.total, 1);
});

test('weekly programme validates against the active TKTL card', async () => {
  const { repo, term } = await setup(10, 2);
  const weekly = new WeeklyProgrammeService(repo);
  const validation = await weekly.validateTermAgainstCard(term.id);
  assert.equal(validation.cardId, 'L10T2');
  assert.equal(validation.expectedCount, 15);
  assert.equal(validation.actualCount, 15);
  assert.equal(validation.valid, true);
});

test('unknown term and invalid week are rejected', async () => {
  const repo = new InMemoryRepository();
  const weekly = new WeeklyProgrammeService(repo);
  await assert.rejects(() => weekly.listForTerm('missing', 1), /Term not found/);
  await assert.rejects(() => weekly.listForTerm('missing', 0), /Term not found/);
});


test('weekly summary rejects an unknown term through the same term boundary', async () => {
  const repo = new InMemoryRepository();
  const weekly = new WeeklyProgrammeService(repo);

  await assert.rejects(
    () => weekly.summary('missing-term', 1),
    /Term not found/
  );
});

test('weekly summary rejects a non-positive week without mutating programme items', async () => {
  const { repo, term } = await setup();
  const weekly = new WeeklyProgrammeService(repo);
  const before = await repo.list('programmeItems');

  await assert.rejects(
    () => weekly.summary(term.id, 0),
    /Week must be a positive integer/
  );

  assert.deepEqual(await repo.list('programmeItems'), before);
});


test('weekly listing rejects non-integer week values without changing the programme', async () => {
  const { repo, term } = await setup();
  const weekly = new WeeklyProgrammeService(repo);
  const before = await repo.list('programmeItems');

  for (const week of [1.5, '1']) {
    await assert.rejects(
      () => weekly.listForTerm(term.id, week),
      /Week must be a positive integer/
    );
  }

  assert.deepEqual(await repo.list('programmeItems'), before);
});


test('invalid target week does not mutate a programme item', async () => {
  const { repo, term } = await setup();
  const weekly = new WeeklyProgrammeService(repo);
  const item = (await weekly.listForTerm(term.id, 1)).find(i => i.curriculumDomain !== 'SCALES');
  const before = await repo.get('programmeItems', item.id);

  await assert.rejects(
    () => weekly.assignWeek(item.id, 0),
    /Week must be a positive integer/
  );

  const after = await repo.get('programmeItems', item.id);
  assert.equal(after.targetWeek, before.targetWeek);
});

test('assigning an unknown programme item is rejected without creating a record', async () => {
  const { repo } = await setup();
  const weekly = new WeeklyProgrammeService(repo);

  await assert.rejects(
    () => weekly.assignWeek('missing-programme-item', 4),
    /ProgrammeItem not found/
  );

  assert.equal(await repo.get('programmeItems', 'missing-programme-item'), null);
});
