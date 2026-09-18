import test from 'node:test';
import assert from 'node:assert/strict';
import { getTeacherUnitCard, listTeacherUnitCards } from '../tktl/registry.js';

const expectedIds = ['L1T1', 'L1T2', 'L2T1', 'L2T2', 'L3T1', 'L3T2', 'L4T1', 'L4T2'];

test('TKTL V1 registers the real L1T1–L4T2 Teacher Unit Cards', () => {
  assert.deepEqual(listTeacherUnitCards().map(card => card.id), expectedIds);
  for (const id of expectedIds) {
    const [, level, term] = id.match(/^L(\d+)T(\d+)$/);
    const card = getTeacherUnitCard(Number(level), Number(term));
    assert.ok(card, `Missing ${id}`);
    assert.equal(card.pureTechnical.length, 5, `${id} pureTechnical`);
    assert.equal(card.etudes.length, 5, `${id} etudes`);
    assert.equal(card.repertoire.length, 5, `${id} repertoire`);
  }
});
