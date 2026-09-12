import { createLesson } from '../domain/models.js';

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
    return lessons.filter(l => l.termId === termId);
  }
  async reviewProgrammeItems(lessonId, programmeItemIds) {
    const lesson = await this.get(lessonId);
    if (!lesson) throw new Error('Lesson not found');
    const items = await this.repo.list('programmeItems');
    const allowed = new Set(items.filter(i => i.termId === lesson.termId).map(i => i.id));
    if (programmeItemIds.some(id => !allowed.has(id))) throw new Error('Reviewed ProgrammeItem does not belong to the lesson term');
    lesson.reviewedProgrammeItemIds = [...new Set(programmeItemIds)];
    lesson.version += 1;
    return this.repo.put('lessons', lesson);
  }
}
