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
  contentWidth?: 'standard' | 'wide' | 'full';
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

export default function Layout({
  children,
  title,
  showNavbar = true,
  showBottomNav = true,
  darkMode = false,
  onToggleDark,
  contentWidth = 'standard',
  showSidebar = false,
  sidebarContent,
}: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedDark = localStorage.getItem("darkMode") === "true";
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-dark", String(storedDark));
      const checkDesktop = () => setIsDesktop(window.innerWidth >= 1280);
      checkDesktop();
      window.addEventListener('resize', checkDesktop);
      return () => window.removeEventListener('resize', checkDesktop);
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!mounted) return null;

  const navbarHeight = showNavbar ? 56 : 0;
  const bottomNavHeight = (showBottomNav && !isDesktop) ? 60 : 0;

  return (
    <div className="page-layout" style={{ minHeight: "100vh", position: "relative" }}>
      {/* Desktop Sidebar */}
      {isDesktop && showSidebar && (
        <aside className={`fixed top-0 left-0 h-full w-64 border-r border-border/20 bg-surface z-50 transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
          <div className="flex h-full flex-col">
            <nav className="flex-shrink-0 border-b border-border/20 flex items-center justify-between px-4" style={{ height: `${navbarHeight}px` }}>
              <Link href="/" className="flex items-center gap-2 text-decoration-none">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <span className="font-bold text-lg text-tracking-tight">Companion</span>
              </Link>
              {onToggleDark && (
                <button
                  onClick={toggleDark}
                  className="w-9 h-9 bg-surface2 rounded-full flex items-center justify-center hover:bg-surface3 transition-colors"
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? "☀️" : "🌙"}
                </button>
              )}
            </nav>

            <div className="flex-1 overflow-y-auto p-6">
              {sidebarContent}
            </div>

            {/* Mobile overlay */}
            {!isDesktop && (
              <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
            )}
          </div>
        </aside>
      )}

      {/* Main navbar */}
      {(!isDesktop || !showSidebar) && (
        <nav
          className={`fixed top-0 left-0 right-0 z-50 border-b bg-surface`}
          style={{ height: `${navbarHeight}px`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}
        >
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-lg text-tracking-tight">Companion</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isDesktop && (
              <button
                onClick={toggleSidebar}
                className="w-9 h-9 bg-surface2 rounded-full flex items-center justify-center hover:bg-surface3 transition-colors"
                aria-label="Open menu"
              >
                {'☰'}
              </button>
            )}

            {showNavbar && (
              <>
                {onToggleDark && (
                  <button
                    onClick={toggleDark}
                    className={`w-9 h-9 bg-surface2 rounded-full flex items-center justify-center hover:bg-surface3 transition-colors ${darkMode ? 'dark-mode-toggle' : ''}`}
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {darkMode ? "☀️" : "🌙"}
                  </button>
                )}
              </>
            )}
          </div>
        </nav>
      )}

      <main
        className={`flex-1 w-full overflow-x-hidden ${isDesktop && showSidebar ? 'ml-64' : ''}`}
        style={{
          minHeight: `calc(100vh - ${navbarHeight}px - ${bottomNavHeight}px)`,
          paddingTop: `calc(${navbarHeight}px + env(safe-area-inset-top, 0px))`,
          paddingBottom: `calc(${bottomNavHeight}px + env(safe-area-inset-bottom, 0px))`
        }}
      >
        <div className={`min-h-full flex flex-col ${contentWidth === 'standard' ? 'container' : contentWidth === 'wide' ? 'max-w-6xl' : ''} mx-auto ${contentWidth === 'full' ? '' : 'px-4'}`}>
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation (mobile only) */}
      {showBottomNav && !isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-surface"
             style={{ height: `${bottomNavHeight}px`, display: "flex" }}>
          <Link href="/" className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/ai" className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">🤖</span>
            <span className="text-xs font-medium">AI</span>
          </Link>
          <Link href="/subjects?mode=practice" className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">✏️</span>
            <span className="text-xs font-medium">Practice</span>
          </Link>
          <Link href="/mock" className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">📋</span>
            <span className="text-xs font-medium">Mock</span>
          </Link>
          <Link href="/profile" className="flex-1 flex flex-col items-center justify-center gap-1 text-decoration-none hover:bg-primary/10 active:bg-primary/20">
            <span className="text-xs font-medium">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
