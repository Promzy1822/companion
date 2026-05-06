"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import AIIcon from "../components/AIIcon";

const SUBJECTS = ["English Language","Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English","Geography","CRS","Commerce","Agricultural Science","Further Mathematics"];
const YEARS = ["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015","2014","2013","2012","2010"];

function SolverContent() {
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [year, setYear] = useState("");
  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"type"|"generate">("generate");
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState<{q:string;a:string;subject:string;topic?:string}[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const saved = localStorage.getItem("solver_history");
    if (saved) setHistory(JSON.parse(saved).slice(0,8));
    // Auto-generate if coming from study plan
    if (searchParams.get("topic") && searchParams.get("subject")) {
      setTimeout(() => generateQuestion(), 500);
    }
  }, []);

  const solveQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true); setAnswer("");
    const prompt = `You are an expert JAMB examiner. A Nigerian student needs help with this ${subject || "JAMB"} question${year ? ` from ${year} JAMB` : ""}${topic ? ` on the topic "${topic}"` : ""}.`;

QUESTION: ${question}

Provide this EXACT format:

**✅ Correct Answer:** [State answer clearly]

**📖 Why this is correct:**
[Explain the concept with Nigerian student examples]

**❌ Why other options are wrong:**
[Explain each wrong option if multiple choice]

const solveQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true); 
    setAnswer("");
    
    const prompt = `You are an expert JAMB examiner. A Nigerian student needs help with this ${subject || "JAMB"} question${year ? ` from ${year} JAMB` : ""}${topic ? ` on the topic "${topic}"` : ""}.

QUESTION: ${question}

Provide this EXACT format:

**✅ Correct Answer:** [State answer clearly]

**📖 Why this is correct:**
[Explain the concept with Nigerian student examples]

**❌ Why other options are wrong:**
[Explain each wrong option if multiple choice]

**💡 Key JAMB Concept:**
[State the syllabus topic and give 1 memory trick]

**📝 Try this similar question:**
[Give one similar JAMB-style question]`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      const reply = data.reply || "Could not solve. Try again.";
      setAnswer(reply);
      const newH = [{ q: question, a: reply, subject: subject || "General", topic }, ...history].slice(0, 8);
      setHistory(newH);
      localStorage.setItem("solver_history", JSON.stringify(newH));
    } catch { 
      setAnswer("Network error. Please try again."); 
    } finally { 
      setLoading(false); 
    }
};
  };

 const generateQuestion = async () => {
    if (!subject && !searchParams.get("subject")) return;
    const subj = subject || searchParams.get("subject") || "Mathematics";
    const top = topic || searchParams.get("topic") || "";
    setLoading(true); 
    setAnswer(""); 
    setQuestion("");

    const prompt = `Generate one realistic JAMB ${subj} past question${year ? ` in the style of ${year}` : ""}${top ? ` specifically on the topic "${top}"` : ""}. This is for a Nigerian student preparing for JAMB UTME.

Format EXACTLY like this:
QUESTION: [Full question with options A, B, C, D if multiple choice, OR short answer question]

ANSWER: [Correct option letter and full text]

WORKING: [Show all working steps clearly]

EXPLANATION: [Why this is correct, referencing the JAMB syllabus topic]

TOPIC: [Exact JAMB syllabus topic this tests]

YEAR_STYLE: [Which JAMB year this question style resembles]`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      setAnswer(data.reply || "");
    } catch { 
      setAnswer("Network error. Try again."); 
    } finally { 
      setLoading(false); 
    }
};

  if (!mounted) return null;

  const bg=darkMode?"#0a0a0a":"#f0f0f5";
  const cardBg=darkMode?"#1c1c1e":"#fff";
  const textColor=darkMode?"#f2f2f7":"#1c1c1e";
  const subText=darkMode?"#98989d":"#6e6e73";
  const borderC=darkMode?"#2c2c2e":"#e5e5ea";
  const inputBg=darkMode?"#2c2c2e":"#f5f5f7";
  const inp:React.CSSProperties={width:"100%",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${borderC}`,fontSize:"14px",outline:"none",backgroundColor:inputBg,color:textColor,boxSizing:"border-box"};

  return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#3b0d02,#7c2d12,#c2410c,#ea580c)",padding:"20px 16px 24px",boxShadow:"0 4px 20px rgba(194,65,12,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <Link href="/" style={{width:"34px",height:"34px",borderRadius:"10px",backgroundColor:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"16px",textDecoration:"none"}}>←</Link>
          <div>
            <div style={{color:"#fff",fontWeight:"800",fontSize:"18px"}}>Question Solver</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>
              {topic ? `Topic: ${topic}` : "AI explains every answer in detail"}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",backgroundColor:"rgba(255,255,255,0.12)",borderRadius:"12px",padding:"4px"}}>
          {(["generate","type"] as const).map(m=>(
            <button key={m} onClick={()=>{setMode(m);setAnswer("");setQuestion("");}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"13px",backgroundColor:mode===m?"#fff":"transparent",color:mode===m?"#ea580c":"rgba(255,255,255,0.8)",transition:"all 0.2s"}}>
              {m==="generate"?"🎲 Generate Question":"📝 Type Question"}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"14px"}}>

        {/* If from study plan, show context */}
        {topic && (
          <div style={{padding:"12px 16px",borderRadius:"14px",backgroundColor:darkMode?"#1a1a0a":"#fffbeb",border:"1px solid #fde68a",display:"flex",gap:"10px",alignItems:"center"}}>
            <span style={{fontSize:"16px"}}>📅</span>
            <div>
              <div style={{fontSize:"13px",fontWeight:"700",color:"#92400e"}}>From your Study Plan</div>
              <div style={{fontSize:"12px",color:"#78350f"}}>Topic: {topic} · Subject: {subject}</div>
            </div>
          </div>
        )}

        <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"18px",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 4px 20px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
            <div>
              <label style={{fontSize:"12px",fontWeight:"600",color:subText,display:"block",marginBottom:"6px"}}>Subject</label>
              <select style={inp} value={subject} onChange={e=>setSubject(e.target.value)}>
                <option value="">Any subject</option>
                {SUBJECTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:"12px",fontWeight:"600",color:subText,display:"block",marginBottom:"6px"}}>JAMB Year</label>
              <select style={inp} value={year} onChange={e=>setYear(e.target.value)}>
                <option value="">Any year</option>
                {YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {topic && (
            <div style={{marginBottom:"12px"}}>
              <label style={{fontSize:"12px",fontWeight:"600",color:subText,display:"block",marginBottom:"6px"}}>Topic (from study plan)</label>
              <input style={inp} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Specific topic e.g. Quadratic Equations" />
            </div>
          )}

          {mode==="type" ? (
            <>
              <label style={{fontSize:"12px",fontWeight:"600",color:subText,display:"block",marginBottom:"6px"}}>Paste your JAMB question</label>
              <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Type or paste a JAMB question here, including all options A, B, C, D..." style={{...inp,minHeight:"120px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.5"}} />
              <button onClick={solveQuestion} disabled={loading||!question.trim()} style={{width:"100%",marginTop:"12px",padding:"14px",borderRadius:"14px",border:"none",background:loading||!question.trim()?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:loading||!question.trim()?"not-allowed":"pointer",boxShadow:(!loading&&question.trim())?"0 4px 16px rgba(234,88,12,0.35)":"none"}}>
                {loading?"Solving...":"Solve This Question →"}
              </button>
            </>
          ) : (
            <>
              <p style={{fontSize:"13px",color:subText,margin:"0 0 12px",lineHeight:"1.5"}}>
                {topic ? `AI will generate a JAMB-style question specifically on "${topic}"` : "Select a subject and let AI generate a realistic JAMB past question."}
              </p>
              <button onClick={generateQuestion} disabled={loading||(!subject&&!searchParams.get("subject"))} style={{width:"100%",padding:"14px",borderRadius:"14px",border:"none",background:loading||(!subject&&!searchParams.get("subject"))?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:"pointer",boxShadow:"0 4px 16px rgba(234,88,12,0.35)"}}>
                {loading?"🤖 Generating...":"🎲 Generate Question"}
              </button>
              {!subject&&!searchParams.get("subject")&&<p style={{fontSize:"12px",color:"#ea580c",marginTop:"6px",textAlign:"center"}}>Select a subject first</p>}
            </>
          )}
        </div>

        {/* Answer */}
        {(loading||answer) && (
          <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"18px",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 4px 20px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px",paddingBottom:"12px",borderBottom:`1px solid ${borderC}`}}>
              <AIIcon size={32} />
              <div style={{fontWeight:"700",color:textColor,fontSize:"15px"}}>AI Explanation</div>
            </div>
            {loading ? (
              <div style={{display:"flex",gap:"5px",alignItems:"center",padding:"8px 0"}}>
                {[0,1,2].map(i=><div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",backgroundColor:"#ea580c",animation:"bounce 1.2s infinite",animationDelay:`${i*0.15}s`}} />)}
              </div>
            ) : (
              <div style={{fontSize:"14px",color:textColor,lineHeight:"1.7"}}>
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            )}
            {answer && (
              <button onClick={generateQuestion} style={{width:"100%",marginTop:"14px",padding:"12px",borderRadius:"12px",border:`1.5px solid ${borderC}`,backgroundColor:"transparent",color:subText,fontWeight:"600",fontSize:"13px",cursor:"pointer"}}>
                Generate Another Question →
              </button>
            )}
          </div>
        )}

        {/* History */}
        {history.length>0&&!answer&&(
          <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"18px",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 4px 20px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:subText,marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Recent Questions</div>
            {history.map((h,i)=>(
              <button key={i} onClick={()=>{setQuestion(h.q);setAnswer(h.a);setSubject(h.subject);setMode("type");}} style={{width:"100%",textAlign:"left",padding:"12px",borderRadius:"12px",border:`1px solid ${borderC}`,backgroundColor:darkMode?"#2c2c2e":"#f8f8f8",cursor:"pointer",marginBottom:"8px",display:"flex",gap:"10px",alignItems:"center"}}>
                <span style={{fontSize:"14px"}}>✏️</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"11px",color:"#ea580c",fontWeight:"600",marginBottom:"2px"}}>{h.subject}{h.topic?` · ${h.topic}`:""}</div>
                  <div style={{fontSize:"13px",color:textColor,fontWeight:"500",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.q||"Generated question"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

export default function Solver() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",backgroundColor:"#f0f0f5",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading...</div>}>
      <SolverContent />
    </Suspense>
  );
}
