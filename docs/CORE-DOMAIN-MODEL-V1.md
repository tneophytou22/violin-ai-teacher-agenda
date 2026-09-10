# V15 Core Domain Model V1 — Review Draft

Status: ARCHITECTURE DRAFT — CHECKPOINT 1 — REQUIRED CHANGES APPLIED

## Purpose
Define stable domain boundaries before UI or feature implementation.

## Entity Ownership

### Student
Teacher's student record.
- id
- name
- dateOfBirth (optional)
- contact information (optional)
- notes (optional)
- active

Student owns identity only. It does not own lessons, homework, curriculum definitions, progress calculations, or reports.

### Term
A teaching period belonging to one student.
- id
- studentId
- name
- startDate
- endDate
- status

A Term is explicitly student-specific. Term weeks are derived from Term dates and the student's active timetable; they are not independently authoritative stored entities.

### TimetableEntry
Recurring scheduled lesson slot for a student.
- id
- studentId
- dayOfWeek
- startTime
- duration
- activeFrom
- activeTo (optional)

TimetableEntry is the source for expected lesson occurrences.

### TermWeek
Derived planning projection only.
- termId
- weekNumber
- startDate
- endDate
- expectedLessonCount

TermWeek is never an independent source of truth.

### Lesson
Actual lesson occurrence.
- id
- studentId
- termId
- timetableEntryId (optional)
- dateTime
- status
- notes
- mark (1–20, optional)
- attendance

Lesson is the sole owner of the lesson-level mark and attendance for the current product scope. It does not own curriculum definitions.

### TermProgramme
Expected work for one student in one Term.
- id
- studentId
- termId
- items[]

The TermProgramme is the authoritative set of expected term work.

### ProgrammeItem
One expected curriculum/work item in a student's Term Programme.
- id
- programmeId
- curriculumItemId
- curriculumDomain
- titleSnapshot (optional display snapshot)
- status: Not Started | In Progress | Completed
- targetWeek (required)
- completedAt (optional)

`targetWeek` is required for schedule tracking. ProgrammeItem references a curriculum item by stable ID but does not own its definition.

### Homework
Assignment generated from a Lesson.
- id
- studentId
- lessonId
- assignedAt
- items[]
- teacherMessage (optional)
- viberMessage (derived/generated, not source of truth)

Homework records what the teacher explicitly assigned. It is not a duplicate TermProgramme.

### HomeworkItem
One explicitly assigned homework item.
- id
- homeworkId
- sourceProgrammeItemId (optional)
- curriculumItemId (optional)
- titleSnapshot
- notes
- status

Homework is created only from explicitly selected items. The TermProgramme remains authoritative for term expectations.

### Assessment
Not a separate mark owner in V15 V1.

If future structured assessments are required, they must use a separate contract without duplicating the Lesson's authoritative 1–20 lesson mark.

### Attendance
Not a separate persistence owner in V15 V1.

Attendance is owned by Lesson. A future attendance service may operate on Lesson records but must not create a second authoritative attendance state.

## Progress

Progress is a derived application-level projection from authoritative TermProgramme/ProgrammeItem state, target weeks, and relevant lesson/activity data.

V15 V1 does NOT create a second authoritative `ProgressRecord` store.

Progress calculations must be deterministic and independently testable. Historical lesson records remain the evidence from which progress can be recalculated.

## Report
Generated report for one student and one Term.
- id
- studentId
- termId
- type: MID_TERM | END_TERM
- generatedAt
- language: el
- content
- sourceVersion

There are exactly two report types per Term: Mid-Term and End-of-Term. Reports are generated from Agenda data and never become the source of truth for marks, attendance, programme status, or progress.

## Curriculum Boundary

CurriculumItem is a shared contract concept, not one combined curriculum implementation.

Independently owned modules:
- Scales
- Études / Study / Caprice
- Technique
- Repertoire

Each module exposes curriculum items through the shared contract. No curriculum module depends on another curriculum module's implementation.

The Core does not contain domain-specific curriculum logic.

## Relationship Rules

Student
→ Term
→ TermProgramme
→ ProgrammeItems

Student
→ TimetableEntries
→ Lesson occurrences

Lesson
→ Homework
→ HomeworkItems

Lesson
→ Mark (1–20)
Lesson
→ Attendance

TermProgramme + ProgrammeItem statuses + target weeks + lesson/activity evidence
→ Progress projection

Progress + marks + attendance + programme data
→ Reports

## Expected vs Actual Progress

For each Term Week, the application can calculate:

Expected = programme work whose targetWeek is due by that week.

Actual = programme work whose authoritative ProgrammeItem status is Completed by that point, using recorded completion state and lesson/activity evidence where applicable.

The progress engine must define the exact calculation contract before implementation and must not store a competing progress percentage as authoritative state.

## Explicit Non-Ownership Rules

- Student does not render UI.
- Term does not calculate UI state.
- Timetable does not own Lesson history.
- Lesson owns lesson-level mark and attendance.
- Lesson does not own curriculum data.
- Homework does not redefine TermProgramme.
- Reports do not own progress, marks, or attendance.
- Curriculum modules do not own Lessons or Homework.
- No entity writes directly to Google Drive.
- No entity writes directly to browser storage.

## Architectural Acceptance Criteria

- One authoritative owner for every mutable business fact.
- No duplicate mark owner.
- No duplicate attendance owner.
- Every ProgrammeItem has a targetWeek.
- Progress is a calculation/projection, not a second source of truth.
- Term is explicitly associated with one Student.
- Curriculum modules remain independently replaceable.
- No iframe/bridge/page-to-page state dependency is part of the domain model.
- Storage implementation is outside the domain entities.

## Deferred Contracts

The following must be defined and reviewed before implementation of their respective layers:
1. Exact CurriculumItem contract and module registration mechanism.
2. Exact Lesson status enum.
3. Exact Attendance enum.
4. Progress calculation contract.
5. Google Drive StorageService contract.
