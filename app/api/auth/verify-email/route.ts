import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { validateEmail, normaliseEmail } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OTPRecord {
  code:      string;
  expiresAt: number;
  attempts:  number;
  name:      string;
  pending:   Record<string, unknown>;
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
    const otpKey    = `otp:${normEmail}`;

    console.log("[verify-email] Looking up OTP for:", normEmail);

    const record = await kv.get<OTPRecord>(otpKey);

    console.log("[verify-email] OTP record found:", record ? "YES" : "NO");

    if (!record) {
      return NextResponse.json(
        { error: "Code expired or not found. Please request a new one." },
        { status: 400 }
      );
    }

    if (Date.now() > record.expiresAt) {
      await kv.del(otpKey);
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.code !== code.trim()) {
      // Increment attempts in KV
      await kv.set(otpKey, { ...record, attempts: record.attempts + 1 }, { ex: 660 });
      const left = 5 - record.attempts - 1;
      return NextResponse.json(
        { error: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.` },
        { status: 400 }
      );
    }

    // ── Valid OTP ────────────────────────────────────────────────────────────
    const account = { ...record.pending, verified: true };
    const accountKey = `account:${normEmail}`;

    await kv.set(accountKey, account);
    await kv.del(otpKey);

    // Confirm account was saved
    const saved = await kv.get(accountKey);
    console.log("[verify-email] Account saved:", saved ? "YES" : "NO");

    return NextResponse.json({ success: true, account });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[verify-email] Fatal:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 200) }, { status: 500 });
  }
}
