"use client";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  label?: string;
  style?: React.CSSProperties;
}

export default function BackButton({ href = "/", label = "←", style }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        width: "36px", height: "36px", borderRadius: "10px",
        backgroundColor: "rgba(255,255,255,0.15)",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: "18px", fontWeight: "700",
        backdropFilter: "blur(4px)", flexShrink: 0,
        ...style
      }}
    >
      {label}
    </button>
  );
}
