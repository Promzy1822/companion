"use client";
import { useState } from "react";
import Link from "next/link";
import { palette, TY, LH, FW, SP, R } from "../lib/design";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useIsoLayoutEffect } from "../lib/theme";

// Countdown: one label always — "JAMB 2027". No label flip at 30 days;
// urgency shows only in colour (danger ≤30, warning ≤60, else primary).
// Right-side chevron links to /studyplan. Renders nothing when the user
// has not set an exam date. The darkMode prop is kept only so older
// callers still type-check; Home no longer passes it and palette() takes
// no argument (dark-only).

// LH tokens are bare numbers in design.ts; React would read a numeric
// lineHeight as a unitless multiplier, so normalise to px here.
const px = (v: number | string): string => (typeof v === "number" ? `${v}px` : v);

interface Props { darkMode?: boolean; }

export default function CountdownBanner({ darkMode: _darkMode }: Props) {
  const T = palette();
  const [days, setDays] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("");

  useIsoLayoutEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("companion_user") || "{}");
      if (!user.deadline) return;
      setDeadline(user.deadline);
      const diff = new Date(user.deadline).getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / 86400000)));
    } catch {}
  }, []);

  if (days === null) return null;

  const urgent = days <= 30;
  const soon = days <= 60;
  const tileBg = urgent ? T.dangerTint : soon ? T.warningTint : T.primaryTint;
  const accent = urgent ? T.dangerText : soon ? T.warning : T.primary;

  return (
    <Link href="/studyplan" style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        padding: SP[4], borderRadius: R.xl,
        background: T.surface, border: "1px solid " + T.border,
        display: "flex", alignItems: "center", gap: SP[3],
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: R.lg, flexShrink: 0,
          background: tileBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CalendarDays size={20} color={accent} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: TY.xs, color: urgent ? T.dangerText : T.sub, fontWeight: FW.semibold, lineHeight: px(LH.xs) }}>
            JAMB 2027
          </div>
          <div style={{ fontSize: TY.xl, fontWeight: FW.bold, color: T.text, lineHeight: 1.1 }}>
            {days === 0 ? "Exam day — today" : `${days} day${days === 1 ? "" : "s"} left`}
          </div>
          <div style={{ fontSize: TY.xs, color: T.sub, marginTop: 2, lineHeight: px(LH.xs) }}>
            Exam date: {new Date(deadline).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <ChevronRight size={18} color={T.sub} />
      </div>
    </Link>
  );
}
