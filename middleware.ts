import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of routes that require authentication
const protectedRoutes = [
  '/me',
  '/create',
  '/edit',
  '/admin',
];

// List of authentication routes
const authRoutes = [
  '/signin',
  '/signup',
  '/verify-email',
  '/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  
  // If the user is not logged in and trying to access a protected route, redirect them to sign-in
  if (!token && (protectedRoutes.some(route => pathname.startsWith(route)) || protectedRoutes.some(route => pathname.endsWith(route)))) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  // If the user is logged in and trying to access an auth route, redirect them to home
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}; 