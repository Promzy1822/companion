import { NextRequest, NextResponse } from "next/server";
import { KVAuth, KVAccount } from "../../../lib/kvAuth";
import { validateEmail, normaliseEmail } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { email, code } = body as { email?: string; code?: string };

  if (!email || !validateEmail(email))
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!code || typeof code !== "string" || code.trim().length !== 6)
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });

  const normEmail = normaliseEmail(email);
  const result    = await KVAuth.verifyOTP(normEmail, code.trim());

  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // Save verified account to KV
  const account: KVAccount = {
    ...result.pending!,
    verified: true,
  };
  await KVAuth.saveAccount(account);

  return NextResponse.json({ success: true, account });
}
