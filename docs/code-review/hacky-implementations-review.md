# Code Review: Hacky Implementations

**Date:** 2026-01-10  
**Reviewer:** Automated Code Review System  
**Status:** Issues Identified

## Executive Summary

This review identifies hacky implementations, workarounds, and code smells throughout the codebase. These patterns indicate areas where the code is fighting against the framework, bypassing type safety, or using workarounds that should be replaced with proper solutions.

**Overall Assessment:** ⚠️ **Multiple hacky patterns found** - Needs refactoring

---

## Critical Issues (Must Fix)

### 1. **Type Assertions Bypassing Type Safety** 🔴

**Location:** Multiple files

#### 1.1 `supabase-card.repository.ts` - Unsafe Type Casting

**Problem:**
```typescript
// Line 68
const cards = (data as unknown as RawCardData[]).map((card) => ({
  ...card,
}));

// Line 94
return data as unknown as Card;
```

**Issues:**
- Double casting (`as unknown as`) completely bypasses TypeScript's type checking
- No runtime validation that data matches expected structure
- Silent failures if database schema changes
- The mapping on line 68 does nothing (just spreads the same object)

**Better Approach:**
```typescript
// Validate and transform data properly
if (!Array.isArray(data)) {
  throw new Error('Expected array from RPC');
}

const cards: Card[] = data.map((card: RawCardData) => ({
  id: card.id,
  knowledge_code: card.knowledge_code,
  knowledge: card.knowledge,
  next_review_date: card.next_review_date,
  last_reviewed_at: card.last_reviewed_at,
  ease_factor: card.ease_factor,
  interval_days: card.interval_days,
  repetitions: card.repetitions,
}));
```

#### 1.2 `supabase-stats.repository.ts` - Postgres BigInt Workaround

**Problem:**
```typescript
// Line 31
return (data as unknown as HeatmapRow[] || []).map((row) => ({
  date: row.review_date,
  count: Number(row.review_count)  // Converting string to number
}));
```

**Issues:**
- Type assertion hides the fact that Postgres returns bigint as string
- No validation that `row.review_count` is actually a string
- Silent conversion failures possible

**Better Approach:**
```typescript
interface HeatmapRow {
  review_date: string;
  review_count: string; // Explicitly type as string from DB
}

if (!Array.isArray(data)) {
  return [];
}

return data.map((row: HeatmapRow) => {
  const count = parseInt(row.review_count, 10);
  if (isNaN(count)) {
    throw new Error(`Invalid review_count: ${row.review_count}`);
  }
  return {
    date: row.review_date,
    count,
  };
});
```

### 2. **Global Object Pollution** 🔴

#### 2.1 `useSpeech.ts` - Attaching to Window Object

**Problem:**
```typescript
useEffect(() => {
  window.speak = speak;
  return () => {
    // @ts-expect-error cleanup global function
    delete window.speak;
  };
}, [speak]);
```

**Issues:**
- Pollutes global namespace
- Requires `@ts-expect-error` to bypass TypeScript
- Can conflict with other code or libraries
- Not React-idiomatic

**Better Approach:**
```typescript
// Use React Context or a proper state management solution
const SpeechContext = createContext<{ speak: (text: string, lang: string) => void } | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const speak = useCallback((text: string, lang: "en-US" | "en-GB" = "en-US") => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.8;
      window.speechSynthesis.speak(utter);
    }
  }, []);

  return (
    <SpeechContext.Provider value={{ speak }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within SpeechProvider');
  }
  return context;
}
```

### 3. **DOM Manipulation in React** 🔴

#### 3.1 `useJSONParser.ts` - Direct DOM Query

**Problem:**
```typescript
const reset = () => {
  setFile(null);
  setPreviewData(null);
  setError(null);
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (fileInput) fileInput.value = "";
};
```

**Issues:**
- Direct DOM manipulation bypasses React's virtual DOM
- Fragile selector (`input[type="file"]`) can match wrong element
- Type assertion without null check
- Not React-idiomatic

**Better Approach:**
```typescript
const fileInputRef = useRef<HTMLInputElement>(null);

const reset = () => {
  setFile(null);
  setPreviewData(null);
  setError(null);
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

// In JSX:
<input
  ref={fileInputRef}
  type="file"
  onChange={handleFileChange}
/>
```

### 4. **Arbitrary Timeout Workarounds** 🔴

#### 4.1 `page.tsx` - Multiple setTimeout(0) Hacks

**Problem:**
```typescript
// Line 49 - Validation timeout
validationTimerRef.current = setTimeout(() => {
  if (!isValidEmail(debouncedEmail)) {
    setEmailError("邮箱格式不正确");
  } else {
    setEmailError(null);
  }
}, 0);

// Line 89 - Focus timeout
const timer = setTimeout(() => {
  otpInputRef.current?.focus();
}, 50);

// Lines 127, 145 - State update deferral
setTimeout(() => {
  handleVerifyOtp();
}, 0);
```

**Issues:**
- `setTimeout(..., 0)` is a code smell indicating timing/race condition workarounds
- Multiple arbitrary delays (0ms, 50ms) suggest fragile timing dependencies
- Hard to reason about execution order
- Can cause race conditions

**Better Approach:**

**For validation:**
```typescript
// Remove setTimeout - debounce already handles timing
useEffect(() => {
  if (debouncedEmail && debouncedEmail.length > 0) {
    if (!isValidEmail(debouncedEmail)) {
      setEmailError("邮箱格式不正确");
    } else {
      setEmailError(null);
    }
  } else {
    setEmailError(null);
  }
}, [debouncedEmail]);
```

**For focus:**
```typescript
// Use useLayoutEffect for DOM operations
useLayoutEffect(() => {
  if (otpSent && otpInputRef.current) {
    otpInputRef.current.focus();
  }
}, [otpSent]);
```

**For auto-submit:**
```typescript
// Use useEffect with proper dependency tracking
useEffect(() => {
  if (sanitized.length === 6 && previousLength !== 6 && otpSent && !loading && !autoSubmitRef.current) {
    autoSubmitRef.current = true;
    handleVerifyOtp();
  }
}, [sanitized.length, otpSent, loading]);
```

#### 4.2 `useCardNavigation.ts` - setTimeout for State Updates

**Problem:**
```typescript
// Lines 27, 34
const timeoutId = setTimeout(() => {
  setCurrentIndex(nextUnreviewed);
}, 0);
```

**Issues:**
- Comment says "avoid render-cycle conflicts" - this is a workaround, not a solution
- `setTimeout(0)` suggests React state update timing issues
- Should use proper React patterns instead

**Better Approach:**
```typescript
// Use useLayoutEffect for synchronous DOM-related updates
useLayoutEffect(() => {
  if (cards.length === 0) return;

  const validIndex = Math.min(currentIndex, cards.length - 1);
  const currentCard = cards[validIndex];

  if (currentCard?.reviewed) {
    let nextUnreviewed = cards.findIndex(
      (card, index) => index > validIndex && !card.reviewed
    );
    if (nextUnreviewed === -1) {
      nextUnreviewed = cards.findIndex((card) => !card.reviewed);
    }

    if (nextUnreviewed !== -1 && nextUnreviewed !== validIndex) {
      setCurrentIndex(nextUnreviewed);
    }
  } else if (currentIndex >= cards.length) {
    setCurrentIndex(Math.max(0, cards.length - 1));
  }
}, [cards, currentIndex]);
```

### 5. **ESLint Disable Comments** 🟡

#### 5.1 `page.tsx` - Disabled Exhaustive Deps Rule

**Problem:**
```typescript
// Line 94
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [otpSent]);
```

**Issues:**
- Disabling exhaustive-deps usually indicates missing dependencies or wrong effect structure
- Can lead to stale closures and bugs
- The effect only uses `otpSent` but might need `otpInputRef` in deps

**Better Approach:**
```typescript
// Fix the dependency array properly
useLayoutEffect(() => {
  if (otpSent && otpInputRef.current) {
    otpInputRef.current.focus();
  }
}, [otpSent]); // otpInputRef is stable, doesn't need to be in deps
```

#### 5.2 `DataTable.tsx` - Disabled Incompatible Library Rule

**Problem:**
```typescript
// Line 146
// eslint-disable-next-line react-hooks/incompatible-library
const table = useReactTable({
```

**Issues:**
- Disabling incompatible-library suggests the library might not be compatible with React's rules
- Could indicate version mismatch or incorrect usage

**Investigation Needed:**
- Check if `@tanstack/react-table` version is compatible with React version
- Verify if this is a known issue or misconfiguration

---

## Medium Priority Issues

### 6. **Complex State Synchronization** 🟡

#### 6.1 `useCards.ts` - Manual Level Tracking

**Problem:**
```typescript
const prevLevelRef = useRef(level);

useEffect(() => {
  if (prevLevelRef.current !== level) {
    prevLevelRef.current = level;
    dispatch({ type: 'SET_LEVEL', level });
  }
}, [level]);
```

**Issues:**
- Manual ref tracking for level changes is fragile
- Could use a proper state management solution
- The `lastValidLevel` pattern suggests complex synchronization needs

**Better Approach:**
```typescript
// Use a key-based approach or proper state machine
// Or simplify by always using current level
useEffect(() => {
  if (data && !loading) {
    const cardsWithReviewed = data.cards.map((card: Card) => ({
      ...card,
      reviewed: false,
    }));
    dispatch({ type: 'SET_CARDS', cards: cardsWithReviewed });
  }
}, [data, loading, level]); // Include level in deps, reset when it changes
```

### 7. **Type Assertions in Tests** 🟡

**Problem:** Multiple test files use `as unknown as` pattern

**Issues:**
- Tests bypass type checking, hiding real type issues
- Makes refactoring dangerous
- Should use proper mock factories

**Better Approach:**
```typescript
// Instead of:
cardRepository.getCardById.mockResolvedValue(mockCard as unknown as Card);

// Use:
const createMockCard = (overrides?: Partial<Card>): Card => ({
  id: 1,
  knowledge_code: 'k1',
  knowledge: { code: 'k1', name: 'n', description: 'd', metadata: {} },
  next_review_date: '2023-01-01',
  ...overrides,
});

cardRepository.getCardById.mockResolvedValue(createMockCard());
```

### 8. **Complex Column Configuration Logic** 🟡

#### 8.1 `DataTable.tsx` - Complex Column Visibility Sync

**Problem:**
```typescript
// Lines 115-119 - Complex synchronization logic
useEffect(() => {
  if (columnsEnabled && (!defaultColumns || defaultColumns.length === 0) && columnConfigs.length === 0 && generatedConfigs.length > 0) {
    setColumnConfigs(generatedConfigs);
  }
}, [columnsEnabled, defaultColumns, columnConfigs.length, generatedConfigs]);
```

**Issues:**
- Complex conditional logic suggests the data model might be wrong
- Multiple state synchronization points
- Hard to reason about when configs update

**Better Approach:**
```typescript
// Simplify with a single source of truth
const columnConfigs = useMemo(() => {
  if (!columnsEnabled) return [];
  if (defaultColumns && defaultColumns.length > 0) return defaultColumns;
  return generatedConfigs;
}, [columnsEnabled, defaultColumns, generatedConfigs]);
```

### 9. **Error Message String Matching** 🟡

#### 9.1 `useSignIn.ts` - Fragile Error Parsing

**Problem:**
```typescript
// Lines 107-110
} else if (error.message.includes("token") || error.message.includes("expired")) {
  toast.error("验证码无效或已过期，请重新获取验证码");
} else if (error.message.includes("email")) {
  toast.error("邮箱验证失败，请检查邮箱地址是否正确");
```

**Issues:**
- String matching on error messages is fragile
- Error messages can change in library updates
- Should use error codes or types instead

**Better Approach:**
```typescript
// Check error codes or types if available
if (error.status === 400 && error.code === 'TOKEN_EXPIRED') {
  toast.error("验证码无效或已过期，请重新获取验证码");
} else if (error.status === 400 && error.code === 'INVALID_EMAIL') {
  toast.error("邮箱验证失败，请检查邮箱地址是否正确");
}
```

---

## Low Priority Issues

### 10. **Unused/Redundant Code** 🟢

#### 10.1 `supabase-card.repository.ts` - Redundant Mapping

**Problem:**
```typescript
// Line 68-70
const cards = (data as unknown as RawCardData[]).map((card) => ({
  ...card,
}));
```

**Issue:** The mapping does nothing - just spreads the same object.

**Fix:** Remove the mapping or actually transform the data.

### 11. **Magic Numbers** 🟢

**Problem:** Various timeout values (0, 50, 10ms) scattered throughout code

**Better:** Extract to named constants:
```typescript
const FOCUS_DELAY_MS = 50;
const STATE_UPDATE_DELAY_MS = 0; // Actually, remove these entirely
```

---

## Recommendations

### Immediate Actions (This Week)

1. **Fix Type Assertions** 🔴
   - Replace all `as unknown as` patterns with proper type guards
   - Add runtime validation for database responses
   - Create proper type transformation functions

2. **Remove Global Object Pollution** 🔴
   - Refactor `useSpeech` to use React Context
   - Remove `window.speak` attachment

3. **Fix DOM Manipulation** 🔴
   - Replace `document.querySelector` with refs in `useJSONParser`
   - Use React patterns for all DOM access

4. **Eliminate setTimeout(0) Hacks** 🔴
   - Refactor all `setTimeout(..., 0)` patterns
   - Use `useLayoutEffect` for DOM operations
   - Fix state update timing issues properly

### Short-term (This Month)

5. **Simplify State Management**
   - Review complex state synchronization in `useCards`
   - Consider using a state machine library if complexity warrants it

6. **Improve Error Handling**
   - Replace string matching with error codes/types
   - Create error type guards

7. **Fix ESLint Disables**
   - Investigate why rules are disabled
   - Fix underlying issues instead of disabling rules

### Long-term (Next Quarter)

8. **Add Runtime Validation**
   - Use libraries like `zod` for API response validation
   - Validate all external data at boundaries

9. **Refactor Complex Components**
   - Break down `DataTable` column configuration logic
   - Simplify `useCardNavigation` state management

---

## Testing Impact

Many of these hacky patterns make testing difficult:
- Type assertions hide real type mismatches
- Global object pollution requires complex cleanup
- setTimeout patterns are hard to test reliably
- DOM manipulation bypasses React Testing Library

**Recommendation:** Fix these issues will also improve testability.

---

## Conclusion

The codebase contains several hacky implementations that should be refactored. The most critical issues involve:
1. Type safety bypasses
2. Global object pollution
3. DOM manipulation workarounds
4. Timing workarounds with setTimeout

Addressing these will improve code quality, maintainability, and testability.
