"use client";
import { useEffect, useRef, useState } from "react";
import { Monitor, Sun, Moon, Check, type LucideIcon } from "lucide-react";
import { C, palette } from "../lib/design";
import { getThemeMode, setThemeMode, useIsoLayoutEffect, type ThemeMode } from "../lib/theme";

const OPTIONS: { mode: ThemeMode; label: string; hint: string; icon: LucideIcon }[] = [
  { mode: "system", label: "System default", hint: "Matches your device",  icon: Monitor },
  { mode: "light",  label: "Light",          hint: "Always light",         icon: Sun },
  { mode: "dark",   label: "Dark",           hint: "Always dark",          icon: Moon },
];

export default function ThemeMenu({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) {
  const T = palette(darkMode);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("system");
  const [pos,  setPos]  = useState({ top: 60, right: 12 });
  const btn  = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => { setMode(getThemeMode()); }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (menu.current?.contains(t) || btn.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: Math.max(8, document.documentElement.clientWidth - r.right) });
    }
    setOpen(o => !o);
  };

  const choose = (m: ThemeMode) => {
    setThemeMode(m); // the one theme write — every surface reads useDark() and follows live
    setMode(m);
    setOpen(false);
  };

  const Current = mode === "system" ? Monitor : mode === "dark" ? Moon : Sun;

  return (
    <>
      <button
        ref={btn}
        onClick={toggle}
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: 36, height: 36, borderRadius: "50%", border: "none",
          background: open ? T.s3 : T.s2,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        <Current size={17} strokeWidth={1.8} color={T.sub} />
      </button>

      {open && (
        <div
          ref={menu}
          role="menu"
          style={{
            position: "fixed", top: pos.top, right: pos.right, width: 224, zIndex: 300,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: 6,
            animation: "navDropIn 0.15s ease both",
          }}
        >
          {OPTIONS.map(o => {
            const Icon = o.icon;
            const active = mode === o.mode;
            return (
              <button
                key={o.mode}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(o.mode)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", border: "none", borderRadius: 10, cursor: "pointer",
                  textAlign: "left", fontFamily: "inherit",
                  background: active ? T.primaryTint : "transparent",
                }}
              >
                <Icon size={18} strokeWidth={1.8} color={active ? T.primary : T.sub} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: active ? T.primary : T.text }}>{o.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: T.sub, marginTop: 1 }}>{o.hint}</span>
                </span>
                {active && <Check size={16} strokeWidth={2.4} color={T.primary} />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
