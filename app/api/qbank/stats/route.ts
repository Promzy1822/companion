import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Simple admin key check — set ADMIN_KEY in your Vercel env vars
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey) {
    const provided = req.headers.get("x-admin-key");
    if (!provided || provided !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (!kvUrl) {
      return NextResponse.json({ available: false, reason: "KV not configured" });
    }
    const { kv } = await import("@vercel/kv");

    const [total, mathCount, engCount, physCount, chemCount, bioCount, govCount, ecoCount] =
      await Promise.all([
        kv.get<number>("qbank:total"),
        kv.llen("qbank:sub:Mathematics"),
        kv.llen("qbank:sub:English Language"),
        kv.llen("qbank:sub:Physics"),
        kv.llen("qbank:sub:Chemistry"),
        kv.llen("qbank:sub:Biology"),
        kv.llen("qbank:sub:Government"),
        kv.llen("qbank:sub:Economics"),
      ]);

    return NextResponse.json({
      available: true,
      total: total ?? 0,
      bySubject: {
        Mathematics:        mathCount,
        "English Language": engCount,
        Physics:            physCount,
        Chemistry:          chemCount,
        Biology:            bioCount,
        Government:         govCount,
        Economics:          ecoCount,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ available: false, error: msg });
  }
}
