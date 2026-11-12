// flame.ts — Flame the mascot: stage + heat + mood logic and speech lines.
//
// Flame reads ONLY data the app already keeps:
//   - streak doc in localStorage `companion_streak_v2` (Progress.getStreak())
//   - mock history in localStorage `mock_history` (max jambEquivalent)
// No new tables, no new API routes, no new dependencies.
//
// Two independent dimensions (exactly as in the approved sample):
//   - STAGE is long-term growth: Ember -> Spark -> Flame -> Blazing.
//     It moves over days, from streak + mock history. A broken streak drops
//     exactly one stage; no study for 2 days dims the flame.
//   - HEAT is the live session state: 0-100, starts at 40 (Warm) in a quiz.
//     A correct answer heats it up, a wrong answer cools it down. Heat is
//     session-only and never persisted.

import { Progress, todayWAT } from "./progress";

export type FlameStage = "ember" | "spark" | "flame" | "blazing";
export type FlameMood =
  | "happy"
  | "celebrating"
  | "sleepy"
  | "worried"
  | "thinking"
  | "encouraging";
export type HeatBand = "cold" | "warm" | "hot" | "blazing";

export const STAGE_ORDER: FlameStage[] = ["ember", "spark", "flame", "blazing"];

export const STAGE_LABEL: Record<FlameStage, string> = {
  ember: "Ember",
  spark: "Spark",
  flame: "Flame",
  blazing: "Blazing Flame",
};

// Stage unlock rules — exactly as approved in the sample.
export const STAGE_RULE: Record<FlameStage, string> = {
  ember: "Streak 0-2 days",
  spark: "Streak 3-6 days",
  flame: "Streak 7-13 days, or first mock done",
  blazing: "Streak 14+ days and best mock 300+",
};

export const STAGE_SPEECH: Record<FlameStage, string> = {
  ember: "Just lit. Feed me a little study every day.",
  spark: "Growing nicely. Three days in a row!",
  flame: "A full week — look how tall I've grown!",
  blazing: "Blazing! Fourteen days and 300+ — you're unstoppable.",
};

export const HEAT_SPEECH: Record<HeatBand, string> = {
  cold: "I'm going out… get one right!",
  warm: "Nice and steady. Keep going.",
  hot: "Yes! I'm roaring now!",
  blazing: "White-hot! Nothing can stop us!",
};

export const MOOD_SPEECH: Record<FlameMood, string> = {
  happy: "Ready when you are.",
  celebrating: "That's the one! You smashed it.",
  sleepy: "No study today yet… I'll wait.",
  worried: "Your streak ends tonight. One quick drill saves it.",
  thinking: "Hmm… which topic next?",
  encouraging: "That section was rough. One more drill and it's yours.",
};

export const HEAT_START = 40;
export const HEAT_CORRECT = 20;
export const HEAT_WRONG = 25;

export function heatBand(heat: number): HeatBand {
  if (heat < 25) return "cold";
  if (heat < 50) return "warm";
  if (heat < 75) return "hot";
  return "blazing";
}

/** Apply one quiz answer to the live heat state. Session-only. */
export function applyAnswer(
  heat: number,
  inRow: number,
  correct: boolean
): { heat: number; inRow: number } {
  if (correct) {
    return { heat: Math.min(100, heat + HEAT_CORRECT), inRow: inRow + 1 };
  }
  return { heat: Math.max(0, heat - HEAT_WRONG), inRow: 0 };
}

export function celebrateSpeech(score: number, total: number): string {
  return `${score}/${total} — that's the one! You smashed it.`;
}

export function worriedSpeech(streak: number): string {
  return `Your ${streak}-day streak ends tonight. One quick drill saves it.`;
}

export interface FlameData {
  /** Effective streak: 0 when the streak is broken (last study before yesterday). */
  streak: number;
  longest: number;
  lastStudied: string; // YYYY-MM-DD WAT, "" when never studied
  studiedToday: boolean;
  /** Whole days since last study; null when never studied. */
  daysSinceStudy: number | null;
  hasMock: boolean;
  bestMock: number | null; // best jambEquivalent /400, null when no mock yet
}

function daysBetween(a: string, b: string): number {
  // a, b are YYYY-MM-DD. Parse as UTC to avoid timezone drift.
  const pa = Date.parse(a + "T00:00:00Z");
  const pb = Date.parse(b + "T00:00:00Z");
  if (Number.isNaN(pa) || Number.isNaN(pb)) return 0;
  return Math.round((pb - pa) / 86400000);
}

function readBestMock(): { hasMock: boolean; bestMock: number | null } {
  try {
    if (typeof window === "undefined") return { hasMock: false, bestMock: null };
    const raw = localStorage.getItem("mock_history");
    if (!raw) return { hasMock: false, bestMock: null };
    const arr = JSON.parse(raw) as Array<{ jambEquivalent?: number }>;
    if (!Array.isArray(arr) || arr.length === 0) {
      return { hasMock: false, bestMock: null };
    }
    const scores = arr
      .map((h) => (typeof h.jambEquivalent === "number" ? h.jambEquivalent : -1))
      .filter((n) => n >= 0);
    if (scores.length === 0) return { hasMock: false, bestMock: null };
    return { hasMock: true, bestMock: Math.max(...scores) };
  } catch {
    return { hasMock: false, bestMock: null };
  }
}

/** Read everything Flame needs from existing local state. Never throws. */
export function readFlameData(): FlameData {
  const s = Progress.getStreak();
  const today = todayWAT();
  // Effective streak: the stored `current` only resets on the next activity
  // after a gap, so a streak whose last study was before yesterday is
  // already broken even though the stored number still looks alive.
  const broken = s.lastStudied !== "" && s.lastStudied !== today &&
    daysBetween(s.lastStudied, today) >= 2;
  const streak = broken ? 0 : s.current;
  const daysSinceStudy =
    s.lastStudied === "" ? null : daysBetween(s.lastStudied, today);
  const { hasMock, bestMock } = readBestMock();
  return {
    streak,
    longest: s.longest,
    lastStudied: s.lastStudied,
    studiedToday: s.lastStudied === today,
    daysSinceStudy,
    hasMock,
    bestMock,
  };
}

/** Pure stage derivation from streak + mock history. */
export function stageFromData(
  streak: number,
  hasMock: boolean,
  bestMock: number | null
): FlameStage {
  if (streak >= 14 && (bestMock ?? 0) >= 300) return "blazing";
  if (streak >= 7 || hasMock) return "flame";
  if (streak >= 3) return "spark";
  return "ember";
}

/** Pure derived stage (no stored-stage write) for result screens. */
export function readFlameStage(): FlameStage {
  const d = readFlameData();
  return stageFromData(d.streak, d.hasMock, d.bestMock);
}

const STAGE_STORE_KEY = "companion_flame_stage";

interface StoredStage {
  stage: FlameStage;
  breakKey: string; // lastStudied of the break this stored stage belongs to ("" = none)
}

function readStoredStage(): StoredStage | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STAGE_STORE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as StoredStage;
    if (!v || !STAGE_ORDER.includes(v.stage)) return null;
    return v;
  } catch {
    return null;
  }
}

function writeStoredStage(v: StoredStage): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STAGE_STORE_KEY, JSON.stringify(v));
  } catch {}
}

function oneBelow(stage: FlameStage): FlameStage {
  const i = STAGE_ORDER.indexOf(stage);
  return STAGE_ORDER[Math.max(0, i - 1)];
}

export interface FlameState extends FlameData {
  stage: FlameStage;
  /** True when no study for 2+ days — the flame renders dimmed. */
  dimmed: boolean;
}

/**
 * The full Flame state for a Home greeting: stage (with the one-stage drop
 * on a broken streak), dimmed flag, and the data behind them.
 * A broken streak drops exactly one stage, once per break: the stored stage
 * is tagged with the break's lastStudied date, so re-reading the same break
 * does not keep dropping.
 */
export function getFlameState(data?: FlameData): FlameState {
  const d = data ?? readFlameData();
  const derived = stageFromData(d.streak, d.hasMock, d.bestMock);
  const dimmed = (d.daysSinceStudy ?? 0) >= 2;

  let stage = derived;
  if (d.streak === 0 && d.lastStudied !== "") {
    // Streak is broken. Drop one stage from the stored pre-break stage.
    const stored = readStoredStage();
    if (stored && stored.breakKey === d.lastStudied) {
      stage = stored.stage; // same break, already dropped once
    } else {
      const base = stored && stored.stage ? stored.stage : derived;
      stage = oneBelow(base);
      writeStoredStage({ stage, breakKey: d.lastStudied });
    }
  } else {
    writeStoredStage({ stage: derived, breakKey: "" });
  }
  return { ...d, stage, dimmed };
}

export interface HomeFlame {
  mood: FlameMood;
  speech: string;
}

/**
 * Home greeting: mood + speech from streak / last-study / time of day.
 * `topic` (e.g. the student's first subject) feeds the midday nudge.
 */
export function homeFlame(
  state: FlameState,
  hour: number,
  topic?: string
): HomeFlame {
  if (!state.studiedToday && state.streak >= 3 && hour >= 17) {
    // Evening, streak alive but no study today — streak-save warning.
    return { mood: "worried", speech: worriedSpeech(state.streak) };
  }
  if (!state.studiedToday && state.streak >= 1 && hour < 12) {
    // Morning login, streak alive, not studied yet — celebration.
    return {
      mood: "celebrating",
      speech: `Welcome back! Day ${state.streak} — let's keep it going.`,
    };
  }
  if (!state.studiedToday && hour >= 12 && hour < 17 && topic) {
    // Midday, idle — gentle nudge towards one drill.
    return {
      mood: "thinking",
      speech: `You've got 20 minutes free. One drill on ${topic}?`,
    };
  }
  if (!state.studiedToday) {
    return { mood: "sleepy", speech: MOOD_SPEECH.sleepy };
  }
  // Studied today — happy, and the speech shows the growth stage.
  return { mood: "happy", speech: STAGE_SPEECH[state.stage] };
}

export interface ResultFlame {
  mood: FlameMood;
  speech: string;
}

/**
 * Mock result: celebrating on 300+ or a new personal best (incl. first mock
 * over 300 — the milestone line), encouraging otherwise.
 * Pass bestBefore = best jambEquivalent BEFORE this mock was recorded.
 */
export function mockResultFlame(
  score400: number,
  bestBefore: number | null
): ResultFlame {
  const isBest = bestBefore === null || score400 > bestBefore;
  if (score400 >= 300 && isBest) {
    return {
      mood: "celebrating",
      speech:
        bestBefore === null || bestBefore < 300
          ? "First mock over 300 — that's a new personal best!"
          : celebrateSpeech(score400, 400),
    };
  }
  if (score400 >= 300 || isBest) {
    return { mood: "celebrating", speech: celebrateSpeech(score400, 400) };
  }
  return { mood: "encouraging", speech: MOOD_SPEECH.encouraging };
}

/**
 * Lesson / drill completion: celebrating at 70%+, encouraging below.
 * Speech carries the real score.
 */
export function completionFlame(score: number, total: number): ResultFlame {
  if (total <= 0) return { mood: "happy", speech: MOOD_SPEECH.happy };
  if (score / total >= 0.7) {
    return { mood: "celebrating", speech: celebrateSpeech(score, total) };
  }
  return { mood: "encouraging", speech: MOOD_SPEECH.encouraging };
}
