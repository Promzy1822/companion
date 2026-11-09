"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { palette } from "../lib/design";
import { BookOpen, Bot, BarChart3, Newspaper, Calculator, ClipboardList, CheckCircle, ArrowRight, Star } from "lucide-react";

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
    { icon: BookOpen,      color: "#0D8050", bg: "#E6F4EA", title: "Smart Lessons",    desc: "Curated video lessons for all JAMB subjects, organised by topic" },
    { icon: Bot,           color: T.primary, bg: "#EEF2FF", title: "AI Tutor 24/7",    desc: "Ask anything about JAMB — instant answers, every hour of the day" },
    { icon: ClipboardList, color: "#C75B21", bg: "#FFF0E6", title: "Mock Exams",        desc: "AI-generated timed exams with full subject breakdown and debrief" },
    { icon: BarChart3,     color: "#7B3FBE", bg: "#F3E8FF", title: "Track Progress",   desc: "Study streaks, performance analytics and personalised targets" },
    { icon: Calculator,    color: "#B07D00", bg: "#FEF9E7", title: "Score Calculator", desc: "Instant JAMB aggregate and Post-UTME score calculations" },
    { icon: Newspaper,     color: "#D0021B", bg: "#FEE2E2", title: "JAMB News",         desc: "Live updates on JAMB announcements, results and deadlines" },
  ];

  const STEPS = [
    { n:"1", title: "Create Account",  desc: "Sign up with your email and choose your target school and course" },
    { n:"2", title: "Get Your Plan",   desc: "AI builds a week-by-week study plan based on your subjects and exam date" },
    { n:"3", title: "Study Smart",     desc: "Learn, practice and ask AI — everything in one focused place" },
    { n:"4", title: "Ace Your JAMB",   desc: "Hit your target score and secure your university admission" },
  ];

  const TESTIMONIALS = [
    { name: "Amaka O.", score: "321", school: "UNILAG",   text: "Companion helped me focus on the right topics. I scored 321!" },
    { name: "Emeka C.", score: "298", school: "OAU",      text: "The AI tutor explained things my teacher couldn't. Got into OAU!" },
    { name: "Fatima B.", score: "304", school: "UNILORIN", text: "I practiced past questions daily. This app is a game changer." },
  ];

  return (
    <div style={{ fontFamily:"var(--font)", background: T.surface, overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: "56px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <img src="/icon-192.png" alt="Companion" width={28} height={28} style={{ borderRadius: "8px", display: "block" }} />
          <span style={{ fontWeight: 800, fontSize: "17px", color: T.text, letterSpacing: "-0.3px" }}>companion</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/auth" style={{
            borderRadius: "50px", padding: "8px 16px",
            fontSize: "13px", fontWeight: 700, textDecoration: "none",
            border: `1.5px solid ${T.primary}`, color: T.primary, background: "transparent",
          }}>
            Log In
          </Link>
          <Link href="/auth" style={{
            background: T.primary, color: "#fff",
            borderRadius: "50px", padding: "8px 16px",
            fontSize: "13px", fontWeight: 700, textDecoration: "none",
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        background: dark
          ? `linear-gradient(160deg, ${T.primarySoft} 0%, ${T.bg} 100%)`
          : "linear-gradient(160deg, #F5F7FF 0%, #E8F1FF 60%, #EFF2FF 100%)",
        padding: "56px 24px 64px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:"-40px", right:"-40px", width:220, height:220, borderRadius:"50%", background:"rgba(79,70,229,0.08)" }} />
        <div style={{ position:"absolute", bottom:"0", left:"-60px", width:180, height:180, borderRadius:"50%", background:"rgba(79,70,229,0.06)" }} />
        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: "50px", padding: "5px 14px", marginBottom: "24px",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#31A24C", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:"12px", fontWeight:600, color:T.sub }}>Nigeria's #1 JAMB Study App</span>
          </div>
          <div style={{ margin: "0 auto 20px", display: "inline-block" }}>
            <img src="/icon-192.png" alt="Companion" width={80} height={80}
              style={{ borderRadius: "22px", boxShadow: "0 8px 28px rgba(79,70,229,0.25)", display: "block" }} />
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, lineHeight: 1.15, color: T.text, margin: "0 0 16px", letterSpacing: "-1px" }}>
            Pass JAMB with<br />
            <span style={{ color: T.primary }}>AI-Powered</span> Study Support
          </h1>
          <p style={{ fontSize: "16px", color: T.sub, lineHeight: 1.6, margin: "0 0 32px" }}>
            Learn smarter, practice daily, and get instant answers from your AI tutor. Built specifically for Nigerian students.
          </p>
          <Link href="/auth" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: T.primary, color: "#fff",
            borderRadius: "50px", padding: "16px 32px",
            fontWeight: 800, fontSize: "16px", textDecoration: "none",
            boxShadow: "0 6px 24px rgba(79,70,229,0.35)",
          }}>
            Get Started Free <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
          <p style={{ marginTop: "12px", fontSize: "12px", color: T.muted }}>No credit card &nbsp;·&nbsp; Takes 2 minutes</p>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "1px", margin: "40px 0 0",
          background: T.border, borderRadius: "14px", overflow: "hidden",
        }}>
          {[{n:"1.5M+",l:"Students"},{n:"10K+",l:"Questions"},{n:"24/7",l:"AI Help"},{n:"Free",l:"Always"}].map((s,i)=>(
            <div key={i} style={{ padding:"16px 8px", textAlign:"center", background:T.surface }}>
              <div style={{ fontSize:"18px", fontWeight:900, color:T.primary }}>{s.n}</div>
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

      {/* ── TESTIMONIALS ── */}
      <div style={{ padding:"40px 20px", background:T.bg }}>
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:T.primary, letterSpacing:"2px" }}>STUDENT STORIES</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {TESTIMONIALS.map((t,i)=>(
            <div key={i} style={{ background:T.surface, borderRadius:"16px", padding:"16px", border:`1px solid ${T.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display:"flex", gap:"2px", marginBottom:"8px" }}>
                {[...Array(5)].map((_,j)=><Star key={j} size={14} color="#F7B928" fill="#F7B928" strokeWidth={0} />)}
              </div>
              <p style={{ fontSize:"13px", color:T.text, margin:"0 0 12px", lineHeight:1.55, fontStyle:"italic" }}>"{t.text}"</p>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:700, fontSize:"13px", color:T.text }}>{t.name}</span>
                <span style={{ fontSize:"12px", fontWeight:600, color:T.primary, background:T.primaryTint, padding:"4px 10px", borderRadius:"20px" }}>{t.score} · {t.school}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding:"56px 24px", background:`linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, textAlign:"center" }}>
        <img src="/icon-192.png" alt="Companion" width={60} height={60}
          style={{ borderRadius:"18px", margin:"0 auto 20px", display:"block", boxShadow:"0 8px 24px rgba(0,0,0,0.25)" }} />
        <h2 style={{ color:"#fff", fontSize:"26px", fontWeight:800, margin:"0 0 10px", letterSpacing:"-0.5px" }}>Ready to ace JAMB?</h2>
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"14px", margin:"0 0 28px" }}>
          Join thousands of students already using Companion
        </p>
        <Link href="/auth" style={{
          display:"inline-flex", alignItems:"center", gap:"8px",
          background:"#fff", color:T.primary,
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
