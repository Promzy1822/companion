"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NAVBAR_HEIGHT } from "./components/NavbarView";
import StreakCard from "./components/StreakCard";
import { FlameGreeting } from "./components/Flame";
import CountdownBanner from "./components/CountdownBanner";
import WeekChart from "./components/WeekChart";
import { Session } from "./lib/session";
import { palette, TY, LH, FW, SP, R, subjectColor } from "./lib/design";
import { getFlameState, homeFlame } from "./lib/flame";
import { daysUntil, getEffectiveExam } from "./lib/exam-date";
import { getTopics } from "./lib/syllabus";
import { Progress, todayWAT } from "./lib/progress";
import { Bot, CalendarDays, Check, ChevronRight, Crosshair, Flame, Sparkles, Target, Timer } from "lucide-react";

// Home rebuild (Home v3 sample, structural): hero band with greeting,
// bigger living Flame, glass streak/days-left chips and a Daily spark;
// then .home-cols. Main column: Up next, This week, Today's Plan, quick
// tiles. Side column: CountdownBanner, StreakCard. No inline
// padding/margin on .home-cols — the tier-aware spacing lives in
// globals.css. No -16px overlap.

const HERO_GRADIENT = "linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)";
const ORANGE = "#F97316";
const ORANGE_TEXT = "#1F1156";

// LH tokens are bare numbers in design.ts; React would read a numeric
// lineHeight as a unitless multiplier, so normalise to px here. If W1 ships
// them as "20px" strings this passes through unchanged.
const px = (v: number | string): string => (typeof v === "number" ? `${v}px` : v);

interface User { name: string; email: string; target: string; institution: string; subjects: string[]; course: string; }

type PlanDayType = "study" | "practice" | "rest";
interface PlanDay {
  date: string; subject: string; topic: string; subtopic?: string;
  topicId?: string; hours?: number; done: boolean; type?: PlanDayType;
}
interface WeekPlan { days: PlanDay[]; }

interface Weakest { subject: string; pct: number | null; source: "coverage" | "accuracy" | "none"; }
interface UpNext {
  subject: string; topic: string; href: string;
  buttonLabel: string; sub: string;
}
interface TodayTask {
  subject: string; topic: string; done: boolean;
  rest: boolean; practice: boolean; minutes: number; nextSubject: string | null;
}
interface HomeData { upNext: UpNext; today: TodayTask | null; hasPlan: boolean; weakest: Weakest; upcoming: PlanDay[]; }

// ── Weakest subject: honest, from stored data only ─────────────────────
// 1. Lowest syllabus coverage % among registered subjects
//    (companion_syllabus_progress topic ids vs the official topic list in
//    app/lib/syllabus.ts). Ties keep the first registered subject.
// 2. Else lowest practice accuracy (companion_practice_stats, subjects with
//    recorded answers only). 3. Else the first registered subject.
// mock_history is NOT used: it stores only totals ({score, total,
// jambEquivalent, date}) with no per-subject breakdown.
function computeWeakest(subjects: string[]): Weakest {
  const list = subjects.length ? subjects : [];
  if (!list.length) return { subject: "English Language", pct: null, source: "none" };

  const done = Progress.getSyllabusProgress();
  let weakest: Weakest | null = null;
  for (const s of list) {
    const topics = getTopics(s);
    if (!topics.length) continue;
    let hit = 0;
    for (const t of topics) if (done.has(t.id)) hit++;
    const pct = Math.round((hit / topics.length) * 100);
    if (!weakest || pct < (weakest.pct ?? 101)) weakest = { subject: s, pct, source: "coverage" };
  }
  if (weakest) return weakest;

  const stats = Progress.getPracticeStats();
  for (const s of list) {
    const st = stats[s];
    if (!st || !st.total) continue;
    const pct = Math.round((st.correct / st.total) * 100);
    if (!weakest || pct < (weakest.pct ?? 101)) weakest = { subject: s, pct, source: "accuracy" };
  }
  if (weakest) return weakest;

  return { subject: list[0], pct: null, source: "none" };
}

// ── Plan reading (companion_study_plan_v2: weeks[].days[]) ─────────────
function readPlan(): PlanDay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("companion_study_plan_v2");
    if (!raw) return [];
    const weeks = JSON.parse(raw) as WeekPlan[];
    return (weeks || []).flatMap((w) => w.days || []);
  } catch { return []; }
}

// Older stored plans may predate the `type` field; derive it from the
// values the generator writes (subject "REST", topic "Rest Day" /
// "Practice & Past Questions").
function dayKind(d: PlanDay): PlanDayType {
  if (d.type) return d.type;
  if (d.subject === "REST" || d.topic === "Rest Day") return "rest";
  if (d.topic === "Practice & Past Questions") return "practice";
  return "study";
}

function addDaysWAT(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Next task: the next undone, non-rest plan day for the weakest subject
// from today onward; if that subject has none, the next undone day overall.
function computeUpNext(weakest: Weakest, days: PlanDay[], today: string): UpNext {
  if (!days.length) {
    return {
      subject: weakest.subject, topic: "", href: "/studyplan",
      buttonLabel: "Generate your plan",
      sub: "No plan yet — generate one to get your first task",
    };
  }
  const upcoming = days
    .filter((d) => d.date >= today && !d.done && dayKind(d) !== "rest")
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const task = upcoming.find((d) => d.subject === weakest.subject) || upcoming[0];
  if (!task) {
    return {
      subject: weakest.subject, topic: "", href: "/practice",
      buttonLabel: "Continue",
      sub: "Everything in your plan is done — revise with practice",
    };
  }
  const kind = dayKind(task);
  const href = kind === "practice" ? "/practice" : task.topicId ? `/lessons/${task.topicId}` : "/studyplan";
  const taskSubject = task.subject === "ALL" ? "All subjects" : task.subject;
  let sub: string;
  if (weakest.source === "coverage" && weakest.pct !== null) {
    sub = task.subject === weakest.subject
      ? `Weakest subject · ${weakest.pct}% of the syllabus covered`
      : `Weakest subject: ${weakest.subject} · ${weakest.pct}% covered`;
  } else if (weakest.source === "accuracy" && weakest.pct !== null) {
    sub = task.subject === weakest.subject
      ? `Lowest practice accuracy · ${weakest.pct}% correct`
      : `Weakest subject: ${weakest.subject} · ${weakest.pct}% correct in practice`;
  } else {
    sub = "Your weakest subject — start here";
  }
  return { subject: taskSubject, topic: task.topic, href, buttonLabel: "Continue", sub };
}

function computeToday(days: PlanDay[], today: string): TodayTask | null {
  const day = days.find((d) => d.date === today);
  if (!day) return null;
  const kind = dayKind(day);
  const tomorrow = days.find((d) => d.date === addDaysWAT(today, 1));
  return {
    subject: day.subject, topic: day.topic, done: day.done,
    rest: kind === "rest", practice: kind === "practice",
    minutes: (day.hours ?? 2) * 60,
    nextSubject: tomorrow && dayKind(tomorrow) === "study" ? tomorrow.subject : null,
  };
}

// Upcoming plan days for the Today's Plan list: from today onward,
// non-rest, earliest first, first 3 — including done ones, so a finished
// today still shows as done rather than vanishing.
function computeUpcoming(days: PlanDay[], today: string): PlanDay[] {
  return days
    .filter((d) => d.date >= today && dayKind(d) !== "rest")
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, 3);
}

function readHomeData(user: User | null): HomeData {
  const days = readPlan();
  const today = todayWAT();
  const weakest = computeWeakest(user?.subjects || []);
  return {
    upNext: computeUpNext(weakest, days, today),
    today: computeToday(days, today),
    hasPlan: days.length > 0,
    weakest,
    upcoming: computeUpcoming(days, today),
  };
}

interface HeroData { streak: number; daysLeft: number; spark: string; }

export default function Home() {
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const u = localStorage.getItem("companion_user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });
  // Re-read on mount: Session.sync() may hydrate newer data after first paint.
  const [homeData, setHomeData] = useState<HomeData>(() => readHomeData(user));
  // Hero chips + spark: localStorage reads only, so effect-only (never render).
  const [hero, setHero] = useState<HeroData | null>(null);
  const router = useRouter();
  const T = palette();

  useEffect(() => {
    Session.sync();
    if (!user) { router.replace("/landing"); return; }
    setHomeData(readHomeData(user));
    setHero({
      streak: Progress.getStreak().current,
      daysLeft: daysUntil(getEffectiveExam().deadline),
      spark: homeFlame(getFlameState(), new Date().getHours(), user.subjects[0]).speech,
    });
  }, [router]);

  if (!user) return null;

  const { upNext, today, hasPlan, weakest, upcoming } = homeData;
  const todayISO = todayWAT();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const subjectColour = subjectColor(upNext.subject);
  const showStartHere = upNext.subject === weakest.subject;
  const doneCount = upcoming.filter((d) => d.done).length;

  // ── Shared bits (one tile spec, one chevron, one gradient) ───────────
  const card: React.CSSProperties = {
    background: T.surface, borderRadius: R.xl, border: "1px solid " + T.border,
  };
  const tile = (bg: string): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: R.lg, background: bg,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });
  const eyebrow: React.CSSProperties = {
    fontSize: 11, fontWeight: FW.bold, color: T.sub,
    textTransform: "uppercase", letterSpacing: "0.8px",
  };
  // Two-line clamp (the only line-clamp in the file; no nowrap/ellipsis cut).
  const clamp2 = {
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    overflow: "hidden", lineHeight: 1.35,
  } as React.CSSProperties;
  // The page's ONLY orange button lives on the Up next card.
  const orangeBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: 44, borderRadius: R.lg, background: ORANGE, color: ORANGE_TEXT,
    fontSize: TY.base, fontWeight: FW.bold, textDecoration: "none",
    marginTop: SP[3],
  };
  const ghostBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minHeight: 44, paddingTop: SP[2], paddingBottom: SP[2],
    paddingLeft: SP[5], paddingRight: SP[5], borderRadius: R.lg,
    border: "1px solid " + T.border, background: "transparent",
    color: T.text, fontSize: TY.base, fontWeight: FW.semibold, textDecoration: "none",
  };
  const linkCell: React.CSSProperties = {
    flex: 1, display: "flex", flexDirection: "column", borderRadius: R.xl,
    padding: SP[4], textDecoration: "none",
    background: T.surface, border: "1px solid " + T.border,
  };
  const glassChip: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 10px", borderRadius: R.pill,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff", fontSize: 12, fontWeight: FW.semibold,
  };

  // ── Today's Plan copy ────────────────────────────────────────────────
  const isRestToday = today?.rest === true;
  const restLine = today?.nextSubject
    ? `Rest day — back to ${today.nextSubject} tomorrow`
    : "Rest day — back tomorrow";
  let emptyTitle: string;
  let emptySub: string;
  if (!hasPlan) {
    emptyTitle = "Plan your study week";
    emptySub = "Based on the official JAMB syllabus";
  } else {
    emptyTitle = "Everything in your plan is done";
    emptySub = "Revise with practice";
  }
  const askAiHref = today && !today.rest && !today.practice
    ? `/ai?q=${encodeURIComponent(`Explain ${today.topic} (${today.subject})`)}`
    : null;

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      paddingTop: NAVBAR_HEIGHT + "px",
      fontFamily: "var(--font)",
    }}>
      {/* Hero band: greeting left, bigger living Flame right (size 84,
          no speech bubble — the speech runs as the Daily spark below) */}
      <div className="hero-banner" style={{
        background: HERO_GRADIENT,
        padding: "24px 20px 36px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[4] }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: TY.sm }}>
              {greeting}
            </div>
            <div style={{ color: "#fff", fontSize: TY.xxl, fontWeight: FW.bold, letterSpacing: "-0.4px", marginTop: 2 }}>
              {user?.name.split(" ")[0]}
            </div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: FW.bold, marginTop: 4 }}>
              Target <span style={{ color: ORANGE }}>{user?.target} pts</span>
              {user?.institution ? " · " + user.institution : ""}
            </div>
            {hero && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <span style={glassChip}>
                  <Flame size={14} color="#FB923C" style={{ flexShrink: 0 }} />
                  {hero.streak > 0 ? `${hero.streak}-day streak` : "No streak yet"}
                </span>
                <span style={glassChip}>
                  <CalendarDays size={14} style={{ flexShrink: 0 }} />
                  {hero.daysLeft === 0 ? "Exam day" : hero.daysLeft === 1 ? "1 day left" : `${hero.daysLeft} days left`}
                </span>
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, minWidth: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FlameGreeting topic={user?.subjects?.[0]} size={84} showSpeech={false} />
          </div>
        </div>
        {hero && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <Sparkles size={14} color="#FDBA74" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{hero.spark}</span>
          </div>
        )}
      </div>

      <div className="home-cols">
        <div className="home-main" style={{ display: "flex", flexDirection: "column", gap: SP[4] }}>

          {/* Up next — the FIRST card, and the page's only orange button */}
          <div style={{ ...card, padding: SP[4], borderLeft: `4px solid ${subjectColour}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: SP[3] }}>
              <div style={tile(subjectColour + "1F")}>
                <Crosshair size={20} color={subjectColour} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: SP[2] }}>
                  <div style={eyebrow}>Up next</div>
                  {showStartHere && (
                    <span style={{
                      fontSize: 11, fontWeight: FW.bold, padding: "3px 8px",
                      borderRadius: R.pill, background: subjectColour + "1F",
                      color: subjectColour,
                    }}>
                      Start here
                    </span>
                  )}
                </div>
                <div style={{ ...clamp2, fontSize: TY.lg, fontWeight: FW.bold, color: T.text, marginTop: 2 }}>
                  {upNext.topic ? `${upNext.subject} · ${upNext.topic}` : upNext.subject}
                </div>
                <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                  {upNext.sub}
                </div>
              </div>
            </div>
            {weakest.source === "coverage" && weakest.pct !== null && (
              <div style={{ height: 6, borderRadius: R.pill, background: T.s2, marginTop: SP[3] }}>
                <div style={{ width: `${weakest.pct}%`, height: "100%", borderRadius: R.pill, background: subjectColour }} />
              </div>
            )}
            <Link href={upNext.href} style={orangeBtn}>{upNext.buttonLabel}</Link>
          </div>

          {/* This week — recorded activity events per day, never minutes */}
          <WeekChart />

          {/* Today's Plan — the next 3 plan days, quiet ghost buttons only */}
          <div style={{ ...card, padding: SP[4] }}>
            <div style={{ display: "flex", alignItems: "center", gap: SP[2] }}>
              <div style={{ ...eyebrow, flex: 1 }}>Today&apos;s Plan</div>
              {upcoming.length > 0 && (
                <div style={{ fontSize: TY.xs, fontWeight: FW.semibold, color: T.sub }}>
                  {doneCount} of {upcoming.length} done
                </div>
              )}
            </div>
            {isRestToday && (
              <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 6, lineHeight: px(LH.xs) }}>
                {restLine}
              </div>
            )}
            {upcoming.length > 0 ? (
              <div>
                {upcoming.map((d, i) => (
                  <div
                    key={`${d.date}-${d.subject}-${d.topic}`}
                    style={{
                      display: "flex", alignItems: "center", gap: SP[3],
                      padding: "12px 0",
                      borderTop: i === 0 ? "none" : "1px solid " + T.border,
                    }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: subjectColor(d.subject), flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...clamp2, fontSize: TY.base, fontWeight: FW.semibold, color: T.text }}>
                        {d.subject === "ALL" ? "All subjects" : d.subject} · {d.topic}
                      </div>
                      <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                        ~{(d.hours ?? 2) * 60} min
                      </div>
                    </div>
                    {d.done ? (
                      <Check size={16} color={T.successText} style={{ flexShrink: 0 }} />
                    ) : d.date === todayISO ? (
                      <span style={{ fontSize: TY.xs, fontWeight: FW.semibold, color: ORANGE, flexShrink: 0 }}>Today</span>
                    ) : (
                      <span style={{ fontSize: TY.xs, color: T.muted, flexShrink: 0 }}>
                        {new Date(d.date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: SP[3] }}>
                <div style={{ ...clamp2, fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>
                  {emptyTitle}
                </div>
                <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                  {emptySub}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: SP[2], marginTop: SP[3] }}>
              <Link href="/studyplan" style={{ ...ghostBtn, flex: 1 }}>Open plan</Link>
              {askAiHref && (
                <Link href={askAiHref} style={{ ...ghostBtn, flex: 1 }}>Ask AI</Link>
              )}
            </div>
          </div>

          {/* Quick tiles: AI Tutor, Practice, Mock */}
          <div style={{ display: "flex", gap: SP[3], alignItems: "stretch" }}>
            <Link href="/ai" style={{ ...linkCell, background: HERO_GRADIENT, border: "1px solid transparent" }}>
              <div style={tile("rgba(255,255,255,0.2)")}>
                <Bot size={20} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[2], marginTop: SP[3] }}>
                <span style={{ fontSize: TY.base, fontWeight: FW.bold, color: "#fff" }}>AI Tutor</span>
                <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
              </div>
              <div style={{ ...clamp2, fontSize: TY.xs, color: "rgba(255,255,255,0.8)", marginTop: 2, lineHeight: px(LH.xs) }}>
                Ask anything
              </div>
            </Link>
            <Link href="/practice" style={linkCell}>
              <div style={tile(T.primaryTint)}>
                <Target size={20} color={T.primary} strokeWidth={1.8} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[2], marginTop: SP[3] }}>
                <span style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>Practice</span>
                <ChevronRight size={18} color={T.sub} />
              </div>
              <div style={{ ...clamp2, fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                4,060 past questions
              </div>
            </Link>
            <Link href="/mock" style={linkCell}>
              <div style={tile(T.accentTint)}>
                <Timer size={20} color={T.accent} strokeWidth={1.8} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[2], marginTop: SP[3] }}>
                <span style={{ fontSize: TY.base, fontWeight: FW.bold, color: T.text }}>Mock</span>
                <ChevronRight size={18} color={T.sub} />
              </div>
              <div style={{ ...clamp2, fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                180 questions · 2h
              </div>
            </Link>
          </div>

        </div>
        <div className="home-side" style={{ display: "flex", flexDirection: "column", gap: SP[4] }}>

          <CountdownBanner />

          {/* Streak — compact stat, no calendar */}
          <StreakCard />

        </div>
      </div>

    </div>
  );
}
