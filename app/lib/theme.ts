import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

export type ThemeMode = "system" | "light" | "dark";

/** Runs before paint in the browser (no flash), falls back to useEffect on the server. */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const m = localStorage.getItem("themeMode");
    return m === "light" || m === "dark" || m === "system" ? m : "system";
  } catch { return "system"; }
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveDark(mode: ThemeMode): boolean {
  return mode === "dark" || (mode === "system" && systemPrefersDark());
}

/** Saves the mode, applies it to the page and keeps the legacy "darkMode" key in sync (every page reads it). */
export function setThemeMode(mode: ThemeMode): void {
  const dark = resolveDark(mode);
  const w = window as unknown as { __themeApplying?: boolean };
  w.__themeApplying = true;
  try {
    localStorage.setItem("themeMode", mode);
    localStorage.setItem("darkMode", String(dark));
  } catch {}
  w.__themeApplying = false;
  const d = document.documentElement;
  d.setAttribute("data-dark", String(dark));
  d.style.colorScheme = dark ? "dark" : "light";
}

function subscribeDark(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-dark"] });
  return () => mo.disconnect();
}

/** True when the app is currently dark. Safe for server rendering, and updates when the theme changes. */
export function useDark(): boolean {
  return useSyncExternalStore(
    subscribeDark,
    () => document.documentElement.getAttribute("data-dark") === "true",
    () => false,
  );
}
