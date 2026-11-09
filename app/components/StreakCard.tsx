"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Progress, todayWAT } from "../lib/progress";
import { palette } from "../lib/design";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";

import { useIsoLayoutEffect } from "../lib/theme";
interface Props { darkMode: boolean; }

export default function StreakCard({ darkMode }: Props) {
  const T = palette(darkMode);
  const [streak, setStreak] = useState(Progress.getStreak());
  const [viewDate, setViewDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [mounted, setMounted] = useState(false);

  useIsoLayoutEffect(() => {
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

  const navBtn: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10, background: "transparent",
    border: "1px solid " + T.border, cursor: "pointer", color: T.sub,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };

  return (
    <div style={{
      background: T.surface, borderRadius: 16,
      border: "1px solid " + T.border, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: T.accentTint,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Flame size={20} color="#F97316" strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>
            Study Streak
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ color: T.text, fontSize: 28, fontWeight: 900, lineHeight: 1, letterSpacing: "-1px" }}>
              {streak.current}
            </span>
            <span style={{ color: T.sub, fontSize: 13 }}>days</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: "1px solid " + T.border, padding: "12px 18px",
      }}>
        {[
          { label: "Best",   value: streak.longest  },
          { label: "Total",  value: streak.totalDays },
          { label: "Week",   value: `${weekScore}/7` },
          { label: "Active", value: activeDays.size  },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 16 }}>{s.value}</div>
            <div style={{ color: T.muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 18px 18px", borderTop: "1px solid " + T.border }}>
        {/* Month navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={prevMonth} aria-label="Previous month" style={navBtn}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{monthName}</span>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            disabled={year === new Date().getFullYear() && month >= new Date().getMonth()}
            style={{ ...navBtn, opacity: (year === new Date().getFullYear() && month >= new Date().getMonth()) ? 0.3 : 1 }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
          {daysOfWeek.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, color: T.muted, fontWeight: 600, padding: "2px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
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
            let color = T.sub;
            let border = "none";

            if (active) {
              bg = "#F97316"; color = "#fff";
            } else if (todayD && !active) {
              bg = "transparent"; color = "#F97316"; border = "2px solid #F97316";
            } else if (missed) {
              bg = T.dangerTint; color = T.dangerText;
            } else if (future) {
              color = T.s3;
            }

            return (
              <div key={day} style={{
                aspectRatio: "1", borderRadius: 8, background: bg,
                border, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: active || todayD ? 800 : 400,
                color, transition: "all 0.15s",
                boxSizing: "border-box",
              }}>
                {day}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 12, justifyContent: "center" }}>
          {[
            { color: "#F97316",   label: "Studied"  },
            { color: "#FF6B5E",   label: "Missed"   },
            { color: T.s3,        label: "Upcoming" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ fontSize: 11, color: T.sub }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Today's status — fully automatic, no manual check-in */}
        <div style={{ marginTop: 14 }}>
          {todayDone ? (
            <div style={{
              textAlign: "center", padding: 12, borderRadius: 12,
              background: T.successTint,
            }}>
              <span style={{ fontSize: 13, color: T.successText, fontWeight: 700 }}>
                Day {streak.current} complete — come back tomorrow
              </span>
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: 12, borderRadius: 12,
              background: "transparent", border: "1px dashed " + T.border,
            }}>
              <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>
                No study activity yet today — finish a lesson, exercise, or mock to start your streak
              </span>
            </div>
          )}
        </div>

        {/* Link to study plan if no activity yet */}
        {streak.totalDays === 0 && (
          <Link href="/studyplan" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            marginTop: 12, minHeight: 44,
            fontSize: 13, color: "#F97316", fontWeight: 700, textDecoration: "none",
          }}>
            Generate a study plan to get started
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
