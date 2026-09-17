import { createProgrammeItem } from '../domain/models.js';
import { requireTeacherUnitCard } from '../tktl/registry.js';
import { registerV1Curricula, V1_CURRICULUM_IDS } from '../curriculum/v1-registration.js';

const FIELD_TO_CURRICULUM = Object.freeze([
  ['pureTechnical', V1_CURRICULUM_IDS.PURE_TECHNICAL],
  ['etudes', V1_CURRICULUM_IDS.ETUDE],
  ['repertoire', V1_CURRICULUM_IDS.REPERTOIRE],
]);

export class TeacherTermService {
  constructor(repo) { this.repo = repo; }

  async getContext(termId) {
    const term = await this.repo.get('terms', termId);
    if (!term) throw new Error('Term not found');
    if (!Number.isInteger(term.level) || term.level < 1 || term.level > 10) {
      throw new Error('Term level must be an integer from 1 to 10');
    }
    const student = await this.repo.get('students', term.studentId);
    if (!student) throw new Error('Term student not found');
    const card = requireTeacherUnitCard(term.level, 1);
    return { student, term, card };
  }

  async activateCard(termId) {
    const term = await this.repo.get('terms', termId);
    if (!term) throw new Error('Term not found');
    if (!Number.isInteger(term.level) || term.level < 1 || term.level > 10) {
      throw new Error('Term level must be an integer from 1 to 10');
    }
    registerV1Curricula();
    const card = requireTeacherUnitCard(term.level, term.termNumber ?? 1);
    const existing = await this.repo.list('programmeItems');
    const existingForCard = existing.filter(item => item.termId === termId && item.cardId === card.id);
    if (existingForCard.length) return { card, programmeItems: existingForCard };

    const programmeItems = [];
    for (const [field, curriculumId] of FIELD_TO_CURRICULUM) {
      for (let index = 0; index < card[field].length; index += 1) {
        programmeItems.push(await this.repo.put('programmeItems', createProgrammeItem({
          termId,
          curriculumId,
          curriculumDomain: field.toUpperCase(),
          objectId: `${card.id}:${field.toUpperCase()}:${index + 1}`,
          title: card[field][index],
          targetWeek: 1,
        })));
      }
    }
    return { card, programmeItems };
  }
}
