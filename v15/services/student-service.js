import { createStudent, createTerm, updateStudent } from '../domain/models.js';

export class StudentService {
  constructor(repo) { this.repo = repo; }
  create(input) { return this.repo.put('students', createStudent(input)); }

  async createWithInitialTerm(studentInput, termInput) {
    const student = createStudent(studentInput);
    const term = createTerm({
      ...termInput,
      studentId: student.id,
      name: termInput?.name || 'Term 1',
    });
    await this.repo.putRecords({ students: [student], terms: [term] });
    return { student, term };
  }
  get(studentId) { return this.repo.get('students', studentId); }
  async update(studentId, changes = {}) {
    const current = await this.get(studentId);
    if (!current) throw new Error('Student not found');
    return this.repo.put('students', updateStudent(current, changes));
  }
  list() { return this.repo.list('students'); }

  async delete(studentId) {
    const student = await this.get(studentId);
    if (!student) throw new Error('Student not found');

    const terms = (await this.repo.list('terms')).filter(term => term.studentId === studentId);
    const termIds = new Set(terms.map(term => term.id));
    const lessons = (await this.repo.list('lessons')).filter(lesson => termIds.has(lesson.termId));
    const lessonIds = new Set(lessons.map(lesson => lesson.id));

    // Student-owned descendants are removed in dependency order.
    const programmeItems = (await this.repo.list('programmeItems')).filter(item => termIds.has(item.termId));
    const homework = (await this.repo.list('homework')).filter(record => lessonIds.has(record.lessonId));

    await this.repo.deleteRecords({
      homework: homework.map(record => record.id),
      lessons: lessons.map(record => record.id),
      programmeItems: programmeItems.map(record => record.id),
      terms: terms.map(record => record.id),
      students: [studentId],
    });
    return true;
  }
}
