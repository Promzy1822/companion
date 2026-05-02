"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Question { id: number; subject: string; question: string; options: string[]; correct: number; explanation: string; }
interface Result { score: number; total: number; bySubject: Record<string, {correct:number;total:number}>; timeTaken: number; }

const MOCK_QUESTIONS: Question[] = [
  { id:1, subject:"Mathematics", question:"If 2x + 3 = 11, find x.", options:["2","3","4","5"], correct:2, explanation:"2x = 11-3 = 8, x = 4" },
  { id:2, subject:"English Language", question:"Choose the word closest in meaning to 'Benevolent'.", options:["Cruel","Kind","Stingy","Harsh"], correct:1, explanation:"Benevolent means kind and generous" },
  { id:3, subject:"Physics", question:"Which of these is a vector quantity?", options:["Mass","Temperature","Velocity","Speed"], correct:2, explanation:"Velocity has both magnitude and direction, making it a vector" },
  { id:4, subject:"Chemistry", question:"The atomic number of Carbon is:", options:["6","12","14","8"], correct:0, explanation:"Carbon has 6 protons, so its atomic number is 6" },
  { id:5, subject:"Biology", question:"Which organelle is called the powerhouse of the cell?", options:["Nucleus","Ribosome","Mitochondria","Golgi body"], correct:2, explanation:"Mitochondria produces ATP energy for the cell" },
  { id:6, subject:"Mathematics", question:"Find the area of a circle with radius 7cm (π = 22/7).", options:["44cm²","154cm²","22cm²","176cm²"], correct:1, explanation:"Area = πr² = (22/7) × 7 × 7 = 154cm²" },
  { id:7, subject:"English Language", question:"Identify the figure of speech: 'The wind whispered through the trees'.", options:["Simile","Metaphor","Personification","Hyperbole"], correct:2, explanation:"Giving human quality (whispering) to wind is personification" },
  { id:8, subject:"Physics", question:"What is the SI unit of electric current?", options:["Volt","Watt","Ampere","Ohm"], correct:2, explanation:"Ampere (A) is the SI unit of electric current" },
  { id:9, subject:"Chemistry", question:"Which gas is produced when zinc reacts with dilute H₂SO₄?", options:["Oxygen","Carbon dioxide","Hydrogen","Nitrogen"], correct:2, explanation:"Zn + H₂SO₄ → ZnSO₄ + H₂ (Hydrogen gas)" },
  { id:10, subject:"Biology", question:"Which blood group is the universal donor?", options:["A","B","AB","O"], correct:3, explanation:"Blood group O can donate to all other blood groups" },
];

export default function MockExam() {
  const [phase, setPhase] = useState<"setup"|"exam"|"result">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<Result|null>(null);
  const [generating, setGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [showExplanation, setShowExplanation] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    setDarkMode(localStorage.getItem("darkMode") === "true");
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (phase === "exam" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current!); submitExam(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startExam = async () => {
    setGenerating(true);
    const user = JSON.parse(localStorage.getItem("companion_user") || "{}");
    const subjects = user.subjects || ["Mathematics","English Language","Physics","Chemistry","Biology"];
    try {
      const prompt = `Generate ${numQuestions} JAMB multiple choice questions for these subjects: ${subjects.join(", ")}.
Return ONLY valid JSON array:
[{"id":1,"subject":"Mathematics","question":"question text","options":["A","B","C","D"],"correct":0,"explanation":"why A is correct"}]
- correct is 0-indexed
- Mix subjects evenly
- JAMB difficulty level
- Return ONLY the JSON array`;
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: prompt }) });
      const data = await res.json();
      const text = data.reply || "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setQuestions(parsed);
      } else { setQuestions(MOCK_QUESTIONS.slice(0, numQuestions)); }
    } catch { setQuestions(MOCK_QUESTIONS.slice(0, numQuestions)); }
    setTimeLeft(numQuestions * 90);
    setAnswers({});
    setCurrent(0);
    setPhase("exam");
    setGenerating(false);
  };

  const submitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let score = 0;
    const bySubject: Record<string,{correct:number;total:number}> = {};
    questions.forEach((q, i) => {
      if (!bySubject[q.subject]) bySubject[q.subject] = { correct:0, total:0 };
      bySubject[q.subject].total++;
      if (answers[i] === q.correct) { score++; bySubject[q.subject].correct++; }
    });
    const timeTaken = (numQuestions * 90) - timeLeft;
    const res = { score, total: questions.length, bySubject, timeTaken };
    setResult(res);
    setPhase("result");
    // Save to history
    const history = JSON.parse(localStorage.getItem("mock_history") || "[]");
    history.unshift({ ...res, date: new Date().toLocaleDateString(), jambEquivalent: Math.round((score/questions.length)*400) });
    localStorage.setItem("mock_history", JSON.stringify(history.slice(0,10)));
  };

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const timePercent = questions.length ? (timeLeft / (questions.length * 90)) * 100 : 100;
  const timerColor = timePercent > 50 ? "#16a34a" : timePercent > 25 ? "#d97706" : "#dc2626";

  const bg = darkMode ? "#0a0a0a" : "#f5f5f7";
  const cardBg = darkMode ? "#1c1c1e" : "#fff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";

  if (phase === "setup") return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)",padding:"20px 20px 32px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <Link href="/" style={{width:"34px",height:"34px",borderRadius:"10px",backgroundColor:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"16px",textDecoration:"none"}}>←</Link>
          <div>
            <div style={{color:"#fff",fontWeight:"800",fontSize:"18px"}}>📝 Mock Exam</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>AI-generated JAMB simulation</div>
          </div>
        </div>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"24px",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 16px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`,marginBottom:"16px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{fontSize:"56px",marginBottom:"12px"}}>🎯</div>
            <h2 style={{fontSize:"20px",fontWeight:"800",color:textColor,margin:"0 0 8px"}}>JAMB Mock Exam</h2>
            <p style={{fontSize:"14px",color:subText,margin:0,lineHeight:"1.5"}}>AI generates questions from your subjects. Timer runs like real JAMB. Full debrief after.</p>
          </div>
          <div style={{marginBottom:"20px"}}>
            <label style={{fontSize:"13px",fontWeight:"600",color:subText,display:"block",marginBottom:"10px"}}>Number of Questions</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
              {[10,20,30,40].map(n => (
                <button key={n} onClick={()=>setNumQuestions(n)} style={{padding:"12px",borderRadius:"12px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"14px",backgroundColor:numQuestions===n?"#ea580c":darkMode?"#2c2c2e":"#f0f0f0",color:numQuestions===n?"#fff":subText,transition:"all 0.2s"}}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{fontSize:"12px",color:subText,marginTop:"8px",textAlign:"center"}}>⏱ {Math.round(numQuestions*1.5)} minutes • {numQuestions} questions</p>
          </div>
          <button onClick={startExam} disabled={generating} style={{width:"100%",padding:"16px",borderRadius:"16px",border:"none",background:generating?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"16px",cursor:generating?"not-allowed":"pointer",boxShadow:generating?"none":"0 4px 16px rgba(234,88,12,0.35)"}}>
            {generating?"🤖 Generating questions...":"Start Mock Exam →"}
          </button>
        </div>
        {/* Past results */}
        {JSON.parse(localStorage.getItem("mock_history")||"[]").length > 0 && (
          <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"20px",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 16px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:subText,marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Past Results</div>
            {JSON.parse(localStorage.getItem("mock_history")||"[]").slice(0,3).map((h: {score:number;total:number;jambEquivalent:number;date:string}, i: number) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",borderRadius:"12px",backgroundColor:darkMode?"#2c2c2e":"#f5f5f7",marginBottom:"8px"}}>
                <div>
                  <div style={{fontSize:"14px",fontWeight:"700",color:textColor}}>{h.score}/{h.total} correct</div>
                  <div style={{fontSize:"12px",color:subText}}>{h.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"18px",fontWeight:"900",color:h.jambEquivalent>=250?"#16a34a":h.jambEquivalent>=200?"#d97706":"#dc2626"}}>{h.jambEquivalent}</div>
                  <div style={{fontSize:"11px",color:subText}}>JAMB equiv.</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (phase === "exam") return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>
      {/* Timer header */}
      <div style={{background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c)",padding:"16px 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:"13px"}}>{current+1} of {questions.length}</div>
          <div style={{color:"#fff",fontSize:"20px",fontWeight:"900",fontVariantNumeric:"tabular-nums"}}>{formatTime(timeLeft)}</div>
          <button onClick={submitExam} style={{padding:"6px 14px",borderRadius:"20px",border:"none",backgroundColor:"rgba(255,255,255,0.2)",color:"#fff",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>Submit</button>
        </div>
        <div style={{height:"4px",borderRadius:"2px",backgroundColor:"rgba(255,255,255,0.2)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${timePercent}%`,borderRadius:"2px",backgroundColor:timerColor,transition:"width 1s linear"}} />
        </div>
        {/* Progress dots */}
        <div style={{display:"flex",gap:"4px",marginTop:"10px",overflowX:"auto",scrollbarWidth:"none"}}>
          {questions.map((_,i) => (
            <div key={i} onClick={()=>setCurrent(i)} style={{width:"24px",height:"24px",borderRadius:"6px",backgroundColor:i===current?"#fff":answers[i]!==undefined?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.15)",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"700",color:i===current?"#ea580c":"rgba(255,255,255,0.8)"}}>
              {i+1}
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,padding:"20px 16px",overflowY:"auto"}}>
        {questions[current] && (
          <div>
            <div style={{backgroundColor:cardBg,borderRadius:"16px",padding:"20px",marginBottom:"16px",border:`1px solid ${borderC}`,boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.08)"}}>
              <div style={{fontSize:"12px",color:"#ea580c",fontWeight:"700",marginBottom:"10px"}}>{questions[current].subject}</div>
              <div style={{fontSize:"15px",color:textColor,fontWeight:"600",lineHeight:"1.6"}}>{questions[current].question}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {questions[current].options.map((opt,i) => (
                <button key={i} onClick={()=>setAnswers(prev=>({...prev,[current]:i}))} style={{width:"100%",padding:"16px",borderRadius:"14px",border:`2px solid ${answers[current]===i?"#ea580c":borderC}`,backgroundColor:answers[current]===i?"#fff8f5":cardBg,color:answers[current]===i?"#ea580c":textColor,fontWeight:answers[current]===i?"700":"500",fontSize:"14px",cursor:"pointer",textAlign:"left",transition:"all 0.15s",display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",backgroundColor:answers[current]===i?"#ea580c":darkMode?"#2c2c2e":"#f0f0f0",color:answers[current]===i?"#fff":subText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:"700",flexShrink:0}}>
                    {["A","B","C","D"][i]}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
              <button onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0} style={{flex:1,padding:"14px",borderRadius:"14px",border:`1.5px solid ${borderC}`,backgroundColor:"transparent",color:current===0?subText:textColor,fontWeight:"700",cursor:current===0?"not-allowed":"pointer"}}>← Prev</button>
              {current < questions.length-1 ? (
                <button onClick={()=>setCurrent(c=>c+1)} style={{flex:1,padding:"14px",borderRadius:"14px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",cursor:"pointer"}}>Next →</button>
              ) : (
                <button onClick={submitExam} style={{flex:1,padding:"14px",borderRadius:"14px",border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontWeight:"700",cursor:"pointer"}}>Submit ✓</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (phase === "result" && result) {
    const percent = Math.round((result.score/result.total)*100);
    const jambEq = Math.round((result.score/result.total)*400);
    const user = JSON.parse(localStorage.getItem("companion_user")||"{}");
    const targetGap = jambEq - parseInt(user.target||"250");
    return (
      <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)",padding:"24px 20px 40px",textAlign:"center"}}>
          <div style={{fontSize:"56px",marginBottom:"12px"}}>{percent>=75?"🏆":percent>=50?"👍":"💪"}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:"14px",marginBottom:"4px"}}>Your Score</div>
          <div style={{color:"#fff",fontSize:"48px",fontWeight:"900",letterSpacing:"-2px"}}>{result.score}/{result.total}</div>
          <div style={{color:"#fde68a",fontSize:"16px",fontWeight:"700",marginTop:"4px"}}>{percent}% • JAMB equivalent: {jambEq}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:"13px",marginTop:"6px"}}>
            {targetGap >= 0 ? `✅ ${targetGap} pts above your target!` : `⚠️ ${Math.abs(targetGap)} pts below your target`}
          </div>
        </div>
        <div style={{padding:"16px",marginTop:"-16px"}}>
          {/* Subject breakdown */}
          <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"20px",marginBottom:"16px",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 16px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
            <div style={{fontSize:"14px",fontWeight:"800",color:textColor,marginBottom:"14px"}}>📊 Subject Breakdown</div>
            {Object.entries(result.bySubject).map(([sub,data]) => {
              const subPercent = Math.round((data.correct/data.total)*100);
              return (
                <div key={sub} style={{marginBottom:"12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"5px"}}>
                    <span style={{color:textColor,fontWeight:"600"}}>{sub}</span>
                    <span style={{color:subPercent>=70?"#16a34a":subPercent>=50?"#d97706":"#dc2626",fontWeight:"700"}}>{data.correct}/{data.total}</span>
                  </div>
                  <div style={{height:"6px",borderRadius:"3px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${subPercent}%`,borderRadius:"3px",backgroundColor:subPercent>=70?"#16a34a":subPercent>=50?"#d97706":"#dc2626"}} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Review wrong answers */}
          <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"20px",marginBottom:"16px",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 16px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
            <div style={{fontSize:"14px",fontWeight:"800",color:textColor,marginBottom:"14px"}}>❌ Questions You Missed</div>
            {questions.map((q,i) => answers[i] !== q.correct && (
              <div key={i} style={{padding:"12px",borderRadius:"12px",backgroundColor:darkMode?"#2c2c2e":"#fff0f0",border:"1px solid #fecaca",marginBottom:"10px"}}>
                <div style={{fontSize:"12px",color:"#ea580c",fontWeight:"600",marginBottom:"4px"}}>{q.subject}</div>
                <div style={{fontSize:"13px",color:textColor,fontWeight:"600",marginBottom:"6px"}}>{q.question}</div>
                <div style={{fontSize:"12px",color:"#16a34a",fontWeight:"600"}}>✅ {q.options[q.correct]}</div>
                <div style={{fontSize:"12px",color:subText,marginTop:"4px"}}>{q.explanation}</div>
              </div>
            ))}
            {result.score === result.total && (
              <div style={{textAlign:"center",padding:"20px",color:"#16a34a",fontWeight:"700",fontSize:"15px"}}>🎉 Perfect score! No mistakes!</div>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <button onClick={()=>setPhase("setup")} style={{padding:"14px",borderRadius:"14px",border:`1.5px solid ${borderC}`,backgroundColor:"transparent",color:textColor,fontWeight:"700",cursor:"pointer"}}>Try Again</button>
            <Link href="/studyplan" style={{padding:"14px",borderRadius:"14px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",textDecoration:"none",textAlign:"center",display:"block"}}>Study Plan →</Link>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
