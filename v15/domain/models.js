export const LEVELS = Object.freeze(Array.from({ length: 10 }, (_, i) => `L${i + 1}`));

export const PROGRAMME_ITEM_STATUSES = Object.freeze(['PLANNED', 'COMPLETED']);
export const ATTENDANCE_STATUSES = Object.freeze(['PRESENT', 'ABSENT', 'LATE']);
export const LESSON_DAYS = Object.freeze(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);

export const TEACHER_READINESS_DECISIONS = Object.freeze([
  'ADVANCE_TO_NEXT_TERM',
  'CONTINUE_CURRENT_TERM',
  'TARGETED_REVIEW_BEFORE_ADVANCE',
]);

const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

export function createStudent({ name, phone = '', schoolType = 'PRIVATE', schoolName = '', instrument = 'VIOLIN', lessonDay = '', lessonTime = '', lessonSchedule = [] }) {
  if (!name?.trim()) throw new Error('Student name is required');
  if (typeof phone !== 'string') throw new Error('Student.phone must be a string');
  if (typeof schoolName !== 'string') throw new Error('Student.schoolName must be a string');
  if (typeof lessonDay !== 'string') throw new Error('Student.lessonDay must be a string');
  if (typeof lessonTime !== 'string') throw new Error('Student.lessonTime must be a string');
  if (!Array.isArray(lessonSchedule)) throw new Error('Student.lessonSchedule must be an array');
  if (lessonSchedule.length > 2) throw new Error('Student.lessonSchedule supports a maximum of 2 weekly lessons');
  const normalizedSchedule = lessonSchedule.map(slot => {
    if (!slot || typeof slot !== 'object') throw new Error('Student.lessonSchedule entries must be objects');
    if (!LESSON_DAYS.includes(slot.day)) throw new Error('Student.lessonSchedule day is invalid');
    if (typeof slot.time !== 'string' || !slot.time) throw new Error('Student.lessonSchedule time is required');
    return { day: slot.day, time: slot.time };
  });
  if (new Set(normalizedSchedule.map(slot => slot.day)).size !== normalizedSchedule.length) {
    throw new Error('Student.lessonSchedule cannot contain the same day twice');
  }
  const legacyDay = normalizedSchedule[0]?.day ?? lessonDay;
  const legacyTime = normalizedSchedule[0]?.time ?? lessonTime;
  return {
    id: id('stu'), name: name.trim(), phone: phone.trim(), schoolType, schoolName: schoolName.trim(), instrument,
    lessonDay: legacyDay.trim(), lessonTime: legacyTime.trim(),
    lessonSchedule: normalizedSchedule,
    createdAt: new Date().toISOString(),
  };
}

export function updateStudent(student, changes = {}) {
  if (!student?.id) throw new Error('Student.id is required');
  const merged = {
    name: changes.name ?? student.name,
    phone: changes.phone ?? student.phone ?? '',
    schoolType: changes.schoolType ?? student.schoolType ?? 'PRIVATE',
    schoolName: changes.schoolName ?? student.schoolName ?? '',
    instrument: changes.instrument ?? student.instrument ?? 'VIOLIN',
    lessonDay: changes.lessonDay ?? student.lessonDay ?? '',
    lessonTime: changes.lessonTime ?? student.lessonTime ?? '',
    lessonSchedule: changes.lessonSchedule ?? student.lessonSchedule ?? [],
  };
  const validated = createStudent(merged);
  return {
    ...validated,
    id: student.id,
    createdAt: student.createdAt ?? validated.createdAt,
  };
}

export function createTerm({ studentId, name, startDate, endDate, level = null, termNumber = 1, readinessDecision = null, readinessDecisionNote = '', readinessDecisionAt = null }) {
  if (!studentId) throw new Error('Term.studentId is required');
  if (!name?.trim()) throw new Error('Term name is required');
  if (level !== null && (!Number.isInteger(level) || level < 1 || level > 10)) throw new Error('Term.level must be an integer from 1–10 or null');
  if (!Number.isInteger(termNumber) || termNumber < 1 || termNumber > 2) throw new Error('Term.termNumber must be 1 or 2');
  if (readinessDecision !== null && !TEACHER_READINESS_DECISIONS.includes(readinessDecision)) {
    throw new Error('Term.readinessDecision is invalid');
  }
  if (typeof readinessDecisionNote !== 'string') throw new Error('Term.readinessDecisionNote must be a string');
  if (readinessDecisionAt !== null && typeof readinessDecisionAt !== 'string') {
    throw new Error('Term.readinessDecisionAt must be a string or null');
  }
  return {
    id: id('term'), studentId, name: name.trim(), startDate, endDate, level, termNumber,
    readinessDecision, readinessDecisionNote: readinessDecisionNote.trim(), readinessDecisionAt, version: 1,
  };
}

export function createProgrammeItem({ termId, curriculumId, curriculumDomain, objectId, title, targetWeek, status = 'PLANNED', cardId = null, details = null }) {
  if (!termId) throw new Error('ProgrammeItem.termId is required');
  if (!curriculumId || !curriculumDomain || !objectId) throw new Error('ProgrammeItem curriculum identity is required');
  if (!Number.isInteger(targetWeek) || targetWeek < 1) throw new Error('ProgrammeItem.targetWeek is mandatory');
  if (!PROGRAMME_ITEM_STATUSES.includes(status)) throw new Error('ProgrammeItem.status must be PLANNED or COMPLETED');
  return { id: id('pi'), termId, curriculumId, curriculumDomain, objectId, title, targetWeek, status, cardId, details, completedAt: status === 'COMPLETED' ? new Date().toISOString() : null };
}

export function createLesson({ termId, date, mark = null, attendance = 'PRESENT', teacherNote = '', reviewedProgrammeItemIds = [] }) {
  if (!termId) throw new Error('Lesson.termId is required');
  if (!date) throw new Error('Lesson.date is required');
  if (mark !== null && (!Number.isInteger(mark) || mark < 1 || mark > 20)) throw new Error('Lesson.mark must be 1–20');
  if (!ATTENDANCE_STATUSES.includes(attendance)) throw new Error('Lesson.attendance must be PRESENT, ABSENT or LATE');
  if (typeof teacherNote !== 'string') throw new Error('Lesson.teacherNote must be a string');
  if (!Array.isArray(reviewedProgrammeItemIds) || reviewedProgrammeItemIds.some(id => typeof id !== 'string' || !id)) {
    throw new Error('Lesson.reviewedProgrammeItemIds must be an array of non-empty IDs');
  }
  return { id: id('lesson'), termId, date, mark, attendance, teacherNote: teacherNote.trim(), reviewedProgrammeItemIds: [...reviewedProgrammeItemIds], version: 1 };
}

export function createHomework({ id: homeworkId = null, lessonId, items = [], practicePlan = null }) {
  if (!lessonId) throw new Error('Homework.lessonId is required');
  if (!Array.isArray(items)) throw new Error('Homework.items must be an array');
  if (practicePlan !== null && typeof practicePlan !== 'object') throw new Error('Homework.practicePlan must be an object or null');
  return {
    id: homeworkId ?? id('hw'),
    lessonId,
    items: items.map(item => ({ ...item })),
    practicePlan: practicePlan ? {
      totalMinutes: practicePlan.totalMinutes,
      tasks: (practicePlan.tasks ?? []).map(task => ({ ...task })),
      generatedBy: practicePlan.generatedBy,
      generatedAt: practicePlan.generatedAt,
    } : null,
    version: 1,
  };
}
