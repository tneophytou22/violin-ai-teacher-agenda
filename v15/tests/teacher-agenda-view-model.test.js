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
  StudentIntelligenceService,
} from '../index.js';
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
  assert.equal(week.items.length, 25);
  assert.equal(week.summary.total, 25);
  assert.equal(week.items.filter(item => item.curriculumDomain !== 'SCALES').length, 15);

  const lesson = await agenda.createLesson(term.id, '2026-09-17', { mark: 19 });
  const selected = week.items.slice(0, 2).map(item => item.id);
  const reviewed = await agenda.reviewLessonItems(lesson.id, selected);
  assert.deepEqual(reviewed.lesson.reviewedProgrammeItemIds, selected);
});


test('teacher agenda view model delegates lesson, programme, homework, and scale boundaries to services', async () => {
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
  const agenda = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService,
    homeworkService,
    scaleMasteryService,
  });

  const student = await studentService.create({ name: 'VM Boundary' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L7T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 7,
    termNumber: 1,
  });
  await teacherTermService.activateCard(term.id);

  const week = await agenda.loadWeek(term.id, 1);
  const coreItem = week.items.find(item => item.curriculumDomain !== 'SCALES');
  const scaleItem = week.items.find(item => item.curriculumDomain === 'SCALES');
  assert.ok(coreItem);
  assert.ok(scaleItem);

  const lesson = await agenda.createLesson(term.id, '2026-09-18');
  const updated = await agenda.updateLessonDetails(lesson.id, {
    mark: 18,
    attendance: 'LATE',
    teacherNote: '  Focus on intonation  ',
  });
  assert.equal(updated.mark, 18);
  assert.equal(updated.attendance, 'LATE');
  assert.equal(updated.teacherNote, 'Focus on intonation');
  assert.equal((await agenda.getLesson(lesson.id)).id, lesson.id);
  assert.equal((await agenda.listLessons(term.id)).length, 1);

  const reviewed = await agenda.reviewLessonItems(lesson.id, [coreItem.id]);
  assert.deepEqual(reviewed.lesson.reviewedProgrammeItemIds, [coreItem.id]);

  const homework = await agenda.saveHomework(lesson.id, [
    { title: 'Slow scale practice', minutes: 10 },
  ]);
  assert.equal(homework.lessonId, lesson.id);
  assert.equal((await agenda.loadHomework(lesson.id)).items.length, 1);

  const completed = await agenda.completeProgrammeItems(term.id, [coreItem.id]);
  assert.equal(completed[0].status, 'COMPLETED');

  const uncompleted = await agenda.uncompleteProgrammeItem(term.id, coreItem.id);
  assert.equal(uncompleted.status, 'PLANNED');

  const carried = await agenda.carryForward(term.id, coreItem.id, 2);
  assert.equal(carried.targetWeek, 2);

  const assessed = await agenda.assessScale(scaleItem.id, {
    status: 'DEVELOPING',
    currentTempo: 72,
    targetTempo: 96,
    note: '  Stable intonation  ',
  }, term.id);
  assert.equal(assessed.details.mastery.status, 'DEVELOPING');
  assert.equal(assessed.details.mastery.currentTempo, 72);

  await assert.rejects(
    () => agenda.assessScale(coreItem.id, { status: 'SECURE' }, term.id),
    /not a scale item/
  );
});


test('teacher agenda view model exposes intelligence and readiness services without duplicating their logic', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const lessonService = new LessonService(repo);
  const homeworkService = new HomeworkService(repo);
  const studentIntelligenceService = new StudentIntelligenceService({
    studentService,
    termService,
    weeklyProgrammeService,
    lessonService,
    homeworkService,
    teacherTermService,
    repository: repo,
  });
  const agenda = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    lessonProgrammeService: new LessonProgrammeService(repo),
    homeworkService,
    studentIntelligenceService,
  });

  const student = await studentService.create({ name: 'Intelligence Boundary' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L7T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 7,
    termNumber: 1,
  });
  await teacherTermService.activateCard(term.id);

  const profile = await agenda.loadStudentIntelligence(student.id);
  assert.equal(profile.student.id, student.id);
  assert.equal(profile.currentTerm.id, term.id);

  const evidence = await agenda.loadEvidenceSignals(student.id);
  assert.equal(evidence.student.id, student.id);

  const prompts = await agenda.loadTeacherDecisionPrompts(student.id);
  assert.equal(prompts.student.id, student.id);

  const development = await agenda.loadLongitudinalDevelopment(student.id);
  assert.equal(development.student.id, student.id);
  assert.equal(development.terms.length, 1);

  const before = await agenda.loadTeacherReadinessReview(student.id, term.id);
  assert.equal(before.checklist[0].decision, null);

  const saved = await agenda.saveTeacherReadinessDecision(term.id, 'READY', '  Proceed to next term  ');
  assert.equal(saved.readinessDecision, 'READY');

  const after = await agenda.loadTeacherReadinessReview(student.id, term.id);
  assert.equal(after.checklist[0].decision, 'READY');
  assert.equal(after.checklist[0].decisionNote, 'Proceed to next term');
});


test('teacher agenda view model rejects an unknown student without creating term state', async () => {
  const repo = new InMemoryRepository();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const agenda = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService: new TeacherTermService(repo),
    weeklyProgrammeService: new WeeklyProgrammeService(repo),
    lessonService: new LessonService(repo),
    lessonProgrammeService: new LessonProgrammeService(repo),
  });

  await assert.rejects(
    () => agenda.loadStudent('missing-student'),
    /Student not found/
  );

  assert.deepEqual(await repo.list('students'), []);
  assert.deepEqual(await repo.list('terms'), []);
});


test('teacher agenda view model loadWeek preserves repository state for an invalid week', async () => {
  const repo = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repo);
  const termService = new TermService(repo);
  const teacherTermService = new TeacherTermService(repo);
  const weeklyProgrammeService = new WeeklyProgrammeService(repo);
  const agenda = new TeacherAgendaViewModel({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService: new LessonService(repo),
    lessonProgrammeService: new LessonProgrammeService(repo),
  });

  const student = await studentService.create({ name: 'Week Boundary' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L7T1',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    level: 7,
    termNumber: 1,
  });
  await teacherTermService.activateCard(term.id);
  const before = await repo.list('programmeItems');

  await assert.rejects(
    () => agenda.loadWeek(term.id, 0),
    /Week must be a positive integer/
  );

  assert.deepEqual(await repo.list('programmeItems'), before);
});


test('teacher agenda view model loadTerm rejects an unknown term without creating programme state', async () => {
  const repo = new InMemoryRepository();
  const agenda = new TeacherAgendaViewModel({
    studentService: new StudentService(repo),
    termService: new TermService(repo),
    teacherTermService: new TeacherTermService(repo),
    weeklyProgrammeService: new WeeklyProgrammeService(repo),
    lessonService: new LessonService(repo),
    lessonProgrammeService: new LessonProgrammeService(repo),
  });

  await assert.rejects(
    () => agenda.loadTerm('missing-term'),
    /Term not found/
  );

  assert.deepEqual(await repo.list('programmeItems'), []);
});


test('teacher agenda view model loadTermProgress rejects an unknown term without creating progress state', async () => {
  const repo = new InMemoryRepository();
  const agenda = new TeacherAgendaViewModel({
    studentService: new StudentService(repo),
    termService: new TermService(repo),
    teacherTermService: new TeacherTermService(repo),
    weeklyProgrammeService: new WeeklyProgrammeService(repo),
    lessonService: new LessonService(repo),
    lessonProgrammeService: new LessonProgrammeService(repo),
  });

  await assert.rejects(
    () => agenda.loadTermProgress('missing-term'),
    /Term not found/
  );

  assert.deepEqual(await repo.list('programmeItems'), []);
});


test('teacher agenda view model loadScaleProgress rejects an unknown term without creating scale progress state', async () => {
  const repo = new InMemoryRepository();
  const agenda = new TeacherAgendaViewModel({
    studentService: new StudentService(repo),
    termService: new TermService(repo),
    teacherTermService: new TeacherTermService(repo),
    weeklyProgrammeService: new WeeklyProgrammeService(repo),
    lessonService: new LessonService(repo),
    lessonProgrammeService: new LessonProgrammeService(repo),
  });

  await assert.rejects(
    () => agenda.loadScaleProgress('missing-term'),
    /Term not found/
  );

  assert.deepEqual(await repo.list('programmeItems'), []);
});
