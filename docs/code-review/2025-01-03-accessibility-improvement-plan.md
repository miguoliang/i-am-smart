# Accessibility Standards Improvement Plan

**Date:** 2025-01-03  
**Status:** In Progress  
**Priority:** High  
**Estimated Effort:** 1-2 days  
**Last Updated:** 2025-01-03

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

### Phase 1: Global Accessibility Fixes ✅ **COMPLETED**

**Goal:** Address site-wide structure and navigation issues.

#### 1.1 "Skip to Content" Link ✅
- **Action:** Add a hidden "Skip to main content" link as the first focusable element in the root layout.
- **Implementation:**
  - ✅ Created `src/components/SkipLink.tsx`
  - ✅ Added to `src/app/layout.tsx`
- **Status:** Complete - SkipLink component implemented with proper focus styles

#### 1.2 HTML Language Attribute ✅
- **Action:** Verify and enforce `<html lang="zh">` in `src/app/layout.tsx`.
- **Status:** Complete - Verified `<html lang="zh">` is set in root layout

#### 1.3 Landmark Regions ✅
- **Action:** Ensure all pages are wrapped in a `<main id="main-content">`.
- **Status:** Complete - Main landmark with `id="main-content"` added to root layout

**Estimated Time:** 1-2 hours  
**Actual Time:** ~1 hour  
**Completed:** 2025-01-03

---

### Phase 2: Form Accessibility (Feedback Page) ✅ **COMPLETED**

**Goal:** Ensure the feedback form is fully accessible to screen readers and keyboard users.

#### 2.1 Label Association ✅
- **Action:** Ensure every `<input>`, `<textarea>`, and custom control has a visible `<label>` or `aria-label`.
- **Implementation:**
  - ✅ Refactored `src/app/feedback/page.tsx`.
  - ✅ All inputs have proper `aria-label` attributes.
  - ✅ Radio groups use `<fieldset>` and `<legend>`.
  - ✅ Textareas use `<Label>` components with `htmlFor` / `id` pairing.
- **Status:** Complete - All form controls have accessible labels

#### 2.2 Error Messaging ✅
- **Action:** Programmatically associate error messages with inputs.
- **Implementation:**
  - ✅ Added `id="error-[fieldname]"` to error message containers.
  - ✅ Added `aria-describedby="error-[fieldname]"` to invalid inputs.
  - ✅ Added `aria-invalid="true"` to invalid inputs and fieldsets.
  - ✅ Error messages have `role="alert"` for screen reader announcements.
- **Status:** Complete - Error messages properly associated with inputs

#### 2.3 Custom Controls (Radix UI / Shadcn) ✅
- **Action:** Verify `Checkbox` and `RadioGroup` usage.
- **Status:** Complete - Radix UI Checkbox components properly labeled with `aria-label`
- **Note:** Shadcn UI components handle accessibility well; verified proper usage

**Estimated Time:** 3-4 hours  
**Actual Time:** ~3 hours  
**Completed:** 2025-01-03

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

### Automated Testing ✅ **COMPLETED**
- **Tool:** `jest-axe`
- **Action:** Add a test file `src/app/feedback/page.test.tsx` (or similar) that renders the form and runs `axe` checks.
- **Status:** ✅ Complete - Test file created with 3 accessibility tests:
  - ✅ `should have no violations` - Uses jest-axe to check for WCAG violations
  - ✅ `should have accessible form controls` - Verifies labels and button accessibility
  - ✅ `should associate error messages with inputs` - Verifies ARIA error associations
- **Test Infrastructure:** Added mocks for `ResizeObserver` and `window.matchMedia` in `jest.setup.ts`
- **Result:** All 3 tests passing ✅

### Manual Testing ⚠️ **PENDING**
- **Keyboard:** Tab through the entire feedback flow and flashcard review flow without a mouse.
- **Screen Reader (Simulation):** Use MacOS VoiceOver (if available) or verify ARIA attributes in DevTools Accessibility tree.
- **Status:** Not yet performed - Recommended for final verification

---

## Success Criteria

1. ✅ `jest-axe` tests pass for the Feedback page. **COMPLETED**
2. ✅ All form inputs have accessible names (labels). **COMPLETED**
3. ⚠️ Flashcard can be flipped and reviewed using only the keyboard. **PENDING**
4. ✅ HTML structure includes valid `lang` and `<main>` landmarks. **COMPLETED**

**Progress:** 3 of 4 criteria met (75% complete)

---

## Timeline

| Phase | Duration | Status | Completed Date |
|-------|----------|--------|----------------|
| Phase 1: Global Fixes | 1-2 hours | ✅ Complete | 2025-01-03 |
| Phase 2: Feedback Form | 3-4 hours | ✅ Complete | 2025-01-03 |
| Phase 3: Flashcard | 2-3 hours | ⚠️ Pending | - |
| **Total** | **~1 Day** | **75% Complete** | |

## Progress Summary

### Completed ✅
- Skip to content link implemented
- HTML lang attribute verified
- Main landmark regions added
- Feedback form labels and ARIA attributes
- Error message associations with inputs
- Automated accessibility tests (jest-axe)
- Test infrastructure setup

### Remaining ⚠️
- Phase 3: Flashcard keyboard accessibility
- Manual keyboard navigation testing
- Manual screen reader testing

### Next Steps
1. Implement keyboard flip support for Flashcard component
2. Add focus indicators to Flashcard
3. Perform manual accessibility testing
4. Final verification and documentation

