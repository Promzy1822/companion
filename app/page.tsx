"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "./components/Navbar";
import StreakCard from "./components/StreakCard";
import InstallBanner from "./components/InstallBanner";
import TodayStudyBanner from "./components/TodayStudyBanner";

interface NewsItem { title:string; url:string; source:string; time:string; image?:string; category?:string; }
interface User { name:string; email:string; target:string; institution:string; subjects:string[]; course:string; }

const CATEGORIES =["All","Education","Exams","Admissions","Tech","General"];
const MOCK_IMAGES =[
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
];

const QUICK_LINKS =[
  {href:"/ai",icon:"🤖",label:"Ask AI",sub:"24/7 tutor",color:"#ea580c",shadow:"rgba(234,88,12,0.25)"},
  {href:"/subjects?mode=learn",icon:"📚",label:"Learn",sub:"Video lessons",color:"#3b82f6",shadow:"rgba(59,130,246,0.25)"},
  {href:"/subjects?mode=practice",icon:"✏️",label:"Practice",sub:"Past questions",color:"#8b5cf6",shadow:"rgba(139,92,246,0.25)"},
  {href:"/mock",icon:"📝",label:"Mock Exam",sub:"Timed test",color:"#f59e0b",shadow:"rgba(245,158,11,0.25)"},
  {href:"/solver",icon:"🧮",label:"Solver",sub:"AI explains",color:"#10b981",shadow:"rgba(16,185,129,0.25)"},
  {href:"/studyplan",icon:"📅",label:"Study Plan",sub:"AI generated",color:"#ec4899",shadow:"rgba(236,72,153,0.25)"},
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function assignCategory(t:string) {
  const l = t.toLowerCase();
  if (/exam|utme|waec|neco|result/.test(l)) return "Exams";
  if (/admission|cutoff|screening|post-utme/.test(l)) return "Admissions";
  if (/tech|ai|digital|online/.test(l)) return "Tech";
  if (/university|polytechnic|college|school/.test(l)) return "Education";
  return "General";
}

function getFallback(): NewsItem[] {
  return[
    {title:"JAMB 2025 UTME Registration Portal Now Open — Apply Before Deadline",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"2h ago"},
    {title:"JAMB Releases Updated Syllabus for 2025 UTME Examination",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"5h ago"},
    {title:"UNILAG Post-UTME Screening 2025: Dates and Requirements",url:"#",source:"UNILAG Info",time:"1d ago"},
    {title:"How to Score 300+ in JAMB: Proven Study Strategies",url:"#",source:"Education Guide",time:"1d ago"},
    {title:"CBT Centres: Full List of Approved JAMB Centres 2025",url:"#",source:"JAMB Guide",time:"2d ago"},
    {title:"OAU Cut-Off Marks for All Courses 2025 Released",url:"#",source:"University News",time:"3d ago"},
  ];
}

export default function Home() {
  const[darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User|null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const[newsLoading, setNewsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const[showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<"jamb"|"aggregate">("aggregate");
  const [jambScore, setJambScore] = useState("");
  const[postUtme, setPostUtme] = useState("");
  const [aggResult, setAggResult] = useState<null|{aggregate:number;jamb:number;post:number;grade:string;color:string}>(null);
  const [calcError, setCalcError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [pressedCard, setPressedCard] = useState<number|null>(null);
  const [hoveredLink, setHoveredLink] = useState<number|null>(null);
  const router = useRouter();

  useEffect(() => {
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const u = localStorage.getItem("companion_user");
    if (!u) { router.replace("/landing"); return; }
    setUser(JSON.parse(u));
    setAuthChecked(true);
    fetchNews();
  }, [router]);

  const fetchNews = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true); else setNewsLoading(true);
    try {
      const res = await fetch("/api/news", {cache:"no-store"});
      const data = await res.json();
      const enriched = (data.news || getFallback()).map((item:NewsItem, i:number) => ({
        ...item,
        image: MOCK_IMAGES[i % MOCK_IMAGES.length],
        category: assignCategory(item.title),
      }));
      setNews(enriched);
    } catch {
      setNews(getFallback().map((item,i) => ({...item, image:MOCK_IMAGES[i%MOCK_IMAGES.length], category:assignCategory(item.title)})));
    } finally {
      setNewsLoading(false);
      if (isRefresh) setTimeout(() => setRefreshing(false), 600);
    }
  },[]);

  const calcAggregate = () => {
    setCalcError(""); setAggResult(null);
    const j = parseFloat(jambScore), p = parseFloat(postUtme);
    if (isNaN(j)||j<0||j>400) { setCalcError("Enter valid JAMB score (0-400)"); return; }
    if (calcType==="aggregate") {
      if (isNaN(p)||p<0||p>100) { setCalcError("Enter valid Post-UTME score (0-100)"); return; }
      const jP=j/8, pP=p/2, agg=jP+pP;
      const grade=agg>=70?"Excellent 🔥":agg>=55?"Good ✅":agg>=45?"Average ⚠️":"Below average ❌";
      const color=agg>=70?"#16a34a":agg>=55?"#2563eb":agg>=45?"#d97706":"#dc2626";
      setAggResult({aggregate:parseFloat(agg.toFixed(2)),jamb:parseFloat(jP.toFixed(2)),post:parseFloat(pP.toFixed(2)),grade,color});
    } else {
      const scaled=(j/400)*100;
      const grade=j>=300?"Excellent 🔥":j>=250?"Good ✅":j>=200?"Average ⚠️":"Below average ❌";
      const color=j>=300?"#16a34a":j>=250?"#2563eb":j>=200?"#d97706":"#dc2626";
      setAggResult({aggregate:parseFloat(scaled.toFixed(1)),jamb:j,post:0,grade,color});
    }
  };

  const toggleDark = () => { const d=!darkMode; setDarkMode(d); localStorage.setItem("darkMode",String(d)); };
  const filteredNews = activeCategory==="All" ? news : news.filter(n=>n.category===activeCategory);
  if (!authChecked) return null;

  const bg = darkMode ? "#0a0a0a" : "#f8f9fa";
  const cardBg = darkMode ? "#1c1c1e" : "#ffffff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  
  return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:textColor}}>
      {/* Wrapper for responsive centering */}
      <div style={{maxWidth:"600px",margin:"0 auto",minHeight:"100vh",boxShadow:darkMode?"0 0 20px rgba(0,0,0,0.3)":"0 0 20px rgba(0,0,0,0.05)"}}>

        {/* HEADER */}
        <div style={{background:"linear-gradient(160deg,#3b0d02,#7c2d12,#c2410c,#ea580c,#fb923c)",padding:"24px 20px 32px",position:"relative",overflow:"hidden"}}>
          <Navbar darkMode={darkMode} onToggleDark={toggleDark} />
          <div style={{position:"relative",marginTop:"20px"}}>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:"14px",marginBottom:"4px",letterSpacing:"0.2px"}}>
              {getGreeting()}, <span style={{fontWeight:600,color:"#fff"}}>{user?.name.split(" ")[0]}</span> 👋
            </div>
            <div style={{color:"rgba(255,255,255,0.9)",fontSize:"24px",fontWeight:800,letterSpacing:"-0.5px"}}>
              Ready to learn today?
            </div>
          </div>
        </div>

        <div style={{padding:"24px 20px 80px",display:"flex",flexDirection:"column",gap:"28px"}}>

          {/* Quick links */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
            {QUICK_LINKS.map((c,i) => (
              <Link key={i} href={c.href} style={{textDecoration:"none"}}
                onMouseEnter={()=>setHoveredLink(i)} onMouseLeave={()=>setHoveredLink(null)}
                onTouchStart={()=>setHoveredLink(i)} onTouchEnd={()=>setHoveredLink(null)}>
                <div style={{
                  backgroundColor:cardBg, borderRadius:"20px", padding:"16px 8px",
                  textAlign:"center", border:`1px solid ${borderC}`,
                  boxShadow: hoveredLink===i
                    ? `0 10px 20px ${c.shadow}`
                    : "0 4px 6px -1px rgba(0,0,0,0.05)",
                  transform: hoveredLink===i ? "translateY(-4px)" : "translateY(0)",
                  transition:"all 0.25s ease",
                }}>
                  <div style={{fontSize:"24px",marginBottom:"8px"}}>{c.icon}</div>
                  <div style={{fontWeight:"700",color:textColor,fontSize:"12px"}}>{c.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <TodayStudyBanner darkMode={darkMode} />

          {/* Progress */}
          <div>
            <div style={{fontSize:"12px",fontWeight:"700",color:subText,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"12px"}}>Your Progress</div>
            <StreakCard darkMode={darkMode} />
          </div>

          {/* Calculator */}
          <div style={{backgroundColor:cardBg,borderRadius:"24px",border:`1px solid ${borderC}`,overflow:"hidden",boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"}}>
            <button onClick={()=>{setShowCalc(!showCalc);setAggResult(null);setCalcError("");}} style={{width:"100%",padding:"20px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{fontSize:"24px"}}>🧮</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:"700",color:textColor,fontSize:"16px"}}>Score Calculator</div>
                  <div style={{fontSize:"12px",color:subText}}>Quick aggregate estimator</div>
                </div>
              </div>
              <div style={{padding:"6px 12px",borderRadius:"12px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",fontSize:"12px",fontWeight:600}}>{showCalc?"Close":"Open"}</div>
            </button>

            {showCalc && (
              <div style={{padding:"0 20px 20px"}}>
                <div style={{display:"flex",gap:"8px",marginBottom:"16px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",borderRadius:"12px",padding:"4px"}}>
                  {(["aggregate","jamb"] as const).map(t=>(
                    <button key={t} onClick={()=>{setCalcType(t);setAggResult(null);setCalcError("");}} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",backgroundColor:calcType===t?"#ea580c":"transparent",color:calcType===t?"#fff":subText,transition:"0.2s"}}>
                      {t==="aggregate"?"Aggregate":"JAMB Only"}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <input type="number" placeholder="JAMB Score (0-400)" value={jambScore} onChange={e=>setJambScore(e.target.value)} style={{width:"100%",padding:"14px",borderRadius:"12px",border:`1px solid ${borderC}`,background:darkMode?"#0a0a0a":"#fff",color:textColor}} />
                  {calcType==="aggregate" && <input type="number" placeholder="Post-UTME (0-100)" value={postUtme} onChange={e=>setPostUtme(e.target.value)} style={{width:"100%",padding:"14px",borderRadius:"12px",border:`1px solid ${borderC}`,background:darkMode?"#0a0a0a":"#fff",color:textColor}} />}
                  <button onClick={calcAggregate} style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:"#ea580c",color:"#fff",fontWeight:"600",cursor:"pointer"}}>Calculate</button>
                  {calcError && <div style={{padding:"10px",color:"#ef4444",fontSize:"12px",textAlign:"center"}}>{calcError}</div>}
                  {aggResult && (
                     <div style={{padding:"16px",borderRadius:"16px",background:darkMode?"#2c2c2e":"#fff5f0",textAlign:"center",border:`1px solid ${aggResult.color}`}}>
                        <div style={{fontSize:"32px",fontWeight:800,color:aggResult.color}}>{aggResult.aggregate}</div>
                        <div style={{fontSize:"13px",fontWeight:600}}>{aggResult.grade}</div>
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* News Feed */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
               <div style={{fontSize:"12px",fontWeight:"700",color:subText,letterSpacing:"0.5px",textTransform:"uppercase"}}>JAMB News</div>
               <button onClick={()=>fetchNews(true)} style={{background:"none",border:"none",color:"#ea580c",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>Refresh</button>
            </div>
            
            <div style={{display:"flex",gap:"8px",marginBottom:"16px",overflowX:"auto",scrollbarWidth:"none"}}>
              {CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>setActiveCategory(cat)} style={{padding:"8px 16px",borderRadius:"20px",border:activeCategory===cat?"none":`1px solid ${borderC}`,cursor:"pointer",fontSize:"12px",fontWeight:"600",backgroundColor:activeCategory===cat?"#ea580c":"transparent",color:activeCategory===cat?"#fff":subText}}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {newsLoading ? <div>Loading...</div> : (filteredNews.length ? filteredNews : news).map((item,i)=>(
                 <a key={i} href={item.url} style={{textDecoration:"none",color:"inherit",display:"block",padding:"16px",borderRadius:"20px",backgroundColor:cardBg,border:`1px solid ${borderC}`}}>
                    <div style={{fontSize:"11px",color:"#ea580c",fontWeight:700,marginBottom:"8px"}}>{item.source} · {item.time}</div>
                    <div style={{fontSize:"15px",fontWeight:600,lineHeight:1.4}}>{item.title}</div>
                 </a>
              ))}
            </div>
          </div>
        </div>

      </div>
      <InstallBanner />
    </div>
  );
}