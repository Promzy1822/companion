import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
        Mathematics:       mathCount,
        "English Language":engCount,
        Physics:           physCount,
        Chemistry:         chemCount,
        Biology:           bioCount,
        Government:        govCount,
        Economics:         ecoCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ available: false, error: String(err?.message) });
  }
}
