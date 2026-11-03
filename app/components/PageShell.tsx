"use client";
import { useEffect, useState } from "react";

interface PageShellProps {
  children: React.ReactNode;
  dark?:    boolean;
}

// Becomes true once any page has hydrated in this tab. After that, client-side
// navigations render instantly (there is no server HTML to match), so the
// placeholder below is only ever used on a hard load.
let booted = false;

/**
 * Wraps every page. On a hard load it shows a blank, theme-coloured screen until the page has
 * hydrated (the splash screen is already covering it). It uses CSS variables, so it always
 * matches Light, Dark or System, whichever is active. On later navigations it renders instantly.
 */
export default function PageShell({ children }: PageShellProps) {
  const [ready, setReady] = useState(booted);

  useEffect(() => {
    if (booted) return;
    const id = requestAnimationFrame(() => { booted = true; setReady(true); });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) return <div aria-busy="true" style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  return <>{children}</>;
}
