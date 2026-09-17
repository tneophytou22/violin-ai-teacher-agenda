import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeacherUnitCard } from '../tktl/teacher-unit-card.js';

test('Teacher Unit Card enforces the locked 10-level / 2-term structure', () => {
  const card = createTeacherUnitCard({
    level: 4, term: 1, technicalIntent: 'Advanced-intermediate positional stability',
    prerequisites: ['L3T2 positional control'], scalesLink: ['3-octave transition preparation'],
    pureTechnical: ['shift 1→3→5', 'extensions', 'vibrato through shift', 'position-transition drill', 'thirds/sixths placement'],
    etudes: ['Wohlfahrt Op45 No6', 'Kreutzer selected', 'Dont Op37 selected', 'Sitt selected', 'Trott selected'],
    repertoire: ['Accolay No1', 'Kreisler Sicilienne/Rigaudon', 'Haydn G major', 'Tartini Fugue', 'Bach A minor Concerto'],
    technicalDomains: ['shifting', 'vibrato', 'extensions', 'double stops'], musicalDomains: ['phrasing', 'articulation'],
    teacherDecisionLogic: ['observe positional stability', 'target the technical deficit', 'select the appropriate pure-technical task'],
    readinessCriteria: ['first five positions', 'continuous vibrato', 'controlled extensions'],
    nextTermDependency: 'Integrate shifting, double stops and emerging spiccato', difficultyBand: 'CORE', status: 'PROVISIONAL'
  });
  assert.equal(card.id, 'L4T1'); assert.equal(card.level, 4); assert.equal(card.term, 1);
  assert.equal(card.pureTechnical.length, 5); assert.equal(card.etudes.length, 5); assert.equal(card.repertoire.length, 5);
});

test('Teacher Unit Card rejects Term 3 and non-exact-five module pools', () => {
  const base = { level: 4, technicalIntent: 'x', prerequisites: ['x'], scalesLink: ['x'], pureTechnical: ['1','2','3','4','5'], etudes: ['1','2','3','4','5'], repertoire: ['1','2','3','4','5'], technicalDomains: ['x'], musicalDomains: ['x'], teacherDecisionLogic: ['x'], readinessCriteria: ['x'], nextTermDependency: 'x' };
  assert.throws(() => createTeacherUnitCard({ ...base, term: 3 }));
  assert.throws(() => createTeacherUnitCard({ ...base, term: 1, pureTechnical: ['1','2','3','4'] }));
  assert.throws(() => createTeacherUnitCard({ ...base, term: 1, etudes: ['1','2','3','4','5','6'] }));
  assert.throws(() => createTeacherUnitCard({ ...base, term: 1, repertoire: ['1','2','3','4'] }));
});