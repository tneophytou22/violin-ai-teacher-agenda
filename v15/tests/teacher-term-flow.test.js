import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository } from '../repository/in-memory-repository.js';
import { StudentService } from '../services/student-service.js';
import { TermService } from '../services/term-service.js';
import { LessonService } from '../services/lesson-service.js';
import { TeacherTermService } from '../services/teacher-term-service.js';
import { registerV1Curricula, V1_CURRICULUM_IDS } from '../curriculum/v1-registration.js';

registerV1Curricula();

test('student → Level/Term → TKTL card → programme → lesson flow', async () => {
  const repo = new InMemoryRepository();
  const students = new StudentService(repo);
  const terms = new TermService(repo);
  const lessons = new LessonService(repo);
  const teacherTerm = new TeacherTermService(repo);

  const student = await students.create({ name: 'Test Student' });
  const term = await terms.create({
    studentId: student.id,
    name: 'Level 7 Term 1',
    level: 7,
    termNumber: 1,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  });

  const context = await teacherTerm.getContext(term.id);
  assert.equal(context.student.id, student.id);
  assert.equal(context.card.id, 'L7T1');

  const activation = await teacherTerm.activateCard(term.id);
  assert.equal(activation.card.id, 'L7T1');
  assert.equal(activation.programmeItems.filter(i => i.curriculumDomain !== 'SCALES').length, 15);
  assert.ok(activation.programmeItems.some(i => i.curriculumDomain === 'SCALES'));
  assert.equal(activation.programmeItems.filter(i => i.curriculumId === V1_CURRICULUM_IDS.PURE_TECHNICAL).length, 5);
  assert.equal(activation.programmeItems.filter(i => i.curriculumId === V1_CURRICULUM_IDS.ETUDE).length, 5);
  assert.equal(activation.programmeItems.filter(i => i.curriculumId === V1_CURRICULUM_IDS.REPERTOIRE).length, 5);
  assert.ok(activation.programmeItems.every(i => i.termId === term.id && i.cardId === 'L7T1'));

  const secondActivation = await teacherTerm.activateCard(term.id);
  assert.equal(secondActivation.programmeItems.filter(i => i.curriculumDomain !== 'SCALES').length, 15);
  assert.equal(secondActivation.programmeItems.filter(i => i.curriculumDomain === 'SCALES').length, activation.programmeItems.filter(i => i.curriculumDomain === 'SCALES').length);
  assert.deepEqual(secondActivation.programmeItems.map(i => i.id).sort(), activation.programmeItems.map(i => i.id).sort());

  const lesson = await lessons.create({ termId: term.id, date: '2026-09-15', mark: 18 });
  const reviewed = await lessons.reviewProgrammeItems(lesson.id, [activation.programmeItems[0].id, activation.programmeItems[5].id]);
  assert.deepEqual(reviewed.reviewedProgrammeItemIds, [activation.programmeItems[0].id, activation.programmeItems[5].id]);
});

test('Term rejects missing or invalid Level×Term identity', async () => {
  const repo = new InMemoryRepository();
  const students = new StudentService(repo);
  const terms = new TermService(repo);
  const student = await students.create({ name: 'Test Student' });

  await assert.rejects(
    terms.create({ studentId: student.id, name: 'Invalid', level: 11, termNumber: 1 }),
    /Term\.level must be an integer from 1–10/
  );
  await assert.rejects(
    terms.create({ studentId: student.id, name: 'Invalid', level: 7, termNumber: 3 }),
    /Term\.termNumber must be 1 or 2/
  );
});
