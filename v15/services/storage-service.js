import { IndexedDBRepository, DB_VERSION } from '../repository/indexed-db-repository.js';

export const STORAGE_SCHEMA_VERSION = 1;

export class StorageService {
  constructor({ repository = null, dbName = 'violin-ai-teacher-agenda-v15' } = {}) {
    this.repository = repository ?? new IndexedDBRepository({ dbName, version: DB_VERSION });
  }

  getRepository() {
    return this.repository;
  }

  assertSchemaVersion(version) {
    if (!Number.isInteger(version) || version < 1) throw new Error('Invalid storage schema version');
    if (version > STORAGE_SCHEMA_VERSION) throw new Error(`Unsupported storage schema version: ${version}`);
    return true;
  }

  async health() {
    await this.repository.list('students');
    return { ok: true, schemaVersion: STORAGE_SCHEMA_VERSION };
  }
}