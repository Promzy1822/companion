"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface StreakData { current:number; longest:number; lastStudied:string; totalDays:number; }
interface DayPlan { date:string; type:string; done?:boolean; subject:string; topic:string; }
interface WeekPlan { days:DayPlan[]; }
interface User { deadline?:string; selfRating?:string; name?:string; target?:string; }

function getDaysToJAMB(deadline?:string):number {
  if (deadline) {
    const d = Math.ceil((new Date(deadline).getTime()-Date.now())/86400000);
    if (d>0) return d;
  }
  return Math.ceil((new Date(`April 15,${new Date().getFullYear()+1}`).getTime()-Date.now())/86400000);
}

function getMotivation(days:number, streak:number):string {
  if (days<=7) return "JAMB is in less than a week! Final revision mode!";
  if (days<=14) return "Two weeks left! Focus on weak topics and past questions.";
  if (days<=30) return `${days} days left. Study at least 2 hours daily now.`;
  if (streak>=7) return `${days} days left and a ${streak}-day streak! You're on track!`;
  if (days<=90) return `${days} days left. Build your daily study habit now.`;
  return `${days} days to JAMB. Early preparation is your biggest advantage!`;
}

export default function StreakCard({ darkMode }:{ darkMode:boolean }) {
  const [streak, setStreak] = useState<StreakData>({current:0,longest:0,lastStudied:"",totalDays:0});
  const [studyPlan, setStudyPlan] = useState<WeekPlan[]>([]);
  const [user, setUser] = useState<User>({});
  const [mounted, setMounted] = useState(false);
  const [todayDone, setTodayDone] = useState(false);

  useEffect(()=>{
    setMounted(true);
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));

    // Load study plan
    const sp = localStorage.getItem("companion_study_plan");
    if (sp) setStudyPlan(JSON.parse(sp));

    // Load streak
    const saved = localStorage.getItem("study_streak");
    if (saved) {
      const data:StreakData = JSON.parse(saved);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now()-86400000).toDateString();
      if (data.lastStudied!==today && data.lastStudied!==yesterday) data.current=0;
      setStreak(data);
      setTodayDone(data.lastStudied===today);
    }
  },[]);

  // Check if today's plan task is marked done — auto-update streak
  useEffect(()=>{
    if (!studyPlan.length) return;
    const today = new Date().toISOString().split("T")[0];
    let todayTask:DayPlan|null = null;
    for (const week of studyPlan) {
      for (const day of week.days||[]) {
        if (day.date===today && day.type!=="rest") { todayTask=day; break; }
      }
      if (todayTask) break;
    }
    // If today's study plan task is done, auto-mark streak
    if (todayTask?.done && !todayDone) {
      markStreakToday();
    }
  },[studyPlan, todayDone]);

  const markStreakToday = () => {
    const today = new Date().toDateString();
    if (streak.lastStudied===today) return;
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const newCurrent = streak.lastStudied===yesterday ? streak.current+1 : 1;
    const updated:StreakData = {
      current: newCurrent,
      longest: Math.max(streak.longest, newCurrent),
      lastStudied: today,
      totalDays: streak.totalDays+1,
    };
    setStreak(updated);
    setTodayDone(true);
    localStorage.setItem("study_streak", JSON.stringify(updated));
  };

  if (!mounted) return null;

  const daysLeft = getDaysToJAMB(user.deadline);
  const motivation = getMotivation(daysLeft, streak.current);
  const jambColor = daysLeft<=30?"#dc2626":daysLeft<=90?"#d97706":"#16a34a";

  const cardBg = darkMode?"#1c1c1e":"#fff";
  const textColor = darkMode?"#f2f2f7":"#1c1c1e";
  const subText = darkMode?"#98989d":"#6e6e73";
  const borderC = darkMode?"#2c2c2e":"#e5e5ea";
  const mutedBg = darkMode?"#2c2c2e":"#f5f5f7";

  // Build 7-day week with actual dates
  const today = new Date();
  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(today);
    d.setDate(today.getDate()-today.getDay()+i);
    return d;
  });

  // Which days in this week had study plan tasks done
  const doneByDate = new Set<string>();
  for (const week of studyPlan) {
    for (const day of week.days||[]) {
      if (day.done && day.type!=="rest") {
        doneByDate.add(day.date);
      }
    }
  }
  // Also mark streak days
  if (streak.lastStudied) {
    const last = new Date(streak.lastStudied);
    for (let i=0;i<streak.current;i++) {
      const d = new Date(last);
      d.setDate(last.getDate()-i);
      doneByDate.add(d.toISOString().split("T")[0]);
    }
  }

  const todayIdx = today.getDay();
  const readinessScore = Math.min(100,
    (streak.totalDays*2) + (streak.current*3) + (parseInt(user.selfRating||"1")*10)
  );

  // Count completed tasks from study plan
  const allTasks = studyPlan.flatMap(w=>(w.days||[]).filter(d=>d.type!=="rest"));
  const doneTasks = allTasks.filter(d=>d.done).length;
  const planProgress = allTasks.length>0?Math.round((doneTasks/allTasks.length)*100):0;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

      {/* Days to JAMB banner */}
      <div style={{borderRadius:"18px",padding:"16px 18px",background:`linear-gradient(135deg,${jambColor}18,${jambColor}08)`,border:`1.5px solid ${jambColor}33`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
          <div>
            <div style={{fontSize:"12px",color:subText,fontWeight:"600"}}>
              {user.deadline?"Your exam date":"Expected JAMB date"}
            </div>
            <div style={{fontSize:"36px",fontWeight:"900",color:jambColor,letterSpacing:"-1px",lineHeight:"1.1"}}>
              {daysLeft} <span style={{fontSize:"16px",fontWeight:"600"}}>days</span>
            </div>
            {!user.deadline&&<div style={{fontSize:"10px",color:subText,marginTop:"2px"}}>Estimated · Updates when JAMB releases official date</div>}
          </div>
          <div style={{fontSize:"36px"}}>{daysLeft<=30?"🚨":daysLeft<=90?"⚡":"📅"}</div>
        </div>
        <div style={{padding:"10px 12px",borderRadius:"10px",backgroundColor:darkMode?"rgba(0,0,0,0.25)":"rgba(255,255,255,0.6)"}}>
          <div style={{fontSize:"13px",color:textColor,fontStyle:"italic",lineHeight:"1.5"}}>"{motivation}"</div>
        </div>
      </div>

      {/* Streak + calendar */}
      <div style={{backgroundColor:cardBg,borderRadius:"18px",padding:"18px",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"15px",fontWeight:"800",color:textColor}}>🔥 Study Streak</div>
            <div style={{fontSize:"12px",color:subText,marginTop:"2px"}}>Linked to your study plan</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"32px",fontWeight:"900",color:"#ea580c",letterSpacing:"-1px",lineHeight:"1"}}>{streak.current}</div>
            <div style={{fontSize:"11px",color:subText}}>day streak</div>
          </div>
        </div>

        {/* 7-day calendar with real dates */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"5px",marginBottom:"14px"}}>
          {weekDays.map((d,i)=>{
            const dateStr = d.toISOString().split("T")[0];
            const isToday = i===todayIdx;
            const isDone = doneByDate.has(dateStr);
            const isFuture = i>todayIdx;
            return (
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"10px",color:isToday?"#ea580c":subText,fontWeight:isToday?"700":"400",marginBottom:"4px"}}>
                  {["S","M","T","W","T","F","S"][i]}
                </div>
                <div style={{
                  aspectRatio:"1",borderRadius:"9px",
                  background:isDone?"linear-gradient(135deg,#c2410c,#ea580c)":isToday?(darkMode?"#2a1810":"#fff8f5"):"transparent",
                  border:isToday&&!isDone?`2px solid #ea580c`:`1px solid ${isDone?"transparent":borderC}`,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  opacity:isFuture?0.4:1,fontSize:"10px",fontWeight:"700",
                  color:isDone?"#fff":isToday?"#ea580c":subText,
                }}>
                  <div>{d.getDate()}</div>
                  {isDone&&<div style={{fontSize:"8px"}}>✓</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"14px"}}>
          {[
            {label:"Best Streak",val:`${streak.longest}d`,color:textColor},
            {label:"Total Days",val:`${streak.totalDays}d`,color:textColor},
            {label:"Plan Done",val:`${planProgress}%`,color:planProgress>=60?"#16a34a":planProgress>=30?"#d97706":"#dc2626"},
          ].map((s,i)=>(
            <div key={i} style={{backgroundColor:mutedBg,borderRadius:"10px",padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:"16px",fontWeight:"800",color:s.color}}>{s.val}</div>
              <div style={{fontSize:"10px",color:subText,marginTop:"2px"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Check-in button */}
        {!todayDone?(
          <button onClick={markStreakToday} style={{width:"100%",padding:"13px",borderRadius:"14px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"14px",cursor:"pointer",boxShadow:"0 4px 12px rgba(234,88,12,0.3)"}}>
            ✅ Mark Today as Studied
          </button>
        ):(
          <div style={{textAlign:"center",padding:"11px",borderRadius:"14px",backgroundColor:darkMode?"#0a1a0a":"#f0fdf4",border:"1px solid #86efac"}}>
            <span style={{fontSize:"13px",color:"#16a34a",fontWeight:"700"}}>🎉 Studied today! Come back tomorrow</span>
          </div>
        )}

        {/* Link to study plan if no plan yet */}
        {studyPlan.length===0&&(
          <Link href="/studyplan" style={{display:"block",marginTop:"10px",textAlign:"center",fontSize:"12px",color:"#ea580c",fontWeight:"700",textDecoration:"none"}}>
            Generate a study plan to sync your streak →
          </Link>
        )}
      </div>

      {/* Readiness card */}
      <div style={{backgroundColor:cardBg,borderRadius:"18px",padding:"18px",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <div style={{fontSize:"15px",fontWeight:"800",color:textColor}}>📊 Exam Readiness</div>
          <div style={{fontSize:"20px",fontWeight:"900",color:readinessScore>=60?"#16a34a":readinessScore>=30?"#d97706":"#dc2626"}}>{readinessScore}%</div>
        </div>
        <div style={{height:"10px",borderRadius:"5px",backgroundColor:mutedBg,overflow:"hidden",marginBottom:"12px"}}>
          <div style={{height:"100%",width:`${readinessScore}%`,borderRadius:"5px",background:"linear-gradient(90deg,#c2410c,#ea580c,#f97316)",transition:"width 0.5s"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {[
            {icon:"📅",label:"Days studied",val:streak.totalDays},
            {icon:"🔥",label:"Current streak",val:`${streak.current}d`},
            {icon:"✅",label:"Tasks done",val:`${doneTasks}/${allTasks.length}`},
            {icon:"⭐",label:"Self rating",val:["","Not ready","Starting","Progress","Almost!"][parseInt(user.selfRating||"1")]},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",borderRadius:"10px",backgroundColor:mutedBg}}>
              <span style={{fontSize:"14px"}}>{s.icon}</span>
              <div>
                <div style={{fontSize:"12px",fontWeight:"700",color:textColor}}>{s.val}</div>
                <div style={{fontSize:"10px",color:subText}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
