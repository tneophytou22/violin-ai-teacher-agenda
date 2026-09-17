# Violin AI Teacher Agenda — V15 Foundation

This directory is the first implementation checkpoint of the validated V15 architecture.

## Locked boundaries
- Business data is not stored in localStorage.
- Domain ownership remains service-specific.
- Progress is derived, not a persisted source of truth.
- Lesson owns mark, attendance and reviewedProgrammeItemIds.
- Homework is owned by HomeworkService and is upserted per lesson.
- Homework completion does not complete a ProgrammeItem.
- Curriculum modules expose generic selection contracts; Core does not hard-code domain fields.
- The validated Scales architecture remains the reference implementation for future curriculum modules.
- Production browser persistence uses IndexedDB behind the repository contract.
- Storage schema versions are explicit and future versions are rejected rather than silently interpreted.
- TKTL Teacher Unit Cards are curriculum intelligence, not a second business-data store.

## Checkpoint 1 — Foundation
Implemented:
- domain models and invariants
- repository abstraction with in-memory adapter
- StudentService
- TermService
- LessonService
- ProgrammeService + derived progress
- HomeworkService
- generic CurriculumRegistry
- automated foundation tests

## Checkpoint 2 — State & persistence
Implemented on the V15 implementation branch:
- IndexedDBRepository production adapter
- explicit V15 object-store set: students, terms, lessons, programmeItems, homework
- StorageService boundary
- explicit storage schema version
- future-schema rejection
- persistence contract tests

## Checkpoint 3 — TKTL contract
Implemented:
- Teacher Unit Card domain contract
- locked Level 1–10 / Term 1–2 structure
- exactly five Pure Technical choices per card
- exactly five Etude/Study/Caprice choices per card
- exactly five Repertoire choices per card
- readiness criteria and next-term dependency fields
- difficulty band and evidence status fields
- Teacher Unit Card registry
- automated TKTL contract tests
- canonical L1–L10 card export

## Checkpoint 4 — Curriculum + teacher workflow
Implemented:
- V1 registration for Pure Technical, Etude and Repertoire curricula
- TeacherTermService: Student → Level/Term → TKTL Card → Programme Items
- exactly 15 ProgrammeItems generated per active TKTL card
- idempotent card activation
- WeeklyProgrammeService for week assignment, weekly summaries and card validation
- LessonProgrammeService for review, explicit completion and carry-forward
- cross-term protection for lesson review
- TeacherAgendaViewModel as a UI/application composition boundary
- automated integration tests for the weekly and lesson workflow

## Current application flow
Student → Active Term → Level/Term → TKTL Teacher Unit Card → 15 Programme Items → Weekly Programme → Lesson → Review → Explicit Completion → Derived Progress.

The UI/application layer must consume these services and repositories; it must not become a second business-data store.

## Next checkpoint
Build the first teacher-facing Agenda UI against TeacherAgendaViewModel. Keep UI state separate from business state and preserve the service ownership boundaries above. The first screen should support student selection, active term/card context, weekly programme display, lesson creation, review/completion and carry-forward actions.
