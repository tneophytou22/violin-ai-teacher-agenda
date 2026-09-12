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
}
