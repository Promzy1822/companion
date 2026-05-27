"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#F0F2F5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      padding: "24px", textAlign: "center",
    }}>
      <img src="/icon-192.png" alt="Companion" width={56} height={56}
        style={{ borderRadius: "16px", marginBottom: "20px", opacity: 0.55 }} />
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#050505", margin: "0 0 8px" }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: "14px", color: "#65676B", margin: "0 0 24px", lineHeight: 1.5 }}>
        Your study data is safe. Try refreshing the page.
      </p>
      <button onClick={reset} style={{
        padding: "12px 28px", borderRadius: "50px", border: "none",
        background: "#1877F2", color: "#fff", fontWeight: 700,
        fontSize: "14px", cursor: "pointer", marginBottom: "10px",
      }}>
        Try Again
      </button>
      <button onClick={() => window.location.href="/"} style={{
        background: "none", border: "none", color: "#1877F2",
        fontWeight: 600, fontSize: "13px", cursor: "pointer",
      }}>
        Go to Dashboard
      </button>
    </div>
  );
}
