"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Building2, BookOpen, Target, Calendar,
  Star, LogOut, Moon, Sun, ChevronRight, Edit3,
  Shield, Bell, Check, X, Eye, EyeOff, KeyRound,
} from "lucide-react";
import Navbar,    { NAVBAR_HEIGHT }     from "../components/Navbar";
import BottomNav, { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { C, palette } from "../lib/design";

interface UserData {
  name: string; email: string; institution: string; course: string;
  subjects: string[]; target: string; deadline: string;
  selfRating: string; createdAt?: string; passwordHash?: string;
}

function hashPw(pw: string): string {
  const s = "companion_salt_2025_" + pw;
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
  return Math.abs(h).toString(16) + Math.abs(h * 2654435761).toString(16) + Math.abs(h ^ 0xdeadbeef).toString(16);
}
function verifyPw(pw: string, hash: string): boolean { return hashPw(pw) === hash; }

function Card({ children, darkMode, style }: { children: React.ReactNode; darkMode: boolean; style?: React.CSSProperties }) {
  const T = palette(darkMode);
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, action, darkMode }: { title: string; action?: React.ReactNode; darkMode: boolean }) {
  const T = palette(darkMode);
  return (
    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontWeight: 700, fontSize: "14px", color: T.text }}>{title}</span>
      {action}
    </div>
  );
}

export default function Profile() {
  const [user,      setUser]      = useState<UserData | null>(null);
  const [dark,      setDark]      = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState<Partial<UserData>>({});
  const [saved,     setSaved]     = useState(false);
  const [ready,     setReady]     = useState(false);
  const [showPwForm,setShowPwForm]= useState(false);
  const [oldPw,     setOldPw]     = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showOld,   setShowOld]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const router = useRouter();

  useEffect(() => {
    const dm = localStorage.getItem("darkMode") === "true";
    setDark(dm);
    document.documentElement.setAttribute("data-dark", String(dm));
    try {
      const raw = localStorage.getItem("companion_user");
      if (!raw) { router.replace("/landing"); return; }
      const parsed: UserData = JSON.parse(raw);
      setUser(parsed); setForm(parsed);
    } catch { router.replace("/landing"); return; }
    setReady(true);
  }, [router]);

  const toggleDark = () => {
    const n = !dark; setDark(n);
    localStorage.setItem("darkMode", String(n));
    document.documentElement.setAttribute("data-dark", String(n));
  };

  const saveProfile = () => {
    if (!user) return;
    const updated = { ...user, ...form };
    localStorage.setItem("companion_user", JSON.stringify(updated));
    setUser(updated); setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const changePassword = () => {
    setPwError(""); setPwSuccess(false);
    if (!oldPw || !newPw || !confirmPw) { setPwError("Fill all fields"); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (user?.passwordHash && !verifyPw(oldPw, user.passwordHash)) {
      setPwError("Current password is incorrect"); return;
    }
    const updated = { ...user!, passwordHash: hashPw(newPw) };
    localStorage.setItem("companion_user", JSON.stringify(updated));
    try {
      const accs = JSON.parse(localStorage.getItem("companion_accounts") || "[]");
      const idx = accs.findIndex((a: any) => a.email === updated.email);
      if (idx >= 0) { accs[idx] = updated; localStorage.setItem("companion_accounts", JSON.stringify(accs)); }
    } catch {}
    setUser(updated); setOldPw(""); setNewPw(""); setConfirmPw("");
    setPwSuccess(true); setTimeout(() => { setPwSuccess(false); setShowPwForm(false); }, 2000);
  };

  const logout = () => { localStorage.removeItem("companion_user"); router.replace("/landing"); };

  if (!ready || !user) return null;

  const T = palette(dark);
  const daysLeft = user.deadline ? Math.max(0, Math.ceil((new Date(user.deadline).getTime() - Date.now()) / 86400000)) : null;
  const PREP = ["", "Not ready", "Just started", "Making progress", "Almost ready"];

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: "10px",
    border: `1.5px solid ${T.border}`, fontSize: "14px", outline: "none",
    background: T.s2, color: T.text, boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s",
  };
  const lbl: React.CSSProperties = { fontSize: "12px", color: T.sub, display: "block", marginBottom: "5px", fontWeight: 600 };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar darkMode={dark} onToggleDark={toggleDark} />

      <main style={{
        paddingTop: `${NAVBAR_HEIGHT}px`,
        paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom,0px) + 16px)`,
        overflowX: "hidden",
      }}>
        {/* Hero */}
        <div style={{
          background: dark
            ? "linear-gradient(160deg,#111827 0%,#1E3A5F 60%,#1877F2 100%)"
            : "linear-gradient(160deg,#1877F2 0%,#1565C0 100%)",
          padding: "28px 20px 40px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-20, left:-30, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%",
              background: "linear-gradient(135deg,#fde68a,#f59e0b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px", fontSize: "30px", fontWeight: 800, color: "#7c2d12",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)", border: "3px solid rgba(255,255,255,0.5)",
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 800, letterSpacing: "-0.3px", marginBottom: "4px" }}>{user.name}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{user.email}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "24px" }}>
            {[
              { label: "Target",    value: `${user.target} pts` },
              { label: "Days left", value: daysLeft !== null ? `${daysLeft}d` : "—" },
              { label: "Subjects",  value: String(user.subjects?.length ?? 0) },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: "12px", padding: "12px 8px", textAlign: "center", backdropFilter: "blur(4px)" }}>
                <div style={{ color: "#FFF8DB", fontWeight: 900, fontSize: "18px", letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 14px 0", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Save banner */}
          {saved && (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px", borderRadius:"12px", background: dark?"#0A1A0A":"#E6F4EA", border:"1px solid #31A24C44", animation:"fadeUp 0.2s ease both" }}>
              <Check size={16} color="#31A24C" strokeWidth={2.5} />
              <span style={{ fontSize:"13px", color:"#0D8050", fontWeight:600 }}>Profile saved successfully</span>
            </div>
          )}

          {/* Personal info card */}
          <Card darkMode={dark}>
            <CardHeader darkMode={dark} title="Personal Info" action={
              <button onClick={() => { setEditing(p => !p); if (editing) setForm(user); }} style={{
                display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:"none",
                background: editing ? C.primaryLight : T.s2,
                color: editing ? C.primary : T.sub,
                fontWeight:600, fontSize:"13px", cursor:"pointer",
              }}>
                {editing ? <><X size={13} strokeWidth={2} /> Cancel</> : <><Edit3 size={13} strokeWidth={2} /> Edit</>}
              </button>
            } />
            <div style={{ padding: "16px 18px" }}>
              {editing ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
                  <div><label style={lbl}>Email Address</label><input style={inp} type="email" value={form.email||""} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
                  <div><label style={lbl}>JAMB Exam Date</label><input style={inp} type="date" value={form.deadline||""} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} /></div>
                  <div>
                    <label style={{ ...lbl, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span>Target Score</span>
                      <span style={{ color:C.primary, fontWeight:800, fontSize:"16px" }}>{form.target}</span>
                    </label>
                    <input type="range" min="180" max="400" step="5" value={form.target||"260"} onChange={e=>setForm(p=>({...p,target:e.target.value}))} style={{ width:"100%", accentColor:C.primary }} />
                  </div>
                  <button onClick={saveProfile} style={{ padding:"13px", borderRadius:"10px", border:"none", background:C.primary, color:"#fff", fontWeight:700, fontSize:"14px", cursor:"pointer", boxShadow:`0 2px 10px rgba(24,119,242,0.3)` }}>
                    Save Changes
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  {[
                    { icon: User,      label: "Full Name",    value: user.name },
                    { icon: Mail,      label: "Email",        value: user.email },
                    { icon: Building2, label: "Institution",  value: user.institution || "—" },
                    { icon: BookOpen,  label: "Course",       value: user.course || "—" },
                    { icon: Target,    label: "Target Score", value: `${user.target} / 400` },
                    { icon: Calendar,  label: "Exam Date",    value: user.deadline ? new Date(user.deadline).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}) : "Not set" },
                    { icon: Star,      label: "Prep Level",   value: PREP[parseInt(user.selfRating)||2] || "Just started" },
                  ].map((row, i, arr) => {
                    const Icon = row.icon;
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", paddingBottom: i<arr.length-1?"14px":0, borderBottom: i<arr.length-1?`1px solid ${T.border}`:"none" }}>
                        <div style={{ width:38, height:38, borderRadius:"10px", background:C.primaryLight, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon size={16} color={C.primary} strokeWidth={1.8} />
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:"11px", color:T.sub, fontWeight:600, marginBottom:"2px" }}>{row.label}</div>
                          <div style={{ fontSize:"14px", color:T.text, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Subjects card */}
          <Card darkMode={dark}>
            <CardHeader darkMode={dark} title="JAMB Subjects" />
            <div style={{ padding:"14px 18px", display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {(user.subjects||[]).map((s,i)=>(
                <span key={i} style={{ padding:"7px 14px", borderRadius:"50px", background:C.primaryLight, border:`1px solid ${C.primary}33`, fontSize:"13px", fontWeight:600, color:C.primary }}>
                  {s}
                </span>
              ))}
              {(!user.subjects||user.subjects.length===0) && <span style={{ fontSize:"13px", color:T.muted }}>No subjects added yet</span>}
            </div>
          </Card>

          {/* Change Password card */}
          <Card darkMode={dark}>
            <button onClick={()=>{setShowPwForm(p=>!p);setPwError("");setPwSuccess(false);}} style={{
              width:"100%", display:"flex", alignItems:"center", gap:"12px",
              padding:"14px 18px", border:"none", background:"transparent", cursor:"pointer", textAlign:"left",
            }}>
              <div style={{ width:38, height:38, borderRadius:"10px", background:T.s2, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <KeyRound size={17} color={T.sub} strokeWidth={1.8} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"14px", fontWeight:600, color:T.text }}>Change Password</div>
                <div style={{ fontSize:"12px", color:T.muted, marginTop:"2px" }}>Update your account password</div>
              </div>
              <ChevronRight size={16} color={T.muted} strokeWidth={2} style={{ transform: showPwForm?"rotate(90deg)":"none", transition:"transform 0.2s" }} />
            </button>

            {showPwForm && (
              <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop:"14px" }}>
                  {pwSuccess && (
                    <div style={{ padding:"10px 14px", background:"#E6F4EA", border:"1px solid #31A24C44", borderRadius:"10px", display:"flex", alignItems:"center", gap:"8px" }}>
                      <Check size={15} color="#31A24C" strokeWidth={2.5} />
                      <span style={{ fontSize:"13px", color:"#0D8050", fontWeight:600 }}>Password changed successfully!</span>
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Current Password</label>
                    <div style={{ position:"relative" }}>
                      <input style={{ ...inp, paddingRight:"44px" }} type={showOld?"text":"password"} placeholder="Enter current password" value={oldPw} onChange={e=>setOldPw(e.target.value)} />
                      <button onClick={()=>setShowOld(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", color:T.muted }}>
                        {showOld ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>New Password</label>
                    <div style={{ position:"relative" }}>
                      <input style={{ ...inp, paddingRight:"44px" }} type={showNew?"text":"password"} placeholder="Min. 6 characters" value={newPw} onChange={e=>setNewPw(e.target.value)} />
                      <button onClick={()=>setShowNew(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", color:T.muted }}>
                        {showNew ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Confirm New Password</label>
                    <input style={{ ...inp, borderColor: confirmPw && confirmPw!==newPw ? "#FA3E3E" : T.border }} type="password" placeholder="Repeat new password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} />
                  </div>
                  {pwError && (
                    <div style={{ padding:"10px 14px", background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"10px", color:"#D0021B", fontSize:"13px" }}>⚠️ {pwError}</div>
                  )}
                  <button onClick={changePassword} style={{ padding:"13px", borderRadius:"10px", border:"none", background:C.primary, color:"#fff", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Settings card */}
          <Card darkMode={dark}>
            {[
              { icon: dark?Sun:Moon, label: dark?"Switch to Light Mode":"Switch to Dark Mode", detail: dark?"Currently dark":"Currently light", action: toggleDark },
              { icon: Bell,   label: "Study Reminders",  detail: "Coming soon", action: ()=>{} },
            ].map((item,i,arr)=>{
              const Icon = item.icon;
              return (
                <button key={i} onClick={item.action} style={{
                  width:"100%", display:"flex", alignItems:"center", gap:"12px",
                  padding:"14px 18px", border:"none",
                  borderBottom: i<arr.length-1?`1px solid ${T.border}`:"none",
                  background:"transparent", cursor:"pointer", textAlign:"left", transition:"background 0.1s",
                }}>
                  <div style={{ width:38, height:38, borderRadius:"10px", background:T.s2, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon size={17} color={T.sub} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:600, color:T.text, lineHeight:1.3 }}>{item.label}</div>
                    <div style={{ fontSize:"12px", color:T.muted, marginTop:"2px" }}>{item.detail}</div>
                  </div>
                  <ChevronRight size={16} color={T.muted} strokeWidth={2} />
                </button>
              );
            })}
          </Card>

          {/* Logout */}
          <button onClick={logout} style={{
            width:"100%", padding:"15px 18px", borderRadius:"14px", border:`1.5px solid #FA3E3E33`,
            background: dark?"#1A0808":"#FEE2E2", color:"#D0021B",
            fontWeight:700, fontSize:"14px", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
          }}>
            <LogOut size={16} strokeWidth={2} /> Log Out
          </button>

          {user.createdAt && (
            <p style={{ textAlign:"center", fontSize:"11px", color:T.muted, margin:"0 0 4px" }}>
              Member since {new Date(user.createdAt).toLocaleDateString("en-NG",{month:"long",year:"numeric"})}
            </p>
          )}
        </div>
      </main>

      <BottomNav darkMode={dark} />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
