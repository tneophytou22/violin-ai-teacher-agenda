import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryRepository,
  StudentService,
  TermService,
  TeacherTermService,
  WeeklyProgrammeService,
  LessonService,
  LessonProgrammeService,
  HomeworkService,
  ScaleMasteryService,
} from '../index.js';
import { TeacherAgendaViewModel } from '../ui/teacher-agenda-view-model.js';
import { TeacherAgendaController } from '../ui/teacher-agenda-controller.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

test('teacher agenda controller keeps UI selection state separate from business services', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const viewModel = new TeacherAgendaViewModel({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService, homeworkService });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Controller Test' });
  const term = await termService.create({ studentId: student.id, name: 'L7T1', startDate: '2026-09-01', endDate: '2026-12-31', level: 7, termNumber: 1 });

  await controller.loadStudents();
  let state = controller.snapshot();
  assert.equal(state.students.length, 1);
  assert.equal(state.selectedStudentId, null);

  await controller.selectStudent(student.id);
  state = controller.snapshot();
  const selectableItem = state.weekly.items[0].id;
  controller.toggleItemSelection(selectableItem);
  assert.deepEqual(controller.snapshot().selectedItemIds, [selectableItem]);
  controller.toggleItemSelection(selectableItem);
  assert.deepEqual(controller.snapshot().selectedItemIds, []);
  controller.selectAllPendingItems();
  state = controller.snapshot();
  assert.equal(state.selectedItemIds.length, 15);
  assert.equal(new Set(state.selectedItemIds).size, 15);
  assert.ok(state.weekly.items.filter(item => item.curriculumDomain === 'SCALES').every(item => !state.selectedItemIds.includes(item.id)));
  controller.clearItemSelection();
  assert.deepEqual(controller.snapshot().selectedItemIds, []);
  assert.equal(state.selectedStudentId, student.id);
  assert.equal(state.selectedTermId, term.id);
  assert.equal(state.termContext.card.id, 'L7T1');
  assert.equal(state.weekly.items.filter(item => item.curriculumDomain !== 'SCALES').length, 15);
  assert.equal(state.termProgress.total, 15);
  assert.equal(state.termProgress.completed, 0);
  assert.equal(state.termProgress.byDomain.PURE_TECHNICAL.total, 5);

  await controller.selectWeek(2);
  state = controller.snapshot();
  assert.equal(state.week, 2);
  assert.equal(state.weekly.items.length, 0);

  const lesson = await controller.createLesson('2026-09-17', { mark: 19 });
  assert.equal(controller.snapshot().activeLessonId, lesson.id);

  const allWeekOne = await viewModel.loadWeek(term.id, 1);
  const selected = allWeekOne.items.slice(0, 2).map(item => item.id);
  await controller.reviewItems(selected);
  const storedLesson = await repo.get('lessons', lesson.id);
  assert.deepEqual(storedLesson.reviewedProgrammeItemIds, selected);

  await controller.selectWeek(1);
  await controller.completeItems([selected[0]]);
  state = controller.snapshot();
  assert.equal(state.weekly.summary.completed, 1);
  assert.equal(state.termProgress.completed, 1);
  assert.equal(state.termProgress.total, 15);
});

test('controller selection boundary excludes scales, completed items and unknown ids', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const viewModel = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Selection Boundary Test' });
  await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 1, termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  const state = controller.snapshot();
  const core = state.weekly.items.find(item => item.curriculumDomain !== 'SCALES');
  const scale = state.weekly.items.find(item => item.curriculumDomain === 'SCALES');
  assert.ok(core);
  assert.ok(scale);

  await new LessonProgrammeService(repo).completeItems([core.id]);
  await controller.selectWeek(1);

  controller.toggleItemSelection(core.id);
  controller.toggleItemSelection(scale.id);
  controller.toggleItemSelection('missing-programme-item');

  assert.deepEqual(controller.snapshot().selectedItemIds, []);
});
 
test('controller rejects invalid week and reports the UI error state', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const viewModel = new TeacherAgendaViewModel({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService });
  const controller = new TeacherAgendaController(viewModel);

  await assert.rejects(() => controller.selectWeek(0), /Week must be an integer >= 1/);
  assert.equal(controller.snapshot().error, 'Week must be an integer >= 1');
  assert.equal(controller.snapshot().loading, false);
});

test('lesson session persists details, reviewed work and homework through the controller boundary', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Lesson Session Test' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L5T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 5,
    termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);

  const lesson = await controller.createLesson('2026-09-18');
  assert.equal(controller.snapshot().activeLessonId, lesson.id);

  await controller.updateLessonDetails({ attendance: 'LATE', mark: 18 });
  let state = controller.snapshot();
  assert.equal(state.activeLesson.attendance, 'LATE');
  assert.equal(state.activeLesson.mark, 18);

  const items = state.weekly.items.slice(0, 2).map(item => item.id);
  await controller.reviewItems(items);
  state = controller.snapshot();
  assert.deepEqual(state.activeLesson.reviewedProgrammeItemIds, items);
  assert.deepEqual(state.reviewedItemIds, items);

  await controller.saveHomework([
    { text: 'Slow practice with metronome', completed: false },
    { text: 'Record one take', completed: false },
  ]);
  state = controller.snapshot();
  assert.equal(state.homework.items.length, 2);
  assert.equal(state.homework.lessonId, lesson.id);

  const storedLesson = await repo.get('lessons', lesson.id);
  const storedHomework = await repo.get('homework', `hw_${lesson.id}`);
  assert.equal(storedLesson.attendance, 'LATE');
  assert.equal(storedLesson.mark, 18);
  assert.deepEqual(storedLesson.reviewedProgrammeItemIds, items);
  assert.equal(storedHomework.items.length, 2);
  assert.equal(storedHomework.lessonId, lesson.id);

  const lessons = await viewModel.listLessons(term.id);
  assert.equal(lessons.length, 1);
});

test('controller creates students and terms and can reopen a historical lesson', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const viewModel = new TeacherAgendaViewModel({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService, homeworkService });
  const controller = new TeacherAgendaController(viewModel);

  await controller.loadStudents();
  const student = await controller.createStudent({ name: 'Created Student' });
  let state = controller.snapshot();
  assert.equal(state.selectedStudentId, student.id);
  assert.equal(state.terms.length, 0);

  const term = await controller.createTerm({
    name: '2026–27 Term 1',
    level: 3,
    termNumber: 1,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  });
  state = controller.snapshot();
  assert.equal(state.selectedTermId, term.id);
  assert.equal(state.termContext.card.id, 'L3T1');
  assert.equal(state.weekly.items.filter(item => item.curriculumDomain !== 'SCALES').length, 15);

  const firstLesson = await controller.createLesson('2026-09-18', { mark: 17 });
  const reviewed = state.weekly.items.slice(0, 2).map(item => item.id);
  await controller.reviewItems(reviewed);
  await controller.completeItems([reviewed[0]]);
  await controller.saveHomework([
    { text: 'Practise first position shifts', completed: false },
    { text: 'Record one slow take', completed: false },
  ]);

  const secondLesson = await controller.createLesson('2026-09-19', { mark: 18 });
  assert.equal(secondLesson.date, '2026-09-19');

  await controller.selectLesson(firstLesson.id);
  state = controller.snapshot();
  assert.equal(state.activeLessonId, firstLesson.id);
  assert.equal(state.activeLesson.mark, 17);
  assert.equal(state.lessonHistory.length, 2);
  assert.deepEqual(state.reviewedItemIds, reviewed);
  assert.equal(state.homework.items.length, 2);
  assert.equal(state.homework.items[0].text, 'Practise first position shifts');
  assert.notEqual(state.activeLessonId, secondLesson.id);

  const storedCompleted = await repo.get('programmeItems', reviewed[0]);
  const storedReviewed = await repo.get('lessons', firstLesson.id);
  assert.equal(storedCompleted.status, 'COMPLETED');
  assert.deepEqual(storedReviewed.reviewedProgrammeItemIds, reviewed);
});


test('controller clears stale programme selection when changing week or carrying an item forward', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Selection Reset Test' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L3T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 3,
    termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);

  const item = controller.snapshot().weekly.items.find(item => item.curriculumDomain !== 'SCALES');
  assert.ok(item);

  controller.toggleItemSelection(item.id);
  assert.deepEqual(controller.snapshot().selectedItemIds, [item.id]);

  await controller.selectWeek(2);
  assert.deepEqual(controller.snapshot().selectedItemIds, []);

  await controller.selectWeek(1);
  controller.toggleItemSelection(item.id);
  await controller.carryForward(item.id, 2);

  assert.equal(controller.snapshot().week, 2);
  assert.deepEqual(controller.snapshot().selectedItemIds, []);
  assert.equal(controller.snapshot().weekly.items.some(candidate => candidate.id === item.id), true);
  assert.equal((await repo.get('programmeItems', item.id)).targetWeek, 2);
  assert.equal(term.studentId, student.id);
});

test('controller clears stale programme selection when changing week or carrying an item forward', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Selection Reset Test' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L3T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 3,
    termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);

  const item = controller.snapshot().weekly.items.find(item => item.curriculumDomain !== 'SCALES');
  assert.ok(item);

  controller.toggleItemSelection(item.id);
  assert.deepEqual(controller.snapshot().selectedItemIds, [item.id]);

  await controller.selectWeek(2);
  assert.deepEqual(controller.snapshot().selectedItemIds, []);

  await controller.selectWeek(1);
  controller.toggleItemSelection(item.id);
  await controller.carryForward(item.id, 2);

  assert.equal(controller.snapshot().week, 2);
  assert.deepEqual(controller.snapshot().selectedItemIds, []);
  assert.equal(controller.snapshot().weekly.items.some(candidate => candidate.id === item.id), true);
  assert.equal((await repo.get('programmeItems', item.id)).targetWeek, 2);
  assert.equal(term.studentId, student.id);
});

test('controller persists explicit scale mastery assessment', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const scaleMasteryService = new ScaleMasteryService(repo);
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
    scaleMasteryService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Scale Mastery Test' });
  await termService.create({
    studentId: student.id,
    name: 'L1T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 1,
    termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  const scaleItem = controller.snapshot().weekly.items.find(item => item.curriculumDomain === 'SCALES');
  assert.ok(scaleItem);

  await controller.assessScale(scaleItem.id, {
    status: 'SECURE',
    currentTempo: 58,
    targetTempo: 60,
    intonation: 'SECURE',
    bowControl: 'SECURE',
    consistency: 'DEVELOPING',
    note: 'Stable intonation; continue consistency.',
  });

  const state = controller.snapshot();
  const assessed = state.scaleProgress.items.find(item => item.id === scaleItem.id);
  assert.equal(assessed.details.mastery.status, 'SECURE');
  assert.equal(assessed.details.mastery.currentTempo, 58);
  assert.equal(state.scaleProgress.masteryPercent, 13);
  assert.equal(state.scaleProgress.completed, 0);
});


test('controller uncompletes a programme item and restores pending progress', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Uncomplete Controller Test' });
  await termService.create({
    studentId: student.id,
    name: 'L3T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 3,
    termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  const item = controller.snapshot().weekly.items.find(candidate => candidate.curriculumDomain !== 'SCALES');
  assert.ok(item);

  await controller.completeItems([item.id]);
  let state = controller.snapshot();
  assert.equal(state.weekly.summary.completed, 1);
  assert.equal(state.termProgress.completed, 1);

  await controller.uncompleteItem(item.id);
  state = controller.snapshot();
  const restored = state.weekly.items.find(candidate => candidate.id === item.id);
  assert.equal(restored.status, 'PLANNED');
  assert.equal(state.weekly.summary.completed, 0);
  assert.equal(state.termProgress.completed, 0);
  assert.deepEqual(state.selectedItemIds, []);
});
