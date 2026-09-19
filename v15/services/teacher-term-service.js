import { createProgrammeItem } from '../domain/models.js';
import { requireTeacherUnitCard } from '../tktl/registry.js';
import { registerV1Curricula, V1_CURRICULUM_IDS } from '../curriculum/v1-registration.js';
import { listScaleItems, getScaleTerm } from '../curriculum/scales-data-v1.js';

const FIELD_TO_CURRICULUM = Object.freeze([
  ['pureTechnical', V1_CURRICULUM_IDS.PURE_TECHNICAL, 'PURE_TECHNICAL'],
  ['etudes', V1_CURRICULUM_IDS.ETUDE, 'ETUDE'],
  ['repertoire', V1_CURRICULUM_IDS.REPERTOIRE, 'REPERTOIRE'],
]);

export class TeacherTermService {
  constructor(repo) { this.repo = repo; }

  async getContext(termId) {
    const term = await this.repo.get('terms', termId);
    if (!term) throw new Error('Term not found');
    if (!Number.isInteger(term.level) || term.level < 1 || term.level > 10) {
      throw new Error('Term level must be an integer from 1 to 10');
    }
    if (!Number.isInteger(term.termNumber) || term.termNumber < 1 || term.termNumber > 2) {
      throw new Error('Term termNumber must be 1 or 2');
    }
    const student = await this.repo.get('students', term.studentId);
    if (!student) throw new Error('Term student not found');
    const card = requireTeacherUnitCard(term.level, term.termNumber);
    const scales = getScaleTerm(term.level, term.termNumber);
    return { student, term, card, scales };
  }

  async activateCard(termId) {
    const { term, card } = await this.getContext(termId);
    registerV1Curricula();
    const existing = await this.repo.list('programmeItems');
    const existingForCard = existing.filter(item => item.termId === termId && item.cardId === card.id);
    const existingByObjectId = new Map(existingForCard.map(item => [item.objectId, item]));

    const programmeItems = [];
    for (const [field, curriculumId, curriculumDomain] of FIELD_TO_CURRICULUM) {
      for (let index = 0; index < card[field].length; index += 1) {
        const objectId = `${card.id}:${curriculumDomain}:${index + 1}`;
        const existingItem = existingByObjectId.get(objectId);
        if (existingItem) {
          programmeItems.push(existingItem);
          continue;
        }

        programmeItems.push(await this.repo.put('programmeItems', createProgrammeItem({
          termId,
          curriculumId,
          curriculumDomain,
          objectId,
          title: card[field][index],
          targetWeek: 1,
          cardId: card.id,
        })));
      }
    }
    const scaleItems = listScaleItems(term.level, term.termNumber);
    for (const scaleItem of scaleItems) {
      const objectId = `${card.id}:SCALES:${scaleItem.id}`;
      const existingItem = existingByObjectId.get(objectId);
      if (existingItem) {
        programmeItems.push(existingItem);
        continue;
      }

      programmeItems.push(await this.repo.put('programmeItems', createProgrammeItem({
        termId,
        curriculumId: V1_CURRICULUM_IDS.SCALES,
        curriculumDomain: 'SCALES',
        objectId,
        title: scaleItem.title,
        targetWeek: 1,
        cardId: card.id,
        details: {
          category: scaleItem.category,
          requirements: scaleItem.requirements,
        },
      })));
    }

    return { card, programmeItems, scaleItems };
  }
}
