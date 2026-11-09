"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, ChevronRight, Zap,
  Languages, Sigma, Atom, FlaskConical, Dna, Landmark, TrendingUp, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavView";
import { palette, subjectColor } from "../lib/design";
import { useDark } from "../lib/theme";
import { getTopics } from "../lib/syllabus";
import { Progress } from "../lib/progress";

const SUBJECTS: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: "english",     name: "English Language",      Icon: Languages },
  { id: "mathematics", name: "Mathematics",           Icon: Sigma },
  { id: "physics",     name: "Physics",               Icon: Atom },
  { id: "chemistry",   name: "Chemistry",             Icon: FlaskConical },
  { id: "biology",     name: "Biology",               Icon: Dna },
  { id: "government",  name: "Government",            Icon: Landmark },
  { id: "economics",   name: "Economics",             Icon: TrendingUp },
  { id: "literature",  name: "Literature in English", Icon: BookOpen },
];

export default function DrillPicker() {
  const dark = useDark();
  const T = palette(dark);
  const [subject, setSubject] = useState<string | null>(null);
  const [completed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    const all = Progress.getCompletedTopics();
    Progress.getSyllabusProgress().forEach(id => all.add(id));
    return all;
  });

  const topics = subject ? getTopics(subject) : [];
  const active = SUBJECTS.find(s => s.id === subject);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, paddingBottom: BOTTOM_NAV_HEIGHT + 20, fontFamily: "var(--font)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px" }}>
        <Link href="/practice" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.sub, fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 12, minHeight: 44 }}>
          <ArrowLeft size={16} /> Practice
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: T.accentTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={20} color={T.accent} strokeWidth={2} />
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.5px" }}>Quick Drills</h1>
        </div>
        <p style={{ fontSize: 13, color: T.sub, margin: "0 0 20px", lineHeight: 1.55 }}>
          Short scored drills, one topic at a time. Pick a subject, pick the topic you just studied, and drill it while it is fresh.
        </p>

        {!subject && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SUBJECTS.map(s => {
              const color = subjectColor(s.id);
              const count = getTopics(s.id).length;
              return (
                <button key={s.id} onClick={() => setSubject(s.id)} style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "14px 16px",
                  cursor: "pointer", fontFamily: "inherit", minHeight: 44,
                }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: `${color}1F`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <s.Icon size={21} color={color} strokeWidth={1.9} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.text }}>{s.name}</span>
                    <span style={{ display: "block", fontSize: 12, color: T.sub, marginTop: 2 }}>{count} topics</span>
                  </span>
                  <ChevronRight size={18} color={T.muted} style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}

        {subject && active && (
          <div>
            <button onClick={() => setSubject(null)} style={{
              display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none",
              color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 12, minHeight: 44, fontFamily: "inherit",
            }}>
              <ArrowLeft size={16} /> All subjects
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: "0 0 12px" }}>{active.name} topics</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topics.map(t => {
                const done = completed.has(t.id);
                return (
                  <Link key={t.id} href={`/drill/${t.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: T.surface, borderRadius: 12, padding: "14px 16px",
                      border: `1px solid ${done ? T.success + "55" : T.border}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.topic}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                          {done ? "Studied — drill it to lock it in" : "Not studied yet — drill works anyway"}
                        </div>
                      </div>
                      {done
                        ? <CheckCircle2 size={20} color={T.success} style={{ flexShrink: 0 }} />
                        : <Zap size={18} color={T.accent} style={{ flexShrink: 0 }} />}
                    </div>
                  </Link>
                );
              })}
              {topics.length === 0 && (
                <p style={{ fontSize: 13, color: T.sub }}>No topics listed for this subject yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
