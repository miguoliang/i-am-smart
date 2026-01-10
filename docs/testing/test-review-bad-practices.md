# Test Review: Bad Practices Found

## Critical Issues

### 1. **useCards.test.ts** - Mutable Mock Variables (Fragile Pattern)

**Problem:**
```typescript
let mockDueCardsQueryReturn: Partial<UseQueryResult<DueCardsResponse, Error>> = {...};
let mockLevelReturn: { level: Level } = { level: 'A1' };

jest.mock('./useDueCardsQuery', () => ({
  useDueCardsQuery: jest.fn(() => mockDueCardsQueryReturn),
}));
```

**Issues:**
- Mutable variables reassigned in tests create fragile dependencies
- Tests can interfere with each other if not properly reset
- Mock factory functions capture initial values, reassignments may not work as expected
- Hard to reason about test isolation

**Better Approach:**
```typescript
const mockUseDueCardsQuery = jest.fn();
jest.mock('./useDueCardsQuery', () => ({
  useDueCardsQuery: () => mockUseDueCardsQuery(),
}));

beforeEach(() => {
  mockUseDueCardsQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
  });
});
```

### 2. **useCards.test.ts** - Empty Test Suite

**Problem:**
```typescript
describe('Data Loading', () => {
});
```

**Issue:** Empty describe blocks add no value and clutter the test output.

**Fix:** Remove empty describe blocks or add tests.

### 3. **useCards.test.ts** - Testing Implementation Details

**Problem:**
```typescript
expect(typeof result.current.setCards).toBe('function');
```

**Issue:** Testing internal implementation (function type) rather than behavior.

**Better:** Test that `setCards` actually works:
```typescript
act(() => {
  result.current.setCards([mockCard]);
});
expect(result.current.cards).toEqual([mockCard]);
```

### 4. **useCards.test.ts** - Arbitrary Timeout Delays

**Problem:**
```typescript
await act(async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
});
```

**Issues:**
- Arbitrary delays are unreliable and slow
- Race conditions possible
- Not using proper async testing patterns

**Better:** Use `waitFor` or proper effect synchronization:
```typescript
await waitFor(() => {
  expect(result.current.cards).toEqual([]);
});
```

### 5. **cardService.test.ts** - Unsafe Type Assertions

**Problem:**
```typescript
cardRepository.getCardById.mockResolvedValue(mockCard as unknown as Card);
```

**Issues:**
- `as unknown as Card` bypasses type safety
- Can hide real type mismatches
- Makes refactoring dangerous

**Better:** Create proper mock objects:
```typescript
const mockCard: Card = {
  id: 1,
  knowledge_code: 'k1',
  knowledge: { code: 'k1', name: 'n', description: 'd', metadata: {} },
  next_review_date: '2023-01-01',
};
```

### 6. **cardService.test.ts** - Imprecise Assertions

**Problem:**
```typescript
expect(cardRepository.getReviewedTodayCount).toHaveBeenCalledWith(
  'user-123', 
  expect.any(String), 
  expect.any(String)
);
```

**Issue:** `expect.any(String)` is too loose - doesn't verify actual values.

**Better:** Use specific values or `expect.stringMatching()`:
```typescript
expect(cardRepository.getReviewedTodayCount).toHaveBeenCalledWith(
  'user-123',
  expect.stringMatching(/\d{4}-\d{2}-\d{2}/), // Date format
  expect.stringMatching(/\d{4}-\d{2}-\d{2}/)
);
```

### 7. **useCardNavigation.test.ts** - Incomplete Test

**Problem:**
```typescript
it('should wrap around to find unreviewed card', () => {
  // ... setup code ...
  // Test ends without assertions
});
```

**Issue:** Test has no assertions - will always pass.

**Fix:** Complete the test or remove it.

### 8. **useCardNavigation.test.ts** - Inconsistent Timer Usage

**Problem:**
```typescript
jest.useFakeTimers();
// ... test code ...
jest.useRealTimers(); // Called in middle of test
```

**Issue:** Mixing fake and real timers in same test file can cause issues.

**Better:** Use `beforeEach`/`afterEach`:
```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```

### 9. **sanitize.test.ts** - Complex Mock Access Pattern

**Problem:**
```typescript
const mockFactory = DOMPurify as unknown as jest.Mock;
const purifyInstance = mockFactory.mock.results[0].value;
sanitizeSpy = purifyInstance.sanitize;
```

**Issues:**
- Accessing internal mock structure is fragile
- Breaks if mock implementation changes
- Hard to understand and maintain

**Better:** Mock at a higher level or use `jest.spyOn`:
```typescript
const mockSanitize = jest.fn();
jest.mock('dompurify', () => {
  return jest.fn(() => ({
    sanitize: mockSanitize,
  }));
});
```

### 10. **sanitize.test.ts** - Unsafe Type Assertions

**Problem:**
```typescript
expect(sanitizeText(null as unknown as string)).toBe('');
expect(sanitizeText(undefined as unknown as string)).toBe('');
```

**Issue:** Testing invalid inputs with type assertions hides real type issues.

**Better:** If function should handle these, update types. Otherwise, remove these tests.

### 11. **useSpeech.test.ts** - Global Object Pollution

**Problem:**
```typescript
Object.defineProperty(window, 'speechSynthesis', {
  value: { speak: mockSpeak, cancel: mockCancel },
  writable: true,
});
```

**Issues:**
- Modifying global objects can leak between tests
- No cleanup in `afterEach`
- Can cause test pollution

**Better:** Clean up in `afterEach`:
```typescript
afterEach(() => {
  delete (window as any).speechSynthesis;
  delete (window as any).speak;
});
```

### 12. **dateUtils.test.ts** - Timezone-Dependent Tests

**Problem:**
```typescript
const date = '2023-12-25T10:30:00.000Z';
const expected = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
expect(formatDate(date)).toBe(expected);
```

**Issues:**
- Tests depend on system timezone
- Can fail in CI/CD with different timezones
- Comments acknowledge the problem but don't fix it

**Better:** Use fixed timezone or test relative values:
```typescript
// Option 1: Mock timezone
process.env.TZ = 'UTC';

// Option 2: Test format, not exact values
expect(formatDate(date)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
```

### 13. **page.test.tsx** - Overly Complex Test Logic

**Problem:**
```typescript
if (ariaDescribedBy) {
  expect(ariaDescribedBy).toBe('error-fragmentTimeNotHelpfulReason');
  const errorElement = document.getElementById(ariaDescribedBy);
  if (errorElement) {
    expect(errorElement).toHaveTextContent(/.../);
  }
}
```

**Issues:**
- Conditional assertions make tests less reliable
- If conditions aren't met, test silently passes
- Hard to debug failures

**Better:** Set up test to ensure conditions are met, then assert:
```typescript
// Ensure error state exists
await waitFor(() => {
  expect(screen.getByText(/请说明为什么觉得没有帮助/i)).toBeVisible();
});

const textarea = screen.getByLabelText(/请说明为什么觉得没有帮助/i);
expect(textarea).toHaveAttribute('aria-describedby', 'error-fragmentTimeNotHelpfulReason');
```

### 14. **accountService.test.ts** - Type Assertions Instead of Proper Mocks

**Problem:**
```typescript
const mockUser = { id: 'user-1', role: 'learner' } as Account;
```

**Issue:** Using `as Account` instead of creating proper mock objects.

**Better:** Create complete mock objects:
```typescript
const mockUser: Account = {
  id: 'user-1',
  role: 'learner',
  email: 'test@example.com',
  // ... other required fields
};
```

### 15. **apiError.test.ts** - Module-Level Mocking

**Problem:**
```typescript
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}));
```

**Issue:** Module-level mocks can interfere with other tests if not properly isolated.

**Better:** Use `jest.spyOn` when possible or ensure proper cleanup.

## Medium Priority Issues

### 16. **Missing Test Coverage**

- `useCards.test.ts`: Empty "Data Loading" describe block suggests missing tests
- `statsService.test.ts`: Very minimal - only 2 tests for entire service
- `useCardNavigation.test.ts`: Incomplete test case

### 17. **Test Organization**

- Some tests mix concerns (e.g., testing multiple behaviors in one test)
- Inconsistent use of `describe` blocks for grouping

### 18. **Assertion Quality**

- Some tests use loose matchers (`expect.any()`) instead of specific values
- Missing negative test cases (testing that things DON'T happen)

## Recommendations

1. **Fix Critical Issues First:**
   - Replace mutable mock variables with proper mock functions
   - Remove empty test suites
   - Fix incomplete tests
   - Remove unsafe type assertions

2. **Improve Test Isolation:**
   - Ensure proper cleanup of global modifications
   - Use `beforeEach`/`afterEach` consistently
   - Fix timezone-dependent tests

3. **Enhance Test Quality:**
   - Test behavior, not implementation
   - Use specific assertions instead of loose matchers
   - Complete incomplete tests
   - Add missing test cases

4. **Follow Testing Standards:**
   - Review `.cursor/rules/testing.mdc` for guidelines
   - Ensure all tests follow the Arrange-Act-Assert pattern
   - Use proper mocking patterns
