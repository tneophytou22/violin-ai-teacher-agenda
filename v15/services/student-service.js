import { createStudent } from '../domain/models.js';

export class StudentService {
  constructor(repo) { this.repo = repo; }
  create(input) { return this.repo.put('students', createStudent(input)); }
  get(studentId) { return this.repo.get('students', studentId); }
  list() { return this.repo.list('students'); }
}
