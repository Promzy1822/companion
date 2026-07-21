"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import Navbar, { NAVBAR_HEIGHT } from "../../components/Navbar";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../../components/BottomNav";
import { C, palette, R, S } from "../../lib/design";
import { Progress } from "../../lib/progress";

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
  summary: string;
  exercises: Exercise[];
}

export default function LessonPage({ params }: { params: { topicId: string } }) {
  const { topicId } = params;
  const router = useRouter();

  const [dark, setDark]       = useState(false);
  const [ready, setReady]     = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [data, setData]       = useState<LessonData | null>(null);

  const [stage, setStage]       = useState<"video" | "summary" | "quiz" | "done">("video");
  const [qIndex, setQIndex]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers]   = useState<boolean[]>([]);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
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
        setStage(body.videoId ? "video" : "summary");
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ready, topicId]);

  if (!ready || loading) {
    return <div style={{ minHeight: "100vh", background: "#F0F2F5" }} />;
  }

  const T = palette(dark);

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, paddingTop: `${NAVBAR_HEIGHT}px`, paddingBottom: `${BOTTOM_NAV_HEIGHT + 20}px`, fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
        <Navbar darkMode={dark} />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px", textAlign: "center" }}>
          <p style={{ color: T.sub, fontSize: 14, marginBottom: 16 }}>
            {error || "Something went wrong loading this lesson."}
          </p>
          <button onClick={() => router.back()} style={{
            padding: "10px 20px", borderRadius: R.pill, border: "none",
            background: C.primary, color: "#fff", fontWeight: 700, cursor: "pointer",
          }}>Go back</button>
        </div>
        <BottomNav darkMode={dark} />
      </div>
    );
  }

  const exercises = data.exercises || [];
  const currentQ  = exercises[qIndex];
  const score     = answers.filter(Boolean).length;

  const selectAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setAnswers(a => [...a, i === currentQ.correctIndex]);
  };

  const nextQuestion = () => {
    if (qIndex + 1 < exercises.length) {
      setQIndex(q => q + 1);
      setSelected(null);
    } else {
      Progress.recordActivity("lesson", {
        topicId: data.topicId,
        subject: data.subject,
        correct: answers.filter(Boolean).length,
        total: exercises.length,
      });
      setStage("done");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingTop: `${NAVBAR_HEIGHT}px`, paddingBottom: `${BOTTOM_NAV_HEIGHT + 20}px`, fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar darkMode={dark} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>

        <button onClick={() => router.back()} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12, padding: 0,
        }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {data.subject}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "2px 0 0" }}>
            {data.topicName}
          </h1>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["video", "summary", "quiz"] as const).map(s => {
            const stageOrder = ["video", "summary", "quiz", "done"];
            const filled = stageOrder.indexOf(stage) >= stageOrder.indexOf(s);
            return (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: filled ? C.accent : T.s3 }} />
            );
          })}
        </div>

        {stage === "video" && (
          <div style={{ background: T.surface, borderRadius: R.xl2, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14 }}>
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
                <p style={{ color: T.sub, fontSize: 13, marginTop: 8 }}>Video coming soon for this topic</p>
              </div>
            )}
            <button onClick={() => setStage("summary")} style={{
              width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
              background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Continue to summary →</button>
          </div>
        )}

        {stage === "summary" && (
          <div style={{ background: T.surface, borderRadius: R.xl2, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 10 }}>Key points</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T.text, whiteSpace: "pre-wrap" }}>
              {data.summary}
            </p>
            <button onClick={() => setStage("quiz")} style={{
              width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
              background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 16,
            }}>
              {exercises.length > 0 ? `Start exercises (${exercises.length}) →` : "Finish lesson →"}
            </button>
          </div>
        )}

        {stage === "quiz" && currentQ && (
          <div style={{ background: T.surface, borderRadius: R.xl2, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 8 }}>
              Question {qIndex + 1} of {exercises.length}
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14 }}>
              {currentQ.question}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentQ.options.map((opt, i) => {
                const isCorrect = i === currentQ.correctIndex;
                const isChosen  = i === selected;
                let bg = T.s2, border = T.border, color = T.text;
                if (selected !== null) {
                  if (isCorrect)     { bg = C.successLight; border = C.success; color = C.success; }
                  else if (isChosen) { bg = C.dangerLight;  border = C.danger;  color = C.danger;  }
                }
                return (
                  <button key={i} onClick={() => selectAnswer(i)} disabled={selected !== null} style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: R.lg,
                    border: `1.5px solid ${border}`, background: bg, color,
                    fontSize: 14, fontWeight: 600, cursor: selected === null ? "pointer" : "default",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    {opt}
                    {selected !== null && isCorrect && <CheckCircle2 size={16} color={C.success} />}
                    {selected !== null && isChosen && !isCorrect && <XCircle size={16} color={C.danger} />}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <>
                <p style={{ fontSize: 13, color: T.sub, marginTop: 12, lineHeight: 1.6 }}>
                  {currentQ.explanation}
                </p>
                <button onClick={nextQuestion} style={{
                  width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
                  background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 14,
                }}>
                  {qIndex + 1 < exercises.length ? "Next question →" : "Finish lesson →"}
                </button>
              </>
            )}
          </div>
        )}

        {stage === "done" && (
          <div style={{ background: T.surface, borderRadius: R.xl2, padding: "18px", border: `1px solid ${T.border}`, boxShadow: S.sm, marginBottom: 14, textAlign: "center" }}>
            <CheckCircle2 size={40} color={C.success} style={{ marginBottom: 10 }} />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 4 }}>Lesson complete!</h2>
            {exercises.length > 0 && (
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 18 }}>
                You scored {score}/{exercises.length} on the exercises.
              </p>
            )}
            <Link href={`/learn/${data.subjectKey}`} style={{
              display: "block", padding: "13px", borderRadius: R.pill,
              background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14,
              textDecoration: "none", marginBottom: 10,
            }}>
              Back to {data.subject} topics
            </Link>
            <Link href="/" style={{ fontSize: 13, color: T.sub, fontWeight: 600, textDecoration: "none" }}>
              Return home
            </Link>
          </div>
        )}
      </div>
      <BottomNav darkMode={dark} />
    </div>
  );
}
