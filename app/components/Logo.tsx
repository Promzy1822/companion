"use client";

interface LogoProps {
  size?: number;
  style?: React.CSSProperties;
  showText?: boolean;
  textColor?: string;
}

export default function Logo({ size = 36, style, showText = false, textColor = "#fff" }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", ...style }}>
      <img
        src="/icon-192.png"
        alt="Companion Logo"
        width={size}
        height={size}
        style={{ borderRadius: size * 0.22, display: "block", flexShrink: 0 }}
      />
      {showText && (
        <div>
          <div style={{ color: textColor, fontWeight: "900", fontSize: size * 0.52, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            companion
          </div>
          <div style={{ color: textColor === "#fff" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)", fontSize: size * 0.26, letterSpacing: "1px", textTransform: "uppercase" as const }}>
            AI Study Assistant
          </div>
        </div>
      )}
    </div>
  );
}
