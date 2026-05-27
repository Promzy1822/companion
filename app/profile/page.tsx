"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Building2, BookOpen, Target, Calendar, Star, LogOut, Moon, Sun, ChevronRight, Edit3, Shield, Bell } from "lucide-react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { C, palette } from "../lib/design";

interface UserData { name:string; email:string; institution:string; course:string; subjects:string[]; target:string; deadline:string; selfRating:string; createdAt?:string; }

export default function Profile() {
  const [user,    setUser]    = useState<UserData | null>(null);
  const [dark,    setDark]    = useState(false);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<Partial<UserData>>({});
  const [saved,   setSaved]   = useState(false);
  const [ready,   setReady]   = useState(false);
  const router = useRouter();

  useEffect(() => {
    const dm = localStorage.getItem("darkMode") === "true";
    setDark(dm);
    const u = localStorage.getItem("companion_user");
    if (!u) { router.replace("/landing"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setForm(parsed);
    setReady(true);
  }, [router]);

  const toggleDark = () => {
    const n = !dark;
    setDark(n);
    localStorage.setItem("darkMode", String(n));
    document.documentElement.setAttribute("data-dark", String(n));
  };

  const saveProfile = () => {
    if (!user) return;
    const updated = { ...user, ...form };
    localStorage.setItem("companion_user", JSON.stringify(updated));
    setUser(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const logout = () => {
    localStorage.removeItem("companion_user");
    router.replace("/landing");
  };

  if (!ready || !user) return null;

  const T = palette(dark);

  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:"10px",
    border:`1.5px solid ${T.border}`, fontSize:"14px", outline:"none",
    background:T.s2, color:T.text, boxSizing:"border-box", fontFamily:"inherit",
    transition:"border-color 0.15s",
  };

  const daysLeft = user.deadline
    ? Math.max(0, Math.ceil((new Date(user.deadline).getTime() - Date.now()) / 86400000))
    : null;

  const PREP_LABELS = ["","Not ready","Just started","Making progress","Almost ready"];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar darkMode={dark} onToggleDark={toggleDark} />

      {/* Profile hero */}
      <div style={{
        background: dark
          ? "linear-gradient(135deg,#1A2A4A,#1877F2)"
          : "linear-gradient(135deg,#1877F2,#0C5FD1)",
        padding:"28px 20px 48px",
        textAlign:"center",
        position:"relative",
      }}>
        <div style={{ position:"absolute", top:"-30px", right:"-30px", width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />

        {/* Avatar */}
        <div style={{
          width:76, height:76, borderRadius:"50%",
          background:"linear-gradient(135deg,#fde68a,#f59e0b)",
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 14px",
          fontSize:"30px", fontWeight:800, color:"#7c2d12",
          boxShadow:"0 6px 20px rgba(0,0,0,0.2)",
          border:"3px solid rgba(255,255,255,0.6)",
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ color:"#fff", fontSize:"20px", fontWeight:800, letterSpacing:"-0.3px" }}>
          {user.name}
        </div>
        <div style={{ color:"rgba(255,255,255,0.75)", fontSize:"13px", marginTop:"4px" }}>
          {user.email}
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginTop:"20px" }}>
          {[
            { label:"Target",   value:`${user.target} pts` },
            { label:"Days left", value: daysLeft !== null ? `${daysLeft}d` : "—"  },
            { label:"Subjects", value:String(user.subjects?.length || 0)           },
          ].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:"10px", padding:"10px 8px" }}>
              <div style={{ color:"#FFF8DB", fontWeight:800, fontSize:"16px" }}>{s.value}</div>
              <div style={{ color:"rgba(255,255,255,0.65)", fontSize:"10px", marginTop:"2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 14px", marginTop:"-16px", paddingBottom:"100px" }}>

        {/* Edit / Save banner */}
        {saved && (
          <div style={{
            padding:"12px 16px", borderRadius:"12px", marginBottom:"12px",
            background:"#E6F4EA", border:"1px solid #31A24C44",
            display:"flex", alignItems:"center", gap:"8px", animation:"fadeUp 0.2s ease",
          }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#31A24C" }} />
            <span style={{ fontSize:"13px", color:"#0D8050", fontWeight:600 }}>Profile saved successfully</span>
          </div>
        )}

        {/* Profile info card */}
        <div style={{ background:T.surface, borderRadius:"16px", border:`1px solid ${T.border}`, marginBottom:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontWeight:700, color:T.text, fontSize:"14px" }}>Personal Info</span>
            <button onClick={() => setEditing(p=>!p)} style={{
              display:"flex", alignItems:"center", gap:"5px",
              padding:"6px 12px", borderRadius:"8px", border:"none",
              background: editing ? C.primaryLight : T.s2,
              color: editing ? C.primary : T.sub,
              fontWeight:600, fontSize:"13px", cursor:"pointer",
            }}>
              <Edit3 size={13} strokeWidth={2} />
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:"14px" }}>
            {editing ? (
              <>
                <div>
                  <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Full Name</label>
                  <input style={inp} value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
                </div>
                <div>
                  <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Email</label>
                  <input style={inp} type="email" value={form.email||""} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
                </div>
                <div>
                  <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>JAMB Exam Date</label>
                  <input style={inp} type="date" value={form.deadline||""} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} />
                </div>
                <div>
                  <label style={{ fontSize:"12px", color:T.sub, display:"block", marginBottom:"6px", fontWeight:600 }}>Target Score: <span style={{ color:C.primary, fontWeight:800 }}>{form.target}</span></label>
                  <input type="range" min="180" max="400" step="5" value={form.target||"260"} onChange={e=>setForm(p=>({...p,target:e.target.value}))} style={{ width:"100%", accentColor:C.primary }} />
                </div>
                <button onClick={saveProfile} style={{
                  padding:"13px", borderRadius:"10px", border:"none",
                  background:C.primary, color:"#fff", fontWeight:700,
                  fontSize:"14px", cursor:"pointer",
                }}>
                  Save Changes
                </button>
              </>
            ) : (
              <>
                {[
                  { icon:User,      label:"Full Name",    value:user.name },
                  { icon:Mail,      label:"Email",        value:user.email },
                  { icon:Building2, label:"Institution",  value:user.institution },
                  { icon:BookOpen,  label:"Course",       value:user.course },
                  { icon:Target,    label:"Target Score", value:`${user.target}/400` },
                  { icon:Calendar,  label:"Exam Date",    value: user.deadline ? new Date(user.deadline).toLocaleDateString("en-NG", {day:"numeric",month:"long",year:"numeric"}) : "Not set" },
                  { icon:Star,      label:"Prep Level",   value: PREP_LABELS[parseInt(user.selfRating)||2] || "Just started" },
                ].map((row,i)=>{
                  const Icon = row.icon;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:36, height:36, borderRadius:"10px", background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={16} color={C.primary} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div style={{ fontSize:"11px", color:T.sub, fontWeight:600, marginBottom:"1px" }}>{row.label}</div>
                        <div style={{ fontSize:"14px", color:T.text, fontWeight:600 }}>{row.value}</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Subjects card */}
        <div style={{ background:T.surface, borderRadius:"16px", border:`1px solid ${T.border}`, marginBottom:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontWeight:700, color:T.text, fontSize:"14px" }}>JAMB Subjects</span>
          </div>
          <div style={{ padding:"14px 18px", display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {(user.subjects || []).map((s,i) => (
              <div key={i} style={{
                padding:"7px 14px", borderRadius:"50px",
                background:C.primaryLight, border:`1px solid ${C.primary}33`,
                fontSize:"13px", fontWeight:600, color:C.primary,
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Settings list */}
        <div style={{ background:T.surface, borderRadius:"16px", border:`1px solid ${T.border}`, marginBottom:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          {[
            { icon:dark?Sun:Moon, label:dark?"Light Mode":"Dark Mode",  action:toggleDark,       detail:dark?"Switch to light":"Switch to dark" },
            { icon:Bell,           label:"Study Reminders",              action:()=>{},           detail:"Coming soon" },
            { icon:Shield,         label:"Account Security",             action:()=>{},           detail:"Password · Privacy" },
          ].map((item,i,arr)=>{
            const Icon = item.icon;
            return (
              <button key={i} onClick={item.action} style={{
                width:"100%", display:"flex", alignItems:"center", gap:"12px",
                padding:"14px 18px",
                border:"none", borderBottom: i<arr.length-1 ? `1px solid ${T.border}` : "none",
                background:"transparent", cursor:"pointer",
                transition:"background 0.1s",
              }}>
                <div style={{ width:38, height:38, borderRadius:"10px", background:T.s2, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={17} color={T.sub} strokeWidth={1.8} />
                </div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontSize:"14px", fontWeight:600, color:T.text }}>{item.label}</div>
                  <div style={{ fontSize:"11px", color:T.muted, marginTop:"1px" }}>{item.detail}</div>
                </div>
                <ChevronRight size={16} color={T.muted} strokeWidth={2} />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button onClick={logout} style={{
          width:"100%", padding:"15px", borderRadius:"14px",
          border:`1.5px solid #FA3E3E44`,
          background:"#FEE2E2", color:"#D0021B",
          fontWeight:700, fontSize:"14px", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
        }}>
          <LogOut size={16} strokeWidth={2} />
          Log Out
        </button>

        {user.createdAt && (
          <p style={{ textAlign:"center", marginTop:"14px", fontSize:"11px", color:T.muted }}>
            Member since {new Date(user.createdAt).toLocaleDateString("en-NG", { month:"long", year:"numeric" })}
          </p>
        )}
      </div>

      <BottomNav darkMode={dark} />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
