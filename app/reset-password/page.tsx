"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { C } from "../lib/design";
import { Session } from "../lib/session";
import { validatePassword } from "../lib/auth";
import type { UserAccount } from "../lib/session";

function ResetContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") || "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [tokenOk,   setTokenOk]   = useState<boolean|null>(null);

  useEffect(() => {
    if (!token) { setTokenOk(false); return; }
    setTokenOk(true);
  }, [token]);

  const handleReset = async () => {
    setError("");
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid)      { setError(pwCheck.message); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed. Try again."); return; }
      setSuccess(true);
      // Auto login and redirect after 2 seconds
      const account = data.account as UserAccount;
      Session.start(account as Parameters<typeof Session.start>[0]);
      setTimeout(() => router.replace("/"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"10px",
    border:"1.5px solid #E4E6EB", fontSize:"15px", outline:"none",
    background:"#F7F8FA", color:"#050505", boxSizing:"border-box", fontFamily:"inherit",
  };

  if (tokenOk === false) return (
    <div style={{ minHeight:"100vh", background:"#F0F2F5", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"-apple-system,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:"16px", padding:"32px 24px", textAlign:"center", maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <h2 style={{ fontWeight:800, color:"#050505", marginBottom:8 }}>Invalid Link</h2>
        <p style={{ color:"#65676B", fontSize:"14px", marginBottom:24 }}>This reset link is invalid or has expired.</p>
        <Link href="/auth" style={{ display:"block", padding:"13px", borderRadius:"10px", background:C.primary, color:"#fff", fontWeight:700, textDecoration:"none", textAlign:"center" }}>
          Back to Login
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F0F2F5", fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif", display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.primary, padding:"16px 20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <Link href="/auth" style={{ width:34, height:34, borderRadius:"10px", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>
            <ArrowLeft size={17} color="#fff" strokeWidth={2} />
          </Link>
          <div style={{ color:"#fff", fontWeight:800, fontSize:"17px" }}>Reset Password</div>
        </div>
      </div>

      <div style={{ flex:1, padding:"24px 16px" }}>
        <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
          {success ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <CheckCircle size={56} color="#31A24C" strokeWidth={1.5} style={{ margin:"0 auto 16px", display:"block" }} />
              <h2 style={{ fontWeight:800, color:"#050505", marginBottom:8 }}>Password Reset!</h2>
              <p style={{ color:"#65676B", fontSize:"14px" }}>Logging you in automatically…</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <h2 style={{ fontSize:"20px", fontWeight:800, color:"#050505", margin:"0 0 4px" }}>Create new password</h2>
                <p style={{ fontSize:"13px", color:"#65676B", margin:0 }}>Must be at least 6 characters</p>
              </div>
              <div>
                <label style={{ fontSize:"13px", fontWeight:600, color:"#65676B", display:"block", marginBottom:"6px" }}>New Password</label>
                <div style={{ position:"relative" }}>
                  <input style={{ ...inp, paddingRight:"44px" }} type={showPw?"text":"password"} placeholder="Min. 6 characters" value={password} onChange={e=>setPassword(e.target.value)} />
                  <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", color:"#65676B" }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize:"13px", fontWeight:600, color:"#65676B", display:"block", marginBottom:"6px" }}>Confirm Password</label>
                <input style={{ ...inp, borderColor: confirm && confirm !== password ? "#FA3E3E" : "#E4E6EB" }} type="password" placeholder="Repeat new password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
              </div>
              {error && (
                <div style={{ padding:"10px 14px", background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"10px", color:"#D0021B", fontSize:"13px" }}>
                  ⚠️ {error}
                </div>
              )}
              <button onClick={handleReset} disabled={loading} style={{
                width:"100%", padding:"14px", borderRadius:"10px", border:"none",
                background: loading ? "#B0B3B8" : C.primary, color:"#fff",
                fontWeight:700, fontSize:"15px", cursor: loading?"not-allowed":"pointer",
                boxShadow:`0 2px 10px rgba(24,119,242,0.3)`,
              }}>
                {loading ? "Resetting…" : "Reset Password →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#F0F2F5" }} />}>
      <ResetContent />
    </Suspense>
  );
}
