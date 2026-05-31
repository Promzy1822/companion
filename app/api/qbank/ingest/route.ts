/**
 * /api/qbank/ingest
 *
 * Hidden background endpoint. Called fire-and-forget from the client.
 * The user never sees this request — it runs after they receive their answer.
 *
 * Uses Vercel KV if available. If KV env vars are not set,
 * returns 200 silently and does nothing. Zero user impact either way.
 */

import { NextRequest, NextResponse } from "next/server";
import { processQuestion } from "../../../lib/question-pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Max time this function can run — keep short so it doesn't slow deploys
export const maxDuration = 10;

const SILENT_OK = NextResponse.json({ ok: true }, { status: 200 });

async function getKV() {
  // Dynamically import — gracefully unavailable if not configured
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    if (!kvUrl || !kvToken) return null;
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, subject: hintSubject, source } = body;

    if (!text || typeof text !== "string") return SILENT_OK;

    // Run pipeline — pure JS, no external calls
    const result = processQuestion(text, hintSubject, source || "solver");

    if (!result.approved || !result.question) {
      console.log(`[qbank] Rejected (${result.reason}): ${text.slice(0, 40)}`);
      return SILENT_OK;
    }

    const q  = result.question;
    const kv = await getKV();

    if (!kv) {
      // KV not configured — pipeline ran successfully, just no persistence yet
      console.log(`[qbank] KV unavailable — processed but not stored: ${q.subject}`);
      return SILENT_OK;
    }

    // Dedup check — O(1) Redis GET
    const dupKey    = `qbank:hash:${q.fingerprint}`;
    const existing  = await kv.get(dupKey);
    if (existing) {
      console.log(`[qbank] Duplicate skipped: ${q.fingerprint}`);
      return SILENT_OK;
    }

    // Write all KV operations in parallel
    const subKey  = `qbank:sub:${q.subject}`;
    const qKey    = `qbank:q:${q.id}`;

    await Promise.all([
      // Mark fingerprint as seen (dedup sentinel, 90-day TTL)
      kv.set(dupKey, "1", { ex: 90 * 24 * 3600 }),
      // Store full question (no expiry — permanent bank)
      kv.set(qKey, JSON.stringify({
        id:         q.id,
        text:       q.text,
        subject:    q.subject,
        options:    q.options,
        hasOptions: q.hasOptions,
        source:     q.source,
        addedAt:    q.addedAt,
      })),
      // Append to subject index (list, max 10000 per subject)
      kv.lpush(subKey, q.id),
      // Increment global counter
      kv.incr("qbank:total"),
    ]);

    // Trim subject list to 10000 to prevent unbounded growth
    await kv.ltrim(subKey, 0, 9999);

    console.log(`[qbank] Approved → ${q.subject} | id: ${q.id}`);
    return SILENT_OK;

  } catch (err: any) {
    // Never propagate errors — this is a silent background process
    console.error("[qbank] Pipeline error:", String(err?.message).slice(0, 100));
    return SILENT_OK;
  }
}
