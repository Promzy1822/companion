import { NextRequest, NextResponse } from "next/server";
import { KVAuth } from "../../../lib/kvAuth";
import { hashPassword, validatePassword } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { token, password } = body as { token?: string; password?: string };

  if (!token || typeof token !== "string")
    return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "New password is required" }, { status: 400 });
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid)
    return NextResponse.json({ error: pwCheck.message }, { status: 400 });

  // Verify token
  const tokenCheck = await KVAuth.verifyResetToken(token);
  if (!tokenCheck.valid)
    return NextResponse.json({ error: tokenCheck.reason }, { status: 400 });

  // Get account
  const account = await KVAuth.getAccount(tokenCheck.email!);
  if (!account)
    return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // Update password
  account.passwordHash = hashPassword(password);
  account.updatedAt    = new Date().toISOString();
  await KVAuth.saveAccount(account);

  // Consume token so it can't be reused
  await KVAuth.consumeResetToken(token);

  return NextResponse.json({ success: true, account });
}
