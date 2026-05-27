interface Props {
  size?: number;
  showText?: boolean;
  darkMode?: boolean;
  style?: React.CSSProperties;
}

export default function AppLogo({ size = 32, showText = true, darkMode = false, style }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", ...style }}>
      <img
        src="/icon-192.png"
        alt="Companion"
        width={size}
        height={size}
        style={{ borderRadius: Math.round(size * 0.25) + "px", display: "block", flexShrink: 0, objectFit: "cover" }}
      />
      {showText && (
        <span style={{
          fontWeight: 800,
          fontSize: Math.round(size * 0.56) + "px",
          color: darkMode ? "#E4E6EB" : "#050505",
          letterSpacing: "-0.4px",
          lineHeight: 1,
        }}>
          companion
        </span>
      )}
    </div>
  );
}
