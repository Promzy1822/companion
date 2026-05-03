"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCutoff, getSmartRecommendation, getAdmissionProbability } from "../lib/cutoffs";
import { getSubjectCombo, getFullSubjects } from "../lib/subjectCombinations";

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];
const COMPETITION_COLOR: Record<string,string> = {"Very High":"#dc2626","High":"#ea580c","Moderate":"#2563eb","Low":"#16a34a"};

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [recommendation, setRecommendation] = useState<{text:string;minJamb:number;recommendedJamb:number;competition:string}|null>(null);
  const [flexibleSelected, setFlexibleSelected] = useState<string[]>([]);
  const [form, setForm] = useState({
    name:"", email:"", password:"", institution:"", course:"",
    subjects:[] as string[], target:"260", deadline:"", selfRating:"2"
  });

  useEffect(() => {
    if (localStorage.getItem("companion_user")) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (form.institution && form.course && form.institution !== "Other" && form.course !== "Other") {
      const cutoff = getCutoff(form.institution, form.course);
      setRecommendation({
        text: getSmartRecommendation(form.institution, form.course),
        minJamb: cutoff.minJamb,
        recommendedJamb: cutoff.recommendedJamb,
        competition: cutoff.competition
      });
      update("target", String(cutoff.recommendedJamb));
    } else {
      setRecommendation(null);
    }
    // Reset flexible subjects when course changes
    setFlexibleSelected([]);
  }, [form.institution, form.course]);

  const update = (k: string, v: string|string[]) => setForm(p => ({...p,[k]:v}));

  const toggleFlexible = (s: string) => {
    const combo = getSubjectCombo(form.course);
    if (flexibleSelected.includes(s)) {
      setFlexibleSelected(prev => prev.filter(x => x !== s));
      setError("");
    } else {
      if (flexibleSelected.length >= combo.flexibleCount) {
        setError(`You can only pick ${combo.flexibleCount} subject${combo.flexibleCount > 1 ? "s" : ""} here`);
        return;
      }
      setFlexibleSelected(prev => [...prev, s]);
      setError("");
    }
  };

  const handleLogin = () => {
    if (!form.email.trim() || !form.password.trim()) { setError("Fill all fields"); return; }
    const saved = localStorage.getItem("companion_user");
    if (saved && JSON.parse(saved).email === form.email) { router.replace("/"); return; }
    setError("No account found. Please sign up.");
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError("Enter your name"); return; }
      if (!form.email.includes("@")) { setError("Enter valid email"); return; }
      if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
      if (!form.institution) { setError("Select your institution"); return; }
      if (!form.course) { setError("Select your course"); return; }
    }
    if (step === 2) {
      const combo = getSubjectCombo(form.course);
      if (flexibleSelected.length < combo.flexibleCount) {
        setError(`Please select ${combo.flexibleCount - flexibleSelected.length} more subject${combo.flexibleCount - flexibleSelected.length > 1 ? "s" : ""}`);
        return;
      }
    }
    setStep(s => s+1);
  };

  const handleSignup = () => {
    if (!form.deadline) { setError("Select your exam date"); return; }
    const fullSubjects = getFullSubjects(form.course, flexibleSelected);
    const cutoff = (form.institution !== "Other" && form.course !== "Other")
      ? getCutoff(form.institution, form.course) : null;
    localStorage.setItem("companion_user", JSON.stringify({
      ...form,
      subjects: fullSubjects,
      cutoffData: cutoff,
      recommendation: recommendation?.text || null,
    }));
    router.replace("/");
  };

  const prob = (recommendation && form.institution !== "Other" && form.course !== "Other")
    ? getAdmissionProbability(parseInt(form.target), getCutoff(form.institution, form.course))
    : null;

  const combo = form.course ? getSubjectCombo(form.course) : null;
  const fullPreview = form.course ? getFullSubjects(form.course, flexibleSelected) : [];

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"12px",
    border:"1.5px solid #e8e8e8", fontSize:"14px", outline:"none",
    backgroundColor:"#fafafa", boxSizing:"border-box", color:"#1a1a1a"
  };
  const lbl: React.CSSProperties = {fontSize:"13px", fontWeight:"600", color:"#555", display:"block", marginBottom:"6px"};

  return (
    <div style={{minHeight:"100vh", backgroundColor:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", display:"flex", flexDirection:"column"}}>
      
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#7c2d12,#c2410c,#ea580c)", padding:"24px 24px 28px"}}>
        <Link href="/landing" style={{color:"rgba(255,255,255,0.7)", textDecoration:"none", fontSize:"13px"}}>← Back</Link>
        <div style={{textAlign:"center", marginTop:"16px"}}>
          <div style={{fontSize:"36px"}}>🎓</div>
          <div style={{color:"#fff", fontWeight:"900", fontSize:"22px", marginTop:"8px"}}>Companion</div>
          <div style={{color:"rgba(255,255,255,0.7)", fontSize:"13px"}}>Your AI-Powered JAMB Assistant</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex", margin:"20px 20px 0", borderRadius:"14px", overflow:"hidden", border:"1.5px solid #e8e8e8", backgroundColor:"#fafafa"}}>
        {(["login","signup"] as const).map(m => (
          <button key={m} onClick={()=>{setMode(m);setStep(1);setError("");}} style={{flex:1, padding:"13px", border:"none", cursor:"pointer", fontWeight:"700", fontSize:"14px", backgroundColor:mode===m?"#ea580c":"transparent", color:mode===m?"#fff":"#999", transition:"all 0.2s"}}>
            {m==="login"?"Log In":"Sign Up"}
          </button>
        ))}
      </div>

      <div style={{padding:"24px", flex:1}}>

        {/* LOGIN */}
        {mode==="login" && (
          <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
            <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>Welcome back 👋</h2>
            <div><label style={lbl}>Email</label><input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>update("email",e.target.value)} /></div>
            <div><label style={lbl}>Password</label><input style={inp} type="password" placeholder="Password" value={form.password} onChange={e=>update("password",e.target.value)} /></div>
            {error && <div style={{padding:"10px 14px", backgroundColor:"#fff0f0", border:"1px solid #ffcccc", borderRadius:"10px", color:"#cc0000", fontSize:"13px"}}>⚠️ {error}</div>}
            <button onClick={handleLogin} style={{padding:"15px", borderRadius:"30px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"800", fontSize:"16px", cursor:"pointer"}}>Log In →</button>
            <p style={{textAlign:"center", fontSize:"13px", color:"#999"}}>No account? <button onClick={()=>setMode("signup")} style={{background:"none", border:"none", color:"#ea580c", fontWeight:"700", cursor:"pointer", fontSize:"13px"}}>Sign up free</button></p>
          </div>
        )}

        {/* SIGNUP */}
        {mode==="signup" && (
          <div>
            {/* Progress */}
            <div style={{display:"flex", gap:"6px", marginBottom:"24px"}}>
              {[1,2,3].map(s => <div key={s} style={{flex:1, height:"4px", borderRadius:"2px", backgroundColor:s<=step?"#ea580c":"#f0f0f0", transition:"all 0.3s"}} />)}
            </div>

            {/* STEP 1 */}
            {step===1 && (
              <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                <div>
                  <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>Personal Info</h2>
                  <p style={{fontSize:"13px", color:"#999", margin:0}}>We will personalise your experience automatically</p>
                </div>
                <div><label style={lbl}>Full Name</label><input style={inp} placeholder="e.g. Kelechi Promise" value={form.name} onChange={e=>update("name",e.target.value)} /></div>
                <div><label style={lbl}>Email</label><input style={inp} type="email" placeholder="promise@gmail.com" value={form.email} onChange={e=>update("email",e.target.value)} /></div>
                <div><label style={lbl}>Password</label><input style={inp} type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>update("password",e.target.value)} /></div>
                <div>
                  <label style={lbl}>Target Institution</label>
                  <select style={inp} value={form.institution} onChange={e=>update("institution",e.target.value)}>
                    <option value="">Select institution...</option>
                    {INSTITUTIONS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Desired Course</label>
                  <select style={inp} value={form.course} onChange={e=>update("course",e.target.value)}>
                    <option value="">Select course...</option>
                    {COURSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* AI Recommendation */}
                {recommendation && (
                  <div style={{borderRadius:"16px", overflow:"hidden", border:"1.5px solid #fed7aa"}}>
                    <div style={{padding:"14px 16px", background:"linear-gradient(135deg,#fff8f5,#fff7ed)", borderBottom:"1px solid #fed7aa"}}>
                      <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px"}}>
                        <span style={{fontSize:"18px"}}>🤖</span>
                        <span style={{fontWeight:"800", color:"#c2410c", fontSize:"14px"}}>AI Admission Insight</span>
                        <span style={{marginLeft:"auto", fontSize:"11px", fontWeight:"700", color:COMPETITION_COLOR[recommendation.competition], backgroundColor:`${COMPETITION_COLOR[recommendation.competition]}15`, padding:"3px 10px", borderRadius:"8px"}}>{recommendation.competition} Competition</span>
                      </div>
                      <p style={{fontSize:"13px", color:"#555", margin:"0 0 12px", lineHeight:"1.6"}}>{recommendation.text}</p>
                      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
                        <div style={{padding:"10px", borderRadius:"10px", backgroundColor:"#fff", border:"1px solid #fecaca", textAlign:"center"}}>
                          <div style={{fontSize:"11px", color:"#999", marginBottom:"3px"}}>Minimum JAMB</div>
                          <div style={{fontSize:"22px", fontWeight:"900", color:"#dc2626"}}>{recommendation.minJamb}</div>
                        </div>
                        <div style={{padding:"10px", borderRadius:"10px", backgroundColor:"#fff", border:"1px solid #86efac", textAlign:"center"}}>
                          <div style={{fontSize:"11px", color:"#999", marginBottom:"3px"}}>Recommended</div>
                          <div style={{fontSize:"22px", fontWeight:"900", color:"#16a34a"}}>{recommendation.recommendedJamb}</div>
                        </div>
                      </div>
                    </div>
                    {prob && (
                      <div style={{padding:"14px 16px", backgroundColor:"#fff"}}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
                          <span style={{fontSize:"12px", color:"#666", fontWeight:"600"}}>Chance with target {form.target}</span>
                          <span style={{fontSize:"13px", fontWeight:"800", color:prob.color}}>{prob.label}</span>
                        </div>
                        <div style={{height:"8px", borderRadius:"4px", backgroundColor:"#f0f0f0", overflow:"hidden"}}>
                          <div style={{height:"100%", width:`${prob.percent}%`, borderRadius:"4px", backgroundColor:prob.color, transition:"width 0.5s"}} />
                        </div>
                        <div style={{fontSize:"11px", color:"#999", marginTop:"5px", textAlign:"right"}}>{prob.percent}% admission probability</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 — Smart Subject Selection */}
            {step===2 && combo && (
              <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                <div>
                  <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>JAMB Subjects</h2>
                  <p style={{fontSize:"13px", color:"#999", margin:0}}>Based on JAMB brochure for {form.course}</p>
                </div>

                {/* JAMB brochure note */}
                <div style={{padding:"12px 14px", borderRadius:"12px", backgroundColor:"#eff6ff", border:"1px solid #bfdbfe"}}>
                  <div style={{fontSize:"12px", color:"#1d4ed8", fontWeight:"700", marginBottom:"3px"}}>📋 JAMB Brochure</div>
                  <div style={{fontSize:"12px", color:"#1e40af", lineHeight:"1.5"}}>{combo.note}</div>
                </div>

                {/* Auto-included subjects */}
                <div>
                  <div style={{fontSize:"12px", fontWeight:"700", color:"#555", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px"}}>Auto-included (compulsory)</div>
                  <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
                    {["English Language", ...combo.fixed].map(s => (
                      <div key={s} style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"12px", backgroundColor:"#f0fdf4", border:"1px solid #86efac"}}>
                        <span style={{fontSize:"16px"}}>✅</span>
                        <span style={{fontSize:"14px", color:"#166534", fontWeight:"700"}}>{s}</span>
                        <span style={{marginLeft:"auto", fontSize:"11px", color:"#16a34a", fontWeight:"600"}}>Fixed</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flexible selection */}
                {combo.flexibleCount > 0 && (
                  <div>
                    <div style={{fontSize:"12px", fontWeight:"700", color:"#555", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px"}}>
                      Choose {combo.flexibleCount} subject{combo.flexibleCount > 1 ? "s" : ""} from options below
                    </div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:"10px"}}>
                      {combo.flexible.map(s => {
                        const sel = flexibleSelected.includes(s);
                        const maxed = !sel && flexibleSelected.length >= combo.flexibleCount;
                        return (
                          <button key={s} onClick={()=>toggleFlexible(s)} style={{
                            padding:"10px 14px", borderRadius:"20px", fontSize:"13px",
                            cursor: maxed ? "not-allowed" : "pointer",
                            border: sel ? "2px solid #ea580c" : "1.5px solid #e0e0e0",
                            backgroundColor: sel ? "#fff8f5" : maxed ? "#fafafa" : "#fff",
                            color: sel ? "#ea580c" : maxed ? "#ccc" : "#555",
                            fontWeight: sel ? "700" : "400",
                            opacity: maxed ? 0.5 : 1,
                            transition:"all 0.15s"
                          }}>{s}</button>
                        );
                      })}
                    </div>
                    <div style={{marginTop:"10px", padding:"10px 14px", borderRadius:"12px", backgroundColor:flexibleSelected.length===combo.flexibleCount?"#f0fdf4":"#fff8f5", border:`1px solid ${flexibleSelected.length===combo.flexibleCount?"#86efac":"#fed7aa"}`}}>
                      <span style={{fontSize:"13px", color:flexibleSelected.length===combo.flexibleCount?"#16a34a":"#ea580c", fontWeight:"700"}}>
                        {flexibleSelected.length}/{combo.flexibleCount} selected {flexibleSelected.length===combo.flexibleCount?"✓":""}
                      </span>
                    </div>
                  </div>
                )}

                {/* Full preview */}
                {fullPreview.length > 0 && (
                  <div style={{padding:"14px 16px", borderRadius:"14px", backgroundColor:"#f8f8f8", border:"1px solid #e0e0e0"}}>
                    <div style={{fontSize:"12px", fontWeight:"700", color:"#555", marginBottom:"8px"}}>Your 4 JAMB subjects:</div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:"6px"}}>
                      {fullPreview.map(s => (
                        <span key={s} style={{fontSize:"12px", backgroundColor:"#ea580c", color:"#fff", padding:"4px 10px", borderRadius:"20px", fontWeight:"600"}}>{s}</span>
                      ))}
                      {Array.from({length: 4 - fullPreview.length}).map((_,i) => (
                        <span key={i} style={{fontSize:"12px", backgroundColor:"#f0f0f0", color:"#ccc", padding:"4px 10px", borderRadius:"20px"}}>?</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step===3 && (
              <div style={{display:"flex", flexDirection:"column", gap:"20px"}}>
                <div>
                  <h2 style={{fontSize:"22px", fontWeight:"800", margin:"0 0 4px", color:"#1a1a1a"}}>Set Your Goal</h2>
                  <p style={{fontSize:"13px", color:"#999", margin:0}}>AI has pre-set your target based on your choice</p>
                </div>
                {recommendation && (
                  <div style={{padding:"14px 16px", borderRadius:"14px", backgroundColor:"#f0fdf4", border:"1.5px solid #86efac"}}>
                    <div style={{fontSize:"13px", color:"#166534", fontWeight:"700", marginBottom:"4px"}}>🎯 AI Recommendation</div>
                    <div style={{fontSize:"12px", color:"#166534", lineHeight:"1.5"}}>
                      For <strong>{form.course}</strong> at <strong>{form.institution}</strong>, target <strong>{recommendation.recommendedJamb}+</strong> for strong admission chances.
                    </div>
                  </div>
                )}
                <div>
                  <label style={{...lbl, display:"flex", justifyContent:"space-between"}}>
                    <span>Target Score</span>
                    <span style={{fontSize:"22px", fontWeight:"900", color:"#ea580c"}}>{form.target}</span>
                  </label>
                  <input type="range" min="180" max="400" step="5" value={form.target} onChange={e=>update("target",e.target.value)} style={{width:"100%", accentColor:"#ea580c"}} />
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#999", marginTop:"4px"}}><span>180</span><span>290</span><span>400</span></div>
                </div>
                {prob && (
                  <div style={{padding:"14px 16px", borderRadius:"14px", border:`1.5px solid ${prob.color}33`, backgroundColor:`${prob.color}08`}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
                      <span style={{fontSize:"13px", color:"#555", fontWeight:"600"}}>Admission probability</span>
                      <span style={{fontSize:"14px", fontWeight:"800", color:prob.color}}>{prob.label}</span>
                    </div>
                    <div style={{height:"10px", borderRadius:"5px", backgroundColor:"#f0f0f0", overflow:"hidden"}}>
                      <div style={{height:"100%", width:`${prob.percent}%`, borderRadius:"5px", backgroundColor:prob.color, transition:"width 0.5s"}} />
                    </div>
                  </div>
                )}
                <div><label style={lbl}>JAMB Exam Date</label><input type="date" style={inp} value={form.deadline} onChange={e=>update("deadline",e.target.value)} /></div>
                <div>
                  <label style={{...lbl, marginBottom:"10px"}}>Current Preparation Level</label>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
                    {[["1","😰 Not ready"],["2","😐 Just started"],["3","😊 Making progress"],["4","🔥 Almost ready"]].map(([v,l]) => (
                      <button key={v} onClick={()=>update("selfRating",v)} style={{padding:"12px 8px", borderRadius:"12px", fontSize:"12px", cursor:"pointer", border:form.selfRating===v?"2px solid #ea580c":"1.5px solid #e0e0e0", backgroundColor:form.selfRating===v?"#fff8f5":"#fff", color:form.selfRating===v?"#ea580c":"#555", fontWeight:form.selfRating===v?"700":"400"}}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <div style={{marginTop:"12px", padding:"10px 14px", backgroundColor:"#fff0f0", border:"1px solid #ffcccc", borderRadius:"10px", color:"#cc0000", fontSize:"13px"}}>⚠️ {error}</div>}

            <div style={{marginTop:"24px", display:"flex", gap:"12px"}}>
              {step>1 && <button onClick={()=>{setStep(s=>s-1);setError("");}} style={{flex:1, padding:"14px", borderRadius:"30px", border:"1.5px solid #ea580c", backgroundColor:"#fff", color:"#ea580c", fontWeight:"700", fontSize:"15px", cursor:"pointer"}}>← Back</button>}
              <button onClick={step<3?nextStep:handleSignup} style={{flex:2, padding:"14px", borderRadius:"30px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", boxShadow:"0 4px 16px rgba(234,88,12,0.35)"}}>
                {step<3?"Continue →":"🚀 Start Studying!"}
              </button>
            </div>
            <p style={{textAlign:"center", marginTop:"16px", fontSize:"13px", color:"#999"}}>
              Already have an account? <button onClick={()=>{setMode("login");setStep(1);}} style={{background:"none", border:"none", color:"#ea580c", fontWeight:"700", cursor:"pointer", fontSize:"13px"}}>Log in</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
