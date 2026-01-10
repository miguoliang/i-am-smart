import { createMiddlewareClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function proxy(req: NextRequest) {
  try {
    const { supabase, res } = createMiddlewareClient(req)

    // Refresh session if expired - required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = req.nextUrl.pathname

    // Public marketing routes that don't require authentication
    const publicRoutes = [
      '/',
      '/signin',
      '/features',
      '/pricing',
      '/changelog',
      '/docs',
      '/blog',
    ]

    // Protected routes that require authentication
    const protectedRoutes = ['/learn', '/stats', '/operator', '/feedback']

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )

    // If user is not signed in and trying to access protected routes
    // Allow access to public routes (marketing site, sign-in, etc.)
    if (!user && !isPublicRoute && isProtectedRoute) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }

    // Add CORS headers for Supabase API calls
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return res
  } catch (error) {
    // If there's an error (e.g., during prerendering), just continue
    // This prevents crashes during static generation
    logger.error('Middleware error', { error, pathname: req.nextUrl.pathname })
    const res = NextResponse.next({ request: req })
    // Add CORS headers even on error
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _not-found (Next.js not-found page)
     * - favicon.ico (favicon file)
     * - static assets (images, svg, etc.)
     * - PWA assets (manifest, service worker)
     */
    '/((?!api|_next/static|_next/image|_not-found|favicon.ico|manifest.webmanifest|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

