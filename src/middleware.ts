export const runtime = 'nodejs'; // ********  NEW  ********

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from './lib/db';
import { eq } from 'drizzle-orm';
import { onboarding } from './lib/db/schema';

const protectedPrefixes = [
  '/profile-settings',
  '/admin/control-room',
  '/admin/post-approval',
  '/community/lessonNote',
  '/community/schemeOfWork',
  '/community/profile',
  '/notifications',
  '/onboarding'
  
 
] as const

export async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  

 /* 1. auth wall */
  const isProtected = protectedPrefixes.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isProtected && !session) return NextResponse.redirect(new URL("/login", req.url));

  /* 2. logged-in users should not see login */
  if (req.nextUrl.pathname === "/login" && session)
    return NextResponse.redirect(new URL("/", req.url));

/* 3. onboarding wall (only non-admins) */
  if (session) {
    //  assume you have `session.user.role`
    const isAdmin = session.user.role === "admin";

    if (!isAdmin) {
      const onboarded = await db.query.onboarding.findFirst({
        where: eq(onboarding.userId, session.user.id),
        columns: { id: true },
      });

      const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");
      if (!onboarded && !isOnboarding) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }
  }

  



  return NextResponse.next()
}


export const config = {
  matcher: [
    '/profile-settings/:path*',
    '/admin/settings/:path*',
    '/community/lessonNote/:path*',
    '/community/schemeOfWork/:path*',
    '/community/profile/:path*',
    '/admin/control-room/:path*',
    '/admin/post-approval/:path*',
    '/notifications/:path*',
    '/onboarding/:path*',
    
    '/login',
  ],
}