"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","UNN Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const ALL_SUBJECTS = ["English Language","Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English","Geography","CRS","IRS","Commerce","Agricultural Science","Further Mathematics"];

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name:"", email:"", password:"", institution:"", course:"",
    subjects:[] as string[], target:"250", deadline:"", selfRating:"2"
  });

  useEffect(() => {
    if (localStorage.getItem("companion_user")) router.replace("/");
  }, [router]);

  const update = (k: string, v: string | string[]) => setForm(p => ({...p, [k]: v}));

  const toggleSubject = (s: string) => {
    const cur = form.subjects;
    if (cur.includes(s)) { update("subjects", cur.filter(x => x !== s)); return; }
    if (s === "English Language") return;
    if (cur.length >= 4) { setError("Max 4 subjects"); setTimeout(() => setError(""), 2000); return; }
    update("subjects", [...cur, s]);
  };

  const handleLogin = () => {
    if (!form.email.trim() || !form.password.trim()) { setError("Fill all fields"); return; }
    const saved = localStorage.getItem("companion_user");
    if (saved) {
      const u = JSON.parse(saved);
      if (u.email === form.email) { router.replace("/"); return; }
    }
    setError("No account found. Please sign up.");
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError("Enter your name"); return; }
      if (!form.email.includes("@")) { setError("Enter valid email"); return; }
      if (form.password.length < 6) { setError("Password min 6 characters"); return; }
      if (!form.institution) { setError("Select institution"); return; }
      if (!form.course) { setError("Select course"); return; }
    }
    if (step === 2) {
      const total = form.subjects.includes("English Language") ? form.subjects.length : form.subjects.length + 1;
      if (total < 4) { setError("Select 3 more subjects (English is auto-included)"); return; }
    }
    setStep(s => s + 1);
  };

  const handleSignup = () => {
    if (!form.deadline) { setError("Select exam date"); return; }
    const userData = { ...form, subjects: ["English Language", ...form.subjects.filter(s => s !== "English Language")] };
    localStorage.setItem("companion_user", JSON.stringify(userData));
    router.replace("/");
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"12px",
    border:"1.5px solid #e8e8e8", fontSize:"14px", outline:"none",
    backgroundColor:"#fafafa", boxSizing:"border-box", color:"#1a1a1a"
  };

  return (
    <div style={{minHeight:"100vh", backgroundColor:"#fff", fontFamily:"Arial, sans-serif", display:"flex", flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg, #7c2d12, #c2410c, #ea580c)", padding:"24px"}}>
        <Link href="/landing" style={{color:"rgba(255,255,255,0.7)", textDecoration:"none", fontSize:"13px"}}>← Back</Link>
        <div style={{textAlign:"center", marginTop:"16px"}}>
          <div style={{fontSize:"32px"}}>🎓</div>
          <div style={{color:"#fff", fontWeight:"900", fontSize:"22px", marginTop:"8px"}}>Companion</div>
          <div style={{color:"rgba(255,255,255,0.7)", fontSize:"13px"}}>Your JAMB Study Assistant</div>
        </div>
      </div>

      {/* Tab */}
      <div style={{display:"flex", margin:"24px 24px 0", borderRadius:"12px", overflow:"hidden", border:"1.5px solid #e8e8e8"}}>
        {(["login","signup"] as const).map(m => (
          <button key={m} onClick={() => {setMode(m); setStep(1); setError("");}} style={{
            flex:1, padding:"12px", border:"none", cursor:"pointer", fontWeight:"700", fontSize:"14px",
            backgroundColor: mode === m ? "#ea580c" : "#fff",
            color: mode === m ? "#fff" : "#999"
          }}>{m === "login" ? "Log In" : "Sign Up"}</button>
        ))}
      </div>

      <div style={{padding:"24px", flex:1}}>
        {mode === "login" ? (
          <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
            <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>Welcome back 👋</h2>
            <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Email</label><input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e => update("email", e.target.value)} /></div>
            <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Password</label><input style={inp} type="password" placeholder="••••••" value={form.password} onChange={e => update("password", e.target.value)} /></div>
            {error && <div style={{padding:"10px 14px", backgroundColor:"#fff0f0", border:"1px solid #ffcccc", borderRadius:"10px", color:"#cc0000", fontSize:"13px"}}>⚠️ {error}</div>}
            <button onClick={handleLogin} style={{padding:"15px", borderRadius:"30px", border:"none", background:"linear-gradient(135deg, #c2410c, #ea580c)", color:"#fff", fontWeight:"800", fontSize:"16px", cursor:"pointer", boxShadow:"0 4px 16px rgba(234,88,12,0.35)"}}>Log In →</button>
            <p style={{textAlign:"center", fontSize:"13px", color:"#999"}}>No account? <button onClick={() => setMode("signup")} style={{background:"none", border:"none", color:"#ea580c", fontWeight:"700", cursor:"pointer", fontSize:"13px"}}>Sign up free</button></p>
          </div>
        ) : (
          <div>
            {/* Progress */}
            <div style={{display:"flex", gap:"6px", marginBottom:"24px"}}>
              {[1,2,3].map(s => <div key={s} style={{flex:1, height:"4px", borderRadius:"2px", backgroundColor: s <= step ? "#ea580c" : "#f0f0f0", transition:"all 0.3s"}} />)}
            </div>

            {step === 1 && (
              <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>Personal Info</h2>
                <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Full Name</label><input style={inp} placeholder="Kelechi Promise" value={form.name} onChange={e => update("name", e.target.value)} /></div>
                <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Email</label><input style={inp} type="email" placeholder="promise@gmail.com" value={form.email} onChange={e => update("email", e.target.value)} /></div>
                <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Password</label><input style={inp} type="password" placeholder="Min 6 characters" value={form.password} onChange={e => update("password", e.target.value)} /></div>
                <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Target Institution</label>
                  <select style={inp} value={form.institution} onChange={e => update("institution", e.target.value)}>
                    <option value="">Select...</option>{INSTITUTIONS.map(i => <option key={i}>{i}</option>)}
                  </select></div>
                <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Desired Course</label>
                  <select style={inp} value={form.course} onChange={e => update("course", e.target.value)}>
                    <option value="">Select...</option>{COURSES.map(c => <option key={c}>{c}</option>)}
                  </select></div>
              </div>
            )}

            {step === 2 && (
              <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>JAMB Subjects</h2>
                <p style={{fontSize:"13px", color:"#999", margin:0}}>English is compulsory. Pick 3 more.</p>
                <div style={{padding:"10px 14px", borderRadius:"10px", backgroundColor:"#fff8f5", border:"1px solid #fed7aa"}}>
                  <span style={{fontSize:"13px", color:"#ea580c", fontWeight:"600"}}>✓ English Language (compulsory)</span>
                </div>
                <div style={{display:"flex", flexWrap:"wrap", gap:"10px"}}>
                  {ALL_SUBJECTS.filter(s => s !== "English Language").map(s => {
                    const sel = form.subjects.includes(s);
                    return <button key={s} onClick={() => toggleSubject(s)} style={{padding:"10px 14px", borderRadius:"20px", fontSize:"13px", cursor:"pointer", border: sel ? "2px solid #ea580c" : "1.5px solid #e0e0e0", backgroundColor: sel ? "#fff8f5" : "#fff", color: sel ? "#ea580c" : "#555", fontWeight: sel ? "700" : "400"}}>{s}</button>;
                  })}
                </div>
                <p style={{fontSize:"13px", color: form.subjects.length === 3 ? "#22c55e" : "#ea580c", fontWeight:"600"}}>
                  {form.subjects.length}/3 selected {form.subjects.length === 3 ? "✓ Complete!" : ""}
                </p>
              </div>
            )}

            {step === 3 && (
              <div style={{display:"flex", flexDirection:"column", gap:"20px"}}>
                <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>Your Goals</h2>
                <div>
                  <label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Target Score: <span style={{color:"#ea580c", fontSize:"18px", fontWeight:"900"}}>{form.target}</span></label>
                  <input type="range" min="180" max="400" step="5" value={form.target} onChange={e => update("target", e.target.value)} style={{width:"100%", accentColor:"#ea580c"}} />
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#999"}}><span>180</span><span>290</span><span>400</span></div>
                </div>
                <div><label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"}}>Exam Date</label><input type="date" style={inp} value={form.deadline} onChange={e => update("deadline", e.target.value)} /></div>
                <div>
                  <label style={{fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"8px"}}>Current Preparation Level</label>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
                    {[["1","😰 Not ready"],["2","😐 Just started"],["3","😊 Making progress"],["4","🔥 Almost ready"]].map(([v,l]) => (
                      <button key={v} onClick={() => update("selfRating", v)} style={{padding:"12px 8px", borderRadius:"12px", fontSize:"12px", cursor:"pointer", border: form.selfRating === v ? "2px solid #ea580c" : "1.5px solid #e0e0e0", backgroundColor: form.selfRating === v ? "#fff8f5" : "#fff", color: form.selfRating === v ? "#ea580c" : "#555", fontWeight: form.selfRating === v ? "700" : "400"}}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <div style={{marginTop:"12px", padding:"10px 14px", backgroundColor:"#fff0f0", border:"1px solid #ffcccc", borderRadius:"10px", color:"#cc0000", fontSize:"13px"}}>⚠️ {error}</div>}

            <div style={{marginTop:"24px", display:"flex", gap:"12px"}}>
              {step > 1 && <button onClick={() => setStep(s => s-1)} style={{flex:1, padding:"14px", borderRadius:"30px", border:"1.5px solid #ea580c", backgroundColor:"#fff", color:"#ea580c", fontWeight:"700", fontSize:"15px", cursor:"pointer"}}>← Back</button>}
              <button onClick={step < 3 ? nextStep : handleSignup} style={{flex:2, padding:"14px", borderRadius:"30px", border:"none", background:"linear-gradient(135deg, #c2410c, #ea580c)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", boxShadow:"0 4px 16px rgba(234,88,12,0.35)"}}>
                {step < 3 ? "Continue →" : "🚀 Start Studying!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
