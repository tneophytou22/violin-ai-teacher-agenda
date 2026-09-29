const SUPABASE_URL = 'https://ksszbowsqyfgzddecmve.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Szn3gg9chBxy8iTm1SoDTg_smL39oKe';
const SESSION_STORAGE_KEY = 'violin-ai-v15-cloud-last-sync-v1';
const STORE_NAMES = Object.freeze(['students', 'terms', 'lessons', 'programmeItems', 'homework']);

const clone = value => structuredClone(value);

const snapshotEqual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export class CloudSyncService {
  constructor({ repository, client = null, storage = globalThis.localStorage } = {}) {
    this.repository = repository;
    this.storage = storage;
    this.client = client ?? globalThis.supabase?.createClient?.(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    }) ?? null;
    this.syncTail = Promise.resolve();
  }

  get available() {
    return Boolean(this.client && this.repository);
  }

  async session() {
    if (!this.client) return null;
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session ?? null;
  }

  async user() {
    if (!this.client) return null;
    const { data, error } = await this.client.auth.getUser();
    if (error) return null;
    return data.user ?? null;
  }

  async signIn(email, password) {
    if (!this.client) throw new Error('Cloud sync is unavailable in this browser.');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.sync();
    return data;
  }

  async signUp(email, password) {
    if (!this.client) throw new Error('Cloud sync is unavailable in this browser.');
    const redirectTo = globalThis.location?.href ?? undefined;
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
    if (error) throw error;
    if (data.session) await this.sync();
    return data;
  }

  async signOut() {
    if (!this.client) return;
    const { error } = await this.client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  async localSnapshot() {
    const stores = {};
    for (const name of STORE_NAMES) stores[name] = await this.repository.list(name);
    return stores;
  }

  #readLastSync() {
    try {
      const raw = this.storage?.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  #writeLastSync(snapshot) {
    try {
      this.storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Local cache metadata is optional.
    }
  }

  #mergeStore(name, local, remote, lastSynced, tombstones) {
    const localMap = new Map((local ?? []).map(record => [record.id, record]));
    const remoteMap = new Map((remote ?? []).map(record => [record.id, record]));
    const previousMap = new Map((lastSynced?.[name] ?? []).map(record => [record.id, record]));
    const deleted = tombstones?.[name] ?? new Set();

    for (const id of previousMap.keys()) {
      if (!localMap.has(id)) deleted.add(id);
    }

    const merged = new Map();

    for (const [id, record] of remoteMap) {
      if (!deleted.has(id)) merged.set(id, clone(record));
    }

    for (const [id, record] of localMap) {
      if (deleted.has(id)) continue;
      const previous = previousMap.get(id);
      const remoteRecord = remoteMap.get(id);
      if (!remoteRecord) {
        merged.set(id, clone(record));
      } else if (previous && !snapshotEqual(record, previous) && snapshotEqual(remoteRecord, previous)) {
        merged.set(id, clone(record));
      } else if (!previous || snapshotEqual(record, previous)) {
        merged.set(id, clone(remoteRecord));
      } else {
        merged.set(id, clone(record));
      }
    }

    return [...merged.values()];
  }

  async #loadWorkspace() {
    const { data, error } = await this.client.rpc('get_or_create_teacher_workspace');
    if (error) throw error;
    const workspace = Array.isArray(data) ? data[0] : data;
    return workspace ?? { id: null, data: {} };
  }

  async #saveWorkspace(workspaceId, data) {
    const { error } = await this.client
      .from('teacher_workspaces')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', workspaceId);
    if (error) throw error;
  }

  async sync() {
    if (!this.available) return { status: 'unavailable' };

    this.syncTail = this.syncTail.then(async () => {
      const session = await this.session();
      if (!session) return { status: 'signed-out' };

      const local = await this.localSnapshot();
      const workspace = await this.#loadWorkspace();
      const remote = workspace.data && typeof workspace.data === 'object' ? workspace.data : {};
      const lastSynced = this.#readLastSync();

      const tombstones = {};
      for (const name of STORE_NAMES) tombstones[name] = new Set();

      const merged = {};
      for (const name of STORE_NAMES) {
        merged[name] = this.#mergeStore(name, local[name], remote[name], lastSynced, tombstones);
      }

      await this.repository.replaceAll(merged);
      await this.#saveWorkspace(workspace.id, merged);
      this.#writeLastSync(merged);

      return { status: 'synced', user: session.user, counts: Object.fromEntries(STORE_NAMES.map(name => [name, merged[name].length])) };
    }).catch(error => {
      this.lastError = error;
      throw error;
    });

    return this.syncTail;
  }

  scheduleSync() {
    if (!this.available) return this.syncTail;
    return this.sync().catch(() => ({ status: 'error' }));
  }
}

export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
