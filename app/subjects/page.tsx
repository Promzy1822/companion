"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Languages, Calculator, Atom, FlaskConical,
  Dna, Scale, TrendingUp, BookOpen, type LucideIcon,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavView";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";
import { getTopics } from "../lib/syllabus";
import { Progress } from "../lib/progress";

const SUBJECTS: { id: string; name: string; Icon: LucideIcon; color: string; questions: number }[] = [
  { id: "english",     name: "English Language",      Icon: Languages,    color: "#818CF8", questions: 773 },
  { id: "mathematics", name: "Mathematics",           Icon: Calculator,   color: "#B07FE8", questions: 465 },
  { id: "physics",     name: "Physics",               Icon: Atom,         color: "#E3B341", questions: 406 },
  { id: "chemistry",   name: "Chemistry",             Icon: FlaskConical, color: "#2FBF71", questions: 727 },
  { id: "biology",     name: "Biology",               Icon: Dna,          color: "#E87F35", questions: 424 },
  { id: "government",  name: "Government",            Icon: Scale,        color: "#8FA3E8", questions: 430 },
  { id: "economics",   name: "Economics",             Icon: TrendingUp,   color: "#3FBFBF", questions: 420 },
  { id: "literature",  name: "Literature in English", Icon: BookOpen,     color: "#E87FB0", questions: 415 },
];

/** Signup stores display names; the app routes on keys. One explicit map — no string surgery. */
const DISPLAY_TO_KEY: Record<string, string> = {
  "English Language": "english",
  "Mathematics": "mathematics",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Government": "government",
  "Economics": "economics",
  "Literature in English": "literature",
};

export default function Subjects() {
  const dark = useDark();
  const [mySubjects] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const u = JSON.parse(localStorage.getItem("companion_user") || "{}");
      const subs: string[] = u.subjects || [];
      return subs.map(s => DISPLAY_TO_KEY[s]).filter(Boolean);
    } catch { return []; }
  });
  const [doneSet] = useState<Set<string>>(() => Progress.getSyllabusProgress());

  const T = palette();
  const isMine = (s: typeof SUBJECTS[0]) => mySubjects.includes(s.id);
  const mine = SUBJECTS.filter(isMine);
  const rest = SUBJECTS.filter(s => !isMine(s));

  // Per-subject syllabus counts: topics from getTopics (syllabus keys are
  // the subject keys, e.g. "english"); done = topics whose id is in the
  // stored syllabus-progress set (Progress.getSyllabusProgress()).
  const stats: Record<string, { topics: number; done: number }> = {};
  for (const s of SUBJECTS) {
    const topics = getTopics(s.id);
    stats[s.id] = {
      topics: topics.length,
      done: topics.filter(t => doneSet.has(t.id)).length,
    };
  }

  const SubjectCard = (s: typeof SUBJECTS[0], mine: boolean) => (
    <Link key={s.id} href={`/learn/${s.id}`} style={{ textDecoration: "none" }}>
      <div className="lift" style={{
        background: T.surface, borderRadius: "16px", padding: "18px 14px",
        border: `1px solid ${T.border}`,
        cursor: "pointer", position: "relative", height: "100%", boxSizing: "border-box",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: "12px", background: `${s.color}1F`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
          <s.Icon size={22} color={s.color} strokeWidth={1.8} />
        </div>
        <div style={{ fontWeight: 700, color: T.text, fontSize: "13px", marginBottom: "3px" }}>{s.name}</div>
        {mine && (
          <div style={{ display: "inline-flex", fontSize: "12px", fontWeight: 700, color: s.color, background: `${s.color}1F`, borderRadius: "999px", padding: "2px 8px", marginBottom: "6px" }}>
            Your subject
          </div>
        )}
        <div style={{ fontSize: "12px", color: T.sub }}>{stats[s.id].topics} topics &middot; {stats[s.id].done} done</div>
        <div style={{ fontSize: "12px", color: T.sub }}>{s.questions} past questions</div>
      </div>
    </Link>
  );

  const sectionHeader = (label: string) => (
    <div style={{ fontSize: "11px", color: T.sub, fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
      {label}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", paddingTop: `${NAVBAR_HEIGHT}px`, background: T.bg, fontFamily: "var(--font)" }}>
      <div className="hero-banner" style={{ background: "linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)", padding: "20px 20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/" aria-label="Back to home" style={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={18} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "24px" }}>Learn</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
              {mySubjects.length > 0
                ? `8 subjects · ${mySubjects.length} in your JAMB combination`
                : "8 subjects"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: `20px 20px calc(${BOTTOM_NAV_HEIGHT}px + 16px)` }}>
        {sectionHeader("Your JAMB Subjects")}
        {mine.length > 0 ? (
          <div className="subject-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            {mine.map(s => SubjectCard(s, true))}
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: T.sub, marginBottom: "24px" }}>
            No subjects selected yet — pick yours in Profile
          </div>
        )}

        {sectionHeader("All subjects")}
        <div className="subject-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {(mine.length > 0 ? rest : SUBJECTS).map(s => SubjectCard(s, false))}
        </div>
      </div>
    </div>
  );
}
