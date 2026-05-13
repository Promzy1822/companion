import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/landing', '/auth', '/api', '/_next'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow all public paths and static files
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.includes('.')) return NextResponse.next();
  // For all other routes, just pass through
  // Auth is handled client-side in each page's useEffect
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|manifest).*)'],
};
