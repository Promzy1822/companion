import { NextRequest, NextResponse } from "next/server";
import { KVAuth } from "../../../lib/kvAuth";
import { verifyPassword, validateEmail, normaliseEmail } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { email, password } = body as { email?: string; password?: string };

  if (!email || !validateEmail(email))
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!password || typeof password !== "string")
    return NextResponse.json({ error: "Password is required" }, { status: 400 });

  const normEmail = normaliseEmail(email);

  // ── Rate limit check ───────────────────────────────────────────────────────
  const rateCheck = await KVAuth.checkLoginAttempts(normEmail);
  if (!rateCheck.allowed) {
    const mins = Math.ceil((rateCheck.waitSeconds ?? 900) / 60);
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  // ── Look up account ────────────────────────────────────────────────────────
  const account = await KVAuth.getAccount(normEmail);

  // Generic error — prevents account enumeration
  if (!account) {
    await KVAuth.recordFailedLogin(normEmail);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // ── Check verified ─────────────────────────────────────────────────────────
  if (!account.verified) {
    return NextResponse.json(
      { error: "Please verify your email first.", unverified: true },
      { status: 403 }
    );
  }

  // ── Verify password ────────────────────────────────────────────────────────
  const pwOk = verifyPassword(password, account.passwordHash);
  if (!pwOk) {
    await KVAuth.recordFailedLogin(normEmail);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // ── Success ────────────────────────────────────────────────────────────────
  await KVAuth.clearLoginAttempts(normEmail);
  return NextResponse.json({ success: true, account });
}
