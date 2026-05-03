"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User { name:string; target:string; institution:string; course:string; subjects:string[]; deadline:string; selfRating:string; recommendation?:string; }
interface DayPlan { day: number; date: string; subject: string; topic: string; hours: number; type: string; }
interface WeekPlan { week: number; dateRange: string; focus: string; goal: string; days: DayPlan[]; totalHours: number; }

function getDaysRemaining(deadline?: string): number {
  if (deadline) {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days > 0) return days;
  }
  const nextYear = new Date().getFullYear() + 1;
  return Math.ceil((new Date(`April 15, ${nextYear}`).getTime() - Date.now()) / 86400000);
}

function getDateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en-NG", {month:"short", day:"numeric"});
}

export default function StudyPlan() {
  const [user, setUser] = useState<User|null>(null);
  const [plan, setPlan] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const u = localStorage.getItem("companion_user");
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      setDaysLeft(getDaysRemaining(parsed.deadline));
    }
    const saved = localStorage.getItem("companion_study_plan");
    if (saved) { setPlan(JSON.parse(saved)); setGenerated(true); }
  }, []);

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);
    const days = getDaysRemaining(user.deadline);
    const weeks = Math.min(16, Math.max(1, Math.ceil(days / 7)));
    const intensity = days < 30 ? "very intensive" : days < 60 ? "intensive" : days < 120 ? "moderate" : "gradual";

    const prompt = `You are an expert JAMB study coach for Nigerian students. Create a ${weeks}-week study plan.

Student: ${user.name}
Days until JAMB: ${days}
Target Score: ${user.target}/400
Course: ${user.course} at ${user.institution}
Subjects: ${user.subjects?.join(", ")}
Preparation level: ${["","Not ready","Just started","Making progress","Almost ready"][parseInt(user.selfRating||"1")]}
Pace required: ${intensity}

Create a ${weeks}-week plan. Week ${weeks} must be REVISION ONLY with past questions.
${days < 30 ? "URGENT: Less than 30 days! Focus on high-yield topics and past questions only." : ""}

Return ONLY valid JSON array:
[
  {
    "week": 1,
    "focus": "Foundation Building",
    "goal": "Master algebra and comprehension basics",
    "days": [
      {"day": 1, "subject": "Mathematics", "topic": "Algebra & Equations", "hours": 2, "type": "study"},
      {"day": 2, "subject": "English Language", "topic": "Comprehension & Summary", "hours": 2, "type": "study"},
      {"day": 3, "subject": "Physics", "topic": "Mechanics", "hours": 2, "type": "study"},
      {"day": 4, "subject": "Chemistry", "topic": "Atomic Structure", "hours": 2, "type": "study"},
      {"day": 5, "subject": "Mathematics", "topic": "Past Questions Practice", "hours": 2, "type": "practice"},
      {"day": 6, "subject": "All Subjects", "topic": "Weekly Review", "hours": 3, "type": "review"},
      {"day": 7, "subject": "Rest", "topic": "Rest day", "hours": 0, "type": "rest"}
    ]
  }
]
Rules:
- Use ONLY these subjects: ${user.subjects?.join(", ")}
- Distribute subjects evenly
- Increase difficulty each week
- Last week: past questions and revision only
- type must be: study, practice, review, or rest
- Return ONLY the JSON array`;

    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({message: prompt})
      });
      const data = await res.json();
      const text = data.reply || "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        // Add real dates and total hours
        const withDates = parsed.map((w: WeekPlan, wi: number) => {
          const weekStart = wi * 7;
          const weekEnd = weekStart + 6;
          const totalHours = (w.days||[]).reduce((sum: number, d: DayPlan) => sum + (d.hours||0), 0);
          return {
            ...w,
            dateRange: `${getDateStr(weekStart)} – ${getDateStr(weekEnd)}`,
            totalHours,
            days: (w.days||[]).map((d: DayPlan, di: number) => ({
              ...d,
              date: getDateStr(weekStart + di),
            }))
          };
        });
        setPlan(withDates);
        localStorage.setItem("companion_study_plan", JSON.stringify(withDates));
        setGenerated(true);
      }
    } catch {
      setPlan(buildFallbackPlan(user, weeks));
      setGenerated(true);
    } finally { setLoading(false); }
  };

  const buildFallbackPlan = (u: User, weeks: number): WeekPlan[] => {
    const subjects = u.subjects || ["English Language","Mathematics"];
    return Array.from({length:weeks}, (_,wi) => {
      const weekStart = wi * 7;
      const isLastWeek = wi === weeks - 1;
      const days: DayPlan[] = Array.from({length:7}, (_,di) => ({
        day: di+1,
        date: getDateStr(weekStart + di),
        subject: di === 6 ? "Rest" : isLastWeek ? "All Subjects" : subjects[di % subjects.length],
        topic: di === 6 ? "Rest day" : isLastWeek ? "Past Questions & Revision" : `Core Topic ${wi+1}`,
        hours: di === 6 ? 0 : isLastWeek ? 3 : 2,
        type: di === 6 ? "rest" : isLastWeek ? "practice" : "study",
      }));
      return {
        week: wi+1,
        dateRange: `${getDateStr(weekStart)} – ${getDateStr(weekStart+6)}`,
        focus: isLastWeek ? "Final Revision" : wi >= weeks-3 ? "Practice & Past Questions" : wi < 2 ? "Foundation" : "Core Learning",
        goal: isLastWeek ? "Revise all topics, attempt full mock exams" : `Master key topics — Week ${wi+1}`,
        days,
        totalHours: days.reduce((s,d) => s+d.hours, 0),
      };
    });
  };

  if (!mounted) return null;

  const weeks = Math.min(16, Math.max(1, Math.ceil(daysLeft / 7)));
  const bg = darkMode ? "#0a0a0a" : "#f5f5f7";
  const cardBg = darkMode ? "#1c1c1e" : "#fff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";

  const TYPE_COLORS: Record<string,string> = {study:"#3b82f6",practice:"#ea580c",review:"#8b5cf6",rest:"#6e6e73"};
  const TYPE_ICONS: Record<string,string> = {study:"📖",practice:"✏️",review:"🔄",rest:"😴"};
  const SUBJECT_COLORS: Record<string,string> = {
    "English Language":"#3b82f6","Mathematics":"#8b5cf6","Physics":"#f59e0b",
    "Chemistry":"#10b981","Biology":"#ec4899","Government":"#6366f1",
    "Economics":"#14b8a6","Literature in English":"#f97316","Geography":"#84cc16",
    "CRS":"#a78bfa","All Subjects":"#ea580c","Rest":"#6e6e73",
  };

  return (
    <div style={{minHeight:"100vh", backgroundColor:bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)", padding:"20px 20px 28px", position:"relative", overflow:"hidden"}}>
        <div style={{position:"absolute", top:"-30px", right:"-30px", width:"120px", height:"120px", borderRadius:"50%", background:"rgba(255,255,255,0.06)"}} />
        <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px"}}>
          <Link href="/" style={{width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"16px", textDecoration:"none"}}>←</Link>
          <div>
            <div style={{color:"#fff", fontWeight:"800", fontSize:"18px"}}>📅 Study Plan</div>
            <div style={{color:"rgba(255,255,255,0.7)", fontSize:"12px"}}>AI-personalised for {user?.name?.split(" ")[0]}</div>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px"}}>
          {[
            {label:"Days Left", value:daysLeft > 0 ? String(daysLeft) : "~365", icon:"⏰"},
            {label:"Weeks", value:String(weeks), icon:"📆"},
            {label:"Target", value:user?.target || "---", icon:"🎯"},
          ].map((s,i) => (
            <div key={i} style={{backgroundColor:"rgba(255,255,255,0.12)", borderRadius:"12px", padding:"12px", textAlign:"center"}}>
              <div style={{fontSize:"18px", marginBottom:"4px"}}>{s.icon}</div>
              <div style={{color:"#fde68a", fontWeight:"900", fontSize:"18px"}}>{s.value}</div>
              <div style={{color:"rgba(255,255,255,0.6)", fontSize:"10px"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 16px"}}>
        {!generated ? (
          <div style={{backgroundColor:cardBg, borderRadius:"20px", padding:"28px 20px", textAlign:"center", boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 16px rgba(0,0,0,0.08)", border:`1px solid ${borderC}`}}>
            <div style={{fontSize:"60px", marginBottom:"16px"}}>🤖</div>
            <h2 style={{fontSize:"20px", fontWeight:"800", color:textColor, margin:"0 0 8px"}}>Generate Your Study Plan</h2>
            <p style={{fontSize:"14px", color:subText, margin:"0 0 20px", lineHeight:"1.6"}}>
              AI will create a <strong>{weeks}-week plan</strong> with daily schedules based on your {daysLeft} days remaining, subjects, and target score.
            </p>
            {user && (
              <div style={{backgroundColor:darkMode?"#2c2c2e":"#f5f5f7", borderRadius:"14px", padding:"14px", marginBottom:"20px", textAlign:"left"}}>
                {[
                  {label:"Course", value:user.course},
                  {label:"Institution", value:user.institution},
                  {label:"Subjects", value:user.subjects?.join(", ")},
                  {label:"Target", value:`${user.target}/400`},
                  {label:"Days left", value:`${daysLeft} days (${weeks} weeks)`},
                ].map((item,i) => (
                  <div key={i} style={{display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderBottom:i<4?`1px solid ${borderC}`:"none"}}>
                    <span style={{color:subText}}>{item.label}</span>
                    <span style={{color:textColor, fontWeight:"600", textAlign:"right", maxWidth:"60%"}}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={generatePlan} disabled={loading} style={{width:"100%", padding:"16px", borderRadius:"16px", border:"none", background:loading?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"800", fontSize:"16px", cursor:loading?"not-allowed":"pointer", boxShadow:loading?"none":"0 4px 16px rgba(234,88,12,0.35)"}}>
              {loading ? `🤖 Building your ${weeks}-week plan...` : `✨ Generate ${weeks}-Week Plan`}
            </button>
            {loading && <p style={{fontSize:"12px", color:subText, marginTop:"10px"}}>This may take 15-20 seconds...</p>}
          </div>
        ) : (
          <div>
            {/* Week selector */}
            <div style={{display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"4px", marginBottom:"16px", scrollbarWidth:"none"}}>
              {plan.map((w,i) => (
                <button key={i} onClick={()=>setActiveWeek(i)} style={{flexShrink:0, padding:"8px 14px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"700", backgroundColor:activeWeek===i?"#ea580c":darkMode?"#2c2c2e":"#f0f0f0", color:activeWeek===i?"#fff":subText, transition:"all 0.2s"}}>
                  W{w.week}
                </button>
              ))}
            </div>

            {plan[activeWeek] && (
              <div>
                {/* Week header */}
                <div style={{backgroundColor:cardBg, borderRadius:"20px", overflow:"hidden", marginBottom:"12px", boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 16px rgba(0,0,0,0.08)", border:`1px solid ${borderC}`}}>
                  <div style={{padding:"18px 20px", background:"linear-gradient(135deg,#c2410c,#ea580c)"}}>
                    <div style={{color:"rgba(255,255,255,0.7)", fontSize:"11px", marginBottom:"4px"}}>WEEK {plan[activeWeek].week} · {plan[activeWeek].dateRange}</div>
                    <div style={{color:"#fff", fontSize:"17px", fontWeight:"800"}}>{plan[activeWeek].focus}</div>
                    <div style={{color:"rgba(255,255,255,0.85)", fontSize:"13px", marginTop:"4px"}}>🎯 {plan[activeWeek].goal}</div>
                    <div style={{color:"rgba(255,255,255,0.7)", fontSize:"12px", marginTop:"4px"}}>⏱ {plan[activeWeek].totalHours} hrs total this week</div>
                  </div>

                  {/* Daily breakdown */}
                  <div style={{padding:"12px 16px"}}>
                    {(plan[activeWeek].days || []).map((d,i) => (
                      <div key={i} style={{display:"flex", alignItems:"center", gap:"12px", padding:"10px 12px", borderRadius:"12px", backgroundColor:d.type==="rest"?darkMode?"#1a1a1a":"#fafafa":darkMode?"#2c2c2e":"#f8f8f8", marginBottom:"8px"}}>
                        <div style={{textAlign:"center", flexShrink:0, width:"36px"}}>
                          <div style={{fontSize:"10px", color:subText, fontWeight:"600"}}>
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]}
                          </div>
                          <div style={{fontSize:"11px", color:textColor, fontWeight:"700"}}>{d.date}</div>
                        </div>
                        <div style={{width:"4px", height:"36px", borderRadius:"2px", backgroundColor:SUBJECT_COLORS[d.subject]||"#ea580c", flexShrink:0}} />
                        <div style={{flex:1}}>
                          <div style={{fontSize:"13px", fontWeight:"700", color:d.type==="rest"?subText:textColor}}>{d.topic}</div>
                          <div style={{fontSize:"11px", color:SUBJECT_COLORS[d.subject]||subText, fontWeight:"600", marginTop:"2px"}}>{d.subject}</div>
                        </div>
                        <div style={{display:"flex", alignItems:"center", gap:"4px", flexShrink:0}}>
                          <span style={{fontSize:"12px"}}>{TYPE_ICONS[d.type]||"📖"}</span>
                          {d.hours > 0 && <span style={{fontSize:"12px", color:TYPE_COLORS[d.type]||"#ea580c", fontWeight:"700"}}>{d.hours}h</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div style={{display:"flex", gap:"10px", marginBottom:"12px"}}>
                  <button onClick={()=>setActiveWeek(w=>Math.max(0,w-1))} disabled={activeWeek===0} style={{flex:1, padding:"12px", borderRadius:"14px", border:`1.5px solid ${borderC}`, backgroundColor:"transparent", color:activeWeek===0?subText:textColor, fontWeight:"700", cursor:activeWeek===0?"not-allowed":"pointer"}}>← Prev Week</button>
                  <button onClick={()=>setActiveWeek(w=>Math.min(plan.length-1,w+1))} disabled={activeWeek===plan.length-1} style={{flex:1, padding:"12px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", cursor:activeWeek===plan.length-1?"not-allowed":"pointer"}}>Next Week →</button>
                </div>

                <button onClick={()=>{setGenerated(false);setPlan([]);localStorage.removeItem("companion_study_plan");}} style={{width:"100%", padding:"13px", borderRadius:"14px", border:`1.5px solid ${borderC}`, backgroundColor:"transparent", color:subText, fontWeight:"600", fontSize:"14px", cursor:"pointer"}}>
                  🔄 Regenerate Plan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
