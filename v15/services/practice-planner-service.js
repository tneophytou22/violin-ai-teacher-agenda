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
const RHYTHM_BY_DOMAIN = Object.freeze({
  SCALES: ['Long-short / short-long', 'Μακρύ-κοντό / κοντό-μακρύ'],
  PURE_TECHNICAL: ['Dotted / reverse-dotted', 'Παρεστιγμένο / αντίστροφα παρεστιγμένο'],
  ETUDE: ['2+1 / 1+2 accents', 'Τονισμοί 2+1 / 1+2'],
  REPERTOIRE: ['Long-short, then even rhythm', 'Μακρύ-κοντό και μετά ίσος ρυθμός'],
});
const GOAL_BY_DOMAIN = Object.freeze({
  SCALES: ['Intonation + evenness', 'Καθαρότητα + ομοιομορφία'],
  PURE_TECHNICAL: ['Movement coordination + relaxation', 'Συντονισμός κίνησης + χαλάρωση'],
  ETUDE: ['Passage security + articulation', 'Σταθερότητα περάσματος + άρθρωση'],
  REPERTOIRE: ['Musical intention + technical control', 'Μουσική πρόθεση + τεχνικός έλεγχος'],
});
const languageText = (language, en, el) => language === 'EL' ? el : en;


const domainForItem = item => item.curriculumDomain ?? item.domain ?? null;

const asText = value => Array.isArray(value) ? value.join('; ') : String(value ?? '').trim();

const focusForItem = (item, language) => {
  const domain = domainForItem(item);
  const base = FOCUS_BY_DOMAIN[domain] ?? fallbackFocus;
  const requirement = asText(item.requirements);
  const objective = asText(item.objective);
  const detail = requirement
    ? languageText(language, `Assigned requirement: ${requirement}`, `Ανάθεση/απαίτηση: ${requirement}`)
    : objective
      ? languageText(language, `Lesson objective: ${objective}`, `Στόχος μαθήματος: ${objective}`)
      : base;
  if (detail !== base) return language === 'EL'
    ? `${detail}. Δούλεψε σε μικρές φράσεις και κράτησε σταθερή ποιότητα ήχου.`
    : `${detail}. Work in small phrases and keep the sound quality stable.`;
  return language === 'EL'
    ? base === fallbackFocus
      ? 'Ξεκίνα σε ελεγχόμενο tempo, απομόνωσε το δύσκολο σημείο και αύξησε σταδιακά μόνο όταν είναι σταθερό.'
      : ({
          SCALES: 'Δούλεψε την καθαρότητα και την ομοιομορφία της κλίμακας, με σταθερό bow και καθαρή ακρίβεια.',
          PURE_TECHNICAL: 'Δούλεψε τον συντονισμό της κίνησης και τη χαλάρωση χωρίς να χάνεις τον ήχο.',
          ETUDE: 'Δούλεψε μικρά τμήματα, σταθεροποίησε το δύσκολο πέρασμα και μετά σύνδεσέ τα.',
          REPERTOIRE: 'Δούλεψε μουσική πρόθεση μαζί με τεχνικό έλεγχο και σταθερότητα.',
        }[domain] ?? 'Δούλεψε σε ελεγχόμενο tempo και αύξησε σταδιακά μόνο όταν είναι σταθερό.')
    : base;
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
        focus: focusForItem(item, language),
        goal: (GOAL_BY_DOMAIN[domainForItem(item)] ?? ['Accuracy + control', 'Ακρίβεια + έλεγχος'])[language === 'EL' ? 1 : 0],
        tempo: TARGET_TEMPO_BY_DOMAIN[domainForItem(item)] ?? 52,
        rhythmPattern: (RHYTHM_BY_DOMAIN[domainForItem(item)] ?? ['Long-short / short-long', 'Μακρύ-κοντό / κοντό-μακρύ'])[language === 'EL' ? 1 : 0],
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
