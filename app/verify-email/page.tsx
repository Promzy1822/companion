"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { C } from "../lib/design";
import { Session } from "../lib/session";
import type { KVAccount } from "../lib/kvAuth";

function VerifyContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get("email") || "";
  const name         = searchParams.get("name")  || "";

  const [code,    setCode]    = useState(["","","","","",""]);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const verify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) { setError("Enter the complete 6-digit code"); return; }
    setLoading(true); setError("");

    try {
      const res  = await fetch("/api/auth/verify-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); return; }

      // Save to localStorage and start session
      const account = data.account as KVAccount;
      Session.start(account as Parameters<typeof Session.start>[0]);
      router.replace("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true); setError("");
    try {
      // We need the original form data — stored in sessionStorage during signup
      const pending = sessionStorage.getItem("companion_pending_signup");
      if (!pending) { setError("Session expired. Please sign up again."); return; }
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    pending,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to resend"); return; }
      setResendCountdown(60);
      setCode(["","","","","",""]);
      inputs.current[0]?.focus();
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#F0F2F5",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      display:"flex", flexDirection:"column",
    }}>
      {/* Header */}
      <div style={{ background:C.primary, padding:"16px 20px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"24px" }}>
          <Link href="/auth" style={{
            width:34, height:34, borderRadius:"10px", background:"rgba(255,255,255,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none",
          }}>
            <ArrowLeft size={17} color="#fff" strokeWidth={2} />
          </Link>
          <div style={{ color:"#fff", fontWeight:800, fontSize:"17px" }}>Verify Email</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:"16px", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <Mail size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <div style={{ color:"#fff", fontWeight:700, fontSize:"16px", marginBottom:"6px" }}>Check your email</div>
          <div style={{ color:"rgba(255,255,255,0.75)", fontSize:"13px", lineHeight:1.5 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color:"#fff" }}>{email}</strong>
          </div>
        </div>
      </div>

      <div style={{ flex:1, padding:"24px 16px" }}>
        <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>

          <p style={{ margin:"0 0 20px", fontSize:"14px", color:"#65676B", textAlign:"center" }}>
            Enter the 6-digit verification code
          </p>

          {/* OTP input boxes */}
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", marginBottom:"24px" }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                style={{
                  width:44, height:52, textAlign:"center", fontSize:"22px", fontWeight:800,
                  borderRadius:"10px", border:`2px solid ${digit ? C.primary : "#E4E6EB"}`,
                  background: digit ? C.primaryLight : "#F7F8FA",
                  color: C.primary, outline:"none",
                  transition:"border-color 0.15s, background 0.15s",
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ padding:"10px 14px", background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"10px", color:"#D0021B", fontSize:"13px", marginBottom:"16px" }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={verify} disabled={loading || code.join("").length !== 6} style={{
            width:"100%", padding:"14px", borderRadius:"10px", border:"none",
            background: code.join("").length !== 6 ? "#B0B3B8" : C.primary,
            color:"#fff", fontWeight:700, fontSize:"15px",
            cursor: code.join("").length !== 6 ? "not-allowed" : "pointer",
            boxShadow:`0 2px 10px rgba(24,119,242,0.3)`, marginBottom:"16px",
          }}>
            {loading ? "Verifying…" : "Verify Email →"}
          </button>

          {/* Resend */}
          <div style={{ textAlign:"center" }}>
            {resendCountdown > 0 ? (
              <p style={{ fontSize:"13px", color:"#8A8D91", margin:0 }}>
                Resend code in <strong>{resendCountdown}s</strong>
              </p>
            ) : (
              <button onClick={resendCode} disabled={resending} style={{
                background:"none", border:"none", color:C.primary,
                fontWeight:700, fontSize:"13px", cursor:"pointer",
                display:"inline-flex", alignItems:"center", gap:"6px",
              }}>
                <RefreshCw size={14} strokeWidth={2} />
                {resending ? "Sending…" : "Resend code"}
              </button>
            )}
          </div>

          <p style={{ textAlign:"center", fontSize:"12px", color:"#8A8D91", marginTop:"16px", marginBottom:0 }}>
            Check your spam folder if you don't see it
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#F0F2F5" }} />}>
      <VerifyContent />
    </Suspense>
  );
}
