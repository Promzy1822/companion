"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Landing() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem("companion_user");
    if (user) router.push("/");
  }, [router]);

  const stats = [
    { num: "1.5M+", label: "Students yearly" },
    { num: "10K+", label: "Past questions" },
    { num: "24/7", label: "AI availability" },
    { num: "98%", label: "Satisfaction" },
  ];

  const features = [
    { icon: "📚", title: "Smart Lessons", desc: "Curated YouTube video lessons for all JAMB subjects, organised by topic", color: "#3b82f6" },
    { icon: "✏️", title: "Past Questions", desc: "Practice with thousands of real JAMB past questions with full explanations", color: "#8b5cf6" },
    { icon: "🤖", title: "AI Tutor", desc: "Ask anything 24/7. Your personal JAMB expert that never gets tired", color: "#ea580c" },
    { icon: "📊", title: "Score Tracker", desc: "Track your progress, study streaks and performance per subject", color: "#10b981" },
    { icon: "🧮", title: "Calculators", desc: "JAMB aggregate and Post-UTME calculators for all universities", color: "#f59e0b" },
    { icon: "📰", title: "JAMB News", desc: "Live updates on JAMB announcements, results and deadlines", color: "#ef4444" },
  ];

  const steps = [
    { n: "1", title: "Create Account", desc: "Sign up with your email and tell us your target school and course" },
    { n: "2", title: "Get Your Plan", desc: "We build a personalised study plan based on your exam date and subjects" },
    { n: "3", title: "Study Smart", desc: "Learn, practice and ask AI — all in one place, anytime" },
    { n: "4", title: "Ace JAMB", desc: "Hit your target score and secure your admission" },
  ];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#fff", overflowX: "hidden" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(160deg, #431407 0%, #7c2d12 25%, #c2410c 60%, #f97316 100%)",
        padding: "0 0 60px", minHeight: "100vh", display: "flex", flexDirection: "column"
      }}>
        {/* Nav */}
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>🎓</span>
            <span style={{ color: "#fff", fontWeight: "900", fontSize: "18px" }}>Companion</span>
          </div>
          <Link href="/" style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "20px" }}>
            Skip →
          </Link>
        </div>

        {/* Hero Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 24px 0", textAlign: "center" }}>
          <div style={{
            display: "inline-block", margin: "0 auto 20px",
            padding: "6px 16px", borderRadius: "20px",
            backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
            color: "rgba(255,255,255,0.9)", fontSize: "12px", fontWeight: "600"
          }}>🔥 Nigeria's #1 JAMB Study App</div>

          <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: "900", lineHeight: "1.15", margin: "0 0 16px", letterSpacing: "-1px" }}>
            Pass JAMB with<br />
            <span style={{ color: "#fde68a" }}>AI-Powered</span><br />
            Study Support
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 32px" }}>
            Learn smarter, practice daily, and get instant answers from your AI tutor. Built specifically for Nigerian students.
          </p>

          <Link href="/signup" style={{
            display: "block", padding: "18px 32px", borderRadius: "30px",
            backgroundColor: "#fff", color: "#c2410c",
            fontWeight: "800", fontSize: "17px", textDecoration: "none",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            marginBottom: "16px"
          }}>
            Start for Free → 
          </Link>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0 }}>No credit card • Takes 2 minutes</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1px", margin: "40px 24px 0", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: "16px 8px", textAlign: "center", backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div style={{ color: "#fde68a", fontWeight: "900", fontSize: "18px" }}>{s.num}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "48px 24px", backgroundColor: "#fafafa" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#ea580c", letterSpacing: "2px", marginBottom: "8px" }}>FEATURES</div>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 8px" }}>Everything in one app</h2>
          <p style={{ fontSize: "14px", color: "#999", margin: 0 }}>No more switching between apps and websites</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {features.map((f, i) => (
            <div key={i} style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>{f.icon}</div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#1a1a1a", marginBottom: "6px" }}>{f.title}</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.5" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "48px 24px", backgroundColor: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#ea580c", letterSpacing: "2px", marginBottom: "8px" }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1a1a1a", margin: 0 }}>Simple. Effective. Fast.</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #c2410c, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: "900", fontSize: "16px",
                boxShadow: "0 4px 12px rgba(234,88,12,0.3)"
              }}>{s.n}</div>
              <div style={{ paddingTop: "4px" }}>
                <div style={{ fontWeight: "700", fontSize: "15px", color: "#1a1a1a", marginBottom: "4px" }}>{s.title}</div>
                <div style={{ fontSize: "13px", color: "#888", lineHeight: "1.5" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div style={{ padding: "40px 24px", backgroundColor: "#fff8f5" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#ea580c", letterSpacing: "2px" }}>STUDENT STORIES</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { name: "Amaka O.", score: "321", school: "UNILAG", text: "Companion helped me focus on the right topics. I scored 321!" },
            { name: "Emeka C.", score: "298", school: "OAU", text: "The AI tutor explained things my teacher couldn't. Got into OAU!" },
            { name: "Fatima B.", score: "304", school: "UNILORIN", text: "I practiced past questions daily. This app is a game changer." },
          ].map((t, i) => (
            <div key={i} style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #fed7aa" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>{"⭐⭐⭐⭐⭐".split("").map((s,j) => <span key={j} style={{ fontSize: "14px" }}>{s}</span>)}</div>
              <p style={{ fontSize: "13px", color: "#555", margin: "0 0 12px", lineHeight: "1.5", fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "#1a1a1a" }}>{t.name}</div>
                <div style={{ fontSize: "12px", color: "#ea580c", fontWeight: "600", backgroundColor: "#fff8f5", padding: "4px 10px", borderRadius: "20px" }}>{t.score} • {t.school}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ padding: "48px 24px", background: "linear-gradient(135deg, #7c2d12, #c2410c, #ea580c)", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "16px" }}>🚀</div>
        <h2 style={{ color: "#fff", fontSize: "26px", fontWeight: "800", margin: "0 0 12px" }}>Ready to start?</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: "0 0 28px" }}>Join thousands of students already using Companion</p>
        <Link href="/signup" style={{
          display: "block", padding: "18px", borderRadius: "30px",
          backgroundColor: "#fff", color: "#c2410c",
          fontWeight: "800", fontSize: "17px", textDecoration: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", marginBottom: "16px"
        }}>Create Free Account →</Link>
        <Link href="/" style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", textDecoration: "underline" }}>Continue without account</Link>
      </div>
    </div>
  );
}
