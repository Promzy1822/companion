// Reusable logo component — uses the actual icon-192.png from /public
// Replaces all 🎓 emoji and placeholder branding across the app

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subTextColor?: string;
  style?: React.CSSProperties;
}

export default function AppLogo({
  size = 36,
  showText = false,
  textColor = "#fff",
  subTextColor = "rgba(255,255,255,0.6)",
  style,
}: AppLogoProps) {
  const radius = Math.round(size * 0.22);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", ...style }}>
      <img
        src="/icon-192.png"
        alt="Companion"
        width={size}
        height={size}
        style={{
          borderRadius: radius + "px",
          display: "block",
          flexShrink: 0,
          objectFit: "cover",
        }}
      />
      {showText && (
        <div>
          <div style={{
            color: textColor,
            fontWeight: "900",
            fontSize: Math.round(size * 0.56) + "px",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}>
            companion
          </div>
          <div style={{
            color: subTextColor,
            fontSize: Math.round(size * 0.28) + "px",
            letterSpacing: "0.5px",
          }}>
            JAMB Study Assistant
          </div>
        </div>
      )}
    </div>
  );
}
