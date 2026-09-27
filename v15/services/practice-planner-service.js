const TARGET_MINUTES_BY_LEVEL = Object.freeze({
  1: 25, 2: 25,
  3: 35, 4: 35,
  5: 45, 6: 45,
  7: 55, 8: 55,
  9: 65, 10: 65,
});

const FOCUS_BY_DOMAIN = Object.freeze({
  SCALES: 'Slow, accurate repetitions; keep the assigned scale requirements and listen for even intonation.',
  PURE_TECHNICAL: 'Work slowly and relaxed first, then connect the movement without losing clarity or sound quality.',
  ETUDE: 'Practise small sections carefully, solve the difficult passage, then connect the sections.',
  REPERTOIRE: 'Choose one clear goal: intonation, rhythm, bow control or musical expression; then make a focused repetition.',
});

const fallbackFocus = 'Focused practice: slow work first, then one controlled repetition at performance tempo.';

const domainForItem = item => item.curriculumDomain ?? item.domain ?? null;

const focusForItem = item => FOCUS_BY_DOMAIN[domainForItem(item)] ?? fallbackFocus;

const targetMinutesForLevel = level => TARGET_MINUTES_BY_LEVEL[level] ?? 35;

const distribute = (totalMinutes, count) => {
  if (!count) return [];
  const base = Math.floor(totalMinutes / count);
  const remainder = totalMinutes - (base * count);
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
};

export class PracticePlannerService {
  static targetMinutesForLevel(level) {
    return targetMinutesForLevel(level);
  }

  plan({ level, items = [] }) {
    if (!Number.isInteger(level) || level < 1 || level > 10) {
      throw new Error('Practice Planner requires a level from 1–10');
    }
    if (!Array.isArray(items)) throw new Error('Practice Planner items must be an array');

    const normalized = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => String(item?.title ?? item?.text ?? '').trim());

    if (!normalized.length) {
      return {
        totalMinutes: 0,
        tasks: [],
        generatedBy: 'practice-planner-v1',
        generatedAt: new Date().toISOString(),
      };
    }

    const totalMinutes = targetMinutesForLevel(level);
    const minutes = distribute(totalMinutes, normalized.length);

    return {
      totalMinutes,
      tasks: normalized.map(({ item, index }, taskIndex) => ({
        homeworkItemId: item.id ?? null,
        homeworkItemIndex: index,
        minutes: minutes[taskIndex],
        focus: focusForItem(item),
      })),
      generatedBy: 'practice-planner-v1',
      generatedAt: new Date().toISOString(),
    };
  }
}
