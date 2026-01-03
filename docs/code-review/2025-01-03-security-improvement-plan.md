# Security by Design Improvement Plan (Simplified for Netlify + Supabase)

**Date:** 2025-01-03  
**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 1-2 days (Simplified)

## Executive Summary

This **simplified** plan leverages Netlify and Supabase platform features to address security vulnerabilities with minimal complexity:
1. **CORS Policy** - Simplified restriction using environment variables
2. **Rate Limiting** - Leverage Supabase's built-in rate limiting + simple in-memory limiter for Next.js API routes
3. **Input Sanitization** - Use existing `dompurify` library

**Key Simplifications:**
- ✅ No external dependencies (Upstash) needed - use Supabase rate limiting
- ✅ Simpler CORS handling - Netlify handles most CORS automatically
- ✅ Lightweight in-memory rate limiter for Next.js routes (sufficient for most use cases)

---

## Why This Plan is Simpler

### Platform Advantages

1. **Netlify:**
   - ✅ Handles CORS automatically for API routes
   - ✅ Provides `x-forwarded-for` header for IP-based rate limiting
   - ✅ Serverless functions are stateless (in-memory rate limiting resets per invocation, which is acceptable)

2. **Supabase:**
   - ✅ Built-in rate limiting on all API endpoints
   - ✅ Row Level Security (RLS) provides additional protection
   - ✅ Auth endpoints already rate-limited by Supabase

### Simplifications Made

- ❌ **Removed:** Upstash Redis dependency (not needed)
- ❌ **Removed:** Complex CORS handling for API routes (Netlify handles it)
- ✅ **Simplified:** In-memory rate limiter (sufficient for Next.js API routes)
- ✅ **Simplified:** CORS only needed for middleware proxy
- ✅ **Kept:** Input sanitization (still critical)

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

## Target Architecture

### Security Layers

```
Request → CORS Check → Rate Limiter → Input Validation → Sanitization → Business Logic → Database
```

### Benefits

1. **Defense in Depth**: Multiple security layers
2. **Attack Prevention**: Proactive protection against common attacks
3. **Compliance**: Better alignment with security best practices
4. **Monitoring**: Foundation for security event logging

---

## Implementation Plan

### Phase 1: CORS Policy Restriction (Simplified)

**Goal:** Restrict CORS in middleware only (Netlify handles API route CORS automatically)

**Note:** Since you're using Netlify, CORS for Next.js API routes is handled automatically. We only need to fix the middleware proxy.

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

#### 1.4 Add CORS to API Routes

**File:** `src/lib/utils/apiError.ts` (or create middleware utility)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders, handleCorsPreflight } from './cors';

/**
 * Wrapper for API route handlers that adds CORS support
 */
export function withCors<T>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      const preflightResponse = handleCorsPreflight(req);
      if (preflightResponse) return preflightResponse;
      return new NextResponse(null, { status: 403 });
    }

    const response = await handler(req, context);
    
    // Add CORS headers to response
    const corsHeaders = getCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
```

**Estimated Time:** 1-2 hours

---

### Phase 2: Rate Limiting Implementation (Simplified)

**Goal:** Simple rate limiting for Next.js API routes (Supabase already handles their API)

**Note:** Supabase has built-in rate limiting on their API endpoints. We only need to add rate limiting for Next.js API routes.

#### 2.1 Create Simple In-Memory Rate Limiter

**No external dependencies needed!** We'll use a simple in-memory solution that's sufficient for most use cases.

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

#### 2.5 Update API Routes

**File:** `src/app/api/auth/send-otp/route.ts`

```typescript
import { rateLimit } from '@/lib/utils/rateLimit';
// ... other imports

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    await rateLimit(req, 'auth');

    const { email } = await req.json();
    // ... rest of handler
  } catch (error) {
    return handleApiError(error);
  }
}
```

**File:** `src/app/api/feedback/route.ts`

```typescript
import { rateLimit } from '@/lib/utils/rateLimit';
// ... other imports

export async function POST(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Apply rate limiting (use user ID if available)
    await rateLimit(req, 'feedback', user?.id);

    const { content } = await req.json();
    // ... rest of handler
  } catch (error) {
    return handleApiError(error);
  }
}
```

**File:** `src/app/api/cards/[id]/review/route.ts`

```typescript
import { rateLimit } from '@/lib/utils/rateLimit';
// ... other imports

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw ApiError.unauthorized('未登录');
    }

    // Apply rate limiting
    await rateLimit(request, 'cardReview', user.id);

    const { quality } = await request.json();
    // ... rest of handler
  } catch (error) {
    return handleApiError(error);
  }
}
```

**File:** `src/app/api/knowledge/route.ts` (POST method)

```typescript
import { rateLimit } from '@/lib/utils/rateLimit';
// ... other imports

export async function POST(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.app_metadata?.role !== 'operator') {
      throw ApiError.forbidden('权限不足');
    }

    // Apply rate limiting for imports
    await rateLimit(req, 'knowledgeImport', user.id);

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

#### 3.3 Update Knowledge Import (if needed)

**File:** `src/lib/services/knowledgeService.ts` (if knowledge items contain user input)

```typescript
import { sanitizeText } from '@/lib/utils/sanitize';

// In importKnowledge method, sanitize name and description
const validItems = items
  .map((item) => {
    if (!item || typeof item !== 'object' || !item.name) return null;
    
    return {
      name: sanitizeText(item.name.trim()),
      description: item.description ? sanitizeText(item.description.trim()) : "",
      metadata: item.metadata || {},
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null && item.name.length > 0);
```

**Estimated Time:** 3-4 hours

---

## Testing Strategy

### Unit Tests

**File:** `src/lib/utils/cors.test.ts`

```typescript
import { getCorsHeaders, isOriginAllowed } from './cors';
import { NextRequest } from 'next/server';

describe('CORS', () => {
  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://example.com';
  });

  it('should allow configured origins', () => {
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('https://example.com')).toBe(true);
  });

  it('should reject unconfigured origins', () => {
    expect(isOriginAllowed('https://evil.com')).toBe(false);
  });
});
```

**File:** `src/lib/utils/rateLimit.test.ts`

```typescript
import { rateLimit } from './rateLimit';
import { NextRequest } from 'next/server';

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const req = new NextRequest('http://localhost/api/test');
    // Mock rate limiter
    // Test implementation
  });

  it('should reject requests exceeding limit', async () => {
    // Test rate limit exceeded scenario
  });
});
```

**File:** `src/lib/utils/sanitize.test.ts`

```typescript
import { sanitizeText, sanitizeHtml } from './sanitize';

describe('Sanitization', () => {
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeText(input)).toBe('Hello World');
  });

  it('should preserve plain text', () => {
    const input = 'Hello World';
    expect(sanitizeText(input)).toBe('Hello World');
  });
});
```

### Integration Tests

- Test CORS headers in API responses
- Test rate limiting behavior
- Test sanitization in feedback submission flow

**Estimated Time:** 4-6 hours

---

## Migration Strategy

### Approach: Incremental Rollout

1. **Week 1: CORS & Sanitization**
   - Implement CORS restrictions
   - Add input sanitization
   - Test thoroughly
   - Deploy to production

2. **Week 2: Rate Limiting**
   - Implement rate limiting
   - Start with permissive limits
   - Monitor and adjust
   - Gradually tighten limits

### Backward Compatibility

- CORS: May break if clients use different origins (document required)
- Rate Limiting: May temporarily block legitimate users (monitor closely)
- Sanitization: Should be transparent to users

---

## Risk Assessment

### Low Risk
- Input sanitization (additive, no breaking changes)
- CORS configuration (environment-based)

### Medium Risk
- Rate limiting (may affect legitimate users if misconfigured)
- CORS restrictions (may break existing integrations)

### Mitigation
- Start with permissive rate limits
- Monitor error rates and adjust
- Document CORS requirements
- Provide fallback mechanisms

---

## Success Criteria

1. ✅ CORS restricted to configured origins only
2. ✅ Rate limiting active on all API endpoints
3. ✅ All user-generated content sanitized before storage
4. ✅ No XSS vulnerabilities in stored content
5. ✅ API abuse protection in place
6. ✅ Tests passing with >80% coverage for security utilities

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

## Dependencies to Add

**None!** All dependencies already exist:
- ✅ `dompurify` - Already installed
- ✅ `jsdom` - Already installed (for server-side DOMPurify)
- ✅ No external rate limiting service needed (using simple in-memory solution)

**Benefits of Simplified Approach:**
- 🎯 No external services to manage
- 💰 No additional costs
- ⚡ Faster implementation
- 🔧 Easier to maintain
- ✅ Leverages Supabase's built-in rate limiting

---

## Next Steps

1. **Review and Approve Plan** - Get team buy-in
2. **Create Feature Branch** - `security/cors-rate-limit-sanitization`
3. **Start with Phase 1** - CORS restrictions (lowest risk)
4. **Incremental PRs** - Small, reviewable changes
5. **Monitor** - Watch for regressions and false positives

---

**Plan Created:** 2025-01-03  
**Next Review:** After Phase 1 completion

