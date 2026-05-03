"use client";
import { useState, useEffect } from "react";

interface StreakData { current: number; longest: number; lastStudied: string; totalDays: number; }
interface User { deadline?: string; name?: string; target?: string; selfRating?: string; }

function getDaysToJAMB(deadline?: string): { days: number; label: string; color: string; source: string } {
  // Known approximate JAMB dates
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // If user set a custom deadline
  if (deadline) {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days > 0) return { days, label: "Your exam date", color: days < 30 ? "#dc2626" : days < 60 ? "#d97706" : "#16a34a", source: "custom" };
  }

  // JAMB typically holds UTME in April/May
  // Use expected date based on historical pattern
  const expectedJAMB = new Date(`April 15, ${nextYear}`);
  const diff = expectedJAMB.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  return {
    days: Math.max(0, days),
    label: `Expected JAMB ${nextYear}`,
    color: days < 30 ? "#dc2626" : days < 90 ? "#d97706" : "#16a34a",
    source: "estimated"
  };
}

function getMotivationalMessage(days: number, streak: number, selfRating: string): string {
  const rating = parseInt(selfRating || "1");
  if (days <= 7) return "JAMB is in less than a week! Final revision mode — stay calm and confident!";
  if (days <= 14) return "Two weeks to go! Focus on your weak topics and past questions daily.";
  if (days <= 30) return `${days} days left! You should be doing at least 2 hours of study daily now.`;
  if (days <= 60) {
    if (streak >= 7) return `${days} days left and a ${streak}-day streak! You are on the right track. Keep pushing!`;
    return `${days} days left. Build your daily study habit now — consistency beats cramming.`;
  }
  if (days <= 90) {
    if (rating <= 2) return `${days} days left. You said you just started — that is okay! Start with your strongest subject.`;
    return `${days} days left. Good time to deepen your understanding of core topics.`;
  }
  if (days <= 180) return `${days} days to go. Lock in your subjects and start building momentum now.`;
  return `${days} days to JAMB ${new Date().getFullYear() + 1}. Early preparation is your biggest advantage!`;
}

export default function StreakCard({ darkMode }: { darkMode: boolean }) {
  const [streak, setStreak] = useState<StreakData>({ current:0, longest:0, lastStudied:"", totalDays:0 });
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [user, setUser] = useState<User>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
    const saved = localStorage.getItem("study_streak");
    if (saved) {
      const data: StreakData = JSON.parse(saved);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now()-86400000).toDateString();
      if (data.lastStudied !== today && data.lastStudied !== yesterday) data.current = 0;
      setStreak(data);
      setJustCheckedIn(data.lastStudied === today);
    }
  }, []);

  const checkIn = () => {
    const today = new Date().toDateString();
    if (streak.lastStudied === today) return;
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const newCurrent = streak.lastStudied === yesterday ? streak.current + 1 : 1;
    const newStreak: StreakData = {
      current: newCurrent,
      longest: Math.max(streak.longest, newCurrent),
      lastStudied: today,
      totalDays: streak.totalDays + 1,
    };
    setStreak(newStreak);
    setJustCheckedIn(true);
    localStorage.setItem("study_streak", JSON.stringify(newStreak));
  };

  if (!mounted) return null;

  const jambInfo = getDaysToJAMB(user.deadline);
  const message = getMotivationalMessage(jambInfo.days, streak.current, user.selfRating || "1");

  const cardBg = darkMode ? "#1c1c1e" : "#fff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";

  // Build 7-day calendar with actual dates
  const today = new Date();
  const weekDays = Array.from({length:7}, (_,i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i); // Sunday to Saturday
    return d;
  });
  const todayIdx = today.getDay();

  // Figure out which days had streaks
  const studiedDays = new Set<string>();
  if (streak.lastStudied) {
    const last = new Date(streak.lastStudied);
    for (let i = 0; i < streak.current; i++) {
      const d = new Date(last);
      d.setDate(last.getDate() - i);
      studiedDays.add(d.toDateString());
    }
  }

  const readinessPercent = Math.min(100, Math.round(
    (streak.totalDays * 2) +
    (streak.current * 3) +
    (parseInt(user.selfRating||"1") * 10)
  ));

  return (
    <div style={{display:"flex", flexDirection:"column", gap:"12px"}}>

      {/* Days to JAMB Banner */}
      <div style={{borderRadius:"18px", overflow:"hidden", background:`linear-gradient(135deg, ${jambInfo.color}22, ${jambInfo.color}08)`, border:`1.5px solid ${jambInfo.color}33`, padding:"16px 18px"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px"}}>
          <div>
            <div style={{fontSize:"12px", color:subText, fontWeight:"600"}}>{jambInfo.label}</div>
            <div style={{fontSize:"32px", fontWeight:"900", color:jambInfo.color, letterSpacing:"-1px", lineHeight:"1.1"}}>
              {jambInfo.days} <span style={{fontSize:"16px", fontWeight:"600"}}>days</span>
            </div>
            {jambInfo.source === "estimated" && (
              <div style={{fontSize:"10px", color:subText, marginTop:"2px"}}>Based on historical JAMB schedule · Updates when official date releases</div>
            )}
          </div>
          <div style={{fontSize:"40px"}}>
            {jambInfo.days <= 30 ? "🚨" : jambInfo.days <= 90 ? "⚡" : "📅"}
          </div>
        </div>
        <div style={{padding:"10px 12px", borderRadius:"10px", backgroundColor: darkMode?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.6)", border:`1px solid ${jambInfo.color}22`}}>
          <div style={{fontSize:"13px", color:textColor, lineHeight:"1.5", fontStyle:"italic"}}>
            "{message}"
          </div>
        </div>
      </div>

      {/* Streak + Calendar */}
      <div style={{backgroundColor:cardBg, borderRadius:"18px", padding:"18px", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"14px", fontWeight:"800", color:textColor}}>🔥 Study Streak</div>
            <div style={{fontSize:"12px", color:subText, marginTop:"2px"}}>Stay consistent every day</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"28px", fontWeight:"900", color:"#ea580c", letterSpacing:"-1px"}}>{streak.current}</div>
            <div style={{fontSize:"11px", color:subText}}>day streak</div>
          </div>
        </div>

        {/* 7-day calendar with dates */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"6px", marginBottom:"14px"}}>
          {weekDays.map((d, i) => {
            const isToday = i === todayIdx;
            const isStudied = studiedDays.has(d.toDateString());
            const isFuture = i > todayIdx;
            return (
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"10px", color:isToday?"#ea580c":subText, fontWeight:isToday?"700":"500", marginBottom:"4px"}}>
                  {["S","M","T","W","T","F","S"][i]}
                </div>
                <div style={{
                  width:"100%", aspectRatio:"1", borderRadius:"8px",
                  backgroundColor: isStudied?"#ea580c":isToday?(darkMode?"#2c2c2e":"#fff8f5"):isFuture?(darkMode?"#1c1c1e":"#f8f8f8"):(darkMode?"#2c2c2e":"#f0f0f0"),
                  border: isToday?"2px solid #ea580c":"1px solid transparent",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  fontSize:"9px", fontWeight:"700",
                  color: isStudied?"#fff":isToday?"#ea580c":isFuture?(darkMode?"#3a3a3c":"#d0d0d0"):subText,
                  opacity: isFuture ? 0.5 : 1,
                }}>
                  <div>{d.getDate()}</div>
                  {isStudied && <div style={{fontSize:"8px"}}>🔥</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px"}}>
          {[
            {label:"Best Streak", val:streak.longest+"d"},
            {label:"Total Days", val:streak.totalDays+"d"},
            {label:"Readiness", val:readinessPercent+"%"},
          ].map((s,i) => (
            <div key={i} style={{backgroundColor:darkMode?"#2c2c2e":"#f5f5f7", borderRadius:"10px", padding:"10px", textAlign:"center"}}>
              <div style={{fontSize:"16px", fontWeight:"800", color:i===2?(readinessPercent>=60?"#16a34a":readinessPercent>=30?"#d97706":"#dc2626"):textColor}}>{s.val}</div>
              <div style={{fontSize:"10px", color:subText, marginTop:"2px"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Check-in button */}
        {!justCheckedIn ? (
          <button onClick={checkIn} style={{width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", boxShadow:"0 4px 12px rgba(234,88,12,0.3)"}}>
            ✅ Mark Today as Studied
          </button>
        ) : (
          <div style={{textAlign:"center", padding:"10px", borderRadius:"12px", backgroundColor:darkMode?"#0a1a0a":"#f0fdf4", border:"1px solid #86efac"}}>
            <span style={{fontSize:"13px", color:"#16a34a", fontWeight:"700"}}>🎉 Studied today! Come back tomorrow</span>
          </div>
        )}
      </div>

      {/* Readiness progress */}
      <div style={{backgroundColor:cardBg, borderRadius:"18px", padding:"18px", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px"}}>
          <div style={{fontSize:"14px", fontWeight:"800", color:textColor}}>📊 Exam Readiness</div>
          <div style={{fontSize:"18px", fontWeight:"900", color:readinessPercent>=60?"#16a34a":readinessPercent>=30?"#d97706":"#dc2626"}}>{readinessPercent}%</div>
        </div>
        <div style={{height:"10px", borderRadius:"5px", backgroundColor:darkMode?"#2c2c2e":"#f0f0f0", overflow:"hidden", marginBottom:"10px"}}>
          <div style={{height:"100%", width:`${readinessPercent}%`, borderRadius:"5px", background:"linear-gradient(90deg,#ea580c,#f97316)", transition:"width 0.5s"}} />
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
          {[
            {icon:"📅", label:"Days studied", val:streak.totalDays},
            {icon:"🔥", label:"Current streak", val:streak.current+"d"},
            {icon:"🏆", label:"Best streak", val:streak.longest+"d"},
            {icon:"⭐", label:"Self rating", val:["","Not ready","Starting","Progress","Almost!"][parseInt(user.selfRating||"1")]},
          ].map((s,i) => (
            <div key={i} style={{display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"10px", backgroundColor:darkMode?"#2c2c2e":"#f5f5f7"}}>
              <span style={{fontSize:"14px"}}>{s.icon}</span>
              <div>
                <div style={{fontSize:"12px", fontWeight:"700", color:textColor}}>{s.val}</div>
                <div style={{fontSize:"10px", color:subText}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
