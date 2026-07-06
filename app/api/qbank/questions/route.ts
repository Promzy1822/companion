import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject")?.toLowerCase() ?? "";
  const year    = searchParams.get("year") ?? "";
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);
  const offset  = parseInt(searchParams.get("offset") ?? "0");

  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  try {
    const allIds = await kv.get<string[]>(`qbank:index:${subject}`) ?? [];

    const filtered = year && year !== "All"
      ? allIds.filter(id => id.includes(`:${year}:`))
      : allIds;

    const pageIds = filtered.slice(offset, offset + limit);

    if (pageIds.length === 0) {
      return NextResponse.json({ subject, year, total: 0, questions: [] });
    }

    // Batch fetch all questions
    const pipeline = kv.pipeline();
    for (const id of pageIds) {
      pipeline.get(`question:${id}`);
    }
    const results = await pipeline.exec();
    const questions = results.filter(Boolean);

    return NextResponse.json({
      subject,
      year:      year || "all",
      total:     filtered.length,
      offset,
      limit,
      questions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[qbank/questions]", msg);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
