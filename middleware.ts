import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/landing',
  '/auth',
  '/signup',
  '/api/news',
  '/api/chat',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Simple auth check (you can expand later)
  const token = request.cookies.get('auth_token')?.value;
  const user = request.cookies.get('companion_user')?.value;

  if (!token && !user && !pathname.startsWith('/')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json).*)',
  ],
};
