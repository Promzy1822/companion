import { NextRequest, NextResponse } from "next/server";
import { hashPassword, validateEmail, validatePassword, normaliseEmail } from "../../../lib/auth";
import { sendVerificationEmail } from "../../../lib/email";
import { getCutoff, getSmartRecommendation } from "../../../lib/cutoffs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory OTP store (works without KV configured)
// KV is used when available for persistence across serverless instances
const memOTPStore = new Map<string, { code: string; expiresAt: number; attempts: number; pending: unknown; name: string }>();

const regLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRegLimit(ip: string): boolean {
  const now = Date.now();
  const entry = regLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { regLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (entry.count >= 5) return false;
  entry.count++; return true;
}

function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

async function saveOTP(email: string, code: string, pending: unknown, name: string) {
  const record = { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0, pending, name };
  // Always save to memory first
  memOTPStore.set(email, record);
  // Try KV if available
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    if (kvUrl) {
      const { kv } = await import("@vercel/kv");
      await kv.set(`otp:${email}`, record, { ex: 600 });
    }
  } catch (e) {
    console.warn("[register] KV unavailable, using memory store:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRegLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

    const { name, email, password, institution, course, subjects, target, deadline, selfRating } = body;

    if (!name || typeof name !== "string" || !name.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email || typeof email !== "string" || !validateEmail(email))
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    if (!password || typeof password !== "string")
      return NextResponse.json({ error: "Password is required" }, { status: 400 });

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid)
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });

    const normEmail = normaliseEmail(email);

    // Check duplicate
    try {
      const kvUrl = process.env.KV_REST_API_URL;
      if (kvUrl) {
        const { kv } = await import("@vercel/kv");
        const existing = await kv.get(`account:${normEmail}`);
        if (existing) {
          return NextResponse.json({ success: true, message: "If this email is new, a verification code has been sent." });
        }
      }
    } catch (e) {
      console.warn("[register] KV check failed, continuing:", e);
    }

    const cutoff = (
      institution && course &&
      institution !== "Other" && course !== "Other" &&
      typeof institution === "string" && typeof course === "string"
    ) ? getCutoff(institution, course) : null;

    const pending = {
      email:          normEmail,
      name:           (name as string).trim(),
      passwordHash:   hashPassword(password as string),
      institution:    (institution as string) || "",
      course:         (course as string) || "",
      subjects:       Array.isArray(subjects) ? subjects : [],
      target:         (target as string) || "260",
      deadline:       (deadline as string) || "",
      selfRating:     (selfRating as string) || "2",
      cutoffData:     cutoff,
      recommendation: cutoff && typeof institution === "string" && typeof course === "string"
        ? getSmartRecommendation(institution, course) : null,
      createdAt:      new Date().toISOString(),
    };

    const otp = generateOTP();
    await saveOTP(normEmail, otp, pending, (name as string).trim());

    const sent = await sendVerificationEmail(normEmail, (name as string).trim(), otp);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send verification email. Please check your email address and try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Verification code sent to your email." });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[register] Fatal error:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 100) }, { status: 500 });
  }
}
