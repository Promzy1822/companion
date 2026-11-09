"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ClipboardList, Zap, ChevronRight, Trophy } from "lucide-react";
import { C, palette } from "../lib/design";
import { useDark } from "../lib/theme";

const SUBJECTS = [
  { id: "english",     label: "English Language",      count: 773 },
  { id: "mathematics", label: "Mathematics",           count: 465 },
  { id: "physics",     label: "Physics",               count: 406 },
  { id: "biology",     label: "Biology",               count: 424 },
  { id: "government",  label: "Government",            count: 430 },
  { id: "economics",   label: "Economics",             count: 420 },
  { id: "literature",  label: "Literature in English", count: 415 },
];
const TOTAL = SUBJECTS.reduce((a, s) => a + s.count, 0);

const CARDS = [
  {
    icon: BookOpen, href: "/questions", title: "Past Questions",
    sub: `${TOTAL.toLocaleString()} real JAMB questions · 2010–2018 · 7 subjects`,
  },
  {
    icon: ClipboardList, href: "/mock", title: "Mock Exam",
    sub: "Timed mocks built from real past questions in your subjects",
  },
  {
    icon: Zap, href: "/questions?mode=practice", title: "Quick Drills",
    sub: "Instant feedback — see the answer after every question",
  },
];

export default function PracticeHub() {
  const dark = useDark();
  const T = palette(dark);
  const [history, setHistory] = useState<{ score: number; total: number; jambEquivalent: number; date: string }[]>([]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("mock_history") || "[]")); } catch {}
  }, []);

  return (
    <div style={{ minHeight: "100vh", paddingTop: "56px", background: T.bg, fontFamily: "var(--font)" }}>
      <div className="page-narrow" style={{ padding: "20px 14px 100px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: T.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Practice</h1>
        <p style={{ fontSize: "13px", color: T.sub, margin: "0 0 18px" }}>Real JAMB questions, timed mocks and quick drills.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "22px" }}>
          {CARDS.map(card => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} style={{ display: "flex", alignItems: "center", gap: "14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "16px", textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <span style={{ width: 46, height: 46, borderRadius: "13px", background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color={T.primary} strokeWidth={1.8} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: T.text }}>{card.title}</span>
                  <span style={{ display: "block", fontSize: "12px", color: T.sub, marginTop: "2px", lineHeight: 1.45 }}>{card.sub}</span>
                </span>
                <ChevronRight size={18} color={T.muted} style={{ flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>

        <div style={{ fontSize: "12px", fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
          Practice by subject
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "22px" }}>
          {SUBJECTS.map(s => (
            <Link key={s.id} href={`/questions?subject=${s.id}&mode=practice`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "13px 14px", textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <span style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{s.label}</span>
              <span style={{ display: "block", fontSize: "11.5px", color: T.sub, marginTop: "3px" }}>{s.count} questions</span>
            </Link>
          ))}
        </div>

        {history.length > 0 && (
          <Link href="/mock" style={{ display: "block", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", overflow: "hidden", textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={16} color={C.primary} strokeWidth={1.8} />
              <span style={{ fontWeight: 700, color: T.text, fontSize: "14px" }}>Recent mock results</span>
            </div>
            {history.slice(0, 3).map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < Math.min(2, history.length - 1) ? `1px solid ${T.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{h.score}/{h.total} correct</div>
                  <div style={{ fontSize: "11px", color: T.sub }}>{h.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: h.jambEquivalent >= 250 ? "#31A24C" : h.jambEquivalent >= 200 ? "#F7B928" : "#FA3E3E", letterSpacing: "-1px" }}>{h.jambEquivalent}</div>
                  <div style={{ fontSize: "10px", color: T.sub }}>JAMB equiv.</div>
                </div>
              </div>
            ))}
          </Link>
        )}
      </div>
    </div>
  );
}
