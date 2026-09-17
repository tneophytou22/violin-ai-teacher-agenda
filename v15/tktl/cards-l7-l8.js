import { registerTeacherUnitCard } from './registry.js';

const card = (input) => registerTeacherUnitCard(input);
const common = { difficultyBand: 'CORE', status: 'PROVISIONAL' };

export const L7T1 = card({
  ...common, level: 7, term: 1,
  technicalIntent: 'Develop advanced shifting, mobile double stops, rapid chord release, and controlled ricochet/spiccato at higher performance demands.',
  prerequisites: ['L6T2 full-register reliability', 'Stable double-stop and chord coordination', 'Controlled ricochet and spiccato'],
  scalesLink: ['Three-octave scales/arpeggios', 'Double-stop scales with position changes'],
  pureTechnical: ['Full-register rapid shifting', 'Thirds/sixths with position changes', '3/4-note chord preparation→rapid release', 'Ricochet groups 3–6', 'Spiccato↔sautillé'],
  etudes: ['Dont Op. 37 No. 3 — VALIDATED RCM Level 7', 'Kreutzer No. 7 — VALIDATED RCM Level 7', 'Mazas Op. 36 Book 1 No. 7 — VALIDATED RCM Level 7', 'Polo Double Stops No. 10 — VALIDATED RCM Level 7', 'Trott Melodious Double Stops No. 17 — VALIDATED RCM Level 7'],
  repertoire: ['Corelli La Folia', 'Bach Solo Violin substantial movement', 'Advanced Classical concerto movement', 'Bruch G minor — selected movement — CHALLENGE', 'Kabalevsky Violin Concerto — I — BRIDGE'],
  technicalDomains: ['advanced shifting', 'double stops', 'chords', 'ricochet', 'spiccato/sautillé'],
  musicalDomains: ['Baroque style', 'Classical style', 'Romantic style', 'virtuoso articulation', 'large-form phrasing'],
  teacherDecisionLogic: ['Test L6 full-register reliability at tempo', 'Identify whether the limiting variable is shift, intonation, chord release, or bow spring', 'Select the narrowest pure-technical intervention', 'Transfer through the matched RCM study', 'Confirm integration in repertoire'],
  readinessCriteria: ['Rapid full-register shifts remain accurate', 'Thirds/sixths remain stable during movement', 'Chord releases are clean and timed', 'Ricochet groups remain even', 'Spiccato can move toward sautillé without loss of control'],
  nextTermDependency: 'Increase anticipatory shifting, horizontal double-stop movement, chord sequences, variable-string ricochet, and graduated spiccato/sautillé.'
});

export const L7T2 = card({
  ...common, level: 7, term: 2,
  technicalIntent: 'Consolidate advanced mobility by coordinating anticipatory shifts, moving double stops, horizontal chord sequences, variable ricochet, and graduated sautillé.',
  prerequisites: ['L7T1 rapid shifting', 'Stable mobile thirds/sixths', 'Emerging sautillé control'],
  scalesLink: ['Three-octave scales/arpeggios at increased tempo', 'Double-stop position-change sequences'],
  pureTechnical: ['Rapid shifting with anticipatory finger preparation', 'Thirds/sixths alternating shift + stationary finger', 'Chord sequences with horizontal movement', 'Ricochet changing string levels', 'Spiccato/sautillé graduated tempi'],
  etudes: ['Kreutzer No. 9 — VALIDATED RCM Level 7 T2', 'Kreutzer No. 11 — VALIDATED RCM Level 7 T2', 'Dont Op. 37 selected study — PROVISIONAL', 'Rode selected study — PROVISIONAL', 'Fiorillo Op. 3 selected study — PROVISIONAL'],
  repertoire: ['Bruch G minor — selected movement', 'Bach Solo Violin substantial movement', 'Advanced Romantic/French concerto movement', 'Lalo selected movement — CHALLENGE', 'Kabalevsky Violin Concerto — I — BRIDGE'],
  technicalDomains: ['anticipatory shifting', 'mobile double stops', 'chords', 'ricochet', 'sautillé'],
  musicalDomains: ['Romantic style', 'French style', 'Baroque style', 'virtuoso articulation', 'phrase continuity'],
  teacherDecisionLogic: ['Test L7T1 skills with increased tempo', 'Determine whether failure begins before the shift or at the release', 'Isolate the anticipatory or bow-spring variable', 'Transfer into the exact etude passage', 'Use concerto/Bach repertoire as integration test'],
  readinessCriteria: ['Shifts initiate without late finger preparation', 'Moving double stops remain intonationally stable', 'Horizontal chord movement is coordinated', 'Ricochet adapts to string-level changes', 'Sautillé develops progressively without forced acceleration'],
  nextTermDependency: 'Prepare high-register shifting with reduced preparation, rapid double-stop transitions, four-note chord release, advanced ricochet grouping, and controlled sautillé spring point.'
});

export const L8T1 = card({
  ...common, level: 8, term: 1,
  technicalIntent: 'Extend advanced technique into high-register work, rapid double-stop transitions, four-note chord release, variable ricochet, and controlled sautillé.',
  prerequisites: ['L7T2 anticipatory shifting', 'Stable advanced double stops', 'Graduated spiccato/sautillé control'],
  scalesLink: ['Three-octave scales/arpeggios', 'Advanced double-stop scale patterns'],
  pureTechnical: ['High-register shifts with reduced preparation', 'Thirds/sixths rapid positional transitions', 'Four-note chord rolling/release', 'Advanced ricochet with variable grouping', 'Sautillé at controlled spring point'],
  etudes: ['Dont Op. 37 No. 9 — VALIDATED RCM Level 8', 'Mazas Op. 36 No. 30 — VALIDATED RCM Level 8', 'Fiorillo Op. 3 No. 3 — VALIDATED RCM Level 8', 'Kreutzer No. 15 — VALIDATED RCM Level 8', 'Mazas Op. 36 No. 54 — VALIDATED RCM Level 8'],
  repertoire: ['Bach Solo Violin substantial movement', 'Advanced concerto movement', 'Saint-Saëns Havanaise', 'Sarasate Introduction and Tarantelle — CHALLENGE', 'de Bériot No. 7 — I — BRIDGE'],
  technicalDomains: ['high-register shifting', 'rapid double stops', 'four-note chords', 'ricochet', 'sautillé'],
  musicalDomains: ['Baroque style', 'Romantic style', 'French style', 'virtuoso articulation', 'expressive continuity'],
  teacherDecisionLogic: ['Verify L7 advanced mobility', 'Locate the breakdown in high-register shift preparation, double-stop transition, chord release, or bow spring', 'Use one targeted intervention', 'Transfer to the matched RCM étude', 'Confirm through concerto and Bach repertoire'],
  readinessCriteria: ['High-register shifts remain reliable with reduced preparation', 'Rapid thirds/sixths retain intonation', 'Four-note chords roll and release cleanly', 'Ricochet grouping can vary without losing pulse', 'Sautillé remains controlled at the selected spring point'],
  nextTermDependency: 'Develop high-register portamento, changing double-stop articulation, rapid chord-to-line transitions, rhythmic ricochet coordination, and dynamic sautillé control.'
});

export const L8T2 = card({
  ...common, level: 8, term: 2,
  technicalIntent: 'Integrate high-register shifting with expressive portamento, changing double-stop articulation, rapid chord-to-line transitions, rhythmic ricochet, and dynamic sautillé.',
  prerequisites: ['L8T1 high-register mobility', 'Stable rapid double stops and four-note chords', 'Controlled variable ricochet and sautillé'],
  scalesLink: ['Three-octave scales/arpeggios', 'Advanced double-stop patterns with articulation changes'],
  pureTechnical: ['High-register shifts + vibrato/portamento', 'Double-stop sequences changing articulation', 'Rapid chord→single-note transition', 'Ricochet + crossing + rhythmic grouping', 'Sautillé dynamic/contact variation'],
  etudes: ['Fiorillo Op. 3 No. 14 — VALIDATED RCM Level 8', 'Mazas Op. 36 No. 26 — VALIDATED RCM Level 8', 'Donkin Barcarolle — VALIDATED RCM Level 8', 'Lift Every Voice and Sing! — VALIDATED RCM Level 8', 'Advanced double-stop etude — PROVISIONAL, exact selection pending functional audit'],
  repertoire: ['Bach Solo Violin substantial movement', 'Elgar Salut d’amour', 'Falla Danse Espagnole', 'Advanced Sarasate/equivalent virtuoso work — CHALLENGE', 'de Bériot No. 7 — I — BRIDGE'],
  technicalDomains: ['high-register shifting', 'portamento', 'double-stop articulation', 'chord-to-line transition', 'ricochet/sautillé'],
  musicalDomains: ['Baroque style', 'Romantic style', 'Spanish style', 'expressive portamento', 'character contrast'],
  teacherDecisionLogic: ['Test L8T1 high-register reliability', 'Identify the dominant coordination variable', 'Isolate shift, articulation, chord release, crossing, or spring-point fault', 'Transfer through the selected study', 'Confirm musical integration in contrasting repertoire'],
  readinessCriteria: ['High-register shifts remain secure with expressive preparation', 'Double-stop articulation changes do not destabilise intonation', 'Chord-to-line transitions are immediate and clean', 'Ricochet remains rhythmically organised through crossings', 'Sautillé responds to dynamic/contact changes'],
  nextTermDependency: 'Prepare Level 9 full-fingerboard performance reliability, advanced double-stop/octave work, four-note chord release, multi-string ricochet/sautillé, and mixed articulation.'
});

export const L7_L8_TKTL_V1 = Object.freeze([L7T1, L7T2, L8T1, L8T2]);
