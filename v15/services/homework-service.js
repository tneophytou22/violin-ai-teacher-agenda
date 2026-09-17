import { createHomework } from '../domain/models.js';

const homeworkIdForLesson = lessonId => `hw_${lessonId}`;

export class HomeworkService {
  constructor(repo) { this.repo = repo; }

  async assignHomework({ lessonId, items }) {
    const lesson = await this.repo.get('lessons', lessonId);
    if (!lesson) throw new Error('Cannot assign homework to unknown lesson');

    // Homework is one record per lesson. Use a deterministic identity so
    // concurrent first assignments cannot create duplicate records.
    const id = homeworkIdForLesson(lessonId);
    const existing = await this.repo.get('homework', id);

    if (existing) {
      const updated = {
        ...existing,
        items: items.map(item => ({ ...item })),
        version: existing.version + 1
      };
      return this.repo.put('homework', updated);
    }

    return this.repo.put('homework', createHomework({
      id,
      lessonId,
      items
    }));
  }

  getForLesson(lessonId) {
    return this.repo.get('homework', homeworkIdForLesson(lessonId));
  }
}
