"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, Lightbulb, Clock, BookOpen,
  ChevronRight, Trash2, Trash, X, RotateCcw,
} from "lucide-react";
import { Progress } from "../lib/progress";
import { palette } from "../lib/design";

const SUBJECTS = [
  "English Language","Mathematics","Physics","Chemistry","Biology",
  "Government","Economics","Literature in English","Geography","CRS","Commerce",
];
const YEARS = ["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015"];

const LS_KEY = "solver_history_v2";
const MAX_HISTORY = 20;

interface HistoryItem {
  id:      string;
  q:       string;
  a:       string;
  subject: string;
  year:    string;
  ts:      number;
}

// ── Silent background ingest — never awaited, never shown to user ─────────────
function silentIngest(text: string, subject: string) {
  if (!text.trim() || text.length < 25) return;
  fetch("/api/qbank/ingest", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text, subject, source: "solver" }),
  }).catch(() => {}); // completely silent — errors ignored
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(items: HistoryItem[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_HISTORY))); }
  catch {}
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m    = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main component ────────────────────────────────────────────────────────────
function SolverContent() {
  const params = useSearchParams();

  const [dark,     setDark]     = useState(false);
  const [subject,  setSubject]  = useState(params.get("subject") || "");
  const [year,     setYear]     = useState("");
  const [q,        setQ]        = useState(params.get("question") || "");
  const [answer,   setAnswer]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [history,  setHistory]  = useState<HistoryItem[]>([]);
  const [mounted,  setMounted]  = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [undo,     setUndo]     = useState<{ items: HistoryItem[]; label: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    setDark(localStorage.getItem("darkMode") === "true");
    setHistory(loadHistory());
  }, []);

  if (!mounted) return null;

  const T = palette(dark);

  // ── Deletion helpers ────────────────────────────────────────────────────────

  const startUndo = (prev: HistoryItem[], label: string) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo({ items: prev, label });
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };

  const doUndo = () => {
    if (!undo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setHistory(undo.items);
    saveHistory(undo.items);
    setUndo(null);
    setSelected(new Set());
  };

  const deleteOne = (id: string) => {
    const prev = [...history];
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    saveHistory(next);
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    startUndo(prev, "1 question deleted");
  };

  const deleteSelected = () => {
    if (!selected.size) return;
    const prev  = [...history];
    const count = selected.size;
    const next  = history.filter(h => !selected.has(h.id));
    setHistory(next);
    saveHistory(next);
    setSelected(new Set());
    startUndo(prev, `${count} question${count > 1 ? "s" : ""} deleted`);
  };

  const clearAll = () => {
    const prev = [...history];
    setHistory([]);
    saveHistory([]);
    setSelected(new Set());
    startUndo(prev, "All history cleared");
  };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const isSelecting = selected.size > 0;

  // ── Solve ───────────────────────────────────────────────────────────────────

  const solve = async () => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer("");

    const prompt = `You are an expert JAMB examiner helping a Nigerian student.
${subject ? `Subject: ${subject}` : ""}${year ? ` | Year: ${year}` : ""}

QUESTION:
${q}

**✅ Correct Answer:** [state clearly]

**📖 Step-by-step Explanation:**
[simple clear breakdown]

**❌ Why other options are wrong:**
[one line per wrong option]

**💡 Key Concept:**
[JAMB topic + memory tip]`;

    try {
      const res   = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ message: prompt }),
      });
      const data  = await res.json();
      const reply = data.reply || "Could not solve. Please try again.";
      setAnswer(reply);

      // Record progress
      Progress.recordActivity("practice", { subject: subject || "General" });

      // Save to local history
      const item: HistoryItem = {
        id: makeId(), q, a: reply,
        subject: subject || "General",
        year, ts: Date.now(),
      };
      const next = [item, ...history].slice(0, MAX_HISTORY);
      setHistory(next);
      saveHistory(next);

      // Silent background ingest — fire and forget, user never knows
      silentIngest(q, subject || "General");

    } catch {
      setAnswer("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ───────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: `1.5px solid ${T.border}`, fontSize: "14px", outline: "none",
    background: T.s2, color: T.text, boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s",
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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
              Paste any past question — AI explains it fully
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 14px", paddingBottom: 80 }}>

        {/* Input card */}
        <div style={{ background: T.surface, borderRadius: 16, padding: 18, border: `1px solid ${T.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>
                Subject <span style={{ fontWeight: 400, color: T.muted }}>(optional)</span>
              </label>
              <select style={inp} value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Any</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>
                Year <span style={{ fontWeight: 400, color: T.muted }}>(optional)</span>
              </label>
              <select style={inp} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Any</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: "block", marginBottom: 5 }}>
            Paste your question here
          </label>
          <textarea
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={"Type or paste a JAMB past question.\nInclude all options A, B, C, D if multiple choice…"}
            style={{ ...inp, minHeight: 120, resize: "vertical", lineHeight: 1.6 }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {(q || answer) && (
              <button
                onClick={() => { setQ(""); setAnswer(""); }}
                style={{ padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "transparent", color: T.sub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Clear
              </button>
            )}
            <button
              onClick={solve}
              disabled={loading || !q.trim()}
              style={{
                flex: 1, padding: 13, borderRadius: 10, border: "none",
                background: loading || !q.trim() ? T.s3 : "linear-gradient(135deg,#1877F2,#0C5FD1)",
                color: loading || !q.trim() ? T.muted : "#fff",
                fontWeight: 700, fontSize: 14,
                cursor: loading || !q.trim() ? "not-allowed" : "pointer",
                boxShadow: !loading && q.trim() ? "0 4px 12px rgba(24,119,242,0.3)" : "none",
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
                {subject && <div style={{ fontSize: 11, color: T.sub }}>{subject}{year ? ` · ${year}` : ""}</div>}
              </div>
            </div>

            {loading ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#1877F2", animation: "dot 1.2s infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
                <span style={{ fontSize: 13, color: T.sub, marginLeft: 4 }}>Thinking…</span>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.8 }}>
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

            {/* History header */}
            <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={14} color={T.sub} strokeWidth={1.8} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.8px", flex: 1 }}>
                Recent Questions
              </span>

              {/* Bulk actions */}
              {isSelecting ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.sub }}>{selected.size} selected</span>
                  <button
                    onClick={deleteSelected}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", background: "#FEE2E2", color: "#D0021B", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                  >
                    <Trash2 size={12} strokeWidth={2} /> Delete
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: T.s2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={13} color={T.sub} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={clearAll}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", background: T.s2, color: T.sub, fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                >
                  <Trash size={12} strokeWidth={1.8} /> Clear all
                </button>
              )}
            </div>

            {/* History items */}
            {history.map((h, i) => {
              const isSel = selected.has(h.id);
              return (
                <div
                  key={h.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px",
                    borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : "none",
                    background: isSel ? (dark ? "#1A2A4A" : "#EBF3FF") : "transparent",
                    transition: "background 0.1s",
                  }}
                >
                  {/* Select checkbox area */}
                  <div
                    onClick={() => toggleSelect(h.id)}
                    style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${isSel ? "#1877F2" : T.border}`, background: isSel ? "#1877F2" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                  >
                    {isSel && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                  </div>

                  {/* Icon */}
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: dark ? T.s2 : "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookOpen size={14} color="#1877F2" strokeWidth={1.8} />
                  </div>

                  {/* Content — tap to load */}
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                    onClick={() => { setQ(h.q); setAnswer(h.a); setSubject(h.subject); setYear(h.year); }}
                  >
                    <div style={{ fontSize: 11, color: "#1877F2", fontWeight: 600, marginBottom: 2 }}>
                      {h.subject}{h.year ? ` · ${h.year}` : ""} · {relativeTime(h.ts)}
                    </div>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.q}
                    </div>
                  </div>

                  {/* Delete single */}
                  <button
                    onClick={() => deleteOne(h.id)}
                    style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <Trash2 size={14} color={T.muted} strokeWidth={1.8} />
                  </button>

                  <div
                    onClick={() => { setQ(h.q); setAnswer(h.a); setSubject(h.subject); setYear(h.year); }}
                    style={{ cursor: "pointer", flexShrink: 0 }}
                  >
                    <ChevronRight size={14} color={T.muted} strokeWidth={2} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && !answer && !loading && (
          <div style={{ background: T.surface, borderRadius: 16, padding: "32px 24px", textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <BookOpen size={24} color="#1877F2" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>No questions yet</div>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
              Paste a JAMB past question above and AI will explain the answer in full detail.
            </div>
          </div>
        )}
      </div>

      {/* Undo toast */}
      {undo && (
        <div style={{
          position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 500,
          background: dark ? "#1c1c1e" : "#050505",
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          animation: "slideUp 0.2s ease",
        }}>
          <span style={{ flex: 1, fontSize: 13, color: "#fff", fontWeight: 500 }}>{undo.label}</span>
          <button
            onClick={doUndo}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "none", background: "#1877F2", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            <RotateCcw size={13} strokeWidth={2} /> Undo
          </button>
          <button
            onClick={() => { if (undoTimer.current) clearTimeout(undoTimer.current); setUndo(null); }}
            style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={14} color="rgba(255,255,255,0.6)" strokeWidth={2} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes dot     { 0%,60%,100%{opacity:.3;transform:scale(.8)} 30%{opacity:1;transform:scale(1.2)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default function Solver() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh",background:"#F0F2F5",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Arial",color:"#65676B" }}>
        Loading…
      </div>
    }>
      <SolverContent />
    </Suspense>
  );
}
