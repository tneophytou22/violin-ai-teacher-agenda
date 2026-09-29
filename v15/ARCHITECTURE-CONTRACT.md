# V15 Architecture Contract

Status: LOCKED FOR V15 MVP  
Baseline: `96cedaf90844963f8380aad9e1489f4334f2ae51`  
Phase: 43 — Persistence Atomicity Hardening

This document records the explicit architecture boundaries for the current V15 MVP. It does not introduce a new persistence model or concurrency mechanism.

## 1. Concurrency Contract

### V15 supported contract

V15 is a **single-teacher, single-controller, single-browser-session MVP**.

Within one `TeacherAgendaController` instance:
- asynchronous controller operations are serialized through `operationTail`;
- failed operations restore the controller state snapshot;
- this protects UI/application state ordering and rollback.

V15 does **not** claim to provide multi-tab, multi-window, or multi-device coordination.

### Explicitly out of scope for V15

The following are future architecture work, not current guarantees:
- cross-tab locking;
- cross-window coordination;
- optimistic concurrency/version conflict resolution;
- database-level uniqueness for logical curriculum activation;
- distributed or multi-device synchronization.

The known `TeacherTermService.activateCard()` read → decide → write race is therefore an acknowledged **future multi-writer risk**, not a violation of the current single-controller MVP contract.

## 2. Transaction Contract

V15 persistence guarantees atomicity at the level of individual repository writes/deletes and for explicitly supported repository batch operations.

Supported atomic repository batches:
- backup restore: replace all five V15 stores in one repository transaction;
- student deletion: remove the student and all owned descendants in one repository transaction;
- bulk ProgrammeItem completion: write the selected ProgrammeItems through one repository batch boundary;
- student + initial Term creation: write both records through one repository batch boundary.

The repository exposes targeted batch primitives (`replaceAll`, `deleteRecords`, `putRecords`) rather than a general transaction abstraction. These primitives are part of the V15 persistence contract and are implemented atomically by both the InMemory and IndexedDB adapters.

Other business operations that currently perform a single repository write remain atomic at that write boundary. V15 does not claim that every arbitrary multi-step business operation is transactional.

Future business operations that require all-or-nothing semantics must use an explicit repository batch primitive or introduce a separately approved transaction contract; controller serialization alone is not a database transaction boundary.

## 3. Curriculum Snapshot Contract

The V15 runtime curriculum registry is treated as **immutable during normal application execution**.

ProgrammeItem stores:
- `cardId` — the originating TKTL Teacher Unit Card identity;
- `objectId` — the curriculum object/slot identity used during activation;
- `title` — a copied human-readable snapshot;
- `curriculumId` and `curriculumDomain` — curriculum routing identity.

ProgrammeItem is therefore business data derived from curriculum intelligence, not a live pointer to mutable card content.

V15 does not currently implement:
- editable curriculum cards;
- curriculum version migration;
- `cardVersion` or `curriculumVersion` fields;
- historical re-materialisation from changed curriculum definitions.

If curriculum editing/versioning is introduced later, that phase must define immutable version identity and migration/snapshot rules before changing persisted ProgrammeItems.

## 4. Delete / Orphan Contract

V15 now has an explicit Student domain delete workflow.

Student deletion is an atomic cascade over the owned dependency chain:
- Homework owned by the student's Lessons;
- Lessons owned by the student's Terms;
- ProgrammeItems owned by the student's Terms;
- Terms owned by the Student;
- the Student record itself.

The cascade is performed through one repository `deleteRecords` batch boundary. Unrelated students and curriculum registry data are preserved.

V15 does not claim product-level delete semantics for Term, Lesson, ProgrammeItem, or Homework individually. Those policies remain out of scope until explicitly specified.

Ownership creation boundaries are enforced:
- Term requires an existing Student;
- Lesson requires an existing Term;
- ProgrammeItem requires an existing Term;
- Homework requires an existing Lesson.

This prevents new orphan records through the supported domain creation services.

## 5. Consequence for Future Phases

These decisions deliberately prevent premature architectural expansion.

Do not add, solely in response to the current audit:
- database locks;
- IndexedDB unique indexes;
- a DB schema version bump;
- a general transaction abstraction;
- curriculum versioning;
- delete cascades.

Such changes require a phase with an explicit contract and tests for the chosen behavior. The existing Student cascade and targeted batch primitives are already part of the Phase 43 contract above.

## 6. Current Audit Position

The V15 MVP currently has:
- validated controller operation ordering;
- validated controller rollback on failed async operations;
- validated domain enum invariants;
- validated UI escaping for persisted mastery status;
- validated Student → Term → ProgrammeItem ownership;
- validated Lesson → Term and Homework → Lesson ownership;
- validated atomic backup restore, Student cascade deletion, bulk ProgrammeItem completion, and Student + initial Term creation;
- acknowledged multi-writer limits and the remaining non-transactional multi-step workflows under this contract.

The distinction is intentional:

**Controller serialization solves operation ordering inside one controller instance. It does not create a database transaction boundary.**

## 7. Homework / Practice Plan Contract

Homework remains **lesson-owned** and the single source of truth for teacher-assigned home practice.

The V15 Homework record may contain an optional `practicePlan`:
- `totalMinutes`;
- `tasks[]` referencing homework items by stable array index for the current record;
- task `minutes` and teacher-editable `focus`;
- `generatedBy` and `generatedAt` provenance.

The V1 Practice Planner is deterministic and domain-aware. It organises **how to practise teacher-selected homework**; it does not select curriculum, alter ProgrammeItems, change progression, or assess mastery.

The practice plan is a derived/teacher-approved layer attached to Homework. It is not a second curriculum source of truth.

V15 does not persist Viber or parent communication text. Those are derived outputs from the saved Homework + Practice Plan and remain outside the persistence contract.


## Phase 44 — Teacher Agenda Weekly Schedule Integration

The Teacher Agenda now treats Student.lessonSchedule as the recurring weekly schedule source for teacher planning.

Locked rules:
- A Student may have one or two weekly lesson slots.
- Each slot contains a weekday and time.
- Duplicate weekdays are rejected.
- The recurring schedule remains student-owned; it is not duplicated into Term or Lesson records.
- Lesson records remain dated occurrences and are matched to a scheduled slot when they exist.
- The Agenda derives a Monday–Sunday week from the selected agenda date.
- Legacy students with lessonDay/lessonTime but no lessonSchedule remain readable through a compatibility fallback.
- Opening a scheduled Agenda entry may create the dated Lesson only when an active Term covers that date.
- Agenda UI is progressive-disclosure: schedule first, then the existing lesson workflow, homework, programme and intelligence.


### Phase 45 — Teacher Agenda Daily Cockpit Integration

The weekly Teacher Agenda is now the teacher's scheduling entry point into the existing Lesson Session workflow.

Locked rules:
- Selecting a scheduled Agenda entry selects the corresponding Student and active Term.
- If a dated Lesson already exists for the entry, that existing Lesson is opened; a duplicate Lesson is not created.
- If no Lesson exists, the dated Lesson may be created only when the selected Term covers the scheduled date.
- Opening an Agenda entry refreshes the Agenda state so the entry can reflect its current lesson state.
- While the selected Lesson is active, the Agenda may display `In progress`.
- Ending a Lesson clears the active lesson state, persists the lesson details, refreshes lesson history/intelligence, and refreshes the Agenda.
- A recorded occurrence is represented by the existing Lesson record and its attendance/status; the recurring Student.lessonSchedule remains unchanged.
- The Student roster displays all configured weekly lesson slots, while preserving the legacy single-slot fallback.
- These states are UI projections over existing persisted Student/Term/Lesson data; no duplicate schedule state is introduced into Lesson.


Additional Phase 45 resilience rule:
- Initial student loading is not rolled back merely because the derived Agenda read fails. Student persistence remains visible while the Agenda error is surfaced separately.
- This prevents a derived scheduling/view failure from appearing as student data loss.


### Phase 46 — Weekly Programme Planning Cockpit

The Weekly Programme is the teacher's planning surface for assigning the active TKTL programme items to teaching weeks.

Locked rules:
- Each persisted ProgrammeItem has one authoritative `targetWeek`; planning changes that field rather than creating a second schedule record.
- A teacher may move a pending core ProgrammeItem directly to any positive teaching week exposed by the UI.
- Moving an item between weeks does not mark it completed and does not alter lesson-review or homework records.
- Planning from the current term is term-scoped: a ProgrammeItem may only be reassigned when it belongs to the selected Term.
- The teacher remains on the current week after a planning change; the item simply leaves or enters the corresponding weekly view.
- The existing carry-forward workflow remains available as a convenience for moving an item to the next week.
- Scale items remain governed by the separate scale mastery workflow and are not converted into core planning actions.
- The Weekly Programme remains a projection of persisted ProgrammeItems; no duplicate planning state is introduced into the UI.
