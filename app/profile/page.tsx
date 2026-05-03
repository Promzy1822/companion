"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User { name:string; email:string; target:string; institution:string; course:string; subjects:string[]; deadline:string; selfRating:string; }
interface AlarmSettings { studyReminder:boolean; studyTime:string; morningMotivation:boolean; morningTime:string; examCountdown:boolean; }

export default function Profile() {
  const [user, setUser] = useState<User|null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [alarms, setAlarms] = useState<AlarmSettings>({studyReminder:false, studyTime:"19:00", morningMotivation:false, morningTime:"07:00", examCountdown:false});
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setDarkMode(localStorage.getItem("darkMode") === "true");
    const u = localStorage.getItem("companion_user");
    if (!u) { router.replace("/landing"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setEditForm(parsed);
    const savedAlarms = localStorage.getItem("alarm_settings");
    if (savedAlarms) setAlarms(JSON.parse(savedAlarms));
  }, []);

  const saveProfile = () => {
    const updated = {...user, ...editForm};
    localStorage.setItem("companion_user", JSON.stringify(updated));
    setUser(updated as User);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveAlarms = (newAlarms: AlarmSettings) => {
    setAlarms(newAlarms);
    localStorage.setItem("alarm_settings", JSON.stringify(newAlarms));
    if (newAlarms.studyReminder && "Notification" in window) {
      Notification.requestPermission();
    }
  };

  const scheduleNotification = (title: string, body: string, timeStr: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const [h, m] = timeStr.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    setTimeout(() => {
      new Notification(title, {body, icon:"/icon.svg"});
    }, delay);
  };

  if (!mounted) return null;

  const bg = darkMode ? "#0a0a0a" : "#f2f2f7";
  const cardBg = darkMode ? "#1c1c1e" : "#fff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const inp: React.CSSProperties = {width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${borderC}`, fontSize:"14px", outline:"none", backgroundColor:darkMode?"#2c2c2e":"#fafafa", color:textColor, boxSizing:"border-box"};

  const RATINGS = ["","😰 Not ready","😐 Just started","😊 Making progress","🔥 Almost ready"];

  return (
    <div style={{minHeight:"100vh", backgroundColor:bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom:"40px"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)", padding:"20px 20px 40px", position:"relative", overflow:"hidden", textAlign:"center"}}>
        <div style={{position:"absolute", top:"-30px", right:"-30px", width:"120px", height:"120px", borderRadius:"50%", background:"rgba(255,255,255,0.06)"}} />
        <Link href="/" style={{position:"absolute", left:"20px", top:"20px", width:"34px", height:"34px", borderRadius:"10px", backgroundColor:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"16px", textDecoration:"none"}}>←</Link>
        <div style={{width:"72px", height:"72px", borderRadius:"50%", background:"linear-gradient(135deg,#fde68a,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", fontWeight:"900", color:"#7c2d12", margin:"0 auto 12px"}}>
          {user?.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div style={{color:"#fff", fontWeight:"800", fontSize:"20px"}}>{user?.name}</div>
        <div style={{color:"rgba(255,255,255,0.7)", fontSize:"13px", marginTop:"4px"}}>{user?.email}</div>
        <div style={{color:"#fde68a", fontSize:"12px", marginTop:"4px", fontWeight:"600"}}>{user?.course} · {user?.institution}</div>
      </div>

      <div style={{padding:"16px", marginTop:"-16px", display:"flex", flexDirection:"column", gap:"14px"}}>

        {saved && (
          <div style={{padding:"12px 16px", borderRadius:"12px", backgroundColor:"#f0fdf4", border:"1px solid #86efac", textAlign:"center"}}>
            <span style={{color:"#16a34a", fontWeight:"700", fontSize:"14px"}}>✅ Profile saved successfully!</span>
          </div>
        )}

        {/* Profile Info */}
        <div style={{backgroundColor:cardBg, borderRadius:"18px", overflow:"hidden", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
          <div style={{padding:"16px 18px", borderBottom:`1px solid ${borderC}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{fontWeight:"800", color:textColor, fontSize:"15px"}}>👤 Personal Info</div>
            <button onClick={()=>setEditing(!editing)} style={{padding:"7px 14px", borderRadius:"20px", border:`1.5px solid ${editing?"#dc2626":"#ea580c"}`, backgroundColor:"transparent", color:editing?"#dc2626":"#ea580c", fontWeight:"700", fontSize:"13px", cursor:"pointer"}}>
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
          <div style={{padding:"16px 18px", display:"flex", flexDirection:"column", gap:"14px"}}>
            {editing ? (
              <>
                <div><label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"6px", fontWeight:"600"}}>Full Name</label><input style={inp} value={editForm.name||""} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} /></div>
                <div><label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"6px", fontWeight:"600"}}>Target Score</label>
                  <input type="range" min="180" max="400" step="5" value={editForm.target||"250"} onChange={e=>setEditForm(p=>({...p,target:e.target.value}))} style={{width:"100%", accentColor:"#ea580c"}} />
                  <div style={{textAlign:"right", fontSize:"14px", fontWeight:"800", color:"#ea580c"}}>{editForm.target}</div>
                </div>
                <div><label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"6px", fontWeight:"600"}}>Exam Date</label><input type="date" style={inp} value={editForm.deadline||""} onChange={e=>setEditForm(p=>({...p,deadline:e.target.value}))} /></div>
                <div>
                  <label style={{fontSize:"12px", color:subText, display:"block", marginBottom:"8px", fontWeight:"600"}}>Preparation Level</label>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
                    {["1","2","3","4"].map(v => (
                      <button key={v} onClick={()=>setEditForm(p=>({...p,selfRating:v}))} style={{padding:"10px 8px", borderRadius:"12px", fontSize:"12px", cursor:"pointer", border:editForm.selfRating===v?"2px solid #ea580c":"1.5px solid "+borderC, backgroundColor:editForm.selfRating===v?"#fff8f5":cardBg, color:editForm.selfRating===v?"#ea580c":subText, fontWeight:editForm.selfRating===v?"700":"400"}}>{RATINGS[parseInt(v)]}</button>
                    ))}
                  </div>
                </div>
                <button onClick={saveProfile} style={{padding:"14px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer"}}>
                  Save Changes ✓
                </button>
              </>
            ) : (
              <>
                {[
                  {label:"Name", value:user?.name},
                  {label:"Email", value:user?.email},
                  {label:"Institution", value:user?.institution},
                  {label:"Course", value:user?.course},
                  {label:"Target Score", value:`${user?.target}/400`},
                  {label:"Subjects", value:user?.subjects?.join(", ")},
                  {label:"Readiness", value:RATINGS[parseInt(user?.selfRating||"1")]},
                ].map((item,i) => (
                  <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:i<6?"10px":"0", borderBottom:i<6?`1px solid ${borderC}`:"none"}}>
                    <span style={{fontSize:"13px", color:subText, flexShrink:0}}>{item.label}</span>
                    <span style={{fontSize:"13px", color:textColor, fontWeight:"600", textAlign:"right", maxWidth:"65%"}}>{item.value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Study Reminders & Alarms */}
        <div style={{backgroundColor:cardBg, borderRadius:"18px", overflow:"hidden", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
          <div style={{padding:"16px 18px", borderBottom:`1px solid ${borderC}`}}>
            <div style={{fontWeight:"800", color:textColor, fontSize:"15px"}}>🔔 Study Reminders</div>
            <div style={{fontSize:"12px", color:subText, marginTop:"2px"}}>Get notified to study every day</div>
          </div>
          <div style={{padding:"16px 18px", display:"flex", flexDirection:"column", gap:"16px"}}>

            {/* Study reminder */}
            <div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
                <div>
                  <div style={{fontSize:"14px", fontWeight:"700", color:textColor}}>📚 Daily Study Reminder</div>
                  <div style={{fontSize:"12px", color:subText}}>Reminds you to study every day</div>
                </div>
                <div onClick={()=>{const n={...alarms,studyReminder:!alarms.studyReminder};saveAlarms(n);}} style={{width:"44px", height:"24px", borderRadius:"12px", backgroundColor:alarms.studyReminder?"#ea580c":darkMode?"#3a3a3c":"#d0d0d0", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0}}>
                  <div style={{position:"absolute", top:"2px", left:alarms.studyReminder?"22px":"2px", width:"20px", height:"20px", borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}} />
                </div>
              </div>
              {alarms.studyReminder && (
                <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                  <span style={{fontSize:"13px", color:subText}}>Time:</span>
                  <input type="time" value={alarms.studyTime} onChange={e=>{const n={...alarms,studyTime:e.target.value};saveAlarms(n);scheduleNotification("📚 Study Time!","Time to study for JAMB. Keep your streak going!",e.target.value);}} style={{...inp, width:"auto", padding:"8px 12px"}} />
                </div>
              )}
            </div>

            {/* Morning motivation */}
            <div style={{borderTop:`1px solid ${borderC}`, paddingTop:"16px"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
                <div>
                  <div style={{fontSize:"14px", fontWeight:"700", color:textColor}}>🌅 Morning Motivation</div>
                  <div style={{fontSize:"12px", color:subText}}>Daily motivational JAMB tip</div>
                </div>
                <div onClick={()=>{const n={...alarms,morningMotivation:!alarms.morningMotivation};saveAlarms(n);}} style={{width:"44px", height:"24px", borderRadius:"12px", backgroundColor:alarms.morningMotivation?"#ea580c":darkMode?"#3a3a3c":"#d0d0d0", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0}}>
                  <div style={{position:"absolute", top:"2px", left:alarms.morningMotivation?"22px":"2px", width:"20px", height:"20px", borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}} />
                </div>
              </div>
              {alarms.morningMotivation && (
                <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                  <span style={{fontSize:"13px", color:subText}}>Time:</span>
                  <input type="time" value={alarms.morningTime} onChange={e=>{const n={...alarms,morningTime:e.target.value};saveAlarms(n);scheduleNotification("🌅 Good Morning!","JAMB tip: Start with your hardest subject while your mind is fresh!",e.target.value);}} style={{...inp, width:"auto", padding:"8px 12px"}} />
                </div>
              )}
            </div>

            {/* Exam countdown */}
            <div style={{borderTop:`1px solid ${borderC}`, paddingTop:"16px"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"14px", fontWeight:"700", color:textColor}}>📅 Exam Countdown Alert</div>
                  <div style={{fontSize:"12px", color:subText}}>Alert at 30, 14, 7 days before exam</div>
                </div>
                <div onClick={()=>{const n={...alarms,examCountdown:!alarms.examCountdown};saveAlarms(n);}} style={{width:"44px", height:"24px", borderRadius:"12px", backgroundColor:alarms.examCountdown?"#ea580c":darkMode?"#3a3a3c":"#d0d0d0", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0}}>
                  <div style={{position:"absolute", top:"2px", left:alarms.examCountdown?"22px":"2px", width:"20px", height:"20px", borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}} />
                </div>
              </div>
            </div>

            <div style={{padding:"10px 14px", borderRadius:"12px", backgroundColor:darkMode?"#1a1a0a":"#fffbeb", border:"1px solid #fde68a"}}>
              <div style={{fontSize:"12px", color:"#92400e"}}>💡 Allow notifications in your browser settings to receive study reminders on your phone.</div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{backgroundColor:cardBg, borderRadius:"18px", overflow:"hidden", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
          <div style={{padding:"16px 18px", borderBottom:`1px solid ${borderC}`}}>
            <div style={{fontWeight:"800", color:textColor, fontSize:"15px"}}>⚡ Quick Access</div>
          </div>
          {[
            {icon:"📅", label:"Study Plan", href:"/studyplan"},
            {icon:"📝", label:"Mock Exam", href:"/mock"},
            {icon:"🧮", label:"Question Solver", href:"/solver"},
            {icon:"🤖", label:"Ask AI Tutor", href:"/ai"},
          ].map((item,i,arr) => (
            <Link key={i} href={item.href} style={{display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px", textDecoration:"none", borderBottom:i<arr.length-1?`1px solid ${borderC}`:"none"}}>
              <span style={{fontSize:"20px"}}>{item.icon}</span>
              <span style={{fontSize:"14px", color:textColor, fontWeight:"600"}}>{item.label}</span>
              <span style={{marginLeft:"auto", color:subText, fontSize:"16px"}}>→</span>
            </Link>
          ))}
        </div>

        {/* Danger zone */}
        <div style={{backgroundColor:cardBg, borderRadius:"18px", overflow:"hidden", boxShadow:darkMode?"0 1px 6px rgba(0,0,0,0.5)":"0 1px 8px rgba(0,0,0,0.07)", border:`1px solid ${borderC}`}}>
          <button onClick={()=>{localStorage.removeItem("companion_user");router.replace("/landing");}} style={{width:"100%", padding:"16px 18px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px"}}>
            <span style={{fontSize:"20px"}}>🚪</span>
            <span style={{fontSize:"14px", color:"#ef4444", fontWeight:"700"}}>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
