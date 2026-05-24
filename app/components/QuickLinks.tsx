"use client";
import Link from "next/link";
import {
  Bot, BookOpen, PenTool, ClipboardList,
  Lightbulb, CalendarDays,
} from "lucide-react";

const LINKS = [
  { icon: Bot,           label: "Ask AI",     sub: "Chat with tutor", href: "/ai",                  color: "#8b5cf6" },
  { icon: BookOpen,      label: "Learn",      sub: "Video lessons",   href: "/subjects?mode=learn",  color: "#3b82f6" },
  { icon: PenTool,       label: "Practice",   sub: "Past questions",  href: "/subjects?mode=practice",color: "#10b981" },
  { icon: ClipboardList, label: "Mock Exam",  sub: "Timed test",      href: "/mock",                 color: "#f59e0b" },
  { icon: Lightbulb,     label: "Solver",     sub: "AI explanations", href: "/solver",               color: "#ea580c" },
  { icon: CalendarDays,  label: "Study Plan", sub: "Daily schedule",  href: "/studyplan",            color: "#ec4899" },
];

export default function QuickLinks({ darkMode }: { darkMode: boolean }) {
  const card  = darkMode ? "#1c1c1e" : "#fff";
  const text  = darkMode ? "#f2f2f7" : "#1c1c1e";
  const sub   = darkMode ? "#98989d" : "#6e6e73";
  const bord  = darkMode ? "#2c2c2e" : "#e5e5ea";

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: "10px", marginBottom: "16px",
    }}>
      {LINKS.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              backgroundColor: card,
              borderRadius: "16px",
              padding: "16px 14px",
              textDecoration: "none",
              border: `1px solid ${bord}`,
              boxShadow: darkMode
                ? "0 1px 4px rgba(0,0,0,0.4)"
                : "0 1px 6px rgba(0,0,0,0.06)",
              display: "flex", flexDirection: "column", gap: "10px",
              transition: "transform 0.12s, box-shadow 0.12s",
            }}
          >
            {/* Icon pill */}
            <div style={{
              width: 38, height: 38, borderRadius: "11px",
              backgroundColor: l.color + "18",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={19} color={l.color} strokeWidth={1.8} />
            </div>

            <div>
              <div style={{
                fontSize: "14px", fontWeight: 700,
                color: text, marginBottom: "2px",
              }}>
                {l.label}
              </div>
              <div style={{ fontSize: "11px", color: sub }}>
                {l.sub}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
