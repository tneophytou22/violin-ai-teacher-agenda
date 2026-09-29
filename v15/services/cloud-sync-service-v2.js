const SUPABASE_URL = 'https://ksszbowsqyfgzddecmve.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Szn3gg9chBxy8iTm1SoDTg_smL39oKe';
const LAST_SYNC_KEY = 'violin-ai-v15-cloud-student-sync-v1';
const LAST_TERM_SYNC_KEY = 'violin-ai-v15-cloud-term-sync-v1';

export class CloudSyncService {
  constructor({ repository, client = null, storage = globalThis.localStorage } = {}) {
    this.repository = repository;
    this.storage = storage;
    this.client = client ?? globalThis.supabase?.createClient?.(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    }) ?? null;
    this.syncTail = Promise.resolve();
    this.lastSyncResult = null;
    this.lastError = null;
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

  async #remoteStudents() {
    const { data, error } = await this.client
      .from('students')
      .select('id,teacher_id,slug,name,level,stage,lesson_number,exam_in_days,streak,readiness,recurring_rcs,phone,school_type,school_name,instrument,lesson_day,lesson_time,lesson_schedule,created_at,updated_at,archived_at')
      .is('archived_at', null)
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async #remoteTerms() {
    const { data, error } = await this.client
      .from('terms')
      .select('id,teacher_id,student_slug,name,start_date,end_date,level,term_number,readiness_decision,readiness_decision_note,readiness_decision_at,version,created_at,updated_at')
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  #lastTermSyncIds() {
    try {
      const value = this.storage?.getItem(LAST_TERM_SYNC_KEY);
      return value ? new Set(JSON.parse(value)) : null;
    } catch {
      return null;
    }
  }

  #writeLastTermSyncIds(ids) {
    try {
      this.storage?.setItem(LAST_TERM_SYNC_KEY, JSON.stringify([...ids]));
    } catch {
      // Optional cache metadata only.
    }
  }

  async #pushLocalTerms(localTerms, remoteTerms, userId, previousIds) {
    const remoteById = new Map(remoteTerms.map(term => [term.id, term]));
    const localIds = new Set(localTerms.map(term => term.id));
    const rows = localTerms.map(term => {
      const remote = remoteById.get(term.id);
      return {
        id: term.id,
        teacher_id: userId,
        student_slug: term.studentId,
        name: term.name,
        start_date: term.startDate ?? null,
        end_date: term.endDate ?? null,
        level: term.level ?? null,
        term_number: term.termNumber ?? 1,
        readiness_decision: term.readinessDecision ?? null,
        readiness_decision_note: term.readinessDecisionNote ?? '',
        readiness_decision_at: term.readinessDecisionAt ?? null,
        version: term.version ?? 1,
        created_at: term.createdAt ?? remote?.created_at ?? new Date().toISOString(),
        updated_at: term.updatedAt ?? remote?.updated_at ?? term.createdAt ?? new Date().toISOString(),
      };
    });

    if (rows.length) {
      const { error } = await this.client
        .from('terms')
        .upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }

    if (previousIds) {
      const deletedIds = [...previousIds].filter(id => !localIds.has(id));
      for (const id of deletedIds) {
        const { error } = await this.client
          .from('terms')
          .delete()
          .eq('id', id)
          .eq('teacher_id', userId);
        if (error) throw error;
      }
    }
  }

  async #replaceLocalTerms(localTerms, remoteTerms) {
    const byId = new Map(localTerms.map(term => [term.id, term]));
    for (const remote of remoteTerms) {
      byId.set(remote.id, {
        id: remote.id,
        studentId: remote.student_slug,
        name: remote.name,
        startDate: remote.start_date ?? null,
        endDate: remote.end_date ?? null,
        level: remote.level ?? null,
        termNumber: remote.term_number ?? 1,
        readinessDecision: remote.readiness_decision ?? null,
        readinessDecisionNote: remote.readiness_decision_note ?? '',
        readinessDecisionAt: remote.readiness_decision_at ?? null,
        version: remote.version ?? 1,
        createdAt: localTerms.find(term => term.id === remote.id)?.createdAt ?? remote.created_at ?? new Date().toISOString(),
        updatedAt: remote.updated_at ?? remote.created_at ?? new Date().toISOString(),
      });
    }
    const merged = [...byId.values()];
    await this.repository.putRecords({ terms: merged });
    return merged;
  }

  #lastSyncIds() {
    try {
      const value = this.storage?.getItem(LAST_SYNC_KEY);
      return value ? new Set(JSON.parse(value)) : null;
    } catch {
      return null;
    }
  }

  #writeLastSyncIds(ids) {
    try {
      this.storage?.setItem(LAST_SYNC_KEY, JSON.stringify([...ids]));
    } catch {
      // Optional cache metadata only.
    }
  }

  async #pushLocalStudents(localStudents, remoteStudents, userId, previousIds) {
    const remoteBySlug = new Map(remoteStudents.map(student => [student.slug, student]));
    const localIds = new Set(localStudents.map(student => student.id));

    const rows = localStudents.map(student => {
      const remote = remoteBySlug.get(student.id);
      const row = {
        teacher_id: userId,
        slug: student.id,
        name: student.name,
        level: remote?.level ?? null,
        stage: remote?.stage ?? null,
        lesson_number: remote?.lesson_number ?? 0,
        exam_in_days: remote?.exam_in_days ?? null,
        streak: remote?.streak ?? 0,
        readiness: remote?.readiness ?? 0,
        recurring_rcs: remote?.recurring_rcs ?? [],
        phone: student.phone?.trim() ? student.phone : (remote?.phone ?? ''),
        school_type: student.schoolType && student.schoolType !== 'OTHER'
          ? student.schoolType
          : (remote?.school_type ?? 'OTHER'),
        school_name: student.schoolName?.trim() ? student.schoolName : (remote?.school_name ?? ''),
        instrument: student.instrument && student.instrument !== 'VIOLIN'
          ? student.instrument
          : (remote?.instrument ?? 'VIOLIN'),
        lesson_day: student.lessonDay?.trim() ? student.lessonDay : (remote?.lesson_day ?? ''),
        lesson_time: student.lessonTime?.trim() ? student.lessonTime : (remote?.lesson_time ?? ''),
        lesson_schedule: Array.isArray(student.lessonSchedule) && student.lessonSchedule.length
          ? student.lessonSchedule
          : (remote?.lesson_schedule ?? []),
      };

      // Only send the UUID when this local student already exists remotely.
      // For a new student, omitting id lets Postgres generate its UUID.
      if (remote?.id) row.id = remote.id;
      return row;
    });

    if (rows.length) {
      const { error } = await this.client
        .from('students')
        .upsert(rows, { onConflict: 'teacher_id,slug' });
      if (error) throw error;
    }

    // Only propagate deletions for IDs that were already present at the previous
    // successful sync. This prevents a second device from deleting a remote
    // student merely because it has not pulled it yet.
    if (previousIds) {
      const deletedIds = [...previousIds].filter(id => !localIds.has(id));
      for (const slug of deletedIds) {
        const { error } = await this.client
          .from('students')
          .delete()
          .eq('teacher_id', userId)
          .eq('slug', slug);
        if (error) throw error;
      }
    }
  }

  async #replaceLocalStudents(localStudents, remoteStudents) {
    const byId = new Map(localStudents.map(student => [student.id, student]));
    for (const remote of remoteStudents) {
      const localId = remote.slug || remote.id;
      const existing = byId.get(localId);
      byId.set(localId, {
        id: localId,
        name: remote.name,
        phone: existing?.phone?.trim() ? existing.phone : (remote.phone ?? ''),
        schoolType: existing?.schoolType && existing.schoolType !== 'OTHER'
          ? existing.schoolType
          : (remote.school_type ?? 'OTHER'),
        schoolName: existing?.schoolName?.trim() ? existing.schoolName : (remote.school_name ?? ''),
        instrument: existing?.instrument && existing.instrument !== 'VIOLIN'
          ? existing.instrument
          : (remote.instrument ?? 'VIOLIN'),
        lessonDay: existing?.lessonDay?.trim() ? existing.lessonDay : (remote.lesson_day ?? ''),
        lessonTime: existing?.lessonTime?.trim() ? existing.lessonTime : (remote.lesson_time ?? ''),
        lessonSchedule: Array.isArray(existing?.lessonSchedule) && existing.lessonSchedule.length
          ? existing.lessonSchedule
          : (remote.lesson_schedule ?? []),
        createdAt: existing?.createdAt ?? remote.created_at ?? new Date().toISOString(),
      });
    }
    await this.repository.putRecords({ students: [...byId.values()] });
    return [...byId.values()];
  }

  async sync() {
    if (!this.available) return { status: 'unavailable' };

    this.syncTail = this.syncTail.then(async () => {
      const session = await this.session();
      if (!session) {
        this.lastSyncResult = { status: 'signed-out', studentCount: 0, termCount: 0, userEmail: '' };
        this.lastError = null;
        return this.lastSyncResult;
      }

      const localStudents = await this.repository.list('students');
      const localTerms = await this.repository.list('terms');
      const remoteStudents = await this.#remoteStudents();
      const previousIds = this.#lastSyncIds();
      const previousTermIds = this.#lastTermSyncIds();

      // Students must be pushed first because cloud Terms reference
      // (teacher_id, student_slug).
      await this.#pushLocalStudents(localStudents, remoteStudents, session.user.id, previousIds);
      const refreshedRemoteStudents = await this.#remoteStudents();
      const mergedStudents = await this.#replaceLocalStudents(localStudents, refreshedRemoteStudents);

      const remoteTerms = await this.#remoteTerms();
      await this.#pushLocalTerms(localTerms, remoteTerms, session.user.id, previousTermIds);
      const refreshedRemoteTerms = await this.#remoteTerms();
      const mergedTerms = await this.#replaceLocalTerms(localTerms, refreshedRemoteTerms);

      this.#writeLastSyncIds(new Set(mergedStudents.map(student => student.id)));
      this.#writeLastTermSyncIds(new Set(mergedTerms.map(term => term.id)));
      this.lastError = null;
      this.lastSyncResult = {
        status: 'synced',
        studentCount: mergedStudents.length,
        termCount: mergedTerms.length,
        userEmail: session.user.email ?? '',
      };
      return this.lastSyncResult;
    }).catch(error => {
      this.lastError = error;
      this.lastSyncResult = { status: 'error', studentCount: 0, termCount: 0, userEmail: '', message: error?.message ?? String(error) };
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
