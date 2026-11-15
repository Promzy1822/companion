"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NAVBAR_HEIGHT } from "./components/NavbarView";
import StreakCard from "./components/StreakCard";
import { FlameGreeting } from "./components/Flame";
import CountdownBanner from "./components/CountdownBanner";
import { Session } from "./lib/session";
import { palette, TY, LH, FW, SP, R } from "./lib/design";
import { getTopics } from "./lib/syllabus";
import { Progress, todayWAT } from "./lib/progress";
import { Bot, CalendarDays, ChevronRight, Calculator, Crosshair, Target } from "lucide-react";

// Home rebuild (Home v2 sample, structural): one hero, then .home-cols.
// Main column: Up next, Today's Plan, Countdown. Side column: quick links,
// streak, score-calculator note. No inline padding/margin on .home-cols —
// the tier-aware spacing lives in globals.css (worker W1). No -16px overlap.

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
interface HomeData { upNext: UpNext; today: TodayTask | null; hasPlan: boolean; }

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

function readHomeData(user: User | null): HomeData {
  const days = readPlan();
  const today = todayWAT();
  return {
    upNext: computeUpNext(computeWeakest(user?.subjects || []), days, today),
    today: computeToday(days, today),
    hasPlan: days.length > 0,
  };
}

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
  const router = useRouter();
  const T = palette();

  useEffect(() => {
    Session.sync();
    if (!user) { router.replace("/landing"); return; }
    setHomeData(readHomeData(user));
  }, [router]);

  if (!user) return null;

  const { upNext, today, hasPlan } = homeData;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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

  // ── Today's Plan copy ────────────────────────────────────────────────
  let planTitle: string;
  let planSub: string;
  if (!today) {
    planTitle = hasPlan ? "Nothing scheduled today" : "Plan your study week";
    planSub = hasPlan ? "Open your plan to see what's next" : "Based on the official JAMB syllabus";
  } else if (today.rest) {
    planTitle = "Rest day";
    planSub = today.nextSubject ? `Back to ${today.nextSubject} tomorrow` : "Back tomorrow";
  } else if (today.practice) {
    planTitle = today.topic;
    planSub = `All subjects · ~${today.minutes} min`;
  } else if (today.done) {
    planTitle = `${today.subject} · ${today.topic}`;
    planSub = "Done for today";
  } else {
    planTitle = `${today.subject} · ${today.topic}`;
    planSub = `${today.subject} · 1 topic · ~${today.minutes} min`;
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
      {/* Slim top strip: greeting left, Flame inline right (size 56, no speech) */}
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
          </div>
          <div style={{ flexShrink: 0, minWidth: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FlameGreeting topic={user?.subjects?.[0]} size={56} showSpeech={false} />
          </div>
        </div>
      </div>

      <div className="home-cols">
        <div className="home-main" style={{ display: "flex", flexDirection: "column", gap: SP[4] }}>

          {/* Up next — the FIRST card, and the page's only orange button */}
          <div style={{ ...card, padding: SP[4] }}>
            <div style={{ display: "flex", alignItems: "center", gap: SP[3] }}>
              <div style={tile(T.primaryTint)}>
                <Crosshair size={20} color={T.primary} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={eyebrow}>Up next</div>
                <div style={{ ...clamp2, fontSize: TY.lg, fontWeight: FW.bold, color: T.text, marginTop: 2 }}>
                  {upNext.topic ? `${upNext.subject} · ${upNext.topic}` : upNext.subject}
                </div>
                <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                  {upNext.sub}
                </div>
              </div>
            </div>
            <Link href={upNext.href} style={orangeBtn}>{upNext.buttonLabel}</Link>
          </div>

          {/* Today's Plan — quiet ghost buttons only, never orange/filled */}
          <div style={{ ...card, padding: SP[4] }}>
            <div style={{ display: "flex", alignItems: "center", gap: SP[3] }}>
              <div style={tile(T.primaryTint)}>
                <CalendarDays size={20} color={T.primary} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={eyebrow}>Today&apos;s Plan</div>
                <div style={{ ...clamp2, fontSize: TY.base, fontWeight: FW.bold, color: T.text, marginTop: 2 }}>
                  {planTitle}
                </div>
                <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                  {planSub}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: SP[2], marginTop: SP[3] }}>
              <Link href="/studyplan" style={{ ...ghostBtn, flex: 1 }}>Open plan</Link>
              {askAiHref && (
                <Link href={askAiHref} style={{ ...ghostBtn, flex: 1 }}>Ask AI</Link>
              )}
            </div>
          </div>

          <CountdownBanner />

        </div>
        <div className="home-side" style={{ display: "flex", flexDirection: "column", gap: SP[4] }}>

          {/* AI Tutor + Practice: plain links, one row, not two big cards */}
          <div style={{ display: "flex", gap: SP[3], alignItems: "stretch" }}>
            <Link href="/ai" style={{ ...linkCell, background: HERO_GRADIENT, border: "1px solid transparent" }}>
              <div style={tile("rgba(255,255,255,0.2)")}>
                <Bot size={20} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[2], marginTop: SP[3] }}>
                <span style={{ fontSize: TY.base, fontWeight: FW.bold, color: "#fff" }}>AI Tutor</span>
                <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
              </div>
              <div style={{ fontSize: TY.xs, color: "rgba(255,255,255,0.8)", marginTop: 2, lineHeight: px(LH.xs) }}>
                Ask anything about your subjects — or send a photo of a question
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
              <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
                3,333 from 2010–2018, plus 727 Chemistry from 1986–2004
              </div>
            </Link>
          </div>

          {/* Streak — compact stat, no calendar */}
          <StreakCard />

          {/* Score Calculator moved out of Home (now on the Practice hub) */}
          <Link href="/practice" style={{ textDecoration: "none", display: "block" }}>
            <div style={{ ...card, padding: SP[4], display: "flex", alignItems: "center", gap: SP[3] }}>
              <div style={tile(T.primaryTint)}>
                <Calculator size={20} color={T.primary} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: FW.bold, color: T.text, fontSize: TY.base }}>Score Calculator</div>
                <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2 }}>Moved to Practice</div>
              </div>
              <ChevronRight size={18} color={T.sub} />
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
