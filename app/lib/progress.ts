// Centralized progress tracking — single source of truth for all study activity
// Any action (practice, lesson, mock, plan) flows through here

export interface StudyActivity {
  date: string;    // YYYY-MM-DD in WAT (UTC+1)
  type: 'practice' | 'lesson' | 'plan' | 'mock' | 'ai';
  subject?: string;
  correct?: number;
  total?: number;
  topicId?: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastStudied: string; // YYYY-MM-DD WAT
  totalDays: number;
  activityLog: Record<string, StudyActivity[]>; // date -> activities
}

/** Today's date in Nigeria time (WAT = UTC+1) as YYYY-MM-DD */
export function todayWAT(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // add 1hr for WAT
  return d.toISOString().slice(0, 10);
}

export function yesterdayWAT(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000 - 86400000);
  return d.toISOString().slice(0, 10);
}

const STREAK_KEY = 'companion_streak_v2';
const STATS_KEY = 'companion_practice_stats';

export const Progress = {

  getStreak(): StreakData {
    if (typeof window === 'undefined') {
      return { current: 0, longest: 0, lastStudied: '', totalDays: 0, activityLog: {} };
    }
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (raw) return JSON.parse(raw);
      // Migrate from old key
      const old = localStorage.getItem('study_streak');
      if (old) {
        const o = JSON.parse(old);
        return {
          current: o.current || 0,
          longest: o.longest || 0,
          lastStudied: o.lastStudied
            ? new Date(o.lastStudied).toISOString().slice(0, 10)
            : '',
          totalDays: o.totalDays || 0,
          activityLog: {},
        };
      }
    } catch {}
    return { current: 0, longest: 0, lastStudied: '', totalDays: 0, activityLog: {} };
  },

  saveStreak(s: StreakData): void {
    if (typeof window === 'undefined') return;
    // Keep only 90 days of activity log
    const cutoff = new Date(Date.now() + 60 * 60 * 1000 - 90 * 86400000)
      .toISOString()
      .slice(0, 10);
    const trimmed = Object.fromEntries(
      Object.entries(s.activityLog).filter(([d]) => d >= cutoff)
    );
    localStorage.setItem(STREAK_KEY, JSON.stringify({ ...s, activityLog: trimmed }));
  },

  /** Call this for ANY study activity — practice, lesson, mock, plan task, AI chat */
  recordActivity(
    type: StudyActivity['type'],
    details: Partial<Omit<StudyActivity, 'date' | 'type'>> = {}
  ): StreakData {
    if (typeof window === 'undefined') return Progress.getStreak();

    const today = todayWAT();
    const yesterday = yesterdayWAT();
    const s = Progress.getStreak();

    // Log the activity
    if (!s.activityLog[today]) s.activityLog[today] = [];
    s.activityLog[today].push({ date: today, type, ...details });

    // Update streak only once per day
    if (s.lastStudied !== today) {
      const cont = s.lastStudied === yesterday;
      s.current = cont ? s.current + 1 : 1;
      s.longest = Math.max(s.longest, s.current);
      s.totalDays = s.totalDays + 1;
      s.lastStudied = today;
    }

    Progress.saveStreak(s);
    return s;
  },

  /** Returns a Set of YYYY-MM-DD strings where study happened */
  getActiveDays(): Set<string> {
    const s = Progress.getStreak();
    return new Set(Object.keys(s.activityLog));
  },

  /** Returns a Set of topicIds that have at least one completed 'lesson' activity */
  getCompletedTopics(): Set<string> {
    const s = Progress.getStreak();
    const ids = new Set<string>();
    for (const day of Object.values(s.activityLog)) {
      for (const a of day) {
        if (a.type === 'lesson' && a.topicId) ids.add(a.topicId);
      }
    }
    return ids;
  },

  // ── Practice stats ──────────────────────────────────────────────

  getPracticeStats(): Record<string, { correct: number; total: number }> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STATS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  recordAnswer(subject: string, correct: boolean): void {
    if (typeof window === 'undefined') return;
    const stats = Progress.getPracticeStats();
    if (!stats[subject]) stats[subject] = { correct: 0, total: 0 };
    stats[subject].total++;
    if (correct) stats[subject].correct++;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    Progress.recordActivity('practice', { subject, correct: correct ? 1 : 0, total: 1 });
  },

  getAccuracy(subject: string): number {
    const stats = Progress.getPracticeStats();
    if (!stats[subject] || stats[subject].total === 0) return -1;
    return stats[subject].correct / stats[subject].total;
  },

  getWeakSubjects(userSubjects: string[]): string[] {
    return [...userSubjects]
      .filter(s => Progress.getAccuracy(s) >= 0)
      .sort((a, b) => Progress.getAccuracy(a) - Progress.getAccuracy(b))
      .slice(0, 3);
  },
};
