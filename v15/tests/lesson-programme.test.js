import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StudentService, TermService, TeacherTermService, LessonService, LessonProgrammeService, ProgrammeService } from '../index.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

async function setup() {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const student = await new StudentService(repo).create({ name: 'Lesson Programme Test' });
  const term = await new TermService(repo).create({
    studentId: student.id,
    name: 'L7T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 7,
    termNumber: 1,
  });
  await new TeacherTermService(repo).activateCard(term.id);
  const lessons = new LessonService(repo);
  const lesson = await lessons.create({ termId: term.id, date: '2026-09-17', mark: 18 });
  return { repo, term, lesson };
}

test('lesson reviews only weekly programme items belonging to its term', async () => {
  const { repo, term, lesson } = await setup();
  const weekly = new (await import('../services/weekly-programme-service.js')).WeeklyProgrammeService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const weekItems = await weekly.listForTerm(term.id, 1);
  const selected = weekItems.slice(0, 2);

  const result = await lessonProgramme.reviewWeeklyItems(lesson.id, selected.map(i => i.id));
  assert.deepEqual(result.lesson.reviewedProgrammeItemIds, selected.map(i => i.id));
  assert.equal(result.reviewedItems.length, 2);
});

test('reviewing an item does not complete it; completion is explicit', async () => {
  const { repo, term, lesson } = await setup();
  const weekly = new (await import('../services/weekly-programme-service.js')).WeeklyProgrammeService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const programmes = new ProgrammeService(repo);
  const item = (await weekly.listForTerm(term.id, 1))[0];

  await lessonProgramme.reviewWeeklyItems(lesson.id, [item.id]);
  assert.equal((await repo.get('programmeItems', item.id)).status, 'PLANNED');
  assert.equal((await programmes.progress(term.id, 1)).completedCount, 0);

  await lessonProgramme.completeItems([item.id]);
  assert.equal((await repo.get('programmeItems', item.id)).status, 'COMPLETED');
  assert.equal((await programmes.progress(term.id, 1)).completedCount, 1);
});

test('unfinished item can be carried forward, completed item cannot', async () => {
  const { repo, term } = await setup();
  const weekly = new (await import('../services/weekly-programme-service.js')).WeeklyProgrammeService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const programmes = new ProgrammeService(repo);
  const items = await weekly.listForTerm(term.id, 1);
  const unfinished = items[0];
  const completed = items[1];

  await lessonProgramme.carryForward(unfinished.id, 4);
  assert.equal((await repo.get('programmeItems', unfinished.id)).targetWeek, 4);
  await programmes.setStatus(completed.id, 'COMPLETED');
  await assert.rejects(() => lessonProgramme.carryForward(completed.id, 4), /Completed ProgrammeItem cannot be carried forward/);
});

test('cross-term review is rejected', async () => {
  const { repo, lesson } = await setup();
  const otherStudent = await new StudentService(repo).create({ name: 'Other' });
  const otherTerm = await new TermService(repo).create({ studentId: otherStudent.id, name: 'Other', startDate: '2026-09-01', endDate: '2026-12-31', level: 7, termNumber: 2 });
  await new TeacherTermService(repo).activateCard(otherTerm.id);
  const otherItem = (await repo.list('programmeItems')).find(i => i.termId === otherTerm.id);
  await assert.rejects(() => new LessonProgrammeService(repo).reviewWeeklyItems(lesson.id, [otherItem.id]), /does not belong to the lesson term/);
});


test('completed programme item can be uncompleted and its completion timestamp is cleared', async () => {
  const { repo, term } = await setup();
  const weekly = new (await import('../services/weekly-programme-service.js')).WeeklyProgrammeService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const item = (await weekly.listForTerm(term.id, 1))[0];

  await lessonProgramme.completeItems([item.id]);
  const completed = await repo.get('programmeItems', item.id);
  assert.equal(completed.status, 'COMPLETED');
  assert.ok(completed.completedAt);

  completed.details = { ...(completed.details ?? {}), mastery: { status: 'SECURE' } };
  await repo.put('programmeItems', completed);

  const restored = await lessonProgramme.uncompleteItem(item.id);
  assert.equal(restored.status, 'PLANNED');
  assert.equal(restored.completedAt, undefined);
  assert.equal(restored.details.mastery.status, 'SECURE');
  assert.equal((await repo.get('programmeItems', item.id)).status, 'PLANNED');
});

test('uncompleting an already pending programme item is idempotent', async () => {
  const { repo, term } = await setup();
  const weekly = new (await import('../services/weekly-programme-service.js')).WeeklyProgrammeService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const item = (await weekly.listForTerm(term.id, 1))[0];

  const restored = await lessonProgramme.uncompleteItem(item.id);
  assert.equal(restored.status, 'PLANNED');
});
