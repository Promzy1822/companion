"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DayPlan { day:number; date:string; subject:string; topic:string; hours:number; type:string; done?:boolean; }
interface WeekPlan { week:number; dateRange:string; focus:string; goal:string; days:DayPlan[]; totalHours:number; }

function getSubjectSlug(subject: string): string {
  const map: Record<string,string> = {
    "English Language":"english","Mathematics":"mathematics","Physics":"physics",
    "Chemistry":"chemistry","Biology":"biology","Government":"government",
    "Economics":"economics","Literature in English":"literature","Geography":"geography",
    "CRS":"crs","IRS":"crs","Commerce":"economics","Agricultural Science":"biology",
    "Further Mathematics":"mathematics",
  };
  return map[subject] || "english";
}

export default function TodayStudyBanner({ darkMode }: { darkMode: boolean }) {
  const [todayTask, setTodayTask] = useState<DayPlan|null>(null);
  const [todayPos, setTodayPos] = useState<{week:number;dayIdx:number}|null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("companion_study_plan");
    if (!saved) return;
    const plan: WeekPlan[] = JSON.parse(saved);
    const today = new Date().toISOString().split("T")[0];
    for (let wi=0; wi<plan.length; wi++) {
      for (let di=0; di<plan[wi].days.length; di++) {
        const d = plan[wi].days[di];
        if (d.date === today && d.type !== "rest") {
          setTodayTask(d);
          setTodayPos({week:wi, dayIdx:di});
          return;
        }
      }
    }
  }, []);

  const markDone = () => {
    if (!todayPos || !todayTask) return;
    const saved = localStorage.getItem("companion_study_plan");
    if (!saved) return;
    const plan: WeekPlan[] = JSON.parse(saved);
    plan[todayPos.week].days[todayPos.dayIdx].done = !todayTask.done;
    localStorage.setItem("companion_study_plan", JSON.stringify(plan));
    setTodayTask({...todayTask, done: !todayTask.done});
  };

  if (!mounted || !todayTask) return null;

  const cardBg = darkMode ? "#1c1c1e" : "#fff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const slug = getSubjectSlug(todayTask.subject);
  const isLearn = todayTask.type === "study";
  const isPractice = todayTask.type === "practice";

  return (
    <div style={{backgroundColor:cardBg, borderRadius:"20px", overflow:"hidden", border:`1.5px solid ${todayTask.done?"#16a34a":"#ea580c"}`, boxShadow:todayTask.done?"0 4px 16px rgba(22,163,74,0.12)":"0 4px 16px rgba(234,88,12,0.12)"}}>
      <div style={{padding:"10px 16px", background:todayTask.done?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#c2410c,#ea580c)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
          <span style={{fontSize:"14px"}}>📌</span>
          <span style={{color:"#fff", fontSize:"12px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px"}}>Today's Study Plan</span>
        </div>
        {todayTask.done && <span style={{fontSize:"12px", color:"#fff", fontWeight:"700"}}>✓ Done!</span>}
      </div>

      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"14px"}}>
          {/* Graduation cap icon — no C logo */}
          <div style={{width:"48px", height:"48px", borderRadius:"14px", background:"linear-gradient(135deg,#f97316,#c2410c)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"22px", boxShadow:"0 4px 12px rgba(234,88,12,0.3)"}}>
            🎓
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:"17px", fontWeight:"800", color:textColor, lineHeight:"1.3"}}>{todayTask.topic}</div>
            <div style={{fontSize:"13px", color:"#ea580c", fontWeight:"600", marginTop:"2px"}}>{todayTask.subject}</div>
            <div style={{fontSize:"12px", color:subText, marginTop:"2px"}}>
              {todayTask.type==="study"?"📖 Study session":todayTask.type==="practice"?"✏️ Practice":todayTask.type==="review"?"🔄 Review":""}
              {todayTask.hours>0?` · ${todayTask.hours}h`:""}
            </div>
          </div>
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
          {isLearn && (
            <>
              <Link href={`/subjects?mode=learn&subject=${slug}`} style={{display:"flex", alignItems:"center", gap:"10px", padding:"13px 16px", borderRadius:"14px", background:"linear-gradient(135deg,#3b82f6,#2563eb)", textDecoration:"none", boxShadow:"0 3px 12px rgba(59,130,246,0.3)"}}>
                <span style={{fontSize:"20px"}}>📚</span>
                <div style={{flex:1}}>
                  <div style={{color:"#fff", fontWeight:"700", fontSize:"14px"}}>{"Learn: "+todayTask.topic}</div>
                  <div style={{color:"rgba(255,255,255,0.75)", fontSize:"12px"}}>Watch lessons for this topic</div>
                </div>
                <span style={{color:"rgba(255,255,255,0.7)", fontSize:"18px"}}>→</span>
              </Link>
              <Link href={"/ai"} style={{display:"flex", alignItems:"center", gap:"10px", padding:"13px 16px", borderRadius:"14px", border:`1px solid ${borderC}`, backgroundColor:darkMode?"#2c2c2e":"#f8f8f8", textDecoration:"none"}}>
                <span style={{fontSize:"20px"}}>🎓</span>
                <div style={{flex:1}}>
                  <div style={{color:textColor, fontWeight:"700", fontSize:"14px"}}>Ask AI to explain this topic</div>
                  <div style={{color:subText, fontSize:"12px"}}>Get detailed explanation</div>
                </div>
                <span style={{color:subText, fontSize:"18px"}}>→</span>
              </Link>
            </>
          )}
          {isPractice && (
            <>
              <Link href={`/solver?subject=${encodeURIComponent(todayTask.subject)}&topic=${encodeURIComponent(todayTask.topic)}`} style={{display:"flex", alignItems:"center", gap:"10px", padding:"13px 16px", borderRadius:"14px", background:"linear-gradient(135deg,#ea580c,#f97316)", textDecoration:"none", boxShadow:"0 3px 12px rgba(234,88,12,0.3)"}}>
                <span style={{fontSize:"20px"}}>✏️</span>
                <div style={{flex:1}}>
                  <div style={{color:"#fff", fontWeight:"700", fontSize:"14px"}}>{"Practice: "+todayTask.topic}</div>
                  <div style={{color:"rgba(255,255,255,0.75)", fontSize:"12px"}}>JAMB past questions on this topic</div>
                </div>
                <span style={{color:"rgba(255,255,255,0.7)", fontSize:"18px"}}>→</span>
              </Link>
              <Link href={"/ai"} style={{display:"flex", alignItems:"center", gap:"10px", padding:"13px 16px", borderRadius:"14px", border:`1px solid ${borderC}`, backgroundColor:darkMode?"#2c2c2e":"#f8f8f8", textDecoration:"none"}}>
                <span style={{fontSize:"20px"}}>🎓</span>
                <div style={{flex:1}}>
                  <div style={{color:textColor, fontWeight:"700", fontSize:"14px"}}>Get AI-generated questions</div>
                  <div style={{color:subText, fontSize:"12px"}}>Tailored to this topic</div>
                </div>
                <span style={{color:subText, fontSize:"18px"}}>→</span>
              </Link>
            </>
          )}
          {!isLearn && !isPractice && (
            <Link href={"/ai"} style={{display:"flex", alignItems:"center", gap:"10px", padding:"13px 16px", borderRadius:"14px", background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", textDecoration:"none", boxShadow:"0 3px 12px rgba(139,92,246,0.3)"}}>
              <span style={{fontSize:"20px"}}>🎓</span>
              <div style={{flex:1}}>
                <div style={{color:"#fff", fontWeight:"700", fontSize:"14px"}}>Review with AI</div>
                <div style={{color:"rgba(255,255,255,0.75)", fontSize:"12px"}}>Summary and practice questions</div>
              </div>
              <span style={{color:"rgba(255,255,255,0.7)", fontSize:"18px"}}>→</span>
            </Link>
          )}

          <button onClick={markDone} style={{width:"100%", padding:"12px", borderRadius:"14px", border:"none", background:todayTask.done?"linear-gradient(135deg,#15803d,#16a34a)":"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", marginTop:"4px", boxShadow:todayTask.done?"0 4px 12px rgba(22,163,74,0.3)":"0 4px 12px rgba(234,88,12,0.3)"}}>
            {todayTask.done?"✅ Completed! Tap to undo":"Mark as Complete ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}