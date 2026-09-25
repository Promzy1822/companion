import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEmail, validatePassword, normaliseEmail } from "../../../lib/auth";
import { getCutoff, getSmartRecommendation } from "../../../lib/cutoffs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Initialize the Supabase Admin client with the Service Role key to bypass RLS for server-side profile creation
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or Service Role Key in environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, password, institution, course, subjects, target, deadline, selfRating } = body;

    // 1. Input Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 });
    }

    const normEmail = normaliseEmail(email);

    // 2. Initialize Supabase Admin Client
    let supabaseAdmin;
    try {
      supabaseAdmin = getAdminClient();
    } catch (envError) {
      console.error("[register] Configuration error:", envError);
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // 3. Compute Recommendations / Cutoffs
    const cutoff =
      institution && course &&
      institution !== "Other" && course !== "Other" &&
      typeof institution === "string" && typeof course === "string"
        ? getCutoff(institution, course)
        : null;

    const recommendation = cutoff && typeof institution === "string" && typeof course === "string"
      ? getSmartRecommendation(institution, course)
      : null;

    // 4. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: normEmail,
      password: password,
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || authError.status === 422) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 409 }
        );
      }
      console.error("[register] SignUp error:", authError);
      return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }

    // 5. Insert Profile Row using Service Role (Bypasses RLS constraints)
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      name: name.trim(),
      institution: (institution as string) || "",
      course: (course as string) || "",
      subjects: Array.isArray(subjects) ? subjects : [],
      target: (target as string) || "260",
      deadline: (deadline as string) || "",
      self_rating: (selfRating as string) || "2",
      cutoff_data: cutoff,
      recommendation: recommendation,
    });

    if (profileError) {
      console.error("[register] Profile insert failed:", profileError);

      // Cleanup auth user to avoid orphan accounts if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json({ error: "Could not complete account setup. Please try again." }, { status: 500 });
    }

    // 6. Return Success Response
    return NextResponse.json({
      success: true,
      message: "Registration successful.",
      user: {
        id: authData.user.id,
        email: normEmail,
        name: name.trim(),
        institution: (institution as string) || "",
        course: (course as string) || "",
        subjects: Array.isArray(subjects) ? subjects : [],
        target: (target as string) || "260",
        deadline: (deadline as string) || "",
        selfRating: (selfRating as string) || "2",
        cutoffData: cutoff,
        recommendation,
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[register] Fatal server error:", msg);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
