"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, BookOpen, ClipboardList, User } from "lucide-react";
import { C, palette } from "../lib/design";

export const BOTTOM_NAV_HEIGHT = 60;

const TABS = [
  { icon: Home,          label: "Home",     href: "/",                        basePath: "/"         },
  { icon: Bot,           label: "AI",       href: "/ai",                      basePath: "/ai"        },
  { icon: BookOpen,      label: "Learn",    href: "/subjects?mode=learn",     basePath: "/subjects"  },
  { icon: ClipboardList, label: "Mock",     href: "/mock",                    basePath: "/mock"      },
  { icon: User,          label: "Profile",  href: "/profile",                 basePath: "/profile"   },
];

export default function BottomNav({ darkMode = false }: { darkMode?: boolean }) {
  const pathname = usePathname();
  const T        = palette(darkMode);

  return (
    <nav className="navbar-fixed" style={{
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
    }}>
      {TABS.map(tab => {
        const Icon = tab.icon;
        const active =
          tab.basePath === "/"
            ? pathname === "/"
            : pathname === tab.basePath || pathname.startsWith(tab.basePath + "/");

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
