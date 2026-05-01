"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const SUBJECTS = ["English Language","Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English","Geography","CRS","Commerce"];
const YEARS = ["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015"];

export default function Solver() {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"type"|"generate">("type");
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState<{q:string;a:string;subject:string}[]>([]);

  useEffect(() => {
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const saved = localStorage.getItem("solver_history");
    if (saved) setHistory(JSON.parse(saved).slice(0, 5));
  }, []);

  const solveQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    const prompt = `You are an expert JAMB examiner and tutor. A Nigerian student needs help with this ${subject ? subject : "JAMB"} question${year ? ` from ${year}` : ""}.

QUESTION: ${question}

Provide a detailed explanation in this exact format:

**✅ Correct Answer:** [State the answer clearly]

**📖 Explanation:**
[Explain WHY this is the correct answer in simple terms a Nigerian student can understand]

**❌ Why other options are wrong:**
[If multiple choice, explain why each wrong option is incorrect]

**💡 Key Concept to Remember:**
[State the JAMB topic this tests and give a memory tip]

**📝 Similar questions to practice:**
[Give one similar question the student might see in JAMB]`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const reply = data.reply || "Could not solve this question. Please try again.";
      setAnswer(reply);
      const newHistory = [{ q: question, a: reply, subject: subject || "General" }, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem("solver_history", JSON.stringify(newHistory));
    } catch {
      setAnswer("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const generateQuestion = async () => {
    if (!subject) return;
    setLoading(true);
    setQuestion("");
    setAnswer("");
    const prompt = `Generate one realistic JAMB ${subject} past question${year ? ` in the style of ${year}` : ""}. 

Format:
QUESTION: [The full question with options A, B, C, D if multiple choice]
ANSWER: [Correct option and full explanation]
TOPIC: [JAMB syllabus topic this tests]`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      setAnswer(data.reply || "");
    } catch {
      setAnswer("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bg = darkMode ? "#0a0a0a" : "#f5f5f7";
  const cardBg = darkMode ? "#1c1c1e" : "#ffffff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const inputBg = darkMode ? "#2c2c2e" : "#f5f5f7";
  const inp: React.CSSProperties = { width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${borderC}`, fontSize:"14px", outline:"none", backgroundColor:inputBg, color:textColor, boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", backgroundColor:bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)", padding:"20px 20px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <Link href="/" style={{ width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"16px", textDecoration:"none" }}>←</Link>
          <div>
            <div style={{ color:"#fff", fontWeight:"800", fontSize:"18px" }}>🧮 Question Solver</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px" }}>AI explains every answer in detail</div>
          </div>
        </div>
        {/* Mode tabs */}
        <div style={{ display:"flex", gap:"8px", backgroundColor:"rgba(255,255,255,0.12)", borderRadius:"12px", padding:"4px" }}>
          {(["type","generate"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setAnswer(""); setQuestion(""); }} style={{ flex:1, padding:"9px", borderRadius:"9px", border:"none", cursor:"pointer", fontWeight:"700", fontSize:"13px", backgroundColor: mode===m ? "#fff" : "transparent", color: mode===m ? "#ea580c" : "rgba(255,255,255,0.7)", transition:"all 0.2s" }}>
              {m === "type" ? "📝 Type Question" : "🎲 Generate Question"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"20px 16px" }}>
        <div style={{ backgroundColor:cardBg, borderRadius:"20px", padding:"20px", boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.08)", border:`1px solid ${borderC}`, marginBottom:"16px" }}>
          
          {/* Subject & Year selectors */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
            <div>
              <label style={{ fontSize:"12px", fontWeight:"600", color:subText, display:"block", marginBottom:"6px" }}>Subject</label>
              <select style={inp} value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Any subject</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:"12px", fontWeight:"600", color:subText, display:"block", marginBottom:"6px" }}>Year</label>
              <select style={inp} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Any year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {mode === "type" ? (
            <>
              <label style={{ fontSize:"12px", fontWeight:"600", color:subText, display:"block", marginBottom:"6px" }}>Paste your question here</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Type or paste a JAMB question here, including all options A, B, C, D..."
                style={{ ...inp, minHeight:"120px", resize:"vertical", fontFamily:"inherit", lineHeight:"1.5" }}
              />
              <button onClick={solveQuestion} disabled={loading || !question.trim()} style={{ width:"100%", marginTop:"12px", padding:"14px", borderRadius:"14px", border:"none", background: loading || !question.trim() ? "#ccc" : "linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor: loading || !question.trim() ? "not-allowed" : "pointer", boxShadow: (!loading && question.trim()) ? "0 4px 12px rgba(234,88,12,0.3)" : "none" }}>
                {loading ? "🤖 Solving..." : "Solve This Question →"}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize:"13px", color:subText, margin:"0 0 12px", lineHeight:"1.5" }}>
                Select a subject above and let AI generate a realistic JAMB question for you to practice.
              </p>
              <button onClick={generateQuestion} disabled={loading || !subject} style={{ width:"100%", padding:"14px", borderRadius:"14px", border:"none", background: loading || !subject ? "#ccc" : "linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor: loading || !subject ? "not-allowed" : "pointer" }}>
                {loading ? "🤖 Generating..." : "🎲 Generate Question"}
              </button>
              {!subject && <p style={{ fontSize:"12px", color:"#ea580c", marginTop:"8px", textAlign:"center" }}>Select a subject first</p>}
            </>
          )}
        </div>

        {/* Answer */}
        {(loading || answer) && (
          <div style={{ backgroundColor:cardBg, borderRadius:"20px", padding:"20px", boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.08)", border:`1px solid ${borderC}`, marginBottom:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#fb923c,#ea580c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🤖</div>
              <div style={{ fontWeight:"700", color:textColor, fontSize:"15px" }}>AI Explanation</div>
            </div>
            {loading ? (
              <div style={{ display:"flex", gap:"5px", alignItems:"center", padding:"8px 0" }}>
                {[0,1,2].map(i => <div key={i} style={{ width:"8px", height:"8px", borderRadius:"50%", backgroundColor:"#ea580c", animation:"bounce 1.2s infinite", animationDelay:`${i*0.15}s` }} />)}
              </div>
            ) : (
              <div style={{ fontSize:"14px", color:textColor, lineHeight:"1.7" }}>
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && !answer && (
          <div style={{ backgroundColor:cardBg, borderRadius:"20px", padding:"20px", boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.08)", border:`1px solid ${borderC}` }}>
            <div style={{ fontSize:"13px", fontWeight:"700", color:subText, marginBottom:"14px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Recent Questions</div>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setQuestion(h.q); setAnswer(h.a); setMode("type"); }} style={{ width:"100%", textAlign:"left", padding:"12px", borderRadius:"12px", border:`1px solid ${borderC}`, backgroundColor: darkMode ? "#2c2c2e" : "#f5f5f7", cursor:"pointer", marginBottom:"8px" }}>
                <div style={{ fontSize:"11px", color:"#ea580c", fontWeight:"600", marginBottom:"4px" }}>{h.subject}</div>
                <div style={{ fontSize:"13px", color:textColor, fontWeight:"500", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.q}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
