"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { palette } from "../lib/design";
import { BookOpen, Bot, BarChart3, ClipboardList, Timer, CalendarDays, ArrowRight, Home, PenTool, CheckCircle2, Flame } from "lucide-react";

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
    { icon: ClipboardList, color: "#E3B341", title: "Past Questions",   desc: "3,333 real JAMB questions from 2010-2018, with answers and diagrams" },
    { icon: Bot,           color: T.primary, title: "AI Tutor 24/7",   desc: "Ask anything about JAMB, or send a photo of a question and watch it get solved" },
    { icon: BookOpen,      color: "#2FBF71", title: "Topic Lessons",    desc: "Clear, bite-size lessons for every topic in the 8 core JAMB subjects" },
    { icon: Timer,         color: "#E87F35", title: "Mock Exams",       desc: "Timed exams built from real JAMB past questions, with a full breakdown" },
    { icon: CalendarDays,  color: "#FF6B5E", title: "Study Plan",       desc: "A day-by-day plan built from the official JAMB syllabus, matched to your exam date" },
    { icon: BarChart3,     color: "#B07FE8", title: "Track Progress",   desc: "Study streaks, performance analytics and personalised targets" },
  ];

  const STEPS = [
    { n:"1", title: "Create Account",  desc: "Sign up with your email and choose your target school and course" },
    { n:"2", title: "Get Your Plan",   desc: "Get a week-by-week study plan built from the official syllabus, based on your subjects and exam date" },
    { n:"3", title: "Study Smart",     desc: "Learn, practice and ask AI — everything in one focused place" },
    { n:"4", title: "Ace Your JAMB",   desc: "Hit your target score and secure your university admission" },
  ];

  const STATS = [
    { n:"3,333", l:"Past Questions" },
    { n:"8", l:"Core Subjects" },
    { n:"2010–2018", l:"Real Exam Years" },
    { n:"Free", l:"No Fees, Ever" },
  ];

  return (
    <div style={{ fontFamily:"var(--font)", background: T.bg, overflowX: "hidden" }}>

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
        padding: "48px 24px 0", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:"-40px", right:"-40px", width:220, height:220, borderRadius:"50%", background:"rgba(249,115,22,0.13)" }} />
        <div style={{ position:"absolute", bottom:"0", left:"-60px", width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative", maxWidth: "1040px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "50px", padding: "5px 14px", marginBottom: "24px",
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#31A24C", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:"12px", fontWeight:600, color:"#D8DBFF" }}>Built for Nigerian JAMB students</span>
          </div>
          <h1 style={{ fontSize: "44px", fontWeight: 900, lineHeight: 1.1, color: "#fff", margin: "0 auto 16px", letterSpacing: "-1px", maxWidth: "640px" }}>
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

          {/* Phone — the hero centrepiece */}
          <div style={{ position: "relative", width: "300px", maxWidth: "88vw", margin: "40px auto 0" }}>
            <div className="float-chip" style={{ position: "absolute", left: "-168px", top: "72px", alignItems: "center", gap: "8px", background: "#161925", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 12px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)", textAlign: "left", zIndex: 2 }}>
              <CheckCircle2 size={18} color="#31A24C" strokeWidth={2} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Physics — Waves</div>
                <div style={{ fontSize: "11px", color: "#9AA0B5" }}>Topic completed</div>
              </div>
            </div>
            <div className="float-chip" style={{ position: "absolute", right: "-168px", top: "168px", alignItems: "center", gap: "8px", background: "#161925", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 12px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)", textAlign: "left", zIndex: 2 }}>
              <Flame size={18} color="#F97316" strokeWidth={2} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>12-day streak</div>
                <div style={{ fontSize: "11px", color: "#9AA0B5" }}>Keep it burning</div>
              </div>
            </div>
            <div style={{ background: "#0E1018", border: "1px solid rgba(255,255,255,0.14)", borderBottom: "none", borderRadius: "36px 36px 0 0", padding: "14px 14px 0", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", textAlign: "left" }}>
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
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 4px 12px", marginTop: "4px" }}>
                <Home size={19} color="#9AA0B5" strokeWidth={1.9} />
                <BookOpen size={19} color="#9AA0B5" strokeWidth={1.9} />
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "-14px", boxShadow: "0 6px 16px rgba(249,115,22,0.45)" }}>
                  <Bot size={19} color="#fff" strokeWidth={2} />
                </div>
                <PenTool size={19} color="#9AA0B5" strokeWidth={1.9} />
                <CalendarDays size={19} color="#9AA0B5" strokeWidth={1.9} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAND ── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          {STATS.map((s,i)=>(
            <div key={i} style={{ padding:"20px 8px", textAlign:"center", borderLeft: i>0 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize:"20px", fontWeight:900, color:"#F97316" }}>{s.n}</div>
              <div style={{ fontSize:"11px", color:T.sub, marginTop:"2px" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ padding: "56px 20px", background: T.bg }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:T.primary, letterSpacing:"2px", marginBottom:"8px" }}>FEATURES</div>
            <h2 style={{ fontSize:"26px", fontWeight:800, color:T.text, margin:"0 0 8px", letterSpacing:"-0.5px" }}>Everything you need to pass</h2>
            <p style={{ fontSize:"14px", color:T.sub, margin:0 }}>No more switching between apps and websites</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:"12px" }}>
            {FEATURES.map((f,i)=>{
              const Icon = f.icon;
              return (
                <div key={i} style={{ background:T.surface, borderRadius:"16px", padding:"20px", border:`1px solid ${T.border}` }}>
                  <div style={{ width:44, height:44, borderRadius:"12px", background: `${f.color}1F`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px" }}>
                    <Icon size={20} strokeWidth={1.8} color={f.color} />
                  </div>
                  <div style={{ fontWeight:700, fontSize:"15px", color:T.text, marginBottom:"5px" }}>{f.title}</div>
                  <div style={{ fontSize:"13px", color:T.sub, lineHeight:1.55 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ padding:"56px 20px", background:T.surface, borderTop:`1px solid ${T.border}` }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:T.primary, letterSpacing:"2px", marginBottom:"8px" }}>HOW IT WORKS</div>
            <h2 style={{ fontSize:"26px", fontWeight:800, color:T.text, margin:0, letterSpacing:"-0.5px" }}>Simple. Effective. Fast.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"12px" }}>
            {STEPS.map((s,i)=>(
              <div key={i} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"16px", padding:"20px" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#1F1156", border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#F97316", fontWeight:900, fontSize:"16px", marginBottom:"12px" }}>{s.n}</div>
                <div style={{ fontWeight:700, fontSize:"15px", color:T.text, marginBottom:"4px" }}>{s.title}</div>
                <div style={{ fontSize:"13px", color:T.sub, lineHeight:1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
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
          boxShadow:"0 6px 24px rgba(249,115,22,0.4)", marginBottom:"14px",
        }}>
          Create Free Account <ArrowRight size={18} strokeWidth={2.2} />
        </Link>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"12px", margin:0 }}>No credit card required</p>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: T.bg, padding: "20px", textAlign: "center", borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: "12px", color: T.muted }}>Companion — built for Nigerian JAMB students</span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .float-chip { display: none; }
        @media (min-width: 900px) { .float-chip { display: flex; } }
      `}</style>
    </div>
  );
}
