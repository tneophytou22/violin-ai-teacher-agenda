import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryRepository,
  createTeacherAgendaApp,
  registerV1Curricula,
} from '../index.js';

const root = () => ({
  innerHTML: '',
  addEventListener() {},
  removeEventListener() {},
});

test('teacher agenda application journey persists core, lesson, homework, scales and carry-forward state', async () => {
  registerV1Curricula();

  const repository = new InMemoryRepository();
  const app = createTeacherAgendaApp({ repository, root: root() });

  const student = await app.controller.createStudent({ name: 'Journey Test Student' });
  const term = await app.controller.createTerm({
    name: 'L7T1',
    level: 7,
    termNumber: 1,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  });

  let state = app.controller.snapshot();
  assert.equal(state.selectedStudentId, student.id);
  assert.equal(state.selectedTermId, term.id);
  assert.equal(state.termContext.card.id, 'L7T1');
  assert.equal(state.termProgress.total, 15);
  assert.ok(state.scaleProgress.total > 0);

  const weekOneCore = state.weekly.items.filter(item => item.curriculumDomain !== 'SCALES');
  const scale = state.weekly.items.find(item => item.curriculumDomain === 'SCALES');
  assert.equal(weekOneCore.length, 15);
  assert.ok(scale);

  const reviewed = weekOneCore[0];
  const completed = weekOneCore[1];
  const carried = weekOneCore[2];

  const lesson = await app.controller.createLesson('2026-09-26', { mark: 18 });
  await app.controller.reviewItems([reviewed.id]);
  const homeworkItems = [
    { title: 'Slow bow practice', minutes: 10, curriculumDomain: 'PURE_TECHNICAL' },
  ];
  await app.controller.generatePracticePlan(homeworkItems);
  await app.controller.saveHomework(homeworkItems);

  state = app.controller.snapshot();
  assert.equal(state.activeLessonId, lesson.id);
  assert.deepEqual(state.reviewedItemIds, [reviewed.id]);
  assert.deepEqual(state.homework.items, homeworkItems);
  assert.equal(state.homework.practicePlan.totalMinutes, 55);
  assert.equal(state.homework.practicePlan.tasks.length, 1);
  assert.equal(state.homework.practicePlan.tasks[0].minutes, 55);
  assert.equal(state.homework.practicePlan.tasks[0].homeworkItemIndex, 0);
  assert.equal(state.lessonHistory.length, 1);

  await app.controller.completeItems([completed.id]);
  state = app.controller.snapshot();
  assert.equal(state.termProgress.completed, 1);
  assert.equal(state.weekly.items.find(item => item.id === completed.id).status, 'COMPLETED');

  await app.controller.assessScale(scale.id, {
    status: 'DEVELOPING',
    currentTempo: 52,
    targetTempo: 60,
    intonation: 'SECURE',
    bowControl: 'DEVELOPING',
    consistency: 'DEVELOPING',
    note: 'Keep the bow straight.',
  });

  state = app.controller.snapshot();
  const assessedScale = state.scaleProgress.items.find(item => item.id === scale.id);
  assert.equal(assessedScale.details.mastery.status, 'DEVELOPING');
  assert.equal(assessedScale.details.mastery.currentTempo, 52);
  assert.equal(state.weekly.items.find(item => item.id === scale.id).status, 'PLANNED');

  await app.controller.carryForward(carried.id, 2);
  state = app.controller.snapshot();
  assert.equal(state.week, 2);
  assert.equal(state.weekly.items.find(item => item.id === carried.id).targetWeek, 2);

  const refreshed = createTeacherAgendaApp({ repository, root: root() });
  await refreshed.controller.loadStudents();
  await refreshed.controller.selectStudent(student.id);
  await refreshed.controller.selectLesson(lesson.id);

  state = refreshed.controller.snapshot();
  assert.equal(state.selectedTermId, term.id);
  assert.equal(state.termContext.card.id, 'L7T1');
  assert.equal(state.termProgress.completed, 1);
  assert.equal(state.lessonHistory.length, 1);
  assert.equal(state.lessonHistory[0].id, lesson.id);
  assert.deepEqual(state.activeLesson.reviewedProgrammeItemIds, [reviewed.id]);
  assert.deepEqual(state.homework.items, homeworkItems);
  assert.equal(state.homework.practicePlan.totalMinutes, 55);
  assert.equal(state.homework.practicePlan.tasks[0].minutes, 55);

  const persistedScale = state.scaleProgress.items.find(item => item.id === scale.id);
  assert.equal(persistedScale.details.mastery.status, 'DEVELOPING');
  assert.equal(persistedScale.details.mastery.currentTempo, 52);

  const persistedCarry = (await repository.get('programmeItems', carried.id));
  assert.equal(persistedCarry.targetWeek, 2);
});
