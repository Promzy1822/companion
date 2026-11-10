import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { getAllTopics } from "../../../lib/syllabus";
import { getLessonVideo } from "../../../lib/lesson-videos";
import {
  GOLDEN_LESSONS, sanitizeLessonV2,
  type LessonContentV2, type LessonExercise,
} from "../../../lib/lesson-v2";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export type { LessonExercise };

interface LessonContentV1 {
  summary:   string;
  exercises: LessonExercise[];
}

type AnyLesson = LessonContentV1 | LessonContentV2;

// Generated content is cached permanently, so it must be structurally
// sound before it is stored or served — one malformed generation must
// not poison a topic forever.
function isValidLesson(c: LessonContentV1): boolean {
  if (typeof c.summary !== "string" || c.summary.trim().length < 50) return false;
  if (!Array.isArray(c.exercises) || c.exercises.length === 0) return false;
  return c.exercises.every(e =>
    e &&
    typeof e.question === "string" && e.question.trim().length > 0 &&
    Array.isArray(e.options) && e.options.length === 4 &&
    e.options.every(o => typeof o === "string" && o.trim().length > 0) &&
    Number.isInteger(e.correctIndex) && e.correctIndex >= 0 && e.correctIndex < 4 &&
    typeof e.explanation === "string"
  );
}

const MODELS = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"];

async function callGroq(prompt: string, maxTokens: number): Promise<{ text: string | null; debugReason: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { text: null, debugReason: "GROQ_API_KEY not set" };
  let lastErr = "";
  for (const model of MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages:    [{ role: "user", content: prompt }],
          max_tokens:  maxTokens,
          temperature: 0.4,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { text: data?.choices?.[0]?.message?.content ?? "", debugReason: "" };
      }
      lastErr = `Groq HTTP ${res.status} (${model}): ${(await res.text()).slice(0, 300)}`;
      console.error("[lessons] Groq error:", lastErr);
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      console.error("[lessons] Groq fetch failed:", lastErr);
    }
  }
  return { text: null, debugReason: lastErr || "Groq request failed" };
}

function parseJsonObject(text: string): unknown | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

/* ── Lesson v2 generation: text-first blocks + interactions ─────── */
async function generateLessonV2(
  subjectName: string, topicName: string, subtopics: string[], objectives: string[]
): Promise<{ content: LessonContentV2 | null; debugReason: string }> {
  const prompt = `You are an expert JAMB (Nigerian UTME) tutor writing a self-contained, text-first lesson with embedded interactions.

Subject: ${subjectName}
Topic: ${topicName}
Key subtopics: ${subtopics.slice(0, 10).join("; ")}
Learning objectives: ${objectives.slice(0, 8).join("; ")}

FACT FENCE (strict): use ONLY facts supported by the subtopics and objectives above. Do not invent dates, names, figures or events. Write in clear Nigerian English with everyday local examples.

Return ONLY a raw JSON object, no markdown, no backticks:
{
  "version": 2,
  "blocks": [
    { "kind": "section", "heading": "A clear heading", "paragraphs": ["short paragraph", "short paragraph"] }
  ],
  "exercises": [
    {"question": "JAMB-style question", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "why, 1-2 sentences"}
  ]
}

BLOCK RULES:
- 2 or 3 "section" blocks. Each: 2-3 paragraphs of 60-110 words, covering the subtopics in order.
- Between/after sections you may add AT MOST 3 interaction blocks, chosen by the content's shape:
  * "story" — ONLY when the topic is a sequence of events or decisions (history, processes, developments). Shape: {"kind":"story","steps":[{"label":"1922","title":"...","body":"2-3 sentences","gained":"one line","missing":"one line"}],"closingPattern":"one line"}. 3-5 steps. At most ONE step may carry a "decision": {"question":"...","options":["...","..."],"correctIndex":0,"reveal":"what actually happened, 1-2 sentences"}.
  * "predict" — ONLY for a counterintuitive result. Shape: {"kind":"predict","question":"...","options":["...","...","..."],"correctIndex":0,"feedbackRight":"...","feedbackWrong":"..."}.
  * "worked-example" — REQUIRED when the topic is calculation-based. Shape: {"kind":"worked-example","problem":"...","steps":["step 1","step 2"],"answer":"final answer with a sanity note"}.
  * "do-you-know" — at most ONE, and it must restate one of the objectives in a memorable way. Shape: {"kind":"do-you-know","text":"Do you know? ..."}.
- NEVER emit a "simulator" block.
- Exactly 5 exercises, JAMB style, each with 4 options and an explanation.`;

  const { text, debugReason } = await callGroq(prompt, 3500);
  if (!text) return { content: null, debugReason };
  const parsed = parseJsonObject(text) as LessonContentV2 | null;
  if (!parsed) return { content: null, debugReason: "v2: no parseable JSON in model output" };
  const clean = sanitizeLessonV2(parsed);
  if (!clean) return { content: null, debugReason: "v2: failed structural validation" };
  return { content: clean, debugReason: "" };
}

/* ── Lesson v1 generation (legacy summary format, kept as fallback) */
async function generateLessonContent(
  subjectName: string,
  topicName: string,
  subtopics: string[],
  objectives: string[]
): Promise<{ content: LessonContentV1 | null; debugReason: string }> {
  const prompt = `You are an expert JAMB (Nigerian UTME) tutor writing a self-contained lesson.

Subject: ${subjectName}
Topic: ${topicName}
Key subtopics: ${subtopics.slice(0, 10).join("; ")}
Learning objectives: ${objectives.slice(0, 8).join("; ")}

Write a clear, exam-focused lesson for a JAMB candidate studying this topic for the first time.

Return ONLY a raw JSON object, no markdown, no backticks, no explanation outside the JSON:
{
  "summary": "A 300-450 word plain-language summary covering every key point above, with at least one worked example if the topic is calculation-based. Use short paragraphs.",
  "exercises": [
    {"question": "JAMB-style question 1", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "why this is correct, 1-2 sentences"},
    {"question": "JAMB-style question 2", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..."},
    {"question": "JAMB-style question 3", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..."},
    {"question": "JAMB-style question 4", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..."},
    {"question": "JAMB-style question 5", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..."}
  ]
}`;

  const { text, debugReason } = await callGroq(prompt, 2048);
  if (!text) return { content: null, debugReason };
  const parsed = parseJsonObject(text) as LessonContentV1 | null;
  if (!parsed || typeof parsed.summary !== "string" || !Array.isArray(parsed.exercises)) {
    return { content: null, debugReason: "v1: unexpected shape in model output" };
  }
  return { content: { summary: parsed.summary, exercises: parsed.exercises }, debugReason: "" };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  const topicId = params.topicId;
  const all = getAllTopics();
  const found = all.find(t => t.topic.id === topicId);
  if (!found) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }
  const { subjectKey, subject, topic } = found;
  const videoId = getLessonVideo(topicId);
  const base = {
    topicId, subjectKey, subject: subject.display_name, topicName: topic.topic,
    videoId, objectives: topic.objectives.slice(0, 3),
  };

  const cachePut = async (content: AnyLesson) => {
    try {
      const supabase = createClient();
      await supabase.from("lesson_cache").upsert({ topic_id: topicId, content });
    } catch (err) {
      console.error("[lessons] Cache write failed:", err instanceof Error ? err.message : err);
    }
  };

  // Hand-authored golden lessons ship exactly as approved.
  const golden = GOLDEN_LESSONS[topicId];
  if (golden) {
    void cachePut(golden);
    return NextResponse.json({ ...base, ...golden });
  }

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("lesson_cache")
      .select("content")
      .eq("topic_id", topicId)
      .single();
    const cached = (data?.content ?? null) as AnyLesson | null;
    if (cached) {
      const ok = (cached as LessonContentV2).version === 2
        ? sanitizeLessonV2(cached as LessonContentV2) !== null
        : isValidLesson(cached as LessonContentV1);
      if (ok) return NextResponse.json({ ...base, ...cached });
      console.error("[lessons] Cached content failed validation, regenerating:", topicId);
    }
  } catch (err) {
    console.error("[lessons] Cache read failed:", err instanceof Error ? err.message : err);
  }

  // Prefer v2; fall back to the legacy format so a lesson never breaks.
  const v2 = await generateLessonV2(subject.display_name, topic.topic, topic.subtopics, topic.objectives);
  if (v2.content) {
    await cachePut(v2.content);
    return NextResponse.json({ ...base, ...v2.content });
  }
  console.error("[lessons] v2 generation unusable, falling back:", v2.debugReason);

  const { content: generated, debugReason } = await generateLessonContent(
    subject.display_name, topic.topic, topic.subtopics, topic.objectives
  );

  if (!generated || !isValidLesson(generated)) {
    console.error("[lessons] Generation unusable:", debugReason || "failed structural validation");
    return NextResponse.json(
      { error: "Could not generate this lesson right now. Please try again." },
      { status: 502 }
    );
  }

  await cachePut(generated);
  return NextResponse.json({ ...base, ...generated });
}
