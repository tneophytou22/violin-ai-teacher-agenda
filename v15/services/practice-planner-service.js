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

const fallbackFocus = 'Start at a controlled tempo, isolate the difficult movement, then increase tempo only when accurate.';

const TARGET_TEMPO_BY_DOMAIN = Object.freeze({ SCALES: 60, PURE_TECHNICAL: 56, ETUDE: 52, REPERTOIRE: 48 });
const RHYTHM_BY_DOMAIN = Object.freeze({ SCALES: 'Long-short / short-long', PURE_TECHNICAL: 'Dotted / reverse-dotted', ETUDE: '2+1 / 1+2 accents', REPERTOIRE: 'Long-short, then even rhythm' });
const languageText = (language, en, el) => language === 'EL' ? el : en;


const domainForItem = item => item.curriculumDomain ?? item.domain ?? null;

const asText = value => Array.isArray(value) ? value.join('; ') : String(value ?? '').trim();

const focusForItem = item => {
  const base = FOCUS_BY_DOMAIN[domainForItem(item)] ?? fallbackFocus;
  const requirement = asText(item.requirements);
  const objective = asText(item.objective);
  const detail = requirement ? `Assigned requirement: ${requirement}` : objective ? `Lesson objective: ${objective}` : '';
  return detail ? `${base} ${detail}.` : base;
};

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

  plan({ level, items = [], language = 'EN' }) {
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
    if (normalized.length > totalMinutes) throw new Error('Practice Planner has too many homework tasks for the target practice time');
    const minutes = distribute(totalMinutes, normalized.length);

    return {
      totalMinutes,
      tasks: normalized.map(({ item, index }, taskIndex) => ({
        homeworkItemId: item.id ?? null,
        homeworkItemIndex: index,
        minutes: minutes[taskIndex],
        focus: focusForItem(item),
        tempo: TARGET_TEMPO_BY_DOMAIN[domainForItem(item)] ?? 52,
        rhythmPattern: RHYTHM_BY_DOMAIN[domainForItem(item)] ?? 'Long-short / short-long',
        steps: [
          languageText(language, 'Isolate the difficult passage', 'Απομόνωσε το δύσκολο πέρασμα'),
          languageText(language, 'Repeat accurately 3 times', 'Επανάλαβε σωστά 3 φορές'),
          languageText(language, 'Apply the rhythm pattern', 'Εφάρμοσε το ρυθμικό μοτίβο'),
          languageText(language, 'Increase tempo only if secure', 'Αύξησε το tempo μόνο όταν είναι σταθερό'),
        ],
      })),
      generatedBy: 'practice-planner-v1',
      generatedAt: new Date().toISOString(),
    };
  }
}
