"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLogo from "../components/AppLogo";

export default function Landing() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("companion_user");
    if (user) { router.replace("/"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const features = [
    { icon:"📚", title:"Smart Lessons", desc:"Curated YouTube video lessons for all JAMB subjects, organised by topic" },
    { icon:"✏️", title:"Past Questions", desc:"Practice with thousands of real JAMB past questions with full explanations" },
    { icon:"🤖", title:"AI Tutor", desc:"Ask anything 24/7 — your personal JAMB expert that never gets tired" },
    { icon:"📊", title:"Track Progress", desc:"Study streaks and performance tracking per subject" },
    { icon:"🧮", title:"Calculators", desc:"JAMB aggregate and Post-UTME score calculators for all universities" },
    { icon:"📰", title:"JAMB News", desc:"Live updates on JAMB announcements, results and deadlines" },
  ];

  const steps = [
    { n:"1", title:"Create Account", desc:"Sign up with your email and tell us your target school and course" },
    { n:"2", title:"Get Your Plan", desc:"We build a personalised study plan based on your exam date and subjects" },
    { n:"3", title:"Study Smart", desc:"Learn, practice and ask AI — all in one place, anytime" },
    { n:"4", title:"Ace JAMB", desc:"Hit your target score and secure your admission" },
  ];

  const testimonials = [
    { name:"Amaka O.", score:"321", school:"UNILAG", text:"Companion helped me focus on the right topics. I scored 321!" },
    { name:"Emeka C.", score:"298", school:"OAU", text:"The AI tutor explained things my teacher couldn't. Got into OAU!" },
    { name:"Fatima B.", score:"304", school:"UNILORIN", text:"I practiced past questions daily. This app is a game changer." },
  ];

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", backgroundColor:"#fff", overflowX:"hidden" }}>

      {/* HERO */}
      <div style={{ background:"linear-gradient(160deg,#431407 0%,#7c2d12 25%,#c2410c 60%,#f97316 100%)", padding:"0 0 60px", minHeight:"100vh", display:"flex", flexDirection:"column" }}>

        {/* Nav — real logo */}
        <div style={{ padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <AppLogo size={32} showText={true} subTextColor="rgba(255,255,255,0.0)" />
          <Link href="/auth" style={{ color:"rgba(255,255,255,0.9)", fontSize:"13px", textDecoration:"none", padding:"7px 16px", border:"1px solid rgba(255,255,255,0.4)", borderRadius:"20px", fontWeight:"600" }}>Log In</Link>
        </div>

        {/* Hero content */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"20px 24px 0", textAlign:"center" }}>

          {/* Large logo in hero */}
          <div style={{ margin:"0 auto 24px" }}>
            <img
              src="/icon-192.png"
              alt="Companion"
              width={88}
              height={88}
              style={{ borderRadius:"22px", display:"block", boxShadow:"0 12px 40px rgba(0,0,0,0.3)" }}
            />
          </div>

          <div style={{ display:"inline-block", margin:"0 auto 16px", padding:"6px 16px", borderRadius:"20px", backgroundColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.9)", fontSize:"12px", fontWeight:"600" }}>
            🔥 Nigeria's #1 AI JAMB Study App
          </div>
          <h1 style={{ color:"#fff", fontSize:"36px", fontWeight:"900", lineHeight:"1.15", margin:"0 0 16px", letterSpacing:"-1px" }}>
            Pass JAMB with<br /><span style={{ color:"#fde68a" }}>AI-Powered</span><br />Study Support
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)", fontSize:"15px", lineHeight:"1.6", margin:"0 0 32px" }}>
            Learn smarter, practice daily, and get instant answers. Built specifically for Nigerian students.
          </p>
          <Link href="/auth" style={{ display:"block", padding:"18px 32px", borderRadius:"30px", backgroundColor:"#fff", color:"#c2410c", fontWeight:"800", fontSize:"17px", textDecoration:"none", boxShadow:"0 8px 32px rgba(0,0,0,0.25)", marginBottom:"16px" }}>
            Get Started Free →
          </Link>
          <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"12px", margin:0 }}>No credit card • Takes 2 minutes</p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", margin:"40px 24px 0", borderRadius:"16px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.15)" }}>
          {[{n:"1.5M+",l:"Students"},{n:"10K+",l:"Questions"},{n:"24/7",l:"AI Help"},{n:"Free",l:"Always"}].map((s,i)=>(
            <div key={i} style={{ padding:"16px 8px", textAlign:"center", backgroundColor:"rgba(255,255,255,0.08)", borderRight:i<3?"1px solid rgba(255,255,255,0.1)":"none" }}>
              <div style={{ color:"#fde68a", fontWeight:"900", fontSize:"18px" }}>{s.n}</div>
              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:"10px", marginTop:"2px" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding:"48px 24px", backgroundColor:"#fafafa" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"12px", fontWeight:"700", color:"#ea580c", letterSpacing:"2px", marginBottom:"8px" }}>FEATURES</div>
          <h2 style={{ fontSize:"26px", fontWeight:"800", color:"#1a1a1a", margin:"0 0 8px" }}>Everything in one app</h2>
          <p style={{ fontSize:"14px", color:"#999", margin:0 }}>No more switching between apps and websites</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {features.map((f,i)=>(
            <div key={i} style={{ backgroundColor:"#fff", borderRadius:"16px", padding:"20px 16px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", border:"1px solid #f0f0f0" }}>
              <div style={{ fontSize:"28px", marginBottom:"10px" }}>{f.icon}</div>
              <div style={{ fontWeight:"700", fontSize:"14px", color:"#1a1a1a", marginBottom:"6px" }}>{f.title}</div>
              <div style={{ fontSize:"12px", color:"#888", lineHeight:"1.5" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding:"48px 24px", backgroundColor:"#fff" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"12px", fontWeight:"700", color:"#ea580c", letterSpacing:"2px", marginBottom:"8px" }}>HOW IT WORKS</div>
          <h2 style={{ fontSize:"26px", fontWeight:"800", color:"#1a1a1a", margin:0 }}>Simple. Effective. Fast.</h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ display:"flex", gap:"16px", alignItems:"flex-start" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#c2410c,#ea580c)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"900", fontSize:"16px", boxShadow:"0 4px 12px rgba(234,88,12,0.3)" }}>{s.n}</div>
              <div style={{ paddingTop:"4px" }}>
                <div style={{ fontWeight:"700", fontSize:"15px", color:"#1a1a1a", marginBottom:"4px" }}>{s.title}</div>
                <div style={{ fontSize:"13px", color:"#888", lineHeight:"1.5" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ padding:"40px 24px", backgroundColor:"#fff8f5" }}>
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ fontSize:"12px", fontWeight:"700", color:"#ea580c", letterSpacing:"2px" }}>STUDENT STORIES</div>
        </div>
        {testimonials.map((t,i)=>(
          <div key={i} style={{ backgroundColor:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #fed7aa", marginBottom:"12px" }}>
            <div style={{ display:"flex", gap:"2px", marginBottom:"8px" }}>{"⭐⭐⭐⭐⭐".split("").map((s,j)=><span key={j} style={{ fontSize:"14px" }}>{s}</span>)}</div>
            <p style={{ fontSize:"13px", color:"#555", margin:"0 0 12px", lineHeight:"1.5", fontStyle:"italic" }}>"{t.text}"</p>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontWeight:"700", fontSize:"13px", color:"#1a1a1a" }}>{t.name}</div>
              <div style={{ fontSize:"12px", color:"#ea580c", fontWeight:"600", backgroundColor:"#fff8f5", padding:"4px 10px", borderRadius:"20px" }}>{t.score} • {t.school}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FINAL CTA */}
      <div style={{ padding:"48px 24px", background:"linear-gradient(135deg,#7c2d12,#c2410c,#ea580c)", textAlign:"center" }}>
        <img src="/icon-192.png" alt="Companion" width={64} height={64} style={{ borderRadius:"18px", margin:"0 auto 20px", display:"block", boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }} />
        <h2 style={{ color:"#fff", fontSize:"26px", fontWeight:"800", margin:"0 0 12px" }}>Ready to ace JAMB?</h2>
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"14px", margin:"0 0 28px" }}>Join thousands of students already using Companion</p>
        <Link href="/auth" style={{ display:"block", padding:"18px", borderRadius:"30px", backgroundColor:"#fff", color:"#c2410c", fontWeight:"800", fontSize:"17px", textDecoration:"none", boxShadow:"0 8px 24px rgba(0,0,0,0.2)", marginBottom:"16px" }}>
          Create Free Account →
        </Link>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", margin:0 }}>No credit card required</p>
      </div>
    </div>
  );
}
