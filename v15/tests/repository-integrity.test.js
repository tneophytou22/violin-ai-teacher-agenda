import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryRepository,
  StudentService,
  TermService,
  LessonService,
  ProgrammeService,
  HomeworkService,
} from '../index.js';

test('repository ownership boundaries reject orphan child creation', async () => {
  const repo = new InMemoryRepository();
  const termService = new TermService(repo);
  const lessonService = new LessonService(repo);
  const programmeService = new ProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);

  await assert.rejects(
    () => termService.create({
      studentId: 'missing-student',
      name: 'L4T1',
      startDate: '2026-09-01',
      endDate: '2027-01-31',
      level: 4,
      termNumber: 1,
    }),
    /unknown student/
  );

  await assert.rejects(
    () => lessonService.create({
      termId: 'missing-term',
      date: '2026-09-28',
    }),
    /unknown term/
  );

  await assert.rejects(
    () => programmeService.createItem({
      termId: 'missing-term',
      curriculumId: 'repertoire-v1',
      curriculumDomain: 'REPERTOIRE',
      objectId: 'missing-object',
      title: 'Invalid orphan item',
      targetWeek: 1,
    }),
    /unknown term/
  );

  await assert.rejects(
    () => homeworkService.assignHomework({
      lessonId: 'missing-lesson',
      items: [],
    }),
    /unknown lesson/
  );

  assert.deepEqual(await repo.list('students'), []);
  assert.deepEqual(await repo.list('terms'), []);
  assert.deepEqual(await repo.list('lessons'), []);
  assert.deepEqual(await repo.list('programmeItems'), []);
  assert.deepEqual(await repo.list('homework'), []);
});

test('child creation remains attached to the correct parent chain', async () => {
  const repo = new InMemoryRepository();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const lessonService = new LessonService(repo);
  const programmeService = new ProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);

  const student = await studentService.create({ name: 'Ownership Chain Student' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L4T1',
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    level: 4,
    termNumber: 1,
  });
  const lesson = await lessonService.create({
    termId: term.id,
    date: '2026-09-28',
  });
  const item = await programmeService.createItem({
    termId: term.id,
    curriculumId: 'repertoire-v1',
    curriculumDomain: 'REPERTOIRE',
    objectId: 'object-1',
    title: 'Ownership test item',
    targetWeek: 1,
  });
  const homework = await homeworkService.assignHomework({
    lessonId: lesson.id,
    items: [{ id: item.id, title: item.title, curriculumDomain: item.curriculumDomain }],
  });

  assert.equal((await repo.get('terms', term.id)).studentId, student.id);
  assert.equal((await repo.get('lessons', lesson.id)).termId, term.id);
  assert.equal((await repo.get('programmeItems', item.id)).termId, term.id);
  assert.equal((await repo.get('homework', homework.id)).lessonId, lesson.id);
});
