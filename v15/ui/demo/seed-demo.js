import { createStudent, createTerm } from '../../domain/models.js';

export async function ensureDemoData(repository) {
  const students = await repository.list('students');
  if (students.length) return students[0];

  const student = createStudent({
    name: 'Demo Student',
    schoolType: 'PRIVATE',
    instrument: 'VIOLIN',
  });
  await repository.put('students', student);

  const term = createTerm({
    studentId: student.id,
    name: '2026–27 Term 1',
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    level: 1,
    termNumber: 1,
  });
  await repository.put('terms', term);

  return student;
}
