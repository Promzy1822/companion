import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

// ── Rate limiter (20 requests/min per IP) ─────────────────────────────────────
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

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// ── Input validation ──────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 5_000_000; // 5 MB base64 cap (~3.75 MB decoded)

function validateInput(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }
  const b = body as Record<string, unknown>;
  const { message, history, imageBase64 } = b;

  if (message !== undefined) {
    if (typeof message !== "string") return { valid: false, error: "Message must be a string" };
    if (message.length > 4000)       return { valid: false, error: "Message too long (max 4000 characters)" };
  }

  // ── NEW: cap image payload size ───────────────────────────────────────────
  if (imageBase64 !== undefined) {
    if (typeof imageBase64 !== "string") return { valid: false, error: "imageBase64 must be a string" };
    if (imageBase64.length > MAX_IMAGE_BYTES) {
      return { valid: false, error: "Image too large. Please use an image under 3.5 MB." };
    }
  }

  if (history !== undefined) {
    if (!Array.isArray(history)) return { valid: false, error: "History must be an array" };
    if (history.length > 20)     return { valid: false, error: "History too long (max 20 messages)" };
    for (const item of history) {
      if (!item.role || !item.content) return { valid: false, error: "Invalid history item format" };
      if (!["user", "assistant", "system"].includes(item.role)) return { valid: false, error: "Invalid role in history" };
      if (typeof item.content === "string" && item.content.length > 8000) return { valid: false, error: "History item too long" };
    }
  }
  return { valid: true };
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Companion AI, an expert JAMB study assistant for Nigerian students.

You help with:
- Solving and explaining JAMB past questions step-by-step (Mathematics, English, Physics, Chemistry, Biology, Government, Economics)
- Explaining difficult JAMB topics clearly in simple language
- Analysing images of questions or textbook pages
- Building personalised study plans
- Answering questions about JAMB, WAEC, NECO, and Nigerian university admissions

When solving questions:
1. State the correct answer clearly
2. Explain step by step in simple terms a Nigerian student can understand
3. Point out the key JAMB concept being tested
4. Give a memory tip where helpful

When given conversation history, maintain context and refer back to earlier messages naturally.

Be encouraging, concise, and focused. Always relate to Nigerian JAMB context.`;

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || req.headers.get("x-real-ip")
            || "unknown";

    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      console.warn(`[chat] Rate limit hit for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const message     = typeof b.message     === "string" ? b.message     : "";
    const history     = Array.isArray(b.history)          ? b.history     : [];
    const imageBase64 = typeof b.imageBase64 === "string" ? b.imageBase64 : "";
    const imageType   = typeof b.imageType   === "string" ? b.imageType   : "image/jpeg";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[chat] GROQ_API_KEY not configured");
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    if (!message.trim() && !imageBase64) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const messages: unknown[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    for (const item of history) {
      messages.push({
        role:    item.role === "assistant" ? "assistant" : "user",
        content: typeof item.content === "string"
          ? item.content.slice(0, 8000)
          : String(item.content).slice(0, 8000),
      });
    }

    let userContent: unknown;
    if (imageBase64) {
      userContent = [
        {
          type:      "image_url",
          image_url: {
            url: imageBase64.startsWith("data:")
              ? imageBase64
              : `data:${imageType};base64,${imageBase64}`,
          },
        },
        {
          type: "text",
          text: message.trim() || "Please read this image carefully. If it contains a JAMB question, solve it with a full explanation. If it is a textbook page or notes, summarise the key points relevant to JAMB.",
        },
      ];
    } else {
      userContent = message;
    }

    messages.push({ role: "user", content: userContent });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:       "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens:  1024,
        temperature: 0.4,
        messages,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[chat] Groq API error:", groqRes.status, errText.slice(0, 200));
      if (groqRes.status === 429) {
        return NextResponse.json(
          { error: "AI is busy right now. Please try again in a moment." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });
    }

    const data  = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("[chat] Empty response from Groq:", JSON.stringify(data));
      return NextResponse.json({ error: "No response from AI. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chat] Fatal error:", msg.slice(0, 100));
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
