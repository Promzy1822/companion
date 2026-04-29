import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const publicPaths = ["/landing", "/signup", "/api"];
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next();
  return NextResponse.next();
}
