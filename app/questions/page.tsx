"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, RotateCcw, PlayCircle, ExternalLink,
} from "lucide-react";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { C, palette } from "../lib/design";

interface Question {
  id:          string;
  subject:     string;
  year:        number;
  num:         number;
  question:    string;
  options:     { A: string; B: string; C: string; D: string };
  answer:      string | null;
  has_diagram: boolean;
}

const SUBJECTS = [
  { key: "biology",    label: "Biology",    icon: "🌿" },
  { key: "government", label: "Government", icon: "🏛️" },
];

const YEARS = ["All","2010","2011","2012","2013","2014","2015","2016","2017","2018"];

const LESSONS: Record<string, { title: string; url: string }[]> = {
  biology: [
    { title: "Cell Biology",           url: "https://www.youtube.com/results?search_query=JAMB+biology+cell+biology" },
    { title: "Genetics & Heredity",    url: "https://www.youtube.com/results?search_query=JAMB+genetics+heredity" },
    { title: "Ecology & Environment",  url: "https://www.youtube.com/results?search_query=JAMB+ecology+biology" },
    { title: "Nutrition & Digestion",  url: "https://www.youtube.com/results?search_query=JAMB+nutrition+digestion" },
    { title: "Reproduction",           url: "https://www.youtube.com/results?search_query=JAMB+reproduction+biology" },
  ],
  government: [
    { title: "Arms of Government",     url: "https://www.youtube.com/results?search_query=JAMB+government+arms+legislature" },
    { title: "Nigerian Constitution",  url: "https://www.youtube.com/results?search_query=JAMB+government+constitution+nigeria" },
    { title: "Political Parties",      url: "https://www.youtube.com/results?search_query=JAMB+political+parties+nigeria" },
    { title: "Electoral Systems",      url: "https://www.youtube.com/results?search_query=JAMB+electoral+system+nigeria" },
    { title: "International Orgs",     url: "https://www.youtube.com/results?search_query=JAMB+government+UN+AU+ECOWAS" },
  ],
};

function QuestionsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initSubject  = searchParams.get("subject") || "biology";
  const initMode     = searchParams.get("mode")    || "practice";

  const [dark,      setDark]      = useState(false);
  const [subject,   setSubject]   = useState(initSubject);
  const [mode,      setMode]      = useState<"learn"|"practice">(initMode as "learn"|"practice");
  const [year,      setYear]      = useState("All");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [selected,  setSelected]  = useState<string|null>(null);
  const [revealed,  setRevealed]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [score,     setScore]     = useState({ correct: 0, total: 0 });
  const [answered,  setAnswered]  = useState<Record<number, string>>({});

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
  }, []);

  const loadQuestions = useCallback(async (subj: string, yr: string) => {
    setLoading(true);
    setError("");
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setAnswered({});
    setScore({ correct: 0, total: 0 });
    try {
      const yrParam = yr !== "All" ? `&year=${yr}` : "";
      const res  = await fetch(`/api/qbank/questions?subject=${subj}&limit=100${yrParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const withAns = (data.questions || []).filter((q: Question) => q.answer);
      if (withAns.length === 0) {
        setError(`No questions with answers available for ${yr === "All" ? "this subject" : yr} yet.`);
      } else {
        setQuestions([...withAns].sort(() => Math.random() - 0.5));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
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

  const handleSelect = (opt: string) => {
    if (revealed || !q) return;
    setSelected(opt);
    setRevealed(true);
    setAnswered(prev => ({ ...prev, [current]: opt }));
    setScore(prev => ({
      correct: prev.correct + (opt === q.answer ? 1 : 0),
      total:   prev.total + 1,
    }));
  };

  const goTo = (idx: number) => {
    setCurrent(idx);
    const prev = answered[idx];
    setSelected(prev || null);
    setRevealed(!!prev);
  };

  const T = palette(dark);

  const optStyle = (opt: string): React.CSSProperties => {
    if (!revealed) return {
      background: selected === opt ? C.primaryLight : T.surface,
      border:     `2px solid ${selected === opt ? C.primary : T.border}`,
      color:      selected === opt ? C.primary : T.text,
    };
    if (opt === q?.answer) return { background:"#E6F4EA", border:"2px solid #31A24C", color:"#0D8050" };
    if (opt === selected)  return { background:"#FEE2E2", border:"2px solid #FA3E3E", color:"#D0021B" };
    return { background: T.surface, border:`2px solid ${T.border}`, color:T.muted };
  };

  const circleStyle = (opt: string): React.CSSProperties => {
    if (!revealed) return {
      background: selected === opt ? C.primary : T.s2,
      color:      selected === opt ? "#fff" : T.sub,
    };
    if (opt === q?.answer) return { background:"#31A24C", color:"#fff" };
    if (opt === selected)  return { background:"#FA3E3E", color:"#fff" };
    return { background: T.s2, color: T.muted };
  };

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      paddingBottom: BOTTOM_NAV_HEIGHT + 16,
    }}>

      {/* ── HEADER ── */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:C.primary }}>
        <div style={{ height:56, display:"flex", alignItems:"center", gap:12, padding:"0 16px" }}>
          <button onClick={()=>router.back()} style={{
            width:34, height:34, borderRadius:10,
            background:"rgba(255,255,255,0.15)", border:"none",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <ArrowLeft size={17} color="#fff" strokeWidth={2}/>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>Past Questions</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>
              {mode==="practice" && questions.length>0
                ? `Q${current+1} of ${questions.length}`
                : "JAMB 2010–2018"}
            </div>
          </div>
          {mode==="practice" && totalDone>0 && (
            <div style={{
              background:"rgba(255,255,255,0.15)", borderRadius:20,
              padding:"4px 12px", textAlign:"center",
            }}>
              <div style={{ color:"#FFF8DB", fontWeight:900, fontSize:16, lineHeight:1 }}>{scorePct}%</div>
              <div style={{ color:"rgba(255,255,255,0.7)", fontSize:9 }}>{score.correct}/{totalDone}</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {mode==="practice" && questions.length>0 && (
          <div style={{ height:3, background:"rgba(255,255,255,0.2)" }}>
            <div style={{ height:"100%", width:`${progressPct}%`, background:"#fff", transition:"width 0.3s" }}/>
          </div>
        )}
      </div>

      <div style={{ padding:"14px 14px 0" }}>

        {/* ── SUBJECT TABS ── */}
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          {SUBJECTS.map(s=>(
            <button key={s.key} onClick={()=>{ setSubject(s.key); setCurrent(0); }} style={{
              flex:1, padding:"10px 8px", borderRadius:12, cursor:"pointer",
              fontWeight:700, fontSize:13,
              background: subject===s.key ? C.primary : T.surface,
              color:      subject===s.key ? "#fff" : T.sub,
              border:     subject===s.key ? "none" : `1px solid ${T.border}`,
            }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* ── MODE TABS ── */}
        <div style={{ display:"flex", gap:8, marginBottom:14, background:T.s2, borderRadius:12, padding:4 }}>
          {(["learn","practice"] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              flex:1, padding:"9px", borderRadius:9, border:"none",
              cursor:"pointer", fontWeight:700, fontSize:13,
              background: mode===m ? "#fff" : "transparent",
              color:      mode===m ? C.primary : T.sub,
              boxShadow:  mode===m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}>
              {m==="learn" ? "🎬 Lessons" : "✏️ Practice"}
            </button>
          ))}
        </div>

        {/* ── LEARN MODE ── */}
        {mode==="learn" && (
          <div>
            <p style={{ fontSize:13, color:T.sub, marginBottom:14 }}>
              Curated YouTube lessons for {SUBJECTS.find(s=>s.key===subject)?.label}.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {(LESSONS[subject] || []).map((l,i)=>(
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                  display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                  borderRadius:14, background:T.surface, border:`1px solid ${T.border}`,
                  textDecoration:"none", color:T.text,
                }}>
                  <div style={{
                    width:40, height:40, borderRadius:10, flexShrink:0,
                    background:"#FF000015", display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <PlayCircle size={20} color="#FF0000"/>
                  </div>
                  <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{l.title}</span>
                  <ExternalLink size={14} color={T.muted}/>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── PRACTICE MODE ── */}
        {mode==="practice" && (
          <div>
            {/* Year filter */}
            <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", marginBottom:14 }}>
              {YEARS.map(y=>(
                <button key={y} onClick={()=>setYear(y)} style={{
                  flexShrink:0, padding:"6px 12px", borderRadius:20, border:"none",
                  cursor:"pointer", fontSize:12, fontWeight:600,
                  background: year===y ? C.primary : T.surface,
                  color:      year===y ? "#fff" : T.sub,
                  outline:    year===y ? "none" : `1px solid ${T.border}`,
                }}>
                  {y}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{
                  width:32, height:32, borderRadius:"50%",
                  border:"3px solid #F0F2F5", borderTopColor:"#EA580C",
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
                <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                <div style={{ fontWeight:700, color:T.text, marginBottom:6 }}>No questions yet</div>
                <div style={{ fontSize:13, color:T.sub, marginBottom:16 }}>{error}</div>
                <button onClick={()=>loadQuestions(subject,year)} style={{
                  padding:"10px 24px", borderRadius:50, border:"none",
                  background:C.primary, color:"#fff", fontWeight:700, cursor:"pointer",
                }}>
                  Retry
                </button>
              </div>
            )}

            {/* Question */}
            {!loading && !error && q && (
              <div>
                {/* Meta badges */}
                <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{
                    padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                    background:C.primaryLight, color:C.primary,
                  }}>JAMB {q.year}</span>
                  <span style={{
                    padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                    background:T.s2, color:T.sub,
                  }}>Question {q.num}</span>
                  {revealed && (
                    <span style={{
                      marginLeft:"auto", display:"flex", alignItems:"center", gap:4,
                      fontSize:12, fontWeight:700,
                      color: selected===q.answer ? "#31A24C" : "#FA3E3E",
                    }}>
                      {selected===q.answer
                        ? <><CheckCircle size={14} color="#31A24C"/>Correct!</>
                        : <><XCircle size={14} color="#FA3E3E"/>Wrong</>}
                    </span>
                  )}
                </div>

                {/* Question text */}
                <div style={{
                  background:T.surface, borderRadius:16, padding:"18px 16px",
                  border:`1px solid ${T.border}`, marginBottom:12,
                  fontSize:15, color:T.text, fontWeight:600, lineHeight:1.65,
                }}>
                  {q.question}
                </div>

                {/* Options */}
                <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:14 }}>
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
                      <span style={{ fontSize:14, fontWeight:500, flex:1, lineHeight:1.4 }}>
                        {q.options[opt]}
                      </span>
                      {revealed && opt===q.answer && (
                        <CheckCircle size={15} color="#31A24C" strokeWidth={2.5}/>
                      )}
                      {revealed && opt===selected && opt!==q.answer && (
                        <XCircle size={15} color="#FA3E3E" strokeWidth={2.5}/>
                      )}
                    </button>
                  ))}
                </div>

                {/* Result banner */}
                {revealed && (
                  <div style={{
                    padding:"12px 14px", borderRadius:12, marginBottom:14,
                    background: selected===q.answer ? "#E6F4EA" : "#FFF3EE",
                    border:`1px solid ${selected===q.answer?"#31A24C44":"#EA580C44"}`,
                  }}>
                    <div style={{
                      fontSize:13, fontWeight:700,
                      color: selected===q.answer ? "#0D8050" : "#C75B21",
                    }}>
                      {selected===q.answer
                        ? `✅ Correct! Answer: ${q.answer}. ${q.options[q.answer as keyof typeof q.options]}`
                        : `❌ Wrong. Correct answer: ${q.answer}. ${q.options[q.answer as keyof typeof q.options]}`
                      }
                    </div>
                    <div style={{ fontSize:11, color:T.sub, marginTop:6 }}>
                      Ask AI to explain → tap 🤖 below
                    </div>
                  </div>
                )}

                {/* Ask AI button when wrong */}
                {revealed && selected !== q.answer && (
                  <Link
                    href={`/ai?q=${encodeURIComponent(`Explain this JAMB ${q.subject} question from ${q.year}: ${q.question} The correct answer is ${q.answer}: ${q.options[q.answer as keyof typeof q.options]}. Why is this correct and why are the others wrong?`)}`}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      padding:"12px", borderRadius:12, marginBottom:14,
                      background:"linear-gradient(135deg,#1877F2,#166FE5)",
                      color:"#fff", textDecoration:"none", fontWeight:700, fontSize:13,
                      boxShadow:"0 2px 10px rgba(24,119,242,0.3)",
                    }}
                  >
                    🤖 Ask AI to explain this answer
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

                  {!revealed && (
                    <button onClick={()=>{ setRevealed(true); setScore(p=>({...p,total:p.total+1})); }} style={{
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
                      background:C.primary, color:"#fff", fontWeight:700, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      boxShadow:"0 2px 10px rgba(24,119,242,0.3)",
                    }}>
                      Next <ChevronRight size={16}/>
                    </button>
                  ) : (
                    revealed && (
                      <button onClick={()=>loadQuestions(subject,year)} style={{
                        flex:2, padding:"13px", borderRadius:12, border:"none",
                        background:"#31A24C", color:"#fff", fontWeight:700, cursor:"pointer",
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
                    <div style={{ fontSize:40, marginBottom:10 }}>
                      {scorePct>=70?"🏆":scorePct>=50?"👍":"📚"}
                    </div>
                    <div style={{ fontWeight:800, fontSize:17, color:T.text, marginBottom:6 }}>
                      Session Complete!
                    </div>
                    <div style={{ fontSize:14, color:T.sub, marginBottom:4 }}>
                      Score: {score.correct}/{totalDone} ({scorePct}%)
                    </div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>
                      {scorePct>=70?"Excellent! Keep it up! 🔥"
                        :scorePct>=50?"Good effort! Review weak areas."
                        :"Review these topics and try again."}
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={()=>loadQuestions(subject,year)} style={{
                        flex:1, padding:"12px", borderRadius:50, border:"none",
                        background:C.primary, color:"#fff", fontWeight:700,
                        cursor:"pointer", fontSize:13,
                        boxShadow:"0 2px 10px rgba(24,119,242,0.3)",
                      }}>
                        🔄 Try Again
                      </button>
                      <Link href="/mock" style={{
                        flex:1, padding:"12px", borderRadius:50, border:"none",
                        background:"#31A24C", color:"#fff", fontWeight:700,
                        cursor:"pointer", fontSize:13, textDecoration:"none",
                        textAlign:"center", display:"block",
                      }}>
                        📝 Mock Exam
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav darkMode={dark}/>
    </div>
  );
}

export default function Questions() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#F0F2F5" }}/>}>
      <QuestionsContent />
    </Suspense>
  );
}
