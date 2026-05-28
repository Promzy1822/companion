import { NextRequest, NextResponse } from "next/server";
import { getNews, type NewsArticle } from "../../lib/news-engine";

// Tell Next.js: do NOT statically cache this route.
// We manage our own cache in news-engine.ts with proper TTL + SWR.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const t0 = Date.now();

  try {
    const { articles, source, cacheAge } = await getNews();

    // Optional: client can request a specific category via ?category=Exams
    const url      = new URL(req.url);
    const catParam = url.searchParams.get("category");
    const filtered = catParam && catParam !== "All"
      ? articles.filter((a: NewsArticle) => a.category === catParam)
      : articles;

    const latency = Date.now() - t0;
    console.log(`[api/news] Served ${filtered.length} articles in ${latency}ms (source: ${source})`);

    return NextResponse.json(
      {
        news:     filtered,
        meta: {
          total:    articles.length,
          filtered: filtered.length,
          source,
          cacheAge: cacheAge ?? null,
          latency,
          timestamp: Date.now(),
        },
      },
      {
        headers: {
          // Allow browser to cache for 5min, but mark as stale-while-revalidate
          // so it can serve the cached version while fetching fresh data
          "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
          "X-News-Source":  source,
          "X-News-Latency": String(latency),
        },
      }
    );
  } catch (err: any) {
    console.error("[api/news] Fatal error:", err);
    // Even on total failure, return fallback — never a blank screen
    return NextResponse.json(
      {
        news:     [],
        meta: { source: "error", error: String(err?.message).slice(0, 100), timestamp: Date.now() },
      },
      { status: 200 } // Return 200 so client doesn't treat it as a failure
    );
  }
}
