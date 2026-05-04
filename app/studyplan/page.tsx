"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User { name:string; target:string; institution:string; course:string; subjects:string[]; deadline:string; selfRating:string; recommendation?:string; }
interface DayPlan { day:number; date:string; subject:string; topic:string; hours:number; type:string; done?:boolean; }
interface WeekPlan { week:number; dateRange:string; focus:string; goal:string; days:DayPlan[]; totalHours:number; }

function getDaysRemaining(deadline?:string):number {
  if (deadline) {
    const diff = new Date(deadline).getTime() - Date.now();
    const d = Math.ceil(diff/86400000);
    if (d > 0) return d;
  }
  return Math.ceil((new Date(`April 15,${new Date().getFullYear()+1}`).getTime()-Date.now())/86400000);
}

function getDateStr(daysFromNow:number):string {
  const d = new Date();
  d.setDate(d.getDate()+daysFromNow);
  return d.toLocaleDateString("en-NG",{month:"short",day:"numeric"});
}

function getFullDateStr(daysFromNow:number):string {
  const d = new Date();
  d.setDate(d.getDate()+daysFromNow);
  return d.toISOString().split("T")[0];
}

function getTodayTask(plan:WeekPlan[]):DayPlan|null {
  const today = new Date().toISOString().split("T")[0];
  for (const week of plan) {
    for (const day of week.days) {
      if (day.date === today) return day;
    }
  }
  return null;
}

function getTodayWeekDay(plan:WeekPlan[]):{week:number;dayIdx:number}|null {
  const today = new Date().toISOString().split("T")[0];
  for (let wi=0;wi<plan.length;wi++) {
    for (let di=0;di<plan[wi].days.length;di++) {
      if (plan[wi].days[di].date===today) return {week:wi,dayIdx:di};
    }
  }
  return null;
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
  const [view, setView] = useState<"today"|"weekly"|"overview">("today");

  useEffect(() => {
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode")==="true");
    const u = localStorage.getItem("companion_user");
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      setDaysLeft(getDaysRemaining(parsed.deadline));
    }
    const saved = localStorage.getItem("companion_study_plan");
    if (saved) {
      const parsed = JSON.parse(saved);
      setPlan(parsed);
      setGenerated(true);
      // Jump to current week
      const pos = getTodayWeekDay(parsed);
      if (pos) setActiveWeek(pos.week);
    }
  }, []);

  const savePlan = (p:WeekPlan[]) => {
    localStorage.setItem("companion_study_plan", JSON.stringify(p));
    setPlan(p);
  };

  const markDone = (weekIdx:number, dayIdx:number) => {
    const updated = plan.map((w,wi)=>wi!==weekIdx?w:{
      ...w,
      days: w.days.map((d,di)=>di!==dayIdx?d:{...d,done:!d.done})
    });
    savePlan(updated);
  };

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);
    const days = getDaysRemaining(user.deadline);
    const weeks = Math.min(16,Math.max(1,Math.ceil(days/7)));
    const intensity = days<30?"very intensive":days<60?"intensive":days<120?"moderate":"gradual";

    const prompt = `You are an expert JAMB study coach. Create a ${weeks}-week daily study plan.

Student: ${user.name}
Days until JAMB: ${days}
Target: ${user.target}/400
Course: ${user.course} at ${user.institution}
Subjects: ${user.subjects?.join(", ")}
Level: ${["","Not ready","Just started","Making progress","Almost ready"][parseInt(user.selfRating||"1")]}
Pace: ${intensity}
${days<30?"URGENT: <30 days! High-yield topics and past questions only.":""}

Return ONLY a valid JSON array with exactly ${weeks} weeks:
[{"week":1,"focus":"Foundation","goal":"Master basics","days":[
{"day":1,"subject":"Mathematics","topic":"Algebra","hours":2,"type":"study"},
{"day":2,"subject":"English Language","topic":"Comprehension","hours":2,"type":"study"},
{"day":3,"subject":"Physics","topic":"Mechanics","hours":2,"type":"study"},
{"day":4,"subject":"Chemistry","topic":"Atomic Structure","hours":2,"type":"study"},
{"day":5,"subject":"Mathematics","topic":"Past Questions","hours":2,"type":"practice"},
{"day":6,"subject":"All Subjects","topic":"Weekly Review","hours":3,"type":"review"},
{"day":7,"subject":"Rest","topic":"Rest day","hours":0,"type":"rest"}
]}]
Rules: Only use subjects: ${user.subjects?.join(",")}. Last week = revision only. type = study/practice/review/rest. Return ONLY JSON.`;

    try {
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:prompt})});
      const data = await res.json();
      const text = data.reply||"";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const withDates = parsed.map((w:WeekPlan,wi:number)=>{
          const ws=wi*7;
          const total=(w.days||[]).reduce((s:number,d:DayPlan)=>s+(d.hours||0),0);
          return {
            ...w,
            dateRange:`${getDateStr(ws)} – ${getDateStr(ws+6)}`,
            totalHours:total,
            days:(w.days||[]).map((d:DayPlan,di:number)=>({...d,date:getFullDateStr(ws+di),done:false}))
          };
        });
        savePlan(withDates);
        setGenerated(true);
        const pos = getTodayWeekDay(withDates);
        if (pos) setActiveWeek(pos.week);
      }
    } catch {
      const fallback = buildFallback(user,weeks);
      savePlan(fallback);
      setGenerated(true);
    } finally { setLoading(false); }
  };

  const buildFallback=(u:User,weeks:number):WeekPlan[]=>{
    const subs=u.subjects||["English Language","Mathematics"];
    return Array.from({length:weeks},(_,wi)=>{
      const ws=wi*7;
      const isLast=wi===weeks-1;
      const days:DayPlan[]=Array.from({length:7},(_,di)=>({
        day:di+1,date:getFullDateStr(ws+di),
        subject:di===6?"Rest":isLast?"All Subjects":subs[di%subs.length],
        topic:di===6?"Rest":isLast?"Past Questions & Revision":`Core Topic ${wi+1}`,
        hours:di===6?0:isLast?3:2,type:di===6?"rest":isLast?"practice":"study",done:false
      }));
      const total=days.reduce((s,d)=>s+d.hours,0);
      return {week:wi+1,dateRange:`${getDateStr(ws)} – ${getDateStr(ws+6)}`,focus:isLast?"Final Revision":wi<2?"Foundation":"Core Learning",goal:isLast?"Revise and attempt mocks":`Week ${wi+1} targets`,days,totalHours:total};
    });
  };

  if (!mounted) return null;

  const todayTask = getTodayTask(plan);
  const todayPos = getTodayWeekDay(plan);
  const totalDone = plan.flatMap(w=>w.days).filter(d=>d.done&&d.type!=="rest").length;
  const totalTasks = plan.flatMap(w=>w.days).filter(d=>d.type!=="rest").length;
  const progressPct = totalTasks>0?Math.round((totalDone/totalTasks)*100):0;

  const bg=darkMode?"#0a0a0a":"#f0f0f5";
  const cardBg=darkMode?"#1c1c1e":"#fff";
  const textColor=darkMode?"#f2f2f7":"#1c1c1e";
  const subText=darkMode?"#98989d":"#6e6e73";
  const borderC=darkMode?"#2c2c2e":"#e5e5ea";

  const TYPE_CONFIG:Record<string,{color:string;icon:string;bg:string}>={
    study:{color:"#3b82f6",icon:"📖",bg:"#eff6ff"},
    practice:{color:"#ea580c",icon:"✏️",bg:"#fff8f5"},
    review:{color:"#8b5cf6",icon:"🔄",bg:"#f5f3ff"},
    rest:{color:"#6e6e73",icon:"😴",bg:"#f5f5f7"},
  };

  const SUBJ_COLOR:Record<string,string>={
    "English Language":"#3b82f6","Mathematics":"#8b5cf6","Physics":"#f59e0b",
    "Chemistry":"#10b981","Biology":"#ec4899","Government":"#6366f1",
    "Economics":"#14b8a6","Literature in English":"#f97316","Geography":"#84cc16",
    "CRS":"#a78bfa","All Subjects":"#ea580c","Rest":"#6e6e73",
  };

  return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#3b0d02,#7c2d12,#c2410c,#ea580c)",padding:"20px 16px 28px",position:"relative",overflow:"hidden",boxShadow:"0 8px 24px rgba(194,65,12,0.3)"}}>
        <div style={{position:"absolute",top:"-40px",right:"-40px",width:"160px",height:"160px",borderRadius:"50%",background:"rgba(255,255,255,0.06)"}} />
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <Link href="/" style={{width:"34px",height:"34px",borderRadius:"10px",backgroundColor:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"16px",textDecoration:"none",backdropFilter:"blur(4px)"}}>←</Link>
          <div>
            <div style={{color:"#fff",fontWeight:"800",fontSize:"18px"}}>📅 Study Plan</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>Personalised for {user?.name?.split(" ")[0]}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
          {[
            {label:"Days Left",value:String(daysLeft),icon:"⏰"},
            {label:"Progress",value:`${progressPct}%`,icon:"📊"},
            {label:"Completed",value:`${totalDone}/${totalTasks}`,icon:"✅"},
          ].map((s,i)=>(
            <div key={i} style={{backgroundColor:"rgba(255,255,255,0.12)",borderRadius:"12px",padding:"12px",textAlign:"center",backdropFilter:"blur(4px)"}}>
              <div style={{fontSize:"16px",marginBottom:"3px"}}>{s.icon}</div>
              <div style={{color:"#fde68a",fontWeight:"900",fontSize:"17px"}}>{s.value}</div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:"10px"}}>{s.label}</div>
            </div>
          ))}
        </div>
        {generated && (
          <div style={{marginTop:"12px",height:"6px",borderRadius:"3px",backgroundColor:"rgba(255,255,255,0.2)",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progressPct}%`,borderRadius:"3px",background:"linear-gradient(90deg,#fde68a,#f97316)",transition:"width 0.5s"}} />
          </div>
        )}
      </div>

      <div style={{padding:"16px",paddingBottom:"40px",display:"flex",flexDirection:"column",gap:"16px"}}>

        {!generated ? (
          <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"28px 20px",textAlign:"center",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 4px 20px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
            <div style={{fontSize:"56px",marginBottom:"16px"}}>🤖</div>
            <h2 style={{fontSize:"20px",fontWeight:"800",color:textColor,margin:"0 0 8px"}}>Generate Your Study Plan</h2>
            <p style={{fontSize:"14px",color:subText,margin:"0 0 20px",lineHeight:"1.6"}}>
              AI will create a <strong style={{color:"#ea580c"}}>{Math.min(16,Math.max(1,Math.ceil(daysLeft/7)))}-week daily plan</strong> with specific topics, saved to your device. Check in daily to mark tasks complete.
            </p>
            {user && (
              <div style={{backgroundColor:darkMode?"#2c2c2e":"#f8f8f8",borderRadius:"14px",padding:"14px",marginBottom:"20px",textAlign:"left"}}>
                {[
                  {label:"Course",value:user.course},
                  {label:"Institution",value:user.institution},
                  {label:"Subjects",value:user.subjects?.join(", ")},
                  {label:"Target",value:`${user.target}/400`},
                  {label:"Days left",value:`${daysLeft} days`},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",padding:"5px 0",borderBottom:i<4?`1px solid ${borderC}`:"none"}}>
                    <span style={{color:subText}}>{item.label}</span>
                    <span style={{color:textColor,fontWeight:"600",textAlign:"right",maxWidth:"60%"}}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={generatePlan} disabled={loading} style={{width:"100%",padding:"16px",borderRadius:"16px",border:"none",background:loading?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"16px",cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 4px 20px rgba(234,88,12,0.4)"}}>
              {loading?`🤖 Building your plan...`:`✨ Generate Plan`}
            </button>
            {loading&&<p style={{fontSize:"12px",color:subText,marginTop:"10px"}}>Takes about 15-20 seconds...</p>}
          </div>
        ) : (
          <>
            {/* View switcher */}
            <div style={{display:"flex",gap:"6px",backgroundColor:darkMode?"#1c1c1e":"#fff",borderRadius:"14px",padding:"4px",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 8px rgba(0,0,0,0.06)",border:`1px solid ${borderC}`}}>
              {(["today","weekly","overview"] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"700",backgroundColor:view===v?"#ea580c":"transparent",color:view===v?"#fff":subText,transition:"all 0.2s",textTransform:"capitalize"}}>
                  {v==="today"?"📌 Today":v==="weekly"?"📆 Weekly":"🗓️ Overview"}
                </button>
              ))}
            </div>

            {/* TODAY VIEW */}
            {view==="today" && (
              <div>
                {todayTask ? (
                  <div>
                    <div style={{fontSize:"11px",fontWeight:"700",color:subText,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Today's Task</div>
                    <div style={{backgroundColor:cardBg,borderRadius:"20px",overflow:"hidden",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 6px 24px rgba(234,88,12,0.12)",border:`2px solid ${todayTask.done?"#16a34a":"#ea580c"}`}}>
                      <div style={{padding:"20px",background:todayTask.done?"linear-gradient(135deg,#f0fdf4,#dcfce7)":TYPE_CONFIG[todayTask.type]?.bg||"#fff8f5"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                          <div>
                            <div style={{fontSize:"11px",fontWeight:"700",color:SUBJ_COLOR[todayTask.subject]||"#ea580c",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{todayTask.subject}</div>
                            <div style={{fontSize:"20px",fontWeight:"800",color:textColor,lineHeight:"1.3"}}>{todayTask.topic}</div>
                          </div>
                          <div style={{fontSize:"32px"}}>{TYPE_CONFIG[todayTask.type]?.icon||"📖"}</div>
                        </div>
                        <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
                          <span style={{padding:"4px 12px",borderRadius:"20px",backgroundColor:TYPE_CONFIG[todayTask.type]?.color+"22",color:TYPE_CONFIG[todayTask.type]?.color,fontSize:"12px",fontWeight:"700"}}>
                            {todayTask.type.charAt(0).toUpperCase()+todayTask.type.slice(1)}
                          </span>
                          {todayTask.hours>0&&<span style={{padding:"4px 12px",borderRadius:"20px",backgroundColor:"rgba(0,0,0,0.06)",color:subText,fontSize:"12px",fontWeight:"600"}}>⏱ {todayTask.hours}h</span>}
                        </div>
                        {todayPos && (
                          <button onClick={()=>markDone(todayPos.week,todayPos.dayIdx)} style={{width:"100%",padding:"14px",borderRadius:"14px",border:"none",background:todayTask.done?"linear-gradient(135deg,#15803d,#16a34a)":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:"pointer",boxShadow:todayTask.done?"0 4px 12px rgba(22,163,74,0.3)":"0 4px 12px rgba(234,88,12,0.3)",transition:"all 0.3s"}}>
                            {todayTask.done?"✅ Completed! Great work!":"Mark as Complete ✓"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upcoming days */}
                    <div style={{fontSize:"11px",fontWeight:"700",color:subText,letterSpacing:"1px",textTransform:"uppercase",margin:"16px 0 10px"}}>Coming Up</div>
                    {plan.slice(activeWeek).flatMap(w=>w.days).filter(d=>{
                      const today=new Date().toISOString().split("T")[0];
                      return d.date>today&&d.type!=="rest";
                    }).slice(0,4).map((d,i)=>(
                      <div key={i} style={{backgroundColor:cardBg,borderRadius:"14px",padding:"14px 16px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"12px",boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.4)":"0 1px 6px rgba(0,0,0,0.06)",border:`1px solid ${borderC}`}}>
                        <div style={{width:"4px",height:"40px",borderRadius:"2px",backgroundColor:SUBJ_COLOR[d.subject]||"#ea580c",flexShrink:0}} />
                        <div style={{flex:1}}>
                          <div style={{fontSize:"12px",color:SUBJ_COLOR[d.subject]||"#ea580c",fontWeight:"700"}}>{d.subject}</div>
                          <div style={{fontSize:"13px",color:textColor,fontWeight:"600"}}>{d.topic}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:"11px",color:subText}}>{new Date(d.date).toLocaleDateString("en-NG",{weekday:"short",month:"short",day:"numeric"})}</div>
                          {d.hours>0&&<div style={{fontSize:"12px",color:TYPE_CONFIG[d.type]?.color,fontWeight:"700"}}>{d.hours}h</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{backgroundColor:cardBg,borderRadius:"20px",padding:"32px 20px",textAlign:"center",border:`1px solid ${borderC}`}}>
                    <div style={{fontSize:"48px",marginBottom:"12px"}}>🎉</div>
                    <div style={{fontSize:"16px",fontWeight:"700",color:textColor,marginBottom:"8px"}}>No task scheduled for today</div>
                    <div style={{fontSize:"13px",color:subText}}>Check the Weekly or Overview tab to see your full plan.</div>
                  </div>
                )}
              </div>
            )}

            {/* WEEKLY VIEW */}
            {view==="weekly" && (
              <div>
                <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"4px",marginBottom:"14px",scrollbarWidth:"none"}}>
                  {plan.map((w,i)=>{
                    const weekDone=w.days.filter(d=>d.done&&d.type!=="rest").length;
                    const weekTotal=w.days.filter(d=>d.type!=="rest").length;
                    const isCurrent=todayPos?.week===i;
                    return (
                      <button key={i} onClick={()=>setActiveWeek(i)} style={{flexShrink:0,padding:"8px 14px",borderRadius:"20px",border:isCurrent?"2px solid #fde68a":"none",cursor:"pointer",fontSize:"13px",fontWeight:"700",backgroundColor:activeWeek===i?"#ea580c":darkMode?"#2c2c2e":"#f0f0f0",color:activeWeek===i?"#fff":subText,transition:"all 0.2s",position:"relative"}}>
                        W{w.week}
                        {weekDone>0&&<span style={{marginLeft:"4px",fontSize:"10px",opacity:0.8}}>{weekDone}/{weekTotal}</span>}
                        {isCurrent&&<span style={{position:"absolute",top:"-4px",right:"-4px",width:"8px",height:"8px",borderRadius:"50%",backgroundColor:"#fde68a",border:"2px solid #ea580c"}} />}
                      </button>
                    );
                  })}
                </div>

                {plan[activeWeek] && (
                  <div style={{backgroundColor:cardBg,borderRadius:"20px",overflow:"hidden",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 4px 20px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
                    <div style={{padding:"18px 20px",background:"linear-gradient(135deg,#c2410c,#ea580c)"}}>
                      <div style={{color:"rgba(255,255,255,0.7)",fontSize:"11px",marginBottom:"4px"}}>WEEK {plan[activeWeek].week} · {plan[activeWeek].dateRange}</div>
                      <div style={{color:"#fff",fontSize:"17px",fontWeight:"800"}}>{plan[activeWeek].focus}</div>
                      <div style={{color:"rgba(255,255,255,0.85)",fontSize:"13px",marginTop:"4px"}}>🎯 {plan[activeWeek].goal}</div>
                      <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px",marginTop:"4px"}}>⏱ {plan[activeWeek].totalHours}h total</div>
                    </div>
                    <div style={{padding:"12px 16px"}}>
                      {plan[activeWeek].days.map((d,di)=>{
                        const isToday=d.date===new Date().toISOString().split("T")[0];
                        return (
                          <div key={di} onClick={()=>markDone(activeWeek,di)} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px",borderRadius:"14px",backgroundColor:isToday?(darkMode?"#2a1810":"#fff8f5"):d.done?(darkMode?"#0a1a0a":"#f0fdf4"):"transparent",marginBottom:"6px",border:isToday?"1.5px solid #ea580c":d.done?"1px solid #86efac":`1px solid ${borderC}`,cursor:d.type!=="rest"?"pointer":"default",transition:"all 0.15s"}}>
                            <div style={{width:"36px",textAlign:"center",flexShrink:0}}>
                              <div style={{fontSize:"10px",color:isToday?"#ea580c":subText,fontWeight:"600"}}>
                                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][di]}
                              </div>
                              <div style={{fontSize:"12px",color:isToday?"#ea580c":textColor,fontWeight:"700"}}>
                                {new Date(d.date).getDate()}
                              </div>
                            </div>
                            <div style={{width:"4px",height:"36px",borderRadius:"2px",backgroundColor:SUBJ_COLOR[d.subject]||"#ea580c",flexShrink:0}} />
                            <div style={{flex:1}}>
                              <div style={{fontSize:"13px",fontWeight:"700",color:d.type==="rest"?subText:textColor,textDecoration:d.done?"line-through":"none",opacity:d.done?0.6:1}}>{d.topic}</div>
                              <div style={{fontSize:"11px",color:SUBJ_COLOR[d.subject]||subText,fontWeight:"600"}}>{d.subject}</div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                              {d.hours>0&&<span style={{fontSize:"11px",color:TYPE_CONFIG[d.type]?.color||"#ea580c",fontWeight:"700"}}>{d.hours}h</span>}
                              {d.type!=="rest"&&(
                                <div style={{width:"22px",height:"22px",borderRadius:"50%",backgroundColor:d.done?"#16a34a":darkMode?"#2c2c2e":"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>
                                  {d.done?"✓":""}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW */}
            {view==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {plan.map((w,wi)=>{
                  const done=w.days.filter(d=>d.done&&d.type!=="rest").length;
                  const total=w.days.filter(d=>d.type!=="rest").length;
                  const pct=total>0?Math.round((done/total)*100):0;
                  const isCurrent=todayPos?.week===wi;
                  return (
                    <div key={wi} onClick={()=>{setActiveWeek(wi);setView("weekly");}} style={{backgroundColor:cardBg,borderRadius:"16px",padding:"14px 16px",boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.4)":"0 2px 8px rgba(0,0,0,0.06)",border:isCurrent?`2px solid #ea580c`:`1px solid ${borderC}`,cursor:"pointer"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                            <span style={{fontSize:"14px",fontWeight:"800",color:textColor}}>Week {w.week}</span>
                            {isCurrent&&<span style={{fontSize:"10px",fontWeight:"700",color:"#ea580c",backgroundColor:"#fff8f5",padding:"2px 8px",borderRadius:"10px"}}>Current</span>}
                          </div>
                          <div style={{fontSize:"12px",color:subText,marginTop:"2px"}}>{w.dateRange} · {w.focus}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"16px",fontWeight:"900",color:pct===100?"#16a34a":pct>0?"#ea580c":subText}}>{pct}%</div>
                          <div style={{fontSize:"10px",color:subText}}>{done}/{total}</div>
                        </div>
                      </div>
                      <div style={{height:"5px",borderRadius:"3px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,borderRadius:"3px",background:pct===100?"linear-gradient(90deg,#16a34a,#22c55e)":"linear-gradient(90deg,#c2410c,#ea580c)",transition:"width 0.5s"}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={()=>{if(confirm("Regenerate will clear your progress. Continue?")){{setGenerated(false);savePlan([]);}}}} style={{width:"100%",padding:"13px",borderRadius:"14px",border:`1.5px solid ${borderC}`,backgroundColor:"transparent",color:subText,fontWeight:"600",fontSize:"14px",cursor:"pointer"}}>
              🔄 Regenerate Plan
            </button>
          </>
        )}
      </div>
      <style>{`::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
