import { createLesson } from '../domain/models.js';

const ATTENDANCE_VALUES = new Set(['PRESENT', 'ABSENT', 'LATE']);

export class LessonService {
  constructor(repo) { this.repo = repo; }

  async create(input) {
    const term = await this.repo.get('terms', input.termId);
    if (!term) throw new Error('Cannot create lesson for unknown term');
    return this.repo.put('lessons', createLesson(input));
  }

  get(lessonId) { return this.repo.get('lessons', lessonId); }

  async listForTerm(termId) {
    const lessons = await this.repo.list('lessons');
    return lessons
      .filter(l => l.termId === termId)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
  }

  async updateDetails(lessonId, { mark = null, attendance = 'PRESENT' } = {}) {
    const lesson = await this.get(lessonId);
    if (!lesson) throw new Error('Lesson not found');
    if (mark !== null && (!Number.isInteger(mark) || mark < 1 || mark > 20)) {
      throw new Error('Lesson.mark must be 1–20 or null');
    }
    if (!ATTENDANCE_VALUES.has(attendance)) {
      throw new Error('Lesson.attendance must be PRESENT, ABSENT or LATE');
    }
    lesson.mark = mark;
    lesson.attendance = attendance;
    lesson.version += 1;
    return this.repo.put('lessons', lesson);
  }

  async reviewProgrammeItems(lessonId, programmeItemIds) {
    const lesson = await this.get(lessonId);
    if (!lesson) throw new Error('Lesson not found');
    const items = await this.repo.list('programmeItems');
    const allowed = new Set(items.filter(i => i.termId === lesson.termId).map(i => i.id));
    if (programmeItemIds.some(id => !allowed.has(id))) throw new Error('Reviewed ProgrammeItem does not belong to the lesson term');
    lesson.reviewedProgrammeItemIds = [...new Set([
      ...(lesson.reviewedProgrammeItemIds ?? []),
      ...programmeItemIds,
    ])];
    lesson.version += 1;
    return this.repo.put('lessons', lesson);
  }
}
