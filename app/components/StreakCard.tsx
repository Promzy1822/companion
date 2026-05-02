"use client";
import { useState, useEffect } from "react";

interface StreakData { current: number; longest: number; lastStudied: string; totalDays: number; }

export default function StreakCard({ darkMode }: { darkMode: boolean }) {
  const [streak, setStreak] = useState<StreakData>({ current:0, longest:0, lastStudied:"", totalDays:0 });
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("study_streak");
    if (saved) {
      const data: StreakData = JSON.parse(saved);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now()-86400000).toDateString();
      if (data.lastStudied !== today && data.lastStudied !== yesterday) {
        data.current = 0;
      }
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

  const cardBg = darkMode ? "#1c1c1e" : "#fff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";

  const DAYS = ["S","M","T","W","T","F","S"];
  const today = new Date().getDay();

  return (
    <div style={{ backgroundColor:cardBg, borderRadius:"18px", padding:"18px 20px", boxShadow: darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.08)", border:`1px solid ${borderC}`, marginBottom:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
        <div>
          <div style={{ fontSize:"14px", fontWeight:"800", color:textColor }}>🔥 Study Streak</div>
          <div style={{ fontSize:"12px", color:subText, marginTop:"2px" }}>Keep it going every day!</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"28px", fontWeight:"900", color:"#ea580c", letterSpacing:"-1px" }}>{streak.current}</div>
          <div style={{ fontSize:"11px", color:subText }}>day streak</div>
        </div>
      </div>

      {/* Week view */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"14px" }}>
        {DAYS.map((d,i) => {
          const isPast = i < today;
          const isToday = i === today;
          const isActive = isToday ? justCheckedIn : isPast && streak.current > (today - i);
          return (
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"10px", color:subText, marginBottom:"4px" }}>{d}</div>
              <div style={{ width:"100%", aspectRatio:"1", borderRadius:"8px", backgroundColor: isActive?"#ea580c":isToday?`${darkMode?"#2c2c2e":"#f0f0f0"}`:`${darkMode?"#1c1c1e":"#f8f8f8"}`, border: isToday && !isActive?`2px solid #ea580c`:"none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px" }}>
                {isActive ? "🔥" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
        <div style={{ backgroundColor:darkMode?"#2c2c2e":"#f5f5f7", borderRadius:"10px", padding:"10px", textAlign:"center" }}>
          <div style={{ fontSize:"16px", fontWeight:"800", color:textColor }}>{streak.longest}</div>
          <div style={{ fontSize:"11px", color:subText }}>Best streak</div>
        </div>
        <div style={{ backgroundColor:darkMode?"#2c2c2e":"#f5f5f7", borderRadius:"10px", padding:"10px", textAlign:"center" }}>
          <div style={{ fontSize:"16px", fontWeight:"800", color:textColor }}>{streak.totalDays}</div>
          <div style={{ fontSize:"11px", color:subText }}>Total days</div>
        </div>
      </div>

      {!justCheckedIn ? (
        <button onClick={checkIn} style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", boxShadow:"0 4px 12px rgba(234,88,12,0.3)" }}>
          ✅ Mark Today as Studied
        </button>
      ) : (
        <div style={{ textAlign:"center", padding:"10px", borderRadius:"12px", backgroundColor:darkMode?"#0a1a0a":"#f0fdf4", border:"1px solid #86efac" }}>
          <span style={{ fontSize:"13px", color:"#16a34a", fontWeight:"700" }}>🎉 Studied today! Come back tomorrow</span>
        </div>
      )}
    </div>
  );
}
