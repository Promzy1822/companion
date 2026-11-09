"use client";
import { usePathname } from "next/navigation";
import NavbarView from "./NavbarView";
import BottomNavView from "./BottomNavView";

/**
 * The one and only top bar + bottom tabs / side rail. Lives in the root layout and is
 * owned by the layout — pages no longer register or theme the chrome.
 * HIDE_ALL: auth/marketing routes with no app chrome at all.
 * HIDE_TOP: pages that still draw their own header (removed route by route as the
 * redesign reaches them in steps 2–5); they keep the tabs/rail.
 */
const HIDE_ALL = ["/auth", "/landing", "/reset-password"];
const HIDE_TOP = ["/ai", "/questions", "/syllabus", "/studyplan", "/solver"];
/** Pages whose own bottom composer would collide with the phone tabs: rail only, as before. */
const RAIL_ONLY = ["/ai"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export default function AppChrome() {
  const pathname = usePathname() ?? "";
  if (matches(pathname, HIDE_ALL)) return null;
  return (
    <>
      {!matches(pathname, HIDE_TOP) && <NavbarView />}
      <BottomNavView railOnly={matches(pathname, RAIL_ONLY)} />
    </>
  );
}
