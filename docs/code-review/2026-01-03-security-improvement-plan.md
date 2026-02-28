# Security by Design Improvement Plan (Simplified for Netlify + Supabase)

**Date:** 2026-01-03  
**Status:** Completed  
**Priority:** High  
**Estimated Effort:** 0.5 day  

> **Note:** Deployment has since changed to own server + PM2 (see [deploy.md](../../deploy.md)). CORS and rate limiting are configured per environment.

## Executive Summary

This plan leverages platform features to address security vulnerabilities with minimal complexity:
1. **Input Sanitization** - Use existing `dompurify` library

**Key Simplifications:**
- ✅ No external dependencies needed
- ✅ Netlify handles CORS and rate limiting automatically
- ✅ Supabase provides built-in rate limiting

---

## Current State Analysis

### Security Issues Identified & Resolution Status

#### Input Sanitization ✅ **RESOLVED**
- **Location:** `src/app/api/feedback/route.ts`, `src/app/feedback/page.tsx`
- **Issue:** User-generated content stored without HTML sanitization
- **Risk:** XSS attacks, stored malicious scripts
- **Resolution:**
  - ✅ Implemented `dompurify` based sanitization utility (`src/lib/utils/sanitize.ts`)
  - ✅ Applied sanitization in `api/feedback` route before storage
  - ✅ Added unit tests for sanitization logic

---

## Implementation Plan

### Phase 1: Input Sanitization

**Goal:** Sanitize all user-generated content before storage

#### 1.1 Create Sanitization Utility

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

#### 1.2 Update Feedback API Route

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
- Sanitization functions

**Integration Tests:**
- Sanitization in feedback flow

**Estimated Time:** 1-2 hours

## Success Criteria

1. ✅ All user-generated content sanitized before storage
2. ✅ Tests passing for sanitization utilities
3. ✅ Netlify CORS and rate limiting configured via platform features

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Input Sanitization | 2-3 hours | None |
| Testing | 1-2 hours | Phase 1 |
| **Total** | **3-5 hours** | ~0.5 day |

---

## Environment Variables Required

**None** - All security handled by Netlify platform features.

---

## Dependencies

**None required** - All dependencies already exist:
- ✅ `dompurify` - Already installed
- ✅ `jsdom` - Already installed (for server-side DOMPurify)

---

**Plan Created:** 2026-01-03

