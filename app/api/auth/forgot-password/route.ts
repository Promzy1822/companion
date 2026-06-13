import { NextRequest, NextResponse } from "next/server";
import { validateEmail, normaliseEmail } from "../../../lib/auth";
import { sendPasswordResetEmail } from "../../../lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resetLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkResetLimit(ip: string): boolean {
  const now = Date.now(); const entry = resetLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { resetLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (entry.count >= 3) return false;
  entry.count++; return true;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getAccount(email: string) {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      return await kv.get<Record<string, unknown>>(`account:${email}`);
    }
  } catch {}
  return null;
}

async function saveResetToken(email: string, token: string) {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      await kv.set(`reset:${token}`, { email, expiresAt: Date.now() + 60 * 60 * 1000, used: false }, { ex: 3600 });
    }
  } catch (e) {
    console.warn("[forgot-password] KV save failed:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkResetLimit(ip))
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });

    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

    const { email } = body as { email?: string };
    if (!email || !validateEmail(email))
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });

    const normEmail = normaliseEmail(email);
    const GENERIC = { success: true, message: "If an account exists, a reset link has been sent." };

    const account = await getAccount(normEmail);
    if (!account) return NextResponse.json(GENERIC);

    const token  = generateToken();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://companion-eta.vercel.app";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await saveResetToken(normEmail, token);
    await sendPasswordResetEmail(normEmail, account.name as string, resetUrl);

    return NextResponse.json(GENERIC);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[forgot-password] Fatal:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 100) }, { status: 500 });
  }
}
