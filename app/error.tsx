"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("App error:", error); }, [error]);
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",backgroundColor:"#f0f0f5",fontFamily:"-apple-system,sans-serif",padding:"24px",textAlign:"center"}}>
      <div style={{fontSize:"48px",marginBottom:"16px"}}>😕</div>
      <h2 style={{fontSize:"20px",fontWeight:"800",color:"#1a1a1a",margin:"0 0 8px"}}>Something went wrong</h2>
      <p style={{fontSize:"14px",color:"#666",margin:"0 0 24px"}}>Your study data is safe. Try refreshing.</p>
      <button onClick={reset} style={{padding:"14px 28px",borderRadius:"30px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"15px",cursor:"pointer"}}>Try Again</button>
    </div>
  );
}
