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