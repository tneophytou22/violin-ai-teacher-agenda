import { createStudent, updateStudent } from '../domain/models.js';

export class StudentService {
  constructor(repo) { this.repo = repo; }
  create(input) { return this.repo.put('students', createStudent(input)); }
  get(studentId) { return this.repo.get('students', studentId); }
  async update(studentId, changes = {}) {
    const current = await this.get(studentId);
    if (!current) throw new Error('Student not found');
    return this.repo.put('students', updateStudent(current, changes));
  }
  list() { return this.repo.list('students'); }
}
