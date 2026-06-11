import { NextRequest, NextResponse } from "next/server";
import { KVAuth } from "../../../lib/kvAuth";
import { hashPassword, validateEmail, validatePassword, normaliseEmail } from "../../../lib/auth";
import { sendVerificationEmail } from "../../../lib/email";
import { getCutoff, getSmartRecommendation } from "../../../lib/cutoffs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Rate limit registrations per IP
const regLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRegLimit(ip: string): boolean {
  const now = Date.now();
  const entry = regLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    regLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function generateOTP(): string {
  // 6-digit cryptographically random OTP
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1_000_000).padStart(6, "0");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRegLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { name, email, password, institution, course, subjects, target, deadline, selfRating } = body as Record<string, unknown>;

  // Validate
  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email || typeof email !== "string" || !validateEmail(email))
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid)
    return NextResponse.json({ error: pwCheck.message }, { status: 400 });

  const normEmail = normaliseEmail(email);

  // Check duplicate — generic message to prevent enumeration
  const exists = await KVAuth.emailExists(normEmail);
  if (exists) {
    // Don't reveal whether email exists — send same success response
    // but don't actually send an email
    return NextResponse.json({ success: true, message: "If this email is new, a verification code has been sent." });
  }

  // Build pending account
  const cutoff = (
    institution && course &&
    institution !== "Other" && course !== "Other" &&
    typeof institution === "string" && typeof course === "string"
  ) ? getCutoff(institution as string, course as string) : null;

  const pending = {
    email:          normEmail,
    name:           (name as string).trim(),
    passwordHash:   hashPassword(password as string),
    institution:    (institution as string) || "",
    course:         (course as string) || "",
    subjects:       Array.isArray(subjects) ? subjects as string[] : [],
    target:         (target as string) || "260",
    deadline:       (deadline as string) || "",
    selfRating:     (selfRating as string) || "2",
    cutoffData:     cutoff,
    recommendation: cutoff ? getSmartRecommendation(institution as string, course as string) : null,
    createdAt:      new Date().toISOString(),
  };

  // Generate and store OTP
  const otp = generateOTP();
  await KVAuth.saveOTP(normEmail, otp, pending, (name as string).trim());

  // Send verification email
  const sent = await sendVerificationEmail(normEmail, (name as string).trim(), otp);
  if (!sent) {
    return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Verification code sent to your email." });
}
