"use client";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { MAP, FALLBACK } from "./appicon-map";
import type { LucideIcon } from "lucide-react";

// Emoji clusters (incl. flags). Plain text symbols such as (c), (tm) and arrows are deliberately NOT matched.
const PICTO =
  "(?:(?![\\u00A9\\u00AE\\u2122\\u203C\\u2049\\u2139\\u2194-\\u21AA\\u231A\\u231B\\u24C2\\u25AA-\\u25FE\\u2934\\u2935\\u2B05-\\u2B07\\u3030\\u303D\\u3297\\u3299])" +
  "\\p{Extended_Pictographic}(?:\\uFE0F|\\u20E3|[\\u{1F3FB}-\\u{1F3FF}]|\\u200D\\p{Extended_Pictographic}\\uFE0F?)*" +
  "|[\\u{1F1E6}-\\u{1F1FF}]{2})";
const HAS   = new RegExp(PICTO, "u");
const SPLIT = new RegExp("(" + PICTO + ")", "gu");

function lookup(e: string): LucideIcon {
  const clean = e.replace(/\uFE0F/g, "");
  if (MAP[clean]) return MAP[clean];
  if (/\uD83C[\uDDE6-\uDDFF]/.test(clean)) return MAP["🚩"] || FALLBACK; // country flags
  const first = Array.from(clean)[0];
  return (first && MAP[first]) || FALLBACK;
}

/** One emoji character -> the matching lucide icon, sized to the surrounding text. */
export function AppIcon({
  e, size = "1.15em", strokeWidth = 2, style, className,
}: {
  e: string; size?: number | string; strokeWidth?: number;
  style?: CSSProperties; className?: string;
}) {
  const Icon = lookup(e);
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.2em", flexShrink: 0, ...style }}
    />
  );
}

function renderString(s: string): ReactNode {
  if (!HAS.test(s)) return s;
  return s.split(SPLIT).map((p, i) =>
    i % 2 === 1 ? <AppIcon key={i} e={p} /> : p ? <Fragment key={i}>{p}</Fragment> : null
  );
}

/** Renders text, turning any emoji inside it into lucide icons. Non-string children pass through untouched. */
export function Rich({ children }: { children?: ReactNode }) {
  if (typeof children === "string") return <>{renderString(children)}</>;
  if (Array.isArray(children)) {
    return <>{children.map((c, i) => (typeof c === "string" ? <Fragment key={i}>{renderString(c)}</Fragment> : c))}</>;
  }
  return <>{children}</>;
}

export default AppIcon;
