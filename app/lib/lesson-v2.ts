/**
 * lesson-v2.ts — Lesson v2: text-first lessons with one interaction
 * per section (approved samples: Gas Laws phy_25, Constitutional
 * Development gov_23). Content is a list of blocks; interaction
 * blocks are rendered by app/components/lesson/players.tsx.
 *
 * GOLDEN_LESSONS holds hand-authored lessons that ship exactly as
 * approved — the route serves them before cache or generation.
 */

export interface LessonExercise {
  question:     string;
  options:      string[];
  correctIndex: number;
  explanation:  string;
}

export type LessonBlock =
  | { kind: "section"; heading: string; paragraphs: string[] }
  | { kind: "predict"; question: string; options: string[]; correctIndex: number; feedbackRight: string; feedbackWrong: string }
  | { kind: "simulator"; simKind: string; objective: string }
  | { kind: "story"; steps: StoryStep[]; closingPattern?: string }
  | { kind: "do-you-know"; text: string }
  | { kind: "worked-example"; problem: string; steps: string[]; answer: string };

export interface StoryStep {
  label: string;            // e.g. "1922"
  title: string;            // e.g. "Clifford Constitution"
  body: string;
  gained?: string;
  missing?: string;
  decision?: {
    question: string;
    options: string[];
    correctIndex: number;
    reveal: string;
  };
}

export interface LessonContentV2 {
  version: 2;
  blocks: LessonBlock[];
  exercises: LessonExercise[];
}

/** Simulator kinds that actually exist as components. A generated
 *  lesson naming anything else loses that block, not the lesson. */
export const REGISTERED_SIMS = ["boyles-law-piston"];

const isStr = (x: unknown, min = 1): x is string =>
  typeof x === "string" && x.trim().length >= min;

function validExercise(e: LessonExercise): boolean {
  return !!e &&
    isStr(e.question) &&
    Array.isArray(e.options) && e.options.length === 4 &&
    e.options.every(o => isStr(o)) &&
    Number.isInteger(e.correctIndex) && e.correctIndex >= 0 && e.correctIndex < 4 &&
    typeof e.explanation === "string";
}

function validBlock(b: LessonBlock): boolean {
  if (!b || typeof b !== "object") return false;
  switch (b.kind) {
    case "section":
      return isStr(b.heading) && Array.isArray(b.paragraphs) &&
        b.paragraphs.length >= 1 && b.paragraphs.every(p => isStr(p, 20));
    case "predict":
      return isStr(b.question) && Array.isArray(b.options) && b.options.length >= 2 &&
        b.options.every(o => isStr(o)) &&
        Number.isInteger(b.correctIndex) && b.correctIndex >= 0 && b.correctIndex < b.options.length &&
        isStr(b.feedbackRight) && isStr(b.feedbackWrong);
    case "simulator":
      return REGISTERED_SIMS.includes(b.simKind) && isStr(b.objective);
    case "story":
      return Array.isArray(b.steps) && b.steps.length >= 3 && b.steps.length <= 7 &&
        b.steps.every(s => s && isStr(s.label) && isStr(s.title) && isStr(s.body, 30) &&
          (!s.decision || (isStr(s.decision.question) &&
            Array.isArray(s.decision.options) && s.decision.options.length >= 2 &&
            Number.isInteger(s.decision.correctIndex) &&
            s.decision.correctIndex >= 0 && s.decision.correctIndex < s.decision.options.length &&
            isStr(s.decision.reveal, 20))));
    case "do-you-know":
      return isStr(b.text, 40);
    case "worked-example":
      return isStr(b.problem, 15) && Array.isArray(b.steps) && b.steps.length >= 2 &&
        b.steps.every(s => isStr(s)) && isStr(b.answer);
    default:
      return false;
  }
}

/** Drop invalid blocks (e.g. an unregistered simulator) instead of
 *  failing the whole lesson; fail only if the skeleton is unusable. */
export function sanitizeLessonV2(raw: LessonContentV2): LessonContentV2 | null {
  if (!raw || raw.version !== 2 || !Array.isArray(raw.blocks)) return null;
  const c = cleanStrings(raw) as LessonContentV2;
  const blocks = c.blocks.filter(validBlock);
  const sections = blocks.filter(b => b.kind === "section");
  if (sections.length < 1 || blocks.length < 2) return null;
  const textChars = sections.reduce(
    (n, b) => n + (b.kind === "section" ? b.paragraphs.join(" ").length : 0), 0);
  if (textChars < 300) return null;
  if (!Array.isArray(c.exercises) || c.exercises.length < 3) return null;
  if (!c.exercises.every(validExercise)) return null;
  return { version: 2, blocks, exercises: c.exercises };
}

/** The generator sometimes emits raw LaTeX (\vec, \sqrt{...}, \( \)),
 *  which renders as gibberish in the app's plain-text lesson view.
 *  Convert the common fragments to readable plain maths. */
export function cleanMathText(s: string): string {
  if (typeof s !== "string" || !s.includes("\\")) return s;
  return s
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/\$\$?/g, "")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\vec\s*\{?([A-Za-z])\}?/g, "$1")
    .replace(/\\hat\s*\{?([A-Za-z])\}?/g, "$1")
    .replace(/_\{([^{}]+)\}/g, "$1")
    .replace(/\^\{([^{}]+)\}/g, "^$1")
    .replace(/\\times/g, "×")
    .replace(/\\approx/g, "≈")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\ /g, " ")
    .replace(/\\(?:left|right)/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s{2,}/g, " ");
}

function cleanStrings(v: unknown, key = ""): unknown {
  if (typeof v === "string") return key === "kind" || key === "simKind" ? v : cleanMathText(v);
  if (Array.isArray(v)) return v.map(x => cleanStrings(x, key));
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = cleanStrings(val, k);
    return out;
  }
  return v;
}

/** True when every exercise is structurally sound (shared by the
 *  lessons and drills routes). */
export function validExercises(list: unknown): list is LessonExercise[] {
  return Array.isArray(list) && list.length > 0 && list.every(e => validExercise(e as LessonExercise));
}

export const GOLDEN_LESSONS: Record<string, LessonContentV2> = {

  phy_25: {
    version: 2,
    blocks: [
      { kind: "section", heading: "Squeezing a gas: Boyle's law", paragraphs: [
        "A gas is described by three quantities: its pressure, its volume and its temperature. Hold one of them steady and the other two trade off against each other in a pattern you can calculate.",
        "Try it in your head with a blocked syringe: push the plunger halfway in and the air inside pushes back twice as hard. The volume halved — the pressure doubled. That is Boyle's law: at constant temperature, pressure × volume stays constant (P₁V₁ = P₂V₂).",
      ]},
      { kind: "predict",
        question: "Before you touch the lab — predict: if the volume of a gas is halved at constant temperature, its pressure will…",
        options: ["Double", "Halve", "Stay the same"], correctIndex: 0,
        feedbackRight: "Exactly — P×V is constant, so halving V doubles P. Now prove it in the lab.",
        feedbackWrong: "Not quite — watch what P×V does in the lab as you squeeze." },
      { kind: "simulator", simKind: "boyles-law-piston",
        objective: "Use expressions of the gas laws to solve numerical problems" },
      { kind: "section", heading: "Heating a gas: Charles's law and the Pressure law", paragraphs: [
        "Now hold pressure steady and warm the gas instead: its volume grows in proportion to its temperature — Charles's law (V₁/T₁ = V₂/T₂). A balloon left in the hot sun expands; chill it and it shrinks.",
        "Hold the volume fixed instead and pressure rises with temperature — the Pressure law (P₁/T₁ = P₂/T₂). It is why a sealed bottle in a hot car is a small hazard.",
        "One warning that decides marks: temperatures must be in kelvin. Add 273 to convert (°C + 273). Every gas-law error JAMB expects starts with a temperature left in °C.",
      ]},
      { kind: "worked-example",
        problem: "A gas occupies 300 cm³ at 27°C and 1.0 × 10⁵ Pa. Find its volume at 0°C when the pressure is 1.5 × 10⁵ Pa.",
        steps: [
          "Convert: T₁ = 27 + 273 = 300 K, T₂ = 0 + 273 = 273 K",
          "Combine: V₂ = P₁V₁T₂ ÷ (T₁P₂) = (1.0 × 300 × 273) ÷ (300 × 1.5)",
        ],
        answer: "V₂ = 182 cm³ — smaller, as expected: colder and squeezed." },
      { kind: "do-you-know",
        text: "Do you know? If you extend Charles's-law lines backwards, every gas reaches zero volume at −273°C. That point — absolute zero — is why the kelvin scale exists, and why JAMB insists on it: gas laws only balance when temperature is measured from absolute zero." },
    ],
    exercises: [
      { question: "Boyle's law (P₁V₁ = P₂V₂) is true only when…",
        options: ["The temperature stays constant", "The pressure stays constant", "The volume stays constant", "The gas is heated"],
        correctIndex: 0, explanation: "Boyle's law is the isothermal law — temperature fixed." },
      { question: "A gas at constant temperature is compressed from 8 dm³ to 4 dm³. Its pressure…",
        options: ["Doubles", "Halves", "Stays the same", "Falls to a quarter"],
        correctIndex: 0, explanation: "Volume halved → pressure doubles, because P×V never changes." },
      { question: "200 cm³ of gas at 100 kPa is compressed to 250 kPa at constant temperature. The new volume is…",
        options: ["80 cm³", "125 cm³", "500 cm³", "50 cm³"],
        correctIndex: 0, explanation: "V₂ = P₁V₁/P₂ = (100 × 200) / 250 = 80 cm³." },
    ],
  },

  gov_23: {
    version: 2,
    blocks: [
      { kind: "section", heading: "Five constitutions, one argument", paragraphs: [
        "Between 1922 and 1960 Nigeria lived under five constitutions, and none of them was written by Nigerians at first. Read them as one long argument: each constitution was an answer to the failure of the one before it. Walk the chain — and at 1946, you will have a decision to make.",
      ]},
      { kind: "story",
        closingPattern: "The pattern to remember: representation (1922) → regions (1946) → consultation (1951) → federation (1954) → self-rule (1960).",
        steps: [
          { label: "1922", title: "Clifford Constitution",
            body: "Nigeria's first constitution, under Governor Hugh Clifford. Its big idea was the elective principle: for the first time, Nigerians voted for members of the Legislative Council.",
            gained: "The first Nigerian votes — 4 elected seats.",
            missing: "Only wealthy men in Lagos and Calabar could vote; the Governor kept almost all real power." },
          { label: "1946", title: "Richards Constitution",
            body: "Governor Arthur Richards redrew Nigeria into three regions — Northern, Western and Eastern — each with its own assembly, under one central council. He imposed the plan without consulting Nigerians first.",
            gained: "A regional structure that recognised Nigeria's diversity.",
            missing: "Imposed from above — no consultation, weak centre.",
            decision: {
              question: "Richards has handed down a constitution nobody asked Nigerians about. What happens next?",
              options: ["Nigerians accept it quietly", "Nationalists organise and resist"],
              correctIndex: 1,
              reveal: "They resisted. Azikiwe's NCNC toured the country raising funds and protests against the Richards Constitution — and that pressure is exactly why the next constitution was built differently.",
            } },
          { label: "1951", title: "Macpherson Constitution",
            body: "This time the British asked. Macpherson's constitution was drafted after consultations that reached down to village meetings, and Nigerians took a much larger share of government.",
            gained: "Real consultation and wider Nigerian participation.",
            missing: "The regions grew stronger than the centre — the country pulled in three directions." },
          { label: "1954", title: "Lyttleton Constitution",
            body: "The Lyttleton Constitution settled the argument about structure: Nigeria formally became a federation, with powers shared between the centre and the regions, and Lagos as the federal capital.",
            gained: "A true federal system — the framework Nigeria still uses.",
            missing: "Full self-government still waited — Britain held sovereignty." },
          { label: "1960", title: "Independence Constitution",
            body: "On 1 October 1960 Nigeria governed itself. The system was parliamentary: a Prime Minister ran the government, and the Queen was represented by a Governor-General — Dr Nnamdi Azikiwe, the first Nigerian in that seat.",
            gained: "Self-rule at last.",
            missing: "The head of state was still the British monarch — a republic only came in 1963." },
        ]},
      { kind: "do-you-know",
        text: "Do you know? The famous 'elective principle' of 1922 sounds democratic — but voting required an income of £100 a year, at a time when that was a fortune. The first Nigerian electorate was a few thousand wealthy men in just two cities." },
      { kind: "section", heading: "How JAMB tests this", paragraphs: [
        "JAMB rarely asks for bare dates. It asks which constitution introduced an idea (elective principle → Clifford), which one established the federation (Lyttleton, 1954), and what one constitution fixed that the previous one lacked (Macpherson = consultation). Learn the chain as cause and effect, and those questions answer themselves.",
      ]},
    ],
    exercises: [
      { question: "The elective principle was introduced by the…",
        options: ["Clifford Constitution, 1922", "Richards Constitution, 1946", "Macpherson Constitution, 1951", "Lyttleton Constitution, 1954"],
        correctIndex: 0, explanation: "Clifford 1922 — the first Nigerian votes, limited as they were." },
      { question: "Nigeria formally became a federation under the…",
        options: ["Lyttleton Constitution, 1954", "Richards Constitution, 1946", "Independence Constitution, 1960", "Macpherson Constitution, 1951"],
        correctIndex: 0, explanation: "Richards created regions; Lyttleton made it a true federation." },
      { question: "The Macpherson Constitution's biggest improvement on Richards was…",
        options: ["It was drafted after wide consultation with Nigerians", "It created the regions", "It made Lagos the capital", "It introduced the elective principle"],
        correctIndex: 0, explanation: "Richards imposed; Macpherson consulted — that contrast is the exam's favourite." },
    ],
  },
};
