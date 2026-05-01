"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface User { name: string; email: string; target: string; institution: string; }

export default function Navbar({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = localStorage.getItem("companion_user");
    if (u) setUser(JSON.parse(u));
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const logout = () => {
    localStorage.removeItem("companion_user");
    setUser(null);
    setOpen(false);
    router.push("/landing");
  };

  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", position:"relative", zIndex:100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <span style={{ fontSize:"26px" }}>🎓</span>
        <div>
          <div style={{ color:"#fff", fontWeight:"900", fontSize:"20px" }}>Companion</div>
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"10px" }}>JAMB Study Assistant</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
        <button
          onClick={onToggleDark}
          style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:"34px", height:"34px", fontSize:"15px", cursor:"pointer" }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {user ? (
          <div ref={dropRef} style={{ position:"relative" }}>
            <button
              onClick={() => setOpen(prev => !prev)}
              style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"20px", padding:"5px 10px 5px 5px", cursor:"pointer" }}
            >
              <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg, #fde68a, #f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"800", color:"#7c2d12" }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ color:"#fff", fontSize:"12px", fontWeight:"600" }}>{user.name.split(" ")[0]}</span>
              <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"10px" }}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div style={{
                position:"fixed",
                top:"70px",
                right:"16px",
                width:"230px",
                backgroundColor:"#fff",
                borderRadius:"18px",
                boxShadow:"0 12px 40px rgba(0,0,0,0.2)",
                border:"1px solid #f0f0f0",
                overflow:"hidden",
                zIndex:9999,
                animation:"dropIn 0.15s ease"
              }}>
                {/* User info */}
                <div style={{ padding:"16px", background:"linear-gradient(135deg, #fff8f5, #fff)", borderBottom:"1px solid #f5f5f5" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg, #fde68a, #f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", fontWeight:"800", color:"#7c2d12" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:"700", fontSize:"14px", color:"#1a1a1a" }}>{user.name}</div>
                      <div style={{ fontSize:"11px", color:"#999" }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ marginTop:"10px", padding:"7px 12px", borderRadius:"10px", backgroundColor:"#fff8f5", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"12px", color:"#666" }}>Target Score</span>
                    <span style={{ fontSize:"12px", color:"#ea580c", fontWeight:"700" }}>{user.target} pts</span>
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { icon:"🏠", label:"Dashboard", href:"/" },
                  { icon:"🤖", label:"Ask AI", href:"/ai" },
                  { icon:"📚", label:"Learn", href:"/subjects?mode=learn" },
                  { icon:"✏️", label:"Practice", href:"/subjects?mode=practice" },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{ display:"flex", alignItems:"center", gap:"12px", padding:"13px 16px", textDecoration:"none", borderBottom:"1px solid #fafafa" }}
                  >
                    <span style={{ fontSize:"17px" }}>{item.icon}</span>
                    <span style={{ fontSize:"14px", color:"#1a1a1a", fontWeight:"500" }}>{item.label}</span>
                  </Link>
                ))}

                {/* Logout */}
                <button
                  onClick={logout}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"13px 16px", background:"none", border:"none", cursor:"pointer", borderTop:"1px solid #f0f0f0" }}
                >
                  <span style={{ fontSize:"17px" }}>🚪</span>
                  <span style={{ fontSize:"14px", color:"#ef4444", fontWeight:"600" }}>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth" style={{ background:"rgba(255,255,255,0.2)", borderRadius:"20px", padding:"8px 16px", color:"#fff", fontSize:"13px", textDecoration:"none", fontWeight:"700", border:"1px solid rgba(255,255,255,0.3)" }}>
            Sign Up / Login
          </Link>
        )}
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-8px); }
          to { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
