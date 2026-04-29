import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/landing', '/auth', '/signup', '/api'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === '/_next' || pathname.includes('.')) return NextResponse.next();
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
