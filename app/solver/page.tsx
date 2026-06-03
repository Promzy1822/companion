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
import Layout from "../components/Layout";

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

  if (!mounted) return null;

  return (
    <Layout title="Question Solver" darkMode={dark} onToggleDark={() => { const n=!dark; setDark(n); localStorage.setItem("darkMode",String(n)); }} showNavbar showBottomNav contentWidth="standard">
      {/* Page content */}
      <div className="flex-1 w-full overflow-y-auto p-6 pt-10 pb-6"
           style={{ paddingTop: "80px", paddingBottom: "20px" }}>

        {/* Input card */}
        <div className="bg-surface rounded-lg border border-surface2/20 p-4 mb-4">
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Subject <span className="text-xs text-muted">(optional)</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              >
                <option value="">Any</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Year <span className="text-xs text-muted">(optional)</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                <option value="">Any</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <label className="block text-sm font-medium text-muted mb-1">
            Paste your question here
          </label>
          <textarea
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Type or paste a JAMB past question.\nInclude all options A, B, C, D if multiple choice…"
            className="w-full px-3 py-2 rounded border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            minHeight={120}
          />

          <div className="flex items-center gap-3 mt-3">
            {(q || answer) && (
              <button
                onClick={() => { setQ(""); setAnswer(""); }}
                className="px-3 py-2 rounded border border-border/20 text-muted hover:bg-surface2/50 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={solve}
              disabled={loading || !q.trim()}
              className={`w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors
                ${loading || !q.trim() ? 'bg-surface2 text-muted cursor-not-allowed' : ''}`}
            >
              {loading ? "Solving…" : "Solve This Question"}
            </button>
          </div>
        </div>

        {/* AI Answer */}
        {(loading || answer) && (
          <div className="bg-surface rounded-lg border border-surface2/20 p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Lightbulb size={16} color="#fff" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-medium">AI Explanation</h3>
                {subject && <p className="text-sm text-muted">{subject}{year ? ` · ${year}` : ""}</p>}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                           style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
                <span className="text-sm text-muted ml-1">Thinking…</span>
              </div>
            ) : (
              <div className="prose">{answer}</div>
            )}
          </div>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <div className="bg-surface rounded-lg border border-surface2/20 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} color={dark ? '#E4E6EB' : '#050505'} strokeWidth={1.8} />
                <span className="font-medium text-left">Recent Questions</span>
              </div>
              {isSelecting ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">{selected.size} selected</span>
                  <button
                    onClick={deleteSelected}
                    className="px-2 py-1 rounded bg-danger/10 text-danger text-sm hover:bg-danger/20 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="w-6 h-6 rounded bg-surface2/50 flex items-center justify-center hover:bg-surface2/100 transition-colors"
                  >
                    <X size={14} color={dark ? '#E4E6EB' : '#050505'} strokeWidth={1.8} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={clearAll}
                  className="text-sm text-muted hover:text-primary transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* History items */}
            <div className="space-y-2">
              {history.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-surface2/20
                    ${isSelecting && selected.has(h.id) ? 'bg-primary/10' : 'transparent'}
                    hover:bg-surface2/50 transition-colors cursor-pointer`}
                  onClick={() => { setQ(h.q); setAnswer(h.a); setSubject(h.subject); setYear(h.year); }}
                >
                  {/* Select checkbox area */}
                  {isSelecting && (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selected.has(h.id)}
                        onChange={() => toggleSelect(h.id)}
                        className="form-checkbox h-4 w-4 text-primary"
                      />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="w-8 h-8 flex items-center justify-center bg-surface2/50 rounded">
                    <BookOpen size={14} color="#1877F2" strokeWidth={1.8} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{h.subject}{h.year ? ` · ${h.year}` : ""}</span>
                      <span className="text-xs text-muted">{relativeTime(h.ts)}</span>
                    </div>
                    <p className="line-clamp-2 text-sm">{h.q}</p>
                  </div>

                  {/* Delete single */}
                  <button
                    onClick={() => deleteOne(h.id)}
                    className="w-8 h-8 flex items-center justify-center text-muted hover:bg-danger/10 rounded transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && !answer && !loading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-lg bg-surface2/50 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} color="#1877F2" strokeWidth={1.8} />
            </div>
            <h3 className="font-semibold mb-2">No questions yet</h3>
            <p className="text-muted">
              Paste a JAMB past question above and AI will explain the answer in full detail.
            </p>
          </div>
        )}

        {/* Undo toast */}
        {undo && (
          <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
            <div className="flex items-center gap-3 bg-surface/90 backdrop-blur-sm rounded-lg border border-surface2/20 p-4 shadow-lg">
              <span className="flex-1 text-sm">{undo.label}</span>
              <button
                onClick={doUndo}
                className="px-3 py-1 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RotateCcw size={14} strokeWidth={1.8} /> Undo
              </button>
              <button
                onClick={() => { if (undoTimer.current) clearTimeout(undoTimer.current); setUndo(null); }}
                className="w-8 h-8 flex items-center justify-center text-muted hover:bg-surface2/50 rounded"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function Solver() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100vh] items-center justify-center bg-surface text-muted">
        Loading…
      </div>
    }>
      <SolverContent />
    </Suspense>
  );
}