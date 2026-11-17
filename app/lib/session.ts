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
 * H3 (2026-11-17): session expiry is tracked here too — markExpired() /
 * consumeExpiredFlag() carry the reason across the redirect to
 * /landing?session=expired, and logout() signs out of Supabase FIRST
 * (so sync no-ops) before any local key is cleared. See logout().
 */

const SESSION_COOKIE  = "companion_session";
const ACTIVE_USER_KEY = "companion_user"; // local cache of the logged-in session
const SESSION_EXPIRED_KEY = "companion_session_expired"; // sessionStorage: set on expiry, read once by the next screen
const LOGGING_OUT_KEY     = "companion_logging_out"; // sessionStorage: intentional-logout marker (see logout())
// Device-level install state is NOT personal data: logout keeps it so the
// install banner does not reappear after every logout.
const INSTALL_KEYS = new Set(["companion_install_dismissed_at", "companion_install_done"]);

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

function clearLocalDeviceData(): void {
  if (typeof window === "undefined") return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("companion_") && !INSTALL_KEYS.has(k)) doomed.push(k);
    }
    for (const k of doomed) localStorage.removeItem(k);
    // Personal progress not under the companion_ prefix.
    localStorage.removeItem("mock_history");
  } catch {}
}

// ── Session (active login) ────────────────────────────────────────────────────

export const Session = {
  /** Start a session for a user — caches account locally + sets cookie */
  start(account: UserAccount): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(account));
      setCookie();
      // Fresh login clears any stale expiry / logging-out markers.
      try { sessionStorage.removeItem(SESSION_EXPIRED_KEY); } catch {}
      try { sessionStorage.removeItem(LOGGING_OUT_KEY); } catch {}
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
   *
   * ORDERING (H3) — sign out FIRST, then clear local data:
   *   1. Mark "logging out" (sessionStorage) so the AppChrome
   *      onAuthStateChange handler knows this SIGNED_OUT is intentional
   *      and does NOT treat it as a session expiry.
   *   2. Await Supabase signOut. Sync.pushNow() no-ops without a uid, so
   *      once this resolves no pending sync can touch the cloud backup.
   *      (Raced against a 5s timeout so a hung signOut can never trap
   *      logout; the local clear below still runs.)
   *   3. Cancel pending debounced sync pushes, then clear the
   *      companion_* localStorage keys (+ mock_history) and the cookie.
   *      Clearing BEFORE signOut would let a pending push see a null
   *      local value and DELETE the cloud snapshot for that key.
   *   The logging-out marker is left set on purpose: AppChrome consumes
   *   it when it sees SIGNED_OUT, and Session.start() clears it on the
   *   next login. Never clear it here — the SIGNED_OUT event fires
   *   asynchronously and may arrive after signOut() resolves.
   */
  async logout(): Promise<void> {
    if (typeof window === "undefined") return;
    try { sessionStorage.setItem(LOGGING_OUT_KEY, "1"); } catch {}
    try {
      const { createClient } = await import("./supabase/client");
      const signOut = createClient().auth.signOut();
      const timeout = new Promise<void>(resolve => { setTimeout(resolve, 5000); });
      await Promise.race([signOut.then(() => undefined).catch(() => undefined), timeout]);
    } catch {}
    try {
      const { Sync } = await import("./sync");
      Sync.cancelPending();
    } catch {}
    clearLocalDeviceData();
    try { sessionStorage.removeItem(SESSION_EXPIRED_KEY); } catch {}
    try { sessionStorage.removeItem("companion_hydrated"); } catch {}
    clearCookie();
  },

  /**
   * Clear only the cached identity (companion_user), keeping study data
   * on-device. Used on session expiry so the UI stops looking logged
   * in; the next login re-hydrates from the cloud. Expiry must NOT
   * clear the plan/progress keys — that is logout's job only.
   */
  clearUserCache(): void {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(ACTIVE_USER_KEY); } catch {}
  },

  /** Record that the Supabase session died (not a logout). Read once
   *  by the next screen via consumeExpiredFlag(). */
  markExpired(): void {
    if (typeof window === "undefined") return;
    try { sessionStorage.setItem(SESSION_EXPIRED_KEY, "1"); } catch {}
  },

  /** True once if markExpired() was called since the last read; clears the flag. */
  consumeExpiredFlag(): boolean {
    if (typeof window === "undefined") return false;
    try {
      if (!sessionStorage.getItem(SESSION_EXPIRED_KEY)) return false;
      sessionStorage.removeItem(SESSION_EXPIRED_KEY);
      return true;
    } catch { return false; }
  },

  /** True while an intentional logout is in flight (set by logout(),
   *  consumed by AppChrome when it handles SIGNED_OUT). */
  isLoggingOut(): boolean {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(LOGGING_OUT_KEY) === "1"; } catch { return false; }
  },

  /** Consume the logging-out marker (AppChrome, on SIGNED_OUT). */
  clearLoggingOutFlag(): void {
    if (typeof window === "undefined") return;
    try { sessionStorage.removeItem(LOGGING_OUT_KEY); } catch {}
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
