/**
 * players.tsx — REVISED DRAFT (Lesson rebuild, worker W2)
 * Against HEAD aabd1582a5619a9e6425afac67ac6340c091f6b7.
 *
 * Structural rebuild to the approved Lesson sample (Gas Laws, phy_25).
 * Presentation / layout / typography / tokens ONLY. Every interaction
 * state machine is preserved exactly as in the current file:
 *  - Predict: single choice, locks after answering, correctIndex verdict.
 *  - StoryShort: cur/answers/finished state, decision gating, collapsed
 *    completed steps, closingPattern on finish.
 *  - BoyleLab: vol useState(10), P = 480 / vol, same dots / curve math
 *    (re-mapped linearly onto a larger, labelled graph — same hyperbola).
 *  - Block schema, sanitizeLessonV2 and REGISTERED_SIMS untouched
 *    (this file only renders; unregistered sims never reach it, but the
 *    simulator case now renders a fallback card instead of null anyway).
 *
 * DEVIATIONS FROM THE SAMPLE SPEC (deliberate, see report):
 *  1. Spec says card shell radius "R.xl2" — no such token exists in
 *     app/lib/design.ts at HEAD (radii are sm/md/lg/xl/xxl/pill).
 *     The shell uses R.xxl (20px), exactly as the current card() does.
 *  2. "Continue to exercises" in the finished StoryShort needs a
 *     navigation callback the player never had. LessonBlockView /
 *     StoryShort accept an OPTIONAL onContinueExercises prop; the
 *     button renders only when the lesson page passes it. Without it
 *     the page's own "Start exercises" CTA (below the learn stage)
 *     remains the way forward — no dead button is rendered.
 *  3. L27 asked for the Continue button NOT to be disabled. Kept
 *     disabled: the task preserves the interaction state machine
 *     exactly; only the hint moved above the button (13px, T.sub).
 *  4. Hover states are done with onMouseEnter/Leave state, not CSS
 *     :hover — inline styles cannot express :hover. Same for
 *     :focus-visible (L14/D7): needs a shared class + focus-ring
 *     token, which lives outside this file.
 *  5. "Wrong feedback in danger text": the verdict line ("Not quite —
 *     the answer is …") is danger text; the feedback paragraph itself
 *     is 14px T.text per the "teaching text floored at 14px in text
 *     colour" rule, so the teaching copy stays readable.
 *  6. Eyebrows are 12px T.primaryText (L21: orange reserved for the
 *     subject line; players use primaryText) — including DoYouKnow,
 *     whose shell (accentTint bg + accent border) carries the accent.
 */
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

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/* One lesson card shell (L16): surface, 1px border, R.xxl, 18px, mb 14. */
const card = (T: T): CSSProperties => ({
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: R.xxl, padding: "18px", marginBottom: 14,
});
const eyebrow = (color: string): CSSProperties => ({
  fontSize: 12, fontWeight: 700, color, textTransform: "uppercase",
  letterSpacing: 1, display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
});

/* 12px/700 letter chip at the left of every option (L22). */
function LetterChip({ letter, tone, T }: {
  letter: string; tone: "default" | "correct" | "wrong"; T: T;
}) {
  const bg = tone === "correct" ? T.successTint : tone === "wrong" ? T.dangerTint : T.s3;
  const col = tone === "correct" ? T.successText : tone === "wrong" ? T.dangerText : T.sub;
  return (
    <span style={{
      minWidth: 22, height: 22, borderRadius: R.md, background: bg, color: col,
      fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>{letter}</span>
  );
}

/* ── Predict ─────────────────────────────────────────────────────── */
function PredictCard({ block, T }: { block: Extract<Block, { kind: "predict" }>; T: T }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const right = chosen !== null && chosen === block.correctIndex;
  const verdict = right ? T.successText : T.dangerText;
  return (
    <div style={{ ...card(T), borderLeft: `3px solid ${T.accent}` }}>
      <div style={eyebrow(T.primaryText)}><Lightbulb size={13} /> Predict first</div>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px", lineHeight: 1.55 }}>{block.question}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {block.options.map((o, i) => {
          const isC = i === block.correctIndex, isCh = i === chosen;
          let bg = T.s2, bd = T.border, col = T.text;
          if (chosen !== null) {
            if (isC) { bg = T.successTint; bd = T.success; col = T.successText; }
            else if (isCh) { bg = T.dangerTint; bd = T.danger; col = T.dangerText; }
          } else if (hovered === i) {
            bg = T.s3;
          }
          return (
            <button key={i} onClick={() => setChosen(i)} disabled={chosen !== null}
              aria-pressed={chosen === i}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 16px", minHeight: 44, borderRadius: R.pill, border: `1.5px solid ${bd}`,
                background: bg, color: col, fontSize: 13, fontWeight: 700,
                cursor: chosen === null ? "pointer" : "default", fontFamily: "inherit",
              }}>
              <LetterChip letter={LETTERS[i] ?? String(i + 1)}
                tone={chosen !== null && isC ? "correct" : chosen !== null && isCh ? "wrong" : "default"} T={T} />
              <span>{o}</span>
              {chosen !== null && isC && <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
              {chosen !== null && isCh && !isC && <XCircle size={16} style={{ flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: verdict, margin: "0 0 8px", lineHeight: 1.5, display: "flex", alignItems: "center", gap: 6 }}>
            {right
              ? <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              : <XCircle size={15} style={{ flexShrink: 0 }} />}
            {right ? "Correct" : `Not quite — the answer is ${block.options[block.correctIndex]}`}
          </p>
          <div style={{ borderLeft: `3px solid ${verdict}`, paddingLeft: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: verdict, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Explanation</div>
            <p style={{ fontSize: 14, color: T.text, margin: 0, lineHeight: 1.6 }}>
              {right ? block.feedbackRight : block.feedbackWrong}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Do You Know ─────────────────────────────────────────────────── */
/* Own accent shell (L19/L16): accentTint bg + accent border, so it can
 * never be mistaken for the objectives card (primaryTint + primary).
 * The "Do you know?" prefix is NOT stripped here (L19) — the text is
 * rendered exactly as stored; prefix-stripping belongs at
 * data-generation time, not in the renderer. */
function DoYouKnowCard({ text, T }: { text: string; T: T }) {
  return (
    <div style={{ ...card(T), background: T.accentTint, border: `1px solid ${T.accent}` }}>
      <div style={eyebrow(T.primaryText)}><Sparkles size={13} /> Do you know?</div>
      <p style={{ fontSize: 14, color: T.text, margin: 0, lineHeight: 1.65 }}>
        {text}
      </p>
    </div>
  );
}

/* ── Worked example ──────────────────────────────────────────────── */
function WorkedExample({ block, T }: { block: Extract<Block, { kind: "worked-example" }>; T: T }) {
  return (
    <div style={card(T)}>
      <div style={eyebrow(T.primaryText)}><Calculator size={13} /> Worked example</div>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px", lineHeight: 1.6, overflowWrap: "break-word" }}>{block.problem}</p>
      {block.steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "0 0 10px" }}>
          <span style={{
            width: 22, height: 22, borderRadius: R.pill, background: T.s3, color: T.text,
            fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0, marginTop: 1,
          }}>{i + 1}</span>
          <p style={{ fontSize: 14, color: T.text, margin: 0, lineHeight: 1.6, overflowWrap: "break-word", flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 2 }}>Step {i + 1}</span>
            {s}
          </p>
        </div>
      ))}
      <p style={{ fontSize: 14, fontWeight: 700, color: T.successText, margin: "2px 0 0", lineHeight: 1.6, background: T.successTint, borderRadius: R.lg, padding: "12px 14px" }}>Answer: {block.answer}</p>
    </div>
  );
}

/* ── Story short (timeline + decision) ───────────────────────────── */
function StoryShort({ block, T, onContinueExercises }: {
  block: Extract<Block, { kind: "story" }>; T: T; onContinueExercises?: () => void;
}) {
  const steps = block.steps;
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const step: StoryStep = steps[cur];
  const decisionDone = !step.decision || answers[cur] !== undefined;
  const last = cur === steps.length - 1;

  return (
    <div style={card(T)}>
      <div style={eyebrow(T.primaryText)}><BookOpenText size={13} /> Interactive story · Step {Math.min(cur + 1, steps.length)} of {steps.length}</div>

      {steps.slice(0, cur).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: `1px dashed ${T.border}` }}>
          <CheckCircle2 size={15} color={T.success} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: T.sub, flexShrink: 0, marginTop: 1 }}>{s.label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.sub, lineHeight: 1.5, overflowWrap: "break-word" }}>{s.title}</span>
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
            <p style={{ fontSize: 14, color: T.text, lineHeight: 1.55, margin: "0 0 4px" }}>
              <b style={{ color: T.successText }}>What you learned:</b> {step.gained}
            </p>
          )}
          {step.missing && (
            <p style={{ fontSize: 14, color: T.text, lineHeight: 1.55, margin: "0 0 4px" }}>
              <b style={{ color: T.dangerText }}>What you&apos;re still missing:</b> {step.missing}
            </p>
          )}

          {step.decision && (
            <div style={{ marginTop: 12, background: T.s2, borderRadius: R.lg, padding: "14px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 10px", lineHeight: 1.55 }}>{step.decision.question}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {step.decision.options.map((o, i) => {
                  const answered = answers[cur] !== undefined;
                  const isC = i === step.decision!.correctIndex, isCh = i === answers[cur];
                  let bg = T.surface, bd = T.border, col = T.text;
                  if (answered) {
                    if (isC) { bg = T.successTint; bd = T.success; col = T.successText; }
                    else if (isCh) { bg = T.dangerTint; bd = T.danger; col = T.dangerText; }
                  } else if (hovered === i) {
                    bg = T.s3;
                  }
                  return (
                    <button key={i} disabled={answered}
                      aria-pressed={answers[cur] === i}
                      onClick={() => setAnswers(a => ({ ...a, [cur]: i }))}
                      onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                      style={{
                        textAlign: "left", padding: "11px 14px", minHeight: 44, borderRadius: R.lg,
                        border: `1.5px solid ${bd}`, background: bg, color: col,
                        fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                        cursor: answered ? "default" : "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                      }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <LetterChip letter={LETTERS[i] ?? String(i + 1)}
                          tone={answered && isC ? "correct" : answered && isCh ? "wrong" : "default"} T={T} />
                        <span style={{ overflowWrap: "break-word" }}>{o}</span>
                      </span>
                      {answered && isC && <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
                      {answered && isCh && !isC && <XCircle size={16} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
              {answers[cur] !== undefined && (
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, margin: "12px 0 0" }}>
                  {answers[cur] === step.decision.correctIndex
                    ? <b style={{ color: T.successText }}>Correct — </b>
                    : <b style={{ color: T.dangerText }}>Not quite — </b>}
                  {step.decision.reveal}
                </p>
              )}
            </div>
          )}

          {!decisionDone && (
            <p style={{ fontSize: 13, color: T.sub, textAlign: "center", margin: "14px 0 8px" }}>Answer the decision to continue.</p>
          )}
          <button
            onClick={() => { if (last) setFinished(true); else setCur(c => c + 1); }}
            disabled={!decisionDone}
            style={{
              width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
              marginTop: decisionDone ? 14 : 0,
              background: decisionDone ? T.accent : T.s3, color: decisionDone ? "#1F1156" : T.muted,
              fontWeight: 700, fontSize: 14, fontFamily: "inherit",
              cursor: decisionDone ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {last ? "Finish the story" : "Continue"} <ChevronRight size={16} />
          </button>
        </div>
      )}

      {finished && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.successText, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={15} /> Story complete
          </p>
          {block.closingPattern && (
            <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, margin: "0 0 12px", background: T.s2, borderRadius: R.lg, padding: "12px 14px" }}>
              {block.closingPattern}
            </p>
          )}
          {onContinueExercises && (
            <button onClick={onContinueExercises}
              style={{
                width: "100%", padding: "13px", borderRadius: R.pill, border: "none",
                background: T.accent, color: "#1F1156", fontWeight: 700, fontSize: 14,
                fontFamily: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              Continue to exercises <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Boyle's law piston lab ──────────────────────────────────────── */
/* Physics unchanged: P = 480 / vol, vol in [2, 10] dm³. The graph is
 * the same hyperbola, re-mapped linearly onto a larger viewBox with
 * labelled axes and tick values. P × V is identically 480 by
 * construction (P = 480 / vol), so the tile keeps the literal "480". */
function BoyleLab({ T }: { T: T }) {
  const [vol, setVol] = useState(10);
  const P = 480 / vol;
  const chamberW = 30 + vol * 15;              // px in a 200-wide chamber zone
  const dots = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    fx: ((i * 37) % 90 + 5) / 100, fy: ((i * 53) % 70 + 15) / 100,
  })), []);
  /* Graph geometry (viewBox 0 0 220 152): plot x 36–210 (V 2–10 dm³),
   * plot y 12–116 (P 240–48 kPa). Same curve as before, linear remap. */
  const gxFor = (v: number) => 36 + ((v - 2) / 8) * 174;
  const gyFor = (p: number) => 116 - ((p - 48) / 192) * 104;
  const xTicks = [2, 4, 6, 8, 10];
  const yTicks = [60, 120, 180, 240];
  const graphPts = useMemo(() => {
    let d = "";
    for (let v = 2; v <= 10.01; v += 0.25) {
      d += `${v === 2 ? "M" : "L"}${gxFor(v).toFixed(1)},${gyFor(480 / v).toFixed(1)} `;
    }
    return d;
  }, []);
  const gx = gxFor(vol), gy = gyFor(P);

  return (
    <div style={card(T)}>
      <div style={eyebrow(T.primaryText)}><FlaskConical size={13} /> The lab · Boyle&apos;s law</div>

      {/* Piston + graph side by side on tablet/laptop (flex-wrap: they
          stack on a narrow phone). Neither is a centred island. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <svg viewBox="0 0 340 120" style={{ width: "100%", display: "block", background: T.s2, borderRadius: R.lg }}>
            <rect x={18} y={25} width={chamberW} height={70} rx={8} fill={T.primaryTint} stroke={T.border} />
            {dots.map((d, i) => (
              <circle key={i} cx={24 + d.fx * (chamberW - 14)} cy={30 + d.fy * 60} r={3}
                fill={T.primaryText} opacity={0.45 + (P / 240) * 0.5} />
            ))}
            <rect x={18 + chamberW} y={18} width={12} height={84} rx={4} fill={T.accent} />
            <rect x={18 + chamberW + 12} y={52} width={52} height={9} fill={T.muted} />
          </svg>
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <svg viewBox="0 0 220 152" style={{ width: "100%", display: "block", background: T.s2, borderRadius: R.lg }}
            role="img" aria-label={`Pressure against volume, currently ${vol.toFixed(1)} cubic decimetres at ${Math.round(P)} kilopascals`}>
            {yTicks.map(p => (
              <line key={p} x1={36} y1={gyFor(p)} x2={210} y2={gyFor(p)} stroke={T.border} strokeWidth={1} opacity={0.5} />
            ))}
            <line x1={36} y1={116} x2={210} y2={116} stroke={T.border} />
            <line x1={36} y1={116} x2={36} y2={12} stroke={T.border} />
            {xTicks.map(v => (
              <g key={v}>
                <line x1={gxFor(v)} y1={116} x2={gxFor(v)} y2={121} stroke={T.border} />
                <text x={gxFor(v)} y={133} fontSize={10} fill={T.muted} textAnchor="middle">{v}</text>
              </g>
            ))}
            {yTicks.map(p => (
              <text key={p} x={31} y={gyFor(p) + 3.5} fontSize={10} fill={T.muted} textAnchor="end">{p}</text>
            ))}
            <path d={graphPts} fill="none" stroke={T.primary} strokeWidth={1.6} opacity={0.55} />
            <circle cx={gx} cy={gy} r={5} fill={T.accent} stroke={T.bg} strokeWidth={1.6} />
            <text x={123} y={148} fontSize={11} fill={T.sub} textAnchor="middle">Volume (dm³)</text>
            <text transform="rotate(-90 14 64)" x={14} y={64} fontSize={11} fill={T.sub} textAnchor="middle">Pressure (kPa)</text>
          </svg>
        </div>
      </div>
      <p style={{ fontSize: 13, color: T.sub, margin: "0 0 12px", lineHeight: 1.55 }}>
        Gas in a sealed cylinder · temperature constant.
      </p>

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
      <p style={{ fontSize: 14, color: T.text, textAlign: "center", margin: "0 0 12px", lineHeight: 1.55 }}>
        P × V stays 480 — that&apos;s the law.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <label htmlFor="boyle-volume" style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>
          Volume — drag to squeeze the gas
        </label>
        <span style={{ fontSize: 14, fontWeight: 800, color: T.accent }}>{vol.toFixed(1)} dm³</span>
      </div>
      <div style={{ padding: "6px 0" }}>
        <input id="boyle-volume" type="range" min={2} max={10} step={0.5} value={vol}
          aria-label="Volume in cubic decimetres"
          onChange={e => setVol(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: T.accent, height: 32, display: "block" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.muted, marginTop: 2 }}>
        <span>2 dm³</span><span>10 dm³</span>
      </div>

      <p style={{ fontSize: 13, color: T.sub, textAlign: "center", margin: "12px 0 0", lineHeight: 1.55 }}>
        Temperature stays constant, so pressure × volume stays constant.
      </p>
    </div>
  );
}

/* ── Block renderer ──────────────────────────────────────────────── */
export function LessonBlockView({ block, T, onContinueExercises }: {
  block: Block; T: T; onContinueExercises?: () => void;
}) {
  switch (block.kind) {
    case "section":
      return (
        <div style={card(T)}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: "0 0 12px", lineHeight: 1.35 }}>{block.heading}</h2>
          {block.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: T.text, overflowWrap: "break-word", margin: i === block.paragraphs.length - 1 ? 0 : "0 0 16px" }}>{p}</p>
          ))}
        </div>
      );
    case "predict":       return <PredictCard block={block} T={T} />;
    case "do-you-know":   return <DoYouKnowCard text={block.text} T={T} />;
    case "worked-example": return <WorkedExample block={block} T={T} />;
    case "story":         return <StoryShort block={block} T={T} onContinueExercises={onContinueExercises} />;
    case "simulator":
      if (block.simKind === "boyles-law-piston") return <BoyleLab T={T} />;
      return (
        <div style={card(T)}>
          <div style={eyebrow(T.primaryText)}><FlaskConical size={13} /> The lab</div>
          <p style={{ fontSize: 14, color: T.text, margin: 0, lineHeight: 1.6 }}>This interactive isn&apos;t available yet.</p>
        </div>
      );
    default:              return null;
  }
}
