import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { validateEmail, validatePassword, normaliseEmail } from "../../../lib/auth";
import { getCutoff, getSmartRecommendation } from "../../../lib/cutoffs";
import { rateLimitPeek, rateLimitHit } from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const regCheck = await rateLimitPeek("register", ip, 5);
    if (regCheck.blocked)
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    await rateLimitHit("register", ip, 60);

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

    // A database trigger (on_auth_user_created) auto-creates a bare profiles
    // row the moment this succeeds. full_name goes in user metadata so the
    // trigger can use it immediately.
    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password: password,
      options: { data: { full_name: name.trim() } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || error.status === 422) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 409 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Too many attempts with this email. Please wait a minute and try again, or use a different email." },
          { status: 429 }
        );
      }
      console.error("[register] signUp failed:", error.status, error.code, error.message);
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }

    if (!data.session) {
      console.error("[register] signUp returned no session — 'Confirm email' may be enabled in Supabase settings.");
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name:           name.trim(),
        institution:    (institution as string) || "",
        course:         (course as string) || "",
        subjects:       Array.isArray(subjects) ? subjects : [],
        target:         (target as string) || "260",
        deadline:       (deadline as string) || "",
        self_rating:    (selfRating as string) || "2",
        cutoff_data:    cutoff,
        recommendation: recommendation,
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("[register] Profile update failed:", profileError.message);
      return NextResponse.json(
        { error: "Account created, but saving your details failed. Please log in to continue." },
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
