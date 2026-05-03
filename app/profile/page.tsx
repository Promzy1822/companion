"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User { name:string; email:string; target:string; institution:string; course:string; subjects:string[]; deadline:string; selfRating:string; }
interface AlarmSettings { studyReminder:boolean; studyTime:string; morningMotivation:boolean; morningTime:string; examCountdown:boolean; }

const INSTITUTIONS = ["University of Lagos","University of Ibadan","OAU Ile-Ife","UNILORIN","UNIBEN","ABU Zaria","University of Nigeria Nsukka","LASU","UNIPORT","FUTO","FUNAAB","Other"];
const COURSES = ["Medicine & Surgery","Law","Engineering","Computer Science","Pharmacy","Accounting","Mass Communication","Economics","Agriculture","Education","Architecture","Nursing","Other"];

export default function Profile() {
  const [user, setUser] = useState<User|null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [alarms, setAlarms] = useState<AlarmSettings>({studyReminder:false,studyTime:"19:00",morningMotivation:false,morningTime:"07:00",examCountdown:false});
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
    setTimeout(() => setSaved(false), 2500);
  };

  const saveAlarms = (newAlarms: AlarmSettings) => {
    setAlarms(newAlarms);
    localStorage.setItem("alarm_settings", JSON.stringify(newAlarms));
    if ((newAlarms.studyReminder || newAlarms.morningMotivation) && "Notification" in window) {
      Notification.requestPermission();
    }
  };

  if (!mounted) return null;

  const bg = darkMode ? "#0a0a0a" : "#f2f2f7";
  const cardBg = darkMode ? "#1c1c1e" : "#fff";
  const textColor = darkMode ? "#f2f2f7" : "#1c1c1e";
  const subText = darkMode ? "#98989d" : "#6e6e73";
  const borderC = darkMode ? "#2c2c2e" : "#e5e5ea";
  const inp: React.CSSProperties = {width:"100%",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${borderC}`,fontSize:"14px",outline:"none",backgroundColor:darkMode?"#2c2c2e":"#fafafa",color:textColor,boxSizing:"border-box"};
  const lbl: React.CSSProperties = {fontSize:"12px",color:subText,display:"block",marginBottom:"6px",fontWeight:"600"};
  const RATINGS = ["","😰 Not ready","😐 Just started","😊 Making progress","🔥 Almost ready"];

  const Toggle = ({on, onToggle}: {on:boolean; onToggle:()=>void}) => (
    <div onClick={onToggle} style={{width:"44px",height:"24px",borderRadius:"12px",backgroundColor:on?"#ea580c":darkMode?"#3a3a3c":"#d0d0d0",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:"2px",left:on?"22px":"2px",width:"20px",height:"20px",borderRadius:"50%",backgroundColor:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}} />
    </div>
  );

  return (
    <div style={{minHeight:"100vh",backgroundColor:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingBottom:"40px"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#431407,#7c2d12,#c2410c,#ea580c)",padding:"24px 20px 48px",position:"relative",overflow:"hidden",textAlign:"center"}}>
        <div style={{position:"absolute",top:"-40px",right:"-40px",width:"160px",height:"160px",borderRadius:"50%",background:"rgba(255,255,255,0.06)"}} />
        <div style={{position:"absolute",bottom:"-20px",left:"-20px",width:"100px",height:"100px",borderRadius:"50%",background:"rgba(255,255,255,0.04)"}} />
        <Link href="/" style={{position:"absolute",left:"16px",top:"20px",width:"34px",height:"34px",borderRadius:"10px",backgroundColor:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"16px",textDecoration:"none"}}>←</Link>
        <div style={{width:"80px",height:"80px",borderRadius:"50%",background:"linear-gradient(135deg,#fde68a,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",fontWeight:"900",color:"#7c2d12",margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}}>
          {user?.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div style={{color:"#fff",fontWeight:"900",fontSize:"20px",letterSpacing:"-0.5px"}}>{user?.name}</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:"13px",marginTop:"3px"}}>{user?.email}</div>
        <div style={{marginTop:"8px",display:"inline-block",padding:"5px 14px",borderRadius:"20px",backgroundColor:"rgba(255,255,255,0.15)",color:"#fde68a",fontSize:"12px",fontWeight:"700"}}>
          {user?.course} · {user?.institution}
        </div>
      </div>

      <div style={{padding:"16px",marginTop:"-28px",display:"flex",flexDirection:"column",gap:"14px"}}>

        {saved && (
          <div style={{padding:"12px 16px",borderRadius:"14px",backgroundColor:"#f0fdf4",border:"1px solid #86efac",textAlign:"center",boxShadow:"0 2px 8px rgba(22,163,74,0.15)"}}>
            <span style={{color:"#16a34a",fontWeight:"700",fontSize:"14px"}}>✅ Profile saved successfully!</span>
          </div>
        )}

        {/* Profile card */}
        <div style={{backgroundColor:cardBg,borderRadius:"20px",overflow:"hidden",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.5)":"0 2px 16px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
          <div style={{padding:"16px 18px",borderBottom:`1px solid ${borderC}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:"800",color:textColor,fontSize:"15px"}}>👤 Personal Info</div>
              <div style={{fontSize:"11px",color:subText,marginTop:"2px"}}>Tap Edit to update your details</div>
            </div>
            <button onClick={()=>{setEditing(!editing);if(!editing)setEditForm(user||{});}} style={{padding:"7px 16px",borderRadius:"20px",border:`1.5px solid ${editing?"#dc2626":"#ea580c"}`,backgroundColor:editing?"#fff0f0":"#fff8f5",color:editing?"#dc2626":"#ea580c",fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>
              {editing ? "Cancel" : "✏️ Edit"}
            </button>
          </div>

          <div style={{padding:"18px",display:"flex",flexDirection:"column",gap:"14px"}}>
            {editing ? (
              <>
                <div><label style={lbl}>Full Name</label><input style={inp} value={editForm.name||""} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} placeholder="Your full name" /></div>
                <div><label style={lbl}>Email Address</label><input style={inp} type="email" value={editForm.email||""} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))} placeholder="your@email.com" /></div>
                <div>
                  <label style={lbl}>Target Institution</label>
                  <select style={inp} value={editForm.institution||""} onChange={e=>setEditForm(p=>({...p,institution:e.target.value}))}>
                    <option value="">Select institution...</option>
                    {INSTITUTIONS.map(i=><option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Desired Course</label>
                  <select style={inp} value={editForm.course||""} onChange={e=>setEditForm(p=>({...p,course:e.target.value}))}>
                    <option value="">Select course...</option>
                    {COURSES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Target Score: <span style={{color:"#ea580c",fontWeight:"800",fontSize:"16px"}}>{editForm.target}</span></label>
                  <input type="range" min="180" max="400" step="5" value={editForm.target||"250"} onChange={e=>setEditForm(p=>({...p,target:e.target.value}))} style={{width:"100%",accentColor:"#ea580c"}} />
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:subText,marginTop:"4px"}}><span>180</span><span>290</span><span>400</span></div>
                </div>
                <div><label style={lbl}>JAMB Exam Date</label><input type="date" style={inp} value={editForm.deadline||""} onChange={e=>setEditForm(p=>({...p,deadline:e.target.value}))} /></div>
                <div>
                  <label style={{...lbl,marginBottom:"10px"}}>Preparation Level</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                    {["1","2","3","4"].map(v=>(
                      <button key={v} onClick={()=>setEditForm(p=>({...p,selfRating:v}))} style={{padding:"11px 8px",borderRadius:"12px",fontSize:"12px",cursor:"pointer",border:editForm.selfRating===v?"2px solid #ea580c":`1.5px solid ${borderC}`,backgroundColor:editForm.selfRating===v?"#fff8f5":cardBg,color:editForm.selfRating===v?"#ea580c":subText,fontWeight:editForm.selfRating===v?"700":"400"}}>
                        {RATINGS[parseInt(v)]}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveProfile} style={{padding:"14px",borderRadius:"14px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:"pointer",boxShadow:"0 4px 12px rgba(234,88,12,0.3)"}}>
                  Save Changes ✓
                </button>
              </>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
                {[
                  {label:"Name",value:user?.name,icon:"👤"},
                  {label:"Email",value:user?.email,icon:"📧"},
                  {label:"Institution",value:user?.institution,icon:"🏛️"},
                  {label:"Course",value:user?.course,icon:"📖"},
                  {label:"Target",value:`${user?.target}/400`,icon:"🎯"},
                  {label:"Subjects",value:user?.subjects?.join(", "),icon:"📚"},
                  {label:"Readiness",value:RATINGS[parseInt(user?.selfRating||"1")],icon:"⭐"},
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px",padding:"12px 0",borderBottom:i<arr.length-1?`1px solid ${borderC}`:"none"}}>
                    <span style={{fontSize:"16px",flexShrink:0,marginTop:"1px"}}>{item.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"11px",color:subText,fontWeight:"600",marginBottom:"2px"}}>{item.label}</div>
                      <div style={{fontSize:"13px",color:textColor,fontWeight:"600",lineHeight:"1.4"}}>{item.value || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alarms */}
        <div style={{backgroundColor:cardBg,borderRadius:"20px",overflow:"hidden",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.5)":"0 2px 16px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
          <div style={{padding:"16px 18px",borderBottom:`1px solid ${borderC}`}}>
            <div style={{fontWeight:"800",color:textColor,fontSize:"15px"}}>🔔 Study Reminders</div>
            <div style={{fontSize:"11px",color:subText,marginTop:"2px"}}>Stay on track with daily notifications</div>
          </div>
          <div style={{padding:"18px",display:"flex",flexDirection:"column",gap:"18px"}}>
            {[
              {key:"studyReminder",timeKey:"studyTime",icon:"📚",title:"Daily Study Reminder",sub:"Reminds you to study every day",defaultTime:"19:00"},
              {key:"morningMotivation",timeKey:"morningTime",icon:"🌅",title:"Morning Motivation",sub:"Daily JAMB tip to start your day",defaultTime:"07:00"},
            ].map((item,i)=>(
              <div key={i} style={{paddingBottom:i===0?"18px":"0",borderBottom:i===0?`1px solid ${borderC}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:"700",color:textColor}}>{item.icon} {item.title}</div>
                    <div style={{fontSize:"12px",color:subText}}>{item.sub}</div>
                  </div>
                  <Toggle on={(alarms as any)[item.key]} onToggle={()=>saveAlarms({...alarms,[item.key]:!(alarms as any)[item.key]})} />
                </div>
                {(alarms as any)[item.key] && (
                  <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",borderRadius:"12px",backgroundColor:darkMode?"#2c2c2e":"#f8f8f8",border:`1px solid ${borderC}`}}>
                    <span style={{fontSize:"13px",color:subText,fontWeight:"600"}}>⏰ Alert at</span>
                    <input type="time" value={(alarms as any)[item.timeKey]} onChange={e=>saveAlarms({...alarms,[item.timeKey]:e.target.value})} style={{...inp,width:"auto",padding:"8px 12px",flex:1}} />
                  </div>
                )}
              </div>
            ))}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:"14px",fontWeight:"700",color:textColor}}>📅 Exam Countdown Alerts</div>
                <div style={{fontSize:"12px",color:subText}}>Alerts at 30, 14, 7 days before exam</div>
              </div>
              <Toggle on={alarms.examCountdown} onToggle={()=>saveAlarms({...alarms,examCountdown:!alarms.examCountdown})} />
            </div>

            <div style={{padding:"10px 14px",borderRadius:"12px",backgroundColor:darkMode?"#1a1a0a":"#fffbeb",border:"1px solid #fde68a"}}>
              <div style={{fontSize:"12px",color:"#92400e",lineHeight:"1.5"}}>💡 Allow notifications in your browser for reminders to work. Go to browser Settings → Notifications → Allow for this site.</div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{backgroundColor:cardBg,borderRadius:"20px",overflow:"hidden",boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.5)":"0 2px 16px rgba(0,0,0,0.08)",border:`1px solid ${borderC}`}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${borderC}`}}>
            <div style={{fontWeight:"800",color:textColor,fontSize:"15px"}}>⚡ Quick Access</div>
          </div>
          {[
            {icon:"📅",label:"Study Plan",href:"/studyplan"},
            {icon:"📝",label:"Mock Exam",href:"/mock"},
            {icon:"🧮",label:"Question Solver",href:"/solver"},
            {icon:"🤖",label:"Ask AI Tutor",href:"/ai"},
          ].map((item,i,arr)=>(
            <Link key={i} href={item.href} style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 18px",textDecoration:"none",borderBottom:i<arr.length-1?`1px solid ${borderC}`:"none"}}>
              <span style={{fontSize:"20px"}}>{item.icon}</span>
              <span style={{fontSize:"14px",color:textColor,fontWeight:"600"}}>{item.label}</span>
              <span style={{marginLeft:"auto",color:subText,fontSize:"16px"}}>›</span>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button onClick={()=>{localStorage.removeItem("companion_user");router.replace("/landing");}} style={{width:"100%",padding:"16px",borderRadius:"16px",border:"none",background:"linear-gradient(135deg,#dc2626,#ef4444)",color:"#fff",fontWeight:"700",fontSize:"15px",cursor:"pointer",boxShadow:"0 4px 12px rgba(220,38,38,0.25)"}}>
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
