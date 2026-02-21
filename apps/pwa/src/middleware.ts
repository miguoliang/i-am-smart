import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabaseServer";

export async function middleware(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req);

  // Refresh session (required for Supabase SSR)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Logged-in user hitting marketing pages → redirect to /learn
  if (user && (pathname === "/" || pathname === "/signin")) {
    const url = req.nextUrl.clone();
    url.pathname = "/learn";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/", "/signin", "/learn/:path*"],
};
