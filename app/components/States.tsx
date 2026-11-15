"use client";
import { palette } from "../lib/design";
import { Inbox, AlertTriangle } from "lucide-react";

// Shared UI states — every page uses these three instead of inventing its own.
// Loading: SkeletonCard. Empty: EmptyState. Failure: ErrorState
// (error copy rule: say what failed, then what to do next).

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const T = palette();
  return (
    <div role="status" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 14 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 12, borderRadius: 6, marginBottom: i === lines - 1 ? 0 : 10, width: i === lines - 1 ? "55%" : "100%" }} />
      ))}
    </div>
  );
}

// One shared shell (D9): EmptyState / ErrorState are thin wrappers over it.
// One button language: radius 12, min-height 44, primary fill #4F46E5
// (T.primaryDark) with white text. Text capped at 480px.
function StateShell({ icon, tint, title, sub, actionLabel, onAction, role }: {
  icon: React.ReactNode; tint: string; title: string; sub?: string;
  actionLabel?: string; onAction?: () => void; role?: string;
}) {
  const T = palette();
  return (
    <div role={role} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: tint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        {icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, maxWidth: 480, margin: sub ? "0 auto 5px" : "0 auto" }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, maxWidth: 480, margin: actionLabel && onAction ? "0 auto 16px" : "0 auto" }}>{sub}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ minHeight: 44, padding: "0 18px", borderRadius: 12, border: "none", background: T.primaryDark, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{actionLabel}</button>
      )}
    </div>
  );
}

export function EmptyState({ title, sub, actionLabel, onAction }: { title: string; sub?: string; actionLabel?: string; onAction?: () => void }) {
  const T = palette();
  return (
    <StateShell
      icon={<Inbox size={20} strokeWidth={1.8} color={T.primaryText} />}
      tint={T.primaryTint}
      title={title} sub={sub} actionLabel={actionLabel} onAction={onAction}
    />
  );
}

export function ErrorState({ title, sub, onRetry }: { title: string; sub?: string; onRetry?: () => void }) {
  const T = palette();
  return (
    <StateShell
      role="alert"
      icon={<AlertTriangle size={20} strokeWidth={1.8} color={T.dangerText} />}
      tint={T.dangerTint}
      title={title} sub={sub}
      actionLabel={onRetry ? "Try again" : undefined} onAction={onRetry}
    />
  );
}
