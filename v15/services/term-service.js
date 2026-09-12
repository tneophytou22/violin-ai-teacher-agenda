import { createTerm } from '../domain/models.js';

export class TermService {
  constructor(repo) { this.repo = repo; }
  async create(input) {
    const student = await this.repo.get('students', input.studentId);
    if (!student) throw new Error('Cannot create term for unknown student');
    return this.repo.put('terms', createTerm(input));
  }
  get(termId) { return this.repo.get('terms', termId); }
  async listForStudent(studentId) {
    const terms = await this.repo.list('terms');
    return terms.filter(t => t.studentId === studentId);
  }
}
