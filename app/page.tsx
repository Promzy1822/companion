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

const CATEGORIES = ["All","Education","Exams","Admissions","Tech","General"];
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
];

const QUICK_LINKS = [
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
  return [
    {title:"JAMB 2025 UTME Registration Portal Now Open — Apply Before Deadline",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"2h ago"},
    {title:"JAMB Releases Updated Syllabus for 2025 UTME Examination",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"5h ago"},
    {title:"UNILAG Post-UTME Screening 2025: Dates and Requirements",url:"#",source:"UNILAG Info",time:"1d ago"},
    {title:"How to Score 300+ in JAMB: Proven Study Strategies",url:"#",source:"Education Guide",time:"1d ago"},
    {title:"CBT Centres: Full List of Approved JAMB Centres 2025",url:"#",source:"JAMB Guide",time:"2d ago"},
    {title:"OAU Cut-Off Marks for All Courses 2025 Released",url:"#",source:"University News",time:"3d ago"},
  ];
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
  }, []);

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

  const bg = darkMode ? "#0a0a0a" : "#f0f0f5";
  const cardBg = darkMode ? "#1c1c1e" : "#ffffff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const inputSt: React.CSSProperties = {
    width:"100%",padding:"13px 16px",borderRadius:"12px",
    border:`1.5px solid ${borderC}`,fontSize:"15px",outline:"none",
    backgroundColor:darkMode?"#2c2c2e":"#f5f5f7",color:textColor,boxSizing:"border-box"
  };

  return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* HEADER — with depth */}
      <div style={{background:"linear-gradient(160deg,#3b0d02,#7c2d12,#c2410c,#ea580c,#fb923c)",padding:"20px 16px 28px",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(194,65,12,0.4)"}}>
        {/* Decorative circles */}
        <div style={{position:"absolute",top:"-60px",right:"-60px",width:"220px",height:"220px",borderRadius:"50%",background:"rgba(255,255,255,0.06)"}} />
        <div style={{position:"absolute",bottom:"-40px",left:"-40px",width:"160px",height:"160px",borderRadius:"50%",background:"rgba(255,255,255,0.04)"}} />
        <div style={{position:"absolute",top:"20px",left:"50%",transform:"translateX(-50%)",width:"80px",height:"80px",borderRadius:"50%",background:"rgba(255,255,255,0.03)"}} />
        <Navbar darkMode={darkMode} onToggleDark={toggleDark} />
        <div style={{position:"relative"}}>
          <div style={{color:"rgba(255,255,255,0.65)",fontSize:"13px",marginBottom:"4px"}}>
            {getGreeting()}, {user?.name.split(" ")[0]} 👋
          </div>
          <div style={{color:"rgba(255,255,255,0.8)",fontSize:"13px",marginTop:"2px"}}>
            {"Target: "}<span style={{color:"#fde68a",fontWeight:"800"}}>{user?.target}{" pts"}</span>
            {user?.institution ? " · "+user.institution : ""}
          </div>
        </div>
      </div>

      <div style={{padding:"20px 16px 80px",display:"flex",flexDirection:"column",gap:"20px"}}>

        {/* Quick links — 3D card effect */}
        <div>
          <div style={{fontSize:"11px",fontWeight:"700",color:subText,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"12px"}}>Quick Access</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
            {QUICK_LINKS.map((c,i) => (
              <Link key={i} href={c.href} style={{textDecoration:"none"}}
                onMouseEnter={()=>setHoveredLink(i)} onMouseLeave={()=>setHoveredLink(null)}
                onTouchStart={()=>setHoveredLink(i)} onTouchEnd={()=>setHoveredLink(null)}>
                <div style={{
                  backgroundColor:cardBg, borderRadius:"18px", padding:"16px 10px",
                  textAlign:"center", border:`1px solid ${borderC}`,
                  boxShadow: hoveredLink===i
                    ? `0 8px 24px ${c.shadow}, 0 2px 8px rgba(0,0,0,0.08)`
                    : darkMode
                    ? "0 2px 8px rgba(0,0,0,0.4)"
                    : `0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`,
                  transform: hoveredLink===i ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
                  transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                  <div style={{
                    width:"44px",height:"44px",borderRadius:"14px",
                    background:`linear-gradient(135deg,${c.color}22,${c.color}44)`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    margin:"0 auto 10px",fontSize:"22px",
                    boxShadow:`0 4px 12px ${c.shadow}`,
                  }}>{c.icon}</div>
                  <div style={{fontWeight:"800",color:c.color,fontSize:"13px",lineHeight:"1.2"}}>{c.label}</div>
                  <div style={{fontSize:"10px",color:subText,marginTop:"3px"}}>{c.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Today study task */}
        <TodayStudyBanner darkMode={darkMode} />

        {/* Streak section */}
        <div>
          <div style={{fontSize:"11px",fontWeight:"700",color:subText,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"12px"}}>Your Progress</div>
          <StreakCard darkMode={darkMode} />
        </div>

        {/* Calculator */}
        <div>
          <div style={{fontSize:"11px",fontWeight:"700",color:subText,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"12px"}}>Tools</div>
          <div style={{backgroundColor:cardBg,borderRadius:"20px",overflow:"hidden",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",border:`1px solid ${borderC}`}}>
            <button onClick={()=>{setShowCalc(!showCalc);setAggResult(null);setCalcError("");}} style={{width:"100%",padding:"18px 20px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                <div style={{width:"44px",height:"44px",borderRadius:"14px",background:"linear-gradient(135deg,#f59e0b22,#f59e0b44)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",boxShadow:"0 4px 12px rgba(245,158,11,0.2)"}}>🧮</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:"800",color:textColor,fontSize:"15px"}}>Score Calculator</div>
                  <div style={{fontSize:"12px",color:subText}}>JAMB and Aggregate formula</div>
                </div>
              </div>
              <div style={{width:"28px",height:"28px",borderRadius:"8px",backgroundColor:showCalc?"#ea580c":darkMode?"#2c2c2e":"#f2f2f7",display:"flex",alignItems:"center",justifyContent:"center",color:showCalc?"#fff":"#ea580c",fontSize:"11px",fontWeight:"700",transition:"all 0.2s"}}>
                {showCalc?"▲":"▼"}
              </div>
            </button>

            {showCalc && (
              <div style={{padding:"0 20px 20px",borderTop:`1px solid ${borderC}`}}>
                <div style={{display:"flex",gap:"6px",margin:"16px 0",backgroundColor:darkMode?"#2c2c2e":"#f2f2f7",borderRadius:"12px",padding:"4px"}}>
                  {(["aggregate","jamb"] as const).map(t=>(
                    <button key={t} onClick={()=>{setCalcType(t);setAggResult(null);setCalcError("");}} style={{flex:1,padding:"10px",borderRadius:"9px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"700",backgroundColor:calcType===t?"#ea580c":"transparent",color:calcType===t?"#fff":subText,transition:"all 0.2s"}}>
                      {t==="aggregate"?"Aggregate":"JAMB Only"}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <div>
                    <label style={{fontSize:"12px",color:subText,display:"block",marginBottom:"7px",fontWeight:"600"}}>JAMB Score (0-400)</label>
                    <input type="number" min="0" max="400" placeholder="e.g. 285" value={jambScore} onChange={e=>setJambScore(e.target.value)} style={inputSt} />
                  </div>
                  {calcType==="aggregate" && (
                    <div>
                      <label style={{fontSize:"12px",color:subText,display:"block",marginBottom:"7px",fontWeight:"600"}}>Post-UTME Score (0-100)</label>
                      <input type="number" min="0" max="100" placeholder="e.g. 72" value={postUtme} onChange={e=>setPostUtme(e.target.value)} style={inputSt} />
                      <div style={{fontSize:"11px",color:"#ea580c",marginTop:"5px",fontWeight:"600"}}>Formula: (JAMB / 8) + (Post-UTME / 2)</div>
                    </div>
                  )}
                  {calcError && <div style={{padding:"10px 14px",backgroundColor:darkMode?"#2a0000":"#fff0f0",borderRadius:"10px",color:"#ef4444",fontSize:"13px"}}>{calcError}</div>}
                  <button onClick={calcAggregate} style={{padding:"14px",borderRadius:"14px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"15px",cursor:"pointer",boxShadow:"0 4px 16px rgba(234,88,12,0.35)"}}>
                    Calculate →
                  </button>
                  {aggResult && (
                    <div style={{padding:"18px",borderRadius:"16px",backgroundColor:darkMode?"#0a1a0a":"#f0fdf4",border:`1.5px solid ${aggResult.color}44`,boxShadow:`0 4px 16px ${aggResult.color}18`}}>
                      <div style={{textAlign:"center",marginBottom:"14px"}}>
                        <div style={{fontSize:"44px",fontWeight:"900",color:aggResult.color,letterSpacing:"-2px"}}>{aggResult.aggregate}</div>
                        <div style={{fontSize:"14px",color:aggResult.color,fontWeight:"700",marginTop:"4px"}}>{aggResult.grade}</div>
                      </div>
                      {calcType==="aggregate" && (
                        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                          {[
                            {label:"JAMB contribution",val:`${jambScore} ÷ 8 = ${aggResult.jamb}`},
                            {label:"Post-UTME contribution",val:`${postUtme} ÷ 2 = ${aggResult.post}`},
                            {label:"Total Aggregate",val:`${aggResult.aggregate}/100`},
                          ].map((r,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",padding:"8px 0",borderBottom:i<2?`1px solid ${borderC}`:"none"}}>
                              <span style={{color:subText}}>{r.label}</span>
                              <span style={{color:textColor,fontWeight:"700"}}>{r.val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* News Feed — premium */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <div style={{fontSize:"11px",fontWeight:"700",color:subText,letterSpacing:"1px",textTransform:"uppercase"}}>JAMB News</div>
            {/* Aesthetic refresh button */}
            <button onClick={()=>fetchNews(true)} disabled={refreshing} style={{display:"flex",alignItems:"center",gap:"6px",padding:"7px 14px",borderRadius:"20px",border:"none",background:refreshing?"linear-gradient(135deg,#2c2c2e,#3a3a3c)":"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontSize:"12px",fontWeight:"700",cursor:refreshing?"not-allowed":"pointer",boxShadow:refreshing?"none":"0 3px 10px rgba(234,88,12,0.3)",transition:"all 0.3s"}}>
              <span style={{display:"inline-block",animation:refreshing?"spin 0.8s linear infinite":"none",fontSize:"13px"}}>🔄</span>
              <span>{refreshing?"Updating...":"Refresh"}</span>
            </button>
          </div>

          <div style={{backgroundColor:cardBg,borderRadius:"20px",overflow:"hidden",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.4)":"0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",border:`1px solid ${borderC}`}}>
            {/* Live indicator */}
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${borderC}`,display:"flex",alignItems:"center",gap:"10px",background:darkMode?"linear-gradient(135deg,#1c1c1e,#2a1810)":"linear-gradient(135deg,#fff8f5,#fff)"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",backgroundColor:"#22c55e",boxShadow:"0 0 0 3px rgba(34,197,94,0.2)",animation:"pulse 2s infinite"}} />
              <span style={{fontSize:"13px",fontWeight:"700",color:textColor}}>Live JAMB Updates</span>
              <span style={{marginLeft:"auto",fontSize:"11px",color:subText}}>{news.length} stories</span>
            </div>

            {/* Category chips */}
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${borderC}`,display:"flex",gap:"6px",overflowX:"auto",scrollbarWidth:"none"}}>
              {CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>setActiveCategory(cat)} style={{flexShrink:0,padding:"6px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"600",backgroundColor:activeCategory===cat?"#ea580c":darkMode?"#2c2c2e":"#f2f2f7",color:activeCategory===cat?"#fff":subText,transition:"all 0.2s",boxShadow:activeCategory===cat?"0 3px 10px rgba(234,88,12,0.3)":"none"}}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Refresh loading bar */}
            {refreshing && (
              <div style={{height:"3px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",overflow:"hidden"}}>
                <div style={{height:"100%",width:"40%",background:"linear-gradient(90deg,transparent,#ea580c,transparent)",animation:"shimmer 1s infinite"}} />
              </div>
            )}

            {newsLoading ? (
              <div style={{padding:"20px 18px",display:"flex",flexDirection:"column",gap:"16px"}}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{display:"flex",gap:"12px",animation:"shimmerFade 1.5s infinite"}}>
                    <div style={{flex:1}}>
                      <div style={{height:"14px",borderRadius:"7px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",marginBottom:"8px",width:"90%"}} />
                      <div style={{height:"12px",borderRadius:"6px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",width:"55%"}} />
                    </div>
                    <div style={{width:"72px",height:"72px",borderRadius:"12px",backgroundColor:darkMode?"#2c2c2e":"#f0f0f0",flexShrink:0}} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {(filteredNews.length ? filteredNews : news).map((item,i)=>(
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block"}}
                    onMouseDown={()=>setPressedCard(i)} onMouseUp={()=>setPressedCard(null)}
                    onTouchStart={()=>setPressedCard(i)} onTouchEnd={()=>setPressedCard(null)}>
                    <div style={{padding:"14px 18px",borderTop:i===0?"none":`1px solid ${borderC}`,display:"flex",gap:"12px",alignItems:"flex-start",backgroundColor:pressedCard===i?(darkMode?"#2c2c2e":"#f5f5f7"):"transparent",transition:"background 0.1s"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:"11px",color:"#ea580c",fontWeight:"700",marginBottom:"4px",display:"flex",alignItems:"center",gap:"5px"}}>
                          <span style={{width:"5px",height:"5px",borderRadius:"50%",backgroundColor:"#ea580c",display:"inline-block",flexShrink:0}} />
                          {item.source}
                          <span style={{color:borderC}}>·</span>
                          <span style={{color:subText,fontWeight:"500"}}>{item.time}</span>
                        </div>
                        <div style={{fontSize:"14px",color:textColor,fontWeight:"700",lineHeight:"1.45",marginBottom:"8px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.title}</div>
                        <span style={{fontSize:"10px",color:subText,backgroundColor:darkMode?"#2c2c2e":"#f2f2f7",padding:"3px 8px",borderRadius:"6px",fontWeight:"600"}}>{item.category}</span>
                      </div>
                      {item.image && (
                        <div style={{width:"76px",height:"76px",borderRadius:"14px",overflow:"hidden",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
                          <img src={item.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
                        </div>
                      )}
                    </div>
                  </a>
                ))}
                <div style={{padding:"14px 18px",borderTop:`1px solid ${borderC}`,textAlign:"center",background:darkMode?"linear-gradient(135deg,#1c1c1e,#2a1810)":"linear-gradient(135deg,#fff8f5,#fff)"}}>
                  <button onClick={()=>fetchNews(true)} style={{background:"none",border:"none",color:"#ea580c",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>
                    {refreshing ? "Updating..." : "Load fresh news →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InstallBanner />
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
