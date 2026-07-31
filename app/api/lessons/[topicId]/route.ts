import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
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

function cacheKey(topicId: string) {
  return `lesson:content:${topicId}`;
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
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "qwen/qwen3.6-27b",
        messages:    [{ role: "user", content: prompt }],
        max_tokens:  2048,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[lessons] Groq error:", res.status, errText.slice(0, 200));
      return { content: null, debugReason: `Groq HTTP ${res.status}: ${errText.slice(0, 300)}` };
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
    const cached = await kv.get<LessonContent>(cacheKey(topicId));
    if (cached) {
      return NextResponse.json({
        topicId, subjectKey, subject: subject.display_name, topicName: topic.topic,
        videoId, ...cached,
      });
    }
  } catch (err) {
    console.error("[lessons] KV read failed:", err instanceof Error ? err.message : err);
  }

  const { content: generated, debugReason } = await generateLessonContent(
    subject.display_name, topic.topic, topic.subtopics, topic.objectives
  );

  if (!generated) {
    return NextResponse.json(
      { error: `DEBUG-LESSON: ${debugReason}` },
      { status: 502 }
    );
  }

  try {
    await kv.set(cacheKey(topicId), generated);
  } catch (err) {
    console.error("[lessons] KV write failed:", err instanceof Error ? err.message : err);
  }

  return NextResponse.json({
    topicId, subjectKey, subject: subject.display_name, topicName: topic.topic,
    videoId, ...generated,
  });
}
