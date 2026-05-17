"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("App error:", error); }, [error]);
  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      backgroundColor:"#f5f5f7",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding:"24px", textAlign:"center"
    }}>
      <img
        src="/icon-192.png"
        alt="Companion"
        width={60}
        height={60}
        style={{ borderRadius:"16px", marginBottom:"20px", opacity:0.6 }}
      />
      <h2 style={{ fontSize:"20px", fontWeight:"800", color:"#1a1a1a", margin:"0 0 8px" }}>Something went wrong</h2>
      <p style={{ fontSize:"14px", color:"#666", margin:"0 0 24px", lineHeight:"1.5" }}>
        Don't worry — your study data is safe. Try refreshing the page.
      </p>
      <button
        onClick={reset}
        style={{ padding:"14px 28px", borderRadius:"30px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", fontSize:"15px", cursor:"pointer", marginBottom:"12px" }}
      >
        Try Again
      </button>
      <button
        onClick={() => window.location.href="/"}
        style={{ background:"none", border:"none", color:"#ea580c", fontWeight:"600", fontSize:"14px", cursor:"pointer" }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
