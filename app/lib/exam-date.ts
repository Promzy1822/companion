// exam-date.ts — the exam date, one fact, one home.
//
// The JAMB 2027 window (proposed by the Federal Government's harmonised
// timetable, NOT confirmed by JAMB) is 15–25 March 2027. The plan counts
// down to the FIRST day so the student is ready for the earliest day.
//
// Two pieces of state:
// - `companion_exam_window` records HOW the date was chosen: the window, or
//   an exact date the student picked. Written by the landing wizard and by
//   the Home date sheet; read here and nowhere else.
// - `companion_user.deadline` / `profiles.deadline` always hold the
//   EFFECTIVE date the plan counts from: the window start, or the exact
//   date. Every consumer (plan generator, profile, countdown) reads only
//   this one string, so they all agree.
//
// A stored deadline with no window record (typed before the wizard existed)
// is treated as unset: the window is adopted on first read (see
// normalizeExamChoice). The student can re-pick an exact date from the
// Home date sheet in two taps.

import { Sync } from "./sync";

export const WINDOW_START = "2027-03-15";
export const WINDOW_END = "2027-03-25";
export const WINDOW_LABEL = "15–25 March 2027";

export const EXAM_WINDOW_KEY = "companion_exam_window";
const USER_KEY = "companion_user";

export type ExamChoice =
  | { mode: "window" }
  | { mode: "exact"; date: string };

export interface EffectiveExam {
  deadline: string; // YYYY-MM-DD the plan counts from
  estimated: boolean; // true while the proposed window is in force
  mode: "window" | "exact";
}

function isIsoDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// The wizard writes two shapes: window { start, end, proposed, estimated }
// and exact { estimated: false, date }. Both parse to the same choice.
function parseStored(raw: string | null): ExamChoice | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v && v.estimated === false && isIsoDate(v.date)) return { mode: "exact", date: v.date };
    if (v && (v.estimated === true || v.proposed === true)) return { mode: "window" };
    return null;
  } catch {
    return null;
  }
}

/** The recorded choice, if any. Null = never recorded (pre-wizard account). */
export function readExamChoice(): ExamChoice | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStored(localStorage.getItem(EXAM_WINDOW_KEY));
  } catch {
    return null;
  }
}

/** The date the plan counts from, and whether it is an estimate. */
export function getEffectiveExam(): EffectiveExam {
  const choice = readExamChoice();
  if (choice?.mode === "exact") {
    return { deadline: choice.date, estimated: false, mode: "exact" };
  }
  return { deadline: WINDOW_START, estimated: true, mode: "window" };
}

/** Whole days from now until the given date, floored at 0. */
export function daysUntil(iso: string): number {
  const diff = new Date(iso + "T00:00:00").getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function writeChoice(choice: ExamChoice): void {
  const value =
    choice.mode === "window"
      ? { start: WINDOW_START, end: WINDOW_END, proposed: true, estimated: true }
      : { estimated: false, date: choice.date };
  try {
    localStorage.setItem(EXAM_WINDOW_KEY, JSON.stringify(value));
  } catch {}
}

function writeDeadline(deadline: string): void {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? JSON.parse(raw) : {};
    user.deadline = deadline;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  void Sync.pushProfile({ deadline });
}

/**
 * One-time normalisation, run on Home mount: a stored deadline with no
 * recorded choice is treated as unset and the window is adopted, so Home
 * and the plan generator agree on 15 March. Idempotent — after the first
 * run the record exists and this is a no-op.
 */
export function normalizeExamChoice(): EffectiveExam {
  const effective = getEffectiveExam();
  if (readExamChoice() === null) {
    writeChoice({ mode: "window" });
    writeDeadline(WINDOW_START);
  }
  return effective;
}

/** Save the student's choice from the date sheet. */
export function saveExamChoice(choice: ExamChoice): EffectiveExam {
  const deadline = choice.mode === "exact" ? choice.date : WINDOW_START;
  writeChoice(choice);
  writeDeadline(deadline);
  return { deadline, estimated: choice.mode === "window", mode: choice.mode };
}
