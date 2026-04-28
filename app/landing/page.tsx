"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Landing() {
  const router = useRouter();
  useEffect(() => {
    const user = localStorage.getItem("companion_user");
    if (user) router.push("/");
  }, [router]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c, #ea580c, #f97316)", padding: "60px 24px 80px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎓</div>
        <h1 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 12px", letterSpacing: "-0.5px" }}>Companion</h1>
        <p style={{ fontSize: "16px", opacity: 0.9, margin: "0 0 8px" }}>Your AI-powered JAMB study assistant</p>
        <p style={{ fontSize: "13px", opacity: 0.7, margin: "0 0 32px" }}>Join 10,000+ students preparing smarter</p>
        <Link href="/signup" style={{
          display: "inline-block", padding: "14px 40px", borderRadius: "30px",
          backgroundColor: "#fff", color: "#ea580c", fontWeight: "700", fontSize: "16px",
          textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
        }}>Get Started Free →</Link>
        <div style={{ marginTop: "16px" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", textDecoration: "underline" }}>Continue without account</Link>
        </div>
      </div>

      <div style={{ padding: "40px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: "20px", fontWeight: "700", marginBottom: "24px", color: "#1a1a1a" }}>Everything you need to pass JAMB</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { icon: "📚", title: "Learn", desc: "Curated YouTube lessons for all 10 JAMB subjects" },
            { icon: "✏️", title: "Practice", desc: "Thousands of past questions with explanations" },
            { icon: "🤖", title: "Ask AI", desc: "24/7 AI tutor that knows JAMB inside out" },
            { icon: "🏆", title: "Track Progress", desc: "Study streaks, scores and personalised targets" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px", borderRadius: "16px", backgroundColor: "#fff8f5", border: "1px solid #fed7aa" }}>
              <div style={{ fontSize: "28px", flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "15px", color: "#ea580c", marginBottom: "4px" }}>{f.title}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 24px 40px", textAlign: "center" }}>
        <Link href="/signup" style={{
          display: "block", padding: "16px", borderRadius: "30px",
          background: "linear-gradient(135deg, #c2410c, #ea580c)",
          color: "#fff", fontWeight: "700", fontSize: "16px", textDecoration: "none",
          boxShadow: "0 4px 20px rgba(234,88,12,0.4)"
        }}>Create Free Account →</Link>
        <p style={{ marginTop: "12px", fontSize: "12px", color: "#999" }}>No credit card required</p>
      </div>
    </div>
  );
}
