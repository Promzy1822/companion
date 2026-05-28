"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, PenTool } from "lucide-react";
import Navbar, { NAVBAR_HEIGHT } from "../components/Navbar";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { C, palette } from "../lib/design";

const SUBJECTS = [
  { id:"english",     name:"English Language", icon:"📝", color:"#1877F2" },
  { id:"mathematics", name:"Mathematics",       icon:"📐", color:"#7B3FBE" },
  { id:"physics",     name:"Physics",           icon:"⚡", color:"#B07D00" },
  { id:"chemistry",   name:"Chemistry",         icon:"🧪", color:"#0D8050" },
  { id:"biology",     name:"Biology",           icon:"🧬", color:"#C75B21" },
  { id:"government",  name:"Government",        icon:"🏛️", color:"#5B6ABF" },
  { id:"economics",   name:"Economics",         icon:"📊", color:"#0D8080" },
  { id:"literature",  name:"Literature",        icon:"📚", color:"#C75B21" },
  { id:"geography",   name:"Geography",         icon:"🌍", color:"#5B7A1C" },
  { id:"crs",         name:"CRS / IRS",         icon:"✝️", color:"#7B3FBE" },
];

function SubjectsContent() {
  const searchParams = useSearchParams();
  const mode    = searchParams.get("mode") || "learn";
  const router  = useRouter();
  const [dark,  setDark]  = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
    setReady(true);
  }, []);

  if (!ready) return null;

  const T = palette(dark);

  return (
    <div style={{ minHeight:"100vh", paddingTop:"56px", background:T.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar darkMode={dark} onToggleDark={() => { const n=!dark; setDark(n); localStorage.setItem("darkMode",String(n)); }} />

      {/* Page header */}
      <div style={{
        background: dark
          ? "linear-gradient(135deg,#1A2A4A,#1877F2)"
          : "linear-gradient(135deg,#1877F2,#0C5FD1)",
        padding: "20px 20px 32px",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <Link href="/" style={{
            width:34, height:34, borderRadius:"10px",
            backgroundColor:"rgba(255,255,255,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", textDecoration:"none", flexShrink:0,
          }}>
            <ArrowLeft size={16} color="#fff" strokeWidth={2} />
          </Link>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"18px" }}>
              {mode === "learn" ? "Learn" : "Practice"}
            </div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px" }}>
              {mode === "learn" ? "Choose a subject to study" : "Choose a subject to practice"}
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div style={{ display:"flex", gap:"8px", background:"rgba(255,255,255,0.12)", borderRadius:"12px", padding:"4px" }}>
          {(["learn","practice"] as const).map(m => {
            const Icon = m === "learn" ? BookOpen : PenTool;
            return (
              <button key={m} onClick={() => router.push(`/subjects?mode=${m}`)} style={{
                flex:1, padding:"10px", borderRadius:"9px", border:"none", cursor:"pointer",
                fontWeight:700, fontSize:"14px",
                background: mode===m ? "#fff" : "transparent",
                color: mode===m ? C.primary : "rgba(255,255,255,0.75)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
                transition:"all 0.2s",
                boxShadow: mode===m ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}>
                <Icon size={15} strokeWidth={2} />
                {m === "learn" ? "Learn" : "Practice"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding:"20px 14px 100px" }}>
        <div style={{ fontSize:"11px", color:T.sub, fontWeight:700, marginBottom:"14px", textTransform:"uppercase", letterSpacing:"1px" }}>
          Select Subject
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {SUBJECTS.map(s => (
            <Link key={s.id} href={`/questions?subject=${s.id}&mode=${mode}`} style={{ textDecoration:"none" }}>
              <div style={{
                background:T.surface, borderRadius:"16px", padding:"18px 14px",
                border:`1px solid ${T.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                cursor:"pointer", transition:"box-shadow 0.15s",
              }}>
                <div style={{ width:44, height:44, borderRadius:"12px", background:`${s.color}15`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"10px", fontSize:"22px" }}>
                  {s.icon}
                </div>
                <div style={{ fontWeight:700, color:T.text, fontSize:"13px", marginBottom:"3px" }}>{s.name}</div>
                <div style={{ fontSize:"11px", color:s.color, fontWeight:600 }}>
                  {mode === "learn" ? "Watch lessons →" : "Practice now →"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav darkMode={dark} />
    </div>
  );
}

export default function Subjects() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#F0F2F5", display:"flex", alignItems:"center", justifyContent:"center", color:"#65676B", fontFamily:"Arial" }}>Loading…</div>}>
      <SubjectsContent />
    </Suspense>
  );
}
