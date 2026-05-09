"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Landing() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const u = localStorage.getItem("companion_user");
    if (u) { router.replace("/"); return; }
    setReady(true);
  }, [router]);
  if (!ready) return null;

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",backgroundColor:"#fff",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(160deg,#431407,#7c2d12,#c2410c,#ea580c)",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"28px"}}>🎓</span>
            <span style={{color:"#fff",fontWeight:"900",fontSize:"20px"}}>companion</span>
          </div>
          <Link href="/auth" style={{color:"rgba(255,255,255,0.85)",fontSize:"13px",textDecoration:"none",padding:"7px 18px",border:"1px solid rgba(255,255,255,0.35)",borderRadius:"20px",fontWeight:"600"}}>Log In</Link>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"20px 24px",textAlign:"center"}}>
          <div style={{fontSize:"72px",marginBottom:"20px"}}>🎓</div>
          <div style={{display:"inline-block",margin:"0 auto 16px",padding:"6px 16px",borderRadius:"20px",backgroundColor:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.9)",fontSize:"13px",fontWeight:"600"}}>🔥 Nigeria's #1 AI JAMB Study App</div>
          <h1 style={{color:"#fff",fontSize:"36px",fontWeight:"900",lineHeight:"1.15",margin:"0 0 16px",letterSpacing:"-1px"}}>Pass JAMB with<br/><span style={{color:"#fde68a"}}>AI-Powered</span><br/>Study Support</h1>
          <p style={{color:"rgba(255,255,255,0.85)",fontSize:"15px",lineHeight:"1.6",margin:"0 0 32px"}}>Learn smarter, practice daily, and get instant answers. Built for Nigerian students.</p>
          <Link href="/auth" style={{display:"block",padding:"18px",borderRadius:"30px",backgroundColor:"#fff",color:"#c2410c",fontWeight:"800",fontSize:"17px",textDecoration:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.25)",marginBottom:"12px"}}>Get Started Free →</Link>
          <p style={{color:"rgba(255,255,255,0.55)",fontSize:"12px",margin:0}}>No credit card · 2 minutes setup</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",margin:"0 24px 40px",borderRadius:"16px",overflow:"hidden",border:"1px solid rgba(255,255,255,0.15)"}}>
          {[{n:"1.5M+",l:"Students"},{n:"10K+",l:"Questions"},{n:"24/7",l:"AI Help"},{n:"Free",l:"Always"}].map((s,i)=>(
            <div key={i} style={{padding:"16px 8px",textAlign:"center",backgroundColor:"rgba(255,255,255,0.08)",borderRight:i<3?"1px solid rgba(255,255,255,0.1)":"none"}}>
              <div style={{color:"#fde68a",fontWeight:"900",fontSize:"18px"}}>{s.n}</div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:"10px",marginTop:"2px"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
