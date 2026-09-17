import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTeacherAgenda } from './teacher-agenda-view.js';

test('teacher agenda view renders the three curriculum domains and lesson controls', () => {
  const html = renderTeacherAgenda({
    students: [{ id: 's1', name: 'Student One' }],
    selectedStudentId: 's1',
    terms: [{ id: 't1', name: 'L7T1' }],
    selectedTermId: 't1',
    termContext: {
      student: { name: 'Student One' },
      term: { level: 7, termNumber: 1 },
      card: { id: 'L7T1' },
    },
    week: 1,
    weekly: {
      items: [
        { id: 'p1', title: 'Shift', curriculumDomain: 'PURE_TECHNICAL', status: 'PLANNED' },
        { id: 'e1', title: 'Dont Op.37 No.3', curriculumDomain: 'ETUDE', status: 'PLANNED' },
        { id: 'r1', title: 'Core repertoire', curriculumDomain: 'REPERTOIRE', status: 'COMPLETED' },
      ],
      summary: { total: 3, completed: 1 },
    },
    activeLessonId: 'lesson-1',
    loading: false,
    error: null,
  });

  assert.match(html, /Student One/);
  assert.match(html, /Pure Technical/);
  assert.match(html, /Etude \/ Study \/ Caprice/);
  assert.match(html, /Repertoire/);
  assert.match(html, /New Lesson/);
  assert.match(html, /Review selected/);
  assert.match(html, /Dont Op\.37 No\.3/);
});
