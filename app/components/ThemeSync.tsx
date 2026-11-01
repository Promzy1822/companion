"use client";
import { useEffect } from "react";
import { getThemeMode, setThemeMode } from "../lib/theme";

/**
 * Mounted once in the root layout.
 *  1. Reveals the app only after it has hydrated (so no unthemed page is ever visible).
 *  2. In "System default" mode, follows the device when it switches between light and dark.
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
      const wasDark = document.documentElement.getAttribute("data-dark") === "true";
      if (mq.matches !== wasDark) {
        setThemeMode("system");
        window.location.reload(); // every page recolours consistently
      }
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
