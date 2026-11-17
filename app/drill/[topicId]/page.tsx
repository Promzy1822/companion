"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, BookOpen, LayoutGrid } from "lucide-react";
import { NAVBAR_HEIGHT } from "../../components/NavbarView";
import { palette, R } from "../../lib/design";
import { fetchWithTimeout, FETCH_TIMEOUTS, OfflineError, TimeoutError } from "../../lib/fetch-timeout";
import { useDark } from "../../lib/theme";
import { Progress } from "../../lib/progress";
import { Flame, FlameHeatMeter } from "../../components/Flame";
import { applyAnswer, completionFlame, readFlameStage, HEAT_START } from "../../lib/flame";

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

export default function DrillPage({ params }: { params: { topicId: string } }) {
  const { topicId } = params;
  const router = useRouter();
  const dark = useDark();
  const T = palette();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [data, setData]       = useState<LessonData | null>(null);
  const [order, setOrder]     = useState<Exercise[]>([]);
  const [qIndex, setQIndex]   = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone]       = useState(false);
  const [heat, setHeat]       = useState(HEAT_START);
  const [inRow, setInRow]     = useState(0);
  const recordedRef           = useRef(false);
  // H5: slow-network escalation for the drill fetch (~8s) + user cancel.
  const [slowDrill, setSlowDrill] = useState(false);
  const drillAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const aborter = new AbortController();
    drillAbortRef.current = aborter;
    // H5: staged loading — after ~8s say so and offer Cancel.
    const slowTimer = window.setTimeout(() => { if (!cancelled) setSlowDrill(true); }, 8000);
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res  = await fetchWithTimeout(`/api/drills/${topicId}`, { signal: aborter.signal }, FETCH_TIMEOUTS.drill);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(body.error || "Could not load this drill."); return; }
        setData(body);
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
  }, [topicId]);

  const currentQ = order[qIndex];
  const score = answers.filter(Boolean).length;
  const drillFlame = completionFlame(score, order.length);

  const selectAnswer = (i: number) => {
    if (selected !== null || !currentQ) return;
    setSelected(i);
    const correct = i === currentQ.correctIndex;
    setAnswers(a => [...a, correct]);
    const next = applyAnswer(heat, inRow, correct);
    setHeat(next.heat);
    setInRow(next.inRow);
  };

  const finish = (finalAnswers: boolean[]) => {
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

  const restart = () => {
    setOrder(shuffled(order));
    setQIndex(0);
    setSelected(null);
    setAnswers([]);
    setDone(false);
    setHeat(HEAT_START);
    setInRow(0);
    recordedRef.current = false;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${T.s3}`, borderTopColor: "#F97316", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: T.sub }}>Preparing your drill… the first drill on a topic can take a few seconds.</div>
          {slowDrill && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>Still loading — this can take a few seconds on a slow connection.</div>
              <button onClick={() => { drillAbortRef.current?.abort(); router.back(); }} style={{ padding: "10px 20px", borderRadius: R.pill, border: `1px solid ${T.border}`, background: T.s2, color: T.text, fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 44, fontFamily: "inherit" }}>Cancel</button>
            </div>
          )}
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="drill-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px", textAlign: "center" }}>
          <p style={{ color: T.sub, fontSize: 14, marginBottom: 16 }}>{error || "Something went wrong loading this drill."}</p>
          <button onClick={() => router.back()} style={{ padding: "10px 20px", borderRadius: R.pill, border: "none", background: T.primary, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="drill-page-pad" style={{ minHeight: "100vh", background: T.bg, paddingTop: NAVBAR_HEIGHT, fontFamily: "var(--font)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px" }}>
        <button onClick={() => router.back()} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12, padding: 0, minHeight: 44,
        }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {data.subject} · Quick Drill
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "2px 0 0" }}>{data.topicName}</h1>
        </div>

        {order.length === 0 && (
          <div style={{ background: T.surface, borderRadius: R.xxl, padding: "18px", border: `1px solid ${T.border}`, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: T.sub, marginBottom: 16, lineHeight: 1.6 }}>
              No drill questions for this topic yet — drills are built from past questions and a fresh practice set, separate from the lesson's own check.
            </p>
            <Link href={`/lessons/${data.topicId}`} style={{ display: "inline-block", padding: "12px 22px", borderRadius: R.pill, background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Open the lesson
            </Link>
          </div>
        )}

        {order.length > 0 && !done && currentQ && (
          <div style={{ background: T.surface, borderRadius: R.xxl, padding: "18px", border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>
                Question {qIndex + 1} of {order.length}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>
                Score {score}/{answers.length}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Flame stage={readFlameStage()} heat={heat} mood={heat >= 75 ? "celebrating" : heat < 25 ? "sleepy" : "happy"} size={44} />
              <div style={{ flex: 1 }}>
                <FlameHeatMeter heat={heat} />
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: T.s3, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ height: "100%", width: `${Math.round(((qIndex) / order.length) * 100)}%`, background: T.accent, transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14 }}>{currentQ.question}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                    fontSize: 14, fontWeight: 600, cursor: selected === null ? "pointer" : "default",
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
                <p style={{ fontSize: 13, color: T.sub, marginTop: 12, lineHeight: 1.6 }}>{currentQ.explanation}</p>
                <button onClick={nextQuestion} style={{
                  width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
                  background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 14, minHeight: 48,
                }}>
                  {qIndex + 1 < order.length ? "Next question" : "Finish drill"}
                </button>
              </>
            )}
          </div>
        )}

        {done && (
          <div style={{ background: T.surface, borderRadius: R.xxl, padding: "18px", border: `1px solid ${T.border}`, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <Flame stage={readFlameStage()} heat={heat} mood={drillFlame.mood} speech={drillFlame.speech} size={88} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 4 }}>Drill complete</h2>
            <p style={{ fontSize: 14, color: T.sub, marginBottom: 18 }}>
              You scored {score}/{order.length} on {data.topicName}.
            </p>
            <button onClick={restart} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
              padding: "13px", borderRadius: R.pill, border: "none", background: T.accent, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10, minHeight: 48, fontFamily: "inherit",
            }}>
              <RotateCcw size={15} /> Drill again
            </button>
            <Link href="/drill" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "13px", borderRadius: R.pill, background: T.s2, color: T.text,
              fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 10, minHeight: 48,
            }}>
              <LayoutGrid size={15} /> Pick another topic
            </Link>
            <Link href={`/lessons/${data.topicId}`} style={{ fontSize: 13, color: T.sub, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <BookOpen size={14} /> Back to the lesson
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
