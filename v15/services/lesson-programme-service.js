export class LessonProgrammeService {
  constructor(repo) { this.repo = repo; }

  async reviewWeeklyItems(lessonId, programmeItemIds) {
    const lesson = await this.repo.get('lessons', lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const items = await this.repo.list('programmeItems');
    const termItems = items.filter(item => item.termId === lesson.termId);
    const allowed = new Set(termItems.map(item => item.id));
    const selectedItems = termItems.filter(item => programmeItemIds.includes(item.id));
    if (programmeItemIds.some(id => !allowed.has(id))) {
      throw new Error('ProgrammeItem does not belong to the lesson term');
    }
    if (selectedItems.some(item => item.curriculumDomain === 'SCALES')) {
      throw new Error('Scale ProgrammeItem cannot be reviewed through core lesson workflow');
    }

    const reviewed = [...new Set([
      ...(lesson.reviewedProgrammeItemIds ?? []),
      ...programmeItemIds,
    ])];
    lesson.reviewedProgrammeItemIds = reviewed;
    lesson.version += 1;
    const savedLesson = await this.repo.put('lessons', lesson);

    return {
      lesson: savedLesson,
      reviewedItems: termItems.filter(item => reviewed.includes(item.id)),
    };
  }

  async completeItems(programmeItemIds) {
    const items = await this.repo.list('programmeItems');
    const requested = new Set(programmeItemIds);
    const matches = items.filter(item => requested.has(item.id));
    if (matches.length !== requested.size) throw new Error('ProgrammeItem not found');
    if (matches.some(item => item.curriculumDomain === 'SCALES')) {
      throw new Error('Scale ProgrammeItem cannot be completed through core completion workflow');
    }

    const completed = [];
    for (const item of matches) {
      if (item.status !== 'COMPLETED') {
        item.status = 'COMPLETED';
        item.completedAt = item.completedAt ?? new Date().toISOString();
        completed.push(await this.repo.put('programmeItems', item));
      } else {
        completed.push(item);
      }
    }
    return completed;
  }

  async uncompleteItem(itemId) {
    const item = await this.repo.get('programmeItems', itemId);
    if (!item) throw new Error('ProgrammeItem not found');
    if (item.curriculumDomain === 'SCALES') {
      throw new Error('Scale ProgrammeItem cannot be uncompleted through core completion workflow');
    }
    if (item.status !== 'COMPLETED') return item;

    item.status = 'PLANNED';
    delete item.completedAt;
    return this.repo.put('programmeItems', item);
  }

  async carryForward(itemId, targetWeek) {
    if (!Number.isInteger(targetWeek) || targetWeek < 1) throw new Error('Week must be a positive integer');
    const item = await this.repo.get('programmeItems', itemId);
    if (!item) throw new Error('ProgrammeItem not found');
    if (item.status === 'COMPLETED') throw new Error('Completed ProgrammeItem cannot be carried forward');
    item.targetWeek = targetWeek;
    return this.repo.put('programmeItems', item);
  }
}
