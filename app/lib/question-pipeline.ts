/**
 * question-pipeline.ts
 *
 * Completely hidden background pipeline.
 * Processes incoming questions silently — no UI interaction, no user feedback.
 * Called fire-and-forget after the user receives their answer.
 *
 * Pipeline stages:
 *   1. Detect subject
 *   2. Validate quality and structure
 *   3. Generate dedup fingerprint
 *   4. (KV check + write handled in API route)
 */

export interface ProcessedQuestion {
  id:          string;
  text:        string;
  subject:     string;
  options:     string[];
  hasOptions:  boolean;
  fingerprint: string;
  source:      "solver" | "mock" | "ai";
  addedAt:     number;
}

export interface PipelineResult {
  approved:    boolean;
  reason?:     string;   // only used for internal logging, never shown to user
  question?:   ProcessedQuestion;
}

// ── Subject detection ─────────────────────────────────────────────────────────

const SUBJECT_SIGNALS: Record<string, string[]> = {
  "Mathematics": [
    "equation","solve","find x","find y","calculate","simplify","factorise",
    "factorize","differentiate","integrate","matrix","determinant","prove",
    "log ","logarithm","quadratic","arithmetic","geometric","progression",
    "probability","permutation","combination","trigonometry","sine","cosine",
    "tangent","angle","circle","triangle","polygon","area","volume","perimeter",
    "series","sequence","binomial","set","venn","algebra","gradient",
    "coordinate","straight line","curve","maximum","minimum","turning point",
  ],
  "English Language": [
    "comprehension","passage","synonym","antonym","figure of speech","simile",
    "metaphor","personification","hyperbole","irony","oxymoron","alliteration",
    "noun","verb","adjective","adverb","pronoun","preposition","conjunction",
    "tense","clause","phrase","sentence","paragraph","essay","letter","report",
    "register","diction","rhyme","stress","intonation","phoneme","vowel",
    "consonant","syllable","word class","parts of speech","subject","predicate",
    "concord","agreement","idiom","proverb",
  ],
  "Physics": [
    "velocity","acceleration","force","mass","weight","energy","power","work",
    "momentum","impulse","friction","pressure","density","gravity","circuit",
    "current","voltage","resistance","ohm","capacitor","inductor","magnetic",
    "electric field","wave","frequency","wavelength","amplitude","refraction",
    "reflection","lens","mirror","temperature","heat","thermodynamics","entropy",
    "nuclear","radioactive","half-life","fission","fusion","photoelectric",
    "electron","proton","neutron","atom","quantum","projectile","circular motion",
  ],
  "Chemistry": [
    "element","compound","mixture","atom","molecule","bond","ionic","covalent",
    "metallic","periodic","valency","oxidation","reduction","redox","acid","base",
    "alkali","salt","pH","neutralisation","electrolysis","electrode","cathode",
    "anode","mole","concentration","molarity","titration","buffer","equilibrium",
    "rate of reaction","catalyst","enthalpy","exothermic","endothermic","organic",
    "alkane","alkene","alkyne","alcohol","ester","polymer","isomer","distillation",
    "chromatography","electron configuration","atomic number","mass number",
  ],
  "Biology": [
    "cell","nucleus","mitochondria","ribosome","chloroplast","membrane","osmosis",
    "diffusion","photosynthesis","respiration","digestion","enzyme","protein",
    "carbohydrate","lipid","dna","rna","gene","chromosome","mitosis","meiosis",
    "genetics","heredity","mutation","evolution","natural selection","ecosystem",
    "food chain","food web","habitat","population","community","nitrogen cycle",
    "carbon cycle","blood","heart","lung","kidney","liver","nervous system",
    "hormone","reproduction","fertilisation","embryo","classification","taxonomy",
  ],
  "Government": [
    "constitution","democracy","government","legislature","executive","judiciary",
    "separation of powers","rule of law","sovereignty","citizenship","rights",
    "duties","fundamental","federalism","unitary","confederation","parliament",
    "president","governor","senator","representative","election","political party",
    "pressure group","civil service","local government","revenue","allocation",
    "independence","colonialism","imperialism","nationalism","ecowas","african union",
    "united nations","foreign policy","treaty","diplomacy","coup",
  ],
  "Economics": [
    "demand","supply","price","market","equilibrium","elasticity","consumer",
    "producer","utility","budget","income","expenditure","gdp","gnp","inflation",
    "deflation","unemployment","interest rate","money","bank","credit","fiscal",
    "monetary","trade","export","import","balance of payment","exchange rate",
    "tariff","quota","monopoly","oligopoly","competition","cost","revenue",
    "profit","loss","economies of scale","public finance","tax","subsidy",
  ],
  "Literature in English": [
    "novel","poem","poetry","drama","play","character","plot","theme","setting",
    "conflict","resolution","protagonist","antagonist","narrator","point of view",
    "imagery","symbolism","allegory","satire","tragedy","comedy","soliloquy",
    "aside","dramatic irony","diction","tone","mood","stanza","verse","rhyme",
    "metre","rhythm","sonnet","prose","fiction","non-fiction","literary",
  ],
  "Geography": [
    "map","scale","latitude","longitude","equator","tropic","climate","weather",
    "rainfall","temperature","vegetation","soil","erosion","deposition","river",
    "delta","estuary","mountain","plateau","valley","plain","ocean","sea",
    "continental shelf","population","migration","urbanisation","industry",
    "agriculture","mining","tourism","nigeria","africa","continent","country",
  ],
};

export function detectSubject(text: string): { subject: string; confidence: number } {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [subject, signals] of Object.entries(SUBJECT_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      if (lower.includes(signal)) score += signal.split(" ").length > 1 ? 3 : 1;
    }
    if (score > 0) scores[subject] = score;
  }

  if (Object.keys(scores).length === 0) {
    return { subject: "General", confidence: 0 };
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  // Normalize confidence: cap at signal count / 10
  const confidence = Math.min(100, Math.round((best[1] / 5) * 100));
  return { subject: best[0], confidence };
}

// ── Quality validation ────────────────────────────────────────────────────────

const SPAM_PATTERNS = [
  /^(.)\1{8,}/,          // repeated single character
  /^[^a-zA-Z]{0,5}$/,   // almost no letters
  /lorem ipsum/i,
  /test\s*question/i,
  /^(hi|hello|ok|yes|no|lol|wtf|bruh)\.?$/i,
];

export function validateQuestion(text: string): { valid: boolean; reason: string } {
  const trimmed = text.trim();

  if (trimmed.length < 25) {
    return { valid: false, reason: "too_short" };
  }
  if (trimmed.length > 3000) {
    return { valid: false, reason: "too_long" };
  }

  // Must contain at least some alphabetic content
  const letterRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
  if (letterRatio < 0.4) {
    return { valid: false, reason: "low_letter_ratio" };
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: "spam_pattern" };
    }
  }

  return { valid: true, reason: "ok" };
}

// ── MCQ option extraction ─────────────────────────────────────────────────────

export function extractOptions(text: string): string[] {
  const patterns = [
    /^\s*[ABCD][.)]\s+.+/gim,
    /^\s*\([ABCD]\)\s+.+/gim,
    /^\s*[1234][.)]\s+.+/gim,
  ];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length >= 2) {
      return matches.map(m => m.trim());
    }
  }
  return [];
}

// ── Dedup fingerprint ─────────────────────────────────────────────────────────

export function fingerprint(text: string): string {
  // Normalize: lowercase, strip punctuation, take first 12 significant words
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(w => w.length > 2)
    .slice(0, 12)
    .join(" ");

  // Simple but consistent hash
  let h = 0x811c9dc5;
  for (let i = 0; i < words.length; i++) {
    h ^= words.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(36);
}

// ── ID generator ──────────────────────────────────────────────────────────────

export function generateId(): string {
  const ts   = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `q_${ts}_${rand}`;
}

// ── Main pipeline entry ───────────────────────────────────────────────────────

export function processQuestion(
  text:    string,
  hintSubject?: string,
  source:  ProcessedQuestion["source"] = "solver"
): PipelineResult {

  // Stage 1: validate
  const { valid, reason } = validateQuestion(text);
  if (!valid) {
    return { approved: false, reason };
  }

  // Stage 2: detect subject
  const detected  = detectSubject(text);
  const subject   = hintSubject || detected.subject;

  // Stage 3: extract options
  const options   = extractOptions(text);
  const hasOptions = options.length >= 2;

  // Stage 4: build fingerprint for dedup
  const fp = fingerprint(text);

  return {
    approved: true,
    question: {
      id:         generateId(),
      text:       text.trim(),
      subject,
      options,
      hasOptions,
      fingerprint: fp,
      source,
      addedAt:    Date.now(),
    },
  };
}
