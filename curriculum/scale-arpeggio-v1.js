/* VIOLIN AI — MASTER SCALE & ARPEGGIO CURRICULUM V1
 * Canonical teacher-facing curriculum data. Levels 1–9, two terms per level.
 * This module is intentionally UI-independent and does not modify student data.
 */
window.VIOLIN_SCALE_CURRICULUM_V1 = {
  version: '1.0',
  levels: 9,
  termsPerLevel: 2,
  progression: ['Pitch','Range','Positions','Bow control','Articulation','Rhythm','Speed','Double stops','Advanced patterns','Transfer to repertoire'],
  masterySkills: ['Intonation','Rhythm','Bow control','Tone','Coordination','Shifting','Relaxation','Speed','Articulation','Memory'],
  scoreScale: { min: 1, max: 5 },
  terms: {
    1: {
      1: {name:'Foundation / 1st Position — Term 1', major:['G','D','A'], octaves:1, arpeggios:['G major','D major','A major'], bowing:['separate bows','1 note/bow','2 notes/bow'], articulation:['détaché'], tempo:'♩=50–60', objective:'clean intonation, finger placement, straight bow'},
      2: {name:'Foundation / 1st Position — Term 2', major:['C','D','A','G'], minor:{introduction:['E minor']}, octaves:1, arpeggios:['C major','D major','G major','A major','E minor'], bowing:['1','2','4 notes/bow'], articulation:['détaché','legato'], patterns:['2+2'], tempo:'♩=60–70', objective:'bow distribution'}
    },
    2: {
      1: {major:['G','D','A','C','F'], minor:{natural:['E','A']}, arpeggios:['major/minor tonic triads'], bowing:['1','2','4 notes/bow'], articulation:['détaché','legato'], tempo:'♩=70–80'},
      2: {minor:{harmonic:['E','A','D'], melodic:'introduction'}, chromatic:'1 octave', bowing:['2+2','4+4','8 notes/bow'], articulation:['light martelé','hooked bow introduction'], tempo:'♩=75–85'}
    },
    3: {
      1: {major:['G','D','A','C','F','Bb'], octaves:2, minor:{tonalities:['A','E','D'], forms:['harmonic','melodic']}, arpeggios:['major/minor tonic'], bowing:['1','2','4','8 notes/bow'], tempo:'♩≈80'},
      2: {major:'up to 3 sharps / 3 flats', minor:['harmonic','melodic'], dominant7:['G7','D7','A7'], chromatic:'2 octaves', bowing:['détaché','legato','martelé','hooked'], patterns:['2+2','3+3','4+4','accent every 4'], doubleStops:['thirds introduction','sixths introduction']}
    },
    4: {
      1: {major:['G','A','Bb','C','D','E'], octaves:'2–3', minor:{tonalities:['G','A','B','C'], forms:['harmonic','melodic']}, arpeggios:['major','minor'], dominant7:['D7','G7','A7'], bowing:['1','2','4','8','12 notes/bow'], articulation:['détaché','legato','martelé','hooked']},
      2: {dominant7:'systematic', diminished7:'introduction', doubleStops:['thirds','sixths','octave preparation'], oneString:['D','G','A'], bowing:['2/2','4/4','3/3','4+4','accent every 4'], tempo:'♩≈90'}
    },
    5: {
      1: {major:['G','A','Bb','B','C'], octaves:3, minor:{tonalities:['G','A','B','C'], forms:['harmonic','melodic']}, arpeggios:['major','minor','3 octaves where appropriate'], dominant7:['G7','A7','C7','D7'], chromatic:'2–3 octaves', bowing:['1','2','3','4','6','8 notes/bow'], articulation:['martelé systematic introduction']},
      2: {diminished7:['A','B','C','D'], doubleStops:['thirds','sixths','octave introduction'], oneString:['D major'], bowing:['détaché','martelé','hooked','legato','accented détaché'], rhythm:['dotted','reverse dotted','triplets','groups of 4']}
    },
    6: {
      1: {major:'all', octaves:3, minor:{tonalities:'all', forms:['harmonic','melodic']}, arpeggios:['major','minor','dominant 7'], chromatic:'3 octaves', bowing:['1','2','3','4','6','8','12','16 notes/bow'], tempo:'♩=90–110'},
      2: {diminished7:'complete system', dominant7:'all major tonal centres', resolution:'Dominant 7 → tonic', doubleStops:['thirds','sixths','octaves'], rhythm:['long-short','short-long','triplets','groups of 4','groups of 6'], bowing:['mixed bowings']}
    },
    7: {
      1: {system:'complete 3-octave system', tonalities:['major','minor'], arpeggios:['major','minor','dominant 7','diminished 7'], chromatic:'3 octaves', bowing:['7 notes/bow','9 notes/bow','12 notes/bow'], positions:[1,3,5,7], oneString:'major tonalities'},
      2: {doubleStops:['thirds','sixths','octaves'], tenths:'introduction', shifts:['1–3','1–5','1–7','1–9'], accents:['every 3','every 4','every 5','every 6','every 7'], bowing:['hooked','martelé','détaché','legato','mixed']}
    },
    8: {
      1: {system:'full tonal system', major:'all 12 tonal centres', octaves:3, minor:{forms:['harmonic','melodic']}, arpeggios:['major','minor','dominant 7','diminished 7'], chromatic:'3 octaves', bowing:['1','2','3','4','6','8','12','16 notes/bow'], doubleStops:['thirds','sixths','octaves']},
      2: {doubleStops:['thirds','sixths','octaves','tenths'], doubleStopScales:true, oneString:'3 octaves', rhythm:['groups of 3','4','5','6','7'], dynamics:['pp → ff','ff → pp','crescendo','diminuendo'], articulation:['spiccato introduction where appropriate']}
    },
    9: {
      1: {system:'complete scale architecture', major:'all 12 tonal centres', octaves:3, minor:{tonalities:'all 12', forms:['harmonic','melodic']}, arpeggios:['major','minor','dominant 7','diminished 7'], chromatic:'3 octaves', doubleStops:['thirds','sixths','octaves','tenths'], oneString:true, bowing:['1 note/bow','2','3','4','6','8','12','16','mixed','hooked','martelé','détaché','legato','spiccato where appropriate']},
      2: {doubleStops:['thirds','sixths','octaves','fingered octaves','tenths'], patterns:['straight','groups of 3','groups of 4','groups of 6','octave displacement','sequences','accent displacement','rhythmic transformations'], dynamics:['pp → ff','ff → pp','crescendo','diminuendo'], objective:'performance mastery and transfer to repertoire'}
    }
  },
  getTerm(level, term) { return this.terms?.[level]?.[term] || null; },
  createMastery() { return Object.fromEntries(this.masterySkills.map(s => [s, null])); },
  averageMastery(m) { const v=Object.values(m||{}).filter(x=>Number.isFinite(x)); return v.length ? Math.round((v.reduce((a,b)=>a+b,0)/v.length)*10)/10 : null; }
};
