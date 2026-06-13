import { NextRequest, NextResponse } from "next/server";
import { validateEmail, normaliseEmail } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Shared memory store — must match register route
// In production with multiple serverless instances, KV is used
const memOTPStore = new Map<string, { code: string; expiresAt: number; attempts: number; pending: unknown; name: string }>();

async function getOTP(email: string) {
  // Try KV first
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      const record = await kv.get<{ code: string; expiresAt: number; attempts: number; pending: unknown; name: string }>(`otp:${email}`);
      if (record) return { record, source: "kv" as const };
    }
  } catch (e) {
    console.warn("[verify-email] KV unavailable:", e);
  }
  // Fall back to memory
  const record = memOTPStore.get(email);
  return record ? { record, source: "memory" as const } : null;
}

async function saveAccount(email: string, account: unknown) {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      await kv.set(`account:${email}`, account);
    }
  } catch (e) {
    console.warn("[verify-email] KV save failed:", e);
  }
}

async function deleteOTP(email: string) {
  memOTPStore.delete(email);
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      await kv.del(`otp:${email}`);
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

    const { email, code } = body as { email?: string; code?: string };

    if (!email || !validateEmail(email))
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    if (!code || typeof code !== "string" || code.trim().length !== 6)
      return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });

    const normEmail = normaliseEmail(email);
    const result = await getOTP(normEmail);

    if (!result)
      return NextResponse.json({ error: "Code expired or not found. Please request a new one." }, { status: 400 });

    const { record } = result;

    if (Date.now() > record.expiresAt)
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
    if (record.attempts >= 5)
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 400 });
    if (record.code !== code.trim()) {
      record.attempts++;
      const left = 5 - record.attempts;
      return NextResponse.json({ error: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.` }, { status: 400 });
    }

    // Valid — save verified account
    const account = { ...record.pending as object, verified: true };
    await saveAccount(normEmail, account);
    await deleteOTP(normEmail);

    return NextResponse.json({ success: true, account });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[verify-email] Fatal:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 100) }, { status: 500 });
  }
}
