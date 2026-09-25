import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEmail, validatePassword, normaliseEmail } from "../../../lib/auth";
import { getCutoff, getSmartRecommendation } from "../../../lib/cutoffs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase server env vars");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRegLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, password, institution, course, subjects, target, deadline, selfRating } = body;

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase is not configured on this server." },
        { status: 500 }
      );
    }

    // regular client for sign-up/auth operations
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const cutoff =
      institution &&
      course &&
      institution !== "Other" &&
      course !== "Other" &&
      typeof institution === "string" &&
      typeof course === "string"
        ? getCutoff(institution, course)
        : null;

    const recommendation =
      cutoff && typeof institution === "string" && typeof course === "string"
        ? getSmartRecommendation(institution, course)
        : null;

    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || error.status === 422) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    }

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: data.user.id,
      name: name.trim(),
      institution: typeof institution === "string" ? institution : "",
      course: typeof course === "string" ? course : "",
      subjects: Array.isArray(subjects) ? subjects : [],
      target: typeof target === "string" ? target : "260",
      deadline: typeof deadline === "string" ? deadline : "",
      self_rating: typeof selfRating === "string" ? selfRating : "2",
      cutoff_data: cutoff,
      recommendation,
    });

    if (profileError) {
      console.error("[register] Profile insert failed:", profileError);

      try {
        await adminClient.auth.admin.deleteUser(data.user.id);
      } catch (cleanupErr) {
        console.error("[register] Cleanup failed:", cleanupErr);
      }

      return NextResponse.json(
        { error: "Could not create your profile. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: normEmail,
        name: name.trim(),
        institution: typeof institution === "string" ? institution : "",
        course: typeof course === "string" ? course : "",
        subjects: Array.isArray(subjects) ? subjects : [],
        target: typeof target === "string" ? target : "260",
        deadline: typeof deadline === "string" ? deadline : "",
        selfRating: typeof selfRating === "string" ? selfRating : "2",
        cutoffData: cutoff,
        recommendation,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[register] Fatal:", msg);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
