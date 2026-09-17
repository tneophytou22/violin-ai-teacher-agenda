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

test('activated TKTL card creates 15 programme items and weekly summary can be assigned', async () => {
  const { repo, term } = await setup(7, 1);
  const weekly = new WeeklyProgrammeService(repo);
  const items = await weekly.listForTerm(term.id, 1);
  assert.equal(items.length, 15);

  const pureTechnical = items.filter(i => i.curriculumDomain === 'PURETECHNICAL');
  const etudes = items.filter(i => i.curriculumDomain === 'ETUDES');
  const repertoire = items.filter(i => i.curriculumDomain === 'REPERTOIRE');
  assert.equal(pureTechnical.length, 5);
  assert.equal(etudes.length, 5);
  assert.equal(repertoire.length, 5);

  await weekly.assignWeek(items[0].id, 3);
  assert.equal((await weekly.listForTerm(term.id, 1)).length, 14);
  assert.equal((await weekly.listForTerm(term.id, 3)).length, 1);

  const summary = await weekly.summary(term.id, 3);
  assert.equal(summary.total, 1);
  assert.equal(summary.completed, 0);
  assert.equal(summary.byDomain.PURETECHNICAL.total, 1);
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
