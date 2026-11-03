"use client";
import { useRef, useState } from "react";
import { useIsoLayoutEffect } from "../lib/theme";
import { nextChromeId, registerNav, unregisterNav } from "../lib/chrome";

export { NAVBAR_HEIGHT } from "./NavbarView";

/**
 * Pages keep using <Navbar darkMode onToggleDark /> exactly as before, but this no longer draws
 * anything: it tells the shared top bar (mounted once in the layout) how to look on this page.
 */
export default function Navbar({
  darkMode = false,
  onToggleDark,
}: {
  darkMode?: boolean;
  onToggleDark?: () => void;
}) {
  const [id] = useState(nextChromeId);
  const toggleRef = useRef(onToggleDark);
  toggleRef.current = onToggleDark;
  const hasToggle = !!onToggleDark;

  useIsoLayoutEffect(() => {
    registerNav(id, { darkMode, hasToggle, toggle: () => toggleRef.current?.() });
  }, [id, darkMode, hasToggle]);

  useIsoLayoutEffect(() => () => unregisterNav(id), [id]);

  return null;
}
