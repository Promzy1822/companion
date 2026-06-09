"use client";
import { useEffect, useState } from "react";
import AppLoader from "./AppLoader";

interface PageShellProps {
  children: React.ReactNode;
  dark?:    boolean;
}

/**
 * Wraps every page to prevent blank white/gray screens.
 * Shows a full-screen loader until the component is mounted
 * and localStorage is readable (client-side hydration complete).
 */
export default function PageShell({ children, dark = false }: PageShellProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Single RAF ensures DOM is painted before we show content
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) return <AppLoader fullScreen dark={dark} />;
  return <>{children}</>;
}
