"use client";
import { generateSyllabusAlignedPlan } from "../lib/syllabus";
import { useState, useEffect, Suspense } from "react";
import AppLoader, { PageSkeleton } from "../components/AppLoader";
import Link from "next/link";
import {
  CalendarDays, Target, BookOpen, Clock, CheckCircle,
  RefreshCw, MapPin, CalendarRange, LayoutGrid,
  BedDouble, BrainCircuit, ChevronRight, ArrowLeft, ListChecks,
} from "lucide-react";
import { Progress, todayWAT } from "../lib/progress";
import { Sync } from "../lib/sync";
import { buildScheduleTopics, JAMB_TOPICS } from "../lib/jamb-topics";
import { palette } from "../lib/design";
import CoverageView from "../components/CoverageView";


import { useDark, useIsoLayoutEffect } from "../lib/theme";
interface User {
  name: string; target: string; institution: string;
  course: string; subjects: string[]; deadline: string;
  selfRating: string; recommendation?: string;
}
interface DayPlan {
  day: number; date: string; subject: string; topic: string;
  subtopic: string; topicId?: string; hours: number; done: boolean;
  type: "study" | "practice" | "rest";
}
interface WeekPlan { week: number; focus: string; goal: string; days: DayPlan[]; }

function daysLeft(deadline?: string): number {
  if (!deadline) return 90;
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return Math.max(0, d);
}

function focusName(week: number, total: number): string {
  if (week === 1)                      return "Foundation & Orientation";
  if (week <= Math.ceil(total * 0.4))  return "Core Learning";
  if (week <= Math.ceil(total * 0.7))  return "Application & Practice";
  if (week === total - 1)              return "Mock Exams & Review";
  return "Final Revision";
}

const SUB_COLORS: Record<string, string> = {
  "English Language": "#818CF8", "Mathematics": "#B07FE8",
  "Physics": "#E3B341", "Chemistry": "#2FBF71",
  "Biology": "#E87F35", "Government": "#8FA3E8",
  "Economics": "#3FBFBF", "Literature in English": "#E87FB0",
  "ALL": "#FA3E3E", "REST": "#9AA0B5",
};

export default function StudyPlan() {
  const [user,      setUser]      = useState<User | null>(null);
  const [plan,      setPlan]      = useState<WeekPlan[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);
  const dark = useDark();
  const [activeW,   setActiveW]   = useState(0);
  const [view,      setView]      = useState<"today" | "week" | "overview" | "coverage">("today");
  const [mounted,   setMounted]   = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  useIsoLayoutEffect(() => {
    setMounted(true);
    try {
      const u = localStorage.getItem("companion_user");
      if (u) setUser(JSON.parse(u));
      const v = new URLSearchParams(window.location.search).get("view");
      if (v === "coverage") setView("coverage");
      const saved = localStorage.getItem("companion_study_plan_v2");
      if (saved) {
        const p: WeekPlan[] = JSON.parse(saved);
        setPlan(p);
        setGenerated(true);
        const today = todayWAT();
        const idx = p.findIndex(w => w.days.some(d => d.date === today));
        if (idx >= 0) setActiveW(idx);
      }
    } catch {}
  }, []);

  // Keep the plan backed up to the account (debounced inside Sync)
  useEffect(() => {
    if (!mounted || !generated) return;
    Sync.push("plan");
  }, [plan, mounted, generated]);

  const markDone = (wi: number, di: number) => {
    const updated = plan.map((w, a) =>
      a !== wi ? w : {
        ...w,
        days: w.days.map((d, b) => b !== di ? d : { ...d, done: true }),
      }
    );
    setPlan(updated);
    localStorage.setItem("companion_study_plan_v2", JSON.stringify(updated));
    const day = updated[wi].days[di];
    Progress.recordActivity("plan", { subject: day.subject, topicId: day.topic });
    if (day.topicId) Progress.setTopicDone(day.topicId, true, false);
  };

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dl    = daysLeft(user.deadline);
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
      const built: WeekPlan[] = Array.from({ length: weeks }, (_, wi) => ({
        week: wi + 1,
        focus: focusName(wi + 1, weeks),
        goal: `Cover all ${subs.length} subjects for week ${wi + 1}`,
        days: Array.from({ length: 7 }, (_, di) => {
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
            hours:    isRest ? 0 : 2,
            done:     doneKeys.has(`${subject}|${topic}`),
            type:     (isRest ? "rest" : isPrac ? "practice" : "study") as "study" | "practice" | "rest",
          };
        }),
      }));
      setPlan(built);
      localStorage.setItem("companion_study_plan_v2", JSON.stringify(built));
      localStorage.removeItem("companion_plan_carry");
      setGenerated(true);
      setView("today");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const T         = palette(dark);
  const today     = todayWAT();
  const active    = Progress.getActiveDays();
  const todayTask = plan.flatMap(w => w.days).find(d => d.date === today);
  const dl        = daysLeft(user?.deadline);
  const allStudy  = plan.flatMap(w => w.days).filter(d => d.type !== "rest");
  const doneCt    = allStudy.filter(d => d.done || active.has(d.date)).length;
  const pct       = allStudy.length ? Math.round((doneCt / allStudy.length) * 100) : 0;

  const STATS: { l: string; v: string; Icon: React.ElementType }[] = [
    { l: "Days Left", v: dl > 999 ? "90+" : String(dl), Icon: Clock      },
    { l: "Target",    v: user?.target || "—",            Icon: Target     },
    { l: "Subjects",  v: String(user?.subjects?.length || 0), Icon: BookOpen },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily:"var(--font)" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)", padding: "20px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Link href="/" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={18} color="#fff" strokeWidth={2} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>My Study Plan</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Real JAMB topics · Built from the official syllabus</div>
          </div>
          {generated && (
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#F97316", fontWeight: 700 }}>
              {pct}% done
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <s.Icon size={14} color="rgba(255,255,255,0.65)" strokeWidth={1.8} style={{ margin: "0 auto 4px", display: "block" }} />
              <div style={{ color: "#F97316", fontWeight: 900, fontSize: 18, lineHeight: 1 }}>{s.v}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="plan-content" style={{ padding: "16px 20px", paddingBottom: 96 }}>

        {/* ── Generate Screen ── */}
        {!generated ? (
          <div className="page-narrow" style={{ background: T.surface, borderRadius: 16, padding: 24, textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CalendarDays size={30} color={T.primary} strokeWidth={1.8} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
              Generate Your Study Plan
            </h2>
            <p style={{ fontSize: 14, color: T.sub, margin: "0 0 22px", lineHeight: 1.6 }}>
              We build a day-by-day plan from the official JAMB syllabus — real topics, tailored to your subjects, target score and exam date.
            </p>

            {user && (
              <div style={{ background: T.s2, borderRadius: 12, padding: 14, marginBottom: 20, textAlign: "left" }}>
                {[
                  { l: "Subjects", v: (user.subjects || []).join(", ") || "—" },
                  { l: "Target",   v: `${user.target}/400`                    },
                  { l: "Days",     v: `${dl} days left`                       },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ color: T.sub }}>{r.l}</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {!user ? (
              <Link href="/auth" style={{ display: "block", width: "100%", padding: 14, borderRadius: 12, background: T.primary, color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                Log in to generate your plan
              </Link>
            ) : (
              <button
                onClick={generatePlan}
                disabled={loading}
                style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none",
                  background: loading ? T.s3 : T.primary,
                  color: loading ? T.muted : "#fff",
                  fontWeight: 700, fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Building your plan…" : "Generate My Plan"}
              </button>
            )}
            {loading && (
              <p style={{ fontSize: 12, color: T.sub, marginTop: 10 }}>
                Building from the official syllabus…
              </p>
            )}
          </div>

        ) : (
          <div>
            {/* ── View Switcher ── */}
            <div style={{ display: "flex", gap: 4, background: T.s2, borderRadius: 12, padding: 4, marginBottom: 14 }}>
              {([
                { v: "today",    label: "Today",    Icon: MapPin        },
                { v: "week",     label: "Week",     Icon: CalendarRange },
                { v: "overview", label: "Overview", Icon: LayoutGrid    },
                { v: "coverage", label: "Coverage", Icon: ListChecks    },
              ] as { v: "today"|"week"|"overview"|"coverage"; label: string; Icon: React.ElementType }[]).map(tab => (
                <button
                  key={tab.v}
                  onClick={() => setView(tab.v)}
                  style={{
                    flex: 1, padding: "9px 6px", minHeight: 44, borderRadius: 9, border: "none",
                    cursor: "pointer", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    background: view === tab.v ? T.primary : "transparent",
                    color: view === tab.v ? "#fff" : T.sub,
                    transition: "all 0.2s",
                  }}
                >
                  <tab.Icon size={12} strokeWidth={2} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── TODAY VIEW ── */}
            {view === "today" && (
              <div className="plan-today">
                {todayTask ? (
                  <div style={{ background: T.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: 14 }}>
                    {/* Task info */}
                    <div style={{ padding: "16px 18px", background: `linear-gradient(135deg,${SUB_COLORS[todayTask.subject] || T.primary}22,${SUB_COLORS[todayTask.subject] || T.primary}08)`, borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                        Today's Task
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: SUB_COLORS[todayTask.subject] || T.primary, marginBottom: 6 }}>
                        {todayTask.subject}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 4, letterSpacing: "-0.2px" }}>
                        {todayTask.topic}
                      </div>
                      <div style={{ fontSize: 13, color: T.sub, marginBottom: 10 }}>
                        {todayTask.subtopic}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, background: T.s2, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: T.text }}>
                          <Clock size={11} strokeWidth={2} />
                          {todayTask.hours}h
                        </span>
                        <span style={{ background: T.s2, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>
                          {todayTask.type}
                        </span>
                      </div>
                    </div>

                    {/* Done state */}
                    {todayTask.done || active.has(today) ? (
                      <div style={{ padding: "14px 18px", background: "rgba(49,162,76,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#31A24C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CheckCircle size={17} color="#fff" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#31A24C" }}>Completed!</div>
                          <div style={{ fontSize: 12, color: T.sub }}>Streak updated — keep it up</div>
                        </div>
                      </div>
                    ) : todayTask.type !== "rest" ? (
                      <div style={{ padding: "12px 18px", display: "flex", gap: 10 }}>
                        <Link
                          href={`/ai?q=${encodeURIComponent(`Explain ${todayTask.topic} (${todayTask.subject})`)}`}
                          style={{ flex: 1, padding: 11, borderRadius: 10, border: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: T.text, fontWeight: 600, fontSize: 13, textDecoration: "none" }}
                        >
                          <BrainCircuit size={14} strokeWidth={1.8} />
                          Ask AI
                        </Link>
                        <button
                          onClick={() => {
                            const wi = plan.findIndex(w => w.days.some(d => d.date === today));
                            const di = plan[wi]?.days.findIndex(d => d.date === today);
                            if (wi >= 0 && di >= 0) markDone(wi, di);
                          }}
                          style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                          <CheckCircle size={14} strokeWidth={2.5} />
                          Mark Done
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                        <BedDouble size={20} color={T.sub} strokeWidth={1.8} />
                        <span style={{ fontSize: 14, color: T.sub, fontWeight: 600 }}>Rest day — recharge for tomorrow</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: T.surface, borderRadius: 16, padding: 28, textAlign: "center", border: `1px solid ${T.border}`, marginBottom: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <CalendarDays size={24} color={T.primary} strokeWidth={1.8} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>No task scheduled today</div>
                    <div style={{ fontSize: 13, color: T.sub, marginTop: 6 }}>Check back tomorrow or browse past topics below.</div>
                  </div>
                )}

                {/* Upcoming */}
                <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Coming Up
                  </div>
                  {plan.flatMap(w => w.days).filter(d => d.date > today).slice(0, 5).map((d, i, arr) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: SUB_COLORS[d.subject] || T.primary, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.topic}</div>
                        <div style={{ fontSize: 11, color: T.sub }}>
                          {d.subject} · {new Date(d.date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                      </div>
                      <ChevronRight size={14} color={T.muted} strokeWidth={2} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── WEEK VIEW ── */}
            {view === "week" && (
              <div>
                {/* Week selector pills */}
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
                  {plan.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveW(i)}
                      style={{ flexShrink: 0, padding: "7px 16px", minHeight: 44, display: "flex", alignItems: "center", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: activeW === i ? T.primary : T.s2, color: activeW === i ? "#fff" : T.sub, transition: "all 0.2s" }}
                    >
                      W{w.week}
                    </button>
                  ))}
                </div>

                {plan[activeW] && (
                  <div style={{ background: T.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}` }}>
                    {/* Week header */}
                    <div style={{ padding: "16px 18px", background: "linear-gradient(135deg,#6366F1,#818CF8)" }}>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px" }}>
                        WEEK {plan[activeW].week}
                      </div>
                      <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, marginTop: 2 }}>
                        {plan[activeW].focus}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <Target size={12} strokeWidth={2} />
                        {plan[activeW].goal}
                      </div>
                    </div>

                    {/* Day rows */}
                    <div style={{ padding: 8 }}>
                      {plan[activeW].days.map((d, i) => {
                        const past    = d.date < today;
                        const isToday = d.date === today;
                        const done    = d.done || (past && active.has(d.date));
                        const isRest  = d.type === "rest";
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "11px 10px", borderRadius: 10, marginBottom: 4,
                              background: isToday ? T.primaryTint : "transparent",
                              border: `1px solid ${isToday ? T.primary : "transparent"}`,
                            }}
                          >
                            {/* Day indicator */}
                            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: done ? T.primary : T.s2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {done
                                ? <CheckCircle size={15} color="#fff" strokeWidth={2.5} />
                                : isRest
                                  ? <BedDouble size={14} color={T.sub} strokeWidth={1.8} />
                                  : <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>{d.day}</span>}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isRest ? T.sub : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {d.topic}
                              </div>
                              <div style={{ fontSize: 11, color: T.sub }}>
                                {d.subject} · {d.subtopic}
                              </div>
                            </div>

                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 11, color: T.sub }}>
                                {new Date(d.date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short" })}
                              </div>
                              {d.hours > 0 && (
                                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
                                  <Clock size={10} strokeWidth={2} />{d.hours}h
                                </div>
                              )}
                            </div>

                            {!done && !isRest && isToday && (
                              <button
                                onClick={() => markDone(activeW, i)}
                                style={{ padding: "6px 14px", minHeight: 44, borderRadius: 8, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}
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
                <div style={{ background: T.surface, borderRadius: 16, padding: "16px 18px", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Overall Progress</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: T.primary }}>{pct}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: T.s3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#6366F1,#818CF8)", borderRadius: 5, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
                    {doneCt} of {allStudy.length} study sessions completed
                  </div>
                </div>

                {/* Per-week cards */}
                {plan.map((w, wi) => {
                  const wDone = w.days.filter(d => d.done || active.has(d.date)).length;
                  const wp    = Math.round((wDone / w.days.length) * 100);
                  return (
                    <button
                      key={wi}
                      onClick={() => { setActiveW(wi); setView("week"); }}
                      style={{ background: T.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${activeW === wi ? T.primary : T.border}`, cursor: "pointer", textAlign: "left", width: "100%", transition: "border-color 0.2s" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Week {w.week} — {w.focus}</div>
                          <div style={{ fontSize: 11, color: T.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.goal}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: wp >= 70 ? "#31A24C" : T.primary }}>{wp}%</div>
                          <div style={{ fontSize: 10, color: T.sub }}>{wDone}/{w.days.length}</div>
                        </div>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: T.s3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${wp}%`, background: wp >= 70 ? "#31A24C" : T.primary, transition: "width 0.5s" }} />
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

            {/* Regenerate */}
            <button
              onClick={() => {
                if (!confirmRegen) { setConfirmRegen(true); return; }
                const doneKeys = plan.flatMap(w => w.days).filter(d => d.done).map(d => `${d.subject}|${d.topic}`);
                try { localStorage.setItem("companion_plan_carry", JSON.stringify(doneKeys)); } catch {}
                setConfirmRegen(false);
                setGenerated(false);
                setPlan([]);
                localStorage.removeItem("companion_study_plan_v2");
              }}
              style={{ width: "100%", marginTop: 14, padding: 13, borderRadius: 12, border: `1.5px solid ${confirmRegen ? "#FA3E3E" : T.border}`, background: "transparent", color: confirmRegen ? "#FA3E3E" : T.sub, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <RefreshCw size={14} strokeWidth={2} />
              {confirmRegen ? "Tap again to confirm — completed days are kept" : "Regenerate Plan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
