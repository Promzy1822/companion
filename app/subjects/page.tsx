"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, PenTool } from "lucide-react";
import Layout from "../components/Layout";

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

  return (
    <Layout title={mode === "learn" ? "Learn" : "Practice"} darkMode={dark} onToggleDark={() => { const n=!dark; setDark(n); localStorage.setItem("darkMode",String(n)); }} showNavbar showBottomNav>
      {/* Page content */}
      <div className="flex-1 w-full overflow-y-auto p-6 pt-10 pb-6"
           style={{ paddingTop: "80px", paddingBottom: "20px" }}>
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center hover:bg-surface3 transition-colors">
              <ArrowLeft size={16} color={dark ? '#E4E6EB' : '#050505'} strokeWidth={2} />
            </Link>
            <div>
              <div className="font-bold text-xl">{mode === "learn" ? "Learn" : "Practice"}</div>
              <div className="text-sm text-muted">
                {mode === "learn" ? "Choose a subject to study" : "Choose a subject to practice"}
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 rounded-md border border-surface2/20 bg-surface2/10 px-2 py-1">
            {(["learn","practice"] as const).map(m => {
              const Icon = m === "learn" ? BookOpen : PenTool;
              return (
                <button key={m} onClick={() => router.push(`/subjects?mode=${m}`)} className={`flex-1 flex items-center justify-center gap-1 text-sm font-medium rounded px-2 py-1
                  ${mode === m ? 'bg-primary text-white' : 'text-muted hover:bg-surface2/50'}
                  transition-colors`}>
                  <Icon size={14} strokeWidth={1.8} />
                  {m === "learn" ? "Learn" : "Practice"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-uppercase tracking-wider text-muted mb-2">
            Select Subject
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SUBJECTS.map(s => (
              <Link key={s.id} href={`/questions?subject=${s.id}&mode=${mode}`} className="block no-underline">
                <div className="flex flex-col items-center py-4 px-3 rounded-lg border border-surface2/20 bg-surface hover:bg-surface2/10 transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                       style={{ backgroundColor: `${s.color}15` }}>
                    <span style={{ fontSize: "1.5rem" }}>{s.icon}</span>
                  </div>
                  <div className="font-semibold text-center">{s.name}</div>
                  <div className="text-xs text-muted text-center mt-1">
                    {mode === "learn" ? "Watch lessons →" : "Practice now →"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function Subjects() {
  return (
    <Suspense fallback={<div className="flex min-h-[100vh] items-center justify-center bg-surface text-muted">Loading…</div>}>
      <SubjectsContent />
    </Suspense>
  );
}