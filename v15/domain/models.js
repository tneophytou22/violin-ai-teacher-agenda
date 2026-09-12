export const LEVELS = Object.freeze(Array.from({ length: 10 }, (_, i) => `L${i + 1}`));

const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

export function createStudent({ name, schoolType = 'PRIVATE', instrument = 'VIOLIN' }) {
  if (!name?.trim()) throw new Error('Student name is required');
  return { id: id('stu'), name: name.trim(), schoolType, instrument, createdAt: new Date().toISOString() };
}

export function createTerm({ studentId, name, startDate, endDate, level = null }) {
  if (!studentId) throw new Error('Term.studentId is required');
  if (!name?.trim()) throw new Error('Term name is required');
  return { id: id('term'), studentId, name: name.trim(), startDate, endDate, level, version: 1 };
}

export function createProgrammeItem({ termId, curriculumId, curriculumDomain, objectId, title, targetWeek, status = 'PLANNED' }) {
  if (!termId) throw new Error('ProgrammeItem.termId is required');
  if (!curriculumId || !curriculumDomain || !objectId) throw new Error('ProgrammeItem curriculum identity is required');
  if (!Number.isInteger(targetWeek) || targetWeek < 1) throw new Error('ProgrammeItem.targetWeek is mandatory');
  return { id: id('pi'), termId, curriculumId, curriculumDomain, objectId, title, targetWeek, status, completedAt: status === 'COMPLETED' ? new Date().toISOString() : null };
}

export function createLesson({ termId, date, mark = null, attendance = 'PRESENT', reviewedProgrammeItemIds = [] }) {
  if (!termId) throw new Error('Lesson.termId is required');
  if (!date) throw new Error('Lesson.date is required');
  if (mark !== null && (!Number.isInteger(mark) || mark < 1 || mark > 20)) throw new Error('Lesson.mark must be 1–20');
  return { id: id('lesson'), termId, date, mark, attendance, reviewedProgrammeItemIds: [...reviewedProgrammeItemIds], version: 1 };
}

export function createHomework({ lessonId, items = [] }) {
  if (!lessonId) throw new Error('Homework.lessonId is required');
  return { id: id('hw'), lessonId, items: items.map(item => ({ ...item })), version: 1 };
}
