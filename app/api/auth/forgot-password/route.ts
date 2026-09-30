import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { validateEmail, normaliseEmail } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resetLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkResetLimit(ip: string): boolean {
  const now = Date.now(); const entry = resetLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { resetLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (entry.count >= 3) return false;
  entry.count++; return true;
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://companion-eta.vercel.app";

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normEmail, {
      redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
    });

    if (error) {
      console.error("[forgot-password] Supabase error:", error.message);
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[forgot-password] Fatal:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 100) }, { status: 500 });
  }
}
