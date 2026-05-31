"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Lightbulb, Clock, BookOpen, ChevronRight } from "lucide-react";
import { Progress } from "../lib/progress";
import { palette } from "../lib/design";

const SUBJECTS = [
  "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
  "Government", "Economics", "Literature in English", "Geography", "CRS", "Commerce",
];
const YEARS = ["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015"];

interface HistoryItem { q: string; a: string; subject: string; year: string; }

function SolverContent() {
  const params = useSearchParams();

  const [dark,    setDark]    = useState(false);
  const [subject, setSubject] = useState(params.get("subject") || "");
  const [year,    setYear]    = useState("");
  const [q,       setQ]       = useState(params.get("question") || "");
  const [answer,  setAnswer]  = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(localStorage.getItem("darkMode") === "true");
    try {
      const saved = localStorage.getItem("solver_history");
      if (saved) setHistory(JSON.parse(saved).slice(0, 6));
    } catch {}
  }, []);

  if (!mounted) return null;

  const T = palette(dark);

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: `1.5px solid ${T.border}`, fontSize: "14px", outline: "none",
    background: T.s2, color: T.text, boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s",
  };

  const solve = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setAnswer("");

    const prompt = `You are an expert JAMB examiner helping a Nigerian student understand a past question.
${subject ? `Subject: ${subject}` : ""}${year ? ` | Exam Year: ${year}` : ""}

QUESTION:
${q}

Give a thorough explanation using this exact format:

**✅ Correct Answer:** [state clearly]

**📖 Step-by-step Explanation:**
[break it down simply — like a teacher explaining to a student]

**❌ Why the other options are wrong:**
[one line per wrong option]

**💡 Key Concept to Remember:**
[the JAMB topic this tests + a short memory tip]`;

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const reply = data.reply || "Could not solve this question. Please try again.";
      setAnswer(reply);

      // Record activity + save history
      Progress.recordActivity("practice", { subject: subject || "General" });
      const h: HistoryItem[] = [
        { q, a: reply, subject: subject || "General", year },
        ...history,
      ].slice(0, 6);
      setHistory(h);
      localStorage.setItem("solver_history", JSON.stringify(h));
    } catch {
      setAnswer("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setQ(item.q);
    setAnswer(item.a);
    setSubject(item.subject);
    setYear(item.year);
  };

  const clearAll = () => {
    setQ("");
    setAnswer("");
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1877F2,#0C5FD1)", padding: "20px 20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={16} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Question Solver</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              Paste any JAMB past question — AI explains it in full
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 14px", paddingBottom: 80 }}>

        {/* Input card */}
        <div style={{ background: T.surface, borderRadius: 16, padding: 18, border: `1px solid ${T.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

          {/* Subject + Year row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>
                Subject <span style={{ color: T.muted, fontWeight: 400 }}>(optional)</span>
              </label>
              <select style={inp} value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Any</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>
                Year <span style={{ color: T.muted, fontWeight: 400 }}>(optional)</span>
              </label>
              <select style={inp} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Any</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Question textarea */}
          <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>
            Paste your question here
          </label>
          <textarea
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={"Type or paste a JAMB past question here.\nInclude all options A, B, C, D if it's multiple choice…"}
            style={{ ...inp, minHeight: 120, resize: "vertical", lineHeight: 1.6 }}
          />

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {(q || answer) && (
              <button
                onClick={clearAll}
                style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "transparent", color: T.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Clear
              </button>
            )}
            <button
              onClick={solve}
              disabled={loading || !q.trim()}
              style={{
                flex: 1, padding: 13, borderRadius: 10, border: "none",
                background: loading || !q.trim()
                  ? T.s3
                  : "linear-gradient(135deg,#1877F2,#0C5FD1)",
                color: loading || !q.trim() ? T.muted : "#fff",
                fontWeight: 700, fontSize: 14,
                cursor: loading || !q.trim() ? "not-allowed" : "pointer",
                boxShadow: !loading && q.trim() ? "0 4px 12px rgba(24,119,242,0.35)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              <Lightbulb size={16} strokeWidth={2} />
              {loading ? "Solving…" : "Solve This Question"}
            </button>
          </div>
        </div>

        {/* AI Answer */}
        {(loading || answer) && (
          <div style={{ background: T.surface, borderRadius: 16, padding: 18, border: `1px solid ${T.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1877F2,#42A5F5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Lightbulb size={18} color="#fff" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>AI Explanation</div>
                {subject && (
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>
                    {subject}{year ? ` · ${year}` : ""}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 0" }}>
                {[0,1,2].map(i => (
                  <div
                    key={i}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: "#1877F2", animation: "dot 1.2s infinite", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
                <span style={{ fontSize: 13, color: T.sub, marginLeft: 6 }}>Thinking…</span>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.8 }}>
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && !answer && !loading && (
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={14} color={T.sub} strokeWidth={1.8} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Recent Questions
              </span>
            </div>
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => loadFromHistory(h)}
                style={{ width: "100%", textAlign: "left", padding: "13px 16px", border: "none", borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#E7F0FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={15} color="#1877F2" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#1877F2", fontWeight: 600, marginBottom: 2 }}>
                    {h.subject}{h.year ? ` · ${h.year}` : ""}
                  </div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.q}
                  </div>
                </div>
                <ChevronRight size={14} color={T.muted} strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dot {
          0%,60%,100% { opacity: 0.3; transform: scale(0.8); }
          30%          { opacity: 1;   transform: scale(1.2); }
        }
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
