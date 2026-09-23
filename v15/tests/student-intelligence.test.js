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
