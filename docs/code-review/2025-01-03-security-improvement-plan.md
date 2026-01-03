# Security by Design Improvement Plan (Simplified for Netlify + Supabase)

**Date:** 2025-01-03  
**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 1-2 days (Simplified)

## Executive Summary

This plan leverages Netlify and Supabase platform features to address security vulnerabilities with minimal complexity:
1. **CORS Policy** - Restrict middleware proxy only (Netlify handles API routes automatically)
2. **Rate Limiting** - Simple in-memory limiter for Next.js API routes (Supabase already rate-limits their API)
3. **Input Sanitization** - Use existing `dompurify` library

**Key Simplifications:**
- ✅ No external dependencies needed
- ✅ Netlify handles API route CORS automatically
- ✅ Supabase provides built-in rate limiting
- ✅ Lightweight in-memory rate limiter sufficient for Next.js routes

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

#### 2. Rate Limiting ⚠️ **HIGH**
- **Issue:** No rate limiting on Next.js API endpoints (Supabase API already has rate limiting)
- **Risk:** API abuse, DDoS attacks, brute force attempts
- **Affected Routes:**
  - `/api/auth/send-otp` - Vulnerable to email spam (Supabase handles this, but we can add app-level)
  - `/api/feedback` - Vulnerable to spam submissions
  - `/api/cards/[id]/review` - Vulnerable to abuse
  - `/api/knowledge` (POST) - Vulnerable to bulk imports
- **Note:** 
  - Supabase already provides rate limiting on their API endpoints
  - We only need to add rate limiting for Next.js API routes
  - Can use simple in-memory solution (Netlify functions are stateless, but sufficient for per-request limits)

#### 3. Input Sanitization ⚠️ **MEDIUM**
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
import { getCorsHeaders, handleCorsPreflight } from '@/lib/utils/cors'

export async function proxy(req: NextRequest) {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    const preflightResponse = handleCorsPreflight(req);
    if (preflightResponse) return preflightResponse;
    return new NextResponse(null, { status: 403 });
  }

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

### Phase 2: Rate Limiting Implementation

**Goal:** Add rate limiting for Next.js API routes (Supabase already rate-limits their API)

#### 2.1 Create In-Memory Rate Limiter

**File:** `src/lib/utils/rateLimit.ts`

```typescript
import { NextRequest } from 'next/server';
import { ApiError } from './apiErrorClasses';

interface RateLimitConfig {
  limit: number;
  windowMs: number; // Time window in milliseconds
}

// Rate limit configurations per endpoint type
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  feedback: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 requests per hour
  cardReview: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  knowledgeImport: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 imports per hour
  general: { limit: 60, windowMs: 60 * 1000 }, // 60 requests per minute
};

// Simple in-memory store (clears on serverless function restart, which is fine)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getRateLimitIdentifier(req: NextRequest, userId?: string): string {
  // Prefer user ID if available (more accurate)
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address (Netlify provides x-forwarded-for)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 */
export async function rateLimit(
  req: NextRequest,
  limiterType: keyof typeof rateLimitConfigs,
  userId?: string
): Promise<void> {
  const config = rateLimitConfigs[limiterType];
  const identifier = getRateLimitIdentifier(req, userId);
  const key = `${limiterType}:${identifier}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  // Check if window has expired or doesn't exist
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return; // Allow request
  }
  
  // Check if limit exceeded
  if (record.count >= config.limit) {
    const resetTime = new Date(record.resetAt).toISOString();
    throw ApiError.validationError(
      `Rate limit exceeded. Please try again after ${resetTime}`
    );
  }
  
  // Increment count
  record.count++;
}

/**
 * Clean up old entries periodically (optional, for memory management)
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes (only runs when function is warm)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
```

#### 2.2 Update API Routes

**Add rate limiting to these routes:**

- `src/app/api/auth/send-otp/route.ts` - Use `'auth'` limiter
- `src/app/api/feedback/route.ts` - Use `'feedback'` limiter with `user?.id`
- `src/app/api/cards/[id]/review/route.ts` - Use `'cardReview'` limiter with `user.id`
- `src/app/api/knowledge/route.ts` (POST) - Use `'knowledgeImport'` limiter with `user.id`

**Example:**
```typescript
import { rateLimit } from '@/lib/utils/rateLimit';

export async function POST(req: NextRequest) {
  try {
    await rateLimit(req, 'feedback', user?.id);
    // ... rest of handler
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Estimated Time:** 2-3 hours

---

### Phase 3: Input Sanitization

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
- Rate limiting logic
- Sanitization functions

**Integration Tests:**
- CORS headers in responses
- Rate limiting behavior
- Sanitization in feedback flow

**Estimated Time:** 2-3 hours

## Success Criteria

1. ✅ CORS restricted to configured origins only
2. ✅ Rate limiting active on Next.js API endpoints
3. ✅ All user-generated content sanitized before storage
4. ✅ Tests passing for security utilities

---

## Timeline (Simplified)

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: CORS Restriction | 1-2 hours | None |
| Phase 2: Rate Limiting | 2-3 hours | None |
| Phase 3: Input Sanitization | 2-3 hours | None |
| Testing | 2-3 hours | All phases |
| **Total** | **7-11 hours** | ~1-2 days |

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

