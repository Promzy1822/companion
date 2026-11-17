import { palette } from "./lib/design";

// Route-level loading fallback (L1). Next renders this inside Suspense
// while any route segment loads, replacing the previous blank/default
// fallback. Dark-only tokens, Plus Jakarta Sans via var(--font), no emojis.
export default function Loading() {
  const T = palette();
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 20,
        fontFamily: "var(--font)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `3px solid ${T.s3}`,
          borderTopColor: "#F97316",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <div style={{ fontSize: 14, color: T.sub }}>Loading…</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
