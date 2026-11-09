// Centralised design tokens — import in any page/component

export const C = {
  primary:      "#4F46E5",
  primaryHover: "#4338CA",
  primaryDark:  "#3730A3",
  primaryLight: "#EEF2FF",
  primarySoft:  "#F5F7FF",

  bg:           "#F4F5FA",
  surface:      "#FFFFFF",
  surface2:     "#F8F9FC",
  surface3:     "#EEF0F6",

  border:       "#E3E6EF",
  borderLight:  "#F4F5FA",

  text:         "#0F172A",
  sub:          "#475569",
  muted:        "#6B7385",

  success:      "#31A24C",
  successLight: "#E6F4EA",
  warning:      "#F7B928",
  warningLight: "#FEF6E4",
  danger:       "#FA3E3E",
  dangerLight:  "#FEE9E9",

  accent:       "#EA580C",
  accentLight:  "#FFF3EE",
  primaryText:  "#4338CA",
  successText:  "#177245",
  dangerText:   "#D92D20",
};

export const D = {
  primary:      "#6366F1",
  primaryHover: "#818CF8",
  primaryDark:  "#4F46E5",
  primaryLight: "rgba(99,102,241,0.12)",
  primarySoft:  "#1D1E45",

  bg:           "#0E1018",
  surface:      "#161925",
  surface2:     "#1E2230",
  surface3:     "#2A2F42",

  border:       "#2A2E3F",
  borderLight:  "#2A2E3F",

  text:         "#E3E6EF",
  sub:          "#A7AEC2",
  muted:        "#8E96AC",

  success:      "#31A24C",
  successLight: "rgba(49,162,76,0.12)",
  warning:      "#F7B928",
  warningLight: "rgba(247,185,40,0.12)",
  danger:       "#FA3E3E",
  dangerLight:  "rgba(250,62,62,0.12)",

  accent:       "#F97316",
  accentLight:  "rgba(249,115,22,0.12)",
  primaryText:  "#A5B4FC",
  successText:  "#2FBF71",
  dangerText:   "#FF6B5E",
};

export function palette(_dark: boolean) {
  // Companion is dark-only: the light palette (C) is never selected.
  // Every surface gets the dark tokens regardless of what any stale
  // document, stored setting or caller claims — light cannot render.
  return {
    bg:      D.bg,
    surface: D.surface,
    s2:      D.surface2,
    s3:      D.surface3,
    border:  D.border,
    borderLight: D.borderLight,
    text:    D.text,
    sub:     D.sub,
    muted:   D.muted,
    primary: D.primary,
    primaryText: D.primaryText,
    primaryHover: D.primaryHover,
    primaryDark:  D.primaryDark,
    primaryTint:  D.primaryLight,
    primarySoft:  D.primarySoft,
    success: D.success,
    successText: D.successText,
    successTint: D.successLight,
    warning: D.warning,
    warningTint: D.warningLight,
    danger:  D.danger,
    dangerText:  D.dangerText,
    dangerTint:  D.dangerLight,
    accent:  D.accent,
    accentTint:  D.accentLight,
    onPrimary: "#FFFFFF",
  };
}

export const R = {
  sm:   "6px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  xl2:  "20px",
  pill: "50px",
};

export const S = {
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 2px 8px rgba(0,0,0,0.08)",
  lg: "0 4px 20px rgba(0,0,0,0.1)",
  xl: "0 8px 32px rgba(0,0,0,0.12)",
};

// Canonical subject colours — the only place subject colours are defined.
// Every page (Learn, Plan, landing, questions) reads from here.
export const SUBJECT_COLORS: Record<string, string> = {
  english: "#818CF8", mathematics: "#B07FE8", physics: "#E3B341",
  chemistry: "#2FBF71", biology: "#E87F35", government: "#8FA3E8",
  economics: "#3FBFBF", literature: "#E87FB0",
};

export function subjectColor(name: string): string {
  const k = (name || "").toLowerCase();
  const keys = Object.keys(SUBJECT_COLORS).sort((a, b) => b.length - a.length);
  for (const key of keys) if (k.includes(key)) return SUBJECT_COLORS[key];
  return "#9AA0B5";
}
