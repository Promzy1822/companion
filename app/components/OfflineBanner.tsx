"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { palette } from "../lib/design";

/**
 * OfflineBanner (H4) — global online/offline indicator, mounted once in the
 * root layout (app/layout.tsx) so it shows on every route.
 *
 * Listens for the browser online/offline events and seeds from
 * navigator.onLine on mount. Slim strip docked under the 56px top bar;
 * on pages that draw their own header (AI, Questions, Plan) it floats over
 * the top of the content instead — still readable, and it disappears the
 * moment the connection returns, so there is no dismiss button.
 *
 * Copy rule: say what happened AND what is safe — work is saved on-device
 * and syncs when back online (study state is localStorage-first).
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => {
      setOffline(typeof navigator !== "undefined" ? !navigator.onLine : false);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  const T = palette();

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        zIndex: 190,
        background: T.warningTint,
        borderBottom: `1px solid ${T.warning}55`,
        padding: "9px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "var(--font)",
      }}
    >
      <WifiOff size={15} color={T.warning} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: T.text, lineHeight: 1.45, textAlign: "center" }}>
        You&apos;re offline — your work is saved on this device and will sync when you&apos;re back online.
      </span>
    </div>
  );
}
