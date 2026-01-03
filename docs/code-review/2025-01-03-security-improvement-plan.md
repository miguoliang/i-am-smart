# Security by Design Improvement Plan

**Date:** 2025-01-03  
**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 2-3 days

## Executive Summary

This plan addresses critical security vulnerabilities identified in the code review, focusing on three main areas:
1. **CORS Policy** - Currently permissive (`'*'`) needs restriction
2. **Rate Limiting** - No protection against API abuse
3. **Input Sanitization** - User-generated content not sanitized before storage

These improvements will significantly enhance the application's security posture and protect against common attack vectors.

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
- **Issue:** No rate limiting on API endpoints
- **Risk:** API abuse, DDoS attacks, brute force attempts
- **Affected Routes:**
  - `/api/auth/send-otp` - Vulnerable to email spam
  - `/api/feedback` - Vulnerable to spam submissions
  - `/api/cards/[id]/review` - Vulnerable to abuse
  - `/api/knowledge` (POST) - Vulnerable to bulk imports
- **Note:** Some Supabase rate limit handling exists in `send-otp` route, but no application-level protection

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

### Phase 1: CORS Policy Restriction

**Goal:** Restrict CORS to specific allowed origins

#### 1.1 Add Environment Variables

**File:** `.env.local.example` (create if doesn't exist)

```env
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**File:** `.env.local`

```env
# Add to existing environment variables
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

#### 1.2 Create CORS Utility

**File:** `src/lib/utils/cors.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get allowed origins from environment variable
 * Falls back to single origin or empty array if not configured
 */
function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) {
    // In production, this should be configured
    if (process.env.NODE_ENV === 'production') {
      console.warn('ALLOWED_ORIGINS not configured in production');
      return [];
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
 * Get CORS headers for a request
 */
export function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // If no origin header, don't set CORS headers
  if (!origin) {
    return {};
  }

  // Check if origin is allowed
  if (isOriginAllowed(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // Origin not allowed - return empty headers (will be rejected)
  return {};
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPreflight(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  const headers = getCorsHeaders(req);
  return new NextResponse(null, {
    status: 200,
    headers,
  });
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

**Estimated Time:** 3-4 hours

---

### Phase 2: Rate Limiting Implementation

**Goal:** Implement rate limiting for all API endpoints

#### 2.1 Choose Rate Limiting Solution

**Options:**
1. **Upstash Rate Limit** (Recommended for serverless)
   - Serverless-friendly
   - Redis-backed
   - Free tier available
   - Package: `@upstash/ratelimit` + `@upstash/redis`

2. **Rate Limiter Flexible** (Alternative)
   - More features
   - Multiple storage backends
   - Package: `rate-limiter-flexible`

**Decision:** Use Upstash Rate Limit for simplicity and serverless compatibility

#### 2.2 Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

#### 2.3 Configure Upstash (Optional - Can use in-memory for dev)

**Environment Variables:**

```env
# Upstash Redis (optional - for production)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

#### 2.4 Create Rate Limiter Utility

**File:** `src/lib/utils/rateLimit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { ApiError } from './apiErrorClasses';

// Initialize Redis client (falls back to in-memory if not configured)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// In-memory rate limiter for development
class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  async limit(key: string, limit: number, window: number): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      // Reset window
      this.store.set(key, { count: 1, resetAt: now + window });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + window,
      };
    }

    if (record.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: record.resetAt,
      };
    }

    record.count++;
    return {
      success: true,
      limit,
      remaining: limit - record.count,
      reset: record.resetAt,
    };
  }
}

// Rate limiters for different endpoints
const rateLimiters = {
  // Auth endpoints - stricter limits
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
        analytics: true,
      })
    : new MemoryRateLimiter(),

  // Feedback endpoint
  feedback: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
        analytics: true,
      })
    : new MemoryRateLimiter(),

  // Card review endpoint
  cardReview: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
        analytics: true,
      })
    : new MemoryRateLimiter(),

  // Knowledge import (operator only)
  knowledgeImport: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 imports per hour
        analytics: true,
      })
    : new MemoryRateLimiter(),

  // General API endpoints
  general: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
        analytics: true,
      })
    : new MemoryRateLimiter(),
};

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getRateLimitIdentifier(req: NextRequest, userId?: string): string {
  // Prefer user ID if available (more accurate)
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 */
export async function rateLimit(
  req: NextRequest,
  limiter: 'auth' | 'feedback' | 'cardReview' | 'knowledgeImport' | 'general',
  userId?: string
): Promise<void> {
  const identifier = getRateLimitIdentifier(req, userId);
  const result = await rateLimiters[limiter].limit(identifier);

  if (!result.success) {
    const resetTime = new Date(result.reset).toISOString();
    throw ApiError.validationError(
      `Rate limit exceeded. Please try again after ${resetTime}`
    );
  }
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit<T>(
  limiter: 'auth' | 'feedback' | 'cardReview' | 'knowledgeImport' | 'general',
  handler: (req: NextRequest, context?: T) => Promise<Response>
) {
  return async (req: NextRequest, context?: T): Promise<Response> => {
    // Extract user ID from context if available
    const userId = (context as { userId?: string })?.userId;
    await rateLimit(req, limiter, userId);
    return handler(req, context);
  };
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

**Estimated Time:** 6-8 hours

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

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: CORS Restriction | 3-4 hours | None |
| Phase 2: Rate Limiting | 6-8 hours | Phase 1 (optional) |
| Phase 3: Input Sanitization | 3-4 hours | None |
| Testing | 4-6 hours | All phases |
| **Total** | **16-22 hours** | ~2-3 days |

---

## Environment Variables Required

```env
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting (Optional - uses in-memory fallback if not set)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@upstash/ratelimit": "^2.0.0",
    "@upstash/redis": "^1.0.0"
  }
}
```

**Note:** `dompurify` and `jsdom` are already in dependencies.

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

