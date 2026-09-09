# VIOLIN AI TEACHER AGENDA — ARCHITECTURE CONTRACT V14.0

Status: ARCHITECTURAL BASELINE — no application rewrite has been performed by this document.

## 0. Purpose

This contract defines the architectural rules for the next-generation Teacher Agenda. It is the governing boundary for future implementation work and is designed to allow new modules to be added without rewriting unrelated modules.

The application is teacher-facing. The student does not receive a separate application interface in this architecture.

## 1. Non-negotiable principles

1. One Core application state/data model.
2. One owner for each domain of data.
3. Curriculum domains are independent: Scales, Études, Technique, Repertoire.
4. Curriculum data is knowledge/reference data; it is not Homework state and not Lesson state.
5. Term Programme is the teacher's selected programme for a specific student and term.
6. Lesson selection is transient selection state and must never mean that the whole curriculum is assigned.
7. Homework contains only explicitly selected assignments.
8. Pages are UI surfaces; pages do not become independent data owners.
9. No duplicate state stores for the same domain.
10. No parallel bridges performing the same synchronization responsibility.
11. Derived progress/report values are calculated from source records; historical finalized records may be snapshotted where immutability is required.
12. Existing verified Google OAuth/Drive infrastructure is preserved and isolated behind a Storage Service.
13. Existing locked Scales architecture remains protected. Adding another curriculum must not alter its contracts.
14. Every new module must declare an explicit module contract before implementation.

## 2. Domain ownership

| Domain | Single owner | Primary responsibility |
|---|---|---|
| Students | Student Module | student profile and identity |
| Timetable | Timetable Module | recurring teaching schedule |
| Terms | Term Module | term dates and derived teaching weeks |
| Curriculum | Curriculum Modules | reference curriculum definitions |
| Term Programme | Programme Module | student-specific term targets |
| Lessons | Lesson Module | lesson records and lesson history |
| Homework | Homework Module | explicit homework assignments |
| Marks | Assessment Module | lesson marks 1–20 |
| Attendance | Lesson Module | attendance records |
| Progress | Progress Module | derived expected/actual progress |
| Reports | Report Module | Mid-Term and End-of-Term reports |
| Communication | Communication Module | Viber message generation/sending workflow |
| Storage | Storage Service | persistence, including Google Drive |
| Navigation | Router/Navigation Registry | routes and module activation |

No UI page may create a second owner for any row above.

## 3. Curriculum architecture

The curriculum layer is composed of independent modules:

- Scales
- Études / Study / Caprice
- Technical Exercises
- Repertoire

Each curriculum module owns its own data namespace and renderer/adapter where needed. Curriculum modules may share common contracts, but they do not import or depend on one another merely to render their own content.

The Études curriculum is independent of the Scales curriculum. The Scales curriculum is independent of Études. The same rule applies to Technique and Repertoire.

The locked Scales baseline in `v13/CURRICULUM-ARCHITECTURE-LOCK.md` remains authoritative for the existing Scales implementation.

## 4. Term Programme

A Term Programme is a student-specific selection of curriculum items for one Term.

It references curriculum items; it does not replace the curriculum database.

Example structure:

Student → Term → Programme → {Scales, Études, Technique, Repertoire}

Each programme item supports:

- Not Started
- In Progress
- Completed

Programme status is distinct from lesson selection and homework assignment.

## 5. Term weeks

The number of teaching weeks is calculated automatically from:

Term Start Date → Term End Date → Timetable

The system derives actual teaching weeks for the student and presents Week 1 … Week N.

The teacher should not have to manually maintain a duplicate week count when the dates and timetable already determine it.

## 6. Lesson lifecycle

Timetable → Today's Students → Lesson

A Lesson is associated with:

- student
- term
- derived teaching week
- date/time
- attendance
- programme context
- selected curriculum items
- homework
- marks
- teacher notes

Past lessons remain in history.

## 7. Lesson programme selection

The Lesson displays the student's Term Programme.

Checkbox selection means: "use this item in this lesson / handoff".

It does NOT mean:

- the item is completed;
- the item is automatically homework;
- the entire curriculum is selected.

A teacher may therefore have a programme containing many items, listen to only some during a particular lesson, and still leave all relevant items available for home study.

## 8. Homework contract

Homework is created from a Lesson and receives only explicitly selected items.

Flow:

Lesson → Teacher selection → Homework draft → Teacher review → Send Homework

Homework must not enumerate the entire curriculum or infer unselected items.

Homework can generate the Viber message workflow.

Central Homework is not an independent source of curriculum truth. It consumes homework records produced by the Homework Module.

## 9. Marks

Lesson marks use the 1–20 scale.

Marks are lesson/assessment records. They are not stored inside curriculum definitions.

## 10. Attendance

Attendance is recorded against the Lesson and retained as historical student data.

Supported states may include Present, Absent, and Excused, subject to the final UI/data implementation.

## 11. Progress

Progress is derived from source records including:

- Term Programme
- programme status
- teaching weeks
- lesson history
- completed items

The UI should support an Expected vs Actual representation, for example:

Expected by Week 6: 80%
Actual: 60%
⚠ Student is behind schedule.

The calculation must be based on explicit data and must not invent completion.

## 12. Reports

Each Term has exactly two planned reports:

1. Mid-Term Report
2. End-of-Term Report

Reports are generated in Greek and use recorded Agenda data, including where relevant:

- progress
- programme completion
- marks
- attendance
- lesson history
- areas needing improvement

The language should be professional, constructive, and evidence-based.

A finalized report may be stored as a historical snapshot so later curriculum changes cannot rewrite past reporting.

## 13. Live vs historical records

Live/derived state:

- current progress
- current programme status
- current schedule-derived week position

Historical state:

- completed lessons
- attendance records
- marks
- sent homework records
- finalized reports
- finalized term outcomes

Historical records must remain stable.

## 14. Storage contract

Google OAuth and Google Drive persistence are infrastructure concerns.

Application modules call a Storage Service rather than implementing authentication or Drive logic themselves.

The existing verified Google connection must be preserved rather than rewritten during unrelated module work.

## 15. Navigation contract

Navigation is centralized through a Router / Navigation Registry.

Modules declare their routes rather than directly manipulating unrelated pages.

Future modules such as Concerts, Exams, Payments, Practice Log, Certificates, or Parent Communication can be registered without restructuring existing modules.

## 16. Module contract

Every future module must declare:

```text
MODULE NAME
OWNER
DATA OWNED
DATA READ
DATA WRITE
EVENTS EMITTED
EVENTS CONSUMED
STORAGE NAMESPACE
ROUTES
DEPENDENCIES
```

A module may not silently introduce a second state owner or a second bridge for an existing responsibility.

## 17. Event contract

Modules communicate through explicit application events where cross-domain reactions are needed.

Example:

Lesson → emits LESSON_COMPLETED

Consumers may include:

- Progress
- Reports
- Homework history

The Lesson module must not directly embed private implementation details of those modules.

## 18. Bridge rule

For each synchronization responsibility there must be one authoritative bridge/transport path.

No page-specific bridge may be introduced merely to work around a routing or DOM issue.

The V13 Scales bridge and selection/transport rules remain governed by `v13/CURRICULUM-ARCHITECTURE-LOCK.md` until the V14 implementation deliberately replaces them after equivalent tests pass.

## 19. Rendering rule

UI rendering must be scoped to the actual canonical page/module context.

Forbidden patterns include:

- generic body-text detection;
- broad click matching;
- unrestricted MutationObserver render loops;
- multiple independent renderers targeting the same canonical DOM.

Rendering is a UI concern, not a data ownership mechanism.

## 20. Testing gates

No architectural migration is accepted merely because a page loads.

Minimum integration gates include:

1. Student creation/loading.
2. Term creation and automatic week calculation.
3. Timetable → Today's Students.
4. Today's Student → Lesson.
5. Term Programme visible inside Lesson.
6. Explicit curriculum selection.
7. Selection handoff without whole-curriculum leakage.
8. Homework creation from selected items.
9. Homework persistence and history.
10. Viber message generation.
11. Marks 1–20 persistence.
12. Attendance persistence.
13. Progress Expected vs Actual.
14. Mid-Term Report generation.
15. End-of-Term Report generation.
16. Google Drive save/load.
17. Past lesson retrieval.
18. Existing Scales flow remains functional.
19. Existing Études data remains independent from Scales.

## 21. Change-control rule

Before modifying an existing module, identify:

- its owner;
- its input contract;
- its output contract;
- its storage namespace;
- its consumers;
- its tests.

Do not fix one UI symptom by adding a second state owner, second renderer, second bridge, or second storage key.

## 22. Definition of done for V14 foundation

The foundation is complete only when the Core, module contracts, data ownership, navigation, storage abstraction, event boundaries, and integration tests are in place.

Curriculum content must then plug into the foundation without changing the Core architecture.

## 23. Explicitly protected user decisions

- The Agenda is for the teacher.
- The student has no separate interface in this architecture.
- The teacher assigns the student's full Term Programme: scales, repertoire, études/exercises, and other required work.
- The teacher decides what is worked on each week through the Lesson workflow.
- Term progression is visible as Week 1 → Week 2 → … and can identify students who are behind schedule.
- Homework is derived from explicit lesson selection.
- Checkbox selection remains important because the teacher may not have time to hear every item during every lesson while still assigning items for home study.
- Two reports exist per Term: Mid-Term and End-of-Term.
- Reports are automatically based on Agenda data and written in Greek.
- Marks use 1–20.
- Google Drive is the persistence destination using the already-established secure Google/OAuth mechanism.
- The architecture must remain extensible so future pages/buttons/modules can be added without rebuilding unrelated systems.

## 24. Baseline status

This document is the V14 architectural contract. It does not itself replace or modify the locked V13 Scales implementation.

Implementation must proceed incrementally behind this contract, with tests at each boundary.
