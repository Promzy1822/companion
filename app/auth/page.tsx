"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import Layout from "../components/Layout";
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

  const T = palette(false); // Auth page always uses light mode for consistency

  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:"8px",
    border:"1.5px solid #E4E6EB", fontSize:"14px", outline:"none",
    background:"#F7F8FA", color:"#050505", boxSizing:"border-box",
    fontFamily:"inherit",
  };
  const lbl: React.CSSProperties = { fontSize:"13px", fontWeight:600, color:"#65676B", display:"block", marginBottom:"6px" };

  return (
    <Layout title="Auth" showNavbar={false} showBottomNav={false} contentWidth="standard">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-primary/70 hover:text-primary transition-colors">
            <ArrowLeft size={18} />
            Back
          </Link>
          <div className="flex items-center gap-4">
            <img src="/icon-192.png" alt="Companion" width={48} height={48}
              className="rounded-xl shadow-lg" />
            <div className="text-center">
              <h1 className="text-2xl font-bold">companion</h1>
              <p className="text-sm text-primary/60">AI JAMB Study Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Card */}
      <main className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-border/20">
            <button
              key="login"
              onClick={()=>{setMode("login");setStep(1);setError("");}}
              className={`flex-1 px-4 py-3 font-medium text-center
                       ${mode==='login' ? 'border-b-2 border-primary bg-primary/5 text-primary' : 'text-muted hover:bg-surface2'}
                       transition-colors`}
            >
              Log In
            </button>
            <button
              key="signup"
              onClick={()=>{setMode("signup");setStep(1);setError("");}}
              className={`flex-1 px-4 py-3 font-medium text-center
                       ${mode==='signup' ? 'border-b-2 border-primary bg-primary/5 text-primary' : 'text-muted hover:bg-surface2'}
                       transition-colors`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6">
            {/* LOGIN */}
            {mode === "login" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold">Welcome back</h2>
                  <p className="text-muted">Log in to continue your study journey</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Email address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e=>update("email",e.target.value)}
                    className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-muted mb-2">Password</label>
                  <input
                    type={showPw?"text":"password"}
                    placeholder="••••••"
                    value={form.password}
                    onChange={e=>update("password",e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                    className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={()=>setShowPw(p=>!p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <div className="mt-2 px-3 py-2 rounded bg-danger/10 text-danger text-sm">
                    ⚠️ {error}
                  </div>
                )}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Logging in…" : "Log In"}
                </button>
                <p className="mt-4 text-center text-sm text-muted">
                  No account?{" "}
                  <button
                    onClick={()=>setMode("signup")}
                    className="text-primary font-medium hover:text-primary/90 transition-colors"
                  >
                    Create one free
                  </button>
                </p>
              </div>
            )}

            {/* SIGNUP */}
            {mode === "signup" && (
              <div className="space-y-6">
                {/* Progress */}
                <div className="flex items-center space-x-3">
                  {[1,2,3].map(s=>(
                    <div key={s} className={`w-3 h-0.5 bg-${s<step?'primary':s===step?'primary':'border-border/20'}
                             rounded transition-colors ${s<step?'opacity-40':''}`}
                    />
                  ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold">Personal Info</h2>
                      <p className="text-muted">We'll personalise your study plan automatically</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Full Name</label>
                      <input
                        placeholder="e.g. Kelechi Promise"
                        value={form.name}
                        onChange={e=>update("name",e.target.value)}
                        className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Email address</label>
                      <input
                        type="email"
                        placeholder="promise@gmail.com"
                        value={form.email}
                        onChange={e=>update("email",e.target.value)}
                        className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-muted mb-2">Password</label>
                      <input
                        type={showPw?"text":"password"}
                        placeholder="Minimum 6 characters"
                        value={form.password}
                        onChange={e=>update("password",e.target.value)}
                        className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={()=>setShowPw(p=>!p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Target Institution</label>
                      <select
                        value={form.institution}
                        onChange={e=>update("institution",e.target.value)}
                        className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select institution…</option>
                        {INSTITUTIONS.map(i=><option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Desired Course</label>
                      <select
                        value={form.course}
                        onChange={e=>update("course",e.target.value)}
                        className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select course…</option>
                        {COURSES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* AI Insight card */}
                    {rec && (
                      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <h3 className="font-medium text-primary">AI Admission Insight</h3>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium
                                   bg-${COMP_COLOR[rec.competition]}/20
                                   text-${COMP_COLOR[rec.competition]}`}>
                            {rec.competition}
                          </span>
                        </div>
                        <p className="text-sm">{rec.text}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-white rounded border border-border/20">
                            <span className="block text-muted">Minimum</span>
                            <span className="block text-lg font-bold text-danger">{rec.minJamb}</span>
                          </div>
                          <div className="text-center p-2 bg-white rounded border border-border/20">
                            <span className="block text-muted">Recommended</span>
                            <span className="block text-lg font-bold text-success">{rec.recJamb}</span>
                          </div>
                        </div>
                        {prob && (
                          <div className="mt-4 p-3 bg-white rounded border border-border/20">
                            <div className="flex justify-between mb-2">
                              <span className="text-muted">Chance with target {form.target}</span>
                              <span className="font-medium">{prob.label}</span>
                            </div>
                            <div className="w-full h-2 bg-border/20 rounded overflow-hidden">
                              <div className={`h-full w-${prob.percent}% bg-${prob.color} transition-width duration-300`} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold">JAMB Subjects</h2>
                      <p className="text-muted">English is compulsory. Select 3 more.</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-success/5 rounded-lg border border-success/20">
                      <CheckCircle size={16} />
                      <span className="font-medium text-success">English Language (auto-included)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {ALL_SUBJECTS.map(s=>{
                        const sel = form.subjects.includes(s);
                        const max = !sel && form.subjects.length >= 3;
                        return (
                          <button
                            key={s}
                            onClick={()=>toggleSubject(s)}
                            className={`px-3 py-2 rounded-md font-medium
                                     ${sel ? 'bg-primary text-white' :
                                       max ? 'border-border/20 text-muted opacity-50 cursor-not-allowed' :
                                       'border-border/20 hover:bg-surface2 text-gray-800'}
                                     transition-colors`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 p-3 rounded
                             ${form.subjects.length===3 ? 'bg-success/5 border border-success/20' : 'bg-primary/5 border border-primary/20'}
                             text-center">
                      <span className="font-medium
                              ${form.subjects.length===3 ? 'text-success' : 'text-primary'}">
                        {form.subjects.length}/3 {form.subjects.length===3 ? "✓ Complete!" : `— need ${3-form.subjects.length} more`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold">Set Your Goal</h2>
                      <p className="text-muted">AI has pre-set your target based on your institution</p>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 text-sm font-medium text-muted">
                        <span>Target Score</span>
                        <span className="font-semibold">{form.target}</span>
                      </label>
                      <input
                        type="range" min="180" max="400" step="5"
                        className="w-full"
                        value={form.target}
                        onChange={e=>update("target",e.target.value)}
                      />
                      {prob && (
                        <div className="mt-3 flex justify-between text-sm">
                          <span className="text-muted">Admission chance</span>
                          <span className="font-medium">{prob.label} ({prob.percent}%)</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">JAMB Exam Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded border border-border/20 bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={form.deadline}
                        onChange={e=>update("deadline",e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Preparation Level</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[["1","😰 Not ready"],["2","😐 Just started"],["3","😊 Good progress"],["4","🔥 Almost ready"]].map(([v,l])=>(
                          <button
                            key={v}
                            onClick={()=>update("selfRating",v)}
                            className={`px-3 py-2 rounded-md font-medium
                                     ${form.selfRating===v ? 'bg-primary text-white' : 'border-border/20 hover:bg-surface2 text-gray-800'}
                                     transition-colors`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 px-3 py-2 rounded bg-danger/10 text-danger text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  {step > 1 && (
                    <button
                      onClick={()=>{setStep(s=>s-1);setError("");}}
                      className="px-4 py-3 border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                  <button
                    onClick={step < 3 ? nextStep : signup}
                    className="px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {step < 3 ? "Continue →" : "🚀 Start Studying!"}
                  </button>
                </div>

                <p className="mt-6 text-center text-sm text-muted">
                  Already have an account?{" "}
                  <button
                    onClick={()=>{setMode("login");setStep(1);}}
                    className="text-primary font-medium hover:text-primary/90 transition-colors"
                  >
                    Log in
                  </button>
                </p>
              </div>
            )}
          </div>
        </main>
      </Layout>
  );
}