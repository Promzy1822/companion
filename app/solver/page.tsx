"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Lightbulb, Dices } from "lucide-react";
import Navbar, { NAVBAR_HEIGHT } from "../components/Navbar";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { C, palette } from "../lib/design";

const SUBJECTS = ["English Language","Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English","Geography","CRS","Commerce"];
const YEARS    = ["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015"];

function SolverContent() {
  const params  = useSearchParams();
  const [dark,  setDark]    = useState(false);
  const [mode,  setMode]    = useState<"type"|"generate">("type");
  const [q,     setQ]       = useState(params.get("question") || "");
  const [sub,   setSub]     = useState(params.get("subject")  || "");
  const [year,  setYear]    = useState("");
  const [ans,   setAns]     = useState("");
  const [load,  setLoad]    = useState(false);
  const [hist,  setHist]    = useState<{q:string;a:string;subject:string}[]>([]);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
    try { setHist(JSON.parse(localStorage.getItem("solver_history")||"[]").slice(0,5)); } catch {}
    setReady(true);
  }, []);

  const solve = async () => {
    if (!q.trim()) return;
    setLoad(true); setAns("");
    const prompt = `You are an expert JAMB examiner. Help this Nigerian student with this ${sub||"JAMB"} question${year ? ` from ${year}` : ""}.\n\nQUESTION: ${q}\n\nProvide:\n**✅ Correct Answer:** [answer]\n**📖 Explanation:** [clear explanation]\n**❌ Why others are wrong:** [for MCQ]\n**💡 Key Concept:** [memory tip]\n**📝 Similar question:** [practice question]`;
    try {
      const res  = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:prompt}) });
      const data = await res.json();
      const reply = data.reply || "Could not solve. Please try again.";
      setAns(reply);
      const newH = [{q,a:reply,subject:sub||"General"},...hist].slice(0,5);
      setHist(newH);
      localStorage.setItem("solver_history", JSON.stringify(newH));
    } catch { setAns("Network error."); }
    finally { setLoad(false); }
  };

  const generate = async () => {
    if (!sub) return;
    setLoad(true); setQ(""); setAns("");
    const prompt = `Generate one realistic JAMB ${sub} past question${year ? ` (${year} style)` : ""}.\n\nFormat:\nQUESTION: [full question + options A,B,C,D]\nANSWER: [correct answer + explanation]\nTOPIC: [JAMB syllabus topic]`;
    try {
      const res  = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:prompt}) });
      const data = await res.json();
      setAns(data.reply || "");
    } catch { setAns("Network error."); }
    finally { setLoad(false); }
  };

  if (!ready) return null;

  const T   = palette(dark);
  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:"10px",
    border:`1.5px solid ${T.border}`, fontSize:"14px", outline:"none",
    background:T.s2, color:T.text, boxSizing:"border-box", fontFamily:"inherit",
  };

  return (
    <div style={{ minHeight:"100vh", paddingTop:"56px", background:T.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar darkMode={dark} onToggleDark={()=>{const n=!dark;setDark(n);localStorage.setItem("darkMode",String(n));}} />

      {/* Header */}
      <div style={{ background:dark?"linear-gradient(135deg,#1A2A4A,#1877F2)":"linear-gradient(135deg,#1877F2,#0C5FD1)", padding:"20px 20px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <Link href="/" style={{ width:34, height:34, borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", textDecoration:"none" }}>
            <ArrowLeft size={16} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"18px" }}>Question Solver</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px" }}>AI explains every answer in detail</div>
          </div>
        </div>
        {/* Mode toggle */}
        <div style={{ display:"flex", gap:"8px", background:"rgba(255,255,255,0.12)", borderRadius:"12px", padding:"4px" }}>
          {(["type","generate"] as const).map(m=>{
            const Icon = m==="type" ? Lightbulb : Dices;
            return (
              <button key={m} onClick={()=>{setMode(m);setAns("");setQ("");}} style={{
                flex:1, padding:"9px", borderRadius:"9px", border:"none", cursor:"pointer",
                fontWeight:700, fontSize:"13px",
                background:mode===m?"#fff":"transparent",
                color:mode===m?C.primary:"rgba(255,255,255,0.75)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
                transition:"all 0.2s",
              }}>
                <Icon size={14} strokeWidth={2} />
                {m==="type"?"Type Question":"Generate Question"}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding:"16px 14px 100px" }}>
        {/* Input card */}
        <div style={{ background:T.surface, borderRadius:"16px", padding:"20px", border:`1px solid ${T.border}`, marginBottom:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
            <div>
              <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Subject</label>
              <select style={inp} value={sub} onChange={e=>setSub(e.target.value)}>
                <option value="">Any subject</option>
                {SUBJECTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Year</label>
              <select style={inp} value={year} onChange={e=>setYear(e.target.value)}>
                <option value="">Any year</option>
                {YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {mode==="type" ? (
            <>
              <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Paste your question here</label>
              <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Type or paste a JAMB question, including options A, B, C, D…"
                style={{ ...inp, minHeight:"110px", resize:"vertical", lineHeight:"1.5" }} />
              <button onClick={solve} disabled={load||!q.trim()} style={{
                width:"100%", marginTop:"12px", padding:"13px", borderRadius:"10px", border:"none",
                background:load||!q.trim()?"#ccc":C.primary, color:"#fff",
                fontWeight:700, fontSize:"14px", cursor:load||!q.trim()?"not-allowed":"pointer",
              }}>
                {load ? "Solving…" : "Solve This Question →"}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize:"13px", color:T.sub, margin:"0 0 12px", lineHeight:"1.5" }}>
                Select a subject and let AI generate a realistic JAMB practice question.
              </p>
              <button onClick={generate} disabled={load||!sub} style={{
                width:"100%", padding:"13px", borderRadius:"10px", border:"none",
                background:load||!sub?"#ccc":C.primary, color:"#fff",
                fontWeight:700, fontSize:"14px", cursor:load||!sub?"not-allowed":"pointer",
              }}>
                {load ? "Generating…" : "Generate Question"}
              </button>
              {!sub && <p style={{ fontSize:"12px", color:C.danger, marginTop:"8px", textAlign:"center" }}>Select a subject first</p>}
            </>
          )}
        </div>

        {/* Answer */}
        {(load||ans) && (
          <div style={{ background:T.surface, borderRadius:"16px", padding:"20px", border:`1px solid ${T.border}`, marginBottom:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
              <div style={{ width:36, height:36, borderRadius:"10px", background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Lightbulb size={17} color={C.primary} strokeWidth={1.8} />
              </div>
              <div style={{ fontWeight:700, color:T.text, fontSize:"15px" }}>AI Explanation</div>
            </div>
            {load ? (
              <div style={{ display:"flex", gap:"5px", padding:"8px 0" }}>
                {[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.primary, animation:`typingDot 1.2s infinite ${i*0.15}s` }} />)}
              </div>
            ) : (
              <div style={{ fontSize:"14px", color:T.text, lineHeight:"1.7" }}>
                <ReactMarkdown>{ans}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {hist.length > 0 && !ans && (
          <div style={{ background:T.surface, borderRadius:"16px", border:`1px solid ${T.border}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontSize:"12px", fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"1px" }}>
              Recent Questions
            </div>
            {hist.map((h,i)=>(
              <button key={i} onClick={()=>{setQ(h.q);setAns(h.a);setMode("type");setSub(h.subject);}} style={{
                width:"100%", textAlign:"left", padding:"12px 18px",
                border:"none", borderBottom:i<hist.length-1?`1px solid ${T.border}`:"none",
                background:"transparent", cursor:"pointer",
              }}>
                <div style={{ fontSize:"11px", color:C.primary, fontWeight:600, marginBottom:"3px" }}>{h.subject}</div>
                <div style={{ fontSize:"13px", color:T.text, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.q}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav darkMode={dark} />
      <style>{`@keyframes typingDot{0%,60%,100%{opacity:.3;transform:scale(.8)}30%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}

export default function Solver() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#F0F2F5",display:"flex",alignItems:"center",justifyContent:"center",color:"#65676B",fontFamily:"Arial"}}>Loading…</div>}>
      <SolverContent />
    </Suspense>
  );
}
