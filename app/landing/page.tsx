"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { palette } from "../lib/design";
import { BookOpen, Bot, ClipboardList, CalendarDays, ArrowRight, Home, PenTool } from "lucide-react";

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

  const DOORS = [
    { icon: BookOpen,      color: "#2FBF71", title: "Learn",    desc: "Lessons for every topic in the official JAMB syllabus, written in clear, simple English." },
    { icon: ClipboardList, color: "#E3B341", title: "Practice", desc: "4,060 real JAMB questions from 2010–2018, timed mock exams, and instant feedback on every answer." },
    { icon: CalendarDays,  color: "#FF6B5E", title: "Plan",     desc: "A day-by-day study plan matched to your exam date, with your syllabus coverage tracked topic by topic." },
    { icon: Bot,           color: T.primary, title: "AI Tutor", desc: "Ask anything, anytime — or send a photo of a question and watch it solved step by step." },
  ];

  const SUBJECTS = ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Government", "Economics", "Literature in English"];

  return (
    <div className="fd-page" style={{ fontFamily:"var(--font)", background: T.bg, overflowX: "clip" }}>

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
          <Link href="/auth/signup" style={{
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
        <div className="fd-hero-inner" style={{ position: "relative", maxWidth: "1040px", margin: "0 auto" }}>
          <div className="fd-hero-text">
          <h1 style={{ fontSize: "44px", fontWeight: 900, lineHeight: 1.12, color: "#fff", margin: "0 auto 16px", letterSpacing: "-1px", maxWidth: "640px" }}>
            Real questions. A real plan.<br />
            <span style={{ color: "#F97316" }}>A tutor in your pocket.</span>
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.78)", lineHeight: 1.6, margin: "0 auto 32px", maxWidth: "520px" }}>
            Companion is the free JAMB study app built for Nigerian students — it plans your days and keeps you on track until exam day.
          </p>
          <Link href="/auth/signup" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#F97316", color: "#fff",
            borderRadius: "50px", padding: "16px 32px",
            fontWeight: 800, fontSize: "16px", textDecoration: "none",
            boxShadow: "0 6px 24px rgba(249,115,22,0.4)",
          }}>
            Get Started Free <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
          <p style={{ marginTop: "12px", fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>No credit card &nbsp;·&nbsp; Set up in 2 minutes</p>
          </div>

          {/* Phone — the hero centrepiece */}
          <div className="fd-hero-phone" style={{ position: "relative", width: "300px", maxWidth: "88vw", margin: "40px auto 0" }}>
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

      {/* ── THE FOUR DOORS ── */}
      <div style={{ padding: "56px 20px", background: T.bg }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:T.primary, letterSpacing:"2px", marginBottom:"8px" }}>THE APP</div>
            <h2 style={{ fontSize:"26px", fontWeight:800, color:T.text, margin:0, letterSpacing:"-0.5px" }}>Four tools. One goal.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:"12px" }}>
            {DOORS.map((f,i)=>{
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

      {/* ── SUBJECTS ── */}
      <div style={{ padding:"56px 20px", background:T.surface, borderTop:`1px solid ${T.border}` }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <div style={{ marginBottom:"24px" }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:T.primary, letterSpacing:"2px", marginBottom:"8px" }}>SUBJECTS</div>
            <h2 style={{ fontSize:"26px", fontWeight:800, color:T.text, margin:"0 0 8px", letterSpacing:"-0.5px" }}>Built around your exact subjects</h2>
            <p style={{ fontSize:"14px", color:T.sub, margin:0 }}>Pick your four JAMB subjects when you sign up — Companion builds everything around them.</p>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {SUBJECTS.map((s,i)=>(
              <span key={i} style={{ padding:"9px 16px", borderRadius:"999px", background:T.bg, border:`1px solid ${T.border}`, fontSize:"13px", fontWeight:600, color:T.text }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding:"56px 24px", background:"linear-gradient(165deg, #2A1B6B 0%, #1F1156 55%, #150D38 100%)", textAlign:"center" }}>
        <img src="/icon-192.png" alt="Companion" width={60} height={60}
          style={{ borderRadius:"18px", margin:"0 auto 20px", display:"block", boxShadow:"0 8px 24px rgba(0,0,0,0.25)" }} />
        <h2 style={{ color:"#fff", fontSize:"26px", fontWeight:800, margin:"0 0 10px", letterSpacing:"-0.5px" }}>Your exam date is fixed. Your plan should not be guesswork.</h2>
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"14px", margin:"0 0 28px" }}>
          Tell Companion your subjects and exam date — it handles the rest.
        </p>
        <Link href="/auth/signup" style={{
          display:"inline-flex", alignItems:"center", gap:"8px",
          background:"#F97316", color:"#fff",
          borderRadius:"50px", padding:"16px 32px",
          fontWeight:800, fontSize:"16px", textDecoration:"none",
          boxShadow:"0 6px 24px rgba(249,115,22,0.4)",
        }}>
          Create Free Account <ArrowRight size={18} strokeWidth={2.2} />
        </Link>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: T.bg, padding: "20px", textAlign: "center", borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: "12px", color: T.muted }}>© 2026 Companion</span>
      </div>

    </div>
  );
}
