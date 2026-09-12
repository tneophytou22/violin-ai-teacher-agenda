import { createProgrammeItem } from '../domain/models.js';

export class ProgrammeService {
  constructor(repo) { this.repo = repo; }
  async createItem(input) {
    const term = await this.repo.get('terms', input.termId);
    if (!term) throw new Error('Cannot create programme item for unknown term');
    return this.repo.put('programmeItems', createProgrammeItem(input));
  }
  async listForTerm(termId) {
    const items = await this.repo.list('programmeItems');
    return items.filter(i => i.termId === termId);
  }
  async setStatus(itemId, status) {
    const item = await this.repo.get('programmeItems', itemId);
    if (!item) throw new Error('ProgrammeItem not found');
    item.status = status;
    item.completedAt = status === 'COMPLETED' ? (item.completedAt ?? new Date().toISOString()) : null;
    return this.repo.put('programmeItems', item);
  }
  async progress(termId, week) {
    const items = await this.listForTerm(termId);
    const due = items.filter(i => i.targetWeek <= week);
    const completed = due.filter(i => i.status === 'COMPLETED');
    return { week, dueCount: due.length, completedCount: completed.length, percentage: due.length ? Math.round(completed.length / due.length * 100) : 0 };
  }
}
