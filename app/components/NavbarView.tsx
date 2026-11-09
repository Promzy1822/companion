"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronDown, Sparkles, User, KeyRound } from "lucide-react";
import AppLogo from "./AppLogo";
import { Session } from "../lib/session";
import { palette } from "../lib/design";
import { useDark, useIsoLayoutEffect } from "../lib/theme";
import { isNavActive } from "../lib/nav";

interface UserData { name: string; email: string; target: string; institution?: string; }

// NAVBAR_HEIGHT is exported so pages can use it for paddingTop
export const NAVBAR_HEIGHT = 56;

export default function NavbarView() {
  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const router   = useRouter();
  const pathname = usePathname() ?? "";
  const dark     = useDark();
  const T        = palette(dark);

  useEffect(() => { setOpen(false); }, [pathname]);

  useIsoLayoutEffect(() => {
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

  const menuItems = [
    { icon: User,     label: "Profile & Settings", href: "/profile", match: ["/profile"] },
    { icon: KeyRound, label: "Change Password",    href: "/profile#password", match: [] as string[] },
  ];
  const ic = { size: 17, strokeWidth: 1.8 } as const;

  return (
    <>
      <header className="top-bar" style={{
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
      }}>
        <span className="top-logo"><AppLogo size={28} showText darkMode={dark} /></span>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>

          {user ? (
            <div ref={dropRef} style={{ position: "relative", zIndex: open ? 310 : undefined }}>
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
                  background: "linear-gradient(135deg,#4F46E5,#818CF8)",
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
                <div className="nav-dropdown" style={{
                  position:  "fixed",
                  top:       `${NAVBAR_HEIGHT + 4}px`,
                  right:     "12px",
                  width:     "252px",
                  background: T.surface,
                  border:    `1px solid ${T.border}`,
                  borderRadius: "14px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                  overflow:  "hidden",
                  zIndex:    300,
                  animation: "navDropIn 0.15s ease both",
                }}>
                  {/* User header */}
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block", padding: "14px 16px",
                      background: T.s2,
                      borderBottom: `1px solid ${T.border}`,
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "linear-gradient(135deg,#4F46E5,#818CF8)",
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
                        <Sparkles size={12} color={T.primary} strokeWidth={1.8} />
                        <span style={{ fontSize: "12px", color: T.sub }}>Target score</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: T.primary }}>{user.target} pts</span>
                    </div>
                  </Link>

                  {/* Account links */}
                  <div style={{ padding: "4px 0" }}>
                    {menuItems.map(item => {
                      const Icon   = item.icon;
                      const active = isNavActive(pathname, item.match);
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "10px 16px", textDecoration: "none",
                            background: active ? T.primaryTint : "transparent",
                            transition: "background 0.1s",
                          }}
                        >
                          <Icon {...ic} color={active ? T.primary : T.sub} />
                          <span style={{
                            fontSize: "14px",
                            fontWeight: active ? 700 : 500,
                            color: active ? T.primary : T.text,
                            flex: 1,
                          }}>
                            {item.label}
                          </span>
                          {active && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.primary }} />
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
                      <LogOut size={17} strokeWidth={1.8} color={T.danger} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: T.danger }}>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              style={{
                background: T.primary, color: "#fff",
                borderRadius: "50px", padding: "8px 18px",
                fontSize: "13px", fontWeight: 700, textDecoration: "none",
              }}
            >
              Sign Up
            </Link>
          )}
        </div>

        {open && <div className="nav-scrim" aria-hidden="true" />}
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
