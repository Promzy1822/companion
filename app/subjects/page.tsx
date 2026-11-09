"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Star, Languages, Sigma, Atom, FlaskConical,
  Dna, Landmark, TrendingUp, BookOpen, ChevronRight, type LucideIcon,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavView";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";

const SUBJECTS: { id: string; name: string; Icon: LucideIcon; color: string }[] = [
  { id: "english",     name: "English Language",      Icon: Languages,    color: "#818CF8" },
  { id: "mathematics", name: "Mathematics",           Icon: Sigma,        color: "#B07FE8" },
  { id: "physics",     name: "Physics",               Icon: Atom,         color: "#E3B341" },
  { id: "chemistry",   name: "Chemistry",             Icon: FlaskConical, color: "#2FBF71" },
  { id: "biology",     name: "Biology",               Icon: Dna,          color: "#E87F35" },
  { id: "government",  name: "Government",            Icon: Landmark,     color: "#8FA3E8" },
  { id: "economics",   name: "Economics",             Icon: TrendingUp,   color: "#3FBFBF" },
  { id: "literature",  name: "Literature in English", Icon: BookOpen,     color: "#E87FB0" },
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

  const T = palette(dark);
  const isMine = (s: typeof SUBJECTS[0]) => mySubjects.includes(s.id);
  const mine  = SUBJECTS.filter(isMine);
  const other = SUBJECTS.filter(s => !isMine(s));

  const SubjectCard = (s: typeof SUBJECTS[0], mine: boolean) => (
    <Link key={s.id} href={`/learn/${s.id}`} style={{ textDecoration: "none" }}>
      <div className="lift" style={{
        background: T.surface, borderRadius: "16px", padding: "18px 14px",
        border: mine ? `2px solid ${s.color}55` : `1px solid ${T.border}`,
        cursor: "pointer", position: "relative", height: "100%", boxSizing: "border-box",
      }}>
        {mine && (
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <Star size={12} color={s.color} fill={s.color} strokeWidth={0} />
          </div>
        )}
        <div style={{ width: 44, height: 44, borderRadius: "12px", background: `${s.color}1F`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
          <s.Icon size={22} color={s.color} strokeWidth={1.8} />
        </div>
        <div style={{ fontWeight: 700, color: T.text, fontSize: "13px", marginBottom: "3px" }}>{s.name}</div>
        <div style={{ fontSize: "11px", color: s.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
          Study lessons <ChevronRight size={12} strokeWidth={2.4} />
        </div>
      </div>
    </Link>
  );

  return (
    <div style={{ minHeight: "100vh", paddingTop: `${NAVBAR_HEIGHT}px`, background: T.bg, fontFamily: "var(--font)" }}>
      <div className="hero-banner" style={{ background: "linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)", padding: "20px 20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/" aria-label="Back to home" style={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={18} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "18px" }}>Learn</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Choose a subject to study</div>
          </div>
        </div>
      </div>

      <div style={{ padding: `20px 20px calc(${BOTTOM_NAV_HEIGHT}px + 16px)` }}>
        {mine.length > 0 && (
          <>
            <div style={{ fontSize: "11px", color: T.sub, fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Star size={11} color={T.primary} fill={T.primary} strokeWidth={0} />
              Your JAMB Subjects
            </div>
            <div className="subject-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              {mine.map(s => SubjectCard(s, true))}
            </div>
          </>
        )}

        {other.length > 0 && (
          <>
            <div style={{ fontSize: "11px", color: T.sub, fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Other Subjects
            </div>
            <div className="subject-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {other.map(s => SubjectCard(s, false))}
            </div>
          </>
        )}

        {mine.length === 0 && (
          <div className="subject-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {SUBJECTS.map(s => SubjectCard(s, false))}
          </div>
        )}
      </div>
    </div>
  );
}
