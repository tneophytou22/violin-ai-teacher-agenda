# V15 Core Domain Model V1 — Review Draft

Status: ARCHITECTURE DRAFT — NOT PRODUCTION

## Purpose
Define the stable domain boundaries before UI or feature implementation.

## Entities

### Student
Represents the teacher's student record.
- id
- name
- dateOfBirth (optional)
- contact information (optional)
- notes (optional)
- active

Owns identity only. It does not own lessons, homework, curriculum definitions, or reports.

### Term
Represents a teaching period for one student or the teacher's configured term period.
- id
- name
- startDate
- endDate
- status

Term owns the period definition. Week calculation is derived from dates + timetable, not manually stored as authoritative data.

### TimetableEntry
Represents a recurring scheduled lesson slot.
- id
- studentId
- dayOfWeek
- startTime
- duration
- activeFrom
- activeTo (optional)

Timetable is the source for determining expected lesson occurrences.

### TermWeek
A derived planning value, not an independent source of truth.
- termId
- weekNumber
- startDate
- endDate
- expectedLessonCount

### Lesson
Represents an actual lesson occurrence.
- id
- studentId
- termId
- timetableEntryId (optional)
- dateTime
- status
- notes
- mark (1–20, optional)
- attendance

Lesson records what happened. It does not own curriculum definitions.

### TermProgramme
Represents the student's expected work for a specific Term.
- id
- studentId
- termId
- items[]

The programme is the authoritative set of expected term work.

### ProgrammeItem
Represents one selected curriculum/work item in a student's Term Programme.
- id
- programmeId
- curriculumItemId
- curriculumDomain
- titleSnapshot (optional display snapshot)
- status: Not Started | In Progress | Completed
- targetWeek (optional)
- completedAt (optional)

A ProgrammeItem references a curriculum item by stable ID but does not own the curriculum definition.

### Homework
Represents an assignment generated from a lesson.
- id
- studentId
- lessonId
- assignedAt
- items[]
- teacherMessage (optional)
- viberMessage (derived/generated, not source of truth)

Homework is a record of what the teacher assigned, not a duplicate Term Programme.

### HomeworkItem
Represents one explicitly assigned item.
- id
- homeworkId
- sourceProgrammeItemId (optional)
- curriculumItemId (optional)
- titleSnapshot
- notes
- status

Homework must be created only from explicitly selected items.

### Assessment
Optional structured assessment associated with a lesson.
- id
- lessonId
- category
- mark (1–20)
- comment

### Attendance
Lesson attendance state.
- lessonId
- status

### ProgressRecord
Derived/recorded progress information for a programme item at a point in time.
- id
- programmeItemId
- weekNumber
- status
- recordedAt

Progress must be derived from programme state and lesson/activity data where appropriate; it must not create a second authoritative programme state.

### Report
Represents a generated report for a student and term.
- id
- studentId
- termId
- type: MID_TERM | END_TERM
- generatedAt
- language: el
- content
- sourceVersion

Report content is generated from Agenda data. The report is not the source of truth for progress or marks.

## Curriculum Boundary
CurriculumItem is an interface/contract concept, not a single combined curriculum database.

Each domain remains independently owned:
- Scales
- Études / Study / Caprice
- Technique
- Repertoire

Each module exposes curriculum items through a common contract. The Core must not contain Scales-specific, Études-specific, or other domain-specific curriculum logic.

## Relationship Rules

Student
→ Terms
→ TermProgramme
→ ProgrammeItems

Student
→ TimetableEntries
→ Lesson occurrences

Lesson
→ Homework
→ HomeworkItems

Lesson
→ Assessment / Mark
→ Attendance

ProgrammeItems + lesson/activity data
→ Progress

Progress + marks + attendance + programme data
→ Reports

## Explicit Non-Ownership Rules

- Student does not render UI.
- Term does not calculate UI state.
- Lesson does not own curriculum data.
- Homework does not redefine the Term Programme.
- Reports do not own progress data.
- Curriculum modules do not own Lessons or Homework.
- No entity writes directly to Google Drive.
- No entity writes directly to browser storage.

## Open Questions For Reviewer

1. Whether Term is teacher-global with student membership or student-specific.
2. Whether Assessment should be embedded in Lesson or remain a separate entity.
3. Exact attendance enum.
4. Whether ProgrammeItem targetWeek should be mandatory for schedule tracking.
5. Exact CurriculumItem contract and module registration mechanism.
6. Whether ProgressRecord should be persisted or derived entirely.
