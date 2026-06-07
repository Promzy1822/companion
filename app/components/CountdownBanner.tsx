"use client";
import { useEffect, useState } from "react";
import { C, palette } from "../lib/design";
import { CalendarDays } from "lucide-react";

export default function CountdownBanner({ darkMode = false }: { darkMode?: boolean }) {
  const T = palette(darkMode);
  const [days, setDays] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
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
  const bg     = urgent ? "#FEE9E9" : soon ? "#FFF3EE" : C.primaryLight;
  const color  = urgent ? "#C00"    : soon ? "#EA580C" : C.primary;
  const bgDark = urgent ? "#3A1515" : soon ? "#3A2010" : "#0F1F3A";

  return (
    <div style={{
      margin: "0 0 16px",
      padding: "14px 16px",
      borderRadius: 16,
      background: darkMode ? bgDark : bg,
      border: `1px solid ${darkMode ? "transparent" : color + "30"}`,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: color + "20",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <CalendarDays size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: darkMode ? "#aaa" : color + "cc", fontWeight: 600, marginBottom: 2 }}>
          {urgent ? "⚠️ Exam very close!" : "Your JAMB Countdown"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: darkMode ? "#fff" : color, lineHeight: 1 }}>
          {days === 0 ? "Today! 🎯" : `${days} day${days === 1 ? "" : "s"} to go`}
        </div>
        <div style={{ fontSize: 11, color: darkMode ? "#888" : "#888", marginTop: 2 }}>
          Exam date: {new Date(deadline).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
      {days > 0 && (
        <div style={{
          textAlign: "center", padding: "6px 10px", borderRadius: 10,
          background: color + "15",
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{days}</div>
          <div style={{ fontSize: 9, color, fontWeight: 700, marginTop: 2 }}>DAYS</div>
        </div>
      )}
    </div>
  );
}
