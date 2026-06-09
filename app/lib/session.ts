/**
 * session.ts
 *
 * ARCHITECTURE:
 *   companion_accounts  = PERMANENT account store (array, never deleted on logout)
 *   companion_user      = ACTIVE SESSION only (deleted on logout, restored on login)
 *   companion_session   = Cookie presence marker for middleware
 *
 * RULE: logout ONLY removes companion_user and the cookie.
 *       It NEVER touches companion_accounts.
 *       Accounts are permanent until the user explicitly deletes their account.
 */

const SESSION_COOKIE  = "companion_session";
const ACTIVE_USER_KEY = "companion_user";      // session only
const ACCOUNTS_KEY    = "companion_accounts";  // permanent store

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

// ── Account store (permanent) ─────────────────────────────────────────────────

export const AccountStore = {
  /** Read all accounts */
  getAll(): UserAccount[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  /** Find by email (case-insensitive) */
  findByEmail(email: string): UserAccount | null {
    const e = email.toLowerCase().trim();
    return AccountStore.getAll().find(a => a.email === e) ?? null;
  },

  /** Check if email already exists */
  emailExists(email: string): boolean {
    return AccountStore.findByEmail(email) !== null;
  },

  /** Save or update an account — enforces email uniqueness */
  save(account: UserAccount): void {
    if (typeof window === "undefined") return;
    const accounts = AccountStore.getAll();
    const idx = accounts.findIndex(a => a.email === account.email);
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...account, updatedAt: new Date().toISOString() };
    } else {
      accounts.push(account);
    }
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e: unknown) {
      console.error("[AccountStore] Failed to save account:", e);
    }
  },
};

// ── Session (active login) ────────────────────────────────────────────────────

export const Session = {
  /** Start a session for a user — sets active user + cookie */
  start(account: UserAccount): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(account));
      setCookie();
    } catch (e) {
      console.error("[Session] Failed to start session:", e);
    }
  },

  /** Get the currently active user */
  getUser(): UserAccount | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(ACTIVE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /** Update the active session data (e.g. after profile edit) */
  updateUser(updates: Partial<UserAccount>): void {
    const current = Session.getUser();
    if (!current) return;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    // Update both session and permanent store
    Session.start(updated);
    AccountStore.save(updated);
  },

  /**
   * END SESSION ONLY — does NOT delete the account.
   * Only removes companion_user (active session) and the cookie.
   * companion_accounts (permanent store) is NEVER touched here.
   */
  logout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACTIVE_USER_KEY);
    clearCookie();
    // Explicitly do NOT remove companion_accounts
  },

  /**
   * Called on app boot — if companion_user exists, refresh the cookie.
   * Also repairs accounts if companion_user exists but companion_accounts is missing it.
   */
  sync(): void {
    if (typeof window === "undefined") return;
    const activeUser = Session.getUser();
    if (!activeUser) return;
    // Refresh the session cookie
    setCookie();
    // Repair: ensure the active user is also in the permanent accounts store
    if (!AccountStore.emailExists(activeUser.email)) {
      console.log("[Session] Repairing: active user not in accounts store, re-adding");
      AccountStore.save(activeUser);
    }
  },

  /** Set the session cookie (alias for external use) */
  set: setCookie,
};
