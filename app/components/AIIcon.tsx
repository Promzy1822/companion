"use client";

interface AIIconProps {
  size?: number;
  style?: React.CSSProperties;
}

export default function AIIcon({ size = 32, style }: AIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <defs>
        <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#f97316"}}/>
          <stop offset="100%" style={{stopColor:"#c2410c"}}/>
        </linearGradient>
        <linearGradient id="aiGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#fde68a"}}/>
          <stop offset="100%" style={{stopColor:"#f97316"}}/>
        </linearGradient>
      </defs>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="46" fill="url(#aiGrad)" opacity="0.15"/>
      {/* Inner circle */}
      <circle cx="50" cy="50" r="38" fill="url(#aiGrad)"/>
      {/* C shape */}
      <path d="M64 28 C64 28 36 26 30 50 C24 74 42 74 64 72"
        stroke="white" strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* Chat tail */}
      <path d="M31 66 L22 78 L40 70" fill="white"/>
      {/* Main sparkle */}
      <path d="M52 40 L55 48 L63 51 L55 54 L52 62 L49 54 L41 51 L49 48 Z" fill="url(#aiGlow)"/>
      {/* Small sparkle */}
      <path d="M63 30 L65 35 L70 37 L65 39 L63 44 L61 39 L56 37 L61 35 Z" fill="white" opacity="0.9"/>
    </svg>
  );
}
