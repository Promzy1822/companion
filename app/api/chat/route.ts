import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_TEXT = "meta-llama/llama-4-scout-17b-16e-instruct";
const MODEL_VIS  = "meta-llama/llama-4-scout-17b-16e-instruct"; // same model supports vision

const SYSTEM_PROMPT = `You are Companion AI, an expert JAMB study assistant for Nigerian students.
You help with:
- Solving and explaining JAMB past questions (Mathematics, English, Physics, Chemistry, Biology, Government, Economics)
- Breaking down difficult concepts clearly
- Analysing images of questions or textbook pages
- Building study plans and giving exam tips
- Answering any question about JAMB, WAEC, NECO, or university admissions in Nigeria

When solving questions:
1. State the correct answer clearly
2. Explain step by step in simple language
3. Point out the key JAMB concept being tested
4. Give a memory tip where helpful

Be encouraging, concise, and focused. You are talking to a Nigerian student preparing for JAMB.`;

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json();
    const message: string        = body.message || "";
    const imageBase64: string    = body.imageBase64 || "";   // base64 data URL
    const imageType: string      = body.imageType || "image/jpeg";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    if (!message.trim() && !imageBase64) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    // Build user content — text only OR text + image
    let userContent: any;

    if (imageBase64) {
      // Multimodal: image + optional text
      userContent = [
        {
          type: "image_url",
          image_url: {
            url: imageBase64.startsWith("data:")
              ? imageBase64
              : `data:${imageType};base64,${imageBase64}`,
          },
        },
      ];
      if (message.trim()) {
        userContent.push({ type: "text", text: message });
      } else {
        userContent.push({
          type: "text",
          text: "Please read this image carefully. If it contains a question, solve it with full explanation. If it is a textbook page or notes, summarise the key points for JAMB.",
        });
      }
    } else {
      userContent = message;
    }

    const groqBody = {
      model:       MODEL_VIS,
      max_tokens:  1024,
      temperature: 0.4,
      messages: [
        { role: "system",    content: SYSTEM_PROMPT },
        { role: "user",      content: userContent   },
      ],
    };

    const res = await fetch(GROQ_URL, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(groqBody),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[chat] Groq error:", res.status, err.slice(0, 200));
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    const data  = await res.json();
    const reply = data.choices?.[0]?.message?.content || "No response received.";

    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error("[chat] Fatal:", String(err?.message).slice(0, 100));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
