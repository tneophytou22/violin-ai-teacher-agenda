# V15 Architecture Contract

Status: LOCKED FOR V15 MVP  
Baseline: `96cedaf90844963f8380aad9e1489f4334f2ae51`  
Phase: 42 — Architecture Decision Gate

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

V15 persistence guarantees atomicity at the level of an individual repository write/delete transaction.

A business operation composed of multiple repository writes is **not** currently atomic.

Examples:
- activating a TKTL card may perform multiple ProgrammeItem writes;
- completing multiple ProgrammeItems may perform multiple writes;
- homework assignment performs a read → decide → write sequence.

Therefore V15 does not promise all-or-nothing semantics for multi-record business operations.

A future requirement for business-operation atomicity must introduce an explicit repository transaction/batch contract rather than relying on controller serialization.

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

V15 currently has **no domain-level delete workflow** for Student, Term, Lesson, ProgrammeItem, or Homework.

The repository adapter exposes raw delete capability, but application workflows do not use it as a domain deletion operation.

Therefore V15 currently makes no product-level promise for:
- cascade delete;
- restrict delete;
- archive;
- soft delete;
- orphan repair.

No delete policy should be implemented speculatively.

When deletion becomes a product requirement, the policy must be selected explicitly and then enforced through domain/application services rather than exposing raw repository deletion to normal teacher workflows.

## 5. Consequence for Future Phases

These decisions deliberately prevent premature architectural expansion.

Do not add, solely in response to the current audit:
- database locks;
- IndexedDB unique indexes;
- a DB schema version bump;
- a general transaction abstraction;
- curriculum versioning;
- delete cascades.

Such changes require a phase with an explicit contract and tests for the chosen behavior.

## 6. Current Audit Position

The V15 MVP currently has:
- validated controller operation ordering;
- validated controller rollback on failed async operations;
- validated domain enum invariants;
- validated UI escaping for persisted mastery status;
- validated Student → Term → ProgrammeItem ownership;
- validated Lesson → Term and Homework → Lesson ownership;
- acknowledged multi-writer and multi-record atomicity limits under this contract.

The distinction is intentional:

**Controller serialization solves operation ordering inside one controller instance. It does not create a database transaction boundary.**
