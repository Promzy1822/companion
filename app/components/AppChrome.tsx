"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, LogIn } from "lucide-react";
import NavbarView from "./NavbarView";
import BottomNavView from "./BottomNavView";
import { Session } from "../lib/session";
import { Sync } from "../lib/sync";
import { createClient } from "../lib/supabase/client";
import { palette } from "../lib/design";

/**
 * The one and only top bar + bottom tabs / side rail. Lives in the root layout and is
 * owned by the layout — pages no longer register or theme the chrome.
 * HIDE_ALL: auth/marketing routes with no app chrome at all.
 * HIDE_TOP: pages that draw their own header (AI, Questions, Plan); they keep the tabs/rail.
 */
const HIDE_ALL = ["/auth", "/landing", "/reset-password"];
const HIDE_TOP = ["/ai", "/questions", "/studyplan"];
/** Pages whose own bottom composer would collide with the phone tabs: rail only, as before. */
const RAIL_ONLY = ["/ai"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export default function AppChrome() {
  const pathname = usePathname() ?? "";

  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // H3 — session expiry. Two triggers, one handler:
  //   (a) onAuthStateChange SIGNED_OUT while this device had a signed-in
  //       user (companion_user cache present), and
  //   (b) boot check: companion_user present but Supabase getSession()
  //       returns no session (the token died while the tab was closed).
  // Neither fires for an intentional logout: Session.logout() sets the
  // logging-out marker first, and the handler consumes + ignores it.
  // On expiry the identity cache is cleared (so the UI stops looking
  // logged in) but study data stays on-device for the next login.
  // The user sees the banner below for a moment, then lands on
  // /landing?session=expired, where the login screen shows the same
  // message. Auth/front-door routes never redirect from here.
  useEffect(() => {
    let alive = true;
    const onFrontDoor = () => {
      const p = pathnameRef.current;
      return p === "/landing" || p === "/auth" || p === "/reset-password"
        || p.startsWith("/landing/") || p.startsWith("/auth/");
    };
    const handleExpired = () => {
      if (!alive) return;
      Session.markExpired();
      Session.clearUserCache();
      if (onFrontDoor()) return;
      setSessionExpired(true);
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
      redirectTimer.current = setTimeout(() => {
        router.replace("/landing?session=expired");
      }, 2500);
    };
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      if (Session.isLoggingOut()) { Session.clearLoggingOutFlag(); return; }
      if (!Session.getUser()) return;
      handleExpired();
    });
    // Returning session: pull the account's synced study state once per
    // browser session (login/register hydrate immediately after sign-in).
    try {
      if (Session.getUser() && !sessionStorage.getItem("companion_hydrated")) {
        sessionStorage.setItem("companion_hydrated", "1");
        void Sync.hydrate();
      }
    } catch {}
    // Boot check (b): cached user, dead Supabase session.
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive || data.session) return;
      if (Session.isLoggingOut()) { Session.clearLoggingOutFlag(); return; }
      if (!Session.getUser()) return;
      handleExpired();
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (matches(pathname, HIDE_ALL)) return null;
  const T = palette();
  return (
    <>
      {!matches(pathname, HIDE_TOP) && <NavbarView />}
      <BottomNavView railOnly={matches(pathname, RAIL_ONLY)} />
      {sessionExpired && (
        <div role="alert" style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 190, background: T.dangerTint, borderBottom: `1px solid ${T.danger}55`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font)" }}>
          <AlertTriangle size={16} color={T.dangerText} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: T.text, lineHeight: 1.45 }}>Your session ended — log in again to keep syncing.</span>
          <button type="button" onClick={() => router.replace("/landing?session=expired")} style={{ display: "flex", alignItems: "center", gap: 6, background: T.primary, color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", minHeight: 36, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
            <LogIn size={14} strokeWidth={2} /> Log in again
          </button>
        </div>
      )}
    </>
  );
}
