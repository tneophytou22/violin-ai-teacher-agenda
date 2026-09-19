const MASTERY_STATUSES = Object.freeze(['NOT_STARTED', 'DEVELOPING', 'SECURE', 'PERFORMANCE_READY']);
const DIMENSION_STATUSES = Object.freeze(['DEVELOPING', 'SECURE']);
const MASTERY_WEIGHTS = Object.freeze({ NOT_STARTED: 0, DEVELOPING: 40, SECURE: 75, PERFORMANCE_READY: 100 });

export class ScaleMasteryService {
  constructor(repo) { this.repo = repo; }

  async assess({ programmeItemId, status = 'NOT_STARTED', currentTempo = null, targetTempo = null, intonation = null, bowControl = null, consistency = null, note = '' } = {}) {
    if (!MASTERY_STATUSES.includes(status)) throw new Error('Invalid scale mastery status');
    for (const value of [intonation, bowControl, consistency]) {
      if (value !== null && !DIMENSION_STATUSES.includes(value)) throw new Error('Invalid scale assessment dimension');
    }
    const item = await this.repo.get('programmeItems', programmeItemId);
    if (!item) throw new Error('Scale ProgrammeItem not found');
    if (item.curriculumDomain !== 'SCALES') throw new Error('ProgrammeItem is not a scale item');
    const existing = item.details?.mastery ?? {};
    item.details = {
      ...(item.details ?? {}),
      mastery: {
        ...existing, status, currentTempo, targetTempo, intonation, bowControl, consistency,
        note: String(note ?? '').trim(), assessedAt: new Date().toISOString()
      }
    };
    return this.repo.put('programmeItems', item);
  }

  static getStatusWeight(status) { return MASTERY_WEIGHTS[status] ?? 0; }
}

export { MASTERY_STATUSES, DIMENSION_STATUSES, MASTERY_WEIGHTS };
