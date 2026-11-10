"use client";
import { useMemo, useState, type CSSProperties } from "react";
import {
  CheckCircle2, XCircle, Lightbulb, FlaskConical, BookOpenText,
  ChevronRight, Sparkles, Calculator,
} from "lucide-react";
import { palette, R } from "../../lib/design";
import type { LessonBlock, StoryStep } from "../../lib/lesson-v2";

type T = ReturnType<typeof palette>;
type Block = LessonBlock;

const card = (T: T): CSSProperties => ({
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: R.xl2, padding: "18px", marginBottom: 14,
});
const eyebrow = (color: string): CSSProperties => ({
  fontSize: 11, fontWeight: 700, color, textTransform: "uppercase",
  letterSpacing: 1, display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
});

/* ── Predict ─────────────────────────────────────────────────────── */
function PredictCard({ block, T }: { block: Extract<Block, { kind: "predict" }>; T: T }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const right = chosen !== null && chosen === block.correctIndex;
  return (
    <div style={{ ...card(T), border: `1.5px solid ${T.accent}` }}>
      <div style={eyebrow(T.accent)}><Lightbulb size={13} /> Predict first</div>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px", lineHeight: 1.55 }}>{block.question}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {block.options.map((o, i) => {
          const isC = i === block.correctIndex, isCh = i === chosen;
          let bg = T.s2, bd = T.border, col = T.text;
          if (chosen !== null) {
            if (isC) { bg = T.successTint; bd = T.success; col = T.successText; }
            else if (isCh) { bg = T.dangerTint; bd = T.danger; col = T.dangerText; }
          }
          return (
            <button key={i} onClick={() => setChosen(i)} disabled={chosen !== null} style={{
              padding: "10px 16px", minHeight: 44, borderRadius: R.pill, border: `1.5px solid ${bd}`,
              background: bg, color: col, fontSize: 13, fontWeight: 700,
              cursor: chosen === null ? "pointer" : "default", fontFamily: "inherit",
            }}>{o}</button>
          );
        })}
      </div>
      {chosen !== null && (
        <p style={{ fontSize: 13, color: right ? T.successText : T.sub, margin: "12px 0 0", lineHeight: 1.6 }}>
          {right ? block.feedbackRight : block.feedbackWrong}
        </p>
      )}
    </div>
  );
}

/* ── Do You Know ─────────────────────────────────────────────────── */
function DoYouKnowCard({ text, T }: { text: string; T: T }) {
  return (
    <div style={{ ...card(T), background: T.primaryTint, border: `1px solid ${T.primary}` }}>
      <div style={eyebrow(T.primaryText)}><Sparkles size={13} /> Do you know?</div>
      <p style={{ fontSize: 14, color: T.text, margin: 0, lineHeight: 1.65 }}>
        {text.replace(/^Do you know\?\s*/i, "")}
      </p>
    </div>
  );
}

/* ── Worked example ──────────────────────────────────────────────── */
function WorkedExample({ block, T }: { block: Extract<Block, { kind: "worked-example" }>; T: T }) {
  return (
    <div style={{ ...card(T), background: T.s2 }}>
      <div style={eyebrow(T.primaryText)}><Calculator size={13} /> Worked example</div>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 10px", lineHeight: 1.6 }}>{block.problem}</p>
      {block.steps.map((s, i) => (
        <p key={i} style={{ fontSize: 13.5, color: T.sub, margin: "0 0 6px", lineHeight: 1.6 }}>{s}</p>
      ))}
      <p style={{ fontSize: 14, fontWeight: 700, color: T.successText, margin: "8px 0 0", lineHeight: 1.6 }}>{block.answer}</p>
    </div>
  );
}

/* ── Story short (timeline + decision) ───────────────────────────── */
function StoryShort({ block, T }: { block: Extract<Block, { kind: "story" }>; T: T }) {
  const steps = block.steps;
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const step: StoryStep = steps[cur];
  const decisionDone = !step.decision || answers[cur] !== undefined;
  const last = cur === steps.length - 1;

  return (
    <div style={card(T)}>
      <div style={eyebrow(T.accent)}><BookOpenText size={13} /> Story short · Step {Math.min(cur + 1, steps.length)} of {steps.length}</div>

      {steps.slice(0, cur).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px dashed ${T.border}` }}>
          <CheckCircle2 size={15} color={T.success} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>{s.label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</span>
        </div>
      ))}

      {!finished && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: T.accent, color: "#1F1156", fontSize: 12, fontWeight: 800, borderRadius: R.pill, padding: "3px 10px" }}>{step.label}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{step.title}</span>
          </div>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.65, margin: "0 0 10px" }}>{step.body}</p>
          {step.gained && (
            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, margin: "0 0 4px" }}>
              <b style={{ color: T.successText }}>Gained:</b> {step.gained}
            </p>
          )}
          {step.missing && (
            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, margin: "0 0 4px" }}>
              <b style={{ color: T.dangerText }}>Still missing:</b> {step.missing}
            </p>
          )}

          {step.decision && (
            <div style={{ marginTop: 12, background: T.s2, borderRadius: R.lg, padding: "14px" }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, margin: "0 0 10px", lineHeight: 1.55 }}>{step.decision.question}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {step.decision.options.map((o, i) => {
                  const answered = answers[cur] !== undefined;
                  const isC = i === step.decision!.correctIndex, isCh = i === answers[cur];
                  let bg = T.surface, bd = T.border, col = T.text;
                  if (answered) {
                    if (isC) { bg = T.successTint; bd = T.success; col = T.successText; }
                    else if (isCh) { bg = T.dangerTint; bd = T.danger; col = T.dangerText; }
                  }
                  return (
                    <button key={i} disabled={answered}
                      onClick={() => setAnswers(a => ({ ...a, [cur]: i }))}
                      style={{
                        textAlign: "left", padding: "11px 14px", minHeight: 44, borderRadius: R.lg,
                        border: `1.5px solid ${bd}`, background: bg, color: col,
                        fontSize: 13.5, fontWeight: 600, fontFamily: "inherit",
                        cursor: answered ? "default" : "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                      }}>
                      {o}
                      {answered && isC && <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
                      {answered && isCh && !isC && <XCircle size={16} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
              {answers[cur] !== undefined && (
                <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, margin: "12px 0 0" }}>
                  {answers[cur] !== step.decision.correctIndex && <b style={{ color: T.text }}>It went the other way. </b>}
                  {step.decision.reveal}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => { if (last) setFinished(true); else setCur(c => c + 1); }}
            disabled={!decisionDone}
            style={{
              width: "100%", padding: "13px", borderRadius: R.pill, border: "none", marginTop: 14,
              background: decisionDone ? T.accent : T.s3, color: decisionDone ? "#fff" : T.muted,
              fontWeight: 700, fontSize: 14, fontFamily: "inherit",
              cursor: decisionDone ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {last ? "Finish the story" : "Continue"} <ChevronRight size={16} />
          </button>
          {!decisionDone && (
            <p style={{ fontSize: 12, color: T.muted, textAlign: "center", margin: "8px 0 0" }}>Answer the decision to continue.</p>
          )}
        </div>
      )}

      {finished && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.successText, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={15} /> Story complete · {steps.length} of {steps.length}
          </p>
          {block.closingPattern && (
            <p style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6, margin: 0, background: T.s2, borderRadius: R.lg, padding: "12px 14px" }}>
              {block.closingPattern}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Boyle's law piston lab ──────────────────────────────────────── */
function BoyleLab({ T }: { T: T }) {
  const [vol, setVol] = useState(10);
  const P = 480 / vol;
  const chamberW = 30 + vol * 15;              // px in a 200-wide chamber zone
  const dots = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    fx: ((i * 37) % 90 + 5) / 100, fy: ((i * 53) % 70 + 15) / 100,
  })), []);
  const graphPts = useMemo(() => {
    let d = "";
    for (let v = 2; v <= 10.01; v += 0.25) {
      const x = 14 + (v - 2) / 8 * 120, y = 96 - (480 / v - 24) / 216 * 82;
      d += `${v === 2 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    return d;
  }, []);
  const gx = 14 + (vol - 2) / 8 * 120, gy = 96 - (P - 24) / 216 * 82;

  return (
    <div style={card(T)}>
      <div style={eyebrow(T.accent)}><FlaskConical size={13} /> The lab · Boyle's law</div>

      <svg viewBox="0 0 340 120" style={{ width: "100%", display: "block", background: T.s2, borderRadius: R.lg }}>
        <rect x={18} y={25} width={chamberW} height={70} rx={8} fill={T.primaryTint} stroke={T.border} />
        {dots.map((d, i) => (
          <circle key={i} cx={24 + d.fx * (chamberW - 14)} cy={30 + d.fy * 60} r={3}
            fill={T.primaryText} opacity={0.45 + (P / 240) * 0.5} />
        ))}
        <rect x={18 + chamberW} y={18} width={12} height={84} rx={4} fill={T.accent} />
        <rect x={18 + chamberW + 12} y={52} width={52} height={9} fill={T.muted} />
        <text x={24} y={112} fontSize={9} fill={T.muted}>gas in a sealed cylinder · temperature constant</text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "12px 0" }}>
        {[
          { k: "Volume", v: `${vol.toFixed(1)} dm³`, c: T.text },
          { k: "Pressure", v: `${Math.round(P)} kPa`, c: T.accent },
          { k: "P × V", v: "480", c: T.successText },
        ].map(s => (
          <div key={s.k} style={{ background: T.s2, borderRadius: R.lg, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>{s.k}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.c, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
        Volume — drag to squeeze the gas
      </label>
      <input type="range" min={2} max={10} step={0.5} value={vol}
        onChange={e => setVol(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: T.accent, height: 32 }} />

      <svg viewBox="0 0 150 108" style={{ width: "100%", maxWidth: 260, display: "block", margin: "6px auto 0" }}>
        <line x1={14} y1={96} x2={140} y2={96} stroke={T.border} />
        <line x1={14} y1={96} x2={14} y2={8} stroke={T.border} />
        <path d={graphPts} fill="none" stroke={T.primary} strokeWidth={1.6} opacity={0.55} />
        <circle cx={gx} cy={gy} r={4.5} fill={T.accent} stroke={T.bg} strokeWidth={1.6} />
        <text x={118} y={106} fontSize={8.5} fill={T.muted}>V →</text>
        <text x={2} y={14} fontSize={8.5} fill={T.muted}>P</text>
      </svg>
      <p style={{ fontSize: 12, color: T.muted, textAlign: "center", margin: "6px 0 0", lineHeight: 1.55 }}>
        Temperature is held constant throughout — that is what makes this Boyle's law and not something else.
      </p>
    </div>
  );
}

/* ── Block renderer ──────────────────────────────────────────────── */
export function LessonBlockView({ block, T }: { block: Block; T: T }) {
  switch (block.kind) {
    case "section":
      return (
        <div style={card(T)}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 10px", lineHeight: 1.35 }}>{block.heading}</h2>
          {block.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: T.text, margin: i === block.paragraphs.length - 1 ? 0 : "0 0 10px" }}>{p}</p>
          ))}
        </div>
      );
    case "predict":       return <PredictCard block={block} T={T} />;
    case "do-you-know":   return <DoYouKnowCard text={block.text} T={T} />;
    case "worked-example": return <WorkedExample block={block} T={T} />;
    case "story":         return <StoryShort block={block} T={T} />;
    case "simulator":
      if (block.simKind === "boyles-law-piston") return <BoyleLab T={T} />;
      return null;
    default:              return null;
  }
}
