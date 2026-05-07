"use client";
import { useState, useEffect } from "react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Don't show if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Don't show if permanently dismissed
    const dismissedAt = localStorage.getItem("pwa_dismissed_at");
    if (dismissedAt) {
      // Show again after 3 days
      const diff = Date.now() - parseInt(dismissedAt);
      if (diff < 3 * 24 * 60 * 60 * 1000) return;
    }

    // Listen for browser prompt
    const handler = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after 3 seconds regardless
    const t = setTimeout(() => setShow(true), 3000);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(t);
    };
  }, []);

  const install = async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") { setShow(false); return; }
    }
    // iOS / no prompt fallback
    alert('📱 To install:\n\n• Android Chrome: tap ⋮ menu → "Add to Home screen"\n• iOS Safari: tap Share → "Add to Home Screen"');
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_dismissed_at", String(Date.now()));
  };

  if (!mounted || !show) return null;

  return (
    <>
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9999,animation:"slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{margin:"12px",borderRadius:"20px",background:"linear-gradient(135deg,#1c1c1e 0%,#2c1810 100%)",padding:"16px 18px",display:"flex",alignItems:"center",gap:"14px",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",border:"1px solid rgba(234,88,12,0.4)"}}>
          <div style={{width:"48px",height:"48px",borderRadius:"14px",background:"linear-gradient(135deg,#f97316,#c2410c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",flexShrink:0,boxShadow:"0 4px 12px rgba(234,88,12,0.4)"}}>🎓</div>
          <div style={{flex:1}}>
            <div style={{color:"#fff",fontWeight:"700",fontSize:"15px",marginBottom:"2px"}}>Install Companion</div>
            <div style={{color:"rgba(255,255,255,0.55)",fontSize:"12px"}}>Study faster — add to your home screen</div>
          </div>
          <button onClick={dismiss} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:"22px",cursor:"pointer",padding:"4px",lineHeight:1,flexShrink:0}}>×</button>
          <button onClick={install} style={{padding:"10px 20px",borderRadius:"20px",border:"none",background:"linear-gradient(135deg,#c2410c,#ea580c)",color:"#fff",fontWeight:"700",fontSize:"14px",cursor:"pointer",flexShrink:0,boxShadow:"0 3px 10px rgba(234,88,12,0.4)",whiteSpace:"nowrap"}}>
            Install
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(120%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </>
  );
}