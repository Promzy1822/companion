import { NextRequest, NextResponse } from "next/server";

// Routes that do NOT require authentication
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

  // Always allow static files and public routes
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next(); // static assets

  // Check for session cookie
  const hasSession = req.cookies.has("companion_session");

  if (!hasSession) {
    // Redirect to landing page if no session cookie
    const landingUrl = new URL("/landing", req.url);
    return NextResponse.redirect(landingUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|manifest|sw).*)"],
};
