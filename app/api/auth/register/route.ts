import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { validateEmail, validatePassword, normaliseEmail } from "../../../lib/auth";
import { getCutoff, getSmartRecommendation } from "../../../lib/cutoffs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const regLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRegLimit(ip: string): boolean {
  const now = Date.now();
  const entry = regLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { regLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRegLimit(ip))
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });

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
    const supabase = createClient();

    const cutoff =
      institution && course &&
      institution !== "Other" && course !== "Other" &&
      typeof institution === "string" && typeof course === "string"
        ? getCutoff(institution, course) : null;

    const recommendation = cutoff && typeof institution === "string" && typeof course === "string"
      ? getSmartRecommendation(institution, course) : null;

    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password: password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || error.status === 422) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id:             data.user.id,
      name:           name.trim(),
      institution:    (institution as string) || "",
      course:         (course as string) || "",
      subjects:       Array.isArray(subjects) ? subjects : [],
      target:         (target as string) || "260",
      deadline:       (deadline as string) || "",
      self_rating:    (selfRating as string) || "2",
      cutoff_data:    cutoff,
      recommendation: recommendation,
    });

    if (profileError) {
      console.error("[register] Profile insert failed:", profileError.message);
      return NextResponse.json(
        { error: "Account created but profile setup failed. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id:             data.user.id,
        email:          normEmail,
        name:           name.trim(),
        institution:    (institution as string) || "",
        course:         (course as string) || "",
        subjects:       Array.isArray(subjects) ? subjects : [],
        target:         (target as string) || "260",
        deadline:       (deadline as string) || "",
        selfRating:     (selfRating as string) || "2",
        cutoffData:     cutoff,
        recommendation,
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[register] Fatal:", msg);
    return NextResponse.json({ error: "Server error: " + msg.slice(0, 200) }, { status: 500 });
  }
}
