// src/proxy.ts - Session refresh & auth routing proxy (Next.js 16)
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabaseServer";

// Routes that require authentication
const PROTECTED_ROUTES = ["/learn", "/stats", "/feedback", "/operator"];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ["/signin"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req);

  // Refresh the session by calling getUser().
  // This keeps the session alive and updates cookies if the access token
  // was refreshed using the refresh token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute(pathname)) {
    const signinUrl = req.nextUrl.clone();
    signinUrl.pathname = "/signin";
    // Preserve the intended destination so we can redirect back after login
    signinUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Redirect authenticated users away from auth routes (e.g. signin)
  if (user && isAuthRoute(pathname)) {
    const learnUrl = req.nextUrl.clone();
    learnUrl.pathname = "/learn";
    return NextResponse.redirect(learnUrl);
  }

  return res;
}

// Only run proxy on app routes, skip static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, icons, etc.)
     * - API routes (they handle their own auth via requireAuth)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|webmanifest)$|api/).*)",
  ],
};
