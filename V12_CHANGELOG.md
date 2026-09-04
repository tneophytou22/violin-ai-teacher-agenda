# VIOLIN AI Teacher Agenda — V12 locked upgrade plan

## Data safety (LOCKED)
- Never reset or overwrite existing student data during an update.
- Preserve the existing V11 localStorage data model and migrate non-destructively when new fields are added.
- Google Drive backup/restore remains compatible.
- Before release: verify students, repertoire, scales, etudes, technique, homework, planner and assessments survive an upgrade.

## V12 features (LOCKED)
- School students and Private students have distinct visual highlights.
- Per-student Viber number.
- Lesson Assessment with quick scores from 1–20 for repertoire/scales/etudes/technique and other lesson items.
- Quarterly Progress uses a 20-point grading scale and generates an encouraging report: 3–4 progress points, 3–4 focus points, and next-term plan.
- Violin AI recommendations use the student's level, repertoire, scales, etudes, technique, lesson assessments and progress history.
- AI can recommend exercises, repertoire, scales, etudes and technique priorities; teacher approval is required before saving recommendations.
- Generate Daily Planner from current student data and assessments.
- Homework voice input should produce clean text without incremental-transcription duplication.
- Viber homework message should be clear for parent/student.
- Google Drive backup/restore must remain available.

## Release rule
Build and test V12 against the existing V11 data model. Do not deploy a replacement that requires re-entering students.
