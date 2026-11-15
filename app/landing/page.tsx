"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { palette } from "../lib/design";
import { useDark, useIsoLayoutEffect } from "../lib/theme";
import {
  ArrowLeft, ArrowRight, BookOpen, Bot, CalendarDays, Check, CheckCircle,
  ClipboardList, Clock, Target, X,
} from "lucide-react";

/* ── Data ──────────────────────────────────────────────────────────────── */
/* Subjects use the same display names as signup (AuthForm ALL_SUBJECTS) so
   the wizard answers drop straight into the signup form. English is
   compulsory and auto-included at signup; the wizard picks the other 3. */
const SUBJECTS = [
  { key: "english", label: "English Language" },
  { key: "mathematics", label: "Mathematics" },
  { key: "physics", label: "Physics" },
  { key: "chemistry", label: "Chemistry" },
  { key: "biology", label: "Biology" },
  { key: "government", label: "Government" },
  { key: "economics", label: "Economics" },
  { key: "literature", label: "Literature in English" },
];
const PICKABLE = SUBJECTS.slice(1);

/* 2027 UTME window, proposed by the Federal Government's harmonised
   timetable (Oct 2026) — proposed, NOT confirmed by JAMB. No student has
   an exact day yet: it comes on the exam slip, about a week before. So the
   plan counts down to the first day of the window, the earliest possible
   day, and the countdown is always labelled estimated. */
const WINDOW_START = "2027-03-15";
const WINDOW_END = "2027-03-25";
const WINDOW_LABEL = "15–25 March 2027";
const TOPIC_COUNT = 164; // official syllabus topics in the app's dataset

const TARGETS = [
  { v: "200", label: "200+", sub: "Just get me in" },
  { v: "250", label: "250+", sub: "A solid score" },
  { v: "300", label: "300+", sub: "Competitive courses" },
  { v: "350", label: "350+", sub: "Medicine, Law, top of the list" },
];
const TIMES = [
  { v: 20, label: "20 minutes", sub: "Light — keep the streak alive" },
  { v: 45, label: "45 minutes", sub: "Steady progress" },
  { v: 60, label: "1 hour", sub: "Serious pace" },
  { v: 120, label: "2 hours +", sub: "Full push to exam day" },
];
const DOORS = [
  { icon: BookOpen, color: "#2FBF71", title: "Learn", desc: "Lessons for every topic in the official JAMB syllabus, written in clear, simple English." },
  { icon: ClipboardList, color: "#E3B341", title: "Practice", desc: "4,060 real past questions, timed mock exams, and instant feedback on every answer." },
  { icon: CalendarDays, color: "#FF6B5E", title: "Plan", desc: "A day-by-day study plan matched to your exam date, with your syllabus coverage tracked topic by topic." },
  { icon: Bot, color: "#6366F1", title: "AI Tutor", desc: "Ask anything, anytime — or send a photo of a question and watch it solved step by step." },
];

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysUntil(iso: string): number {
  const t = new Date(iso + "T00:00:00").getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((t - Date.now()) / 86400000));
}
function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}
function fmtShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function labelFor(key: string): string {
  return SUBJECTS.find((s) => s.key === key)?.label ?? key;
}

/* ── Warm-up questions: real bank, via the API ─────────────────────────── */
/* PAST_QUESTIONS is server-only (1.4 MB) — it is never imported into this
   client page. One small API call per subject returns a single random
   answered, diagram-free question. If the API is unreachable the wizard
   offers Skip instead of blocking. */
interface WarmQ {
  key: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: string;
}
async function fetchWarmQuestion(subjectKey: string): Promise<WarmQ | null> {
  try {
    const totalRes = await fetch(`/api/qbank/questions?subject=${subjectKey}&limit=1`);
    if (!totalRes.ok) return null;
    const totalData = await totalRes.json();
    const total = typeof totalData.total === "number" ? totalData.total : 0;
    if (total <= 0) return null;
    const offset = Math.floor(Math.random() * Math.max(1, total - 4));
    const res = await fetch(`/api/qbank/questions?subject=${subjectKey}&limit=5&offset=${offset}`);
    if (!res.ok) return null;
    const data = await res.json();
    const list = (data.questions || []).filter(
      (q: any) => q && q.answer && !q.has_diagram && q.options && typeof q.options.A === "string"
    );
    if (!list.length) return null;
    const q = list[Math.floor(Math.random() * list.length)];
    return { key: subjectKey, question: String(q.question), options: q.options, answer: String(q.answer) };
  } catch {
    return null;
  }
}

type Step = "welcome" | "subjects" | "warmup" | "target" | "exam" | "time" | "plan" | "signup";

export default function Landing() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const dark = useDark();
  const T = palette();

  const [step, setStep] = useState<Step>("welcome");
  const [picked, setPicked] = useState<string[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [examMode, setExamMode] = useState<"window" | "exact">("window");
  const [exactDate, setExactDate] = useState("");
  const [exactError, setExactError] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);

  const [warmStatus, setWarmStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [warmQs, setWarmQs] = useState<WarmQ[]>([]);
  const [warmIndex, setWarmIndex] = useState(0);
  const [warmSelected, setWarmSelected] = useState<string | null>(null);
  const [warmAnswers, setWarmAnswers] = useState<Record<string, boolean>>({});
  const [warmSkipped, setWarmSkipped] = useState(false);

  /* Logged-in users never see the front door. */
  useIsoLayoutEffect(() => {
    const user = localStorage.getItem("companion_user");
    if (user) { router.replace("/"); return; }
    setReady(true);
  }, [router]);

  const subjectKeys = useMemo(() => ["english", ...picked], [picked]);
  const pickedLabels = useMemo(() => picked.map(labelFor), [picked]);

  /* Load the warm-up the moment the step opens. One question per subject:
     English plus every subject the student picked — the sample asked only
     English plus the first two picks and left the third picked subject
     with no question, so this asks four. */
  useEffect(() => {
    if (step !== "warmup" || warmStatus !== "idle") return;
    let cancelled = false;
    setWarmStatus("loading");
    Promise.all(subjectKeys.map(fetchWarmQuestion)).then((results) => {
      if (cancelled) return;
      const loaded = results.filter((q): q is WarmQ => q !== null);
      if (loaded.length === 0) { setWarmStatus("error"); return; }
      setWarmQs(loaded);
      setWarmIndex(0);
      setWarmSelected(null);
      setWarmAnswers({});
      setWarmStatus("ready");
    });
    return () => { cancelled = true; };
  }, [step, warmStatus, subjectKeys]);

  const examDate = examMode === "exact" && exactDate ? exactDate : WINDOW_START;
  const examDays = daysUntil(examDate);
  const examEstimated = examMode === "window";
  const warmTotal = warmQs.length;
  const warmCorrect = Object.values(warmAnswers).filter(Boolean).length;
  const topicsPerWeek = examDays > 0 ? Math.max(1, Math.round((TOPIC_COUNT / examDays) * 7)) : TOPIC_COUNT;

  /* Weakest subject first: the first subject answered wrong, in
     English-then-picked order. Ace it all and the first picked subject
     leads instead; skip the warm-up and it leads with a note. */
  const weakestKey = useMemo(() => {
    if (warmSkipped || warmTotal === 0) return picked[0] ?? "english";
    for (const k of subjectKeys) {
      if (warmAnswers[k] === false) return k;
    }
    return picked[0] ?? "english";
  }, [warmSkipped, warmTotal, warmAnswers, subjectKeys, picked]);

  const togglePick = (key: string) => {
    setPicked((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      if (cur.length >= 3) return cur;
      return [...cur, key];
    });
    /* Changing subjects invalidates any loaded warm-up. */
    setWarmStatus("idle");
    setWarmQs([]);
    setWarmIndex(0);
    setWarmSelected(null);
    setWarmAnswers({});
    setWarmSkipped(false);
  };

  const chooseWarm = (letter: string) => {
    if (warmSelected !== null) return;
    const q = warmQs[warmIndex];
    if (!q) return;
    setWarmSelected(letter);
    setWarmAnswers((p) => ({ ...p, [q.key]: letter === q.answer }));
  };
  const warmNext = () => {
    if (warmIndex + 1 < warmTotal) {
      setWarmIndex((i) => i + 1);
      setWarmSelected(null);
    } else {
      setStep("target");
    }
  };
  const skipWarm = () => {
    setWarmSkipped(true);
    setWarmAnswers({});
    setStep("target");
  };

  const confirmExactDate = () => {
    if (!exactDate) { setExactError("Pick the date on your exam slip."); return; }
    const d = new Date(exactDate + "T00:00:00");
    if (Number.isNaN(d.getTime())) { setExactError("That date doesn't look right — pick the date on your exam slip."); return; }
    if (d.getTime() <= Date.now()) { setExactError("That date has passed — pick the date on your exam slip."); return; }
    setExactError("");
    setStep("time");
  };

  /* Hand the wizard answers to signup: one localStorage key using the exact
     companion_user key names, so AuthForm prefills subjects / target /
     deadline and never re-asks. Daily minutes and the exam window live in
     their own keys for the Plan page to pick up later. */
  const goSignup = () => {
    try {
      localStorage.setItem("companion_wizard_answers", JSON.stringify({
        subjects: pickedLabels,
        target: target ?? "260",
        deadline: examDate,
        dailyMinutes: dailyMinutes ?? 45,
        examEstimated,
        examWindow: examMode === "window" ? { start: WINDOW_START, end: WINDOW_END, proposed: true } : null,
      }));
      localStorage.setItem("companion_daily_minutes", JSON.stringify(dailyMinutes ?? 45));
      localStorage.setItem("companion_exam_window", JSON.stringify(
        examMode === "window"
          ? { start: WINDOW_START, end: WINDOW_END, proposed: true, estimated: true }
          : { estimated: false, date: examDate }
      ));
    } catch {}
    router.push("/auth/signup");
  };

  const tomorrowISO = localISO(new Date(Date.now() + 86400000));

  if (!ready) return null;

  /* ── Shared styles ────────────────────────────────────────────────────── */
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "15px", borderRadius: "12px", border: "none",
    background: "#F97316", color: "#1F1156", fontWeight: 800, fontSize: "15px",
    cursor: "pointer", boxShadow: "0 2px 10px rgba(249,115,22,0.35)", minHeight: 52,
  };
  const btnPrimaryDisabled: React.CSSProperties = {
    ...btnPrimary, background: "#2A2F45", color: "#5B6070", boxShadow: "none", cursor: "not-allowed",
  };
  const btnGhost: React.CSSProperties = {
    width: "100%", padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(255,255,255,0.2)",
    background: "transparent", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", minHeight: 48,
  };
  const card: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "20px",
  };
  const eyebrow: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, color: T.primaryText, letterSpacing: "2px", marginBottom: "8px",
  };
  const h1: React.CSSProperties = {
    fontSize: "22px", fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px", lineHeight: 1.25,
  };
  const sub: React.CSSProperties = { fontSize: "14px", color: T.sub, lineHeight: 1.55, margin: 0 };
  const optBtn = (selected: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "12px", width: "100%", textAlign: "left",
    padding: "13px 14px", borderRadius: "14px", minHeight: 52, cursor: "pointer",
    border: `1.5px solid ${selected ? T.primary : T.border}`,
    background: selected ? T.primaryTint : T.s2,
    color: selected ? T.primaryText : T.text, fontWeight: selected ? 700 : 400,
    fontSize: "14px", fontFamily: "inherit", transition: "all 0.15s",
  });
  const backBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none",
    color: T.muted, fontWeight: 700, fontSize: "13px", cursor: "pointer", padding: "0", marginBottom: "16px",
    fontFamily: "inherit",
  };

  const stepHead = (n: number, title: string, subText: string) => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={eyebrow}>STEP {n} OF 5</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: T.muted }}>{Math.round((n / 5) * 100)}%</span>
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: s <= n ? "#6366F1" : "#2A2F45" }} />
        ))}
      </div>
      <h1 style={h1}>{title}</h1>
      <p style={{ ...sub, marginBottom: "20px" }}>{subText}</p>
    </div>
  );

  const backTo = (s: Step) => (
    <button onClick={() => setStep(s)} style={backBtn}>
      <ArrowLeft size={15} strokeWidth={2.2} /> Back
    </button>
  );

  const planSummaryLines = (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", lineHeight: 1.5 }}>
      <div><span style={{ color: T.muted }}>Subjects: </span><span style={{ color: "#fff", fontWeight: 600 }}>English Language{pickedLabels.length ? `, ${pickedLabels.join(", ")}` : ""}</span></div>
      <div><span style={{ color: T.muted }}>Target: </span><span style={{ color: "#fff", fontWeight: 600 }}>{target ? `${target} / 400` : "—"}</span></div>
      <div><span style={{ color: T.muted }}>Exam: </span><span style={{ color: "#fff", fontWeight: 600 }}>{examEstimated ? `Window ${WINDOW_LABEL} (proposed)` : exactDate ? fmtDate(exactDate) : "—"}</span></div>
      <div><span style={{ color: T.muted }}>Daily: </span><span style={{ color: "#fff", fontWeight: 600 }}>{dailyMinutes ? `${dailyMinutes} minutes a day` : "—"}</span></div>
    </div>
  );

  return (
    <div className="fd-page" style={{ fontFamily: "var(--font)", background: "linear-gradient(165deg, #2A1B6B 0%, #1F1156 60%, #150D38 100%)", minHeight: "100dvh", overflowX: "clip" }}>
      <style>{`
        .fd-step { animation: fdStepIn 0.25s ease-out; }
        @keyframes fdStepIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .fd-step { animation: none; } }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, background: "#1F1156",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <img src="/icon-192.png" alt="Companion" width={28} height={28} style={{ borderRadius: "8px", display: "block" }} />
            <span style={{ fontWeight: 800, fontSize: "17px", color: "#fff", letterSpacing: "-0.3px" }}>companion</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/auth" style={{
              borderRadius: "50px", padding: "8px 16px", fontSize: "13px", fontWeight: 700, textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.45)", color: "#fff", background: "transparent",
            }}>
              Log In
            </Link>
            <button
              onClick={() => { if (step === "welcome") setStep("subjects"); window.scrollTo({ top: 0 }); }}
              style={{
                background: "#F97316", color: "#1F1156", border: "none", borderRadius: "50px", padding: "8px 16px",
                fontSize: "13px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── WIZARD ──
          Layout follows the front-door split that AuthForm already uses:
          .fd-auth-grid is a centred 420px column below 1024px (the pitch
          panel is display:none there), and at >=1024px globals.css turns
          it into the 1120px 1.05fr/0.95fr split with the pitch on the left
          and the wizard in the 420px right column. No new breakpoints. */}
      <div className="fd-auth-grid" style={{ maxWidth: "420px", margin: "0 auto" }}>

        {/* Laptop brand panel — hidden below 1024px by .fd-auth-pitch */}
        <div className="fd-auth-pitch">
          <img src="/icon-192.png" alt="Companion" width={44} height={44} style={{ borderRadius: "12px", display: "block", marginBottom: "20px" }} />
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.5px", marginBottom: "12px" }}>
            Real questions. A real plan.<br /><span style={{ color: "#F97316" }}>A tutor in your pocket.</span>
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 28px", maxWidth: "400px" }}>
            Companion is the free JAMB study app built for Nigerian students — it plans your days and keeps you on track until exam day.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
            {DOORS.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", padding: "10px 14px" }}>
                  <Icon size={18} strokeWidth={1.9} color="#F97316" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{d.title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{d.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {step !== "welcome" && (
            <div style={{ marginTop: "20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", padding: "16px", maxWidth: "400px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#A5B4FC", letterSpacing: "2px", marginBottom: "10px" }}>YOUR PLAN — LIVE</div>
              {planSummaryLines}
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "10px" }}>
                {examDays > 0 ? `About ${examDays} days left${examEstimated ? " (estimated)" : ""} — your plan fills in as you answer.` : "Answer the steps and watch your plan fill in."}
              </div>
            </div>
          )}
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: "28px 0 0" }}>Free · No credit card · Set up in 2 minutes</p>
        </div>

        {/* Wizard column — .fd-auth-form caps it at 420px in the laptop split */}
        <div className="fd-auth-form" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 56px)", padding: "20px 16px 28px", boxSizing: "border-box" }}>

          {/* ── WELCOME ── */}
          {step === "welcome" && (
            <div key="welcome" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1, textAlign: "center" }}>
              <img src="/icon-192.png" alt="Companion" width={60} height={60} style={{ borderRadius: "18px", display: "block", margin: "24px auto 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }} />
              <h1 style={{ fontSize: "clamp(30px, 9vw, 40px)", fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-1px", margin: "0 0 14px" }}>
                Ace your JAMB,<br />one step at a time.
              </h1>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.78)", lineHeight: 1.6, margin: "0 auto 24px", maxWidth: "340px" }}>
                Pick your subjects, try a few real questions from them, and get a plan built around your target score and the exam window.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "28px" }}>
                {[
                  { v: "4,060", l: "past questions" },
                  { v: "164", l: "syllabus topics" },
                  { v: "/400", l: "real mock score" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", padding: "12px 6px" }}>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff" }}>{s.v}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "auto" }}>
                <button onClick={() => setStep("subjects")} style={btnPrimary}>
                  Get started <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                </button>
                <Link href="/auth" style={{ display: "block", marginTop: "14px", fontSize: "13px", fontWeight: 700, color: "#A5B4FC", textDecoration: "none" }}>
                  I already have an account — Log in
                </Link>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "16px 0 0" }}>Free · No credit card · Set up in 2 minutes</p>
              </div>
            </div>
          )}

          {/* ── SUBJECTS · STEP 1 ── */}
          {step === "subjects" && (
            <div key="subjects" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {backTo("welcome")}
              {stepHead(1, "Which subjects are you writing?", "English Language is compulsory. Pick 3 more — your warm-up questions come from these.")}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "12px", background: "rgba(49,162,76,0.14)", border: "1px solid rgba(49,162,76,0.35)", marginBottom: "12px" }}>
                <CheckCircle size={15} color="#2FBF71" strokeWidth={2} />
                <span style={{ fontSize: "13px", color: "#7BD88F", fontWeight: 600 }}>English Language (compulsory)</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                {PICKABLE.map((s) => {
                  const sel = picked.includes(s.key);
                  const max = !sel && picked.length >= 3;
                  return (
                    <button
                      key={s.key}
                      onClick={() => togglePick(s.key)}
                      style={{
                        padding: "9px 14px", borderRadius: "50px", fontSize: "13px", minHeight: 44,
                        cursor: max ? "not-allowed" : "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${sel ? "#6366F1" : "#2A2F45"}`,
                        background: sel ? "rgba(99,102,241,0.12)" : "#1E2230",
                        color: sel ? "#A5B4FC" : max ? "#5B6070" : "#C9CDDD",
                        fontWeight: sel ? 700 : 400, opacity: max ? 0.6 : 1, transition: "all 0.15s",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "12px", background: picked.length === 3 ? "rgba(49,162,76,0.14)" : "rgba(99,102,241,0.12)", border: `1px solid ${picked.length === 3 ? "rgba(49,162,76,0.35)" : "rgba(99,102,241,0.35)"}`, marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: picked.length === 3 ? "#7BD88F" : "#A5B4FC", fontWeight: 700 }}>
                  English + {picked.length} of 3 picked{picked.length === 3 ? " — complete" : ` — pick ${3 - picked.length} more`}
                </span>
              </div>
              <div style={{ marginTop: "auto" }}>
                <button onClick={() => setStep("warmup")} disabled={picked.length !== 3} style={picked.length === 3 ? btnPrimary : btnPrimaryDisabled}>
                  Continue <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                </button>
              </div>
            </div>
          )}

          {/* ── WARM-UP · STEP 2 ── */}
          {step === "warmup" && (
            <div key="warmup" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {backTo("subjects")}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={eyebrow}>STEP 2 OF 5</span>
                <button onClick={skipWarm} style={{ background: "none", border: "none", color: T.primaryText, fontWeight: 700, fontSize: "13px", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                  Skip warm-up
                </button>
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: s <= 2 ? "#6366F1" : "#2A2F45" }} />
                ))}
              </div>

              {warmStatus === "loading" && (
                <div>
                  <h1 style={h1}>Quick warm-up</h1>
                  <p style={sub}>Pulling one real question from each of your subjects…</p>
                </div>
              )}

              {warmStatus === "error" && (
                <div>
                  <h1 style={h1}>Quick warm-up</h1>
                  <p style={{ ...sub, marginBottom: "20px" }}>We couldn&apos;t load your questions. Check your connection and try again — or skip the warm-up and keep going.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => setWarmStatus("idle")} style={btnPrimary}>Try again</button>
                    <button onClick={skipWarm} style={btnGhost}>Skip warm-up</button>
                  </div>
                </div>
              )}

              {warmStatus === "ready" && warmQs[warmIndex] && (() => {
                const q = warmQs[warmIndex];
                const letters = Object.keys(q.options) as Array<"A" | "B" | "C" | "D">;
                return (
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <h1 style={h1}>Quick warm-up</h1>
                    <p style={{ ...sub, marginBottom: "16px" }}>
                      Four questions from your subjects — one from each. No pressure, this just finds your level.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: T.primaryText, letterSpacing: "1.5px" }}>{labelFor(q.key).toUpperCase()}</span>
                      <span style={{ fontSize: "12px", color: T.muted }}>Question {warmIndex + 1} of {warmTotal}</span>
                    </div>
                    <div style={{ ...card, marginBottom: "12px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: T.text, lineHeight: 1.6 }}>{q.question}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                      {letters.map((letter) => {
                        const isCorrect = letter === q.answer;
                        const isPicked = warmSelected === letter;
                        const answered = warmSelected !== null;
                        const bg = answered && isCorrect
                          ? T.successTint
                          : answered && isPicked
                            ? T.dangerTint
                            : warmSelected === null ? T.s2 : T.s2;
                        const border = answered && isCorrect
                          ? T.success
                          : answered && isPicked
                            ? T.danger
                            : T.border;
                        return (
                          <button
                            key={letter}
                            onClick={() => chooseWarm(letter)}
                            disabled={answered}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px", width: "100%", textAlign: "left",
                              padding: "13px 14px", borderRadius: "12px", minHeight: 48,
                              cursor: answered ? "default" : "pointer", fontFamily: "inherit",
                              border: `1.5px solid ${border}`, background: bg,
                              color: T.text, fontSize: "14px", lineHeight: 1.45,
                              opacity: answered && !isCorrect && !isPicked ? 0.55 : 1, transition: "all 0.15s",
                            }}
                          >
                            <span style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "13px", fontWeight: 800,
                              background: answered && isCorrect ? T.success : answered && isPicked ? T.danger : T.s3,
                              color: answered && (isCorrect || isPicked) ? "#fff" : T.sub,
                            }}>
                              {answered && isCorrect ? <Check size={15} strokeWidth={3} /> : answered && isPicked ? <X size={15} strokeWidth={3} /> : letter}
                            </span>
                            <span style={{ flex: 1 }}>{q.options[letter]}</span>
                          </button>
                        );
                      })}
                    </div>
                    {warmSelected !== null && (
                      <div style={{
                        marginTop: "12px", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", lineHeight: 1.55,
                        background: warmSelected === q.answer ? T.successTint : T.dangerTint,
                        border: `1px solid ${warmSelected === q.answer ? "rgba(49,162,76,0.35)" : "rgba(250,62,62,0.35)"}`,
                        color: warmSelected === q.answer ? T.successText : T.dangerText,
                      }}>
                        {warmSelected === q.answer
                          ? "Correct — nice work."
                          : `Not quite — the answer is ${q.answer}: ${q.options[q.answer as "A" | "B" | "C" | "D"]}.`}
                      </div>
                    )}
                    <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                      <button onClick={warmNext} disabled={warmSelected === null} style={warmSelected === null ? btnPrimaryDisabled : btnPrimary}>
                        {warmSelected === null
                          ? "Pick an answer first"
                          : warmIndex + 1 < warmTotal ? "Next question" : "See my plan"}
                        <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── TARGET · STEP 3 ── */}
          {step === "target" && (
            <div key="target" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {backTo("warmup")}
              {stepHead(3, "What's your target score?", "Be honest — your plan's pace and mock difficulty follow this.")}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {TARGETS.map((t) => (
                  <button key={t.v} onClick={() => setTarget(t.v)} style={optBtn(target === t.v)}>
                    <span style={{ fontSize: "17px", fontWeight: 800, minWidth: "52px" }}>{t.label}</span>
                    <span style={{ fontSize: "13px", color: T.sub }}>{t.sub}</span>
                    {target === t.v && <Check size={17} strokeWidth={2.5} color={T.primaryText} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "auto" }}>
                <button onClick={() => setStep("exam")} disabled={target === null} style={target === null ? btnPrimaryDisabled : btnPrimary}>
                  Continue <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                </button>
              </div>
            </div>
          )}

          {/* ── EXAM WINDOW · STEP 4 ── */}
          {step === "exam" && (
            <div key="exam" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {backTo("target")}
              {stepHead(4, "When is your exam?", "Nobody has an exact day yet — yours comes on your exam slip, about a week before. So we plan to the window, not a guess.")}
              <div style={{ ...card, marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: T.primaryText, letterSpacing: "1.5px" }}>JAMB 2027 · UTME WINDOW</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#F97316", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", borderRadius: "50px", padding: "3px 10px" }}>Proposed</span>
                </div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: T.text, letterSpacing: "-0.5px" }}>{WINDOW_LABEL}</div>
                <p style={{ fontSize: "13px", color: T.sub, lineHeight: 1.55, margin: "8px 0 0" }}>
                  Prefilled for you — every student sits somewhere inside this window, once JAMB confirms it.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: `1px solid ${T.border}` }}>
                  <Clock size={15} color={T.primaryText} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: T.text }}>
                    About <strong>{examDays} days left (estimated)</strong> — counting down to 15 March, the first day of the window, so you&apos;re ready for the earliest possible day.
                  </span>
                </div>
              </div>
              {examMode === "window" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                  <button onClick={() => setStep("time")} style={btnPrimary}>
                    Use the window — continue <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                  </button>
                  <button onClick={() => { setExamMode("exact"); setExactError(""); }} style={btnGhost}>
                    I know my exact date
                  </button>
                  <p style={{ fontSize: "12px", color: T.muted, lineHeight: 1.55, margin: "4px 0 0", textAlign: "center" }}>
                    When JAMB confirms the dates, or you print your slip, we&apos;ll ask once to update your plan to your exact day.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#9AA0B5", display: "block", marginBottom: "6px" }}>Your exact date — from your exam slip</label>
                    <input
                      type="date"
                      min={tomorrowISO}
                      value={exactDate}
                      onChange={(e) => { setExactDate(e.target.value); setExactError(""); }}
                      style={{
                        width: "100%", padding: "13px 16px", borderRadius: "12px", border: "1.5px solid #2A2F45",
                        fontSize: "15px", outline: "none", background: "#0E1018", color: "#F1F2F8",
                        boxSizing: "border-box", fontFamily: "inherit", colorScheme: "dark",
                      }}
                    />
                  </div>
                  {exactDate && !exactError && daysUntil(exactDate) > 0 && (
                    <div style={{ padding: "10px 14px", borderRadius: "12px", background: T.successTint, border: "1px solid rgba(49,162,76,0.35)", fontSize: "13px", color: T.successText, lineHeight: 1.5 }}>
                      {daysUntil(exactDate)} days left — your exact day, {fmtDate(exactDate)}, from your slip. Your plan will spread {TOPIC_COUNT} topics across them, weakest subject first.
                    </div>
                  )}
                  {exactError && (
                    <div style={{ padding: "10px 14px", borderRadius: "12px", background: T.dangerTint, border: "1px solid rgba(250,62,62,0.35)", fontSize: "13px", color: T.dangerText, lineHeight: 1.5 }}>
                      {exactError}
                    </div>
                  )}
                  <button onClick={confirmExactDate} disabled={!exactDate} style={!exactDate ? btnPrimaryDisabled : btnPrimary}>
                    Continue with this date <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                  </button>
                  <button onClick={() => { setExamMode("window"); setExactDate(""); setExactError(""); }} style={btnGhost}>
                    Use the window instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── DAILY TIME · STEP 5 ── */}
          {step === "time" && (
            <div key="time" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {backTo("exam")}
              {stepHead(5, "How much can you study daily?", "Small and daily beats long and once-a-week. You can change this anytime.")}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {TIMES.map((t) => (
                  <button key={t.v} onClick={() => setDailyMinutes(t.v)} style={optBtn(dailyMinutes === t.v)}>
                    <span style={{ fontSize: "15px", fontWeight: 800, minWidth: "92px" }}>{t.label}</span>
                    <span style={{ fontSize: "13px", color: T.sub }}>{t.sub}</span>
                    {dailyMinutes === t.v && <Check size={17} strokeWidth={2.5} color={T.primaryText} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "auto" }}>
                <button onClick={() => setStep("plan")} disabled={dailyMinutes === null} style={dailyMinutes === null ? btnPrimaryDisabled : btnPrimary}>
                  Build my plan <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                </button>
              </div>
            </div>
          )}

          {/* ── PLAN SUMMARY ── */}
          {step === "plan" && (
            <div key="plan" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {backTo("time")}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={eyebrow}>YOUR PLAN</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.muted }}>100%</span>
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: "#6366F1" }} />
                ))}
              </div>
              <h1 style={h1}>Your plan is ready</h1>
              <p style={{ ...sub, marginBottom: "16px" }}>Built from your answers — your weakest warm-up subject goes first. Create a free account to save it.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 14px", borderRadius: "14px", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.4)" }}>
                  <Target size={19} strokeWidth={2} color="#F97316" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#F97316", letterSpacing: "1.5px" }}>START HERE</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{labelFor(weakestKey)}</div>
                    <div style={{ fontSize: "12px", color: T.sub }}>
                      {warmSkipped
                        ? "Warm-up skipped — we'll find your level as you learn."
                        : warmAnswers[weakestKey] === false
                          ? "Your weakest warm-up subject — fix this first."
                          : "You aced the warm-up — start here to build momentum."}
                    </div>
                  </div>
                </div>
                <div style={{ ...card, padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                    <span style={{ color: T.muted }}>Your subjects</span>
                    <span style={{ color: T.text, fontWeight: 600, textAlign: "right" }}>English + {pickedLabels.join(", ")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                    <span style={{ color: T.muted }}>Warm-up</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{warmSkipped ? "Skipped" : `${warmCorrect} of ${warmTotal} correct`}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                    <span style={{ color: T.muted }}>Target score</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{target} out of 400</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                    <span style={{ color: T.muted }}>Exam countdown</span>
                    <span style={{ color: T.text, fontWeight: 600, textAlign: "right" }}>
                      {examEstimated
                        ? `Window ${fmtShort(WINDOW_START)} – ${fmtShort(WINDOW_END)} (proposed) · planning to 15 Mar · ~${examDays} days left (estimated)`
                        : `${fmtDate(exactDate)} — your exact day · ${examDays} days left`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                    <span style={{ color: T.muted }}>Daily rhythm</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{dailyMinutes} min a day · {TOPIC_COUNT} topics in {examDays} days — about {topicsPerWeek} topics a week</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingTop: "4px" }}>
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <span key={i} style={{
                        width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 700,
                        background: i < 6 ? "#F97316" : "transparent",
                        border: i < 6 ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                        color: i < 6 ? "#1F1156" : T.muted,
                      }}>
                        {d}
                      </span>
                    ))}
                    <span style={{ fontSize: "12px", color: T.muted, marginLeft: "6px" }}>6 days a week, 1 rest day</span>
                  </div>
                </div>
              </div>

              {examEstimated ? (
                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", fontSize: "13px", lineHeight: 1.55, color: "#FDBA74", marginBottom: "16px" }}>
                  We&apos;ll ask once to update this date — when JAMB confirms the 2027 dates, or you print your exam slip with your exact day, Companion asks once to re-plan to that day, so your countdown stops being estimated.
                </div>
              ) : (
                <div style={{ padding: "12px 14px", borderRadius: "12px", background: T.successTint, border: "1px solid rgba(49,162,76,0.35)", fontSize: "13px", lineHeight: 1.55, color: T.successText, marginBottom: "16px" }}>
                  Your exact day is set — no estimating. Your countdown and plan are built around {fmtDate(exactDate)}.
                </div>
              )}

              <div style={{ marginTop: "auto" }}>
                <button onClick={() => setStep("signup")} style={btnPrimary}>
                  Create my free account <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                </button>
              </div>
            </div>
          )}

          {/* ── SIGN-UP HANDOFF · LAST STEP ── */}
          {step === "signup" && (
            <div key="signup" className="fd-step" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {backTo("plan")}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={eyebrow}>LAST STEP</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.muted }}>100%</span>
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: "#6366F1" }} />
                ))}
              </div>
              <h1 style={h1}>Create your account</h1>
              <p style={{ ...sub, marginBottom: "16px" }}>Free. Your plan, warm-up result and progress sync to your account.</p>
              <div style={{ padding: "14px 16px", borderRadius: "14px", background: T.successTint, border: "1px solid rgba(49,162,76,0.35)", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <CheckCircle size={15} color="#2FBF71" strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: T.successText }}>Your choices are saved with your account</span>
                </div>
                <div style={{ fontSize: "13px", color: T.sub, lineHeight: 1.6 }}>
                  English Language{ pickedLabels.length ? `, ${pickedLabels.join(", ")}` : ""} · target {target} / 400 ·{" "}
                  {examEstimated ? `exam window ${WINDOW_LABEL} · planning to 15 Mar (estimated)` : `exam day ${fmtDate(exactDate)}`} ·{" "}
                  {dailyMinutes} minutes a day — so the app won&apos;t ask you for them again.
                </div>
              </div>
              <p style={{ fontSize: "13px", color: T.sub, lineHeight: 1.6, margin: "0 0 16px" }}>
                Next you&apos;ll add your name, email, password, institution and course — your plan choices are already filled in.
              </p>
              <div style={{ marginTop: "auto" }}>
                <button onClick={goSignup} style={btnPrimary}>
                  Create my free account <ArrowRight size={17} strokeWidth={2.2} style={{ verticalAlign: "-3px", marginLeft: "4px" }} />
                </button>
                <p style={{ textAlign: "center", fontSize: "13px", color: T.muted, margin: "14px 0 0" }}>
                  Already have an account?{" "}
                  <Link href="/auth" style={{ color: T.primaryText, fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Log in</Link>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: "transparent", padding: "20px", textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>© 2026 Companion · Free for every student</span>
      </div>
    </div>
  );
}
