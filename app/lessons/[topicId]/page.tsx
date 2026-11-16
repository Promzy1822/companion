/**
 * DRAFT — Lesson reader rebuild (W1). Do NOT copy straight into the repo;
 * the coordinator assembles the package.
 *
 * Based on app/lessons/[topicId]/page.tsx at HEAD aabd1582 (Home v3 landed).
 * Structural rebuild to the approved Lesson sample (Gas Laws, phy_25).
 *
 * Engine wiring preserved exactly: /api/lessons fetch, stage state
 * (video/summary/learn/quiz/done), quiz state + heat + Flame, Progress
 * sync (recordActivity "lesson" + setTopicDone), drill link /drill/[topicId].
 * Player internals live in app/components/lesson/players.tsx (W2's draft);
 * this page only renders LessonBlockView and passes it the optional
 * onContinueExercises callback (story finished state).
 *
 * Layout classes come from globals.css (W3's patcher): .lesson-page-pad,
 * .lesson-layout, .lesson-main, .lesson-rail, .lesson-prose. This file
 * carries NO layout CSS of its own — only the drill-pattern spin
 * keyframes inside the loading state.
 */
"use client";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, PlayCircle, Target,
  ChevronRight, ChevronDown, AlertCircle, RotateCcw, BookOpen,
} from "lucide-react";
import Navbar, { NAVBAR_HEIGHT } from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { LessonBlockView } from "../../components/lesson/players";
import { palette, R, S } from "../../lib/design";
import { useDark } from "../../lib/theme";
import { Progress } from "../../lib/progress";
import { Flame, FlameHeatMeter } from "../../components/Flame";
import { applyAnswer, completionFlame, readFlameStage, HEAT_START } from "../../lib/flame";
import type { LessonBlock } from "../../lib/lesson-v2";

interface Exercise {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LessonData {
  topicId: string;
  subjectKey: string;
  subject: string;
  topicName: string;
  videoId: string | null;
  objectives?: string[];
  version?: number;
  blocks?: LessonBlock[];
  summary?: string;
  exercises: Exercise[];
}

type Stage = "video" | "summary" | "learn" | "quiz" | "done";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function gradeFor(pct: number): string {
  if (pct >= 90) return "Excellent";
  if (pct >= 75) return "Well done";
  if (pct >= 60) return "Good effort";
  if (pct >= 40) return "Getting there";
  return "Keep practising";
}

export default function LessonPage({ params }: { params: { topicId: string } }) {
  const { topicId } = params;
  const router = useRouter();

  const dark = useDark();
  const T = palette();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [data, setData]       = useState<LessonData | null>(null);
  const [reload, setReload]   = useState(0);

  const [stage, setStage]       = useState<Stage>("video");
  const [qIndex, setQIndex]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers]   = useState<boolean[]>([]);
  const [picked, setPicked]     = useState<number[]>([]);
  const [hovered, setHovered]   = useState<number | null>(null);
  const [heat, setHeat]       = useState(HEAT_START);
  const [inRow, setInRow]     = useState(0);
  const [objOpen, setObjOpen] = useState(true);
  const recordedRef           = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res  = await fetch(`/api/lessons/${topicId}`);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(body.error || "Could not load this lesson."); return; }
        setData(body);
        setStage(body.version === 2 ? "learn" : (body.videoId ? "video" : "summary"));
        setHeat(HEAT_START);
        setInRow(0);
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [topicId, reload]);

  // Objectives are the learn-stage reference: collapse the card when the
  // reader leaves Learn so it never sits above the quiz / done screen on
  // phone. The user can re-expand it at any time (state is not forced).
  useEffect(() => {
    if (stage === "quiz" || stage === "done") setObjOpen(false);
  }, [stage]);

  // Drill loading pattern, verbatim (L3): spinner + copy, never blank.
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${T.s3}`, borderTopColor: "#F97316", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: T.sub }}>Loading your lesson…</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // One primary / secondary button (L2): orange CTA with indigo text
  // (the proven front-door combination), 48px minimum height (L14).
  const primaryBtn: CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
    background: T.accent, color: "#1F1156", fontWeight: 700, fontSize: 14,
    cursor: "pointer", minHeight: 48, fontFamily: "inherit",
  };
  const secondaryBtn: CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    width: "100%", padding: "13px", borderRadius: R.pill,
    background: "transparent", color: T.text, fontWeight: 700, fontSize: 14,
    border: `1.5px solid ${T.border}`, cursor: "pointer", minHeight: 48,
    fontFamily: "inherit",
  };

  if (error || !data) {
    return (
      <div className="lesson-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: `${NAVBAR_HEIGHT}px`, fontFamily: "var(--font)" }}>
        <Navbar darkMode={dark} />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <AlertCircle size={32} color={T.muted} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>Couldn&apos;t load this lesson</h2>
          <p style={{ color: T.sub, fontSize: 14, lineHeight: 1.6, margin: "0 0 18px" }}>
            {error || "Something went wrong loading this lesson."}
          </p>
          <button onClick={() => setReload(r => r + 1)} style={{ ...primaryBtn, marginBottom: 10 }}>Try again</button>
          <button onClick={() => router.back()} style={secondaryBtn}>Go back</button>
        </div>
        <BottomNav darkMode={dark} />
      </div>
    );
  }

  const exercises = data.exercises || [];
  const currentQ  = exercises[qIndex];
  const score     = answers.filter(Boolean).length;
  const isV2      = data.version === 2 && Array.isArray(data.blocks);
  const segments: Stage[] = isV2 ? ["learn", "quiz"] : ["video", "summary", "quiz"];
  const segmentLabels: string[] = isV2 ? ["Learn", "Exercises"] : ["Video", "Summary", "Exercises"];
  const stageOrder: Stage[] = ["video", "summary", "learn", "quiz", "done"];
  const hasRail = isV2 && (data.objectives?.length ?? 0) > 0;
  const pct = exercises.length > 0 ? Math.round((score / exercises.length) * 100) : 100;
  const flameDone = completionFlame(score, exercises.length);
  const summaryParas = (data.summary || "").split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);

  const selectAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setPicked(p => [...p, i]);
    const correct = i === currentQ.correctIndex;
    setAnswers(a => [...a, correct]);
    const next = applyAnswer(heat, inRow, correct);
    setHeat(next.heat);
    setInRow(next.inRow);
  };

  const completeLesson = () => {
    if (!recordedRef.current) {
      recordedRef.current = true;
      Progress.recordActivity("lesson", {
        topicId: data.topicId,
        subject: data.subject,
        correct: answers.filter(Boolean).length,
        total: exercises.length,
      });
    }
    Progress.setTopicDone(data.topicId, true, false);
    setStage("done");
  };

  const nextQuestion = () => {
    if (qIndex + 1 < exercises.length) {
      setQIndex(q => q + 1);
      setSelected(null);
    } else {
      completeLesson();
    }
  };

  const startQuiz = () => exercises.length > 0 ? setStage("quiz") : completeLesson();

  const retakeExercises = () => {
    setQIndex(0);
    setSelected(null);
    setAnswers([]);
    setPicked([]);
    setHeat(HEAT_START);
    setInRow(0);
    recordedRef.current = false;
    setStage("quiz");
  };

  return (
    <div className="lesson-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: `${NAVBAR_HEIGHT}px`, fontFamily: "var(--font)" }}>
      <Navbar darkMode={dark} />
      <div style={{ padding: "16px" }}>
        <div className="lesson-layout">

          {hasRail && (
            <aside className="lesson-rail">
              <div style={{ background: T.primaryTint, border: `1px solid ${T.primary}`, borderRadius: R.xxl, padding: "16px 18px", marginBottom: 14 }}>
                <button type="button" onClick={() => setObjOpen(o => !o)} aria-expanded={objOpen} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left", minHeight: 24,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.primaryText, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    <Target size={13} /> In this lesson
                  </span>
                  <ChevronDown size={16} color={T.primaryText} style={{ flexShrink: 0, transform: objOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: objOpen ? "block" : "none" }}>
                  {data.objectives!.map((o, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, marginBottom: i === data.objectives!.length - 1 ? 0 : 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.primaryText, flexShrink: 0, marginTop: 8 }} />
                      <span style={{ fontSize: 14, lineHeight: 1.6, color: T.text }}>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          <div className="lesson-main">
            <button onClick={() => router.back()} style={{
              display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
              color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12,
              padding: "0 4px", minHeight: 44, fontFamily: "inherit",
            }}>
              <ArrowLeft size={16} /> Back
            </button>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {data.subject} · {data.topicName}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "2px 0 0" }}>
                {data.topicName}
              </h1>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              {segments.map(s => {
                const filled = stageOrder.indexOf(stage) >= stageOrder.indexOf(s);
                return (
                  <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: filled ? T.accent : T.s3 }} />
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {segments.map((s, idx) => {
                const isCurrent = stage === s || (stage === "done" && s === "quiz");
                return (
                  <div key={s} style={{ flex: 1, fontSize: 12, fontWeight: 600, color: isCurrent ? T.accent : T.sub }}>
                    {segmentLabels[idx]}
                  </div>
                );
              })}
            </div>

            {isV2 && stage === "learn" && (
              <>
                {(data.blocks ?? []).map((b, i) => (
                  <LessonBlockView key={i} block={b} T={T} onContinueExercises={startQuiz} />
                ))}
                <button onClick={startQuiz} style={primaryBtn}>
                  <span>{exercises.length > 0 ? `Start exercises (${exercises.length})` : "Finish lesson"}</span>
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {!isV2 && stage === "video" && (
              <div style={{ background: T.surface, borderRadius: R.xxl, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14 }}>
                {data.videoId ? (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: R.lg, overflow: "hidden", marginBottom: 14 }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${data.videoId}`}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: T.s2, borderRadius: R.lg, marginBottom: 14, textAlign: "center" }}>
                    <PlayCircle size={32} color={T.muted} />
                    <p style={{ color: T.sub, fontSize: 14, margin: "8px 0 14px" }}>Video coming soon for this topic</p>
                    <button onClick={() => setStage("summary")} style={{ ...secondaryBtn, width: "auto", padding: "10px 18px", minHeight: 44 }}>
                      Read the summary instead
                    </button>
                  </div>
                )}
                <button onClick={() => setStage("summary")} style={primaryBtn}>
                  <span>Continue to summary</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {!isV2 && stage === "summary" && (
              <div style={{ background: T.surface, borderRadius: R.xxl, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: "0 0 12px" }}>Key points</h2>
                <div className="lesson-prose">
                  {summaryParas.map((para, i) => (
                    <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: T.text, margin: i === summaryParas.length - 1 ? 0 : "0 0 16px" }}>
                      {para}
                    </p>
                  ))}
                </div>
                <button onClick={startQuiz} style={{ ...primaryBtn, marginTop: 16 }}>
                  <span>{exercises.length > 0 ? `Start exercises (${exercises.length})` : "Finish lesson"}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {stage === "quiz" && currentQ && (
              <div style={{ background: T.surface, borderRadius: R.xxl, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <Flame stage={readFlameStage()} heat={heat} mood={heat >= 75 ? "celebrating" : heat < 25 ? "sleepy" : "happy"} size={44} />
                  <div style={{ flex: 1 }}>
                    <FlameHeatMeter heat={heat} />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: T.sub, margin: "0 0 12px" }}>Right answers raise Flame&apos;s heat — wrong answers cool it.</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>
                    Question {qIndex + 1} of {exercises.length}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>
                    Score {score}/{exercises.length}
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: T.s3, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${Math.round(((qIndex + (selected !== null ? 1 : 0)) / exercises.length) * 100)}%`, background: T.accent, transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14 }}>
                  {currentQ.question}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {currentQ.options.map((opt, i) => {
                    const isCorrect = i === currentQ.correctIndex;
                    const isChosen  = i === selected;
                    let bg = T.s2, border = T.border, color = T.text;
                    let chipBg = T.s3, chipColor = T.sub;
                    if (selected === null && hovered === i) bg = T.s3;
                    if (selected !== null) {
                      if (isCorrect)     { bg = T.successTint; border = T.success; color = T.successText; chipBg = T.successTint; chipColor = T.successText; }
                      else if (isChosen) { bg = T.dangerTint; border = T.danger; color = T.dangerText; chipBg = T.dangerTint; chipColor = T.dangerText; }
                    }
                    return (
                      <button key={i} onClick={() => selectAnswer(i)} disabled={selected !== null}
                        onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{
                        textAlign: "left", padding: "12px 14px", borderRadius: R.lg, minHeight: 44,
                        border: `1.5px solid ${border}`, background: bg, color,
                        fontSize: 14, fontWeight: 600, cursor: selected === null ? "pointer" : "default",
                        display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "inherit",
                      }}>
                        <span style={{ minWidth: 22, height: 22, borderRadius: 6, background: chipBg, color: chipColor, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {LETTERS[i] ?? String(i + 1)}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, lineHeight: 1.5 }}>{opt}</span>
                        {selected !== null && isCorrect && <CheckCircle2 size={16} color={T.successText} style={{ flexShrink: 0, marginTop: 2 }} />}
                        {selected !== null && isChosen && !isCorrect && <XCircle size={16} color={T.dangerText} style={{ flexShrink: 0, marginTop: 2 }} />}
                      </button>
                    );
                  })}
                </div>
                {selected !== null && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 13, fontWeight: 700, color: selected === currentQ.correctIndex ? T.successText : T.dangerText }}>
                      {selected === currentQ.correctIndex ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      {selected === currentQ.correctIndex
                        ? "Correct"
                        : `Not quite — the answer is ${currentQ.options[currentQ.correctIndex]}`}
                    </div>
                    <div style={{ borderLeft: `3px solid ${selected === currentQ.correctIndex ? T.success : T.danger}`, paddingLeft: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1 }}>Explanation</div>
                      <p style={{ fontSize: 14, color: T.text, margin: "4px 0 0", lineHeight: 1.6 }}>{currentQ.explanation}</p>
                    </div>
                    <button onClick={nextQuestion} style={{ ...primaryBtn, marginTop: 14 }}>
                      <span>{qIndex + 1 < exercises.length ? "Next question" : "Finish lesson"}</span>
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
            )}

            {stage === "done" && (
              <>
                <div style={{ background: T.surface, borderRadius: R.xxl, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                    <Flame stage={readFlameStage()} heat={heat} mood={flameDone.mood} speech={flameDone.speech} size={88} />
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 4 }}>Lesson complete!</h2>
                  {exercises.length > 0 && (
                    <>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>{pct}% — {gradeFor(pct)}</p>
                      <p style={{ fontSize: 14, color: T.sub, margin: "0 0 18px" }}>
                        You scored {score}/{exercises.length} on the exercises.
                      </p>
                    </>
                  )}
                  {exercises.length > 0 && (
                    <button onClick={retakeExercises} style={{ ...primaryBtn, marginBottom: 10 }}>
                      <RotateCcw size={15} /> Retake exercises
                    </button>
                  )}
                  <Link href={`/learn/${data.subjectKey}`} style={{ ...secondaryBtn, textDecoration: "none", marginBottom: 10 }}>
                    Back to {data.subject} topics
                  </Link>
                  <Link href="/" style={{ fontSize: 13, color: T.sub, fontWeight: 600, textDecoration: "none" }}>
                    Return home
                  </Link>
                  {exercises.length > 0 && (
                    <>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, textAlign: "left", margin: "18px 0 8px" }}>Review your answers</h3>
                      {exercises.map((ex, i) => {
                        const wasRight = answers[i] === true;
                        const pickedOpt = picked[i] != null ? ex.options[picked[i]] : null;
                        return (
                          <details key={i} className="lesson-review" style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.lg, padding: "12px 14px", marginBottom: 8, textAlign: "left" }}>
                            <summary style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.5 }}>
                              {wasRight
                                ? <CheckCircle2 size={16} color={T.successText} style={{ flexShrink: 0, marginTop: 2 }} />
                                : <XCircle size={16} color={T.dangerText} style={{ flexShrink: 0, marginTop: 2 }} />}
                              <span style={{ flex: 1, minWidth: 0 }}>Q{i + 1}. {ex.question}</span>
                            </summary>
                            <div style={{ marginTop: 10 }}>
                              <p style={{ fontSize: 14, margin: "0 0 4px", lineHeight: 1.6, color: wasRight ? T.successText : T.dangerText }}>
                                Your answer: {pickedOpt ?? "—"}
                              </p>
                              {!wasRight && (
                                <p style={{ fontSize: 14, margin: "0 0 4px", lineHeight: 1.6, color: T.successText }}>
                                  Correct answer: {ex.options[ex.correctIndex]}
                                </p>
                              )}
                              <p style={{ fontSize: 14, color: T.text, margin: "6px 0 0", lineHeight: 1.6 }}>{ex.explanation}</p>
                            </div>
                          </details>
                        );
                      })}
                    </>
                  )}
                </div>

                <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.xxl, padding: "18px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <BookOpen size={16} color={T.accent} />
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: 0 }}>Keep practising</h3>
                  </div>
                  <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6, margin: "0 0 14px" }}>
                    Drill {data.topicName} with fresh questions from past papers — a separate check from these exercises.
                  </p>
                  <Link href={`/drill/${data.topicId}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "13px", borderRadius: R.pill, background: T.primary, color: "#fff",
                    fontWeight: 700, fontSize: 14, textDecoration: "none", minHeight: 48,
                  }}>
                    <Target size={15} /> Drill this topic
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <BottomNav darkMode={dark} />
    </div>
  );
}
