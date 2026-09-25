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


test('scale mastery assessment lookup rejects unknown and non-scale programme items', async () => {
  const repo = new InMemoryRepository();
  const service = new ScaleMasteryService(repo);
  const nonScale = await repo.put('programmeItems', createProgrammeItem({
    termId: 'term_1',
    curriculumId: 'etude-v1',
    curriculumDomain: 'ETUDE',
    objectId: 'L1T1:ETUDE:1',
    title: 'Etude',
    targetWeek: 1,
  }));

  await assert.rejects(
    () => service.getAssessment('missing-programme-item'),
    /Scale ProgrammeItem not found/
  );
  await assert.rejects(
    () => service.getAssessment(nonScale.id),
    /ProgrammeItem is not a scale item/
  );

  const scale = await repo.put('programmeItems', createProgrammeItem({
    termId: 'term_1',
    curriculumId: 'scales-v1',
    curriculumDomain: 'SCALES',
    objectId: 'L1T1:SCALES:lookup',
    title: 'G major — 1 octave',
    targetWeek: 1,
  }));
  const assessment = await service.getAssessment(scale.id);
  assert.equal(assessment.status, 'NOT_STARTED');
  assert.equal(assessment.currentTempo, null);
  assert.equal(assessment.targetTempo, null);
});

test('scale mastery tempo values follow the assessment input boundary', async () => {
  const repo = new InMemoryRepository();
  const service = new ScaleMasteryService(repo);
  const item = await repo.put('programmeItems', createProgrammeItem({
    termId: 'term_1', curriculumId: 'scales-v1', curriculumDomain: 'SCALES',
    objectId: 'L1T1:SCALES:scale-tempo', title: 'G major — 1 octave', targetWeek: 1,
  }));

  for (const field of ['currentTempo', 'targetTempo']) {
    await assert.rejects(
      () => service.assess({ programmeItemId: item.id, [field]: 0 }),
      /Scale tempo must be a finite number between 1 and 300/
    );
    await assert.rejects(
      () => service.assess({ programmeItemId: item.id, [field]: 301 }),
      /Scale tempo must be a finite number between 1 and 300/
    );
    await assert.rejects(
      () => service.assess({ programmeItemId: item.id, [field]: Number.NaN }),
      /Scale tempo must be a finite number between 1 and 300/
    );
    await assert.rejects(
      () => service.assess({ programmeItemId: item.id, [field]: '60' }),
      /Scale tempo must be a finite number between 1 and 300/
    );
  }

  const assessed = await service.assess({ programmeItemId: item.id, currentTempo: 1, targetTempo: 300 });
  assert.equal(assessed.details.mastery.currentTempo, 1);
  assert.equal(assessed.details.mastery.targetTempo, 300);
});


test('invalid scale assessment dimension does not mutate an existing mastery record', async () => {
  const repo = new InMemoryRepository();
  const service = new ScaleMasteryService(repo);
  const item = await repo.put('programmeItems', createProgrammeItem({
    termId: 'term_1',
    curriculumId: 'scales-v1',
    curriculumDomain: 'SCALES',
    objectId: 'L1T1:SCALES:mutation-boundary',
    title: 'G major — 1 octave',
    targetWeek: 1,
  }));

  await service.assess({
    programmeItemId: item.id,
    status: 'SECURE',
    currentTempo: 80,
    targetTempo: 90,
    intonation: 'SECURE',
    bowControl: 'SECURE',
    consistency: 'DEVELOPING',
    note: 'Stable baseline.',
  });
  const before = await repo.get('programmeItems', item.id);

  await assert.rejects(
    () => service.assess({
      programmeItemId: item.id,
      status: 'PERFORMANCE_READY',
      currentTempo: 100,
      targetTempo: 110,
      intonation: 'INVALID',
      bowControl: 'SECURE',
      consistency: 'SECURE',
      note: 'Should not replace baseline.',
    }),
    /Invalid scale assessment dimension/
  );

  const after = await repo.get('programmeItems', item.id);
  assert.deepEqual(after.details.mastery, before.details.mastery);
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
