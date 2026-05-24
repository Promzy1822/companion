"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, BookOpen, PenTool, ClipboardList, BrainCircuit,
  CalendarDays, User, LogOut, Bot, Sparkles, ChevronDown,
  Moon, Sun, Settings
} from "lucide-react";
import AppLogo from "./AppLogo";

interface User { name: string; email: string; target: string; }

const NAV_ITEMS = [
  { icon: Home,          label: "Dashboard",       href: "/" },
  { icon: Bot,           label: "Ask AI",           href: "/ai" },
  { icon: BookOpen,      label: "Learn",            href: "/subjects?mode=learn" },
  { icon: PenTool,       label: "Practice",         href: "/subjects?mode=practice" },
  { icon: ClipboardList, label: "Mock Exam",        href: "/mock" },
  { icon: CalendarDays,  label: "Study Plan",       href: "/studyplan" },
  { icon: Settings,      label: "Profile",          href: "/profile" },
];

export default function Navbar({
  darkMode,
  onToggleDark,
}: {
  darkMode: boolean;
  onToggleDark: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const logout = () => {
    localStorage.removeItem("companion_user");
    setUser(null);
    setOpen(false);
    router.push("/landing");
  };

  const ic = (color: string) => ({
    width: 17, height: 17,
    color,
    strokeWidth: 1.8,
    flexShrink: 0,
  } as React.CSSProperties & { width: number; height: number; strokeWidth: number });

  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", marginBottom: "20px",
      position: "relative", zIndex: 100,
    }}>
      {/* Logo */}
      <AppLogo size={36} showText />

      {/* Right controls */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          aria-label="Toggle dark mode"
          style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            backgroundColor: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {darkMode
            ? <Sun  size={17} color="#fff" strokeWidth={1.8} />
            : <Moon size={17} color="#fff" strokeWidth={1.8} />}
        </button>

        {/* Profile dropdown */}
        {user ? (
          <div ref={dropRef} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen(p => !p)}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: "20px", padding: "5px 10px 5px 5px",
                cursor: "pointer",
              }}
            >
              {/* Avatar initial */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#fde68a,#f97316)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 800, color: "#7c2d12",
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                {user.name.split(" ")[0]}
              </span>
              <ChevronDown
                size={13} color="rgba(255,255,255,0.7)" strokeWidth={2.5}
                style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
            </button>

            {open && (
              <div style={{
                position: "fixed", top: "68px", right: "16px", width: "248px",
                backgroundColor: darkMode ? "#1c1c1e" : "#fff",
                borderRadius: "18px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${darkMode ? "#2c2c2e" : "#f0f0f0"}`,
                overflow: "hidden", zIndex: 9999,
                animation: "dropIn 0.15s ease both",
              }}>

                {/* User header */}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block", padding: "16px",
                    background: darkMode
                      ? "linear-gradient(135deg,#2a1810,#1c1c1e)"
                      : "linear-gradient(135deg,#fff8f5,#fff)",
                    borderBottom: `1px solid ${darkMode ? "#2c2c2e" : "#f5f5f5"}`,
                    textDecoration: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "linear-gradient(135deg,#fde68a,#f97316)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", fontWeight: 800, color: "#7c2d12",
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: darkMode ? "#f2f2f7" : "#1a1a1a" }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: "11px", color: darkMode ? "#98989d" : "#999" }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "7px 12px", borderRadius: "10px",
                    backgroundColor: darkMode ? "#2c2c2e" : "#fff8f5",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={13} color="#ea580c" strokeWidth={1.8} />
                      <span style={{ fontSize: "12px", color: darkMode ? "#98989d" : "#666" }}>Target</span>
                    </div>
                    <span style={{ fontSize: "13px", color: "#ea580c", fontWeight: 700 }}>
                      {user.target} pts
                    </span>
                  </div>
                </Link>

                {/* Nav links */}
                <div style={{ padding: "6px 0" }}>
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "?");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "11px 16px", textDecoration: "none",
                          backgroundColor: active
                            ? (darkMode ? "#2a1810" : "#fff8f5")
                            : "transparent",
                          transition: "background 0.12s",
                        }}
                      >
                        <Icon
                          size={17} strokeWidth={1.8}
                          color={active ? "#ea580c" : (darkMode ? "#98989d" : "#555")}
                        />
                        <span style={{
                          fontSize: "14px", fontWeight: active ? 700 : 500,
                          color: active ? "#ea580c" : (darkMode ? "#f2f2f7" : "#1a1a1a"),
                          flex: 1,
                        }}>
                          {item.label}
                        </span>
                        {active && (
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%",
                            backgroundColor: "#ea580c",
                          }} />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Logout */}
                <div style={{ borderTop: `1px solid ${darkMode ? "#2c2c2e" : "#f0f0f0"}`, padding: "6px 0" }}>
                  <button
                    onClick={logout}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "12px",
                      padding: "11px 16px", background: "none", border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={17} strokeWidth={1.8} color="#ef4444" />
                    <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: 700 }}>
                      Log Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auth"
            style={{
              background: "rgba(255,255,255,0.2)", borderRadius: "20px",
              padding: "8px 16px", color: "#fff", fontSize: "13px",
              textDecoration: "none", fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Sign Up
          </Link>
        )}
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
