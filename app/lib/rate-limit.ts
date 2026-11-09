import { createHmac } from "crypto";
import { createClient } from "./supabase/server";

// DB-backed rate limiting (public.rate_limits, touched only through the
// rate_limit_peek / rate_limit_hit / rate_limit_clear security-definer
// functions). Counters live in Postgres, so limits hold across every
// serverless instance — the old in-memory Maps reset per instance and
// barely limited anything on Vercel.
//
// Identifiers are HMAC-hashed before they become row keys: the table
// reveals nothing about which email or IP a row belongs to. Set
// RATE_LIMIT_SECRET in the environment — without it the hash has no
// secret component and anyone who knows an email could compute its key.
//
// Every helper fails open: if the limiter is unreachable, auth still
// works; the error is logged and the request proceeds.

function keyFor(scope: string, identifier: string): string {
  const secret = process.env.RATE_LIMIT_SECRET ?? "";
  return createHmac("sha256", secret).update(`${scope}:${identifier}`).digest("hex");
}

export async function rateLimitPeek(
  scope: string,
  identifier: string,
  max: number
): Promise<{ blocked: boolean; waitSeconds: number }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("rate_limit_peek", {
      p_key: keyFor(scope, identifier),
      p_max: max,
    });
    if (error || !data || !data[0]) return { blocked: false, waitSeconds: 0 };
    return { blocked: !!data[0].blocked, waitSeconds: data[0].wait_seconds ?? 0 };
  } catch (err) {
    console.error("[rate-limit] peek failed:", err instanceof Error ? err.message : err);
    return { blocked: false, waitSeconds: 0 };
  }
}

export async function rateLimitHit(
  scope: string,
  identifier: string,
  windowSeconds: number
): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("rate_limit_hit", {
      p_key: keyFor(scope, identifier),
      p_window_seconds: windowSeconds,
    });
  } catch (err) {
    console.error("[rate-limit] hit failed:", err instanceof Error ? err.message : err);
  }
}

export async function rateLimitClear(scope: string, identifier: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("rate_limit_clear", { p_key: keyFor(scope, identifier) });
  } catch (err) {
    console.error("[rate-limit] clear failed:", err instanceof Error ? err.message : err);
  }
}
