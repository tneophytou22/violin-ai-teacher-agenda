# V15 Teacher Agenda browser demo

This is the browser entry point for the V15 TKTL Teacher Agenda.

## Open locally

From the repository root:

```bash
cd v15
python3 -m http.server 8080
```

Then open:

```
http://localhost:8080/ui/demo/
```

Keep the terminal running while using the demo.

## What the demo seeds

On a new browser profile/database it creates:

- Demo Student
- 2026–27 Term 1
- Level 1 · Term 1

The V15 application then activates the canonical TKTL card and generates the 15 programme items:

- 5 Pure Technical
- 5 Etudes
- 5 Repertoire

The demo uses IndexedDB through the V15 StorageService.

## Reset the demo

To start again with an empty database, open the browser developer tools and delete the site data for `localhost:8080`, then reload.

## Basic flow to test

1. Select **Demo Student**.
2. Confirm **L1 · Term 1**.
3. Check that the weekly agenda contains the three curriculum domains.
4. Start a lesson.
5. Select/complete programme items.
6. Use **Review selected**.
7. Use **Carry** on an unfinished item and move it to the next week.
