import { createClient } from "./supabase/client";

/**
 * sync.ts — mirrors this device's local study state into Supabase so it
 * survives a phone change (item (e)).
 *
 * Two stores:
 *  - public.user_sync: one JSON snapshot per (user, key) — study plan, mock
 *    history, syllabus progress, practice stats, streak doc. localStorage
 *    stays the fast on-device copy; the newest updated_at wins.
 *  - public.study_activity: one appended row per study event, fed from
 *    Progress.recordActivity (the single choke point for study actions).
 *
 * Everything here is fire-and-forget: no call throws or blocks the UI. When
 * the student is logged out or offline the call is a no-op, and the next
 * hydrate reconciles.
 */

const KEY_TO_LOCAL = {
  plan: "companion_study_plan_v2",
  mock_history: "mock_history",
  syllabus_progress: "companion_syllabus_progress",
  practice_stats: "companion_practice_stats",
  streak: "companion_streak_v2",
} as const;

export type SyncKey = keyof typeof KEY_TO_LOCAL;
const ALL_KEYS = Object.keys(KEY_TO_LOCAL) as SyncKey[];

const META_KEY = "companion_sync_meta"; // { [key]: epoch ms of the copy we last synced }

function readMeta(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}"); } catch { return {}; }
}
function writeMeta(m: Record<string, number>): void {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch {}
}

async function currentUid(): Promise<string | null> {
  try {
    const { data } = await createClient().auth.getSession();
    return data.session?.user?.id ?? null;
  } catch { return null; }
}

// ── Snapshot pushes (debounced per key) ───────────────────────────────

const timers: Partial<Record<SyncKey, ReturnType<typeof setTimeout>>> = {};

async function pushNow(key: SyncKey): Promise<void> {
  try {
    const uid = await currentUid();
    if (!uid) return;
    const supabase = createClient();
    const raw = localStorage.getItem(KEY_TO_LOCAL[key]);
    if (raw === null) {
      // Removed locally (e.g. plan reset) — remove the backup too
      await supabase.from("user_sync").delete().eq("user_id", uid).eq("key", key);
      const m = readMeta(); delete m[key]; writeMeta(m);
      return;
    }
    let value: unknown;
    try { value = JSON.parse(raw); } catch { return; }
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("user_sync")
      .upsert({ user_id: uid, key, value, updated_at: now }, { onConflict: "user_id,key" });
    if (!error) {
      const m = readMeta(); m[key] = Date.parse(now); writeMeta(m);
    }
  } catch {}
}

export const Sync = {
  /** Queue a snapshot push for a key (debounced; safe to call on every write). */
  push(key: SyncKey): void {
    if (typeof window === "undefined") return;
    const t = timers[key];
    if (t) clearTimeout(t);
    timers[key] = setTimeout(() => { void pushNow(key); }, 1200);
  },

  /** Append one study event to study_activity. */
  logActivity(a: {
    date: string; type: string;
    subject?: string; correct?: number; total?: number; topicId?: string;
  }): void {
    if (typeof window === "undefined") return;
    void (async () => {
      try {
        const uid = await currentUid();
        if (!uid) return;
        await createClient().from("study_activity").insert({
          user_id: uid,
          date: a.date,
          type: a.type,
          subject: a.subject ?? null,
          correct: a.correct ?? null,
          total: a.total ?? null,
          topic_id: a.topicId ?? null,
        });
      } catch {}
    })();
  },

  /** Push Profile-page edits up to the profiles row. */
  async pushProfile(fields: {
    name?: string; institution?: string; course?: string; subjects?: string[];
    target?: string; deadline?: string; selfRating?: string;
  }): Promise<void> {
    try {
      const uid = await currentUid();
      if (!uid) return;
      const update: Record<string, unknown> = {};
      if (fields.name !== undefined) update.name = fields.name;
      if (fields.institution !== undefined) update.institution = fields.institution;
      if (fields.course !== undefined) update.course = fields.course;
      if (fields.subjects !== undefined) update.subjects = fields.subjects;
      if (fields.target !== undefined) update.target = fields.target;
      if (fields.deadline !== undefined) update.deadline = fields.deadline;
      if (fields.selfRating !== undefined) update.self_rating = fields.selfRating;
      if (Object.keys(update).length === 0) return;
      update.updated_at = new Date().toISOString();
      await createClient().from("profiles").update(update).eq("id", uid);
    } catch {}
  },

  /**
   * Reconcile this device with the account: snapshots newer on the server
   * are written into localStorage; anything newer (or only) on this device
   * is pushed up. Called after login/register and once per browser session
   * on boot. On a student's first run after this ships, their existing
   * local data is uploaded as the initial backup.
   */
  async hydrate(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const uid = await currentUid();
      if (!uid) return;
      const supabase = createClient();
      const { data: rows, error } = await supabase
        .from("user_sync")
        .select("key,value,updated_at")
        .eq("user_id", uid);
      if (error) return;

      const meta = readMeta();
      const remoteTs: Partial<Record<SyncKey, number>> = {};
      const pulled = new Set<SyncKey>();

      for (const row of rows ?? []) {
        const key = row.key as SyncKey;
        if (!(key in KEY_TO_LOCAL)) continue;
        const ts = Date.parse(row.updated_at as string) || 0;
        remoteTs[key] = ts;
        if (ts > (meta[key] ?? 0)) {
          try { localStorage.setItem(KEY_TO_LOCAL[key], JSON.stringify(row.value)); } catch {}
          meta[key] = ts;
          pulled.add(key);
        }
      }
      writeMeta(meta);

      for (const key of ALL_KEYS) {
        if (pulled.has(key)) continue;
        if (localStorage.getItem(KEY_TO_LOCAL[key]) === null) continue;
        const rTs = remoteTs[key] ?? 0;
        if (rTs === 0 || (meta[key] ?? 0) > rTs) void pushNow(key);
      }
    } catch {}
  },
};
