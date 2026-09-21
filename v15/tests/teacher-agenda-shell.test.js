import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StudentService, TermService, TeacherTermService, WeeklyProgrammeService, LessonService, LessonProgrammeService } from '../index.js';
import { TeacherAgendaViewModel } from '../ui/teacher-agenda-view-model.js';
import { TeacherAgendaController } from '../ui/teacher-agenda-controller.js';
import { TeacherAgendaShell } from '../ui/teacher-agenda-shell.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

class FakeRoot {
  constructor() { this.innerHTML = ''; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener() {}
}

test('teacher agenda shell renders the V15 workspace from controller state', async () => {
  const repo = new InMemoryRepository(); registerV1Curricula();
  const studentService = new StudentService(repo); const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo); const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo); const lessonProgramme = new LessonProgrammeService(repo);
  const vm = new TeacherAgendaViewModel({ studentService, termService, teacherTermService, weeklyProgrammeService: weekly, lessonService: lessons, lessonProgrammeService: lessonProgramme });
  const controller = new TeacherAgendaController(vm); const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-17' });
  await studentService.create({ name: 'Shell Test' });
  await shell.start();
  assert.match(root.innerHTML, /Teacher Agenda/); assert.match(root.innerHTML, /Select student/);
});

test('shell requires the V15 controller boundary', () => assert.throws(() => new TeacherAgendaShell({ controller: {}, root: new FakeRoot() }), /TeacherAgendaController/));

test('shell renders lesson-session controls after a student and term are selected', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weekly = new WeeklyProgrammeService(repo);
  const lessons = new LessonService(repo);
  const lessonProgramme = new LessonProgrammeService(repo);
  const { HomeworkService } = await import('../services/homework-service.js');
  const homework = new HomeworkService(repo);
  const vm = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService: weekly,
    lessonService: lessons,
    lessonProgrammeService: lessonProgramme,
    homeworkService: homework,
  });
  const controller = new TeacherAgendaController(vm);
  const root = new FakeRoot();
  const shell = new TeacherAgendaShell({ controller, root, now: () => '2026-09-18' });

  const student = await studentService.create({ name: 'Lesson Shell Test' });
  await termService.create({
    studentId: student.id,
    name: 'L5T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 5,
    termNumber: 1,
  });

  await shell.start();
  await controller.selectStudent(student.id);
  shell.render();

  assert.match(root.innerHTML, /Lesson Session/);
  assert.match(root.innerHTML, /Start lesson/);
  await controller.createLesson('2026-09-18');
  shell.render();
  assert.match(root.innerHTML, /data-action="lesson" disabled/);
  assert.match(root.innerHTML, /Lesson active ✓/);
  assert.doesNotMatch(root.innerHTML, /Start lesson/);
  assert.match(root.innerHTML, /Lesson History/);
  assert.match(root.innerHTML, /data-lesson-history-item/);
  assert.match(root.innerHTML, /Complete selected/);
  assert.match(root.innerHTML, /Start a lesson below to enable Review selected/);
  assert.match(root.innerHTML, /Current term/);
  assert.match(root.innerHTML, /Create new term/);
  assert.match(root.innerHTML, /Weekly progress/);
  assert.match(root.innerHTML, /pending/);
  assert.match(root.innerHTML, /data-item=/);
  assert.match(root.innerHTML, /Weekly Agenda/);
  assert.match(root.innerHTML, /Lesson dashboard/);
  assert.match(root.innerHTML, /Term progress/);
  assert.match(root.innerHTML, /Scale mastery/);
  assert.doesNotMatch(root.innerHTML, /No lesson started/);
  assert.match(root.innerHTML, /SCALES/);
  assert.match(root.innerHTML, /Scale Progress \/ Mastery/);
  assert.match(root.innerHTML, /Mastery is teacher-assessed/);
  assert.match(root.innerHTML, /Save assessment/);
  assert.match(root.innerHTML, /PURE TECHNICAL 0\/5/);
  assert.match(root.innerHTML, /ETUDE 0\/5/);
  assert.match(root.innerHTML, /REPERTOIRE 0\/5/);
  assert.match(root.innerHTML, /New student/);
});
