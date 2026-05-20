"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Progress, todayWAT } from "../lib/progress";
import { buildScheduleTopics, JAMB_TOPICS } from "../lib/jamb-topics";

interface User { name:string; target:string; institution:string; course:string; subjects:string[]; deadline:string; selfRating:string; recommendation?:string; }
interface DayPlan { day:number; date:string; subject:string; topic:string; subtopic:string; hours:number; done:boolean; type:"study"|"practice"|"rest"; }
interface WeekPlan { week:number; focus:string; goal:string; days:DayPlan[]; }

function getDaysLeft(deadline?: string): number {
  if (deadline) { const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000); if (d > 0) return d; }
  return 90;
}

function getFocusName(week: number, total: number): string {
  if (week === 1) return "Foundation & Orientation";
  if (week === 2) return "Core Concepts";
  if (week <= Math.ceil(total * 0.4)) return "Deep Learning";
  if (week <= Math.ceil(total * 0.7)) return "Application & Practice";
  if (week <= total - 2) return "Intensive Practice";
  if (week === total - 1) return "Mock Exam & Review";
  return "Final Revision";
}

export default function StudyPlan() {
  const [user, setUser]     = useState<User | null>(null);
  const [plan, setPlan]     = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [view, setView]     = useState<"today"|"week"|"overview">("today");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
    const saved = localStorage.getItem("companion_study_plan_v2");
    if (saved) { setPlan(JSON.parse(saved)); setGenerated(true); }
    // Set active week to current
    if (saved) {
      const p: WeekPlan[] = JSON.parse(saved);
      const today = todayWAT();
      const idx = p.findIndex(w => w.days.some(d => d.date === today));
      if (idx >= 0) setActiveWeek(idx);
    }
  }, []);

  const markDone = (weekIdx: number, dayIdx: number) => {
    const updated = plan.map((w, wi) =>
      wi !== weekIdx ? w : {
        ...w,
        days: w.days.map((d, di) => di !== dayIdx ? d : { ...d, done: true })
      }
    );
    setPlan(updated);
    localStorage.setItem("companion_study_plan_v2", JSON.stringify(updated));
    // Record to progress tracker — this updates the streak!
    const day = updated[weekIdx].days[dayIdx];
    Progress.recordActivity("plan", { subject: day.subject, topicId: day.topic });
  };

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);

    const days = getDaysLeft(user.deadline);
    const weeks = Math.min(14, Math.max(2, Math.ceil(days / 7)));
    const subjects = user.subjects?.length ? user.subjects : ["English Language", "Mathematics"];
    const weakSubs = Progress.getWeakSubjects(subjects);

    // Build schedule using our real topics library
    const scheduleTopics = buildScheduleTopics(subjects, weeks, weakSubs);

    const prompt = `You are an expert JAMB study coach creating a personalised study plan for a Nigerian student.

STUDENT PROFILE:
- Name: ${user.name}
- Target Score: ${user.target}/400
- Institution: ${user.institution}
- Course: ${user.course}  
- Subjects: ${subjects.join(", ")}
- Days to JAMB: ${days}
- Preparation Level: ${["","Not ready at all","Just started","Making good progress","Almost ready"][parseInt(user.selfRating)||2]}
- Weak Subjects Detected: ${weakSubs.length ? weakSubs.join(", ") : "None yet"}
- Admission Advice: ${user.recommendation || "Standard preparation needed"}

AVAILABLE JAMB TOPICS TO USE (use these EXACT topic names, do NOT invent generic ones):
${subjects.map(s => `${s}: ${(JAMB_TOPICS[s]||[]).map(t=>t.topic).join(", ")}`).join("\n")}

Generate exactly ${weeks} weeks. Each week has study days and 1 rest day. 
Return ONLY a valid JSON array with NO other text:
[
  {
    "week": 1,
    "focus": "Foundation & Orientation",
    "goal": "Establish strong foundation in key areas",
    "days": [
      {"day":1,"subject":"Mathematics","topic":"Number & Numeration","subtopic":"Surds & Indices","hours":2,"type":"study"},
      {"day":2,"subject":"English Language","topic":"Comprehension Passages","subtopic":"Vocabulary in Context","hours":2,"type":"study"},
      {"day":3,"subject":"Physics","topic":"Kinematics & Dynamics","subtopic":"SUVAT Equations","hours":2,"type":"study"},
      {"day":4,"subject":"Mathematics","topic":"Polynomials & Equations","subtopic":"Quadratic Equations","hours":2,"type":"study"},
      {"day":5,"subject":"ALL","topic":"Practice & Past Questions","subtopic":"Mixed Subjects","hours":2,"type":"practice"},
      {"day":6,"subject":"Chemistry","topic":"Atomic Structure & Bonding","subtopic":"Electronic Configuration","hours":2,"type":"study"},
      {"day":7,"subject":"REST","topic":"Rest Day","subtopic":"Review notes","hours":0,"type":"rest"}
    ]
  }
]

RULES:
- Use ONLY topic names from the list above — no generic "Core Topic 1" or "Topic 2"
- Distribute subjects evenly, but give extra coverage to weak subjects in early weeks
- Increase difficulty progressively: foundation → medium → advanced
- Final 2 weeks: focus entirely on past questions and revision
- Each week has exactly 7 days, with 1 rest day
- Practice days have type "practice", rest days have type "rest", study days have type "study"
- Return ONLY the JSON array, nothing else`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const text = data.reply || "";
      const match = text.match(/\[[\s\S]*\]/);

      if (match) {
        let parsed: WeekPlan[] = JSON.parse(match[0]);

        // Assign real dates to each day starting from today
        const startDate = new Date(Date.now() + 60 * 60 * 1000);
        let dayOffset = 0;

        parsed = parsed.map(week => ({
          ...week,
          days: week.days.map(day => {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + dayOffset);
            dayOffset++;
            return { ...day, date: d.toISOString().slice(0, 10), done: false };
          }),
        }));

        setPlan(parsed);
        localStorage.setItem("companion_study_plan_v2", JSON.stringify(parsed));
        setGenerated(true);
        setActiveWeek(0);
        setView("today");
      } else {
        // Fallback using our topics library
        const fallback = generateFallback(subjects, weeks, weakSubs, startDate);
        setPlan(fallback);
        localStorage.setItem("companion_study_plan_v2", JSON.stringify(fallback));
        setGenerated(true);
      }
    } catch {
      const startDate = new Date(Date.now() + 60 * 60 * 1000);
      const fallback = generateFallback(subjects, weeks, weakSubs, startDate);
      setPlan(fallback);
      localStorage.setItem("companion_study_plan_v2", JSON.stringify(fallback));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  function generateFallback(subjects: string[], weeks: number, weakSubs: string[], startDate: Date): WeekPlan[] {
    const scheduled = buildScheduleTopics(subjects, weeks, weakSubs);
    let topicIdx = 0;
    let dayOffset = 0;

    return Array.from({ length: weeks }, (_, wi) => {
      const weekTopics: WeekPlan["days"] = [];
      for (let di = 0; di < 7; di++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + dayOffset);
        dayOffset++;

        const isRest = di === 6;
        const isPractice = di === 4;
        const t = !isRest && !isPractice ? scheduled[topicIdx++] : null;

        weekTopics.push({
          day: di + 1,
          date: d.toISOString().slice(0, 10),
          subject: isRest ? "REST" : isPractice ? "ALL" : (t?.subject || subjects[0]),
          topic: isRest ? "Rest Day" : isPractice ? "Practice & Past Questions" : (t?.topic || "Revision"),
          subtopic: isRest ? "Relax & recharge" : isPractice ? "Mixed Subjects" : (t?.subtopic || "Review notes"),
          hours: isRest ? 0 : isPractice ? 2 : (t?.hours || 2),
          done: false,
          type: isRest ? "rest" : isPractice ? "practice" : "study",
        });
      }

      return {
        week: wi + 1,
        focus: getFocusName(wi + 1, weeks),
        goal: `Complete all ${subjects.length} subjects for week ${wi + 1}`,
        days: weekTopics,
      };
    });
  }

  if (!mounted) return null;

  const daysLeft = getDaysLeft(user?.deadline);
  const bg = darkMode ? "#0a0a0a" : "#f5f5f7";
  const card = darkMode ? "#1c1c1e" : "#fff";
  const text = darkMode ? "#f2f2f7" : "#1c1c1e";
  const sub  = darkMode ? "#98989d" : "#6e6e73";
  const bord = darkMode ? "#2c2c2e" : "#e5e5ea";
  const muted = darkMode ? "#2c2c2e" : "#f2f2f7";

  const SUBJECT_COLORS: Record<string, string> = {
    "English Language":"#3b82f6","Mathematics":"#8b5cf6","Physics":"#f59e0b",
    "Chemistry":"#10b981","Biology":"#ec4899","Government":"#6366f1",
    "Economics":"#14b8a6","Literature in English":"#f97316","Geography":"#84cc16",
    "CRS":"#a78bfa","Commerce":"#06b6d4","ALL":"#ea580c","REST":"#6b7280",
  };

  const today = todayWAT();
  const todayTask = plan.flatMap(w => w.days).find(d => d.date === today);
  const activeDays = Progress.getActiveDays();
  const completedCount = plan.flatMap(w => w.days).filter(d => d.done || activeDays.has(d.date)).length;
  const totalStudyDays = plan.flatMap(w => w.days).filter(d => d.type !== "rest").length;
  const progressPct = totalStudyDays ? Math.round((completedCount / totalStudyDays) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)", padding: "20px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <Link href="/" style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", textDecoration: "none" }}>←</Link>
          <div>
            <div style={{ color: "#fff", fontWeight: "800", fontSize: "18px" }}>My Study Plan</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Real JAMB topics · Personalised for you</div>
          </div>
          {generated && (
            <div style={{ marginLeft: "auto", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "5px 12px", fontSize: "12px", color: "#fde68a", fontWeight: "700" }}>
              {progressPct}% done
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[
            { label: "Days Left", value: daysLeft > 999 ? "90+" : String(daysLeft), icon: "⏰" },
            { label: "Target",    value: user?.target || "—",                        icon: "🎯" },
            { label: "Subjects",  value: String(user?.subjects?.length || 0),         icon: "📚" },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>{s.icon}</div>
              <div style={{ color: "#fde68a", fontWeight: "900", fontSize: "18px" }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {!generated ? (
          <div style={{ backgroundColor: card, borderRadius: "20px", padding: "28px 24px", textAlign: "center", border: `1px solid ${bord}`, boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📅</div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: text, margin: "0 0 10px" }}>Generate Your Study Plan</h2>
            <p style={{ fontSize: "14px", color: sub, margin: "0 0 22px", lineHeight: "1.6" }}>
              AI will build a day-by-day plan using real JAMB topics, tailored to your subjects, target score and exam date.
            </p>

            {user && (
              <div style={{ backgroundColor: muted, borderRadius: "14px", padding: "16px", marginBottom: "22px", textAlign: "left" }}>
                {[
                  { label: "Subjects", value: user.subjects?.join(", ") || "—" },
                  { label: "Target",   value: `${user.target}/400`         },
                  { label: "Days",     value: `${daysLeft} days left`      },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "7px 0", borderBottom: i < 2 ? `1px solid ${bord}` : "none" }}>
                    <span style={{ color: sub }}>{r.label}</span>
                    <span style={{ color: text, fontWeight: "600" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={generatePlan} disabled={loading} style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: loading ? "#ccc" : "linear-gradient(135deg,#c2410c,#ea580c)", color: "#fff", fontWeight: "800", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 16px rgba(234,88,12,0.35)" }}>
              {loading ? "🤖 AI is building your plan..." : "✨ Generate My Plan"}
            </button>
            {loading && <p style={{ fontSize: "12px", color: sub, marginTop: "10px" }}>This takes about 15–20 seconds…</p>}
          </div>

        ) : (
          <div>
            {/* View switcher */}
            <div style={{ display: "flex", gap: "6px", backgroundColor: muted, borderRadius: "14px", padding: "4px", marginBottom: "16px" }}>
              {(["today", "week", "overview"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "700", backgroundColor: view === v ? "#ea580c" : "transparent", color: view === v ? "#fff" : sub, transition: "all 0.2s", textTransform: "capitalize" }}>
                  {v === "today" ? "📌 Today" : v === "week" ? "📆 Week" : "🗓 Overview"}
                </button>
              ))}
            </div>

            {/* TODAY VIEW */}
            {view === "today" && (
              <div>
                {todayTask ? (
                  <div style={{ backgroundColor: card, borderRadius: "20px", overflow: "hidden", border: `1px solid ${bord}`, boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "14px" }}>
                    <div style={{ padding: "20px", background: `linear-gradient(135deg,${SUBJECT_COLORS[todayTask.subject] || "#ea580c"}22,${SUBJECT_COLORS[todayTask.subject] || "#ea580c"}11)`, borderBottom: `1px solid ${bord}` }}>
                      <div style={{ fontSize: "12px", color: sub, marginBottom: "4px" }}>TODAY'S TASK</div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: SUBJECT_COLORS[todayTask.subject] || "#ea580c", marginBottom: "6px" }}>{todayTask.subject}</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: text, marginBottom: "4px" }}>{todayTask.topic}</div>
                      <div style={{ fontSize: "13px", color: sub }}>{todayTask.subtopic}</div>
                      <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                        <span style={{ backgroundColor: muted, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: text }}>⏱ {todayTask.hours}h</span>
                        <span style={{ backgroundColor: muted, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: text, textTransform: "capitalize" }}>{todayTask.type}</span>
                      </div>
                    </div>

                    {todayTask.done || activeDays.has(today) ? (
                      <div style={{ padding: "16px 20px", backgroundColor: darkMode ? "#0a1a0a" : "#f0fdf4", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>✓</div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#16a34a" }}>Completed!</div>
                          <div style={{ fontSize: "12px", color: sub }}>Your streak is updated</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "14px 20px", display: "flex", gap: "10px" }}>
                        {todayTask.type !== "rest" && (
                          <>
                            <Link href={`/solver?subject=${encodeURIComponent(todayTask.subject)}&topic=${encodeURIComponent(todayTask.topic)}`} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1.5px solid ${bord}`, backgroundColor: "transparent", color: text, fontWeight: "600", fontSize: "13px", textDecoration: "none", textAlign: "center", display: "block" }}>
                              🧮 Solver
                            </Link>
                            <button
                              onClick={() => {
                                const wi = plan.findIndex(w => w.days.some(d => d.date === today));
                                const di = plan[wi]?.days.findIndex(d => d.date === today);
                                if (wi >= 0 && di >= 0) markDone(wi, di);
                              }}
                              style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#c2410c,#ea580c)", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                              ✅ Mark Done
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ backgroundColor: card, borderRadius: "20px", padding: "28px", textAlign: "center", border: `1px solid ${bord}` }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: text }}>No task scheduled today!</div>
                    <div style={{ fontSize: "13px", color: sub, marginTop: "6px" }}>Check back tomorrow or review past topics.</div>
                  </div>
                )}

                {/* Upcoming */}
                <div style={{ backgroundColor: card, borderRadius: "20px", padding: "16px 20px", border: `1px solid ${bord}` }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: sub, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Coming Up</div>
                  {plan.flatMap(w => w.days).filter(d => d.date > today).slice(0, 5).map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${bord}` : "none" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: SUBJECT_COLORS[d.subject] || "#ea580c", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: text }}>{d.topic}</div>
                        <div style={{ fontSize: "11px", color: sub }}>{d.subject} · {new Date(d.date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WEEK VIEW */}
            {view === "week" && (
              <div>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "14px", scrollbarWidth: "none" }}>
                  {plan.map((w, i) => (
                    <button key={i} onClick={() => setActiveWeek(i)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "700", backgroundColor: activeWeek === i ? "#ea580c" : muted, color: activeWeek === i ? "#fff" : sub, transition: "all 0.2s" }}>
                      W{w.week}
                    </button>
                  ))}
                </div>

                {plan[activeWeek] && (
                  <div style={{ backgroundColor: card, borderRadius: "20px", overflow: "hidden", border: `1px solid ${bord}`, boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)" }}>
                    <div style={{ padding: "18px 20px", background: "linear-gradient(135deg,#c2410c,#ea580c)" }}>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>WEEK {plan[activeWeek].week}</div>
                      <div style={{ color: "#fff", fontSize: "17px", fontWeight: "800", marginTop: "2px" }}>{plan[activeWeek].focus}</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginTop: "6px" }}>🎯 {plan[activeWeek].goal}</div>
                    </div>

                    <div style={{ padding: "8px" }}>
                      {plan[activeWeek].days.map((d, i) => {
                        const isPast = d.date < today;
                        const isToday = d.date === today;
                        const done = d.done || (isPast && activeDays.has(d.date));
                        const isRest = d.type === "rest";

                        return (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "12px", borderRadius: "12px", marginBottom: "4px",
                            backgroundColor: isToday ? (darkMode ? "#2a1810" : "#fff8f5") : "transparent",
                            border: isToday ? "1.5px solid #ea580c" : `1px solid transparent`,
                          }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0, backgroundColor: done ? "#ea580c" : isRest ? muted : muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                              {done ? "✓" : isRest ? "😴" : d.type === "practice" ? "✏️" : d.day}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "13px", fontWeight: "700", color: isRest ? sub : text }}>{d.topic}</div>
                              <div style={{ fontSize: "11px", color: sub }}>{d.subject} · {d.subtopic}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: "11px", color: sub }}>{new Date(d.date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short" })}</div>
                              {d.hours > 0 && <div style={{ fontSize: "11px", fontWeight: "600", color: text }}>{d.hours}h</div>}
                            </div>
                            {!done && !isRest && isToday && (
                              <button onClick={() => markDone(activeWeek, i)} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#c2410c,#ea580c)", color: "#fff", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>Done</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW */}
            {view === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Progress bar */}
                <div style={{ backgroundColor: card, borderRadius: "16px", padding: "18px 20px", border: `1px solid ${bord}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: text }}>Overall Progress</span>
                    <span style={{ fontSize: "16px", fontWeight: "900", color: "#ea580c" }}>{progressPct}%</span>
                  </div>
                  <div style={{ height: "10px", borderRadius: "5px", backgroundColor: muted, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#c2410c,#ea580c,#f97316)", borderRadius: "5px", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: "12px", color: sub, marginTop: "8px" }}>{completedCount} of {totalStudyDays} study sessions done</div>
                </div>

                {plan.map((w, wi) => {
                  const wDone = w.days.filter(d => d.done || activeDays.has(d.date)).length;
                  const wTotal = w.days.length;
                  const pct = Math.round((wDone / wTotal) * 100);
                  return (
                    <button key={wi} onClick={() => { setActiveWeek(wi); setView("week"); }} style={{ backgroundColor: card, borderRadius: "16px", padding: "16px 18px", border: `1px solid ${activeWeek === wi ? "#ea580c" : bord}`, cursor: "pointer", textAlign: "left", width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: text }}>Week {w.week} — {w.focus}</div>
                          <div style={{ fontSize: "11px", color: sub, marginTop: "2px" }}>{w.goal}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: pct >= 70 ? "#16a34a" : "#ea580c" }}>{pct}%</div>
                          <div style={{ fontSize: "10px", color: sub }}>{wDone}/{wTotal}</div>
                        </div>
                      </div>
                      <div style={{ height: "5px", borderRadius: "3px", backgroundColor: muted, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: pct >= 70 ? "#16a34a" : "#ea580c", transition: "width 0.5s" }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Regenerate */}
            <button onClick={() => {
              if (!confirm("Regenerate plan? Your current progress will be lost.")) return;
              setGenerated(false);
              setPlan([]);
              localStorage.removeItem("companion_study_plan_v2");
            }} style={{ width: "100%", marginTop: "14px", padding: "13px", borderRadius: "14px", border: `1.5px solid ${bord}`, backgroundColor: "transparent", color: sub, fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
              🔄 Regenerate Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
