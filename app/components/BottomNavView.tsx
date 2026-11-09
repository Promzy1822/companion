"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppLogo from "./AppLogo";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";
import { NAV_ITEMS, NAV_SECONDARY, isNavActive } from "../lib/nav";

export const BOTTOM_NAV_HEIGHT = 60;

export default function BottomNavView({ railOnly = false }: { railOnly?: boolean }) {
  const pathname = usePathname() ?? "";
  const dark = useDark();
  const T = palette(dark);

  const railItems = [...NAV_ITEMS, ...NAV_SECONDARY];

  return (
    <>
      {/* Laptop: side rail (hidden on phones/tablets via CSS) */}
      <aside
        className="side-rail"
        aria-label="Main navigation"
        style={{ background: T.surface, borderRight: `1px solid ${T.border}` }}
      >
        <div style={{ padding: "6px 10px 18px" }}>
          <AppLogo size={30} showText darkMode={dark} />
        </div>
        {railItems.map(item => {
          const Icon   = item.icon;
          const active = isNavActive(pathname, item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rail-link"
              aria-current={active ? "page" : undefined}
              style={{
                background: active ? T.primaryTint : undefined,
                color:      active ? T.primary : T.sub,
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
      {!railOnly && (
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
          {NAV_ITEMS.map(item => {
            const Icon   = item.icon;
            const active = isNavActive(pathname, item.match);
            if (item.center) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-tab"
                  aria-current={active ? "page" : undefined}
                  style={{
                    flex: 1,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "flex-end",
                    gap: "2px", textDecoration: "none",
                    paddingBottom: "6px",
                  }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%",
                    marginTop: -16,
                    background: T.primary,
                    border: `3px solid ${T.surface}`,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={23} strokeWidth={2} color="#FFFFFF" />
                  </div>
                  <span style={{
                    fontSize: "10.5px",
                    fontWeight: active ? 700 : 500,
                    color: active ? T.primary : T.sub,
                    lineHeight: 1,
                  }}>
                    {item.label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-tab"
                aria-current={active ? "page" : undefined}
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
                  background: active ? T.primaryTint : "transparent",
                }}>
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.2 : 1.8}
                    color={active ? T.primary : T.sub}
                  />
                </div>
                <span style={{
                  fontSize: "10.5px",
                  fontWeight: active ? 700 : 500,
                  color: active ? T.primary : T.sub,
                  lineHeight: 1,
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
