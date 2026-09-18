import test from 'node:test';
import assert from 'node:assert/strict';
import { getTeacherUnitCard, listTeacherUnitCards } from '../tktl/registry.js';
import '../tktl/cards-v1.js';

const expectedIds = [
  'L1T1', 'L1T2', 'L2T1', 'L2T2', 'L3T1', 'L3T2', 'L4T1', 'L4T2',
  'L5T1', 'L5T2', 'L6T1', 'L6T2', 'L7T1', 'L7T2', 'L8T1', 'L8T2',
  'L9T1', 'L9T2', 'L10T1', 'L10T2',
];

test('TKTL V1 registers all 20 L1T1–L10T2 Teacher Unit Cards', () => {
  const cards = listTeacherUnitCards();
  assert.equal(cards.length, 20);
  assert.deepEqual(cards.map(card => card.id), expectedIds);

  for (const id of expectedIds) {
    const [, level, term] = id.match(/^L(\d+)T(\d+)$/);
    const card = getTeacherUnitCard(Number(level), Number(term));
    assert.ok(card, `Missing ${id}`);
    assert.equal(card.level, Number(level));
    assert.equal(card.term, Number(term));
    assert.equal(card.pureTechnical.length, 5, `${id} pureTechnical`);
    assert.equal(card.etudes.length, 5, `${id} etudes`);
    assert.equal(card.repertoire.length, 5, `${id} repertoire`);
  }
});
