"use client";
import Link from "next/link";
import {
  Bot, BookOpen, PenTool, ClipboardList, Lightbulb, CalendarDays,
} from "lucide-react";
import { C, palette } from "../lib/design";

const LINKS = [
  { icon: Bot,           label: "Ask AI",     sub: "24/7 tutor",     href: "/ai",                  color: C.primary,  bg: "#E7F0FF" },
  { icon: BookOpen,      label: "Learn",      sub: "Video lessons",  href: "/subjects?mode=learn",  color: "#0D8050",  bg: "#E6F4EA" },
  { icon: PenTool,       label: "Practice",   sub: "Past questions", href: "/subjects?mode=practice",color: "#7B3FBE", bg: "#F3E8FF" },
  { icon: ClipboardList, label: "Mock Exam",  sub: "Timed test",     href: "/mock",                 color: "#C75B21",  bg: "#FFF0E6" },
  { icon: Lightbulb,     label: "Solver",     sub: "AI explains",    href: "/solver",               color: "#B07D00",  bg: "#FEF9E7" },
  { icon: CalendarDays,  label: "Study Plan", sub: "AI generated",   href: "/studyplan",            color: "#D0021B",  bg: "#FEE2E2" },
];

export default function QuickLinks({ darkMode = false }: { darkMode?: boolean }) {
  const T = palette(darkMode);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "10px",
    }}>
      {LINKS.map(l => {
        const Icon = l.icon;
        const bgIcon = darkMode ? T.s2 : l.bg;
        const colorIcon = darkMode ? l.color : l.color;
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              padding: "14px 10px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.15s, transform 0.1s",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "12px",
                background: bgIcon,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 8px",
              }}>
                <Icon size={19} strokeWidth={1.8} color={colorIcon} />
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: T.text, marginBottom: "2px" }}>
                {l.label}
              </div>
              <div style={{ fontSize: "10px", color: T.sub, lineHeight: 1.3 }}>
                {l.sub}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
