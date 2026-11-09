"use client";
import NavbarView from "./NavbarView";
import BottomNavView from "./BottomNavView";
import { useChrome } from "../lib/chrome";

/** The one and only top bar + bottom tabs / side rail. Lives in the root layout, so it persists across pages. */
export default function AppChrome() {
  const { nav, tabs } = useChrome();
  return (
    <>
      {nav  && <NavbarView    darkMode={nav.reg.darkMode} onToggleDark={nav.reg.hasToggle ? nav.reg.toggle : undefined} />}
      {tabs && <BottomNavView darkMode={tabs.reg.darkMode} railOnly={tabs.reg.railOnly} />}
    </>
  );
}
