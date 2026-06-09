const SESSION_COOKIE = "companion_session";

export const COMPANION_KEYS = [
  "companion_user",
  "companion_accounts",
  "companion_streak_v2",
  "companion_practice_stats",
  "companion_study_plan_v2",
  "companion_news_v2",
  "companion_news_v2_ts",
  "companion_storage_version",
  "mock_history",
  "darkMode",
  "chat_sessions",
] as const;

export const Session = {
  set(): void {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${SESSION_COOKIE}=1; expires=${expires}; path=/; SameSite=Lax`;
  },

  clear(): void {
    if (typeof document === "undefined") return;
    document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },

  logout(): void {
    Session.clear();
    if (typeof localStorage === "undefined") return;
    for (const key of COMPANION_KEYS) {
      localStorage.removeItem(key);
    }
  },

  /** Call on app boot — ensures existing logged-in users get a cookie */
  syncFromStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const user = localStorage.getItem("companion_user");
      if (user) {
        Session.set();
      } else {
        Session.clear();
      }
    } catch {}
  },
};
