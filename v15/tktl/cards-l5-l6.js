import { registerTeacherUnitCard } from './registry.js';

const card = (input) => registerTeacherUnitCard(input);
const common = { difficultyBand: 'CORE', status: 'PROVISIONAL' };

export const L5T1 = card({
  ...common, level: 5, term: 1,
  technicalIntent: 'Map the full fingerboard while developing connected double stops, ricochet, and longer up-bow staccato.',
  prerequisites: ['L4T2 rapid shifting foundations', 'Introductory thirds/sixths', 'Emerging spiccato control'],
  scalesLink: ['Three-octave scales and arpeggios', 'Double-stop scale preparation'],
  pureTechnical: ['All-position shift mapping', 'Natural harmonics across positions/strings', 'Thirds/sixths slow→connected', 'Ricochet multiple rebounds', 'Long up-bow staccato'],
  etudes: ['Kreutzer No. 2', 'Kreutzer No. 3', 'Kreutzer No. 7', 'Dont selected study', 'Fiorillo selected study'],
  repertoire: ['Vivaldi Four Seasons — Spring', 'Bach E major Violin Concerto', 'Bartók Romanian Folk Dances', 'Kreisler Praeludium and Allegro — CHALLENGE', 'de Bériot Scène de Ballet — BRIDGE/READINESS'],
  technicalDomains: ['all-position shifting', 'double stops', 'harmonics', 'ricochet', 'up-bow staccato'],
  musicalDomains: ['Baroque style', 'folk style', 'character', 'articulation', 'phrase direction'],
  teacherDecisionLogic: ['Map fingerboard reliability', 'Identify shift/double-stop/bow-stroke deficit', 'Isolate the deficit in pure technical work', 'Transfer through an etude', 'Confirm application in repertoire'],
  readinessCriteria: ['Reliable movement through all used positions', 'Connected thirds/sixths with stable intonation', 'Controlled multiple ricochet rebounds', 'Long up-bow staccato without collapse of tone'],
  nextTermDependency: 'Increase shift speed and integrate double stops, ricochet, longer up-bow staccato, and harmonic-position coordination.'
});

export const L5T2 = card({
  ...common, level: 5, term: 2,
  technicalIntent: 'Increase full-fingerboard mobility and coordinate shifting with double stops, ricochet, up-bow staccato, and harmonics.',
  prerequisites: ['L5T1 fingerboard mapping', 'Connected thirds/sixths', 'Basic ricochet and up-bow staccato'],
  scalesLink: ['Three-octave scales/arpeggios', 'Double-stop scales', 'Position-change mapping'],
  pureTechnical: ['Rapid full-fingerboard shifts', 'Thirds/sixths with shifting', 'Ricochet groups 3–4', 'Long up-bow staccato larger groups', 'Harmonic + position-change coordination'],
  etudes: ['Kreutzer selected study', 'Dont selected study', 'Fiorillo selected study', 'Rode selected study', 'Mazas Op. 36 selected transitional study'],
  repertoire: ['de Bériot Scène de Ballet', 'Bach substantial solo movement', 'Advanced Baroque sonata movement', 'Kreisler Praeludium and Allegro — CHALLENGE', 'de Bériot No. 9 I — BRIDGE'],
  technicalDomains: ['rapid shifting', 'double stops', 'ricochet', 'up-bow staccato', 'harmonics'],
  musicalDomains: ['Baroque style', 'Romantic style', 'character contrast', 'articulation', 'musical line'],
  teacherDecisionLogic: ['Test L5T1 mapping at tempo', 'Separate left-hand and bow faults', 'Select the narrowest intervention', 'Apply through etude', 'Use repertoire for transfer/readiness'],
  readinessCriteria: ['Rapid shifts remain accurate', 'Thirds/sixths survive position changes', 'Ricochet groups remain even', 'Long up-bow staccato remains controlled', 'Harmonics remain reliable during movement'],
  nextTermDependency: 'Prepare advanced multi-position shifting, chord formation/release, artificial harmonics, left-hand pizzicato, and advanced spiccato.'
});

export const L6T1 = card({
  ...common, level: 6, term: 1,
  technicalIntent: 'Integrate advanced shifting with chord formation/release, artificial harmonics, left-hand pizzicato, and advanced articulated bow strokes.',
  prerequisites: ['L5T2 full-fingerboard work', 'Stable double stops', 'Controlled ricochet/spiccato foundations'],
  scalesLink: ['Three-octave scales/arpeggios in all keys', 'Double-stop scales in all keys'],
  pureTechnical: ['Rapid multi-position shifts', '3/4-note chord shapes', 'Artificial harmonics', 'Left-hand pizzicato', 'Advanced spiccato/martelé transitions'],
  etudes: ['Dont Op. 35 selected study', 'Gaviniès selected study', 'Rode selected study', 'Kreutzer selected advanced study', 'Polo Double Stops selected study'],
  repertoire: ['Mozart Violin Concerto No. 4 or No. 5 — CORE', 'Bach substantial solo movement — CORE', 'Bruch selected movement — CORE', 'Vitali Chaconne — CHALLENGE', 'de Bériot No. 9 I — BRIDGE'],
  technicalDomains: ['rapid shifting', 'chords', 'artificial harmonics', 'left-hand pizzicato', 'spiccato/martelé'],
  musicalDomains: ['Baroque style', 'Classical style', 'Romantic style', 'expressive articulation', 'large-form phrasing'],
  teacherDecisionLogic: ['Verify L5 mobility', 'Diagnose whether the limitation is shift, chord, articulation, or coordination', 'Use targeted pure technical work', 'Transfer to etude passage work', 'Confirm readiness in concerto/Bach repertoire'],
  readinessCriteria: ['Rapid multi-position shifts remain reliable', 'Chord shapes form and release cleanly', 'Artificial harmonics are stable', 'Left-hand pizzicato is coordinated', 'Spiccato/martelé transitions are controlled'],
  nextTermDependency: 'Develop rapid full-register shifts, moving double-stop sequences, chord transitions, artificial-harmonic shifts, and ricochet→spiccato integration.'
});

export const L6T2 = card({
  ...common, level: 6, term: 2,
  technicalIntent: 'Consolidate advanced full-register reliability and integrate double stops, chords, artificial harmonics, and advanced ricochet/spiccato.',
  prerequisites: ['L6T1 advanced shifting and chord work', 'Artificial harmonics and left-hand pizzicato foundations'],
  scalesLink: ['Three-octave all-key scales/arpeggios', 'All-key double-stop scales'],
  pureTechnical: ['Rapid full-register shifts changing finger patterns', 'Double-stop sequences with position changes', '3/4-note chord transitions', 'Artificial harmonic + position shift', 'Ricochet→spiccato integration'],
  etudes: ['Dont Op. 35 selected advanced study', 'Gaviniès selected advanced study', 'Rode selected advanced study', 'Kreutzer selected advanced study', 'Polo Double Stops selected advanced study'],
  repertoire: ['Bach substantial solo movement', 'Mozart concerto movement', 'Bruch selected movement', 'Mendelssohn selected movement — CHALLENGE', 'Advanced concerto/virtuoso movement — READINESS'],
  technicalDomains: ['full-register shifting', 'double stops', 'chords', 'artificial harmonics', 'ricochet/spiccato'],
  musicalDomains: ['Baroque style', 'Classical style', 'Romantic style', 'virtuoso articulation', 'expressive phrasing'],
  teacherDecisionLogic: ['Test L6T1 skills at performance-oriented tempo', 'Identify the dominant technical deficit', 'Use one targeted intervention before adding variables', 'Retest in etude', 'Use concerto/Bach repertoire as integrated benchmark'],
  readinessCriteria: ['Full-register shifts remain secure under tempo', 'Double-stop sequences remain intonationally stable', 'Chord transitions release cleanly', 'Artificial harmonics survive position changes', 'Ricochet→spiccato transitions remain controlled'],
  nextTermDependency: 'Prepare Level 7 work in advanced shifting, double-stop mobility, chord release, variable ricochet, and spiccato↔sautillé.'
});

export const L5_L6_TKTL_V1 = Object.freeze([L5T1, L5T2, L6T1, L6T2]);
