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
  const viewModel = new TeacherAgendaViewModel({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService });
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
  assert.equal(state.selectedStudentId, student.id);
  assert.equal(state.selectedTermId, term.id);
  assert.equal(state.termContext.card.id, 'L7T1');
  assert.equal(state.weekly.items.length, 15);

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
