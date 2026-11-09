"use client";

export { BOTTOM_NAV_HEIGHT } from "./BottomNavView";

/**
 * Legacy per-page tabs registration — now inert. The bottom tabs / side rail are
 * owned by the root layout (AppChrome) and always rendered; pages no longer
 * register or theme them. Kept, with the same props, so existing page code
 * compiles unchanged.
 */
export default function BottomNav(_props: {
  darkMode?: boolean;
  railOnly?: boolean;
}) {
  return null;
}
