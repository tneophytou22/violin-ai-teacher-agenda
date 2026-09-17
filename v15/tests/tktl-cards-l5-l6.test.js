import test from 'node:test';
import assert from 'node:assert/strict';
import { L5_L6_TKTL_V1 } from '../tktl/cards-l5-l6.js';

const ids = ['L5T1', 'L5T2', 'L6T1', 'L6T2'];

test('L5-L6 TKTL V1 registers exactly four real Teacher Unit Cards', () => {
  assert.deepEqual(L5_L6_TKTL_V1.map(card => card.id), ids);
  for (const card of L5_L6_TKTL_V1) {
    assert.equal(card.pureTechnical.length, 5);
    assert.equal(card.etudes.length, 5);
    assert.equal(card.repertoire.length, 5);
    assert.ok(card.technicalIntent);
    assert.ok(card.prerequisites.length > 0);
    assert.ok(card.scalesLink.length > 0);
    assert.ok(card.technicalDomains.length > 0);
    assert.ok(card.musicalDomains.length > 0);
    assert.ok(card.teacherDecisionLogic.length > 0);
    assert.ok(card.readinessCriteria.length > 0);
    assert.ok(card.nextTermDependency);
    assert.ok(['CORE', 'CHALLENGE', 'BRIDGE', 'READINESS', 'CAPSTONE'].includes(card.difficultyBand));
    assert.ok(['VALIDATED', 'PROVISIONAL', 'OPEN'].includes(card.status));
  }
});
