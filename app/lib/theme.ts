import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

/** Runs before paint in the browser (no flash), falls back to useEffect on the server. */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function subscribeDark(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-dark"] });
  return () => mo.disconnect();
}

/**
 * Companion is dark-only: the layout boot script always sets data-dark="true"
 * and there is no theme setting anymore. This stays as the single read point
 * for every surface, so pages and chrome keep asking the same question — it
 * just always gets the same answer.
 */
export function useDark(): boolean {
  return useSyncExternalStore(
    subscribeDark,
    () => document.documentElement.getAttribute("data-dark") === "true",
    () => true,
  );
}
