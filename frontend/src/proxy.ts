import { NextResponse, NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  const refreshToken = request.cookies.get('refresh_token');

  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard', '/profile', '/settings'];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If no auth tokens, redirect to /login
  if (isProtected && !accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and visiting /login or /register, redirect to dashboard
  if (
    (pathname === '/login' || pathname === '/register') &&
    (accessToken || refreshToken)
  ) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/login', '/register'],
};
