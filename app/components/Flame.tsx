// Flame.tsx — Flame the mascot, as a reusable inline-SVG component.
//
// One character, drawn with SVG + CSS keyframes only: no video, no image
// files, no new dependencies. Size, glow, colour, flicker speed and face all
// derive from stage + heat + mood, exactly as in the approved sample:
//   - STAGE (long-term growth) sets the base size: ember small, blazing big.
//   - HEAT (live session state) sets colour + glow + flicker: cold is small
//     and dull red, blazing is tall with a yellow-white core and sparkles.
//   - MOOD sets the face and the motion (bob, bounce, tremble, sway).
//   - dimmed (no study for 2+ days) shrinks and greys the flame.
//
// Usage:
//   <Flame stage={state.stage} heat={heat} mood={mood} speech={speech} dimmed={state.dimmed} />
//   <FlameHeatMeter heat={heat} />

"use client";

import { useEffect, useId, useState } from "react";
import { palette, R } from "../lib/design";
import type { FlameStage, FlameMood, FlameState, HeatBand } from "../lib/flame";
import { getFlameState, heatBand, homeFlame } from "../lib/flame";

const HEAT_LABEL: Record<HeatBand, string> = {
  cold: "Cold",
  warm: "Warm",
  hot: "Hot",
  blazing: "Blazing",
};

const STAGE_SCALE: Record<FlameStage, number> = {
  ember: 0.62,
  spark: 0.82,
  flame: 1,
  blazing: 1.22,
};

const HEAT_SCALE: Record<HeatBand, number> = {
  cold: 0.78,
  warm: 0.92,
  hot: 1.05,
  blazing: 1.16,
};

// Body gradient stops per heat band: [top, mid, bottom].
const BODY_COLORS: Record<HeatBand, [string, string, string]> = {
  cold: ["#B45309", "#991B1B", "#7F1D1D"],
  warm: ["#FB923C", "#F97316", "#EA580C"],
  hot: ["#FDBA74", "#FB923C", "#F97316"],
  blazing: ["#FEF9C3", "#FDBA74", "#FB923C"],
};

const CORE_COLORS: Record<HeatBand, string> = {
  cold: "#92400E",
  warm: "#FDE68A",
  hot: "#FEF08A",
  blazing: "#FFFFFF",
};

const GLOW_COLORS: Record<HeatBand, string> = {
  cold: "rgba(153,27,27,0.30)",
  warm: "rgba(249,115,22,0.38)",
  hot: "rgba(251,146,60,0.58)",
  blazing: "rgba(253,230,138,0.75)",
};

const FLICKER_SECONDS: Record<HeatBand, string> = {
  cold: "1.6s",
  warm: "1.1s",
  hot: "0.65s",
  blazing: "0.4s",
};

const KEYFRAMES = `
@keyframes flameBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes flameBounce { 0%,100% { transform: translateY(0) scale(1,1); } 30% { transform: translateY(-14px) scale(0.96,1.05); } 60% { transform: translateY(0) scale(1.04,0.94); } }
@keyframes flameSway { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-3px) rotate(2deg); } }
@keyframes flameTremble { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-1.5px); } 75% { transform: translateX(1.5px); } }
@keyframes flameFlicker { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.05); } }
@keyframes flameTwinkle { 0%,100% { opacity: 0.25; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.15); } }
@keyframes flameBlink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
@media (prefers-reduced-motion: reduce) {
  .flame-anim { animation: none !important; }
}
`;

function motionFor(mood: FlameMood, band: HeatBand): string {
  if (band === "blazing" || mood === "celebrating") return "flameBounce 0.9s ease-in-out infinite";
  if (mood === "sleepy") return "flameSway 3.6s ease-in-out infinite";
  if (mood === "worried") return "flameTremble 0.4s linear infinite";
  if (mood === "thinking") return "flameBob 3s ease-in-out infinite";
  if (mood === "encouraging") return "flameBob 2.8s ease-in-out infinite";
  return "flameBob 2.4s ease-in-out infinite";
}

function Eyes({ mood, band }: { mood: FlameMood; band: HeatBand }) {
  const face = "#1F1156";
  // Cold always droops into sleepy eyes, whatever the mood.
  if (band === "cold" || mood === "sleepy") {
    return (
      <g stroke={face} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M43 96 Q48 100 53 96" />
        <path d="M67 96 Q72 100 77 96" />
      </g>
    );
  }
  if (mood === "worried") {
    return (
      <g fill={face}>
        <circle cx={48} cy={95} r={3.2} />
        <circle cx={72} cy={95} r={3.2} />
        <g stroke={face} strokeWidth={2.5} strokeLinecap="round">
          <path d="M42 86 L54 89" />
          <path d="M66 89 L78 86" />
        </g>
      </g>
    );
  }
  if (mood === "thinking") {
    return (
      <g fill={face}>
        <circle cx={48} cy={92} r={3.2} />
        <circle cx={72} cy={92} r={3.2} />
        <g stroke={face} strokeWidth={2.5} strokeLinecap="round">
          <path d="M42 85 L54 83" />
        </g>
      </g>
    );
  }
  // happy / celebrating / encouraging: joyful closed arcs.
  return (
    <g stroke={face} strokeWidth={3} strokeLinecap="round" fill="none">
      <path d="M42 97 Q48 89 54 97" />
      <path d="M66 97 Q72 89 78 97" />
    </g>
  );
}

function Mouth({ mood, band }: { mood: FlameMood; band: HeatBand }) {
  const face = "#1F1156";
  if (band === "cold" || mood === "sleepy") {
    return <circle cx={60} cy={110} r={2.5} fill={face} />;
  }
  if (mood === "worried") {
    return (
      <path
        d="M52 110 Q56 106 60 110 Q64 114 68 110"
        stroke={face}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  if (mood === "thinking") {
    return (
      <path
        d="M54 111 L66 108"
        stroke={face}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    );
  }
  // happy / celebrating / encouraging: open smile.
  return (
    <path
      d="M50 106 Q60 118 70 106 Q60 112 50 106 Z"
      fill={face}
    />
  );
}

export interface FlameProps {
  stage: FlameStage;
  /** Live heat 0-100. Defaults to 50 (Warm). */
  heat?: number;
  mood?: FlameMood;
  /** Base size in px (before stage/heat scaling). Defaults to 96. */
  size?: number;
  /** Speech line shown in a bubble above the flame. */
  speech?: string;
  /** No study for 2+ days: renders dimmed and smaller. */
  dimmed?: boolean;
}

export function Flame({
  stage,
  heat = 50,
  mood = "happy",
  size = 96,
  speech,
  dimmed = false,
}: FlameProps) {
  const T = palette(true);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const band = heatBand(heat);
  const [top, mid, bottom] = BODY_COLORS[band];
  const scale = STAGE_SCALE[stage] * HEAT_SCALE[band] * (dimmed ? 0.85 : 1);
  const showArms = mood === "celebrating" || stage === "flame" || stage === "blazing";
  const showSparkles = band === "blazing" || mood === "celebrating";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{KEYFRAMES}</style>
      {speech ? (
        <div style={{ marginBottom: 10, maxWidth: 280, textAlign: "center" }}>
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: R.lg,
              padding: "10px 12px",
              fontSize: 13,
              lineHeight: 1.5,
              color: T.text,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {speech}
          </div>
          <div
            style={{
              width: 12,
              height: 12,
              background: T.surface,
              borderRight: `1px solid ${T.border}`,
              borderBottom: `1px solid ${T.border}`,
              transform: "rotate(45deg)",
              margin: "-7px auto 0",
            }}
          />
        </div>
      ) : null}
      <div
        className="flame-anim"
        style={{
          animation: motionFor(mood, band),
          filter: `drop-shadow(0 0 ${band === "blazing" ? 22 : band === "hot" ? 16 : 10}px ${GLOW_COLORS[band]})`,
          opacity: dimmed ? 0.72 : 1,
          transform: `scale(${scale})`,
          transformOrigin: "50% 100%",
          lineHeight: 0,
        }}
      >
        <div
          className="flame-anim"
          style={{
            animation: `flameFlicker ${FLICKER_SECONDS[band]} ease-in-out infinite`,
            transformOrigin: "50% 100%",
            lineHeight: 0,
          }}
        >
          <svg
            width={size}
            height={size * 1.22}
            viewBox="0 0 120 146"
            role="img"
            aria-label={`Flame the mascot, ${stage} stage`}
          >
            <defs>
              <linearGradient id={`flameBody${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={top} />
                <stop offset="55%" stopColor={mid} />
                <stop offset="100%" stopColor={bottom} />
              </linearGradient>
              <radialGradient id={`flameCore${uid}`} cx="0.5" cy="0.62" r="0.45">
                <stop offset="0%" stopColor={CORE_COLORS[band]} />
                <stop offset="100%" stopColor={CORE_COLORS[band]} stopOpacity="0" />
              </radialGradient>
            </defs>
            {showArms ? (
              <g stroke={`url(#flameBody${uid})`} strokeWidth={6} strokeLinecap="round" fill="none">
                <path d="M30 96 Q20 88 17 76" />
                <path d="M90 96 Q100 88 103 76" />
              </g>
            ) : null}
            <path
              d="M60 6 C72 28 94 44 94 78 C94 84 94 88 93 92 A34 34 0 1 1 27 92 C26 88 26 84 26 78 C26 66 34 58 40 48 C44 56 48 56 50 46 C52 34 54 18 60 6 Z"
              fill={`url(#flameBody${uid})`}
            />
            <path
              d="M60 52 C68 66 80 74 80 92 A20 20 0 1 1 40 92 C40 84 44 78 48 72 C51 78 54 77 55 70 C56 62 58 58 60 52 Z"
              fill={`url(#flameCore${uid})`}
            />
            <g
              className="flame-anim"
              style={{ animation: "flameBlink 4s infinite", transformBox: "fill-box", transformOrigin: "center" }}
            >
              <Eyes mood={mood} band={band} />
            </g>
            <Mouth mood={mood} band={band} />
            {showSparkles ? (
              <g fill="#FDE68A">
                <path
                  className="flame-anim"
                  style={{ animation: "flameTwinkle 1.2s ease-in-out infinite" }}
                  d="M16 40 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z"
                />
                <path
                  className="flame-anim"
                  style={{ animation: "flameTwinkle 1.2s ease-in-out 0.4s infinite" }}
                  d="M104 52 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"
                />
                <path
                  className="flame-anim"
                  style={{ animation: "flameTwinkle 1.2s ease-in-out 0.8s infinite" }}
                  d="M100 22 l1.8 4.5 4.5 1.8 -4.5 1.8 -1.8 4.5 -1.8 -4.5 -4.5 -1.8 4.5 -1.8 Z"
                />
              </g>
            ) : null}
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Compact heat meter for quiz / drill question screens. */
export function FlameHeatMeter({ heat }: { heat: number }) {
  const T = palette(true);
  const band = heatBand(heat);
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 5,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>
          Flame heat
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>
          {HEAT_LABEL[band]} · {Math.round(heat)}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: R.pill,
          background: T.s2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, heat))}%`,
            borderRadius: R.pill,
            background:
              "linear-gradient(90deg,#991B1B,#F97316,#FDE68A,#FFFFFF)",
            transition: "width 0.45s ease",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Home greeting: reads the student's real streak / mock data (client-only),
 * picks mood + speech for the time of day, and renders Flame.
 * Renders nothing until mounted (avoids a hydration mismatch, like StreakCard).
 * `topic` (e.g. the student's first subject) feeds the midday nudge.
 */
export function FlameGreeting({ topic }: { topic?: string }) {
  const [state, setState] = useState<FlameState | null>(null);
  useEffect(() => {
    setState(getFlameState());
  }, []);
  if (!state) return null;
  const hour = new Date().getHours();
  const { mood, speech } = homeFlame(state, hour, topic);
  return (
    <Flame
      stage={state.stage}
      heat={50}
      mood={mood}
      speech={speech}
      size={84}
      dimmed={state.dimmed}
    />
  );
}
