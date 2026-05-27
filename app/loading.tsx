export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh", background: "#1877F2",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
    }}>
      <img
        src="/icon-192.png"
        alt="Companion"
        width={72} height={72}
        style={{ borderRadius: "20px", marginBottom: "20px", boxShadow: "0 8px 28px rgba(0,0,0,0.25)" }}
      />
      <div style={{ color: "#fff", fontWeight: 800, fontSize: "24px", marginBottom: "6px", letterSpacing: "-0.5px" }}>
        companion
      </div>
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginBottom: "36px" }}>
        AI JAMB Study Assistant
      </div>
      <div style={{ display: "flex", gap: "7px" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 9, height: 9, borderRadius: "50%",
            background: "rgba(255,255,255,0.7)",
            animation: `pulseDot 1.4s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
