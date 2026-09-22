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

## Checkpoint 5 — Teacher Agenda UI state shell
Implemented:
- TeacherAgendaController as the UI/application state boundary
- student selection and term selection
- active TKTL card context
- week selection and weekly programme loading
- lesson creation and active lesson selection
- review and explicit completion actions
- carry-forward action
- UI-only loading/error/selection state; business state remains owned by services/repository
- controller integration tests
- canonical curriculum-domain identifiers: PURE_TECHNICAL, ETUDE, REPERTOIRE

## Current application flow
Student → Active Term → Level/Term → TKTL Teacher Unit Card → 15 Programme Items → Weekly Programme → Lesson → Review → Explicit Completion → Derived Progress.

The UI/application layer must consume these services and repositories; it must not become a second business-data store.

## Checkpoint 6 — Browser demo + weekly interaction
Implemented:
- browser-facing Teacher Agenda shell on top of TeacherAgendaController
- local IndexedDB demo with seeded Demo Student / L1T1
- weekly programme grouped by canonical curriculum domain
- persistent completion and carry-forward workflow
- carry-forward advances the active UI week to the target week
- programme-item selection is separate from completion state
- explicit Complete Selected action preserves the Lesson review/completion distinction
- demo startup documentation under `v15/ui/demo/`

## Checkpoint 7 — Real lesson-session workflow
Implemented:
- lesson session state in the TeacherAgendaController
- persisted lesson attendance and mark through LessonService
- reviewed programme-item persistence remains owned by LessonService/LessonProgrammeService
- deterministic one-homework-record-per-lesson workflow through HomeworkService
- lesson history loaded from the active term
- browser UI for lesson details, attendance, mark, reviewed work and homework
- lesson-session controller integration coverage
- homework text editing uses real line breaks rather than encoded literal separators

The lesson workflow remains a composition layer over the existing services/repository; the controller does not become a second business-data store.

## Checkpoint 8 — Teacher-facing student, term and history workflow
Implemented:
- create Student from the Teacher Agenda UI
- create Term for the selected student with Level 1–10 and Term 1–2
- automatic TKTL activation for the new active term
- historical lesson selection from Lesson History
- reopen a historical lesson into the Lesson Session view
- persisted lesson details remain editable after historical selection
- controller and shell coverage for the creation/history workflow

The teacher UI remains a composition layer; StudentService, TermService, LessonService, HomeworkService and Programme services retain business-data ownership.

## Checkpoint 9 — End-to-end teacher workflow coverage
Implemented:
- strengthened controller integration coverage for create Student → create Term → start Lesson
- review and explicit completion remain distinct and are verified separately
- homework persistence is verified through the controller boundary
- historical lesson reopening restores mark, reviewed items and homework
- completed ProgrammeItems remain completed after historical lesson selection
- the UI separation between Current Term and Create New Term is covered by shell tests

## Checkpoint 10 — Weekly Teaching Workflow UX (VALIDATED)
Validated on the live GitHub Pages browser deployment.

Implemented:
- Select all pending core programme items
- Clear selection
- Review selected items through the active lesson
- Explicit Complete selected workflow
- SCALES excluded from bulk programme-item selection
- week changes clear stale selection
- carry-forward clears selection and moves the active week
- completed items cannot be carried forward
- weekly/domain counters update after completion
- live browser validation of Review → Complete distinction
- GitHub Pages deployment for the V15 browser demo

Validation evidence:
- automated V15 test suite green on the pre-deployment V15 head
- live GitHub Pages deployment green
- browser QA passed for selection, week change, carry-forward, review and completion
- validated live demo: https://tneophytou22.github.io/violin-ai-teacher-agenda/ui/demo/

**Locked baseline:** Checkpoint 10 is now the validated V15 teaching-workflow baseline. Future work must preserve the validated Weekly Agenda → Review → Complete → Carry Forward semantics unless a new phase explicitly changes and re-validates them.

## Next refinement — Phase 11
Focus:
- teacher-facing workflow ergonomics above the locked Checkpoint 10 baseline
- improve visibility and efficiency of lesson review/completion without introducing duplicate business state
- tests first, then implementation, then CI and browser validation
- no curriculum/TKTL changes unless explicitly required by the phase


## Checkpoint 11 — Phase 11 validated

Phase 11 is browser-validated on the live GitHub Pages demo. The weekly bulk-selection boundary is explicit: core items are selectable, SCALES remain excluded from bulk selection, and when no pending core items remain the selection/completion actions are disabled.

## Phase 12 — Completion reversal

Phase 12 introduces an explicit single-item Uncomplete transition for completed core programme items. The transition restores the programme item to PLANNED, clears completedAt, preserves other item details, and refreshes weekly and term progress. Lesson review activity remains a separate record and is not erased by uncompletion.

Automated coverage is added at service, controller, and shell levels. Live browser QA remains pending for the new Uncomplete action.
