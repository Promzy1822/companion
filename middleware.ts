import { NextRequest, NextResponse } from "next/server";

// Middleware is kept minimal — auth is enforced client-side.
// We only use middleware to pass requests through cleanly.
// Cookie-based protection will be re-enabled after session
// cookie is confirmed working end-to-end.

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
