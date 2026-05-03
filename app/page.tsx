"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import InstallBanner from "./components/InstallBanner";
import Link from "next/link";
import Navbar from "./components/Navbar";
import StreakCard from "./components/StreakCard";

interface NewsItem { title:string; url:string; source:string; time:string; summary?:string; image?:string; category?:string; }
interface User { name:string; email:string; target:string; institution:string; subjects:string[]; course:string; }
const CATEGORIES = ["All","Education","Exams","Admissions","Tech","General"];
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
];
const QUICK_LINKS = [
  {href:"/ai", icon:"🤖", label:"Ask AI", sub:"24/7 tutor", color:"#ea580c"},
  {href:"/subjects?mode=learn", icon:"📚", label:"Learn", sub:"Video lessons", color:"#3b82f6"},
  {href:"/subjects?mode=practice", icon:"✏️", label:"Practice", sub:"Past questions", color:"#8b5cf6"},
  {href:"/mock", icon:"📝", label:"Mock Exam", sub:"Timed test", color:"#f59e0b"},
  {href:"/solver", icon:"🧮", label:"Solver", sub:"AI explains", color:"#10b981"},
  {href:"/studyplan", icon:"📅", label:"Study Plan", sub:"AI generated", color:"#ec4899"},
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User|null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<"jamb"|"aggregate">("aggregate");
  const [jambScore, setJambScore] = useState("");
  const [postUtme, setPostUtme] = useState("");
  const [aggResult, setAggResult] = useState<null|{aggregate:number;jamb:number;post:number;grade:string;color:string}>(null);
  const [calcError, setCalcError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [pressedCard, setPressedCard] = useState<number|null>(null);
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
      const res = await fetch("/api/news");
      const data = await res.json();
      const enriched = (data.news || getFallback()).map((item:NewsItem, i:number) => ({
        ...item,
        image: MOCK_IMAGES[i % MOCK_IMAGES.length],
        summary: "Tap to read the full story.",
        category: assignCategory(item.title),
      }));
      setNews(enriched);
    } catch {
      setNews(getFallback().map((item,i) => ({...item, image:MOCK_IMAGES[i%MOCK_IMAGES.length], summary:"Tap to read.", category:assignCategory(item.title)})));
    } finally { setNewsLoading(false); setRefreshing(false); }
  }, []);
  const assignCategory = (t:string) => {
    const l = t.toLowerCase();
    if (/exam|utme|waec|neco|result/.test(l)) return "Exams";
    if (/admission|cutoff|screening|post-utme/.test(l)) return "Admissions";
    if (/tech|ai|digital|online/.test(l)) return "Tech";
    if (/university|polytechnic|college|school/.test(l)) return "Education";
    return "General";
  };
  const getFallback = (): NewsItem[] => [
    {title:"JAMB 2025 UTME Registration Portal Now Open", url:"https://www.jamb.gov.ng", source:"JAMB Official", time:"2h ago"},
    {title:"JAMB Releases Updated Syllabus for 2025 UTME", url:"https://www.jamb.gov.ng", source:"JAMB Official", time:"5h ago"},
    {title:"UNILAG Post-UTME Screening 2025: Dates Released", url:"#", source:"UNILAG Info", time:"1d ago"},
    {title:"How to Score 300+ in JAMB: Expert Tips", url:"#", source:"Education Guide", time:"1d ago"},
    {title:"CBT Centres: Approved JAMB Centres 2025", url:"#", source:"JAMB Guide", time:"2d ago"},
    {title:"OAU Cut-Off Marks for All Courses 2025", url:"#", source:"University News", time:"3d ago"},
  ];
  const calcAggregate = () => {
    setCalcError(""); setAggResult(null);
    const j = parseFloat(jambScore), p = parseFloat(postUtme);
    if (isNaN(j)||j<0||j>400) { setCalcError("Enter valid JAMB score (0-400)"); return; }
    if (calcType === "aggregate") {
      if (isNaN(p)||p<0||p>100) { setCalcError("Enter valid Post-UTME score (0-100)"); return; }
      const jP=j/8, pP=p/2, agg=jP+pP;
      const grade = agg>=70?"Excellent":agg>=55?"Good":agg>=45?"Average":"Below average";
      const color = agg>=70?"#16a34a":agg>=55?"#2563eb":agg>=45?"#d97706":"#dc2626";
      setAggResult({aggregate:parseFloat(agg.toFixed(2)), jamb:parseFloat(jP.toFixed(2)), post:parseFloat(pP.toFixed(2)), grade, color});
    } else {
      const scaled = (j/400)*100;
      const grade = j>=300?"Excellent":j>=250?"Good":j>=200?"Average":"Below average";
      const color = j>=300?"#16a34a":j>=250?"#2563eb":j>=200?"#d97706":"#dc2626";
      setAggResult({aggregate:parseFloat(scaled.toFixed(1)), jamb:j, post:0, grade, color});
    }
  const toggleDark = () => { const d=!darkMode; setDarkMode(d); localStorage.setItem("darkMode",String(d)); };
  const filteredNews = activeCategory==="All" ? news : news.filter(n=>n.category===activeCategory);
  if (!authChecked) return null;
  const bg = darkMode ? "#0a0a0a" : "#f2f2f7";
  const cardBg = darkMode ? "#1c1c1e" : "#ffffff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const inputSt: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"12px",
    border:`1.5px solid ${borderC}`, fontSize:"15px", outline:"none",
    backgroundColor: darkMode?"#2c2c2e":"#f2f2f7", color:textColor, boxSizing:"border-box"
  return (
    <div style={{minHeight:"100vh", backgroundColor:bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* HEADER */}
      <div style={{background:"linear-gradient(160deg,#431407,#7c2d12,#c2410c,#ea580c)", padding:"16px 16px 20px", position:"relative", overflow:"hidden"}}>
        <div style={{position:"absolute", top:"-50px", right:"-50px", width:"150px", height:"150px", borderRadius:"50%", background:"rgba(255,255,255,0.05)"}} />
        <Navbar darkMode={darkMode} onToggleDark={toggleDark} />
        <div style={{marginTop:"4px"}}>
          <div style={{color:"rgba(255,255,255,0.7)", fontSize:"13px"}}>
            {getGreeting()}, {user?.name.split(" ")[0]} 👋
          </div>
          <div style={{color:"rgba(255,255,255,0.75)", fontSize:"13px", marginTop:"3px"}}>
            Target: <span style={{color:"#fde68a", fontWeight:"700"}}>{user?.target} pts</span>
            {user?.institution ? " · " + user.institution : ""}
        </div>
      </div>
      {/* BODY */}
      <div style={{padding:"16px 16px 40px", display:"flex", flexDirection:"column", gap:"16px"}}>
        {/* Quick links grid */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px"}}>
          {QUICK_LINKS.map((c,i) => (
            <Link key={i} href={c.href} style={{textDecoration:"none"}}>
              <div style={{backgroundColor:cardBg, borderRadius:"16px", padding:"14px 10px", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", textAlign:"center", border:`1px solid ${borderC}`}}>
                <div style={{width:"42px", height:"42px", borderRadius:"12px", backgroundColor:`${c.color}18`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px", fontSize:"20px"}}>{c.icon}</div>
                <div style={{fontWeight:"700", color:c.color, fontSize:"13px", lineHeight:"1.2"}}>{c.label}</div>
                <div style={{fontSize:"10px", color:subText, marginTop:"3px"}}>{c.sub}</div>
              </div>
            </Link>
          ))}
        {/* Streak */}
        <StreakCard darkMode={darkMode} />
        {/* Calculator */}
        <div style={{backgroundColor:cardBg, borderRadius:"18px", overflow:"hidden", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
          <button onClick={()=>{setShowCalc(!showCalc); setAggResult(null); setCalcError("");}} style={{width:"100%", padding:"16px 18px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
              <div style={{width:"38px", height:"38px", borderRadius:"11px", backgroundColor:"#f59e0b18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px"}}>🧮</div>
              <div style={{textAlign:"left"}}>
                <div style={{fontWeight:"700", color:textColor, fontSize:"14px"}}>Score Calculator</div>
                <div style={{fontSize:"11px", color:subText}}>JAMB and Aggregate formula</div>
            </div>
            <div style={{fontSize:"12px", color:"#ea580c", fontWeight:"700"}}>{showCalc?"▲":"▼"}</div>
          </button>
          {showCalc && (
            <div style={{padding:"0 18px 18px", borderTop:`1px solid ${borderC}`}}>
              <div style={{display:"flex", gap:"6px", margin:"14px 0", backgroundColor:darkMode?"#2c2c2e":"#f2f2f7", borderRadius:"12px", padding:"4px"}}>
                {(["aggregate","jamb"] as const).map(t => (
                  <button key={t} onClick={()=>{setCalcType(t); setAggResult(null); setCalcError("");}} style={{flex:1, padding:"9px", borderRadius:"9px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"700", backgroundColor:calcType===t?"#ea580c":"transparent", color:calcType===t?"#fff":subText, transition:"all 0.2s"}}>
                    {t==="aggregate"?"Aggregate":"JAMB Only"}
                  </button>
                ))}
              <div style={{display:"flex", flexDirection:"column", gap:"12px"}}>
                <div>
                  <label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"6px", fontWeight:"600"}}>JAMB Score (0-400)</label>
                  <input type="number" min="0" max="400" placeholder="e.g. 285" value={jambScore} onChange={e=>setJambScore(e.target.value)} style={inputSt} />
                </div>
                {calcType==="aggregate" && (
                  <div>
                    <label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"6px", fontWeight:"600"}}>Post-UTME Score (0-100)</label>
                    <input type="number" min="0" max="100" placeholder="e.g. 72" value={postUtme} onChange={e=>setPostUtme(e.target.value)} style={inputSt} />
                    <div style={{fontSize:"11px", color:"#ea580c", marginTop:"5px", fontWeight:"600"}}>Formula: (JAMB / 8) + (Post-UTME / 2)</div>
                  </div>
                )}
                {calcError && <div style={{padding:"10px 14px", backgroundColor:darkMode?"#2a0000":"#fff0f0", borderRadius:"10px", color:"#ef4444", fontSize:"13px"}}>Warning: {calcError}</div>}
                <button onClick={calcAggregate} style={{padding:"13px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer"}}>
                  Calculate
                </button>
                {aggResult && (
                  <div style={{padding:"16px", borderRadius:"14px", backgroundColor:darkMode?"#0a1a0a":"#f0fdf4", border:`1.5px solid ${aggResult.color}33`}}>
                    <div style={{textAlign:"center", marginBottom:"12px"}}>
                      <div style={{fontSize:"40px", fontWeight:"900", color:aggResult.color}}>{aggResult.aggregate}</div>
                      <div style={{fontSize:"13px", color:aggResult.color, fontWeight:"700", marginTop:"3px"}}>{aggResult.grade}</div>
                    </div>
                    {calcType==="aggregate" && (
                      <div style={{display:"flex", flexDirection:"column", gap:"6px"}}>
                        {[
                          {label:"JAMB contribution", val:jambScore+" / 8 = "+aggResult.jamb},
                          {label:"Post-UTME contribution", val:postUtme+" / 2 = "+aggResult.post},
                          {label:"Total Aggregate", val:aggResult.aggregate+"/100"},
                        ].map((r,i) => (
                          <div key={i} style={{display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"7px 0", borderBottom:i<2?`1px solid ${borderC}`:"none"}}>
                            <span style={{color:subText}}>{r.label}</span>
                            <span style={{color:textColor, fontWeight:"700"}}>{r.val}</span>
                          </div>
                        ))}
                      </div>
                    )}
          )}
        {/* News Feed */}
          <div style={{padding:"16px 18px 0"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px"}}>
              <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <div style={{width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"#ef444418", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px"}}>📰</div>
                  <div style={{fontWeight:"800", color:textColor, fontSize:"15px"}}>JAMB News</div>
                  <div style={{fontSize:"11px", color:"#22c55e", display:"flex", alignItems:"center", gap:"4px"}}>
                    <span style={{width:"5px", height:"5px", borderRadius:"50%", backgroundColor:"#22c55e", display:"inline-block"}}></span>
                    Live updates
              <button onClick={()=>fetchNews(true)} style={{width:"30px", height:"30px", borderRadius:"8px", backgroundColor:darkMode?"#2c2c2e":"#f2f2f7", border:"none", cursor:"pointer", fontSize:"14px", transition:"transform 0.3s", transform:refreshing?"rotate(180deg)":"rotate(0)"}}>
                🔄
              </button>
            <div style={{display:"flex", gap:"6px", overflowX:"auto", paddingBottom:"12px", scrollbarWidth:"none"}}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={()=>setActiveCategory(cat)} style={{flexShrink:0, padding:"6px 14px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:"600", backgroundColor:activeCategory===cat?"#ea580c":darkMode?"#2c2c2e":"#f2f2f7", color:activeCategory===cat?"#fff":subText, transition:"all 0.2s", whiteSpace:"nowrap"}}>
                  {cat}
              ))}
          {newsLoading ? (
            <div style={{padding:"24px 18px", display:"flex", flexDirection:"column", gap:"14px"}}>
              {[1,2,3].map(i => (
                <div key={i} style={{display:"flex", gap:"12px"}}>
                  <div style={{flex:1}}>
                    <div style={{height:"13px", borderRadius:"6px", backgroundColor:darkMode?"#2c2c2e":"#f2f2f7", marginBottom:"8px", width:"90%"}} />
                    <div style={{height:"11px", borderRadius:"5px", backgroundColor:darkMode?"#2c2c2e":"#f2f2f7", width:"55%"}} />
                  <div style={{width:"68px", height:"68px", borderRadius:"12px", backgroundColor:darkMode?"#2c2c2e":"#f2f2f7", flexShrink:0}} />
          ) : (
            <div>
              {(filteredNews.length ? filteredNews : news).map((item,i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none", display:"block"}}
                  onMouseDown={()=>setPressedCard(i)} onMouseUp={()=>setPressedCard(null)}
                  onTouchStart={()=>setPressedCard(i)} onTouchEnd={()=>setPressedCard(null)}>
                  <div style={{padding:"14px 18px", borderTop:i===0?"none":`1px solid ${borderC}`, display:"flex", gap:"12px", alignItems:"flex-start", backgroundColor:pressedCard===i?(darkMode?"#2c2c2e":"#f5f5f7"):"transparent", transition:"background 0.1s"}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:"11px", color:"#ea580c", fontWeight:"700", marginBottom:"4px"}}>
                        {item.source} · <span style={{color:subText, fontWeight:"500"}}>{item.time}</span>
                      <div style={{fontSize:"13px", color:textColor, fontWeight:"700", lineHeight:"1.45", marginBottom:"6px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{item.title}</div>
                      <span style={{fontSize:"10px", color:subText, backgroundColor:darkMode?"#2c2c2e":"#f2f2f7", padding:"2px 7px", borderRadius:"5px"}}>{item.category}</span>
                    {item.image && (
                      <div style={{width:"72px", height:"72px", borderRadius:"12px", overflow:"hidden", flexShrink:0}}>
                        <img src={item.image} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
                </a>
              <div style={{padding:"14px 18px", borderTop:`1px solid ${borderC}`, textAlign:"center"}}>
                <button onClick={()=>fetchNews(true)} style={{background:"none", border:"none", color:"#ea580c", fontSize:"13px", fontWeight:"700", cursor:"pointer"}}>
                  {refreshing ? "Refreshing..." : "Refresh news"}
      <style>{`*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
