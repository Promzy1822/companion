import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

function safeNext(next: string | null, type: EmailOtpType | null): string {
  // Recovery links land on the reset form; everything else (signup
  // confirmations, magic links) lands on Home — never the reset form.
  const fallback = type === "recovery" ? "/reset-password" : "/";
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), type);

  const supabase = createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/confirm] verifyOtp failed:", error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/confirm] exchangeCodeForSession failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/auth?error=reset_link_invalid`);
}
