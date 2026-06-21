"use client";
import { useState, useEffect } from "react";
import AppLoader, { PageSkeleton } from "./components/AppLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar, { NAVBAR_HEIGHT } from "./components/Navbar";
import { useNews } from "./lib/useNews";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "./components/BottomNav";
import QuickLinks from "./components/QuickLinks";
import StreakCard from "./components/StreakCard";
import CountdownBanner from "./components/CountdownBanner";
import { Session } from "./lib/session";
import { C, D, palette } from "./lib/design";
import { RefreshCw, Calculator, Newspaper, ChevronDown, ChevronUp } from "lucide-react";

interface NewsItem { title:string; url:string; source:string; time:string; image?:string; category?:string; }
interface User { name:string; email:string; target:string; institution:string; subjects:string[]; course:string; }

const CATS = ["All","Education","Exams","Admissions","Tech","General"];
const IMGS = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
];

const catOf = (t:string) => {
  const l = t.toLowerCase();
  if (/exam|utme|waec|neco|result/.test(l)) return "Exams";
  if (/admission|cutoff|screening/.test(l)) return "Admissions";
  if (/tech|ai|digital/.test(l)) return "Tech";
  if (/university|polytechnic|school/.test(l)) return "Education";
  return "General";
};

const FALLBACK: NewsItem[] = [
  {title:"JAMB 2025 UTME Registration Portal Now Open",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"2h ago"},
  {title:"JAMB Releases Updated Syllabus for 2025 UTME",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"5h ago"},
  {title:"UNILAG Post-UTME Screening 2025: Dates Released",url:"#",source:"UNILAG Info",time:"1d ago"},
  {title:"How to Score 300+ in JAMB: Expert Study Tips",url:"#",source:"Education Guide",time:"1d ago"},
  {title:"CBT Centres: Approved JAMB Centres 2025",url:"#",source:"JAMB Guide",time:"2d ago"},
  {title:"OAU Cut-Off Marks for All Courses 2025",url:"#",source:"University News",time:"3d ago"},
];

export default function Home() {
  const [darkMode,   setDarkMode]   = useState(false);
  const [user,       setUser]       = useState<User|null>(null);
  const {
    filtered:  news,
    loading:   newsLoad,
    refreshing,
    refresh:   fetchNews,
    setCategory: setNewsCategory,
    lastUpdated: newsLastUpdated,
  } = useNews();
  const [cat,      setCat]      = useState("All");
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<"jamb"|"aggregate">("aggregate");
  const [jambS,    setJambS]    = useState("");
  const [postS,    setPostS]    = useState("");
  const [result,   setResult]   = useState<{agg:number;jamb:number;post:number;grade:string;color:string}|null>(null);
  const [calcErr,  setCalcErr]  = useState("");
  const [pressed,  setPressed]  = useState<number|null>(null);
  const [ready,    setReady]    = useState(false);
  const router = useRouter();
  const T = palette(darkMode);

  useEffect(() => {
    Session.sync();
    const dm = localStorage.getItem("darkMode") === "true";
    setDarkMode(dm);
    document.documentElement.setAttribute("data-dark", String(dm));
    const u = localStorage.getItem("companion_user");
    if (!u) { router.replace("/landing"); return; }
    setUser(JSON.parse(u));
    setReady(true);
    fetchNews();
  }, [router]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.setAttribute("data-dark", String(next));
  };

  const calcAggregate = () => {
    setCalcErr(""); setResult(null);
    const j = parseFloat(jambS), p = parseFloat(postS);
    if (isNaN(j)||j<0||j>400) { setCalcErr("Enter valid JAMB score (0-400)"); return; }
    if (calcType==="aggregate") {
      if (isNaN(p)||p<0||p>100) { setCalcErr("Enter valid Post-UTME score (0-100)"); return; }
      const jP=j/8, pP=p/2, agg=jP+pP;
      const grade=agg>=70?"Excellent":agg>=55?"Good":agg>=45?"Average":"Below average";
      const color=agg>=70?"#31A24C":agg>=55?C.primary:agg>=45?"#F7B928":"#FA3E3E";
      setResult({agg:+agg.toFixed(2),jamb:+jP.toFixed(2),post:+pP.toFixed(2),grade,color});
    } else {
      const sc=(j/400)*100;
      const grade=j>=300?"Excellent":j>=250?"Good":j>=200?"Average":"Below average";
      const color=j>=300?"#31A24C":j>=250?C.primary:j>=200?"#F7B928":"#FA3E3E";
      setResult({agg:+sc.toFixed(1),jamb:j,post:0,grade,color});
    }
  };

  if (!ready) return null;

  const filteredNews = cat === "All" ? news : news.filter(n=>n.category===cat);

  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:"10px",
    border:"1.5px solid "+T.border, fontSize:"14px", outline:"none",
    background:T.s2, color:T.text, boxSizing:"border-box", fontFamily:"inherit",
    transition:"border-color 0.15s",
  };

  const hour = new Date().getHours();
  const greeting = hour<12 ? "Good morning" : hour<17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <Navbar darkMode={darkMode} onToggleDark={toggleDark} />
      <div style={{
        minHeight:"100vh", background:T.bg,
        paddingTop:NAVBAR_HEIGHT+"px",
        fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}>
        {/* Hero header */}
        <div style={{
          background: darkMode
            ? "linear-gradient(135deg,#1A2A4A,#1877F2)"
            : "linear-gradient(135deg,#1877F2,#0C5FD1)",
          padding: "24px 20px 32px",
        }}>
          <div style={{ color:"rgba(255,255,255,0.8)", fontSize:"13px", marginBottom:"4px" }}>
            {greeting} 👋
          </div>
          <div style={{ color:"#fff", fontSize:"22px", fontWeight:800, letterSpacing:"-0.4px" }}>
            {user?.name.split(" ")[0]}
          </div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", marginTop:"4px" }}>
            Target <span style={{ color:"#FFF8DB", fontWeight:700 }}>{user?.target} pts</span>
            {user?.institution ? " · "+user.institution : ""}
          </div>
        </div>

        <div style={{ padding:"0 14px", marginTop:"-16px", paddingBottom:"calc("+BOTTOM_NAV_HEIGHT+"px + 16px)" }}>

          {/* Countdown banner — shows only if user set an exam date */}
          <CountdownBanner darkMode={darkMode} />

          {/* AI CTA */}
          <Link href="/ai" style={{ textDecoration:"none", display:"block", marginBottom:"14px" }}>
            <div style={{
              background:"linear-gradient(135deg,#1877F2,#166FE5)",
              borderRadius:"16px", padding:"18px 20px",
              display:"flex", alignItems:"center", gap:"14px",
              boxShadow:"0 6px 20px rgba(24,119,242,0.35)",
              position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", top:"-20px", right:"-20px", width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.1)" }} />
              <div style={{ width:48, height:48, borderRadius:"14px", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 }}>
                🤖
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#fff", fontWeight:800, fontSize:"16px", letterSpacing:"-0.2px" }}>Ask AI Anything</div>
                <div style={{ color:"rgba(255,255,255,0.8)", fontSize:"12px", marginTop:"2px" }}>Your 24/7 JAMB tutor is ready</div>
              </div>
              <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"20px" }}>→</div>
            </div>
          </Link>

          {/* Streak */}
          <div style={{ marginBottom:"14px" }}>
            <StreakCard darkMode={darkMode} />
          </div>

          {/* Quick links */}
          <div style={{ marginBottom:"14px" }}>
            <QuickLinks darkMode={darkMode} />
          </div>

          {/* Calculator */}
          <div style={{
            background:T.surface, borderRadius:"16px",
            border:"1px solid "+T.border,
            boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
            marginBottom:"14px", overflow:"hidden",
          }}>
            <button onClick={()=>setShowCalc(v=>!v)} style={{
              width:"100%", padding:"16px 18px", border:"none", background:"transparent",
              display:"flex", alignItems:"center", gap:"12px", cursor:"pointer",
            }}>
              <div style={{ width:36, height:36, borderRadius:"10px", background:"#FEF9E7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Calculator size={17} color="#B07D00" strokeWidth={1.8} />
              </div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:700, color:T.text, fontSize:"15px" }}>Score Calculator</div>
                <div style={{ fontSize:"12px", color:T.sub }}>JAMB and Aggregate formula</div>
              </div>
              {showCalc ? <ChevronUp size={18} color={T.sub} /> : <ChevronDown size={18} color={T.sub} />}
            </button>

            {showCalc && (
              <div style={{ padding:"0 18px 20px", borderTop:"1px solid "+T.border }}>
                <div style={{ display:"flex", gap:"8px", margin:"16px 0 14px" }}>
                  {(["aggregate","jamb"] as const).map(t=>(
                    <button key={t} onClick={()=>{setCalcType(t);setResult(null);}} style={{
                      flex:1, padding:"9px", borderRadius:"10px", border:"none",
                      background: calcType===t ? C.primary : T.s2,
                      color: calcType===t ? "#fff" : T.sub,
                      fontWeight:700, fontSize:"13px", cursor:"pointer",
                    }}>
                      {t==="aggregate" ? "Aggregate" : "JAMB Only"}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  <div>
                    <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>JAMB Score (0-400)</label>
                    <input style={inp} type="number" placeholder="e.g. 280" value={jambS} onChange={e=>setJambS(e.target.value)} />
                  </div>
                  {calcType==="aggregate" && (
                    <div>
                      <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Post-UTME Score (0-100)</label>
                      <input style={inp} type="number" placeholder="e.g. 65" value={postS} onChange={e=>setPostS(e.target.value)} />
                      <div style={{ fontSize:"11px", color:T.muted, marginTop:"5px" }}>Formula: (JAMB / 8) + (Post-UTME / 2)</div>
                    </div>
                  )}
                </div>
                {calcErr && <div style={{ color:"#FA3E3E", fontSize:"13px", marginTop:"10px" }}>{calcErr}</div>}
                <button onClick={calcAggregate} style={{
                  width:"100%", marginTop:"14px", padding:"13px", borderRadius:"10px", border:"none",
                  background:C.primary, color:"#fff", fontWeight:700, fontSize:"14px", cursor:"pointer",
                }}>
                  Calculate
                </button>
                {result && (
                  <div style={{
                    padding:"16px", borderRadius:"12px", marginTop:"12px",
                    background: darkMode ? T.s2 : "#F0F7FF",
                    border:"1.5px solid "+result.color+"33",
                  }}>
                    <div style={{ textAlign:"center", marginBottom:"12px" }}>
                      <div style={{ fontSize:"40px", fontWeight:900, color:result.color, letterSpacing:"-1px" }}>{result.agg}</div>
                      <div style={{ fontSize:"13px", color:result.color, fontWeight:700, marginTop:"3px" }}>{result.grade}</div>
                    </div>
                    {calcType==="aggregate" && (
                      <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                        {[
                          {label:"JAMB contribution",      val:jambS+" / 8 = "+result.jamb},
                          {label:"Post-UTME contribution",  val:postS+" / 2 = "+result.post},
                          {label:"Total Aggregate",         val:result.agg+"/100"},
                        ].map((r,i)=>(
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"7px 0", borderBottom:i<2?"1px solid "+T.border:"none" }}>
                            <span style={{ color:T.sub }}>{r.label}</span>
                            <span style={{ color:T.text, fontWeight:700 }}>{r.val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* News */}
          <div style={{
            background:T.surface, borderRadius:"16px",
            border:"1px solid "+T.border,
            boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
            overflow:"hidden",
          }}>
            <div style={{ padding:"16px 18px 0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ width:36, height:36, borderRadius:"10px", background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Newspaper size={17} color="#D0021B" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontWeight:700, color:T.text, fontSize:"15px" }}>JAMB News</div>
                    <div style={{ fontSize:"11px", color:"#31A24C", display:"flex", alignItems:"center", gap:"4px" }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:"#31A24C", animation:"pulse 2s infinite" }} />
                      Live updates
                    </div>
                  </div>
                </div>
                <button onClick={()=>fetchNews()} style={{
                  width:32, height:32, borderRadius:"8px", border:"none",
                  background:T.s2, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <RefreshCw size={15} color={T.sub} strokeWidth={2}
                    style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }}
                  />
                </button>
              </div>
              <div style={{ display:"flex", gap:"7px", overflowX:"auto", paddingBottom:"12px", scrollbarWidth:"none" }}>
                {CATS.map(c=>(
                  <button key={c} onClick={()=>setCat(c)} style={{
                    flexShrink:0, padding:"6px 14px", borderRadius:"50px", border:"none",
                    cursor:"pointer", fontSize:"12px", fontWeight:600,
                    background: cat===c ? C.primary : T.s2,
                    color: cat===c ? "#fff" : T.sub,
                    transition:"all 0.15s",
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {newsLoad ? (
              <div style={{ padding:"24px 18px", display:"flex", flexDirection:"column", gap:"14px" }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ display:"flex", gap:"12px" }}>
                    <div style={{ flex:1 }}>
                      <div className="skeleton" style={{ height:14, width:"90%", marginBottom:8 }} />
                      <div className="skeleton" style={{ height:12, width:"55%" }} />
                    </div>
                    <div className="skeleton" style={{ width:72, height:72, flexShrink:0, borderRadius:10 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {(filteredNews.length ? filteredNews : news).map((item,i)=>(
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration:"none", display:"block" }}
                    onMouseDown={()=>setPressed(i)} onMouseUp={()=>setPressed(null)}
                    onTouchStart={()=>setPressed(i)} onTouchEnd={()=>setPressed(null)}
                  >
                    <div style={{
                      padding:"14px 18px",
                      borderTop: i===0 ? "none" : "1px solid "+T.border,
                      display:"flex", gap:"12px", alignItems:"flex-start",
                      background: pressed===i ? T.s2 : "transparent",
                      transition:"background 0.1s",
                    }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"11px", color:C.primary, fontWeight:700, marginBottom:"5px", display:"flex", alignItems:"center", gap:"5px" }}>
                          <span>{item.source}</span>
                          <span style={{ color:T.border }}>·</span>
                          <span style={{ color:T.sub, fontWeight:500 }}>{item.time}</span>
                        </div>
                        <div style={{
                          fontSize:"13px", color:T.text, fontWeight:700, lineHeight:1.4, marginBottom:"6px",
                          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
                        }}>
                          {item.title}
                        </div>
                        <span style={{ fontSize:"11px", color:T.sub, background:T.s2, padding:"3px 8px", borderRadius:"6px" }}>
                          {item.category}
                        </span>
                      </div>
                      {item.image && (
                        <div style={{ width:72, height:72, borderRadius:"10px", overflow:"hidden", flexShrink:0 }}>
                          <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                            onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                        </div>
                      )}
                    </div>
                  </a>
                ))}
                <div style={{ padding:"14px 18px", borderTop:"1px solid "+T.border, textAlign:"center" }}>
                  <button onClick={()=>fetchNews()} style={{
                    background:"none", border:"none", color:C.primary, fontSize:"13px", fontWeight:700, cursor:"pointer",
                  }}>
                    {refreshing ? "Refreshing..." : "Refresh news"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <BottomNav darkMode={darkMode} />

        <style>{`
          @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          .skeleton { background: linear-gradient(90deg,#e0e0e0 25%,#f0f0f0 50%,#e0e0e0 75%); background-size:200% 100%; animation: shimmer 1.4s infinite; border-radius:6px; }
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        `}</style>
      </div>
    </>
  );
}
