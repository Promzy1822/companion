"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { palette } from "../lib/design";
import { useDark } from "../lib/theme";
import { Session } from "../lib/session";
import { validatePassword } from "../lib/auth";
import { createClient } from "../lib/supabase/client";

function ResetContent() {
  const router = useRouter();
  const dark = useDark();
  const T = palette(dark);

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSessionOk(!!data.user);
    });
  }, []);

  const handleReset = async () => {
    setError("");
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid)       { setError(pwCheck.message); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: userData, error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) { setError(updateErr.message); return; }

      setSuccess(true);

      if (userData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single();
        if (profile) {
          Session.start({
            id:             userData.user.id,
            email:          userData.user.email || "",
            name:           profile.name,
            institution:    profile.institution,
            course:         profile.course,
            subjects:       profile.subjects,
            target:         profile.target,
            deadline:       profile.deadline,
            selfRating:     profile.self_rating,
            cutoffData:     profile.cutoff_data,
            recommendation: profile.recommendation,
          } as unknown as Parameters<typeof Session.start>[0]);
        }
      }

      setTimeout(() => router.replace("/"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"13px 16px", borderRadius:"10px",
    border:`1.5px solid ${T.border}`, fontSize:"15px", outline:"none",
    background:T.s2, color:T.text, boxSizing:"border-box", fontFamily:"inherit",
  };

  if (sessionOk === false) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"var(--font)" }}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"16px", padding:"32px 24px", textAlign:"center", maxWidth:420, width:"100%" }}>
        <AlertTriangle size={44} color={T.warning} strokeWidth={1.5} style={{ margin:"0 auto 16px", display:"block" }} />
        <h2 style={{ fontWeight:800, color:T.text, marginBottom:8 }}>Invalid Link</h2>
        <p style={{ color:T.sub, fontSize:"14px", marginBottom:24 }}>This reset link is invalid or has expired.</p>
        <Link href="/auth" style={{ display:"block", padding:"13px", borderRadius:"10px", background:T.primary, color:"#fff", fontWeight:700, textDecoration:"none", textAlign:"center" }}>
          Back to Login
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"var(--font)", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"linear-gradient(165deg,#2A1B6B 0%,#1F1156 55%,#150D38 100%)", padding:"16px 20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <Link href="/auth" style={{ width:44, height:44, borderRadius:"12px", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>
            <ArrowLeft size={17} color="#fff" strokeWidth={2} />
          </Link>
          <div style={{ color:"#fff", fontWeight:800, fontSize:"17px" }}>Reset Password</div>
        </div>
      </div>

      <div style={{ flex:1, padding:"24px 16px" }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"16px", padding:"24px", maxWidth:420, margin:"0 auto" }}>
          {success ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <CheckCircle size={56} color="#31A24C" strokeWidth={1.5} style={{ margin:"0 auto 16px", display:"block" }} />
              <h2 style={{ fontWeight:800, color:T.text, marginBottom:8 }}>Password Reset!</h2>
              <p style={{ color:T.sub, fontSize:"14px" }}>Logging you in automatically…</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <h2 style={{ fontSize:"20px", fontWeight:800, color:T.text, margin:"0 0 4px" }}>Create new password</h2>
                <p style={{ fontSize:"13px", color:T.sub, margin:0 }}>Must be at least 6 characters</p>
              </div>
              <div>
                <label style={{ fontSize:"13px", fontWeight:600, color:T.sub, display:"block", marginBottom:"6px" }}>New Password</label>
                <div style={{ position:"relative" }}>
                  <input style={{ ...inp, paddingRight:"44px" }} type={showPw?"text":"password"} placeholder="Min. 6 characters" value={password} onChange={e=>setPassword(e.target.value)} />
                  <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:2, top:"50%", transform:"translateY(-50%)", width:44, height:44, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:T.sub }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize:"13px", fontWeight:600, color:T.sub, display:"block", marginBottom:"6px" }}>Confirm Password</label>
                <input style={{ ...inp, borderColor: confirm && confirm !== password ? "#FA3E3E" : T.border }} type="password" placeholder="Repeat new password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
              </div>
              {error && (
                <div style={{ padding:"10px 14px", background:T.dangerTint, border:`1px solid ${T.danger}44`, borderRadius:"10px", color:T.danger, fontSize:"13px" }}>
                  {error}
                </div>
              )}
              <button onClick={handleReset} disabled={loading} style={{
                width:"100%", padding:"14px", borderRadius:"10px", border:"none",
                background: loading ? T.s3 : T.primary, color: loading ? T.muted : "#fff",
                fontWeight:700, fontSize:"15px", cursor: loading?"not-allowed":"pointer",
              }}>
                {loading ? "Resetting…" : "Reset Password"}
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
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"var(--bg)" }} />}>
      <ResetContent />
    </Suspense>
  );
}
