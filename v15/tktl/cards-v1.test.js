import test from 'node:test';
import assert from 'node:assert/strict';
import { getTeacherUnitCard, listTeacherUnitCards } from './cards-v1.js';

const expectedIds = ['L1T1','L1T2','L2T1','L2T2','L3T1','L3T2','L4T1','L4T2'];
test('real TKTL cards L1T1-L4T2 are registered', () => {
  assert.deepEqual(listTeacherUnitCards().map(c => c.id), expectedIds);
  for (const id of expectedIds) {
    const [, l, t] = id.match(/^L(\d+)T(\d+)$/);
    const c = getTeacherUnitCard(Number(l), Number(t));
    assert.ok(c);
    assert.equal(c.pureTechnical.length, 5);
    assert.equal(c.etudes.length, 5);
    assert.equal(c.repertoire.length, 5);
  }
});
