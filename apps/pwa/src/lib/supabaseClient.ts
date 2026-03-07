// src/lib/supabaseClient.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  // Return cached singleton when available
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build/prerender env vars may be absent.
  // Return a placeholder URL so the provider tree can render without
  // throwing.  The client will never be used server-side because all
  // Supabase calls happen inside useEffect or event handlers (client only).
  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      // Running in an actual browser without env vars is a real error
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
    }
    // SSR / prerender: return a harmless client that won't be used
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key',
    );
  }

  _client = createBrowserClient(
    url,
    anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  );

  return _client;
}
