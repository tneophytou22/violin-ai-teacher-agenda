const DIFFICULTY_BANDS = Object.freeze(['CORE', 'CHALLENGE', 'BRIDGE', 'READINESS', 'CAPSTONE']);
const STATUS = Object.freeze(['VALIDATED', 'PROVISIONAL', 'OPEN']);

const requireText = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
};

const requireArray = (value, field, min = 1) => {
  if (!Array.isArray(value) || value.length < min) throw new Error(`${field} requires at least ${min} item(s)`);
  return [...value];
};

export function createTeacherUnitCard(input) {
  const level = Number(input.level);
  const term = Number(input.term);
  if (!Number.isInteger(level) || level < 1 || level > 10) throw new Error('TeacherUnitCard.level must be 1–10');
  if (!Number.isInteger(term) || term < 1 || term > 2) throw new Error('TeacherUnitCard.term must be 1–2');

  const difficultyBand = input.difficultyBand ?? 'CORE';
  if (!DIFFICULTY_BANDS.includes(difficultyBand)) throw new Error(`Invalid difficulty band: ${difficultyBand}`);

  const status = input.status ?? 'PROVISIONAL';
  if (!STATUS.includes(status)) throw new Error(`Invalid status: ${status}`);

  const pureTechnical = requireArray(input.pureTechnical, 'pureTechnical', 5);
  const etudes = requireArray(input.etudes, 'etudes', 5);
  const repertoire = requireArray(input.repertoire, 'repertoire', 5);

  return Object.freeze({
    id: `L${level}T${term}`,
    level,
    term,
    technicalIntent: requireText(input.technicalIntent, 'technicalIntent'),
    prerequisites: requireArray(input.prerequisites, 'prerequisites'),
    scalesLink: requireArray(input.scalesLink, 'scalesLink'),
    pureTechnical,
    etudes,
    repertoire,
    technicalDomains: requireArray(input.technicalDomains, 'technicalDomains'),
    musicalDomains: requireArray(input.musicalDomains, 'musicalDomains'),
    teacherDecisionLogic: requireArray(input.teacherDecisionLogic, 'teacherDecisionLogic'),
    readinessCriteria: requireArray(input.readinessCriteria, 'readinessCriteria'),
    nextTermDependency: requireText(input.nextTermDependency, 'nextTermDependency'),
    difficultyBand,
    status
  });
}

export { DIFFICULTY_BANDS, STATUS };
