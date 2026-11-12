"use client";
import { useState, useEffect } from "react";
import AppLoader, { PageSkeleton } from "./components/AppLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NAVBAR_HEIGHT } from "./components/NavbarView";
import { BOTTOM_NAV_HEIGHT } from "./components/BottomNavView";
import StreakCard from "./components/StreakCard";
import { FlameGreeting } from "./components/Flame";
import CountdownBanner from "./components/CountdownBanner";
import { Session } from "./lib/session";
import { C, D, palette } from "./lib/design";
import { useDark } from "./lib/theme";
import { Calculator, ChevronDown, ChevronUp, Bot, Target, CalendarDays, ChevronRight } from "lucide-react";
import { todayWAT } from "./lib/progress";

interface User { name:string; email:string; target:string; institution:string; subjects:string[]; course:string; }

export default function Home() {
  const darkMode = useDark();
  const [user,       setUser]       = useState<User|null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const u = localStorage.getItem("companion_user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<"jamb"|"aggregate">("aggregate");
  const [jambS,    setJambS]    = useState("");
  const [postS,    setPostS]    = useState("");
  const [result,   setResult]   = useState<{agg:number;jamb:number;post:number;grade:string;color:string}|null>(null);
  const [calcErr,  setCalcErr]  = useState("");
  const [todayPlan] = useState<{ subject: string; topic: string; done: boolean; rest: boolean } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("companion_study_plan_v2");
      if (!raw) return null;
      const weeks = JSON.parse(raw) as { days: { date: string; subject: string; topic: string; type: string; done: boolean }[] }[];
      const today = todayWAT();
      for (const w of weeks) {
        const day = (w.days || []).find(d => d.date === today);
        if (day) return { subject: day.subject, topic: day.topic, done: day.done, rest: day.type === "rest" };
      }
      return null;
    } catch { return null; }
  });
  const router = useRouter();
  const T = palette(darkMode);

  useEffect(() => {
    Session.sync();
    if (!user) { router.replace("/landing"); return; }
  }, [router]);

  const calcAggregate = () => {
    setCalcErr(""); setResult(null);
    const j = parseFloat(jambS), p = parseFloat(postS);
    if (isNaN(j)||j<0||j>400) { setCalcErr("Enter valid JAMB score (0-400)"); return; }
    if (calcType==="aggregate") {
      if (isNaN(p)||p<0||p>100) { setCalcErr("Enter valid Post-UTME score (0-100)"); return; }
      const jP=j/8, pP=p/2, agg=jP+pP;
      const grade=agg>=70?"Excellent":agg>=55?"Good":agg>=45?"Average":"Below average";
      const color=agg>=70?"#2FBF71":agg>=55?"#A5B4FC":agg>=45?"#F7B928":"#FF6B5E";
      setResult({agg:+agg.toFixed(2),jamb:+jP.toFixed(2),post:+pP.toFixed(2),grade,color});
    } else {
      const sc=(j/400)*100;
      const grade=j>=300?"Excellent":j>=250?"Good":j>=200?"Average":"Below average";
      const color=j>=300?"#2FBF71":j>=250?"#A5B4FC":j>=200?"#F7B928":"#FF6B5E";
      setResult({agg:+sc.toFixed(1),jamb:j,post:0,grade,color});
    }
  };

  if (!user) return null;


  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:"10px",
    border:"1.5px solid "+T.border, fontSize:"14px", outline:"none",
    background:T.s2, color:T.text, boxSizing:"border-box", fontFamily:"inherit",
    transition:"border-color 0.15s",
  };

  const hour = new Date().getHours();
  const greeting = hour<12 ? "Good morning" : hour<17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      paddingTop:NAVBAR_HEIGHT+"px",
      fontFamily:"var(--font)",
    }}>
      {/* Hero header */}
      <div className="hero-banner" style={{
        background: "linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)",
        padding: "24px 20px 36px",
      }}>
        <div style={{ color:"rgba(255,255,255,0.75)", fontSize:"13px", marginBottom:"4px" }}>
          {greeting}
        </div>
        <div style={{ color:"#fff", fontSize:"24px", fontWeight:800, letterSpacing:"-0.4px" }}>
          {user?.name.split(" ")[0]}
        </div>
        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", marginTop:"4px" }}>
          Target <span style={{ color:"#F97316", fontWeight:700 }}>{user?.target} pts</span>
          {user?.institution ? " · "+user.institution : ""}
        </div>
        <div style={{ marginTop: 16 }}>
          <FlameGreeting topic={user?.subjects?.[0]} />
        </div>
      </div>

      <div className="home-cols" style={{ padding:"0 20px", marginTop:"-16px", paddingBottom:"calc("+BOTTOM_NAV_HEIGHT+"px + 16px)" }}>

        {/* Countdown banner — shows only if user set an exam date */}
        <div className="home-main">
        <CountdownBanner darkMode={darkMode} />

        {/* Today's plan */}
        <Link href="/studyplan" style={{ textDecoration:"none", display:"block", marginBottom:"16px" }}>
          <div style={{ background:T.surface, borderRadius:"16px", border:"1px solid "+T.border, padding:"16px 18px", display:"flex", alignItems:"center", gap:"14px" }}>
            <div style={{ width:44, height:44, borderRadius:"12px", background:T.primaryTint, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <CalendarDays size={20} color={T.primary} strokeWidth={1.8} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"2px" }}>Today's Plan</div>
              {todayPlan === null ? (
                <div style={{ fontWeight:700, color:T.text, fontSize:"14px" }}>Generate your study plan</div>
              ) : todayPlan.rest ? (
                <div style={{ fontWeight:700, color:T.text, fontSize:"14px" }}>Rest day — recharge for tomorrow</div>
              ) : (
                <div style={{ fontWeight:700, color:T.text, fontSize:"14px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {todayPlan.subject} · {todayPlan.topic}
                </div>
              )}
              <div style={{ fontSize:"12px", color:T.sub, marginTop:"2px" }}>
                {todayPlan === null ? "Built from the official syllabus" : todayPlan.rest ? "Rest is part of the plan" : todayPlan.done ? "Done for today. Well done." : "Tap to open today's plan"}
              </div>
            </div>
            <ChevronRight size={18} color={T.sub} />
          </div>
        </Link>

        {/* AI CTA */}
        <Link href="/ai" style={{ textDecoration:"none", display:"block", marginBottom:"16px" }}>
          <div style={{
            background:"linear-gradient(135deg,#4F46E5,#3730A3)",
            borderRadius:"16px", padding:"18px 20px",
            display:"flex", alignItems:"center", gap:"14px",
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:"-20px", right:"-20px", width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.1)" }} />
            <div style={{ width:48, height:48, borderRadius:"14px", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Bot size={24} color="#fff" strokeWidth={1.8} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:"#fff", fontWeight:800, fontSize:"16px", letterSpacing:"-0.2px" }}>AI Tutor</div>
              <div style={{ color:"rgba(255,255,255,0.8)", fontSize:"12px", marginTop:"2px" }}>Ask anything, or send a photo of a question</div>
            </div>
            <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
          </div>
        </Link>

        {/* Streak */}
        <div style={{ marginBottom:"16px" }}>
          <StreakCard darkMode={darkMode} />
        </div>

        {/* Practice CTA */}
        <Link href="/practice" style={{ textDecoration:"none", display:"block", marginBottom:"16px" }}>
          <div style={{ background:T.surface, borderRadius:"16px", border:"1px solid "+T.border, padding:"16px 18px", display:"flex", alignItems:"center", gap:"14px" }}>
            <div style={{ width:44, height:44, borderRadius:"12px", background:T.primaryTint, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Target size={20} color={T.primary} strokeWidth={1.8} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:T.text, fontSize:"15px" }}>Practice</div>
              <div style={{ fontSize:"12px", color:T.sub, marginTop:"2px" }}>4,060 real past questions · Mock exams · Quick drills</div>
            </div>
            <ChevronRight size={18} color={T.sub} />
          </div>
        </Link>

        </div>
        <div className="home-side">
        {/* Calculator */}
        <div style={{
          background:T.surface, borderRadius:"16px",
          border:"1px solid "+T.border,
          marginBottom:"16px", overflow:"hidden",
        }}>
          <button onClick={()=>setShowCalc(v=>!v)} style={{
            width:"100%", padding:"16px 18px", border:"none", background:"transparent",
            display:"flex", alignItems:"center", gap:"12px", cursor:"pointer", minHeight:"44px",
          }}>
            <div style={{ width:36, height:36, borderRadius:"10px", background:"#E3B3411F", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Calculator size={17} color="#E3B341" strokeWidth={1.8} />
            </div>
            <div style={{ flex:1, textAlign:"left" }}>
              <div style={{ fontWeight:700, color:T.text, fontSize:"15px" }}>Score Calculator</div>
              <div style={{ fontSize:"12px", color:T.sub }}>JAMB and Aggregate formula</div>
            </div>
            {showCalc ? <ChevronUp size={18} color={T.sub} /> : <ChevronDown size={18} color={T.sub} />}
          </button>

          {showCalc && (
            <div style={{ padding:"0 18px 20px", borderTop:"1px solid "+T.border }}>
              <div style={{ display:"flex", gap:"8px", margin:"16px 0 14px" }}>
                {(["aggregate","jamb"] as const).map(t=>(
                  <button key={t} onClick={()=>{setCalcType(t);setResult(null);}} style={{
                    flex:1, padding:"9px", borderRadius:"10px", border:"none",
                    background: calcType===t ? T.primary : T.s2,
                    color: calcType===t ? "#fff" : T.sub,
                    fontWeight:700, fontSize:"13px", cursor:"pointer", minHeight:"44px",
                  }}>
                    {t==="aggregate" ? "Aggregate" : "JAMB Only"}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <div>
                  <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>JAMB Score (0-400)</label>
                  <input style={inp} type="number" placeholder="e.g. 280" value={jambS} onChange={e=>setJambS(e.target.value)} />
                </div>
                {calcType==="aggregate" && (
                  <div>
                    <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Post-UTME Score (0-100)</label>
                    <input style={inp} type="number" placeholder="e.g. 65" value={postS} onChange={e=>setPostS(e.target.value)} />
                    <div style={{ fontSize:"11px", color:T.muted, marginTop:"5px" }}>Formula: (JAMB / 8) + (Post-UTME / 2)</div>
                  </div>
                )}
              </div>
              {calcErr && <div style={{ color:"#FF8A8A", fontSize:"13px", marginTop:"10px" }}>{calcErr}</div>}
              <button onClick={calcAggregate} style={{
                width:"100%", marginTop:"14px", padding:"13px", borderRadius:"10px", border:"none",
                background:T.primary, color:"#fff", fontWeight:700, fontSize:"14px", cursor:"pointer", minHeight:"44px",
              }}>
                Calculate
              </button>
              {result && (
                <div style={{
                  padding:"16px", borderRadius:"12px", marginTop:"12px",
                  background: T.s2,
                  border:"1.5px solid "+result.color+"33",
                }}>
                  <div style={{ textAlign:"center", marginBottom:"12px" }}>
                    <div style={{ fontSize:"40px", fontWeight:900, color:result.color, letterSpacing:"-1px" }}>{result.agg}</div>
                    <div style={{ fontSize:"13px", color:result.color, fontWeight:700, marginTop:"3px" }}>{result.grade}</div>
                  </div>
                  {calcType==="aggregate" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                      {[
                        {label:"JAMB contribution",      val:jambS+" / 8 = "+result.jamb},
                        {label:"Post-UTME contribution",  val:postS+" / 2 = "+result.post},
                        {label:"Total Aggregate",         val:result.agg+"/100"},
                      ].map((r,i)=>(
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"7px 0", borderBottom:i<2?"1px solid "+T.border:"none" }}>
                          <span style={{ color:T.sub }}>{r.label}</span>
                          <span style={{ color:T.text, fontWeight:700 }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div></div>

    </div>
  );
}
