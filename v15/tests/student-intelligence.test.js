import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryRepository,
  StudentService,
  TermService,
  TeacherTermService,
  WeeklyProgrammeService,
  LessonService,
  HomeworkService,
  StudentIntelligenceService,
  LessonProgrammeService,
} from '../index.js';
import { registerV1Curricula } from '../curriculum/v1-registration.js';

async function setup() {
  const repository = new InMemoryRepository();
  registerV1Curricula();
  const studentService = new StudentService(repository);
  const termService = new TermService(repository);
  const teacherTermService = new TeacherTermService(repository);
  const weeklyProgrammeService = new WeeklyProgrammeService(repository);
  const lessonService = new LessonService(repository);
  const homeworkService = new HomeworkService(repository);
  const intelligence = new StudentIntelligenceService({
    studentService,
    termService,
    teacherTermService,
    weeklyProgrammeService,
    lessonService,
    homeworkService,
    repository,
  });
  const student = await studentService.create({ name: 'Intelligence Test' });
  const term = await termService.create({
    studentId: student.id,
    name: 'L3T1',
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    level: 3,
    termNumber: 1,
  });
  await teacherTermService.activateCard(term.id);
  return { repository, studentService, termService, teacherTermService, weeklyProgrammeService, lessonService, homeworkService, intelligence, student, term };
}

test('student intelligence builds a derived longitudinal profile without a new persistence store', async () => {
  const { repository, intelligence, student, term, lessonService, homeworkService } = await setup();
  const weekly = new WeeklyProgrammeService(repository);
  const items = await weekly.listForTerm(term.id, 1);
  const lesson = await lessonService.create({
    termId: term.id,
    date: '2026-09-18',
    mark: 18,
    attendance: 'PRESENT',
    reviewedProgrammeItemIds: [items[0].id, items[5].id],
  });
  await new LessonProgrammeService(repository).completeItems([items[0].id]);
  await homeworkService.assignHomework({
    lessonId: lesson.id,
    items: [{ text: 'Slow practice', completed: false }, { text: 'Record one take', completed: false }],
  });

  const profile = await intelligence.getStudentProfile(student.id);

  assert.equal(profile.student.id, student.id);
  assert.equal(profile.currentTerm.id, term.id);
  assert.equal(profile.terms.length, 1);
  assert.equal(profile.termProfiles.length, 1);

  const termProfile = profile.termProfiles[0];
  assert.equal(termProfile.programme.PURE_TECHNICAL.total, 5);
  assert.equal(termProfile.programme.PURE_TECHNICAL.completed, 1);
  assert.equal(termProfile.programme.PURE_TECHNICAL.reviewed, 1);
  assert.equal(termProfile.programme.ETUDE.reviewed, 1);
  assert.equal(termProfile.programme.REPERTOIRE.reviewed, 0);
  assert.equal(termProfile.lessons.count, 1);
  assert.equal(termProfile.lessons.marks.latest, 18);
  assert.equal(termProfile.lessons.marks.average, 18);
  assert.equal(termProfile.lessons.attendance.PRESENT, 1);
  assert.equal(termProfile.homework.lessonCount, 1);
  assert.equal(termProfile.homework.itemCount, 2);
  assert.equal(termProfile.scales.total, 11);
  assert.equal(termProfile.scales.mastery.masteryPercent, 0);
  assert.equal(termProfile.tktl.cardId, 'L3T1');

  assert.equal(profile.timeline.some(event => event.type === 'LESSON' && event.id === lesson.id), true);
  assert.equal(profile.timeline.some(event => event.type === 'HOMEWORK' && event.lessonId === lesson.id), true);
  assert.equal(profile.timeline.some(event => event.type === 'PROGRAMME_COMPLETION' && event.id === items[0].id), true);
});

test('student intelligence preserves explicit scale mastery as a derived summary', async () => {
  const { repository, intelligence, student, term } = await setup();
  const weekly = new WeeklyProgrammeService(repository);
  const scale = (await weekly.listForTerm(term.id, 1)).find(item => item.curriculumDomain === 'SCALES');
  const { ScaleMasteryService } = await import('../services/scale-mastery-service.js');
  await new ScaleMasteryService(repository).assess({
    programmeItemId: scale.id,
    status: 'SECURE',
    currentTempo: 60,
    targetTempo: 72,
    intonation: 'SECURE',
  });

  const profile = await intelligence.getStudentProfile(student.id);
  const scales = profile.termProfiles[0].scales;
  assert.equal(scales.mastery.counts.SECURE, 1);
  assert.equal(scales.mastery.masteryPercent, 7);
  assert.equal(scales.completed, 0);
});

test('student intelligence timeline is chronological and factual', async () => {
  const { intelligence, student, term, lessonService } = await setup();
  const older = await lessonService.create({ termId: term.id, date: '2026-09-10', mark: 15 });
  const newer = await lessonService.create({ termId: term.id, date: '2026-09-24', mark: 17 });
  const timeline = await intelligence.getStudentTimeline(student.id);
  const lessonEvents = timeline.filter(event => event.type === 'LESSON');
  assert.deepEqual(lessonEvents.map(event => event.id), [newer.id, older.id]);
  assert.deepEqual(lessonEvents.map(event => event.date), ['2026-09-24', '2026-09-10']);
});

test('student intelligence rejects unknown students', async () => {
  const { intelligence } = await setup();
  await assert.rejects(
    () => intelligence.getStudentProfile('missing-student'),
    /Student not found/
  );
});


test('longitudinal development returns factual term metrics and deltas without inferred judgments', async () => {
  const { intelligence, student, term, lessonService } = await setup();
  await lessonService.create({ termId: term.id, date: '2026-09-10', mark: 15, attendance: 'PRESENT' });

  const development = await intelligence.getLongitudinalDevelopment(student.id);

  assert.equal(development.student.id, student.id);
  assert.equal(development.currentTerm.id, term.id);
  assert.equal(development.terms.length, 1);
  assert.deepEqual(development.terms[0].metrics, {
    lessons: 1,
    averageMark: 15,
    attendancePresent: 1,
    attendanceLate: 0,
    attendanceAbsent: 0,
    pureTechnicalCompleted: 0,
    etudeCompleted: 0,
    repertoireCompleted: 0,
    scalesCompleted: 0,
    scaleMasteryPercent: 0,
    homeworkItems: 0,
  });
  assert.equal(development.terms[0].delta.lessons, null);
  assert.equal(development.terms[0].delta.averageMark, null);
});

test('longitudinal development compares adjacent terms using numeric deltas only', async () => {
  const { intelligence, student, termService, lessonService, term } = await setup();
  await lessonService.create({ termId: term.id, date: '2026-09-10', mark: 15, attendance: 'PRESENT' });

  const term2 = await termService.create({
    studentId: student.id,
    name: 'L3T2',
    startDate: '2027-02-01',
    endDate: '2027-06-30',
    level: 3,
    termNumber: 2,
  });
  await lessonService.create({ termId: term2.id, date: '2027-02-10', mark: 18, attendance: 'LATE' });

  const development = await intelligence.getLongitudinalDevelopment(student.id);

  assert.equal(development.terms.length, 2);
  assert.equal(development.terms[0].metrics.averageMark, 15);
  assert.equal(development.terms[1].metrics.averageMark, 18);
  assert.equal(development.terms[1].delta.averageMark, 3);
  assert.equal(development.terms[1].delta.lessons, 0);
  assert.equal(development.terms[1].delta.attendancePresent, -1);
  assert.equal(development.terms[1].delta.attendanceLate, 1);
});


test('evidence signals are factual and rule-based, not inferred judgements', async () => {
  const { intelligence, student, term, lessonService } = await setup();
  await lessonService.create({ termId: term.id, date: '2026-09-10', attendance: 'ABSENT' });

  const result = await intelligence.getEvidenceSignals(student.id);
  assert.equal(result.student.id, student.id);
  assert.equal(result.currentTermId, term.id);
  assert.equal(result.signals.some(signal => signal.type === 'PENDING_PROGRAMME'), true);
  assert.equal(result.signals.some(signal => signal.type === 'ABSENCE_RECORDED'), true);
  assert.equal(result.signals.some(signal => signal.type === 'SCALE_NOT_STARTED'), true);
  assert.equal(result.signals.every(signal => typeof signal.evidence === 'string' && signal.evidence.length > 0), true);
  assert.equal(result.signals.some(signal => /weak|at risk|improving|poor/i.test(signal.evidence)), false);
});


test('teacher decision prompts expose TKTL guidance alongside evidence without making conclusions', async () => {
  const { intelligence, student, term, lessonService } = await setup();
  await lessonService.create({ termId: term.id, date: '2026-09-10', attendance: 'PRESENT' });

  const result = await intelligence.getTeacherDecisionPrompts(student.id);
  assert.equal(result.student.id, student.id);
  assert.equal(result.currentTermId, term.id);
  assert.equal(result.prompts.length > 0, true);
  assert.equal(result.prompts.every(prompt => Array.isArray(prompt.teacherDecisionLogic)), true);
  assert.equal(result.prompts.every(prompt => Array.isArray(prompt.readinessCriteria)), true);
  assert.equal(result.prompts.every(prompt => typeof prompt.nextTermDependency === 'string'), true);
  assert.equal(result.prompts.every(prompt => typeof prompt.evidence === 'string'), true);
});


test('teacher readiness review exposes current TKTL criteria without an automatic decision', async () => {
  const { intelligence, student, term } = await setup();
  const result = await intelligence.getTeacherReadinessReview(student.id);
  assert.equal(result.student.id, student.id);
  assert.equal(result.currentTerm.id, term.id);
  assert.equal(result.checklist.length, 1);
  assert.equal(result.checklist[0].cardId, 'L3T1');
  assert.equal(Array.isArray(result.checklist[0].readinessCriteria), true);
  assert.equal(typeof result.checklist[0].nextTermDependency, 'string');
  assert.equal(result.checklist[0].decision, null);
});
