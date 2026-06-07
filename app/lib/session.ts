/**
 * session.ts — lightweight cookie-based session marker
 *
 * We can't do real server-side auth without a backend,
 * but we can set a session cookie so the middleware can
 * redirect unauthenticated users on the server side.
 *
 * The cookie contains no sensitive data — it's just a
 * presence marker. The real user data stays in localStorage.
 */

const SESSION_COOKIE = "companion_session";
const COMPANION_KEYS = [
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
  /** Set after successful login/signup */
  set(): void {
    if (typeof document === "undefined") return;
    // Session expires in 30 days
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${SESSION_COOKIE}=1; expires=${expires}; path=/; SameSite=Lax`;
  },

  /** Clear session cookie */
  clear(): void {
    if (typeof document === "undefined") return;
    document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },

  /** Full logout — clears cookie + all app localStorage keys */
  logout(): void {
    Session.clear();
    if (typeof localStorage === "undefined") return;
    for (const key of COMPANION_KEYS) {
      localStorage.removeItem(key);
    }
  },
};
