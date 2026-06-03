"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavbar?: boolean;
  showBottomNav?: boolean;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export default function Layout({
  children,
  title,
  showNavbar = true,
  showBottomNav = true,
  darkMode = false,
  onToggleDark,
}: LayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize dark mode from localStorage
    const storedDark = localStorage.getItem("darkMode") === "true";
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-dark", String(storedDark));
    }
  }, []);

  const toggleDark = () => {
    const n = !darkMode;
    if (onToggleDark) onToggleDark();
    localStorage.setItem("darkMode", String(n));
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-dark", String(n));
    }
  };

  if (!mounted) return null;

  const navbarHeight = showNavbar ? 56 : 0;
  const bottomNavHeight = showBottomNav ? 60 : 0;

  return (
    <div className="page-layout" style={{ minHeight: "100vh" }}>
      {showNavbar && (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-surface"
             style={{ height: `${navbarHeight}px`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-lg text-tracking-tight">Companion</span>
          </Link>

          <div className="flex items-center gap-2">
            {onToggleDark && (
              <button
                onClick={toggleDark}
                className={`w-9 h-9 bg-surface2 rounded-full flex items-center justify-center hover:bg-surface3 transition-colors ${darkMode ? 'dark-mode-toggle' : ''}`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            )}

            {/* User menu would go here when authenticated */}
          </div>
        </nav>
      )}

      <main className="page-content flex-1 w-full overflow-x-hidden"
            style={{
              paddingTop: `calc(${navbarHeight}px + env(safe-area-inset-top, 0px))`,
              paddingBottom: `calc(${bottomNavHeight}px + env(safe-area-inset-bottom, 0px))`
            }}>
        {children}
      </main>

      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-surface"
             style={{ height: `${bottomNavHeight}px`, display: "flex" }}>
          <Link href="/"
                className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none
                           hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link href="/ai"
                className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none
                           hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">🤖</span>
            <span className="text-xs font-medium">AI</span>
          </Link>

          <Link href="/subjects?mode=practice"
                className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none
                           hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">✏️</span>
            <span className="text-xs font-medium">Practice</span>
          </Link>

          <Link href="/mock"
                className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none
                           hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">📋</span>
            <span className="text-xs font-medium">Mock</span>
          </Link>

          <Link href="/profile"
                className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none
                           hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

