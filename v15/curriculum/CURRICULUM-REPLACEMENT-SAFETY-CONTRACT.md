# V15 Curriculum Replacement Safety Contract

## Purpose

This document defines the safe replacement boundary for the five Violin AI curriculum modules.

## Locked runtime contracts

The following must remain unchanged:

- Levels 1–10.
- Terms 1–2.
- Teacher Unit Card IDs: L1T1 … L10T2.
- Teacher Unit Card shape.
- Exactly 5 pureTechnical entries per card.
- Exactly 5 etudes per card.
- Exactly 5 repertoire entries per card.
- Curriculum domains: PURE_TECHNICAL, ETUDE, REPERTOIRE, SCALES.
- Scale items remain separate from the 15 core ProgrammeItems.
- TeacherTermService remains responsible for materialisation.
- ProgrammeItem identity remains `termId + curriculumId + curriculumDomain + objectId`.
- Existing ProgrammeItems and their state/history must not be rewritten merely because curriculum content changes.
- Weekly planning, lessons, homework, practice plans, student/term ownership and cloud sync must not be changed by curriculum replacement.

## Critical historical-data rule

Never reuse an existing objectId for different curriculum meaning.

If an existing item has:

`LxTy:DOMAIN:N`

and that item has ever been stored in a ProgrammeItem, its meaning is historical and must remain stable.

A new curriculum object must receive a new immutable identity. This does not require a database curriculum-versioning system.

## Correct replacement architecture

The curriculum remains application-level static data:

Curriculum source data
→ Teacher Unit Card projection
→ Curriculum Registry
→ TeacherTermService
→ ProgrammeItems

The five modules are:

1. Master Technical — pedagogical backbone / taxonomy.
2. Scales & Arpeggios.
3. Pure Technical Exercise.
4. Étude / Study / Caprice.
5. Repertoire.

Master Technical is NOT a fifth ProgrammeItem domain.

## Important source-state finding

The repository currently contains the V1 runtime implementation and V1 curriculum data.

The project/library materials currently available for the proposed replacement contain curriculum specifications, audit instructions, partial/final audit material, and source requirements. They do not constitute one complete machine-readable replacement dataset for all five modules.

Therefore the runtime must NOT be changed by guessing or by silently converting provisional/open material into validated curriculum entries.

## Replacement gate

A new curriculum module may enter runtime only when its dataset has:

- Level and Term.
- Exact source identity where required.
- Validation status.
- Technical purpose.
- Prerequisites.
- Teacher diagnostic relevance.
- Mastery/exit criteria where applicable.
- Stable object identity.
- Compatibility with the Teacher Unit Card 5+5+5 contract.

## Migration modes

### KEEP
Existing V1 object remains unchanged.

### REPLACE
A new curriculum object is introduced with a new immutable identity. Existing historical ProgrammeItems remain untouched.

### ADD
New validated content is added to the candidate pool without altering existing history.

### HISTORICAL ONLY
Existing V1 content remains available only for historical ProgrammeItems and is not selected for newly activated cards.

### OPEN
Content remains outside runtime until exact source/placement is resolved.

### REJECT
Content is excluded from runtime.

## Activation rule

Do not create a persisted curriculum-versioning subsystem.

When the new dataset is complete, the application-level registration layer can project the new validated content into the existing Teacher Unit Card structure without changing database schema or core domain contracts.

## Pre-deployment tests

Before switching activation:

1. Existing students still load.
2. Existing terms still load.
3. Existing ProgrammeItems still load with unchanged titles/objectIds.
4. Completed ProgrammeItems remain completed.
5. Weekly targetWeek values remain unchanged.
6. Lesson reviewedProgrammeItemIds remain valid.
7. Homework/practice-plan references remain valid.
8. New Term activation creates exactly 15 core items.
9. Scales remain outside the 15-core count.
10. Repeated activation remains idempotent.
11. Tablet and desktop UI load the same curriculum projection.
12. Cloud student/term sync is unaffected.

## Current safe state

A rollback branch was created before curriculum replacement:

`backup-before-curriculum-replacement-20261001`

No destructive curriculum migration should be performed until the complete replacement datasets pass the replacement gate.
