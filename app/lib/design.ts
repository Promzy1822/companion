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
};

export const D = {
  primary:      "#6366F1",
  primaryHover: "#818CF8",
  primaryDark:  "#4F46E5",
  primaryLight: "#2A2B63",
  primarySoft:  "#1D1E45",

  bg:           "#0E1018",
  surface:      "#161925",
  surface2:     "#1E2230",
  surface3:     "#2A2F42",

  border:       "#2A2E3F",
  borderLight:  "#2A2E3F",

  text:         "#E3E6EF",
  sub:          "#A7AEC2",
  muted:        "#7C849A",

  success:      "#31A24C",
  successLight: "#12291A",
  warning:      "#F7B928",
  warningLight: "#2E2410",
  danger:       "#FA3E3E",
  dangerLight:  "#33151A",

  accent:       "#F97316",
  accentLight:  "#331D0F",
};

export function palette(dark: boolean) {
  return {
    bg:      dark ? D.bg      : C.bg,
    surface: dark ? D.surface : C.surface,
    s2:      dark ? D.surface2: C.surface2,
    s3:      dark ? D.surface3: C.surface3,
    border:  dark ? D.border  : C.border,
    borderLight: dark ? D.borderLight : C.borderLight,
    text:    dark ? D.text    : C.text,
    sub:     dark ? D.sub     : C.sub,
    muted:   dark ? D.muted   : C.muted,
    primary: dark ? D.primary : C.primary,
    primaryHover: dark ? D.primaryHover : C.primaryHover,
    primaryDark:  dark ? D.primaryDark  : C.primaryDark,
    primaryTint:  dark ? D.primaryLight : C.primaryLight,
    primarySoft:  dark ? D.primarySoft  : C.primarySoft,
    success: dark ? D.success : C.success,
    successTint: dark ? D.successLight : C.successLight,
    warning: dark ? D.warning : C.warning,
    warningTint: dark ? D.warningLight : C.warningLight,
    danger:  dark ? D.danger  : C.danger,
    dangerTint:  dark ? D.dangerLight  : C.dangerLight,
    accent:  dark ? D.accent  : C.accent,
    accentTint:  dark ? D.accentLight  : C.accentLight,
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
