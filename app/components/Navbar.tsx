"use client";

export { NAVBAR_HEIGHT } from "./NavbarView";

/**
 * Legacy per-page top bar registration — now inert. The top bar is owned by the
 * root layout (AppChrome) and always rendered; pages no longer register or theme
 * it. Kept, with the same props, so existing page code compiles unchanged.
 */
export default function Navbar(_props: {
  darkMode?: boolean;
  onToggleDark?: () => void;
}) {
  return null;
}
