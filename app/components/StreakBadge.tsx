"use client";
import { useEffect, useState } from "react";

export default function StreakBadge({ darkMode }:{ darkMode:boolean }) {
  const [streak, setStreak] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(()=>{
    setMounted(true);
    const saved = localStorage.getItem("study_streak");
    if (saved) {
      const data = JSON.parse(saved);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now()-86400000).toDateString();
      const current = (data.lastStudied===today||data.lastStudied===yesterday) ? data.current : 0;
      setStreak(current);
      setTodayDone(data.lastStudied===today);
    }
    // Also check study plan
    const sp = localStorage.getItem("companion_study_plan");
    if (sp) {
      const plan = JSON.parse(sp);
      const today = new Date().toISOString().split("T")[0];
      for (const week of plan) {
        for (const day of week.days||[]) {
          if (day.date===today && day.done) { setTodayDone(true); break; }
        }
      }
    }
  },[]);

  if (!mounted || streak===0) return null;

  return (
    <div style={{
      display:"inline-flex",alignItems:"center",gap:"5px",
      padding:"5px 12px",borderRadius:"20px",
      backgroundColor:todayDone?(darkMode?"#0a1a0a":"#f0fdf4"):(darkMode?"#2a1810":"#fff8f5"),
      border:`1px solid ${todayDone?"#86efac":"#fed7aa"}`,
      fontSize:"13px",fontWeight:"700",
      color:todayDone?"#16a34a":"#ea580c",
    }}>
      🔥 {streak} day streak {todayDone?"✓":""}
    </div>
  );
}
