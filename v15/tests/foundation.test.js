import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StudentService, TermService, LessonService, ProgrammeService, HomeworkService, createProgrammeItem } from '../index.js';

test('student → term → lesson → homework flow', async () => {
  const repo = new InMemoryRepository();
  const students = new StudentService(repo);
  const terms = new TermService(repo);
  const lessons = new LessonService(repo);
  const programmes = new ProgrammeService(repo);
  const homework = new HomeworkService(repo);

  const student = await students.create({ name: 'Test Student' });
  const term = await terms.create({ studentId: student.id, name: 'Term 1', startDate: '2026-09-01', endDate: '2026-12-31' });
  const item = await programmes.createItem({ termId: term.id, curriculumId: 'repertoire-v2', curriculumDomain: 'repertoire', objectId: 'bach-1041-i', title: 'Bach BWV 1041 I', targetWeek: 3 });
  const lesson = await lessons.create({ termId: term.id, date: '2026-09-12', mark: 18 });

  await lessons.reviewProgrammeItems(lesson.id, [item.id]);
  const hw = await homework.assignHomework({ lessonId: lesson.id, items: [{ programmeItemId: item.id, text: 'Practice first movement' }] });

  assert.equal((await students.list()).length, 1);
  assert.equal((await terms.listForStudent(student.id)).length, 1);
  assert.deepEqual((await lessons.get(lesson.id)).reviewedProgrammeItemIds, [item.id]);
  assert.equal(hw.lessonId, lesson.id);
  assert.equal((await programmes.progress(term.id, 3)).completedCount, 0);
});

test('programme completion is independent from homework/review', async () => {
  const repo = new InMemoryRepository();
  const student = await new StudentService(repo).create({ name: 'A' });
  const term = await new TermService(repo).create({ studentId: student.id, name: 'T', startDate: '2026-09-01', endDate: '2026-12-31' });
  const programme = new ProgrammeService(repo);
  const item = await programme.createItem({ termId: term.id, curriculumId: 'scales-v1', curriculumDomain: 'scales', objectId: 'g-major', title: 'G Major', targetWeek: 1 });
  const lesson = await new LessonService(repo).create({ termId: term.id, date: '2026-09-12' });
  await new LessonService(repo).reviewProgrammeItems(lesson.id, [item.id]);
  assert.equal((await programme.progress(term.id, 1)).completedCount, 0);
  await programme.setStatus(item.id, 'COMPLETED');
  assert.equal((await programme.progress(term.id, 1)).completedCount, 1);
});

test('targetWeek is mandatory', () => {
  assert.throws(() => createProgrammeItem({ termId: 't', curriculumId: 'x', curriculumDomain: 'x', objectId: 'x', title: 'x' }));
});
