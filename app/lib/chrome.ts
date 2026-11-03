import { useSyncExternalStore } from "react";

/**
 * Tiny store that lets each page "ask" for the top bar / bottom tabs.
 * The bars themselves live once in the root layout (AppChrome), so they never unmount
 * or redraw while you move between pages.
 */
export interface NavReg  { darkMode: boolean; hasToggle: boolean; toggle: () => void }
export interface TabsReg { darkMode?: boolean }

interface Snapshot {
  nav:  { id: number; reg: NavReg }  | null;
  tabs: { id: number; reg: TabsReg } | null;
}

const EMPTY: Snapshot = { nav: null, tabs: null };
let snap: Snapshot = EMPTY;
let counter = 0;
const listeners = new Set<() => void>();

export const nextChromeId = () => ++counter;

function commit(next: Snapshot) {
  snap = next;
  listeners.forEach(l => l());
}

export function registerNav(id: number, reg: NavReg) {
  const cur = snap.nav;
  if (cur && cur.id === id && cur.reg.darkMode === reg.darkMode && cur.reg.hasToggle === reg.hasToggle) {
    cur.reg.toggle = reg.toggle; // keep the latest callback without re-rendering
    return;
  }
  commit({ ...snap, nav: { id, reg } });
}
export function unregisterNav(id: number) {
  if (snap.nav && snap.nav.id === id) commit({ ...snap, nav: null });
}

export function registerTabs(id: number, reg: TabsReg) {
  const cur = snap.tabs;
  if (cur && cur.id === id && cur.reg.darkMode === reg.darkMode) return;
  commit({ ...snap, tabs: { id, reg } });
}
export function unregisterTabs(id: number) {
  if (snap.tabs && snap.tabs.id === id) commit({ ...snap, tabs: null });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useChrome(): Snapshot {
  return useSyncExternalStore(subscribe, () => snap, () => EMPTY);
}
