const itemTitle = item => String(item?.title ?? item?.text ?? 'Homework task').trim();

const taskLines = ({ items = [], practicePlan = null }) => {
  if (!practicePlan?.tasks?.length) {
    return items.map((item, index) => `${index + 1}. ${itemTitle(item)}`).join('\n');
  }

  return practicePlan.tasks.map((task, index) => {
    const item = items[task.homeworkItemIndex];
    return `${index + 1}. ${itemTitle(item)} — ${task.minutes}′\n   ${task.focus}`;
  }).join('\n');
};

export function generateViberHomeworkMessage({
  studentName = 'Student',
  level = null,
  termNumber = null,
  items = [],
  practicePlan = null,
}) {
  const levelLine = level ? `Level ${level}${termNumber ? ` · Term ${termNumber}` : ''}` : '';
  const planMinutes = practicePlan?.totalMinutes ? `\nΣυνολικός χρόνος: περίπου ${practicePlan.totalMinutes} λεπτά.` : '';

  return [
    `🎻 Homework για ${studentName}`,
    levelLine,
    '',
    taskLines({ items, practicePlan }),
    planMinutes,
    '',
    '🎯 Στόχος: αργή, προσεκτική εξάσκηση πρώτα και μετά μία ελεγχόμενη επανάληψη.',
    'Καλή μελέτη! 🎻',
  ].filter((line, index) => !(line === '' && index === 1 && !levelLine)).join('\n');
}

export function generateParentHomeworkMessage({
  studentName = 'Student',
  level = null,
  items = [],
  practicePlan = null,
}) {
  const time = practicePlan?.totalMinutes ? ` περίπου ${practicePlan.totalMinutes} λεπτά` : '';
  const levelText = level ? ` (Level ${level})` : '';

  return [
    `🎻 Υποστήριξη μελέτης — ${studentName}${levelText}`,
    '',
    `Για αυτή την εβδομάδα ο/η μαθητής/τρια έχει ${items.length} εργασία/ες για το βιολί${time}.`,
    'Παρακαλώ βοηθήστε με ένα ήρεμο, σταθερό περιβάλλον μελέτης και χωρίς πίεση για ταχύτητα.',
    '',
    'Η τελική επιλογή και ο στόχος των εργασιών έχουν δοθεί από τον καθηγητή.',
  ].join('\n');
}
