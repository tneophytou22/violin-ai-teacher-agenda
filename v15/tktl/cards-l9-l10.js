import { registerTeacherUnitCard } from './registry.js';

const card = (input) => registerTeacherUnitCard(input);
const common = { difficultyBand: 'CORE', status: 'PROVISIONAL' };

// Level 9-10: advanced/professional benchmark band.
// Exact etude numbering is used only where the validated source record supports it.
// L10 is intentionally portfolio-based rather than a fixed single repertoire list.

export const L9T1 = card({
  ...common, level: 9, term: 1,
  technicalIntent: 'Convert advanced technique into reliable full-fingerboard performance by integrating shifting, mobile double stops, chord release, ricochet/sautillé, and mixed articulation.',
  prerequisites: ['L8T2 high-register mobility', 'Reliable advanced double stops and chords', 'Controlled ricochet and sautillé'],
  scalesLink: ['Three-octave scales/arpeggios', 'Advanced double-stop work with position changes'],
  pureTechnical: ['Full-fingerboard shifting under tempo', 'Thirds/sixths/octave preparation in shifting', 'Four-note chords → rapid release', 'Ricochet/sautillé across multiple strings', 'Mixed articulation spiccato–sautillé–détaché'],
  etudes: ['Dont Op. 37 No. 13 — VALIDATED RCM Level 9', 'Fiorillo Op. 3 No. 21 — VALIDATED RCM Level 9', 'Kreutzer No. 18 — VALIDATED RCM Level 9', 'Rode No. 1 — VALIDATED RCM Level 9', 'Dancla Op. 73 No. 4 — VALIDATED RCM Level 9'],
  repertoire: ['Bruch Violin Concerto in G minor — substantial movement', 'Bach Solo Violin substantial movement', 'Lalo selected movement', 'Mendelssohn Violin Concerto — selected movement — CHALLENGE', 'Advanced virtuoso work — READINESS'],
  technicalDomains: ['full-fingerboard shifting', 'double stops/octaves', 'four-note chords', 'ricochet/sautillé', 'mixed articulation'],
  musicalDomains: ['Baroque style', 'Romantic style', 'French style', 'virtuoso articulation', 'large-form phrasing'],
  teacherDecisionLogic: ['Test L8 high-register reliability at performance tempo', 'Identify the limiting technical variable', 'Choose the narrowest pure-technical intervention', 'Transfer through the matched RCM étude', 'Confirm integration in substantial repertoire'],
  readinessCriteria: ['Full-fingerboard shifts remain accurate under tempo', 'Thirds/sixths/octave preparation does not destabilise intonation', 'Chord releases are immediate and clean', 'Ricochet/sautillé remains controlled across strings', 'Articulation can change without mechanical reset'],
  nextTermDependency: 'Increase shift reliability with minimal audible preparation, advanced double-stop intonation, chord/vibrato integration, dynamic bow-spring control, and multi-variable coordination.'
});

export const L9T2 = card({
  ...common, level: 9, term: 2,
  technicalIntent: 'Refine advanced performance reliability through minimal-preparation shifting, high-level double-stop intonation, expressive chord work, variable sautillé/ricochet, and coordinated articulation.',
  prerequisites: ['L9T1 full-fingerboard reliability', 'Stable double-stop/octave preparation', 'Controlled mixed articulation'],
  scalesLink: ['Three-octave scales/arpeggios at performance-oriented tempo', 'Advanced double-stop and octave preparation'],
  pureTechnical: ['Rapid shifts with minimal audible preparation', 'Advanced double-stop intonation under tempo', 'Chord passages + vibrato/position change', 'Sautillé/ricochet dynamic and articulation variation', 'Multi-variable shift + articulation + crossing'],
  etudes: ['Dont Op. 37 No. 20 — VALIDATED RCM Level 9 T2', 'Fiorillo Op. 3 No. 31 — VALIDATED RCM Level 9 T2', 'Kreutzer No. 23 — VALIDATED RCM Level 9 T2', 'Rode No. 8 — VALIDATED RCM Level 9 T2', 'Barlowe In the Style of Paganini — VALIDATED RCM Level 9 T2'],
  repertoire: ['Mendelssohn Violin Concerto — substantial movement — CORE', 'Bach Solo Violin substantial movement', 'Major Romantic concerto movement', 'Wieniawski Violin Concerto No. 2 — selected movement — CHALLENGE', 'Major virtuoso work — READINESS'],
  technicalDomains: ['minimal-preparation shifting', 'advanced double stops/octaves', 'chords/vibrato', 'sautillé/ricochet', 'multi-variable coordination'],
  musicalDomains: ['Baroque style', 'Classical/Romantic style', 'virtuoso style', 'expressive continuity', 'large-form performance'],
  teacherDecisionLogic: ['Test L9T1 reliability without reducing musical tempo', 'Determine whether the breakdown is preparatory, coordinative, or expressive', 'Isolate one variable before recombining', 'Use the exact study passage as the controlled transfer', 'Confirm through concerto, Bach, and virtuoso repertoire'],
  readinessCriteria: ['Shifts are secure with minimal audible preparation', 'Double stops remain intonationally stable at tempo', 'Chord/vibrato transitions are coordinated', 'Bow-spring behaviour adapts to dynamics and articulation', 'Multiple technical variables can be combined without loss of musical line'],
  nextTermDependency: 'Prepare Level 10 professional reliability, recovery after errors, technical adaptability, and independent problem-solving.'
});

export const L10T1 = card({
  ...common, level: 10, term: 1,
  technicalIntent: 'Establish professional-level technical reliability across the complete fingerboard while integrating advanced double stops, chords, bow-stroke adaptability, and performance recovery.',
  prerequisites: ['L9T2 advanced performance reliability', 'Stable major concerto and Bach-level technique', 'Independent technical problem-solving foundations'],
  scalesLink: ['Three-octave scales/arpeggios as maintenance and diagnostic tools', 'Advanced double-stop/octave patterns as diagnostic work'],
  pureTechnical: ['Full-register shifting reliable at performance tempo', 'Advanced double-stop/octave coordination', 'Rapid chord→linear transitions', 'Professional sautillé/ricochet', 'Articulation switching without mechanical reset'],
  etudes: ['Dont Op. 35 — selected advanced study — VALIDATED RCM Level 10 band', 'Gaviniès — selected advanced study — VALIDATED RCM Level 10 band', 'Kreutzer No. 27 — VALIDATED RCM Level 10', 'Rode No. 11 — VALIDATED RCM Level 10', 'Locatelli Op. 3 — selected advanced study — VALIDATED RCM Level 10 band'],
  repertoire: ['Major concerto — CORE / PROFESSIONAL BENCHMARK', 'Bach Solo Violin substantial movement — CORE / PROFESSIONAL BENCHMARK', 'Virtuoso work — CORE / PROFESSIONAL BENCHMARK', 'Contrasting style work — CORE / PROFESSIONAL BENCHMARK', 'Contemporary work — CORE / PROFESSIONAL BENCHMARK'],
  technicalDomains: ['professional shifting', 'double stops/octaves', 'chords', 'sautillé/ricochet', 'articulation adaptability'],
  musicalDomains: ['Baroque', 'Classical/Romantic', 'virtuoso', 'contemporary', 'stylistic versatility'],
  teacherDecisionLogic: ['Treat technique as performance infrastructure rather than isolated syllabus completion', 'Identify the exact failure mechanism in the current repertoire', 'Select the smallest effective technical intervention', 'Return immediately to musical context', 'Assess whether the intervention transfers without external prompting'],
  readinessCriteria: ['Complete fingerboard remains reliable at performance tempo', 'Advanced double stops/octaves are secure', 'Chord-to-line transitions are immediate', 'Sautillé/ricochet adapts to repertoire demands', 'Articulation changes occur without a mechanical reset', 'Technical correction can be selected independently'],
  nextTermDependency: 'Move from reliable professional technique toward autonomous portfolio preparation, recovery, stylistic flexibility, and capstone performance readiness.'
});

export const L10T2 = card({
  ...common, level: 10, term: 2,
  technicalIntent: 'Demonstrate autonomous professional readiness through reliable technique, rapid adaptation, recovery after errors, stylistic flexibility, and independent technical problem-solving.',
  prerequisites: ['L10T1 professional technical reliability', 'Major concerto and Bach-level performance readiness', 'Independent diagnostic/problem-solving ability'],
  scalesLink: ['Scales/arpeggios used diagnostically and for maintenance', 'Double-stop/octave patterns selected according to repertoire demands'],
  pureTechnical: ['Complete fingerboard reliability', 'Professional double-stop/octave/chord reliability', 'Advanced bow-stroke adaptability', 'Technical recovery after errors', 'Independent technical problem-solving'],
  etudes: ['Dont Op. 35 — advanced selection', 'Gaviniès — advanced selection', 'Rode No. 11–24 — advanced selection', 'Rovelli Op. 3 — advanced selection', 'Paganini/Wieniawski-level caprice benchmark — PROVISIONAL'],
  repertoire: ['Major concerto — CAPSTONE', 'Bach Solo Violin — CAPSTONE', 'Virtuoso work — CAPSTONE', 'Contrasting style work — CAPSTONE', 'Contemporary work — CAPSTONE'],
  technicalDomains: ['complete fingerboard reliability', 'advanced double stops/octaves/chords', 'bow adaptability', 'error recovery', 'independent diagnosis'],
  musicalDomains: ['Baroque', 'Classical/Romantic', 'virtuoso', 'contemporary', 'stylistic independence'],
  teacherDecisionLogic: ['Begin with the student’s actual professional portfolio demands', 'Observe performance rather than isolated exercise completion', 'Identify the smallest technical bottleneck', 'Design and test an independent intervention', 'Verify recovery and transfer in performance context'],
  readinessCriteria: ['Technique remains reliable across the complete working register', 'Advanced double stops, octaves, and chords are dependable', 'Bow stroke adapts immediately to repertoire demand', 'The student can recover technically after an error', 'The student can diagnose and solve a technical problem independently', 'Portfolio demonstrates stylistic and technical breadth'],
  nextTermDependency: 'No fixed next term: Level 10 culminates in an individual professional portfolio and continuing maintenance/problem-solving cycle.'
});

export const L9_L10_TKTL_V1 = Object.freeze([L9T1, L9T2, L10T1, L10T2]);
