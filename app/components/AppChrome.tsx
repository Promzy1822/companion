"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NavbarView from "./NavbarView";
import BottomNavView from "./BottomNavView";
import { Session } from "../lib/session";
import { Sync } from "../lib/sync";

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

  // Returning session: pull the account's synced study state once per
  // browser session (login/register hydrate immediately after sign-in).
  useEffect(() => {
    try {
      if (!Session.getUser()) return;
      if (sessionStorage.getItem("companion_hydrated")) return;
      sessionStorage.setItem("companion_hydrated", "1");
      void Sync.hydrate();
    } catch {}
  }, []);

  if (matches(pathname, HIDE_ALL)) return null;
  return (
    <>
      {!matches(pathname, HIDE_TOP) && <NavbarView />}
      <BottomNavView railOnly={matches(pathname, RAIL_ONLY)} />
    </>
  );
}
