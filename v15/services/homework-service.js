import { createHomework } from '../domain/models.js';

const homeworkIdForLesson = lessonId => `hw_${lessonId}`;

const cloneItems = items => items.map(item => ({ ...item }));

const validatePracticePlan = (practicePlan, items) => {
  if (practicePlan === null || practicePlan === undefined) return null;
  if (!Number.isInteger(practicePlan.totalMinutes) || practicePlan.totalMinutes < 0) {
    throw new Error('Homework.practicePlan.totalMinutes must be a non-negative integer');
  }
  if (!Array.isArray(practicePlan.tasks)) throw new Error('Homework.practicePlan.tasks must be an array');

  const tasks = practicePlan.tasks.map(task => ({ ...task }));
  for (const task of tasks) {
    if (!Number.isInteger(task.homeworkItemIndex) || task.homeworkItemIndex < 0 || task.homeworkItemIndex >= items.length) {
      throw new Error('Homework.practicePlan task references an invalid homework item');
    }
    if (!Number.isInteger(task.minutes) || task.minutes < 0) {
      throw new Error('Homework.practicePlan task minutes must be a non-negative integer');
    }
    if (typeof task.focus !== 'string') throw new Error('Homework.practicePlan task focus must be a string');
  }

  const sum = tasks.reduce((total, task) => total + task.minutes, 0);
  if (sum !== practicePlan.totalMinutes) {
    throw new Error('Homework.practicePlan minutes must equal totalMinutes');
  }

  return {
    totalMinutes: practicePlan.totalMinutes,
    tasks,
    generatedBy: practicePlan.generatedBy ?? 'practice-planner-v1',
    generatedAt: practicePlan.generatedAt ?? new Date().toISOString(),
  };
};

export class HomeworkService {
  constructor(repo) { this.repo = repo; }

  async assignHomework({ lessonId, items, practicePlan = null }) {
    const lesson = await this.repo.get('lessons', lessonId);
    if (!lesson) throw new Error('Cannot assign homework to unknown lesson');
    if (!Array.isArray(items)) throw new Error('Homework items must be an array');

    const normalizedItems = cloneItems(items);
    const normalizedPlan = validatePracticePlan(practicePlan, normalizedItems);

    // Homework is one record per lesson. Use a deterministic identity so
    // concurrent first assignments cannot create duplicate records.
    const id = homeworkIdForLesson(lessonId);
    const existing = await this.repo.get('homework', id);

    if (existing) {
      const updated = {
        ...existing,
        items: normalizedItems,
        practicePlan: normalizedPlan,
        version: existing.version + 1
      };
      return this.repo.put('homework', updated);
    }

    return this.repo.put('homework', createHomework({
      id,
      lessonId,
      items: normalizedItems,
      practicePlan: normalizedPlan,
    }));
  }

  getForLesson(lessonId) {
    return this.repo.get('homework', homeworkIdForLesson(lessonId));
  }
}
