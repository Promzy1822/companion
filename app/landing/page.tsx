"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "./components/Layout";
import { C } from "../lib/design";
import { BookOpen, Bot, BarChart3, Newspaper, Calculator, ClipboardList, CheckCircle, ArrowRight, Star } from "lucide-react";

export default function Landing() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("companion_user");
    if (user) { router.replace("/"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const FEATURES = [
    { icon: BookOpen,      color: "#0D8050", bg: "#E6F4EA", title: "Smart Lessons",    desc: "Curated video lessons for all JAMB subjects, organised by topic" },
    { icon: Bot,           color: C.primary, bg: "#E7F0FF", title: "AI Tutor 24/7",    desc: "Ask anything about JAMB — instant answers, every hour of the day" },
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
    { name: "Amaka O.", score: "321", school: "UNILAG", text: "Companion helped me focus on the right topics. I scored 321!" },
    { name: "Emeka C.", score: "298", school: "OAU",    text: "The AI tutor explained things my teacher couldn't. Got into OAU!" },
    { name: "Fatima B.", score: "304", school: "UNILORIN", text: "I practiced past questions daily. This app is a game changer." },
  ];

  return (
    <Layout title="Companion — AI-Powered JAMB Study Support" darkMode={false} onToggleDark={() => {}} showNavbar={false} showBottomNav={false}>
      {/* Page content */}
      <div className="flex-1 w-full overflow-y-auto p-6 pt-10 pb-6"
           style={{ paddingTop: "80px", paddingBottom: "20px" }}>

        {/* ── NAV ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="Companion" width={28} height={28}
                className="rounded" />
              <span className="font-bold text-xl text-tracking-tight">
                Companion
              </span>
            </div>
            <Link href="/auth" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors">
              Log In
            </Link>
          </div>
        </div>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="relative">
            {/* Floating orbs */}
            <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-primary/5" />
            <div className="absolute bottom-0 -left-16 w-48 h-48 rounded-full bg-primary/3" />

            <div className="relative z-10 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-surface2/20 rounded-full px-4 py-1 mb-6">
                <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium text-muted">Nigeria's #1 JAMB Study App</span>
              </div>

              {/* Logo */}
              <div className="mb-4">
                <img src="/icon-192.png" alt="Companion" width={80} height={80}
                  className="rounded-lg shadow-lg" />
              </div>

              <h1 className="text-4xl font-bold text-center mb-4 text-tracking-tight">
                Pass JAMB with<br />
                <span className="text-primary">AI-Powered</span> Study Support
              </h1>
              <p className="text-lg text-center text-muted max-w-2xl mx-auto">
                Learn smarter, practice daily, and get instant answers from your AI tutor.
                Built specifically for Nigerian students.
              </p>

              <Link href="/auth" className="mt-6 inline-flex items-center gap-3 bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-lg">
                Get Started Free <ArrowRight size={18} strokeWidth={2.2} />
              </Link>
              <p className="mt-3 text-xs text-muted">
                No credit card &nbsp;·&nbsp; Takes 2 minutes
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 gap-4 text-center bg-surface rounded-lg border border-surface2/20 md:grid-cols-4">
            {[
              { n:"1.5M+", l:"Students"  },
              { n:"10K+",  l:"Questions" },
              { n:"24/7",  l:"AI Help"   },
              { n:"Free",  l:"Always"    },
            ].map((s,i)=>(
              <div key={i}>
                <div className="text-2xl font-bold text-primary">{s.n}</div>
                <div className="text-sm text-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="mb-4">
            <div className="text-xs font-medium text-primary tracking-wider mb-1">FEATURES</div>
            <h2 className="text-2xl font-bold text-center mb-2">Everything you need to pass</h2>
            <p className="text-center text-muted max-w-3xl mx-auto">
              No more switching between apps and websites
            </p>
          </div>
          <div className="grid gap-4">
            {FEATURES.map((f,i)=>(
              <div key={i} className="bg-surface rounded-xl border border-surface2/20 p-6 hover:bg-surface2/50 transition-colors">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                       style={{ backgroundColor: f.bg }}>
                    <f.icon size={20} strokeWidth={1.8} color={f.color} />
                  </div>
                </div>
                <h3 className="font-semibold text-center">{f.title}</h3>
                <p className="text-center text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="mb-4">
            <div className="text-xs font-medium text-primary tracking-wider mb-1">HOW IT WORKS</div>
            <h2 className="text-2xl font-bold text-center mb-2">Simple. Effective. Fast.</h2>
          </div>
          <div className="grid gap-6">
            {STEPS.map((s,i)=>(
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-medium">{s.title}</h3>
                  <p className="text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TESTIMONIALS ────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="mb-4">
            <div className="text-xs font-medium text-primary tracking-wider mb-1">STUDENT STORIES</div>
          </div>
          <div className="space-y-4">
            {TESTIMONIALS.map((t,i)=>(
              <div key={i} className="bg-surface rounded-xl border border-surface2/20 p-6">
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_,j)=><Star key={j} size={14} color="#F7B928" fill="#F7B928" strokeWidth={0} />)}
                </div>
                <p className="italic text-muted">{t.text}"</p>
                <div className="mt-3 flex justify-between items-center text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded">
                    {t.score} · {t.school}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="text-center">
          <div className="mb-6">
            <img src="/icon-192.png" alt="Companion" width={60} height={60}
              className="rounded-lg shadow-lg mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Ready to ace JAMB?</h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Join thousands of students already using Companion
            </p>
          </div>
          <Link href="/auth" className="inline-flex items-center gap-3 bg-white text-primary font-bold py-3 px-6 rounded-lg hover:bg-white/90 transition-colors shadow-lg">
            Create Free Account <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
          <p className="mt-4 text-xs text-white/60">
            No credit card required
          </p>
        </div>
      </div>
    </Layout>
  );
}