"use client";
import { useState } from "react";
import { Progress, todayWAT } from "../lib/progress";
import { palette, TY, LH, FW, SP, R } from "../lib/design";
import { useIsoLayoutEffect } from "../lib/theme";

// This week — honest activity chart.
//
// The app records NO study minutes anywhere, so this chart never shows
// minutes and never shows sample data. It counts recorded activity events
// per day from Progress.getStreak().activityLog (one entry per recorded
// activity — e.g. one per answered practice question), and labels the total
// "activities". A day with no recorded events shows a zero bar.

const px = (v: number | string): string => (typeof v === "number" ? `${v}px` : v);

const ORANGE = "#F97316";
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function WeekChart() {
  const T = palette();
  const [streak, setStreak] = useState(Progress.getStreak());
  const [mounted, setMounted] = useState(false);

  useIsoLayoutEffect(() => {
    setMounted(true);
    setStreak(Progress.getStreak());
  }, []);

  if (!mounted) return null;

  const today = todayWAT();
  const todayDate = new Date(today + "T00:00:00Z");
  // Monday of the current WAT week: getUTCDay() is 0 (Sun) .. 6 (Sat).
  const mondayOffset = (todayDate.getUTCDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);
  const days = DAY_LABELS.map((_, i) => addDays(monday, i));
  const counts = days.map((iso) => (streak.activityLog?.[iso] || []).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(...counts);

  const eyebrow: React.CSSProperties = {
    fontSize: 11, fontWeight: FW.bold, color: T.sub,
    textTransform: "uppercase", letterSpacing: "0.8px",
  };

  return (
    <div style={{
      background: T.surface, borderRadius: R.xl,
      border: "1px solid " + T.border, padding: SP[4],
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP[2] }}>
        <div style={eyebrow}>This week</div>
        <div style={{ fontSize: TY.xs, fontWeight: FW.semibold, color: T.sub }}>
          {total} activit{total === 1 ? "y" : "ies"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: SP[3] }}>
        {days.map((iso, i) => {
          const count = counts[i];
          const isToday = iso === today;
          const height = count === 0 || max === 0 ? 3 : Math.max(3, (count / max) * 64);
          const background = count === 0 ? T.s3 : isToday ? ORANGE : T.primary;
          return (
            <div key={iso} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 11, color: T.sub, lineHeight: "14px", height: 14 }}>
                {count > 0 ? count : ""}
              </div>
              <div style={{ width: "100%", maxWidth: 28, borderRadius: 6, height, background }} />
              <div style={{
                fontSize: 11,
                fontWeight: isToday ? FW.bold : FW.regular,
                color: isToday ? ORANGE : T.muted,
              }}>
                {DAY_LABELS[i]}
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <div style={{ fontSize: TY.sm, color: T.sub, marginTop: SP[3], lineHeight: px(LH.sm) }}>
          No activity yet this week — study anything to get started
        </div>
      )}
    </div>
  );
}
