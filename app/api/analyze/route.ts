import { NextRequest, NextResponse } from 'next/server';

// ── In-memory rate limiter (20 req/min per IP) ────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now    = Date.now();
  const window = 60_000;
  const limit  = 20;
  const entry  = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window });
    return { allowed: true };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

// ── Input sanitiser — strips characters that could break prompt structure ─────
function sanitise(input: unknown, maxLen = 200): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/\{|\}/g, '')
    .replace(/`/g, '')
    .trim()
    .slice(0, maxLen);
}

function sanitiseSubjects(subjects: unknown): string[] {
  if (!Array.isArray(subjects)) return [];
  return subjects
    .slice(0, 10)
    .map(s => sanitise(s, 50))
    .filter(Boolean);
}

interface PracticeEntry {
  subject: string;
  correct: number;
  total:   number;
}

function sanitisePracticeHistory(history: unknown): PracticeEntry[] {
  if (!Array.isArray(history)) return [];
  return history
    .slice(0, 50) // cap at 50 entries
    .filter((h): h is Record<string, unknown> => h && typeof h === 'object')
    .map(h => ({
      subject: sanitise(h.subject, 60),
      correct: typeof h.correct === 'number' ? Math.floor(Math.min(Math.max(h.correct, 0), 10000)) : 0,
      total:   typeof h.total   === 'number' ? Math.floor(Math.min(Math.max(h.total,   0), 10000)) : 0,
    }))
    .filter(h => h.subject && h.total > 0);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || req.headers.get('x-real-ip')
           || 'unknown';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
    );
  }

  // ── Parse & validate body ───────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  // Validate and sanitise all user-supplied fields before they touch the prompt
  const practiceHistory = sanitisePracticeHistory(raw.practiceHistory);
  const rawProfile      = raw.userProfile;

  if (!rawProfile || typeof rawProfile !== 'object') {
    return NextResponse.json({ error: 'userProfile is required' }, { status: 400 });
  }

  const profile = rawProfile as Record<string, unknown>;
  const name     = sanitise(profile.name,   80);
  const target   = sanitise(String(profile.target ?? '250'), 10);
  const subjects = sanitiseSubjects(profile.subjects);

  if (!name) {
    return NextResponse.json({ error: 'userProfile.name is required' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  // ── Build prompt with sanitised data only ───────────────────────────────────
  // No raw user strings are interpolated — only the cleaned versions
  const historyLines = practiceHistory
    .map(h => `- ${h.subject}: ${h.correct}/${h.total} correct`)
    .join('\n') || '- No practice history yet';

  const prompt = `You are an AI study analyst for Nigerian JAMB students.
Analyse this student's practice history and identify areas to improve.

Student name: ${name}
Target JAMB score: ${target}/400
Selected subjects: ${subjects.join(', ') || 'Not specified'}

Practice results (last sessions):
${historyLines}

Return ONLY a raw JSON object with no markdown, no backticks, no explanation:
{
  "weakSubjects": ["subject1"],
  "strongSubjects": ["subject2"],
  "weakTopics": [{"subject": "Mathematics", "topic": "Logarithms", "accuracy": 40}],
  "recommendation": "One sentence study tip",
  "studyHoursNeeded": 3,
  "predictedScore": 265,
  "improvementTips": ["tip1", "tip2", "tip3"]
}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'meta-llama/llama-4-scout-17b-16e-instruct',
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  512,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error('[analyze] Groq error:', res.status);
      return NextResponse.json({ analysis: null }, { status: 502 });
    }

    const data     = await res.json();
    const text     = data?.choices?.[0]?.message?.content ?? '{}';
    const cleaned  = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    let analysis = null;
    if (jsonMatch) {
      try { analysis = JSON.parse(jsonMatch[0]); } catch { /* ignore malformed */ }
    }

    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[analyze] Fatal:', msg.slice(0, 100));
    return NextResponse.json({ analysis: null }, { status: 500 });
  }
}
