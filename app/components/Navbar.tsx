"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, Bot, BookOpen, ClipboardList,
  CalendarDays, Settings, LogOut, ChevronDown,
  Sun, Moon, Sparkles,
} from "lucide-react";
import AppLogo from "./AppLogo";
import { Session } from "../lib/session";
import { C, D, palette } from "../lib/design";

interface UserData { name: string; email: string; target: string; institution?: string; }

const NAV = [
  { icon: Home,          label: "Dashboard",  href: "/"                       },
  { icon: Bot,           label: "Ask AI",      href: "/ai"                     },
  { icon: BookOpen,      label: "Learn",       href: "/subjects?mode=learn"    },
  { icon: ClipboardList, label: "Mock Exam",   href: "/mock"                   },
  { icon: CalendarDays,  label: "Study Plan",  href: "/studyplan"              },
  { icon: Settings,      label: "Profile",     href: "/profile"                },
];

// NAVBAR_HEIGHT is exported so pages can use it for paddingTop
export const NAVBAR_HEIGHT = 56;

export default function Navbar({
  darkMode = false,
  onToggleDark,
}: {
  darkMode?: boolean;
  onToggleDark?: () => void;
}) {
  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const router   = useRouter();
  const pathname = usePathname();
  const T        = palette(darkMode);

  useEffect(() => {
    try {
      const u = localStorage.getItem("companion_user");
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const logout = () => {
    Session.logout();
    setUser(null);
    setOpen(false);
    router.push("/landing");
  };

  const ic = { size: 17, strokeWidth: 1.8 } as const;

  return (
    <>
      {/*
        CRITICAL: position fixed — NOT sticky.
        Sticky breaks when a parent has overflow set or transform applied.
        Fixed always works relative to the viewport.
        The page content must have paddingTop: NAVBAR_HEIGHT to compensate.
      */}
      <header style={{
        position:   "fixed",
        top:        0,
        left:       0,
        right:      0,
        height:     `${NAVBAR_HEIGHT}px`,
        display:    "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding:    "0 16px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        boxShadow:  "0 1px 0 rgba(0,0,0,0.06)",
        zIndex:     200,
        /* Prevent any layout shift from subpixel rendering */
        willChange: "auto",
        transform:  "translateZ(0)", /* creates its own stacking context, prevents paint issues */
      }}>
        <AppLogo size={28} showText darkMode={darkMode} />

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {onToggleDark && (
            <button
              onClick={onToggleDark}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "none", background: T.s2,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              {darkMode
                ? <Sun  {...ic} color={T.sub} />
                : <Moon {...ic} color={T.sub} />}
            </button>
          )}

          {user ? (
            <div ref={dropRef} style={{ position: "relative" }}>
              <button
                onClick={() => setOpen(p => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  background: open ? T.s2 : "transparent",
                  border: "none", borderRadius: "50px",
                  padding: "4px 10px 4px 4px",
                  cursor: "pointer", transition: "background 0.15s",
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg,#1877F2,#42A5F5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: T.text, lineHeight: 1 }}>
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown
                  size={13} strokeWidth={2.5} color={T.sub}
                  style={{
                    transform: open ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}
                />
              </button>

              {open && (
                <div style={{
                  /*
                    position fixed relative to viewport, not relative to the navbar.
                    top: NAVBAR_HEIGHT ensures it appears directly below the header.
                    This avoids any clipping from parent overflow settings.
                  */
                  position:  "fixed",
                  top:       `${NAVBAR_HEIGHT + 4}px`,
                  right:     "12px",
                  width:     "252px",
                  background: T.surface,
                  border:    `1px solid ${T.border}`,
                  borderRadius: "14px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                  overflow:  "hidden",
                  zIndex:    300, /* above navbar */
                  animation: "navDropIn 0.15s ease both",
                }}>
                  {/* User header */}
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block", padding: "14px 16px",
                      background: darkMode ? D.surface2 : "#F8FAFF",
                      borderBottom: `1px solid ${T.border}`,
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "linear-gradient(135deg,#1877F2,#42A5F5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "17px", fontWeight: 800, color: "#fff",
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: T.text }}>{user.name}</div>
                        <div style={{ fontSize: "12px", color: T.sub, marginTop: "1px" }}>{user.email}</div>
                      </div>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "7px 10px", borderRadius: "8px", background: T.s2,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Sparkles size={12} color={C.primary} strokeWidth={1.8} />
                        <span style={{ fontSize: "12px", color: T.sub }}>Target score</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: C.primary }}>{user.target} pts</span>
                    </div>
                  </Link>

                  {/* Nav links */}
                  <div style={{ padding: "4px 0" }}>
                    {NAV.map(item => {
                      const Icon   = item.icon;
                      const active = pathname === item.href || pathname.startsWith(item.href + "?");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "10px 16px", textDecoration: "none",
                            background: active ? (darkMode ? "#1A2A4A" : C.primaryLight) : "transparent",
                            transition: "background 0.1s",
                          }}
                        >
                          <Icon {...ic} color={active ? C.primary : T.sub} />
                          <span style={{
                            fontSize: "14px",
                            fontWeight: active ? 700 : 500,
                            color: active ? C.primary : T.text,
                            flex: 1,
                          }}>
                            {item.label}
                          </span>
                          {active && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.primary }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: `1px solid ${T.border}`, padding: "4px 0" }}>
                    <button
                      onClick={logout}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "12px",
                        padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
                      }}
                    >
                      <LogOut size={17} strokeWidth={1.8} color={C.danger} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: C.danger }}>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              style={{
                background: C.primary, color: "#fff",
                borderRadius: "50px", padding: "8px 18px",
                fontSize: "13px", fontWeight: 700, textDecoration: "none",
              }}
            >
              Sign Up
            </Link>
          )}
        </div>
      </header>

      <style>{`
        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </>
  );
}
