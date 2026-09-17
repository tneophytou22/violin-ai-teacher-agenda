const DB_VERSION = 1;
const STORE_NAMES = Object.freeze(['students', 'terms', 'lessons', 'programmeItems', 'homework']);

const clone = value => structuredClone(value);

export class IndexedDBRepository {
  constructor({ dbName = 'violin-ai-teacher-agenda-v15', version = DB_VERSION } = {}) {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is not available in this environment');
    this.dbName = dbName;
    this.version = version;
    this.dbPromise = null;
  }

  async #db() {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);
        request.onupgradeneeded = () => {
          const db = request.result;
          for (const name of STORE_NAMES) {
            if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
      });
    }
    return this.dbPromise;
  }

  async get(name, id) {
    const db = await this.#db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readonly');
      const request = tx.objectStore(name).get(id);
      request.onsuccess = () => resolve(request.result ? clone(request.result) : null);
      request.onerror = () => reject(request.error ?? new Error(`Failed to read ${name}`));
    });
  }

  async list(name) {
    const db = await this.#db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readonly');
      const request = tx.objectStore(name).getAll();
      request.onsuccess = () => resolve(clone(request.result ?? []));
      request.onerror = () => reject(request.error ?? new Error(`Failed to list ${name}`));
    });
  }

  async put(name, value) {
    if (!value?.id) throw new Error(`${name} requires id`);
    const db = await this.#db();
    const stored = clone(value);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readwrite');
      tx.objectStore(name).put(stored);
      tx.oncomplete = () => resolve(clone(stored));
      tx.onerror = () => reject(tx.error ?? new Error(`Failed to write ${name}`));
      tx.onabort = () => reject(tx.error ?? new Error(`Write aborted for ${name}`));
    });
  }

  async delete(name, id) {
    const db = await this.#db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readwrite');
      tx.objectStore(name).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error ?? new Error(`Failed to delete ${name}`));
    });
  }

  async clear() {
    const db = await this.#db();
    await Promise.all(STORE_NAMES.map(name => new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readwrite');
      tx.objectStore(name).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error ?? new Error(`Failed to clear ${name}`));
    })));
  }
}

export { DB_VERSION, STORE_NAMES };
