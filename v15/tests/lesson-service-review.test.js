import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StudentService, TermService, TeacherTermService, LessonService, WeeklyProgrammeService } from '../index.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

test('lesson service preserves earlier review records when adding more programme items', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const student = await new StudentService(repo).create({ name: 'Lesson Service Review Test' });
  const term = await new TermService(repo).create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });
  await new TeacherTermService(repo).activateCard(term.id);
  const lesson = await new LessonService(repo).create({ termId: term.id, date: '2026-09-22' });
  const weekly = new WeeklyProgrammeService(repo);
  const items = await weekly.listForTerm(term.id, 1);

  await new LessonService(repo).reviewProgrammeItems(lesson.id, [items[0].id]);
  await new LessonService(repo).reviewProgrammeItems(lesson.id, [items[1].id]);

  const saved = await repo.get('lessons', lesson.id);
  assert.deepEqual(saved.reviewedProgrammeItemIds, [items[0].id, items[1].id]);
});


test('lesson service rejects an unknown lesson before reading or mutating review records', async () => {
  const repo = new InMemoryRepository();
  const service = new LessonService(repo);

  await assert.rejects(
    () => service.reviewProgrammeItems('missing-lesson', ['missing-programme-item']),
    /Lesson not found/
  );

  assert.deepEqual(await repo.list('lessons'), []);
});
