"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "./components/Navbar";

interface NewsItem { title: string; url: string; source: string; time: string; }
interface User { name: string; email: string; target: string; institution: string; subjects: string[]; }

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<"jamb"|"aggregate">("aggregate");
  const [jambScore, setJambScore] = useState("");
  const [postUtme, setPostUtme] = useState("");
  const [aggResult, setAggResult] = useState<null|{aggregate:number; jamb:number; post:number; grade:string; color:string}>(null);
  const [calcError, setCalcError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
    const u = localStorage.getItem("companion_user");
    if (!u) {
      router.replace("/landing");
      return;
    }
    setUser(JSON.parse(u));
    setAuthChecked(true);
    fetchNews();
  }, [router]);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data.news || []);
    } catch {
      setNews(getFallbackNews());
    } finally {
      setNewsLoading(false);
    }
  };

  const getFallbackNews = (): NewsItem[] => [
    { title: "JAMB 2025 UTME Registration Portal Now Open — Apply Now", url: "https://www.jamb.gov.ng", source: "JAMB Official", time: "Today" },
    { title: "JAMB Releases Updated Syllabus for 2025 UTME Examination", url: "https://www.jamb.gov.ng", source: "JAMB Official", time: "2d ago" },
    { title: "How to Check Your JAMB Result and Download Scorecard", url: "https://www.jamb.gov.ng", source: "JAMB Guide", time: "3d ago" },
    { title: "Post-UTME 2025: Universities Begin Screening Exercise", url: "#", source: "Education News", time: "1w ago" },
    { title: "JAMB Cut-Off Marks for All Universities 2025", url: "#", source: "Universities NG", time: "1w ago" },
  ];

  const calcAggregate = () => {
    setCalcError("");
    setAggResult(null);
    const j = parseFloat(jambScore);
    const p = parseFloat(postUtme);
    if (isNaN(j) || j < 0 || j > 400) { setCalcError("Enter valid JAMB score (0–400)"); return; }
    if (calcType === "aggregate") {
      if (isNaN(p) || p < 0 || p > 100) { setCalcError("Enter valid Post-UTME score (0–100)"); return; }
      // Correct formula: JAMB/8 + PostUTME/2
      const jambPart = j / 8;
      const postPart = p / 2;
      const agg = jambPart + postPart;
      const grade = agg >= 70 ? "Excellent 🔥" : agg >= 55 ? "Good ✅" : agg >= 45 ? "Average ⚠️" : "Below average ❌";
      const color = agg >= 70 ? "#16a34a" : agg >= 55 ? "#2563eb" : agg >= 45 ? "#d97706" : "#dc2626";
      setAggResult({ aggregate: parseFloat(agg.toFixed(2)), jamb: parseFloat(jambPart.toFixed(2)), post: parseFloat(postPart.toFixed(2)), grade, color });
    } else {
      const scaled = (j / 400) * 100;
      const grade = j >= 300 ? "Excellent 🔥" : j >= 250 ? "Good ✅" : j >= 200 ? "Average ⚠️" : "Below average ❌";
      const color = j >= 300 ? "#16a34a" : j >= 250 ? "#2563eb" : j >= 200 ? "#d97706" : "#dc2626";
      setAggResult({ aggregate: parseFloat(scaled.toFixed(1)), jamb: j, post: 0, grade, color });
    }
  };

  const toggleDark = () => {
    const d = !darkMode;
    setDarkMode(d);
    localStorage.setItem("darkMode", String(d));
  };

  if (!authChecked) return null;

  const bg = darkMode ? "#0f0f0f" : "#fffbf5";
  const cardBg = darkMode ? "#1a1a1a" : "#ffffff";
  const textColor = darkMode ? "#f0f0f0" : "#1a1a1a";
  const subText = darkMode ? "#aaa" : "#666";
  const borderC = darkMode ? "#2a2a2a" : "#f0f0f0";
  const inputSt: React.CSSProperties = { width:"100%", padding:"12px 14px", borderRadius:"10px", border:`1.5px solid ${borderC}`, fontSize:"14px", outline:"none", backgroundColor: darkMode ? "#222" : "#fafafa", color:textColor, boxSizing:"border-box" };

  return (
    <div style={{minHeight:"100vh", backgroundColor:bg, fontFamily:"Arial, sans-serif", transition:"all 0.3s"}}>
      <div style={{background:"linear-gradient(135deg, #431407, #7c2d12, #c2410c, #ea580c)", padding:"20px 20px 36px"}}>
        <Navbar darkMode={darkMode} onToggleDark={toggleDark} />
        <div>
          <div style={{color:"#fff", fontSize:"22px", fontWeight:"700"}}>
            Welcome back, {user?.name.split(" ")[0]}! 👋
          </div>
          <div style={{color:"rgba(255,255,255,0.75)", fontSize:"13px", marginTop:"4px"}}>
            Target: {user?.target} pts • {user?.institution}
          </div>
        </div>
      </div>

      <div style={{padding:"0 16px", marginTop:"-16px"}}>
        {/* AI Chat CTA */}
        <Link href="/ai" style={{textDecoration:"none", display:"block", marginBottom:"16px"}}>
          <div style={{background:"linear-gradient(135deg, #c2410c, #ea580c, #f97316)", borderRadius:"20px", padding:"18px 20px", boxShadow:"0 8px 24px rgba(234,88,12,0.35)", display:"flex", alignItems:"center", gap:"14px"}}>
            <div style={{fontSize:"36px"}}>🤖</div>
            <div style={{flex:1}}>
              <div style={{color:"#fff", fontWeight:"800", fontSize:"16px"}}>Ask AI Anything</div>
              <div style={{color:"rgba(255,255,255,0.85)", fontSize:"12px", marginTop:"2px"}}>Your 24/7 JAMB tutor is ready</div>
            </div>
            <div style={{color:"rgba(255,255,255,0.7)", fontSize:"20px"}}>→</div>
          </div>
        </Link>

        {/* Learn & Practice */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px"}}>
          {[
            {href:"/subjects?mode=learn", icon:"📚", label:"Learn", sub:"Video lessons"},
            {href:"/subjects?mode=practice", icon:"✏️", label:"Practice", sub:"Past questions"},
          ].map((c,i) => (
            <Link key={i} href={c.href} style={{textDecoration:"none"}}>
              <div style={{backgroundColor:cardBg, borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", textAlign:"center", border:`1px solid ${borderC}`}}>
                <div style={{fontSize:"30px", marginBottom:"8px"}}>{c.icon}</div>
                <div style={{fontWeight:"700", color:"#ea580c", fontSize:"14px"}}>{c.label}</div>
                <div style={{fontSize:"11px", color:subText, marginTop:"3px"}}>{c.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Calculator */}
        <div style={{backgroundColor:cardBg, borderRadius:"16px", marginBottom:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
          <button onClick={() => { setShowCalc(!showCalc); setAggResult(null); setCalcError(""); }} style={{width:"100%", padding:"16px 20px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
              <span style={{fontSize:"24px"}}>🧮</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontWeight:"700", color:textColor, fontSize:"14px"}}>Score Calculator</div>
                <div style={{fontSize:"11px", color:subText}}>JAMB & Aggregate calculator</div>
              </div>
            </div>
            <span style={{color:"#ea580c", fontSize:"18px"}}>{showCalc ? "▲" : "▼"}</span>
          </button>

          {showCalc && (
            <div style={{padding:"0 16px 20px", borderTop:`1px solid ${borderC}`}}>
              <div style={{display:"flex", gap:"8px", margin:"16px 0"}}>
                {(["aggregate","jamb"] as const).map(t => (
                  <button key={t} onClick={() => { setCalcType(t); setAggResult(null); setCalcError(""); }} style={{flex:1, padding:"10px", borderRadius:"10px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"700", backgroundColor: calcType === t ? "#ea580c" : darkMode ? "#2a2a2a" : "#f0f0f0", color: calcType === t ? "#fff" : subText}}>
                    {t === "aggregate" ? "Aggregate" : "JAMB Score"}
                  </button>
                ))}
              </div>

              <div style={{display:"flex", flexDirection:"column", gap:"12px"}}>
                <div>
                  <label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"6px", fontWeight:"600"}}>JAMB Score (0–400)</label>
                  <input type="number" min="0" max="400" placeholder="e.g. 285" value={jambScore} onChange={e => setJambScore(e.target.value)} style={inputSt} />
                </div>
                {calcType === "aggregate" && (
                  <div>
                    <label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"6px", fontWeight:"600"}}>Post-UTME Score (0–100)</label>
                    <input type="number" min="0" max="100" placeholder="e.g. 72" value={postUtme} onChange={e => setPostUtme(e.target.value)} style={inputSt} />
                    <div style={{fontSize:"11px", color:"#ea580c", marginTop:"6px"}}>Formula: (JAMB ÷ 8) + (Post-UTME ÷ 2)</div>
                  </div>
                )}
                {calcError && <div style={{padding:"10px 12px", backgroundColor: darkMode ? "#2a0000" : "#fff0f0", borderRadius:"10px", color:"#ef4444", fontSize:"13px"}}>⚠️ {calcError}</div>}
                <button onClick={calcAggregate} style={{padding:"13px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg, #c2410c, #ea580c)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer"}}>
                  Calculate →
                </button>

                {aggResult && (
                  <div style={{padding:"16px", borderRadius:"14px", backgroundColor: darkMode ? "#0a1a0a" : "#f0fdf4", border:`1.5px solid ${aggResult.color}33`}}>
                    <div style={{textAlign:"center", marginBottom:"12px"}}>
                      <div style={{fontSize:"36px", fontWeight:"900", color:aggResult.color}}>{aggResult.aggregate}</div>
                      <div style={{fontSize:"13px", color:aggResult.color, fontWeight:"700"}}>{aggResult.grade}</div>
                    </div>
                    {calcType === "aggregate" && (
                      <div style={{display:"flex", flexDirection:"column", gap:"6px"}}>
                        {[
                          {label:"JAMB contribution", val:`${jambScore} ÷ 8 = ${aggResult.jamb}`},
                          {label:"Post-UTME contribution", val:`${postUtme} ÷ 2 = ${aggResult.post}`},
                          {label:"Total Aggregate", val:`${aggResult.aggregate}/100`},
                        ].map((r,i) => (
                          <div key={i} style={{display:"flex", justifyContent:"space-between", fontSize:"12px", padding:"6px 0", borderBottom: i < 2 ? `1px solid ${borderC}` : "none"}}>
                            <span style={{color:subText}}>{r.label}</span>
                            <span style={{color:textColor, fontWeight:"700"}}>{r.val}</span>
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

        {/* JAMB News */}
        <div style={{backgroundColor:cardBg, borderRadius:"16px", marginBottom:"24px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
          <div style={{padding:"16px 20px", borderBottom:`1px solid ${borderC}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
              <span style={{fontSize:"20px"}}>📰</span>
              <div>
                <div style={{fontWeight:"700", color:textColor, fontSize:"14px"}}>JAMB News</div>
                <div style={{fontSize:"11px", color:"#22c55e", display:"flex", alignItems:"center", gap:"4px"}}>
                  <span style={{width:"5px", height:"5px", borderRadius:"50%", backgroundColor:"#22c55e", display:"inline-block"}}></span>
                  Live updates
                </div>
              </div>
            </div>
            <button onClick={fetchNews} style={{background:"none", border:"none", cursor:"pointer", fontSize:"16px", color:"#ea580c"}} title="Refresh">🔄</button>
          </div>
          {newsLoading ? (
            <div style={{padding:"24px", textAlign:"center", color:subText, fontSize:"13px"}}>Loading latest news...</div>
          ) : (
            news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none", display:"block", padding:"14px 20px", borderBottom: i < news.length-1 ? `1px solid ${borderC}` : "none"}}>
                <div style={{fontSize:"13px", color:textColor, fontWeight:"600", lineHeight:"1.4", marginBottom:"4px"}}>{item.title}</div>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <span style={{fontSize:"11px", color:"#ea580c", fontWeight:"600"}}>{item.source}</span>
                  <span style={{fontSize:"11px", color:subText}}>{item.time}</span>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
