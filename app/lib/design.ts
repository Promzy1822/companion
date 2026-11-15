// Centralised design tokens — import in any page/component.
// Companion is dark-only. There is exactly ONE token system: D + palette().
// There is no light palette: the old light palette C was deleted (2026-11-15,
// §0 system rebuild). palette() takes NO argument.

export const D = {
  primary:      "#6366F1",
  primaryHover: "#818CF8",
  primaryDark:  "#4F46E5",
  primaryLight: "rgba(99,102,241,0.12)",
  primarySoft:  "#1D1E45",

  // Surface ramp (D3): each step is visibly lighter than the one below it.
  bg:           "#0B0D14",
  surface:      "#14161F",
  surface2:     "#1B1E2A",
  surface3:     "#232636",

  border:       "#343947",
  borderLight:  "#3E4358",

  text:         "#E3E6EF",
  sub:          "#A7AEC2",
  muted:        "#8E96AC",

  // One red for fills, one for text. One green for fills, one for text.
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

// Tint rule (D10): one tint alpha, 12% (hex suffix 1F), for icon tiles.
// Borders use 33% (suffix 55). Never invent another alpha for the same idea.
export function palette() {
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
  xxl:  "20px",
  pill: "999px",
};

// Shadows (D3): black at 40–55% alpha — visible on near-black surfaces.
// md/lg/xl carry a 1px rgba(255,255,255,0.06) top highlight (raised surfaces).
export const S = {
  sm: "0 1px 2px rgba(0,0,0,0.4)",
  md: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.45)",
  lg: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.5)",
  xl: "inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 40px rgba(0,0,0,0.55)",
};

// Type scale (D4). Rule: 700 for headings/buttons only, never body.
// Minimum content text is 12px; 11px is reserved for uppercase eyebrows
// with letter-spacing, never for sentences.
export const TY = {
  xs: 12,
  sm: 13,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  display: 32,
};

export const LH = {
  xs: 16,
  sm: 20,
  base: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  display: 40,
};

export const FW = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// Spacing scale (D5): 4px base unit. Card padding standard is 16px mobile /
// 20px desktop; section gaps are 12 / 16 / 24 only.
export const SP = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
};

// One focus ring (D7), used by every input, button and slider.
// Never outline: none without this ring as the replacement.
export const FOCUS_RING = "0 0 0 3px rgba(165,180,252,0.45)";

// Layout tokens (AUDIT §2). One fact, one home: breakpoints, rail, caps,
// nav heights, gaps and z-indexes live here, not as literals in pages/CSS.
export const LAYOUT = {
  bp: { tablet: 768, laptop: 1024 },
  railWidth: 248,
  contentMax: 1040,
  tabletMax: 720,
  navHeight: 56,
  bottomNavHeight: 60,
  stickyTop: 72,
  pagePad: 20,
  pagePadLg: 24,
  gap: { sm: 8, md: 12, lg: 16, xl: 20 },
  sectionGapLg: 56,
  splitGap: 64,
  pageNarrow: 760,
  proseMax: 640,
  chatMax: 820,
  authMax: 420,
  authGridMax: 1120,
  heroMax: 1040,
  sideQuestions: 300,
  sidePlan: 320,
  sideProfile: 360,
  z: {
    examBar: 50,
    banner: 140,
    bottomNav: 150,
    topBar: 200,
    rail: 210,
    dropdown: 300,
    scrim: 305,
    modal: 400,
    splash: 500,
  },
};

// Breakpoint alias (AUDIT §2.1): BP.tablet / BP.laptop.
export const BP = LAYOUT.bp;

// Canonical subject colours — the only place subject colours are defined.
// Every page (Learn, Plan, landing, questions) reads from here.
// The eight hues are unchanged (D17 full re-pick is per-page work later);
// only the fallback is fixed: D.muted, never a grey from outside the palette.
export const SUBJECT_COLORS: Record<string, string> = {
  english: "#818CF8", mathematics: "#B07FE8", physics: "#E3B341",
  chemistry: "#2FBF71", biology: "#E87F35", government: "#8FA3E8",
  economics: "#3FBFBF", literature: "#E87FB0",
};

export function subjectColor(name: string): string {
  const k = (name || "").toLowerCase();
  const keys = Object.keys(SUBJECT_COLORS).sort((a, b) => b.length - a.length);
  for (const key of keys) if (k.includes(key)) return SUBJECT_COLORS[key];
  return D.muted;
}
