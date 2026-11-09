import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { getAllTopics } from "../../../lib/syllabus";
import { getLessonVideo } from "../../../lib/lesson-videos";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export interface LessonExercise {
  question:     string;
  options:      string[];
  correctIndex: number;
  explanation:  string;
}

interface LessonContent {
  summary:   string;
  exercises: LessonExercise[];
}

// Generated content is cached permanently, so it must be structurally
// sound before it is stored or served — one malformed generation must
// not poison a topic forever.
function isValidLesson(c: LessonContent): boolean {
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

async function generateLessonContent(
  subjectName: string,
  topicName: string,
  subtopics: string[],
  objectives: string[]
): Promise<{ content: LessonContent | null; debugReason: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { content: null, debugReason: "GROQ_API_KEY not set" };

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

  try {
    // qwen3.6-27b retired 2026-09-14 — see /api/chat. Lessons are
    // text-only, so gpt-oss-120b works as a fallback here too.
    const lessonModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"];
    let res: Response | null = null;
    let lastErr = "";
    for (const model of lessonModels) {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages:    [{ role: "user", content: prompt }],
          max_tokens:  2048,
          temperature: 0.4,
        }),
      });
      if (res.ok) break;
      lastErr = `Groq HTTP ${res.status} (${model}): ${(await res.text()).slice(0, 300)}`;
      console.error("[lessons] Groq error:", lastErr);
    }

    if (!res || !res.ok) {
      return { content: null, debugReason: lastErr || "Groq request failed" };
    }

    const data    = await res.json();
    const text    = data?.choices?.[0]?.message?.content ?? "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const match   = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return { content: null, debugReason: `No JSON found in model output. Raw (first 300 chars): ${text.slice(0, 300)}` };
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch (parseErr) {
      const pMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return { content: null, debugReason: `JSON.parse failed (${pMsg}). Matched text (first 300 chars): ${match[0].slice(0, 300)}` };
    }

    if (typeof parsed.summary !== "string" || !Array.isArray(parsed.exercises)) {
      return {
        content: null,
        debugReason: `Unexpected shape — summary type: ${typeof parsed.summary}, exercises: ${Array.isArray(parsed.exercises) ? "array len " + parsed.exercises.length : typeof parsed.exercises}`,
      };
    }

    return { content: { summary: parsed.summary, exercises: parsed.exercises }, debugReason: "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[lessons] Fatal generating content:", msg);
    return { content: null, debugReason: `Fatal exception: ${msg.slice(0, 300)}` };
  }
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

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("lesson_cache")
      .select("content")
      .eq("topic_id", topicId)
      .single();
    const cached = (data?.content ?? null) as LessonContent | null;
    if (cached) {
      return NextResponse.json({
        topicId, subjectKey, subject: subject.display_name, topicName: topic.topic,
        videoId, ...cached,
      });
    }
  } catch (err) {
    console.error("[lessons] Cache read failed:", err instanceof Error ? err.message : err);
  }

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

  try {
    const supabase = createClient();
    await supabase
      .from("lesson_cache")
      .upsert({ topic_id: topicId, content: generated });
  } catch (err) {
    console.error("[lessons] Cache write failed:", err instanceof Error ? err.message : err);
  }

  return NextResponse.json({
    topicId, subjectKey, subject: subject.display_name, topicName: topic.topic,
    videoId, ...generated,
  });
}
