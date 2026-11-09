"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle, BookOpen, ClipboardList, CalendarDays, Bot } from "lucide-react";
import { getCutoff, getSmartRecommendation, getAdmissionProbability } from "../lib/cutoffs";
import { validateEmail, validatePassword, normaliseEmail } from "../lib/auth";
import { C } from "../lib/design";
import { Session } from "../lib/session";
import { Sync } from "../lib/sync";
import { Rich } from "../components/AppIcon";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES      = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const ALL_SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English"];
const COMP_COLOR: Record<string,string> = { "Very High":"#FA3E3E","High":"#EA580C","Moderate":C.primary,"Low":"#31A24C" };

type Mode = "login" | "signup" | "forgot";

export function AuthForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode,    setMode]    = useState<Mode>(initialMode);
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState("");
  const [info,    setInfo]    = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [rec,     setRec]     = useState<{text:string;minJamb:number;recJamb:number;competition:string}|null>(null);
  const [form,    setForm]    = useState({
    name:"", email:"", password:"", institution:"", course:"",
    subjects:[] as string[], target:"260", deadline:"", selfRating:"2",
  });

  useEffect(() => {
    try { if (Session.getUser()) router.replace("/"); } catch {}
  }, [router]);

  // /auth/confirm sends failed email links here with ?error=reset_link_invalid
  useEffect(() => {
    if (initialMode !== "login") return;
    try {
      if (new URLSearchParams(window.location.search).get("error") === "reset_link_invalid") {
        setError("That link has expired or was already used. Log in, or use Forgot password to get a new one.");
      }
    } catch {}
  }, [initialMode]);

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

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError(""); setInfo("");
    if (!form.email.trim() || !form.password.trim()) { setError("Please fill all fields"); return; }
    if (!validateEmail(form.email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: normaliseEmail(form.email), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      Session.start(data.user);
      void Sync.hydrate();
      router.replace("/");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
  const handleForgot = async () => {
    setError(""); setInfo("");
    if (!validateEmail(form.email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: normaliseEmail(form.email) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed. Try again."); return; }
      setInfo("If an account exists, a reset link has been sent to your email.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP ───────────────────────────────────────────────────────────────────
  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim())          { setError("Enter your full name"); return; }
      if (!validateEmail(form.email)) { setError("Enter a valid email address"); return; }
      const pw = validatePassword(form.password);
      if (!pw.valid)                  { setError(pw.message); return; }
      if (!form.institution)          { setError("Select your target institution"); return; }
      if (!form.course)               { setError("Select your desired course"); return; }
    }
    if (step === 2 && form.subjects.length < 3) { setError(`Select ${3-form.subjects.length} more subject(s)`); return; }
    setStep(s => s + 1);
  };

  const signup = async () => {
    if (!form.deadline) { setError("Please select your exam date"); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        name:        form.name.trim(),
        email:       normaliseEmail(form.email),
        password:    form.password,
        institution: form.institution,
        course:      form.course,
        subjects:    ["English Language", ...form.subjects],
        target:      form.target,
        deadline:    form.deadline,
        selfRating:  form.selfRating,
      };
      // Store for resend OTP use
      sessionStorage.setItem("companion_pending_signup", JSON.stringify(payload));

      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); return; }
      // Account created — start session immediately
      Session.start(data.user);
      void Sync.hydrate();
      router.replace("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const prob = rec && form.institution !== "Other" && form.course !== "Other"
    ? getAdmissionProbability(parseInt(form.target), getCutoff(form.institution, form.course)) : null;

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"12px",
    border:"1.5px solid #2A2F45", fontSize:"15px", outline:"none",
    background:"#0E1018", color:"#F1F2F8", boxSizing:"border-box", fontFamily:"inherit",
    colorScheme:"dark",
  };
  const lbl: React.CSSProperties = { fontSize:"13px", fontWeight:600, color:"#9AA0B5", display:"block", marginBottom:"6px" };
  const errBox: React.CSSProperties = { display:"flex", alignItems:"flex-start", gap:"8px", padding:"10px 14px", background:"rgba(217,48,49,0.14)", border:"1px solid rgba(217,48,49,0.4)", borderRadius:"12px", color:"#FF8A8A", fontSize:"13px", lineHeight:1.45 };
  const infoBox: React.CSSProperties = { display:"flex", alignItems:"flex-start", gap:"8px", padding:"10px 14px", background:"rgba(49,162,76,0.14)", border:"1px solid rgba(49,162,76,0.35)", borderRadius:"12px", color:"#7BD88F", fontSize:"13px", lineHeight:1.45 };
  const primaryBtn = (loading: boolean): React.CSSProperties => ({ width:"100%", padding:"14px", borderRadius:"12px", border:"none", background:loading?"#5B6070":"#F97316", color:loading?"#fff":"#1F1156", fontWeight:800, fontSize:"15px", cursor:loading?"not-allowed":"pointer", boxShadow:loading?"none":"0 2px 10px rgba(249,115,22,0.35)" });
  const COMP_DISP: Record<string,string> = { "Very High":"#FF8A7A", "High":"#F97316", "Moderate":"#A5B4FC", "Low":"#2FBF71" };
  const compColor = rec ? (COMP_DISP[rec.competition] || "#A5B4FC") : "#A5B4FC";

  return (
    <div className="fd-page" style={{ minHeight:"100vh", background:"linear-gradient(165deg, #2A1B6B 0%, #1F1156 60%, #150D38 100%)", fontFamily:"var(--font)", padding:"20px 16px 40px", boxSizing:"border-box" }}>
      <div className="fd-auth-grid" style={{ maxWidth:"420px", margin:"0 auto" }}>

        {/* Laptop pitch panel — hidden below 1024px */}
        <div className="fd-auth-pitch">
          <img src="/icon-192.png" alt="Companion" width={44} height={44} style={{ borderRadius:"12px", display:"block", marginBottom:"20px" }} />
          <div style={{ fontSize:"30px", fontWeight:900, color:"#fff", lineHeight:1.2, letterSpacing:"-0.5px", marginBottom:"12px" }}>Your JAMB plan,<br/>ready when you are.</div>
          <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.7)", lineHeight:1.6, margin:"0 0 28px", maxWidth:"400px" }}>Subjects, lessons, practice and progress — kept in one place, on the phone you already have.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", maxWidth:"400px" }}>
            {[
              { icon: BookOpen, label: "Learn", sub: "Lessons for every syllabus topic" },
              { icon: ClipboardList, label: "Practice", sub: "Real past questions and timed mocks" },
              { icon: CalendarDays, label: "Plan", sub: "A day-by-day plan to your exam date" },
              { icon: Bot, label: "AI Tutor", sub: "Ask anything, or send a photo" },
            ].map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"12px", padding:"10px 14px" }}>
                  <Icon size={18} strokeWidth={1.9} color="#F97316" />
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:"#fff" }}>{d.label}</div>
                    <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)" }}>{d.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)", margin:"28px 0 0" }}>Free · No credit card · Set up in 2 minutes</p>
        </div>

        <div className="fd-auth-form">

        {/* Back to landing */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:"24px" }}>
          <Link href="/landing" aria-label="Back to home" style={{ width:40, height:40, borderRadius:"12px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.14)", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>
            <ArrowLeft size={18} strokeWidth={2} color="#fff" />
          </Link>
        </div>

        {/* Brand + mode title */}
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <img src="/icon-192.png" alt="Companion" width={56} height={56} style={{ borderRadius:"16px", display:"block", margin:"0 auto 12px", boxShadow:"0 10px 28px rgba(0,0,0,0.4)" }} />
          <div style={{ fontSize:"22px", fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </div>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.65)", margin:"6px 0 0" }}>
            {mode === "login" ? "Continue your JAMB preparation" : mode === "signup" ? "Free forever — set up in two minutes" : "We will email you a link to set a new one"}
          </p>
        </div>

        {/* Card */}
        <div style={{ background:"#161925", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"18px", padding:"24px", boxShadow:"0 18px 44px rgba(0,0,0,0.4)" }}>

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>update("email",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleForgot()} autoComplete="email" />
              </div>
              {error && <div style={errBox}><AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{error}</Rich></span></div>}
              {info  && <div style={infoBox}><CheckCircle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{info}</Rich></span></div>}
              <button onClick={handleForgot} disabled={loading} style={primaryBtn(loading)}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <button onClick={()=>{setMode("login");setError("");setInfo("");}} style={{ background:"none", border:"none", color:"#A5B4FC", fontWeight:700, fontSize:"13px", cursor:"pointer", textAlign:"center", minHeight:"44px" }}>
                Back to Login
              </button>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>update("email",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoComplete="email" />
              </div>
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position:"relative" }}>
                  <input style={{ ...inp, paddingRight:"52px" }} type={showPw?"text":"password"} placeholder="Your password" value={form.password} onChange={e=>update("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoComplete="current-password" />
                  <button onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Hide password":"Show password"} style={{ position:"absolute", right:2, top:"50%", transform:"translateY(-50%)", width:44, height:44, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9AA0B5" }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <button onClick={()=>{setMode("forgot");setError("");setInfo("");}} style={{ background:"none", border:"none", color:"#A5B4FC", fontSize:"13px", fontWeight:600, cursor:"pointer", textAlign:"right", padding:0 }}>
                Forgot password?
              </button>
              {error && <div style={errBox}><AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{error}</Rich></span></div>}
              <button onClick={handleLogin} disabled={loading} style={primaryBtn(loading)}>
                {loading ? "Logging in…" : "Log In"}
              </button>
              <p style={{ textAlign:"center", fontSize:"13px", color:"#9AA0B5", margin:0 }}>
                No account?{" "}
                <Link href="/auth/signup" style={{ color:"#A5B4FC", fontWeight:700, fontSize:"13px", textDecoration:"none" }}>Sign up free</Link>
              </p>
            </div>
          )}

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <div>
              <div style={{ display:"flex", gap:"6px", marginBottom:"24px" }}>
                {[1,2,3].map(s=>(
                  <div key={s} style={{ flex:1, height:"4px", borderRadius:"2px", background:s<=step?"#6366F1":"#2A2F45", transition:"background 0.3s" }}/>
                ))}
              </div>

              {step === 1 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div><h2 style={{ fontSize:"17px", fontWeight:800, color:"#F1F2F8", margin:"0 0 4px" }}>Personal Info</h2><p style={{ fontSize:"13px", color:"#9AA0B5", margin:0 }}>Step 1 of 3</p></div>
                  <div><label style={lbl}>Full Name</label><input style={inp} placeholder="e.g. Kelechi Promise" value={form.name} onChange={e=>update("name",e.target.value)} autoComplete="name" /></div>
                  <div><label style={lbl}>Email Address</label><input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>update("email",e.target.value)} autoComplete="email" /></div>
                  <div>
                    <label style={lbl}>Password</label>
                    <div style={{ position:"relative" }}>
                      <input style={{ ...inp, paddingRight:"52px" }} type={showPw?"text":"password"} placeholder="Min. 6 characters" value={form.password} onChange={e=>update("password",e.target.value)} autoComplete="new-password" />
                      <button onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Hide password":"Show password"} style={{ position:"absolute", right:2, top:"50%", transform:"translateY(-50%)", width:44, height:44, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9AA0B5" }}>
                        {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                  </div>
                  <div><label style={lbl}>Target Institution</label><select style={inp} value={form.institution} onChange={e=>update("institution",e.target.value)}><option value="">Select institution…</option>{INSTITUTIONS.map(i=><option key={i}><Rich>{i}</Rich></option>)}</select></div>
                  <div><label style={lbl}>Desired Course</label><select style={inp} value={form.course} onChange={e=>update("course",e.target.value)}><option value="">Select course…</option>{COURSES.map(c=><option key={c}><Rich>{c}</Rich></option>)}</select></div>
                  {rec && (
                    <div style={{ borderRadius:"12px", overflow:"hidden", border:`1px solid ${compColor}55` }}>
                      <div style={{ padding:"10px 14px", background:`${compColor}14` }}>
                        <div style={{ fontSize:"11px", fontWeight:700, color:compColor, marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.5px" }}><Rich>{rec.competition}</Rich> Competition</div>
                        <div style={{ fontSize:"13px", color:"#C9CDDD", lineHeight:1.5 }}><Rich>{rec.text}</Rich></div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", padding:"10px 14px" }}>
                        {[{label:"Minimum",val:rec.minJamb,color:"#FF8A8A"},{label:"Recommended",val:rec.recJamb,color:"#2FBF71"}].map((s,i)=>(
                          <div key={i} style={{ padding:"10px", borderRadius:"9px", background:"#0E1018", textAlign:"center", border:`1px solid ${s.color}33` }}>
                            <div style={{ fontSize:"11px", color:"#9AA0B5", marginBottom:"3px" }}><Rich>{s.label}</Rich></div>
                            <div style={{ fontSize:"22px", fontWeight:900, color:s.color }}><Rich>{s.val}</Rich></div>
                          </div>
                        ))}
                      </div>
                      {prob && (
                        <div style={{ padding:"10px 14px", borderTop:"1px solid #2A2F45" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                            <span style={{ fontSize:"12px", color:"#9AA0B5", fontWeight:600 }}>Admission chance at <Rich>{form.target}</Rich></span>
                            <span style={{ fontSize:"12px", fontWeight:700, color:prob.color }}><Rich>{prob.label}</Rich></span>
                          </div>
                          <div style={{ height:"7px", borderRadius:"4px", background:"#2A2F45", overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${prob.percent}%`, background:prob.color, transition:"width 0.5s" }}/>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div><h2 style={{ fontSize:"17px", fontWeight:800, color:"#F1F2F8", margin:"0 0 4px" }}>JAMB Subjects</h2><p style={{ fontSize:"13px", color:"#9AA0B5", margin:0 }}>Step 2 of 3 — English is compulsory. Select 3 more.</p></div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"12px", background:"rgba(49,162,76,0.14)", border:"1px solid rgba(49,162,76,0.35)" }}>
                    <CheckCircle size={15} color="#2FBF71" strokeWidth={2}/><span style={{ fontSize:"13px", color:"#7BD88F", fontWeight:600 }}>English Language (auto-included)</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                    {ALL_SUBJECTS.map(s=>{
                      const sel=form.subjects.includes(s), max=!sel&&form.subjects.length>=3;
                      return <button key={s} onClick={()=>toggleSubject(s)} style={{ padding:"9px 14px", borderRadius:"50px", fontSize:"13px", minHeight:"44px", cursor:max?"not-allowed":"pointer", border:`1.5px solid ${sel?"#6366F1":"#2A2F45"}`, background:sel?"rgba(99,102,241,0.12)":"#1E2230", color:sel?"#A5B4FC":max?"#5B6070":"#C9CDDD", fontWeight:sel?700:400, opacity:max?0.6:1, transition:"all 0.15s" }}><Rich>{s}</Rich></button>;
                    })}
                  </div>
                  <div style={{ padding:"10px 14px", borderRadius:"12px", background:form.subjects.length===3?"rgba(49,162,76,0.14)":"rgba(99,102,241,0.12)", border:`1px solid ${form.subjects.length===3?"rgba(49,162,76,0.35)":"rgba(99,102,241,0.35)"}` }}>
                    <span style={{ fontSize:"13px", color:form.subjects.length===3?"#7BD88F":"#A5B4FC", fontWeight:700 }}><Rich>{form.subjects.length}</Rich>/3 {form.subjects.length===3?"— Complete":`— need ${3-form.subjects.length} more`}</span>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
                  <div><h2 style={{ fontSize:"17px", fontWeight:800, color:"#F1F2F8", margin:"0 0 4px" }}>Set Your Goal</h2><p style={{ fontSize:"13px", color:"#9AA0B5", margin:0 }}>Step 3 of 3</p></div>
                  <div>
                    <label style={{ ...lbl, display:"flex", justifyContent:"space-between", alignItems:"center" }}><span>Target Score</span><span style={{ fontSize:"22px", fontWeight:900, color:"#A5B4FC" }}><Rich>{form.target}</Rich></span></label>
                    <input type="range" min="180" max="400" step="5" value={form.target} onChange={e=>update("target",e.target.value)} style={{ width:"100%", accentColor:"#6366F1" }}/>
                  </div>
                  <div><label style={lbl}>JAMB Exam Date</label><input type="date" style={inp} value={form.deadline} onChange={e=>update("deadline",e.target.value)}/></div>
                  <div>
                    <label style={{ ...lbl, marginBottom:"10px" }}>Preparation Level</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                      {[["1","Not ready"],["2","Just started"],["3","Good progress"],["4","Almost ready"]].map(([v,l])=>(
                        <button key={v} onClick={()=>update("selfRating",v)} style={{ padding:"12px 8px", borderRadius:"12px", fontSize:"13px", minHeight:"44px", cursor:"pointer", border:`1.5px solid ${form.selfRating===v?"#6366F1":"#2A2F45"}`, background:form.selfRating===v?"rgba(99,102,241,0.12)":"#1E2230", color:form.selfRating===v?"#A5B4FC":"#9AA0B5", fontWeight:form.selfRating===v?700:400, transition:"all 0.15s" }}><Rich>{l}</Rich></button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <div style={{ ...errBox, marginTop:"12px" }}><AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{error}</Rich></span></div>}

              <div style={{ marginTop:"20px", display:"flex", gap:"10px" }}>
                {step > 1 && <button onClick={()=>{setStep(s=>s-1);setError("");}} style={{ flex:1, padding:"14px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.2)", background:"transparent", color:"#fff", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>Back</button>}
                <button onClick={step<3?nextStep:signup} disabled={loading} style={{ ...primaryBtn(loading), flex:2, width:"auto" }}>
                  {loading ? "Please wait…" : step<3 ? "Continue" : "Create Account"}
                </button>
              </div>
              <p style={{ textAlign:"center", fontSize:"13px", color:"#9AA0B5", margin:"14px 0 0" }}>
                Already have an account?{" "}
                <Link href="/auth" style={{ color:"#A5B4FC", fontWeight:700, fontSize:"13px", textDecoration:"none" }}>Log in</Link>
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:"12px", color:"rgba(255,255,255,0.4)", margin:"20px 0 0" }}>Companion — built for Nigerian JAMB students</p>
        </div>
      </div>
    </div>
  );
}
