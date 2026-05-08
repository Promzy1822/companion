export const Storage = {
  getUser: () => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('companion_user') || 'null'); }
    catch { return null; }
  },
  setUser: (user: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('companion_user', JSON.stringify(user));
  },
  clearUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('companion_user');
  },
  get: (key: string, fallback: any = null) => {
    if (typeof window === 'undefined') return fallback;
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  },
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {}
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};
