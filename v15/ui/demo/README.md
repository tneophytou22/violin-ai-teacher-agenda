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

The V15 application then activates the canonical TKTL card and generates the **15 core programme items plus the scale requirements** defined by the active Level×Term card.

For the current L1 · Term 1 demo this is:

- 5 Pure Technical
- 5 Etudes
- 5 Repertoire
- 6 Scale requirements

The core programme remains a fixed 15-item contract. Scale requirements are tracked separately and do not count toward the 15 core items.

The demo uses IndexedDB through the V15 StorageService.

## Reset the demo

To start again with an empty database, open the browser developer tools and delete the site data for `localhost:8080`, then reload.

## Basic flow to test

1. Select **Demo Student**.
2. Confirm **L1 · Term 1**.
3. Check the weekly agenda for the three core curriculum domains and the separate **Scales** domain.
4. Check **Scale Progress / Mastery** and the scale assessment controls.
5. Start a lesson.
6. Select/review/complete programme items.
7. Use **Review selected** without completing the item.
8. Use **Carry** on an unfinished item and move it to the next week.
9. Save lesson details and homework, then reopen the historical lesson.
10. Refresh the browser and confirm programme completion and scale mastery persist independently.
