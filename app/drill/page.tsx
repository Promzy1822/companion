"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, ChevronRight, Zap,
  Languages, Sigma, Atom, FlaskConical, Dna, Landmark, TrendingUp, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { palette, subjectColor, R, TY, SP, LAYOUT } from "../lib/design";
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

/** Signup stores display names; these pages route on keys. */
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

/**
 * Best drill score per topic, from real completed drills only.
 * Drill finishes record a "practice" activity with topicId + correct/total,
 * so the best percentage is the max over those activities. Topics never
 * drilled have no entry and show no chip — never invent a number.
 * (The activity log is trimmed to 90 days, so an old best can age out;
 * that is honest — it only ever shows a score that exists in the log.)
 */
function bestScoresByTopic(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const best: Record<string, number> = {};
  try {
    const log = Progress.getStreak().activityLog;
    for (const day of Object.values(log)) {
      for (const a of day) {
        if (a.type !== "practice" || !a.topicId || !a.total) continue;
        const pct = Math.round(((a.correct ?? 0) / a.total) * 100);
        if (best[a.topicId] === undefined || pct > best[a.topicId]) best[a.topicId] = pct;
      }
    }
  } catch { return {}; }
  return best;
}

function DrillPickerContent() {
  const dark = useDark();
  const T = palette();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [completed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    const all = Progress.getCompletedTopics();
    Progress.getSyllabusProgress().forEach(id => all.add(id));
    return all;
  });
  const [best] = useState<Record<string, number>>(bestScoresByTopic);

  // My-subjects filtering (preserved): own subjects only, read from
  // companion_user exactly as before. No stored subjects = all 8 shown.
  const [myKeys] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const u = JSON.parse(localStorage.getItem("companion_user") || "{}");
      const subs: string[] = u.subjects || [];
      return subs.map(s => DISPLAY_TO_KEY[s]).filter(Boolean);
    } catch { return []; }
  });
  const visibleSubjects = myKeys.length ? SUBJECTS.filter(s => myKeys.includes(s.id)) : SUBJECTS;

  // D4: subject picker state lives in the URL (?subject=), not useState —
  // deep-linkable, and back/forward restores it. Unknown subjects are
  // ignored (show all subjects) rather than rendering an empty list.
  const rawSubject = searchParams.get("subject");
  const subject = rawSubject && visibleSubjects.some(s => s.id === rawSubject) ? rawSubject : null;
  const topics = subject ? getTopics(subject) : [];
  const active = SUBJECTS.find(s => s.id === subject);
  const selectSubject = (id: string | null) => {
    router.replace(id ? `/drill?subject=${id}` : "/drill", { scroll: false });
  };

  return (
    <div className="drill-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
      {/* Picker uses the wider shell (AUDIT §3.10): the 760px cap is for the
          runner's question card, not the picker grid. Padding is tier-aware
          via .drill-content (16px phone / 20px 24px laptop). */}
      <div className="drill-content" style={{ maxWidth: LAYOUT.contentMax, margin: "0 auto" }}>
        <Link href="/practice" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.sub, fontSize: TY.sm, fontWeight: 600, textDecoration: "none", marginBottom: SP[3], minHeight: 44 }}>
          <ArrowLeft size={16} /> Practice
        </Link>

        {!subject && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ width: 40, height: 40, borderRadius: R.lg, background: T.accentTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={20} color={T.accent} strokeWidth={2} />
              </span>
              <h1 style={{ fontSize: TY.xxl, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.5px" }}>Quick Drills</h1>
            </div>
            <p style={{ fontSize: TY.sm, color: T.sub, margin: "0 0 20px", lineHeight: 1.55 }}>
              Short drills by topic · about 5 minutes each{myKeys.length ? ` · your ${visibleSubjects.length} subjects only` : ""}
            </p>

            <div className="drill-picker-grid">
              {visibleSubjects.map(s => {
                const color = subjectColor(s.id);
                const subjectTopics = getTopics(s.id);
                const studiedCount = subjectTopics.filter(t => completed.has(t.id)).length;
                return (
                  <button key={s.id} onClick={() => selectSubject(s.id)} style={{
                    display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                    background: T.surface, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: "14px 16px",
                    cursor: "pointer", fontFamily: "inherit", minHeight: 56,
                  }}>
                    <span style={{ width: 44, height: 44, borderRadius: R.lg, background: `${color}1F`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <s.Icon size={21} color={color} strokeWidth={1.9} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.text }}>{s.name}</span>
                      {/* D3: what the data actually supports — topic count plus
                          how many are studied. There is no per-topic question
                          count in the syllabus data, so none is shown. */}
                      <span style={{ display: "block", fontSize: TY.xs, color: T.sub, marginTop: 2 }}>
                        {subjectTopics.length} topics{studiedCount > 0 ? ` · ${studiedCount} studied` : ""}
                      </span>
                    </span>
                    <ChevronRight size={18} color={T.muted} style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {subject && active && (
          <div>
            <button onClick={() => selectSubject(null)} style={{
              display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none",
              color: T.sub, fontSize: TY.sm, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: SP[3], minHeight: 44, fontFamily: "inherit",
            }}>
              <ArrowLeft size={16} /> All subjects
            </button>
            <h1 style={{ fontSize: TY.xl, fontWeight: 800, color: T.text, margin: "0 0 4px" }}>{active.name} drills</h1>
            <p style={{ fontSize: TY.sm, color: T.sub, margin: "0 0 20px", lineHeight: 1.55 }}>
              Pick a topic — instant marking, Flame keeps score.
            </p>
            <div className="drill-picker-grid">
              {topics.map(t => {
                const done = completed.has(t.id);
                const bestPct = best[t.id];
                return (
                  <Link key={t.id} href={`/drill/${t.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: T.surface, borderRadius: R.lg, padding: "14px 16px",
                      border: `1px solid ${done ? T.success + "55" : T.border}`,
                      display: "flex", alignItems: "center", gap: 10, minHeight: 56,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: TY.base, fontWeight: 700, color: T.text }}>{t.topic}</div>
                        {/* D2: neutral copy — no apology for drilling before
                            studying. Sample wording, verbatim. */}
                        <div style={{ fontSize: TY.xs, color: T.muted, marginTop: 2, lineHeight: 1.5 }}>
                          {done ? "Studied — drill it to lock it in" : "Try it before you study — see what you already know"}
                        </div>
                      </div>
                      {/* D3: best-score chip only where a real completed
                          drill exists for this topic. */}
                      {bestPct !== undefined && (
                        <span style={{
                          fontSize: TY.xs, fontWeight: 800, color: T.successText,
                          background: T.successTint, border: `1px solid ${T.success}55`,
                          padding: "3px 9px", borderRadius: R.pill, whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          Best {bestPct}%
                        </span>
                      )}
                      {done
                        ? <CheckCircle2 size={20} color={T.success} style={{ flexShrink: 0 }} />
                        : <Zap size={18} color={T.accent} style={{ flexShrink: 0 }} />}
                    </div>
                  </Link>
                );
              })}
              {topics.length === 0 && (
                <p style={{ fontSize: TY.sm, color: T.sub }}>No topics listed for this subject yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DrillPicker() {
  return (
    <Suspense fallback={(
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)" }}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 13 }}>Loading drills…</div>
        </div>
      </div>
    )}>
      <DrillPickerContent />
    </Suspense>
  );
}
