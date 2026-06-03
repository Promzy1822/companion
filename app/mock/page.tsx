"use client";
import Layout from "../components/Layout";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, ClipboardList, Trophy, BarChart3, AlertTriangle
} from "lucide-react";
import Layout from "../components/Layout";

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

  return (
    <Layout title="Mock Exam" darkMode={dark} onToggleDark={()=>{const n=!dark;setDark(n);localStorage.setItem("darkMode",String(n));}} showNavbar={phase !== "exam"} showBottomNav={phase !== "exam"}>
      {/* Page content */}
      <div className="flex-1 w-full overflow-y-auto p-6 pt-10 pb-6"
           style={{ paddingTop: "80px", paddingBottom: "20px" }}>

        // ── SETUP ──────────────────────────────────────────────────────
        {phase === "setup" && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <Link href="/" className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center hover:bg-surface3 transition-colors">
                  <ArrowLeft size={16} color={dark ? '#E4E6EB' : '#050505'} strokeWidth={2} />
                </Link>
                <div>
                  <div className="font-bold text-xl">Mock Exam</div>
                  <div className="text-sm text-muted">AI-generated JAMB simulation</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface rounded-lg border border-surface2/20 p-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <ClipboardList size={28} color="#1877F2" strokeWidth={1.8} />
                  </div>
                  <h2 className="font-semibold text-center text-lg">JAMB Mock Exam</h2>
                  <p className="text-center text-muted">AI generates questions from your subjects. Timer runs like real JAMB. Full debrief after.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-muted mb-1">Number of Questions</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10,20,30,40].map(n=>(
                      <button key={n} onClick={()=>setNumQ(n)} className={`px-4 py-2 rounded-lg font-medium
                        ${numQ===n ? 'bg-primary text-white' : 'bg-surface2 text-muted hover:bg-surface2/50'}
                        transition-colors`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted text-center mt-1">
                    ⏱ {Math.round(numQ*1.5)} minutes · {numQ} questions
                  </p>
                </div>

                <button onClick={startExam} disabled={generating} className={`w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors
                  ${generating ? 'bg-surface2 text-muted cursor-not-allowed' : ''}`}>
                  {generating?"🤖 Generating questions…":"Start Mock Exam →"}
                </button>
              </div>

              {history.length>0 && (
                <div className="mt-4">
                  <div className="bg-surface rounded-lg border border-surface2/20">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-surface2/20">
                      <Trophy size={16} color="#1877F2" strokeWidth={1.8} />
                      <span className="font-medium">Past Results</span>
                    </div>
                    <div className="space-y-2">
                      {history.slice(0,3).map((h,i)=>(
                        <div key={i} className={`border-t border-surface2/20 py-3 first:border-t-0 flex justify-between items-center`}>
                          <div>
                            <div className="font-medium">{h.score}/{h.total} correct</div>
                            <div className="text-xs text-muted">{h.date}</div>
                          </div>
                          <div className="text-2xl font-bold text-right"
                             style={{ color: h.jambEquivalent>=250 ? "#31A24C" : h.jambEquivalent>=200 ? "#F7B928" : "#FA3E3E" }}>
                            {h.jambEquivalent}
                          </div>
                          <div className="text-xs text-muted text-right">JAMB equiv.</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        // ── EXAM (no bottom nav — focus mode) ─────────────────────────
        {phase === "exam" && (
          <>
            {/* Sticky timer bar */}
            <div className="sticky top-0 z-20">
              <div className="bg-gradient-to-b from-primary/10 to-transparent px-4 py-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs text-muted">{current+1} / {questions.length}</div>
                  <div className="text-2xl font-bold font-mono tabular-nums tracking-tighter"
                     style={{ letterSpacing: "-0.5px" }}>{fmt(timeLeft)}</div>
                  <button onClick={submitExam} className="px-3 py-1 rounded-full bg-primary/20 text-primary/70 hover:bg-primary/30 text-xs font-medium">
                    Submit
                  </button>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-{timerCol} to-transparent" />
                <div className="flex gap-1 mt-1 overflow-x-auto pb-1 scrollbar-hidden">
                  {questions.map((_,i)=>(
                    <div key={i} onClick={()=>setCurrent(i)} className={`w-6 h-6 rounded
                      ${i===current ? 'bg-white' : answers[i]!==undefined ? 'bg-primary/20' : 'bg-primary/5'}
                      cursor-pointer flex items-center justify-center text-xs font-medium
                      ${i===current ? 'text-primary' : 'text-primary/60'}
                      transition-colors`}>
                      {i+1}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {questions[current] && (
                <>
                  <div className="bg-surface rounded-lg border border-surface2/20 p-4 mb-4">
                    <div className="text-xs font-medium text-primary mb-1 text-uppercase tracking-wider">
                      {questions[current].subject}
                    </div>
                    <p className="text-lg font-medium">{questions[current].question}</p>
                  </div>
                  <div className="space-y-2">
                    {questions[current].options.map((opt,i)=>(
                      <button key={i} onClick={()=>setAnswers(p=>({...p,[current]:i}))} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border
                        ${answers[current]===i ? 'border-primary' : 'border-surface2/20'}
                        bg-${answers[current]===i ? 'primary' : 'surface'}
                        text-${answers[current]===i ? 'white' : 'text'}
                        font-medium
                        ${answers[current]===i ? 'font-semibold' : 'font-normal'}
                        hover:bg-surface2/50 transition-colors`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center
                           bg-${answers[current]===i ? 'primary' : 'surface2'}
                           text-${answers[current]===i ? 'white' : 'muted'}">
                          {["A","B","C","D"][i]}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0} className={`px-4 py-2 rounded-lg border border-surface2/20 bg-transparent text-muted hover:bg-surface2/10 transition-colors
                      ${current===0 ? 'cursor-not-allowed opacity-50' : ''}`}>
                      ← Prev
                    </button>
                    {current<questions.length-1?(
                      <button onClick={()=>setCurrent(c=>c+1)} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                        Next →
                      </button>
                    ):(
                      <button onClick={submitExam} className="px-4 py-2 rounded-lg bg-success text-white font-semibold hover:bg-success/90 transition-colors">
                        Submit ✓
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        // ── RESULT ─────────────────────────────────────────────────────
        {phase === "result" && result && (
          <>
            {/* Result header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Trophy size={30} color="#FFF8DB" strokeWidth={1.8} />
              </div>
              <p className="text-xs text-muted mb-1">Your Score</p>
              <p className="text-3xl font-bold text-primary tracking-tighter"
                 style={{ letterSpacing: "-2px" }}>{result.score}/{result.total}</p>
              <p className="text-sm font-medium text-primary/80 mt-1">
                {Math.round((result.score/result.total)*100)}% · JAMB equivalent: {Math.round((result.score/result.total)*400)}
              </p>
              <p className="text-sm mt-2">
                {/* Target comparison logic */}
                {(() => {
                  const user = (()=>{ try{return JSON.parse(localStorage.getItem("companion_user")||"{}");} catch{return {};} })();
                  const jambEq = Math.round((result.score/result.total)*400);
                  const gap = jambEq - parseInt(user.target||"250");
                  return gap>=0 ? `✅ ${gap} pts above your target!` : `⚠️ ${Math.abs(gap)} pts below your target`;
                })()}
              </p>
            </div>

            <div className="space-y-4">
              {/* Subject breakdown */}
              <div className="bg-surface rounded-lg border border-surface2/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 size={17} color="#1877F2" strokeWidth={1.8} />
                  <span className="font-medium">Subject Breakdown</span>
                </div>
                {Object.entries(result.bySubject).map(([s,d])=>(
                  <div key={s} className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{s}</span>
                      <span className="font-medium text-right"
                         style={{ color: Math.round((d.correct/d.total)*100)>=70 ? "#31A24C" : Math.round((d.correct/d.total)*100)>=50 ? "#F7B928" : "#FA3E3E" }}>
                        {d.correct}/{d.total}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface2/50 rounded overflow-hidden">
                      <div className="h-full bg-"
                         style={{ width: `${Math.round((d.correct/d.total)*100)}%`,
                                backgroundColor: Math.round((d.correct/d.total)*100)>=70 ? "#31A24C" : Math.round((d.correct/d.total)*100)>=50 ? "#F7B928" : "#FA3E3E" }}></div>
                    </div>
                  </div>
                ))}
                {result.score===result.total && (
                  <div className="text-center py-3 bg-success/10 text-success font-medium">
                    🎉 Perfect score! No mistakes!
                  </div>
                )}
              </div>

              {/* Missed questions */}
              <div className="bg-surface rounded-lg border border-surface2/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={17} color="#F7B928" strokeWidth={1.8} />
                  <span className="font-medium">Questions You Missed</span>
                </div>
                {questions.map((q,i)=>answers[i]!==q.correct&&(
                  <div key={i} className="mb-3 p-3 rounded-lg bg-danger/10 border border-danger/20">
                    <div className="text-xs font-medium text-danger mb-1 text-uppercase tracking-wider">
                      {q.subject}
                    </div>
                    <p className="text-base font-medium mb-1">{q.question}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-success flex items-center justify-center text-xs font-medium text-white">
                        ✅ {q.options[q.correct]}
                      </div>
                      <div className="flex-1">{q.explanation}</div>
                    </div>
                  </div>
                ))}
                {result.score===result.total && (
                  <div className="text-center py-3 bg-success/10 text-success font-medium">
                    🎉 Perfect score! No mistakes!
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={()=>{setPhase("setup");setResult(null);setQuestions([]);setAnswers({});}} className="px-4 py-2 rounded-lg border border-surface2/20 bg-transparent text-muted hover:bg-surface2/10 transition-colors">
                  Try Again
                </button>
                <Link href="/studyplan" className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                  Study Plan →
                </Link>
              </div>
            </>
          )}
        )}
      </div>
    </Layout>
  );
}