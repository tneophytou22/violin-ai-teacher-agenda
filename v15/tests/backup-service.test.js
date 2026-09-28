import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository } from '../repository/in-memory-repository.js';
import { BackupService } from '../services/backup-service.js';

test('BackupService creates a complete V15 backup and restores it', async () => {
  const repo = new InMemoryRepository();
  await repo.put('students', { id: 'stu_1', name: 'Anna' });
  await repo.put('terms', { id: 'term_1', studentId: 'stu_1' });
  await repo.put('lessons', { id: 'lesson_1', termId: 'term_1' });
  await repo.put('programmeItems', { id: 'pi_1', termId: 'term_1', curriculumDomain: 'ETUDE' });
  await repo.put('homework', { id: 'hw_1', lessonId: 'lesson_1', items: [] });

  const service = new BackupService(repo);
  const backup = await service.createBackup();

  assert.equal(backup.format, 'violin-ai-teacher-agenda-v15-backup');
  assert.equal(backup.formatVersion, 1);
  assert.deepEqual(backup.counts, {
    students: 1,
    terms: 1,
    lessons: 1,
    programmeItems: 1,
    homework: 1,
  });

  await repo.clear();
  assert.equal((await repo.list('students')).length, 0);

  const restored = await service.restoreBackup(backup);
  assert.equal(restored.counts.students, 1);
  assert.deepEqual(await repo.get('students', 'stu_1'), { id: 'stu_1', name: 'Anna' });
  assert.deepEqual(await repo.get('homework', 'hw_1'), { id: 'hw_1', lessonId: 'lesson_1', items: [] });
});

test('BackupService rejects invalid or incompatible backups before changing data', async () => {
  const repo = new InMemoryRepository();
  await repo.put('students', { id: 'stu_1', name: 'Keep me' });
  const service = new BackupService(repo);

  await assert.rejects(
    () => service.restoreBackup({ format: 'wrong', formatVersion: 1, stores: {} }),
    /Invalid V15 backup file/,
  );
  assert.deepEqual(await repo.get('students', 'stu_1'), { id: 'stu_1', name: 'Keep me' });

  await assert.rejects(
    () => service.restoreBackup({
      format: 'violin-ai-teacher-agenda-v15-backup',
      formatVersion: 999,
      stores: {},
    }),
    /Unsupported V15 backup format version/,
  );
  assert.deepEqual(await repo.get('students', 'stu_1'), { id: 'stu_1', name: 'Keep me' });
});
