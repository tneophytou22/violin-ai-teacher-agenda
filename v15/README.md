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

## Next checkpoint
Curriculum/TKTL integration and UI wiring. The UI must consume V15 services/repositories rather than becoming a second business-data store.
