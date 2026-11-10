import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { getAllTopics } from "../../../lib/syllabus";
import { PAST_QUESTIONS } from "../../../data/questions";
import {
  validExercises, cleanMathText,
  type LessonExercise,
} from "../../../lib/lesson-v2";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

/**
 * Quick Drills get their OWN question set — never the lesson's check
 * questions. Two sources, merged and de-duplicated:
 *  1. Real past questions from the bank, keyword-matched to the
 *     topic's official subtopics.
 *  2. A generated practice set (8 questions), cached in lesson_cache
 *     under "<topicId>:drill", written with the lesson's own exercise
 *     questions on an exclusion list.
 * Last resort (both empty): the lesson's exercises, so a drill never
 * hard-breaks.
 */

const STOP = new Set([
  "introduction", "general", "basic", "structure", "system", "types",
  "concept", "meaning", "nature", "features", "principles", "functions",
  "overview", "theory", "studies", "analysis", "definition",
]);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function bankMatches(subjectKey: string, topicName: string, subtopics: string[]): LessonExercise[] {
  const phrases = subtopics.map(s => s.toLowerCase().trim()).filter(s => s.length >= 7);
  const words = new Set<string>();
  const addWords = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
      .forEach(w => { if (w.length >= 5 && !STOP.has(w)) words.add(w); });
  subtopics.forEach(addWords);
  addWords(topicName);

  const scored: { ex: LessonExercise; score: number }[] = [];
  for (const q of PAST_QUESTIONS as any[]) {
    if (q.subject !== subjectKey.toLowerCase() || q.has_diagram || !q.answer) continue;
    const opts = [q.options?.A, q.options?.B, q.options?.C, q.options?.D];
    if (opts.some(o => typeof o !== "string" || !o.trim())) continue;
    const text = String(q.question ?? "").toLowerCase();
    let score = 0;
    for (const p of phrases) if (text.includes(p)) score += 3;
    let wordHits = 0;
    for (const w of words) if (text.includes(w)) wordHits++;
    score += Math.min(wordHits, 3);
    if (score < 3) continue;
    const ci = "ABCD".indexOf(String(q.answer).trim().toUpperCase());
    if (ci < 0) continue;
    scored.push({
      score,
      ex: {
        question: q.question,
        options: opts,
        correctIndex: ci,
        explanation: `From JAMB ${q.year}, question ${q.num}.`,
      },
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return shuffle(scored.slice(0, 8).map(s => s.ex));
}

async function generateDrillSet(
  subjectName: string, topicName: string, subtopics: string[],
  objectives: string[], exclude: string[]
): Promise<LessonExercise[] | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const prompt = `You are an expert JAMB (Nigerian UTME) tutor writing a PRACTICE DRILL for a topic a student has just studied. This is not a lesson — only questions.

Subject: ${subjectName}
Topic: ${topicName}
Key subtopics: ${subtopics.slice(0, 10).join("; ")}
Learning objectives: ${objectives.slice(0, 8).join("; ")}

Write exactly 8 fresh, JAMB-style multiple-choice questions spread across the subtopics, at real exam difficulty. PLAIN MATHS: write all mathematics in plain text (x^2, sqrt(3400)) — never LaTeX or backslash commands.

These are the lesson's own check questions — your questions must be DIFFERENT from every one of them, not repeats or light rewordings:
${exclude.length ? exclude.map(q => "- " + q).join("\n") : "(none)"}

Return ONLY a raw JSON object, no markdown, no backticks:
{"exercises": [{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "why, 1-2 sentences"}]}`;

  for (const model of ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"]) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1800,
          temperature: 0.5,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      const match = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
      if (!match) continue;
      const parsed = JSON.parse(match[0]);
      if (validExercises(parsed?.exercises)) {
        return (parsed.exercises as LessonExercise[]).map(e => ({
          ...e, question: cleanMathText(e.question),
          options: e.options.map(cleanMathText), explanation: cleanMathText(e.explanation),
        }));
      }
    } catch (err) {
      console.error("[drills] generation failed:", err instanceof Error ? err.message : err);
    }
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  const topicId = params.topicId;
  const found = getAllTopics().find(t => t.topic.id === topicId);
  if (!found) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }
  const { subjectKey, subject, topic } = found;
  const base = { topicId, subjectKey, subject: subject.display_name, topicName: topic.topic };

  let lessonExercises: LessonExercise[] = [];
  let drillSet: LessonExercise[] | null = null;
  try {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("lesson_cache")
      .select("topic_id, content")
      .in("topic_id", [topicId, `${topicId}:drill`]);
    for (const row of rows ?? []) {
      const content = row.content as any;
      if (row.topic_id === topicId && validExercises(content?.exercises)) {
        lessonExercises = content.exercises;
      }
      if (row.topic_id === `${topicId}:drill` && validExercises(content?.exercises)) {
        drillSet = content.exercises;
      }
    }
  } catch (err) {
    console.error("[drills] cache read failed:", err instanceof Error ? err.message : err);
  }

  const bank = bankMatches(subjectKey, topic.topic, topic.subtopics);

  if (!drillSet) {
    drillSet = await generateDrillSet(
      subject.display_name, topic.topic, topic.subtopics, topic.objectives,
      lessonExercises.map(e => e.question)
    );
    if (drillSet) {
      try {
        const supabase = createClient();
        await supabase.from("lesson_cache")
          .upsert({ topic_id: `${topicId}:drill`, content: { exercises: drillSet } });
      } catch (err) {
        console.error("[drills] cache write failed:", err instanceof Error ? err.message : err);
      }
    }
  }

  const seen = new Set<string>();
  const merged: LessonExercise[] = [];
  for (const ex of [...bank, ...(drillSet ?? [])]) {
    const k = norm(ex.question);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(ex);
  }

  const exercises = merged.length >= 4 ? shuffle(merged).slice(0, 12) : lessonExercises;
  return NextResponse.json({ ...base, exercises });
}
