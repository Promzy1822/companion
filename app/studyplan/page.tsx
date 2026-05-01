"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  name: string;
  target: string;
  institution: string;
  course: string;
  subjects: string[];
  deadline: string;
  selfRating: string;
  recommendation?: string;
}

interface WeekPlan {
  week: number;
  focus: string;
  topics: { subject: string; topic: string; hours: number }[];
  goal: string;
}

export default function StudyPlan() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);

  useEffect(() => {
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const saved = localStorage.getItem("companion_study_plan");
    if (saved) { setPlan(JSON.parse(saved)); setGenerated(true); }
  }, []);

  const getDaysUntilExam = () => {
    if (!user?.deadline) return 90;
    const diff = new Date(user.deadline).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);
    const days = getDaysUntilExam();
    const weeks = Math.min(12, Math.ceil(days / 7));
    const prompt = `You are an expert JAMB study coach. Create a ${weeks}-week study plan for a Nigerian student.

Student Profile:
- Name: ${user.name}
- Target Score: ${user.target}/400
- Institution: ${user.institution}
- Course: ${user.course}
- Subjects: ${user.subjects.join(", ")}
- Days until exam: ${days}
- Self-assessment: ${["","Not ready at all","Just started","Making progress","Almost ready"][parseInt(user.selfRating)]}
- Admission insight: ${user.recommendation || "Standard preparation needed"}

Create exactly ${weeks} weeks. For each week return ONLY valid JSON array:
[
  {
    "week": 1,
    "focus": "Foundation Building",
    "goal": "Master basic concepts in all subjects",
    "topics": [
      {"subject": "Mathematics", "topic": "Algebra & Equations", "hours": 3},
      {"subject": "English Language", "topic": "Comprehension & Summary", "hours": 2}
    ]
  }
]

Rules:
- Distribute subjects evenly across weeks
- Increase difficulty progressively
- Week ${weeks}: focus on revision and past questions only
- Hours per topic should be 1-4
- Make topics specific to JAMB syllabus
- Return ONLY the JSON array, no other text`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const text = data.reply || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setPlan(parsed);
        localStorage.setItem("companion_study_plan", JSON.stringify(parsed));
        setGenerated(true);
      }
    } catch {
      // Fallback plan
      const fallback = generateFallbackPlan(user, weeks);
      setPlan(fallback);
      localStorage.setItem("companion_study_plan", JSON.stringify(fallback));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackPlan = (u: User, weeks: number): WeekPlan[] => {
    const subjects = u.subjects;
    return Array.from({ length: weeks }, (_, i) => ({
      week: i + 1,
      focus: i === weeks - 1 ? "Final Revision" : i >= weeks - 3 ? "Practice & Past Questions" : i < 2 ? "Foundation Building" : "Deep Learning",
      goal: i === weeks - 1 ? "Revise all topics and attempt full mock exams" : `Master key topics in ${subjects[i % subjects.length]}`,
      topics: subjects.map((sub, j) => ({
        subject: sub,
        topic: i === weeks - 1 ? "Revision & Past Questions" : `Core Topic ${i + 1}`,
        hours: j === 0 ? 3 : 2,
      })),
    }));
  };

  const daysLeft = getDaysUntilExam();
  const bg = darkMode ? "#0a0a0a" : "#f5f5f7";
  const cardBg = darkMode ? "#1c1c1e" : "#ffffff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";

  const SUBJECT_COLORS: Record<string, string> = {
    "English Language": "#3b82f6",
    "Mathematics": "#8b5cf6",
    "Physics": "#f59e0b",
    "Chemistry": "#10b981",
    "Biology": "#ec4899",
    "Government": "#6366f1",
    "Economics": "#14b8a6",
    "Literature in English": "#f97316",
    "Geography": "#84cc16",
    "CRS": "#a78bfa",
    "Commerce": "#06b6d4",
  };

  return (
    <div style={{ minHeight:"100vh", backgroundColor:bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)", padding:"20px 20px 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-30px", right:"-30px", width:"120px", height:"120px", borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
          <Link href="/" style={{ width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"16px", textDecoration:"none" }}>←</Link>
          <div>
            <div style={{ color:"#fff", fontWeight:"800", fontSize:"18px" }}>📅 My Study Plan</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px" }}>AI-generated • personalised for you</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
          {[
            { label:"Days Left", value: daysLeft > 999 ? "90+" : String(daysLeft), icon:"⏰" },
            { label:"Target", value: user?.target || "---", icon:"🎯" },
            { label:"Subjects", value: String(user?.subjects?.length || 0), icon:"📚" },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor:"rgba(255,255,255,0.12)", borderRadius:"12px", padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:"18px", marginBottom:"4px" }}>{s.icon}</div>
              <div style={{ color:"#fde68a", fontWeight:"900", fontSize:"18px" }}>{s.value}</div>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"10px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"20px 16px" }}>
        {!generated ? (
          <div style={{ backgroundColor:cardBg, borderRadius:"20px", padding:"32px 24px", textAlign:"center", boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.08)", border:`1px solid ${borderC}` }}>
            <div style={{ fontSize:"64px", marginBottom:"16px" }}>🤖</div>
            <h2 style={{ fontSize:"20px", fontWeight:"800", color:textColor, margin:"0 0 8px" }}>Generate Your Study Plan</h2>
            <p style={{ fontSize:"14px", color:subText, margin:"0 0 24px", lineHeight:"1.6" }}>
              Our AI will analyse your target score, subjects, institution cutoff and days remaining to create a personalised week-by-week plan.
            </p>
            {user && (
              <div style={{ backgroundColor: darkMode ? "#2c2c2e" : "#f5f5f7", borderRadius:"14px", padding:"16px", marginBottom:"24px", textAlign:"left" }}>
                <div style={{ fontSize:"13px", fontWeight:"700", color:textColor, marginBottom:"10px" }}>Your Profile Summary</div>
                {[
                  { label:"Institution", value: user.institution },
                  { label:"Course", value: user.course },
                  { label:"Target", value: `${user.target}/400` },
                  { label:"Subjects", value: user.subjects.join(", ") },
                ].map((item, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderBottom: i < 3 ? `1px solid ${borderC}` : "none" }}>
                    <span style={{ color:subText }}>{item.label}</span>
                    <span style={{ color:textColor, fontWeight:"600", textAlign:"right", maxWidth:"60%" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={generatePlan} disabled={loading} style={{ width:"100%", padding:"16px", borderRadius:"16px", border:"none", background: loading ? "#ccc" : "linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"800", fontSize:"16px", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 16px rgba(234,88,12,0.35)" }}>
              {loading ? "🤖 AI is building your plan..." : "✨ Generate My Plan"}
            </button>
            {loading && (
              <p style={{ fontSize:"12px", color:subText, marginTop:"12px" }}>This takes about 10-15 seconds...</p>
            )}
          </div>
        ) : (
          <div>
            {/* Week selector */}
            <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"4px", marginBottom:"16px", scrollbarWidth:"none" }}>
              {plan.map((w, i) => (
                <button key={i} onClick={() => setActiveWeek(i)} style={{ flexShrink:0, padding:"8px 16px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"700", backgroundColor: activeWeek === i ? "#ea580c" : darkMode ? "#2c2c2e" : "#f0f0f0", color: activeWeek === i ? "#fff" : subText, transition:"all 0.2s" }}>
                  W{w.week}
                </button>
              ))}
            </div>

            {/* Active week card */}
            {plan[activeWeek] && (
              <div style={{ backgroundColor:cardBg, borderRadius:"20px", overflow:"hidden", boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.08)", border:`1px solid ${borderC}`, marginBottom:"16px" }}>
                <div style={{ padding:"20px", background:"linear-gradient(135deg,#c2410c,#ea580c)", }}>
                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px", marginBottom:"4px" }}>WEEK {plan[activeWeek].week}</div>
                  <div style={{ color:"#fff", fontSize:"18px", fontWeight:"800" }}>{plan[activeWeek].focus}</div>
                  <div style={{ color:"rgba(255,255,255,0.85)", fontSize:"13px", marginTop:"6px", lineHeight:"1.5" }}>🎯 {plan[activeWeek].goal}</div>
                </div>
                <div style={{ padding:"16px" }}>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:subText, marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Topics This Week</div>
                  {plan[activeWeek].topics.map((t, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px", borderRadius:"12px", backgroundColor: darkMode ? "#2c2c2e" : "#f5f5f7", marginBottom:"8px" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", backgroundColor: SUBJECT_COLORS[t.subject] || "#ea580c", flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"13px", fontWeight:"700", color:textColor }}>{t.topic}</div>
                        <div style={{ fontSize:"12px", color: SUBJECT_COLORS[t.subject] || "#ea580c", fontWeight:"600" }}>{t.subject}</div>
                      </div>
                      <div style={{ backgroundColor: darkMode ? "#3a3a3c" : "#fff", padding:"5px 10px", borderRadius:"8px", fontSize:"12px", fontWeight:"700", color:textColor }}>
                        {t.hours}h
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop:"12px", padding:"12px 14px", borderRadius:"12px", backgroundColor: darkMode ? "#1a2a1a" : "#f0fdf4", border:"1px solid #86efac" }}>
                    <div style={{ fontSize:"12px", color:"#166534", fontWeight:"600" }}>
                      📊 Total this week: {plan[activeWeek].topics.reduce((sum, t) => sum + t.hours, 0)} hours
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regenerate */}
            <button onClick={() => { setGenerated(false); setPlan([]); localStorage.removeItem("companion_study_plan"); }} style={{ width:"100%", padding:"14px", borderRadius:"14px", border:`1.5px solid ${borderC}`, backgroundColor:"transparent", color:subText, fontWeight:"600", fontSize:"14px", cursor:"pointer" }}>
              🔄 Regenerate Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
