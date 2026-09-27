import test from 'node:test';
import assert from 'node:assert/strict';
import { generateViberHomeworkMessage, generateParentHomeworkMessage } from '../index.js';

const plan = {
  totalMinutes: 25,
  tasks: [
    { homeworkItemIndex: 0, minutes: 15, focus: 'Slow intonation work.' },
    { homeworkItemIndex: 1, minutes: 10, focus: 'Small sections, then connect.' },
  ],
};

test('Viber homework message is derived from saved homework and practice plan', () => {
  const message = generateViberHomeworkMessage({
    studentName: 'Andreas',
    level: 3,
    termNumber: 1,
    items: [{ text: 'Bach Minuet' }, { text: 'Kayser No. 4' }],
    practicePlan: plan,
  });

  assert.match(message, /Homework για Andreas/);
  assert.match(message, /Level 3 · Term 1/);
  assert.match(message, /Bach Minuet — 15′/);
  assert.match(message, /Kayser No\. 4 — 10′/);
  assert.match(message, /25 λεπτά/);
});

test('parent homework message explains teacher ownership of the assigned work', () => {
  const message = generateParentHomeworkMessage({
    studentName: 'Andreas',
    level: 3,
    items: [{ text: 'Bach Minuet' }],
    practicePlan: { totalMinutes: 25, tasks: [] },
  });

  assert.match(message, /Andreas/);
  assert.match(message, /25 λεπτά/);
  assert.match(message, /τελική επιλογή.*καθηγητή/);
});
