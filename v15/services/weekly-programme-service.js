import { requireTeacherUnitCard } from '../tktl/registry.js';

export class WeeklyProgrammeService {
  constructor(repo) { this.repo = repo; }

  async listForTerm(termId, week = null) {
    const term = await this.repo.get('terms', termId);
    if (!term) throw new Error('Term not found');
    const items = (await this.repo.list('programmeItems')).filter(i => i.termId === termId);
    if (week === null) return items;
    if (!Number.isInteger(week) || week < 1) throw new Error('Week must be a positive integer');
    return items.filter(i => i.targetWeek === week);
  }

  async assignWeek(itemId, targetWeek) {
    if (!Number.isInteger(targetWeek) || targetWeek < 1) throw new Error('Week must be a positive integer');
    const item = await this.repo.get('programmeItems', itemId);
    if (!item) throw new Error('ProgrammeItem not found');
    item.targetWeek = targetWeek;
    return this.repo.put('programmeItems', item);
  }

  async summary(termId, week) {
    const items = await this.listForTerm(termId, week);
    const byDomain = {};
    for (const item of items) {
      byDomain[item.curriculumDomain] ??= { total: 0, completed: 0 };
      byDomain[item.curriculumDomain].total += 1;
      if (item.status === 'COMPLETED') byDomain[item.curriculumDomain].completed += 1;
    }
    return {
      week,
      total: items.length,
      completed: items.filter(i => i.status === 'COMPLETED').length,
      byDomain,
    };
  }

  async validateTermAgainstCard(termId) {
    const term = await this.repo.get('terms', termId);
    if (!term) throw new Error('Term not found');
    if (!Number.isInteger(term.level) || !Number.isInteger(term.termNumber)) {
      throw new Error('Term must have Level and Term before weekly programme validation');
    }
    const card = requireTeacherUnitCard(term.level, term.termNumber);
    const items = await this.listForTerm(termId);
    const cardItems = items.filter(i => i.cardId === card.id);
    return {
      cardId: card.id,
      expectedCount: 15,
      actualCount: cardItems.length,
      valid: cardItems.length === 15,
    };
  }
}
