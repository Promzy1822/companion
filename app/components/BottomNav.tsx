"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Bot, BookOpen, ClipboardList, CalendarDays, ListChecks, User,
  type LucideIcon,
} from "lucide-react";
import AppLogo from "./AppLogo";
import { C, palette } from "../lib/design";

export const BOTTOM_NAV_HEIGHT = 60;

interface NavItem {
  icon:  LucideIcon;
  label: string;
  href:  string;
  match: string[];
}

const TABS: NavItem[] = [
  { icon: Home,          label: "Home",    href: "/",                    match: ["/"] },
  { icon: Bot,           label: "AI",      href: "/ai",                  match: ["/ai"] },
  { icon: BookOpen,      label: "Learn",   href: "/subjects?mode=learn", match: ["/subjects", "/learn", "/lessons"] },
  { icon: ClipboardList, label: "Mock",    href: "/mock",                match: ["/mock"] },
  { icon: User,          label: "Profile", href: "/profile",             match: ["/profile"] },
];

const RAIL: NavItem[] = [
  { icon: Home,          label: "Dashboard", href: "/",                    match: ["/"] },
  { icon: Bot,           label: "Ask AI",    href: "/ai",                  match: ["/ai"] },
  { icon: BookOpen,      label: "Learn",     href: "/subjects?mode=learn", match: ["/subjects", "/learn", "/lessons"] },
  { icon: ClipboardList, label: "Mock Exam", href: "/mock",                match: ["/mock"] },
  { icon: CalendarDays,  label: "Study Plan",href: "/studyplan",           match: ["/studyplan"] },
  { icon: ListChecks,    label: "Syllabus",  href: "/syllabus",            match: ["/syllabus"] },
  { icon: User,          label: "Profile",   href: "/profile",             match: ["/profile"] },
];

function isActive(pathname: string, match: string[]): boolean {
  return match.some(m =>
    m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/")
  );
}

export default function BottomNav({ darkMode }: { darkMode?: boolean }) {
  const pathname = usePathname() ?? "";
  const dm = darkMode ?? false;
  const T  = palette(dm);

  // Keep CSS variables in sync with the page's dark-mode toggle.
  useEffect(() => {
    if (darkMode === undefined) return;
    document.documentElement.setAttribute("data-dark", darkMode ? "true" : "false");
  }, [darkMode]);

  return (
    <>
      {/* Laptop: side rail (hidden on phones/tablets via CSS) */}
      <aside
        className="side-rail"
        aria-label="Main navigation"
        style={{ background: T.surface, borderRight: `1px solid ${T.border}` }}
      >
        <div style={{ padding: "6px 10px 18px" }}>
          <AppLogo size={30} showText darkMode={dm} />
        </div>
        {RAIL.map(item => {
          const Icon   = item.icon;
          const active = isActive(pathname, item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rail-link"
              aria-current={active ? "page" : undefined}
              style={{
                background: active ? (dm ? "#1F2050" : C.primaryLight) : undefined,
                color:      active ? C.primary : T.sub,
                fontWeight: active ? 700 : 600,
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Phone + tablet: bottom tabs (hidden on laptop via CSS) */}
      <nav
        className="navbar-fixed bottom-nav"
        style={{
          position:      "fixed",
          bottom:        0,
          left:          0,
          right:         0,
          height:        `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          background:    T.surface,
          borderTop:     `1px solid ${T.border}`,
          display:       "flex",
          zIndex:        150,
          boxShadow:     "0 -1px 0 rgba(0,0,0,0.04)",
          transform:     "translateZ(0)",
        }}
      >
        {TABS.map(tab => {
          const Icon   = tab.icon;
          const active = isActive(pathname, tab.match);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="nav-tab"
              style={{
                flex: 1,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "3px", textDecoration: "none",
                paddingTop: "8px",
              }}
            >
              <div className="nav-pill" style={{
                width: 44, height: 28, borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? (dm ? "#1F2050" : C.primaryLight) : "transparent",
              }}>
                <Icon
                  size={21}
                  strokeWidth={active ? 2.2 : 1.8}
                  color={active ? C.primary : T.sub}
                />
              </div>
              <span style={{
                fontSize: "10.5px",
                fontWeight: active ? 700 : 500,
                color: active ? C.primary : T.sub,
                lineHeight: 1,
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
