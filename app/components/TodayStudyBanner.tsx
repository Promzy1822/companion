"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AIIcon from "./AIIcon";

interface DayPlan { day:number; date:string; subject:string; topic:string; hours:number; type:string; done?:boolean; }
interface WeekPlan { week:number; dateRange:string; focus:string; goal:string; days:DayPlan[]; totalHours:number; }

function getSubjectSlug(subject: string): string {
  const map: Record<string,string> = {
    "English Language":"english", "Mathematics":"mathematics",
    "Physics":"physics", "Chemistry":"chemistry", "Biology":"biology",
    "Government":"government", "Economics":"economics",
    "Literature in English":"literature", "Geography":"geography",
    "CRS":"crs", "IRS":"crs", "Commerce":"economics",
    "Agricultural Science":"biology", "Further Mathematics":"mathematics",
  };
  return map[subject] || "english";
}

export default function TodayStudyBanner({ darkMode }: { darkMode: boolean }) {
  const [todayTask, setTodayTask] = useState<DayPlan|null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("companion_study_plan");
    if (!saved) return;
    const plan: WeekPlan[] = JSON.parse(saved);
    const today = new Date().toISOString().split("T")[0];
    for (const week of plan) {
      for (const day of week.days) {
        if (day.date === today && day.type !== "rest") {
          setTodayTask(day);
          return;
        }
      }
    }
  }, []);

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
      {/* Header strip */}
      <div style={{padding:"10px 16px", background:todayTask.done?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#c2410c,#ea580c)", display:"flex", alignItems:"center", gap:"8px"}}>
        <span style={{fontSize:"14px"}}>📌</span>
        <span style={{color:"#fff", fontSize:"12px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px"}}>Today's Study Plan</span>
        {todayTask.done && <span style={{marginLeft:"auto", fontSize:"12px", color:"#fff", fontWeight:"700"}}>✓ Done!</span>}
      </div>

      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"14px"}}>
          <div style={{width:"44px", height:"44px", borderRadius:"12px", background:"linear-gradient(135deg,#f97316,#c2410c)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <AIIcon size={28} />
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:"16px", fontWeight:"800", color:textColor, lineHeight:"1.3"}}>{todayTask.topic}</div>
            <div style={{fontSize:"13px", color:"#ea580c", fontWeight:"600", marginTop:"2px"}}>{todayTask.subject}</div>
            <div style={{fontSize:"12px", color:subText, marginTop:"2px"}}>
              {todayTask.type === "study" ? "📖 Study session" : todayTask.type === "practice" ? "✏️ Practice questions" : todayTask.type === "review" ? "🔄 Review session" : ""}
              {todayTask.hours > 0 ? ` · ${todayTask.hours}h` : ""}
            </div>
          </div>
        </div>

        {/* Action buttons based on type */}
        <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
          {isLearn && (
            <>
              <Link href={`/subjects?mode=learn&topic=${encodeURIComponent(todayTask.topic)}&subject=${slug}`} style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"12px", background:"linear-gradient(135deg,#3b82f6,#2563eb)", textDecoration:"none", boxShadow:"0 3px 10px rgba(59,130,246,0.3)"}}>
                <span style={{fontSize:"18px"}}>📚</span>
                <div>
                  <div style={{color:"#fff", fontWeight:"700", fontSize:"13px"}}>Learn: {todayTask.topic}</div>
                  <div style={{color:"rgba(255,255,255,0.75)", fontSize:"11px"}}>Watch lessons for this topic</div>
                </div>
                <span style={{marginLeft:"auto", color:"rgba(255,255,255,0.7)", fontSize:"16px"}}>→</span>
              </Link>
              <Link href={`/ai?prompt=${encodeURIComponent(`Explain ${todayTask.topic} for JAMB ${todayTask.subject} with examples and key points I need to know`)}`} style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"12px", border:`1px solid ${borderC}`, backgroundColor:darkMode?"#2c2c2e":"#f8f8f8", textDecoration:"none"}}>
                <AIIcon size={22} />
                <div>
                  <div style={{color:textColor, fontWeight:"700", fontSize:"13px"}}>Ask AI to explain this topic</div>
                  <div style={{color:subText, fontSize:"11px"}}>Get detailed explanation</div>
                </div>
                <span style={{marginLeft:"auto", color:subText, fontSize:"16px"}}>→</span>
              </Link>
            </>
          )}

          {isPractice && (
            <>
              <Link href={`/solver?subject=${encodeURIComponent(todayTask.subject)}&topic=${encodeURIComponent(todayTask.topic)}`} style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"12px", background:"linear-gradient(135deg,#ea580c,#f97316)", textDecoration:"none", boxShadow:"0 3px 10px rgba(234,88,12,0.3)"}}>
                <span style={{fontSize:"18px"}}>✏️</span>
                <div>
                  <div style={{color:"#fff", fontWeight:"700", fontSize:"13px"}}>Practice: {todayTask.topic}</div>
                  <div style={{color:"rgba(255,255,255,0.75)", fontSize:"11px"}}>JAMB past questions on this topic</div>
                </div>
                <span style={{marginLeft:"auto", color:"rgba(255,255,255,0.7)", fontSize:"16px"}}>→</span>
              </Link>
              <Link href={`/ai?prompt=${encodeURIComponent(`Give me 5 JAMB past questions on ${todayTask.topic} in ${todayTask.subject} with detailed answers and explanations`)}`} style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"12px", border:`1px solid ${borderC}`, backgroundColor:darkMode?"#2c2c2e":"#f8f8f8", textDecoration:"none"}}>
                <AIIcon size={22} />
                <div>
                  <div style={{color:textColor, fontWeight:"700", fontSize:"13px"}}>Get AI-generated questions</div>
                  <div style={{color:subText, fontSize:"11px"}}>Tailored to this topic</div>
                </div>
                <span style={{marginLeft:"auto", color:subText, fontSize:"16px"}}>→</span>
              </Link>
            </>
          )}

          {!isLearn && !isPractice && (
            <Link href={`/ai?prompt=${encodeURIComponent(`Help me review ${todayTask.topic} in ${todayTask.subject} — give me a summary of key points and 3 practice questions`)}`} style={{display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"12px", background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", textDecoration:"none", boxShadow:"0 3px 10px rgba(139,92,246,0.3)"}}>
              <AIIcon size={22} />
              <div>
                <div style={{color:"#fff", fontWeight:"700", fontSize:"13px"}}>Review with AI</div>
                <div style={{color:"rgba(255,255,255,0.75)", fontSize:"11px"}}>Summary + practice questions</div>
              </div>
              <span style={{marginLeft:"auto", color:"rgba(255,255,255,0.7)", fontSize:"16px"}}>→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
