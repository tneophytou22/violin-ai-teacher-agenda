import test from 'node:test';
import assert from 'node:assert/strict';
import { L1T1, L1T2, L2T1, L2T2, L3T1, L3T2, L4T1, L4T2, L5T1, L5T2, L6T1, L6T2, L7T1, L7T2, L8T1, L8T2 } from '../tktl/cards-v1.js';

const cards = [L1T1,L1T2,L2T1,L2T2,L3T1,L3T2,L4T1,L4T2,L5T1,L5T2,L6T1,L6T2,L7T1,L7T2,L8T1,L8T2];

test('canonical cards-v1 exposes all implemented L1-L8 cards', () => {
  assert.equal(cards.length, 16);
  assert.deepEqual(cards.map(card => card.id), ['L1T1','L1T2','L2T1','L2T2','L3T1','L3T2','L4T1','L4T2','L5T1','L5T2','L6T1','L6T2','L7T1','L7T2','L8T1','L8T2']);
  for (const card of cards) {
    assert.equal(card.pureTechnical.length, 5);
    assert.equal(card.etudes.length, 5);
    assert.equal(card.repertoire.length, 5);
    assert.ok(card.technicalIntent && card.prerequisites.length && card.scalesLink.length);
    assert.ok(card.technicalDomains.length && card.musicalDomains.length);
    assert.ok(card.teacherDecisionLogic.length && card.readinessCriteria.length && card.nextTermDependency);
  }
});
