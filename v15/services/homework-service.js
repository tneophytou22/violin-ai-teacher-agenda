import { createHomework } from '../domain/models.js';

export class HomeworkService {
  constructor(repo) { this.repo = repo; }
  async assignHomework({ lessonId, items }) {
    const lesson = await this.repo.get('lessons', lessonId);
    if (!lesson) throw new Error('Cannot assign homework to unknown lesson');
    const existing = (await this.repo.list('homework')).find(h => h.lessonId === lessonId);
    if (existing) {
      existing.items = items.map(item => ({ ...item }));
      existing.version += 1;
      return this.repo.put('homework', existing);
    }
    return this.repo.put('homework', createHomework({ lessonId, items }));
  }
  getForLesson(lessonId) { return this.repo.list('homework').then(xs => xs.find(x => x.lessonId === lessonId) ?? null); }
}
