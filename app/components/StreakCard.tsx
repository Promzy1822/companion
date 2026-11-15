"use client";
import { useState } from "react";
import { Progress, todayWAT } from "../lib/progress";
import { palette, TY, LH, FW, SP, R } from "../lib/design";
import { Flame } from "lucide-react";
import { useIsoLayoutEffect } from "../lib/theme";

// Streak on Home is a compact stat, not a calendar: two stats only —
// "Current streak" and "Best", labelled in full. No calendar (it moves to
// Plan in a later rebuild), no month nav, no red missed days, no legend.
// The darkMode prop is kept only so older callers still type-check; Home no
// longer passes it and palette() takes no argument (dark-only).

// LH tokens are bare numbers in design.ts; React would read a numeric
// lineHeight as a unitless multiplier, so normalise to px here.
const px = (v: number | string): string => (typeof v === "number" ? `${v}px` : v);

interface Props { darkMode?: boolean; }

export default function StreakCard({ darkMode: _darkMode }: Props) {
  const T = palette();
  const [streak, setStreak] = useState(Progress.getStreak());
  const [mounted, setMounted] = useState(false);

  useIsoLayoutEffect(() => {
    setMounted(true);
    setStreak(Progress.getStreak());
  }, []);

  if (!mounted) return null;

  const today = todayWAT();
  const todayDone = Progress.getActiveDays().has(today);

  return (
    <div style={{
      background: T.surface, borderRadius: R.xl,
      border: "1px solid " + T.border, padding: SP[4],
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: SP[3] }}>
        <div style={{
          width: 44, height: 44, borderRadius: R.lg, flexShrink: 0,
          background: T.accentTint,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Flame size={20} color="#F97316" strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: FW.bold, color: T.sub,
            textTransform: "uppercase", letterSpacing: "0.8px",
          }}>
            Study Streak
          </div>
          <div style={{ fontSize: TY.sm, color: T.sub, marginTop: 2, lineHeight: px(LH.sm) }}>
            {todayDone
              ? `Day ${streak.current} complete — come back tomorrow`
              : "Study anything today to start your streak"}
          </div>
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: SP[3],
        borderTop: "1px solid " + T.border, marginTop: SP[3], paddingTop: SP[3],
      }}>
        <div>
          <div style={{ color: T.text, fontSize: TY.xl, fontWeight: FW.bold, lineHeight: 1.1 }}>
            {streak.current}
            <span style={{ fontSize: TY.sm, color: T.sub, fontWeight: FW.medium }}> day{streak.current === 1 ? "" : "s"}</span>
          </div>
          <div style={{ color: T.sub, fontSize: TY.xs, marginTop: 2 }}>Current streak</div>
        </div>
        <div>
          <div style={{ color: T.text, fontSize: TY.xl, fontWeight: FW.bold, lineHeight: 1.1 }}>
            {streak.longest}
            <span style={{ fontSize: TY.sm, color: T.sub, fontWeight: FW.medium }}> day{streak.longest === 1 ? "" : "s"}</span>
          </div>
          <div style={{ color: T.sub, fontSize: TY.xs, marginTop: 2 }}>Best</div>
        </div>
      </div>
    </div>
  );
}
