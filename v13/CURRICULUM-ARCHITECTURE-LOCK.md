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

Selections are independent from the curriculum renderer and are represented as exact selected-item arrays.
Lesson and Homework receive only explicitly selected items, never the entire curriculum.

### Lesson transport contract — LOCKED

For **Add selected to Lesson**, the Scales owner MUST:

1. Build the exact checked-item array.
2. Write the exact selection to `VIOLIN_AI_CURRICULUM_SELECTION_V2` under the explicit `studentId` and `lesson.scales` slot as a persistence mirror.
3. Navigate to `lesson-v13.html` with `studentId` and an explicit `selection` URL snapshot containing the same student context and exact selected items.
4. Lesson MUST consume and validate the explicit URL snapshot first.
5. If the URL snapshot is absent/invalid, Lesson may fall back to the canonical V2 `lesson.scales` slot, then the read-only legacy selection store.
6. When a valid URL snapshot is consumed, Lesson may self-heal the canonical V2 slot and active lesson store.
7. Lesson MUST NOT enumerate curriculum data or create new selections during handoff.

The URL snapshot is transport state, not a second curriculum database. The canonical V2 store remains persistence state. This separation makes the cross-page transition deterministic while keeping one source of truth for selection semantics.

### Scale display contract — LOCKED

A selected Scale item in Lesson must retain and display the technical information carried by the curriculum data. The Lesson display exposes the available technical requirement fields:

- Octaves
- Positions
- Bowing
- Articulation
- Rhythm
- Accents
- Dynamics
- Tempo

It also displays the curriculum `Objective` and `Mastery` statements when present. Empty/unavailable fields are omitted rather than fabricated.

The source curriculum data currently defines these fields in `v13/curriculum/scales-data.js`, including bowing, articulation, rhythm, accents, dynamics, tempo, positions, objective and mastery. fileciteturn1110file0L2-L5

### Future curricula

Technical Exercises, Études, Repertoire, and additional curricula must plug into the same architecture rather than creating parallel page-specific hacks.
Each curriculum gets its own data/adapter/renderer while sharing the common page-scoping, student-context, selection, Lesson, and Homework contracts.

### Change-control rule

Do not modify the locked Scales architecture merely to add another curriculum.
Future changes must preserve:
- page-scoped rendering;
- canonical student/level/term context;
- selection-only Lesson/Homework transfer;
- explicit validated Lesson transport;
- render-loop protection;
- separation between Master services and iframe DOM;
- preservation of Scale technical requirements in the selected-item payload.

Any architectural change must be tested against the existing Scales flow before being accepted.

## Verification status

The Scales → Lesson selection flow has been runtime-verified by the user: one selected scale appeared under **Selected Curriculum** and also under **Today's Teacher Plan**. The Lesson renderer now additionally exposes the available Scale technical requirements and Objective/Mastery without changing the selection transport.
