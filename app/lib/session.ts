/**
 * session.ts
 *
 * ARCHITECTURE (simplified — Supabase-style):
 *   Vercel KV (via /api/auth/* routes) is the ONLY permanent account store.
 *   This file only caches the currently logged-in user on this device
 *   (companion_user) and sets a cookie marker for middleware.
 *
 * RULE: logout removes the local session cache + cookie only.
 *       Nothing in this file is a database — accounts live exclusively in KV.
 */

const SESSION_COOKIE  = "companion_session";
const ACTIVE_USER_KEY = "companion_user"; // local cache of the logged-in session

export interface UserAccount {
  email:          string;
  name:           string;
  passwordHash:   string;
  institution:    string;
  course:         string;
  subjects:       string[];
  target:         string;
  deadline:       string;
  selfRating:     string;
  cutoffData:     unknown;
  recommendation: string | null;
  verified?:      boolean;
  createdAt:      string;
  updatedAt?:     string;
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

function setCookie(): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${SESSION_COOKIE}=1; expires=${expires}; path=/; SameSite=Lax`;
}

function clearCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ── Session (active login) ────────────────────────────────────────────────────

export const Session = {
  /** Start a session for a user — caches account locally + sets cookie */
  start(account: UserAccount): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(account));
      setCookie();
    } catch (e) {
      console.error("[Session] Failed to start session:", e);
    }
  },

  /** Get the currently active user (from local cache) */
  getUser(): UserAccount | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(ACTIVE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /**
   * END SESSION ONLY — does NOT delete the account.
   * The account lives permanently in Vercel KV regardless of this call.
   */
  logout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACTIVE_USER_KEY);
    clearCookie();
  },

  /** Called on app boot — refreshes the cookie if a local session exists */
  sync(): void {
    if (typeof window === "undefined") return;
    if (!Session.getUser()) return;
    setCookie();
  },

  /** Set the session cookie (alias for external use) */
  set: setCookie,
};
