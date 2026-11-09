"use client";
import { useEffect } from "react";
import { getThemeMode, setThemeMode } from "../lib/theme";

/**
 * Mounted once in the root layout.
 *  1. Reveals the app only after it has hydrated (so no unthemed page is ever visible).
 *  2. In "System default" mode, follows the device live when it switches between
 *     light and dark: setThemeMode flips data-dark and every useDark() surface
 *     recolours in place. No reload (the reload only existed because pages held
 *     stale local theme snapshots; they all read useDark() now).
 */
export default function ThemeSync() {
  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => document.documentElement.removeAttribute("data-booting"));
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getThemeMode() !== "system") return;
      setThemeMode("system");
    };
    mq.addEventListener("change", onChange);

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      mq.removeEventListener("change", onChange);
    };
  }, []);
  return null;
}
