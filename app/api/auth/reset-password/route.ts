import { NextRequest, NextResponse } from "next/server";
import { hashPassword, validatePassword } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getResetToken(token: string) {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      return await kv.get<{ email: string; expiresAt: number; used: boolean }>(`reset:${token}`);
    }
  } catch {}
  return null;
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

async function saveAccount(email: string, account: unknown) {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      await kv.set(`account:${email}`, account);
    }
  } catch {}
}

async function deleteToken(token: string) {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      await kv.del(`reset:${token}`);
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

    const { token, password } = body as { token?: string; password?: string };

    if (!token || typeof token !== "string")
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    if (!password || typeof password !== "string")
      return NextResponse.json({ error: "New password is required" }, { status: 400 });

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid)
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });

    const record = await getResetToken(token);
    if (!record)           return NextResponse.json({ error: "Link expired or already used." }, { status: 400 });
    if (record.used)       return NextResponse.json({ error: "This link has already been used." }, { status: 400 });
    if (Date.now() > record.expiresAt) return NextResponse.json({ error: "Reset link has expired." }, { status: 400 });

    const account = await getAccount(record.email);
    if (!account)          return NextResponse.json({ error: "Account not found." }, { status: 404 });

    account.passwordHash = hashPassword(password);
    account.updatedAt    = new Date().toISOString();
    await saveAccount(record.email, account);
    await deleteToken(token);

    return NextResponse.json({ success: true, account });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reset-password] Fatal:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 100) }, { status: 500 });
  }
}
