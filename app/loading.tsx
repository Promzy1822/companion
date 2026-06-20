/**
 * app/loading.tsx
 *
 * Next.js shows this during route transitions (Suspense fallback).
 * Must NOT be the full splash screen — that's only for cold start.
 * This shows a lightweight skeleton that matches the page structure.
 */
export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F0F2F5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Navbar skeleton */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 56, background: "#fff",
        borderBottom: "1px solid #E4E6EB",
        display: "flex", alignItems: "center",
        padding: "0 16px", gap: 12, zIndex: 100,
      }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 120, height: 18, borderRadius: 6 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
      </div>

      {/* Page content skeleton */}
      <div style={{ paddingTop: 56, padding: "72px 14px 80px" }}>
        {/* Hero block */}
        <div className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 14 }} />
        {/* Cards */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: "#fff", borderRadius: 16, padding: 18,
            marginBottom: 12, border: "1px solid #E4E6EB",
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: "45%", borderRadius: 6 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav skeleton */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 60, background: "#fff",
        borderTop: "1px solid #E4E6EB",
        display: "flex", alignItems: "center",
        justifyContent: "space-around", padding: "0 8px",
      }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 32, height: 8, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
