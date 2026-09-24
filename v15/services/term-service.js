import { createTerm, TEACHER_READINESS_DECISIONS } from '../domain/models.js';

export class TermService {
  constructor(repo) { this.repo = repo; }
  async create(input) {
    const student = await this.repo.get('students', input.studentId);
    if (!student) throw new Error('Cannot create term for unknown student');
    return this.repo.put('terms', createTerm(input));
  }
  async setReadinessDecision(termId, { decision = null, note = '' } = {}) {
    const term = await this.repo.get('terms', termId);
    if (!term) throw new Error('Term not found');
    if (decision !== null && !TEACHER_READINESS_DECISIONS.includes(decision)) {
      throw new Error('Teacher readiness decision is invalid');
    }
    if (typeof note !== 'string') throw new Error('Teacher readiness decision note must be a string');
    const updated = {
      ...term,
      readinessDecision: decision,
      readinessDecisionNote: note.trim(),
      readinessDecisionAt: decision === null ? null : new Date().toISOString(),
      version: (term.version ?? 0) + 1,
    };
    return this.repo.put('terms', updated);
  }

  get(termId) { return this.repo.get('terms', termId); }
  async listForStudent(studentId) {
    const terms = await this.repo.list('terms');
    return terms.filter(t => t.studentId === studentId);
  }
}
