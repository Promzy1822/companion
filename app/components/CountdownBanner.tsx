"use client";
import { useState } from "react";
import { palette } from "../lib/design";
import { CalendarDays } from "lucide-react";

import { useIsoLayoutEffect } from "../lib/theme";
export default function CountdownBanner({ darkMode = false }: { darkMode?: boolean }) {
  const T = palette(darkMode);
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
  const soon   = days <= 60;
  const tileBg = urgent ? T.dangerTint : soon ? T.warningTint : T.primaryTint;
  const accent = urgent ? T.dangerText : soon ? "#F7B928" : T.primary;

  return (
    <div style={{
      margin: "0 0 16px",
      padding: "14px 16px",
      borderRadius: 16,
      background: T.surface,
      border: "1px solid " + T.border,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: tileBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <CalendarDays size={20} color={accent} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: urgent ? T.dangerText : T.sub, fontWeight: 600, marginBottom: 2 }}>
          {urgent ? "Exam very close" : "Your JAMB Countdown"}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.text, lineHeight: 1.1 }}>
          {days === 0 ? "Exam day — today" : `${days} day${days === 1 ? "" : "s"} to go`}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
          Exam date: {new Date(deadline).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
