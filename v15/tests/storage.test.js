import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository, StorageService, STORAGE_SCHEMA_VERSION, DB_VERSION, STORE_NAMES } from '../index.js';

test('storage schema rejects future versions', () => {
  const storage = new StorageService({ repository: new InMemoryRepository() });
  assert.equal(storage.assertSchemaVersion(STORAGE_SCHEMA_VERSION), true);
  assert.throws(() => storage.assertSchemaVersion(STORAGE_SCHEMA_VERSION + 1), /Unsupported storage schema version/);
});


test('storage schema rejects invalid non-integer and non-positive versions', () => {
  const storage = new StorageService({ repository: new InMemoryRepository() });
  for (const version of [0, -1, 1.5, NaN, '1', null]) {
    assert.throws(
      () => storage.assertSchemaVersion(version),
      /Invalid storage schema version/
    );
  }
});

test('production storage contract exposes explicit schema stores', () => {
  assert.equal(DB_VERSION, STORAGE_SCHEMA_VERSION);
  assert.deepEqual(STORE_NAMES, ['students', 'terms', 'lessons', 'programmeItems', 'homework']);
});

test('storage service can use the repository contract without changing domain ownership', async () => {
  const repository = new InMemoryRepository();
  const storage = new StorageService({ repository });
  const result = await storage.health();
  assert.deepEqual(result, { ok: true, schemaVersion: STORAGE_SCHEMA_VERSION });
});

test('in-memory repository preserves clone isolation and deletion semantics', async () => {
  const repository = new InMemoryRepository();
  const source = { id: 'student-1', name: 'Repository Boundary', details: { tags: ['L1'] } };

  assert.equal(await repository.get('students', source.id), null);

  const saved = await repository.put('students', source);
  source.details.tags.push('MUTATED_AFTER_PUT');
  saved.details.tags.push('MUTATED_AFTER_RETURN');

  const stored = await repository.get('students', source.id);
  assert.deepEqual(stored, {
    id: 'student-1',
    name: 'Repository Boundary',
    details: { tags: ['L1'] },
  });

  assert.equal(await repository.delete('students', source.id), true);
  assert.equal(await repository.get('students', source.id), null);
});


test('in-memory repository clear removes all stores and remains reusable', async () => {
  const repository = new InMemoryRepository();
  await repository.put('students', { id: 'student-1', name: 'Clear Boundary' });
  await repository.put('terms', { id: 'term-1', studentId: 'student-1' });

  await repository.clear();

  assert.deepEqual(await repository.list('students'), []);
  assert.deepEqual(await repository.list('terms'), []);
  assert.equal(await repository.get('students', 'student-1'), null);

  await repository.put('students', { id: 'student-2', name: 'After Clear' });
  assert.deepEqual(await repository.list('students'), [{ id: 'student-2', name: 'After Clear' }]);
});

test('in-memory repository delete returns false for an unknown record', async () => {
  const repository = new InMemoryRepository();
  assert.equal(await repository.delete('students', 'missing-student'), false);
});
