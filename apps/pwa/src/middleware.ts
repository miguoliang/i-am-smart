import { type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabaseServer";

/**
 * Next.js middleware — refreshes the Supabase auth session on every
 * request so that Server Components / Route Handlers always see an
 * up-to-date session cookie.
 *
 * This fixes the issue where a magic-link login sets the session on
 * one route but subsequent navigations (e.g. /learn → /stats) lose
 * the session because the cookie was never refreshed server-side.
 */
export async function middleware(request: NextRequest) {
  const { supabase, res } = createMiddlewareClient(request);

  // getUser() refreshes the session if the access token is expired
  // and writes the new tokens back into cookies via setAll().
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt, manifest etc.
     * - public assets (svg, png, jpg, ico, webp, webmanifest)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
