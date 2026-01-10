# Test Coverage Baseline Analysis

**Date:** 2026-01-10
**Test Suite:** All tests
**Command:** `npm test -- --coverage`

## Overall Coverage Summary

| Metric | Coverage | Target | Status |
|--------|----------|--------|--------|
| **Statements** | 83.88% (1150/1371) | >85% | ⚠️ Close |
| **Branches** | 78.1% (107/137) | >80% | ⚠️ Below target |
| **Functions** | 57.89% (33/57) | >85% | ❌ Needs work |
| **Lines** | 83.88% (1150/1371) | >85% | ⚠️ Close |

## Coverage by Module

### ✅ Well Covered (>90%)
- `lib/services/statsService.ts` - 100%
- `lib/utils/sanitize.ts` - 100%
- `lib/utils/apiError.ts` - 100%
- `app/learn/hooks/useSpeech.ts` - 100%
- `components/ui/*` - 100%

### ⚠️ Needs Improvement (70-90%)
- `lib/services/cardService.ts` - 94.69%
- `lib/services/accountService.ts` - 74.03%
- `app/learn/hooks/useCards.ts` - 83.33%
- `app/learn/hooks/useCardNavigation.ts` - 87.75%
- `lib/utils/dateUtils.ts` - 93.22%
- `lib/utils/apiErrorClasses.ts` - 91.3%

### ❌ Critical Gaps (<70%)
- `app/learn/hooks/useDueCardsQuery.ts` - 32.43%
- `app/learn/hooks/useLevel.ts` - 27.27%
- `lib/api/cards.ts` - 38.09%
- `lib/utils/errorUtils.ts` - 48.78%
- `lib/utils/logger.ts` - 76.27%

## Priority Areas for Improvement

### High Priority (Critical Functionality)
1. **useCards Hook** - 83.33%
   - Missing: Edge cases, level change scenarios
   - Tests created but failing (5 tests)

2. **useDueCardsQuery Hook** - 32.43%
   - Missing: Error handling, router navigation
   - No tests exist

3. **useLevel Hook** - 27.27%
   - Missing: LocalStorage handling, level validation
   - No tests exist

4. **accountService** - 74.03%
   - Missing: Daily review count aggregation
   - Some tests exist but incomplete

### Medium Priority
1. **PWAUpdater Component** - Not in coverage (new component)
   - Tests created but failing (window.location mocking)

2. **errorUtils** - 48.78%
   - Missing: Error message extraction logic
   - No tests exist

3. **lib/api/cards.ts** - 38.09%
   - Missing: API client functions
   - No tests exist

### Low Priority (Good Coverage)
- Most utility functions (>90%)
- Service layer mostly covered
- UI components well tested

## Test Status

**Current Test Results:**
- ✅ 9 test suites passing
- ❌ 2 test suites failing
- ✅ 49 tests passing
- ❌ 5 tests failing

**Failing Tests:**
1. `useCards.test.ts` - 5 tests failing (mock issues)
2. `PWAUpdater.test.tsx` - All tests failing (window.location mocking)

## Quick Wins (Easy to Test, High Impact)

1. **useDebounce Hook** - No tests
   - Simple hook, easy to test
   - Estimated: 30 minutes
   - Impact: +1 function coverage

2. **useCountdown Hook** - No tests
   - Straightforward logic
   - Estimated: 1 hour
   - Impact: +1 function coverage

3. **useLevel Hook** - 27.27% coverage
   - Critical for app functionality
   - Estimated: 2 hours
   - Impact: Significant improvement

4. **useDueCardsQuery Hook** - 32.43% coverage
   - Important data fetching logic
   - Estimated: 3 hours
   - Impact: Major improvement

## Recommendations

### Immediate Actions
1. ✅ Fix failing tests in `useCards.test.ts`
2. ✅ Fix failing tests in `PWAUpdater.test.tsx`
3. ✅ Add tests for `useDebounce` (quick win)
4. ✅ Add tests for `useCountdown` (quick win)

### Short-term (Week 1)
1. Add tests for `useLevel` hook
2. Add tests for `useDueCardsQuery` hook
3. Improve `accountService` test coverage

### Medium-term (Week 2-3)
1. Add tests for `lib/api/cards.ts`
2. Add tests for `errorUtils.ts`
3. Add integration tests

## Coverage Targets vs. Current

| Target Area | Target | Current | Gap |
|-------------|--------|---------|-----|
| Overall | >85% | 83.88% | -1.12% |
| Business Logic | >90% | ~85%* | ~-5% |
| Components | >80% | ~90%* | ✅ Exceeds |
| API Routes | >85% | ~38%* | -47% |

*Estimated based on module coverage

## Notes

- Function coverage is the biggest gap (57.89% vs 85% target)
- Many untested hooks are critical for app functionality
- Service layer is relatively well covered
- API client layer needs significant work

---

**Next Steps:**
1. Fix existing test failures
2. Add quick-win tests
3. Target hooks with low coverage
4. Re-run coverage analysis after improvements