"use client";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";
import { Inbox, AlertTriangle } from "lucide-react";

// Shared UI states — every page uses these three instead of inventing its own.
// Loading: SkeletonCard. Empty: EmptyState. Failure: ErrorState
// (error copy rule: say what failed, then what to do next).

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const T = palette(useDark());
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
      <style>{`@keyframes statePulse { 0%,100% { opacity: .45; } 50% { opacity: .9; } }`}</style>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: T.s3, marginBottom: 14, animation: "statePulse 1.4s ease-in-out infinite" }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 12, borderRadius: 6, background: T.s3, marginBottom: i === lines - 1 ? 0 : 10, width: i === lines - 1 ? "55%" : "100%", animation: "statePulse 1.4s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

export function EmptyState({ title, sub, actionLabel, onAction }: { title: string; sub?: string; actionLabel?: string; onAction?: () => void }) {
  const T = palette(useDark());
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <Inbox size={20} strokeWidth={1.8} color={T.primaryText} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: sub ? 5 : 0 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, marginBottom: actionLabel ? 16 : 0 }}>{sub}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ minHeight: 44, padding: "0 18px", borderRadius: 12, border: "none", background: T.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{actionLabel}</button>
      )}
    </div>
  );
}

export function ErrorState({ title, sub, onRetry }: { title: string; sub?: string; onRetry?: () => void }) {
  const T = palette(useDark());
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: T.dangerTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <AlertTriangle size={20} strokeWidth={1.8} color={T.dangerText} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: sub ? 5 : 0 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, marginBottom: onRetry ? 16 : 0 }}>{sub}</div>}
      {onRetry && (
        <button onClick={onRetry} style={{ minHeight: 44, padding: "0 18px", borderRadius: 12, border: "none", background: T.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Try again</button>
      )}
    </div>
  );
}
