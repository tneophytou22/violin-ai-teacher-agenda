export const BACKUP_FORMAT_VERSION = 1;

export class BackupService {
  constructor(repo) {
    if (!repo) throw new Error('BackupService requires a repository');
    this.repo = repo;
  }

  async createBackup() {
    const stores = {};
    for (const name of this.#storeNames()) {
      stores[name] = await this.repo.list(name);
    }
    return {
      format: 'violin-ai-teacher-agenda-v15-backup',
      formatVersion: BACKUP_FORMAT_VERSION,
      createdAt: new Date().toISOString(),
      stores,
      counts: Object.fromEntries(Object.entries(stores).map(([name, records]) => [name, records.length])),
    };
  }

  async restoreBackup(backup) {
    this.validateBackup(backup);
    const names = this.#storeNames();
    await this.repo.clear();
    for (const name of names) {
      for (const record of backup.stores[name]) {
        await this.repo.put(name, record);
      }
    }
    return this.createBackup();
  }

  validateBackup(backup) {
    if (!backup || backup.format !== 'violin-ai-teacher-agenda-v15-backup') {
      throw new Error('Invalid V15 backup file');
    }
    if (backup.formatVersion !== BACKUP_FORMAT_VERSION) {
      throw new Error(`Unsupported V15 backup format version: ${backup.formatVersion ?? 'unknown'}`);
    }
    if (!backup.stores || typeof backup.stores !== 'object') {
      throw new Error('V15 backup is missing its data stores');
    }
    if (!backup.counts || typeof backup.counts !== 'object') {
      throw new Error('V15 backup is missing store counts');
    }
    for (const name of this.#storeNames()) {
      if (!Array.isArray(backup.stores[name])) {
        throw new Error(`V15 backup is missing store: ${name}`);
      }
      if (backup.counts[name] !== backup.stores[name].length) {
        throw new Error(`V15 backup count mismatch for store: ${name}`);
      }
      for (const record of backup.stores[name]) {
        if (!record || typeof record !== 'object' || !record.id) {
          throw new Error(`Invalid record in V15 backup store: ${name}`);
        }
      }
    }
    return true;
  }

  #storeNames() {
    return ['students', 'terms', 'lessons', 'programmeItems', 'homework'];
  }
}
