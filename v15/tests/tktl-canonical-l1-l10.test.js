import test from 'node:test';
import assert from 'node:assert/strict';
import { L1T1, L1T2, L2T1, L2T2, L3T1, L3T2, L4T1, L4T2, L5T1, L5T2, L6T1, L6T2, L7T1, L7T2, L8T1, L8T2, L9T1, L9T2, L10T1, L10T2 } from '../tktl/cards-v1.js';

const cards = [L1T1,L1T2,L2T1,L2T2,L3T1,L3T2,L4T1,L4T2,L5T1,L5T2,L6T1,L6T2,L7T1,L7T2,L8T1,L8T2,L9T1,L9T2,L10T1,L10T2];

test('canonical cards-v1 exposes all 20 Level×Term TKTL cards', () => {
  assert.equal(cards.length, 20);
  assert.deepEqual(cards.map(card => card.id), [
    'L1T1','L1T2','L2T1','L2T2','L3T1','L3T2','L4T1','L4T2','L5T1','L5T2',
    'L6T1','L6T2','L7T1','L7T2','L8T1','L8T2','L9T1','L9T2','L10T1','L10T2'
  ]);
  for (const card of cards) {
    assert.equal(card.pureTechnical.length, 5);
    assert.equal(card.etudes.length, 5);
    assert.equal(card.repertoire.length, 5);
    assert.ok(card.technicalIntent);
    assert.ok(card.prerequisites.length);
    assert.ok(card.scalesLink.length);
    assert.ok(card.technicalDomains.length);
    assert.ok(card.musicalDomains.length);
    assert.ok(card.teacherDecisionLogic.length);
    assert.ok(card.readinessCriteria.length);
    assert.ok(card.nextTermDependency);
  }
});

test('Level 10 preserves portfolio architecture rather than a fixed repertoire ranking', () => {
  assert.equal(L10T1.repertoire.length, 5);
  assert.equal(L10T2.repertoire.length, 5);
  assert.ok(L10T1.repertoire.every(item => item.includes('PROFESSIONAL BENCHMARK')));
  assert.ok(L10T2.repertoire.every(item => item.includes('CAPSTONE')));
});
