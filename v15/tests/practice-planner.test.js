import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, HomeworkService, PracticePlannerService, StudentService, TermService, LessonService } from '../index.js';

test('Practice Planner V1 creates a deterministic level-based plan without changing homework content', () => {
  const planner = new PracticePlannerService();
  const items = [
    { text: 'Bach movement', curriculumDomain: 'REPERTOIRE' },
    { text: 'Kreutzer study', curriculumDomain: 'ETUDE' },
    { text: 'Dounis exercise', curriculumDomain: 'PURE_TECHNICAL' },
  ];

  const plan = planner.plan({ level: 7, items });

  assert.equal(plan.totalMinutes, 55);
  assert.equal(plan.tasks.length, 3);
  assert.equal(plan.tasks.reduce((sum, task) => sum + task.minutes, 0), 55);
  assert.deepEqual(plan.tasks.map(task => task.homeworkItemIndex), [0, 1, 2]);
  assert.match(plan.tasks[0].focus, /intonation|rhythm|bow control|musical expression/i);
  assert.match(plan.generatedBy, /practice-planner-v1/);
  assert.equal(items[0].text, 'Bach movement');
});

test('Practice Planner rejects an invalid level', () => {
  const planner = new PracticePlannerService();
  assert.throws(() => planner.plan({ level: 11, items: [{ text: 'Task' }] }), /requires a level from 1–10/);
});

test('Homework persists an approved practice plan and increments its version', async () => {
  const repo = new InMemoryRepository();
  const student = await new StudentService(repo).create({ name: 'Practice Plan Test' });
  const term = await new TermService(repo).create({
    studentId: student.id, name: 'L7T1', level: 7, termNumber: 1,
    startDate: '2026-09-01', endDate: '2027-01-31',
  });
  const lesson = await new LessonService(repo).create({ termId: term.id, date: '2026-09-26' });
  const homework = new HomeworkService(repo);
  const items = [{ text: 'Bach movement' }, { text: 'Bow exercise' }];
  const plan = new PracticePlannerService().plan({ level: 7, items });

  const first = await homework.assignHomework({ lessonId: lesson.id, items, practicePlan: plan });
  assert.equal(first.version, 1);
  assert.equal(first.practicePlan.totalMinutes, 55);
  assert.equal(first.practicePlan.tasks.length, 2);

  const updated = await homework.assignHomework({
    lessonId: lesson.id,
    items: [{ text: 'New focus' }],
    practicePlan: {
      ...plan,
      totalMinutes: 55,
      tasks: [{ homeworkItemIndex: 0, homeworkItemId: null, minutes: 55, focus: 'Focused repetitions.' }],
    },
  });
  assert.equal(updated.version, 2);
  assert.equal(updated.items[0].text, 'New focus');
  assert.equal(updated.practicePlan.tasks[0].minutes, 55);
});

test('Homework rejects a practice plan whose task references a missing homework item', async () => {
  const repo = new InMemoryRepository();
  const student = await new StudentService(repo).create({ name: 'Invalid Plan Test' });
  const term = await new TermService(repo).create({ studentId: student.id, name: 'T', startDate: '2026-09-01', endDate: '2026-12-31' });
  const lesson = await new LessonService(repo).create({ termId: term.id, date: '2026-09-26' });
  const homework = new HomeworkService(repo);

  await assert.rejects(
    () => homework.assignHomework({
      lessonId: lesson.id,
      items: [{ text: 'Only task' }],
      practicePlan: {
        totalMinutes: 10,
        tasks: [{ homeworkItemIndex: 4, minutes: 10, focus: 'Invalid reference.' }],
        generatedBy: 'test',
        generatedAt: new Date().toISOString(),
      },
    }),
    /invalid homework item/
  );

  assert.equal((await repo.list('homework')).length, 0);
});

test('Practice Planner carries teacher-assigned requirements into the practice focus', () => {
  const planner = new PracticePlannerService();
  const plan = planner.plan({
    level: 5,
    items: [{
      id: 'pi-1',
      title: 'Kreutzer No. 12',
      curriculumDomain: 'ETUDE',
      requirements: ['détaché', 'intonation'],
    }],
  });

  assert.match(plan.tasks[0].focus, /Assigned requirement: détaché; intonation/);
});


test('Practice Planner generates targeted tempo, rhythm and bilingual steps', () => {
  const planner = new PracticePlannerService();
  const plan = planner.plan({
    level: 6,
    language: 'EL',
    items: [{ id: 'pi-1', title: 'Kreutzer No. 12', curriculumDomain: 'ETUDE' }],
  });
  assert.equal(plan.tasks[0].tempo, 52);
  assert.ok(plan.tasks[0].rhythmPattern);
  assert.match(plan.tasks[0].steps[0], /Απομόνωσε/);
});
