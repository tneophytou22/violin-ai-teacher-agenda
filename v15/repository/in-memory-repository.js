export class InMemoryRepository {
  #stores = new Map();

  #store(name) {
    if (!this.#stores.has(name)) this.#stores.set(name, new Map());
    return this.#stores.get(name);
  }

  async get(name, id) { return structuredClone(this.#store(name).get(id) ?? null); }
  async list(name) { return structuredClone([...this.#store(name).values()]); }
  async put(name, value) {
    if (!value?.id) throw new Error(`${name} requires id`);
    this.#store(name).set(value.id, structuredClone(value));
    return structuredClone(value);
  }
  async delete(name, id) { return this.#store(name).delete(id); }
  async clear() { this.#stores.clear(); }

  async replaceAll(stores) {
    const next = new Map();
    for (const [name, records] of Object.entries(stores)) {
      const store = new Map();
      for (const record of records) {
        if (!record?.id) throw new Error(`${name} requires id`);
        store.set(record.id, structuredClone(record));
      }
      next.set(name, store);
    }
    this.#stores = next;
  }

  async deleteRecords(recordsByStore) {
    const next = new Map();
    for (const [name, store] of this.#stores) next.set(name, new Map(store));
    for (const [name, ids] of Object.entries(recordsByStore)) {
      if (!Array.isArray(ids)) throw new Error(`${name} delete ids must be an array`);
      const store = next.get(name) ?? new Map();
      for (const id of ids) store.delete(id);
      next.set(name, store);
    }
    this.#stores = next;
  }
}
