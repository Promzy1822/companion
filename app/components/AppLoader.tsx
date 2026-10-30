"use client";

interface AppLoaderProps {
  fullScreen?: boolean;
  message?:    string;
  dark?:       boolean;
}

/**
 * PageSkeleton — used for page navigation loading states.
 * Shows a content placeholder that matches the page structure.
 * Never shows the full splash screen — that's only for cold start.
 */
export function PageSkeleton({ dark = false }: { dark?: boolean }) {
  const bg      = dark ? "#0E1018" : "#F4F5FA";
  const surface = dark ? "#161925" : "#ffffff";
  const border  = dark ? "#2A2E3F" : "#E3E6EF";

  return (
    <div style={{ minHeight: "100vh", background: bg }}>
      {/* Navbar skeleton */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 56,
        background: surface, borderBottom: `1px solid ${border}`,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12, zIndex: 100,
      }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 6 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
      </div>

      {/* Content skeleton */}
      <div style={{ paddingTop: 70, padding: "70px 14px 80px" }}>
        <div className="skeleton" style={{ height: 110, borderRadius: 16, marginBottom: 14 }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: surface, borderRadius: 16,
            padding: 18, marginBottom: 12, border: `1px solid ${border}`,
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: "65%", marginBottom: 8, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav skeleton */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 60,
        background: surface, borderTop: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
      }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 28, height: 8, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AppLoader — used ONLY for in-page data loading (API calls, etc.)
 * NOT for page navigation. For navigation use PageSkeleton.
 * For cold start use the #companion-splash in layout.tsx.
 */
export default function AppLoader({ fullScreen = false, message, dark = false }: AppLoaderProps) {
  const spinner = "#EA580C";
  const track   = dark ? "#1E2230" : "#F4F5FA";
  const textCol = dark ? "#A7AEC2" : "#6B7385";
  const bg      = dark ? "#0E1018" : "#F4F5FA";

  // fullScreen inline loader — small spinner, no logo, not a splash
  if (fullScreen) {
    return (
      <PageSkeleton dark={dark} />
    );
  }

  // Inline spinner — for within-card/section loading
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
