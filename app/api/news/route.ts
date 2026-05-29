import { NextRequest, NextResponse } from "next/server";
import { getNews } from "../../lib/news-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  try {
    const url      = new URL(req.url);
    const catParam = url.searchParams.get("category");

    const { articles, source, cacheAge } = await getNews();

    const filtered = catParam && catParam !== "All"
      ? articles.filter(a => a.category === catParam)
      : articles;

    const latency = Date.now() - t0;

    return NextResponse.json(
      {
        news: filtered,
        meta: {
          total:     articles.length,
          filtered:  filtered.length,
          source,
          cacheAge:  cacheAge ?? null,
          latency,
          timestamp: Date.now(),
        },
      },
      {
        headers: {
          "Cache-Control":  "public, max-age=300, stale-while-revalidate=600",
          "X-News-Source":  source,
          "X-News-Latency": String(latency),
        },
      }
    );
  } catch (err: any) {
    console.error("[api/news] Fatal:", err);
    return NextResponse.json(
      { news: [], meta: { source: "error", timestamp: Date.now() } },
      { status: 200 }
    );
  }
}
