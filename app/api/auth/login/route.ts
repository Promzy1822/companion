import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { verifyPassword, validateEmail, normaliseEmail } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(email);
  const MAX = 5;
  const WINDOW = 15 * 60 * 1000;
  if (!entry || now > entry.resetAt) return { allowed: true };
  if (entry.count >= MAX) return { allowed: false, waitSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  return { allowed: true };
}

function recordFail(email: string) {
  const now = Date.now();
  const WINDOW = 15 * 60 * 1000;
  const entry = loginAttempts.get(email);
  if (!entry || now > entry.resetAt) loginAttempts.set(email, { count: 1, resetAt: now + WINDOW });
  else entry.count++;
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

    const { email, password } = body as { email?: string; password?: string };

    if (!email || !validateEmail(email))
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    if (!password || typeof password !== "string")
      return NextResponse.json({ error: "Password is required" }, { status: 400 });

    const normEmail = normaliseEmail(email);

    const rateCheck = checkRateLimit(normEmail);
    if (!rateCheck.allowed) {
      const mins = Math.ceil((rateCheck.waitSeconds ?? 900) / 60);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    const account = await kv.get<Record<string, unknown>>(`account:${normEmail}`);

    console.log("[login] Account found for", normEmail, ":", account ? "YES" : "NO");

    if (!account) {
      recordFail(normEmail);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const pwOk = verifyPassword(password, account.passwordHash as string);
    if (!pwOk) {
      recordFail(normEmail);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    loginAttempts.delete(normEmail);
    return NextResponse.json({ success: true, account });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[login] Fatal:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 200) }, { status: 500 });
  }
}
