# V13 Curriculum Architecture — LOCKED BASELINE

Status: LOCKED after verified user test.

## Working baseline

The V13 Scales curriculum is the reference implementation for all future curricula.

### Required architecture

Master page owns shared curriculum services/data.
The application iframe owns page DOM and navigation.
A single bridge synchronizes curriculum UI with the iframe's page context.

### Page scoping

Curriculum UI must be mounted only on its canonical curriculum page/tab.
Do not infer page scope from generic body text, H1/H2 text, arbitrary cards, or broad click matching.
Do not use an unrestricted MutationObserver render loop.

### Rendering lifecycle

1. Detect the actual curriculum page context.
2. Resolve student context.
3. Resolve level/term.
4. Resolve curriculum data through the shared curriculum layer.
5. Render only that curriculum's UI.
6. On leaving the page, remove that curriculum UI.
7. Guard repeated DOM mutations so rendering cannot recursively trigger itself.

### Selection contract

Selections must be represented independently from the curriculum renderer and passed through the canonical selection/state layer.
Lesson and Homework must receive only explicitly selected items, never the entire curriculum.

### Lesson handoff contract — LOCKED

For a teacher action of **Add selected to Lesson**, the bridge MUST perform this sequence:

1. Build the exact checked-item array.
2. Write the selection to `VIOLIN_AI_CURRICULUM_SELECTION_V2` under the explicit `studentId` and `lesson.scales` slot.
3. Verify that the canonical slot contains the same number of selected items.
4. Create an explicit `VIOLIN_AI_LESSON_HANDOFF_V1` transport snapshot containing the same `studentId` and exact selected items.
5. Navigate to `lesson-v13.html` with both `studentId` and the handoff token.
6. Lesson MUST consume the explicit handoff first, then canonical V2, then read-only legacy fallbacks.
7. If a valid handoff is consumed, Lesson may self-heal the canonical V2 slot, but MUST NOT enumerate curriculum data or generate additional selections.

The handoff is transport state, not a second curriculum database. It exists to make the transition deterministic across the Master/iframe/top-level navigation boundary.

### Future curricula

Technical Exercises, Études, Repertoire, and additional curricula must plug into the same architecture rather than creating parallel page-specific hacks.
Each curriculum gets its own data/adapter/renderer while sharing the common page-scoping, student-context, selection, Lesson, and Homework contracts.

### Change-control rule

Do not modify the locked Scales architecture merely to add another curriculum.
Future changes must preserve:
- page-scoped rendering;
- canonical student/level/term context;
- selection-only Lesson/Homework transfer;
- explicit Lesson handoff for cross-page selection transfer;
- render-loop protection;
- separation between Master services and iframe DOM.

Any architectural change must be tested against the existing Scales flow before being accepted.

## Verification status

The Scales UI remains page-scoped and the Lesson path is now protected by an explicit, verified selection handoff plus canonical-store fallback/self-healing. Runtime browser verification should still be performed after deployment because GitHub Pages/browser caching cannot be inspected from repository code alone.
