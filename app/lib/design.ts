// Centralised design tokens — import in any page/component

export const C = {
  primary:      "#1877F2",
  primaryHover: "#166FE5",
  primaryDark:  "#0C5FD1",
  primaryLight: "#E7F0FF",
  primarySoft:  "#F0F7FF",

  bg:           "#F0F2F5",
  surface:      "#FFFFFF",
  surface2:     "#F7F8FA",
  surface3:     "#EBEDF0",

  border:       "#E4E6EB",
  borderLight:  "#F0F2F5",

  text:         "#050505",
  sub:          "#65676B",
  muted:        "#8A8D91",

  success:      "#31A24C",
  successLight: "#E6F4EA",
  warning:      "#F7B928",
  danger:       "#FA3E3E",
  dangerLight:  "#FEE9E9",

  accent:       "#EA580C",
  accentLight:  "#FFF3EE",
};

export const D = {
  bg:       "#18191A",
  surface:  "#242526",
  surface2: "#3A3B3C",
  surface3: "#4E4F50",
  border:   "#3E4042",
  text:     "#E4E6EB",
  sub:      "#B0B3B8",
  muted:    "#8A8D91",
};

export function palette(dark: boolean) {
  return {
    bg:      dark ? D.bg      : C.bg,
    surface: dark ? D.surface : C.surface,
    s2:      dark ? D.surface2: C.surface2,
    s3:      dark ? D.surface3: C.surface3,
    border:  dark ? D.border  : C.border,
    text:    dark ? D.text    : C.text,
    sub:     dark ? D.sub     : C.sub,
    muted:   dark ? D.muted   : C.muted,
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
