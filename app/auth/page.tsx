"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCutoff, getSmartRecommendation, getAdmissionProbability } from "../lib/cutoffs";
import { getSubjectCombo, getFullSubjects } from "../lib/subjectCombinations";
import { hashPassword, verifyPassword, validateEmail, validatePassword } from "../lib/auth";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const CC: Record<string,string> = {"Very High":"#dc2626","High":"#ea580c","Moderate":"#2563eb","Low":"#16a34a"};

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [rec, setRec] = useState<any>(null);
  const [flex, setFlex] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:"", email:"", password:"", institution:"",
    course:"", target:"260", deadline:"", selfRating:"2"
  });

  useEffect(() => {
    const u = localStorage.getItem("companion_user");
    if (u) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (form.institution && form.course && form.institution !== "Other" && form.course !== "Other") {
      const c = getCutoff(form.institution, form.course);
      setRec({ text: getSmartRecommendation(form.institution, form.course), minJamb: c.minJamb, recommendedJamb: c.recommendedJamb, competition: c.competition });
      update("target", String(c.recommendedJamb));
    } else setRec(null);
    setFlex([]);
  }, [form.institution, form.course]);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const combo = form.course ? getSubjectCombo(form.course) : null;
  const prob = rec && form.institution !== "Other" && form.course !== "Other"
    ? getAdmissionProbability(parseInt(form.target), getCutoff(form.institution, form.course)) : null;

  const toggleFlex = (s: string) => {
    if (!combo) return;
    if (flex.includes(s)) { setFlex(p => p.filter(x => x !== s)); setError(""); return; }
    if (flex.length >= combo.flexibleCount) { setError("Select only " + combo.flexibleCount); return; }
    setFlex(p => [...p, s]); setError("");
  };

  const handleLogin = () => {
    setError("");
    if (!form.email.trim() || !form.password.trim()) { setError("Fill all fields"); return; }
    if (!validateEmail(form.email)) { setError("Enter a valid email"); return; }
    setLoading(true);
    try {
      const saved = localStorage.getItem("companion_user");
      if (!saved) { setError("No account found. Please sign up."); return; }
      const user = JSON.parse(saved);
      const emailMatch = user.email === form.email.toLowerCase().trim();
      // Support hashed AND legacy plaintext passwords
      const passwordMatch = user.passwordHash
        ? verifyPassword(form.password, user.passwordHash)
        : user.password === form.password;
      if (!emailMatch || !passwordMatch) { setError("Wrong email or password."); return; }
      // Upgrade plaintext to hash silently
      if (!user.passwordHash) {
        user.passwordHash = hashPassword(form.password);
        delete user.password;
        localStorage.setItem("companion_user", JSON.stringify(user));
      }
      router.replace("/");
    } finally { setLoading(false); }
  };

  const next = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError("Enter your name"); return; }
      if (!validateEmail(form.email)) { setError("Enter valid email"); return; }
      const pwCheck = validatePassword(form.password);
      if (!pwCheck.valid) { setError(pwCheck.message); return; }
      if (!form.institution) { setError("Select institution"); return; }
      if (!form.course) { setError("Select course"); return; }
    }
    if (step === 2 && combo && flex.length < combo.flexibleCount) {
      setError("Select " + (combo.flexibleCount - flex.length) + " more subject(s)"); return;
    }
    setStep(s => s + 1);
  };

  const signup = () => {
    if (!form.deadline) { setError("Select exam date"); return; }
    const subjects = getFullSubjects(form.course, flex);
    const cutoff = form.institution !== "Other" && form.course !== "Other"
      ? getCutoff(form.institution, form.course) : null;
    // Store with hashed password — never plaintext
    const safeUser = {
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      passwordHash: hashPassword(form.password),
      institution: form.institution,
      course: form.course,
      subjects,
      target: form.target,
      deadline: form.deadline,
      selfRating: form.selfRating,
      cutoffData: cutoff,
      recommendation: rec?.text || null,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("companion_user", JSON.stringify(safeUser));
    router.replace("/");
  };

  const inp: React.CSSProperties = { width:"100%", padding:"13px 16px", borderRadius:"12px", border:"1.5px solid #e8e8e8", fontSize:"14px", outline:"none", backgroundColor:"#fafafa", boxSizing:"border-box", color:"#1a1a1a" };
  const lbl: React.CSSProperties = { fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px" };

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#fff",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#7c2d12,#c2410c,#ea580c)",padding:"24px 24px 28px",textAlign:"center",position:"relative"}}>
        <Link href="/landing" style={{position:"absolute",left:"20px",top:"24px",color:"rgba(255,255,255,0.7)",textDecoration:"none",fontSize:"13px",padding:"6px 12px",borderRadius:"10px",backgroundColor:"rgba(255,255,255,0.1)"}}>← Back</Link>
        <img src="/icon-192.png" alt="Companion" width={64} height={64} style={{borderRadius:"18px",margin:"0 auto",display:"block",boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}} />
        <div style={{color:"#fff",fontWeight:"900",fontSize:"22px",marginTop:"12px"}}>companion</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:"13px"}}>AI JAMB Study Assistant</div>
      </div>

      <div style={{display:"flex",margin:"20px 20px 0",borderRadius:"14px",overflow:"hidden",border:"1.5px solid #e8e8e8"}}>
        {(["login","signup"] as const).map(m => (
          <button key={m} onClick={()=>{setMode(m);setStep(1);setError("");}} style={{flex:1,padding:"13px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"14px",backgroundColor:mode===m?"#ea580c":"#fff",color:mode===m?"#fff":"#999",transition:"all 0.2s"}}>
            {m==="login"?"Log In":"Sign Up"}
          </button>
        ))}
      </div>

      <div style={{padding:"24px",flex:1}}>
        {mode==="login" ? (
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <h2 style={{fontSize:"22px",fontWeight:"800",margin:"0 0 4px",color:"#1a1a1a"}}>Welcome back 👋</h2>
            <div><label style={lbl}>Email</label><input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>update("email",e.target.value)}/></div>
            <div><label style={lbl}>Password</label><input style={inp} type="password" placeholder="Password" value={form.password} onChange={e=>update("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
            {error&&<div style={{padding:"10px 14px",backgroundColor:"#fff0f0",border:"1px solid #ffcccc",borderRadius:"10px",color:"#cc0000",fontSize:"13px"}}>⚠️ {error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{padding:"15px",borderRadius:"30px",border:"none",background:loading?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"16px",cursor:loading?"not-allowed":"pointer"}}>
              {loading?"Logging in...":"Log In →"}
            </button>
            <p style={{textAlign:"center",fontSize:"13px",color:"#999"}}>No account? <button onClick={()=>setMode("signup")} style={{background:"none",border:"none",color:"#ea580c",fontWeight:"700",cursor:"pointer",fontSize:"13px"}}>Sign up free</button></p>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",gap:"6px",marginBottom:"24px"}}>
              {[1,2,3].map(s=><div key={s} style={{flex:1,height:"4px",borderRadius:"2px",backgroundColor:s<=step?"#ea580c":"#f0f0f0",transition:"all 0.3s"}}/>)}
            </div>

            {step===1&&(
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <h2 style={{fontSize:"20px",fontWeight:"800",margin:"0 0 4px",color:"#1a1a1a"}}>Personal Info</h2>
                <div><label style={lbl}>Full Name</label><input style={inp} placeholder="Kelechi Promise" value={form.name} onChange={e=>update("name",e.target.value)}/></div>
                <div><label style={lbl}>Email</label><input style={inp} type="email" placeholder="promise@gmail.com" value={form.email} onChange={e=>update("email",e.target.value)}/></div>
                <div>
                  <label style={lbl}>Password</label>
                  <input style={inp} type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>update("password",e.target.value)}/>
                  <div style={{fontSize:"11px",color:"#16a34a",marginTop:"4px"}}>🔒 Password is securely hashed before saving</div>
                </div>
                <div><label style={lbl}>Target Institution</label><select style={inp} value={form.institution} onChange={e=>update("institution",e.target.value)}><option value="">Select...</option>{INSTITUTIONS.map(i=><option key={i}>{i}</option>)}</select></div>
                <div><label style={lbl}>Desired Course</label><select style={inp} value={form.course} onChange={e=>update("course",e.target.value)}><option value="">Select...</option>{COURSES.map(c=><option key={c}>{c}</option>)}</select></div>
                {rec&&(
                  <div style={{borderRadius:"14px",overflow:"hidden",border:"1.5px solid #fed7aa"}}>
                    <div style={{padding:"14px",background:"linear-gradient(135deg,#fff8f5,#fff7ed)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                        <span style={{fontSize:"16px"}}>🤖</span><span style={{fontWeight:"800",color:"#c2410c",fontSize:"13px"}}>AI Admission Insight</span>
                        <span style={{marginLeft:"auto",fontSize:"11px",fontWeight:"700",color:CC[rec.competition],backgroundColor:`${CC[rec.competition]}15`,padding:"3px 8px",borderRadius:"8px"}}>{rec.competition}</span>
                      </div>
                      <p style={{fontSize:"12px",color:"#555",margin:"0 0 10px",lineHeight:"1.5"}}>{rec.text}</p>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                        <div style={{padding:"10px",borderRadius:"10px",backgroundColor:"#fff",border:"1px solid #fecaca",textAlign:"center"}}><div style={{fontSize:"11px",color:"#999"}}>Minimum</div><div style={{fontSize:"20px",fontWeight:"900",color:"#dc2626"}}>{rec.minJamb}</div></div>
                        <div style={{padding:"10px",borderRadius:"10px",backgroundColor:"#fff",border:"1px solid #86efac",textAlign:"center"}}><div style={{fontSize:"11px",color:"#999"}}>Recommended</div><div style={{fontSize:"20px",fontWeight:"900",color:"#16a34a"}}>{rec.recommendedJamb}</div></div>
                      </div>
                    </div>
                    {prob&&(
                      <div style={{padding:"12px 14px",backgroundColor:"#fff"}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"6px"}}><span style={{color:"#666",fontWeight:"600"}}>Chance with target {form.target}</span><span style={{fontWeight:"800",color:prob.color}}>{prob.label}</span></div>
                        <div style={{height:"7px",borderRadius:"4px",backgroundColor:"#f0f0f0",overflow:"hidden"}}><div style={{height:"100%",width:`${prob.percent}%`,backgroundColor:prob.color,transition:"width 0.5s"}}/></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step===2&&combo&&(
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <h2 style={{fontSize:"20px",fontWeight:"800",margin:"0 0 4px",color:"#1a1a1a"}}>JAMB Subjects</h2>
                <div style={{padding:"10px 12px",borderRadius:"10px",backgroundColor:"#eff6ff",border:"1px solid #bfdbfe",fontSize:"12px",color:"#1d4ed8",fontWeight:"600"}}>📋 {combo.note}</div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {["English Language",...combo.fixed].map(s=>(
                    <div key={s} style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",borderRadius:"10px",backgroundColor:"#f0fdf4",border:"1px solid #86efac"}}>
                      <span>✅</span><span style={{fontSize:"13px",color:"#166534",fontWeight:"700"}}>{s}</span><span style={{marginLeft:"auto",fontSize:"11px",color:"#16a34a"}}>Fixed</span>
                    </div>
                  ))}
                </div>
                {combo.flexibleCount>0&&(
                  <div>
                    <div style={{fontSize:"12px",fontWeight:"700",color:"#555",marginBottom:"8px"}}>Choose {combo.flexibleCount} more:</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                      {combo.flexible.map((s:string)=>{const sel=flex.includes(s);const max=!sel&&flex.length>=combo.flexibleCount;return(<button key={s} onClick={()=>toggleFlex(s)} style={{padding:"9px 13px",borderRadius:"20px",fontSize:"13px",cursor:max?"not-allowed":"pointer",border:sel?"2px solid #ea580c":"1.5px solid #e0e0e0",backgroundColor:sel?"#fff8f5":max?"#fafafa":"#fff",color:sel?"#ea580c":max?"#ccc":"#555",fontWeight:sel?"700":"400",opacity:max?0.5:1}}>{s}</button>);})}
                    </div>
                    <div style={{marginTop:"8px",fontSize:"13px",color:flex.length===combo.flexibleCount?"#16a34a":"#ea580c",fontWeight:"700"}}>{flex.length}/{combo.flexibleCount} {flex.length===combo.flexibleCount?"✓ Complete!":""}</div>
                  </div>
                )}
              </div>
            )}

            {step===3&&(
              <div style={{display:"flex",flexDirection:"column",gap:"18px"}}>
                <h2 style={{fontSize:"20px",fontWeight:"800",margin:"0 0 4px",color:"#1a1a1a"}}>Set Your Goal</h2>
                {rec&&<div style={{padding:"12px 14px",borderRadius:"12px",backgroundColor:"#f0fdf4",border:"1.5px solid #86efac",fontSize:"13px",color:"#166534",lineHeight:"1.5"}}>🎯 For <strong>{form.course}</strong> at <strong>{form.institution}</strong>, target <strong>{rec.recommendedJamb}+</strong></div>}
                <div>
                  <label style={{...lbl,display:"flex",justifyContent:"space-between"}}><span>Target Score</span><span style={{fontSize:"22px",fontWeight:"900",color:"#ea580c"}}>{form.target}</span></label>
                  <input type="range" min="180" max="400" step="5" value={form.target} onChange={e=>update("target",e.target.value)} style={{width:"100%",accentColor:"#ea580c"}}/>
                  {prob&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginTop:"6px"}}><span style={{color:"#666"}}>Admission chance</span><span style={{fontWeight:"800",color:prob.color}}>{prob.label} ({prob.percent}%)</span></div>}
                </div>
                <div><label style={lbl}>JAMB Exam Date</label><input type="date" style={inp} value={form.deadline} onChange={e=>update("deadline",e.target.value)}/></div>
                <div>
                  <label style={{...lbl,marginBottom:"10px"}}>Preparation Level</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                    {[["1","😰 Not ready"],["2","😐 Just started"],["3","😊 Good progress"],["4","🔥 Almost ready"]].map(([v,l])=>(
                      <button key={v} onClick={()=>update("selfRating",v)} style={{padding:"11px 8px",borderRadius:"12px",fontSize:"12px",cursor:"pointer",border:form.selfRating===v?"2px solid #ea580c":"1.5px solid #e0e0e0",backgroundColor:form.selfRating===v?"#fff8f5":"#fff",color:form.selfRating===v?"#ea580c":"#555",fontWeight:form.selfRating===v?"700":"400"}}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error&&<div style={{marginTop:"12px",padding:"10px 14px",backgroundColor:"#fff0f0",border:"1px solid #ffcccc",borderRadius:"10px",color:"#cc0000",fontSize:"13px"}}>⚠️ {error}</div>}
            <div style={{marginTop:"20px",display:"flex",gap:"12px"}}>
              {step>1&&<button onClick={()=>{setStep(s=>s-1);setError("");}} style={{flex:1,padding:"14px",borderRadius:"30px",border:"1.5px solid #ea580c",backgroundColor:"#fff",color:"#ea580c",fontWeight:"700",fontSize:"15px",cursor:"pointer"}}>← Back</button>}
              <button onClick={step<3?next:signup} disabled={loading} style={{flex:2,padding:"14px",borderRadius:"30px",border:"none",background:loading?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 16px rgba(234,88,12,0.35)"}}>
                {step<3?"Continue →":"🚀 Start Studying!"}
              </button>
            </div>
            <p style={{textAlign:"center",marginTop:"14px",fontSize:"13px",color:"#999"}}>
              Already have account? <button onClick={()=>{setMode("login");setStep(1);}} style={{background:"none",border:"none",color:"#ea580c",fontWeight:"700",cursor:"pointer",fontSize:"13px"}}>Log in</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
