export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Logo */}
      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: "#EA580C",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
        boxShadow: "0 8px 32px rgba(234,88,12,0.25)",
      }}>
        <img src="/icon-192.png" alt="Companion" width={60} height={60}
          style={{ borderRadius: 12 }} />
      </div>

      {/* App name */}
      <div style={{ fontWeight: 800, fontSize: 22, color: "#1a1a1a", marginBottom: 4, letterSpacing: "-0.5px" }}>
        companion
      </div>
      <div style={{ fontSize: 12, color: "#8A8D91", marginBottom: 40, letterSpacing: "0.5px" }}>
        AI JAMB STUDY ASSISTANT
      </div>

      {/* Spinner */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid #F0F2F5",
        borderTopColor: "#EA580C",
        animation: "spin 0.8s linear infinite",
      }} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
