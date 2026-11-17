"use client";
import { generateSyllabusAlignedPlan, getSubjectSyllabus, JAMB_SYLLABUS } from "../lib/syllabus";
import { useState, useEffect, Suspense } from "react";
import { PageSkeleton } from "../components/AppLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Target, BookOpen, Clock, CheckCircle,
  RefreshCw, CalendarRange, LayoutGrid,
  BedDouble, BrainCircuit, ChevronRight, ArrowLeft, ListChecks,
  AlertCircle, X, PenLine,
} from "lucide-react";
import { Progress, todayWAT } from "../lib/progress";
import { Sync } from "../lib/sync";
import { palette, TY, FW, SP, R, subjectColor } from "../lib/design";
import { getEffectiveExam, normalizeExamChoice, daysUntil, WINDOW_LABEL } from "../lib/exam-date";
import CoverageView from "../components/CoverageView";


import { useDark, useIsoLayoutEffect } from "../lib/theme";
interface User {
  name: string; target: string; institution: string;
  course: string; subjects: string[]; deadline: string;
  selfRating: string; recommendation?: string;
}
interface DayPlan {
  day: number; date: string; subject: string; topic: string;
  subtopic: string; topicId?: string; done: boolean;
  type: "study" | "practice" | "rest";
}
interface WeekPlan { week: number; focus: string; goal: string; days: DayPlan[]; }

// Brand hero gradient — the same named const Home v3 uses. It is the only
// literal colour in this file; every other colour comes from T.*.
const HERO_GRADIENT = "linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)";

function focusName(week: number, total: number): string {
  if (week === 1)                      return "Foundation & Orientation";
  if (week <= Math.ceil(total * 0.4))  return "Core Learning";
  if (week <= Math.ceil(total * 0.7))  return "Application & Practice";
  if (week === total - 1)              return "Mock Exams & Review";
  return "Final Revision";
}

// P6: the week goal is built from the week's real content — the subjects and
// topics actually scheduled that week — never the tautology
// "Cover all N subjects for week X". Computed at render so plans stored
// before this rebuild get a real goal too.
function weekGoalFromDays(days: DayPlan[]): string {
  const seen: string[] = [];
  const parts: string[] = [];
  for (const d of days) {
    if (d.type !== "study") continue;
    if (seen.includes(d.subject)) continue;
    seen.push(d.subject);
    parts.push(`${d.subject}: ${d.topic}`);
    if (parts.length >= 3) break;
  }
  const prac = days.filter(d => d.type === "practice").length;
  if (prac) parts.push(`${prac} practice day${prac > 1 ? "s" : ""}`);
  return parts.join(" · ") || "Review week";
}

function fmtShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

// P11: "9–15 Nov" (or "28 Nov – 4 Dec" across a month boundary).
function weekRange(days: DayPlan[]): string {
  if (!days.length) return "";
  const start = new Date(days[0].date + "T00:00:00");
  const end = new Date(days[days.length - 1].date + "T00:00:00");
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString("en-NG", { month: "short" })}`;
  }
  return `${fmtShortDate(days[0].date)} – ${fmtShortDate(days[days.length - 1].date)}`;
}

function fmtLongDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

// Display name ("English Language") -> Learn / Questions key ("english").
// Resolved through the syllabus so the mapping lives in one place.
function subjectKeyOf(name: string): string {
  const s = getSubjectSyllabus(name);
  if (s) {
    for (const [k, v] of Object.entries(JAMB_SYLLABUS)) if (v === s) return k;
  }
  return name.toLowerCase().replace(/[^a-z]/g, "").replace("language", "") || "english";
}

// P1: the real path into the work. Lesson when the day has a topicId, else
// the subject's Learn page. Practice days go to Past Questions.
function lessonHref(d: DayPlan): string {
  if (d.type === "practice") return "/questions";
  if (d.topicId) return `/lessons/${d.topicId}`;
  return `/learn/${subjectKeyOf(d.subject)}`;
}

function practiceHref(d: DayPlan): string {
  if (d.type === "practice") return "/questions";
  if (d.topicId) return `/drill/${d.topicId}`;
  return `/questions?subject=${subjectKeyOf(d.subject)}`;
}

// P17: solid 4px accent + coloured label + token-tinted tile. Never the
// old `${colour}22` / `${colour}08` hex-alpha wash.
function taskColor(T: ReturnType<typeof palette>, d: DayPlan): string {
  if (d.type === "rest") return T.muted;
  if (d.type === "practice") return T.primary;
  return subjectColor(d.subject);
}

export default function StudyPlan() {
  const router = useRouter();
  const [user,      setUser]      = useState<User | null>(null);
  const [plan,      setPlan]      = useState<WeekPlan[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);
  const dark = useDark();
  const [activeW,   setActiveW]   = useState(0);
  const [view,      setView]      = useState<"today" | "week" | "overview" | "coverage">("today");
  const [mounted,   setMounted]   = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  // M2: generation / load failures are shown, never swallowed.
  const [loadError, setLoadError] = useState<{ kind: "user" | "plan"; message: string } | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);
  const [genError,  setGenError]  = useState<string | null>(null);
  // M4: success notice with a next step, shown after (re)generation.
  const [genSuccess, setGenSuccess] = useState<number | null>(null);

  useIsoLayoutEffect(() => {
    setMounted(true);
    // Exam window: deep-link users align too. Idempotent — a no-op once
    // the choice is recorded. Runs before the user record is read so the
    // deadline in state is already the effective one.
    try { normalizeExamChoice(); } catch {}
    try {
      const u = localStorage.getItem("companion_user");
      if (u) setUser(JSON.parse(u));
    } catch {
      setLoadError({ kind: "user", message: "We couldn't read your saved profile. Your sign-in details may be damaged — try loading again, or go back and sign in again." });
      return;
    }
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "coverage") setView("coverage");
    try {
      const saved = localStorage.getItem("companion_study_plan_v2");
      if (saved) {
        const p: WeekPlan[] = JSON.parse(saved);
        setPlan(p);
        setGenerated(true);
        const today = todayWAT();
        const idx = p.findIndex(w => w.days.some(d => d.date === today));
        if (idx >= 0) setActiveW(idx);
      }
    } catch {
      // M2: corrupt saved JSON is an error state, not silent "no plan".
      setLoadError({ kind: "plan", message: "Your saved plan looks damaged and couldn't be opened. Try again to start fresh — your completed days are kept when you regenerate." });
    }
  }, [loadNonce]);

  // Keep the plan backed up to the account (debounced inside Sync).
  // NOTE (M2): Sync.push is fire-and-forget void — lib/sync swallows
  // failures inside pushNow, so there is no failure signal to surface
  // here. The page therefore never claims the plan "is saved"; a real
  // surfaced sync failure needs a Sync API change, not a page change.
  useEffect(() => {
    if (!mounted || !generated) return;
    try {
      Sync.push("plan");
    } catch (e) {
      console.warn("Plan backup failed", e);
    }
  }, [plan, mounted, generated]);

  const markDone = (wi: number, di: number) => {
    const updated = plan.map((w, a) =>
      a !== wi ? w : {
        ...w,
        days: w.days.map((d, b) => b !== di ? d : { ...d, done: true }),
      }
    );
    setPlan(updated);
    try { localStorage.setItem("companion_study_plan_v2", JSON.stringify(updated)); } catch (e) { console.warn("Could not save plan", e); }
    const day = updated[wi].days[di];
    Progress.recordActivity("plan", { subject: day.subject, topicId: day.topic });
    if (day.topicId) Progress.setTopicDone(day.topicId, true, false);
  };

  // P2: Mark Done is a self-certification, so it asks first. The "Completed!"
  // state below is gated on the task's own done flag only — never on any
  // activity that day.
  const confirmMarkDone = (wi: number, di: number) => {
    const day = plan[wi]?.days[di];
    if (!day || day.done) return;
    if (window.confirm(`Did you finish ${day.topic}?`)) markDone(wi, di);
  };

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);
    setGenError(null);
    try {
      // Countdown and generation count from the same effective date.
      const dl    = daysUntil(getEffectiveExam().deadline);
      const weeks = Math.min(14, Math.max(2, Math.ceil(dl / 7)));
      const subs  = user.subjects?.length ? user.subjects : ["English Language", "Mathematics"];
      const weak  = Progress.getWeakSubjects(subs);

      // Carry completed days over a regeneration (matched by subject + topic)
      const doneKeys = new Set<string>();
      try {
        (JSON.parse(localStorage.getItem("companion_plan_carry") || "[]") as string[])
          .forEach(k => doneKeys.add(k));
      } catch {}
      plan.flatMap(w => w.days).forEach(d => { if (d.done) doneKeys.add(`${d.subject}|${d.topic}`); });

      const syllabusItems = generateSyllabusAlignedPlan(subs, weeks, weak);
      const base = todayWAT();
      const dateAt = (n: number) => {
        const d = new Date(base + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + n);
        return d.toISOString().slice(0, 10);
      };
      let ti = 0, off = 0;
      const built: WeekPlan[] = Array.from({ length: weeks }, (_, wi) => {
        const days: DayPlan[] = Array.from({ length: 7 }, (_, di) => {
          const isRest = di === 6;
          const isPrac = di === 4;
          const t = !isRest && !isPrac ? syllabusItems[ti++] : null;
          const subject  = isRest ? "REST" : isPrac ? "ALL" : (t?.subject || subs[0]);
          const topic    = isRest ? "Rest Day" : isPrac ? "Practice & Past Questions" : (t?.topic || "Revision");
          return {
            day:      di + 1,
            date:     dateAt(off++),
            subject,
            topic,
            subtopic: isRest ? "Relax" : isPrac ? "Mixed Subjects" : (t?.subtopic || "Review notes"),
            topicId:  t?.topicId || "",
            // P3: no hours field. The old hardcoded `hours: 2` was fake
            // precision — every study day claimed exactly 2h. There is no
            // per-topic duration anywhere in the syllabus data or the
            // activity log to ground a real estimate, so the hours display
            // is dropped entirely rather than replaced with another
            // invented number. (companion_daily_minutes is a daily total
            // from the wizard, not a per-topic duration, and is out of
            // scope for this page — still open.)
            done:     doneKeys.has(`${subject}|${topic}`),
            type:     (isRest ? "rest" : isPrac ? "practice" : "study") as "study" | "practice" | "rest",
          };
        });
        return {
          week: wi + 1,
          focus: focusName(wi + 1, weeks),
          goal: weekGoalFromDays(days),
          days,
        };
      });
      setPlan(built);
      localStorage.setItem("companion_study_plan_v2", JSON.stringify(built));
      localStorage.removeItem("companion_plan_carry");
      setGenerated(true);
      setGenSuccess(weeks);
      setConfirmRegen(false);
      setView("today");
      const idx = built.findIndex(w => w.days.some(d => d.date === todayWAT()));
      setActiveW(idx >= 0 ? idx : 0);
    } catch (e) {
      // M2: generation failure shows an error state with Retry — the old
      // try/finally swallowed it completely.
      console.warn("Plan generation failed", e);
      setGenError("Something went wrong while building your plan. Your subjects and exam date are still saved — try again.");
    } finally {
      setLoading(false);
    }
  };

  // P14: regenerate is a destructive action in a danger zone with a real
  // confirm (Cancel / Regenerate). Completed days are carried over and the
  // student stays on the plan afterwards — no silent drop to the
  // generate screen.
  const regenerate = () => {
    const doneKeys = plan.flatMap(w => w.days).filter(d => d.done).map(d => `${d.subject}|${d.topic}`);
    try { localStorage.setItem("companion_plan_carry", JSON.stringify(doneKeys)); } catch {}
    void generatePlan();
  };

  const jumpToDay = (wi: number) => {
    if (wi < 0) return;
    setActiveW(wi);
    setView("week");
  };

  // M3: first paint shows the skeleton, never a blank null.
  if (!mounted) return <PageSkeleton dark={dark} />;

  const T         = palette();
  const eff       = getEffectiveExam();
  const today     = todayWAT();
  const todayTask = plan.flatMap(w => w.days).find(d => d.date === today);
  const nextTask  = plan.flatMap(w => w.days).find(d => d.date > today && d.type !== "rest");
  const dl        = daysUntil(eff.deadline);
  // P12: one denominator everywhere — study sessions only, rest days
  // excluded from the overall % and from every week %. And only the
  // task's own done flag counts (P2) — any activity that day does not
  // mark a session done.
  const allStudy  = plan.flatMap(w => w.days).filter(d => d.type !== "rest");
  const doneCt    = allStudy.filter(d => d.done).length;
  const pct       = allStudy.length ? Math.round((doneCt / allStudy.length) * 100) : 0;
  const currentWeekIdx = plan.findIndex(w => w.days.some(d => d.date === today));
  const examLine = eff.estimated
    ? `JAMB 2027 · ${WINDOW_LABEL.replace("March", "Mar")} (proposed)`
    : `JAMB 2027 · ${fmtLongDate(eff.deadline)}`;
  const subtitle = generated && currentWeekIdx >= 0
    ? `Week ${currentWeekIdx + 1} of ${plan.length} · ${examLine}`
    : `Your day-by-day plan to exam day · ${examLine}`;

  // P7: one format for Target everywhere — `{target}/400`.
  const STATS: { l: string; v: string; Icon: React.ElementType }[] = [
    { l: "Days left", v: dl > 999 ? "90+" : String(dl), Icon: Clock      },
    { l: "Target",    v: user?.target ? `${user.target}/400` : "—", Icon: Target     },
    { l: "Subjects",  v: String(user?.subjects?.length || 0), Icon: BookOpen },
  ];

  const upcoming = plan.flatMap((w, wi) => w.days.map(d => ({ ...d, wi })))
    .filter(d => d.date > today).slice(0, 5);

  const todayColour = todayTask ? taskColor(T, todayTask) : T.primary;

  // Lesson-pattern error panel (icon + heading + Try again + Go back).
  const errorPanel = (message: string, onRetry: () => void) => (
    <div className="page-narrow" style={{ background: T.surface, borderRadius: R.xl, padding: SP[6], textAlign: "center", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: SP[3] }}>
        <AlertCircle size={32} color={T.muted} />
      </div>
      <h2 style={{ fontSize: TY.lg, fontWeight: FW.bold, color: T.text, margin: "0 0 6px" }}>Couldn&apos;t load your plan</h2>
      <p style={{ color: T.sub, fontSize: TY.base, lineHeight: 1.6, margin: "0 0 18px" }}>{message}</p>
      <button
        onClick={onRetry}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: 13, borderRadius: R.pill, background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.base, border: "none", cursor: "pointer", minHeight: 48, marginBottom: 10, fontFamily: "inherit" }}
      >
        Try again
      </button>
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: 13, borderRadius: R.pill, background: "transparent", color: T.text, fontWeight: FW.bold, fontSize: TY.base, border: `1px solid ${T.border}`, cursor: "pointer", minHeight: 48, fontFamily: "inherit" }}
      >
        Go back
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily:"var(--font)" }}>

      {/* ── Header ── */}
      <div style={{ background: HERO_GRADIENT, padding: "20px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: SP[3], marginBottom: SP[5] }}>
          <Link href="/" style={{ width: 44, height: 44, borderRadius: R.lg, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={18} color={T.onPrimary} strokeWidth={2} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.xl }}>My Study Plan</div>
            {/* P8: orientation, not marketing — real status + exam window. */}
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: TY.xs }}>{subtitle}</div>
          </div>
          {/* P9: token colours, labelled — white on the translucent chip. */}
          {generated && (
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: R.pill, padding: "4px 12px", fontSize: TY.xs, color: T.onPrimary, fontWeight: FW.bold, flexShrink: 0 }}>
              {pct}% of plan done
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: SP[2] }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: R.lg, padding: "12px 8px", textAlign: "center" }}>
              <s.Icon size={14} color="rgba(255,255,255,0.65)" strokeWidth={1.8} style={{ margin: "0 auto 4px", display: "block" }} />
              <div style={{ color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.lg, lineHeight: 1 }}>{s.v}</div>
              {/* P7/D11: stat labels are content text — 12px, never 10px. */}
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: TY.xs, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* plan-page-pad is tier-aware (76px phone / 24px laptop) — the old
          inline paddingBottom: 96 and the .plan-content 80px laptop rule
          are superseded by it. */}
      <div className="plan-content plan-page-pad" style={{ padding: "16px 20px" }}>

        {/* ── Load error (M2) ── */}
        {loadError ? (
          errorPanel(loadError.message, () => {
            if (loadError.kind === "plan") {
              try { localStorage.removeItem("companion_study_plan_v2"); } catch {}
              setLoadError(null);
              setLoadNonce(n => n + 1);
            } else {
              window.location.reload();
            }
          })
        ) : !generated ? (
          /* ── Generate Screen ── */
          genError ? (
            errorPanel(genError, () => void generatePlan())
          ) : (
          <div className="page-narrow" style={{ background: T.surface, borderRadius: R.xl, padding: SP[6], textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ width: 64, height: 64, borderRadius: R.xl, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CalendarDays size={30} color={T.primary} strokeWidth={1.8} />
            </div>
            <h2 style={{ fontSize: TY.xl, fontWeight: FW.bold, color: T.text, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
              Generate Your Study Plan
            </h2>
            <p style={{ fontSize: TY.base, color: T.sub, margin: "0 0 22px", lineHeight: 1.6 }}>
              We build a day-by-day plan from the official JAMB syllabus — real topics, tailored to your subjects, target score and exam date.
            </p>

            {user && (
              <div style={{ background: T.s2, borderRadius: R.lg, padding: SP[4], marginBottom: SP[5], textAlign: "left" }}>
                {[
                  { l: "Subjects", v: (user.subjects || []).join(", ") || "—" },
                  { l: "Target",   v: user.target ? `${user.target}/400` : "—" },
                  // P16: one label — "Days left" — header and summary.
                  { l: "Days left", v: `${dl} days left` },
                  { l: "Exam", v: eff.estimated ? `${WINDOW_LABEL} (proposed)` : fmtLongDate(eff.deadline) },
                ].map((r, i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: SP[3], fontSize: TY.sm, padding: "6px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ color: T.sub, flexShrink: 0 }}>{r.l}</span>
                    <span style={{ color: T.text, fontWeight: FW.semibold, textAlign: "right" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {!user ? (
              <Link href="/auth" style={{ display: "block", width: "100%", padding: 14, borderRadius: R.lg, background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.base, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                Log in to generate your plan
              </Link>
            ) : (
              <button
                onClick={() => void generatePlan()}
                disabled={loading}
                style={{
                  width: "100%", padding: 14, borderRadius: R.lg, border: "none",
                  background: loading ? T.s3 : T.primary,
                  color: loading ? T.muted : T.onPrimary,
                  fontWeight: FW.bold, fontSize: TY.base,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {/* P15: the loading copy appears once — button label only. */}
                {loading ? "Building your plan…" : "Generate My Plan"}
              </button>
            )}
          </div>
          )

        ) : (
          <div>
            {/* ── Success notice (M4) ── */}
            {genSuccess !== null && (
              <div style={{ background: T.successTint, border: `1px solid ${T.success}`, borderRadius: R.xl, padding: "14px 16px", marginBottom: SP[4], display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CheckCircle size={20} color={T.successText} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>Your plan is ready — {genSuccess} weeks, starting today</div>
                  <div style={{ fontSize: TY.sm, color: T.sub, marginTop: 2 }}>
                    {todayTask && todayTask.type !== "rest" ? (
                      <Link href={lessonHref(todayTask)} style={{ color: T.primaryText, fontWeight: FW.semibold, textDecoration: "none" }}>
                        Start today&apos;s task: {todayTask.topic}
                      </Link>
                    ) : (
                      <button onClick={() => setView("week")} style={{ background: "none", border: "none", padding: 0, color: T.primaryText, fontWeight: FW.semibold, fontSize: TY.sm, cursor: "pointer", fontFamily: "inherit" }}>
                        View this week
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={() => setGenSuccess(null)} aria-label="Dismiss" style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0 }}>
                  <X size={16} color={T.sub} />
                </button>
              </div>
            )}

            {/* ── Regenerate error (M2) ── */}
            {genError && (
              <div style={{ background: T.dangerTint, border: `1px solid ${T.danger}`, borderRadius: R.xl, padding: "14px 16px", marginBottom: SP[4], display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertCircle size={20} color={T.dangerText} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>Couldn&apos;t rebuild your plan</div>
                  <div style={{ fontSize: TY.sm, color: T.sub, marginTop: 2 }}>{genError}</div>
                </div>
                <button onClick={() => void generatePlan()} style={{ background: T.primary, color: T.onPrimary, border: "none", borderRadius: R.pill, padding: "8px 14px", fontWeight: FW.bold, fontSize: TY.xs, cursor: "pointer", flexShrink: 0, minHeight: 36 }}>
                  Try again
                </button>
                <button onClick={() => setGenError(null)} aria-label="Dismiss" style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0 }}>
                  <X size={16} color={T.sub} />
                </button>
              </div>
            )}

            {/* ── View Switcher ── */}
            <div style={{ display: "flex", gap: 4, background: T.s2, borderRadius: R.lg, padding: 4, marginBottom: SP[4] }}>
              {([
                // P10: Today uses CalendarDays (not MapPin); icons 14px.
                { v: "today",    label: "Today",    Icon: CalendarDays  },
                { v: "week",     label: "Week",     Icon: CalendarRange },
                { v: "overview", label: "Overview", Icon: LayoutGrid    },
                { v: "coverage", label: "Coverage", Icon: ListChecks    },
              ] as { v: "today"|"week"|"overview"|"coverage"; label: string; Icon: React.ElementType }[]).map(tab => (
                <button
                  key={tab.v}
                  onClick={() => setView(tab.v)}
                  style={{
                    flex: 1, padding: "9px 6px", minHeight: 44, borderRadius: R.md, border: "none",
                    cursor: "pointer", fontSize: TY.xs, fontWeight: FW.bold,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    background: view === tab.v ? T.primary : "transparent",
                    color: view === tab.v ? T.onPrimary : T.sub,
                    transition: "all 0.2s",
                  }}
                >
                  <tab.Icon size={14} strokeWidth={2} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── TODAY VIEW ── */}
            {view === "today" && (
              <div className="plan-today">
                {todayTask ? (
                  <div style={{ background: T.surface, borderRadius: R.xl, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: SP[4], borderLeft: `4px solid ${todayColour}` }}>
                    {/* Task info */}
                    <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: SP[3] }}>
                        <div style={{ width: 44, height: 44, borderRadius: R.lg, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {todayTask.type === "rest"
                            ? <BedDouble size={20} color={todayColour} strokeWidth={1.8} />
                            : todayTask.type === "practice"
                              ? <Target size={20} color={todayColour} strokeWidth={1.8} />
                              : <BookOpen size={20} color={todayColour} strokeWidth={1.8} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: FW.bold, color: T.sub, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                            Today&apos;s Task
                          </div>
                          <div style={{ fontSize: TY.xs, fontWeight: FW.bold, color: todayColour, marginBottom: 6 }}>
                            {todayTask.subject === "REST" ? "Rest" : todayTask.subject === "ALL" ? "All subjects" : todayTask.subject}
                          </div>
                          <div style={{ fontSize: TY.lg, fontWeight: FW.bold, color: T.text, marginBottom: 4, letterSpacing: "-0.2px", lineHeight: 1.35 }}>
                            {todayTask.topic}
                          </div>
                          <div style={{ fontSize: TY.sm, color: T.sub }}>
                            {todayTask.subtopic}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* P2: "Completed!" shows only when this task's own done
                        flag is set — never from any activity that day. */}
                    {todayTask.done ? (
                      <div style={{ padding: "14px 18px", background: T.successTint, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.success, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CheckCircle size={17} color={T.onPrimary} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.successText }}>Completed!</div>
                          <div style={{ fontSize: TY.xs, color: T.sub }}>
                            {nextTask ? (
                              <span>Up next: {nextTask.topic} ·{" "}
                                <button onClick={() => jumpToDay(plan.findIndex(w => w.days.some(d => d.date === nextTask.date)))} style={{ background: "none", border: "none", padding: 0, color: T.primaryText, fontWeight: FW.semibold, fontSize: TY.xs, cursor: "pointer", fontFamily: "inherit" }}>
                                  See what&apos;s next
                                </button>
                              </span>
                            ) : "Streak updated — keep it up"}
                          </div>
                        </div>
                      </div>
                    ) : todayTask.type !== "rest" ? (
                      <div style={{ padding: "12px 18px" }}>
                        {/* P1: primary path into the work. */}
                        <div style={{ display: "flex", gap: 10 }}>
                          <Link
                            href={lessonHref(todayTask)}
                            style={{ flex: 2, padding: 11, borderRadius: R.md, border: "none", background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.sm, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44, boxSizing: "border-box" }}
                          >
                            <BookOpen size={14} strokeWidth={2} />
                            {todayTask.type === "practice" ? "Practice questions" : "Start lesson"}
                          </Link>
                          {todayTask.type !== "practice" && (
                            <Link
                              href={practiceHref(todayTask)}
                              style={{ flex: 1, padding: 11, borderRadius: R.md, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: T.text, fontWeight: FW.semibold, fontSize: TY.sm, textDecoration: "none", minHeight: 44, boxSizing: "border-box" }}
                            >
                              <PenLine size={14} strokeWidth={1.8} />
                              Practice
                            </Link>
                          )}
                        </div>
                        {/* Ask AI + Mark Done demoted to quiet links. */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: SP[4], marginTop: SP[3] }}>
                          <Link
                            href={`/ai?q=${encodeURIComponent(`Explain ${todayTask.topic} (${todayTask.subject})`)}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.sub, fontWeight: FW.semibold, fontSize: TY.sm, textDecoration: "none", padding: "6px 4px" }}
                          >
                            <BrainCircuit size={14} strokeWidth={1.8} />
                            Ask AI
                          </Link>
                          <span style={{ color: T.muted, fontSize: TY.sm }}>·</span>
                          <button
                            onClick={() => {
                              const wi = plan.findIndex(w => w.days.some(d => d.date === today));
                              const di = plan[wi]?.days.findIndex(d => d.date === today);
                              if (wi >= 0 && di >= 0) confirmMarkDone(wi, di);
                            }}
                            style={{ background: "none", border: "none", padding: "6px 4px", color: T.sub, fontWeight: FW.semibold, fontSize: TY.sm, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
                          >
                            <CheckCircle size={14} strokeWidth={2} />
                            Mark Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                        <BedDouble size={20} color={T.sub} strokeWidth={1.8} />
                        <span style={{ fontSize: TY.base, color: T.sub, fontWeight: FW.semibold }}>
                          Rest day{nextTask ? ` — back to ${nextTask.subject} tomorrow` : " — recharge for tomorrow"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: T.surface, borderRadius: R.xl, padding: 28, textAlign: "center", border: `1px solid ${T.border}`, marginBottom: SP[4] }}>
                    <div style={{ width: 56, height: 56, borderRadius: R.xl, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <CalendarDays size={24} color={T.primary} strokeWidth={1.8} />
                    </div>
                    <div style={{ fontSize: TY.lg, fontWeight: FW.bold, color: T.text }}>No task scheduled today</div>
                    {/* M6/P5: no promised list below — real links instead. */}
                    <div style={{ fontSize: TY.sm, color: T.sub, marginTop: 6, marginBottom: SP[4] }}>Your plan has nothing for today. Pick up where you left off, or check your coverage.</div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={() => setView("coverage")} style={{ padding: "11px 18px", borderRadius: R.pill, border: "none", background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44 }}>
                        Browse topics
                      </button>
                      <Link href="/subjects" style={{ padding: "11px 18px", borderRadius: R.pill, border: `1px solid ${T.border}`, color: T.text, fontWeight: FW.semibold, fontSize: TY.sm, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44, boxSizing: "border-box" }}>
                        Go to Learn
                      </Link>
                    </div>
                  </div>
                )}

                {/* Coming Up */}
                <div style={{ background: T.surface, borderRadius: R.xl, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: FW.bold, color: T.sub, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Coming Up
                  </div>
                  {upcoming.length === 0 ? (
                    <div style={{ padding: "16px", fontSize: TY.sm, color: T.sub }}>Nothing scheduled after today.</div>
                  ) : upcoming.map((d, i, arr) => {
                    // P4: every row is a real link — lesson/drill when the
                    // day has a topicId, else the subject's Learn page.
                    // Rest days jump to that day in Week view. No dead
                    // chevrons, no truncated topics (2-line clamp).
                    const rowInner = (
                      <>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: taskColor(T, d), flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: TY.sm, fontWeight: FW.bold, color: T.text, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{d.topic}</div>
                          <div style={{ fontSize: TY.xs, color: T.sub }}>
                            {d.subject === "REST" ? "Rest" : d.subject === "ALL" ? "All subjects" : d.subject} · {new Date(d.date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                          </div>
                        </div>
                        <ChevronRight size={14} color={T.muted} strokeWidth={2} style={{ flexShrink: 0 }} />
                      </>
                    );
                    const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: SP[3], padding: "11px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", width: "100%", textAlign: "left", background: "none", cursor: "pointer", fontFamily: "inherit" };
                    return d.type === "rest" ? (
                      <button key={d.date} onClick={() => jumpToDay(d.wi)} style={{ ...rowStyle, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
                        {rowInner}
                      </button>
                    ) : (
                      <Link key={d.date} href={d.type === "practice" ? "/questions" : lessonHref(d)} style={{ ...rowStyle, textDecoration: "none" }}>
                        {rowInner}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── WEEK VIEW ── */}
            {view === "week" && (
              // .plan-week / .plan-week-pills (coordinator CSS): laptop =
              // sticky pill column beside the day list; phone/tablet =
              // pills scroll horizontally above the list. The 2-column
              // phone day grid from the S7 sample was NOT used: at ~165px
              // per column a topic + subtopic + date wraps to 4–5 lines
              // and the day sequence reads across-then-down, which hurts
              // readability. The audit allows the sticky-column
              // alternative, and it is used at every size here.
              <div className="plan-week">
                {/* Week selector pills */}
                <div className="plan-week-pills" style={{ display: "flex", gap: SP[2], overflowX: "auto", paddingBottom: 4, marginBottom: SP[4], scrollbarWidth: "none" }}>
                  {plan.map((w, i) => {
                    const studyDays = w.days.filter(d => d.type !== "rest");
                    const wDone = studyDays.filter(d => d.done).length;
                    const isCurrent = i === currentWeekIdx;
                    const dot = wDone === studyDays.length && studyDays.length > 0 ? T.success : wDone > 0 ? T.primary : T.muted;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveW(i)}
                        style={{ flexShrink: 0, padding: "7px 16px", minHeight: 44, display: "flex", alignItems: "center", gap: 6, borderRadius: R.pill, border: "none", cursor: "pointer", fontSize: TY.sm, fontWeight: FW.bold, background: activeW === i ? T.primary : T.s2, color: activeW === i ? T.onPrimary : T.sub, transition: "all 0.2s" }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: activeW === i ? T.onPrimary : dot, flexShrink: 0 }} />
                        W{w.week} · {weekRange(w.days)}
                        {isCurrent && <span style={{ fontSize: 11, fontWeight: FW.bold, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.85 }}>Current</span>}
                      </button>
                    );
                  })}
                </div>

                {plan[activeW] && (
                  <div style={{ background: T.surface, borderRadius: R.xl, overflow: "hidden", border: `1px solid ${T.border}` }}>
                    {/* Week header */}
                    <div style={{ padding: "16px 18px", background: `linear-gradient(135deg,${T.primary},${T.primaryHover})` }}>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px" }}>
                        Week {plan[activeW].week}
                      </div>
                      <div style={{ color: T.onPrimary, fontSize: TY.lg, fontWeight: FW.bold, marginTop: 2 }}>
                        {plan[activeW].focus}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: TY.xs, marginTop: 6 }}>
                        {weekRange(plan[activeW].days)}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: TY.xs, marginTop: 6, display: "flex", alignItems: "flex-start", gap: 5, lineHeight: 1.45 }}>
                        <Target size={12} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{weekGoalFromDays(plan[activeW].days)}</span>
                      </div>
                    </div>

                    {/* Day rows */}
                    <div style={{ padding: SP[2] }}>
                      {plan[activeW].days.map((d, i) => {
                        const isToday = d.date === today;
                        const done    = d.done;
                        const isRest  = d.type === "rest";
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex", alignItems: "center", gap: SP[3],
                              padding: "11px 10px", borderRadius: R.md, marginBottom: 4,
                              background: isToday ? T.primaryTint : "transparent",
                              border: `1px solid ${isToday ? T.primary : "transparent"}`,
                            }}
                          >
                            {/* Day indicator */}
                            <div style={{ width: 30, height: 30, borderRadius: R.md, flexShrink: 0, background: done ? T.primary : T.s2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {done
                                ? <CheckCircle size={15} color={T.onPrimary} strokeWidth={2.5} />
                                : isRest
                                  ? <BedDouble size={14} color={T.sub} strokeWidth={1.8} />
                                  : <span style={{ fontSize: TY.xs, fontWeight: FW.bold, color: T.sub }}>{d.day}</span>}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: TY.sm, fontWeight: FW.bold, color: isRest ? T.sub : T.text, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {d.topic}
                              </div>
                              <div style={{ fontSize: TY.xs, color: T.sub }}>
                                {d.subject === "REST" ? "Rest" : d.subject === "ALL" ? "All subjects" : d.subject} · {d.subtopic}
                              </div>
                            </div>

                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: TY.xs, color: T.sub }}>
                                {new Date(d.date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short" })}
                              </div>
                              {/* P3: no hours display — see generatePlan. */}
                            </div>

                            {!done && !isRest && isToday && (
                              <button
                                onClick={() => confirmMarkDone(activeW, i)}
                                style={{ padding: "6px 14px", minHeight: 44, borderRadius: R.md, border: "none", background: T.primary, color: T.onPrimary, fontWeight: FW.bold, fontSize: TY.xs, cursor: "pointer", flexShrink: 0 }}
                              >
                                Done
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── OVERVIEW ── */}
            {view === "overview" && (
              <div className="plan-overview" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Overall progress */}
                <div style={{ background: T.surface, borderRadius: R.xl, padding: "16px 18px", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: SP[2] }}>
                    <span style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>Overall Progress</span>
                    <span style={{ fontSize: TY.lg, fontWeight: FW.bold, color: T.primary }}>{pct}%</span>
                  </div>
                  {/* P13: one bar token — 8px tall (SP[2]), R.sm radius. */}
                  <div style={{ height: SP[2], borderRadius: R.sm, background: T.s3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${T.primary},${T.primaryHover})`, borderRadius: R.sm, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 6 }}>
                    {doneCt} of {allStudy.length} study sessions completed
                  </div>
                </div>

                {/* Per-week cards */}
                {plan.map((w, wi) => {
                  // P12: study sessions only — rest days excluded from the
                  // count and the denominator, labelled as such.
                  const studyDays = w.days.filter(d => d.type !== "rest");
                  const wDone = studyDays.filter(d => d.done).length;
                  const wp    = studyDays.length ? Math.round((wDone / studyDays.length) * 100) : 0;
                  return (
                    <button
                      key={wi}
                      onClick={() => { setActiveW(wi); setView("week"); }}
                      style={{ background: T.surface, borderRadius: R.lg, padding: "14px 16px", border: `1px solid ${activeW === wi ? T.primary : T.border}`, cursor: "pointer", textAlign: "left", width: "100%", transition: "border-color 0.2s" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                          <div style={{ fontSize: TY.sm, fontWeight: FW.bold, color: T.text }}>Week {w.week} — {w.focus}</div>
                          <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{weekGoalFromDays(w.days)}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: TY.lg, fontWeight: FW.bold, color: wp >= 70 ? T.successText : T.primary }}>{wp}%</div>
                          <div style={{ fontSize: TY.xs, color: T.sub }}>{wDone}/{studyDays.length} study days</div>
                        </div>
                      </div>
                      <div style={{ height: SP[2], borderRadius: R.sm, background: T.s3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${wp}%`, background: wp >= 70 ? T.success : T.primary, transition: "width 0.5s" }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── COVERAGE (the merged Syllabus) ── */}
            {view === "coverage" && (
              <Suspense fallback={<div style={{ minHeight: 200 }} />}>
                <CoverageView />
              </Suspense>
            )}

            {/* P14: Regenerate lives in a danger zone with a real confirm,
                not as a quiet footer link. */}
            <div style={{ marginTop: SP[4], background: T.surface, borderRadius: R.xl, border: `1px solid ${T.danger}`, padding: "14px 16px" }}>
              <div style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>Danger zone</div>
              <div style={{ fontSize: TY.sm, color: T.sub, marginTop: 2, lineHeight: 1.5 }}>
                Regenerate rebuilds all {plan.length} weeks from your subjects and exam date. Completed days are kept.
              </div>
              {!confirmRegen ? (
                <button
                  onClick={() => setConfirmRegen(true)}
                  style={{ marginTop: SP[3], padding: "11px 18px", borderRadius: R.pill, border: `1px solid ${T.danger}`, background: "transparent", color: T.dangerText, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}
                >
                  <RefreshCw size={14} strokeWidth={2} />
                  Regenerate Plan
                </button>
              ) : (
                <div style={{ marginTop: SP[3], display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setConfirmRegen(false)}
                    style={{ padding: "11px 18px", borderRadius: R.pill, border: `1px solid ${T.border}`, background: "transparent", color: T.text, fontWeight: FW.bold, fontSize: TY.sm, cursor: "pointer", minHeight: 44 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={regenerate}
                    disabled={loading}
                    style={{ padding: "11px 18px", borderRadius: R.pill, border: "none", background: loading ? T.s3 : T.danger, color: loading ? T.muted : T.onPrimary, fontWeight: FW.bold, fontSize: TY.sm, cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}
                  >
                    <RefreshCw size={14} strokeWidth={2} />
                    {loading ? "Rebuilding…" : "Regenerate"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
