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
): Promise<LessonContent | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

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
        model:       "meta-llama/llama-4-scout-17b-16e-instruct",
        messages:    [{ role: "user", content: prompt }],
        max_tokens:  2048,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      console.error("[lessons] Groq error:", res.status);
      return null;
    }

    const data    = await res.json();
    const text    = data?.choices?.[0]?.message?.content ?? "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const match   = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (typeof parsed.summary !== "string" || !Array.isArray(parsed.exercises)) return null;

    return { summary: parsed.summary, exercises: parsed.exercises };
  } catch (err) {
    console.error("[lessons] Fatal generating content:", err instanceof Error ? err.message : err);
    return null;
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

  const generated = await generateLessonContent(
    subject.display_name, topic.topic, topic.subtopics, topic.objectives
  );

  if (!generated) {
    return NextResponse.json(
      { error: "Could not generate lesson content. Please try again." },
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
