"use client";
import { useEffect } from "react";

/**
 * Mounted once in the root layout. Reveals the app only after it has hydrated
 * (so no unstyled server HTML is ever visible). The app is dark-only, so there
 * is no theme left to sync.
 */
export default function ThemeSync() {
  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => document.documentElement.removeAttribute("data-booting"));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, []);
  return null;
}
