"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { palette } from "../lib/design";
import { BookOpen, Bot, BarChart3, ClipboardList, Timer, CalendarDays, ArrowRight } from "lucide-react";

import { useDark, useIsoLayoutEffect } from "../lib/theme";
export default function Landing() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const dark = useDark();
  const T = palette(dark);

  useIsoLayoutEffect(() => {
    const user = localStorage.getItem("companion_user");
    if (user) { router.replace("/"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const FEATURES = [
    { icon: BookOpen,      color: "#0D8050", bg: "#E6F4EA", title: "Smart Lessons",    desc: "Curated video lessons for the 8 core JAMB subjects, organised by topic" },
    { icon: Bot,           color: T.primary, bg: "#EEF2FF", title: "AI Tutor 24/7",    desc: "Ask anything about JAMB — instant answers, every hour of the day" },
    { icon: Timer,         color: "#C75B21", bg: "#FFF0E6", title: "Mock Exams",        desc: "Timed exams built from real JAMB past questions, with a full breakdown" },
    { icon: BarChart3,     color: "#7B3FBE", bg: "#F3E8FF", title: "Track Progress",   desc: "Study streaks, performance analytics and personalised targets" },
    { icon: ClipboardList, color: "#B07D00", bg: "#FEF9E7", title: "Past Questions",   desc: "3,333 real JAMB questions from 2010-2018, with answers and diagrams" },
    { icon: CalendarDays,  color: "#D0021B", bg: "#FEE2E2", title: "Study Plan",       desc: "A day-by-day plan built from the official JAMB syllabus, matched to your exam date" },
  ];

  const STEPS = [
    { n:"1", title: "Create Account",  desc: "Sign up with your email and choose your target school and course" },
    { n:"2", title: "Get Your Plan",   desc: "Get a week-by-week study plan built from the official syllabus, based on your subjects and exam date" },
    { n:"3", title: "Study Smart",     desc: "Learn, practice and ask AI — everything in one focused place" },
    { n:"4", title: "Ace Your JAMB",   desc: "Hit your target score and secure your university admission" },
  ];

  return (
    <div style={{ fontFamily:"var(--font)", background: T.surface, overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#1F1156",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: "56px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <img src="/icon-192.png" alt="Companion" width={28} height={28} style={{ borderRadius: "8px", display: "block" }} />
          <span style={{ fontWeight: 800, fontSize: "17px", color: "#fff", letterSpacing: "-0.3px" }}>companion</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/auth" style={{
            borderRadius: "50px", padding: "8px 16px",
            fontSize: "13px", fontWeight: 700, textDecoration: "none",
            border: "1.5px solid rgba(255,255,255,0.45)", color: "#fff", background: "transparent",
          }}>
            Log In
          </Link>
          <Link href="/auth" style={{
            background: "#F97316", color: "#fff",
            borderRadius: "50px", padding: "8px 16px",
            fontSize: "13px", fontWeight: 700, textDecoration: "none",
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(165deg, #2A1B6B 0%, #1F1156 55%, #150D38 100%)",
        padding: "56px 24px 64px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:"-40px", right:"-40px", width:220, height:220, borderRadius:"50%", background:"rgba(249,115,22,0.13)" }} />
        <div style={{ position:"absolute", bottom:"0", left:"-60px", width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "50px", padding: "5px 14px", marginBottom: "24px",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#31A24C", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:"12px", fontWeight:600, color:"#D8DBFF" }}>Built for Nigerian JAMB students</span>
          </div>
          <div style={{ margin: "0 auto 20px", display: "inline-block" }}>
            <img src="/icon-192.png" alt="Companion" width={80} height={80}
              style={{ borderRadius: "22px", boxShadow: "0 8px 28px rgba(0,0,0,0.4)", display: "block" }} />
          </div>
          <h1 style={{ fontSize: "40px", fontWeight: 900, lineHeight: 1.12, color: "#fff", margin: "0 0 16px", letterSpacing: "-1px" }}>
            Pass JAMB with<br />
            <span style={{ color: "#F97316" }}>AI-Powered</span> Study Support
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.78)", lineHeight: 1.6, margin: "0 auto 32px", maxWidth: "520px" }}>
            Learn smarter, practice daily, and get instant answers from your AI tutor. Built specifically for Nigerian students.
          </p>
          <Link href="/auth" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#F97316", color: "#fff",
            borderRadius: "50px", padding: "16px 32px",
            fontWeight: 800, fontSize: "16px", textDecoration: "none",
            boxShadow: "0 6px 24px rgba(249,115,22,0.4)",
          }}>
            Get Started Free <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
          <p style={{ marginTop: "12px", fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>No credit card &nbsp;·&nbsp; Takes 2 minutes</p>
          <div style={{ margin: "38px auto 0", width: "272px", maxWidth: "86vw", background: "#0E1018", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "34px", padding: "12px 12px 14px", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", textAlign: "left" }}>
            <div style={{ width: "84px", height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.18)", margin: "2px auto 14px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "0 4px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#9AA0B5" }}>Good morning</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>Adaeze</div>
              </div>
              <img src="/icon-192.png" alt="" width={30} height={30} style={{ borderRadius: "9px", display: "block" }} />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#161925", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "12px", marginBottom: "10px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "50%", border: "5px solid #F97316", borderTopColor: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>72%</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Exam readiness</div>
                <div style={{ fontSize: "11px", color: "#9AA0B5", lineHeight: 1.45 }}>Target 300 · 41 days to JAMB</div>
              </div>
            </div>
            {[{ s: "Physics", t: "Waves and Optics", done: true }, { s: "Chemistry", t: "Organic Chemistry", done: false }, { s: "Biology", t: "Genetics", done: false }].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "9px", background: "#161925", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "10px 12px", marginBottom: "8px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: r.done ? "#31A24C" : "transparent", border: r.done ? "none" : "2px solid rgba(255,255,255,0.25)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{r.s}</div>
                  <div style={{ fontSize: "11px", color: "#9AA0B5" }}>{r.t}</div>
                </div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#F97316" }}>{r.done ? "DONE" : "TODAY"}</div>
              </div>
            ))}
            <div style={{ background: "#F97316", borderRadius: "12px", padding: "11px", textAlign: "center", fontSize: "12px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>Continue Practice</div>
          </div>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "1px", margin: "40px 0 0",
          background: T.border, borderRadius: "14px", overflow: "hidden",
        }}>
          {[{n:"3,333",l:"Past Questions"},{n:"8",l:"Subjects"},{n:"24/7",l:"AI Help"},{n:"Free",l:"Always"}].map((s,i)=>(
            <div key={i} style={{ padding:"16px 8px", textAlign:"center", background:T.surface }}>
              <div style={{ fontSize:"19px", fontWeight:900, color:"#F97316" }}>{s.n}</div>
              <div style={{ fontSize:"11px", color:T.sub, marginTop:"2px" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ padding: "56px 20px", background: T.bg }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:T.primary, letterSpacing:"2px", marginBottom:"8px" }}>FEATURES</div>
          <h2 style={{ fontSize:"26px", fontWeight:800, color:T.text, margin:"0 0 8px", letterSpacing:"-0.5px" }}>Everything you need to pass</h2>
          <p style={{ fontSize:"14px", color:T.sub, margin:0 }}>No more switching between apps and websites</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {FEATURES.map((f,i)=>{
            const Icon = f.icon;
            return (
              <div key={i} style={{ background:T.surface, borderRadius:"16px", padding:"20px 16px", border:`1px solid ${T.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ width:44, height:44, borderRadius:"12px", background: dark ? T.s2 : f.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}>
                  <Icon size={20} strokeWidth={1.8} color={f.color} />
                </div>
                <div style={{ fontWeight:700, fontSize:"14px", color:T.text, marginBottom:"5px" }}>{f.title}</div>
                <div style={{ fontSize:"12px", color:T.sub, lineHeight:1.5 }}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ padding:"56px 20px", background:T.surface }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:T.primary, letterSpacing:"2px", marginBottom:"8px" }}>HOW IT WORKS</div>
          <h2 style={{ fontSize:"26px", fontWeight:800, color:T.text, margin:0, letterSpacing:"-0.5px" }}>Simple. Effective. Fast.</h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          {STEPS.map((s,i)=>(
            <div key={i} style={{ display:"flex", gap:"16px", alignItems:"flex-start" }}>
              <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:"16px", boxShadow:"0 4px 14px rgba(79,70,229,0.3)" }}>{s.n}</div>
              <div style={{ paddingTop:"4px" }}>
                <div style={{ fontWeight:700, fontSize:"15px", color:T.text, marginBottom:"4px" }}>{s.title}</div>
                <div style={{ fontSize:"13px", color:T.sub, lineHeight:1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding:"56px 24px", background:"linear-gradient(135deg, #1F1156, #4F46E5)", textAlign:"center" }}>
        <img src="/icon-192.png" alt="Companion" width={60} height={60}
          style={{ borderRadius:"18px", margin:"0 auto 20px", display:"block", boxShadow:"0 8px 24px rgba(0,0,0,0.25)" }} />
        <h2 style={{ color:"#fff", fontSize:"26px", fontWeight:800, margin:"0 0 10px", letterSpacing:"-0.5px" }}>Ready to ace JAMB?</h2>
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"14px", margin:"0 0 28px" }}>
          Start studying smarter today. Free forever.
        </p>
        <Link href="/auth" style={{
          display:"inline-flex", alignItems:"center", gap:"8px",
          background:"#F97316", color:"#fff",
          borderRadius:"50px", padding:"16px 32px",
          fontWeight:800, fontSize:"16px", textDecoration:"none",
          boxShadow:"0 6px 24px rgba(0,0,0,0.2)", marginBottom:"14px",
        }}>
          Create Free Account <ArrowRight size={18} strokeWidth={2.2} />
        </Link>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"12px", margin:0 }}>No credit card required</p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
