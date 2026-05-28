"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ClipboardList, Trophy, BarChart3, AlertTriangle } from "lucide-react";
import Navbar, { NAVBAR_HEIGHT } from "../components/Navbar";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { C, palette } from "../lib/design";

interface Question { id:number; subject:string; question:string; options:string[]; correct:number; explanation:string; }
interface Result   { score:number; total:number; bySubject:Record<string,{correct:number;total:number}>; timeTaken:number; }

const FALLBACK: Question[] = [
  {id:1,subject:"Mathematics",question:"If 2x + 3 = 11, find x.",options:["2","3","4","5"],correct:2,explanation:"2x = 8, x = 4"},
  {id:2,subject:"English Language",question:"Choose the word closest in meaning to 'Benevolent'.",options:["Cruel","Kind","Stingy","Harsh"],correct:1,explanation:"Benevolent means kind and generous"},
  {id:3,subject:"Physics",question:"Which of these is a vector quantity?",options:["Mass","Temperature","Velocity","Speed"],correct:2,explanation:"Velocity has both magnitude and direction"},
  {id:4,subject:"Chemistry",question:"The atomic number of Carbon is:",options:["6","12","14","8"],correct:0,explanation:"Carbon has 6 protons"},
  {id:5,subject:"Biology",question:"Which organelle is called the powerhouse of the cell?",options:["Nucleus","Ribosome","Mitochondria","Golgi body"],correct:2,explanation:"Mitochondria produces ATP energy"},
  {id:6,subject:"Mathematics",question:"Area of a circle with radius 7cm (π=22/7):",options:["44cm²","154cm²","22cm²","176cm²"],correct:1,explanation:"π×7²=154cm²"},
  {id:7,subject:"English Language",question:"'The wind whispered through the trees' is:",options:["Simile","Metaphor","Personification","Hyperbole"],correct:2,explanation:"Attributing human quality to wind"},
  {id:8,subject:"Physics",question:"SI unit of electric current:",options:["Volt","Watt","Ampere","Ohm"],correct:2,explanation:"Ampere (A)"},
  {id:9,subject:"Chemistry",question:"Gas produced when zinc reacts with dilute H₂SO₄:",options:["Oxygen","Carbon dioxide","Hydrogen","Nitrogen"],correct:2,explanation:"Zn+H₂SO₄→ZnSO₄+H₂"},
  {id:10,subject:"Biology",question:"Universal blood donor:",options:["A","B","AB","O"],correct:3,explanation:"Group O donates to all"},
];

export default function MockExam() {
  const [mounted,   setMounted]   = useState(false);
  const [dark,      setDark]      = useState(false);
  const [phase,     setPhase]     = useState<"setup"|"exam"|"result">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<Record<number,number>>({});
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [result,    setResult]    = useState<Result|null>(null);
  const [generating,setGenerating]= useState(false);
  const [numQ,      setNumQ]      = useState(10);
  const [history,   setHistory]   = useState<{score:number;total:number;jambEquivalent:number;date:string}[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => {
    setMounted(true);
    setDark(localStorage.getItem("darkMode")==="true");
    try { setHistory(JSON.parse(localStorage.getItem("mock_history")||"[]")); } catch {}
  }, []);

  useEffect(() => {
    if (phase==="exam" && timeLeft>0) {
      timerRef.current = setInterval(()=>setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current!);submitExam();return 0;}
        return t-1;
      }), 1000);
    }
    return ()=>{if(timerRef.current)clearInterval(timerRef.current);};
  }, [phase]);

  const startExam = async () => {
    setGenerating(true);
    const user = (() => { try { return JSON.parse(localStorage.getItem("companion_user")||"{}"); } catch { return {}; }})();
    const subjects = user.subjects || ["Mathematics","English Language","Physics","Chemistry","Biology"];
    try {
      const res  = await fetch("/api/chat", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:`Generate exactly ${numQ} JAMB MCQs for: ${subjects.join(", ")}. Return ONLY JSON array: [{id,subject,question,options:[A,B,C,D],correct,explanation}] correct is 0-indexed.`})});
      const data = await res.json();
      const match = (data.reply||"").match(/\[[\s\S]*\]/);
      if(match){ const p=JSON.parse(match[0]); if(Array.isArray(p)&&p.length) setQuestions(p); else setQuestions(FALLBACK.slice(0,numQ)); }
      else setQuestions(FALLBACK.slice(0,numQ));
    } catch { setQuestions(FALLBACK.slice(0,numQ)); }
    setTimeLeft(numQ*90); setAnswers({}); setCurrent(0); setPhase("exam"); setGenerating(false);
  };

  const submitExam = () => {
    if(timerRef.current) clearInterval(timerRef.current);
    let score=0; const bySubject:Record<string,{correct:number;total:number}>={};
    questions.forEach((q,i)=>{
      if(!bySubject[q.subject]) bySubject[q.subject]={correct:0,total:0};
      bySubject[q.subject].total++;
      if(answers[i]===q.correct){score++;bySubject[q.subject].correct++;}
    });
    const res:Result={score,total:questions.length,bySubject,timeTaken:(numQ*90)-timeLeft};
    setResult(res); setPhase("result");
    const jambEq=Math.round((score/questions.length)*400);
    const newH=[{score,total:questions.length,jambEquivalent:jambEq,date:new Date().toLocaleDateString()},...history].slice(0,10);
    localStorage.setItem("mock_history",JSON.stringify(newH)); setHistory(newH);
  };

  const fmt = (s:number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const timePct = questions.length?(timeLeft/(questions.length*90))*100:100;
  const timerCol = timePct>50?"#31A24C":timePct>25?"#F7B928":"#FA3E3E";

  if (!mounted) return null;
  const T = palette(dark);

  // ── SETUP ──────────────────────────────────────────────────────
  if (phase==="setup") return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"}}>
      <Navbar darkMode={dark} onToggleDark={()=>{const n=!dark;setDark(n);localStorage.setItem("darkMode",String(n));}} />

      <div style={{background:dark?"linear-gradient(135deg,#1A2A4A,#1877F2)":"linear-gradient(135deg,#1877F2,#0C5FD1)",padding:"20px 20px 32px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <Link href="/" style={{width:34,height:34,borderRadius:"10px",backgroundColor:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}>
            <ArrowLeft size={16} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:"18px"}}>Mock Exam</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>AI-generated JAMB simulation</div>
          </div>
        </div>
      </div>

      <div style={{padding:"16px 14px 100px"}}>
        <div style={{background:T.surface,borderRadius:"16px",padding:"24px",border:`1px solid ${T.border}`,marginBottom:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{width:64,height:64,borderRadius:"18px",background:C.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
              <ClipboardList size={28} color={C.primary} strokeWidth={1.8} />
            </div>
            <h2 style={{fontSize:"20px",fontWeight:800,color:T.text,margin:"0 0 8px",letterSpacing:"-0.3px"}}>JAMB Mock Exam</h2>
            <p style={{fontSize:"13px",color:T.sub,margin:0,lineHeight:"1.5"}}>AI generates questions from your subjects. Timer runs like real JAMB. Full debrief after.</p>
          </div>
          <div style={{marginBottom:"20px"}}>
            <label style={{fontSize:"12px",fontWeight:700,color:T.sub,display:"block",marginBottom:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Number of Questions</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
              {[10,20,30,40].map(n=>(
                <button key={n} onClick={()=>setNumQ(n)} style={{padding:"12px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:700,fontSize:"14px",background:numQ===n?C.primary:T.s2,color:numQ===n?"#fff":T.sub,transition:"all 0.2s"}}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{fontSize:"11px",color:T.sub,marginTop:"8px",textAlign:"center"}}>⏱ {Math.round(numQ*1.5)} minutes · {numQ} questions</p>
          </div>
          <button onClick={startExam} disabled={generating} style={{width:"100%",padding:"15px",borderRadius:"12px",border:"none",background:generating?"#ccc":C.primary,color:"#fff",fontWeight:700,fontSize:"15px",cursor:generating?"not-allowed":"pointer",boxShadow:generating?"none":`0 4px 14px rgba(24,119,242,0.35)`}}>
            {generating?"🤖 Generating questions…":"Start Mock Exam →"}
          </button>
        </div>

        {history.length>0 && (
          <div style={{background:T.surface,borderRadius:"16px",border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"8px"}}>
              <Trophy size={16} color={C.primary} strokeWidth={1.8} />
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
      <BottomNav darkMode={dark} />
    </div>
  );

  // ── EXAM (no bottom nav — focus mode) ─────────────────────────
  if (phase==="exam") return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",display:"flex",flexDirection:"column"}}>
      {/* Sticky timer bar */}
      <div style={{background:dark?"linear-gradient(135deg,#111,#1A2A4A)":"linear-gradient(135deg,#1877F2,#0C5FD1)",padding:"14px 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px"}}>{current+1} / {questions.length}</div>
          <div style={{color:"#fff",fontSize:"22px",fontWeight:900,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.5px"}}>{fmt(timeLeft)}</div>
          <button onClick={submitExam} style={{padding:"6px 14px",borderRadius:"20px",border:"none",backgroundColor:"rgba(255,255,255,0.2)",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>
            Submit
          </button>
        </div>
        <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.2)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${timePct}%`,background:timerCol,transition:"width 1s linear"}} />
        </div>
        <div style={{display:"flex",gap:"4px",marginTop:"10px",overflowX:"auto",scrollbarWidth:"none"}}>
          {questions.map((_,i)=>(
            <div key={i} onClick={()=>setCurrent(i)} style={{width:24,height:24,borderRadius:"6px",background:i===current?"#fff":answers[i]!==undefined?"rgba(255,255,255,0.55)":"rgba(255,255,255,0.15)",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,color:i===current?C.primary:"rgba(255,255,255,0.8)"}}>
              {i+1}
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,padding:"16px",overflowY:"auto"}}>
        {questions[current] && (
          <div>
            <div style={{background:T.surface,borderRadius:"14px",padding:"18px",marginBottom:"14px",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:"11px",color:C.primary,fontWeight:700,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{questions[current].subject}</div>
              <div style={{fontSize:"15px",color:T.text,fontWeight:600,lineHeight:"1.6"}}>{questions[current].question}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
              {questions[current].options.map((opt,i)=>(
                <button key={i} onClick={()=>setAnswers(p=>({...p,[current]:i}))} style={{
                  width:"100%",padding:"15px",borderRadius:"12px",
                  border:`2px solid ${answers[current]===i?C.primary:T.border}`,
                  background:answers[current]===i?C.primaryLight:T.surface,
                  color:answers[current]===i?C.primary:T.text,
                  fontWeight:answers[current]===i?700:500,fontSize:"14px",
                  cursor:"pointer",textAlign:"left",transition:"all 0.15s",
                  display:"flex",alignItems:"center",gap:"12px",
                }}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:answers[current]===i?C.primary:T.s2,color:answers[current]===i?"#fff":T.sub,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:700,flexShrink:0}}>
                    {["A","B","C","D"][i]}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:"10px",marginTop:"14px"}}>
              <button onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0} style={{flex:1,padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:current===0?T.muted:T.text,fontWeight:700,cursor:current===0?"not-allowed":"pointer"}}>← Prev</button>
              {current<questions.length-1?(
                <button onClick={()=>setCurrent(c=>c+1)} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:C.primary,color:"#fff",fontWeight:700,cursor:"pointer",boxShadow:`0 2px 8px rgba(24,119,242,0.3)`}}>Next →</button>
              ):(
                <button onClick={submitExam} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:"#31A24C",color:"#fff",fontWeight:700,cursor:"pointer"}}>Submit ✓</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────
  if (phase==="result" && result) {
    const pct = Math.round((result.score/result.total)*100);
    const jambEq = Math.round((result.score/result.total)*400);
    const user = (()=>{ try{return JSON.parse(localStorage.getItem("companion_user")||"{}");} catch{return {};} })();
    const gap = jambEq - parseInt(user.target||"250");

    return (
      <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"}}>
        <div style={{background:dark?"linear-gradient(135deg,#1A2A4A,#1877F2)":"linear-gradient(135deg,#1877F2,#0C5FD1)",padding:"28px 20px 44px",textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:"18px",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <Trophy size={30} color="#FFF8DB" strokeWidth={1.8} />
          </div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px",marginBottom:"4px"}}>Your Score</div>
          <div style={{color:"#fff",fontSize:"52px",fontWeight:900,letterSpacing:"-2px"}}>{result.score}/{result.total}</div>
          <div style={{color:"#FFF8DB",fontSize:"16px",fontWeight:700,marginTop:"4px"}}>{pct}% · JAMB equivalent: {jambEq}</div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:"13px",marginTop:"6px"}}>
            {gap>=0 ? `✅ ${gap} pts above your target!` : `⚠️ ${Math.abs(gap)} pts below your target`}
          </div>
        </div>

        <div style={{padding:"0 14px",marginTop:"-16px",paddingBottom:`calc(${BOTTOM_NAV_HEIGHT}px + 16px)`}}>
          {/* Subject breakdown */}
          <div style={{background:T.surface,borderRadius:"16px",padding:"20px",marginBottom:"14px",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
              <BarChart3 size={17} color={C.primary} strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"15px"}}>Subject Breakdown</span>
            </div>
            {Object.entries(result.bySubject).map(([s,d])=>{
              const sp=Math.round((d.correct/d.total)*100);
              return (
                <div key={s} style={{marginBottom:"12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"5px"}}>
                    <span style={{color:T.text,fontWeight:600}}>{s}</span>
                    <span style={{color:sp>=70?"#31A24C":sp>=50?"#F7B928":"#FA3E3E",fontWeight:700}}>{d.correct}/{d.total}</span>
                  </div>
                  <div style={{height:"6px",borderRadius:"3px",background:T.s3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${sp}%`,background:sp>=70?"#31A24C":sp>=50?"#F7B928":"#FA3E3E",transition:"width 0.5s"}} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Missed questions */}
          <div style={{background:T.surface,borderRadius:"16px",padding:"20px",marginBottom:"14px",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
              <AlertTriangle size={17} color="#F7B928" strokeWidth={1.8} />
              <span style={{fontWeight:700,color:T.text,fontSize:"15px"}}>Questions You Missed</span>
            </div>
            {questions.map((q,i)=>answers[i]!==q.correct&&(
              <div key={i} style={{padding:"12px",borderRadius:"12px",background:dark?"#2A1010":"#FEE2E2",border:"1px solid #FA3E3E33",marginBottom:"10px"}}>
                <div style={{fontSize:"11px",color:"#FA3E3E",fontWeight:700,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{q.subject}</div>
                <div style={{fontSize:"13px",color:T.text,fontWeight:600,marginBottom:"6px"}}>{q.question}</div>
                <div style={{fontSize:"12px",color:"#31A24C",fontWeight:600}}>✅ {q.options[q.correct]}</div>
                <div style={{fontSize:"12px",color:T.sub,marginTop:"4px"}}>{q.explanation}</div>
              </div>
            ))}
            {result.score===result.total && <div style={{textAlign:"center",padding:"20px",color:"#31A24C",fontWeight:700,fontSize:"15px"}}>🎉 Perfect score! No mistakes!</div>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <button onClick={()=>{setPhase("setup");setResult(null);setQuestions([]);setAnswers({});}} style={{padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:T.text,fontWeight:700,cursor:"pointer"}}>
              Try Again
            </button>
            <Link href="/studyplan" style={{padding:"13px",borderRadius:"12px",border:"none",background:C.primary,color:"#fff",fontWeight:700,textDecoration:"none",textAlign:"center",display:"block",boxShadow:`0 2px 8px rgba(24,119,242,0.3)`}}>
              Study Plan →
            </Link>
          </div>
        </div>
        <BottomNav darkMode={dark} />
      </div>
    );
  }
  return null;
}
