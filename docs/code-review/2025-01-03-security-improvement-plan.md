# Security by Design Improvement Plan (Simplified for Netlify + Supabase)

**Date:** 2025-01-03  
**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 1 day

## Executive Summary

This plan leverages Netlify and Supabase platform features to address security vulnerabilities with minimal complexity:
1. **CORS Policy** - Restrict middleware proxy only (Netlify handles API routes automatically)
2. **Input Sanitization** - Use existing `dompurify` library

**Key Simplifications:**
- ✅ No external dependencies needed
- ✅ Netlify handles API route CORS automatically
- ✅ Netlify provides rate limiting platform features
- ✅ Supabase provides built-in rate limiting

---

## Current State Analysis

### Security Issues Identified

#### 1. CORS Policy ⚠️ **CRITICAL**
- **Location:** `src/proxy.ts` (lines 25, 36)
- **Issue:** CORS headers set to `'*'` allowing requests from any origin
- **Risk:** Cross-origin attacks, unauthorized API access
- **Current Code:**
```typescript
res.headers.set('Access-Control-Allow-Origin', '*')
```

#### 2. Input Sanitization ⚠️ **MEDIUM**
- **Location:** `src/app/api/feedback/route.ts`, `src/app/feedback/page.tsx`
- **Issue:** User-generated content stored without HTML sanitization
- **Risk:** XSS attacks, stored malicious scripts
- **Current State:**
  - Only `.trim()` used for whitespace removal
  - No HTML/script tag sanitization
  - `dompurify` library available but not used

---

## Implementation Plan

### Phase 1: CORS Policy Restriction

**Goal:** Restrict CORS in middleware proxy (Netlify handles API route CORS automatically)

#### 1.1 Add Environment Variable

**File:** `.env.local` (add to existing)

```env
# CORS Configuration (for middleware proxy only)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**File:** `netlify.toml` (add CORS headers for static assets if needed)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://yourdomain.com"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```

#### 1.2 Create Simple CORS Utility

**File:** `src/lib/utils/cors.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get allowed origins from environment variable
 */
function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) {
    // Production: use Netlify URL or configured domain
    if (process.env.NODE_ENV === 'production') {
      const netlifyUrl = process.env.NETLIFY_URL || process.env.NEXT_PUBLIC_SITE_URL;
      return netlifyUrl ? [netlifyUrl] : [];
    }
    // Development fallback
    return ['http://localhost:3000'];
  }
  return origins.split(',').map(origin => origin.trim());
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for a request (simplified)
 */
export function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin');
  
  if (!origin || !isOriginAllowed(origin)) {
    return {}; // No CORS headers if origin not allowed
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
```

#### 1.3 Update Proxy Middleware

**File:** `src/proxy.ts`

```typescript
import { createMiddlewareClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { getCorsHeaders } from '@/lib/utils/cors'

export async function proxy(req: NextRequest) {
  try {
    const { supabase, res } = createMiddlewareClient(req)

    // Refresh session if expired - required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = req.nextUrl.pathname

    // If user is not signed in and trying to access protected routes (not root)
    // Allow access to root path ('/') for sign-in page
    if (!user && pathname !== '/') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }

    // Add CORS headers (restricted to allowed origins)
    const corsHeaders = getCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });

    return res
  } catch (error) {
    // If there's an error (e.g., during prerendering), just continue
    // This prevents crashes during static generation
    logger.error('Middleware error', { error, pathname: req.nextUrl.pathname })
    const res = NextResponse.next({ request: req })
    
    // Add CORS headers even on error (restricted)
    const corsHeaders = getCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    
    return res
  }
}

// ... rest of file
```

**Estimated Time:** 1-2 hours

---

### Phase 2: Input Sanitization

**Goal:** Sanitize all user-generated content before storage

#### 3.1 Create Sanitization Utility

**File:** `src/lib/utils/sanitize.ts`

```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as Window);

/**
 * Sanitize HTML content
 * Removes script tags, event handlers, and other dangerous content
 */
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content but strip tags
  });
}

/**
 * Sanitize plain text (removes HTML and normalizes whitespace)
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  const withoutHtml = purify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Normalize whitespace
  return withoutHtml.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize feedback content object
 */
export interface FeedbackContent {
  occupation?: string;
  learningPurpose?: string[];
  fragmentTimeHelpful?: string;
  fragmentTimeNotHelpfulReason?: string;
  willRecommend?: string;
  notRecommendReason?: string;
  openFeedback?: string;
}

export function sanitizeFeedbackContent(content: FeedbackContent): FeedbackContent {
  return {
    ...content,
    occupation: content.occupation ? sanitizeText(content.occupation) : undefined,
    learningPurpose: content.learningPurpose?.map(p => sanitizeText(p)),
    fragmentTimeHelpful: content.fragmentTimeHelpful ? sanitizeText(content.fragmentTimeHelpful) : undefined,
    fragmentTimeNotHelpfulReason: content.fragmentTimeNotHelpfulReason
      ? sanitizeText(content.fragmentTimeNotHelpfulReason)
      : undefined,
    willRecommend: content.willRecommend ? sanitizeText(content.willRecommend) : undefined,
    notRecommendReason: content.notRecommendReason
      ? sanitizeText(content.notRecommendReason)
      : undefined,
    openFeedback: content.openFeedback ? sanitizeText(content.openFeedback) : undefined,
  };
}
```

#### 3.2 Update Feedback API Route

**File:** `src/app/api/feedback/route.ts`

```typescript
import { sanitizeFeedbackContent } from '@/lib/utils/sanitize';
// ... other imports

export async function POST(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { content } = await req.json();

    // ... existing validation ...

    // Sanitize content before storing
    const sanitizedContent = sanitizeFeedbackContent(content);

    const { error } = await supabase
      .from("feedback")
      .insert({
        user_id: user?.id || null,
        content: sanitizedContent, // Use sanitized content
      });

    // ... rest of handler
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Estimated Time:** 2-3 hours

---

## Testing Strategy

**Unit Tests:**
- CORS origin validation
- Sanitization functions

**Integration Tests:**
- CORS headers in responses
- Sanitization in feedback flow

**Estimated Time:** 2-3 hours

## Success Criteria

1. ✅ CORS restricted to configured origins only
2. ✅ All user-generated content sanitized before storage
3. ✅ Tests passing for security utilities
4. ✅ Netlify rate limiting configured via platform features

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: CORS Restriction | 1-2 hours | None |
| Phase 2: Input Sanitization | 2-3 hours | None |
| Testing | 1-2 hours | All phases |
| **Total** | **4-7 hours** | ~1 day |

---

## Environment Variables Required

```env
# CORS Configuration (for middleware proxy)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Netlify URL (optional, for production CORS fallback)
NETLIFY_URL=https://your-site.netlify.app
```

---

## Dependencies

**None required** - All dependencies already exist:
- ✅ `dompurify` - Already installed
- ✅ `jsdom` - Already installed (for server-side DOMPurify)

---

**Plan Created:** 2025-01-03

