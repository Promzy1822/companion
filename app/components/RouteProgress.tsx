"use client";
import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top progress bar. Starts the instant an internal link is clicked and
 * finishes when the new page has rendered, so navigation never feels stuck.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const bar    = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const timer  = useRef<number | undefined>(undefined);

  const finish = useCallback(() => {
    const el = bar.current;
    if (!el || !active.current) return;
    active.current = false;
    window.clearTimeout(timer.current);
    el.style.transition = "width 0.2s ease-out";
    el.style.width = "100%";
    timer.current = window.setTimeout(() => {
      el.style.transition = "opacity 0.25s ease";
      el.style.opacity = "0";
    }, 220);
  }, []);

  const start = useCallback(() => {
    const el = bar.current;
    if (!el) return;
    window.clearTimeout(timer.current);
    active.current = true;
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.width = "0%";
    void el.offsetWidth; // flush so the next transition runs from 0
    el.style.transition = "width 6s cubic-bezier(0.1, 0.7, 0.2, 1)";
    el.style.width = "85%";
    timer.current = window.setTimeout(finish, 10000); // safety net
  }, [finish]);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || a.getAttribute("target") === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) return; // same page, nothing to load
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  useEffect(() => { finish(); }, [pathname, finish]);

  return (
    <div
      ref={bar}
      aria-hidden="true"
      style={{
        position: "fixed", top: 0, left: 0, height: 3, width: "0%", opacity: 0,
        background: "linear-gradient(90deg,#4F46E5,#818CF8)",
        borderRadius: "0 3px 3px 0",
        boxShadow: "0 0 8px rgba(79,70,229,0.5)",
        zIndex: 100000, pointerEvents: "none",
      }}
    />
  );
}
