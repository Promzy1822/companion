"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, RotateCcw,
  Languages, Sigma, Atom, FlaskConical, Dna, Landmark, TrendingUp, BookOpen,
  Bot, Inbox, ClipboardList, Map, X,
  type LucideIcon,
} from "lucide-react";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavView";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { palette } from "../lib/design";
import { Flame } from "../components/Flame";
import { applyAnswer, completionFlame, readFlameStage, HEAT_START } from "../lib/flame";

import { useDark } from "../lib/theme";
interface Question {
  id:          string;
  subject:     string;
  year:        number;
  num:         number;
  question:    string;
  options:     { A: string; B: string; C: string; D: string };
  answer:      string | null;
  has_diagram: boolean;
  image?: string | null;
}

const SUBJECTS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "english",    label: "English",    Icon: Languages },
  { key: "mathematics", label: "Mathematics", Icon: Sigma },
  { key: "physics",    label: "Physics",    Icon: Atom },
  { key: "chemistry",  label: "Chemistry",  Icon: FlaskConical },
  { key: "biology",    label: "Biology",    Icon: Dna },
  { key: "government", label: "Government", Icon: Landmark },
  { key: "economics",  label: "Economics",  Icon: TrendingUp },
  { key: "literature", label: "Literature", Icon: BookOpen },
];

const YEARS = ["All","2010","2011","2012","2013","2014","2015","2016","2017","2018"];
const CHEM_YEARS = ["All","1986","1987","1988","1989","1990","1991","1992","1993","1994","1995","1997","1998","1999","2000","2001","2002","2003","2004"];
const yearsFor = (subj: string) => (subj === "chemistry" ? CHEM_YEARS : YEARS);

/** Signup stores display names; these pages route on keys. */
const DISPLAY_TO_KEY: Record<string, string> = {
  "English Language": "english",
  "Mathematics": "mathematics",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Government": "government",
  "Economics": "economics",
  "Literature in English": "literature",
};

function QuestionsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initSubject  = searchParams.get("subject") || "biology";
  const [myKeys] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const u = JSON.parse(localStorage.getItem("companion_user") || "{}");
      const subs: string[] = u.subjects || [];
      return subs.map(s => DISPLAY_TO_KEY[s]).filter(Boolean);
    } catch { return []; }
  });
  const visibleSubjects = myKeys.length ? SUBJECTS.filter(s => myKeys.includes(s.key)) : SUBJECTS;

  const dark = useDark();
  const [subject,   setSubject]   = useState(() => (myKeys.length && !myKeys.includes(initSubject) ? myKeys[0] : initSubject));
  const subjectRowRef = useRef<HTMLDivElement>(null);
  // Keep the selected subject tab visible: centre it in the tab row
  // whenever the subject changes (including first load).
  useEffect(() => {
    const row = subjectRowRef.current;
    if (!row) return;
    const btn = row.querySelector<HTMLElement>(`[data-subject="${subject}"]`);
    if (!btn) return;
    row.scrollTo({ left: btn.offsetLeft - (row.clientWidth - btn.clientWidth) / 2, behavior: "smooth" });
  }, [subject]);
  const mode = "practice" as const;
  const [year,      setYear]      = useState("All");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [selected,  setSelected]  = useState<string|null>(null);
  const [revealed,  setRevealed]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [errorKind, setErrorKind] = useState<"empty"|"load"|"">("");
  const [score,     setScore]     = useState({ correct: 0, total: 0 });
  const [answered,  setAnswered]  = useState<Record<number, string>>({});
  const [skipped,   setSkipped]   = useState<Record<number, boolean>>({});
  const [mapOpen,   setMapOpen]   = useState(false);
  const [heat, setHeat]       = useState(HEAT_START);
  const [inRow, setInRow]     = useState(0);

  const loadQuestions = useCallback(async (subj: string, yr: string) => {
    setLoading(true);
    setError("");
    setErrorKind("");
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setAnswered({});
    setSkipped({});
    setMapOpen(false);
    setScore({ correct: 0, total: 0 });
    setHeat(HEAT_START);
    setInRow(0);
    try {
      const yrParam = yr !== "All" ? `&year=${yr}` : "";
      const res  = await fetch(`/api/qbank/questions?subject=${subj}&limit=1000${yrParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const withAns = (data.questions || []).filter((q: Question) => q.answer);
      if (withAns.length === 0) {
        const label = SUBJECTS.find(s => s.key === subj)?.label ?? subj;
        setErrorKind("empty");
        setError(yr === "All"
          ? `${label} — this subject has no answer keys in the bank yet. Try another year.`
          : `${label} ${yr} has no answer keys in the bank yet. Try another year.`);
      } else {
        setQuestions([...withAns].sort((a, b) => (a.year - b.year) || (a.num - b.num)));
      }
    } catch (e: unknown) {
      setErrorKind("load");
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "practice") loadQuestions(subject, year);
  }, [subject, year, mode, loadQuestions]);

  const q          = questions[current];
  const totalDone  = score.total;
  const scorePct   = totalDone ? Math.round((score.correct / totalDone) * 100) : 0;
  const progressPct = questions.length ? Math.round(((current + 1) / questions.length) * 100) : 0;
  const answeredCount = Object.keys(answered).length;

  const handleSelect = (opt: string) => {
    if (revealed || !q) return;
    setSelected(opt);
    setRevealed(true);
    setAnswered(prev => ({ ...prev, [current]: opt }));
    setSkipped(prev => {
      if (!prev[current]) return prev;
      const next = { ...prev };
      delete next[current];
      return next;
    });
    setScore(prev => ({
      correct: prev.correct + (opt === q.answer ? 1 : 0),
      total:   prev.total + 1,
    }));
    const next = applyAnswer(heat, inRow, opt === q.answer);
    setHeat(next.heat);
    setInRow(next.inRow);
  };

  const handleSkip = () => {
    if (current >= questions.length - 1) return;
    setSkipped(prev => ({ ...prev, [current]: true }));
    goTo(current + 1);
  };

  const goTo = (idx: number) => {
    setMapOpen(false);
    setCurrent(idx);
    const prev = answered[idx];
    setSelected(prev || null);
    setRevealed(!!prev);
  };

  const T = palette();

  // Keyboard shortcuts (laptops): A-D answer, left/right move, Enter = next once answered
  useEffect(() => {
    if (mode !== "practice") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || !q) return;
      const k = e.key.toLowerCase();
      if (k === "a" || k === "b" || k === "c" || k === "d") {
        handleSelect(k.toUpperCase());
        e.preventDefault();
      } else if (k === "arrowright" || (k === "enter" && revealed)) {
        if (current < questions.length - 1) goTo(current + 1);
        e.preventDefault();
      } else if (k === "arrowleft") {
        if (current > 0) goTo(current - 1);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const optStyle = (opt: string): React.CSSProperties => {
    if (!revealed) return {
      background: selected === opt ? "rgba(99,102,241,0.25)" : T.surface,
      border:     `2px solid ${selected === opt ? T.primary : T.border}`,
      color:      selected === opt ? "#fff" : T.text,
    };
    if (opt === q?.answer) return { background:"rgba(49,162,76,0.14)", border:`2px solid ${T.success}`, color:T.successText };
    if (opt === selected)  return { background:T.dangerTint, border:`2px solid ${T.danger}`, color:T.dangerText };
    return { background: T.surface, border:`2px solid ${T.border}`, color:T.muted };
  };

  const circleStyle = (opt: string): React.CSSProperties => {
    if (!revealed) return {
      background: selected === opt ? T.primary : T.s2,
      color:      selected === opt ? "#fff" : T.sub,
    };
    if (opt === q?.answer) return { background:T.success, color:"#fff" };
    if (opt === selected)  return { background:T.danger, color:"#fff" };
    return { background: T.s2, color: T.muted };
  };

  const renderNavigator = () => (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Questions</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6 }}>
        {questions.map((qq, i) => {
          const a = answered[i];
          const state = a === undefined ? (skipped[i] ? "skipped" : "todo") : a === qq.answer ? "ok" : "bad";
          return (
            <button key={qq.id} onClick={() => goTo(i)} style={{
              width:"100%", maxWidth:44, height:44, justifySelf:"center",
              borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit",
              border: state === "skipped" ? `1.5px dashed ${T.warning}` : state === "todo" ? `1px solid ${T.border}` : "1px solid transparent",
              outline: i === current ? "2px solid #fff" : "none",
              outlineOffset: 2,
              background: state === "ok" ? "rgba(49,162,76,0.14)" : state === "bad" ? T.dangerTint : state === "skipped" ? "transparent" : T.s2,
              color: state === "ok" ? T.successText : state === "bad" ? T.dangerText : T.sub,
            }}>{i + 1}</button>
          );
        })}
      </div>
      <div style={{ marginTop:10, fontSize:12, color:T.sub }}>
        Green correct · Red wrong · Amber skipped · Grey not tried
      </div>
      <div style={{ marginTop:14, fontSize:12, color:T.sub, lineHeight:1.8 }}>
        <div><strong style={{ color:T.text }}>Score</strong> {score.correct}/{score.total} ({scorePct}%)</div>
      </div>
    </div>
  );

  const headerSubtitle = questions.length > 0
    ? `Q${current+1} of ${questions.length}`
    : year !== "All"
      ? `JAMB ${year}`
      : subject === "chemistry"
        ? "JAMB 1986–2004"
        : "JAMB past questions";

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      fontFamily:"var(--font)",
      paddingTop: NAVBAR_HEIGHT,
      paddingBottom: BOTTOM_NAV_HEIGHT + 16,
    }}>

      {/* ── HEADER ── */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)" }}>
        <div style={{ height:56, display:"flex", alignItems:"center", gap:12, padding:"0 16px" }}>
          <button onClick={()=>router.back()} style={{
            width:44, height:44, borderRadius:12,
            background:"rgba(255,255,255,0.15)", border:"none",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <ArrowLeft size={17} color="#fff" strokeWidth={2}/>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>Past Questions</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>
              {headerSubtitle}
            </div>
          </div>
          {mode==="practice" && totalDone>0 && (
            <div style={{
              background:"rgba(255,255,255,0.15)", borderRadius:20,
              padding:"6px 12px", textAlign:"center",
              display:"flex", alignItems:"baseline", gap:6,
            }}>
              <span style={{ color:"#fff", fontWeight:800, fontSize:15, lineHeight:1 }}>{scorePct}%</span>
              <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12 }}>{score.correct}/{totalDone}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {mode==="practice" && questions.length>0 && (
          <div>
            <div style={{ height:4, background:"rgba(255,255,255,0.25)" }}>
              <div style={{ height:"100%", width:`${progressPct}%`, background:T.accent, transition:"width 0.3s" }}/>
            </div>
            <div style={{ padding:"8px 16px 10px", fontSize:12, color:"rgba(255,255,255,0.8)" }}>
              Answered {answeredCount} of {questions.length} · {scorePct}% correct
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:"14px 20px 0" }}>

        {/* ── SUBJECT TABS ── */}
        <div ref={subjectRowRef} style={{ display:"flex", gap:8, marginBottom:12, overflowX:"auto", scrollbarWidth:"none", scrollPaddingLeft:20 }}>
          {visibleSubjects.map(s=>(
            <button key={s.key} data-subject={s.key} onClick={()=>{ setSubject(s.key); setYear("All"); setCurrent(0); }} style={{
              flex:"0 0 auto", padding:"10px 14px", minHeight:44, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap", borderRadius:12, cursor:"pointer",
              fontWeight:700, fontSize:13,
              background: subject===s.key ? T.primary : T.surface,
              color:      subject===s.key ? "#fff" : T.sub,
              border:     subject===s.key ? "none" : `1px solid ${T.border}`,
            }}>
              <s.Icon size={14} strokeWidth={2}/> {s.label}
            </button>
          ))}
        </div>

        {/* ── PRACTICE MODE ── */}
        {mode==="practice" && (
          <div className="q-practice">
            {/* Year filter */}
            <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", marginBottom:14 }}>
              {yearsFor(subject).map(y=>(
                <button key={y} onClick={()=>setYear(y)} style={{
                  flexShrink:0, padding:"6px 14px", minHeight:40, display:"flex", alignItems:"center", borderRadius:20, border:"none",
                  cursor:"pointer", fontSize:12, fontWeight:600,
                  background: year===y ? T.primary : T.surface,
                  color:      year===y ? "#fff" : T.sub,
                  outline:    year===y ? "none" : `1px solid ${T.border}`,
                }}>
                  {y}
                </button>
              ))}
            </div>

            {!loading && !error && q && (
              <aside className="q-side" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:16 }}>
                {renderNavigator()}
              </aside>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{
                  width:32, height:32, borderRadius:"50%",
                  border:`3px solid ${T.s3}`, borderTopColor:T.accent,
                  animation:"spin 0.8s linear infinite", margin:"0 auto 12px",
                }}/>
                <div style={{ fontSize:13, color:T.sub }}>Loading questions…</div>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{
                padding:"40px 20px", textAlign:"center",
                background:T.surface, borderRadius:16, border:`1px solid ${T.border}`,
              }}>
                <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}><Inbox size={40} color={T.muted} strokeWidth={1.5}/></div>
                <div style={{ fontWeight:700, color:T.text, marginBottom:6 }}>
                  {errorKind === "load" ? "Couldn't load questions" : "No answers for this year yet"}
                </div>
                <div style={{ fontSize:13, color:T.sub, marginBottom:16 }}>{error}</div>
                <button onClick={()=>loadQuestions(subject,year)} style={{
                  padding:"12px 24px", minHeight:48, borderRadius:12, border:"none",
                  background:T.primary, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14,
                }}>
                  Retry
                </button>
              </div>
            )}

            {/* Question */}
            {!loading && !error && q && (
              <div>
                {/* Tablet question map button (visible 768–1023 via .q-map-btn CSS) */}
                {questions.length > 0 && (
                  <button className="q-map-btn" onClick={()=>setMapOpen(true)} style={{
                    display:"none", alignItems:"center", justifyContent:"center", gap:8,
                    width:"100%", padding:"12px", minHeight:44, marginBottom:14,
                    borderRadius:12, border:`1px solid ${T.border}`, background:T.surface,
                    color:T.text, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                  }}>
                    <Map size={16} strokeWidth={2}/> Question map
                  </button>
                )}

                {/* Meta badges */}
                <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{
                    padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                    background:T.primaryTint, color:T.primaryText,
                  }}>JAMB {q.year}</span>
                  <span style={{
                    padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700,
                    background:T.s2, color:T.sub,
                  }}>Question {q.num}</span>
                  {revealed && (
                    <span style={{
                      marginLeft:"auto", display:"flex", alignItems:"center", gap:4,
                      fontSize:12, fontWeight:700,
                      color: selected===q.answer ? T.success : T.danger,
                    }}>
                      {selected===q.answer
                        ? <><CheckCircle size={14} color={T.success}/>Correct!</>
                        : <><XCircle size={14} color={T.danger}/>Wrong</>}
                    </span>
                  )}
                </div>

                {/* Question text */}
                {q.image && (
                  <div style={{ marginBottom:12, textAlign:"center" }}>
                    <img src={"/" + q.image} alt="Question diagram" style={{ maxWidth:"100%", borderRadius:12, border:`1px solid ${T.border}`, background:"#fff", padding:8, boxSizing:"border-box" }} />
                  </div>
                )}
                <div style={{
                  background:T.surface, borderRadius:16, padding:18,
                  border:`1px solid ${T.border}`, marginBottom:12,
                  fontSize:15, color:T.text, fontWeight:500, lineHeight:1.7,
                  maxWidth:"68ch",
                }}>
                  {q.question}
                </div>

                {/* Options */}
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  {(["A","B","C","D"] as const).map(opt=>(
                    <button key={opt} onClick={()=>handleSelect(opt)} style={{
                      width:"100%", padding:"13px 14px", borderRadius:12,
                      cursor: revealed?"default":"pointer",
                      textAlign:"left", display:"flex", alignItems:"center", gap:12,
                      fontFamily:"inherit", transition:"all 0.15s",
                      ...optStyle(opt),
                    }}>
                      <div style={{
                        width:28, height:28, borderRadius:"50%", flexShrink:0,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:12, fontWeight:800,
                        ...circleStyle(opt),
                      }}>{opt}</div>
                      <span style={{ fontSize:14, fontWeight:500, flex:1, lineHeight:1.55 }}>
                        {q.options[opt]}
                      </span>
                      {revealed && opt===q.answer && (
                        <CheckCircle size={16} color={T.success} strokeWidth={2.5}/>
                      )}
                      {revealed && opt===selected && opt!==q.answer && (
                        <XCircle size={16} color={T.danger} strokeWidth={2.5}/>
                      )}
                    </button>
                  ))}
                </div>

                {/* Result banner */}
                {revealed && (
                  <div style={{
                    padding:"12px 14px", borderRadius:12, marginBottom:14,
                    background: selected===q.answer ? T.successTint : T.dangerTint,
                    border:`1px solid ${selected===q.answer?"rgba(49,162,76,0.35)":"rgba(250,62,62,0.35)"}`,
                  }}>
                    <div style={{
                      fontSize:14, fontWeight:700,
                      color: selected===q.answer ? T.successText : T.dangerText,
                    }}>
                      {selected===q.answer
                        ? "Correct."
                        : `Wrong — the answer is ${q.answer}.`
                      }
                    </div>
                    {selected!==q.answer && (
                      <div style={{ fontSize:13, color:T.sub, marginTop:6 }}>
                        Ask the AI Tutor below for a step-by-step explanation.
                      </div>
                    )}
                  </div>
                )}

                {/* Ask AI button when revealed */}
                {revealed && (
                  <Link
                    href={`/ai?q=${encodeURIComponent(`Explain this JAMB ${q.subject} question from ${q.year}: ${q.question} The correct answer is ${q.answer}: ${q.options[q.answer as keyof typeof q.options]}. Why is this correct and why are the others wrong?`)}`}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      padding:13, borderRadius:12, marginBottom:14,
                      background:T.primary,
                      color:"#fff", textDecoration:"none", fontWeight:700, fontSize:14,
                    }}
                  >
                    <Bot size={15} strokeWidth={2}/> Ask AI to explain this question
                  </Link>
                )}

                {/* Navigation */}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>goTo(current-1)} disabled={current===0} style={{
                    flex:1, padding:"13px", borderRadius:12,
                    border:`1.5px solid ${T.border}`, background:"transparent",
                    color: current===0 ? T.muted : T.text,
                    fontWeight:700, cursor: current===0?"not-allowed":"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  }}>
                    <ChevronLeft size={16}/> Prev
                  </button>

                  {!revealed && current < questions.length - 1 && (
                    <button onClick={handleSkip} style={{
                      flex:1, padding:"13px", borderRadius:12,
                      border:`1.5px solid ${T.border}`, background:T.surface,
                      color:T.sub, fontWeight:700, cursor:"pointer", fontSize:13,
                    }}>
                      Skip
                    </button>
                  )}

                  {current < questions.length-1 ? (
                    <button onClick={()=>goTo(current+1)} style={{
                      flex: revealed?2:1, padding:"13px", borderRadius:12, border:"none",
                      background:T.primary, color:"#fff", fontWeight:700, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    }}>
                      Next <ChevronRight size={16}/>
                    </button>
                  ) : (
                    revealed && (
                      <button onClick={()=>loadQuestions(subject,year)} style={{
                        flex:2, padding:"13px", borderRadius:12, border:"none",
                        background:T.success, color:"#fff", fontWeight:700, cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                        <RotateCcw size={14}/> Try Again
                      </button>
                    )
                  )}
                </div>

                {/* Session complete */}
                {current===questions.length-1 && revealed && (
                  <div style={{
                    marginTop:14, padding:"24px 20px", borderRadius:16, textAlign:"center",
                    background:T.surface, border:`1px solid ${T.border}`,
                  }}>
                    <div style={{ marginBottom:4, display:"flex", justifyContent:"center" }}>
                      <Flame stage={readFlameStage()} heat={heat} mood={completionFlame(score.correct, totalDone).mood} speech={completionFlame(score.correct, totalDone).speech} size={32} />
                    </div>
                    <div style={{ fontWeight:800, fontSize:17, color:T.text, marginBottom:6 }}>
                      Session Complete!
                    </div>
                    <div style={{ fontSize:14, color:T.sub, marginBottom:4 }}>
                      Score: {score.correct}/{totalDone} ({scorePct}%)
                    </div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>
                      {scorePct>=70?"Excellent! Keep it up!"
                        :scorePct>=50?"Good effort! Review weak areas."
                        :"Review these topics and try again."}
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={()=>loadQuestions(subject,year)} style={{
                        flex:1, padding:"12px", minHeight:48, borderRadius:12, border:"none",
                        background:T.primary, color:"#fff", fontWeight:700,
                        cursor:"pointer", fontSize:13,
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                        <RotateCcw size={13} strokeWidth={2}/> Try Again
                      </button>
                      <Link href="/mock" style={{
                        flex:1, padding:"12px", minHeight:48, borderRadius:12, border:"none",
                        background:T.success, color:"#fff", fontWeight:700,
                        cursor:"pointer", fontSize:13, textDecoration:"none",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                        <ClipboardList size={13} strokeWidth={2}/> Mock Exam
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tablet question map overlay */}
      {mapOpen && questions.length > 0 && (
        <div
          className="q-map-overlay"
          onClick={()=>setMapOpen(false)}
        >
          <div
            className="q-map-sheet"
            onClick={(e)=>e.stopPropagation()}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Question map</div>
              <button onClick={()=>setMapOpen(false)} aria-label="Close question map" style={{
                width:44, height:44, borderRadius:12, border:"none",
                background:T.s2, color:T.text, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <X size={18} strokeWidth={2}/>
              </button>
            </div>
            {renderNavigator()}
          </div>
        </div>
      )}

    </div>
  );
}

export default function Questions() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"var(--bg)" }}/>}>
      <QuestionsContent />
    </Suspense>
  );
}
