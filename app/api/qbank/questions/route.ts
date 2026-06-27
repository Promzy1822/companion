import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject")?.toLowerCase() ?? "";
  const year    = searchParams.get("year") ?? "";
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset  = parseInt(searchParams.get("offset") ?? "0");

  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  try {
    // Get index of all question IDs for this subject
    const indexKey = `qbank:index:${subject}`;
    const allIds   = await kv.get<string[]>(indexKey) ?? [];

    // Filter by year if provided
    const filtered = year
      ? allIds.filter(id => id.includes(`:${year}:`))
      : allIds;

    // Paginate
    const pageIds = filtered.slice(offset, offset + limit);

    // Fetch each question
    const questions = await Promise.all(
      pageIds.map(id => kv.get(`question:${id}`))
    );

    const valid = questions.filter(Boolean);

    return NextResponse.json({
      subject,
      year:  year || "all",
      total: filtered.length,
      offset,
      limit,
      questions: valid,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[qbank/questions]", msg);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
