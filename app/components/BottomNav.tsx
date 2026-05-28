"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, PenTool, ClipboardList, User } from "lucide-react";
import { C, palette } from "../lib/design";

export const BOTTOM_NAV_HEIGHT = 60;

const TABS = [
  { icon: Home,          label: "Home",     href: "/"                       },
  { icon: Bot,           label: "AI",       href: "/ai"                     },
  { icon: PenTool,       label: "Practice", href: "/subjects?mode=practice" },
  { icon: ClipboardList, label: "Mock",     href: "/mock"                   },
  { icon: User,          label: "Profile",  href: "/profile"                },
];

export default function BottomNav({ darkMode = false }: { darkMode?: boolean }) {
  const pathname = usePathname();
  const T        = palette(darkMode);

  return (
    <nav style={{
      position:    "fixed",
      bottom:      0,
      left:        0,
      right:       0,
      /* Use safe-area-inset for devices with home indicator (iPhone X+) */
      height:      `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      background:  T.surface,
      borderTop:   `1px solid ${T.border}`,
      display:     "flex",
      zIndex:      150,
      boxShadow:   "0 -1px 0 rgba(0,0,0,0.04)",
      /* Force its own stacking context */
      transform:   "translateZ(0)",
      willChange:  "auto",
    }}>
      {TABS.map(tab => {
        const Icon   = tab.icon;
        const active = pathname === tab.href || pathname.startsWith(tab.href + "?");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "3px", textDecoration: "none",
              paddingTop: "8px",
            }}
          >
            <div style={{
              width: 40, height: 26, borderRadius: "13px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? (darkMode ? "#1A2A4A" : C.primaryLight) : "transparent",
              transition: "background 0.15s",
            }}>
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                color={active ? C.primary : (darkMode ? "#8A8D91" : "#65676B")}
              />
            </div>
            <span style={{
              fontSize: "10px",
              fontWeight: active ? 700 : 500,
              color: active ? C.primary : (darkMode ? "#8A8D91" : "#65676B"),
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
