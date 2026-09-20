import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, createProgrammeItem, ScaleMasteryService } from '../index.js';

test('scale mastery assessment is stored separately from programme completion', async () => {
  const repo = new InMemoryRepository();
  const service = new ScaleMasteryService(repo);
  const item = await repo.put('programmeItems', createProgrammeItem({
    termId: 'term_1',
    curriculumId: 'scales-v1',
    curriculumDomain: 'SCALES',
    objectId: 'L1T1:SCALES:scale-1',
    title: 'G major — 1 octave',
    targetWeek: 1,
    details: { category: 'Major Scales', requirements: { tempo: '♩=50–60' } },
  }));

  const assessed = await service.assess({
    programmeItemId: item.id,
    status: 'DEVELOPING',
    currentTempo: 52,
    targetTempo: 60,
    intonation: 'SECURE',
    bowControl: 'DEVELOPING',
    consistency: 'DEVELOPING',
    note: 'Keep the bow straight.',
  });

  assert.equal(assessed.status, 'PLANNED');
  assert.equal(assessed.details.mastery.status, 'DEVELOPING');
  assert.equal(assessed.details.mastery.currentTempo, 52);
  assert.equal(assessed.details.mastery.targetTempo, 60);

  const stored = await repo.get('programmeItems', item.id);
  assert.equal(stored.details.mastery.note, 'Keep the bow straight.');
  assert.equal(stored.status, 'PLANNED');
});

test('scale mastery summary uses explicit teacher-assessed mastery, not completion', async () => {
  const items = [
    { details: { mastery: { status: 'NOT_STARTED' } } },
    { details: { mastery: { status: 'DEVELOPING' } } },
    { details: { mastery: { status: 'SECURE' } } },
    { details: { mastery: { status: 'PERFORMANCE_READY' } } },
  ];
  const summary = ScaleMasteryService.summarise(items);
  assert.equal(summary.total, 4);
  assert.deepEqual(summary.counts, {
    NOT_STARTED: 1,
    DEVELOPING: 1,
    SECURE: 1,
    PERFORMANCE_READY: 1,
  });
  assert.equal(summary.masteryPercent, 54);
});
