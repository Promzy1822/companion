"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle, LoaderCircle } from "lucide-react";
import { getCutoff, getSmartRecommendation } from "../lib/cutoffs";
import { DOORS } from "../lib/doors";
import { validateEmail, validatePassword, normaliseEmail } from "../lib/auth";
import { D } from "../lib/design";
import { Session } from "../lib/session";
import { Sync } from "../lib/sync";
import { Rich } from "../components/AppIcon";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES      = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const ALL_SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","Government","Economics","Literature in English"];
// A7: preparation levels — shared by the step-3 buttons and the helper line
// that names which one is pre-selected.
const PREP_LEVELS: Array<[string, string]> = [["1","Not ready"],["2","Just started"],["3","Good progress"],["4","Almost ready"]];

type Mode = "login" | "signup" | "forgot";

export function AuthForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode,    setMode]    = useState<Mode>(initialMode);
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState("");
  const [info,    setInfo]    = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  // M12: per-field errors, keyed by field ("name" | "email" | "password" |
  // "institution" | "course" | "subjects" | "deadline"). Server/network
  // errors stay in the shared `error` box; validation errors live here.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // M13: submit timeout — a hung request must never leave the button
  // disabled forever (20s, then re-enable + tell the user).
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // L9(b): forgot-password "check your inbox" step + resend cooldown.
  const [forgotSent, setForgotSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  // L9(c): brief welcome confirmation before redirecting after login/signup.
  const [welcome, setWelcome] = useState("");
  const [rec,     setRec]     = useState<{text:string;minJamb:number;recJamb:number;competition:string}|null>(null);
  const [form,    setForm]    = useState({
    name:"", email:"", password:"", institution:"", course:"",
    subjects:[] as string[], target:"260", deadline:"", selfRating:"2",
  });
  const [wizardTarget, setWizardTarget] = useState(false);
  // A2: the cutoff recommendation prefills the target only once (first
  // institution/course pair). Later changes only suggest it — see the
  // hint under the step-3 slider.
  const [recApplied, setRecApplied] = useState(false);

  useEffect(() => {
    try { if (Session.getUser()) router.replace("/"); } catch {}
  }, [router]);

  // M13: never leak a pending submit timer past unmount.
  useEffect(() => () => { if (submitTimer.current) clearTimeout(submitTimer.current); }, []);

  // L9(b): resend cooldown ticks down once a second.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Landing wizard prefill — the guided-steps wizard on /landing saves the
  // student's answers to localStorage and routes here; apply them once so
  // signup never re-asks. The key is removed after reading so a stale
  // wizard run never prefills a later signup.
  useEffect(() => {
    if (initialMode !== "signup") return;
    try {
      const raw = localStorage.getItem("companion_wizard_answers");
      if (!raw) return;
      localStorage.removeItem("companion_wizard_answers");
      const w = JSON.parse(raw);
      const patch: { subjects?: string[]; target?: string; deadline?: string } = {};
      if (Array.isArray(w.subjects)) {
        const subs = w.subjects.filter((s: unknown) => typeof s === "string" && ALL_SUBJECTS.includes(s)).slice(0, 3);
        if (subs.length === 3) patch.subjects = subs;
      }
      if (typeof w.target === "string" && /^\d+$/.test(w.target)) {
        const t = parseInt(w.target, 10);
        if (t >= 180 && t <= 400) patch.target = String(t);
      }
      if (typeof w.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w.deadline)) {
        const d = new Date(w.deadline + "T00:00:00");
        if (!isNaN(d.getTime()) && d.getTime() > Date.now()) patch.deadline = w.deadline;
      }
      if (Object.keys(patch).length === 0) return;
      setForm((p) => ({ ...p, ...patch }));
      if (patch.target) setWizardTarget(true);
      setInfo("Your plan is filled in — subjects, target score and exam date came from the steps you just finished. Change anything you like.");
    } catch {}
  }, [initialMode]);

  // /auth/confirm sends failed email links here with ?error=reset_link_invalid
  // /reset-password's invalid-link screen links here with ?mode=forgot so its
  // "Send a new link" action lands straight on the forgot-password form.
  useEffect(() => {
    if (initialMode !== "login") return;
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("mode") === "forgot") setMode("forgot");
      if (q.get("error") === "reset_link_invalid") {
        setError("That link has expired or was already used. Log in, or use Forgot password to get a new one.");
      }
    } catch {}
  }, [initialMode]);

  // A2: prefill from the recommendation only the first time. The wizard
  // guard above (wizardTarget) is untouched — this is the direct-signup half.
  useEffect(() => {
    if (form.institution && form.course && form.institution !== "Other" && form.course !== "Other") {
      const c = getCutoff(form.institution, form.course);
      setRec({ text: getSmartRecommendation(form.institution, form.course), minJamb: c.minJamb, recJamb: c.recommendedJamb, competition: c.competition });
      if (!wizardTarget && !recApplied) { update("target", String(c.recommendedJamb)); setRecApplied(true); }
    } else setRec(null);
  }, [form.institution, form.course, wizardTarget, recApplied]);

  const update = (k: string, v: string|string[]) => setForm(p => ({...p, [k]: v}));

  // ── M12: per-field validation (same rules and copy as the old submit-time
  // checks — only the placement changes: error under the field, red border
  // on the field, validated on blur and live-corrected on change once an
  // error is showing). ────────────────────────────────────────────────────
  const setFieldError = (k: string, msg: string) => setFieldErrors((p) => {
    if (!msg) { const n = { ...p }; delete n[k]; return n; }
    return p[k] === msg ? p : { ...p, [k]: msg };
  });
  const fieldMessage = (k: string, v: string | string[]): string => {
    switch (k) {
      case "name":        return typeof v === "string" && !v.trim() ? "Enter your full name" : "";
      case "email":       return typeof v === "string" && (!v.trim() || !validateEmail(v)) ? "Enter a valid email address" : "";
      case "password":    return typeof v === "string" ? (mode === "login" ? (!v.trim() ? "Enter your password" : "") : validatePassword(v).message) : "";
      case "institution": return typeof v === "string" && !v ? "Select your target institution" : "";
      case "course":      return typeof v === "string" && !v ? "Select your desired course" : "";
      case "subjects":    return Array.isArray(v) && v.length < 3 ? `Select ${3 - v.length} more subject(s)` : "";
      case "deadline":    return typeof v === "string" ? (!v ? "Please select your exam date" : v < "2027-03-15" ? "Pick a date on or after 15 March 2027 — the JAMB window starts then" : "") : "";
      default:            return "";
    }
  };
  // Validate one field against the current form state; returns true if it
  // has an error. Used on blur and on submit.
  const validateField = (k: string): boolean => {
    const v = k === "subjects" ? form.subjects : (form as Record<string, string | string[]>)[k] ?? "";
    const msg = fieldMessage(k, v);
    setFieldError(k, msg);
    return msg !== "";
  };
  // Live-correct on change: only re-check a field that is already showing
  // an error, so typing the first character never shouts at the user.
  const recheckField = (k: string, v: string | string[]) => {
    if (fieldErrors[k]) setFieldError(k, fieldMessage(k, v));
  };
  // Red border for a field with an error; plain input style otherwise.
  const fInp = (k: string): React.CSSProperties => fieldErrors[k] ? { ...inp, border: `1.5px solid ${D.danger}` } : inp;
  // Error line rendered under a field. Null when the field is clean.
  const fErr = (k: string) => fieldErrors[k] ? (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: D.dangerText, fontSize: "12px", lineHeight: 1.45 }}>
      <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px" }} />
      <span>{fieldErrors[k]}</span>
    </div>
  ) : null;

  // ── M13: submit timeout (20s). A hung request re-enables the button and
  // tells the user, instead of leaving it disabled forever. ───────────────
  const startSubmitTimeout = () => {
    if (submitTimer.current) clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => {
      submitTimer.current = null;
      setLoading(false);
      setError("This is taking longer than usual — check your connection and try again.");
    }, 20000);
  };
  const clearSubmitTimeout = () => {
    if (submitTimer.current) { clearTimeout(submitTimer.current); submitTimer.current = null; }
  };
  // M13: real spinner (not just a label change) for submit buttons.
  // landingarrowfix: primary-button icon row -- primaryBtn is a flex row
  // so the (block, per preflight) spinner svg stays on the label's line.
  const spinner = (size = 16) => <LoaderCircle size={size} strokeWidth={2.5} style={{ animation: "auth-spin 0.9s linear infinite", flexShrink: 0, marginRight: "8px" }} />;

  // M12: the subject-limit error is a field error under the picker — it
  // never auto-clears (a slow reader must still see it).
  const toggleSubject = (s: string) => {
    const cur = form.subjects;
    if (cur.includes(s)) { const next = cur.filter(x => x !== s); update("subjects", next); recheckField("subjects", next); return; }
    if (cur.length >= 3) { setFieldError("subjects", "Pick 3 subjects — English is already included."); return; }
    const next = [...cur, s];
    update("subjects", next);
    recheckField("subjects", next);
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError(""); setInfo("");
    // M12: per-field errors instead of one shared box.
    const badEmail = validateField("email");
    const badPw = validateField("password");
    if (badEmail || badPw) return;
    setLoading(true);
    startSubmitTimeout();
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: normaliseEmail(form.email), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // L9(a): never show raw server text — log it, show a generic line.
        console.error("Login failed:", data?.error);
        setError("Something went wrong on our side. Please try again.");
        return;
      }
      Session.start(data.user);
      void Sync.hydrate();
      // L9(c): brief welcome confirmation before redirecting.
      setWelcome(data.user?.name ? `Welcome back, ${data.user.name} — taking you to your plan…` : "Welcome back — taking you to your plan…");
      setTimeout(() => router.replace("/"), 1500);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      clearSubmitTimeout();
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
  const handleForgot = async () => {
    setError(""); setInfo("");
    // M12: per-field error under the email field.
    if (validateField("email")) return;
    setLoading(true);
    startSubmitTimeout();
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: normaliseEmail(form.email) }),
      });
      const data = await res.json();
      // L9(a): never show raw server text — log it, show a generic line.
      if (!res.ok) { console.error("Forgot password failed:", data?.error); setError("Something went wrong on our side. Please try again."); return; }
      // L9(b): "check your inbox" step with a Resend action on a 60s cooldown.
      setForgotSent(true);
      setResendIn(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      clearSubmitTimeout();
      setLoading(false);
    }
  };

  // ── SIGNUP ───────────────────────────────────────────────────────────────────
  const nextStep = () => {
    setError("");
    // M12: per-field errors (same rules and copy as before).
    if (step === 1) {
      const bad = ["name", "email", "password", "institution", "course"].map(validateField).some(Boolean);
      if (bad) return;
    }
    if (step === 2 && validateField("subjects")) return;
    setStep(s => s + 1);
  };

  const signup = async () => {
    // M12: exam-date error under the date field, not the shared box.
    if (validateField("deadline")) return;
    setLoading(true); setError("");
    startSubmitTimeout();
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
      // L9(a): never show raw server text — log it, show a generic line.
      if (!res.ok) { console.error("Signup failed:", data?.error); setError("Something went wrong on our side. Please try again."); return; }
      // Account created — start session immediately
      Session.start(data.user);
      void Sync.hydrate();
      // L9(c): brief welcome confirmation before redirecting.
      setWelcome(data.user?.name ? `Welcome, ${data.user.name} — taking you to your plan…` : "Welcome — taking you to your plan…");
      setTimeout(() => router.replace("/"), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      clearSubmitTimeout();
      setLoading(false);
    }
  };


  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"12px",
    border:`1.5px solid ${D.border}`, fontSize:"15px", outline:"none",
    background:D.bg, color:D.text, boxSizing:"border-box", fontFamily:"inherit",
    colorScheme:"dark",
  };
  const lbl: React.CSSProperties = { fontSize:"13px", fontWeight:600, color:D.sub, display:"block", marginBottom:"6px" };
  const errBox: React.CSSProperties = { display:"flex", alignItems:"flex-start", gap:"8px", padding:"10px 14px", background:D.dangerLight, border:`1px solid ${D.danger}66`, borderRadius:"12px", color:D.dangerText, fontSize:"13px", lineHeight:1.45 };
  const infoBox: React.CSSProperties = { display:"flex", alignItems:"flex-start", gap:"8px", padding:"10px 14px", background:D.successLight, border:`1px solid ${D.success}59`, borderRadius:"12px", color:D.successText, fontSize:"13px", lineHeight:1.45 };
  const primaryBtn = (loading: boolean): React.CSSProperties => ({ width:"100%", padding:"14px", borderRadius:"12px", border:"none", background:loading?D.muted:D.accent, color:loading?"#fff":"#1F1156", fontWeight:800, fontSize:"15px", cursor:loading?"not-allowed":"pointer", boxShadow:loading?"none":`0 2px 10px ${D.accent}59`, display:"flex", alignItems:"center", justifyContent:"center" });
  const COMP_DISP: Record<string,string> = { "Very High":D.dangerText, "High":D.accent, "Moderate":D.primaryText, "Low":D.successText };
  const compColor = rec ? (COMP_DISP[rec.competition] || D.primaryText) : D.primaryText;

  return (
    <div className="fd-page" style={{ minHeight:"100vh", background:"linear-gradient(165deg, #2A1B6B 0%, #1F1156 60%, #150D38 100%)", fontFamily:"var(--font)", padding:"20px 16px 40px", boxSizing:"border-box" }}>
      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }
        /* A3/D19: hover states for the front door — CSS :hover, the same
           mechanism as globals.css .rail-link:hover / .lift:hover, under
           the same (hover: hover) guard. Inline styles win over classes,
           so the ghost-button background needs !important. Disabled
           buttons and maxed-out chips (aria-disabled) are excluded. */
        @media (hover: hover) {
          .fd-page button:not(:disabled):not([aria-disabled="true"]):hover { filter: brightness(1.08); }
          .fd-page a:hover { filter: brightness(1.15); text-decoration: underline !important; }
          .fd-ghost:hover { background: rgba(255,255,255,0.08) !important; }
        }
        /* A11: the pitch panel (laptop only) already shows the logo, so
           the 56px form logo hides where the panel is present. */
        @media (min-width: 1024px) { .fd-form-logo { display: none; } }`}</style>
      <div className="fd-auth-grid" style={{ maxWidth:"420px", margin:"0 auto" }}>

        {/* Laptop pitch panel — hidden below 1024px */}
        <div className="fd-auth-pitch">
          <img src="/icon-192.png" alt="Companion" width={44} height={44} style={{ borderRadius:"12px", display:"block", marginBottom:"20px" }} />
          <div style={{ fontSize:"30px", fontWeight:900, color:"#fff", lineHeight:1.2, letterSpacing:"-0.5px", marginBottom:"12px" }}>Your JAMB plan,<br/>ready when you are.</div>
          <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.7)", lineHeight:1.6, margin:"0 0 28px", maxWidth:"400px" }}>Subjects, lessons, practice and progress — kept in one place, on the phone you already have.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", maxWidth:"400px" }}>
            {DOORS.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"12px", padding:"10px 14px" }}>
                  <Icon size={18} strokeWidth={1.9} color={D.accent} />
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:"#fff" }}>{d.title}</div>
                    <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)" }}>{d.desc}</div>
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
          <img src="/icon-192.png" alt="Companion" width={56} height={56} className="fd-form-logo" style={{ borderRadius:"16px", display:"block", margin:"0 auto 12px", boxShadow:"0 10px 28px rgba(0,0,0,0.4)" }} />
          <div style={{ fontSize:"22px", fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </div>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.65)", margin:"6px 0 0" }}>
            {mode === "login" ? "Continue your JAMB preparation" : mode === "signup" ? "Free forever — set up in two minutes" : "We will email you a link to set a new one"}
          </p>
        </div>

        {/* Card */}
        <div style={{ background:D.surface, border:"1px solid rgba(255,255,255,0.09)", borderRadius:"18px", padding:"24px", boxShadow:"0 18px 44px rgba(0,0,0,0.4)" }}>

          {/* L9(c): welcome confirmation replaces the form briefly after login/signup. */}
          {welcome ? (
            <div style={{ textAlign:"center", padding:"28px 0" }}>
              <CheckCircle size={56} color={D.successText} strokeWidth={1.5} style={{ margin:"0 auto 16px", display:"block" }} />
              <div style={{ fontSize:"17px", fontWeight:800, color:D.text, lineHeight:1.5 }}><Rich>{welcome}</Rich></div>
            </div>
          ) : (<>
          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (forgotSent ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px", textAlign:"center", padding:"8px 0" }}>
              <CheckCircle size={56} color={D.successText} strokeWidth={1.5} style={{ margin:"0 auto", display:"block" }} />
              <div>
                <div style={{ fontSize:"18px", fontWeight:800, color:D.text, marginBottom:"6px" }}>Check your inbox</div>
                <p style={{ fontSize:"13px", color:D.sub, margin:0, lineHeight:1.55 }}>We sent a reset link to <span style={{ color:D.text, fontWeight:700 }}><Rich>{form.email}</Rich></span>. If an account exists for that email, the link will be waiting. It expires soon — check spam if you don&apos;t see it.</p>
              </div>
              {error && <div style={errBox}><AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{error}</Rich></span></div>}
              <button onClick={handleForgot} disabled={loading || resendIn > 0} style={primaryBtn(loading || resendIn > 0)}>
                {loading ? (<>{spinner()}Sending…</>) : resendIn > 0 ? `Resend link (${resendIn}s)` : "Resend link"}
              </button>
              <button onClick={()=>{setForgotSent(false);setError("");setInfo("");}} style={{ background:"none", border:"none", color:D.primaryText, fontWeight:700, fontSize:"13px", cursor:"pointer", textAlign:"center", minHeight:"44px" }}>
                Use a different email
              </button>
              <button onClick={()=>{setMode("login");setForgotSent(false);setError("");setInfo("");}} style={{ background:"none", border:"none", color:D.primaryText, fontWeight:700, fontSize:"13px", cursor:"pointer", textAlign:"center", minHeight:"44px" }}>
                Back to Login
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input style={fInp("email")} type="email" placeholder="your@email.com" value={form.email} onChange={e=>{update("email",e.target.value);recheckField("email",e.target.value);}} onBlur={()=>validateField("email")} onKeyDown={e=>e.key==="Enter"&&handleForgot()} autoComplete="email" />
                {fErr("email")}
              </div>
              {error && <div style={errBox}><AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{error}</Rich></span></div>}
              {info  && <div style={infoBox}><CheckCircle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{info}</Rich></span></div>}
              <button onClick={handleForgot} disabled={loading} style={primaryBtn(loading)}>
                {loading ? (<>{spinner()}Sending…</>) : "Send Reset Link"}
              </button>
              <button onClick={()=>{setMode("login");setError("");setInfo("");}} style={{ background:"none", border:"none", color:D.primaryText, fontWeight:700, fontSize:"13px", cursor:"pointer", textAlign:"center", minHeight:"44px" }}>
                Back to Login
              </button>
            </div>
          ))}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input style={fInp("email")} type="email" placeholder="your@email.com" value={form.email} onChange={e=>{update("email",e.target.value);recheckField("email",e.target.value);}} onBlur={()=>validateField("email")} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoComplete="email" />
                {fErr("email")}
              </div>
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position:"relative" }}>
                  <input style={{ ...fInp("password"), paddingRight:"52px" }} type={showPw?"text":"password"} placeholder="Your password" value={form.password} onChange={e=>{update("password",e.target.value);recheckField("password",e.target.value);}} onBlur={()=>validateField("password")} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoComplete="current-password" />
                  <button onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Hide password":"Show password"} style={{ position:"absolute", right:2, top:"50%", transform:"translateY(-50%)", width:44, height:44, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:D.sub }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {fErr("password")}
              </div>
              <button onClick={()=>{setMode("forgot");setError("");setInfo("");setFieldErrors({});}} style={{ background:"none", border:"none", color:D.primaryText, fontSize:"14px", fontWeight:600, cursor:"pointer", textAlign:"left", padding:0, textDecoration:"underline" }}>
                Forgot password?
              </button>
              {error && <div style={errBox}><AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{error}</Rich></span></div>}
              <button onClick={handleLogin} disabled={loading} style={primaryBtn(loading)}>
                {loading ? (<>{spinner()}Logging in…</>) : "Log In"}
              </button>
              <p style={{ textAlign:"center", fontSize:"13px", color:D.sub, margin:0 }}>
                No account?{" "}
                <Link href="/auth/signup" style={{ color:D.primaryText, fontWeight:700, fontSize:"13px", textDecoration:"none" }}>Sign up free</Link>
              </p>
            </div>
          )}

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <div>
              <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
                {["Personal info","Subjects","Goal"].map((label, i) => {
                  const n = i + 1;
                  const done = n < step;
                  const cur = n === step;
                  return (
                    <div key={label} style={{ flex:1, display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", fontWeight:700, color:done?D.successText:cur?D.primaryText:D.muted }}>
                      {done ? <CheckCircle size={13} strokeWidth={2.5} /> : <span style={{ width:"8px", height:"8px", borderRadius:"50%", flexShrink:0, background:cur?D.primary:"transparent", border:cur?"none":`1.5px solid ${D.muted}` }} />}
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:"6px", marginBottom:"24px" }}>
                {[1,2,3].map(s=>(
                  <div key={s} style={{ flex:1, height:"4px", borderRadius:"2px", background:s<=step?D.primary:D.border, transition:"background 0.3s" }}/>
                ))}
              </div>
              {info && <div style={{ ...infoBox, marginBottom:"16px" }}><CheckCircle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span>{info}</span></div>}

              {step === 1 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                  <div><h2 style={{ fontSize:"17px", fontWeight:800, color:D.text, margin:"0 0 4px" }}>Personal Info</h2><p style={{ fontSize:"13px", color:D.sub, margin:0 }}>Step 1 of 3</p></div>
                  <div><label style={lbl}>Full Name</label><input style={fInp("name")} placeholder="e.g. Kelechi Promise" value={form.name} onChange={e=>{update("name",e.target.value);recheckField("name",e.target.value);}} onBlur={()=>validateField("name")} autoComplete="name" />{fErr("name")}</div>
                  <div><label style={lbl}>Email Address</label><input style={fInp("email")} type="email" placeholder="your@email.com" value={form.email} onChange={e=>{update("email",e.target.value);recheckField("email",e.target.value);}} onBlur={()=>validateField("email")} autoComplete="email" />{fErr("email")}</div>
                  <div>
                    <label style={lbl}>Password</label>
                    <div style={{ position:"relative" }}>
                      <input style={{ ...fInp("password"), paddingRight:"52px" }} type={showPw?"text":"password"} placeholder="Min. 8 characters" value={form.password} onChange={e=>{update("password",e.target.value);recheckField("password",e.target.value);}} onBlur={()=>validateField("password")} autoComplete="new-password" />
                      <button onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Hide password":"Show password"} style={{ position:"absolute", right:2, top:"50%", transform:"translateY(-50%)", width:44, height:44, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:D.sub }}>
                        {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                    {fErr("password")}
                    <p style={{ fontSize:"12px", color:D.sub, margin:"6px 0 0", lineHeight:1.5 }}>At least 8 characters.</p>
                  </div>
                  <div><label style={lbl}>Target Institution</label><select style={fInp("institution")} value={form.institution} onChange={e=>{update("institution",e.target.value);recheckField("institution",e.target.value);}} onBlur={()=>validateField("institution")}><option value="">Select institution…</option>{INSTITUTIONS.map(i=><option key={i}><Rich>{i}</Rich></option>)}</select>{fErr("institution")}</div>
                  <div><label style={lbl}>Desired Course</label><select style={fInp("course")} value={form.course} onChange={e=>{update("course",e.target.value);recheckField("course",e.target.value);}} onBlur={()=>validateField("course")}><option value="">Select course…</option>{COURSES.map(c=><option key={c}><Rich>{c}</Rich></option>)}</select>{fErr("course")}</div>
                  {rec && (
                    <div style={{ borderRadius:"12px", overflow:"hidden", border:`1px solid ${compColor}55` }}>
                      <div style={{ padding:"10px 14px", background:`${compColor}1F` }}>
                        <div style={{ fontSize:"11px", fontWeight:700, color:compColor, marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.5px" }}><Rich>{rec.competition}</Rich> Competition</div>
                        <div style={{ fontSize:"13px", color:D.text, lineHeight:1.5 }}><Rich>{rec.text}</Rich></div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", padding:"10px 14px" }}>
                        {[{label:"Typical minimum (2024/25)",val:rec.minJamb},{label:"Competitive target (2024/25)",val:rec.recJamb}].map((s,i)=>(
                          <div key={i} style={{ padding:"10px", borderRadius:"9px", background:D.bg, textAlign:"center", border:`1px solid ${D.border}` }}>
                            <div style={{ fontSize:"11px", color:D.sub, marginBottom:"3px" }}><Rich>{s.label}</Rich></div>
                            <div style={{ fontSize:"22px", fontWeight:900, color:D.text }}><Rich>{s.val}</Rich></div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding:"10px 14px", borderTop:`1px solid ${D.border}`, fontSize:"12px", color:D.sub, lineHeight:1.5 }}>Guide only, from 2024/25 cutoffs. Admission also depends on Post-UTME, O-levels and quota — check the university's site.</div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                  <div><h2 style={{ fontSize:"17px", fontWeight:800, color:D.text, margin:"0 0 4px" }}>JAMB Subjects</h2><p style={{ fontSize:"13px", color:D.sub, margin:0 }}>Step 2 of 3 — English is compulsory. Select 3 more.</p></div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"12px", background:D.successLight, border:`1px solid ${D.success}59` }}>
                    <CheckCircle size={15} color={D.successText} strokeWidth={2}/><span style={{ fontSize:"13px", color:D.successText, fontWeight:600 }}>English Language (auto-included)</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                    {ALL_SUBJECTS.map(s=>{
                      const sel=form.subjects.includes(s), max=!sel&&form.subjects.length>=3;
                      return <button key={s} onClick={()=>toggleSubject(s)} aria-disabled={max ? true : undefined} style={{ padding:"9px 14px", borderRadius:"50px", fontSize:"13px", minHeight:"44px", cursor:max?"not-allowed":"pointer", border:`1.5px solid ${sel?D.primary:D.border}`, background:sel?D.primaryLight:D.surface2, color:sel?D.primaryText:max?D.muted:D.text, fontWeight:sel?700:400, transition:"all 0.15s" }}><Rich>{s}</Rich></button>;
                    })}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"12px", background:D.primaryLight, border:`1px solid ${D.primary}59` }}>
                    {form.subjects.length===3 && <CheckCircle size={15} color={D.successText} strokeWidth={2} />}
                    <span style={{ fontSize:"13px", color:D.primaryText, fontWeight:700 }}><Rich>{form.subjects.length + " of 3 picked" + (form.subjects.length===3 ? ", all set" : ", " + (3 - form.subjects.length) + " more to go")}</Rich></span>
                  </div>
                  {fErr("subjects")}
                </div>
              )}

              {step === 3 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                  <div><h2 style={{ fontSize:"17px", fontWeight:800, color:D.text, margin:"0 0 4px" }}>Set Your Goal</h2><p style={{ fontSize:"13px", color:D.sub, margin:0 }}>Step 3 of 3</p></div>
                  <div>
                    <label style={{ ...lbl, display:"flex", justifyContent:"space-between", alignItems:"center" }}><span>Target Score</span><span style={{ fontSize:"22px", fontWeight:900, color:D.primaryText }}><Rich>{form.target}</Rich></span></label>
                    <input type="range" min="180" max="400" step="5" value={form.target} onChange={e=>update("target",e.target.value)} style={{ width:"100%", accentColor:D.primary }}/>
                    <p style={{ fontSize:"12px", color:D.sub, margin:"8px 0 0", lineHeight:1.5 }}>Scores run from 180 to 400, in steps of 5.</p>
                    {rec && form.target !== String(rec.recJamb) && (
                      <p style={{ fontSize:"12px", color:D.primaryText, margin:"6px 0 0", lineHeight:1.5 }}><Rich>{`For ${form.course} at ${form.institution}, ${rec.recJamb} is a competitive target.`}</Rich></p>
                    )}
                  </div>
                  <div><label style={lbl}>JAMB Exam Date</label><input type="date" min="2027-03-15" style={fInp("deadline")} value={form.deadline} onChange={e=>{update("deadline",e.target.value);recheckField("deadline",e.target.value);}} onBlur={()=>validateField("deadline")}/>{fErr("deadline")}<p style={{ fontSize:"12px", color:D.sub, margin:"6px 0 0", lineHeight:1.5 }}>JAMB 2027 is expected 15–25 March 2027 (proposed, not confirmed). Pick the date on your exam slip if you know it.</p></div>
                  <div>
                    <label style={{ ...lbl, marginBottom:"4px" }}>Preparation Level</label>
                    <p style={{ fontSize:"12px", color:D.sub, margin:"0 0 10px", lineHeight:1.5 }}>“{PREP_LEVELS.find(([v]) => v === form.selfRating)?.[1] ?? "Just started"}” is picked for now — tap a different one if it fits you better.</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                      {PREP_LEVELS.map(([v,l])=>(
                        <button key={v} onClick={()=>update("selfRating",v)} style={{ padding:"12px 8px", borderRadius:"12px", fontSize:"13px", minHeight:"44px", cursor:"pointer", border:`1.5px solid ${form.selfRating===v?D.primary:D.border}`, background:form.selfRating===v?D.primaryLight:D.surface2, color:form.selfRating===v?D.primaryText:D.sub, fontWeight:form.selfRating===v?700:400, transition:"all 0.15s" }}><Rich>{l}</Rich></button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <div style={{ ...errBox, marginTop:"12px" }}><AlertTriangle size={15} strokeWidth={2} style={{ flexShrink:0, marginTop:"1px" }} /><span><Rich>{error}</Rich></span></div>}

              <div style={{ marginTop:"20px", display:"flex", gap:"10px" }}>
                {step > 1 && <button onClick={()=>{setStep(s=>s-1);setError("");setFieldErrors({});}} className="fd-ghost" style={{ flex:"0 0 auto", padding:"14px 18px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.2)", background:"transparent", color:"#fff", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>Back</button>}
                <button onClick={step<3?nextStep:signup} disabled={loading} style={{ ...primaryBtn(loading), flex:1, width:"auto" }}>
                  {loading ? (<>{spinner()}Please wait…</>) : step===1 ? "Continue to subjects" : step===2 ? "Continue to your goal" : "Create my account"}
                </button>
              </div>
              <p style={{ textAlign:"center", fontSize:"13px", color:D.sub, margin:"14px 0 0" }}>
                Already have an account?{" "}
                <Link href="/auth" style={{ color:D.primaryText, fontWeight:700, fontSize:"13px", textDecoration:"none" }}>Log in</Link>
              </p>
            </div>
          )}
          </>)}
        </div>

        <p style={{ textAlign:"center", fontSize:"12px", color:"rgba(255,255,255,0.4)", margin:"20px 0 0" }}>Companion — built for Nigerian JAMB students</p>
        </div>
      </div>
    </div>
  );
}
