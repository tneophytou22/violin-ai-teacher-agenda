import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StudentService, TermService, TeacherTermService, WeeklyProgrammeService, LessonService, LessonProgrammeService } from '../index.js';
import { TeacherAgendaViewModel } from '../ui/teacher-agenda-view-model.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

test('teacher agenda view model composes the teacher workflow without owning business state', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const lessonProgrammeService = new LessonProgrammeService(repo);
  const agenda = new TeacherAgendaViewModel({ studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, lessonProgrammeService });

  const student = await studentService.create({ name: 'Agenda Test' });
  const term = await termService.create({ studentId: student.id, name: 'L7T1', startDate: '2026-09-01', endDate: '2026-12-31', level: 7, termNumber: 1 });
  await teacherTermService.activateCard(term.id);

  const studentContext = await agenda.loadStudent(student.id);
  assert.equal(studentContext.terms.length, 1);
  const termContext = await agenda.loadTerm(term.id);
  assert.equal(termContext.card.id, 'L7T1');

  const progress = await agenda.loadTermProgress(term.id);
  assert.equal(progress.total, 15);
  assert.equal(progress.completed, 0);
  assert.equal(progress.byDomain.PURE_TECHNICAL.total, 5);

  const week = await agenda.loadWeek(term.id, 1);
  assert.equal(week.items.length, 15);
  assert.equal(week.summary.total, 15);

  const lesson = await agenda.createLesson(term.id, '2026-09-17', { mark: 19 });
  const selected = week.items.slice(0, 2).map(item => item.id);
  const reviewed = await agenda.reviewLessonItems(lesson.id, selected);
  assert.deepEqual(reviewed.lesson.reviewedProgrammeItemIds, selected);
});
