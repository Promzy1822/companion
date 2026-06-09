"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { getCutoff, getSmartRecommendation, getAdmissionProbability } from "../lib/cutoffs";
import { hashPassword, verifyPassword, validateEmail, validatePassword } from "../lib/auth";
import { C } from "../lib/design";
import { Session } from "../lib/session";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES      = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const ALL_SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English","Geography","CRS","IRS","Commerce","Agricultural Science","Further Mathematics"];

const COMP_COLOR: Record<string,string> = { "Very High":"#FA3E3E","High":"#EA580C","Moderate":C.primary,"Low":"#31A24C" };

export default function Auth() {
  const router = useRouter();
  const [mode,    setMode]    = useState<"login"|"signup">("login");
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [rec,     setRec]     = useState<{text:string;minJamb:number;recJamb:number;competition:string}|null>(null);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({
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
        let account: Record<string,unknown> | null = null;

        // Check companion_accounts array first
        try {
          const accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
          account = accs.find((a: Record<string,unknown>) => a.email === email) || null;
        } catch {}

        // Fall back to companion_user
        if (!account) {
          const legacy = localStorage.getItem("companion_user");
          if (legacy) {
            try {
              const u = JSON.parse(legacy);
              if (u.email === email) account = u;
            } catch {}
          }
        }

        if (!account) { setError("No account found. Please sign up."); return; }

        const pwOk = account.passwordHash
          ? verifyPassword(form.password, account.passwordHash as string)
          : account.password === form.password;

        if (!pwOk) { setError("Wrong password. Please try again."); return; }

        // Upgrade plain password to hash if needed
        if (!account.passwordHash) {
          account.passwordHash = hashPassword(form.password);
          delete account.password;
          try {
            const accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
            const idx = accs.findIndex((a: Record<string,unknown>) => a.email === account!.email);
            if (idx >= 0) { accs[idx] = account; localStorage.setItem("companion_accounts", JSON.stringify(accs)); }
          } catch {}
        }

        localStorage.setItem("companion_user", JSON.stringify(account));
        Session.set();
        router.replace("/");
      } finally {
        setLoading(false);
      }
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
    const cutoff = form.institution !== "Other" && form.course !== "Other"
      ? getCutoff(form.institution, form.course) : null;

    const newUser = {
      name:           form.name.trim(),
      email:          form.email.toLowerCase().trim(),
      passwordHash:   hashPassword(form.password),
      institution:    form.institution,
      course:         form.course,
      subjects:       ["English Language", ...form.subjects],
      target:         form.target,
      deadline:       form.deadline,
      selfRating:     form.selfRating,
      cutoffData:     cutoff,
      recommendation: rec?.text || null,
      createdAt:      new Date().toISOString(),
    };

    localStorage.setItem("companion_user", JSON.stringify(newUser));

    // Also save to accounts array for multi-account support
    try {
      const accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
      const idx = accs.findIndex((a: Record<string,unknown>) => a.email === newUser.email);
      if (idx >= 0) accs[idx] = newUser; else accs.push(newUser);
      localStorage.setItem("companion_accounts", JSON.stringify(accs));
    } catch {}

    Session.set();
    router.replace("/");
  };

  const prob = rec && form.institution !== "Other" && form.course !== "Other"
    ? getAdmissionProbability(parseInt(form.target), getCutoff(form.institution, form.course)) : null;

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"10px",
    border:"1.5px solid #E4E6EB", fontSize:"15px", outline:"none",
    background:"#F7F8FA", color:"#050505", boxSizing:"border-box",
    fontFamily:"inherit",
  };
  const lbl: React.CSSProperties = {
    fontSize:"13px", fontWeight:600, color:"#65676B",
    display:"block", marginBottom:"6px",
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#F0F2F5",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      display:"flex", flexDirection:"column",
    }}>
      {/* Header */}
      <div style={{
        background: C.primary,
        padding:"16px 20px 24px", flexShrink:0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
          <Link href="/landing" style={{
            width:34, height:34, borderRadius:"10px",
            background:"rgba(255,255,255,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center",
            textDecoration:"none", color:"#fff",
          }}>
            <ArrowLeft size={17} strokeWidth={2} color="#fff" />
          </Link>
          <div style={{ color:"#fff", fontWeight:800, fontSize:"17px" }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display:"flex", background:"rgba(255,255,255,0.15)",
          borderRadius:"12px", padding:"4px",
        }}>
          {(["login","signup"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); }} style={{
              flex:1, padding:"10px", borderRadius:"9px", border:"none", cursor:"pointer",
              fontWeight:700, fontSize:"14px",
              background: mode===m ? "#fff" : "transparent",
              color: mode===m ? C.primary : "rgba(255,255,255,0.8)",
              transition:"all 0.2s",
            }}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 40px" }}>
        <div style={{
          background:"#fff", borderRadius:"16px",
          padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)",
        }}>

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px" }}>Log in to Companion</h2>
                <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>Continue your JAMB preparation</p>
              </div>
              <div>
                <label style={lbl}>Email Address</label>
                <input
                  style={inp} type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position:"relative" }}>
                  <input
                    style={{ ...inp, paddingRight:"44px" }}
                    type={showPw ? "text" : "password"}
                    placeholder="Your password"
                    value={form.password}
                    onChange={e => update("password", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                  />
                  <button onClick={() => setShowPw(p => !p)} style={{
                    position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer",
                    display:"flex", alignItems:"center", color:"#65676B",
                  }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              {error && (
                <div style={{ padding:"10px 14px", background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"10px", color:"#D0021B", fontSize:"13px" }}>
                  ⚠️ {error}
                </div>
              )}
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width:"100%", padding:"14px", borderRadius:"10px", border:"none",
                  background: loading ? "#B0B3B8" : C.primary,
                  color:"#fff", fontWeight:700, fontSize:"15px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow:`0 2px 10px rgba(24,119,242,0.3)`,
                }}
              >
                {loading ? "Logging in…" : "Log In →"}
              </button>
              <p style={{ textAlign:"center", fontSize:"13px", color:"#65676B", margin:0 }}>
                No account?{" "}
                <button onClick={() => { setMode("signup"); setStep(1); setError(""); }} style={{
                  background:"none", border:"none", color:C.primary,
                  fontWeight:700, cursor:"pointer", fontSize:"13px",
                }}>
                  Sign up free
                </button>
              </p>
            </div>
          )}

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <div>
              {/* Progress bar */}
              <div style={{ display:"flex", gap:"6px", marginBottom:"24px" }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{
                    flex:1, height:"4px", borderRadius:"2px",
                    background: s <= step ? C.primary : "#E4E6EB",
                    transition:"background 0.3s",
                  }} />
                ))}
              </div>

              {/* Step 1 — Personal info */}
              {step === 1 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div>
                    <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px" }}>Personal Info</h2>
                    <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>Step 1 of 3 — Your details</p>
                  </div>
                  <div>
                    <label style={lbl}>Full Name</label>
                    <input style={inp} placeholder="e.g. Kelechi Promise" value={form.name} onChange={e=>update("name",e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Email Address</label>
                    <input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>update("email",e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Password</label>
                    <div style={{ position:"relative" }}>
                      <input
                        style={{ ...inp, paddingRight:"44px" }}
                        type={showPw ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={e=>update("password",e.target.value)}
                      />
                      <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", color:"#65676B" }}>
                        {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
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
                  {rec && (
                    <div style={{ borderRadius:"12px", overflow:"hidden", border:`1px solid ${COMP_COLOR[rec.competition]}33` }}>
                      <div style={{ padding:"10px 14px", background:`${COMP_COLOR[rec.competition]}12` }}>
                        <div style={{ fontSize:"11px", fontWeight:700, color:COMP_COLOR[rec.competition], marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                          {rec.competition} Competition
                        </div>
                        <div style={{ fontSize:"13px", color:"#3C4043", lineHeight:1.5 }}>{rec.text}</div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", padding:"10px 14px", background:"#fff" }}>
                        {[{label:"Minimum",val:rec.minJamb,color:"#D0021B"},{label:"Recommended",val:rec.recJamb,color:"#31A24C"}].map((s,i)=>(
                          <div key={i} style={{ padding:"10px", borderRadius:"9px", background:"#F7F8FA", textAlign:"center", border:`1px solid ${s.color}33` }}>
                            <div style={{ fontSize:"11px", color:"#65676B", marginBottom:"3px" }}>{s.label}</div>
                            <div style={{ fontSize:"22px", fontWeight:900, color:s.color }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                      {prob && (
                        <div style={{ padding:"10px 14px", background:"#fff", borderTop:"1px solid #E4E6EB" }}>
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

              {/* Step 2 — Subjects */}
              {step === 2 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div>
                    <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px" }}>JAMB Subjects</h2>
                    <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>Step 2 of 3 — English is compulsory. Select 3 more.</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"10px", background:"#E6F4EA", border:"1px solid #31A24C44" }}>
                    <CheckCircle size={15} color="#31A24C" strokeWidth={2} />
                    <span style={{ fontSize:"13px", color:"#0D8050", fontWeight:600 }}>English Language (auto-included)</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                    {ALL_SUBJECTS.map(s => {
                      const sel = form.subjects.includes(s);
                      const max = !sel && form.subjects.length >= 3;
                      return (
                        <button key={s} onClick={()=>toggleSubject(s)} style={{
                          padding:"9px 14px", borderRadius:"50px", fontSize:"13px",
                          cursor: max ? "not-allowed" : "pointer",
                          border:`1.5px solid ${sel ? C.primary : "#E4E6EB"}`,
                          background: sel ? C.primaryLight : "#fff",
                          color: sel ? C.primary : max ? "#B0B3B8" : "#3C4043",
                          fontWeight: sel ? 700 : 400,
                          opacity: max ? 0.5 : 1,
                          transition:"all 0.15s",
                        }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{
                    padding:"10px 14px", borderRadius:"10px",
                    background: form.subjects.length===3 ? "#E6F4EA" : "#F0F7FF",
                    border:`1px solid ${form.subjects.length===3 ? "#31A24C44" : `${C.primary}44`}`,
                  }}>
                    <span style={{ fontSize:"13px", color:form.subjects.length===3?"#0D8050":C.primary, fontWeight:700 }}>
                      {form.subjects.length}/3 {form.subjects.length===3 ? "✓ Complete!" : `— need ${3-form.subjects.length} more`}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 3 — Goals */}
              {step === 3 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
                  <div>
                    <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px" }}>Set Your Goal</h2>
                    <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>Step 3 of 3 — AI has pre-set your target</p>
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
                          border:`1.5px solid ${form.selfRating===v ? C.primary : "#E4E6EB"}`,
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
                  background:C.primary, color:"#fff", fontWeight:700,
                  fontSize:"15px", cursor:"pointer",
                  boxShadow:`0 2px 10px rgba(24,119,242,0.3)`,
                }}>
                  {step < 3 ? "Continue →" : "🚀 Start Studying!"}
                </button>
              </div>
              <p style={{ textAlign:"center", marginTop:"14px", fontSize:"13px", color:"#65676B", margin:0 }}>
                Already have an account?{" "}
                <button onClick={()=>{setMode("login");setStep(1);setError("");}} style={{
                  background:"none", border:"none", color:C.primary,
                  fontWeight:700, cursor:"pointer", fontSize:"13px",
                }}>
                  Log in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
