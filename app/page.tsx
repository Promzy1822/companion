"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NewsItem { title: string; url: string; source: string; time: string; }
interface User { name: string; target: string; subjects: string[]; institution: string; course: string; }

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<"jamb"|"aggregate">("jamb");
  const [jambScore, setJambScore] = useState("");
  const [postUtme, setPostUtme] = useState("");
  const [oLevel, setOLevel] = useState("");
  const [aggResult, setAggResult] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
    fetchNews();
  }, []);

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
    { title: "JAMB 2025 Registration Now Open — Apply Before Deadline", url: "#", source: "JAMB Official", time: "Today" },
    { title: "JAMB Releases New Syllabus Updates for 2025 UTME", url: "#", source: "JAMB Official", time: "2 days ago" },
    { title: "How to Check Your JAMB Result Online — Step by Step Guide", url: "#", source: "Nairaland", time: "3 days ago" },
    { title: "UNILAG Cut-Off Marks for All Courses 2025", url: "#", source: "Universities", time: "1 week ago" },
    { title: "Post-UTME Screening Dates: All Universities 2025", url: "#", source: "Education", time: "1 week ago" },
  ];

  const calcAggregate = () => {
    const j = parseFloat(jambScore);
    const p = parseFloat(postUtme);
    const o = parseFloat(oLevel);
    if (isNaN(j) || j < 0 || j > 400) { setAggResult("Enter valid JAMB score (0-400)"); return; }
    if (calcType === "aggregate") {
      if (isNaN(p) || p < 0 || p > 100) { setAggResult("Enter valid Post-UTME score (0-100)"); return; }
      if (isNaN(o) || o < 0 || o > 100) { setAggResult("Enter valid O'Level score (0-100)"); return; }
      const agg = (j / 8) + (p * 0.5) + (o * 0.1);
      setAggResult(`Your Aggregate Score: ${agg.toFixed(2)}/100\n\nBreakdown:\n• JAMB (${j}/400 ÷ 8) = ${(j/8).toFixed(2)}\n• Post-UTME (${p}% × 0.5) = ${(p*0.5).toFixed(2)}\n• O'Level (${o}% × 0.1) = ${(o*0.1).toFixed(2)}`);
    } else {
      const scaled = ((j / 400) * 100).toFixed(1);
      setAggResult(`JAMB Score: ${j}/400\nScaled to 100: ${scaled}%\n\n${j >= 300 ? "🔥 Excellent! Competitive for any course." : j >= 250 ? "✅ Good score. Eligible for most courses." : j >= 200 ? "⚠️ Average. May need strong Post-UTME." : "❌ Below average. Consider re-sitting."}`);
    }
  };

  const bg = darkMode ? "#0f0f0f" : "#fffbf5";
  const cardBg = darkMode ? "#1a1a1a" : "#ffffff";
  const textColor = darkMode ? "#f0f0f0" : "#1a1a1a";
  const subText = darkMode ? "#aaa" : "#666";
  const borderC = darkMode ? "#2a2a2a" : "#f0f0f0";
  const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: "10px", border: `1.5px solid ${borderC}`, fontSize: "14px", outline: "none", backgroundColor: darkMode ? "#222" : "#fafafa", color: textColor, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "Arial, sans-serif", transition: "all 0.3s" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #431407, #7c2d12, #c2410c, #ea580c)", padding: "20px 20px 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "26px" }}>🎓</span>
            <div>
              <div style={{ color: "#fff", fontWeight: "900", fontSize: "20px" }}>Companion</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px" }}>JAMB Study Assistant</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => { const d = !darkMode; setDarkMode(d); localStorage.setItem("darkMode", String(d)); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "34px", height: "34px", fontSize: "15px", cursor: "pointer" }}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "5px 12px 5px 5px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "#fde68a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#c2410c" }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: "600" }}>{user.name.split(" ")[0]}</span>
              </div>
            ) : (
              <Link href="/landing" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "6px 14px", color: "#fff", fontSize: "12px", textDecoration: "none", fontWeight: "600" }}>Sign Up</Link>
            )}
          </div>
        </div>
        {user ? (
          <div>
            <div style={{ color: "#fff", fontSize: "22px", fontWeight: "700" }}>Welcome back, {user.name.split(" ")[0]}! 👋</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", marginTop: "4px" }}>Target: {user.target} pts • {user.institution}</div>
          </div>
        ) : (
          <div>
            <div style={{ color: "#fff", fontSize: "22px", fontWeight: "700" }}>Ready to ace JAMB? 🔥</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", marginTop: "4px" }}>
              <Link href="/landing" style={{ color: "#fde68a", fontWeight: "700", textDecoration: "none" }}>Create account</Link> for a personalised plan
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "0 16px", marginTop: "-16px" }}>

        {/* AI Chat CTA */}
        <Link href="/ai" style={{ textDecoration: "none", display: "block", marginBottom: "16px" }}>
          <div style={{ background: "linear-gradient(135deg, #c2410c, #ea580c, #f97316)", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 8px 24px rgba(234,88,12,0.35)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ fontSize: "36px" }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: "800", fontSize: "16px" }}>Ask AI Anything</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", marginTop: "2px" }}>Your 24/7 JAMB tutor is ready</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }}>→</div>
          </div>
        </Link>

        {/* Learn & Practice */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          {[
            { href: "/subjects?mode=learn", icon: "📚", label: "Learn", sub: "Video lessons", color: "#3b82f6" },
            { href: "/subjects?mode=practice", icon: "✏️", label: "Practice", sub: "Past questions", color: "#8b5cf6" },
          ].map((c, i) => (
            <Link key={i} href={c.href} style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: cardBg, borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", textAlign: "center", border: `1px solid ${borderC}` }}>
                <div style={{ fontSize: "30px", marginBottom: "8px" }}>{c.icon}</div>
                <div style={{ fontWeight: "700", color: "#ea580c", fontSize: "14px" }}>{c.label}</div>
                <div style={{ fontSize: "11px", color: subText, marginTop: "3px" }}>{c.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Calculator */}
        <div style={{ backgroundColor: cardBg, borderRadius: "16px", marginBottom: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid ${borderC}` }}>
          <button onClick={() => setShowCalc(!showCalc)} style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>🧮</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: "700", color: textColor, fontSize: "14px" }}>Score Calculator</div>
                <div style={{ fontSize: "11px", color: subText }}>JAMB & Aggregate calculator</div>
              </div>
            </div>
            <span style={{ color: "#ea580c", fontSize: "18px" }}>{showCalc ? "▲" : "▼"}</span>
          </button>

          {showCalc && (
            <div style={{ padding: "0 16px 20px", borderTop: `1px solid ${borderC}` }}>
              <div style={{ display: "flex", gap: "8px", margin: "16px 0 16px" }}>
                {(["jamb", "aggregate"] as const).map(t => (
                  <button key={t} onClick={() => { setCalcType(t); setAggResult(""); }} style={{
                    flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "700",
                    backgroundColor: calcType === t ? "#ea580c" : darkMode ? "#2a2a2a" : "#f0f0f0",
                    color: calcType === t ? "#fff" : subText
                  }}>{t === "jamb" ? "JAMB Score" : "Aggregate"}</button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: subText, display: "block", marginBottom: "6px", fontWeight: "600" }}>JAMB Score (0–400)</label>
                  <input type="number" placeholder="e.g. 285" value={jambScore} onChange={e => setJambScore(e.target.value)} style={inputStyle} />
                </div>
                {calcType === "aggregate" && (
                  <>
                    <div>
                      <label style={{ fontSize: "12px", color: subText, display: "block", marginBottom: "6px", fontWeight: "600" }}>Post-UTME Score (%)</label>
                      <input type="number" placeholder="e.g. 72" value={postUtme} onChange={e => setPostUtme(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: subText, display: "block", marginBottom: "6px", fontWeight: "600" }}>O'Level Score (%)</label>
                      <input type="number" placeholder="e.g. 80" value={oLevel} onChange={e => setOLevel(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
                <button onClick={calcAggregate} style={{ padding: "13px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #c2410c, #ea580c)", color: "#fff", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                  Calculate →
                </button>
                {aggResult && (
                  <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: darkMode ? "#1a2a1a" : "#f0fff4", border: "1px solid #86efac", whiteSpace: "pre-line", fontSize: "13px", color: darkMode ? "#86efac" : "#166534", lineHeight: "1.6" }}>
                    {aggResult}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* JAMB News */}
        <div style={{ backgroundColor: cardBg, borderRadius: "16px", marginBottom: "24px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid ${borderC}` }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${borderC}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📰</span>
              <div>
                <div style={{ fontWeight: "700", color: textColor, fontSize: "14px" }}>JAMB News</div>
                <div style={{ fontSize: "11px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }}></span>
                  Live updates
                </div>
              </div>
            </div>
            <button onClick={fetchNews} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#ea580c" }}>🔄</button>
          </div>
          {newsLoading ? (
            <div style={{ padding: "24px", textAlign: "center", color: subText, fontSize: "13px" }}>Loading latest news...</div>
          ) : (
            <div>
              {news.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", padding: "14px 20px", borderBottom: i < news.length - 1 ? `1px solid ${borderC}` : "none" }}>
                  <div style={{ fontSize: "13px", color: textColor, fontWeight: "600", lineHeight: "1.4", marginBottom: "4px" }}>{item.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#ea580c", fontWeight: "600" }}>{item.source}</span>
                    <span style={{ fontSize: "11px", color: subText }}>{item.time}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
