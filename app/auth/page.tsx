"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { getCutoff, getSmartRecommendation, getAdmissionProbability } from "../lib/cutoffs";
import { hashPassword, verifyPassword, validateEmail, validatePassword } from "../lib/auth";
import { C, palette } from "../lib/design";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES      = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const ALL_SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English","Geography","CRS","IRS","Commerce","Agricultural Science","Further Mathematics"];

const COMP_COLOR: Record<string,string> = { "Very High":"#FA3E3E","High":"#EA580C","Moderate":C.primary,"Low":"#31A24C" };

export default function Auth() {
  const router = useRouter();
  const [mode, setMode]   = useState<"login"|"signup">("login");
  const [step, setStep]   = useState(1);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rec, setRec]     = useState<{text:string;minJamb:number;recJamb:number;competition:string}|null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm]   = useState({
    name:"", email:"", password:"", institution:"", course:"",
    subjects:[] as string[], target:"260", deadline:"", selfRating:"2",
  });

  useEffect(() => {
    const u = localStorage.getItem("companion_user");
    if (u) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (form.institution && form.course && form.institution !== "Other" && form.course !== "Other") {
      const c = getCutoff(form.institution, form.course);
      setRec({ text: getSmartRecommendation(form.institution, form.course), minJamb: c.minJamb, recJamb: c.recommendedJamb, competition: c.competition });
      update("target", String(c.recommendedJamb));
    } else setRec(null);
  }, [form.institution, form.course]);

  const update = (k: string, v: string|string[]) => setForm(p => ({...p, [k]: v}));

  const toggleSubject = (s: string) => {
    const cur = form.subjects;
    if (cur.includes(s)) { update("subjects", cur.filter(x => x !== s)); return; }
    if (cur.length >= 3) { setError("Select only 3 more (English is auto-included)"); setTimeout(()=>setError(""),2000); return; }
    update("subjects", [...cur, s]);
  };

  const handleLogin = () => {
    setError("");
    if (!form.email.trim() || !form.password.trim()) { setError("Please fill all fields"); return; }
    if (!validateEmail(form.email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    setTimeout(() => {
      try {
        const email = form.email.toLowerCase().trim();
        let account = null;
        try {
          const accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
          account = accs.find((a) => a.email === email) || null;
        } catch {}
        if (!account) {
          const legacy = localStorage.getItem("companion_user");
          if (legacy) { try { const u = JSON.parse(legacy); if (u.email === email) account = u; } catch {} }
        }
        if (!account) { setError("No account found. Please sign up."); return; }
        const emailOk = u.email === form.email.toLowerCase().trim();
        const pwOk    = u.passwordHash ? verifyPassword(form.password, u.passwordHash) : u.password === form.password;
        if (!emailOk || !pwOk) { setError("Incorrect email or password."); return; }
        const pwOk = account.passwordHash
          ? verifyPassword(form.password, account.passwordHash)
          : account.password === form.password;
        if (!pwOk) { setError("Wrong password. Please try again."); return; }
        if (!account.passwordHash) {
          account.passwordHash = hashPassword(form.password);
          delete account.password;
          try {
            const accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
            const idx = accs.findIndex((a) => a.email === account.email);
            if (idx >= 0) { accs[idx] = account; localStorage.setItem("companion_accounts", JSON.stringify(accs)); }
          } catch {}
        }
        localStorage.setItem("companion_user", JSON.stringify(account));
        router.replace("/");
        router.replace("/");
      } finally { setLoading(false); }
    }, 300);
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError("Enter your full name"); return; }
      if (!validateEmail(form.email)) { setError("Enter a valid email address"); return; }
      const pw = validatePassword(form.password);
      if (!pw.valid) { setError(pw.message); return; }
      if (!form.institution) { setError("Select your target institution"); return; }
      if (!form.course)      { setError("Select your desired course"); return; }
    }
    if (step === 2 && form.subjects.length < 3) { setError(`Select ${3 - form.subjects.length} more subject(s)`); return; }
    setStep(s => s + 1);
  };

  const signup = () => {
    if (!form.deadline) { setError("Please select your exam date"); return; }
    const cutoff = form.institution !== "Other" && form.course !== "Other" ? getCutoff(form.institution, form.course) : null;
    localStorage.setItem("companion_user", JSON.stringify({
      ...form,
      email:        form.email.toLowerCase().trim(),
      passwordHash: hashPassword(form.password),
      password:     undefined,
      subjects:     ["English Language", ...form.subjects],
      cutoffData:   cutoff,
      recommendation: rec?.text || null,
      createdAt:    new Date().toISOString(),
    }));
    try {
      const _u = JSON.parse(localStorage.getItem("companion_user") || "{}");
      const _accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
      const _idx = _accs.findIndex((a) => a.email === _u.email);
      if (_idx >= 0) _accs[_idx] = _u; else _accs.push(_u);
      localStorage.setItem("companion_accounts", JSON.stringify(_accs));
    } catch {}
    router.replace("/");
  };

  const prob = rec && form.institution !== "Other" && form.course !== "Other"
    ? getAdmissionProbability(parseInt(form.target), getCutoff(form.institution, form.course)) : null;

  // Styles
  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"10px",
    border:"1.5px solid #E4E6EB", fontSize:"15px", outline:"none",
    background:"#F7F8FA", color:"#050505", boxSizing:"border-box",
    fontFamily:"inherit",
  };
  const lbl: React.CSSProperties = { fontSize:"13px", fontWeight:600, color:"#65676B", display:"block", marginBottom:"6px" };

  return (
    <div style={{
      minHeight:"100vh", background:"#F0F2F5",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      display:"flex", flexDirection:"column",
    }}>
      {/* Header */}
      <div style={{
        background: C.primary,
        padding: "20px 20px 32px",
      }}>
        <Link href="/landing" style={{
          display:"inline-flex", alignItems:"center", gap:"6px",
          color:"rgba(255,255,255,0.75)", fontSize:"13px",
          textDecoration:"none", marginBottom:"20px",
        }}>
          <ArrowLeft size={15} strokeWidth={2} />
          Back
        </Link>
        <div style={{ textAlign:"center" }}>
          <img src="/icon-192.png" alt="Companion" width={60} height={60}
            style={{ borderRadius:"16px", margin:"0 auto 14px", display:"block", boxShadow:"0 6px 20px rgba(0,0,0,0.25)" }} />
          <div style={{ color:"#fff", fontWeight:800, fontSize:"22px", letterSpacing:"-0.4px" }}>companion</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", marginTop:"4px" }}>AI JAMB Study Assistant</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ padding:"20px 16px", flex:1 }}>
        <div style={{
          background:"#fff", borderRadius:"16px",
          border:"1px solid #E4E6EB",
          boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
          overflow:"hidden",
        }}>
          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid #E4E6EB" }}>
            {(["login","signup"] as const).map(m => (
              <button key={m} onClick={()=>{setMode(m);setStep(1);setError("");}} style={{
                flex:1, padding:"14px", border:"none", cursor:"pointer",
                fontWeight:700, fontSize:"14px", background:"transparent",
                color: mode===m ? C.primary : "#65676B",
                borderBottom: `2.5px solid ${mode===m ? C.primary : "transparent"}`,
                transition:"all 0.2s",
              }}>
                {m === "login" ? "Log In" : "Create Account"}
              </button>
            ))}
          </div>

          <div style={{ padding:"24px" }}>
            {/* LOGIN */}
            {mode === "login" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                <div>
                  <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px", letterSpacing:"-0.3px" }}>Welcome back</h2>
                  <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>Log in to continue your study journey</p>
                </div>
                <div>
                  <label style={lbl}>Email address</label>
                  <input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>update("email",e.target.value)} />
                </div>
                <div style={{ position:"relative" }}>
                  <label style={lbl}>Password</label>
                  <input style={inp} type={showPw?"text":"password"} placeholder="••••••" value={form.password} onChange={e=>update("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
                  <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:14, bottom:14, background:"none", border:"none", cursor:"pointer", color:"#65676B", padding:0 }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <div style={{ padding:"10px 14px", background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"10px", color:"#D0021B", fontSize:"13px" }}>⚠️ {error}</div>}
                <button onClick={handleLogin} disabled={loading} style={{
                  padding:"15px", borderRadius:"10px", border:"none",
                  background: loading ? "#ccc" : C.primary,
                  color:"#fff", fontWeight:700, fontSize:"15px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                  {loading ? "Logging in…" : "Log In"}
                </button>
                <p style={{ textAlign:"center", fontSize:"13px", color:"#65676B", margin:0 }}>
                  No account?{" "}
                  <button onClick={()=>setMode("signup")} style={{ background:"none", border:"none", color:C.primary, fontWeight:700, cursor:"pointer", fontSize:"13px" }}>
                    Create one free
                  </button>
                </p>
              </div>
            )}

            {/* SIGNUP */}
            {mode === "signup" && (
              <div>
                {/* Progress */}
                <div style={{ display:"flex", gap:"6px", marginBottom:"24px" }}>
                  {[1,2,3].map(s=>(
                    <div key={s} style={{
                      flex:1, height:"4px", borderRadius:"2px",
                      background: s < step ? C.primary : s === step ? C.primary : "#E4E6EB",
                      opacity: s < step ? 0.4 : 1,
                      transition:"all 0.3s",
                    }} />
                  ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                    <div>
                      <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px", letterSpacing:"-0.3px" }}>Personal Info</h2>
                      <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>We'll personalise your study plan automatically</p>
                    </div>
                    <div>
                      <label style={lbl}>Full Name</label>
                      <input style={inp} placeholder="e.g. Kelechi Promise" value={form.name} onChange={e=>update("name",e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Email address</label>
                      <input style={inp} type="email" placeholder="promise@gmail.com" value={form.email} onChange={e=>update("email",e.target.value)} />
                    </div>
                    <div style={{ position:"relative" }}>
                      <label style={lbl}>Password</label>
                      <input style={inp} type={showPw?"text":"password"} placeholder="Minimum 6 characters" value={form.password} onChange={e=>update("password",e.target.value)} />
                      <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:14, bottom:14, background:"none", border:"none", cursor:"pointer", color:"#65676B", padding:0 }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div>
                      <label style={lbl}>Target Institution</label>
                      <select style={inp} value={form.institution} onChange={e=>update("institution",e.target.value)}>
                        <option value="">Select institution…</option>
                        {INSTITUTIONS.map(i=><option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Desired Course</label>
                      <select style={inp} value={form.course} onChange={e=>update("course",e.target.value)}>
                        <option value="">Select course…</option>
                        {COURSES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* AI Insight card */}
                    {rec && (
                      <div style={{ borderRadius:"12px", overflow:"hidden", border:`1px solid ${C.primary}33` }}>
                        <div style={{ padding:"14px", background:"#F0F7FF", borderBottom:`1px solid ${C.primary}22` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                            <span style={{ fontSize:"16px" }}>🤖</span>
                            <span style={{ fontWeight:700, color:C.primary, fontSize:"13px" }}>AI Admission Insight</span>
                            <span style={{
                              marginLeft:"auto", fontSize:"11px", fontWeight:700,
                              color:COMP_COLOR[rec.competition],
                              background:`${COMP_COLOR[rec.competition]}14`,
                              padding:"3px 9px", borderRadius:"20px",
                            }}>{rec.competition}</span>
                          </div>
                          <p style={{ fontSize:"12px", color:"#3C4043", margin:"0 0 12px", lineHeight:1.55 }}>{rec.text}</p>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                            {[{label:"Minimum",val:rec.minJamb,color:"#D0021B"},{label:"Recommended",val:rec.recJamb,color:"#31A24C"}].map((s,i)=>(
                              <div key={i} style={{ padding:"10px", borderRadius:"9px", background:"#fff", textAlign:"center", border:`1px solid ${s.color}33` }}>
                                <div style={{ fontSize:"11px", color:"#65676B", marginBottom:"3px" }}>{s.label}</div>
                                <div style={{ fontSize:"22px", fontWeight:900, color:s.color }}>{s.val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {prob && (
                          <div style={{ padding:"12px 14px", background:"#fff" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                              <span style={{ fontSize:"12px", color:"#65676B", fontWeight:600 }}>Chance with target {form.target}</span>
                              <span style={{ fontSize:"12px", fontWeight:700, color:prob.color }}>{prob.label}</span>
                            </div>
                            <div style={{ height:"7px", borderRadius:"4px", background:"#E4E6EB", overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${prob.percent}%`, background:prob.color, transition:"width 0.5s" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                    <div>
                      <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px", letterSpacing:"-0.3px" }}>JAMB Subjects</h2>
                      <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>English is compulsory. Select 3 more.</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"10px", background:"#E6F4EA", border:"1px solid #31A24C44" }}>
                      <CheckCircle size={15} color="#31A24C" strokeWidth={2} />
                      <span style={{ fontSize:"13px", color:"#0D8050", fontWeight:600 }}>English Language (auto-included)</span>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                      {ALL_SUBJECTS.map(s=>{
                        const sel = form.subjects.includes(s);
                        const max = !sel && form.subjects.length >= 3;
                        return (
                          <button key={s} onClick={()=>toggleSubject(s)} style={{
                            padding:"9px 14px", borderRadius:"50px", fontSize:"13px",
                            cursor: max ? "not-allowed" : "pointer",
                            border: `1.5px solid ${sel ? C.primary : "#E4E6EB"}`,
                            background: sel ? C.primaryLight : "#fff",
                            color: sel ? C.primary : max ? "#B0B3B8" : "#3C4043",
                            fontWeight: sel ? 700 : 400, opacity: max ? 0.5 : 1,
                            transition:"all 0.15s",
                          }}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{
                      padding:"10px 14px", borderRadius:"10px",
                      background: form.subjects.length === 3 ? "#E6F4EA" : "#F0F7FF",
                      border: `1px solid ${form.subjects.length === 3 ? "#31A24C44" : `${C.primary}44`}`,
                    }}>
                      <span style={{ fontSize:"13px", color: form.subjects.length===3 ? "#0D8050" : C.primary, fontWeight:700 }}>
                        {form.subjects.length}/3 {form.subjects.length===3 ? "✓ Complete!" : `— need ${3-form.subjects.length} more`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
                    <div>
                      <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px", letterSpacing:"-0.3px" }}>Set Your Goal</h2>
                      <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>AI has pre-set your target based on your institution</p>
                    </div>
                    <div>
                      <label style={{ ...lbl, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span>Target Score</span>
                        <span style={{ fontSize:"22px", fontWeight:900, color:C.primary }}>{form.target}</span>
                      </label>
                      <input type="range" min="180" max="400" step="5" value={form.target} onChange={e=>update("target",e.target.value)} style={{ width:"100%", accentColor:C.primary }} />
                      {prob && (
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginTop:"6px" }}>
                          <span style={{ color:"#65676B" }}>Admission chance</span>
                          <span style={{ fontWeight:700, color:prob.color }}>{prob.label} ({prob.percent}%)</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={lbl}>JAMB Exam Date</label>
                      <input type="date" style={inp} value={form.deadline} onChange={e=>update("deadline",e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...lbl, marginBottom:"10px" }}>Preparation Level</label>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                        {[["1","😰 Not ready"],["2","😐 Just started"],["3","😊 Good progress"],["4","🔥 Almost ready"]].map(([v,l])=>(
                          <button key={v} onClick={()=>update("selfRating",v)} style={{
                            padding:"12px 8px", borderRadius:"10px", fontSize:"12px", cursor:"pointer",
                            border: `1.5px solid ${form.selfRating===v ? C.primary : "#E4E6EB"}`,
                            background: form.selfRating===v ? C.primaryLight : "#fff",
                            color: form.selfRating===v ? C.primary : "#65676B",
                            fontWeight: form.selfRating===v ? 700 : 400,
                            transition:"all 0.15s",
                          }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ marginTop:"12px", padding:"10px 14px", background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"10px", color:"#D0021B", fontSize:"13px" }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ marginTop:"20px", display:"flex", gap:"10px" }}>
                  {step > 1 && (
                    <button onClick={()=>{setStep(s=>s-1);setError("");}} style={{
                      flex:1, padding:"14px", borderRadius:"10px",
                      border:`1.5px solid ${C.primary}`, background:"#fff",
                      color:C.primary, fontWeight:700, fontSize:"14px", cursor:"pointer",
                    }}>← Back</button>
                  )}
                  <button onClick={step < 3 ? nextStep : signup} style={{
                    flex:2, padding:"14px", borderRadius:"10px", border:"none",
                    background: C.primary, color:"#fff", fontWeight:700, fontSize:"15px", cursor:"pointer",
                  }}>
                    {step < 3 ? "Continue →" : "🚀 Start Studying!"}
                  </button>
                </div>
                <p style={{ textAlign:"center", marginTop:"14px", fontSize:"13px", color:"#65676B" }}>
                  Already have an account?{" "}
                  <button onClick={()=>{setMode("login");setStep(1);}} style={{ background:"none", border:"none", color:C.primary, fontWeight:700, cursor:"pointer", fontSize:"13px" }}>
                    Log in
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
