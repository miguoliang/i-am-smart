// src/lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  }
  return { url, anonKey };
}

/**
 * Create a Supabase client for Middleware
 * Use this in middleware.ts for session refresh
 */
export function createMiddlewareClient(req: NextRequest) {
  const res = NextResponse.next({ request: req })
  const { url, anonKey } = getSupabaseEnv();
  
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, res }
}

/**
 * Create a Supabase client for Server Components (read-only)
 * Use this in Server Components to read user data
 */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Read-only in Server Components
          // Session refresh is handled by middleware
        },
      },
    }
  )
}

/**
 * Create a Supabase client for Route Handlers (with mutations)
 * Use this in API routes when you need to modify cookies
 * Supports both cookie-based auth (web) and Authorization header (miniprogram/mobile)
 */
export async function createRouteHandlerClient(req?: NextRequest) {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv();
  
  // Check for Authorization header (for miniprogram/mobile clients)
  const authHeader = req?.headers.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`,
        } : undefined,
      },
    }
  )
}