"use client";
import { useState, useEffect } from "react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa_dismissed")) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) { setInstalled(true); return; }
    const handler = () => setShow(true);
    window.addEventListener('beforeinstallprompt', handler);
    // Show after 3 seconds if prompt already fired
    const t = setTimeout(() => {
      if ((window as any).deferredPrompt) setShow(true);
    }, 3000);
    return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t); };
  }, []);

  const install = async () => {
    const prompt = (window as any).deferredPrompt;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_dismissed", "1");
  };

  if (!show || installed) return null;

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:9999,
      background:"linear-gradient(135deg,#1c1c1e,#2c1810)",
      padding:"16px 20px", display:"flex", alignItems:"center", gap:"14px",
      boxShadow:"0 -4px 24px rgba(0,0,0,0.3)",
      borderTop:"1px solid rgba(234,88,12,0.3)",
      animation:"slideUp 0.3s ease"
    }}>
      <div style={{width:"44px", height:"44px", borderRadius:"12px", background:"linear-gradient(135deg,#c2410c,#ea580c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0}}>🎓</div>
      <div style={{flex:1}}>
        <div style={{color:"#fff", fontWeight:"700", fontSize:"14px"}}>Install Companion</div>
        <div style={{color:"rgba(255,255,255,0.6)", fontSize:"12px"}}>Add to home screen for quick access</div>
      </div>
      <button onClick={dismiss} style={{background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:"18px", cursor:"pointer", padding:"4px", flexShrink:0}}>✕</button>
      <button onClick={install} style={{padding:"10px 18px", borderRadius:"20px", border:"none", background:"linear-gradient(135deg,#c2410c,#ea580c)", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer", flexShrink:0, boxShadow:"0 2px 8px rgba(234,88,12,0.4)"}}>
        Install
      </button>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}
