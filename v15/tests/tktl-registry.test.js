import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerTeacherUnitCard,
  getTeacherUnitCard,
  listTeacherUnitCards,
  requireTeacherUnitCard
} from '../tktl/registry.js';

const cardInput = (level = 4, term = 1) => ({
  level,
  term,
  technicalIntent: 'Registry contract test',
  prerequisites: ['L3T2 prerequisite'],
  scalesLink: ['3-octave transition preparation'],
  pureTechnical: ['shift', 'extensions', 'vibrato', 'position transition', 'thirds/sixths'],
  etudes: ['Etude 1', 'Etude 2', 'Etude 3', 'Etude 4', 'Etude 5'],
  repertoire: ['Repertoire 1', 'Repertoire 2', 'Repertoire 3', 'Repertoire 4', 'Repertoire 5'],
  technicalDomains: ['shifting', 'vibrato'],
  musicalDomains: ['phrasing', 'articulation'],
  teacherDecisionLogic: ['observe', 'identify deficit', 'select intervention'],
  readinessCriteria: ['criterion 1', 'criterion 2'],
  nextTermDependency: 'Integrate the tested skills',
  difficultyBand: 'CORE',
  status: 'PROVISIONAL'
});

test('Teacher Unit Card registry registers and retrieves a card', () => {
  const card = registerTeacherUnitCard(cardInput(4, 1));

  assert.equal(card.id, 'L4T1');
  assert.equal(getTeacherUnitCard(4, 1)?.id, 'L4T1');
  assert.equal(requireTeacherUnitCard(4, 1)?.id, 'L4T1');
  assert.ok(listTeacherUnitCards().some(item => item.id === 'L4T1'));
});

test('Teacher Unit Card registry rejects duplicate registration', () => {
  assert.throws(
    () => registerTeacherUnitCard(cardInput(4, 1)),
    /already registered/
  );
});

test('Teacher Unit Card registry returns null and throws for missing cards', () => {
  assert.equal(getTeacherUnitCard(10, 2), null);
  assert.throws(
    () => requireTeacherUnitCard(10, 2),
    /not registered: L10T2/
  );
});
