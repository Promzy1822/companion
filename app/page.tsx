"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<{name: string; target: string; subjects: string[]} | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const toggleDark = () => {
    const d = !darkMode;
    setDarkMode(d);
    localStorage.setItem("darkMode", String(d));
  };

  const logout = () => {
    localStorage.removeItem("companion_user");
    setUser(null);
    router.push("/landing");
  };

  const bg = darkMode ? "#0f0f0f" : "#fffbf5";
  const cardBg = darkMode ? "#1a1a1a" : "#ffffff";
  const textColor = darkMode ? "#f0f0f0" : "#1a1a1a";
  const subText = darkMode ? "#aaa" : "#666";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "Arial, sans-serif", transition: "all 0.3s" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c, #ea580c)", padding: "20px 20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "28px" }}>🎓</div>
            <div>
              <div style={{ color: "#fff", fontWeight: "900", fontSize: "20px", letterSpacing: "-0.5px" }}>Companion</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>JAMB Study Assistant</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={toggleDark} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "16px", cursor: "pointer" }}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            {user ? (
              <button onClick={logout} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "20px", padding: "6px 12px", color: "#fff", fontSize: "12px", cursor: "pointer" }}>
                Logout
              </button>
            ) : (
              <Link href="/landing" style={{ background: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "6px 12px", color: "#fff", fontSize: "12px", textDecoration: "none" }}>
                Sign Up
              </Link>
            )}
          </div>
        </div>

        {user ? (
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: "22px", fontWeight: "700" }}>Welcome back, {user.name.split(" ")[0]}! 👋</div>
            <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>Target: {user.target} • Keep going! 🔥</div>
          </div>
        ) : (
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: "22px", fontWeight: "700" }}>Ready to ace JAMB? 🔥</div>
            <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>Start learning, practicing and asking AI</div>
          </div>
        )}
      </div>

      <div style={{ padding: "20px", marginTop: "-16px" }}>
        {/* AI Chat CTA */}
        <Link href="/ai" style={{ textDecoration: "none", display: "block", marginBottom: "20px" }}>
          <div style={{
            background: "linear-gradient(135deg, #c2410c, #ea580c, #f97316)",
            borderRadius: "20px", padding: "20px",
            boxShadow: "0 8px 24px rgba(234,88,12,0.4)",
            display: "flex", alignItems: "center", gap: "16px"
          }}>
            <div style={{ fontSize: "40px" }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: "800", fontSize: "17px" }}>Ask AI Anything</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", marginTop: "2px" }}>Your 24/7 JAMB tutor is ready</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "24px" }}>→</div>
          </div>
        </Link>

        {/* Learn & Practice Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <Link href="/subjects?mode=learn" style={{ textDecoration: "none" }}>
            <div style={{ backgroundColor: cardBg, borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📚</div>
              <div style={{ fontWeight: "700", color: "#ea580c", fontSize: "15px" }}>Learn</div>
              <div style={{ fontSize: "12px", color: subText, marginTop: "4px" }}>Video lessons</div>
            </div>
          </Link>
          <Link href="/subjects?mode=practice" style={{ textDecoration: "none" }}>
            <div style={{ backgroundColor: cardBg, borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✏️</div>
              <div style={{ fontWeight: "700", color: "#ea580c", fontSize: "15px" }}>Practice</div>
              <div style={{ fontSize: "12px", color: subText, marginTop: "4px" }}>Past questions</div>
            </div>
          </Link>
        </div>

        {/* Quick Tips */}
        <div style={{ backgroundColor: cardBg, borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight: "700", color: textColor, fontSize: "15px", marginBottom: "12px" }}>💡 JAMB Tips</div>
          {[
            "Read questions carefully before answering",
            "Practice past questions daily",
            "Focus on your weak subjects first",
            "Use elimination for tricky options",
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "linear-gradient(135deg, #c2410c, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", flexShrink: 0, fontWeight: "700" }}>{i+1}</div>
              <div style={{ fontSize: "13px", color: subText, lineHeight: "1.4" }}>{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
