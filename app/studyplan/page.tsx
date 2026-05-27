"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Target, Clock, CheckCircle, RefreshCw, BookOpen } from "lucide-react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { Progress, todayWAT } from "../lib/progress";
import { buildScheduleTopics, JAMB_TOPICS } from "../lib/jamb-topics";
import { C, palette } from "../lib/design";

interface User { name:string; target:string; institution:string; course:string; subjects:string[]; deadline:string; selfRating:string; recommendation?:string; }
interface DayPlan { day:number; date:string; subject:string; topic:string; subtopic:string; hours:number; done:boolean; type:"study"|"practice"|"rest"; }
interface WeekPlan { week:number; focus:string; goal:string; days:DayPlan[]; }

const SUBJECT_COLORS: Record<string,string> = {
  "English Language":"#1877F2","Mathematics":"#7B3FBE","Physics":"#B07D00",
  "Chemistry":"#0D8050","Biology":"#C75B21","Government":"#5B6ABF",
  "Economics":"#0D8080","Literature in English":"#C75B21","ALL":"#FA3E3E","REST":"#8A8D91",
};

function daysLeft(deadline?:string){
  if(!deadline) return 90;
  const d=Math.ceil((new Date(deadline).getTime()-Date.now())/86400000);
  return Math.max(0,d);
}
function focusName(w:number,t:number){
  if(w===1) return "Foundation & Orientation";
  if(w<=Math.ceil(t*0.4)) return "Core Learning";
  if(w<=Math.ceil(t*0.7)) return "Application & Practice";
  if(w===t-1) return "Mock Exams & Review";
  return "Final Revision";
}

export default function StudyPlan() {
  const [user,      setUser]      = useState<User|null>(null);
  const [plan,      setPlan]      = useState<WeekPlan[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);
  const [dark,      setDark]      = useState(false);
  const [activeW,   setActiveW]   = useState(0);
  const [view,      setView]      = useState<"today"|"week"|"overview">("today");
  const [ready,     setReady]     = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode")==="true");
    const u=localStorage.getItem("companion_user");
    if(u) setUser(JSON.parse(u));
    const saved=localStorage.getItem("companion_study_plan_v2");
    if(saved){
      const p:WeekPlan[]=JSON.parse(saved);
      setPlan(p); setGenerated(true);
      const today=todayWAT();
      const idx=p.findIndex(w=>w.days.some(d=>d.date===today));
      if(idx>=0) setActiveW(idx);
    }
    setReady(true);
  }, []);

  const markDone = (wi:number,di:number) => {
    const u=[...plan]; u[wi]={...u[wi],days:u[wi].days.map((d,i)=>i!==di?d:{...d,done:true})};
    setPlan(u); localStorage.setItem("companion_study_plan_v2",JSON.stringify(u));
    Progress.recordActivity("plan",{subject:u[wi].days[di].subject,topicId:u[wi].days[di].topic});
  };

  const generatePlan = async () => {
    if(!user) return;
    setLoading(true);
    const days=daysLeft(user.deadline), weeks=Math.min(14,Math.max(2,Math.ceil(days/7)));
    const subjects=user.subjects||["English Language","Mathematics"];
    const weakSubs=Progress.getWeakSubjects(subjects);
    const prompt=`You are an expert JAMB study coach. Create a ${weeks}-week study plan.\n\nStudent: ${user.name}, Target: ${user.target}, Institution: ${user.institution}, Course: ${user.course}, Subjects: ${subjects.join(", ")}, Days left: ${days}, Weak subjects: ${weakSubs.join(", ")||"none"}\n\nAvailable JAMB topics:\n${subjects.map(s=>`${s}: ${(JAMB_TOPICS[s]||[]).map(t=>t.topic).join(", ")}`).join("\n")}\n\nReturn ONLY valid JSON array (${weeks} weeks, 7 days each, 1 rest day, real topic names from above):\n[{"week":1,"focus":"Foundation","goal":"goal","days":[{"day":1,"subject":"Mathematics","topic":"Number & Numeration","subtopic":"Surds & Indices","hours":2,"type":"study"},...]}]`;
    try {
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:prompt})});
      const data=await res.json();
      const match=(data.reply||"").match(/\[[\s\S]*\]/);
      if(match){
        const start=new Date(Date.now()+3600000); let off=0;
        const parsed:WeekPlan[]=JSON.parse(match[0]).map((w:WeekPlan)=>({...w,days:w.days.map((d:DayPlan)=>{const dt=new Date(start);dt.setDate(start.getDate()+(off++));return {...d,date:dt.toISOString().slice(0,10),done:false};})}));
        setPlan(parsed); localStorage.setItem("companion_study_plan_v2",JSON.stringify(parsed)); setGenerated(true); setView("today");
      } else throw new Error("no json");
    } catch {
      const start=new Date(Date.now()+3600000); let off=0;
      const scheduled=buildScheduleTopics(subjects,weeks,weakSubs);
      let ti=0;
      const fb:WeekPlan[]=Array.from({length:weeks},(_,wi)=>({
        week:wi+1, focus:focusName(wi+1,weeks), goal:`Week ${wi+1} focus`,
        days:Array.from({length:7},(_,di)=>{
          const dt=new Date(start); dt.setDate(start.getDate()+(off++));
          const isRest=di===6, isPrac=di===4;
          const t=!isRest&&!isPrac?scheduled[ti++]:null;
          return {day:di+1,date:dt.toISOString().slice(0,10),subject:isRest?"REST":isPrac?"ALL":(t?.subject||subjects[0]),topic:isRest?"Rest Day":isPrac?"Practice & Past Questions":(t?.topic||"Revision"),subtopic:isRest?"Relax":"Mixed Subjects",hours:isRest?0:2,done:false,type:isRest?"rest":isPrac?"practice":"study"};
        }),
      }));
      setPlan(fb); localStorage.setItem("companion_study_plan_v2",JSON.stringify(fb)); setGenerated(true);
    } finally { setLoading(false); }
  };

  if (!ready) return null;
  const T = palette(dark);
  const today = todayWAT();
  const activeDays = Progress.getActiveDays();
  const todayTask = plan.flatMap(w=>w.days).find(d=>d.date===today);
  const dL = daysLeft(user?.deadline);
  const completedCount = plan.flatMap(w=>w.days).filter(d=>d.done||activeDays.has(d.date)).length;
  const studyDays = plan.flatMap(w=>w.days).filter(d=>d.type!=="rest").length;
  const pct = studyDays ? Math.round((completedCount/studyDays)*100) : 0;

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"}}>
      <Navbar darkMode={dark} onToggleDark={()=>{const n=!dark;setDark(n);localStorage.setItem("darkMode",String(n));}} />

      <div style={{background:dark?"linear-gradient(135deg,#1A2A4A,#1877F2)":"linear-gradient(135deg,#1877F2,#0C5FD1)",padding:"20px 20px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-30px",right:"-30px",width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}} />
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
          <Link href="/" style={{width:34,height:34,borderRadius:"10px",backgroundColor:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}>
            <ArrowLeft size={16} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:"18px"}}>My Study Plan</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>Real JAMB topics · AI-personalised</div>
          </div>
          {generated && <div style={{marginLeft:"auto",background:"rgba(255,255,255,0.15)",borderRadius:"20px",padding:"4px 12px",fontSize:"12px",color:"#FFF8DB",fontWeight:700}}>{pct}% done</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
          {[{icon:Clock,l:"Days Left",v:dL>999?"90+":String(dL)},{icon:Target,l:"Target",v:user?.target||"—"},{icon:BookOpen,l:"Subjects",v:String(user?.subjects?.length||0)}].map((s,i)=>{
            const Icon=s.icon;
            return (
              <div key={i} style={{background:"rgba(255,255,255,0.12)",borderRadius:"12px",padding:"12px",textAlign:"center"}}>
                <Icon size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} style={{margin:"0 auto 4px",display:"block"}} />
                <div style={{color:"#FFF8DB",fontWeight:900,fontSize:"17px"}}>{s.v}</div>
                <div style={{color:"rgba(255,255,255,0.6)",fontSize:"10px"}}>{s.l}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{padding:"16px 14px 100px"}}>
        {!generated ? (
          <div style={{background:T.surface,borderRadius:"16px",padding:"28px 20px",textAlign:"center",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{width:72,height:72,borderRadius:"20px",background:C.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <CalendarDays size={32} color={C.primary} strokeWidth={1.8} />
            </div>
            <h2 style={{fontSize:"20px",fontWeight:800,color:T.text,margin:"0 0 10px",letterSpacing:"-0.3px"}}>Generate Your Study Plan</h2>
            <p style={{fontSize:"14px",color:T.sub,margin:"0 0 22px",lineHeight:"1.6"}}>
              AI will build a day-by-day plan using real JAMB topics, tailored to your subjects, target score and exam date.
            </p>
            {user && (
              <div style={{background:T.s2,borderRadius:"12px",padding:"14px",marginBottom:"20px",textAlign:"left"}}>
                {[{l:"Subjects",v:(user.subjects||[]).join(", ")},{l:"Target",v:`${user.target}/400`},{l:"Days",v:`${dL} days left`}].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",padding:"6px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
                    <span style={{color:T.sub}}>{r.l}</span>
                    <span style={{color:T.text,fontWeight:600}}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={generatePlan} disabled={loading} style={{width:"100%",padding:"15px",borderRadius:"12px",border:"none",background:loading?"#ccc":C.primary,color:"#fff",fontWeight:700,fontSize:"15px",cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":`0 4px 14px rgba(24,119,242,0.35)`}}>
              {loading?"🤖 Building your plan…":"✨ Generate My Plan"}
            </button>
            {loading && <p style={{fontSize:"12px",color:T.muted,marginTop:"10px"}}>This takes about 15–20 seconds…</p>}
          </div>
        ) : (
          <div>
            {/* View switcher */}
            <div style={{display:"flex",gap:"6px",background:T.s2,borderRadius:"12px",padding:"4px",marginBottom:"14px"}}>
              {(["today","week","overview"] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"10px",borderRadius:"9px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,background:view===v?C.primary:"transparent",color:view===v?"#fff":T.sub,transition:"all 0.2s",textTransform:"capitalize"}}>
                  {v==="today"?"📌 Today":v==="week"?"📆 Week":"🗓 Overview"}
                </button>
              ))}
            </div>

            {/* TODAY */}
            {view==="today" && (
              <div>
                {todayTask ? (
                  <div style={{background:T.surface,borderRadius:"16px",overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    <div style={{padding:"18px 20px",background:`linear-gradient(135deg,${SUBJECT_COLORS[todayTask.subject]||C.primary}22,${SUBJECT_COLORS[todayTask.subject]||C.primary}0a)`,borderBottom:`1px solid ${T.border}`}}>
                      <div style={{fontSize:"11px",color:T.sub,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Today's Task</div>
                      <div style={{fontSize:"11px",fontWeight:700,color:SUBJECT_COLORS[todayTask.subject]||C.primary,marginBottom:"5px"}}>{todayTask.subject}</div>
                      <div style={{fontSize:"17px",fontWeight:800,color:T.text,marginBottom:"4px",letterSpacing:"-0.2px"}}>{todayTask.topic}</div>
                      <div style={{fontSize:"13px",color:T.sub}}>{todayTask.subtopic}</div>
                      <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
                        <span style={{background:T.s2,borderRadius:"8px",padding:"4px 10px",fontSize:"12px",fontWeight:600,color:T.text}}>⏱ {todayTask.hours}h</span>
                        <span style={{background:T.s2,borderRadius:"8px",padding:"4px 10px",fontSize:"12px",fontWeight:600,color:T.text,textTransform:"capitalize"}}>{todayTask.type}</span>
                      </div>
                    </div>
                    {todayTask.done||activeDays.has(today) ? (
                      <div style={{padding:"14px 20px",background:dark?"#0A1A0A":"#E6F4EA",display:"flex",alignItems:"center",gap:"10px"}}>
                        <CheckCircle size={20} color="#31A24C" strokeWidth={2} />
                        <div>
                          <div style={{fontSize:"14px",fontWeight:700,color:"#31A24C"}}>Completed!</div>
                          <div style={{fontSize:"12px",color:T.sub}}>Streak updated</div>
                        </div>
                      </div>
                    ) : todayTask.type!=="rest" && (
                      <div style={{padding:"12px 20px",display:"flex",gap:"10px"}}>
                        <Link href={`/solver?subject=${encodeURIComponent(todayTask.subject)}&question=Explain ${encodeURIComponent(todayTask.topic)}`} style={{flex:1,padding:"11px",borderRadius:"10px",border:`1.5px solid ${T.border}`,color:T.text,fontWeight:600,fontSize:"13px",textDecoration:"none",textAlign:"center",display:"block"}}>
                          Solver
                        </Link>
                        <button onClick={()=>{const wi=plan.findIndex(w=>w.days.some(d=>d.date===today));const di=plan[wi]?.days.findIndex(d=>d.date===today);if(wi>=0&&di>=0)markDone(wi,di);}} style={{flex:2,padding:"11px",borderRadius:"10px",border:"none",background:C.primary,color:"#fff",fontWeight:700,fontSize:"13px",cursor:"pointer"}}>
                          ✅ Mark Done
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{background:T.surface,borderRadius:"16px",padding:"28px",textAlign:"center",border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:"32px",marginBottom:"10px"}}>🎉</div>
                    <div style={{fontSize:"15px",fontWeight:700,color:T.text}}>No task scheduled today</div>
                    <div style={{fontSize:"13px",color:T.sub,marginTop:"6px"}}>Check back tomorrow or review past topics.</div>
                  </div>
                )}
                {/* Upcoming */}
                <div style={{background:T.surface,borderRadius:"16px",padding:"16px 18px",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:T.sub,marginBottom:"12px",textTransform:"uppercase",letterSpacing:"1px"}}>Coming Up</div>
                  {plan.flatMap(w=>w.days).filter(d=>d.date>today).slice(0,5).map((d,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"9px 0",borderBottom:i<4?`1px solid ${T.border}`:"none"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:SUBJECT_COLORS[d.subject]||C.primary,flexShrink:0}} />
                      <div style={{flex:1}}>
                        <div style={{fontSize:"13px",fontWeight:700,color:T.text}}>{d.topic}</div>
                        <div style={{fontSize:"11px",color:T.sub}}>{d.subject} · {new Date(d.date+"T00:00:00").toLocaleDateString("en-NG",{weekday:"short",day:"numeric",month:"short"})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WEEK */}
            {view==="week" && (
              <div>
                <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"4px",marginBottom:"14px",scrollbarWidth:"none"}}>
                  {plan.map((w,i)=>(
                    <button key={i} onClick={()=>setActiveW(i)} style={{flexShrink:0,padding:"7px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:700,background:activeW===i?C.primary:T.s2,color:activeW===i?"#fff":T.sub,transition:"all 0.2s"}}>
                      W{w.week}
                    </button>
                  ))}
                </div>
                {plan[activeW] && (
                  <div style={{background:T.surface,borderRadius:"16px",overflow:"hidden",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    <div style={{padding:"18px 20px",background:`linear-gradient(135deg,${C.primary},#42A5F5)`}}>
                      <div style={{color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>WEEK {plan[activeW].week}</div>
                      <div style={{color:"#fff",fontSize:"17px",fontWeight:800}}>{plan[activeW].focus}</div>
                      <div style={{color:"rgba(255,255,255,0.8)",fontSize:"12px",marginTop:"5px"}}>🎯 {plan[activeW].goal}</div>
                    </div>
                    <div style={{padding:"8px"}}>
                      {plan[activeW].days.map((d,i)=>{
                        const past=d.date<today, isToday=d.date===today, done=d.done||(past&&activeDays.has(d.date)), isRest=d.type==="rest";
                        return (
                          <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"11px",borderRadius:"10px",marginBottom:"4px",background:isToday?(dark?"#1A2A4A":C.primaryLight):"transparent",border:isToday?`1.5px solid ${C.primary}`:`1px solid transparent`}}>
                            <div style={{width:28,height:28,borderRadius:"8px",flexShrink:0,background:done?C.primary:isRest?T.s2:T.s2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:done?"#fff":T.sub,fontWeight:700}}>
                              {done?"✓":isRest?"😴":d.day}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:"13px",fontWeight:700,color:isRest?T.sub:T.text}}>{d.topic}</div>
                              <div style={{fontSize:"11px",color:T.sub}}>{d.subject} · {d.subtopic}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:"11px",color:T.sub}}>{new Date(d.date+"T00:00:00").toLocaleDateString("en-NG",{weekday:"short"})}</div>
                              {d.hours>0&&<div style={{fontSize:"11px",fontWeight:600,color:T.sub}}>{d.hours}h</div>}
                            </div>
                            {!done&&!isRest&&isToday&&(
                              <button onClick={()=>markDone(activeW,i)} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:C.primary,color:"#fff",fontWeight:700,fontSize:"11px",cursor:"pointer"}}>Done</button>
                            )}
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
                <div style={{background:T.surface,borderRadius:"16px",padding:"18px 20px",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                    <span style={{fontSize:"14px",fontWeight:700,color:T.text}}>Overall Progress</span>
                    <span style={{fontSize:"16px",fontWeight:900,color:C.primary}}>{pct}%</span>
                  </div>
                  <div style={{height:"10px",borderRadius:"5px",background:T.s3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.primary},#42A5F5)`,transition:"width 0.5s"}} />
                  </div>
                  <div style={{fontSize:"12px",color:T.sub,marginTop:"6px"}}>{completedCount} of {studyDays} study sessions done</div>
                </div>
                {plan.map((w,wi)=>{
                  const wDone=w.days.filter(d=>d.done||activeDays.has(d.date)).length;
                  const wp=Math.round((wDone/w.days.length)*100);
                  return (
                    <button key={wi} onClick={()=>{setActiveW(wi);setView("week");}} style={{background:T.surface,borderRadius:"14px",padding:"14px 18px",border:`1px solid ${activeW===wi?C.primary:T.border}`,cursor:"pointer",textAlign:"left",width:"100%"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                        <div>
                          <div style={{fontSize:"13px",fontWeight:800,color:T.text}}>Week {w.week} — {w.focus}</div>
                          <div style={{fontSize:"11px",color:T.sub,marginTop:"2px"}}>{w.goal}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"16px",fontWeight:900,color:wp>=70?"#31A24C":C.primary}}>{wp}%</div>
                          <div style={{fontSize:"10px",color:T.sub}}>{wDone}/{w.days.length}</div>
                        </div>
                      </div>
                      <div style={{height:"5px",borderRadius:"3px",background:T.s3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${wp}%`,background:wp>=70?"#31A24C":C.primary,transition:"width 0.5s"}} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={()=>{if(!confirm("Regenerate? Your progress will be lost."))return;setGenerated(false);setPlan([]);localStorage.removeItem("companion_study_plan_v2");}} style={{width:"100%",marginTop:"14px",padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"transparent",color:T.sub,fontWeight:600,fontSize:"13px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              <RefreshCw size={14} strokeWidth={2} /> Regenerate Plan
            </button>
          </div>
        )}
      </div>

      <BottomNav darkMode={dark} />
    </div>
  );
}
