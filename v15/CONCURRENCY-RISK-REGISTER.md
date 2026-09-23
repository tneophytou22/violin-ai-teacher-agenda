# V15 Concurrency Risk Register

Status: AUDITED — NO CODE CHANGE  
Phase: 43 — Concurrency Risk Containment  
Baseline: `c0ee560d568672d90199426ffe9df72478e8a8bf`

This register evaluates the concurrency risks against the locked V15 Architecture Contract.

## Contract boundary

V15 supports a single-teacher, single-controller, single-browser-session workflow. Controller-level asynchronous operations are serialized. Database-level multi-writer coordination and multi-record transactions are not part of the V15 contract.

## Risk 1 — TKTL card activation

**Path:** `TeacherTermService.activateCard()`

Current behavior:
1. list existing ProgrammeItems;
2. derive logical identity from `termId + cardId + objectId`;
3. create missing ProgrammeItems with random business IDs.

Risk:
- two independent writers can both observe the same logical item as absent;
- both can create different record IDs for the same logical curriculum object;
- no IndexedDB unique index enforces the logical identity.

Assessment: **OPEN for future multi-writer support.**

V15 containment:
- normal controller workflow serializes calls within one controller;
- current contract does not support concurrent independent writers.

Do not add a unique index or locking mechanism in Phase 43.

## Risk 2 — Multi-item completion

**Path:** `LessonProgrammeService.completeItems()`

Current behavior:
- validates that all requested IDs exist;
- rejects foreign-term items through the term-aware entry point;
- writes each changed ProgrammeItem separately.

Risk:
- if a later write fails after an earlier write succeeds, the operation can leave a partial completion set.

Assessment: **OPEN for future business-transaction support.**

V15 containment:
- preflight validation prevents known invalid-item failures before writes;
- controller serialization prevents overlapping controller operations;
- individual IndexedDB writes are atomic.

This does not provide all-or-nothing multi-record semantics.

Do not introduce a transaction abstraction in Phase 43.

## Risk 3 — Homework assignment

**Path:** `HomeworkService.assignHomework()`

Current behavior:
- deterministic identity: `hw_<lessonId>`;
- existing record is updated, otherwise a new record is inserted.

Strength:
- deterministic identity prevents two first assignments from becoming two different homework records.

Remaining risk:
- two independent writers can read the same version and overwrite each other's changes;
- there is no compare-and-swap or optimistic concurrency check.

Assessment: **OPEN for future multi-writer/versioned editing.**

V15 containment:
- single controller serialization is sufficient for the current supported workflow.

## Risk 4 — Repository transaction boundary

**Path:** `IndexedDBRepository`

Current behavior:
- `get` and `list` use individual readonly transactions;
- `put` and `delete` use individual readwrite transactions;
- no cross-operation transaction API exists.

Assessment: **OPEN by design.**

This is consistent with the V15 transaction contract. A future atomic business operation must be implemented as an explicit repository transaction/batch capability.

## Phase 43 conclusion

No code change is justified under the locked V15 contract.

The audit therefore records:

- 🟢 Controller concurrency containment: implemented and validated.
- 🟢 Preflight validation before multi-item completion: implemented.
- 🟢 Deterministic homework identity: implemented.
- 🟡 Multi-item transaction atomicity: future capability.
- 🟠 Multi-writer activation uniqueness: future capability.
- 🟡 Homework optimistic concurrency: future capability.

### Next trigger for implementation

A concurrency implementation phase becomes justified when the product contract changes to support any of:

- multiple browser tabs/windows editing the same teacher data;
- multiple devices editing the same teacher data;
- concurrent teachers/users;
- required all-or-nothing multi-record operations;
- conflict detection/resolution for concurrent edits.

Until then, the correct V15 behavior is to preserve the existing architecture and avoid speculative database complexity.
