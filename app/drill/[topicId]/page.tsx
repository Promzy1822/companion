"use client";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, BookOpen, LayoutGrid,
  AlertCircle, ChevronRight,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "../../components/NavbarView";
import { palette, R, TY, SP, LAYOUT } from "../../lib/design";
import { fetchWithTimeout, FETCH_TIMEOUTS, OfflineError, TimeoutError } from "../../lib/fetch-timeout";
import { useDark } from "../../lib/theme";
import { Progress } from "../../lib/progress";
import { Flame, FlameHeatMeter } from "../../components/Flame";
import { applyAnswer, completionFlame, readFlameStage, HEAT_START } from "../../lib/flame";
import { getTopics } from "../../lib/syllabus";

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
  summary: string;
  exercises: Exercise[];
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const normQ = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Same grade bands as the Lesson done screen.
function gradeFor(pct: number): string {
  if (pct >= 90) return "Excellent";
  if (pct >= 75) return "Well done";
  if (pct >= 60) return "Good effort";
  if (pct >= 40) return "Getting there";
  return "Keep practising";
}

// ── In-progress drill persistence (NEW in this rebuild — the runner had
// no localStorage/persist/restore at all at HEAD; Mock/Lesson had it, drill
// did not). Answers + question index + the question set are saved per topic
// on every change and offered back as a Resume card. Same shape discipline
// as Mock's stored progress: TTL 3h, validated on read, cleared on finish.
const PROGRESS_KEY = (topicId: string) => `companion_drill_progress:${topicId}`;
const PROGRESS_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
interface StoredDrillProgress {
  savedAt: number;
  order: Exercise[];
  qIndex: number;
  selected: number | null;
  answers: boolean[];
  picked: number[];
  heat: number;
  inRow: number;
  source: string | null;
}
function clearStoredProgress(topicId: string) {
  try { localStorage.removeItem(PROGRESS_KEY(topicId)); } catch {}
}
function readStoredProgress(topicId: string): StoredDrillProgress | null {
  const discard = () => { clearStoredProgress(topicId); return null; };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(topicId));
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return discard();
    if (typeof s.savedAt !== "number" || Date.now() - s.savedAt > PROGRESS_TTL_MS || s.savedAt > Date.now() + 60000) return discard();
    if (!Array.isArray(s.order) || !s.order.length) return discard();
    for (const ex of s.order) {
      if (!ex || typeof ex.question !== "string" || !ex.question.trim()) return discard();
      if (!Array.isArray(ex.options) || ex.options.length < 2 || ex.options.some((o: unknown) => typeof o !== "string")) return discard();
      if (!Number.isInteger(ex.correctIndex) || ex.correctIndex < 0 || ex.correctIndex >= ex.options.length) return discard();
      if (typeof ex.explanation !== "string") return discard();
    }
    const n = s.order.length;
    if (!Number.isInteger(s.qIndex) || s.qIndex < 0 || s.qIndex >= n) return discard();
    if (s.selected !== null && (!Number.isInteger(s.selected) || s.selected < 0 || s.selected >= s.order[s.qIndex].options.length)) return discard();
    if (!Array.isArray(s.answers) || s.answers.some((a: unknown) => typeof a !== "boolean")) return discard();
    if (s.answers.length !== s.qIndex && s.answers.length !== s.qIndex + 1) return discard();
    if (!Array.isArray(s.picked) || s.picked.length !== s.answers.length) return discard();
    if (s.picked.some((p: unknown) => !Number.isInteger(p) || (p as number) < 0 || (p as number) >= 4)) return discard();
    if (typeof s.heat !== "number" || s.heat < 0 || s.heat > 100) return discard();
    if (typeof s.inRow !== "number" || s.inRow < 0) return discard();
    if (s.source !== null && typeof s.source !== "string") return discard();
    return s as StoredDrillProgress;
  } catch { return discard(); }
}

export default function DrillPage({ params }: { params: { topicId: string } }) {
  const { topicId } = params;
  const router = useRouter();
  const dark = useDark();
  const T = palette();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [reload, setReload]   = useState(0);
  const [data, setData]       = useState<LessonData | null>(null);
  // H7: the route now reports which source the questions came from.
  // "lesson-exercises" means the drill set was unavailable and the lesson's
  // own check questions were served instead — labelled, never silent.
  const [source, setSource]   = useState<string | null>(null);
  const [order, setOrder]     = useState<Exercise[]>([]);
  const [qIndex, setQIndex]   = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [picked, setPicked]   = useState<number[]>([]);
  const [done, setDone]       = useState(false);
  const [heat, setHeat]       = useState(HEAT_START);
  const [inRow, setInRow]     = useState(0);
  const recordedRef           = useRef(false);
  // H5: slow-network escalation for the drill fetch (~8s) + user cancel.
  const [slowDrill, setSlowDrill] = useState(false);
  const drillAbortRef = useRef<AbortController | null>(null);
  // In-progress resume offer (restored from localStorage after load).
  const [resumeOffer, setResumeOffer] = useState<StoredDrillProgress | null>(null);
  // D1: retake state — a fresh fetch, and whether it turned out to be the
  // same set again (bank exhausted), plus a retake-only error that stays
  // on the done screen instead of wiping it.
  const [retaking, setRetaking] = useState(false);
  const [sameSetNotice, setSameSetNotice] = useState(false);
  const [retakeError, setRetakeError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const aborter = new AbortController();
    drillAbortRef.current = aborter;
    // H5: staged loading — after ~8s say so and offer Cancel.
    const slowTimer = window.setTimeout(() => { if (!cancelled) setSlowDrill(true); }, 8000);
    // Fresh topic / retry: reset run state before the fetch lands.
    setQIndex(0); setSelected(null); setAnswers([]); setPicked([]);
    setDone(false); setHeat(HEAT_START); setInRow(0);
    setOrder([]); setResumeOffer(null); setSameSetNotice(false); setRetakeError("");
    recordedRef.current = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res  = await fetchWithTimeout(`/api/drills/${topicId}`, { signal: aborter.signal }, FETCH_TIMEOUTS.drill);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(body.error || "Could not load this drill."); return; }
        setData(body);
        setSource(typeof body.source === "string" ? body.source : null);
        // Resume: if an in-progress run for this topic was saved, offer it
        // back instead of silently starting over. The saved question set is
        // restored as-is — the fresh fetch only supplies topic metadata.
        const stored = readStoredProgress(topicId);
        if (stored) { setResumeOffer(stored); return; }
        setOrder(shuffled(body.exercises || []));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.name === "AbortError") return; // user pressed Cancel
        if (err instanceof OfflineError) { setError("You're offline — check your connection and try again."); return; }
        if (err instanceof TimeoutError) { setError("This drill is taking too long to load. Check your connection and try again."); return; }
        setError("Network error. Please try again.");
      } finally {
        window.clearTimeout(slowTimer);
        if (!cancelled) { setLoading(false); setSlowDrill(false); }
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
      aborter.abort();
    };
  }, [topicId, reload]);

  // Persist the in-progress run (only once at least one answer is in —
  // opening a drill and leaving without answering saves nothing, so no
  // empty resume offer appears later). Cleared on finish.
  useEffect(() => {
    if (!data || done || !order.length || resumeOffer || answers.length === 0) return;
    try {
      localStorage.setItem(PROGRESS_KEY(topicId), JSON.stringify({
        savedAt: Date.now(), order, qIndex, selected, answers, picked, heat, inRow, source,
      }));
    } catch {}
  }, [data, done, order, qIndex, selected, answers, picked, heat, inRow, source, resumeOffer, topicId]);

  const currentQ = order[qIndex];
  const score = answers.filter(Boolean).length;
  const drillFlame = completionFlame(score, order.length);
  const pct = order.length > 0 ? Math.round((score / order.length) * 100) : 0;
  // D6 next step: next topic in the same subject, in syllabus order.
  const subjectTopics = data ? getTopics(data.subjectKey) : [];
  const topicIdx = data ? subjectTopics.findIndex(t => t.id === data.topicId) : -1;
  const nextTopic = topicIdx >= 0 ? subjectTopics[topicIdx + 1] : undefined;

  const selectAnswer = (i: number) => {
    if (selected !== null || !currentQ) return;
    setSelected(i);
    setPicked(p => [...p, i]);
    const correct = i === currentQ.correctIndex;
    setAnswers(a => [...a, correct]);
    const next = applyAnswer(heat, inRow, correct);
    setHeat(next.heat);
    setInRow(next.inRow);
  };

  const finish = (finalAnswers: boolean[]) => {
    clearStoredProgress(topicId);
    if (data && !recordedRef.current) {
      recordedRef.current = true;
      Progress.recordActivity("practice", {
        topicId: data.topicId,
        subject: data.subject,
        correct: finalAnswers.filter(Boolean).length,
        total: order.length,
      });
    }
    setDone(true);
  };

  const nextQuestion = () => {
    if (qIndex + 1 < order.length) {
      setQIndex(q => q + 1);
      setSelected(null);
    } else {
      finish(answers);
    }
  };

  const resumeSaved = () => {
    if (!resumeOffer) return;
    setOrder(resumeOffer.order);
    setQIndex(resumeOffer.qIndex);
    setSelected(resumeOffer.selected);
    setAnswers(resumeOffer.answers);
    setPicked(resumeOffer.picked);
    setHeat(resumeOffer.heat);
    setInRow(resumeOffer.inRow);
    setSource(resumeOffer.source);
    setResumeOffer(null);
  };

  const startFresh = () => {
    clearStoredProgress(topicId);
    setResumeOffer(null);
    if (data) setOrder(shuffled(data.exercises || []));
  };

  // D1: "Drill again" fetches a FRESH set from the route — it never just
  // reshuffles the finished set. The route re-samples its merged bank +
  // generated set on every call, so a new fetch usually draws different
  // questions; when it comes back identical (bank exhausted for this
  // topic) the user is told so honestly instead of being silently
  // re-served the same questions as if they were new.
  const drillAgain = async () => {
    if (retaking) return;
    setRetaking(true);
    setRetakeError("");
    setSameSetNotice(false);
    try {
      const res = await fetchWithTimeout(`/api/drills/${topicId}`, { cache: "no-store" }, FETCH_TIMEOUTS.drill);
      const body = await res.json();
      if (!res.ok) { setRetakeError(body.error || "Could not load a new set of questions."); return; }
      const fresh = (body.exercises || []) as Exercise[];
      const oldKeys = new Set(order.map(e => normQ(e.question)));
      const sameSet = fresh.length > 0 && fresh.length === order.length &&
        fresh.every(e => oldKeys.has(normQ(e.question)));
      setData(body);
      setSource(typeof body.source === "string" ? body.source : null);
      if (sameSet) {
        setSameSetNotice(true);
        setOrder(shuffled(order));
      } else {
        setOrder(shuffled(fresh));
      }
      setQIndex(0);
      setSelected(null);
      setAnswers([]);
      setPicked([]);
      setDone(false);
      setHeat(HEAT_START);
      setInRow(0);
      recordedRef.current = false;
      clearStoredProgress(topicId);
    } catch (err) {
      if (err instanceof OfflineError) setRetakeError("You're offline — check your connection and try again.");
      else if (err instanceof TimeoutError) setRetakeError("The new set is taking too long to load. Try again.");
      else setRetakeError("Could not load a new set of questions. Try again.");
    } finally {
      setRetaking(false);
    }
  };

  // One primary / secondary button (Lesson pattern): orange CTA with indigo
  // text (the brand rule — white on orange fails contrast), 48px minimum.
  const primaryBtn: CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
    background: T.accent, color: "#1F1156", fontWeight: 700, fontSize: TY.base,
    cursor: "pointer", minHeight: 48, fontFamily: "inherit",
  };
  const secondaryBtn: CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    width: "100%", padding: "13px", borderRadius: R.pill,
    background: "transparent", color: T.text, fontWeight: 700, fontSize: TY.base,
    border: `1.5px solid ${T.border}`, cursor: "pointer", minHeight: 48,
    fontFamily: "inherit",
  };

  if (loading) {
    return (
      <div className="drill-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
        <div style={{ maxWidth: LAYOUT.pageNarrow, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${T.s3}`, borderTopColor: T.accent, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: TY.sm, color: T.sub }}>Preparing your drill… the first drill on a topic can take a few seconds.</div>
          {slowDrill && (
            <div style={{ marginTop: SP[4] }}>
              <div style={{ fontSize: TY.sm, color: T.sub, marginBottom: SP[3] }}>Still loading — this can take a few seconds on a slow connection.</div>
              <button onClick={() => { drillAbortRef.current?.abort(); router.back(); }} style={{ padding: "10px 20px", borderRadius: R.pill, border: `1px solid ${T.border}`, background: T.s2, color: T.text, fontWeight: 700, fontSize: TY.base, cursor: "pointer", minHeight: 44, fontFamily: "inherit" }}>Cancel</button>
            </div>
          )}
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // H8: error state with "Try again" (re-runs the fetch) + "Go back".
  if (error || !data) {
    return (
      <div className="drill-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
        <div style={{ maxWidth: LAYOUT.pageNarrow, margin: "0 auto", padding: "24px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: SP[3] }}>
            <AlertCircle size={32} color={T.muted} />
          </div>
          <h2 style={{ fontSize: TY.lg, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>Couldn&apos;t load this drill</h2>
          <p style={{ color: T.sub, fontSize: TY.base, lineHeight: 1.6, margin: "0 0 18px" }}>
            {error || "Something went wrong loading this drill."}
          </p>
          <button onClick={() => setReload(r => r + 1)} style={{ ...primaryBtn, marginBottom: 10 }}>Try again</button>
          <button onClick={() => router.back()} style={secondaryBtn}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="drill-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
      {/* Runner stays single-column capped at 760px (AUDIT §3.11) — a focus
          surface; only the done-state buttons change at laptop. Container
          padding is tier-aware via .drill-content (16px phone / 20px 24px
          laptop), normalising the old 16px-runner vs 20px-picker split. */}
      <div className="drill-content" style={{ maxWidth: LAYOUT.pageNarrow, margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: T.sub, fontSize: TY.sm, fontWeight: 600, cursor: "pointer", marginBottom: SP[3], padding: 0, minHeight: 44,
        }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ marginBottom: SP[4] }}>
          <div style={{ fontSize: TY.xs, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {data.subject} · Quick Drill
          </div>
          <h1 style={{ fontSize: TY.xl, fontWeight: 800, color: T.text, margin: "2px 0 0" }}>{data.topicName}</h1>
        </div>

        {/* H7: when the route fell back to lesson exercises, say so — the
            questions below are the lesson's own check, not a drill set. */}
        {source === "lesson-exercises" && (
          <div style={{ background: T.warningTint, border: `1px solid ${T.warning}55`, borderRadius: R.lg, padding: "12px 14px", marginBottom: SP[4] }}>
            <p style={{ fontSize: TY.sm, color: T.warning, margin: 0, lineHeight: 1.55, fontWeight: 600 }}>
              Using lesson exercises — drill questions unavailable
            </p>
            <p style={{ fontSize: TY.xs, color: T.sub, margin: "4px 0 0", lineHeight: 1.55 }}>
              A fresh drill set could not be built for this topic, so this drill uses the lesson&apos;s own check questions instead.
            </p>
          </div>
        )}

        {/* D1 honesty: the retake fetch returned the same questions. */}
        {sameSetNotice && !done && (
          <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.lg, padding: "12px 14px", marginBottom: SP[4] }}>
            <p style={{ fontSize: TY.sm, color: T.text, margin: 0, lineHeight: 1.55 }}>
              No new questions for this topic yet — same questions, new order.
            </p>
          </div>
        )}

        {resumeOffer && !done && (
          <div className="drill-card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: R.xxl, textAlign: "center" }}>
            <h2 style={{ fontSize: TY.lg, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>Resume your drill?</h2>
            <p style={{ fontSize: TY.base, color: T.sub, margin: "0 0 18px", lineHeight: 1.6 }}>
              You left this drill on question {resumeOffer.qIndex + 1} of {resumeOffer.order.length}
              {resumeOffer.answers.length > 0 ? ` — ${resumeOffer.answers.filter(Boolean).length} correct so far` : ""}.
            </p>
            <button onClick={resumeSaved} style={{ ...primaryBtn, marginBottom: 10 }}>Resume drill</button>
            <button onClick={startFresh} style={secondaryBtn}>Start fresh</button>
          </div>
        )}

        {!resumeOffer && order.length === 0 && (
          <div className="drill-card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: R.xxl, textAlign: "center" }}>
            <p style={{ fontSize: TY.base, color: T.sub, marginBottom: SP[4], lineHeight: 1.6 }}>
              No drill questions for this topic yet — drills are built from past questions and a fresh practice set, separate from the lesson's own check.
            </p>
            <Link href={`/lessons/${data.topicId}`} style={{ display: "inline-block", padding: "12px 22px", borderRadius: R.pill, background: T.primary, color: T.onPrimary, fontWeight: 700, fontSize: TY.base, textDecoration: "none" }}>
              Open the lesson
            </Link>
          </div>
        )}

        {!resumeOffer && order.length > 0 && !done && currentQ && (
          <div className="drill-card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: R.xxl }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SP[2], gap: SP[2], flexWrap: "wrap" }}>
              <div style={{ fontSize: TY.xs, color: T.sub, fontWeight: 600 }}>
                Question {qIndex + 1} of {order.length}
              </div>
              {/* D5: score reads correct / answered-so-far, with the total
                  shown honestly — never "Score 2/2" mid-drill. */}
              <div style={{ fontSize: TY.xs, fontWeight: 700, color: T.accent }}>
                Score {score} of {answers.length} answered · {order.length} questions
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: SP[3] }}>
              <Flame stage={readFlameStage()} heat={heat} mood={heat >= 75 ? "celebrating" : heat < 25 ? "sleepy" : "happy"} size={44} />
              <div style={{ flex: 1 }}>
                <FlameHeatMeter heat={heat} />
              </div>
            </div>
            {/* D5: bar = answered / total, so it reaches 100% on the last
                answered question instead of stalling at (n-1)/n. */}
            <div style={{ height: 4, borderRadius: 2, background: T.s3, overflow: "hidden", marginBottom: SP[4] }}>
              <div style={{ height: "100%", width: `${Math.round(((qIndex + (selected !== null ? 1 : 0)) / order.length) * 100)}%`, background: T.accent, transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: SP[4] }}>{currentQ.question}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: SP[2] }}>
              {currentQ.options.map((opt, i) => {
                const isCorrect = i === currentQ.correctIndex;
                const isChosen  = i === selected;
                let bg = T.s2, border = T.border, color = T.text;
                if (selected !== null) {
                  if (isCorrect)     { bg = T.successTint; border = T.success; color = T.successText; }
                  else if (isChosen) { bg = T.dangerTint;  border = T.danger;  color = T.dangerText;  }
                }
                return (
                  <button key={i} onClick={() => selectAnswer(i)} disabled={selected !== null} style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: R.lg, minHeight: 44,
                    border: `1.5px solid ${border}`, background: bg, color,
                    fontSize: TY.base, fontWeight: 600, cursor: selected === null ? "pointer" : "default",
                    display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit",
                  }}>
                    {opt}
                    {selected !== null && isCorrect && <CheckCircle2 size={16} color={T.success} />}
                    {selected !== null && isChosen && !isCorrect && <XCircle size={16} color={T.danger} />}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <>
                <p style={{ fontSize: TY.sm, color: T.sub, marginTop: SP[3], lineHeight: 1.6 }}>{currentQ.explanation}</p>
                <button onClick={nextQuestion} style={{
                  width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
                  background: T.accent, color: "#1F1156", fontWeight: 700, fontSize: TY.base, cursor: "pointer", marginTop: SP[4], minHeight: 48,
                }}>
                  {qIndex + 1 < order.length ? "Next question" : "Finish drill"}
                </button>
              </>
            )}
          </div>
        )}

        {!resumeOffer && done && (
          <div className="drill-card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: R.xxl, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <Flame stage={readFlameStage()} heat={heat} mood={drillFlame.mood} speech={drillFlame.speech} size={88} />
            </div>
            <h2 style={{ fontSize: TY.lg, fontWeight: 800, color: T.text, marginBottom: 4 }}>Drill complete</h2>
            {/* D6: percentage + grade (Lesson bands) under the heading. */}
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>{pct}% — {gradeFor(pct)}</p>
            <p style={{ fontSize: TY.base, color: T.sub, margin: "0 0 18px" }}>
              You scored {score}/{order.length} on {data.topicName}.
            </p>
            {retakeError && (
              <div style={{ background: T.dangerTint, border: `1px solid ${T.danger}55`, borderRadius: R.lg, padding: "12px 14px", marginBottom: SP[3], textAlign: "left" }}>
                <p style={{ fontSize: TY.sm, color: T.dangerText, margin: 0, lineHeight: 1.55 }}>{retakeError}</p>
              </div>
            )}
            {/* D6 next step + D1: "Drill again" fetches a new set (see
                drillAgain). Laptop: first two buttons side by side, lesson
                link below (AUDIT §3.11 / sample .done-actions). */}
            <div className="drill-done-actions">
              <button onClick={drillAgain} disabled={retaking} style={{
                ...primaryBtn, width: "100%", marginBottom: 0, opacity: retaking ? 0.6 : 1,
              }}>
                <RotateCcw size={15} /> {retaking ? "Getting new questions…" : "Drill again — new questions"}
              </button>
              <Link href={`/drill?subject=${data.subjectKey}`} style={{
                ...secondaryBtn, width: "100%", textDecoration: "none", marginBottom: 0,
              }}>
                <LayoutGrid size={15} /> Pick another topic
              </Link>
              <Link href={`/lessons/${data.topicId}`} className="full" style={{ fontSize: TY.sm, color: T.sub, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 44 }}>
                <BookOpen size={14} /> Read the {data.topicName} lesson
              </Link>
            </div>
            {nextTopic && (
              <Link href={`/drill/${nextTopic.id}`} style={{ fontSize: TY.sm, color: T.accent, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 44, marginTop: SP[2] }}>
                Next topic: {nextTopic.topic} <ChevronRight size={15} />
              </Link>
            )}

            <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, textAlign: "left", margin: "18px 0 8px" }}>Review your answers</h3>
            {order.map((ex, i) => {
              const wasRight = answers[i] === true;
              const pickedOpt = picked[i] != null ? ex.options[picked[i]] : null;
              return (
                <details key={i} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: R.lg, padding: "12px 14px", marginBottom: SP[2], textAlign: "left" }}>
                  <summary style={{ display: "flex", alignItems: "flex-start", gap: SP[2], cursor: "pointer", fontSize: TY.base, fontWeight: 600, color: T.text, lineHeight: 1.5 }}>
                    {wasRight
                      ? <CheckCircle2 size={16} color={T.successText} style={{ flexShrink: 0, marginTop: 2 }} />
                      : <XCircle size={16} color={T.dangerText} style={{ flexShrink: 0, marginTop: 2 }} />}
                    <span style={{ flex: 1, minWidth: 0 }}>Q{i + 1}. {ex.question}</span>
                  </summary>
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: TY.base, margin: "0 0 4px", lineHeight: 1.6, color: wasRight ? T.successText : T.dangerText }}>
                      Your answer: {pickedOpt ?? "—"}
                    </p>
                    {!wasRight && (
                      <p style={{ fontSize: TY.base, margin: "0 0 4px", lineHeight: 1.6, color: T.successText }}>
                        Correct answer: {ex.options[ex.correctIndex]}
                      </p>
                    )}
                    <p style={{ fontSize: TY.base, color: T.text, margin: "6px 0 0", lineHeight: 1.6 }}>{ex.explanation}</p>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
