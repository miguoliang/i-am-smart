# Accessibility Standards Improvement Plan

**Date:** 2025-01-03  
**Status:** Planning  
**Priority:** High  
**Estimated Effort:** 1-2 days

## Executive Summary

This plan addresses the accessibility deficiencies identified in the Comprehensive Codebase Review. The goal is to bring the application into better alignment with WCAG 2.1 AA standards.
Key areas of focus include: semantic HTML, ARIA labeling, keyboard navigation, and screen reader support, particularly within the `feedback` form and core interactive components like the Flashcard.

---

## Current State Analysis

### Issues Identified

#### 1. WCAG Guidelines Compliance ⚠️ **NEEDS IMPROVEMENT**
- **Root Layout:** Missing or unverified `lang` attribute.
- **Form Controls:** Radio buttons and checkboxes in `src/app/feedback/page.tsx` lack proper `aria-label` or `aria-labelledby`.
- **Form Validation:** Error messages are not programmatically associated with inputs via `aria-describedby`.
- **Navigation:** No "Skip to Content" link.

#### 2. Semantic HTML & Custom Controls ⚠️ **NEEDS IMPROVEMENT**
- **Custom Inputs:** The custom implementation of radio/checkboxes in Feedback page may not expose correct role/state to assistive technology.
- **Landmarks:** Missing `<main>` regions in some page layouts.

#### 3. Keyboard Navigation ⚠️ **NEEDS IMPROVEMENT**
- **Flashcard:** The generic "flip" interaction is touch-optimized but may lack specific keyboard triggers (e.g., Space/Enter).
- **Focus Management:** Focus indicators on custom controls are not clearly verified.

---

## Implementation Plan

### Phase 1: Global Accessibility Fixes

**Goal:** Address site-wide structure and navigation issues.

#### 1.1 "Skip to Content" Link
- **Action:** Add a hidden "Skip to main content" link as the first focusable element in the root layout.
- **Implementation:**
  - Create `src/components/SkipLink.tsx`
  - Add to `src/app/layout.tsx`

#### 1.2 HTML Language Attribute
- **Action:** Verify and enforce `<html lang="zh">` in `src/app/layout.tsx`.

#### 1.3 Landmark Regions
- **Action:** Ensure all pages are wrapped in a `<main id="main-content">`.
- **Target Files:** `src/app/page.tsx`, `src/app/learn/page.tsx`, `src/app/feedback/page.tsx`, `src/app/layout.tsx`.

**Estimated Time:** 1-2 hours

---

### Phase 2: Form Accessibility (Feedback Page)

**Goal:** Ensure the feedback form is fully accessible to screen readers and keyboard users.

#### 2.1 Label Association
- **Action:** Ensure every `<input>`, `<textarea>`, and custom control has a visible `<label>` or `aria-label`.
- **Implementation:**
  - Refactor `src/app/feedback/page.tsx`.
  - Use `htmlFor` / `id` pairing strictly.
  - For radio groups, use `<fieldset>` and `<legend>`.

#### 2.2 Error Messaging
- **Action:** Programmatically associate error messages with inputs.
- **Implementation:**
  - Add `id="error-[fieldname]"` to error message containers.
  - Add `aria-describedby="error-[fieldname]"` and `aria-invalid="true"` to invalid inputs.

#### 2.3 Custom Controls (Radix UI / Shadcn)
- **Action:** Verify `Checkbox` and `RadioGroup` usage.
- **Note:** Shadcn UI components usually handle this well, but we must ensure we are passing the correct `aria-label` or wrapping them in `<FormItem>` correctly if using `react-hook-form`.

**Estimated Time:** 3-4 hours

---

### Phase 3: Interactive Component Accessibility (Flashcard)

**Goal:** Make the core learning experience keyboard-friendly.

#### 3.1 Keyboard Flip Support
- **Action:** Add keyboard event listeners to the Card component.
- **Implementation:**
  - `onKeyDown` handler for `Enter` and `Space` keys to trigger the flip action.
  - Ensure the card container has `tabIndex={0}` and `role="button"`.

#### 3.2 Focus Indicators
- **Action:** Ensure the card has a visible focus ring when focused via keyboard.
- **Implementation:** Add `focus-visible:ring` utilities from Tailwind.

**Estimated Time:** 2-3 hours

---

## Testing Strategy

### Automated Testing
- **Tool:** `jest-axe`
- **Action:** Add a test file `src/app/feedback/page.test.tsx` (or similar) that renders the form and runs `axe` checks.

### Manual Testing
- **Keyboard:** Tab through the entire feedback flow and flashcard review flow without a mouse.
- **Screen Reader (Simulation):** Use MacOS VoiceOver (if available) or verify ARIA attributes in DevTools Accessibility tree.

---

## Success Criteria

1. ✅ `jest-axe` tests pass for the Feedback page.
2. ✅ All form inputs have accessible names (labels).
3. ✅ Flashcard can be flipped and reviewed using only the keyboard.
4. ✅ HTML structure includes valid `lang` and `<main>` landmarks.

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Global Fixes | 1-2 hours | None |
| Phase 2: Feedback Form | 3-4 hours | Phase 1 |
| Phase 3: Flashcard | 2-3 hours | None |
| **Total** | **~1 Day** | |

