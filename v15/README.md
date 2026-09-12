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

## Checkpoint 1
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

## Next checkpoint
State & persistence: replace the test adapter with the V15 StorageService/repository contract and add version-safe persistence semantics before UI integration.
