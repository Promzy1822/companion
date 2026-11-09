import { NextRequest, NextResponse } from "next/server";
import { PAST_QUESTIONS } from "../../../data/questions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = (searchParams.get("subject") ?? "").toLowerCase();
  const year = searchParams.get("year");
  const rawLimit = parseInt(searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 100;
  const rawOffset = parseInt(searchParams.get("offset") ?? "0");
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  try {
    let all = PAST_QUESTIONS.filter((q: any) => q.subject === subject && (!q.has_diagram || q.image));
    const yearNum = year ? parseInt(year) : NaN;
    if (year && year !== "All" && Number.isFinite(yearNum)) {
      all = all.filter((q: any) => q.year === yearNum);
    }
    all.sort((a: any, b: any) => a.year - b.year || a.num - b.num);
    const total = all.length;
    const questions = all.slice(offset, offset + limit);
    return NextResponse.json({ subject, year: year || "all", total, offset, limit, questions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[qbank/questions]", msg);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
