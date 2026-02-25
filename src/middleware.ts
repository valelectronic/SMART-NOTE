import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Define routes that require a session
  const protectedPrefixes = [
    '/profile-settings',
    '/admin',
    '/community',
    '/notifications',
    '/onboarding',
  ];

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isLoginPage = pathname === "/login";

  // 2. Only perform the fetch if the user is going to a protected page OR the login page
  if (isProtectedRoute || isLoginPage) {
    try {
      const sessionResponse = await fetch(`${req.nextUrl.origin}/api/auth/get-session`, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        cache: 'no-store', // Ensures we get fresh auth data every time
      });

      // Better-Auth returns null or a session object
      const session = await sessionResponse.json();

      // LOGIC: Not logged in -> Redirect to login
      if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // LOGIC: Already logged in -> Redirect away from login page
      if (isLoginPage && session) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      console.error("Middleware Auth Fetch Error:", error);
      // If the auth API fails, it's safer to redirect to login
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Exclude static assets and API routes from running middleware
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};