"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, CheckCircle2, Clock, PartyPopper, ArrowRight, ClipboardList, Trophy, BarChart3, AlertTriangle } from "lucide-react";
import { NAVBAR_HEIGHT } from "../components/NavbarView";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavView";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";
import { Sync } from "../lib/sync";
import { Flame } from "../components/Flame";
import { mockResultFlame, readFlameStage } from "../lib/flame";

interface Question { id:number; subject:string; question:string; options:string[]; correct:number; explanation:string; image?:string; }
interface Section  { id:string; label:string; target:number; start:number; count:number; }
interface Result   { score:number; total:number; total400:number; max400:number; bySubject:Record<string,{correct:number;total:number;score100:number}>; timeTaken:number; missing:string[]; }

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
  const [timeLeft,  setTimeLeft]  = useState(TOTAL_TIME);
  const [result,    setResult]    = useState<Result|null>(null);
  const [generating,setGenerating]= useState(false);
  const [loadError, setLoadError] = useState("");
  const [planInfo]                = useState(buildPlan);
  const [history,   setHistory]   = useState<{score:number;total:number;jambEquivalent:number;date:string}[]>(() => {
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
    setTimeLeft(TOTAL_TIME); setAnswers({}); setCurrent(0); setPhase("exam"); setGenerating(false);
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
    const newH=[{score,total:questions.length,jambEquivalent:total400,date:new Date().toLocaleDateString()},...history].slice(0,10);
    localStorage.setItem("mock_history",JSON.stringify(newH)); setHistory(newH);
    Sync.push("mock_history");
  };

  submitRef.current = submitExam; // timer auto-submits when time runs out
  const fmt = (s:number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const timePct = (timeLeft/TOTAL_TIME)*100;
  const timerCol = timePct>50?"#31A24C":timePct>25?"#F7B928":"#FA3E3E";

  const T = palette(dark);

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
          setAnswers(p => ({ ...p, [current]: i }));
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
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>Real JAMB past questions</div>
          </div>
        </div>
      </div>

      <div className="page-narrow" style={{padding:"16px 20px 100px"}}>
        <div style={{background:T.surface,borderRadius:"16px",padding:"24px",border:`1px solid ${T.border}`,marginBottom:"14px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{width:64,height:64,borderRadius:"18px",background:T.primaryTint,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
              <ClipboardList size={28} color={T.primary} strokeWidth={1.8} />
            </div>
            <h2 style={{fontSize:"20px",fontWeight:800,color:T.text,margin:"0 0 8px",letterSpacing:"-0.3px"}}>JAMB Mock Exam</h2>
            <p style={{fontSize:"13px",color:T.sub,margin:0,lineHeight:"1.5"}}>The full UTME paper, exactly as JAMB sets it: four subjects in sections, one 2-hour sitting, every subject scored out of 100 for a total out of 400.</p>
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
            <p style={{fontSize:"11px",color:T.sub,marginTop:"8px",display:"flex",alignItems:"center",gap:"4px"}}><Clock size={11} strokeWidth={2}/> 2 hours for the whole paper, like the real exam. If a subject has no questions in the bank yet, its section is skipped and your total is scored out of what remains — the result says so plainly.</p>
            {loadError && <p style={{fontSize:"12px",color:T.dangerText,fontWeight:600,marginTop:"10px"}}>{loadError}</p>}
          </div>
          <button onClick={startExam} disabled={generating} style={{width:"100%",padding:"15px",borderRadius:"12px",border:"none",background:generating?T.s3:T.primary,color:"#fff",fontSize:"15px",fontWeight:700,cursor:generating?"not-allowed":"pointer"}}>
            {generating?"Loading questions…":"Start Mock Exam"}
          </button>
        </div>

        {history.length>0 && (
          <div style={{background:T.surface,borderRadius:"16px",border:`1px solid ${T.border}`,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"8px"}}>
              <Trophy size={16} color={T.primary} strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"14px"}}>Past Results</span>
            </div>
            {history.slice(0,3).map((h,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
                <div>
                  <div style={{fontSize:"14px",fontWeight:700,color:T.text}}>{h.score}/{h.total} correct</div>
                  <div style={{fontSize:"11px",color:T.sub}}>{h.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"20px",fontWeight:900,color:h.jambEquivalent>=250?"#31A24C":h.jambEquivalent>=200?"#F7B928":"#FA3E3E",letterSpacing:"-1px"}}>{h.jambEquivalent}</div>
                  <div style={{fontSize:"10px",color:T.sub}}>JAMB equiv.</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── EXAM (no bottom nav — focus mode) ─────────────────────────
  if (phase==="exam") return (
    <div className="focus-page" style={{minHeight:"100vh", paddingTop:"0px",background:T.bg,fontFamily:"var(--font)",display:"flex",flexDirection:"column"}}>
      {/* Sticky timer bar */}
      <div style={{background:"linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)",padding:"14px 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px"}}>{current+1} / {questions.length}</div>
          <div style={{color:"#fff",fontSize:"22px",fontWeight:900,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.5px"}}>{fmt(timeLeft)}</div>
          <button onClick={submitExam} style={{padding:"6px 16px",minHeight:40,display:"flex",alignItems:"center",borderRadius:"20px",border:"none",backgroundColor:"rgba(255,255,255,0.2)",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>
            Submit
          </button>
        </div>
        <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.2)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${timePct}%`,background:timerCol,transition:"width 1s linear"}} />
        </div>
        {/* Subject sections — the paper is grouped by subject, like real JAMB */}
        <div style={{display:"flex",gap:"6px",marginTop:"10px",overflowX:"auto",scrollbarWidth:"none"}}>
          {sections.map((s,i)=>(
            <button key={s.id} onClick={()=>setCurrent(s.start)} style={{flexShrink:0,padding:"7px 12px",minHeight:36,borderRadius:999,border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"inherit",background:i===activeSec?"#fff":"rgba(255,255,255,0.15)",color:i===activeSec?T.primaryDark:"#fff"}}>
              {s.label} · {answeredIn(s)}/{s.count}
            </button>
          ))}
        </div>
        {activeSection && (
          <div className="q-chips" style={{display:"flex",gap:"4px",marginTop:"10px",overflowX:"auto",scrollbarWidth:"none"}}>
            {Array.from({length: activeSection.count}, (_,k)=>{ const i=activeSection.start+k; return (
              <button key={i} onClick={()=>setCurrent(i)} style={{width:36,height:36,borderRadius:"8px",border:"none",background:i===current?"#fff":answers[i]!==undefined?"rgba(255,255,255,0.55)":"rgba(255,255,255,0.15)",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,color:i===current?T.primary:"rgba(255,255,255,0.8)",fontFamily:"inherit"}}>
                {k+1}
              </button>
            );})}
          </div>
        )}
      </div>

      <div className="page-narrow exam-body" style={{flex:1,padding:"16px",overflowY:"auto"}}>
        {questions[current] && (
          <div>
            <div style={{background:T.surface,borderRadius:"14px",padding:"18px",marginBottom:"14px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:"11px",color:T.primary,fontWeight:700,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{questions[current].subject}</div>
              {questions[current].image && (
                <img src={questions[current].image} alt="Question diagram" style={{maxWidth:"100%",borderRadius:"10px",marginBottom:"10px",background:"#fff",padding:8,boxSizing:"border-box",display:"block"}} />
              )}
              <div style={{fontSize:"15px",color:T.text,fontWeight:600,lineHeight:"1.6"}}>{questions[current].question}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
              {questions[current].options.map((opt,i)=>(
                <button key={i} onClick={()=>setAnswers(p=>({...p,[current]:i}))} style={{
                  width:"100%",padding:"15px",borderRadius:"12px",
                  border:`2px solid ${answers[current]===i?T.primary:T.border}`,
                  background:answers[current]===i?T.primaryTint:T.surface,
                  color:answers[current]===i?T.primary:T.text,
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
              {current<questions.length-1?(
                <button onClick={()=>setCurrent(c=>c+1)} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:T.primary,color:"#fff",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>Next <ChevronRight size={16}/></button>
              ):(
                <button onClick={submitExam} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:"#31A24C",color:"#fff",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><Check size={16} strokeWidth={2.5}/> Submit</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────
  if (phase==="result" && result) {
    const user = readUser();
    const gap = result.total400 - parseInt(user.target||"250");
    const bestBefore = history.length > 1 ? Math.max(...history.slice(1).map(h => h.jambEquivalent)) : null;
    const flameRes = mockResultFlame(result.total400, bestBefore);
    const shortSections = sections.filter(s=>s.count<s.target);

    return (
      <div style={{minHeight:"100vh", paddingTop:NAVBAR_HEIGHT,background:T.bg,fontFamily:"var(--font)"}}>
        <div style={{background:"linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)",padding:"28px 20px 44px",textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:"18px",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <Trophy size={30} color="#F97316" strokeWidth={1.8} />
          </div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px",marginBottom:"4px"}}>Your JAMB Score</div>
          <div style={{color:"#fff",fontSize:"52px",fontWeight:900,letterSpacing:"-2px"}}>{result.total400}<span style={{fontSize:"22px",color:"rgba(255,255,255,0.6)"}}>/{result.max400}</span></div>
          <div style={{color:"#F97316",fontSize:"16px",fontWeight:700,marginTop:"4px"}}>{result.score}/{result.total} questions correct</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Flame stage={readFlameStage()} heat={50} mood={flameRes.mood} speech={flameRes.speech} size={88} />
          </div>
          {result.max400===400 ? (
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px",marginTop:"6px"}}>
              {gap>=0 ? `${gap} pts above your target!` : `${Math.abs(gap)} pts below your target — keep practising`}
            </div>
          ) : (
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px",marginTop:"6px"}}>
              Scored out of {result.max400}, not 400 — {result.missing.length ? `${result.missing.join(", ")} not included (no questions in the bank yet).` : "one subject section was unavailable."}
            </div>
          )}
          {shortSections.length>0 && (
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:"12px",marginTop:"4px"}}>
              {shortSections.map(s=>`${s.label} had ${s.count} of ${s.target} questions available`).join(" · ")}
            </div>
          )}
        </div>

        <div style={{padding:"0 20px",marginTop:"-16px",paddingBottom:`calc(${BOTTOM_NAV_HEIGHT}px + 16px)`}}>
          {/* Subject breakdown — each subject out of 100, the JAMB way */}
          <div style={{background:T.surface,borderRadius:"16px",padding:"20px",marginBottom:"14px",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
              <BarChart3 size={17} color={T.primary} strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"15px"}}>Subject Breakdown</span>
            </div>
            {Object.entries(result.bySubject).map(([s,d])=>{
              const sp=d.score100;
              return (
                <div key={s} style={{marginBottom:"12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"5px"}}>
                    <span style={{color:T.text,fontWeight:600}}>{s}</span>
                    <span style={{color:sp>=70?"#31A24C":sp>=50?"#F7B928":"#FA3E3E",fontWeight:700}}>{d.correct}/{d.total} · {sp}/100</span>
                  </div>
                  <div style={{height:"6px",borderRadius:"3px",background:T.s3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${sp}%`,background:sp>=70?"#31A24C":sp>=50?"#F7B928":"#FA3E3E",transition:"width 0.5s"}} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Missed questions */}
          <div style={{background:T.surface,borderRadius:"16px",padding:"20px",marginBottom:"14px",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
              <AlertTriangle size={17} color="#F7B928" strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"15px"}}>Questions You Missed</span>
            </div>
            {questions.map((q,i)=>answers[i]!==q.correct&&(
              <div key={i} style={{padding:"12px",borderRadius:"12px",background:T.dangerTint,border:`1px solid ${T.danger}33`,marginBottom:"10px"}}>
                <div style={{fontSize:"11px",color:"#FA3E3E",fontWeight:700,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{q.subject}</div>
                <div style={{fontSize:"13px",color:T.text,fontWeight:600,marginBottom:"6px"}}>{q.question}</div>
                <div style={{fontSize:"12px",color:"#2FBF71",fontWeight:600,display:"flex",alignItems:"center",gap:"5px"}}><CheckCircle2 size={13} color="#2FBF71" strokeWidth={2.5}/> {q.options[q.correct]}</div>
                <div style={{fontSize:"12px",color:T.sub,marginTop:"4px"}}>{q.explanation}</div>
              </div>
            ))}
            {result.score===result.total && <div style={{textAlign:"center",padding:"20px",color:"#2FBF71",fontWeight:700,fontSize:"15px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}><PartyPopper size={16} strokeWidth={2}/> Perfect score! No mistakes!</div>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <button onClick={()=>{setPhase("setup");setResult(null);setQuestions([]);setSections([]);setAnswers({});}} style={{padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:T.text,fontWeight:700,cursor:"pointer"}}>
              Try Again
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
