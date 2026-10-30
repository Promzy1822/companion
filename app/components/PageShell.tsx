"use client";
import { useEffect, useState } from "react";
import AppLoader from "./AppLoader";

interface PageShellProps {
  children: React.ReactNode;
  dark?:    boolean;
}

// Becomes true once any page has hydrated in this tab. After that, client-side
// navigations render instantly: there is no server HTML to match, so the
// full-screen loader (and its flash) is only needed on a hard load.
let booted = false;

/**
 * Wraps every page. On a hard load it shows the loader until hydration is done
 * (so localStorage reads never cause a mismatch). On later navigations it
 * renders the page immediately.
 */
export default function PageShell({ children, dark = false }: PageShellProps) {
  const [ready, setReady] = useState(booted);

  useEffect(() => {
    if (booted) return;
    const id = requestAnimationFrame(() => { booted = true; setReady(true); });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) return <AppLoader fullScreen dark={dark} />;
  return <>{children}</>;
}
