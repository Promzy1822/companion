import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

// TEMPORARY DIAGNOSTIC ROUTE — delete after use.
// Lists every model this GROQ_API_KEY actually has access to, straight from Groq.
export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not set in this deployment" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ groqStatus: res.status, groqResponse: data }, { status: 200 });
    }

    const models = (data.data || []).map((m: { id: string; active?: boolean }) => ({
      id: m.id,
      active: m.active,
    }));

    return NextResponse.json({ count: models.length, models });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
