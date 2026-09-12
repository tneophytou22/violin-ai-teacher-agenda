const registry = new Map();

export function registerCurriculum({ id, domain, version, getItems, renderer = null }) {
  if (!id || !domain || !version || typeof getItems !== 'function') throw new Error('Invalid curriculum registration');
  if (registry.has(id)) throw new Error(`Curriculum already registered: ${id}`);
  registry.set(id, Object.freeze({ id, domain, version, getItems, renderer }));
}

export function getCurriculum(id) {
  return registry.get(id) ?? null;
}

export function listCurricula() {
  return [...registry.values()].map(({ id, domain, version }) => ({ id, domain, version }));
}

export function selectItems(curriculumId, selectedIds) {
  const curriculum = getCurriculum(curriculumId);
  if (!curriculum) throw new Error(`Unknown curriculum: ${curriculumId}`);
  const selected = new Set(selectedIds);
  return curriculum.getItems().filter(item => selected.has(item.id));
}
