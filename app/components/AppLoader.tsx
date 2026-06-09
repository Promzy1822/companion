"use client";

interface AppLoaderProps {
  fullScreen?: boolean;
  message?:    string;
  dark?:       boolean;
}

export default function AppLoader({ fullScreen = false, message, dark = false }: AppLoaderProps) {
  const bg      = dark ? "#18191A" : "#ffffff";
  const spinner = "#EA580C";
  const track   = dark ? "#3A3B3C" : "#F0F2F5";
  const textCol = dark ? "#B0B3B8" : "#8A8D91";

  if (fullScreen) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: "#EA580C",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 18,
          boxShadow: "0 8px 28px rgba(234,88,12,0.22)",
        }}>
          <img src="/icon-192.png" alt="Companion" width={54} height={54}
            style={{ borderRadius: 10 }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 20, color: dark ? "#E4E6EB" : "#1a1a1a", marginBottom: 4, letterSpacing: "-0.4px" }}>
          companion
        </div>
        <div style={{ fontSize: 11, color: textCol, marginBottom: 36, letterSpacing: "0.5px" }}>
          AI JAMB STUDY ASSISTANT
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: `3px solid ${track}`,
          borderTopColor: spinner,
          animation: "companionSpin 0.8s linear infinite",
        }} />
        {message && (
          <div style={{ marginTop: 16, fontSize: 13, color: textCol }}>{message}</div>
        )}
        <style>{`@keyframes companionSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // Inline spinner (for within-page use)
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "48px 24px", gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: `3px solid ${track}`,
        borderTopColor: spinner,
        animation: "companionSpin 0.8s linear infinite",
      }} />
      {message && (
        <div style={{ fontSize: 13, color: textCol, fontWeight: 500 }}>{message}</div>
      )}
      <style>{`@keyframes companionSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
