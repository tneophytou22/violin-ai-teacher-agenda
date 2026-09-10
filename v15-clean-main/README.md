# Violin AI Teacher Agenda — V15

Clean standalone rebuild.

## Architectural rule
V15 has no runtime dependency on V12/V13/V14 or any legacy application file.

Legacy versions are reference/archive material only.

## Build order
1. Core domain and state contracts
2. Storage / Google Drive service boundary
3. Students, Terms and Timetable
4. Term Programme and weekly planning
5. Lessons
6. Homework
7. Marks / Attendance / Progress
8. Reports
9. Curriculum modules: Scales, Études, Technique, Repertoire
10. UI integration and end-to-end testing

## Curriculum rule
Scales and ÉTUDES are independent curriculum modules. Their official source data will be supplied and validated before being imported into V15.

## Safety rule
Do not delete or modify legacy branches/files until V15 has passed end-to-end verification and explicit release approval.
