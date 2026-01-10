# Test Coverage Improvement Plan

**Date:** 2026-01-10
**Objective:** Increase test coverage for recently added features and ensure comprehensive testing of critical functionality
**Target Coverage:** >85% overall, >90% for business logic
**Timeline:** 2-3 weeks implementation

## Current Test Coverage Status

Based on the recent code review, the following areas lack adequate test coverage:

### 1. `useCards` Hook - **CRITICAL** (No tests)
- **Location:** `src/app/learn/hooks/useCards.ts`
- **Complexity:** High (useReducer, multiple useEffect hooks, complex state transitions)
- **Risk:** State management bugs could break core learning functionality

### 2. `PWAUpdater` Component - **HIGH** (No tests)
- **Location:** `src/app/components/PWAUpdater.tsx`
- **Complexity:** Medium (Service Worker API, event handling, error recovery)
- **Risk:** PWA update failures could impact user experience

### 3. Accounts API Route - **MEDIUM** (Integration tests missing)
- **Location:** `src/app/api/accounts/route.ts`
- **Complexity:** Medium (Authentication, pagination, data aggregation)
- **Risk:** API failures could break operator dashboard

### 4. Daily Review Count UI - **MEDIUM** (Component tests missing)
- **Location:** `src/app/operator/accounts/page.tsx` (dailyReviewCount column)
- **Complexity:** Low (Data display, conditional styling)
- **Risk:** UI bugs in operator interface

## Detailed Implementation Plan

### Phase 1: Setup and Infrastructure (Week 1)

#### 1.1 Enhanced Test Infrastructure
**Priority:** HIGH
**Estimated Time:** 2-3 days

**Tasks:**
- Create comprehensive mocks for Service Worker API
- Set up testing utilities for React hooks with complex state
- Create shared test helpers for API route testing
- Configure Jest environment for PWA testing

**Deliverables:**
```typescript
// src/__mocks__/workbox-window.ts
// src/test-utils/react-hooks.ts
// src/test-utils/api-testing.ts
```

#### 1.2 Mock Setup
**Files to create:**
- `jest.setup.ts` - Enhanced setup with additional mocks
- Service Worker mocks for PWA testing
- Enhanced React Testing Library setup

### Phase 2: Core Hook Testing (Week 1-2)

#### 2.1 `useCards` Hook Tests
**Priority:** CRITICAL
**Estimated Time:** 4-5 days
**Test File:** `src/app/learn/hooks/useCards.test.ts`

**Test Scenarios Required:**
```typescript
describe('useCards', () => {
  describe('Initial State', () => {
    it('should initialize with empty cards when no data');
    it('should initialize with API cards when data available');
  });

  describe('Level Changes', () => {
    it('should reset local cards when level changes');
    it('should update lastValidLevel on level change');
    it('should preserve cards for same level');
  });

  describe('Data Loading', () => {
    it('should update cards when data loads for current level');
    it('should ignore stale data for different levels');
    it('should mark cards as unreviewed when loaded');
  });

  describe('State Management', () => {
    it('should handle SET_CARDS action');
    it('should handle SET_LEVEL action');
    it('should handle UPDATE_CARDS action with function');
    it('should handle UPDATE_CARDS action with array');
  });

  describe('setCards Function', () => {
    it('should dispatch SET_CARDS for array input');
    it('should dispatch UPDATE_CARDS for function input');
  });
});
```

**Mocking Requirements:**
- Mock `useLevel` hook
- Mock `useDueCardsQuery` hook
- Control async timing with `jest.useFakeTimers()`

#### 2.2 Additional Hook Tests (if needed)
Review and potentially add tests for:
- `useDebounce` hook (from sign-in optimizations)
- `useCountdown` hook (from sign-in optimizations)

### Phase 3: Component Testing (Week 2)

#### 3.1 `PWAUpdater` Component Tests
**Priority:** HIGH
**Estimated Time:** 3-4 days
**Test File:** `src/app/components/PWAUpdater.test.tsx`

**Test Scenarios Required:**
```typescript
describe('PWAUpdater', () => {
  describe('Service Worker Support', () => {
    it('should not initialize when service worker not supported');
    it('should not initialize when not in browser environment');
  });

  describe('Registration', () => {
    it('should register service worker on mount');
    it('should handle registration errors gracefully');
  });

  describe('Update Handling', () => {
    it('should show update prompt when waiting event fires');
    it('should prevent multiple toast instances');
    it('should handle refresh button click');
    it('should reload page when controlling event fires');
  });

  describe('Error Handling', () => {
    it('should handle messageSkipWaiting errors');
    it('should show error toast on update failure');
    it('should reset toast state on error');
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount');
    it('should clean up controlling handler references');
  });
});
```

**Mocking Requirements:**
- Mock `workbox-window` module
- Mock `sonner` toast functions
- Mock `logger` utility
- Mock `window.location.reload`

#### 3.2 Daily Review Count UI Tests
**Priority:** MEDIUM
**Estimated Time:** 2-3 days
**Test File:** `src/app/operator/accounts/page.test.tsx`

**Test Scenarios Required:**
```typescript
describe('AccountsPage - Daily Review Count', () => {
  describe('Data Display', () => {
    it('should display daily review count for each account');
    it('should show "0" for accounts with no reviews');
    it('should apply green styling for positive counts');
    it('should apply muted styling for zero counts');
  });

  describe('Data Formatting', () => {
    it('should format review counts correctly');
    it('should handle undefined/null review counts');
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels');
    it('should maintain keyboard navigation');
  });
});
```

### Phase 4: API Route Testing (Week 2-3)

#### 4.1 Accounts API Integration Tests
**Priority:** MEDIUM
**Estimated Time:** 3-4 days
**Test File:** `src/app/api/accounts/route.test.ts`

**Test Scenarios Required:**
```typescript
describe('GET /api/accounts', () => {
  describe('Authentication', () => {
    it('should return 401 when not authenticated');
    it('should return 403 when user is not operator');
    it('should allow access for operator users');
  });

  describe('Pagination', () => {
    it('should handle page and perPage parameters');
    it('should return correct pagination metadata');
    it('should handle invalid pagination parameters');
  });

  describe('Data Aggregation', () => {
    it('should include daily review counts in response');
    it('should merge review counts with account data');
    it('should handle missing review count data');
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully');
    it('should return appropriate error responses');
  });
});
```

**Mocking Requirements:**
- Mock Supabase auth methods
- Mock repository methods
- Mock factory function

### Phase 5: Quality Assurance (Week 3)

#### 5.1 Coverage Analysis
**Priority:** HIGH
**Estimated Time:** 1-2 days

**Tasks:**
- Run `npm test -- --coverage` to analyze coverage
- Identify remaining uncovered lines
- Create additional tests for edge cases
- Document coverage improvements

#### 5.2 Integration Testing
**Priority:** MEDIUM
**Estimated Time:** 2-3 days

**Tasks:**
- Test end-to-end flows involving new features
- Verify component integration
- Test error scenarios
- Performance testing for hooks

## Test Infrastructure Requirements

### Enhanced Jest Configuration
```javascript
// jest.config.js additions
module.exports = {
  // ... existing config
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom', // for component tests
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/*.test.(ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
};
```

### Mock Implementations Needed

#### Service Worker Mock
```typescript
// src/__mocks__/workbox-window.ts
export class Workbox {
  constructor() {}
  register() { return Promise.resolve(); }
  addEventListener() {}
  removeEventListener() {}
  messageSkipWaiting() {}
}
```

#### React Hooks Testing Utilities
```typescript
// src/test-utils/react-hooks.ts
export function renderHookWithProviders<T>(hook: () => T) {
  // Wrapper with necessary providers
}
```

## Success Criteria

### Coverage Targets
- **Overall Coverage:** >85%
- **Business Logic:** >90% (services, hooks, utilities)
- **Components:** >80% (critical UI components)
- **API Routes:** >85% (integration tests)

### Quality Metrics
- All tests pass consistently
- No flaky tests
- Tests run in <5 minutes
- Tests provide clear failure messages
- Tests follow established patterns

## Risk Mitigation

### Testing Challenges
1. **Service Worker Testing:** Complex browser API mocking required
2. **Async State Management:** Timing issues with useReducer
3. **API Route Testing:** Server-side mocking complexity

### Mitigation Strategies
1. Comprehensive mocking strategy
2. Use of `act()` and `waitFor()` utilities
3. Isolation of concerns in test setup
4. Incremental test implementation

## Timeline and Milestones

### Week 1: Infrastructure and Hook Testing
- ✅ Setup enhanced test infrastructure
- ✅ Complete `useCards` hook tests
- ⏳ Start `PWAUpdater` component tests

### Week 2: Component and UI Testing
- ✅ Complete `PWAUpdater` component tests
- ✅ Complete daily review count UI tests
- ⏳ Start API route integration tests

### Week 3: API Testing and Quality Assurance
- ✅ Complete API route integration tests
- ✅ Run coverage analysis
- ✅ Address remaining gaps
- ✅ Final verification and documentation

## Dependencies

### Tools Required
- Jest 29+
- @testing-library/react 14+
- @testing-library/jest-dom
- jest-axe (for accessibility testing)
- workbox-window (for PWA testing)

### Knowledge Prerequisites
- React Testing Library patterns
- Jest mocking strategies
- Next.js API route testing
- Service Worker API understanding

## Maintenance Plan

### Ongoing Testing Strategy
1. **Pre-commit Hooks:** Run tests before commits
2. **CI/CD Integration:** Automated testing in pipeline
3. **Coverage Gates:** Prevent coverage regression
4. **Test Reviews:** Include test coverage in code reviews

### Test Maintenance
1. Update tests when refactoring code
2. Add tests for new features
3. Remove obsolete tests
4. Keep test data current

## Success Metrics

### Immediate Success (End of Implementation)
- ✅ All new features have comprehensive test coverage
- ✅ Test suite runs reliably (<5 minutes)
- ✅ Coverage meets or exceeds targets
- ✅ No critical gaps remain

### Long-term Success (3 months)
- ✅ Test coverage maintained above thresholds
- ✅ New features include tests from inception
- ✅ Test suite catches regressions effectively
- ✅ Development velocity not impacted by testing overhead

---

**Document Version:** 1.0
**Last Updated:** 2026-01-10
**Next Review:** After implementation completion