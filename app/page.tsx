"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User { name:string; email:string; target:string; institution:string; subjects:string[]; course:string; deadline?:string; selfRating?:string; }
interface NewsItem { title:string; url:string; source:string; time:string; image?:string; category?:string; }
interface StreakData { current:number; longest:number; lastStudied:string; totalDays:number; }

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80",
];

function getDaysToJAMB(deadline?:string) {
  if (deadline) {
    const diff = new Date(deadline).getTime() - Date.now();
    const d = Math.ceil(diff/86400000);
    if (d>0) return d;
  }
  return Math.ceil((new Date(`April 15,${new Date().getFullYear()+1}`).getTime()-Date.now())/86400000);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h<12) return "Good morning"; if (h<17) return "Good afternoon"; return "Good evening";
}

function assignCategory(t:string) {
  const l=t.toLowerCase();
  if (/exam|utme|waec|neco|result/.test(l)) return "Exams";
  if (/admission|cutoff|screening|post-utme/.test(l)) return "Admissions";
  if (/tech|ai|digital/.test(l)) return "Tech";
  if (/university|polytechnic|school/.test(l)) return "Education";
  return "General";
}

const NAV_ITEMS = [
  {icon:"🏠",label:"Home",href:"/",active:true},
  {icon:"🤖",label:"Ask AI",href:"/ai"},
  {icon:"📚",label:"Learn",href:"/subjects?mode=learn"},
  {icon:"✏️",label:"Practice",href:"/subjects?mode=practice"},
  {icon:"📝",label:"Mock Exam",href:"/mock"},
  {icon:"📅",label:"Study Plan",href:"/studyplan"},
  {icon:"🧮",label:"Solver",href:"/solver"},
  {icon:"👤",label:"Profile",href:"/profile"},
];

export default function Home() {
  const [user, setUser] = useState<User|null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streak, setStreak] = useState<StreakData>({current:0,longest:0,lastStudied:"",totalDays:0});
  const [studyPlan, setStudyPlan] = useState<any[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const router = useRouter();

  useEffect(()=>{
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode")==="true");
    const u = localStorage.getItem("companion_user");
    if (!u) { router.replace("/landing"); return; }
    setUser(JSON.parse(u));
    const s = localStorage.getItem("study_streak");
    if (s) {
      const sd:StreakData = JSON.parse(s);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now()-86400000).toDateString();
      if (sd.lastStudied!==today&&sd.lastStudied!==yesterday) sd.current=0;
      setStreak(sd);
      setCheckedIn(sd.lastStudied===today);
    }
    const sp = localStorage.getItem("companion_study_plan");
    if (sp) setStudyPlan(JSON.parse(sp));
    fetchNews();
  },[router]);

  const fetchNews = useCallback(async(isRefresh=false)=>{
    if(isRefresh) setRefreshing(true); else setNewsLoading(true);
    try {
      const res = await fetch("/api/news",{cache:"no-store"});
      const data = await res.json();
      const enriched = (data.news||[]).map((item:NewsItem,i:number)=>({...item,image:MOCK_IMAGES[i%MOCK_IMAGES.length],category:assignCategory(item.title)}));
      setNews(enriched.length?enriched:getFallback());
    } catch { setNews(getFallback()); }
    finally { setNewsLoading(false); setRefreshing(false); }
  },[]);

  const getFallback=():NewsItem[]=>[
    {title:"JAMB 2025 UTME Registration Portal Now Open",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"2h ago",image:MOCK_IMAGES[0],category:"Exams"},
    {title:"JAMB Releases Updated Syllabus for 2025 UTME",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"5h ago",image:MOCK_IMAGES[1],category:"Exams"},
    {title:"Post-UTME 2025: Universities Begin Screening",url:"#",source:"Education News",time:"1d ago",image:MOCK_IMAGES[2],category:"Admissions"},
    {title:"How to Score 300+ in JAMB: Proven Strategies",url:"#",source:"Study Guide",time:"2d ago",image:MOCK_IMAGES[3],category:"Education"},
  ];

  const checkIn=()=>{
    const today=new Date().toDateString();
    const yesterday=new Date(Date.now()-86400000).toDateString();
    const newCurrent=streak.lastStudied===yesterday?streak.current+1:1;
    const updated={current:newCurrent,longest:Math.max(streak.longest,newCurrent),lastStudied:today,totalDays:streak.totalDays+1};
    setStreak(updated); setCheckedIn(true);
    localStorage.setItem("study_streak",JSON.stringify(updated));
  };

  const getTodayTask=()=>{
    const today=new Date().toISOString().split("T")[0];
    for(const w of studyPlan){for(const d of w.days||[]){if(d.date===today&&d.type!=="rest")return d;}}
    return null;
  };

  const getProgress=()=>{
    const all=studyPlan.flatMap(w=>(w.days||[]).filter((d:any)=>d.type!=="rest"));
    const done=all.filter((d:any)=>d.done).length;
    return all.length?Math.round((done/all.length)*100):0;
  };

  const toggleDark=()=>{ const d=!darkMode; setDarkMode(d); localStorage.setItem("darkMode",String(d)); };
  const daysLeft=getDaysToJAMB(user?.deadline);
  const todayTask=getTodayTask();
  const progress=getProgress();

  if(!mounted) return null;

  const D=darkMode;
  const bg=D?"#0f0f0f":"#f2f3f7";
  const cardBg=D?"#1a1a2e":"#ffffff";
  const darkCard=D?"#16213e":"#1e2a4a";
  const textPrimary=D?"#f0f0f0":"#1a1a2a";
  const textSub=D?"#8888a0":"#6b7280";
  const borderC=D?"#2a2a3e":"#e5e7eb";
  const accentOrange="#ea580c";
  const accentGold="#f59e0b";

  return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",position:"relative"}}>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{position:"absolute",inset:0,backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={()=>setSidebarOpen(false)}/>
          <div style={{position:"relative",width:"280px",height:"100%",backgroundColor:D?"#0d0d1a":"#ffffff",boxShadow:"8px 0 32px rgba(0,0,0,0.3)",display:"flex",flexDirection:"column",zIndex:1}}>
            {/* Sidebar header */}
            <div style={{padding:"24px 20px",background:"linear-gradient(135deg,#431407,#c2410c,#ea580c)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
                <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"}}>🎓</div>
                <div>
                  <div style={{color:"#fff",fontWeight:"900",fontSize:"18px"}}>companion</div>
                  <div style={{color:"rgba(255,255,255,0.6)",fontSize:"10px",letterSpacing:"1px",textTransform:"uppercase"}}>AI Study Assistant</div>
                </div>
              </div>
              {user&&(
                <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"12px",backgroundColor:"rgba(255,255,255,0.12)"}}>
                  <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#fde68a,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:"800",color:"#7c2d12"}}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{color:"#fff",fontWeight:"700",fontSize:"13px"}}>{user.name}</div>
                    <div style={{color:"rgba(255,255,255,0.6)",fontSize:"11px"}}>{user.course}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Nav items */}
            <div style={{flex:1,overflowY:"auto",padding:"12px"}}>
              {NAV_ITEMS.map((item,i)=>(
                <Link key={i} href={item.href} onClick={()=>setSidebarOpen(false)} style={{display:"flex",alignItems:"center",gap:"14px",padding:"13px 16px",borderRadius:"12px",marginBottom:"4px",textDecoration:"none",backgroundColor:item.active?(D?"rgba(234,88,12,0.15)":"rgba(234,88,12,0.08)"):"transparent",border:item.active?`1px solid rgba(234,88,12,0.3)`:"1px solid transparent"}}>
                  <span style={{fontSize:"20px",width:"24px",textAlign:"center"}}>{item.icon}</span>
                  <span style={{fontSize:"14px",fontWeight:item.active?"700":"500",color:item.active?accentOrange:textPrimary}}>{item.label}</span>
                  {item.active&&<div style={{marginLeft:"auto",width:"6px",height:"6px",borderRadius:"50%",backgroundColor:accentOrange}}/>}
                </Link>
              ))}
            </div>

            <div style={{padding:"16px",borderTop:`1px solid ${borderC}`}}>
              <button onClick={()=>{localStorage.removeItem("companion_user");router.replace("/landing");}} style={{width:"100%",padding:"12px",borderRadius:"12px",border:`1px solid ${borderC}`,backgroundColor:"transparent",color:"#ef4444",fontWeight:"700",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                🚪 Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAV BAR */}
      <div style={{position:"sticky",top:0,zIndex:100,backgroundColor:D?"rgba(15,15,15,0.95)":"rgba(242,243,247,0.95)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${borderC}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
        <button onClick={()=>setSidebarOpen(true)} style={{width:"36px",height:"36px",borderRadius:"10px",backgroundColor:D?"#1a1a2e":"#fff",border:`1px solid ${borderC}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:textPrimary,boxShadow:D?"none":"0 1px 4px rgba(0,0,0,0.06)"}}>☰</button>

        <div style={{flex:1,display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>🎓</div>
          <span style={{fontWeight:"800",color:textPrimary,fontSize:"16px"}}>companion</span>
        </div>

        <button onClick={toggleDark} style={{width:"36px",height:"36px",borderRadius:"10px",backgroundColor:D?"#1a1a2e":"#fff",border:`1px solid ${borderC}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",boxShadow:D?"none":"0 1px 4px rgba(0,0,0,0.06)"}}>
          {D?"☀️":"🌙"}
        </button>

        <Link href="/profile" style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#fde68a,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",fontWeight:"800",color:"#7c2d12",textDecoration:"none",boxShadow:"0 2px 8px rgba(234,88,12,0.3)"}}>
          {user?.name?.charAt(0).toUpperCase()||"?"}
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div style={{padding:"16px",paddingBottom:"32px",display:"flex",flexDirection:"column",gap:"16px"}}>

        {/* WELCOME HERO CARD — like BrainLolly's dark card */}
        <div style={{borderRadius:"20px",overflow:"hidden",background:"linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#1e3a5f 100%)",padding:"24px",position:"relative",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
          <div style={{position:"absolute",top:"-30px",right:"-30px",width:"140px",height:"140px",borderRadius:"50%",background:"rgba(234,88,12,0.1)"}}/>
          <div style={{position:"absolute",bottom:"-20px",left:"-20px",width:"100px",height:"100px",borderRadius:"50%",background:"rgba(249,115,22,0.08)"}}/>
          <div style={{position:"relative"}}>
            <div style={{color:"rgba(255,255,255,0.55)",fontSize:"13px",marginBottom:"6px"}}>{getGreeting()} 👋</div>
            <div style={{color:"#fff",fontWeight:"900",fontSize:"22px",letterSpacing:"-0.5px",marginBottom:"4px"}}>{user?.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"16px"}}>
              <span style={{fontSize:"13px"}}>🎓</span>
              <span style={{color:"rgba(255,255,255,0.65)",fontSize:"13px"}}>{user?.course} · {user?.institution}</span>
            </div>

            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"16px"}}>
              {[
                {label:"Days to JAMB",value:daysLeft,icon:"⏰",color:"#f59e0b"},
                {label:"Study Streak",value:`${streak.current}d`,icon:"🔥",color:"#ea580c"},
                {label:"Progress",value:`${progress}%`,icon:"📊",color:"#22c55e"},
              ].map((s,i)=>(
                <div key={i} style={{backgroundColor:"rgba(255,255,255,0.08)",borderRadius:"12px",padding:"10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.1)"}}>
                  <div style={{fontSize:"14px",marginBottom:"3px"}}>{s.icon}</div>
                  <div style={{color:s.color,fontWeight:"900",fontSize:"16px",letterSpacing:"-0.5px"}}>{s.value}</div>
                  <div style={{color:"rgba(255,255,255,0.45)",fontSize:"9px",marginTop:"1px",textTransform:"uppercase",letterSpacing:"0.3px"}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Target badge */}
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 14px",borderRadius:"20px",backgroundColor:"rgba(234,88,12,0.2)",border:"1px solid rgba(234,88,12,0.4)"}}>
              <span style={{color:"#fde68a",fontSize:"13px"}}>🎯</span>
              <span style={{color:"#fde68a",fontSize:"13px",fontWeight:"700"}}>Target: {user?.target} pts</span>
            </div>

            {/* Check in button */}
            <div style={{marginTop:"14px"}}>
              {!checkedIn?(
                <button onClick={checkIn} style={{width:"100%",padding:"12px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"14px",cursor:"pointer",boxShadow:"0 4px 12px rgba(234,88,12,0.4)"}}>
                  ✅ Mark Today as Studied
                </button>
              ):(
                <div style={{padding:"10px 14px",borderRadius:"12px",backgroundColor:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",textAlign:"center"}}>
                  <span style={{color:"#22c55e",fontWeight:"700",fontSize:"13px"}}>🎉 Studied today! Come back tomorrow</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QUICK STATS ROW — like BrainLolly's 4 stat cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[
            {icon:"📝",label:"Mock Exams",value:streak.totalDays||0,sub:"Completed",color:"#3b82f6",bg:D?"#1e3a5f":"#eff6ff",href:"/mock"},
            {icon:"⭐",label:"Best Streak",value:`${streak.longest}d`,sub:"Days",color:"#f59e0b",bg:D?"#2a1f0a":"#fffbeb",href:"/studyplan"},
            {icon:"📅",label:"Study Plan",value:studyPlan.length?`${studyPlan.length}wk`:"None",sub:studyPlan.length?"Active":"Not set",color:"#8b5cf6",bg:D?"#1e1a2e":"#f5f3ff",href:"/studyplan"},
            {icon:"🏛️",label:"Subjects",value:user?.subjects?.length||0,sub:"Selected",color:"#10b981",bg:D?"#0a1f1a":"#ecfdf5",href:"/subjects?mode=practice"},
          ].map((s,i)=>(
            <Link key={i} href={s.href} style={{textDecoration:"none"}}>
              <div style={{backgroundColor:s.bg,borderRadius:"16px",padding:"16px",border:`1px solid ${s.color}22`,display:"flex",alignItems:"center",gap:"12px",boxShadow:D?"none":"0 1px 4px rgba(0,0,0,0.05)",transition:"transform 0.15s"}}>
                <div style={{width:"44px",height:"44px",borderRadius:"12px",backgroundColor:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>{s.icon}</div>
                <div>
                  <div style={{fontSize:"20px",fontWeight:"900",color:s.color,letterSpacing:"-0.5px"}}>{s.value}</div>
                  <div style={{fontSize:"12px",fontWeight:"600",color:textPrimary,marginTop:"1px"}}>{s.label}</div>
                  <div style={{fontSize:"10px",color:textSub,marginTop:"1px"}}>{s.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* TODAY'S TASK — like BrainLolly's exam card */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <span style={{fontSize:"12px",fontWeight:"700",color:textSub,letterSpacing:"1px",textTransform:"uppercase"}}>Today's Task</span>
            <Link href="/studyplan" style={{fontSize:"12px",color:accentOrange,fontWeight:"700",textDecoration:"none"}}>View Plan →</Link>
          </div>
          {todayTask?(
            <div style={{backgroundColor:cardBg,borderRadius:"16px",overflow:"hidden",boxShadow:D?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${borderC}`}}>
              <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#c2410c,#ea580c)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{fontSize:"14px"}}>📌</span>
                  <span style={{color:"#fff",fontWeight:"700",fontSize:"13px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Today's Study</span>
                </div>
                {todayTask.done&&<span style={{color:"#fff",fontSize:"12px",fontWeight:"700"}}>✓ Done</span>}
              </div>
              <div style={{padding:"16px"}}>
                <div style={{fontSize:"17px",fontWeight:"800",color:textPrimary,marginBottom:"4px"}}>{todayTask.topic}</div>
                <div style={{fontSize:"13px",color:accentOrange,fontWeight:"600",marginBottom:"10px"}}>{todayTask.subject}</div>
                <div style={{display:"flex",gap:"8px"}}>
                  <Link href="/ai" style={{flex:1,padding:"10px",borderRadius:"10px",background:"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff",fontWeight:"700",fontSize:"13px",textAlign:"center",textDecoration:"none"}}>Ask AI</Link>
                  <Link href={`/solver?subject=${encodeURIComponent(todayTask.subject)}&topic=${encodeURIComponent(todayTask.topic)}`} style={{flex:1,padding:"10px",borderRadius:"10px",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"13px",textAlign:"center",textDecoration:"none"}}>Practice</Link>
                </div>
              </div>
            </div>
          ):(
            <div style={{backgroundColor:cardBg,borderRadius:"16px",padding:"24px",textAlign:"center",boxShadow:D?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${borderC}`}}>
              <div style={{fontSize:"36px",marginBottom:"8px"}}>📅</div>
              <div style={{fontSize:"15px",fontWeight:"700",color:textPrimary,marginBottom:"4px"}}>No study plan yet</div>
              <div style={{fontSize:"13px",color:textSub,marginBottom:"14px"}}>Generate an AI study plan tailored to your subjects</div>
              <Link href="/studyplan" style={{display:"inline-block",padding:"10px 24px",borderRadius:"20px",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"13px",textDecoration:"none"}}>Generate Plan →</Link>
            </div>
          )}
        </div>

        {/* QUICK ACCESS GRID */}
        <div>
          <div style={{fontSize:"12px",fontWeight:"700",color:textSub,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Quick Access</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
            {[
              {icon:"🤖",label:"Ask AI",href:"/ai",color:"#ea580c"},
              {icon:"📚",label:"Learn",href:"/subjects?mode=learn",color:"#3b82f6"},
              {icon:"✏️",label:"Practice",href:"/subjects?mode=practice",color:"#8b5cf6"},
              {icon:"🧮",label:"Solver",href:"/solver",color:"#10b981"},
            ].map((c,i)=>(
              <Link key={i} href={c.href} style={{textDecoration:"none"}}>
                <div style={{backgroundColor:cardBg,borderRadius:"14px",padding:"14px 8px",textAlign:"center",boxShadow:D?"0 1px 6px rgba(0,0,0,0.3)":"0 1px 6px rgba(0,0,0,0.06)",border:`1px solid ${borderC}`}}>
                  <div style={{width:"38px",height:"38px",borderRadius:"11px",backgroundColor:`${c.color}18`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontSize:"18px"}}>{c.icon}</div>
                  <div style={{fontWeight:"700",color:c.color,fontSize:"11px"}}>{c.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* STREAK CALENDAR */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <span style={{fontSize:"12px",fontWeight:"700",color:textSub,letterSpacing:"1px",textTransform:"uppercase"}}>Study Streak</span>
            <span style={{fontSize:"13px",color:accentOrange,fontWeight:"700"}}>🔥 {streak.current} days</span>
          </div>
          <div style={{backgroundColor:cardBg,borderRadius:"16px",padding:"16px",boxShadow:D?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${borderC}`}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"6px",marginBottom:"12px"}}>
              {Array.from({length:7},(_,i)=>{
                const d=new Date(); d.setDate(d.getDate()-d.getDay()+i);
                const isToday=i===new Date().getDay();
                const studied=streak.lastStudied&&new Date(streak.lastStudied).getDay()===i&&new Date(streak.lastStudied)>=new Date(d.getFullYear(),d.getMonth(),d.getDate());
                return (
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{fontSize:"10px",color:isToday?accentOrange:textSub,fontWeight:isToday?"700":"400",marginBottom:"4px"}}>
                      {["S","M","T","W","T","F","S"][i]}
                    </div>
                    <div style={{aspectRatio:"1",borderRadius:"8px",backgroundColor:studied?accentOrange:isToday?D?"#2a1810":"#fff8f5":"transparent",border:isToday?`2px solid ${accentOrange}`:studied?"none":`1px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"700",color:studied?"#fff":isToday?accentOrange:textSub}}>
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
              {[{l:"Current",v:`${streak.current}d`},{l:"Best",v:`${streak.longest}d`},{l:"Total",v:`${streak.totalDays}d`}].map((s,i)=>(
                <div key={i} style={{backgroundColor:D?"#0a0a1a":"#f8f8f8",borderRadius:"10px",padding:"10px",textAlign:"center",border:`1px solid ${borderC}`}}>
                  <div style={{fontSize:"16px",fontWeight:"900",color:textPrimary}}>{s.v}</div>
                  <div style={{fontSize:"10px",color:textSub,marginTop:"2px"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NEWS FEED */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"12px",fontWeight:"700",color:textSub,letterSpacing:"1px",textTransform:"uppercase"}}>JAMB News</span>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",backgroundColor:"#22c55e",animation:"pulse 2s infinite"}}/>
            </div>
            <button onClick={()=>fetchNews(true)} disabled={refreshing} style={{display:"flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"16px",border:"none",background:refreshing?"#ccc":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontSize:"11px",fontWeight:"700",cursor:refreshing?"not-allowed":"pointer",boxShadow:refreshing?"none":"0 2px 8px rgba(234,88,12,0.3)"}}>
              <span style={{display:"inline-block",animation:refreshing?"spin 0.8s linear infinite":"none"}}>🔄</span>
              {refreshing?"Updating...":"Refresh"}
            </button>
          </div>
          <div style={{backgroundColor:cardBg,borderRadius:"16px",overflow:"hidden",boxShadow:D?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${borderC}`}}>
            {refreshing&&<div style={{height:"3px",overflow:"hidden"}}><div style={{height:"100%",width:"40%",background:"linear-gradient(90deg,transparent,#ea580c,transparent)",animation:"shimmer 1s infinite"}}/></div>}
            {newsLoading?(
              <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{display:"flex",gap:"12px",animation:"shimmerFade 1.5s infinite"}}>
                    <div style={{flex:1}}>
                      <div style={{height:"13px",borderRadius:"6px",backgroundColor:D?"#2a2a3e":"#f0f0f0",marginBottom:"8px",width:"90%"}}/>
                      <div style={{height:"11px",borderRadius:"5px",backgroundColor:D?"#2a2a3e":"#f0f0f0",width:"55%"}}/>
                    </div>
                    <div style={{width:"68px",height:"68px",borderRadius:"12px",backgroundColor:D?"#2a2a3e":"#f0f0f0",flexShrink:0}}/>
                  </div>
                ))}
              </div>
            ):(
              news.map((item,i)=>(
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",gap:"12px",padding:"14px 16px",borderTop:i===0?"none":`1px solid ${borderC}`,textDecoration:"none",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"11px",color:accentOrange,fontWeight:"700",marginBottom:"4px"}}>{item.source} · <span style={{color:textSub,fontWeight:"400"}}>{item.time}</span></div>
                    <div style={{fontSize:"13px",color:textPrimary,fontWeight:"600",lineHeight:"1.45",marginBottom:"6px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.title}</div>
                    <span style={{fontSize:"10px",color:textSub,backgroundColor:D?"#2a2a3e":"#f2f2f7",padding:"2px 8px",borderRadius:"6px",fontWeight:"600"}}>{item.category}</span>
                  </div>
                  {item.image&&<div style={{width:"72px",height:"72px",borderRadius:"12px",overflow:"hidden",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
                    <img src={item.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                  </div>}
                </a>
              ))
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
        @keyframes shimmerFade{0%,100%{opacity:1}50%{opacity:0.5}}
        *{-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}
