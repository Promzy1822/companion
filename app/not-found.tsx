import Link from "next/link";
import { palette } from "./lib/design";

// Route-level 404 (L1). Next renders this for unknown routes instead of
// its default 404 page. Dark-only tokens, Plus Jakarta Sans via
// var(--font), no emojis. The copy reassures: a wrong turn never costs
// study data, and the way home is one tap.
export default function NotFound() {
  const T = palette();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 20,
        textAlign: "center",
        fontFamily: "var(--font)",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>
        Page not found
      </div>
      <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6, margin: "0 0 12px", maxWidth: 420 }}>
        This page does not exist or was moved. Your plan and progress are safe — head back home to continue studying.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: 44,
          padding: "0 20px",
          borderRadius: 12,
          background: T.primary,
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
