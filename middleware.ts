import { NextRequest, NextResponse } from 'next/server';

// Routes that don't need authentication
const PUBLIC_ROUTES = ['/landing', '/auth', '/api'];
const STATIC_EXTENSIONS = ['.png', '.jpg', '.svg', '.ico', '.json', '.txt', '.js', '.css'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Allow files with known extensions
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For protected routes, check auth cookie
  // We can't verify localStorage from middleware (server-side)
  // so we use a simple cookie set on login
  const authCookie = req.cookies.get('companion_auth');

  if (!authCookie || !authCookie.value || authCookie.value.length < 10) {
    // Redirect to landing if no auth cookie
    const url = req.nextUrl.clone();
    url.pathname = '/landing';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|manifest).*)',
  ],
};
