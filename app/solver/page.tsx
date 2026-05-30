"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Progress } from "../lib/progress";
import { PenTool, Dices, Lightbulb, Clock, ChevronDown } from "lucide-react";
import { palette } from "../lib/design";

const SUBJECTS = [
  "English Language","Mathematics","Physics","Chemistry","Biology",
  "Government","Economics","Literature in English","Geography","CRS","Commerce",
];
const YEARS = ["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015"];

interface HistoryItem { q: string; a: string; subject: string; }

function SolverContent() {
  const params   = useSearchParams();
  const [dark,   setDark]    = useState(false);
  const [mode,   setMode]    = useState<"type"|"generate">("type");
  const [subject,setSubject] = useState(params.get("subject") || "");
  const [year,   setYear]    = useState("");
  const [q,      setQ]       = useState(params.get("question") || "");
  const [answer, setAnswer]  = useState("");
  const [loading,setLoading] = useState(false);
  const [history,setHistory] = useState<HistoryItem[]>([]);
  const [mounted,setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(localStorage.getItem("darkMode") === "true");
    try {
      const saved = localStorage.getItem("solver_history");
      if (saved) setHistory(JSON.parse(saved).slice(0, 5));
    } catch {}
  }, []);

  if (!mounted) return null;

  const T = palette(dark);

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: `1.5px solid ${T.border}`, fontSize: "14px", outline: "none",
    background: T.s2, color: T.text, boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  const solve = async () => {
    if (!q.trim()) return;
    setLoading(true); setAnswer("");
    const prompt = `You are an expert JAMB examiner helping a Nigerian student.
${subject ? `Subject: ${subject}` : ""}${year ? ` | Year: ${year}` : ""}

QUESTION: ${q}

Answer in this exact format:

**✅ Correct Answer:** [state it clearly]

**📖 Explanation:**
[explain WHY in simple terms]

**❌ Why other options are wrong:**
[for each wrong option, one line]

**💡 Key Concept:**
[the JAMB topic this tests + a memory tip]

**📝 Try this next:**
[one similar practice question]`;

    try {
      const res  = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const reply = data.reply || "Could not solve. Please try again.";
      setAnswer(reply);
      // Record to progress tracker
      Progress.recordActivity("practice", { subject: subject || "General" });
      // Save to history
      const h: HistoryItem[] = [{ q, a: reply, subject: subject || "General" }, ...history].slice(0, 5);
      setHistory(h);
      localStorage.setItem("solver_history", JSON.stringify(h));
    } catch {
      setAnswer("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    if (!subject) return;
    setLoading(true); setQ(""); setAnswer("");
    const prompt = `Generate one realistic JAMB ${subject} past question${year ? ` in the style of ${year}` : ""}.

Format exactly like this:
QUESTION: [full question with options A, B, C, D on separate lines]
ANSWER: [correct option letter + full explanation]
TOPIC: [JAMB syllabus topic this tests]`;

    try {
      const res  = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      setAnswer(data.reply || "Could not generate. Please try again.");
      Progress.recordActivity("practice", { subject });
    } catch {
      setAnswer("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1877F2,#0C5FD1)", padding: "20px 20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <Link href="/" style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, textDecoration: "none" }}>←</Link>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Question Solver</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>AI explains every answer in detail</div>
          </div>
        </div>
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 4 }}>
          {(["type", "generate"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setAnswer(""); setQ(""); }} style={{
              flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13,
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#1877F2" : "rgba(255,255,255,0.75)",
              transition: "all 0.2s",
            }}>
              {m === "type" ? <><PenTool size={13} strokeWidth={2}/> Type Question</> : <><Dices size={13} strokeWidth={2}/> Generate Question</>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 14px", paddingBottom: 80 }}>

        {/* Input card */}
        <div style={{ background: T.surface, borderRadius: 16, padding: 18, border: `1px solid ${T.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>Subject</label>
              <select style={inp} value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Any subject</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>Year</label>
              <select style={inp} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Any year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {mode === "type" ? (
            <>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>
                Paste your question here
              </label>
              <textarea
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Type or paste a JAMB question here, including all options A, B, C, D…"
                style={{ ...inp, minHeight: 110, resize: "vertical", lineHeight: 1.55 }}
              />
              <button
                onClick={solve}
                disabled={loading || !q.trim()}
                style={{
                  width: "100%", marginTop: 12, padding: 13, borderRadius: 10,
                  border: "none",
                  background: loading || !q.trim() ? T.s3 : "linear-gradient(135deg,#1877F2,#0C5FD1)",
                  color: loading || !q.trim() ? T.muted : "#fff",
                  fontWeight: 700, fontSize: 14,
                  cursor: loading || !q.trim() ? "not-allowed" : "pointer",
                  boxShadow: !loading && q.trim() ? "0 4px 12px rgba(24,119,242,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Solving…" : "Solve This Question →"}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: T.sub, margin: "0 0 12px", lineHeight: 1.55 }}>
                Select a subject above and let AI generate a realistic JAMB question for you to practise.
              </p>
              <button
                onClick={generate}
                disabled={loading || !subject}
                style={{
                  width: "100%", padding: 13, borderRadius: 10, border: "none",
                  background: loading || !subject ? T.s3 : "linear-gradient(135deg,#1877F2,#0C5FD1)",
                  color: loading || !subject ? T.muted : "#fff",
                  fontWeight: 700, fontSize: 14,
                  cursor: loading || !subject ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Generating…" : "Generate Question"}
              </button>
              {!subject && (
                <p style={{ fontSize: 12, color: "#FA3E3E", marginTop: 8, textAlign: "center" }}>
                  Select a subject first
                </p>
              )}
            </>
          )}
        </div>

        {/* Answer card */}
        {(loading || answer) && (
          <div style={{ background: T.surface, borderRadius: 16, padding: 18, border: `1px solid ${T.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1877F2,#42A5F5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Lightbulb size={18} color="#fff" strokeWidth={1.8} /></div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>AI Explanation</div>
            </div>
            {loading ? (
              <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#1877F2", animation: "typingDot 1.2s infinite", animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.75 }}>
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && !answer && !loading && (
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "1px" }}>
              Recent Questions
            </div>
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => { setQ(h.q); setAnswer(h.a); setMode("type"); setSubject(h.subject); }}
                style={{
                  width: "100%", textAlign: "left", padding: "12px 16px",
                  border: "none", borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : "none",
                  background: "transparent", cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 11, color: "#1877F2", fontWeight: 600, marginBottom: 3 }}>{h.subject}</div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.q}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes typingDot { 0%,60%,100%{opacity:.3;transform:scale(.8)} 30%{opacity:1;transform:scale(1.2)} }
      `}</style>
    </div>
  );
}

export default function Solver() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F0F2F5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial", color: "#65676B" }}>
        Loading…
      </div>
    }>
      <SolverContent />
    </Suspense>
  );
}
