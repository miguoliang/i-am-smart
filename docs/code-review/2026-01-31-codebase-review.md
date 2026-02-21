# Codebase Review — 2026-01-31

## Overview

Comprehensive review of the 聪明的背单词工具 codebase covering architecture, TypeScript usage, code quality, testing, security, accessibility, and error handling.

**Overall assessment:** Excellent (8.5/10). Production-ready with strong engineering practices.

---

## Strengths

### Architecture & Design Patterns

- **Repository pattern:** Clear separation between data access (`SupabaseCardRepository`) and business logic (`CardService`).
- **Layering:** Services → repositories → API routes → UI components.
- **Dependency injection:** Service factory pattern used for testability.
- **SOLID:** Single Responsibility Principle applied consistently (e.g. `useLearnSession` composing smaller hooks).

### TypeScript

- **Strict mode:** `strict: true` in `tsconfig.json`.
- **Limited `any`:** Only in Storybook files (explicitly allowed in ESLint).
- **Interfaces:** Used for public contracts and types.
- **Type guards:** Validation in repositories (e.g. `supabase-card.repository.ts`) before casting.

### Code Quality

- **No raw console:** ESLint enforces use of `logger` utility.
- **Logger:** Centralized in `src/lib/utils/logger.ts` with levels.
- **Error handling:** Custom `ApiError` classes and repository error handling.
- **Input validation:** Strong validation in `validateFeedbackContent` and API boundaries.

### Testing

- **Coverage:** 14 test files for hooks, services, and utilities.
- **Setup:** Jest with Testing Library and jest-axe for accessibility.
- **Unit tests:** Services (cardService, accountService, statsService), hooks (useCountdown, useDebounce, useCards, useSpeech, useCardNavigation), and utils (apiError, dateUtils, sanitize, emailValidation).

### React & Next.js

- **Server/client:** Correct use of `'use client'` where needed.
- **Hooks:** Small, focused hooks composed in `useLearnSession`.
- **React Query:** Sensible defaults (staleTime, refetchOnWindowFocus).
- **Auth flow:** `requireAuth` / `requireOperator` in API routes; auth state in providers.

### Security

- **Auth middleware:** `requireAuth` and `requireOperator` for protected routes.
- **Env:** `.env*` in `.gitignore`; no secrets in repo.
- **Input:** Validation and DOMPurify available.
- **Auth:** PKCE flow in Supabase client config.

### Accessibility

- **ARIA:** FlipCard uses `aria-label` and keyboard handlers.
- **Skip link:** Present in root layout.
- **Storybook:** Addon a11y for component checks.

---

## Areas for Improvement

### 1. Error handling in API client (medium) ✅ **COMPLETED**

**Location:** `src/lib/api/cards.ts` — `reviewCard` and similar fetch wrappers.

**Issue:** Generic `throw new Error("Failed to review card")` discards API error details.

**Resolution:**
- Added `parseApiErrorResponse(response, defaultMessage)` helper in `src/lib/utils/apiError.ts`
- Updated all API client files: `cards.ts`, `knowledge.ts`, `accounts.ts`, `feedback.ts`, `import.ts`
- Helper safely parses JSON body once, extracts `error.message`, and falls back to default
- Preserves special handling for 401/403 status codes

### 2. Magic numbers in SM-2 (low) ✅ **COMPLETED**

**Location:** `src/lib/services/cardService.ts`.

**Issue:** SM-2 constants (1, 6, 3, 1.3, 0.1, 0.08, 0.02) are inline.

**Resolution:**
- Created `SM2_ALGORITHM` constant object in `src/lib/constants.ts`
- Extracted all magic numbers with descriptive names:
  - `DEFAULT_EASE_FACTOR: 2.5`
  - `FIRST_INTERVAL: 1`, `SECOND_INTERVAL: 6`
  - `QUALITY_THRESHOLD: 3`
  - `MIN_EASE_FACTOR: 1.3`
  - `EASE_ADJUSTMENT_BASE: 0.1`, `EASE_ADJUSTMENT_FACTOR: 0.08`, `EASE_ADJUSTMENT_PENALTY: 0.02`
  - `MAX_QUALITY: 5`
- Added JSDoc with Wikipedia link to constant definition
- Updated `cardService.ts` to use constants throughout the SM-2 algorithm

### 3. Documentation (low) ✅ **COMPLETED**

**Issue:** Complex logic (e.g. SM-2) has little inline documentation.

**Resolution:**
- Added comprehensive JSDoc to `CardService` class and all methods
- `reviewCard` method now includes:
  - Full algorithm description (SM-2 spaced repetition)
  - `@see` link to Wikipedia SM-2 algorithm
  - Detailed `@param` docs for all parameters (userId, cardId, quality 0-5, timezoneOffset)
  - `@returns` and `@throws` documentation
- Added inline JSDoc for SM-2 computation block
- `getReviewedTodayCount` and `getDueCards` have descriptive JSDoc

### 4. Type assertions in repositories (medium) ✅ **COMPLETED**

**Location:** `src/lib/repositories/implementations/supabase-card.repository.ts`.

**Issue:** Multiple `as number`, `as string`, etc. after manual checks; no runtime schema.

**Resolution:**
- Created `src/lib/repositories/schemas/card.schema.ts` with Zod schemas:
  - `KnowledgeMetadataSchema`: `z.record(z.string(), z.unknown())`
  - `KnowledgeSchema`: validates code, name, description, metadata
  - `CardRowSchema`: validates complete card structure from Supabase
- Updated `SupabaseCardRepository`:
  - `getDueCards`: validates each row with `safeParse`, throws with field-level error details
  - `getCardById`: validates single row with `safeParse`, throws with validation details
- Removed all manual type guards and `as` casts
- Better error messages showing exact validation failures (e.g., "index 2: knowledge.code: Expected string, received number")

### 5. useCountdown — onComplete dependency (low) ✅ **COMPLETED**

**Location:** `src/app/hooks/useCountdown.ts`.

**Issue:** `onComplete` in `useEffect` deps can cause effect re-runs and stale closure concerns.

**Resolution:**
- Added `onCompleteRef = useRef(onComplete)` to store the callback
- Added separate effect to sync `onCompleteRef.current = onComplete` whenever `onComplete` changes
- Removed `onComplete` from main effect dependencies (now only `[isActive, seconds]`)
- Call `onCompleteRef.current()` in the interval callback instead of `onComplete()`
- Prevents effect from re-running when callback changes and avoids stale closures

### 6. Integration tests for critical flows (low) ✅ **COMPLETED**

**Issue:** No integration tests covering critical user flows (API route + service, learn flow).

**Resolution:**
- **API route integration tests** (run with `@jest-environment node`):
  - `src/app/api/cards/due/route.integration.test.ts`: GET /api/cards/due with mocked requireAuth and createCardService; asserts 200 + data shape, 401 on auth error, 400 on invalid level.
  - `src/app/api/cards/[id]/review/route.integration.test.ts`: POST /api/cards/[id]/review with mocked auth and CardService; asserts 200 + nextReview, 401 on auth error, 400 on invalid quality or card id.
- **Learn flow integration test** (jsdom, mocked API client to avoid loading next/server):
  - `src/app/learn/learn-flow.integration.test.tsx`: Renders Learn page with QueryClient + ThemeProvider; mocks fetchDueCards and reviewCard; asserts load due cards → display first card, flip → rating buttons visible, rate card → reviewCard(1, 5) called.

**Tests:** 17 suites, 134 tests (11 new integration tests). All passing.

### 7. Providers effect deps (low)

**Location:** `src/app/providers.tsx`.

**Issue:** `pathname` in effect dependency array causes auth subscription to be re-created on route change.

**Recommendation:** Only change if this causes measurable issues; otherwise document. If needed, use a ref for pathname or restructure so subscription is stable.

---

## Metrics Summary

| Aspect           | Rating   | Notes                                      |
|-----------------|----------|--------------------------------------------|
| Architecture    | ⭐⭐⭐⭐⭐ | Repository pattern, clear layering         |
| Type safety     | ⭐⭐⭐⭐⭐ | Strict TS, minimal `any`                   |
| Code quality    | ⭐⭐⭐⭐⭐ | Clean, maintainable, principles followed   |
| Testing         | ⭐⭐⭐⭐⭐ | Unit + integration tests for critical flows |
| Security        | ⭐⭐⭐⭐⭐ | Auth, validation, env handling             |
| Accessibility   | ⭐⭐⭐⭐   | Skip link, ARIA, keyboard, Storybook a11y  |
| Error handling  | ⭐⭐⭐⭐⭐ | Consistent error parsing across all API clients |
| Documentation   | ⭐⭐⭐⭐   | JSDoc added for complex logic; room for more |

---

## Priority Actions

| Priority  | Action | Status |
|----------|--------|--------|
| High     | None — codebase is production-ready. | N/A |
| Medium   | ~~Improve API client error parsing~~ | ✅ Done |
| Medium   | ~~Consider Zod in repositories~~ | ✅ Done |
| Medium   | ~~Add JSDoc for SM-2 and complex logic~~ | ✅ Done |
| Low      | ~~Extract SM-2 constants~~ | ✅ Done |
| Low      | ~~Fix useCountdown callback ref~~ | ✅ Done |
| Low      | ~~Add integration tests for critical flows~~ | ✅ Done |

---

## Notable Practices

1. Centralized logger with ESLint enforcement.
2. i18n structure for translations.
3. PWA/Serwist for offline support.
4. Husky pre-commit hooks.
5. Storybook for components and a11y.
6. Repository error-handling abstraction.
7. Service factory for testable instantiation.
8. Custom hooks composition (`useLearnSession`).
9. Timezone offset handled in card review flow.
10. User-facing rate-limit messages (e.g. `formatRateLimitWaitTime`).

---

## Files Reviewed (Sample)

- `src/lib/utils.ts` — cn, urlBase64ToUint8Array
- `src/lib/supabaseClient.ts`, `src/lib/supabaseServer.ts`
- `src/lib/services/cardService.ts`
- `src/lib/repositories/implementations/supabase-card.repository.ts`
- `src/lib/repositories/utils/error-handling.ts`
- `src/lib/validation/feedback.ts`
- `src/lib/utils/logger.ts`, `src/lib/utils/errorHandling.ts`, `src/lib/utils/apiError.ts`
- `src/app/layout.tsx`, `src/app/providers.tsx`
- `src/app/learn/page.tsx`, `src/app/learn/hooks/useLearnSession.ts`
- `src/app/api/cards/due/route.ts`
- `src/lib/api/cards.ts`, `src/lib/api/knowledge.ts`, `src/lib/api/accounts.ts`, `src/lib/api/feedback.ts`, `src/lib/api/import.ts`
- `src/lib/middleware/auth.ts`
- `src/components/form/Button.tsx`, `src/components/container/FlipCard.tsx`
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`

## Files Modified/Created

**Created:**
- `src/lib/repositories/schemas/card.schema.ts` — Zod schemas for Card validation

**Modified:**
- `src/lib/utils/apiError.ts` — Added `parseApiErrorResponse` helper
- `src/lib/api/cards.ts` — Uses parseApiErrorResponse for better error messages
- `src/lib/api/knowledge.ts` — Uses parseApiErrorResponse for better error messages
- `src/lib/api/accounts.ts` — Uses parseApiErrorResponse for consistency
- `src/lib/api/feedback.ts` — Uses parseApiErrorResponse for consistency
- `src/lib/api/import.ts` — Type-safe error extraction from already-parsed body
- `src/lib/repositories/implementations/supabase-card.repository.ts` — Zod validation with detailed errors
- `src/lib/services/cardService.ts` — Comprehensive JSDoc for SM-2 algorithm + uses SM2_ALGORITHM constants
- `src/lib/constants.ts` — Added SM2_ALGORITHM constant object with all magic numbers
- `src/app/hooks/useCountdown.ts` — Fixed onComplete stale closure with useRef pattern
- Integration tests added: `src/app/api/cards/due/route.integration.test.ts`, `src/app/api/cards/[id]/review/route.integration.test.ts`, `src/app/learn/learn-flow.integration.test.tsx`

**Tests:** 17 suites, 134 tests (including 11 new integration tests). All passing.
