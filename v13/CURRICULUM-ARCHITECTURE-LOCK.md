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

### Future curricula

Technical Exercises, Études, Repertoire, and additional curricula must plug into the same architecture rather than creating parallel page-specific hacks.
Each curriculum gets its own data/adapter/renderer while sharing the common page-scoping, student-context, selection, Lesson, and Homework contracts.

### Change-control rule

Do not modify the locked Scales architecture merely to add another curriculum.
Future changes must preserve:
- page-scoped rendering;
- canonical student/level/term context;
- selection-only Lesson/Homework transfer;
- render-loop protection;
- separation between Master services and iframe DOM.

Any architectural change must be tested against the existing Scales flow before being accepted.

## Verification status

User-confirmed working baseline: Curriculum Scales appears on the Scales page and the application remains navigable without the previous freeze.
