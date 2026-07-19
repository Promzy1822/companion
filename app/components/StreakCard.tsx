"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Progress, todayWAT } from "../lib/progress";

interface Props { darkMode: boolean; }

export default function StreakCard({ darkMode }: Props) {
  const [streak, setStreak] = useState(Progress.getStreak());
  const [viewDate, setViewDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStreak(Progress.getStreak());
  }, []);

  if (!mounted) return null;

  const today = todayWAT();
  const activeDays = Progress.getActiveDays();
  const todayDone = activeDays.has(today);

  // ── Month calendar ──────────────────────────────────────────────
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleString("en-NG", { month: "long", year: "numeric" });

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const isoDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday      = (d: number) => isoDate(d) === today;
  const isActive     = (d: number) => activeDays.has(isoDate(d));
  const isMissed     = (d: number) => {
    const ds = isoDate(d);
    return ds < today && !activeDays.has(ds);
  };
  const isFuture     = (d: number) => isoDate(d) > today;

  // ── Style helpers ────────────────────────────────────────────────
  const LC = {
    card:   darkMode ? "#1c1c1e" : "#fff",
    text:   darkMode ? "#f2f2f7" : "#1c1c1e",
    sub:    darkMode ? "#98989d" : "#6e6e73",
    muted:  darkMode ? "#2c2c2e" : "#f2f2f7",
    border: darkMode ? "#2c2c2e" : "#e5e5ea",
  };

  const daysOfWeek = ["S","M","T","W","T","F","S"];

  // Stats
  const weekDays: string[] = [];
  const weekStart = new Date(Date.now() + 60*60*1000);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(d.toISOString().slice(0, 10));
  }
  const weekScore = weekDays.filter(d => activeDays.has(d)).length;

  return (
    <div style={{
      backgroundColor: LC.card, borderRadius: "20px",
      boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.08)",
      border: `1px solid ${LC.border}`, marginBottom: "16px", overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 20px 14px",
        background: "linear-gradient(135deg,#c2410c,#ea580c)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end"
      }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", marginBottom: "2px" }}>
            Study Streak
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ color: "#fff", fontSize: "40px", fontWeight: "900", lineHeight: 1, letterSpacing: "-2px" }}>
              {streak.current}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>days 🔥</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "center" }}>
          {[
            { label: "Best",  value: streak.longest   },
            { label: "Total", value: streak.totalDays  },
            { label: "Week",  value: `${weekScore}/7`  },
            { label: "Active",value: activeDays.size    },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "6px 10px" }}>
              <div style={{ color: "#fde68a", fontWeight: "800", fontSize: "16px" }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Month navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: LC.sub, fontSize: "18px", padding: "4px 8px" }}>‹</button>
          <span style={{ fontSize: "14px", fontWeight: "700", color: LC.text }}>{monthName}</span>
          <button
            onClick={nextMonth}
            disabled={year === new Date().getFullYear() && month >= new Date().getMonth()}
            style={{ background: "none", border: "none", cursor: "pointer", color: LC.sub, fontSize: "18px", padding: "4px 8px", opacity: (year === new Date().getFullYear() && month >= new Date().getMonth()) ? 0.3 : 1 }}>›</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "6px" }}>
          {daysOfWeek.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: "11px", color: LC.sub, fontWeight: "600", padding: "2px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
          {/* Leading empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const active  = isActive(day);
            const missed  = isMissed(day);
            const todayD  = isToday(day);
            const future  = isFuture(day);

            let bg = "transparent";
            let color = LC.sub;
            let border = "none";
            let emoji = "";

            if (active) {
              bg = "#ea580c"; color = "#fff"; emoji = ""; // filled orange
            } else if (todayD && !active) {
              bg = "transparent"; color = "#ea580c"; border = `2px solid #ea580c`;
            } else if (missed) {
              bg = darkMode ? "#2a1010" : "#fff0ee"; color = "#dc2626";
            } else if (future) {
              color = darkMode ? "#3a3a3c" : "#d0d0d0";
            }

            return (
              <div key={day} style={{
                aspectRatio: "1", borderRadius: "8px", backgroundColor: bg,
                border, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: active || todayD ? "800" : "400",
                color, position: "relative", transition: "all 0.15s",
              }}>
                {day}
                {active && (
                  <div style={{ position: "absolute", bottom: "1px", fontSize: "7px", lineHeight: 1 }}>●</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px", marginTop: "12px", justifyContent: "center" }}>
          {[
            { color: "#ea580c", label: "Studied" },
            { color: "#dc2626", label: "Missed" },
            { color: darkMode ? "#3a3a3c" : "#d0d0d0", label: "Upcoming" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: l.color }} />
              <span style={{ fontSize: "11px", color: LC.sub }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Today's status — fully automatic, no manual check-in */}
        <div style={{ marginTop: "14px" }}>
          {todayDone ? (
            <div style={{
              textAlign: "center", padding: "12px", borderRadius: "14px",
              backgroundColor: darkMode ? "#0a1a0a" : "#f0fdf4", border: "1px solid #86efac"
            }}>
              <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: "700" }}>
                🎉 Day {streak.current} complete! Come back tomorrow
              </span>
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "12px", borderRadius: "14px",
              backgroundColor: darkMode ? "#1c1c1e" : "#f7f7f8", border: `1px dashed ${LC.border}`
            }}>
              <span style={{ fontSize: "13px", color: LC.sub, fontWeight: "600" }}>
                No study activity yet today — finish a lesson, exercise, or mock to start your streak 🔥
              </span>
            </div>
          )}
        </div>

        {/* Link to study plan if no activity yet */}
        {streak.totalDays === 0 && (
          <Link href="/studyplan" style={{
            display: "block", marginTop: "10px", textAlign: "center",
            fontSize: "12px", color: "#ea580c", fontWeight: "600", textDecoration: "none"
          }}>
            Generate a study plan to get started →
          </Link>
        )}
      </div>
    </div>
  );
}
