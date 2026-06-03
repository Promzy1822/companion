"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, Bot, BookOpen, PenTool, ClipboardList,
  CalendarDays, Settings, LogOut, ChevronDown,
  Sun, Moon, Sparkles,
} from "lucide-react";
import AppLogo from "./AppLogo";
import { C, palette } from "../lib/design";

interface UserData { name: string; email: string; target: string; institution?: string; }

const NAV = [
  { icon: Home,          label: "Dashboard",  href: "/"                       },
  { icon: Bot,           label: "Ask AI",      href: "/ai"                     },
  { icon: BookOpen,      label: "Learn",       href: "/subjects?mode=learn"    },
  { icon: PenTool,       label: "Practice",    href: "/subjects?mode=practice" },
  { icon: ClipboardList, label: "Mock Exam",   href: "/mock"                   },
  { icon: CalendarDays,  label: "Study Plan",  href: "/studyplan"              },
  { icon: Settings,      label: "Profile",     href: "/profile"                },
];

export default function Navbar({
  darkMode = false,
  onToggleDark,
}: {
  darkMode?: boolean;
  onToggleDark?: () => void;
}) {
  const [user, setUser] = useState<UserData | null>(null);
  const router   = useRouter();
  const pathname = usePathname();
  const T        = palette(darkMode);

  useEffect(() => {
    try {
      const u = localStorage.getItem("companion_user");
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, [pathname]);

  const logout = () => {
    try { localStorage.removeItem("companion_user"); } catch {}
    setUser(null);
    router.push("/landing");
  };

  const ic = { size: 17, strokeWidth: 1.8 } as const;

  return (
    <div className="flex h-full items-center justify-between px-4">
      <AppLogo size={28} showText darkMode={darkMode} />

      <div className="flex items-center gap-2">
        {onToggleDark && (
          <button
            onClick={onToggleDark}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 bg-surface2 rounded-full flex items-center justify-center hover:bg-surface3 transition-colors"
          >
            {darkMode ? <Sun  {...ic} color={T.sub} /> : <Moon {...ic} color={T.sub} />}
          </button>
        )}

        {user ? (
          <div className="relative">
            <button
              onClick={() => {
                // Dropdown would be handled by parent layout or a separate dropdown component
                // For now, we'll just navigate to profile on click
              }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text">{user.name.split(" ")[0]}</div>
                <div className="text-xs text-muted">{user.email}</div>
              </div>
              <ChevronDown
                size={13} strokeWidth={2.5} color={T.sub}
                className="transition-transform duration-200"
                // Would add rotation logic here if we had dropdown state
              />
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-3 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Up
            </Link>
          )}
        </div>
      </div>
    );
}
