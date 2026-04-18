// src/proxy.ts - Session refresh & auth routing proxy (Next.js 16)
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabaseServer";

// Routes that require authentication
const PROTECTED_ROUTES = ["/stats", "/feedback", "/contact", "/operator"];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ["/signin"];

// Routes that redirect to /learn when authenticated
const MARKETING_ROUTES = ["/"];

/** Under /operator but reachable without app session (operator uses its own OTP flow). */
const OPERATOR_PUBLIC_PREFIXES = ["/operator/login"];

function isOperatorPublicRoute(pathname: string): boolean {
  return OPERATOR_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isProtectedRoute(pathname: string): boolean {
  if (isOperatorPublicRoute(pathname)) return false;
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Copy session cookies from the middleware response to a redirect response.
 * When getUser() refreshes an expired access token, the new token is written
 * to `res` via setAll(). If we then redirect with a brand-new NextResponse,
 * those refreshed cookies would be lost unless we forward them.
 */
function redirectWithCookies(
  url: URL,
  middlewareRes: NextResponse
): NextResponse {
  const redirectRes = NextResponse.redirect(url);
  middlewareRes.cookies.getAll().forEach((cookie) => {
    redirectRes.cookies.set(cookie.name, cookie.value);
  });
  return redirectRes;
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
    const destination = req.nextUrl.search
      ? `${pathname}${req.nextUrl.search}`
      : pathname;
    signinUrl.searchParams.set("next", destination);
    return redirectWithCookies(signinUrl, res);
  }

  // Redirect authenticated users away from auth routes (e.g. signin)
  if (user && isAuthRoute(pathname)) {
    const learnUrl = req.nextUrl.clone();
    learnUrl.pathname = "/learn";
    return redirectWithCookies(learnUrl, res);
  }

  // Redirect authenticated users from marketing homepage to /learn
  if (user && MARKETING_ROUTES.includes(pathname)) {
    const learnUrl = req.nextUrl.clone();
    learnUrl.pathname = "/learn";
    return redirectWithCookies(learnUrl, res);
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
