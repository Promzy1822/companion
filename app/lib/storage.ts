// Safe localStorage wrapper with versioning and migration

const STORAGE_VERSION = 2;
const VERSION_KEY = 'companion_storage_version';

export const Storage = {
  init: () => {
    if (typeof window === 'undefined') return;
    const version = parseInt(localStorage.getItem(VERSION_KEY) || '1');
    if (version < STORAGE_VERSION) {
      Storage.migrate(version);
      localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
    }
  },

  migrate: (fromVersion: number) => {
    if (typeof window === 'undefined') return;
    // v1 -> v2: upgrade plaintext passwords to hashed
    if (fromVersion < 2) {
      try {
        const userStr = localStorage.getItem('companion_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.password && !user.passwordHash) {
            // Import hash function inline to avoid circular deps
            const salted = "companion_salt_2025_" + user.password;
            let hash = 0;
            for (let i = 0; i < salted.length; i++) {
              const char = salted.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }
            user.passwordHash = Math.abs(hash).toString(16) +
              Math.abs(hash * 2654435761).toString(16) +
              Math.abs(hash ^ 0xdeadbeef).toString(16);
            delete user.password;
            localStorage.setItem('companion_user', JSON.stringify(user));
            console.log('Migrated user password to hash');
          }
        }
      } catch (e) {
        console.error('Migration v1->v2 failed:', e);
      }
    }
  },

  getUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('companion_user') || 'null');
    } catch { return null; }
  },

  setUser: (user: any) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('companion_user', JSON.stringify(user)); }
    catch (e) { console.error('Failed to save user:', e); }
  },

  clearUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('companion_user');
    // Clear auth cookie
    document.cookie = 'companion_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  },

  get: (key: string, fallback: any = null) => {
    if (typeof window === 'undefined') return fallback;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },

  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded — clearing old data');
        // Clear old chat history to free space
        localStorage.removeItem('chat_sessions');
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
      }
    }
  },

  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};
