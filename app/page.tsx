import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuickLinks from "./components/QuickLinks";
import StreakCard from "./components/StreakCard";
import { C, D, palette } from "./lib/design";
import { RefreshCw, Calculator, Newspaper, ChevronDown, ChevronUp } from "lucide-react";
import Layout from "../components/Layout";

interface NewsItem { title:string; url:string; source:string; time:string; image?:string; category?:string; }
interface User { name:string; email:string; target:string; institution:string; subjects:string[]; course:string; }

const CATS = ["All","Education","Exams","Admissions","Tech","General"];
const IMGS = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
  "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80",
];

const catOf = (t:string) => {
  const l = t.toLowerCase();
  if (/exam|utme|waec|neco|result/.test(l)) return "Exams";
  if (/admission|cutoff|screening/.test(l)) return "Admissions";
  if (/tech|ai|digital/.test(l)) return "Tech";
  if (/university|polytechnic|school/.test(l)) return "Education";
  return "General";
};

const FALLBACK: NewsItem[] = [
  {title:"JAMB 2025 UTME Registration Portal Now Open",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"2h ago"},
  {title:"JAMB Releases Updated Syllabus for 2025 UTME",url:"https://www.jamb.gov.ng",source:"JAMB Official",time:"5h ago"},
  {title:"UNILAG Post-UTME Screening 2025: Dates Released",url:"#",source:"UNILAG Info",time:"1d ago"},
  {title:"How to Score 300+ in JAMB: Expert Study Tips",url:"#",source:"Education Guide",time:"1d ago"},
  {title:"CBT Centres: Approved JAMB Centres 2025",url:"#",source:"JAMB Guide",time:"2d ago"},
  {title:"OAU Cut-Off Marks for All Courses 2025",url:"#",source:"University News",time:"3d ago"},
];

export default function Home() {
  const router = useRouter();
  const [darkMode,   setDarkMode]   = useState(false);
  const [user,       setUser]       = useState<User|null>(null);
  const {
    filtered:  news,
    loading:   newsLoad,
    refreshing,
    refresh:   fetchNews,
    setCategory: setNewsCategory,
    lastUpdated: newsLastUpdated,
    isStale:   newsIsStale,
  } = useNews();
  const [cat,        setCat]        = useState("All");
  const [showCalc,   setShowCalc]   = useState(false);
  const [calcType,   setCalcType]   = useState<"jamb"|"aggregate">("aggregate");
  const [jambS,      setJambS]      = useState("");
  const [postS,      setPostS]      = useState("");
  const [result,     setResult]     = useState<{agg:number;jamb:number;post:number;grade:string;color:string}|null>(null);
  const [calcErr,    setCalcErr]    = useState("");
  const [pressed,    setPressed]    = useState<number|null>(null);
  const [ready,      setReady]      = useState(false);
  const T = palette(darkMode);

  useEffect(() => {
    const dm = localStorage.getItem("darkMode") === "true";
    setDarkMode(dm);
    const u = localStorage.getItem("companion_user");
    if (!u) { router.replace("/landing"); return; }
    setUser(JSON.parse(u));
    setReady(true);
    fetchNews();
  }, [router]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
  };

  const calcAggregate = () => {
    setCalcErr(""); setResult(null);
    const j = parseFloat(jambS), p = parseFloat(postS);
    if (isNaN(j)||j<0||j>400) { setCalcErr("Enter valid JAMB score (0-400)"); return; }
    if (calcType==="aggregate") {
      if (isNaN(p)||p<0||p>100) { setCalcErr("Enter valid Post-UTME score (0-100)"); return; }
      const jP=j/8, pP=p/2, agg=jP+pP;
      const grade=agg>=70?"Excellent":agg>=55?"Good":agg>=45?"Average":"Below average";
      const color=agg>=70?"#31A24C":agg>=55?C.primary:agg>=45?"#F7B928":"#FA3E3E";
      setResult({agg:+agg.toFixed(2),jamb:+jP.toFixed(2),post:+pP.toFixed(2),grade,color});
    } else {
      const sc=(j/400)*100;
      const grade=j>=300?"Excellent":j>=250?"Good":j>=200?"Average":"Below average";
      const color=j>=300?"#31A24C":j>=250?C.primary:j>=200?"#F7B928":"#FA3E3E";
      setResult({agg:+sc.toFixed(1),jamb:j,post:0,grade,color});
    }
  };

  if (!ready) return null;

  const filteredNews = cat === "All" ? news : news.filter(n=>n.category===cat);

  const hour = new Date().getHours();
  const greeting = hour<12 ? "Good morning" : hour<17 ? "Good afternoon" : "Good evening";

  return (
    <Layout title="Home" darkMode={darkMode} onToggleDark={toggleDark}>
      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-t from-primary to-primary/90">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">🎓</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Pass JAMB with<br/><span className="block">AI-Powered</span> Study Support</h1>
          </div>
          <p className="text-white/80 max-w-2xl mx-auto">
            Learn smarter, practice daily, and get instant answers from your AI tutor.
            Built specifically for Nigerian students.
          </p>
          <Link href="/auth" className="mt-6 inline-flex items-center px-6 py-3 bg-white text-primary font-semibold rounded-full text-lg shadow-md hover:bg-primary/10 transition-colors">
            Get Started Free <span className="ml-2">→</span>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n:"1.5M+", l:"Students"  },
            { n:"10K+",  l:"Questions" },
            { n:"24/7",  l:"AI Help"   },
            { n:"Free",  l:"Always"    },
          ].map((s,i)=>(
            <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">{s.n}</div>
              <div className="text-sm text-muted mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">FEATURES</h2>
            <h2 className="text-2xl font-bold text-center mb-2">Everything you need to pass</h2>
            <p className="text-muted max-w-xl mx-auto">No more switching between apps and websites</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "📚", color: "#0D8050", bg: "#E6F4EA", title: "Smart Lessons",    desc: "Curated video lessons for all JAMB subjects, organised by topic" },
              { icon: "🤖", color: C.primary, bg: "#E7F0FF", title: "AI Tutor 24/7",    desc: "Ask anything about JAMB — instant answers, every hour of the day" },
              { icon: "📋", color: "#C75B21", bg: "#FFF0E6", title: "Mock Exams",        desc: "AI-generated timed exams with full subject breakdown and debrief" },
              { icon: "📊", color: "#7B3FBE", bg: "#F3E8FF", title: "Track Progress",   desc: "Study streaks, performance analytics and personalised targets" },
              { icon: "🧮", color: "#B07D00", bg: "#FEF9E7", title: "Score Calculator", desc: "Instant JAMB aggregate and Post-UTME score calculations" },
              { icon: "📰", color: "#D0021B", bg: "#FEE2E2", title: "JAMB News",         desc: "Live updates on JAMB announcements, results and deadlines" },
            ].map((f,i)=>(
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border/20">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl" style={{ backgroundColor: f.bg }}>
                  <span className="text-lg">{f.icon}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-12 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Quick Access</h2>
          <QuickLinks darkMode={darkMode} />
        </div>
      </section>

      {/* Streak Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Study Streak</h2>
          <StreakCard darkMode={darkMode} />
        </div>
      </section>

      {/* News Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">JAMB News</h2>
            <div className="flex flex-wrap items-center gap-2">
              {CATS.map(c=>(
                <button
                  key={c}
                  onClick={()=>setCat(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium
                           ${cat===c ? 'bg-primary text-white' : 'bg-surface2 text-muted'}
                           hover:bg-primary/10 transition-colors`}
                >
                  {c}
                </button>
              ))}
              <button
                onClick={()=>fetchNews(true)}
                className="ml-2 flex items-center gap-1 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {newsLoad ? (
              <div className="space-y-4">
                {[0,1,2].map(i=>(
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-1/2">
                      <div className="h-2 w-full rounded bg-surface2"></div>
                      <div className="h-1.5 w-1/2 rounded bg-surface2 mt-2"></div>
                    </div>
                    <div className="flex-shrink-0 w-12 h-12 rounded bg-surface2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {(filteredNews.length ? filteredNews : news).map((item,i)=>(
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-t border-border/20 first:border-t-0"
                    onMouseDown={()=>setPressed(i)}
                    onMouseUp={()=>setPressed(null)}
                    onTouchStart={()=>setPressed(i)}
                    onTouchEnd={()=>setPressed(null)}
                  >
                    <div className="flex items-start gap-4 py-4"
                         className:pressed===i ? "bg-surface2" : "transparent"
                         style={{ backgroundColor: pressed===i ? 'var(--color-surface2)' : 'transparent' }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={e=>{(e.target as HTMLImageElement).style.display="none"}}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-primary">{item.source}</span>
                          <span className="text-xs text-muted">·</span>
                          <span className="text-xs text-muted">{item.time}</span>
                        </div>
                        <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}

                <div className="pt-4 border-t border-border/20">
                  <button
                    onClick={()=>fetchNews(true)}
                    className="w-full flex items-center justify-center text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    {refreshing ? "Refreshing..." : "Refresh news"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      {showCalc && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Score Calculator</h2>
              <button
                onClick={()=>{setShowCalc(false);setResult(null);setCalcErr("");}}
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Score Calculator</h3>
                  <p className="text-sm text-muted">JAMB and Aggregate formula</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  key="aggregate"
                  onClick={()=>{setCalcType("aggregate");setResult(null);setCalcErr("");}}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold
                           ${calcType==='aggregate' ? 'bg-primary text-white' : 'bg-surface2 text-muted'}
                           hover:bg-primary/10 transition-colors`}
                >
                  Aggregate
                </button>
                <button
                  key="jamb"
                  onClick={()=>{setCalcType("jamb");setResult(null);setCalcErr("");}}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold
                           ${calcType==='jamb' ? 'bg-primary text-white' : 'bg-surface2 text-muted'}
                           hover:bg-primary/10 transition-colors`}
                >
                  JAMB Only
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">JAMB Score (0-400)</label>
                  <input
                    type="number"
                    min="0"
                    max="400"
                    placeholder="e.g. 285"
                    value={jambS}
                    onChange={e=>setJambS(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {calcType==="aggregate" && (
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Post-UTME Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 72"
                      value={postS}
                      onChange={e=>setPostS(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border/20 bg-surface2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs mt-2 font-medium text-primary">
                      Formula: (JAMB / 8) + (Post-UTME / 2)
                    </p>
                  </div>
                )}

                {calcErr && (
                  <div className="px-4 py-2 rounded-lg bg-danger/10 text-danger">
                    {calcErr}
                  </div>
                )}

                <button
                  onClick={calcAggregate}
                  className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Calculate
                </button>

                {result && (
                  <div className="mt-6">
                    <div className="text-center">
                      <div className="text-5xl font-extrabold" style={{ color: result.color }}>
                        {result.agg}
                      </div>
                      <div className="text-lg font-bold mt-2" style={{ color: result.color }}>
                        {result.grade}
                      </div>
                    </div>

                    {calcType==="aggregate" && (
                      <div className="mt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">JAMB contribution</span>
                          <span className="font-medium">{jambS} / 8 = {result.jamb}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Post-UTME contribution</span>
                          <span className="font-medium">{postS} / 2 = {result.post}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-border/20 pt-3">
                          <span className="text-muted">Total Aggregate</span>
                          <span className="font-medium text-lg">{result.agg}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}