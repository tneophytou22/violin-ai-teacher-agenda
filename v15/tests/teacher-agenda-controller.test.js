import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryRepository,
  StudentService,
  TermService,
  TeacherTermService,
  WeeklyProgrammeService,
  LessonService,
  LessonProgrammeService, StudentIntelligenceService,
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
});

test('controller rejects an unknown term without mutating the selected term', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Invalid Term Selection Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L1T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 1, termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  const before = controller.snapshot();
  await assert.rejects(
    () => controller.selectTerm('missing-term'),
    /Term does not belong to selected student/
  );

  const after = controller.snapshot();
  assert.equal(after.selectedTermId, term.id);
  assert.equal(after.termContext.term.id, before.termContext.term.id);
  assert.deepEqual(after.teacherReadinessReview, before.teacherReadinessReview);
  assert.equal(after.error, 'Term does not belong to selected student');
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
  await controller.updateLessonDetails({ attendance: 'LATE', mark: 18, teacherNote: '  Strong rhythm; relax right thumb.  ' });
  let state = controller.snapshot();
  assert.equal(state.activeLesson.attendance, 'LATE');
  assert.equal(state.activeLesson.mark, 18);
  assert.equal(state.activeLesson.teacherNote, 'Strong rhythm; relax right thumb.');

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

  const firstLesson = await controller.createLesson('2026-09-18', { mark: 17, teacherNote: '  Historical lesson note.  ' });
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
  assert.equal(state.activeLesson.teacherNote, 'Historical lesson note.');
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
  const secondStudent = await studentService.create({ name: 'Other Student' });
  const secondTerm = await termService.create({
    studentId: secondStudent.id,
    name: 'L1T1 Other',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 1,
    termNumber: 1,
  });
  await teacherTermService.activateCard(secondTerm.id);
  const foreignScale = (await weeklyProgrammeService.listForTerm(secondTerm.id, 1))
    .find(item => item.curriculumDomain === 'SCALES');
  assert.ok(foreignScale);
  await assert.rejects(
    () => controller.assessScale(foreignScale.id, { status: 'SECURE' }),
    /does not belong to the selected term/
  );

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

test('controller rolls back UI state when a week load fails after local state mutation', async () => {
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

  const student = await studentService.create({ name: 'Rollback Test' });
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
  controller.toggleItemSelection(item.id);
  const before = controller.snapshot();

  const originalLoadWeek = viewModel.loadWeek.bind(viewModel);
  viewModel.loadWeek = async (termId, week) => {
    if (week === 2) throw new Error('Injected week load failure');
    return originalLoadWeek(termId, week);
  };

  await assert.rejects(() => controller.selectWeek(2), /Injected week load failure/);

  const after = controller.snapshot();
  assert.equal(after.week, before.week);
  assert.deepEqual(after.weekly, before.weekly);
  assert.deepEqual(after.selectedItemIds, before.selectedItemIds);
  assert.equal(after.selectedTermId, before.selectedTermId);
  assert.equal(after.error, 'Injected week load failure');
  assert.equal(after.loading, false);
});

test('controller rolls back UI state when carry-forward reload fails', async () => {
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

  const student = await studentService.create({ name: 'Carry Forward Rollback Test' });
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
  controller.toggleItemSelection(item.id);
  const before = controller.snapshot();

  const originalLoadWeek = viewModel.loadWeek.bind(viewModel);
  viewModel.loadWeek = async (termId, week) => {
    if (week === 2) throw new Error('Injected carry-forward reload failure');
    return originalLoadWeek(termId, week);
  };

  await assert.rejects(() => controller.carryForward(item.id, 2), /Injected carry-forward reload failure/);

  const after = controller.snapshot();
  assert.equal(after.week, before.week);
  assert.deepEqual(after.weekly, before.weekly);
  assert.deepEqual(after.selectedItemIds, before.selectedItemIds);
  assert.equal(after.error, 'Injected carry-forward reload failure');
  assert.equal(after.loading, false);

  const persisted = await repo.get('programmeItems', item.id);
  assert.equal(persisted.targetWeek, 2);
});


test('controller serializes overlapping async operations in call order', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);
  const student = await studentService.create({ name: 'Controller Queue Test' });
  await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 3, termNumber: 1,
  });
  await controller.loadStudents();
  await controller.selectStudent(student.id);

  const originalLoadWeek = viewModel.loadWeek.bind(viewModel);
  viewModel.loadWeek = async (termId, week) => {
    if (week === 2) await new Promise(resolve => setTimeout(resolve, 20));
    return originalLoadWeek(termId, week);
  };

  await Promise.all([controller.selectWeek(2), controller.selectWeek(3)]);
  assert.equal(controller.snapshot().week, 3);
  assert.equal(controller.snapshot().weekly.items.every(item => item.targetWeek === 3), true);
});


test('controller aligns readiness review with the first selected term after student selection', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, weeklyProgrammeService, lessonService,
    homeworkService, teacherTermService, repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Initial Readiness Alignment Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L3T2', startDate: '2027-02-01',
    endDate: '2027-06-30', level: 3, termNumber: 2,
  });
  await termService.setReadinessDecision(term1.id, {
    decision: 'CONTINUE_CURRENT_TERM', note: 'First selected term.',
  });
  await termService.setReadinessDecision(term2.id, {
    decision: 'ADVANCE_TO_NEXT_TERM', note: 'Latest term.',
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);

  const state = controller.snapshot();
  assert.equal(state.selectedTermId, term1.id);
  assert.equal(state.teacherReadinessReview.currentTerm.id, term1.id);
  assert.equal(state.teacherReadinessReview.checklist[0].decision, 'CONTINUE_CURRENT_TERM');
  assert.equal(state.teacherReadinessReview.checklist[0].decisionNote, 'First selected term.');
});

test('controller captures and persists the teacher readiness decision', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService,
    termService,
    weeklyProgrammeService,
    lessonService,
    homeworkService,
    teacherTermService,
    repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Readiness Decision Controller Test' });
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
  await controller.saveTeacherReadinessDecision({
    decision: 'ADVANCE_TO_NEXT_TERM',
    note: 'Criteria reviewed in lesson.',
  });

  const stored = await repo.get('terms', term.id);
  assert.equal(stored.readinessDecision, 'ADVANCE_TO_NEXT_TERM');
  assert.equal(stored.readinessDecisionNote, 'Criteria reviewed in lesson.');
  assert.equal(typeof stored.readinessDecisionAt, 'string');

  const state = controller.snapshot();
  assert.equal(state.teacherReadinessReview.checklist[0].decision, 'ADVANCE_TO_NEXT_TERM');
  assert.equal(state.teacherReadinessReview.checklist[0].decisionNote, 'Criteria reviewed in lesson.');
});

test('controller rejects an invalid teacher readiness decision', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService,
    termService,
    weeklyProgrammeService,
    lessonService,
    homeworkService,
    teacherTermService,
    repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);
  const student = await studentService.create({ name: 'Readiness Decision Validation Test' });
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

  await assert.rejects(
    () => controller.saveTeacherReadinessDecision({ decision: 'AUTO_PASS' }),
    /Teacher readiness decision is invalid/
  );
});

test('controller refreshes the readiness projection after clearing a teacher decision', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService,
    termService,
    weeklyProgrammeService,
    lessonService,
    homeworkService,
    teacherTermService,
    repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Readiness Decision Refresh Test' });
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

  await controller.saveTeacherReadinessDecision({
    decision: 'CONTINUE_CURRENT_TERM',
    note: 'Keep current-term focus.',
  });
  assert.equal(
    controller.snapshot().teacherReadinessReview.checklist[0].decision,
    'CONTINUE_CURRENT_TERM'
  );

  await controller.saveTeacherReadinessDecision({ decision: null, note: '' });

  const state = controller.snapshot();
  assert.equal(state.teacherReadinessReview.currentTerm.id, term.id);
  assert.equal(state.teacherReadinessReview.checklist[0].decision, null);
  assert.equal(state.teacherReadinessReview.checklist[0].decisionNote, '');
  assert.equal(state.teacherReadinessReview.checklist[0].decisionRecordedAt, null);

  const stored = await repo.get('terms', term.id);
  assert.equal(stored.readinessDecision, null);
  assert.equal(stored.readinessDecisionNote, '');
  assert.equal(stored.readinessDecisionAt, null);
});


test('controller keeps readiness review aligned with the selected historical term', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, weeklyProgrammeService, lessonService,
    homeworkService, teacherTermService, repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Historical Readiness Selection Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L3T2', startDate: '2027-02-01',
    endDate: '2027-06-30', level: 3, termNumber: 2,
  });

  await termService.setReadinessDecision(term1.id, {
    decision: 'CONTINUE_CURRENT_TERM',
    note: 'Term 1 decision.',
  });
  await termService.setReadinessDecision(term2.id, {
    decision: 'ADVANCE_TO_NEXT_TERM',
    note: 'Term 2 decision.',
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term1.id);

  let state = controller.snapshot();
  assert.equal(state.selectedTermId, term1.id);
  assert.equal(state.teacherReadinessReview.currentTerm.id, term1.id);
  assert.equal(state.teacherReadinessReview.checklist[0].decision, 'CONTINUE_CURRENT_TERM');
  assert.equal(state.teacherReadinessReview.checklist[0].decisionNote, 'Term 1 decision.');

  await controller.saveTeacherReadinessDecision({
    decision: 'TARGETED_REVIEW_BEFORE_ADVANCE',
    note: 'Term 1 updated.',
  });

  state = controller.snapshot();
  assert.equal(state.teacherReadinessReview.currentTerm.id, term1.id);
  assert.equal(state.teacherReadinessReview.checklist[0].decision, 'TARGETED_REVIEW_BEFORE_ADVANCE');
  assert.equal(state.teacherReadinessReview.checklist[0].decisionNote, 'Term 1 updated.');
  assert.equal((await repo.get('terms', term2.id)).readinessDecision, 'ADVANCE_TO_NEXT_TERM');
});

test('controller preserves the recorded readiness decision after an invalid replacement attempt', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, weeklyProgrammeService, lessonService,
    homeworkService, teacherTermService, repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);
  const student = await studentService.create({ name: 'Readiness Invalid Replacement Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  await controller.saveTeacherReadinessDecision({
    decision: 'CONTINUE_CURRENT_TERM',
    note: 'Keep current-term focus.',
  });

  const before = await repo.get('terms', term.id);
  await assert.rejects(
    () => controller.saveTeacherReadinessDecision({ decision: 'AUTO_PASS', note: 'Invalid replacement.' }),
    /Teacher readiness decision is invalid/
  );

  const after = await repo.get('terms', term.id);
  assert.equal(after.readinessDecision, before.readinessDecision);
  assert.equal(after.readinessDecisionNote, before.readinessDecisionNote);
  assert.equal(after.readinessDecisionAt, before.readinessDecisionAt);
  assert.equal(after.version, before.version);

  const state = controller.snapshot();
  assert.equal(state.teacherReadinessReview.checklist[0].decision, 'CONTINUE_CURRENT_TERM');
  assert.equal(state.teacherReadinessReview.checklist[0].decisionNote, 'Keep current-term focus.');
});


test('controller reports an invalid readiness replacement without losing the prior projection', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService, termService, weeklyProgrammeService, lessonService,
    homeworkService, teacherTermService, repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);
  const student = await studentService.create({ name: 'Readiness Error State Test' });
  await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  await controller.saveTeacherReadinessDecision({
    decision: 'CONTINUE_CURRENT_TERM',
    note: 'Keep current-term focus.',
  });

  const before = controller.snapshot();
  await assert.rejects(
    () => controller.saveTeacherReadinessDecision({ decision: 'AUTO_PASS' }),
    /Teacher readiness decision is invalid/
  );

  const after = controller.snapshot();
  assert.equal(after.teacherReadinessReview.checklist[0].decision, before.teacherReadinessReview.checklist[0].decision);
  assert.equal(after.teacherReadinessReview.checklist[0].decisionNote, before.teacherReadinessReview.checklist[0].decisionNote);
  assert.equal(after.teacherReadinessReview.checklist[0].decisionRecordedAt, before.teacherReadinessReview.checklist[0].decisionRecordedAt);
  assert.equal(after.error, 'Teacher readiness decision is invalid');
  assert.equal(after.loading, false);
});


test('controller rejects teacher readiness save when no term is selected without mutating readiness state', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const homeworkService = new HomeworkService(repo);
  const intelligence = new StudentIntelligenceService({
    studentService,
    termService,
    weeklyProgrammeService,
    lessonService,
    homeworkService,
    teacherTermService,
    repository: repo,
  });
  const viewModel = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
    studentIntelligenceService: intelligence,
  });
  const controller = new TeacherAgendaController(viewModel);

  await assert.rejects(
    () => controller.saveTeacherReadinessDecision({
      decision: 'CONTINUE_CURRENT_TERM',
      note: 'Should not be stored.',
    }),
    /No term selected/
  );

  const state = controller.snapshot();
  assert.equal(state.selectedTermId, null);
  assert.equal(state.teacherReadinessReview, null);
  assert.equal(state.error, 'No term selected');
  assert.equal(state.loading, false);
});


test('controller rejects completion of a foreign programme item without mutating the current term state', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Foreign Completion Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L3T2', startDate: '2027-01-01',
    endDate: '2027-04-30', level: 3, termNumber: 2,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term1.id);
  await controller.selectTerm(term2.id);
  await controller.selectTerm(term1.id);
  const foreignItem = (await repo.list('programmeItems'))
    .find(item => item.termId === term2.id && item.curriculumDomain !== 'SCALES');
  assert.ok(foreignItem);

  const before = controller.snapshot();
  await assert.rejects(
    () => controller.completeItems([foreignItem.id]),
    /ProgrammeItem does not belong to the selected term/
  );

  const after = controller.snapshot();
  assert.equal(after.selectedTermId, term1.id);
  assert.equal(after.week, before.week);
  assert.deepEqual(after.weekly, before.weekly);
  assert.deepEqual(after.termProgress, before.termProgress);
  assert.equal(after.error, 'ProgrammeItem does not belong to the selected term');
  assert.equal(after.loading, false);

  const stored = await repo.get('programmeItems', foreignItem.id);
  assert.equal(stored.status, foreignItem.status);
});

test('controller preserves the active lesson after invalid lesson details', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Invalid Lesson Details Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 3, termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  const lesson = await controller.createLesson('2026-09-24', {
    mark: 17,
    attendance: 'LATE',
    teacherNote: '  Preserve this note.  ',
  });

  const before = controller.snapshot();
  await assert.rejects(
    () => controller.updateLessonDetails({ mark: 21, attendance: 'LATE', teacherNote: 'Invalid update.' }),
    /Lesson.mark must be 1–20 or null/
  );

  const after = controller.snapshot();
  assert.equal(after.activeLessonId, lesson.id);
  assert.equal(after.activeLesson.id, lesson.id);
  assert.equal(after.activeLesson.mark, 17);
  assert.equal(after.activeLesson.attendance, 'LATE');
  assert.equal(after.activeLesson.teacherNote, 'Preserve this note.');
  assert.deepEqual(after.lessonHistory, before.lessonHistory);
  assert.equal(after.termContext.term.id, term.id);
  assert.equal(after.error, 'Lesson.mark must be 1–20 or null');
  assert.equal(after.loading, false);

  const stored = await repo.get('lessons', lesson.id);
  assert.equal(stored.mark, 17);
  assert.equal(stored.attendance, 'LATE');
  assert.equal(stored.teacherNote, 'Preserve this note.');
  assert.equal(stored.version, lesson.version);
});

test('controller rejects an unknown lesson without mutating the active lesson', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Invalid Lesson Selection Test' });
  const term = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01', endDate: '2026-12-31',
    level: 3, termNumber: 1,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  const lesson = await controller.createLesson('2026-09-18', {
    mark: 17,
    teacherNote: '  Keep bow contact stable.  ',
  });

  const before = controller.snapshot();
  await assert.rejects(
    () => controller.selectLesson('missing-lesson'),
    /Lesson does not belong to selected term/
  );

  const after = controller.snapshot();
  assert.equal(after.activeLessonId, lesson.id);
  assert.equal(after.activeLesson.id, lesson.id);
  assert.equal(after.activeLesson.teacherNote, 'Keep bow contact stable.');
  assert.equal(after.termContext.term.id, term.id);
  assert.equal(after.error, 'Lesson does not belong to selected term');
  assert.equal(after.loading, false);
});


test('controller rejects uncompletion of a foreign programme item without mutating the current term state', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Foreign Uncompletion Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L3T2', startDate: '2027-01-01',
    endDate: '2027-04-30', level: 3, termNumber: 2,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term1.id);
  await controller.selectTerm(term2.id);
  const foreignItem = (await repo.list('programmeItems'))
    .find(item => item.termId === term2.id && item.curriculumDomain !== 'SCALES');
  assert.ok(foreignItem);
  foreignItem.status = 'COMPLETED';
  foreignItem.completedAt = '2027-02-01T10:00:00.000Z';
  await repo.put('programmeItems', foreignItem);
  await controller.selectTerm(term1.id);

  const before = controller.snapshot();
  await assert.rejects(
    () => controller.uncompleteItem(foreignItem.id),
    /ProgrammeItem does not belong to the selected term/
  );

  const after = controller.snapshot();
  assert.equal(after.selectedTermId, term1.id);
  assert.equal(after.week, before.week);
  assert.deepEqual(after.weekly, before.weekly);
  assert.deepEqual(after.termProgress, before.termProgress);
  assert.equal(after.error, 'ProgrammeItem does not belong to the selected term');
  assert.equal(after.loading, false);

  const stored = await repo.get('programmeItems', foreignItem.id);
  assert.equal(stored.status, 'COMPLETED');
  assert.equal(stored.completedAt, '2027-02-01T10:00:00.000Z');
});


test('controller rejects carry-forward of a foreign programme item without mutating the current term state', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Foreign Carry Forward Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L3T2', startDate: '2027-01-01',
    endDate: '2027-04-30', level: 3, termNumber: 2,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term1.id);
  await controller.selectTerm(term2.id);
  const foreignItem = (await repo.list('programmeItems'))
    .find(item => item.termId === term2.id && item.curriculumDomain !== 'SCALES');
  assert.ok(foreignItem);
  const originalTargetWeek = foreignItem.targetWeek;
  await controller.selectTerm(term1.id);

  const before = controller.snapshot();
  await assert.rejects(
    () => controller.carryForward(foreignItem.id, before.week + 1),
    /ProgrammeItem does not belong to the selected term/
  );

  const after = controller.snapshot();
  assert.equal(after.selectedTermId, term1.id);
  assert.equal(after.week, before.week);
  assert.deepEqual(after.weekly, before.weekly);
  assert.equal(after.error, 'ProgrammeItem does not belong to the selected term');
  assert.equal(after.loading, false);

  const stored = await repo.get('programmeItems', foreignItem.id);
  assert.equal(stored.targetWeek, originalTargetWeek);
});


test('controller rejects review of a foreign programme item without mutating the active lesson', async () => {
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
    studentService, termService, teacherTermService, weeklyProgrammeService,
    lessonService, lessonProgrammeService, homeworkService,
  });
  const controller = new TeacherAgendaController(viewModel);

  const student = await studentService.create({ name: 'Foreign Review Test' });
  const term1 = await termService.create({
    studentId: student.id, name: 'L3T1', startDate: '2026-09-01',
    endDate: '2026-12-31', level: 3, termNumber: 1,
  });
  const term2 = await termService.create({
    studentId: student.id, name: 'L3T2', startDate: '2027-01-01',
    endDate: '2027-04-30', level: 3, termNumber: 2,
  });

  await controller.loadStudents();
  await controller.selectStudent(student.id);
  await controller.selectTerm(term1.id);
  const lesson = await controller.createLesson('2026-09-24', {
    teacherNote: 'Keep the current bow distribution.'
  });
  await controller.selectTerm(term2.id);
  const foreignItem = (await repo.list('programmeItems'))
    .find(item => item.termId === term2.id && item.curriculumDomain !== 'SCALES');
  assert.ok(foreignItem);
  await controller.selectTerm(term1.id);

  const before = controller.snapshot();
  await assert.rejects(
    () => controller.reviewItems([foreignItem.id]),
    /ProgrammeItem does not belong to the lesson term/
  );

  const after = controller.snapshot();
  assert.equal(after.selectedTermId, term1.id);
  assert.equal(after.activeLessonId, lesson.id);
  assert.equal(after.activeLesson.teacherNote, 'Keep the current bow distribution.');
  assert.deepEqual(after.reviewedItemIds, before.reviewedItemIds);
  assert.deepEqual(after.lessonHistory, before.lessonHistory);
  assert.equal(after.error, 'ProgrammeItem does not belong to the lesson term');
  assert.equal(after.loading, false);

  const stored = await repo.get('lessons', lesson.id);
  assert.deepEqual(stored.reviewedProgrammeItemIds ?? [], []);
});
