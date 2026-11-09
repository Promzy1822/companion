import { NextRequest, NextResponse } from "next/server";
import { PAST_QUESTIONS } from "../../../data/questions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = (searchParams.get("subject") ?? "").toLowerCase();
  const year = searchParams.get("year");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 1000);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  try {
    let all = PAST_QUESTIONS.filter((q: any) => q.subject === subject && !q.has_diagram);
    if (year && year !== "All") {
      all = all.filter((q: any) => q.year === parseInt(year));
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
