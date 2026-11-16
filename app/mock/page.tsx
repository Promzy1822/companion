"use client";
import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, CheckCircle2, Clock, ArrowRight, ClipboardList, Trophy, BarChart3, AlertTriangle, XCircle, LayoutGrid, X, Bot } from "lucide-react";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";
import { Sync } from "../lib/sync";
import { Flame } from "../components/Flame";
import { mockResultFlame, readFlameStage } from "../lib/flame";

interface Question { id:number; subject:string; question:string; options:string[]; correct:number; explanation:string; image?:string; }
interface Section  { id:string; label:string; target:number; start:number; count:number; }
interface Result   { score:number; total:number; total400:number; max400:number; bySubject:Record<string,{correct:number;total:number;score100:number}>; timeTaken:number; missing:string[]; }
interface HistoryEntry { score:number; total:number; jambEquivalent:number; date:string; subjects?:number; }

const TOTAL_TIME = 2 * 60 * 60; // the real UTME allowance: 2 hours

const BANK: Record<string,{id:string;label:string}> = {
  "English Language":      { id:"english",     label:"English Language" },
  "Mathematics":           { id:"mathematics", label:"Mathematics" },
  "Physics":               { id:"physics",     label:"Physics" },
  "Chemistry":             { id:"chemistry",   label:"Chemistry" },
  "Biology":               { id:"biology",     label:"Biology" },
  "Government":            { id:"government",  label:"Government" },
  "Economics":             { id:"economics",   label:"Economics" },
  "Literature in English": { id:"literature",  label:"Literature in English" },
};

function readUser(): any {
  try { return JSON.parse(localStorage.getItem("companion_user") || "{}"); } catch { return {}; }
}

// The JAMB paper plan: Use of English (60) + up to three other subjects (40 each).
function buildPlan(): { plan: { id:string; label:string; target:number }[]; missing: string[] } {
  const user = readUser();
  const wanted: string[] = Array.isArray(user.subjects) && user.subjects.length
    ? user.subjects
    : ["Mathematics", "Physics", "Biology"];
  const others = wanted.filter(s => s !== "English Language").slice(0, 3);
  const plan: { id:string; label:string; target:number }[] = [
    { id: "english", label: "English Language", target: 60 },
  ];
  const missing: string[] = [];
  for (const name of others) {
    const b = BANK[name];
    if (b) plan.push({ id: b.id, label: b.label, target: 40 });
    else missing.push(name);
  }
  return { plan, missing };
}

export default function MockExam() {
  const dark = useDark();
  const [phase,     setPhase]     = useState<"setup"|"exam"|"result">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections,  setSections]  = useState<Section[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<Record<number,number>>({});
  const [skipped,   setSkipped]   = useState<Record<number,boolean>>({});
  const [timeLeft,  setTimeLeft]  = useState(TOTAL_TIME);
  const [result,    setResult]    = useState<Result|null>(null);
  const [generating,setGenerating]= useState(false);
  const [loadError, setLoadError] = useState("");
  const [showPalette, setShowPalette]     = useState(false);
  const [showSubmit,  setShowSubmit]      = useState(false);
  const [showAllMissed, setShowAllMissed] = useState(false);
  const [planInfo]                = useState(buildPlan);
  const [history,   setHistory]   = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("mock_history")||"[]"); } catch { return []; }
  });
  const timerRef   = useRef<ReturnType<typeof setInterval>|null>(null);
  const missingRef = useRef<string[]>([]);
  const submitRef  = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (phase==="exam" && timeLeft>0) {
      timerRef.current = setInterval(()=>setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current!);submitRef.current?.();return 0;}
        return t-1;
      }), 1000);
    }
    return ()=>{if(timerRef.current)clearInterval(timerRef.current);};
  }, [phase]);

  const startExam = async () => {
    setGenerating(true);
    setLoadError("");
    const { plan, missing } = buildPlan();
    const exam: Question[] = [];
    const secs: Section[] = [];
    const missingNow: string[] = [...missing];
    try {
      for (const p of plan) {
        const res  = await fetch(`/api/qbank/questions?subject=${p.id}&limit=1000`);
        const data = await res.json();
        const usable = (data.questions || []).filter((q:any) =>
          q.answer && q.options && q.options.A && q.options.B && q.options.C && q.options.D);
        for (let i = usable.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [usable[i], usable[j]] = [usable[j], usable[i]]; }
        const picked = usable.slice(0, p.target);
        if (!picked.length) { missingNow.push(p.label); continue; }
        const start = exam.length;
        picked.forEach((q:any) => {
          exam.push({
            id: exam.length + 1,
            subject: p.label,
            question: q.question,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            correct: "ABCD".indexOf(q.answer),
            explanation: `JAMB ${q.year} · Question ${q.num}`,
            image: q.image || undefined,
          });
        });
        secs.push({ id: p.id, label: p.label, target: p.target, start, count: picked.length });
      }
    } catch {}
    if (!exam.length) {
      setGenerating(false);
      setLoadError("Could not load exam questions. Check your connection and try again.");
      return;
    }
    missingRef.current = missingNow;
    setQuestions(exam);
    setSections(secs);
    setTimeLeft(TOTAL_TIME); setAnswers({}); setSkipped({});
    setCurrent(0); setShowPalette(false); setShowSubmit(false); setShowAllMissed(false);
    setPhase("exam"); setGenerating(false);
  };

  // Always keep submitRef pointing to latest submitExam
  // so the timer interval closure never calls a stale version
  const submitExam = () => {
    if(timerRef.current) clearInterval(timerRef.current);
    let score=0; const bySubject:Result["bySubject"]={};
    for (const s of sections) {
      let correct=0;
      for (let i=s.start; i<s.start+s.count; i++) {
        if (answers[i]===questions[i].correct) correct++;
      }
      bySubject[s.label]={ correct, total:s.count, score100: s.count ? Math.round((correct/s.count)*100) : 0 };
      score+=correct;
    }
    const total400 = Object.values(bySubject).reduce((a,d)=>a+d.score100,0);
    const max400 = sections.length*100;
    const missing: string[] = missingRef.current;
    const res:Result={ score, total:questions.length, total400, max400, bySubject, timeTaken: TOTAL_TIME-timeLeft, missing };
    setResult(res); setPhase("result");
    const newH=[{score,total:questions.length,jambEquivalent:total400,date:new Date().toLocaleDateString(),subjects:sections.length},...history].slice(0,10);
    localStorage.setItem("mock_history",JSON.stringify(newH)); setHistory(newH);
    Sync.push("mock_history");
  };

  submitRef.current = submitExam; // timer auto-submits when time runs out
  const fmt = (s:number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const timePct = (timeLeft/TOTAL_TIME)*100;

  const T = palette();

  // Timer stays neutral (white) until 30 min remain, then amber with a
  // "30 min left" label; under 10 min it goes red with "finish up".
  // A countdown is never green — green reads as "safe", which is
  // meaningless for time running out.
  const timerCol = timeLeft<=600 ? T.danger : timeLeft<=1800 ? T.warning : "#fff";
  const timerLabel = timeLeft<=600 ? "10 min left — finish up" : timeLeft<=1800 ? "30 min left" : "";

  const activeSec = (() => {
    let a = 0;
    sections.forEach((s,i)=>{ if (current>=s.start) a=i; });
    return a;
  })();
  const activeSection = sections[activeSec];
  const answeredIn = (s: Section) => {
    let n=0; for (let i=s.start;i<s.start+s.count;i++) if (answers[i]!==undefined) n++;
    return n;
  };
  const totalAnswered = Object.keys(answers).length;
  const skippedCount = Object.keys(skipped).filter(k => answers[Number(k)]===undefined).length;
  const unansweredCount = questions.length - totalAnswered - skippedCount;
  const shownHistory = history.slice(0, 3);

  // Answering a question clears its skipped flag (it is no longer skipped).
  const answerCurrent = (i: number) => {
    setAnswers(p => ({ ...p, [current]: i }));
    setSkipped(p => {
      if (!(current in p)) return p;
      const n = { ...p }; delete n[current]; return n;
    });
  };
  // Skip means what it says: move on, leave the question unanswered,
  // do not score it, do not reveal anything. It stays returnable from
  // the palette, and the result lists it under Skipped, not Missed.
  const skipCurrent = () => {
    setSkipped(p => ({ ...p, [current]: true }));
    setCurrent(c => Math.min(questions.length - 1, c + 1));
  };

  // Keyboard shortcuts during the exam: A-D answer, left/right (or P/N) move between questions
  useEffect(() => {
    if (phase !== "exam") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "a" || k === "b" || k === "c" || k === "d") {
        const i = k.charCodeAt(0) - 97;
        if (questions[current] && i < questions[current].options.length) {
          answerCurrent(i);
          e.preventDefault();
        }
      } else if (k === "arrowright" || k === "n") {
        setCurrent(c => Math.min(questions.length - 1, c + 1));
        e.preventDefault();
      } else if (k === "arrowleft" || k === "p") {
        setCurrent(c => Math.max(0, c - 1));
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, questions]);

  // Exam focus mode: hide the layout chrome (top bar, tabs, rail) while an exam runs
  useEffect(() => {
    if (phase !== "exam") return;
    document.body.classList.add("exam-focus");
    return () => { document.body.classList.remove("exam-focus"); };
  }, [phase]);

  // ── Palette (question map) shared by the tablet bar row, the phone
  // overlay and the laptop rail. Chips show only answered/skipped/
  // unanswered state — never correctness (the exam is blind).
  // dark = sitting on the indigo bar gradient; otherwise on a surface.
  const chipStyle = (i: number, dark: boolean): CSSProperties => {
    const isCurrent = i === current;
    const isAnswered = answers[i] !== undefined;
    const isSkipped = !isAnswered && !!skipped[i];
    const base: CSSProperties = {
      width: 44, height: 44, borderRadius: 10, flexShrink: 0, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, fontFamily: "inherit", position: "relative",
      // Current is an ADDED outline on top of the state fill — it never
      // erases the answered/skipped fill underneath it.
      outline: isCurrent ? `2px solid ${T.accent}` : "none", outlineOffset: 1,
    };
    if (isAnswered) return { ...base, background: T.success, color: "#fff", border: "none" };
    if (isSkipped) return { ...base, background: dark ? "rgba(247,185,40,0.15)" : T.warningTint, color: T.warning, border: `1.5px dashed ${T.warning}` };
    if (dark) return { ...base, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid transparent" };
    return { ...base, background: T.s2, color: T.sub, border: `1px solid ${T.border}` };
  };

  const renderChips = (dark: boolean, layout: "row" | "grid") => {
    if (!activeSection) return null;
    return (
      <div style={layout === "row"
        ? { display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }
        : { display: "grid", gridTemplateColumns: "repeat(auto-fill, 44px)", gap: 6 }}>
        {Array.from({ length: activeSection.count }, (_, k) => {
          const i = activeSection.start + k;
          const isAnswered = answers[i] !== undefined;
          return (
            <button key={i} onClick={() => { setCurrent(i); setShowPalette(false); }}
              aria-label={`Question ${k + 1}${isAnswered ? " answered" : skipped[i] ? " skipped" : ""}`}
              style={chipStyle(i, dark)}>
              {k + 1}
              {isAnswered && (
                <span style={{ position: "absolute", top: 2, right: 2, display: "flex" }}>
                  <Check size={10} color="#fff" strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderPills = (dark: boolean, wrap: boolean) => (
    <div style={{ display: "flex", gap: 6, flexWrap: wrap ? "wrap" : "nowrap", overflowX: wrap ? undefined : "auto", scrollbarWidth: "none" }}>
      {sections.map((s, i) => (
        <button key={s.id} onClick={() => setCurrent(s.start)} style={{
          flexShrink: 0, padding: "7px 12px", minHeight: 44, borderRadius: 999, cursor: "pointer",
          fontSize: 12, fontWeight: 700, fontFamily: "inherit",
          // Active is an outline, never a white slab — the white pill was
          // the loudest element in the bar, louder than the timer.
          background: i === activeSec ? (dark ? "rgba(255,255,255,0.25)" : T.primaryTint) : (dark ? "rgba(255,255,255,0.15)" : T.s2),
          color: i === activeSec ? (dark ? "#fff" : T.primaryText) : (dark ? "#fff" : T.text),
          border: i === activeSec ? `1.5px solid ${dark ? "#fff" : T.primary}` : `1px solid ${dark ? "transparent" : T.border}`,
        }}>
          {s.label} · {answeredIn(s)}/{s.count}
        </button>
      ))}
    </div>
  );

  const renderLegend = (dark: boolean) => {
    const col = dark ? "rgba(255,255,255,0.75)" : T.sub;
    const items: { label: string; sw: CSSProperties }[] = [
      { label: "Answered", sw: { background: T.success } },
      { label: "Skipped", sw: { background: dark ? "rgba(247,185,40,0.15)" : T.warningTint, border: `1.5px dashed ${T.warning}` } },
      { label: "Unanswered", sw: { background: dark ? "rgba(255,255,255,0.12)" : T.s2, border: `1px solid ${dark ? "transparent" : T.border}` } },
      { label: "Current", sw: { background: "transparent", outline: `2px solid ${T.accent}` } },
    ];
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: col }}>
        {items.map(it => (
          <span key={it.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, display: "inline-block", boxSizing: "border-box", ...it.sw }} />
            {it.label}
          </span>
        ))}
      </div>
    );
  };

  // ── SETUP ──────────────────────────────────────────────────────
  if (phase==="setup") return (
    <div style={{minHeight:"100vh", paddingTop:NAVBAR_HEIGHT,background:T.bg,fontFamily:"var(--font)"}}>

      <div className="hero-banner" style={{background:"linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)",padding:"20px 20px 32px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <Link href="/" style={{width:44,height:44,borderRadius:"12px",backgroundColor:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}>
            <ArrowLeft size={18} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:"18px"}}>Mock Exam</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>Past JAMB questions, exam conditions</div>
          </div>
        </div>
      </div>

      <div className="mock-setup mock-page-pad" style={{padding:"16px 20px"}}>
        <div style={{background:T.surface,borderRadius:"16px",padding:"24px",border:`1px solid ${T.border}`,marginBottom:"14px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{width:64,height:64,borderRadius:"18px",background:T.primaryTint,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
              <ClipboardList size={28} color={T.primary} strokeWidth={1.8} />
            </div>
            <h2 style={{fontSize:"20px",fontWeight:800,color:T.text,margin:"0 0 8px",letterSpacing:"-0.3px"}}>JAMB Mock Exam</h2>
            <p style={{fontSize:"13px",color:T.sub,margin:0,lineHeight:"1.5"}}>The UTME paper as JAMB sets it: {planInfo.plan.length} subjects in sections, one 2-hour sitting, each subject out of 100.</p>
          </div>

          <div style={{marginBottom:"20px"}}>
            {planInfo.plan.map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:"14px",fontWeight:600,color:T.text}}>{p.label}</span>
                <span style={{fontSize:"13px",color:T.sub,fontWeight:700}}>{p.target} questions</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
              <span style={{fontSize:"14px",fontWeight:700,color:T.text}}>Total</span>
              <span style={{fontSize:"13px",color:T.text,fontWeight:700}}>{planInfo.plan.reduce((a,p)=>a+p.target,0)} questions · 2 hours</span>
            </div>
            <p style={{fontSize:"12px",color:T.sub,marginTop:"8px",display:"flex",alignItems:"center",gap:"4px"}}><Clock size={14} strokeWidth={2}/> 2 hours for the whole paper, like the real exam.</p>
            {planInfo.missing.length>0 && (
              <div style={{display:"flex",alignItems:"center",gap:"8px",background:T.warningTint,color:T.warning,fontSize:"13px",fontWeight:600,padding:"10px 12px",borderRadius:"10px",marginTop:"12px"}}>
                <AlertTriangle size={16} strokeWidth={2} /> {planInfo.missing.join(", ")} {planInfo.missing.length>1 ? "are" : "is"} not in the question bank — your paper will have {planInfo.plan.length} subject{planInfo.plan.length>1 ? "s" : ""}.
              </div>
            )}
            {loadError && <p style={{fontSize:"12px",color:T.dangerText,fontWeight:600,marginTop:"10px"}}>{loadError}</p>}
          </div>
          <button onClick={startExam} disabled={generating} style={{width:"100%",padding:"15px",borderRadius:"12px",border:"none",background:generating?T.s3:T.primary,color:"#fff",fontSize:"15px",fontWeight:700,cursor:generating?"not-allowed":"pointer"}}>
            {generating?"Loading questions…":"Start Mock Exam"}
          </button>
        </div>

        <div style={{background:T.surface,borderRadius:"16px",border:`1px solid ${T.border}`,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <Trophy size={16} color={T.primary} strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"14px"}}>Past Results</span>
            </div>
            <div style={{fontSize:"12px",color:T.muted,marginTop:"4px"}}>250+ competitive · 200+ pass mark</div>
          </div>
          {shownHistory.length===0 ? (
            <div style={{padding:"20px",textAlign:"center",fontSize:"13px",color:T.sub}}>No mock exams yet — your first result will appear here.</div>
          ) : shownHistory.map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px",borderBottom:i<shownHistory.length-1?`1px solid ${T.border}`:"none"}}>
              <div>
                <div style={{fontSize:"14px",fontWeight:700,color:T.text}}>{h.score}/{h.total} correct</div>
                <div style={{fontSize:"12px",color:T.muted}}>{h.subjects ? `${h.subjects} subjects · ` : ""}{h.date}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"20px",fontWeight:900,color:h.jambEquivalent>=250?T.success:h.jambEquivalent>=200?T.warning:T.danger,letterSpacing:"-1px"}}>{h.jambEquivalent}</div>
                <div style={{fontSize:"12px",color:T.sub}}>JAMB score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── EXAM (no bottom nav — focus mode) ─────────────────────────
  if (phase==="exam") return (
    <div className="focus-page" style={{minHeight:"100vh", paddingTop:"0px",background:T.bg,fontFamily:"var(--font)",display:"flex",flexDirection:"column"}}>
      {/* Slim sticky bar: counter + answered count + timer + one orange Submit.
          The bar is capped to the content width below it (R4). Section pills
          and chips live in the bar only on tablet; on phone they open as an
          overlay, on laptop they live in the sticky rail beside the question. */}
      <div style={{background:"linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)",padding:"14px 0",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:1040,margin:"0 auto",padding:"0 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px"}}>{current+1} / {questions.length}</div>
            <div className="mock-bar-answered" style={{color:"rgba(255,255,255,0.75)",fontSize:"13px"}}>Answered {totalAnswered}/{questions.length}</div>
            <div style={{color:timerCol,fontSize:"22px",fontWeight:900,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.5px"}}>{fmt(timeLeft)}</div>
            <button onClick={()=>setShowSubmit(true)} style={{padding:"10px 18px",minHeight:44,display:"flex",alignItems:"center",borderRadius:"12px",border:"none",backgroundColor:T.accent,color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>
              Submit
            </button>
          </div>
          {timerLabel && (
            <div style={{color:timerCol,fontSize:"12px",fontWeight:700,textAlign:"center",marginTop:"6px"}}>{timerLabel}</div>
          )}
          <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.2)",overflow:"hidden",marginTop:"10px"}}>
            <div style={{height:"100%",width:`${timePct}%`,background:timerCol,transition:"width 1s linear"}} />
          </div>
          {/* Phone second row: answered count + palette button */}
          <div className="mock-bar-sub" style={{justifyContent:"space-between",alignItems:"center",marginTop:"10px"}}>
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px"}}>Answered {totalAnswered}/{questions.length}{skippedCount>0 ? ` · ${skippedCount} skipped` : ""}</div>
            <button onClick={()=>setShowPalette(true)} style={{display:"flex",alignItems:"center",gap:"6px",padding:"8px 12px",minHeight:44,borderRadius:"10px",border:"1px solid rgba(255,255,255,0.35)",background:"transparent",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>
              <LayoutGrid size={16} /> Question map
            </button>
          </div>
          {/* Tablet: pills + chips stay in the bar as scrolling rows */}
          <div className="mock-bar-pills" style={{marginTop:"10px"}}>{renderPills(true, false)}</div>
          <div className="mock-bar-chips" style={{marginTop:"10px"}}>{renderChips(true, "row")}</div>
          <div className="mock-bar-legend" style={{marginTop:"8px"}}>{renderLegend(true)}</div>
        </div>
      </div>

      <div className="mock-exam exam-body" style={{flex:1,padding:"16px 20px",overflowY:"auto"}}>
        <div style={{minWidth:0}}>
          {questions[current] && (
            <div>
              <div style={{background:T.surface,borderRadius:"16px",padding:"18px",marginBottom:"14px",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:"11px",color:T.primaryText,fontWeight:700,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{questions[current].subject}</div>
                {questions[current].image && (
                  <img src={questions[current].image} alt="Question diagram" style={{maxWidth:"100%",borderRadius:"10px",marginBottom:"10px",background:"#fff",padding:8,boxSizing:"border-box",display:"block"}} />
                )}
                <div style={{fontSize:"15px",color:T.text,fontWeight:600,lineHeight:"1.6"}}>{questions[current].question}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {questions[current].options.map((opt,i)=>(
                  <button key={i} onClick={()=>answerCurrent(i)} style={{
                    width:"100%",padding:"15px",borderRadius:"12px",
                    border:`2px solid ${answers[current]===i?T.primary:T.border}`,
                    background:answers[current]===i?"rgba(99,102,241,0.25)":T.surface,
                    color:answers[current]===i?"#fff":T.text,
                    fontWeight:answers[current]===i?700:500,fontSize:"14px",
                    cursor:"pointer",textAlign:"left",transition:"all 0.15s",
                    display:"flex",alignItems:"center",gap:"12px",
                  }}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:answers[current]===i?T.primary:T.s2,color:answers[current]===i?"#fff":T.sub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:700,flexShrink:0}}>
                      {["A","B","C","D"][i]}
                    </div>
                    {opt}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:"10px",marginTop:"14px"}}>
                <button onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0} style={{flex:1,padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:current===0?T.muted:T.text,fontWeight:700,cursor:current===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><ChevronLeft size={16}/> Prev</button>
                <button onClick={skipCurrent} style={{flex:1,padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.surface,color:T.sub,fontWeight:700,cursor:"pointer",fontSize:"13px"}}>
                  Skip
                </button>
                {current<questions.length-1?(
                  <button onClick={()=>setCurrent(c=>c+1)} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:T.primary,color:"#fff",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>Next <ChevronRight size={16}/></button>
                ):(
                  <button onClick={()=>setShowSubmit(true)} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:T.accent,color:"#fff",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><Check size={16} strokeWidth={2.5}/> Submit</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Laptop: sticky palette rail beside the question (P4 pattern) */}
        <aside className="mock-rail">
          <div style={{background:T.surface,borderRadius:"16px",padding:"16px",border:`1px solid ${T.border}`}}>
            <div style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"12px"}}>Question map</div>
            <div style={{marginBottom:"12px"}}>{renderPills(false, true)}</div>
            {renderChips(false, "grid")}
            <div style={{marginTop:"12px"}}>{renderLegend(false)}</div>
          </div>
        </aside>
      </div>

      {/* Phone palette overlay (bottom sheet; CSS hides it at tablet and up) */}
      {showPalette && (
        <div className="mock-overlay" onClick={()=>setShowPalette(false)}>
          <div className="mock-overlay-card" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"15px",fontWeight:700,color:T.text}}>Question map</span>
              <button onClick={()=>setShowPalette(false)} aria-label="Close question map" style={{width:44,height:44,borderRadius:"12px",border:`1px solid ${T.border}`,background:T.s2,color:T.text,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <X size={18} />
              </button>
            </div>
            <div style={{marginBottom:"12px"}}>{renderPills(false, true)}</div>
            {renderChips(false, "grid")}
            <div style={{marginTop:"12px"}}>{renderLegend(false)}</div>
            <div style={{fontSize:"12px",color:T.sub,marginTop:"12px"}}>Answered {totalAnswered} of {questions.length}{skippedCount>0 ? ` · ${skippedCount} skipped` : ""}</div>
          </div>
        </div>
      )}

      {/* Submit confirm sheet: one Submit treatment, always confirmed */}
      {showSubmit && (
        <div className="mock-sheet" onClick={()=>setShowSubmit(false)}>
          <div className="mock-sheet-card" onClick={e=>e.stopPropagation()} style={{background:T.surface,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:"17px",fontWeight:800,color:T.text,marginBottom:"8px"}}>Submit your mock?</div>
            <p style={{fontSize:"14px",color:T.sub,lineHeight:1.55,margin:"0 0 16px"}}>
              Answered {totalAnswered} of {questions.length}
              {skippedCount>0 ? ` · ${skippedCount} skipped (not scored)` : ""}
              {unansweredCount>0 ? ` · ${unansweredCount} unanswered will count as wrong` : ""}.
              Your time stops when you submit.
            </p>
            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>setShowSubmit(false)} style={{flex:1,padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:T.text,fontWeight:700,cursor:"pointer"}}>
                Keep writing
              </button>
              <button onClick={submitExam} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:T.accent,color:"#fff",fontWeight:700,cursor:"pointer"}}>
                Submit anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────
  if (phase==="result" && result) {
    const user = readUser();
    const targetNum = parseInt(user.target||"250");
    const gap = result.total400 - targetNum;
    const bestBefore = history.length > 1 ? Math.max(...history.slice(1).map(h => h.jambEquivalent)) : null;
    const flameRes = mockResultFlame(result.total400, bestBefore);
    const shortSections = sections.filter(s=>s.count<s.target);

    // Missed = answered wrong. Skipped = never answered (deliberately
    // skipped or never reached). The two are never mixed: a student who
    // skipped questions to manage time is not told they "missed" them.
    const missedIdx: number[] = [];
    const skippedIdx: number[] = [];
    questions.forEach((q, i) => {
      if (answers[i] === undefined) skippedIdx.push(i);
      else if (answers[i] !== q.correct) missedIdx.push(i);
    });
    const reviewList = [
      ...missedIdx.map(i => ({ i, kind: "missed" as const })),
      ...skippedIdx.map(i => ({ i, kind: "skipped" as const })),
    ];
    const shownReview = showAllMissed ? reviewList : reviewList.slice(0, 10);

    const reviewItem = (entry: { i: number; kind: "missed" | "skipped" }) => {
      const q = questions[entry.i];
      const isMissed = entry.kind === "missed";
      return (
        <div key={entry.i} style={{padding:"12px",borderRadius:"12px",background:isMissed?T.dangerTint:T.s2,border:`1px solid ${isMissed?"rgba(250,62,62,0.2)":T.border}`,marginBottom:"10px"}}>
          <div style={{fontSize:"11px",color:isMissed?T.danger:T.warning,fontWeight:700,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{q.subject}</div>
          <div style={{fontSize:"13px",color:T.text,fontWeight:600,marginBottom:"6px"}}>{q.question}</div>
          <div style={{fontSize:"12px",color:isMissed?T.dangerText:T.sub,fontWeight:600,display:"flex",alignItems:"center",gap:"5px"}}><XCircle size={16} color={isMissed?T.dangerText:T.sub} strokeWidth={2.5}/> {answers[entry.i]!==undefined ? `Your answer: ${"ABCD"[answers[entry.i]]} — ${q.options[answers[entry.i]]}` : "Your answer: — Not answered"}</div>
          <div style={{fontSize:"12px",color:T.successText,fontWeight:600,display:"flex",alignItems:"center",gap:"5px"}}><CheckCircle2 size={16} color={T.successText} strokeWidth={2.5}/> Correct answer: {"ABCD"[q.correct]} — {q.options[q.correct]}</div>
          <div style={{fontSize:"11px",color:T.muted,marginTop:"6px"}}>{q.explanation.replace("Question ", "Q")}</div>
          <Link href={`/ai?q=${encodeURIComponent(`Explain this JAMB ${q.subject} question (${q.explanation}): ${q.question} The correct answer is ${"ABCD"[q.correct]}: ${q.options[q.correct]}. Why is this correct and why are the others wrong?`)}`} style={{display:"inline-flex",alignItems:"center",gap:"6px",marginTop:"8px",color:T.primaryText,fontSize:"13px",fontWeight:700,textDecoration:"none"}}>
            <Bot size={16} strokeWidth={2} /> Ask AI to explain
          </Link>
        </div>
      );
    };

    return (
      <div style={{minHeight:"100vh", paddingTop:NAVBAR_HEIGHT,background:T.bg,fontFamily:"var(--font)"}}>
        <div style={{background:"linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)",padding:"28px 20px 44px",textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:"18px",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <Trophy size={30} color={T.accent} strokeWidth={1.8} />
          </div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px",marginBottom:"4px"}}>Mock score (out of 400)</div>
          {result.max400<400 && (
            <div style={{display:"inline-block",background:T.warningTint,color:T.warning,fontSize:"13px",fontWeight:700,padding:"8px 12px",borderRadius:"8px",marginBottom:"10px"}}>Scored out of {result.max400} — {result.missing.join(", ")} not included</div>
          )}
          <div style={{color:"#fff",fontSize:"52px",fontWeight:900,letterSpacing:"-2px"}}>{result.total400}<span style={{fontSize:"22px",color:"rgba(255,255,255,0.6)"}}>/{result.max400}</span></div>
          <div style={{color:"rgba(255,255,255,0.85)",fontSize:"14px",marginTop:"4px"}}>Each subject scored out of 100, then added up.</div>
          <div style={{color:T.accent,fontSize:"16px",fontWeight:700,marginTop:"4px"}}>{result.score}/{result.total} questions correct</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Flame stage={readFlameStage()} heat={50} mood={flameRes.mood} speech={flameRes.speech} size={44} />
          </div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px",marginTop:"6px"}}>
            Target {targetNum} · {gap>=0 ? `${gap} pts above target` : `${Math.abs(gap)} pts below target`}
          </div>
          {shortSections.length>0 && (
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:"12px",marginTop:"4px"}}>
              {shortSections.map(s=>`${s.label} had ${s.count} of ${s.target} questions available`).join(" · ")}
            </div>
          )}
        </div>

        <div className="page-narrow mock-page-pad" style={{padding:"0 20px",marginTop:"-16px"}}>
          {/* Subject breakdown — each subject out of 100, the JAMB way */}
          <div style={{background:T.surface,borderRadius:"16px",padding:"20px",marginBottom:"14px",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
              <BarChart3 size={17} color={T.primary} strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"15px"}}>Subject Breakdown</span>
            </div>
            {Object.entries(result.bySubject).map(([s,d], idx)=>{
              const sp=d.score100;
              const col = sp>=70 ? T.success : sp>=50 ? T.warning : T.danger;
              const verdict = sp>=70 ? "Strong" : sp>=50 ? "Fair" : "Weak";
              return (
                <div key={s} style={{marginBottom:"12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"5px"}}>
                    <span style={{color:T.text,fontWeight:600}}>{s}</span>
                    <span style={{color:col,fontWeight:700}}>{d.correct}/{d.total} · {sp}/100 · {verdict}</span>
                  </div>
                  <div style={{height:"8px",borderRadius:"4px",background:T.s3,overflow:"hidden",position:"relative"}}>
                    <div style={{height:"100%",width:`${sp}%`,background:col,transition:"width 0.5s"}} />
                    <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:"rgba(255,255,255,0.25)"}} />
                    <div style={{position:"absolute",left:"70%",top:0,bottom:0,width:1,background:"rgba(255,255,255,0.25)"}} />
                  </div>
                  {idx===0 && (
                    <div style={{position:"relative",height:"14px",marginTop:"2px"}}>
                      <span style={{position:"absolute",left:"50%",transform:"translateX(-50%)",fontSize:"10px",color:T.muted}}>50</span>
                      <span style={{position:"absolute",left:"70%",transform:"translateX(-50%)",fontSize:"10px",color:T.muted}}>70</span>
                    </div>
                  )}
                </div>
              );
            })}
            {result.missing.map((m)=>(
              <div key={m} style={{marginBottom:"12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"5px"}}>
                  <span style={{color:T.muted,fontWeight:600}}>{m} — not included (no questions in the bank)</span>
                </div>
                <div style={{height:"8px",borderRadius:"4px",background:T.s3,overflow:"hidden"}} />
              </div>
            ))}
          </div>

          {/* Missed vs skipped — your answer, the correct answer, provenance only */}
          <div style={{background:T.surface,borderRadius:"16px",padding:"20px",marginBottom:"14px",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
              <AlertTriangle size={17} color={T.warning} strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"15px"}}>Questions you missed ({missedIdx.length}) · {skippedIdx.length} skipped</span>
            </div>
            {reviewList.length===0 ? (
              <div style={{textAlign:"center",padding:"20px",color:T.successText,fontWeight:700,fontSize:"15px"}}>Perfect score — {result.total}/{result.total} correct.</div>
            ) : (
              <div>
                {shownReview.some(r=>r.kind==="missed") && (
                  <div style={{fontSize:"13px",fontWeight:700,color:T.dangerText,margin:"4px 0 10px"}}>Missed</div>
                )}
                {shownReview.filter(r=>r.kind==="missed").map(reviewItem)}
                {shownReview.some(r=>r.kind==="skipped") && (
                  <div style={{fontSize:"13px",fontWeight:700,color:T.warning,margin:"4px 0 10px"}}>Skipped</div>
                )}
                {shownReview.filter(r=>r.kind==="skipped").map(reviewItem)}
                {reviewList.length>10 && (
                  <button onClick={()=>setShowAllMissed(v=>!v)} style={{width:"100%",padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:T.text,fontWeight:700,cursor:"pointer",marginTop:"2px"}}>
                    {showAllMissed ? "Show less" : `Show all ${reviewList.length}`}
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <button onClick={()=>{setPhase("setup");setResult(null);setQuestions([]);setSections([]);setAnswers({});setSkipped({});}} style={{padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:T.text,fontWeight:700,cursor:"pointer"}}>
              Back to setup
            </button>
            <Link href="/studyplan" style={{padding:"13px",borderRadius:"12px",border:"none",background:T.primary,color:"#fff",fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              Study Plan <ArrowRight size={14} strokeWidth={2}/>
            </Link>
          </div>
        </div>
        </div>
    );
  }
  return null;
}
