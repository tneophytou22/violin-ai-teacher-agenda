import { getCurriculum, registerCurriculum } from './registry.js';
import { listTeacherUnitCards } from '../tktl/registry.js';
import '../tktl/cards-v1.js';

const DOMAINS = Object.freeze([
  ['PURE_TECHNICAL', 'pure-technical-v1', '1.0.0', 'pureTechnical'],
  ['ETUDE', 'etude-v1', '1.0.0', 'etudes'],
  ['REPERTOIRE', 'repertoire-v1', '1.0.0', 'repertoire'],
]);

function buildItems(field, domain) {
  return () => listTeacherUnitCards().flatMap(card =>
    card[field].map((title, index) => ({
      id: `${card.id}:${domain}:${index + 1}`,
      title,
      domain,
      level: card.level,
      term: card.term,
      cardId: card.id,
    }))
  );
}

export function registerV1Curricula() {
  for (const [domain, id, version, field] of DOMAINS) {
    if (!getCurriculum(id)) {
      registerCurriculum({ id, domain, version, getItems: buildItems(field, domain) });
    }
  }
  return DOMAINS.map(([, id]) => getCurriculum(id));
}

export const V1_CURRICULUM_IDS = Object.freeze({
  PURE_TECHNICAL: 'pure-technical-v1',
  ETUDE: 'etude-v1',
  REPERTOIRE: 'repertoire-v1',
});
