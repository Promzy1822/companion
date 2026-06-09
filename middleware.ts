import { NextRequest, NextResponse } from "next/server";

// Routes that never need auth checks
const PUBLIC_PATHS = [
  "/landing",
  "/auth",
  "/api",
  "/_next",
  "/favicon",
  "/icon",
  "/manifest",
  "/sw.js",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and static assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next();

  // Allow root path through — landing page redirect is handled client-side
  // This prevents a redirect loop on first visit before localStorage is readable
  if (pathname === "/") return NextResponse.next();

  // For protected routes (/ai, /mock, /profile, /subjects, /studyplan, /solver, /questions)
  // check for session cookie and redirect to landing if absent
  const hasSession = req.cookies.has("companion_session");
  if (!hasSession) {
    const landingUrl = new URL("/landing", req.url);
    return NextResponse.redirect(landingUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|manifest|sw).*)"],
};
